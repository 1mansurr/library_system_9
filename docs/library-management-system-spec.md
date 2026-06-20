# Library Management System — Technical Overview

**Owner:** Mansur Alidu
**Status:** v3 spec, ready for implementation
**Build agent:** Claude Code
**Target stack:** Java 21, Spring Boot 3.x, Maven, PostgreSQL, Docker Compose

---

## 1. Overview

Three-service backend for a library management system. Members borrow and return book copies. Librarians manage the catalog and inventory. Auth is JWT-based and minted by the user-service. Services communicate over REST.

**MVP loop (in order):**

1. Register / login
2. Librarian adds books and copies
3. Member borrows a copy
4. Member returns a copy (fine calculated on return)
5. Librarian views overdue loans

Reservations, renewals, search/filter, and reports are deferred to Phase 2.

---

## 2. Architecture

```mermaid
graph LR
    Client[Postman / curl / future frontend]
    User[user-service :8081]
    Book[book-service :8082]
    Loan[loan-service :8083]
    UDB[(users_db)]
    BDB[(books_db)]
    LDB[(loans_db)]

    Client --> User
    Client --> Book
    Client --> Loan
    Loan -->|GET /users/{id}| User
    Loan -->|GET /copies/{id}| Book
    Loan -->|PATCH /copies/{id}/status<br/>X-Service-Token| Book

    User --- UDB
    Book --- BDB
    Loan --- LDB
```

**Key principles:**

- Each service owns its database. No shared schema. No cross-service foreign keys.
- Cross-service references (`loans.user_id`, `loans.copy_id`) are logical, not enforced by DB constraints.
- All IDs are `UUID` so services can generate them without coordinating.
- No API gateway. Each service exposes its own port. JWT verification is decentralized.
- All timestamps are `TIMESTAMP WITH TIME ZONE` and stored in UTC.

---

## 3. Tech Stack

| Concern | Choice |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.x |
| Build | Maven (multi-module not required, three independent projects) |
| Web | Spring Web (REST) |
| Persistence | Spring Data JPA + Hibernate |
| Migrations | Flyway |
| Security | Spring Security + JWT (HS256) |
| HTTP client | Spring `RestClient` (Spring 6.1+) |
| Validation | Jakarta Bean Validation |
| Database | PostgreSQL 16 |
| Local infra | Docker Compose |
| API testing | Postman collection |

**JWT library:** `io.jsonwebtoken:jjwt-api/impl/jackson` (jjwt 0.12+).

**Password hashing:** BCrypt via Spring Security's `BCryptPasswordEncoder`.

---

## 4. Project Layout

Three separate Maven projects, one per service. No shared parent for MVP — duplicate the small auth filter and DTOs across services. Extract to a shared module in Phase 2 if it hurts.

```
library-management/
├── docker-compose.yml
├── postman/
│   └── library.postman_collection.json
├── user-service/
│   └── (Spring Boot project)
├── book-service/
│   └── (Spring Boot project)
└── loan-service/
    └── (Spring Boot project)
```

Each service follows standard Spring Boot package layout:

```
src/main/java/com/library/<service>/
├── <Service>Application.java
├── config/        # SecurityConfig, RestClientConfig
├── controller/    # REST controllers
├── service/       # business logic
├── repository/    # JPA repositories
├── entity/        # JPA entities
├── dto/           # request/response DTOs
├── security/      # JwtAuthFilter, JwtService
└── exception/     # global exception handler
```

---

## 5. Database Design

### 5.1 users_db (owned by user-service)

**users**

| Column | Type | Constraints |
|---|---|---|
| user_id | UUID | PK |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| role | TEXT | NOT NULL, CHECK (role IN ('STUDENT','STAFF','LIBRARIAN','EXTERNAL')) |
| status | TEXT | NOT NULL DEFAULT 'ACTIVE', CHECK (status IN ('ACTIVE','SUSPENDED')) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

**profiles**

| Column | Type | Constraints |
|---|---|---|
| profile_id | UUID | PK |
| user_id | UUID | FK → users.user_id, UNIQUE, NOT NULL |
| full_name | TEXT | NOT NULL |
| member_type | TEXT | NOT NULL, CHECK (member_type IN ('STUDENT','STAFF','EXTERNAL')) |
| matric_no | TEXT | NULLABLE, UNIQUE |
| staff_id | TEXT | NULLABLE, UNIQUE |
| card_number | TEXT | UNIQUE, NOT NULL |
| phone | TEXT | |

