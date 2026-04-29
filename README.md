# GrowFlow

A wellness companion that helps people build small, sustainable habits — and
connects them with mental-health professionals when they want one.
Final-year project, Spring 2026.

> Grow within, flow beyond.

---

## What's inside

GrowFlow is two products in one codebase:

**For users (patients)**
- Habit tracker with streaks
- Daily to-do list and goals
- Bilingual (English / Urdu) growth journal with AI-generated reflections
- Pomodoro focus timer
- 30/60/90-day mood, focus, and habit trends
- AI Coach chat tuned to the user's recent metrics
- Calendar heat-map of activity
- Care: browse and book appointments with verified psychiatrists / psychologists
- Crisis support hotlines, always one click away
- 17 unique 3D ambient scenes (one per route) and a holographic-glass UI

**For mental-health professionals**
- Single sign-up flow with a role selector
- Practice dashboard: pending requests, confirmed sessions, history
- Confirm / decline / reschedule / complete with notes back to the patient
- Editable public profile (credentials, languages, fee, bio)
- Verification badge once an admin reviews their credentials

---

## Tech stack

| Layer        | Choice                                                            |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | Next.js 15 (App Router, Turbopack, React 19, TypeScript)          |
| Styling      | Tailwind CSS, custom holo-glass design tokens, Framer Motion      |
| 3D           | Three.js (raw, no @react-three/fiber)                             |
| Backend      | NestJS 11 (TypeScript, URI-versioned API at `/api/v1/*`)          |
| ORM          | TypeORM with Postgres 16                                          |
| Auth         | Passport JWT, role-based (patient / psychiatrist / psychologist)  |
| AI           | Google Gemini (1.5 / 2.0 flash) via `@google/generative-ai`       |
| Validation   | class-validator + class-transformer + global ValidationPipe       |
| Docs         | Swagger UI at `/docs`                                             |
| Container    | Docker + docker-compose                                           |

---

## Architecture

```
┌────────────────┐         ┌────────────────────┐         ┌──────────────┐
│   Next.js 15   │  HTTPS  │   NestJS 11 API    │  TCP    │  Postgres 16 │
│   :4000        │────────▶│   :3000  /api/v1   │────────▶│  :5432       │
│                │         │                    │         │              │
│  - App Router  │         │  - JWT + RBAC      │         │  - users     │
│  - Three.js    │         │  - TypeORM         │         │  - tasks     │
│  - Tailwind    │         │  - Throttler       │         │  - habits    │
│  - PWA         │         │  - Helmet, CORS    │         │  - journals  │
└────────────────┘         │  - Class-validator │         │  - goals     │
                           └─────────┬──────────┘         │  - appoint.. │
                                     │                    │  - ...       │
                                     ▼                    └──────────────┘
                           ┌────────────────────┐
                           │  Gemini API        │
                           │  generativelang... │
                           └────────────────────┘
```

Three independent surfaces, all behind URI-versioned `/api/v1/*`:

- `/auth/*`, `/users/*` — registration, sign-in, profile
- `/tasks`, `/habits`, `/user-habits`, `/habit-logs`, `/goals`, `/journal` — the
  wellness suite
- `/appointments`, `/professionals`, `/admin` — the Care + booking system
- `/ai/coach`, `/dashboard/summary`, `/dashboard/analyze-journal` — Gemini
  integrations with deterministic fallbacks

---

## Quick start with Docker (recommended)

```bash
# 1. Copy and edit env
cp .env.compose.example .env.compose
# fill in JWT_SECRET, optionally GEMINI_API_KEY and ADMIN_TOKEN

# 2. Build and run
docker compose --env-file .env.compose up --build
```

Open http://localhost:4000.
Backend Swagger UI: http://localhost:3000/api/v1 (API root) and
`/docs` for the interactive reference.

---

## Manual start (for development)

Two terminals.

**Terminal 1 — backend**
```bash
cd backend
cp .env.example .env
# edit .env — set JWT_SECRET, POSTGRES_*, optionally GEMINI_API_KEY
npm install
npm run start:dev
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
```

App at http://localhost:4000, API at http://localhost:3000.

---

## Environment variables

### Backend (`backend/.env`)

