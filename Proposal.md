# FundiBolt Requirements Analysis Report

## Dar es Salaam Local Fundi Marketplace

**Version:** 1.1\
**Target Market:** Dar es Salaam, Tanzania\
**System Type:** Mobile Marketplace Platform\
**Primary Users:** Customers, Fundis, Administrators

------------------------------------------------------------------------

## 1. Introduction

FundiBolt is a mobile-based marketplace designed to connect customers in
Dar es Salaam with nearby and verified service providers, commonly known
as *mafundi*. The platform will allow customers to search for suitable
fundis based on service type and geographical location, view fundi
profiles, request services, communicate with fundis, track bookings,
make payments, and provide ratings.

Fundis will use the platform to create professional profiles, specify
their skills and service areas, receive service requests, manage
bookings, communicate with customers, select a payment method for
receiving their earnings, and monitor their earnings.

An administrator will manage the marketplace by verifying fundis,
managing users and services, monitoring bookings and payments, tracking
platform commissions and income, handling disputes, and monitoring
overall platform performance.

The initial implementation will focus exclusively on **Dar es Salaam**.
Expansion to other regions will occur after the Dar es Salaam
marketplace demonstrates sufficient user adoption, completed
transactions, and sustainable revenue.

------------------------------------------------------------------------

# 2. Problem Statement

Customers in Dar es Salaam often rely on personal recommendations,
social media, phone contacts, or informal networks when searching for
fundis. This can make it difficult to quickly identify a suitable,
available, nearby, and trustworthy service provider.

At the same time, many fundis lack a centralized digital platform
through which they can advertise their skills, reach new customers,
manage service requests, and build a reputation through customer
reviews.

FundiBolt will address this gap by providing a location-based digital
marketplace that connects customers with suitable fundis and provides
tools for managing the complete service-request lifecycle.

------------------------------------------------------------------------

# 3. Main Objective

To develop a mobile marketplace platform that connects customers in Dar
es Salaam with nearby and verified fundis while providing a reliable
system for service booking, communication, payments, fundi earnings,
commission management, reviews, and marketplace administration.

------------------------------------------------------------------------

# 4. Specific Objectives

The system shall:

1.  Allow customers to register and manage their accounts.
2.  Allow fundis to register and create professional service profiles.
3.  Allow administrators to verify and manage fundi accounts.
4.  Allow customers to search for fundis based on service category and
    location.
5.  Allow customers to view fundi profiles, ratings, skills,
    availability, and service areas.
6.  Allow customers to request and book fundis.
7.  Allow fundis to accept or reject service requests.
8.  Allow customers and fundis to communicate through the platform.
9.  Allow fundis to add a preferred payment method for receiving
    earnings.
10. Allow customers to make payments through supported bank and
    mobile-money payment methods.
11. Automatically deduct a 10% platform commission from every confirmed
    customer payment.
12. Record the 10% commission in the administrator wallet/ledger for
    income tracking.
13. Transfer the remaining 90% to the selected fundi's registered
    payment destination.
14. Allow fundis to monitor their earnings and payment history.
15. Allow customers to rate and review fundis after completed jobs.
16. Allow administrators to monitor users, bookings, transactions,
    commissions, and disputes.
17. Provide financial and marketplace analytics to support business
    decisions.

------------------------------------------------------------------------

# 5. Target Users

The system will have three primary user categories:

-   Customer
-   Fundi
-   Administrator

------------------------------------------------------------------------

# 6. Customer Requirements

A customer is a person looking for a fundi to perform a service.

Customers shall be able to:

-   Create an account.
-   Login/logout.
-   Manage their profile.
-   Select a service.
-   Search for nearby fundis.
-   View fundi profiles.
-   View fundi ratings and reviews.
-   Check fundi availability.
-   Send service requests.
-   Upload photos describing a problem.
-   Provide service location.
-   Select preferred date/time.
-   Receive and review quotations where applicable.
-   Accept quotations.
-   Communicate with fundis.
-   Track booking status.
-   Make payments using supported payment methods.
-   View payment status and transaction reference.
-   View booking history.
-   Confirm job completion.
-   Rate and review fundis.
-   Report problems or disputes.

------------------------------------------------------------------------

# 7. Fundi Requirements

A fundi is a service provider offering one or more services.

## 7.1 Initial Services

The initial FundiBolt marketplace shall support:

1.  Plumbing
2.  Electrical services
3.  Carpentry
4.  Painting
5.  Air-conditioning services
6.  Welding
7.  Masonry
8.  Appliance repair
9.  **CCTV camera installation and services**