Notes: `matric_no` required if `member_type = STUDENT`. `staff_id` required if `member_type = STAFF`. Enforce in service layer, not DB.

### 5.2 books_db (owned by book-service)

**books**

| Column | Type | Constraints |
|---|---|---|
| book_id | UUID | PK |
| isbn | TEXT | UNIQUE, NOT NULL |
| title | TEXT | NOT NULL |
| author | TEXT | NOT NULL |
| category | TEXT | |

**book_copies**

| Column | Type | Constraints |
|---|---|---|
| copy_id | UUID | PK |
| book_id | UUID | FK → books.book_id, NOT NULL |
| barcode | TEXT | UNIQUE, NOT NULL |
| status | TEXT | NOT NULL DEFAULT 'AVAILABLE', CHECK (status IN ('AVAILABLE','LOANED','LOST')) |
| location | TEXT | |

### 5.3 loans_db (owned by loan-service)

**loans**

| Column | Type | Constraints |
|---|---|---|
| loan_id | UUID | PK |
| user_id | UUID | NOT NULL (logical ref to user-service) |
| copy_id | UUID | NOT NULL (logical ref to book-service) |
| borrow_date | TIMESTAMPTZ | NOT NULL |
| due_date | TIMESTAMPTZ | NOT NULL |
| return_date | TIMESTAMPTZ | NULLABLE |
| status | TEXT | NOT NULL, CHECK (status IN ('BORROWED','RETURNED')) |
| fine_amount | NUMERIC(10,2) | NULLABLE (set on return) |

Index on `(user_id, status)` and `(status, due_date)` for the "my loans" and "overdue" queries.

**Overdue is derived, not stored:** `status = 'BORROWED' AND due_date < CURRENT_TIMESTAMP`.

**reservations** (table created in MVP, no endpoints exposed yet)

| Column | Type | Constraints |
|---|---|---|
| reservation_id | UUID | PK |
| user_id | UUID | NOT NULL |
| book_id | UUID | NOT NULL |
| request_date | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| status | TEXT | NOT NULL DEFAULT 'PENDING', CHECK (status IN ('PENDING','FULFILLED','CANCELLED')) |

---

## 6. API Contracts

All bodies are JSON. All authenticated endpoints require `Authorization: Bearer <jwt>`. Error responses follow `{ "error": "...", "message": "..." }`.

### 6.1 user-service (port 8081)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Create user + profile |
| POST | /api/auth/login | public | Verify credentials, return JWT |
| GET | /api/users/me | any auth | Current user + profile |
| GET | /api/users/{user_id} | any auth | Lookup user (used by loan-service) |
| PATCH | /api/users/{user_id}/status | LIBRARIAN | Suspend / reactivate |

**POST /api/auth/register**

Request:
```json
{
  "email": "mansur@knust.edu.gh",
  "password": "...",
  "full_name": "Mansur Alidu",
  "member_type": "STUDENT",
  "matric_no": "...",
  "phone": "+233..."
}
```

Response 201:
```json
{ "user_id": "uuid", "email": "...", "card_number": "auto-generated" }
```

Rules: hash password with BCrypt before insert. Auto-generate `card_number` (e.g. `LIB-<6 random chars>`). Role defaults from member_type: STUDENT/STAFF members get role STUDENT/STAFF; EXTERNAL gets EXTERNAL. LIBRARIAN role assigned manually via DB seed (no public endpoint).

**POST /api/auth/login**

Request: `{ "email": "...", "password": "..." }`

Response 200:
```json
{
  "token": "<jwt>",
  "user_id": "uuid",
  "role": "STUDENT",
  "member_type": "STUDENT",
  "full_name": "..."
}
```

JWT payload: `sub=user_id`, `role`, `member_type`, `exp=now+24h`, `iat=now`. HS256, signed with `JWT_SECRET`.

**GET /api/users/{user_id}** — used by loan-service to verify ACTIVE before borrow.

Response 200:
```json
{ "user_id": "...", "email": "...", "role": "STUDENT", "status": "ACTIVE", "full_name": "..." }
```

### 6.2 book-service (port 8082)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/books | LIBRARIAN | Add book to catalog |
| GET | /api/books | any auth | List / browse books |
| GET | /api/books/{book_id} | any auth | Book detail + copies |
| POST | /api/books/{book_id}/copies | LIBRARIAN | Add a physical copy |
| GET | /api/copies/{copy_id} | any auth | Copy detail (used by loan-service) |
| PATCH | /api/copies/{copy_id}/status | LIBRARIAN **or** valid X-Service-Token | Mark AVAILABLE / LOANED / LOST |

