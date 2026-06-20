# KNUST Library System — Setup Guide

For group members running the project on a fresh machine after pulling from Git.

---

## Prerequisites

Install these before anything else. Use the check commands to confirm each one works.

| Tool | Version | Check |
|------|---------|-------|
| Java (JDK) | 21 | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 18+ | `node -version` |
| npm | 9+ | `npm -version` |
| Docker Desktop | latest | `docker -version` |

**Download links:**
- Java 21: https://adoptium.net — choose **Temurin 21 LTS**
- Maven: https://maven.apache.org/download.cgi
- Node.js: https://nodejs.org — choose **LTS**
- Docker Desktop: https://www.docker.com/products/docker-desktop

---

## Step 1 — Pull the repo

```bash
git clone https://github.com/1mansurr/library_system_9
cd library_system_9
```

---

## Step 2 — Create the `.env` file

The `.env` file is not committed to Git. Create it manually in the **project root**:

```bash
# run this from inside library_system_9/
touch .env
```

Open it in any text editor and paste exactly this:

```
JWT_SECRET=library-system-super-secret-key-32bytes-minimum
SERVICE_TOKEN=internal-service-token-for-loan-to-book
```

Save and close.

---

## Step 3 — Start the database

Make sure Docker Desktop is open and running, then:

```bash
# run from the project root
docker compose up postgres -d
```

This starts PostgreSQL on port 5432 and automatically creates three databases: `users_db`, `books_db`, `loans_db`.

Confirm it is ready before moving on:

```bash
docker compose ps
# the postgres row should show "healthy" under STATUS
```

---

## Step 4 — Start the three backend services

Open **three separate terminal windows** (or tabs). Run one command per terminal. Start user-service first, then the other two in any order.

**Terminal 1 — user-service (port 8081)**

```bash
cd library_system_9/user-service
DB_URL=jdbc:postgresql://localhost:5432/users_db \
DB_USER=library \
DB_PASSWORD=library \
JWT_SECRET=library-system-super-secret-key-32bytes-minimum \
mvn spring-boot:run
```

**Terminal 2 — book-service (port 8082)**

```bash
cd library_system_9/book-service
DB_URL=jdbc:postgresql://localhost:5432/books_db \
DB_USER=library \
DB_PASSWORD=library \
JWT_SECRET=library-system-super-secret-key-32bytes-minimum \
SERVICE_TOKEN=internal-service-token-for-loan-to-book \
mvn spring-boot:run
```

**Terminal 3 — loan-service (port 8083)**

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

Each service prints `Started ... in X seconds` when it is ready.

> **Note:** The first run takes 2–3 minutes per service because Maven downloads all dependencies (~200 MB total). Subsequent starts are fast.

---

## Step 5 — Start the frontend

**Terminal 4 — frontend (port 5173)**

```bash
cd library_system_9/frontend
npm install       # first time only
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Step 6 — Log in

The login page has quick-fill buttons, or type manually:

| Role | Email | Password |
|------|-------|----------|
| Librarian | `librarian@library.com` | `librarian123` |
| Member | register a new account | — |

---

## Stopping everything

- Frontend and each service: press `Ctrl+C` in their respective terminals
- Database (keeps data): `docker compose down`
- Database + **wipe all data**: `docker compose down -v`

---

## Troubleshooting

**"Port already in use"**

Something else is occupying port 5432, 8081, 8082, or 8083. Find and stop it:

```bash
lsof -i :8081   # replace with whichever port is blocked
kill <PID>
```

**"Cannot connect to database" on startup**

The Postgres container is not ready yet. Wait until `docker compose ps` shows `healthy`, then try starting the service again.

**Frontend shows a blank page or network errors**

All three backend services must be fully started (each terminal shows "Started") before the frontend will work correctly.

**Windows users**

The `\` line-continuation does not work in CMD. Use PowerShell and replace each `\` with a backtick `` ` ``, or set variables one by one before running Maven:

```powershell
$env:DB_URL="jdbc:postgresql://localhost:5432/users_db"
$env:DB_USER="library"
$env:DB_PASSWORD="library"
$env:JWT_SECRET="library-system-super-secret-key-32bytes-minimum"
mvn spring-boot:run
```
