# FundiBolt Admin Dashboard

Next.js (TypeScript) admin dashboard for FundiBolt, deployed on Vercel.

## Purpose

Used by administrators to:
- Review and approve/reject pending fundi registrations
- Manage service categories
- Monitor users and bookings
- Monitor fundi subscription status and revenue
- Handle disputes
- View basic platform analytics

## Setup

    cd code/admin
    npm install
    cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
    npm run dev

Runs by default at `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FundiBolt backend API (Render in production) |

## Deployment

Connected to Vercel via GitHub. Vercel project root directory should be
set to `code/admin`. Every merge to `main` triggers a production deploy;
PRs get automatic preview deployments.

## Notes

- `.env.local` is gitignored — never commit real values.
- This dashboard talks only to the backend API — it does not connect to
  Supabase or Redis directly.