**GET /api/books** — supports `?title=`, `?author=`, `?category=`, `?available_only=true`. Pagination: `?page=0&size=20`. Returns:

```json
{
  "content": [
    { "book_id": "...", "title": "...", "author": "...", "category": "...", "available_copies": 2, "total_copies": 5 }
  ],
  "page": 0, "size": 20, "total": 47
}
```

**GET /api/books/{book_id}** returns book detail with full copies list (copy_id, barcode, status, location).

**PATCH /api/copies/{copy_id}/status** request: `{ "status": "LOANED" }`. Caller must be either (a) a user with LIBRARIAN role, or (b) presenting a valid `X-Service-Token` header matching `SERVICE_TOKEN` env var. This is how loan-service mutates copy state.

### 6.3 loan-service (port 8083)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /api/loans | any auth | Borrow a copy |
| POST | /api/loans/{loan_id}/return | any auth | Return a copy, calculate fine |
| GET | /api/loans/me | any auth | My active + past loans |
| GET | /api/loans/{loan_id} | any auth (owner or LIBRARIAN) | Single loan |
| GET | /api/loans/overdue | LIBRARIAN | All overdue loans |

**POST /api/loans**

Request: `{ "copy_id": "uuid" }`. user_id taken from JWT.

Flow:
1. Call `GET /api/users/{user_id}` on user-service. Reject if status != ACTIVE.
2. Count user's active loans (status=BORROWED). Reject if >= `MAX_ACTIVE_LOANS_PER_USER` (default 5).
3. Call `GET /api/copies/{copy_id}` on book-service. Reject if status != AVAILABLE.
4. Call `PATCH /api/copies/{copy_id}/status` with body `{status: "LOANED"}` and `X-Service-Token` header.
5. Insert loan row: borrow_date=now, due_date=now+`LOAN_PERIOD_DAYS` (default 14), status=BORROWED.
6. Return 201 with loan.

Failure rollback: if step 5 fails after step 4 succeeded, attempt to revert copy to AVAILABLE. If revert fails, log and surface 500. (Best-effort compensation; acceptable for MVP.)

**POST /api/loans/{loan_id}/return**

Flow:
1. Load loan. Reject if not found, not owned by caller (unless LIBRARIAN), or status != BORROWED.
2. Set return_date=now. Compute `fine_amount = max(0, days_late) * DAILY_RATE`. `days_late = ceil((return_date - due_date) in days)`, only positive.
3. Update loan to status=RETURNED with fine_amount.
4. Call `PATCH /api/copies/{copy_id}/status` with `{status: "AVAILABLE"}` + service token.
5. Return updated loan.

**GET /api/loans/me** returns array of loans for current user. Each loan includes a computed `is_overdue` boolean and `current_fine_estimate` (computed if still BORROWED).

**GET /api/loans/overdue** returns all loans where `status=BORROWED AND due_date < now()`. Each includes user_id and copy_id (the librarian frontend joins these via separate calls if needed).

---

## 7. Authentication & Authorization

### 7.1 JWT

- Algorithm: HS256
- Signing key: env var `JWT_SECRET` (≥32 bytes), identical across all three services
- Expiry: 24 hours
- Payload claims: `sub` (user_id), `role`, `member_type`, `iat`, `exp`

### 7.2 JwtAuthFilter (in every service)

Each service has its own copy of `JwtAuthFilter` (do not extract to shared module in MVP):

1. Read `Authorization: Bearer <token>` header.
2. If missing on a public endpoint, continue.
3. Parse and verify signature with `JWT_SECRET`. Reject 401 on failure.
4. Set `SecurityContext` with authorities: `ROLE_<role>` (Spring Security convention).
5. Expose `user_id` via a custom principal so controllers can inject it.

### 7.3 Role-based access

Use `@PreAuthorize("hasRole('LIBRARIAN')")` on endpoints restricted to librarians. Use `@PreAuthorize("isAuthenticated()")` on generic protected endpoints.

### 7.4 Service-to-service auth

For `PATCH /api/copies/{id}/status` only. Caller passes `X-Service-Token: <SERVICE_TOKEN>` header. Book-service has a filter that checks: if header present and matches `SERVICE_TOKEN` env var, allow the request even without a valid JWT. This is intentionally simple — replace with proper service mesh auth in Phase 2.

