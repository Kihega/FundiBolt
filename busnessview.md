# FundiBolt Transaction Architecture

## 1. Overview

FundiBolt uses a **gateway-based split-payment architecture** in which the payment gateway receives the customer's payment and automatically distributes the money between:

- **FundiBolt** — platform commission
- **Fundi** — service provider payout

FundiBolt's backend does not manually transfer customer funds to the fundi. Instead, it creates the payment/split instruction, receives payment and payout notifications through webhooks, and records the complete financial transaction for reconciliation.

---

## 2. Business Example

Assume:

- Service price: **TZS 100,000**
- FundiBolt commission: **10%**
- Fundi payout: **TZS 90,000**

```text
Customer pays
TZS 100,000
       |
       v
+-------------------------+
|    Payment Gateway      |
|                         |
| Split Payment Engine    |
+-------------------------+
       |             |
       |             |
       v             v
FundiBolt          Fundi
TZS 10,000         TZS 90,000
Commission         Payout
```

> The actual gateway fee must be handled according to the selected provider's split-payment model. Do not assume that the gateway fee is included in the commission unless the provider's commercial/API documentation confirms it.

---

## 3. High-Level Transaction Architecture

```text
+------------------+
|    CUSTOMER      |
| Flutter Mobile   |
+--------+---------+
         |
         | 1. Book Fundi
         v
+--------------------------+
|      FundiBolt API      |
| Node.js + Express       |
+-----------+--------------+
            |
            | 2. Create payment
            |    + split details
            v
+--------------------------+
|    PAYMENT GATEWAY       |
| Mobile Money / Bank /    |
| Card / Other Methods     |
+-----------+--------------+
            |
            | 3. Customer completes payment
            v
+--------------------------+
|       CUSTOMER           |
| Mobile Money / Bank     |
+-----------+--------------+
            |
            | 4. Payment confirmation
            v
+--------------------------+
|    PAYMENT GATEWAY       |
+-----------+--------------+
            |
            | 5. Webhook
            v
+--------------------------+
|      FundiBolt API      |
| Webhook Handler         |
+-----------+--------------+
            |
            | 6. Verify + record
            v
+--------------------------+
|       PostgreSQL         |
| Payments / Splits /      |
| Payouts / Transactions   |
+-----------+--------------+
            |
            | 7. Gateway settles
            v
+--------------------------+
|    PAYMENT GATEWAY       |
+-----------+--------------+
       |             |
       |             |
       v             v
+-------------+  +-------------+
| FundiBolt   |  |    Fundi    |
| Account     |  | Bank/Money  |
| Commission  |  | Account     |
+-------------+  +-------------+
```

---

## 4. Complete Transaction Flow

### Step 1 — Customer creates a booking

The customer selects a fundi and requests a service.

```text
Customer
   |
   | POST /bookings
   v
FundiBolt API
   |
   v
Booking created
status = PENDING_PAYMENT
```

The booking should contain:

```text
booking_id
customer_id
fundi_id
service_id
amount
commission_rate
commission_amount
fundi_amount
currency
status
```

---

### Step 2 — Backend calculates the split

Example:

```text
Service amount      = 100,000 TZS
Commission rate     = 10%
Platform commission = 10,000 TZS
Fundi amount        = 90,000 TZS
```

Formula:

```text
commission = amount × commission_rate

fundi_amount = amount - commission
```

The calculation should happen on the **backend**, not in the mobile application.

---

### Step 3 — Backend creates a payment request

FundiBolt sends a request to the payment gateway.

Conceptually:

```json
{
  "amount": 100000,
  "currency": "TZS",
  "reference": "FB-BOOKING-000123",
  "customer": {
    "id": "CUS-1001"
  },
  "split": {
    "platform_amount": 10000,
    "recipient_amount": 90000,
    "recipient_id": "FUNDI-045"
  },
  "callback_url": "https://api.fundibolt.co.tz/webhooks/payment"
}
```

> The exact request fields depend on the payment gateway selected by FundiBolt.

The backend should store the gateway's payment reference.

---

## 5. Customer Payment

The customer is redirected to, or prompted by, the gateway.

