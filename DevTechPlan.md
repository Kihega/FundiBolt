# FundiBolt — Development Lifecycle Plan
### Development → Testing → Deployment → Monitoring → Maintenance

**Note:** This document reflects the current planned tech stack and feature set. Both are **subject to change** as the project evolves, as new constraints are discovered, or as better tools/approaches emerge. Nothing here is locked in stone — it is a working baseline to build from.

---

## 1. Full Tech Stack (Current)

| Layer | Choice | Notes |
|---|---|---|
| **Mobile App** | React Native (Expo) + TypeScript | Chosen for Termux/Kali compatibility via EAS cloud builds |
| **Backend API** | Node.js + Express + TypeScript | Shared types with mobile app where useful |
| **Database** | PostgreSQL (hosted on **Supabase**) | Free tier; note auto-pause after inactivity |
| **Cache / Idempotency** | Redis (hosted on **Upstash**) | Serverless, usage-based free tier |
| **Backend Hosting** | **Render**, deployed via GitHub | Auto-deploy triggered after tests pass |
| **Admin Web Dashboard** | Hosted on **Vercel** | Separate deployment pipeline from backend/mobile |
| **Payments (subscriptions)** | ClickPesa (collection API) | Sandbox first, production after BRELA registration |
| **Ads** | Google AdMob (`react-native-google-mobile-ads`) | Via Expo config plugin |
| **Push Notifications** | Expo Push Notifications | Built into Expo, no separate service |
| **Testing** | Jest (unit/integration) + Postman (API testing) | Must pass before auto-deployment triggers |
| **CI/CD** | GitHub Actions | Runs tests, gates deployment to Render/Vercel |
| **Error Monitoring** | Sentry | Backend + mobile app |
| **Uptime Monitoring** | UptimeRobot | Alerts if backend goes down |
| **Version Control** | Git + GitHub | Source of truth, triggers all pipelines |

> Every item above may be swapped out later without changing the overall lifecycle structure below.

---

## 2. Development Lifecycle Overview

```
 DEVELOP  →  TEST  →  BUILD  →  DEPLOY  →  MONITOR  →  MAINTAIN
    ↑                                                      │
    └──────────────────── feedback loop ──────────────────┘
```

---

## 3. Stage 1 — Development

- Feature work happens on **feature branches**, not directly on `main`.
- Backend and mobile app developed in parallel where possible, sharing TypeScript types for core entities (`User`, `Booking`, `Fundi`, `Subscription`).
- Local development:
  - Backend run and tested locally against a Supabase dev database.
  - Redis (Upstash) used even in local dev to catch caching bugs early.
  - Mobile app run via Expo Go / Expo Dev Client for fast iteration.
- Pull Requests (PRs) opened against `main` once a feature is functionally complete.

---

## 4. Stage 2 — Testing (Quality Gate)

No code reaches production without passing this gate.

### 4.1 Automated Testing — Jest
Unit tests for backend logic (subscription calculations, booking state transitions, auth middleware). Integration tests for API endpoints.

### 4.2 API Testing — Postman
Postman collections covering all major API flows, run automatically in CI via Newman before deployment.

### 4.3 Manual/Exploratory Testing
Manual pass on a real or emulated Android device before major releases.

### 4.4 Testing Gate Rule
```
PR opened → GitHub Actions runs Jest + Postman/Newman
    ↓
   All pass?
    ├── No  → PR blocked, developer fixes issues
    └── Yes → PR can be merged to main
```

---

## 5. Stage 3 — Build & Deployment (CI/CD)

### 5.1 Backend (Render)
```
Merge to main (GitHub)
    ↓
GitHub Actions: run full test suite (Jest + Newman)
    ↓
Tests pass?
    ├── No  → Deployment blocked, team notified
    └── Yes → Render auto-deploy triggered from GitHub
                ↓
         Render builds & deploys backend
                ↓
         Health check confirms new deploy is live
```

### 5.2 Admin Dashboard (Vercel)
```
Merge to main (admin dashboard repo/folder)
    ↓
Vercel auto-deploy triggered (Vercel's native GitHub integration)
    ↓
Preview deployment generated for review (optional, for PRs)
    ↓
Production deployment on merge to main
```

### 5.3 Mobile App (Expo EAS Build)
```
Feature-complete build ready
    ↓
eas build triggered (cloud build, no local Android toolchain needed)
    ↓
Internal testing build distributed
    ↓
Once stable → production build → submitted to Google Play Console
```

---

## 6. Stage 4 — Monitoring

| What | Tool | Purpose |
|---|---|---|
| Backend errors/exceptions | Sentry | Catch and alert on runtime errors in production |
| Mobile app crashes | Sentry (mobile SDK) | Catch crashes/errors on real user devices |
| Backend uptime | UptimeRobot | Alert if the Render-hosted API goes down |
| Database health | Supabase dashboard | Query performance, storage usage, connection limits |
| Cache health | Upstash dashboard | Redis usage, hit/miss rates |
| Deployment status | Render + Vercel dashboards | Confirm deploys succeed, roll back if needed |
| Payment/subscription events | ClickPesa dashboard + internal ledger logs | Confirm webhook processing, catch failed payments |

---

## 7. Stage 5 — Maintenance

- **Bug triage:** issues logged via GitHub Issues, prioritized per sprint.
- **Dependency updates:** periodic `npm audit`, especially for auth, payment, and ad SDKs.
- **Database maintenance:** monitor Supabase free-tier limits, plan upgrade timing before hitting limits.
- **Cost monitoring:** track free-tier usage across Render, Supabase, Upstash, Vercel, Expo EAS.
- **Post-incident review:** short retrospective after any production issue, feeding back into sprint planning.

---

## 8. Feedback Loop

```
Monitoring/Maintenance findings
        ↓
   New backlog items / bug fixes
        ↓
   Next sprint planning
        ↓
   Development stage (repeat cycle)
```

---

## 9. Environment Strategy

| Environment | Purpose | Notes |
|---|---|---|
| **Local** | Active development | Local backend, Supabase dev DB, Upstash Redis |
| **Staging** (optional, add when needed) | Pre-production testing | Separate Render service + separate Supabase project |
| **Production** | Live pilot/users | Render (backend), Vercel (admin), Supabase (prod DB), production ClickPesa keys |

---

## 10. Important Reminder

This tech stack and the feature list are **starting points, not commitments**. As FundiBolt develops, both should be revisited and adjusted. Treat this document as a living reference, updated as decisions change.
