# SmartQueue

**Real-time digital queue and appointment management.**

Skip the uncertainty. Know your place in line.

---

## Problem statement

At banks, government offices, college admin desks and service centres, people take a paper slip and then stand still for an hour. Nobody can tell them how long it will be, so nobody can leave. Meanwhile one counter has a queue and another sits idle, and no one can see that either.

SmartQueue replaces the paper slip with a live token. A customer picks a service, takes a token from their phone, and watches their position and estimated wait update by themselves. Staff get one screen that shows the whole queue, who to call next, and where the time is going.

---

## Features

**Customers**
- Register, sign in, stay signed in with a JWT
- Browse services with live queue length and estimated wait
- Take a digital token (SQ-104) or book an appointment
- Live token page: position, people ahead, estimated wait, current serving token
- Check in to an appointment and get placed ahead of walk-ins
- Cancel a waiting token
- Full history with filters by status, service and month
- In-app notifications when the queue moves

**Admins**
- Counter board: open, close, call next, complete, skip
- Live queue in exact call order, filterable by service
- Create, edit and deactivate services
- Dashboard: tokens today, waiting, serving, completed, average wait, average service time, active counters, cancellations, peak hour
- Charts: tokens per hour, waiting time trend, service mix, counter utilisation
- Counter simulation: compare average wait across different staffing levels

---

## Technology stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide |
| Backend | Python, FastAPI, Pydantic v2, SQLAlchemy 2.0 |
| Database | PostgreSQL |
| Auth | JWT (python-jose) + bcrypt via passlib |
| Real time | WebSockets (native FastAPI) |

No Redis, no queues, no microservices. Everything runs in two processes plus a database.

---

## Architecture

```
Browser (Next.js)
   │  REST  ──────────────►  FastAPI
   │  WebSocket ◄──────────     │
                                ▼
                          PostgreSQL
```

The backend is layered so each file has one job:

```
app/api/        HTTP only: parse the request, call a service, return a response
app/services/   All business rules (queue order, waiting time, analytics)
app/models/     SQLAlchemy tables
app/schemas/    Pydantic request/response shapes
app/core/       Config, database session, password hashing, JWT
app/websocket/  Connection manager and broadcast helper
```

The rule that keeps it understandable: **routers never contain business logic, and services never touch HTTP.** `queue_service.call_next()` can be read and tested without knowing FastAPI exists.

See [docs/architecture.md](docs/architecture.md).

---

## Database schema

Six tables: `users`, `services`, `counters`, `queue_tokens`, `appointments`, `service_history`.

`service_history` is the important one — one row per completed service, storing how long the customer waited and how long the service took. Waiting-time estimates and every analytics chart read from it.

Full column list, foreign keys and the reasoning behind each index: [docs/database.md](docs/database.md).

---

## API structure

```
POST   /api/auth/register                 POST /api/queue/tokens
POST   /api/auth/login                    GET  /api/queue/my-token
GET    /api/auth/me                       GET  /api/queue/status
                                          GET  /api/queue/history
GET    /api/services                      POST /api/queue/{id}/cancel
POST   /api/services
PATCH  /api/services/{id}                 POST /api/admin/queue/next
DELETE /api/services/{id}   (soft)        POST /api/admin/queue/{id}/start
                                          POST /api/admin/queue/{id}/complete
GET    /api/admin/counters                POST /api/admin/queue/{id}/skip
POST   /api/admin/counters
PATCH  /api/admin/counters/{id}           GET  /api/admin/analytics/overview
                                          GET  /api/admin/analytics/hourly
GET    /api/appointments                  GET  /api/admin/analytics/services
POST   /api/appointments                  GET  /api/admin/analytics/counters
PATCH  /api/appointments/{id}             POST /api/admin/analytics/simulate
POST   /api/appointments/{id}/check-in
                                          WS   /ws?rooms=admin,user:42
```

Every error returns the same shape, never a stack trace:

```json
{ "success": false, "message": "Token is no longer available" }
```

