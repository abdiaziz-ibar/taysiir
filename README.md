# School Fee Parent Debt Management System

Full-stack app for tracking **parents and their school-fee debt only** — there is no student entity anywhere in this system, by design.

Stack: React (Vite) + Tailwind + Recharts on the frontend, Node/Express + **Prisma** on the backend, **PostgreSQL** as the database.

```
Parent → Academic Year → Fee → Payments → Balance → Debt → Reports
```

---

## 1. PostgreSQL setup

Pick whichever is easiest for you — the app doesn't care which Postgres it talks to, only the connection string changes.

### Local Postgres (Windows/Mac/Linux)
1. Install PostgreSQL (https://www.postgresql.org/download/) and remember the password you set for the `postgres` user.
2. Create a database, e.g. with `psql` or pgAdmin:
   ```sql
   CREATE DATABASE school_fee_system;
   ```
3. Connection string:
   ```
   postgresql://postgres:yourpassword@localhost:5432/school_fee_system?schema=public
   ```

### Free hosted Postgres (for deployment)
Any of these work — just copy the connection string they give you into `DATABASE_URL`:
- **Neon** (https://neon.tech) — free tier, serverless Postgres, scales to zero. Good default pick for a Vercel backend.
- **Supabase** (https://supabase.com) — free tier, Postgres + extras. (This is the actual fit for "Supabase" now that the database is Postgres.)
- **Railway** — free/low-cost Postgres, pairs naturally if you also host the backend there.

---

## 2. Hosting — both frontend and backend on Vercel, for free

The backend is set up as a **Vercel Serverless Function** (`backend/api/index.js` wraps the same Express app the routes/controllers use), so `frontend/` and `backend/` deploy as **two separate Vercel projects from the same repo**, both on Vercel's free **Hobby** plan. Pair it with a free Neon/Supabase Postgres and the whole stack runs at $0/month.

Honest caveats about Vercel's free Hobby tier (current as of 2026):
- **Personal/non-commercial use only** per Vercel's terms — a paying school/business technically calls for Pro ($20/month/user), though plenty of small projects run on Hobby anyway.
- **60-second function timeout** on Hobby — every call here (login, payment, reports) is well under that.
- **1M invocations/month, 100GB bandwidth/month** on Hobby — far more than this app needs.
- Cold starts add roughly a second on the first request after idle time; Prisma's client is cached across warm invocations after that.
- Serverless + Postgres connection limits: Postgres has a hard cap on concurrent connections (often ~20-100 depending on plan), and each cold serverless invocation can open a new one. For light use this project is fine as-is; if you outgrow it, Neon/Supabase both offer a pooled connection string (PgBouncer) — just swap it into `DATABASE_URL`.

If you'd rather avoid serverless entirely, `backend/server.js` still works unchanged on **Render** or **Railway** (Option B below).

---

## 3. Backend deployment

### Option A — Vercel (free, both frontend and backend on Vercel)

1. Push the project to a GitHub repo.
2. On https://vercel.com → New Project → import the repo.
3. Root directory: `backend`
4. Framework preset: **Other** (plain serverless functions, no build step needed — `postinstall` already runs `prisma generate` automatically).
5. Environment variables (Project → Settings → Environment Variables):
   ```
   DATABASE_URL=<your Postgres connection string>
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CLIENT_ORIGIN=https://your-frontend.vercel.app
   ```
6. Deploy. Vercel gives you a URL like `https://school-fee-backend.vercel.app` — every request to `/api/...` is handled by `backend/api/index.js`.
7. **Before first use**, run the migration and seed once, pointed at the same database (from your own machine — Vercel functions aren't meant for one-off setup scripts):
   ```bash
   cd backend
   cp .env.example .env     # fill in DATABASE_URL
   npm install
   npm run prisma:migrate    # creates the tables
   npm run seed               # creates the first admin login + current academic year
   ```
   This creates:
   - Admin login → username: `admin`, password: `Admin@123` (change it in Settings after first login)
   - The current academic year (e.g. `2026-2027`, active)

### Option B — Render or Railway (traditional always-on server)

1. Push the `backend/` folder to a GitHub repo (Render/Railway let you set a root directory).
2. Render: New → Web Service → connect the repo → Root directory `backend` → Build command `npm install` → Start command `npm start`.
3. Same environment variables as Option A above.
4. Run `npm run prisma:migrate` and `npm run seed` once (locally, pointed at the same database, or via Render's shell).

Both options use the exact same `backend/` code — `server.js` (long-lived process) for Option B, `api/index.js` (serverless) for Option A.

---

## 4. Frontend deployment (Vercel)

1. Push `frontend/` to GitHub (or same repo, different root directory).
2. On https://vercel.com → New Project → import the repo.
3. Root directory: `frontend`
4. Framework preset: Vite (auto-detected)
5. Build command: `npm run build` · Output directory: `dist` (defaults are correct)
6. Environment variable:
   ```
   VITE_API_URL=https://school-fee-backend.vercel.app/api
   ```
   (your actual backend URL + `/api` — Vercel backend from Option A, or Render/Railway URL from Option B)
7. Deploy. Vercel gives you a URL like `https://school-fee-frontend.vercel.app`.
8. Go back to your backend's `CLIENT_ORIGIN` env var, set it to this exact frontend URL, and redeploy the backend so CORS allows it.

---

## 5. Local development (Windows/Mac/Linux, no cloud database needed)

Backend:
```bash
cd backend
cp .env.example .env        # DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/school_fee_system?schema=public
npm install                   # also runs "prisma generate" automatically
npm run prisma:migrate        # creates the tables in your local Postgres — first time only
npm run seed                   # creates admin + current academic year — first time only
npm run dev                     # http://localhost:5000
```

Frontend:
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                     # http://localhost:5173
```

Login with `admin` / `Admin@123`, then change the password from Dejinta (Settings).

Useful extra command: `npm run prisma:studio` (inside `backend/`) opens a local GUI at http://localhost:5555 to browse/edit the Postgres tables directly.

---

## 6. What's implemented

- JWT auth, bcrypt password hashing, role-based routes (admin/staff)
- Parent CRUD, search/filter/sort
- Academic Year CRUD + activate/deactivate (Sep → Aug cycle), each year has its own Fee records
- Fee per parent per academic year, auto-recalculated balance/status
- Payments with automatic balance updates (wrapped in a Prisma `$transaction` so the payment and the fee balance update atomically), overpayment guard (optional override), auto receipt numbers (`REC-2026-00001`)
- Printable receipt per payment
- Debt list (balance > 0), Dashboard with live stats + monthly chart (Recharts)
- Monthly report, Yearly report (with collection rate), Debts report — all computed from the database, no static/dummy data
- Full Somali-language interface
- No student entity anywhere in the system

## 7. Project structure

```
backend/
  app.js                Express app (routes + middleware), no listen — shared by both entry points
  server.js             entry point for Render/Railway/local (long-lived process)
  api/index.js          entry point for Vercel (serverless function)
  vercel.json           rewrites so /api/* reaches api/index.js
  lib/prisma.js          Prisma client singleton (reused across hot-reloads / warm invocations)
  prisma/schema.prisma   database schema: User, Parent, AcademicYear, Fee, Payment
  prisma/seed.js          creates the first admin user + current academic year
  middleware/            auth (JWT), errorHandler (maps Prisma error codes to friendly messages)
  controllers/            business logic per resource
  routes/                  REST endpoints
  utils/                    token, receipt number, response serializers

frontend/
  src/
    api/axios.js         axios instance with JWT interceptor
    context/               AuthContext, AcademicYearContext (global year selector)
    components/           Sidebar, Topbar, Layout, ProtectedRoute
    pages/                  one file per route from the spec
    utils/format.js        money/date/status formatting helpers
```

**Note on the database change:** the frontend needed zero changes — it only talks to the same REST API (`/api/parents`, `/api/payments`, etc.) with the same JSON shapes as before. `backend/utils/serialize.js` reshapes Prisma's rows (which use `id`) back into the `_id` / populated-object shape the React app already expects, so switching the database underneath never touched the UI.
