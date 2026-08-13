# KNUST Library System — Team Overview

Read this before you're in a room answering questions about the project. It covers what the system does, how it's built, why certain decisions were made, and a Q&A section for the things people are most likely to ask.

**Live demo:** https://frontend-production-3c3f.up.railway.app
**Librarian test login:** `librarian@library.com` / `librarian123`

---

## 1. What it is

A self-service library management system for KNUST — students, staff, and external members can register, browse the catalogue by college → department → course of study, borrow and return books themselves (no librarian approval step), and track fines. Librarians get a dashboard for adding books/copies, bulk-importing catalogues from spreadsheets, managing members, and pulling downloadable reports.

## 2. Architecture

Three independent Spring Boot services plus a React frontend, all talking over REST:

| Service | Port | Owns |
|---|---|---|
| **user-service** | 8081 | Accounts, auth (JWT), profiles |
| **book-service** | 8082 | Colleges/departments/courses, books, copies, shelf assignment |
| **loan-service** | 8083 | Borrowing, returns, fines, reports |
| **frontend** | — | React (Vite), talks to all three via REST |

**Why split into three services** instead of one monolith: each owns its own database and can be deployed/scaled independently. It's a deliberate microservice exercise, not because the app is large enough to need it.

- **Stack:** Java 21, Spring Boot 3.x, Postgres (one instance, three logical databases: `users_db`, `books_db`, `loans_db`), Flyway migrations, JWT auth shared across services via a common secret, plus an internal `SERVICE_TOKEN` for service-to-service calls (e.g. loan-service checking book-service when creating a loan).
- **Frontend:** React + Vite, no UI component library — all screens are hand-built.
- **Deployed on:** Railway (all 4 services + Postgres in one project). Auto-deploys on push to `main`.

## 3. Catalogue structure

Books are organized in a hierarchy, seeded with a representative (not exhaustive) slice of real KNUST structure:

- **6 colleges** (e.g. College of Science, College of Engineering, College of Health Sciences…)
- **14 departments**, each with a `shelf_prefix` (e.g. Computer Science → `CSC`, Mathematics → `MATH`)
- **14 courses of study** (e.g. "BSc. Computer Science"), each belonging to one department

A book optionally belongs to one course. Books added without a course (e.g. via spreadsheet import with no course match) fall back to a generic `GEN` shelf prefix and stay uncategorized in the browse hierarchy until edited.

## 4. Copies: hardcopy vs softcopy

Every book can have multiple physical/digital copies:

- **HARDCOPY** — a physical book. Gets an auto-assigned shelf location: `{department_shelf_prefix}-{shelf_index}`, where a new shelf starts every 40 copies (configurable via `SHELF_CAPACITY`, default 40). No librarian manually types a location.
- **SOFTCOPY** — digital access, no shelf location (`location = null`).

## 5. Core member workflow

1. **Register** — choose member type (Student / Staff / External), which drives validation:
   - Student: email must end `@st.knust.edu.gh`, index number (`matric_no`) must be exactly 7 digits
   - Staff: email must end `@knust.edu.gh`, must provide a staff ID
   - External: no domain restriction
   - A library card number is generated automatically on registration.
2. **Browse** — drill down College → Department → Course → book list, or search by title/author within a course.
3. **Borrow** — self-service, one click. Loan is created as `BORROWED` immediately and the copy flips to `LOANED` in the same call — no approval step. Max **5 active loans per member**, loan period **14 days**.
4. **Return** — self-service. For hardcopy loans, the UI now requires a second explicit "I've dropped it off" confirmation (with a reminder to physically return it to the desk first) before the loan is marked `RETURNED` and the copy goes back to `AVAILABLE`. Softcopy returns are one click (nothing physical to hand back).
5. **Fines** — GH₵0.50/day late, computed at return time based on days past the due date; shown as a live running estimate on overdue active loans.
6. **Profile** — view library card, email, member ID, member type; phone number is now editable in place (email and index/staff ID are not editable — those stay locked to what was verified at registration).

## 6. Librarian tools

- **Dashboard** — overview + links into all librarian screens.
- **Add book / add copy** — manual single-item entry, with course selection via the same College→Department→Course cascade.
- **Bulk import (spreadsheet)** — upload an `.xlsx` with `isbn, title, author, copies` and an optional `course` column. Course names are matched case-insensitively against the real catalogue; unmatched or blank course values still import, just without a course link (shown clearly in the preview before import).
- **Reports** (all downloadable as `.xlsx`), 6 tabs: **Borrowed**, **Overdue**, **Returned history**, **Fines** (charged vs. currently accruing), **Inventory** (per-book total/available/on-loan/utilization%), **Most borrowed**.
- **Members** — view member accounts and status.
- **Overdue** — dedicated view of all currently overdue loans across all members.

## 7. Known limitations / deliberate design decisions

Be ready to say these are *decisions*, not oversights, if asked:

- **No borrow/return approval workflow.** An earlier version had a PENDING → approve/reject flow; it was deliberately removed in favor of pure self-service. Trade-off: faster and simpler, but nothing on the backend stops a student from marking a hardcopy "returned" without physically bringing it back — the UI now discourages this with a confirmation step, but there's no enforcement.
- **No department/college link on student profiles.** Reports can slice by book/course/department (book-side data), but not "which department's students borrow the most" (no such field exists on `Profile` yet). Would need a schema change if requested.
- **Course seed data is representative, not exhaustive.** 6 colleges / 14 departments / 14 courses — a realistic slice of KNUST's real structure, not the full university.

## 8. Anticipated Q&A

**Q: Why don't librarians approve loans anymore?**
A: The original design had an approval queue; it was removed after lecturer feedback in favor of instant self-service, matching how most modern library systems (and the KNUST library itself) actually work day-to-day.

**Q: What stops someone from "returning" a book without giving it back?**
A: Nothing at the database level for hardcopies — this is a known trade-off of the self-service model. The UI adds friction (a confirm step reminding them to drop it off first), but enforcement would require reintroducing a librarian-side confirmation step, which was intentionally scoped out.

**Q: How is the shelf location decided?**
A: Automatically. Each department has a shelf prefix (e.g. `CSC`); shelves fill up to a configurable capacity (40 copies) before the next shelf number opens. A librarian never types a location by hand.

**Q: What's the difference between a hardcopy and softcopy loan?**
A: Hardcopy is a real physical book with a shelf location; softcopy is digital access with no shelf. Borrowing/returning both are self-service, but only hardcopy needs the "did you actually bring it back" confirmation.

**Q: How many books can one person borrow at once?**
A: 5 active loans, 14-day loan period, GH₵0.50/day fine after the due date.

**Q: Why three separate services instead of one app?**
A: Each owns a clear responsibility (accounts, catalogue, loans) and its own database — a deliberate microservice split so each piece can be reasoned about, deployed, and scaled independently.

**Q: Is this actually live somewhere, or just running locally?**
A: Live on Railway — see the link at the top of this doc. All three backend services plus the frontend auto-deploy from `main`.

**Q: How do you add a lot of books at once?**
A: Librarians can upload a spreadsheet (isbn/title/author/copies, optional course), rather than adding books one at a time.

**Q: Can a student edit their email or index number after registering?**
A: No — those are locked after registration since they're the fields used to verify identity/eligibility. Only phone number is self-editable from the profile page.