CCTV services may include installation, configuration, maintenance,
troubleshooting, camera replacement, DVR/NVR setup, and related
services.

Additional services may be added later through the administrator
dashboard.

## 7.2 Fundi Profile

Fundis shall be able to:

-   Register an account.
-   Login/logout.
-   Create a professional profile.
-   Add a profile photo.
-   Add skills.
-   Select one or more service categories.
-   Add a service description.
-   Specify service areas.
-   Provide geographical location.
-   Set a service radius.
-   Set availability.
-   Receive booking requests.
-   Accept or reject requests.
-   View relevant customer and booking information.
-   Communicate with customers.
-   Update job status.
-   Submit quotations where applicable.
-   View completed jobs.
-   View earnings.
-   View ratings and reviews.
-   Manage availability.

------------------------------------------------------------------------

# 8. Fundi Verification Requirements

A fundi must not automatically become publicly available immediately
after registration.

The process shall be:

``` text
Fundi Registration
        ↓
Profile Completion
        ↓
Verification Information
        ↓
Administrator Review
        ↓
Approved / Rejected
        ↓
If Approved
        ↓
Fundi becomes searchable
```

The administrator shall be able to:

-   View pending fundis.
-   Review submitted information.
-   Approve a fundi.
-   Reject a fundi.
-   Suspend a fundi.
-   Reactivate a fundi.

A **Verified** indicator shall only be displayed when the administrator
has actually approved the account.

------------------------------------------------------------------------

# 9. Fundi Payment Method Requirements

Every fundi who wants to receive money through FundiBolt must add at
least one valid payment method to their profile.

The supported receiving methods shall initially be:

### Option A: Bank Transfer

The fundi provides:

-   Bank name
-   Account holder name
-   Account number

### Option B: Mobile Money Transfer

The fundi provides:

-   Mobile network/provider
-   Registered mobile-money number
-   Account holder name where required

The system shall allow the fundi to:

-   Add a payment method.
-   Edit a payment method.
-   Remove a payment method where permitted.
-   Set one payment method as the primary receiving method.
-   View the currently selected receiving method.

Payment details must be securely stored and must not be publicly
displayed.

The system should require verification of the receiving destination
where supported by the payment provider.

A fundi should not be eligible to receive a payout until a valid
receiving payment method has been configured.

------------------------------------------------------------------------

# 10. Location Requirements

Location is one of the core features of FundiBolt.

The system shall collect appropriate location information including:

-   Region
-   District
-   Ward
-   Latitude
-   Longitude
-   Service radius

The customer should be able to allow GPS access so that FundiBolt can
identify nearby fundis.

The search process shall be:

``` text
Customer Location
        ↓
GPS Coordinates
        ↓
Selected Service
        ↓
Search Available Fundis
        ↓
Distance Calculation
        ↓
Availability Filter
        ↓
Nearby Fundis
```

The platform should prioritize fundis based on:

1.  Service compatibility
2.  Distance
3.  Availability
4.  Rating
5.  Completed jobs
6.  Response performance

The location system shall initially operate within Dar es Salaam.

------------------------------------------------------------------------

# 11. Booking Requirements

The booking system is the core marketplace functionality.

## Customer Booking Process

``` text
Select Service
      ↓
Find Nearby Fundis
      ↓
Select Fundi
      ↓
View Profile
      ↓
Describe Problem
      ↓
Upload Photos
      ↓
Provide Location
      ↓
Select Date/Time
      ↓
Submit Request
```

The fundi receives the request and can:

``` text
Accept
   OR
Reject
```

If accepted:

``` text
Booking Accepted
      ↓
Fundi Travels to Customer
      ↓
Fundi Arrives
      ↓
Work Begins
      ↓
Work Completed
      ↓
Customer Confirms
      ↓
Payment
      ↓
Rating/Review
```

------------------------------------------------------------------------

# 12. Booking Status Requirements

The system shall support:

``` text
PENDING
ACCEPTED
REJECTED
ON_THE_WAY
ARRIVED
IN_PROGRESS
COMPLETED
CANCELLED
DISPUTED
```

Only authorized users shall be able to change booking statuses.

------------------------------------------------------------------------

# 13. Pricing and Quotation Requirements

FundiBolt should initially avoid forcing fixed prices for all services
because many fundi jobs cannot be accurately priced before inspection.

The preferred process is:

