# AIBAT Backend

This is the backend service for AIBAT, built with **FastAPI** and secured with **Firebase Admin** for token-based auth.

## 🔧 Running the Backend

```bash
poetry install
poetry run uvicorn main:app --reload --port 8000
```

## 🔐 Auth

- Uses Firebase Admin SDK
- Verifies token from frontend in `Authorization: Bearer <token>`
- Protects all `/api/v1` endpoints

## 🧱 Structure

```
app/
├── api/v1/endpoints/  # Routes for topics, auth, grading, etc.
├── core/              # Firebase auth logic
├── services/          # (planned) model logic and orchestration
├── models/            # (planned) Pydantic schemas and DB models
```

## 📦 API Endpoints

- `GET /api/v1/topics/` – returns list of topic names
- `GET /api/v1/auth/protected/` – verifies token

## 🔐 Secrets

Place your Firebase service account key in `.env` as a JSON string:

```
GOOGLE_APPLICATION_CREDENTIALS_JSON='{ ... }'
GROQ_API_KEY=sk-...
OPENAI_API_KEY=sk-...
```

## 🧪 Todo

- Add topic-specific generation and grading endpoints
- LangGraph orchestration for model chaining
