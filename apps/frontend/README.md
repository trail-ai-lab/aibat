# AIBAT Frontend

This is the frontend for AIBAT, built using **Next.js + ShadCN UI** with **Firebase authentication**.

## 🚀 Running the Frontend

```bash
pnpm install
pnpm dev
```

Runs on [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

- Uses Firebase Auth (email/password)
- Automatically protects routes in `/app/(protected)/`
- Stores tokens client-side and sends to FastAPI via `Authorization: Bearer <token>`

## 📁 Structure

- `app/`: App routes (e.g. `login`, `signup`, `dashboard`)
- `components/`: Shared UI components
- `lib/`: Auth context (`useAuth`), Firebase config
- `styles/`: Tailwind and ShadCN config

## 🧪 Todo

- Dashboard for generating/perturbing student responses
- Teacher flow for approving AI-generated grades