Supported methods may include:

```text
Mobile Money
    |
    +-- M-Pesa
    +-- Airtel Money
    +-- Tigo Pesa
    +-- Halopesa
    +-- Other supported networks

Bank
    |
    +-- Bank transfer
    +-- Payment reference/control number
    +-- Other supported bank methods

Card
    |
    +-- Visa
    +-- Mastercard
    +-- Other supported cards
```

The exact methods depend on the selected gateway.

---

## 6. Payment Webhook

After the customer pays, the gateway sends a webhook to FundiBolt.

Example:

```json
{
  "event": "payment.success",
  "transaction_id": "TX-987654",
  "reference": "FB-BOOKING-000123",
  "amount": 100000,
  "currency": "TZS",
  "status": "SUCCESS"
}
```

FundiBolt should **not trust the mobile application to confirm payment**.

The authoritative payment status should come from the payment gateway and, where available, server-to-server verification.

---

## 7. Webhook Processing

```text
Gateway
   |
   | POST /webhooks/payment
   v
Webhook Controller
   |
   v
Validate signature/authentication
   |
   v
Check event ID / transaction ID
   |
   v
Check idempotency
   |
   v
Verify transaction with gateway if required
   |
   v
Update payment
   |
   v
Update booking
   |
   v
Record commission
   |
   v
Record expected fundi payout
```

### Important

Webhook processing must be **idempotent**.

If the gateway sends the same webhook twice, FundiBolt must not:

- create two payments
- count the commission twice
- create two payouts
- complete the booking twice

Use the gateway transaction ID/event ID as a unique identifier where appropriate.

---

# 8. Database Transaction Model

A recommended structure is:

```text
CUSTOMER
   |
   +----< BOOKING >---- FUNDI
             |
             |
             v
          PAYMENT
             |
       +-----+------+
       |            |
       v            v
 COMMISSION       PAYOUT
```

## Core tables

### customers

```text
id
name
phone
email
created_at
updated_at
```

### fundis

```text
id
user_id
name
phone
payout_account
payout_account_type
verification_status
created_at
updated_at
```

The fundi's payout destination should be stored securely and only to the extent required by the payment provider.

### bookings

```text
id
customer_id
fundi_id
service_id
amount
currency
commission_rate
commission_amount
fundi_amount
status
created_at
updated_at
```

### payments

```text
id
booking_id
customer_id
fundi_id
gateway
gateway_transaction_id
gateway_reference
amount
currency
status
paid_at
created_at
updated_at
```

### payouts

```text
id
payment_id
booking_id
fundi_id
amount
currency
gateway_payout_id
status
settled_at
created_at
updated_at
```

### commissions

```text
id
payment_id
booking_id
amount
currency
rate
status
created_at
```

### webhook_events

```text
id
gateway
event_id
event_type
transaction_id
payload
processed
processed_at
created_at
```

---

# 9. Payment State Machine

A payment should move through controlled states.

```text
             +----------------+
             |     CREATED    |
             +-------+--------+
                     |
                     v
             +----------------+
             | PENDING_PAYMENT|
             +-------+--------+
                     |
              +------+------+
              |             |
              v             v
        +-----------+   +-----------+
        |   SUCCESS |   |  FAILED   |
        +-----+-----+   +-----------+
              |
              v
        +-----------+
        |  SETTLING |
        +-----+-----+
              |
              v
        +-----------+
        |  SETTLED  |
        +-----------+
```

Possible additional states:

```text
CANCELLED
EXPIRED
REFUNDED
PARTIALLY_REFUNDED
DISPUTED
```

---

# 10. Booking State Machine

```text
PENDING_PAYMENT
       |
       v
PAYMENT_CONFIRMED
       |
       v
BOOKING_CONFIRMED
       |
       v
FUNDI_ASSIGNED
       |
       v
SERVICE_IN_PROGRESS
       |
       v
SERVICE_COMPLETED
       |
       v
SETTLEMENT_COMPLETED
```

For FundiBolt, payment confirmation and service completion should be treated as separate business events.

---

# 11. Recommended API Endpoints

## Customer

