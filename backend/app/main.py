from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import uuid
import logging
import uvicorn
import io
import pypdf
import docx

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from app.database import init_db, SessionLocal, AnalysisResult
from app.tasks import process_resume_analysis

load_dotenv()

# Logger configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API")

app = FastAPI(title="AgenticHire API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "https://agentic-hire-lf9py5dca-elite-juniors-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# --- Extraction functions inside the API ---
async def extract_text_from_upload(file: UploadFile) -> tuple[str, bytes]:
    # Read the file into memory (Bytes)
    content = await file.read()
    file_obj = io.BytesIO(content)
    text = ""

    try:
        filename = file.filename.lower()
        if filename.endswith('.pdf'):
            reader = pypdf.PdfReader(file_obj)
            for page in reader.pages:
                text += page.extract_text() + "\n"

        elif filename.endswith('.docx'):
            doc = docx.Document(file_obj)
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif filename.endswith('.txt'):
            text = content.decode('utf-8')

    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        return "", content

    return text, content


# ---------------------------------

@app.post("/analyze")
async def start_analysis(job_description: str = Form(...), file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    logger.info(f"🔵 NEW REQUEST: {session_id}")

    # 1. Extract the text in memory (without saving a file)
    resume_text, raw_bytes = await extract_text_from_upload(file)

    # 1b. OCR fallback: the PDF may be a scanned/photographed resume with no
    # extractable text layer -- hand the raw bytes to Gemini directly instead
    # of failing outright. Only worth trying for PDFs (scanned .docx/.txt
    # don't really occur in practice).
    if not resume_text.strip() and file.filename.lower().endswith(".pdf"):
        logger.info(f"🔎 No embedded text found for {session_id} — falling back to OCR via Gemini")
        try:
            from agno.media import File as AgnoFile
            from app.agents import resume_ocr_agent

            ocr_file = AgnoFile(content=raw_bytes, mime_type="application/pdf")
            ocr_result = resume_ocr_agent.run("Transcribe this resume.", files=[ocr_file])
            resume_text = str(ocr_result.content or "").strip()
        except Exception as e:
            logger.error(f"OCR fallback failed: {e}")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    # 2. Save to DB
    db = SessionLocal()
    try:
        new_analysis = AnalysisResult(
            session_id=session_id,
            status="pending",
            job_description=job_description
        )
        db.add(new_analysis)
        db.commit()
    except Exception as e:
        logger.error(f"DB Error: {e}")
        return {"error": "Database error"}
    finally:
        db.close()

    # 3. Send the text (not the file) to Worker
    try:
        # Sending the text as an argument
        process_resume_analysis.delay(session_id, resume_text, job_description)
        logger.info("🟢 Task sent to Celery")
    except Exception as e:
        logger.error(f"Celery Error: {e}")
        return {"error": "Failed to queue task"}

    return {"session_id": session_id, "status": "processing"}


@app.get("/status/{session_id}")
async def get_status(session_id: str):
    db = SessionLocal()
    try:
        result = db.query(AnalysisResult).filter(AnalysisResult.session_id == session_id).first()
        if not result:
            return {"error": "Not found"}

        return {
            "status": result.status,
            "result": result.result_metadata,
            "formatted_text": result.result_text
        }
    finally:
        db.close()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)