# NGO Transparency Platform

A full NGO website and platform built around one principle: every donation and
expense is published with a unique transaction ID and, for expenses, a
supporting invoice — gated behind a create → submit → approve → public
workflow. Donors can trace any transaction ID to see what it actually funded.

## Structure

```
backend/    Django + DRF API (accounts, core, finance, audit_log, documents)
frontend/   React (Vite) public site + member dashboard + donor portal
```

## Backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate        # Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

DB priority: `DATABASE_URL` (Render Postgres or any managed DB) > `USE_MYSQL=true`
with `DB_*` vars (self-hosted MySQL, needs `pip install mysqlclient`) > SQLite
for local dev with neither set.

Roles (`accounts.Role`): `admin`, `finance_manager`, `project_manager`,
`accountant`, `volunteer`, `auditor`, `donor`. Admins bypass all role checks.
Donors self-register at `/register` — no other role can be self-assigned
(the registration endpoint hardcodes `role=donor` server-side).

Expense lifecycle: `draft` → (invoice required) → `pending_approval` →
`approved` (visible on the public ledger) or `rejected`, with a second
approval required above ₹10,000. Records are never deleted — only `voided`
with a reason, preserving history. Every state change is written to
`audit_log.AuditLog` (internal-only — never exposed on the public site).

### Payments

The Donate flow is fully wired to Razorpay (order creation + signature
verification) but ships with blank keys — `RAZORPAY_KEY_ID` /
`RAZORPAY_KEY_SECRET` in `.env`. Until they're set, `/api/finance/donate/config/`
reports `configured: false` and the Donate page shows an honest "not
configured yet" message instead of a broken checkout.

### Email

`EMAIL_BACKEND` defaults to Django's console backend (prints to the runserver
log) — inquiry and contact-form submissions really do call `send_mail`, they
just have nowhere to deliver to until real SMTP is configured. Donor
registration has no email verification step for the same reason.

### Explicitly not built this pass

- Real cloud object storage (S3/GCS) — files stay on local `MEDIA_ROOT`. Swap
  in `django-storages` when ready.
- Production email delivery, OTP verification, 2FA.
- Formal volunteer task **assignment** — Activities are self-serve (any
  volunteer/project manager can log one for any project), not assigned by an
  admin.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Public pages (no login): Home, About, Our Mission (+ per-pillar detail pages),
Projects (+ detail pages), Transparency Center (tabbed: funds received /
expenses / invoices / reports / audit), Donate, Our Impact, Impact Updates,
Stories of Change, Get Involved, News, Reports & Documents, Contact, Track
Your Contribution (transaction lookup).

`/register` + `/login` are shared by donors and staff (same JWT flow) — donors
land on `/my-impact` (their own donation history + project impact, replacing
the old localStorage-only guest tracker when logged in), staff land on
`/dashboard`, where visible tabs depend on role (Expenses/Donations for
finance roles, Projects/Activities/Impact Updates/Stories for project
managers and volunteers, Members/Inquiries/Audit Log for admins).

## Deployment

Backend on Render, frontend on Vercel.

- **Backend (Render):** set `DATABASE_URL` (auto-populated if you attach a
  Render Postgres instance) so it isn't running on ephemeral SQLite. Build
  command should run `migrate` and then `bootstrap_admin` (idempotent —
  creates/updates the admin superuser from `ADMIN_USERNAME` / `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` env vars), since Render's free plan has no Shell access to
  run `createsuperuser` interactively:
  ```bash
  python manage.py migrate && python manage.py bootstrap_admin
  ```
- **Frontend (Vercel):** point it at `frontend/`, set `VITE_API_BASE` to the
  deployed backend's `/api` URL (defaults to `http://127.0.0.1:8000/api` for
  local dev). A no-op commit (e.g. bumping the version in `package.json`) is a
  quick way to force a fresh deploy if Vercel's cache is stale.

## API surface

- `POST /api/auth/token/`, `POST /api/auth/token/refresh/`
- `POST /api/accounts/register/` — public donor self-registration
- `/api/accounts/users/`, `/api/accounts/users/me/`
- `/api/core/projects/`, `/api/core/beneficiaries/`, `/api/core/missions/`,
  `/api/core/activities/`, `/api/core/impact-updates/`, `/api/core/stories/`,
  `/api/core/news/`, `/api/core/inquiries/`, `/api/core/newsletter/`
- `/api/finance/donations/`, `/api/finance/expenses/`, `/api/finance/invoices/`
  — visibility of full financial detail vs. the public-shaped record is
  role-gated (`CanViewFinancials`: admin/finance_manager/accountant/auditor/
  project_manager), not just "logged in or not"
- `/api/finance/expenses/{id}/submit|approve|reject|void/`
- `/api/finance/summary/` — public transparency totals, by mission and by pillar
- `/api/finance/verify/{transaction_id}/` — public transaction lookup; for
  donations, includes the funded project's real progress and recent expenses
- `/api/finance/my-donations/` — a logged-in donor's own contribution history
- `/api/finance/donate/config|create-order|verify/` — Razorpay sandbox flow
- `/api/audit/audit-logs/` — auditor/admin read-only, never public
- `/api/documents/documents/` — public reports/registration docs
