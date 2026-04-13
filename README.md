# RSVP Platform

A full-stack wedding RSVP management platform. Admins create and manage events; guests RSVP via a public link and receive a QR code on confirmation.

- **Live app** → https://thriving-tulumba-2cd1a1.netlify.app/login
- **Backend API** → http://13.201.30.138:7777/api/docs/

---

## What the application does

### Admin side
- Register as an admin and log in with JWT authentication
- Create events with title, date/time, location, description, max capacity, and +1 toggle
- Share a public RSVP link with guests
- View a paginated, searchable, filterable attendee list
- See who is on the waitlist when the event is full
- Edit or delete events at any time
- View an analytics dashboard — RSVP status breakdown, +1 rate, dietary preferences, RSVPs over time

### Guest side
- Open the public event link — no account required
- Fill in name, email, RSVP status (yes / no / maybe), dietary preferences, and +1 name
- If the event is full, automatically placed on the waitlist with a queue position
- Confirmed guests receive a QR code to screenshot and show at the door

---

## Project structure

```
ProjectInventurs/
├── docker-compose.yml              # Runs postgres + backend + frontend together
├── init-scripts/                   # PostgreSQL init SQL (extensions, enums, tables)
├── rsvp_project_backend/           # Django 6 + DRF backend
│   ├── config/
│   │   ├── settings.py             # All config read from env vars
│   │   └── urls.py
│   ├── rsvp_app/
│   │   ├── services/               # Raw SQL service layer
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── urls.py
│   ├── .env.example                # Copy to .env
│   ├── requirements.txt
│   └── Dockerfile
└── rsvp-weeding/                   # Next.js 16 frontend
    ├── app/
    │   ├── dashboard/              # Admin pages (JWT-guarded)
    │   │   ├── page.tsx                — event list
    │   │   ├── events/new/             — create event
    │   │   └── events/[id]/
    │   │       ├── page.tsx            — event detail + edit
    │   │       ├── attendees/          — guest list + waitlist
    │   │       └── analytics/          — charts
    │   ├── event/[id]/             # Public RSVP page (no auth)
    │   ├── login/
    │   └── register/
    ├── lib/
    │   ├── api.ts                  # Axios instance with JWT interceptor
    │   └── endpoints.ts            # All API functions
    ├── store/auth.store.ts         # Zustand auth store
    ├── .env.example                # Copy to .env.local
    ├── netlify.toml                # Netlify build + proxy config
    └── Dockerfile
```

---

## Live deployment

| Service | URL |
|---------|-----|
| Frontend (Netlify) | https://thriving-tulumba-2cd1a1.netlify.app |
| Backend API (EC2) | http://13.201.30.138:7777 |
| API Docs (Swagger) | http://13.201.30.138:7777/api/docs/ |

---

## Walkthrough on the live app

### 1. Register as admin
Go to https://thriving-tulumba-2cd1a1.netlify.app/register

Fill in:
- Username, email, password
- Role → **Admin**

### 2. Log in
Go to https://thriving-tulumba-2cd1a1.netlify.app/login

Use the credentials you just registered.

### 3. Create an event
- Click **+ New Event** on the dashboard
- Fill in title, date/time, location, optional description
- Set max capacity (leave blank for unlimited)
- Toggle **Allow +1** if guests can bring someone
- Click **Create Event**

### 4. Share the public RSVP link
- Open the event detail page
- Copy the **Public RSVP link** shown at the top
- Share it with guests — no account needed to RSVP

### 5. View attendees and analytics
- Click **View Attendees** on the event detail page to see the guest list
- Switch between the **Attendees** and **Waitlist** tabs
- Search by name or filter by status (confirmed / declined / maybe)
- Click **Analytics** to see charts

### 6. Guest RSVP flow
- Guest opens the public link
- Fills in name, email, RSVP status, dietary preferences, optional +1
- If confirmed → receives a QR code to screenshot
- If event is full → shown their waitlist position

---

## Local development setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15 (or Docker)

### 1. Start the database

```bash
# Easiest — use Docker just for postgres
docker compose up postgres -d
```

### 2. Backend

```bash
cd rsvp_project_backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Edit .env if needed — defaults work with the Docker postgres above

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver 0.0.0.0:7777
```

Backend is now at http://localhost:7777
API docs at http://localhost:7777/api/docs/

### 3. Frontend

```bash
cd rsvp-weeding

# Install dependencies
npm install

# Create your .env.local file
cp .env.example .env.local
# Default value points to localhost:7777 — no changes needed for local dev

# Start the dev server
npm run dev
```

Frontend is now at http://localhost:3000

### 4. Create your first admin user (local)

```bash
curl -s -X POST http://localhost:7777/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "yourpassword",
    "role": "admin"
  }'
```

Then log in at http://localhost:3000/login

---

## Docker Compose (full stack)

Runs postgres + backend + frontend all together:

```bash
# Build and start everything
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:7777 |
| API Docs | http://localhost:7777/api/docs/ |
| Postgres | localhost:5432 |

---

## Environment variables

### Backend (`rsvp_project_backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | insecure default | Django secret key — change in production |
| `DEBUG` | `true` | Set to `false` in production |
| `ALLOWED_HOSTS` | `*` | Comma-separated list of allowed hosts |
| `DATABASE_URL` | — | Full postgres URL — overrides all DB_* vars |
| `DB_NAME` | `RSVP_PLATFORM` | Database name |
| `DB_USER` | `lucifer` | Database user |
| `DB_PASSWORD` | `password123` | Database password |
| `DB_HOST` | `172.23.0.20` | Database host |
| `DB_PORT` | `5432` | Database port |
| `CORS_ALLOW_ALL_ORIGINS` | `true` | Set to `false` and specify `CORS_ALLOWED_ORIGINS` in production |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated allowed origins when `CORS_ALLOW_ALL_ORIGINS=false` |

### Frontend (`rsvp-weeding/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:7777/api` | Backend API base URL |

---

## API reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | — | Register admin or participant |
| POST | `/api/auth/login/` | — | Get JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | — | Rotate access token |
| POST | `/api/auth/logout/` | Bearer | Blacklist refresh token |

### Events (admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/` | List own events |
| POST | `/api/events/` | Create event |
| GET | `/api/events/<id>/` | Event detail + stats |
| PUT | `/api/events/<id>/` | Update event |
| DELETE | `/api/events/<id>/` | Delete event |
| GET | `/api/events/<id>/attendees/` | Guest list (filterable) |
| GET | `/api/events/<id>/waitlist/` | Waitlist entries |
| GET | `/api/events/<id>/analytics/` | Charts data |

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/<id>/public/` | Event landing page data |
| POST | `/api/events/<id>/rsvp/` | Submit RSVP |
| GET | `/api/checkin/<qr_token>/` | Verify QR code at door |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| API | Django 6, DRF 3.17, SimpleJWT, drf-spectacular |
| Database | PostgreSQL 15, psycopg2, raw SQL service layer |
| QR codes | qrcode[pil] — base64 data URIs |
| Frontend | Next.js 16.2, React 19, Tailwind CSS v4 |
| State | Zustand 5 |
| Charts | Recharts |
| HTTP | Axios with JWT interceptor |
| Container | Docker, Docker Compose |
| Hosting | Netlify (frontend), AWS EC2 (backend) |