Interactive docs at `http://localhost:8000/docs`. Full reference: [docs/api.md](docs/api.md).

---

## Queue algorithm

```sql
ORDER BY priority DESC, created_at ASC
```

Higher priority first; ties broken by arrival time. Priority is 0 (walk-in) or 1 (checked-in appointment). That is the entire rule — deliberately, because a customer has to be able to understand why the person next to them was called first.

The same expression computes "people ahead of you" on the customer's screen, so the position shown always matches the order the backend will actually use.

Details: [docs/queue-logic.md](docs/queue-logic.md).

---

## Waiting-time algorithm

```
estimated wait = people ahead x average service time / open counters
```

- **Average service time** is the mean of the last 20 completed services *for that service type*, read from `service_history`. Recent rows only, so the estimate follows how fast counters are moving today.
- Below 3 completed rows, it falls back to the admin-configured `average_duration`.
- Dividing by open counters matters: 5 people ahead with three counters open is a third of the wait of one counter.

Worked example:

```
Last 5 Document Verification services: 8, 10, 7, 9, 11 min  →  average 9 min
4 people ahead ÷ 1 counter  →  4 × 9 = 36 min
open a second counter       →  4 × 9 / 2 = 18 min
```

The UI shows this sum to the customer rather than just the number, which is why it is worth keeping the arithmetic simple.

Known limitations: assumes counters work in parallel at equal speed, ignores breaks, treats every customer of a service as identical, and does not account for time-of-day effects.

---

## WebSocket architecture

One endpoint, `/ws?rooms=...`. Clients join rooms:

- `admin` — every queue change
- `service:3` — changes to one service's queue
- `user:42` — messages for one customer

After any state change, the endpoint calls `broadcast_queue_update(event, payload)`, which fans out to the admin room, the affected service room, and the affected user.

**The socket says "something changed"; the page then refetches over REST.** That means a dropped message can never leave the screen permanently wrong. The client reconnects with exponential backoff and refetches on every reconnect.

Details: [docs/websocket.md](docs/websocket.md).

---

## Authentication

- Passwords hashed with bcrypt (`passlib`). Plain text is never stored or logged.
- Sign-in returns a JWT signed with `JWT_SECRET`, carrying the user id and role, expiring in 12 hours.
- The frontend stores it and sends `Authorization: Bearer <token>`.
- Sign-in failures return one message for "no such user" and "wrong password" so the endpoint can't be used to enumerate emails.

## Authorization

`require_admin` reads the role **from the database**, not from the JWT payload and not from anything the frontend sends. Admin routers declare it once at the router level, so every route under `/api/admin/...` is protected by construction rather than by remembering.

Ownership is checked separately: a customer can only cancel their own token and only see their own appointments and history.

Registration always creates `role="customer"` — a self-service signup can never mint an admin, whatever the request body contains. There is a test for exactly that.

---

## Concurrency handling

Two admins press "Call next" at the same instant. Without protection, both read the same first waiting token, both write it, and one customer is summoned to two counters while the next is skipped.

```python
select(QueueToken)
  .where(QueueToken.status == "WAITING")
  .order_by(QueueToken.priority.desc(), QueueToken.created_at.asc())
  .limit(1)
  .with_for_update(skip_locked=True)
```

- `FOR UPDATE` locks the row until the transaction commits, so the second transaction can't read-then-write the same row.
- `SKIP LOCKED` makes the second transaction take the *next* row instead of blocking. Admin A gets SQ-104, admin B gets SQ-105, neither waits.

`tests/test_concurrency.py` fires two real threads at a real PostgreSQL database through a barrier and asserts they get different tokens.

---

## Setup instructions

**Requirements:** Python 3.11+, Node 18+, PostgreSQL 14+ (or Docker).

```bash
# 1. Database
docker compose up -d          # or use your own PostgreSQL

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then edit JWT_SECRET and DATABASE_URL
python seed.py                # creates tables + demo data, prints credentials
uvicorn app.main:app --reload # http://localhost:8000/docs

# 3. Frontend  (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                   # http://localhost:3000
```

