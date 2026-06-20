# Frontend — Build Spec for Claude Code

**Owner:** Mansur Alidu
**Status:** ready for implementation
**Build agent:** Claude Code
**Target stack:** Vite + React + React Router, talking to the existing Spring Boot backend (3 services)

---

## 1. Context

The backend is **already built and tested** — all three Spring Boot services (`user-service` :8081, `book-service` :8082, `loan-service` :8083) are running locally via Docker Compose and verified end-to-end with a Postman collection (Lessons 1–10 of the backend spec, all green).

A Claude Design prototype was built separately for the frontend. It is **not** a usable codebase — it's a single-component React app written in Claude Design's proprietary template syntax (`<x-dc>`, `<sc-if>`, `<sc-for>`, `{{ }}` interpolation), with all data seeded inline. Your job is to **port it** into a real Vite + React app that calls the real backend instead of using mock data.

The prototype is the visual + interaction reference. The backend spec is the data contract. Both are inputs you must read before writing code.

---

## 2. Inputs

Both files live in the project's `docs/` directory:

| File | What it is | How to use it |
|---|---|---|
| `docs/library-management-system-spec.md` | Backend spec — all API contracts in §6, auth flow in §7, config in §9 | **Authoritative** for endpoint paths, payloads, and response shapes. Always match this, never the prototype's seed data shape. |
| `docs/frontend-prototype/KNUST_Library_dc.html` | Claude Design prototype | Reference for screens, layout, styling, and interaction logic. The `<script type="text/x-dc">` block (~line 625 onward) is a clean React class component — state shape, methods, business logic, screen routing all worked out. Treat that script as a near-direct template for the real React app. |
| `docs/frontend-prototype/support.js` | Claude Design runtime | Do not use. Reference only if you need to understand a directive. |

---

## 3. Stack

| Concern | Choice |
|---|---|
| Build tool | Vite |
| Framework | React 18, function components + hooks (NOT class components, despite the prototype using a class) |
| Routing | React Router 6 |
| HTTP | `fetch` wrapped in a small client (no axios) |
| State | React Context for auth; component state / lifted state for the rest. No Redux, no Zustand. |
| Styling | **Your call.** Either Tailwind, or plain CSS with the prototype's design tokens (see §4). Pick whichever is faster to ship — the prototype's aesthetic must be preserved either way. |
| Token storage | `localStorage` for the JWT. Acceptable for local dev. |
| Language | JavaScript (not TypeScript) — keep the project small. |

No tests in MVP. No Storybook. No formatter beyond Vite defaults.

---

## 4. Design tokens (extract from prototype)

The prototype defines these as CSS custom properties on the root container (line 26 of the HTML). Lift them into your global stylesheet (or Tailwind theme config), exactly as named:

```
--bg: #f5f2ea
--surface: #fffefb
--surface-2: #faf7f0
--border: #e8e2d5
--border-strong: #dad2c1
--text: #2a2620
--muted: #766e60
--faint: #9b9384
--accent: #b0782a
--accent-soft: #f6edda
--accent-text: #7c531a
--ok-bg: #e6f0e9
--ok-fg: #2f6b48
--bad-bg: #f6e7e3
--bad-fg: #a83c2b
```

**Primary color** — the prototype has a `theme` prop with `forest` and `navy` options. Default to **forest** (deep green) for the real app. Pick a coherent triplet (`--primary`, `--primary-deep`, `--primary-soft`).

**Fonts:** Newsreader (serif) for headings via Google Fonts; system UI sans for body — matches the prototype.

---

## 5. Backend integration

### 5.1 Service URLs

In dev, use Vite's proxy so the frontend calls `/api/...` and Vite forwards to the right service. Configure in `vite.config.js`:

```js
server: {
  proxy: {
    '/api/auth':  'http://localhost:8081',  // user-service
    '/api/users': 'http://localhost:8081',
    '/api/books': 'http://localhost:8082',  // book-service
    '/api/copies':'http://localhost:8082',
    '/api/loans': 'http://localhost:8083',  // loan-service
  }
}
```

