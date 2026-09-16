# DISPOO — COMMERCIAL LAYER 01

## Status

- Evidence: **CONFIRMED** for the commercial document/workflow surface inspected in `src/routes/buro.index.tsx` and the existing reservation flow.
- Reuse: **REUSE_ADAPT**.
- Scope: extract the commercial primitive; do not copy DISPOO source code or data.
- Source repository remains untouched.

## Direct evidence

`src/routes/buro.index.tsx` defines a Bureau document model with explicit kinds:

- `devis`
- `facture`
- `contrat`
- `reservation`
- `message`
- `passeport`

The Bureau explicitly groups reservations, quotes, contracts, invoices, messages and passport information into one client-facing workspace.

Observed status models include:

- Quote: `draft`, `available`, `accepted`, `declined`
- Invoice: `draft`, `sent`, `paid`, `cancelled`
- Contract: unsigned vs signed, with `accepted_at` and `accepted_name`
- Booking: booking status plus `quote_status`

The Bureau queries canonical Supabase entities including:

- `invoices`
- `contracts`
- `bookings`
- `notifications`
- `client_context_passports`

The booking/reservation flow previously inspected in `src/routes/reserver.$slug.tsx` confirms service selection, availability, booking/request mode, client information, options and configured payment handoff through Stripe or Paddle.

## Extracted primitive

```text
PROJECT / REQUEST
      ↓
RESERVATION / ENGAGEMENT
      ↓
QUOTE
      ↓
CONTRACT
      ↓
PAYMENT
      ↓
INVOICE
      ↓
DELIVERY / PROJECT TIMELINE
```

This is a commercial lifecycle attached to a project, not a replacement for project memory.

## Creative Web Studio adaptation

For a web-agency workflow the same layer can become:

```text
CLIENT REQUEST
      ↓
BRIEF / PROJECT
      ↓
QUOTE
      ↓
CONTRACT
      ↓
PAYMENT
      ↓
PRODUCTION
      ↓
INVOICE
      ↓
PUBLICATION / MAINTENANCE
```

The important architectural rule is:

```text
PROJECT MEMORY
      │
      ├── BRIEF
      ├── CONTENT
      ├── DESIGN
      ├── VERSIONS
      ├── COMMENTS
      ├── APPROVALS
      ├── QA / PROOF
      │
      └── COMMERCIAL ENGAGEMENT
             ├── QUOTE
             ├── CONTRACT
             ├── PAYMENT
             └── INVOICE
```

Commercial objects should reference the project rather than create a second project database.

## Payment boundary

Payment is an engagement/transaction layer. It should not become the source of truth for the project itself.

For the future Creative Web Studio architecture:

- quote records the commercial proposal;
- contract records the accepted contractual state;
- payment records the transaction/proof handled by a PSP;
- invoice records the accounting document/state;
- project memory remains the source of truth for production.

This is compatible with the existing AIME principle that AIME does not itself become the payment processor.

## Client experience

The commercial layer should remain visible inside the same project space:

```text
PROJECT
  ├── Timeline
  ├── Content
  ├── Design
  ├── Comments
  ├── Approvals
  ├── Documents
  └── Commercial
       ├── Quote
       ├── Contract
       ├── Payment
       └── Invoice
```

A frictionless client link can expose only the actions currently required, for example:

```text
LINK → PROJECT → CURRENT STATE → ACTION REQUIRED
```

The client should not need a full account merely to review or accept a quote/contract when the underlying workflow permits tokenized access.

## Important distinction

`BOOKING`, `QUOTE`, `CONTRACT`, `PAYMENT` and `INVOICE` are related but not interchangeable entities.

They should not be collapsed into one generic `transaction` object because they have different states, evidence and lifecycle semantics.

Recommended generic relationship:

```text
ENGAGEMENT
  ├── REQUEST / RESERVATION
  ├── QUOTE
  ├── CONTRACT
  ├── PAYMENT
  └── INVOICE
```

The engagement is the commercial container; each document/transaction retains its own identity and state.

## Convergence with existing AIME-COMPOSER primitives

```text
IDENTITY
   ↓
PROJECT MEMORY
   ↓
UNIVERSAL TIMELINE
   ↓
BRIEF / CONTENT / DESIGN
   ↓
COMPOSITION
   ↓
VERSION
   ↓
COMMENT / PROPOSAL
   ↓
APPROVAL
   ↓
QA / PROOF
   ↓
COMMERCIAL ENGAGEMENT
   ├── QUOTE
   ├── CONTRACT
   ├── PAYMENT
   └── INVOICE
   ↓
PUBLICATION / EXPERIENCE
```

This closes an important gap in the Creative Web Studio model: the project can now connect its creative production lifecycle to its commercial lifecycle without duplicating the project itself.

## Guardrails

- No source code copied from DISPOO.
- No source assets copied.
- No invented quote, contract, invoice or payment data.
- Wedding-specific terminology remains contextual and is not promoted to the universal model.
- Exact payment-provider behavior remains source-specific configuration.
- Accounting/legal requirements must be validated separately before production use.

## Next audit question

The next architectural question is not another isolated feature. It is the **single Project Timeline / State Machine** that connects:

`REQUEST → COMMERCIAL → PRODUCTION → VALIDATION → QA → PUBLICATION`

without creating parallel status systems.
