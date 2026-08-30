# FundiBolt — Business View

A business-focused summary of FundiBolt: the problem, the market, and how the business makes money. For the full technical build plan, see `Proposal.md` and `DevTechPlan.md`.

---

## 1. The Problem

In Dar es Salaam, finding a trustworthy, available, nearby fundi (plumber, electrician, carpenter, etc.) today relies on word-of-mouth, personal contacts, or scattered social media posts. There is no central, searchable, ratings-based way to find and compare local service providers.

Fundis, on the other hand, have no platform to advertise their skills, build a visible reputation, or reliably receive new job leads beyond their existing personal network.

---

## 2. The Solution

FundiBolt is a mobile marketplace app connecting customers directly with verified local fundis across common home/business service categories: plumbing, electrical, carpentry, painting, AC repair, welding, masonry, appliance repair, and CCTV installation.

Customers can search by service and location, view ratings, message a fundi directly, book a job, and leave a review after completion. Fundis get a profile, visibility, and a stream of booking requests.

---

## 3. Target Market

- **Initial pilot:** 1–2 wards within Dar es Salaam (deliberately narrow, to prove the model before wider rollout)
- **Primary users:** urban households and small businesses needing home/repair services
- **Primary supply side:** independent, informal, and small-business fundis currently relying on word-of-mouth for work

---

## 4. Revenue Model

FundiBolt deliberately avoids handling the actual service payment between customer and fundi in its MVP — this keeps the business simple, avoids escrow/payout regulatory complexity, and lets the company focus on proving the marketplace itself works. Revenue comes from two one-directional flows:

### Fundi Subscription (Primary Revenue)
Fundis pay a recurring monthly fee (e.g. TZS 5,000–15,000) to stay listed and searchable on the platform. Lapsed payment hides their profile until renewed. Collected via ClickPesa (mobile money + bank).

### Customer-Facing Ads (Secondary Revenue)
Google AdMob ads shown to customers browsing the app. Modest at low user volume, but scales with growth. A stronger local option to grow into later: paid "featured fundi" placements in search results.

**The actual job payment (customer → fundi) happens off-platform** — cash or direct mobile money — not processed or held by FundiBolt.

---

## 5. Why This Model First

- No payment licensing/escrow complexity in the MVP
- Predictable, recurring revenue (subscriptions) instead of relying purely on transaction volume
- Lets the company launch and validate demand quickly, before investing in more complex payment infrastructure
- Commission-based, split-payment models (à la Uber) can be introduced later once there's real usage data and a licensed, registered business entity in place

---

## 6. Business Setup Requirements

- Company registration (BRELA)
- Business bank account
- ClickPesa merchant account (sandbox → production)
- Confirmation of KYC/compliance requirements for recurring subscription collection

---

## 7. Key Metrics to Track

**Growth:** registered customers, registered fundis, verified fundis, active fundis

**Engagement:** bookings created/completed/cancelled, repeat customers, booking acceptance rate

**Financial:** active subscriptions, subscription revenue, ad revenue, churn rate

**Trust:** average fundi rating, disputes, complaints

---

## 8. Path Forward

1. Launch free (no subscription gating) in 1–2 wards to prove the marketplace mechanics work
2. Onboard 20–50 verified fundis, get real bookings happening
3. Turn on fundi subscriptions and AdMob once usage data supports it
4. Expand coverage across Dar es Salaam based on pilot learnings
5. Consider commission/split-payment models only once the business is registered, licensed, and has proven demand
