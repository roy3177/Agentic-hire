import os
import base64
import logging
from dotenv import load_dotenv
from langfuse import Langfuse  # Import the Langfuse SDK

# Agno Imports
from agno.agent import Agent
from agno.team import Team
from agno.models.google import Gemini
from agno.db.postgres import PostgresDb

# Local Imports
from app.database import DATABASE_URL
from app.schemas import CandidateEvaluation, TriageVerdict

# OpenTelemetry / Tracing Imports
from openinference.instrumentation.agno import AgnoInstrumentor
from opentelemetry import trace as trace_api
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor

load_dotenv()

# --- Logger Setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Langfuse & Tracing Configuration ---
public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
secret_key = os.getenv("LANGFUSE_SECRET_KEY")
langfuse_host = os.getenv("LANGFUSE_BASE_URL")

if not public_key or not secret_key:
    logger.warning("⚠️ Warning: Langfuse keys missing. Tracing skipped.")
else:
    # 1. Create Auth Header for OTEL
    LANGFUSE_AUTH = base64.b64encode(
        f"{public_key}:{secret_key}".encode()
    ).decode()

    # 2. Configure OTEL Endpoint
    otel_endpoint = f"{langfuse_host.rstrip('/')}/api/public/otel"
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = otel_endpoint
    os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {LANGFUSE_AUTH}"

    # 3. Setup Tracer Provider
    tracer_provider = TracerProvider()
    tracer_provider.add_span_processor(SimpleSpanProcessor(OTLPSpanExporter()))
    trace_api.set_tracer_provider(tracer_provider=tracer_provider)

    # 4. Instrument Agno
    AgnoInstrumentor().instrument()
    logger.info(f"✅ Langfuse Tracing Enabled on host: {langfuse_host}")

# --- Langfuse Client Initialization ---
langfuse = Langfuse()


def get_prompt_content(prompt_name: str) -> str:
    """
    Strict function to fetch a prompt from Langfuse.
    NO FALLBACK: If fetching fails, this will raise an exception and stop the worker.
    This ensures we only ever use the managed prompts.
    """
    try:
        # Fetch the production version of the prompt
        prompt = langfuse.get_prompt(prompt_name)

        # Log success for verification
        logger.info(f"✨ Successfully loaded prompt '{prompt_name}' from Langfuse")

        # Compile returns the final string
        return prompt.compile()
    except Exception as e:
        # Critical error logging before crashing
        logger.critical(f"❌ CRITICAL ERROR: Failed to fetch prompt '{prompt_name}' from Langfuse.")
        logger.critical("Check your API Keys and Prompt Names in Langfuse Dashboard.")
        raise e  # Re-raise the exception to crash the task/worker


print("🚀 Starting Agent with Langfuse Tracking & Strict Prompt Management...")

# --- Database for Agent Sessions ---
agent_db = PostgresDb(
    db_url=DATABASE_URL,
    session_table="agent_sessions",
)

# --- Model Configuration ---
# Gemini 3 Flash: Very fast, cheap, and suitable for Scale work
model_fast = Gemini(id="gemini-3-flash-preview")

# Gemini 3.1 Pro: The smart model, with huge context window and high inference capabilities
# Note: gemini-3-pro-preview was deprecated by Google (404 NOT_FOUND) - upgraded to the successor
model_reasoning = Gemini(id="gemini-3.1-pro-preview")

# --- Agents Configuration ---

# 1. Resume Parser Agent
# This will crash immediately on startup if the prompt is missing
resume_instructions = get_prompt_content("resume-parser-instructions")

resume_parser = Agent(
    id="resume-parser",
    name="Resume Parser",
    role="Extract details from candidate resumes",
    model=model_fast,
    instructions=[resume_instructions],
)

# 2. Job Analyst Agent
# This will crash immediately on startup if the prompt is missing
job_instructions = get_prompt_content("job-analyst-instructions")

job_analyst = Agent(
    id="job-analyst",
    name="Job Analyst",
    role="Analyze job descriptions",
    model=model_fast,
    instructions=[job_instructions],
)

# 3. Triage Agent
# Fast, cheap gate that screens out clearly irrelevant candidates before the
# full (slower) team runs. This will crash immediately on startup if the prompt is missing
triage_instructions = get_prompt_content("triage-instructions")

triage_agent = Agent(
    id="triage-agent",
    name="Relevance Triage",
    role="Quickly screen whether a candidate is plausibly relevant to the job before a full evaluation runs",
    model=model_fast,
    instructions=[triage_instructions],
    output_schema=TriageVerdict,
)


# --- Team Configuration ---

def get_hr_team(session_id: str):
    """
    Creates the HR Team using a dynamic prompt for the Team Lead.
    """

    # Fetch Team Lead instructions dynamically
    # This will crash the specific task if the prompt cannot be fetched
    team_lead_instructions = get_prompt_content("hr-team-lead-instructions")

    return Team(
        name="HR Recruitment Team",
        members=[resume_parser, job_analyst],
        model=model_reasoning,
        db=agent_db,
        session_id=session_id,
        instructions=[team_lead_instructions],
        output_schema=CandidateEvaluation,
    )