| Variable           | Required          | Default                | Notes                                                              |
| ------------------ | ----------------- | ---------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`         | no                | `development`          | `development` / `production` / `test`                              |
| `PORT`             | no                | `3000`                 |                                                                    |
| `POSTGRES_HOST`    | yes               | —                      |                                                                    |
| `POSTGRES_PORT`    | yes               | —                      |                                                                    |
| `POSTGRES_USER`    | yes               | —                      |                                                                    |
| `POSTGRES_PASSWORD`| yes               | —                      |                                                                    |
| `POSTGRES_DB`      | yes               | —                      |                                                                    |
| `JWT_SECRET`       | yes (>= 32 chars) | —                      | `openssl rand -hex 32`                                             |
| `JWT_EXPIRES_IN`   | no                | `1d`                   |                                                                    |
| `CORS_ORIGINS`     | no                | `http://localhost:4000`| Comma-separated origins                                            |
| `GEMINI_API_KEY`   | no                | —                      | If unset, AI features fall back to canned responses                |
| `GEMINI_MODEL`     | no                | `gemini-1.5-flash`     | Use `gemini-2.0-flash` for higher free-tier quota                  |
| `ADMIN_TOKEN`      | no (>= 16 chars)  | —                      | If unset, admin endpoints return 401                               |
| `SWAGGER_ENABLED`  | no                | `true`                 | Set `false` to disable `/docs` in prod                             |

### Frontend (`frontend/.env.local`, optional)

| Variable                | Default                 | Notes                              |
| ----------------------- | ----------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL`   | `http://localhost:3000` | Where the browser hits the API     |

---

## Project layout

```
final-year-project/
├── backend/                  NestJS API
│   └── src/
│       ├── auth/             JWT + Passport, login/register
│       ├── users/            User entity (role + professional fields)
│       ├── tasks/            To-do list
│       ├── habits/           Habit catalog
│       ├── user-habits/      Habits assigned to users
│       ├── habit-logs/       Daily habit completions + mood
│       ├── goals/            Long-term goals
│       ├── journal/          Growth-journal entries
│       ├── appointments/     Appointment requests + status flow
│       ├── professionals/    Public listing of psychiatrists/psychologists
│       ├── admin/            Admin endpoints (token-guarded)
│       ├── ai/               Gemini wrapper + AI Coach
│       ├── dashboard.controller.ts
│       └── common/           Validation, filters, interceptors
│
├── frontend/                 Next.js 15 App
│   └── src/app/
│       ├── (public)
│       │   ├── page.tsx      Landing
│       │   ├── login/
│       │   ├── signup/
│       │   ├── forgot-password/
│       │   ├── crisis/       Always-public crisis hotlines
│       │   └── not-found.tsx
│       ├── dashboard/        Authed shell
│       │   ├── (patient surfaces)
│       │   ├── care/         Browse + book professionals
│       │   ├── appointments/ My appointments
│       │   └── provider/     Professional dashboard + profile
│       ├── components/       Sidebar, command palette, scenes
│       ├── actions/          Typed API clients (axios)
│       └── lib/              Auth helpers, role helpers, axios setup
│
├── docker-compose.yml        Postgres + backend + frontend
└── .env.compose.example      Compose env template
```

---

## API conventions

All endpoints are URI-versioned: `/api/v1/<resource>/...`.

JWT bearer auth on most endpoints — pass `Authorization: Bearer <token>`.

Login is rate-limited to 5/min/IP, register to 3/min/IP, the global ceiling is
generous (60 000/min in dev, 6 000/min in production) so dashboard fan-outs +
React StrictMode don't ever hit the wall.

Errors are wrapped in a consistent envelope by `HttpExceptionFilter`:

```json
{
  "statusCode": 409,
  "message": "An account with that email already exists",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-04-28T08:32:37.123Z"
}
```

---

## Admin operations

Admin endpoints are gated by a header token, not a JWT. Set `ADMIN_TOKEN` in
your backend env, then:

```bash
# List all professional accounts + their verification state
curl -H "x-admin-token: $ADMIN_TOKEN" \
     http://localhost:3000/api/v1/admin/professionals

# Mark professional 17 as verified
curl -X PATCH \
     -H "x-admin-token: $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"verified":true}' \
     http://localhost:3000/api/v1/admin/professionals/17/verify
```

Verified professionals get a badge in `/dashboard/care`.

---

## What's intentionally not here

- **Database migrations.** Dev uses TypeORM `synchronize: true` for speed.
  Generate a baseline before deploying to production.
- **Email delivery.** `forgot-password` is a UI stub; appointment status
  changes don't currently email. Wire `nodemailer` + SMTP env vars to enable.
- **Real-time.** No websockets. Patients / providers refresh to see status
  changes. A 30-second poll is the cheap upgrade.
- **Payments.** Appointments are free for now; `feeText` is informational.

---

## Acknowledgements

- [Three.js](https://threejs.org) — every page's 3D scene
- [Lucide](https://lucide.dev) — icon set
- [Recharts](https://recharts.org) — dashboard charts
- [Google Gemini](https://ai.google.dev) — coach, journal reflections,
  dashboard recommendations

---

## License

UNLICENSED — final-year academic project.
