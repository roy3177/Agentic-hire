import os
import logging
import json
from celery import Celery
from dotenv import load_dotenv
from app.agents import get_hr_team, triage_agent
from app.database import SessionLocal, AnalysisResult
from app.schemas import CandidateEvaluation, TriageVerdict

load_dotenv()

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Connection to Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("agentic_hire", broker=REDIS_URL)

celery_app.conf.update(
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)


# Note: The function receives resume_text instead of file_path
@celery_app.task(name="process_resume_analysis", bind=True, max_retries=3)
def process_resume_analysis(self, session_id: str, resume_text: str, job_description: str):
    logger.info(f"🚀 Started Task for Session ID: {session_id}")

    db = SessionLocal()

    try:
        # Check that the text is not empty
        if not resume_text:
            logger.error("Resume text is empty!")
            return {"error": "Resume text is empty"}

        # Update status in DB to Processing
        # (Skipped the complex loop - if the task got here, the record in DB probably exists.
        # If not, the Worker will fail and that's okay)
        result_record = db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).first()
        if result_record:
            result_record.status = "processing"
            db.commit()

        # 3. Triage gate: quickly screen out clearly irrelevant candidates
        # before running the full (slower) team
        triage_prompt = f"Job Description:\n{job_description}\n\nResume:\n{resume_text}"
        logger.info("Running triage check...")
        triage_result = triage_agent.run(triage_prompt).content

        final_json_dict = {}

        if isinstance(triage_result, TriageVerdict) and not triage_result.is_relevant:
            logger.info(f"🚫 Triage screened out candidate: {triage_result.reason}")
            final_json_dict = {
                "candidate_name": triage_result.candidate_name,
                "score": 0,
                "key_strengths": [],
                "concerns": [triage_result.reason],
                "reasoning": f"Automatically screened out during triage: {triage_result.reason}",
                "final_recommendation": "Reject",
            }
        else:
            # 4. Running the AI Team (only for plausibly relevant candidates)
            hr_team = get_hr_team(session_id=session_id)

            prompt = (
                f"Here is the Job Description:\n{job_description}\n\n"
                f"Here is the Candidate's Resume Content:\n{resume_text}\n\n"
                f"Analyze and provide the structured evaluation."
            )

            logger.info("Sending prompt to AI...")
            # Note: arun() was tried here to run resume_parser/job_analyst concurrently,
            # but the async transport hit repeated aiohttp disconnects in this environment
            # and ended up slower (114-179s) than the sync path (~70s). Reverted to sync.
            response = hr_team.run(prompt)
            ai_output = response.content

            # Parsing logic (same as you had)
            if isinstance(ai_output, CandidateEvaluation):
                final_json_dict = ai_output.model_dump()
            elif isinstance(ai_output, dict):
                final_json_dict = ai_output
            else:
                try:
                    final_json_dict = json.loads(str(ai_output))
                except:
                    final_json_dict = {"error": "Parsing failed", "raw_content": str(ai_output)}

        # 5. Saving to database
        # Refresh the connection to ensure there are no conflicts
        db.expire_all()
        result_record = db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).first()

        if result_record:
            result_record.status = "completed"
            result_record.result_metadata = final_json_dict

            # Creating backup text
            if "candidate_name" in final_json_dict:
                strengths = "\n".join([f"- {s}" for s in final_json_dict.get('key_strengths', [])])
                concerns = "\n".join([f"- {s}" for s in final_json_dict.get('concerns', [])])
                result_record.result_text = f"Score: {final_json_dict.get('score')}\nStrengths:\n{strengths}"
            else:
                result_record.result_text = str(ai_output)

            db.commit()
            logger.info(f"✅ SUCCESS: Saved data for {session_id}")

        return final_json_dict

    except Exception as exc:
        logger.error(f"❌ Error: {exc}")
        if 'db' in locals():
            db.rollback()
            try:
                err_record = db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).first()
                if err_record:
                    err_record.status = "failed"
                    err_record.result_text = str(exc)
                    db.commit()
            except:
                pass
        raise self.retry(exc=exc, countdown=60)
    finally:
        if 'db' in locals():
            db.close()