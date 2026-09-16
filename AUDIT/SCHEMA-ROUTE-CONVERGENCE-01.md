# SCHEMA / ROUTE CONVERGENCE 01

## Status

- Evidence: **CONFIRMED** where direct source code was inspected.
- Architectural conclusions: **PROPOSED** where synthesis goes beyond existing source structures.
- Scope: determine which parts of `ProjectEvent → Decision → Version → Approval → QA → Publication` already exist concretely.
- Source repositories remain untouched.

## 1. Audit question

PR #13 proposed a canonical project event stream and derived project state. This audit checks whether the underlying primitives already exist in source repositories before any implementation abstraction is created.

Target chain:

```text
PROJECT
  ↓
EVENT / MEMORY
  ↓
DECISION
  ↓
VERSION / PROPOSAL
  ↓
APPROVAL
  ↓
QA / PROOF
  ↓
PUBLICATION
```

The evidence shows that these concerns already exist, but **not as one shared schema**. They are distributed across several concrete models and routes.

## 2. AIME Network — concrete project/world model and projections

Direct inspection of `src/lib/aime/world/projectFromEvent.ts` confirms that a persisted `events` row is transformed into a `WorldProject`. The adapter consumes event participants, quotes, payments and music tracks and produces project fields such as lifecycle, moments, documents, payments, tracks, intentions and missing information. The source explicitly states that the timeline is subsequently a projection from the world model and that missing information is not invented. fileciteturn453file0L2-L10

Confirmed pattern:

```text
DATABASE EVENT
     ↓
WorldProject
     ↓
DERIVED VIEWS / TIMELINE
```

Important consequence: **AIME Network already contains the strongest concrete precedent for project-as-world + derived timeline.** It does not currently prove the proposed generic `ProjectEvent` schema.

## 3. WEDDINGCITY — concrete memory, decision and cascade system

`aiMemory.ts` defines a concrete `AIMemoryEntity` with source metadata, certainty, confidence, a `decision_trail`, access control, timestamps and metadata. It also defines `DecisionRecord` and `ImpactRecord`, including validator, original extraction, corrections, affected projections and cascaded entities. fileciteturn455file0L2-L10

`queryMutationCascade.ts` concretely implements:

```text
QUERY CANONICAL MEMORY
        ↓
MUTATION
        ↓
DECISION RECORD
        ↓
CASCADE
        ↓
PROJECTION SYNC
```

The mutation carries entity, changed field, old/new values, reason, validator and timestamp; the cascade engine identifies affected projections and the projection sync system recomputes projection data. fileciteturn454file0L2-L10

Confirmed: **Decision + impact + cascade are real source primitives.**

Not confirmed: that WEDDINGCITY already has a generic project event stream equivalent to the PR #13 proposal.

## 4. WEDDINGCITY — versioning is present, but not yet a universal project Version entity

The source contains persisted schema-version machinery (`SCHEMA_VERSION`) and explicit product documentation describing dated versions of a project state. The repository search also identifies `docs/INNOVATIONS-V4.md` as discussing a dated frozen version and comparison after multiple modifications. fileciteturn458file6L74-L84 fileciteturn458file12L157-L165

This is evidence for **version concepts**, but it should not be reinterpreted as proof of a reusable generic `Version` entity for the Creative Web Studio.

Classification: **CONFIRMED concept / SOURCE-DEPENDENT implementation**.

## 5. DISPOO — concrete request, booking and commercial flow

The public `/reserver/$slug` route implements a real multi-step flow: service selection, date, slot, client coordinates, summary and confirmation. It supports both reservation and request/quote modes, stores a request key, distinguishes booking status from payment status, and creates a booking either through an authenticated function or a public API. fileciteturn459file0L2-L2

The concrete flow is therefore:

```text
SERVICE
  ↓
DATE
  ↓
SLOT / REQUEST
  ↓
CLIENT DATA
  ↓
BOOKING RECORD
  ↓
PAYMENT HANDOFF
```

The route also creates a tokenized guest follow-up URL when available. fileciteturn459file0L2-L2

Confirmed: **request/engagement/payment handoff exists concretely.**

It should remain a commercial/domain-specific subsystem rather than becoming the generic project event model.

## 6. OPUS — concrete tokenized client projection

`/suivi/$token` is a concrete no-account, read-only client projection. It loads a dossier by token and renders its steps with states such as received, expected and blocked, plus a last-update timestamp. The route explicitly describes the projection as read-only and excludes sensitive identifiers and bank coordinates. fileciteturn460file0L2-L10

Confirmed pattern:

```text
PROJECT / DOSSIER
      ↓
ACCESS TOKEN
      ↓
CLIENT PROJECTION
      ↓
CURRENT STATE + ACTION REQUIRED
```

This validates the PR #13 idea of multiple projections over one project memory, but it does not establish a universal publication/approval schema.

## 7. What actually exists today

