# Agentic Hire - Autonomous AI Recruitment Platform 🚀

**Agentic Hire** is an advanced AI-powered recruitment copilot designed to automate the initial screening of candidates. It employs a **Multi-Agent System** to parse resumes, analyze job descriptions, and provide human-like reasoning for candidate suitability using **Google Gemini 3.0**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Architecture](https://img.shields.io/badge/architecture-monorepo-orange.svg)

<div align="center">
  <img src="assets/agentic-hire-candidate.png" alt="Agentic Hire Dashboard" width="800" />
  <p><em>The Agentic Hire Dashboard - AI-powered candidate screening</em></p>
</div>

## 🏗️ Architecture Overview

This project is structured as a Monorepo containing two distinct microservices:

1.  **Frontend (`/frontend`):**
    -   Built with **Next.js 16**, TypeScript, and Tailwind CSS.
    -   Provides a responsive Dashboard for HR managers.
    -   Handles drag-and-drop uploads and real-time status polling.

2.  **Backend (`/backend`):**
    -   Built with **FastAPI** (Python 3.11+).
    -   **Asynchronous Engine:** Uses **Celery & Redis** to offload heavy AI processing.
    -   **Agentic Framework:** Powered by **Agno** (formerly Phidata) to orchestrate AI teams.
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

### Step 1: Start the Backend

(See `backend/README.md` for full details)

```bash
cd backend
# 1. Install dependencies
uv sync  # or pip install -r requirements.txt

# 2. Run the API Server (Terminal A)
uv run python -m app.main

# 3. Run the Celery Worker (Terminal B)
uv run celery -A app.celery_worker.celery_app worker --loglevel=info
```

### Step 2: Start the Frontend

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

---

© 2026 Elite Juniors. All Rights Reserved.
