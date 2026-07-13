# Agentic Hire - Autonomous AI Recruitment Platform 🚀

**Agentic Hire** is an advanced AI-powered recruitment copilot designed to automate the initial screening of candidates. It employs a **Multi-Agent System** to parse resumes, analyze job descriptions, and provide human-like reasoning for candidate suitability using **Google Gemini 3.0**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Architecture](https://img.shields.io/badge/architecture-monorepo-orange.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11+-009688?logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

**🌐 Live Demo:** [https://agentic-hire-psi.vercel.app/](https://agentic-hire-psi.vercel.app/)

## Table of Contents

- [Screenshots](#screenshots)
- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Quick Start Guide](#quick-start-guide)
- [Technology Stack](#technology-stack)
- [About This Project](#about-this-project)
- [Author](#author)
- [License](#license)

## Screenshots

<div align="center">
  <img src="assets/dashboard-screenshot.png" alt="Agentic Hire Dashboard - Job Context and Upload" width="800" />
  <p><em>Upload resumes against a job description and let the agent pipeline take over.</em></p>
  <br/>
  <img src="assets/analysis-result-screenshot.png" alt="Agentic Hire Analysis Report" width="800" />
  <p><em>Every candidate gets a scored, reasoned recommendation from the AI agent team.</em></p>
</div>

## 🏗️ Architecture Overview

This project is structured as a Monorepo containing two distinct microservices:

1.  **Frontend (`/frontend`):**
    -   Built with **Next.js 16**, TypeScript, and Tailwind CSS.
    -   Marketing landing page plus a responsive Dashboard for HR managers.
    -   Handles drag-and-drop uploads and real-time status polling.
    -   Bilingual (English/Hebrew) with full RTL support.

2.  **Backend (`/backend`):**
    -   Built with **FastAPI** (Python 3.11+).
    -   **Asynchronous Engine:** Uses **Celery & Redis** to offload heavy AI processing.
    -   **Agentic Framework:** Powered by **Agno** (formerly Phidata) to orchestrate a 4-agent pipeline (Triage → Parser → Analyst → Team Lead).
    -   **LLM:** Google Gemini 3.0 Pro/Flash.
    -   **Observability:** Full trace management and Prompt Engineering via **Langfuse**.

## 📂 Repository Structure

```bash
agentic-hire/
├── frontend/           # Next.js 16 Client Application
│   ├── app/            # App Router & Pages
│   ├── .env.local      # Frontend Environment Variables
│   └── README.md       # Specific Frontend Documentation
│
├── backend/            # Python AI Microservice
│   ├── app/            # FastAPI & Agent Logic
│   ├── .venv/          # Virtual Environment
│   ├── .env            # Backend Environment Variables
│   └── README.md       # Specific Backend Documentation
│
├── README.md           # You are here
└── .gitignore          # Global gitignore
```

## 🚀 Quick Start Guide

To run the full system locally, you need to start the Backend (API + Worker) and the Frontend.

### Prerequisites

- Node.js 20+
- Python 3.11+
- Redis and PostgreSQL from **Railway** (or local Docker for testing)

### Environment Configuration 🔑

Before running the system, you must create environment files for both the backend and frontend.

#### Backend Environment (`.env`)

Create a `.env` file in the `backend/` directory with Railway credentials for **Redis** and **PostgreSQL**:

```bash
# backend/.env

# Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Railway PostgreSQL (obtain from Railway dashboard)
DATABASE_URL=postgresql://postgres:your_password@your_host.proxy.rlwy.net:port/railway

# Railway Redis (obtain from Railway dashboard)
REDIS_URL=redis://default:your_password@your_host.proxy.rlwy.net:port

# Langfuse (Observability)
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Optional: Shared directory for file uploads
SHARED_DIR=./shared_data
```

#### Frontend Environment (`.env.local`)

Create a `.env.local` file in the `frontend/` directory:

```bash
# frontend/.env.local

# Backend API URL
BACKEND_API_URL=http://localhost:8000
```

> ⚠️ **Important:** For local testing, you can use Docker containers for Redis and PostgreSQL in the backend. However, for production or shared development, use the Railway credentials to ensure the backend connects to the proper infrastructure.

### 🐳 Option A: Run Everything with Docker (Recommended)

The whole stack (PostgreSQL, Redis, API, Celery Worker, and Frontend) runs from a single `docker-compose.yml` in `backend/`.

#### Step 1 — Prerequisites

Make sure **Docker Desktop** is installed and running:

```bash
docker --version
docker compose version
```

#### Step 2 — Create the `.env` file

Create `backend/.env` (see [Backend Environment](#backend-environment-env) above) with at least:

```bash
# backend/.env
GOOGLE_API_KEY=your_gemini_api_key_here
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

> `DATABASE_URL` and `REDIS_URL` do **not** need to be set here — `docker-compose.yml` wires them automatically to the internal `db` and `redis` containers.

#### Step 3 — Build and start all services

```bash
cd backend
docker compose up --build
```

Add `-d` to run in the background: `docker compose up --build -d`.

This builds and starts 5 containers:

| Service  | Description          | URL                          |
|----------|-----------------------|-------------------------------|
| `db`     | PostgreSQL             | localhost:5432                |
| `redis`  | Redis                  | localhost:6379                |
| `api`    | FastAPI backend        | http://localhost:8000/docs    |
| `worker` | Celery worker           | —                              |
| `web`    | Next.js frontend       | http://localhost:3000         |

The first build takes a few minutes (installing npm/Python dependencies); subsequent runs are much faster thanks to Docker's cache.

#### Step 4 — Verify it's running

- **Website:** [http://localhost:3000](http://localhost:3000)
- **API docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

If running in the background, tail the logs with:

```bash
docker compose logs -f
```

#### Step 5 — Stop the stack

```bash
docker compose down
```

To also wipe the database volume and start fresh next time:

```bash
docker compose down -v
```

### Option B: Run Manually (without Docker)

#### Step 1: Start the Backend

(See `backend/README.md` for full details)

```bash
cd backend
# 1. Install dependencies
uv sync  # or pip install -r requirements.txt

# 2. Run the API Server (Terminal A)
uv run python -m app.main

# 3. Run the Celery Worker (Terminal B)
uv run celery -A app.tasks.celery_app worker --loglevel=info
```

#### Step 2: Start the Frontend

(See `frontend/README.md` for full details)

```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Run the Development Server
npm run dev
```

Visit http://localhost:3000 to access the platform.

## 🛠️ Technology Stack

| Component      | Technology                                    |
|----------------|-----------------------------------------------|
| Frontend       | Next.js 16, TypeScript, Tailwind CSS, Lucide React |
| Backend API    | FastAPI, Uvicorn                              |
| AI Agents      | Agno (Phidata), Google Gemini 3.0            |
| Async Tasks    | Celery, Redis                                 |
| Database       | PostgreSQL, SQLAlchemy                        |
| Observability  | Langfuse (Tracing & Prompt Management)        |
| Deployment     | Vercel (Frontend), Railway (Backend)          |

## 📚 About This Project

This repository serves as the official codebase for the book **"The Backdoor to High-Tech"** (הדלת האחורית להייטק).

It demonstrates how to build production-grade AI systems, moving beyond simple scripts to full-stack, event-driven architectures.

Developed by **Elite Juniors**.

## Author

<div align="center">

<b>Roy Meoded</b><br>
Software Developer<br><br>

<a href="https://github.com/roy3177">
  <img src="https://img.shields.io/badge/GitHub-roy3177-181717?logo=github" alt="GitHub"/>
</a>
<a href="https://www.linkedin.com/in/roy-meoded">
  <img src="https://img.shields.io/badge/LinkedIn-Roy%20Meoded-0A66C2?logo=linkedin" alt="LinkedIn"/>
</a>
<a href="mailto:roymeoded2512@gmail.com">
  <img src="https://img.shields.io/badge/Email-contact-EA4335?logo=gmail&logoColor=white" alt="Email"/>
</a>

</div>

## License

This project is licensed under the [MIT License](LICENSE).

---

© 2026 Elite Juniors. All Rights Reserved.