``` text
Customer Requests Service
        ↓
Fundi Reviews Problem
        ↓
Fundi Provides Quotation
        ↓
Customer Accepts/Rejects
        ↓
Work Begins
```

Fixed pricing may later be introduced for standardized services.

------------------------------------------------------------------------

# 14. Payment Requirements

FundiBolt shall support appropriate payment providers and payment
methods available in Tanzania.

The platform shall support the following conceptual customer payment
options:

-   Mobile-money payment
-   Bank/payment-provider payment

The exact providers shall be selected during implementation based on
their APIs, settlement capabilities, fees, compliance requirements, and
support for marketplace/platform payouts.

------------------------------------------------------------------------

# 15. FundiBolt Commission and Fundi Payout Requirements

FundiBolt shall use a **10% commission model** for the initial
marketplace.

For every confirmed eligible customer payment:

``` text
Customer Payment = 100%

FundiBolt Commission = 10%

Fundi Payout = 90%
```

### Example

If the customer pays:

``` text
TSh 50,000
```

Then:

``` text
FundiBolt Commission
10% × 50,000
= TSh 5,000

Fundi Payout
90% × 50,000
= TSh 45,000
```

The system shall **not add the full TSh 50,000 to the fundi wallet
first**.

Instead, the transaction should be split logically at confirmation:

``` text
Customer Payment
       │
       ▼
Payment Confirmed
       │
       ├───────────────┐
       │               │
       ▼               ▼
10% Commission      90% Fundi Amount
       │               │
       ▼               ▼
Admin Wallet /      Fundi Payout
Commission Ledger   Destination
       │               │
       ▼               ▼
Admin Dashboard     Bank / Mobile Money
```

The 10% commission shall be recorded as FundiBolt income.

The remaining 90% shall be paid to the fundi's selected and valid
receiving payment method.

------------------------------------------------------------------------

# 16. Important Payment Architecture Requirement

The term **Admin Wallet** should initially be implemented as a
controlled **platform financial ledger/wallet balance**, not merely as a
number displayed on the dashboard.

For every transaction, the system should maintain a financial record
showing:

-   Gross payment
-   Platform commission
-   Fundi payable amount
-   Payment provider
-   Customer
-   Fundi
-   Booking
-   Transaction reference
-   Payment status
-   Payout status
-   Commission status
-   Date/time

Example:

``` text
Transaction
--------------------------------
Gross Amount:       TSh 50,000
Commission (10%):   TSh  5,000
Fundi Amount:       TSh 45,000
Payment Status:     CONFIRMED
Commission Status:  RECORDED
Payout Status:      PAID
```

This provides an auditable financial history.

------------------------------------------------------------------------

# 17. Admin Wallet and Income Tracking

The administrator dashboard shall provide financial tracking.

The dashboard should display:

### Today's income

``` text
Today's Gross Payments
Today's Commission
Today's Fundi Payouts
Today's Refunds
Today's Net Platform Income
```

### Other periods

-   Daily income
-   Weekly income
-   Monthly income
-   Yearly income
-   Custom date range

### Financial metrics

-   Total transaction value
-   Total platform commission
-   Total fundi payouts
-   Pending payouts
-   Successful payouts
-   Failed payouts
-   Refunded payments
-   Disputed payments

Example:

``` text
ADMIN DASHBOARD

Today's Transactions:      42
Gross Payments:            TSh 2,100,000
10% Commission:            TSh   210,000
Fundi Payouts:             TSh 1,890,000
Pending Payouts:            TSh   100,000
Refunds:                    TSh    20,000
```

The figures must be calculated from actual transaction records rather
than manually entered values.

------------------------------------------------------------------------

# 18. Admin Bank Settlement Requirement

The business owner/platform must be able to configure an official
FundiBolt settlement account for receiving the platform's commission.

Conceptually:

``` text
Customer Payment
       ↓
Payment Provider / Marketplace Settlement
       ↓
10% FundiBolt Commission
       ↓
FundiBolt Settlement Account
       ↓
Admin Financial Dashboard
```

Where the selected payment provider supports automatic split payments or
marketplace payouts, the system should use the provider's supported
settlement mechanism.

If a provider does not support direct split settlement, the backend must
use the provider's supported collection and payout process rather than
pretending that money has been transferred when it has not.

The system must not expose bank credentials, API secrets, or sensitive
payment information in the mobile application.

**Important implementation requirement:** direct automatic transfers to
a bank account depend on the selected payment provider's API and
Tanzanian financial/payment regulations. The final implementation must
therefore be designed around the provider's approved
marketplace/collection and payout capabilities.