Frontend code only ever uses relative paths like `fetch('/api/books')`. No hardcoded `http://localhost:808x` URLs anywhere in `src/`.

### 5.2 CORS — backend change required

For the Vite proxy approach above, CORS isn't strictly needed in dev (the browser sees same-origin). **But** add CORS config to all three Spring Boot services anyway, because (a) you'll want it for non-proxy debugging, and (b) it's needed once deployed.

In each service, add a `CorsConfig`:

```java
@Configuration
public class CorsConfig {
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:5173"));
    cfg.setAllowedMethods(List.of("GET","POST","PATCH","PUT","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization"));
    cfg.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
```

And wire it into `SecurityConfig` with `.cors(Customizer.withDefaults())`. Apply to all three services. Make `ALLOWED_ORIGIN` an env var with default `http://localhost:5173` so it's not hardcoded.

### 5.3 Auth flow

1. POST `/api/auth/login` with `{email, password}` → response includes `token`, `user_id`, `role`, `member_type`, `full_name`.
2. Store `token` in `localStorage` under key `library_jwt`. Also cache `{user_id, role, member_type, full_name}` under `library_user`.
3. Every authenticated `fetch` attaches `Authorization: Bearer <token>`.
4. On any 401 from the API, clear storage and route to `/login`.
5. Logout = clear storage + route to `/login`.

### 5.4 API surface (from backend spec §6)

| Screen | Endpoint(s) |
|---|---|
| Register | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Profile | `GET /api/users/me` |
| Catalog | `GET /api/books?title=&category=&available_only=&page=&size=` |
| Book detail | `GET /api/books/{book_id}` |
| Borrow | `POST /api/loans` with `{copy_id}` |
| My Loans | `GET /api/loans/me` |
| Return | `POST /api/loans/{loan_id}/return` |
| Librarian: Add book | `POST /api/books` |
| Librarian: Add copy | `POST /api/books/{book_id}/copies` |
| Librarian: Overdue | `GET /api/loans/overdue` |
| Librarian: Suspend / activate | `PATCH /api/users/{user_id}/status` |
| Librarian: Member lookup | `GET /api/users/{user_id}` |

**Important:** the prototype's seed data shape (e.g. `book.copies[].barcode`) may differ slightly from the real API response shape (e.g. `book.copies[].copy_id` + `book.copies[].barcode`). Always match the real API — adapt the components, not the API.

### 5.5 Error handling

Map common backend responses to user-visible messages:

| Status | Where | Message |
|---|---|---|
| 401 | any | "Session expired. Please sign in." → route to login |
| 403 (suspended) | borrow | "Your account is suspended. Please visit the library desk." |
| 403 (role) | librarian endpoints | "You don't have permission for that." |
| 409 (copy not available) | borrow | "This copy was just borrowed by someone else. Try another copy." |
| 409 (loan limit) | borrow | "You've reached your loan limit. Return a book before borrowing." |
| 5xx | any | Toast: "Something went wrong. Try again in a moment." |
| Network error | any | Toast: "Can't reach the library. Check your connection." |

Use the prototype's toast pattern (the `<sc-if value="{{ toast }}">` block at top of the template) — port it as a reusable `<Toast>` component driven by context or simple state.

---

## 6. Project layout

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx                # router + auth provider
    ├── styles.css             # global tokens, base styles
    ├── lib/
    │   ├── api.js             # fetch wrapper (attaches JWT, handles 401)
    │   └── auth.jsx           # AuthContext, useAuth() hook
    ├── components/
    │   ├── Button.jsx
    │   ├── Input.jsx
    │   ├── Badge.jsx          # status badges (AVAILABLE/LOANED/LOST/etc.)
    │   ├── Card.jsx
    │   ├── Toast.jsx
    │   └── AppChrome.jsx      # top nav (member + librarian variants)
    └── screens/
        ├── Login.jsx
        ├── Register.jsx
        ├── Catalog.jsx
        ├── BookDetail.jsx
        ├── MyLoans.jsx
        ├── Profile.jsx
        ├── LibrarianDashboard.jsx
        ├── AddBook.jsx
        ├── AddCopy.jsx
        ├── Overdue.jsx
        └── Members.jsx