---

## 8. Inter-Service Communication

All HTTP calls use Spring's `RestClient`. One `@Bean` per remote service:

```java
@Bean RestClient userServiceClient() {
    return RestClient.builder().baseUrl(userServiceUrl).build();
}
```

| Caller | Callee | Endpoint | Headers |
|---|---|---|---|
| loan-service | user-service | `GET /api/users/{id}` | Forward caller's JWT |
| loan-service | book-service | `GET /api/copies/{id}` | Forward caller's JWT |
| loan-service | book-service | `PATCH /api/copies/{id}/status` | `X-Service-Token: ${SERVICE_TOKEN}` |

**Failure mode for MVP:** fail fast. If a downstream call returns 5xx or times out (5s timeout), the loan request fails with 503. No retries, no circuit breaker. Logged with correlation ID. Add resilience in Phase 2.

---

## 9. Configuration & Environment

Per-service `application.yml` (values from env vars):

| Variable | Used by | Purpose |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | all | Postgres connection |
| `JWT_SECRET` | all | JWT signing/verification |
| `SERVICE_TOKEN` | book-service, loan-service | Service-to-service auth |
| `USER_SERVICE_URL` | loan-service | http://user-service:8081 |
| `BOOK_SERVICE_URL` | loan-service | http://book-service:8082 |
| `LOAN_PERIOD_DAYS` | loan-service | default 14 |
| `DAILY_RATE` | loan-service | default 0.50 (GHS) |
| `MAX_ACTIVE_LOANS_PER_USER` | loan-service | default 5 |

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: library
      POSTGRES_PASSWORD: library
    volumes:
      - ./infra/init.sql:/docker-entrypoint-initdb.d/init.sql
      - pgdata:/var/lib/postgresql/data
    ports: ["5432:5432"]

  user-service:
    build: ./user-service
    environment:
      DB_URL: jdbc:postgresql://postgres:5432/users_db
      JWT_SECRET: ${JWT_SECRET}
    ports: ["8081:8081"]
    depends_on: [postgres]

  # book-service and loan-service follow same pattern

volumes:
  pgdata:
