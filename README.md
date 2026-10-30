# AHEAD — AI-Powered Accessibility & Inclusion Platform

> **Feel ready. Be understood. Go independently.**

AHEAD is an AI-powered accessibility and inclusion platform that enables people to access everyday services, understand complicated information and communicate their needs independently.

## Features

### 📅 Book My Way
Discover college services, request appointments and communicate accessibility preferences before visiting.

### 📋 My Visit, Made Simple
Understand appointments, prepare for visits and confidently navigate unfamiliar procedures — powered by Gemini AI.

### 🗣️ My Voice
Communicate needs during real-world interactions using predefined messages, text-to-speech, speech-to-text and translation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Project Structure

```
ahead/
├── frontend/          # Next.js application
├── backend/           # Express.js API server
├── supabase/          # Database migrations and seed data
└── docs/              # Documentation
```

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Supabase account
- Google Gemini API key

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in values.

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local` and fill in values.

### 3. Database Setup

1. Create a Supabase project at https://supabase.com/dashboard
2. Run the migrations: apply files in `supabase/migrations/` in order
3. Run seed data: `supabase/seed.sql`

### 4. Run Development Servers

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000

---

## Deployment

- **Frontend**: Deploy to Vercel (connect repository, set environment variables)
- **Backend**: Deploy to Render (connect repository, set environment variables)

---

## Team

*Team details to be added.*

---

## License

Private — All rights reserved.