------------------------------------------------------------------------

# 19. Payment Confirmation and Idempotency

A payment must only be considered successful after confirmation from the
payment provider.

The system shall not calculate commission or release a fundi payout
merely because the customer initiated a payment.

The process should be:

``` text
Customer Initiates Payment
        ↓
Payment Provider
        ↓
Payment Confirmation
        ↓
Backend Verifies Transaction
        ↓
Transaction Marked CONFIRMED
        ↓
10% Commission Recorded
        ↓
90% Fundi Payout Created
        ↓
Payout Processed
```

The backend must prevent duplicate processing.

For example, if the payment provider sends the same confirmation twice,
the system must not:

-   Deduct the 10% commission twice.
-   Pay the fundi twice.
-   Record duplicate income.

Each provider transaction must have a unique transaction/reference
identifier.

------------------------------------------------------------------------

# 20. Fundi Earnings Requirements

The fundi application shall provide an earnings section.

It should display:

-   Total earnings
-   Available balance
-   Pending amount
-   Paid amount
-   Commission deductions
-   Transaction history
-   Payout history

Example:

``` text
FUNDI EARNINGS

Gross Job Payment:      TSh 50,000
FundiBolt Commission:   TSh  5,000
Fundi Earnings:         TSh 45,000

Payout Status:          PAID
```

The system should distinguish between:

-   **Pending earnings** --- payment/job still subject to required
    confirmation.
-   **Available earnings** --- amount eligible for payout.
-   **Paid earnings** --- successfully transferred to the fundi.

------------------------------------------------------------------------

# 21. Rating and Review Requirements

After a completed job, customers should be able to:

-   Give a rating.
-   Write a review.
-   Report inappropriate service.

Ratings should contribute to the fundi's overall marketplace reputation.

The system should prevent customers from repeatedly reviewing the same
completed booking.

------------------------------------------------------------------------

# 22. Communication Requirements

Customers and fundis should be able to communicate after a booking
request is created.

The system should support:

-   Text messages
-   Booking-related notifications
-   Optional image sharing
-   Call initiation

The system should maintain message history associated with the relevant
users and booking.

------------------------------------------------------------------------

# 23. Notification Requirements

### Customer notifications

-   Booking request submitted.
-   Fundi accepted.
-   Fundi rejected.
-   Fundi is on the way.
-   Fundi arrived.
-   Job completed.
-   Payment confirmation.
-   Payout/payment-related updates where relevant.
-   New message.
-   Booking cancellation.

### Fundi notifications

-   New booking request.
-   Customer cancelled.
-   Customer accepted quotation.
-   New message.
-   Payment confirmation.
-   Earnings updated.
-   Payout successful/failed.
-   New review.

------------------------------------------------------------------------

# 24. Admin Requirements

The administrator will control the marketplace through a web-based
dashboard.

## Dashboard

The administrator should see:

-   Total customers
-   Total fundis
-   Verified fundis
-   Pending verification
-   Active bookings
-   Completed bookings
-   Cancelled bookings
-   Total transaction value
-   Platform commission
-   Fundi payouts
-   Pending payouts
-   Failed payments
-   Disputes
-   Daily/weekly/monthly income

## User Management

Admin should be able to:

-   View customers.
-   View fundis.
-   Search users.
-   Suspend users.
-   Reactivate users.

## Fundi Management

Admin should be able to:

-   Review applications.
-   Verify fundis.
-   Reject fundis.
-   Suspend fundis.
-   Manage fundi services.

## Booking Management

Admin should be able to:

-   View bookings.
-   Monitor booking status.
-   Investigate cancelled bookings.
-   Handle disputes.

## Payment Management

Admin should be able to:

-   View transactions.
-   View commissions.
-   View fundi payouts.
-   View payment status.
-   View payout status.
-   Review failed payments.
-   Review refunds.
-   Export financial reports.

------------------------------------------------------------------------

# 25. Dispute Management

Customers and fundis should have the ability to report problems.

Example:

``` text
Customer
   ↓
Reports Problem
   ↓
Dispute Created
   ↓
Admin Reviews
   ↓
Admin Decision
   ↓
Resolution
```

Possible dispute categories:

-   Poor service
-   Payment problem
-   Fundi did not arrive
-   Customer unavailable
-   Incorrect quotation
-   Property damage
-   Other

A disputed transaction should not automatically be released to the fundi
if the business rules require the payout to be held pending
investigation.

------------------------------------------------------------------------

# 26. Security Requirements