```

`init.sql` creates the three databases:
```sql
CREATE DATABASE users_db;
CREATE DATABASE books_db;
CREATE DATABASE loans_db;
```

---

## 10. Build Order (Lessons)

Each lesson is a deployable increment. Previous lessons' tests must still pass at the end of each one. Every lesson ends with a Postman test that verifies the new behavior.

### Lesson 1 — Infrastructure

**Deliverable:** Docker Compose runs Postgres with three empty databases. `JWT_SECRET` and `SERVICE_TOKEN` defined in `.env`.

**Acceptance:**
- `docker compose up -d postgres` succeeds.
- `psql -h localhost -U library -l` shows `users_db`, `books_db`, `loans_db`.

### Lesson 2 — user-service: register

**Deliverable:** user-service runs on :8081. `users` + `profiles` tables created via Flyway. `POST /api/auth/register` works.

**Acceptance:**
- Register a STUDENT member via Postman, get 201 with user_id and card_number.
- Row visible in DB with bcrypt-hashed password.
- Duplicate email returns 409.
- Invalid payload (missing email) returns 400.

### Lesson 3 — user-service: login + JWT

**Deliverable:** Spring Security configured. `POST /api/auth/login` returns JWT. `GET /api/users/me` works with bearer token. `JwtAuthFilter` validates tokens.

**Acceptance:**
- Login with correct password returns 200 + JWT.
- Login with wrong password returns 401.
- `GET /api/users/me` with valid token returns user + profile.
- `GET /api/users/me` without token returns 401.

### Lesson 4 — user-service: lookup + admin

**Deliverable:** `GET /api/users/{id}` works for any authenticated caller. `PATCH /api/users/{id}/status` works only for LIBRARIAN. Seed a librarian user via Flyway migration.

**Acceptance:**
- Librarian logs in, suspends a student, status flips to SUSPENDED.
- Non-librarian gets 403 on the suspend endpoint.
- `GET /api/users/{id}` returns user data for any authenticated caller.

### Lesson 5 — book-service: catalog

**Deliverable:** book-service on :8082 with its own `JwtAuthFilter` (copy from user-service). `books` + `book_copies` tables. `POST /api/books`, `GET /api/books`, `POST /api/books/{id}/copies` work.

**Acceptance:**
- Librarian adds a book and three copies, all visible via list endpoint.
- Non-librarian gets 403 on POST endpoints.
- `GET /api/books?available_only=true` filters correctly.

### Lesson 6 — book-service: copy ops + service token

**Deliverable:** `GET /api/copies/{id}` and `PATCH /api/copies/{id}/status` work. Service token filter allows requests with valid `X-Service-Token` even without JWT.

**Acceptance:**
- Librarian marks a copy LOST, status flips.
- Request with valid `X-Service-Token` and no JWT succeeds.
- Request with no JWT and no service token returns 401.

### Lesson 7 — loan-service: borrow

**Deliverable:** loan-service on :8083 with its own `JwtAuthFilter`. `loans` + `reservations` tables (reservations unused). `POST /api/loans` works end-to-end (validates user via user-service, validates + locks copy via book-service).

**Acceptance:**
- Student borrows an AVAILABLE copy, gets 201, due_date is 14 days out, copy is now LOANED.
- Borrowing a LOANED copy returns 409.
- Suspended user cannot borrow (403).
- User at 5 active loans cannot borrow (409).

### Lesson 8 — loan-service: return + fines

**Deliverable:** `POST /api/loans/{loan_id}/return` works. Computes fine, marks copy AVAILABLE.

**Acceptance:**
- Returning on time: fine_amount = 0.
- Returning 3 days late: fine_amount = 3 × DAILY_RATE.
- Copy is AVAILABLE again after return.
- Returning an already-returned loan returns 409.

### Lesson 9 — loan-service: queries

**Deliverable:** `GET /api/loans/me`, `GET /api/loans/{id}`, `GET /api/loans/overdue` work.

**Acceptance:**
- `GET /api/loans/me` returns only caller's loans.
- `GET /api/loans/overdue` returns only loans where status=BORROWED and due_date < now.
- Non-librarian gets 403 on overdue endpoint.

### Lesson 10 — End-to-end Postman collection

**Deliverable:** A Postman collection committed to `/postman` that runs through: register student → register librarian (seeded) → librarian adds book + 2 copies → student logs in → student borrows copy 1 → student returns copy 1 → student borrows copy 2 → (simulate late) librarian fetches overdue.

**Acceptance:** The collection runs green end-to-end via Postman Runner or Newman.

---

## 11. Phase 2 (Deferred)

Not in MVP. Listed here so the data model can accommodate them without rework:

- **Reservations.** Endpoints on loan-service. When a returned copy has a PENDING reservation for that book, mark the reservation FULFILLED and notify (email/in-app). Add `RESERVED` status to `book_copies`.
- **Renewals.** Extend `due_date` by `LOAN_PERIOD_DAYS` if no reservation is pending. Track renewal count to cap at e.g. 2.
- **Search/filter.** Full-text search on books (Postgres `tsvector`).
- **Reports.** Librarian dashboard: most-borrowed books, outstanding fines per user, overdue trends.
- **Notifications.** Due-date reminders (3 days before, on due date, daily after).
- **Shared module.** Extract `JwtAuthFilter`, JWT service, and common DTOs once the third copy starts hurting.
- **Real service auth.** Replace `X-Service-Token` with mTLS or short-lived service JWTs.

---

## 12. Coding Standards & Conventions

- Java 21, records for DTOs, sealed classes where they fit.
- Constructor injection (no field `@Autowired`).
- `@Transactional` on service methods that touch the DB, not on controllers or repositories.
- Global `@RestControllerAdvice` for exception handling.
- Logging: SLF4J. Log inter-service calls with correlation IDs (generate per request, propagate via `X-Correlation-Id` header).
- No business logic in controllers. Controllers only orchestrate.
- All UUIDs generated in code (`UUID.randomUUID()`), not by the database.
- Flyway migrations are append-only; never edit applied migrations.

---

## 13. Quick Reference: Inter-Service Call Map

```
Borrow (POST /api/loans):
  loan-service
    ├── GET user-service/api/users/{user_id}     (forward JWT)
    ├── GET book-service/api/copies/{copy_id}    (forward JWT)
    └── PATCH book-service/api/copies/{copy_id}/status  (X-Service-Token)

Return (POST /api/loans/{id}/return):
  loan-service
    └── PATCH book-service/api/copies/{copy_id}/status  (X-Service-Token)

All other endpoints are local to their service.
```

---

**End of spec.** Hand this to Claude Code lesson by lesson. Do not skip ahead — each lesson assumes the previous one is green.
