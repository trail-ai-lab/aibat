# AIBAT 

This project is a multilingual, model-switchable, AI-based assessment platform for generating, perturbing, and evaluating student responses. It is designed to support research on language-aware grading models with a focus on scalability, flexibility, and low latency.

## 🧱 Monorepo Structure

```
apps/
├── frontend/   # Next.js + ShadCN UI app (Firebase Auth, Topic UI, Protected Pages)
├── backend/    # FastAPI backend with Firebase token auth and Groq/OpenAI model integration
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, ShadCN UI, Firebase Auth
- **Backend:** FastAPI, Firebase Admin SDK, Groq/OpenAI integration
- **Infra (planned):** GCP (Cloud Run, Firestore, Artifact Registry, Secrets Manager)
- **Model Orchestration (planned):** LangGraph / LangChain

## 🚀 Getting Started

Clone the repo and install dependencies:

```bash
git clone https://github.com/anuragmaravi/aibat-monorepo.git
cd aibat-monorepo
```

### Frontend

```bash
cd apps/frontend
pnpm install
pnpm dev
```

### Backend

```bash
cd apps/backend
poetry install
poetry run uvicorn main:app --reload --port 8000
```

### Environment Setup

See `apps/frontend/.env` and `apps/backend/.env` for necessary variables like Firebase keys and API tokens.

## 📦 Features

- Firebase login/signup and route protection
- Topic-based AI generation & grading
- Model switching and perturbation generation
- Backend auth validation using Firebase Admin
- Groq / OpenAI integration for real inference

## 🧪 Future Plans

- Teacher dashboard for adding & evaluating student responses
- GCP deployment with Firestore/BigQuery
- Role-based access control (Admin/Teacher/Student)
- Model comparison + evaluation UI