The system must implement appropriate security controls.

## Authentication

-   Secure registration.
-   Secure login.
-   Password hashing.
-   JWT/session security.
-   Secure logout/token handling.

## Authorization

The system must distinguish between:

``` text
CUSTOMER
FUNDI
ADMIN
```

A customer must not access administrator functions.

A fundi must not access another fundi's private information.

## Payment Security

-   Never store raw card/payment credentials unless explicitly required
    and supported by the payment provider.
-   Store provider transaction references.
-   Protect payment API credentials.
-   Validate payment callbacks/webhooks.
-   Verify payment status server-side.
-   Use idempotency to prevent duplicate transactions.
-   Log financial state changes.
-   Restrict access to financial information.

------------------------------------------------------------------------

# 27. Technical Requirements

A suitable initial architecture is:

``` text
                 React Native / Expo
                         │
                         │ HTTPS
                         ▼
                Node.js + Express
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         PostgreSQL     Redis      Payment API
             │
          Prisma ORM
```

## Suggested technologies

### Mobile

-   React Native
-   Expo
-   TypeScript
-   Expo Router

### Backend

-   Node.js
-   Express
-   REST API

### Database

-   PostgreSQL
-   Prisma ORM

### Validation

-   Zod

### Authentication

-   JWT
-   bcrypt

### Caching/realtime

-   Redis
-   WebSockets where required

------------------------------------------------------------------------

# 28. Core Financial Data Model

The database should maintain separate records for marketplace
transactions and payouts.

Recommended core entities include:

``` text
User
CustomerProfile
FundiProfile
Service
FundiService
Booking
Quotation
Payment
Transaction
Commission
FundiWallet
Payout
PaymentMethod
Review
Message
Notification
Dispute
AdminWalletLedger
```

The financial relationships should follow:

``` text
Booking
   │
   ▼
Payment
   │
   ▼
Transaction
   ├── Commission (10%)
   └── Fundi Payout (90%)
             │
             ▼
       Payment Method
```

The **AdminWalletLedger** should record platform income and other
financial movements.

------------------------------------------------------------------------

# 29. Non-Functional Requirements

## Performance

The application should:

-   Load major screens quickly.
-   Return search results efficiently.
-   Handle multiple simultaneous users.
-   Avoid unnecessary API requests.

## Availability

The production system should remain available continuously except during
planned maintenance.

## Scalability

The architecture should allow expansion from:

``` text
Dar es Salaam
      ↓
Other regions
      ↓
Tanzania
```

without requiring a complete rewrite.

## Usability

The interface should:

-   Be simple.
-   Use clear Swahili/English terminology as appropriate.
-   Require minimal steps to make a booking.
-   Work effectively on common Android devices.

------------------------------------------------------------------------

# 30. MVP Scope

## Customer

-   Registration/login
-   Profile
-   Service selection
-   Location
-   Nearby fundi search
-   Fundi profile
-   Booking
-   Booking status
-   Messaging/contact
-   Payment
-   Booking history
-   Rating/review

## Fundi

-   Registration/login
-   Profile
-   Skills
-   Location
-   Availability
-   Verification
-   Booking requests
-   Accept/reject
-   Job status
-   Earnings
-   Payment method setup
-   Payout history
-   Reviews
-   Messaging

## Admin

-   Dashboard
-   User management
-   Fundi verification
-   Service management
-   Booking monitoring
-   Payment monitoring
-   Commission management
-   Admin wallet/financial ledger
-   Fundi payout monitoring
-   Dispute management
-   Financial reports

------------------------------------------------------------------------

# 31. Features to Exclude From the First MVP

To avoid making the first version unnecessarily complicated, postpone:

-   Nationwide deployment
-   Complex AI recommendations
-   Advanced loyalty programs
-   Fundi subscription plans
-   Advanced advertising
-   Corporate accounts
-   Automated price prediction
-   Advanced financial forecasting

These can be introduced after the core marketplace works.

------------------------------------------------------------------------

# 32. Initial Dar es Salaam Launch Strategy

FundiBolt should initially operate within selected parts of Dar es
Salaam rather than immediately covering the entire city.

The launch should follow:

``` text
Build MVP
    ↓
Recruit 20–50 fundis
    ↓
Verify fundis
    ↓
Launch selected service categories
    ↓
Recruit first customers
    ↓
Complete first bookings
    ↓
Process first payments
    ↓
Collect feedback
    ↓
Improve system
    ↓
Expand coverage
```