```

---

## 7. Routing

```
/login                      → Login (public)
/register                   → Register (public)

/                           → redirect: member → /catalog, librarian → /dashboard
/catalog                    → Catalog (member)
/books/:id                  → BookDetail (member)
/loans                      → MyLoans (member)
/profile                    → Profile (member)

/dashboard                  → LibrarianDashboard
/dashboard/books/new        → AddBook
/dashboard/books/:id/copies → AddCopy
/dashboard/overdue          → Overdue
/dashboard/members          → Members (search + manage)
```

Member routes require `role !== 'LIBRARIAN'`. Librarian routes require `role === 'LIBRARIAN'`. Unauthenticated → `/login`.

---

## 8. Build order (lessons)

Each lesson ends green before the next starts. Run `npm run dev` after each one to verify.

### Lesson 1 — Scaffold + tokens + router skeleton

- `npm create vite@latest frontend -- --template react`
- Install `react-router-dom`
- Set up `vite.config.js` with the proxy from §5.1
- Create `styles.css` with the design tokens from §4, body font setup, base resets matching the prototype (lines 14–23)
- Stub all 11 screens as empty components returning their name
- Wire `App.jsx` with React Router covering all routes in §7
- **Acceptance:** `npm run dev` shows the scaffold, navigation between stub routes works, design tokens visible in DevTools.

### Lesson 2 — API client + auth context

- `src/lib/api.js`: `apiFetch(path, options)` that attaches `Authorization: Bearer <token>` from localStorage if present, parses JSON response, throws on non-2xx with `{status, body}` for the caller to handle, redirects to `/login` on 401.
- `src/lib/auth.jsx`: `AuthProvider`, `useAuth()` exposing `{user, token, login, logout, isAuthenticated, isLibrarian}`. `login(email, password)` calls `POST /api/auth/login`, stores token + user in localStorage, updates context.
- Add a `<ProtectedRoute role="member" | "librarian">` wrapper component.
- **Acceptance:** in the browser console, `await window.testLogin('email','pwd')` (temporary helper) succeeds against the backend and stores the JWT.

### Lesson 3 — Login + Register + CORS

- Port the Login screen from the prototype (lines ~70–180) using real fonts and tokens.
- Port the Register screen — fields: full_name, email, phone, member_type (Student/Staff/External radio), conditional matric_no (Student) or staff_id (Staff), password, confirm password. Submit to `POST /api/auth/register`, then auto-login.
- Update all 3 backend services with CORS config (§5.2).
- After successful login: librarian → `/dashboard`, member → `/catalog`.
- **Acceptance:** Register a new student via the form → land on Catalog (empty until L4). Log out, log back in. Log in as the seeded librarian → land on Dashboard.

### Lesson 4 — Member: Catalog + Book detail + Borrow

- Catalog screen (prototype ~lines 240–340): search input, category filter chips, "available only" toggle, book cards in a grid with title/author/category/availability. Backed by `GET /api/books`.
- Book detail screen (prototype ~lines 345–440): book metadata, list of copies with status badges + shelf location, "Borrow" button on AVAILABLE copies. Backed by `GET /api/books/{id}`.
- Borrow flow: click Borrow on an AVAILABLE copy → `POST /api/loans` with `{copy_id}` → toast "Borrowed. Due in 14 days." → refresh book detail.
- Handle 409 (copy taken), 403 (suspended / limit) with mapped messages from §5.5.
- **Acceptance:** Browse catalog, filter by category, search by title, open a book, borrow a copy, see the copy flip to LOANED.

### Lesson 5 — Member: My Loans + Return + Profile

- My Loans (prototype ~lines 445–520): tabs Active / Past. Each card shows book title, borrow date, due date, days remaining or "X days overdue" in red. Live fine estimate shown only for overdue. "Return" button on Active. Backed by `GET /api/loans/me`.
- Return flow: click Return → `POST /api/loans/{loan_id}/return` → toast with fine amount (or "Returned on time. No fine.") → loan moves to Past tab.
- Profile screen (prototype ~lines 525–580): member info, card number displayed prominently. Backed by `GET /api/users/me`.
- **Acceptance:** Borrow a book → see it in Active tab → return it → see it in Past tab with fine info → profile shows real data.

### Lesson 6 — Librarian: Dashboard + Add Book + Add Copy

- Dashboard (prototype ~lines 750–820): stat tiles (total books, active loans, overdue count, suspended members), quick actions (Add Book, View Overdue). Stats can be computed on the client from existing endpoints (`GET /api/books`, `GET /api/loans/overdue`, `GET /api/users` if exposed — otherwise show fewer stats).
- Add Book (prototype ~lines 825–890): form for ISBN, title, author, category. Submit → `POST /api/books` → success toast → route to Add Copy for the new book.
- Add Copy (prototype ~lines 895–950): for a selected book, form for barcode + shelf location. Submit → `POST /api/books/{book_id}/copies` → toast → option to add another or finish.
- **Acceptance:** As librarian, add a new book, then add 2 copies. Switch to member view (different login), see the new book in catalog.

### Lesson 7 — Librarian: Overdue + Members

- Overdue (prototype ~lines 955–1000): table of overdue loans with member name, book title, days overdue. Backed by `GET /api/loans/overdue`. Member name comes from per-row `GET /api/users/{user_id}` (cache responses to avoid re-fetching).
- Members (prototype ~lines 1005–1040): search input → look up by user_id or scan list. Member detail card: profile info, status badge, Suspend / Reactivate button → `PATCH /api/users/{user_id}/status`.
- **Acceptance:** As librarian, see overdue list with real members. Suspend a member. Log in as that member → can't borrow → see suspended message. Reactivate. Borrow works again.

---

## 9. Conventions

- Function components + hooks only. No class components. (The prototype's class is reference, not template.)
- Constructor injection equivalent for React: pass props, use context for auth.
- One screen per file. Components <250 lines or split.
- All API calls go through `apiFetch` from `src/lib/api.js`. Never raw `fetch` in components.
- Date formatting: native `Intl.DateTimeFormat('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})` — matches prototype's "19 Jun 2026" style.
- Money: prefix with `GH₵` and `Number(n).toFixed(2)`. Use the prototype's `money()` helper as the pattern.
- No optimistic updates in MVP. Wait for the server response, then update UI.

---

## 10. Out of scope (do not build)

- Reservations, renewals, search by author, full-text search — Phase 2.
- Reports, analytics, charts.
- Email notifications.
- Dark mode.
- Mobile-specific layouts beyond responsive flexbox/grid.
- Service worker, offline mode.
- Animations beyond what the prototype shows (toast slide-in, fade-up on cards is fine).
- Tests (manual smoke via the lesson acceptance steps is enough for MVP).
- A user-deletion flow (not in the backend spec).

---

## 11. End state

When all 7 lessons are green, the following demo flow must run cleanly with all three backend services up:

1. Open `http://localhost:5173/register`. Create a Student member.
2. Get bounced to Catalog. Filter by Computer Science. Open "Clean Code". Click Borrow on an AVAILABLE copy.
3. Toast confirms. Go to My Loans → see the active loan with the correct due date.
4. Click Return. Toast confirms (no fine, since just borrowed). Loan moves to Past tab.
5. Log out. Log in as the seeded librarian.
6. Go to Add Book. Add a new book + 2 copies.
7. Log out. Log in as the student. See the new book in catalog.
8. (Simulated late return: librarian directly updates a loan's `borrow_date` in DB to 30 days ago.) Go to Overdue → see the loan listed.
9. Go to Members → find the student → Suspend.
10. Log out. Log in as the student. Try to borrow → blocked with the suspended message.

When that all works without console errors and without manual workarounds, the frontend MVP is done.

---

**End of spec.** Read sections 1–7 in full before starting Lesson 1. Lessons must be executed in order, and each previous lesson's acceptance must still pass at the end of the next one.
