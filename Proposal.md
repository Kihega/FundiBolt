# FundiBolt — Project Proposal
### A Local Fundi Marketplace for Dar es Salaam

**Version:** 1.0
**Target Market:** Dar es Salaam, Tanzania
**Platform:** Mobile Marketplace App (React Native / Expo)
**Prepared as:** Startup MVP Proposal

---

## 1. Executive Summary

FundiBolt is a mobile marketplace that connects customers in Dar es Salaam with nearby, verified local service providers ("mafundi") — including plumbers, electricians, carpenters, painters, AC technicians, welders, masons, appliance repair technicians, and CCTV installers.

The platform solves a simple, widespread problem: finding a trustworthy, available, nearby fundi today relies on word-of-mouth, phone contacts, or social media — with no central, searchable, ratings-based system. FundiBolt organizes this into one app.

The MVP will launch in **selected parts of Dar es Salaam only**, focusing on proving real bookings and real revenue before expanding citywide or nationally.

---

## 2. Problem Statement

- Customers struggle to quickly find a nearby, available, and trustworthy fundi.
- Fundis have no centralized platform to advertise skills, manage bookings, or build a reputation through reviews.
- There is no simple way for customers to compare fundis by rating, location, or service type before committing.

---

## 3. Objectives

The platform will:

1. Allow customers to register, search, and book verified fundis by service type and location.
2. Allow fundis to register, build a profile, and receive booking requests.
3. Allow customers and fundis to communicate directly in-app.
4. Allow customers to rate and review fundis after job completion.
5. Allow administrators to verify fundis before they appear in search.
6. Generate platform revenue through fundi subscriptions and customer-facing ads.
7. Provide administrators with tools to monitor users, bookings, and platform health.

---

## 4. Target Users

| User Type | Role |
|---|---|
| **Customer** | Searches for and books fundis, communicates, rates completed jobs |
| **Fundi** | Service provider — builds profile, receives and manages bookings |
| **Administrator** | Verifies fundis, manages services/users, monitors platform activity |

---

## 5. Initial Services Supported

1. Plumbing
2. Electrical services
3. Carpentry
4. Painting
5. Air-conditioning services
6. Welding
7. Masonry
8. Appliance repair
9. CCTV camera installation & maintenance

Additional services can be added later via the admin dashboard.

---

## 6. Core Features (MVP Scope)

### Customer
- Register / login
- Manage profile
- Search fundis by service + location
- View fundi profile, skills, ratings, availability
- Send booking/service requests
- Upload photos describing the problem
- Chat with fundi
- Track booking status
- Confirm job completion
- Rate and review fundi
- Report a problem/dispute

### Fundi
- Register / login
- Create professional profile (photo, skills, service description)
- Set service area, location, and availability
- Receive and accept/reject booking requests
- Chat with customers
- Update job status
- View ratings and reviews
- View subscription status

### Administrator
- Review and verify pending fundis (approve/reject/suspend/reactivate)
- Manage service categories
- Monitor users and bookings
- Monitor fundi subscription status and revenue
- Handle disputes
- View basic platform analytics

---

## 7. Fundi Verification Flow

A fundi does not appear in search results immediately after registering.

```
Fundi Registration
      ↓
Profile Completion
      ↓
Administrator Review
      ↓
Approved / Rejected
      ↓
If Approved → Fundi becomes searchable
```

A "Verified" badge is only shown once an admin has explicitly approved the account.

---

## 8. Revenue Model

FundiBolt intentionally avoids handling customer-to-fundi service payments in the MVP. This removes the need for split payments, escrow, payout integration, and related regulatory complexity. Revenue comes from two simpler, one-directional payment flows:

### 8.1 Fundi Subscription (Primary Revenue)
- Fundis pay a recurring monthly fee (e.g. TZS 5,000–15,000) to remain listed and searchable.
- Active subscription → profile visible, can receive bookings.
- Lapsed subscription → profile hidden from search until renewed.
- Collected via **ClickPesa** (mobile money + bank collection API).

