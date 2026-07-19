# Agentic Hire - AI Recruitment Frontend 🚀

A modern, responsive interface for the Agentic Hire system. Built with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**. This application serves as the control center for HR managers to upload resumes, define job contexts, and view AI-driven candidate evaluations.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-v16-black.svg)

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

## ✨ Key Features

- **🏠 Marketing Landing Page:** Public-facing homepage (`/`) with product overview, agent pipeline breakdown, and CTAs into the dashboard.
- **🤖 AI-Powered Analysis:** Interaction with Python Multi-Agent backend (Agno/Langfuse) from the dashboard (`/dashboard`).
- **📂 Smart Upload:** Drag & drop interface for PDF/DOCX resumes.
- **⚡ Real-time Updates:** Live polling system to track agent processing status.
- **🌐 Bilingual & RTL:** Full English/Hebrew language toggle with automatic RTL layout mirroring (`app/i18n/`).
- **🎨 Modern UI/UX:** Clean SaaS-like design using Tailwind CSS and Lucide Icons.
- **📊 Detailed Insights:** Interactive modals showing strengths, weaknesses, and match scores.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios / Fetch API
- **Deployment:** Vercel

## ⚙️ Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- Node.js 20+ (Required for Next.js 16)
- npm / yarn / pnpm

### 2. Installation

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### 3. Environment Variables (Critical 🔑)

Create a `.env.local` file in the root of the `frontend` directory.
You must define the backend URL so the **Next.js Server** knows where to forward API requests.

```bash
# .env.local

# Local Development (if Backend is running locally)
BACKEND_API_URL=http://localhost:8000

# Production (Railway URL)
# BACKEND_API_URL=https://your-backend-production.up.railway.app
```

**Note:** We use `BACKEND_API_URL` (server-side) because we use Next.js API Routes as a proxy to avoid CORS issues and hide the backend topology.

---

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🏗️ Project Structure

```bash
frontend/
├── app/
│   ├── api/          # Next.js API Routes (Proxy to Python Backend)
│   ├── i18n/          # Language context + English/Hebrew translations
│   ├── dashboard/    # Dashboard: upload, live queue, results table
│   │   └── page.tsx
│   ├── page.tsx      # Public marketing landing page
│   ├── layout.tsx    # Root layout and metadata
│   └── globals.css   # Tailwind directives
├── public/           # Static assets
└── ...
```

---

## 🚀 Deployment

This project is optimized for deployment on **Vercel**.

Push your code to GitHub.
Import the project in Vercel.

**Important:** Add the `BACKEND_API_URL` in Vercel's Environment Variables settings pointing to your live Railway backend.

Click **Deploy**.

---

