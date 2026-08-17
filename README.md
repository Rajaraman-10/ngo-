# NGO Transparency Platform

A public-transparency NGO website: every donation and expense is published with
a unique transaction ID and, for expenses, a supporting invoice — gated behind
a create → submit → approve → public workflow.

## Structure

```
backend/    Django + DRF API (accounts, core, finance, audit_log, documents)
frontend/   React (Vite) public site + member dashboard
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

Defaults to SQLite. To use MySQL, set `USE_MYSQL=true` and the `DB_*` vars in
`.env`, and `pip install mysqlclient`.

Roles (`accounts.Role`): `admin`, `finance_manager`, `project_manager`,
`accountant`, `volunteer`, `auditor`. Admins bypass all role checks.

Expense lifecycle: `draft` → (invoice required) → `pending_approval` →
`approved` (visible on the public ledger) or `rejected`. Records are never
deleted — only `voided` with a reason, preserving history. Every state change
is written to `audit_log.AuditLog`.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Public pages (no login): Home, Projects, Transparency dashboard, Verify
Transaction. `/login` + `/dashboard` are for members (expense/donation entry
and approvals), gated by JWT + role.

## API surface

- `POST /api/auth/token/`, `POST /api/auth/token/refresh/`
- `/api/accounts/users/`, `/api/accounts/users/me/`
- `/api/core/projects/`, `/api/core/beneficiaries/`
- `/api/finance/donations/`, `/api/finance/expenses/`, `/api/finance/invoices/`
- `/api/finance/expenses/{id}/submit|approve|reject|void/`
- `/api/finance/summary/` — public transparency totals
- `/api/finance/verify/{transaction_id}/` — public transaction lookup
- `/api/audit/audit-logs/` — auditor/admin read-only
- `/api/documents/documents/` — public reports/registration docs