```http
POST /api/bookings
GET  /api/bookings/:id
POST /api/bookings/:id/pay
GET  /api/payments/:id
```

## Payment

```http
POST /api/payments
GET  /api/payments/:id
POST /api/payments/:id/verify
```

## Gateway Webhooks

```http
POST /api/webhooks/payment
POST /api/webhooks/payout
POST /api/webhooks/refund
```

## Fundi

```http
GET  /api/fundis/:id/payout-account
POST /api/fundis/:id/payout-account
GET  /api/fundis/:id/earnings
GET  /api/fundis/:id/transactions
```

The exact endpoints can be changed according to the final backend architecture.

---

# 12. Security Architecture

Payment processing should follow these principles:

### 12.1 Never trust the client

Do not calculate the final commission only in Flutter.

Bad:

```text
Flutter:
amount = 100000
commission = 10000
```

Better:

```text
Flutter
   |
   | booking ID
   v
Backend
   |
   | retrieves official service price
   | retrieves commission configuration
   | calculates split
   v
Payment Gateway
```

### 12.2 Verify gateway webhooks

Use the gateway's:

- webhook signature
- secret/token
- IP restrictions where supported
- transaction verification API where available

### 12.3 Use HTTPS

All production communication should use HTTPS.

```text
Flutter
   |
 HTTPS
   v
FundiBolt API
   |
 HTTPS
   v
Payment Gateway
```

### 12.4 Never store sensitive card information

FundiBolt should not store:

- card numbers
- CVV
- PINs
- mobile-money PINs

Use the payment gateway's hosted/secure payment flow.

---

# 13. Idempotency

Payment operations must support idempotency.

Example:

```text
Request:
Idempotency-Key = FB-BOOKING-000123
```

If the same request reaches the backend multiple times:

```text
Request 1 -> Payment created
Request 2 -> Existing payment returned
Request 3 -> Existing payment returned
```

This prevents accidental duplicate charges.

---

# 14. Financial Ledger

For a marketplace system, FundiBolt should maintain an internal transaction ledger even when the gateway performs the actual split.

Example:

```text
Transaction ID: TX-987654

CUSTOMER PAYMENT
+100,000 TZS

PLATFORM COMMISSION
+10,000 TZS

FUNDI PAYOUT
+90,000 TZS
```

This allows the administrator to reconcile:

```text
Gateway records
       |
       v
FundiBolt ledger
       |
       v
Bank settlement records
```

The ledger is for **accounting and reconciliation**. It does not mean FundiBolt is manually moving the customer's money.

---

# 15. Reconciliation

A scheduled reconciliation process should compare:

```text
FundiBolt Database
        |
        | compare
        v
Payment Gateway
        |
        | compare
        v
Company Bank Statement
```

The system should identify:

```text
MATCHED
MISSING PAYMENT
MISSING PAYOUT
WRONG AMOUNT
DUPLICATE TRANSACTION
FAILED SETTLEMENT
REFUND DIFFERENCE
```

Example:

```text
Expected Fundi payout: 90,000
Gateway payout:        90,000
Status:                MATCHED
```

---

# 16. Refund Architecture

Refunds should also go through the gateway.

```text
Customer
   |
   | Refund request
   v
FundiBolt API
   |
   | validate refund
   v
Payment Gateway
   |
   | refund
   v
Customer
```

The system should record:

```text
refund_id
payment_id
gateway_refund_id
amount
reason
status
created_at
completed_at
```

The effect of a refund on FundiBolt's commission and fundi payout must follow the gateway's supported refund/split rules.

---

# 17. Failure Handling

### Payment fails

```text
Customer
   |
   v
Gateway
   |
   | FAILED
   v
FundiBolt
   |
   v
Booking remains
PENDING_PAYMENT
```

### Payment succeeds but webhook is delayed

```text
Customer pays
      |
      v
Gateway
      |
      X webhook delayed
      |
      v
FundiBolt verifies transaction
      |
      v
Payment = SUCCESS
```

### Duplicate webhook

```text
Webhook #1 -> Processed
Webhook #2 -> Detected duplicate
Webhook #3 -> Ignored
```

### Payout fails

