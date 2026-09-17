# NOEMA FINANCIAL ENGINE V1

Status: PROPOSED / DOCUMENTATION ONLY

## Purpose
NOEMA represents present liquidity, documented receivables, contractual future income, expenses, forecasts and scenarios without confusing them. It is an intelligence/proof layer above regulated banks and payment providers; it is not itself a bank, lender or payment service provider.

## Core model
```text
CURRENT LIQUIDITY
+ DOCUMENTED RECEIVABLES
+ CONTRACTUAL COMMITMENTS
+ CONFIRMED FUTURE BOOKINGS
+ RECURRING INCOME
- DOCUMENTED FUTURE CHARGES
- COMMITTED EXPENSES
        ↓
TEMPORAL FINANCIAL POSITION
        ↓
EVIDENCE + CONFIDENCE + DATES
        ↓
SCENARIOS / PROPOSALS
        ↓
HUMAN VALIDATION
        ↓
REGULATED EXECUTION / PAYMENT PROVIDER
        ↓
PROOF / RECONCILIATION
```

## Six states that must never be mixed
- `MONEY` — currently available funds.
- `RECEIVABLE` — documented amount owed.
- `COMMITMENT` — contractual or conditional future income.
- `PROJECTION` — estimate derived from evidence.
- `CAPACITY` — potential economic capacity, not money.
- `SCENARIO` — simulation, never a statement of fact.

Skills, portfolio, reputation or historical activity can inform capacity or a scenario, but never become money or a guaranteed receivable.

## Financial memory
Canonical objects reuse the universal evidence contract:
`Account`, `Income`, `Receivable`, `Contract`, `Booking`, `Invoice`, `Payment`, `Expense`, `FinancialEvent`, `FinancialScenario`, `FinancialAuthorization`.

Each carries source, owner, dates, evidence, confidence, status, visibility, permission, version and audit history.

## Confidence
Confidence is evidence-based, not a single opaque score. A possible hierarchy is:
`BANK CONFIRMED → PAYMENT CONFIRMED → INVOICE ISSUED → SIGNED CONTRACT → CONFIRMED BOOKING → ACCEPTED QUOTE → PROPOSAL → FORECAST → CAPACITY`.

The interface must show why a figure exists and what could change it.

## Financial timeline
The Universal Timeline is the temporal spine: current balance, invoices due, confirmed bookings, expected payments, future charges, recurring income and scenarios. NOEMA may answer “What is documented to arrive before this charge?” rather than “You have this money.”

## Mobilisation / routing
Where a legal and contractual mechanism permits it, NOEMA can prepare a proposal to mobilise a receivable or route a future payment:
`SELECT RECEIVABLE → CHECK OWNERSHIP / STATUS → CHECK CONTRACT / DEBTOR → CHECK ELIGIBILITY → CHECK AUTHORIZATION → PREPARE PROPOSAL → HUMAN VALIDATION → REGULATED PROVIDER / BANK → RESULT → PROOF`.

NOEMA never silently redirects a payment destination.

## Financial permissions
Permissions are explicit and revocable: view account data; view income/receivable data; share selected evidence; select receivables; request financing/assignment; initiate payment; change destination; approve/reject proposal; revoke authorization.

A bank, accountant, client or payment provider sees only the scope explicitly authorized.

## Solvency / credit boundary
NOEMA may prepare an evidence-backed financial picture or scenario. It must not turn an opaque model into an unexplained automated credit decision. Where a regulated actor makes the decision, NOEMA supplies traceable evidence and explanations rather than pretending to be the decision-maker.

## Privacy and governance
Financial data is sensitive operational data. Every access and transmission requires a purpose, authorization, provenance and audit trail. The person must be able to see what was shared, with whom, why, for how long and revoke access where applicable.

## Interfaces
```text
Financial.readPosition()
Financial.listReceivables()
Financial.forecast()
Financial.simulate()
Financial.proposeMobilisation()
Financial.requestAuthorization()
Financial.routePayment()
Financial.reconcile()
Financial.recordProof()
Financial.revokeAuthorization()
```

## Non-goals
- No shadow bank account.
- No hidden credit score.
- No guarantee that future capacity becomes cash.
- No autonomous financial commitment.
- No payment-provider replacement.
- No mixing of confirmed money and forecasts.

## Integration
```text
NOEMA
├── MEMORY
├── UNIVERSAL TIMELINE
├── UNIVERSAL BUREAU
├── DOCUMENT ENGINE
├── FINANCIAL ENGINE
├── ACTION / PAYMENT CONNECTORS
└── GOVERNANCE
```

The Financial Engine is a canonical projection of the same world model, not a separate finance database.

## Final principle
> NOEMA ne regarde pas seulement ce que vous possédez aujourd'hui. Elle comprend ce qui est documenté, engagé, attendu et possible dans le temps — sans jamais confondre une preuve avec une promesse.
