# CODE INSPECTION — Phase 3

Date: 2026-09-16

## Evidence standard

- **CONFIRMED** — capability verified directly in source code.
- **DOCUMENTED** — described by project documentation but not yet verified in source.
- **CONCEPT** — intended/future capability.

## 1. AIME Network — canonical project model

### CONFIRMED: WorldProject is a canonical source model

Source: `aime-network/src/lib/aime/world/types.ts`

`WorldProject` contains, in one model: people, providers, moments, tasks, documents, payments, media, tracks, messages, reviews, intentions, extensible details, timeline edits, financial commitments, relations and missing information.

The model also carries `Confidence` values (`confirme`, `deduit`, `suggere`, `a_confirmer`, `manquant`) and optional source metadata.

**Reusable primitive:** one canonical project object with typed domain objects + confidence/provenance.

### CONFIRMED: Universal Timeline is derived, not duplicated

Source: `aime-network/src/lib/aime/world/derive.ts`

`deriveTimeline(project)` projects intentions, tasks, providers, documents, payments, moments, tracks, media and messages into timeline markers. It applies confidence-derived status, relations and non-destructive user timeline edits, then sorts chronologically.

The same file explicitly states that Timeline, Avant/Pendant/Après, finance, documents, media and music are projections of the same `WorldProject`.

**Reusable primitive:** canonical data → multiple views; Timeline as projection layer.

### CONFIRMED: Relation graph belongs to the project

Source: `aime-network/src/lib/aime/world/types.ts`, `timelineRelations.ts`

`WorldRelation` connects typed objects by `from_kind/from_id`, `to_kind/to_id` and a relation key. The graph is persisted with the canonical project model and projected onto timeline markers.

**Reusable primitive:** typed project graph.

### CONFIRMED: Free-text story → structured project

Source: `aime-network/src/lib/aime/world/parseStory.ts`

`readStory()` extracts explicit date, city, venue, guest count, ceremony time, couple and booked provider roles. `projectFromStory()` / `projectFromReading()` convert the reading into a `WorldProject`, using a project type/blueprint rather than assuming every project is a wedding.

The implementation explicitly avoids inventing information and preserves what is known versus what remains missing.

**Reusable primitive:** natural-language intention → structured project draft.

## 2. DISPOO — operational booking flow

### CONFIRMED: Availability is calculated from rules, exceptions and existing bookings

Source: `dispoo/src/routes/reserver.$slug.tsx`

The reservation flow loads professional availability and computes slots with `computeSlots()` using availability rules, exceptions, existing bookings, service duration, preparation time and travel time.

**Reusable primitive:** service availability → concrete bookable slots.

### CONFIRMED: Booking supports direct booking and request mode

Source: `dispoo/src/routes/reserver.$slug.tsx`

The selected service has a `booking_mode`; request-mode services do not expose normal computed slots and instead create a request-oriented flow.

**Reusable primitive:** two operational modes — immediate booking or request/validation.

### CONFIRMED: Reservation flow collects structured context

Source: `dispoo/src/routes/reserver.$slug.tsx`

The flow captures service, date, slot, client identity, email, phone, location, guest count, message and selected options. It can also use a context passport for authenticated users.

**Reusable primitive:** booking request with structured context.

### CONFIRMED: Online deposit payment is integrated

Source: `dispoo/src/routes/reserver.$slug.tsx`

The flow can initiate Stripe deposit payment or Paddle checkout depending on the professional/payment configuration.

**Reusable primitive:** booking → payment intent/checkout.

## 3. Initial convergence

The first confirmed architecture is now stronger than the initial hypothesis:

`INTENTION → PROJECT → RELATIONS → TIMELINE → ACTION`

with operational branches:

`PROJECT → PROVIDER → AVAILABILITY → BOOKING → PAYMENT`

and information branches:

`PROJECT → DOCUMENT / MEDIA / MUSIC / MESSAGE / MEMORY`

The important finding is that AIME already contains the canonical project + projection architecture, while DISPOO supplies an operational transaction layer. The future Composer should therefore investigate **how to connect these layers**, rather than duplicate them.

## 4. Still to inspect

- AIME persistence/schema and project creation routes
- DISPOO data schema and booking server functions
- Mission Proof proof/validation model
- SILLAGE collaboration/media model
- WEDDINGCITY event/marketplace model
- AIME-TIMELINE / timeline-theater narrative mechanics
- Passport / Studio / Archive / Cachet identity and memory primitives
- OPUS document/workflow primitives

No source project has been modified by this audit.
