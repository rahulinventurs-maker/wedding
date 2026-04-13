# RSVP Platform

A full-stack wedding RSVP management platform.

- **Backend** — Django 6 + Django REST Framework, raw SQL service layer, JWT auth
- **Frontend** — Next.js 16 (App Router), Tailwind CSS v4, Recharts
- **Database** — PostgreSQL 15

---

## Project Structure

```
ProjectInventurs/
├── docker-compose.yml          # Orchestrates all three services
├── init-scripts/               # PostgreSQL init SQL (extensions, enums, tables)
├── rsvp_project_backend/       # Django API
│   ├── config/                 # settings.py, urls.py, wsgi.py
│   ├── rsvp_app/
│   │   ├── services/           # Raw SQL service layer (no ORM queries)
│   │   │   ├── event_service.py
│   │   │   ├── rsvp_service.py
│   │   │   └── waitlist_service.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
└── rsvp-weeding/               # Next.js frontend
    ├── app/
    │   ├── dashboard/          # Admin pages (auth-guarded)
    │   │   ├── page.tsx            — event list overview
    │   │   ├── events/new/         — create event form
    │   │   └── events/[id]/
    │   │       ├── page.tsx        — event detail + edit
    │   │       ├── attendees/      — paginated guest list + waitlist
    │   │       └── analytics/      — charts dashboard
    │   ├── event/[id]/         # Public RSVP page (no auth)
    │   ├── login/
    │   └── register/
    ├── lib/
    │   ├── api.ts              # Axios instance with JWT interceptor
    │   └── endpoints.ts        # Typed API functions
    ├── store/
    │   └── auth.store.ts       # Zustand auth store
    └── Dockerfile
```

---

## Quick Start (Docker)

```bash
# Build and start all services
docker compose up --build

# Frontend  →  http://localhost:3000
# Backend   →  http://localhost:7777
# API docs  →  http://localhost:7777/api/docs/
```

The backend container automatically runs `migrate` then starts gunicorn on port 7777.

---

## Local Development

### Backend

```bash
cd rsvp_project_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver 7777
```

### Frontend

```bash
cd rsvp-weeding
npm install
npm run dev        # http://localhost:3000
```

Ensure `.env.local` exists in `rsvp-weeding/`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:7777/api
```

### Database

Start only PostgreSQL via Docker:

```bash
docker compose up postgres
```

Or point `settings.py` at an existing Postgres instance — the `DATABASE_URL` env var overrides all DB settings:

```env
DATABASE_URL=postgresql://lucifer:password123@127.0.0.1:5432/RSVP_PLATFORM
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | — | Register admin or participant |
| POST | `/api/auth/login/` | — | Obtain JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | — | Rotate access token |
| POST | `/api/auth/logout/` | Bearer | Blacklist refresh token |

### Events (admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/` | List own events (paginated) |
| POST | `/api/events/` | Create event |
| GET | `/api/events/<id>/` | Get event detail + stats |
| PUT | `/api/events/<id>/` | Update event |
| DELETE | `/api/events/<id>/` | Delete event |
| GET | `/api/events/<id>/attendees/` | List RSVPs (filter by status, search by name) |
| GET | `/api/events/<id>/waitlist/` | List waitlist entries |
| GET | `/api/events/<id>/analytics/` | Aggregated analytics |

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/<id>/public/` | Event landing page data |
| POST | `/api/events/<id>/rsvp/` | Submit RSVP (auto-waitlists when full) |
| GET | `/api/checkin/<qr_token>/` | Verify guest QR code at door |

Full interactive docs at `/api/docs/` (Swagger) or `/api/docs/redoc/`.

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | *(see settings.py)* | Full Postgres connection URL |
| `DJANGO_SETTINGS_MODULE` | `config.settings` | Settings module path |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:7777/api` | Backend API base URL |

---

## Features

### Admin
- JWT authentication (access token 1 hr, refresh 7 days, rotation + blacklist)
- Create / edit / delete events with capacity, +1 toggle, active flag
- Paginated attendee list with status filter and name search
- Waitlist management
- Public RSVP link per event
- Analytics dashboard — RSVP status breakdown, +1 rate, dietary preferences, RSVPs over time

### Guest (public)
- Event landing page with date, location, description
- RSVP form — name, email, status (yes/no/maybe), dietary preferences, +1 name
- Automatic waitlist when event is at capacity
- QR code generated on confirmed RSVP for door entry

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Django 6, DRF 3.17, SimpleJWT, drf-spectacular |
| Database | PostgreSQL 15, psycopg2 |
| QR codes | qrcode[pil] — base64 data URIs, no file storage |
| Frontend | Next.js 16.2, React 19, Tailwind CSS v4 |
| State | Zustand 5 |
| Charts | Recharts |
| HTTP | Axios with JWT interceptor |
| Container | Docker, Docker Compose |
