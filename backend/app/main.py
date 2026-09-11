from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from typing import Optional
import os
import uuid
import logging
import uvicorn

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header, Depends
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import init_db, SessionLocal, AnalysisResult
from app.extraction import count_pages, extract_text_from_content, MAX_RESUME_PAGES, MAX_FILE_SIZE_BYTES
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

# --- Rate limiting ---
# Backed by the same Redis instance already used as the Celery broker (see
# app/tasks.py) so the limit is shared correctly across every API process --
# an in-memory limiter would reset per-process and not actually coordinate
# across multiple Uvicorn/Railway instances.
# Caveat: get_remote_address reads request.client.host, which is only the
# *real* client IP if the ASGI server is told to trust the platform's
# reverse-proxy forwarded headers (e.g. `uvicorn --proxy-headers`). Without
# that, every request behind Railway's proxy can appear to share one IP,
# making the limit effectively global rather than per-visitor -- still a
# real cap on total abuse, just not perfectly per-user in that setup.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
limiter = Limiter(key_func=get_remote_address, storage_uri=REDIS_URL)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.info("")
    logger.info(f"📨 {request.method} {request.url.path} — 🚫 EDGE CASE: rate limit exceeded")
    logger.info("   ↩ 429 Too Many Requests")
    # Matches the {"detail": "..."} shape FastAPI's own HTTPException uses,
    # so the frontend's existing error-popup handling (see
    # frontend/app/api/analyze/route.ts) shows this cleanly too.
    return JSONResponse(
        status_code=429,
        content={"detail": "⏳ Too many requests. Please wait a minute and try again."},
    )


# --- Internal API secret ---
# Only the Next.js server (frontend/app/api/*/route.ts -- never the browser
# bundle) knows this value, sent as a header on every proxied request. This
# doesn't gate real end users at all (the site stays login-free) -- it only
# stops someone calling this API directly (curl/Postman/a script) bypassing
# the frontend entirely.
#
# Fails OPEN (unprotected, with a loud warning) if the env var isn't set at
# all, rather than rejecting every request outright -- so local dev/testing
# without it configured keeps working exactly as it did before this change.
# In production this variable MUST be set (Railway env vars) for this to
# actually protect anything; an unset var there is a silent no-op, not an
# error, so it's easy to forget -- hence the startup warning below.
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")

if not INTERNAL_API_SECRET:
    logger.warning(
        "⚠️ INTERNAL_API_SECRET is not set — /analyze and /status are "
        "UNPROTECTED right now. Fine for local dev, but this MUST be set "
        "in production for this check to do anything."
    )


async def verify_internal_secret(request: Request, x_internal_api_key: Optional[str] = Header(default=None)):
    if INTERNAL_API_SECRET and x_internal_api_key != INTERNAL_API_SECRET:
        logger.info("")
        logger.info(f"📨 {request.method} {request.url.path} — 🚫 EDGE CASE: missing/invalid X-Internal-Api-Key")
        logger.info("   ↩ 401 Unauthorized")
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.on_event("startup")
def startup():
    init_db()


@app.post("/analyze", dependencies=[Depends(verify_internal_secret)])
@limiter.limit("10/minute")
async def start_analysis(request: Request, job_description: str = Form(...), file: UploadFile = File(...)):
    session_id = str(uuid.uuid4())
    logger.info("")
    logger.info(f"📨 POST /analyze — session {session_id} — file={file.filename!r}")

    # 0a. Reject oversized uploads outright -- before anything else touches
    # the file (page-count parsing, text extraction, and especially the OCR
    # fallback, which would otherwise ship a huge payload to Gemini).
    # Read once here and reuse everywhere below -- no more re-reading via a
    # second file.read() (which needed a file.seek(0) to undo the first
    # read) now that extraction is a plain sync function over these bytes,
    # not something that reads the UploadFile itself.
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        logger.info(f"   🚫 EDGE CASE: file too large ({len(content)} bytes, limit {MAX_FILE_SIZE_BYTES})")
        logger.info("   ↩ 400 Bad Request")
        raise HTTPException(
            status_code=400,
            detail=f"⛔ REJECTED: File too large ({len(content) / 1_048_576:.1f} MB). Max size is {MAX_FILE_SIZE_BYTES // 1_048_576} MB.",
        )

    # 0b. Reject multi-page resumes outright, before spending any effort on
    # extraction/OCR. A resume should fit on one page -- see count_pages()
    # for what's actually reliable per file type (PDF: exact; DOCX:
    # best-effort; TXT: unenforced).
    page_count = count_pages(file.filename, content)
    if page_count is not None and page_count > MAX_RESUME_PAGES:
        logger.info(f"   🚫 EDGE CASE: {page_count} pages (limit {MAX_RESUME_PAGES})")
        logger.info("   ↩ 400 Bad Request")
        raise HTTPException(
            status_code=400,
            detail=(
                f"⛔ REJECTED: Your resume has {page_count} pages. "
                "A professional resume MUST fit on a SINGLE page. "
                "Please condense it to one page and try again."
            ),
        )

    # 1. Extract the text in memory (without saving a file)
    resume_text = extract_text_from_content(file.filename, content)

    # 1b. OCR fallback: the PDF may be a scanned/photographed resume with no
    # extractable text layer -- hand the raw bytes to Gemini directly instead
    # of failing outright. Only worth trying for PDFs (scanned .docx/.txt
    # don't really occur in practice).
    if not resume_text.strip() and file.filename.lower().endswith(".pdf"):
        logger.info("   🔎 EDGE CASE: no embedded text layer — falling back to OCR via Gemini")
        try:
            from agno.media import File as AgnoFile
            from app.agents import resume_ocr_agent

            ocr_file = AgnoFile(content=content, mime_type="application/pdf")
            ocr_result = resume_ocr_agent.run("Transcribe this resume.", files=[ocr_file])
            resume_text = str(ocr_result.content or "").strip()
            logger.info("   ✅ OCR fallback succeeded")
        except Exception as e:
            logger.error(f"   ❌ OCR fallback failed: {e}")

    if not resume_text.strip():
        logger.info("   ↩ 400 Bad Request — could not extract any text from file")
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
        logger.error(f"   ❌ DB Error: {e}")
        logger.info("   ↩ 200 OK — {\"error\": \"Database error\"}")
        return {"error": "Database error"}
    finally:
        db.close()

    # 3. Send the text (not the file) to Worker
    try:
        # Sending the text as an argument
        process_resume_analysis.delay(session_id, resume_text, job_description)
        logger.info("   → queued to Celery")
    except Exception as e:
        logger.error(f"   ❌ Celery Error: {e}")
        logger.info("   ↩ 200 OK — {\"error\": \"Failed to queue task\"}")
        return {"error": "Failed to queue task"}

    logger.info("   ↩ 200 OK — status=processing (see the WORKER terminal for pipeline progress)")
    return {"session_id": session_id, "status": "processing"}


@app.get("/status/{session_id}", dependencies=[Depends(verify_internal_secret)])
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