| Primitive | Concrete source evidence | Classification | Reuse direction |
|---|---|---|---|
| Project/world object | AIME Network `WorldProject` | CONFIRMED | REUSE_ADAPT |
| Derived timeline | AIME Network `derive` architecture | CONFIRMED | REUSE_ADAPT |
| Canonical memory | WEDDINGCITY `AIMemoryEntity` | CONFIRMED | REFERENCE / ADAPT |
| Decision trail | WEDDINGCITY `DecisionRecord` | CONFIRMED | REUSE_ADAPT |
| Impact analysis | WEDDINGCITY `ImpactRecord` | CONFIRMED | REUSE_ADAPT |
| Cascade/projection sync | WEDDINGCITY systems | CONFIRMED | REUSE_ADAPT |
| Booking/request lifecycle | DISPOO | CONFIRMED | REUSE_ADAPT |
| Payment handoff | DISPOO | CONFIRMED | SOURCE_DEPENDENT |
| Tokenized client projection | OPUS | CONFIRMED | REUSE_ADAPT |
| Version concept | WEDDINGCITY | CONFIRMED | SOURCE_DEPENDENT |
| Generic ProjectEvent | No direct equivalent found in inspected sources | NOT_CONFIRMED | PROPOSED |
| Generic Approval entity | No direct equivalent established in this pass | NOT_CONFIRMED | PROPOSED |
| Generic Publication record | No direct equivalent established in this pass | NOT_CONFIRMED | PROPOSED |
| Generic QA/Proof entity | Existing audited Mission Proof pattern, but not yet schema-converged here | DOCUMENTED | REUSE_ADAPT |

## 8. Critical convergence finding

The architecture should **not** copy any one source's internal schema wholesale.

The actual convergence is:

```text
AIME NETWORK
  = WORLD / PROJECT / DERIVED TIMELINE

WEDDINGCITY
  = MEMORY / DECISION / IMPACT / CASCADE / PROJECTIONS

DISPOO
  = REQUEST / ENGAGEMENT / COMMERCIAL LIFECYCLES

OPUS
  = TOKENIZED CLIENT PROJECTION
```

These are complementary primitives, not competing implementations of the same table.

## 9. Consequence for `ProjectEvent`

The proposed `ProjectEvent` from PR #13 remains useful as an architectural **integration contract**, but this audit does not find an existing source table that should simply be renamed `ProjectEvent`.

A future implementation should therefore treat it as an adapter-level convergence model:

```text
SOURCE DOMAIN OBJECT / DECISION
             ↓
       PROJECT EVENT
             ↓
   OPERATIONAL TIMELINE
             ↓
       STATE PROJECTION
```

The event can reference its originating entity rather than replacing that entity.

Example:

```text
QUOTE.accepted
      ↓
ProjectEvent(type=QUOTE_ACCEPTED, entity_ref=quote.id)
      ↓
project state projection
```

This preserves DISPOO's commercial semantics while giving the universal project timeline a common vocabulary.

## 10. Decision and event must remain different

WEDDINGCITY demonstrates why a decision should not simply be represented as an event label. A decision contains validator, original extraction, correction, confidence and impact information. fileciteturn455file0L2-L10

Therefore:

```text
EVENT = WHAT HAPPENED
DECISION = WHY / BY WHOM IT WAS ACCEPTED OR CORRECTED
```

They may be linked, but they are not the same object.

## 11. Version, approval and publication

This audit does **not** establish a sufficiently concrete shared implementation for:

```text
VERSION
APPROVAL
PUBLICATION
```

The existing evidence supports version-like behavior and client/public projections, but not one universal schema spanning all source projects.

Therefore these remain **PROPOSED convergence contracts**, not confirmed reusable database entities.

Recommended future shape:

```text
VERSION
  ↓
APPROVAL(target_version)
  ↓
QA / PROOF
  ↓
PUBLICATION(approved_version)
```

The exact persistence model should wait for the dedicated version/approval/publication audit.

## 12. Route convergence

The inspected routes reveal three different surfaces that should remain distinct at product level:

```text
REQUEST / RESERVATION
        = DISPOO

CLIENT FOLLOW-UP
        = OPUS-style token projection

PUBLICATION
        = AIME Studio / public site projection
```

They can all attach to one project memory, but they should not become one universal route or one overloaded controller.

## 13. Creative Web Studio mapping

For the future agency system, the source evidence supports this composition:

```text
REQUEST
  ↓
PROJECT MEMORY
  ├── CONTENT / BRIEF
  ├── COMMERCIAL ENGAGEMENT
  ├── DECISIONS
  ├── VERSIONS
  ├── COMMENTS / PROPOSALS
  ├── QA / PROOF
  └── PUBLICATION
          ↓
   OPERATIONAL TIMELINE
          ↓
   CLIENT / AGENCY / PUBLIC VIEWS
```

The key is not to create seven independent status engines. The key is to create **one integration timeline over already-owned domain objects**.

## 14. What should NOT be implemented yet

Do not yet create:

- a new universal database replacing `events`, bookings, quotes or memory entities;
- a giant `status` enum covering every subsystem;
- a generic Approval table merely because the architecture diagram contains `APPROVAL`;
- a generic Publication table before the concrete AIME Studio publication model is inspected;
- duplicated copies of source project data inside AIME-COMPOSER;
- a second operational timeline separate from the canonical project history.

## 15. Next audit

The remaining high-value gap is now narrower:

**AUDIT #15 — Version / Approval / QA / Publication convergence.**

Inspect directly:

```text
VERSION
COMMENT / PROPOSAL
APPROVAL
QA / PROOF
PUBLICATION
```

across the strongest sources, especially WEDDINGCITY, Mission Proof, AIME Studio, AIME Network and DISPOO.

The purpose is to determine exactly which of these are already concrete entities, which are route-level workflows, and which are only architectural concepts.

## Guardrails

- Source repositories untouched.
- No source code or assets copied.
- No invented data.
- Direct observations separated from proposed convergence.
- Existing domain lifecycles preserved.
- No implementation abstraction introduced by this audit.
