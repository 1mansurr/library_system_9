# How to Run Locally

Quick reference for running the full stack (3 backend services + frontend) on your
own machine. For first-time machine setup (installing Java/Maven/Node/Docker), see
[`docs/setup-guide.md`](docs/setup-guide.md) instead — this file assumes those are
already installed.

Services: **user-service** (:8081), **book-service** (:8082), **loan-service** (:8083),
**frontend** (:5173). Postgres is shared infra for all three backend services.

---

## 1. Start Postgres

```bash
cd library_system_9
docker compose up -d postgres
```

Wait for it to report healthy:

```bash
docker compose ps
```

`infra/init.sql` auto-creates `users_db`, `books_db`, `loans_db` on first run.

---

## 2. Start the three backend services

Open a separate terminal per service (or background them). Each uses the same
Postgres instance, a different database, and shares one JWT secret + service token.

**user-service**
```bash
cd library_system_9/user-service
DB_URL=jdbc:postgresql://localhost:5432/users_db \
DB_USER=library \
DB_PASSWORD=library \
JWT_SECRET=library-system-super-secret-key-32bytes-minimum \
mvn spring-boot:run
```

**book-service**
```bash
cd library_system_9/book-service
DB_URL=jdbc:postgresql://localhost:5432/books_db \
DB_USER=library \
DB_PASSWORD=library \
JWT_SECRET=library-system-super-secret-key-32bytes-minimum \
SERVICE_TOKEN=internal-service-token-for-loan-to-book \
mvn spring-boot:run
```

**loan-service**
```bash
cd library_system_9/loan-service
DB_URL=jdbc:postgresql://localhost:5432/loans_db \
DB_USER=library \
DB_PASSWORD=library \
JWT_SECRET=library-system-super-secret-key-32bytes-minimum \
SERVICE_TOKEN=internal-service-token-for-loan-to-book \
USER_SERVICE_URL=http://localhost:8081 \
BOOK_SERVICE_URL=http://localhost:8082 \
mvn spring-boot:run
```

Each prints `Started ... in X seconds` when ready.

### Optional env vars (all have defaults, override only if needed)

| Var | Default | Service |
|---|---|---|
| `ALLOWED_ORIGIN` | `http://localhost:5173` | all three — set explicitly if Vite picks a different port |
| `SHELF_CAPACITY` | `40` | book-service — copies per shelf before rolling to the next |
| `LOAN_PERIOD_DAYS` | `14` | loan-service |
| `DAILY_RATE` | `0.50` | loan-service — fine per day overdue |
| `MAX_ACTIVE_LOANS_PER_USER` | `5` | loan-service |

---

## 3. Start the frontend

```bash
cd library_system_9/frontend
npm install   # first time only
npm run dev
```

Open **http://localhost:5173**. If Vite reports a port other than 5173 (because
something else is already using it), restart the three backend services with
`ALLOWED_ORIGIN=http://localhost:<actual-port>` or login will fail with a CORS error.

---

## 4. Log in

| Role | Email | Password |
|---|---|---|
| Librarian | `librarian@library.com` | `librarian123` |
| Member | register a new account from the Sign Up screen | — |

---

## Stopping everything

```bash
# each service/frontend: Ctrl+C in its terminal, or:
lsof -ti :8081 -ti :8082 -ti :8083 -ti :5173 | xargs kill

# Postgres (keeps data):
docker compose down

# Postgres + wipe all data:
docker compose down -v
```

---

## Notes

- This project is also set up to deploy (frontend → Vercel, backend services →
  Railway, wired via `VITE_*_SERVICE_URL` env vars) — but that deployment is
  currently shut down. This guide is for running everything locally instead.
- Seeded data: `book-service`'s `V2__college_department_course.sql` migration
  pre-populates a representative set of real KNUST colleges/departments/courses,
  so the catalogue browsing screens have real data to show without adding any
  books yourself.