The initial goal should be **successful transactions**, not simply
application downloads.

------------------------------------------------------------------------

# 33. Key Business Metrics

## Marketplace

-   Registered customers
-   Registered fundis
-   Verified fundis
-   Active fundis
-   Number of bookings
-   Completed bookings
-   Cancelled bookings

## Financial

-   Gross transaction value
-   Total platform commission
-   Total fundi payouts
-   Pending payouts
-   Successful payouts
-   Failed payouts
-   Refunded payments
-   Disputed payments
-   Net platform income

## Quality

-   Average fundi rating
-   Customer complaints
-   Disputes
-   Booking acceptance rate
-   Booking completion rate
-   Repeat customers

------------------------------------------------------------------------

# 34. Acceptance Criteria for the First Release

The Dar es Salaam MVP can be considered ready for pilot launch when:

-   A customer can register successfully.
-   A fundi can register successfully.
-   Admin can verify fundis.
-   Customers can find fundis based on service and location.
-   Customers can submit bookings.
-   Fundis can accept/reject bookings.
-   Booking statuses work correctly.
-   Customers and fundis can communicate.
-   Fundis can configure a valid bank or mobile-money receiving method.
-   Customers can make payments through the selected payment provider.
-   The backend can verify confirmed payments.
-   Exactly 10% of each confirmed eligible payment is recorded as
    platform commission.
-   The remaining 90% is recorded as the fundi payable amount.
-   Duplicate payment confirmations cannot create duplicate commissions
    or payouts.
-   Fundi earnings are updated correctly.
-   Fundi payouts are sent through the supported payment-provider
    mechanism.
-   Admin can track daily, weekly, monthly, and custom-period income.
-   Customers can rate completed jobs.
-   Admin can monitor transactions and payouts.
-   Authentication and authorization work correctly.
-   Critical payment and application failures are handled appropriately.

------------------------------------------------------------------------

# 35. Final System Workflow

The complete FundiBolt business process should work as follows:

``` text
                    CUSTOMER
                       │
                       ▼
                 Open FundiBolt
                       │
                       ▼
                Select Service
                       │
                       ▼
                 Share Location
                       │
                       ▼
              Find Nearby Fundis
                       │
                       ▼
                 Select Fundi
                       │
                       ▼
               Request Service
                       │
                       ▼
                     FUNDI
                       │
                 Accept Request
                       │
                       ▼
                 Visit Customer
                       │
                       ▼
                  Do the Job
                       │
                       ▼
                Job Completed
                       │
                       ▼
              Customer Confirms
                       │
                       ▼
                    PAYMENT
                       │
                       ▼
              Payment Confirmed
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        10% Commission      90% Fundi Amount
              │                 │
              ▼                 ▼
     Admin Wallet/Ledger    Fundi Earnings
              │                 │
              ▼                 ▼
      Admin Income Report   Fundi Payment Method
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                     Bank Transfer  Mobile Money
                                │
                                ▼
                         Payout Completed
                                │
                                ▼
                         Customer Rating
                                │
                                ▼
                         Marketplace Growth
```

------------------------------------------------------------------------

# 36. Recommended Development Priority

## Phase 1 --- Foundation

Authentication → User roles → Database → Profiles

## Phase 2 --- Marketplace

Services → Location → Fundi search → Fundi profiles

## Phase 3 --- Booking

Requests → Accept/reject → Status tracking → Notifications

## Phase 4 --- Communication

Chat → Call → Booking communication

## Phase 5 --- Payments

Payment provider integration → Payment confirmation → 10% commission →
90% fundi payout → Transaction ledger

## Phase 6 --- Trust

Fundi verification → Ratings → Reviews → Disputes

## Phase 7 --- Administration

Admin dashboard → Financial dashboard → Wallet/ledger → Payout
monitoring → Analytics

## Phase 8 --- Dar es Salaam Pilot

Recruit fundis → Recruit customers → First transactions → Feedback →
Optimization

------------------------------------------------------------------------

# 37. Important Business Rule

The fundamental financial rule for FundiBolt is:

> **For every confirmed eligible customer payment, FundiBolt retains 10%
> as its platform commission, while 90% becomes payable to the selected
> fundi through the fundi's registered bank or mobile-money payment
> method.**

The implementation should treat payment confirmation, commission
recording, and fundi payout as separate financial states so that every
transaction can be audited and reconciled.

This document is the baseline requirements specification for the
**FundiBolt Dar es Salaam marketplace MVP**. New features should be
checked against this document before being added to the first production
release.
