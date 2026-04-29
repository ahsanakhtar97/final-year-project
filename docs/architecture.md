# GrowFlow — Architecture overview

A short tour of how the system fits together. For the data model see
[`erd.md`](./erd.md).

## High-level diagram

```
┌────────────────┐   HTTPS   ┌──────────────────────┐   TCP   ┌──────────────┐
│  Next.js 15    │──────────▶│   NestJS 11 API      │────────▶│ Postgres 16  │
│  :4000         │           │   /api/v1/*          │         │              │
│                │           │                      │         └──────────────┘
│  - App Router  │           │   ▼                  │
│  - Three.js    │           │ ┌─────────────────┐  │         ┌──────────────┐
│  - Tailwind    │           │ │ Gemini SDK      │──┼────────▶│ Google AI    │
└────────────────┘           │ │ (server-side)   │  │  HTTPS  │ generativel… │
                             │ └─────────────────┘  │         └──────────────┘
                             │                      │
                             │  guards: JWT, Admin  │
                             │  pipes: ValidationP. │
                             │  filters: HttpExc... │
                             └──────────────────────┘
```

Three independent layers, classic three-tier:

1. **Frontend** is purely a client. It does not call Gemini directly. It
   never sees professional bios in raw form — the API filters first.
2. **Backend** owns business rules, validation, and the only path to the
   database. AI calls also happen here; the API key never reaches the
   browser.
3. **Database** is single-source-of-truth. TypeORM entities map 1:1 with
   tables (see ERD).

## Auth flow

```
 user                  frontend             backend                  db
  │ submit form         │                     │                       │
  ├────────────────────▶│ POST /auth/login    │                       │
  │                     ├────────────────────▶│ findOneByEmail        │
  │                     │                     ├──────────────────────▶│
  │                     │                     │   user row            │
  │                     │                     │◀──────────────────────┤
  │                     │                     │ bcrypt.compare()      │
  │                     │                     │ jwtSign({sub,role})   │
  │                     │ 200 {accessToken,…} │                       │
  │                     │◀────────────────────┤                       │
  │ ⟶ store token       │                     │                       │
  │ ⟶ route by role     │                     │                       │
```

JWT carries `{ sub, name, email, role }`. Subsequent requests include
`Authorization: Bearer <jwt>` and `JwtStrategy` decodes it onto
`req.user`. Role-based gating happens both client-side (sidebar items
+ layout redirect) and server-side (controller permission checks).

## Three independent surfaces

```
              ┌───────────────────────────────────────┐
              │  AUTHED API ROUTES                    │
              │                                       │
   wellness ──┤  /api/v1/tasks                        │
              │  /api/v1/habits, /user-habits,        │
              │   /habit-logs, /journal, /goals       │
              │  /api/v1/dashboard/summary            │
              │                                       │
       care ──┤  /api/v1/appointments                 │
              │  /api/v1/professionals                │
              │                                       │
         ai ──┤  /api/v1/ai/coach                     │
              │  /api/v1/dashboard/analyze-journal    │
              │                                       │
              ├───────────────────────────────────────┤
              │  ADMIN (header-token guarded)         │
              │  /api/v1/admin/professionals          │
              │  /api/v1/admin/professionals/:id/…    │
              └───────────────────────────────────────┘
```

The three surfaces are intentionally separated so a future change to
one (say, swapping Gemini for OpenAI, or adding payments to /care) doesn't
ripple into the others.

## Frontend module map

| Folder               | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `app/(public)/*`     | Landing, login, signup, forgot-password, crisis, 404 |
| `app/dashboard/*`    | Authed shell + wellness suite                        |
| `app/dashboard/care/*` and `appointments/*`     | Patient-side Care flows               |
| `app/dashboard/provider/*`                       | Provider dashboard + profile         |
| `app/components/*`   | Sidebar, command palette, AmbientScene, onboarding   |
| `app/actions/*`      | Typed axios wrappers for each API surface            |
| `lib/`               | axios setup, JWT helpers, role helpers               |

## Resilience patterns

- **AI fallback chain.** Gemini call → if quota exhausted or network
  fails, the journal returns a neutral "saved without analysis" message
  rather than mislabelling the entry. The coach falls back to a
  deterministic rule-based reply.
- **Rate limiter.** Per-IP global ceiling (60 000/min in dev,
  6 000/min in prod) plus stricter per-route caps on auth (login 5/min,
  register 3/min) via `@Throttle()` decorators.
- **Cleanup on unmount.** The 3D AmbientScene disposes geometries,
  materials, and the renderer on every route change so navigating doesn't
  leak GPU memory.
- **Error envelope.** Every backend exception is shaped by
  `HttpExceptionFilter` into a consistent `{ statusCode, message, path,
  timestamp }` JSON, so the frontend has one error shape to handle.

## Decisions worth knowing

| Decision                 | Why                                             |
| ------------------------ | ----------------------------------------------- |
| TypeORM `synchronize:true` in dev | Fast iteration. Replace with migrations before deploying. |
| URI versioning at `/api/v1` | Lets us evolve the API without breaking older clients later. |
| Single User table for both roles | One auth flow; `role` discriminates. Cheaper than two tables. |
| Gemini server-side only | Keeps the API key off the client; lets us swap models without a frontend deploy. |
| Header-token admin auth | A whole admin role + UI is overkill for "flip a verified flag occasionally." |
| Three.js without react-three-fiber | Avoids the dep tree weight; the scene is throwaway-able. |