```text
Payment SUCCESS
      |
      v
Commission recorded
      |
      v
Fundi payout FAILED
      |
      v
Retry / investigate
      |
      v
Payout SETTLED
```

Do not mark a payout as successful simply because the customer payment succeeded.

---

# 18. Recommended Backend Components

```text
FundiBolt Backend
│
├── Auth Service
│
├── Booking Service
│
├── Payment Service
│   ├── Payment Creation
│   ├── Payment Verification
│   ├── Commission Calculation
│   └── Payment Status
│
├── Split Payment Service
│   ├── Gateway Split Configuration
│   ├── Fundi Recipient Mapping
│   └── Settlement Tracking
│
├── Webhook Service
│   ├── Payment Webhook
│   ├── Payout Webhook
│   └── Refund Webhook
│
├── Ledger Service
│
├── Reconciliation Service
│
└── Notification Service
    ├── Customer
    └── Fundi
```

---

# 19. Recommended Technology Stack

For the existing FundiBolt architecture:

```text
Mobile App
    Flutter
       |
       v
REST API
    Node.js + Express
       |
       +---- PostgreSQL
       |
       +---- Redis
       |
       +---- Payment Gateway API
       |
       +---- Webhook API
```

### PostgreSQL

Used for:

- users
- fundis
- bookings
- payments
- commissions
- payouts
- transactions
- webhook events
- reconciliation records

### Redis

Can be used for:

- temporary payment state
- idempotency keys
- webhook deduplication
- rate limiting
- background job coordination

Do **not** use Redis as the permanent financial record.

---

# 20. Security and Operational Rules

1. The backend determines the service price.
2. The backend calculates the commission.
3. The payment gateway processes the customer's payment.
4. The gateway performs the split where supported.
5. Webhooks are verified before processing.
6. Every gateway transaction has a unique internal reference.
7. Webhook processing is idempotent.
8. Payment and payout statuses are tracked separately.
9. Financial records are never deleted; use reversal/refund records.
10. All financial amounts are stored using appropriate decimal/integer monetary representation.
11. All production payment endpoints use HTTPS.
12. Gateway credentials are stored in environment/secret management, never in source code.
13. Reconciliation runs regularly.
14. Admins can view transaction history and settlement status.
15. Refunds and disputes are recorded separately from normal payments.

---

# 21. Final FundiBolt Transaction Architecture

```text
                    FUNDI BOLT MARKETPLACE
                            |
                            v
                    +---------------+
                    |    CUSTOMER   |
                    | Flutter App   |
                    +-------+-------+
                            |
                            | Booking
                            v
                    +---------------+
                    | FundiBolt API |
                    +-------+-------+
                            |
                +-----------+-----------+
                |                       |
                v                       v
        +---------------+       +---------------+
        |  PostgreSQL   |       |     Redis     |
        | Financial DB  |       | Idempotency   |
        +---------------+       +---------------+
                |
                |
                | Create payment + split
                v
        +--------------------------------+
        |       PAYMENT GATEWAY          |
        |                                |
        | Customer payment processing    |
        | Split payment / settlement     |
        +---------------+----------------+
                        |
             +----------+----------+
             |                     |
             v                     v
      +-------------+       +-------------+
      | FundiBolt   |       |    Fundi    |
      | Commission  |       |   Payout    |
      +-------------+       +-------------+
             |                     |
             +----------+----------+
                        |
                        v
               Settlement Records
                        |
                        v
                Reconciliation
                        |
                        v
                 Admin Dashboard
```

---

## 22. Key Principle

**FundiBolt is the marketplace platform, while the payment gateway is responsible for payment collection and automated split settlement.**

The ideal production flow is:

```text
CUSTOMER
   ↓
PAYMENT GATEWAY
   ↓
AUTOMATIC SPLIT
   ├── FundiBolt commission
   └── Fundi payout
   ↓
WEBHOOKS
   ↓
FundiBolt Backend
   ↓
PostgreSQL Ledger
   ↓
Reconciliation + Admin Reporting
```

This architecture should be implemented only after confirming that the selected Tanzanian payment gateway legally and technically supports **marketplace split payments and payouts to fundis' bank accounts**.
