# AIME-COMPOSER — Identity / Client Portal Primitive

## Status

- Evidence level: CONFIRMED for the cited source structures.
- Reuse classification: REUSE_ADAPT.
- Scope: identity, public profile, project access and lean client follow-up.
- Source repositories remain untouched.
- This is architectural extraction, not implementation in AIME-COMPOSER.

## 1. AIME Passport — identity and public publication

`aime-passport` is a private Base44 application. Its current `src/App.jsx` confirms authentication, registration, onboarding, passport preview, public profile routing, public passport access, generated mini-sites, public `+address` sites and an embeddable chat surface.

Observed routes include:

```text
/authentication
/onboarding
/passeport/:code
/profil
/site/:id
/:adresse
/embed/chat
```

The source therefore supports a reusable distinction between:

```text
IDENTITY
  ↓
PERSON / ORGANIZATION
  ↓
PROFILE / PASSPORT
  ↓
PUBLIC PRESENCE
  ↓
PROJECTS / PUBLICATIONS
```

The important architectural point is that identity is not equivalent to a project. A single client identity can be associated with multiple project contexts and public surfaces.

## 2. OPUS — tokenized client access

`opus-admin/src/routes/suivi.$token.tsx` confirms a lean follow-up page accessible through a tokenized URL.

The page is explicitly read-only and does not require an account. It exposes the real state of a dossier as a sequence of steps with states such as received, expected and blocked, plus a last-update timestamp.

Generic abstraction:

```text
CLIENT
  ↓
UNIQUE ACCESS LINK
  ↓
PROJECT / DOSSIER
  ├── STATUS
  ├── TIMELINE / STEPS
  ├── CONTENT / DOCUMENTS
  ├── ACTIONS
  └── VALIDATIONS
```

This is highly relevant to a Creative Web Studio because a client should be able to enter a project without navigating an internal agency dashboard.

## 3. Creative Web Studio adaptation

The combined primitive should become:

```text
CLIENT IDENTITY
      ↓
PROJECT ACCESS
      ↓
PROJECT MEMORY
      ↓
UNIVERSAL TIMELINE
      ├── BRIEF
      ├── CONTENT
      ├── DESIGN
      ├── VERSIONS
      ├── COMMENTS
      ├── APPROVALS
      ├── DOCUMENTS
      └── QA / PROOF
```

Two access modes should coexist:

### A. Authenticated client space

For clients with an account or recurring relationship:

```text
PROFILE
  ↓
MY PROJECTS
  ↓
PROJECT
  ↓
TIMELINE
```

### B. Frictionless project link

For a one-off client:

```text
UNIQUE LINK
  ↓
PROJECT
  ↓
CURRENT STATE
  ↓
ACTION REQUIRED
```

The second mode is directly supported by the OPUS pattern and avoids forcing a client to create an account merely to review a website project.

## 4. Important semantic distinction

The client portal is not a second project database.

It is a **projection of Project Memory** filtered by access rights and workflow state.

Therefore:

```text
PROJECT MEMORY
      ↓
ACCESS POLICY
      ↓
CLIENT PROJECTION
```

The same source of truth can serve the agency workspace, client portal, public preview and publication layer without duplicating project data.

## 5. Creative Web Studio client journey

The architecture now supports this complete client-facing loop:

```text
REQUEST
  ↓
BRIEF
  ↓
PROJECT SPACE
  ↓
CONTENT COLLECTION
  ↓
DESIGN / COMPOSITION
  ↓
PREVIEW
  ↓
COMMENT / PROPOSAL
  ↓
REVISION
  ↓
APPROVAL
  ↓
QA / PROOF
  ↓
PUBLICATION
```

At every stage the client should see only the information and actions relevant to the current state.

## 6. Reuse classification

| Source | Primitive | Evidence | Reuse |
|---|---|---|---|
| AIME Passport | Identity / public profile / public presence | CONFIRMED | REUSE_ADAPT |
| OPUS | Tokenized read-only project follow-up | CONFIRMED | REUSE_ADAPT |
| AIME Network | Project Memory / universal timeline | CONFIRMED | REUSE_ADAPT |
| WEDDINGCITY | Access-aware memory / decision trail | CONFIRMED | REUSE_ADAPT |

## 7. Architectural conclusion

A Creative Web Studio should not begin with an account dashboard.

It should begin with a **project** and make access progressively richer:

```text
NO ACCOUNT
   ↓
PROJECT LINK
   ↓
CLIENT SPACE
   ↓
IDENTITY
   ↓
MULTIPLE PROJECTS
```

This reduces client friction while preserving a durable identity model for recurring clients.

## 8. Next audit question

The remaining major gap is the operational/commercial layer around the project:

```text
PROJECT
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
```

DISPOO contains the strongest audited booking, quote, contract, invoice and payment patterns. The next pass should determine how these commercial objects attach to Project Memory without becoming a second source of truth.
