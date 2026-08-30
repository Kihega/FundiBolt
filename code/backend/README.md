# FundiBolt Backend

Express + TypeScript API, using Supabase (Postgres) and Upstash (Redis).

## Setup

    cd code/backend
    npm install
    cp .env.example .env   # then fill in real values (already done for local dev)
    npm run dev

## Health check

Once running, visit `http://localhost:4000/health` to confirm both the
database and Redis connections are working.

## Notes

- `DATABASE_URL` uses the Supabase **transaction pooler** (port 6543) for
  normal app queries — recommended for serverless/short-lived connections.
- `DATABASE_URL_DIRECT` (port 5432) is reserved for migrations or admin
  tasks only, not regular app traffic.
- `.env` is gitignored — never commit real credentials.