### Demo credentials

Printed by `seed.py`. Defaults, overridable with `DEMO_ADMIN_PASSWORD` / `DEMO_CUSTOMER_PASSWORD`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartqueue.dev` | `admin12345` |
| Customer | `aarav@smartqueue.dev` | `customer12345` |

Other customers: `diya@`, `rohan@`, `ishita@`, `kabir@`, `ananya@`, `vihaan@`, `sara@` — all `@smartqueue.dev`, same customer password.

These are development-only values generated by a script. Change them before deploying anywhere public.

---

## Environment variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signs JWTs. Generate: `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (default 720) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `ENVIRONMENT` | `development` auto-creates tables; `production` does not |

**frontend/.env.local**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL (`ws://` locally, `wss://` in production) |

`.env` is gitignored. Only `.env.example` is committed.

---

## Running the demo (3–5 minutes)

Two browser windows side by side — one customer, one admin.

1. Sign in as `aarav@smartqueue.dev` → **Services**
2. Pick **Document Verification**, note the waiting count and estimate → **Take a token**
3. You land on **My queue**: token number, people ahead, estimated wait, and the sum behind it
4. In window two, sign in as `admin@smartqueue.dev` → **Counters**
5. Open a counter → **Call next**
6. Watch window one update *without a refresh* — position drops, notification bell fires
7. Press **Complete** on the admin side; the customer's estimate recalculates
8. **Analytics**: tokens per hour, average wait, service mix, counter utilisation
9. **Simulation**: set 3 counters, 60 customers, 9 min → see what a 4th and 5th counter would do

Point out while demoing: the estimate comes from real recorded durations, and two admins clicking "Call next" together get different tokens because of `FOR UPDATE SKIP LOCKED`.

---

## Testing

```bash
cd backend
pytest                        # unit + integration tests on in-memory SQLite

# The concurrency test needs real PostgreSQL:
TEST_DATABASE_URL=postgresql+psycopg2://smartqueue:smartqueue@localhost:5432/smartqueue_test pytest
```

Covered: registration, privilege escalation on signup, duplicate email, login failure, password hashing, token creation, one-active-token rule, queue ordering by arrival, priority overriding arrival, call-next assigning a counter, empty queue, busy counter, completion writing history, skip preserving the record, ownership on cancel, position matching call order, waiting-time fallback, measured average, the multiplication, the counter divisor, simulation monotonicity, admin-only authorization, and the two-thread concurrency case.

```bash
cd frontend && npm test       # utils + component tests via Vitest
```

---

## Deployment

**Frontend → Vercel.** Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` (use `wss://`). Root directory `frontend`.

**Backend → Render / Railway / Fly.** A `Dockerfile` is included; it binds to `$PORT`. Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (your Vercel domain), `ENVIRONMENT=production`. Confirm the platform supports WebSocket upgrades.

**Database → managed PostgreSQL** (Render, Neon, Supabase, RDS).

Before going live: set `ENVIRONMENT=production` so tables aren't auto-created, run migrations with Alembic instead, set a real `JWT_SECRET`, and narrow `FRONTEND_URL` to your actual domain.

---

## Future improvements

Deliberately **not** built, so the project stays small enough to defend:

- SMS and email notifications
- QR-code check-in at the door
- Redis pub/sub so WebSocket broadcasts survive multiple backend instances
- Per-service, per-hour waiting-time models instead of a flat average
- Multi-tenant support (several organisations on one deployment)
- A native mobile app
- Staff accounts distinct from admins, with per-counter permissions
- Appointment slot capacity limits

---

## Documentation

- [architecture.md](docs/architecture.md) — layers and request flow
- [database.md](docs/database.md) — schema and index reasoning
- [api.md](docs/api.md) — endpoint reference
- [queue-logic.md](docs/queue-logic.md) — ordering, concurrency, waiting time
- [websocket.md](docs/websocket.md) — rooms, events, reconnection
- [interview-guide.md](docs/interview-guide.md) — 26 questions with simple and deep answers
