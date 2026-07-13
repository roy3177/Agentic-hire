# Agentic Hire - AI Recruitment Backend 🧠

The intelligent core of the Agentic Hire platform. This is a high-performance, asynchronous microservice built with **FastAPI**, **Agno (Agent Framework)**, and **Google Gemini Models**. It orchestrates a team of AI agents to analyze resumes against job descriptions with human-like reasoning.

![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg)
![Celery](https://img.shields.io/badge/Celery-Async-green.svg)
![Langfuse](https://img.shields.io/badge/Langfuse-Observability-red.svg)

## Table of Contents

- [Key Capabilities](#key-capabilities)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Running the System](#running-the-system)
- [API Documentation](#api-documentation)
- [Deployment (Railway)](#deployment-railway)

## ⚡ Key Capabilities

- **🕵️ Multi-Agent Architecture:** Orchestrated by **Agno**, a 4-agent pipeline — **Triage Agent** (fast relevance gate), **Resume Parser**, **Job Analyst**, and the **HR Team Lead** (final synthesis).
- **🚀 Asynchronous Processing:** Uses **Celery & Redis** to handle heavy AI tasks in the background without blocking the API.
- **🧬 Structured Outputs:** Guarantees strict JSON responses from LLMs using Pydantic schemas.
- **🔭 Observability & Control:** Integrated with **Langfuse** for trace management and **Strict Prompt Engineering** (managed remotely).
- **🐘 Robust Storage:** Uses **PostgreSQL** for persistent session storage and result caching.

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **LLM:** Google Gemini 3.0 Flash / Pro (Preview)
- **Agents:** Agno (formerly Phidata)
- **Task Queue:** Celery + Redis
- **Database:** PostgreSQL (SQLAlchemy)
- **Prompt Management:** Langfuse
- **Package Manager:** uv (recommended) / pip

## ⚙️ Setup & Installation

### 1. Prerequisites
- Python 3.11+
- PostgreSQL (Local or Cloud)
- Redis (Local or Cloud)
- `uv` (Fast Python package installer) - *Optional but recommended*

### 2. Installation

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies using uv (or pip):

```bash
# Using uv (Recommended)
uv sync

# OR using standard pip
pip install -r requirements.txt
```

### 3. Environment Variables (Critical 🔑)

Create a `.env` file in the backend directory. You must provide keys for Google Gemini, Database, Redis, and Langfuse.

```bash
# .env

# --- LLM Provider ---
GOOGLE_API_KEY=your_gemini_api_key

# --- Infrastructure ---
# Format: postgresql://user:pass@host:5432/dbname
DATABASE_URL=postgresql://postgres:password@localhost:5432/agentic_db

# Format: redis://host:port/0
REDIS_URL=redis://localhost:6379/0

# --- Langfuse (Observability & Prompt Management) ---
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

> ⚠️ **Strict Mode Note:** This backend is configured to Fail Fast if Langfuse prompts are missing. Ensure your prompts (resume-parser-instructions, etc.) are published in Langfuse before running.

## 🏃‍♂️ Running the System

Since this is an asynchronous system, you need to run two processes simultaneously (in separate terminal windows).

### Terminal 1: The API Server

Starts the REST API (FastAPI) to accept requests.

```bash
# Using uv
uv run python -m app.main

# OR using standard python
python -m app.main
```

Server will start at `http://localhost:8000`

### Terminal 2: The Worker

Starts the Celery worker to process the AI tasks.

```bash
# Linux/Mac
uv run celery -A app.tasks.celery_app worker --loglevel=info

# Windows
uv run celery -A app.tasks.celery_app worker --pool=solo --loglevel=info
```

## 📚 API Documentation

Once the API server is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## 🚢 Deployment (Railway)

This project includes a Procfile and Dockerfile optimized for Railway.

**Service 1 (Web):** Deploys the FastAPI server.

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Service 2 (Worker):** Deploys the Celery Worker.

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

Ensure both services share the same `REDIS_URL` and `DATABASE_URL` environment variables.

## 🤝 Contribution

Developed by **Elite Juniors**.