### 8.2 Customer-Facing Ads (Secondary Revenue)
- Google AdMob banner/interstitial ads shown to customers within the app.
- Low revenue at small scale, but scales with active user growth.
- Optional future upgrade: paid "featured/sponsored fundi" placements in search results (fundi-funded, higher yield than generic ads).

**Note:** Customers pay fundis directly for the actual job (cash or mobile money), off-platform. FundiBolt does not process or hold service payment funds in this MVP.

---

## 9. Technology Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo) + TypeScript |
| Backend API | Node.js + Express + TypeScript |
| Database | PostgreSQL (Supabase) |
| Cache / Session / Idempotency | Redis (Upstash) |
| Payments (subscriptions only) | ClickPesa (collection API) |
| Ads | Google AdMob (`react-native-google-mobile-ads`) |
| Backend Hosting | Render (auto-deploy via GitHub) |
| Admin Dashboard Hosting | Vercel |
| Build Pipeline | Expo EAS Build (cloud build) |

**Why Expo:** development is being done in a minimal Termux/Kali environment, which cannot reliably run native Android build tooling. Expo allows writing and testing app code locally, while EAS Build compiles the production app in the cloud.

---

## 10. Build Roadmap

### Phase 1 — Foundation
Auth → user roles (customer/fundi/admin) → PostgreSQL schema → base Express API

### Phase 2 — Marketplace Core
Service categories → location model (region/district/ward/lat-long) → fundi search → fundi profiles

### Phase 3 — Booking Flow
Booking creation → accept/reject → status tracking → notifications

### Phase 4 — Communication
In-app chat tied to a booking

### Phase 5 — Trust & Safety
Fundi verification workflow → ratings & reviews → dispute reporting

### Phase 6 — Admin Dashboard
Fundi verification queue → user/booking monitoring → basic analytics

### Phase 7 — Monetization
ClickPesa subscription billing (fundi side) → AdMob integration (customer side)

### Phase 8 — Dar es Salaam Pilot Launch
Recruit 20–50 fundis in 1–2 wards → verify fundis → onboard first customers → collect feedback → iterate → expand coverage

**Launch principle:** the initial MVP can run with fundi listings **free** to prove the marketplace works, before subscription gating is switched on.

---

## 11. Business Setup Requirements (parallel to development)

- Register company (BRELA)
- Open business bank account
- Apply for ClickPesa merchant account (sandbox → production)
- Confirm ClickPesa KYC/compliance requirements for recurring collection

---

## 12. Key Business Metrics

**Marketplace:** registered customers, registered fundis, verified fundis, active fundis, bookings created/completed/cancelled

**Financial:** active subscriptions, subscription revenue, ad revenue, churn rate

**Quality:** average fundi rating, complaints, disputes, booking acceptance rate, booking completion rate, repeat customers

---

## 13. Acceptance Criteria for Pilot Launch

- Customer and fundi can both register successfully
- Admin can verify fundis
- Customers can search and find fundis by service + location
- Customers can submit bookings; fundis can accept/reject
- Booking status updates correctly through its lifecycle
- Customers and fundis can chat
- Fundi subscription payment (ClickPesa) can be collected and verified
- Lapsed subscriptions correctly hide a fundi from search
- Customers can rate completed jobs
- Admin can monitor users, bookings, and subscription revenue
- Authentication and authorization work correctly across all three roles

---

## 14. Features Deliberately Excluded from MVP

- Nationwide deployment
- Split payments / escrow / fundi payouts through the platform
- AI-based recommendations
- Loyalty programs
- Advanced advertising/bidding systems
- Corporate accounts
- Automated price prediction or financial forecasting

These may be introduced after the core marketplace proves demand and revenue.

---

## 15. Next Steps

1. Register business entity and open ClickPesa sandbox account
2. Set up Expo project and backend repo (Node/Express/PostgreSQL)
3. Build Phase 1 (auth + roles) and Phase 2 (marketplace core)
4. Recruit initial pilot fundis in 1–2 Dar es Salaam wards
5. Launch free, gather usage data, then enable subscriptions + ads
