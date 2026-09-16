# PROJECT STATE / UNIVERSAL TIMELINE 01

## Status

- Evidence: **CONFIRMED** for the source patterns explicitly cited below.
- Architectural conclusion: **PROPOSED**; this document does not claim that the proposed event/state model is already implemented in AIME-COMPOSER.
- Scope: determine how request, commercial engagement, production, validation, QA and publication can belong to one project memory without creating parallel project status systems.
- Source repositories remain untouched.

## 1. Audit question

The question follows the DISPOO commercial audit:

```text
REQUEST → COMMERCIAL → PRODUCTION → VALIDATION → QA → PUBLICATION
```

Can these stages be represented by one canonical project memory and one operational project timeline, while specialized entities keep their own local lifecycle states?

The answer supported by the current evidence is: **yes, with an important distinction between project-level state and entity-level state.**

## 2. AIME Network — strongest single-source pattern

`aime-network` directly documents `WorldProject` as the source for the project timeline. `deriveTimeline(project)` derives timeline markers from the project rather than maintaining a parallel project model. The home journey explicitly describes `WorldProject` as the single source and `deriveTimeline` as its projection.

Source evidence:

- `src/lib/aime/world/derive.ts`
- `src/components/aime/home/HomeJourney.tsx`
- `.lovable/plan/aime-phase-0-5-contrat-d-architecture-2026-09-04.md`

Confirmed architectural pattern:

```text
WORLD PROJECT
     ↓
DERIVE / PROJECTION
     ↓
UNIVERSAL TIMELINE
```

The same project can therefore feed multiple views without each view becoming a separate source of truth.

## 3. AIME-TIMELINE — event + review before project state

The audited AIME-TIMELINE primitive establishes a memory event as information with event/date/source/certainty or declaration state. Its review layer distinguishes information that exists from information that has been reviewed and can safely become project state.

This gives an important rule for the universal timeline:

```text
OBSERVED / EXTRACTED EVENT
        ↓
REVIEW / VALIDATION
        ↓
PROJECT-RELEVANT STATE
```

A timeline entry must therefore not automatically mean that the underlying fact is validated.

## 4. WEDDINGCITY — canonical memory + mutation + decision trail

`WEDDINGCITY/src/architecture/queryMutationCascade.ts` implements a canonical memory map, a QuerySystem, a MutationSystem, a CascadeEngine and a ProjectionSyncSystem. Mutations carry the changed field, previous/new value, validator, reason and timestamp, while the architecture records a `DecisionRecord` and identifies affected projections.

Source evidence:

- `src/architecture/queryMutationCascade.ts`
- `src/architecture/aiMemory.ts`

Confirmed pattern:

```text
CANONICAL MEMORY
      ↓
CHANGE
      ↓
DECISION RECORD
      ↓
IMPACT / CASCADE
      ↓
UPDATED PROJECTIONS
```

This is stronger than a simple `project.status` field because the history and reason for the transition remain inspectable.

## 5. DISPOO — local entity states are real and must not be collapsed

DISPOO demonstrates the opposite side of the problem: the commercial domain legitimately contains several state dimensions.

The inspected reservation/workspace model exposes:

- booking `status`;
- `payment_status`;
- `quote_status`;
- contract state;
- invoice state.

The commercial audit already established that quote, contract, payment and invoice are distinct entities with their own identity and lifecycle. They belong to an engagement attached to a project; they should not be collapsed into one generic project transaction state.

Source evidence:

- `src/routes/suivi.$reference.tsx`
- `src/integrations/supabase/types.ts`
- `src/routes/reserver.$slug.tsx`
- `AUDIT/DISPOO-COMMERCIAL-LAYER-01.md`

Therefore:

```text
PROJECT STATE ≠ QUOTE STATE ≠ CONTRACT STATE ≠ PAYMENT STATE ≠ INVOICE STATE
```

But they can all emit project-relevant events into the same project timeline.

## 6. The architectural mistake to avoid

Do **not** create independent canonical fields such as:

```text
project_status
commercial_status
production_status
review_status
approval_status
qa_status
publication_status
```

when those values are simply different readings of the same project history.

That design would recreate the duplication problem already identified by the source projects: several systems would have to be kept synchronized manually.

A single `status` field is also insufficient because it loses history, causality and evidence.

## 7. Proposed canonical model

The canonical project timeline should be an ordered set of project events.

```text
PROJECT MEMORY
      ↓
PROJECT EVENTS
      ↓
STATE / MILESTONE PROJECTIONS
```

Proposed event shape:

```text
ProjectEvent {
  id
  project_id
  type
  occurred_at
  actor
  source
  entity_ref
  payload
  evidence
  decision_id
  version_id
}
```

This is **PROPOSED**, not confirmed implementation.

Examples of `type`:

```text
REQUEST_RECEIVED
BRIEF_CREATED
QUOTE_SENT
QUOTE_ACCEPTED
CONTRACT_SIGNED
PAYMENT_CONFIRMED
CONTENT_RECEIVED
DESIGN_STARTED
PREVIEW_READY
COMMENT_ADDED
REVISION_REQUESTED
APPROVAL_GRANTED
QA_STARTED
QA_PASSED
PUBLICATION_REQUESTED
PUBLISHED
```

A specialized commercial state change can therefore remain local while also producing a project event.

## 8. State should be a projection, not the history

The preferred architecture is:

```text
PROJECT EVENTS / DECISIONS
          ↓
   STATE DERIVATION
          ↓
 CURRENT PROJECT STATE
```

The current state is useful for fast UI rendering, filtering and client communication, but the event/decision history remains the authoritative explanation of how the project arrived there.

Conceptually:

```text
currentState(project)
  = deriveState(project.events, project.decisions, constraints)
```

This is a proposed derivation rule, not an existing AIME-COMPOSER function.

## 9. Project state vs entity state

The universal model needs two levels:

### Project-level state
Answers:

> Where is the project as a whole?

Example projection:

```text
REQUESTED
→ ENGAGED
→ IN_PRODUCTION
→ IN_REVIEW
→ APPROVED
→ QA
→ PUBLISHED
```

### Entity-level state
Answers:

> Where is this particular object in its own lifecycle?

Examples:

```text
QUOTE: draft → available → accepted
INVOICE: draft → sent → paid
CONTRACT: unsigned → signed
PAYMENT: pending → succeeded / failed
VERSION: draft → approved
```

These states should remain local to the relevant entity and should feed the project projection through events/relations.

## 10. Universal timeline views

The same canonical event stream can produce different projections:

```text
                    PROJECT EVENTS
                         │
       ┌─────────┬───────┼────────┬─────────┐
       ↓         ↓       ↓        ↓         ↓
     CLIENT    AGENCY  COMMERCIAL PRODUCTION QA / PROOF
```

Examples:

- **Client view:** only events/actions relevant to the client.
- **Agency view:** full operational sequence.
- **Commercial view:** quote, contract, payment and invoice events.
- **Production view:** brief, content, design, development, review.
- **QA view:** checks, proof, defects, validation.
- **Public view:** approved/published milestones only.

No view should become a second canonical timeline.

## 11. Version, approval and publication

The project timeline must distinguish:

```text
COMMENT
  ↓
PROPOSAL
  ↓
REVISION / VERSION
  ↓
APPROVAL
  ↓
QA / PROOF
  ↓
PUBLICATION
```

An approval is a decision about a target version or proposal. Publication should reference the approved version rather than merely changing a free-form project status.

This preserves the existing AIME-COMPOSER rule that versions and approvals provide traceability.

## 12. Commercial integration

Commercial engagement remains a specialized layer attached to the project:

```text
PROJECT
  │
  ├── MEMORY / CONTENT / DESIGN / VERSIONS
  │
  ├── TIMELINE EVENTS
  │
  └── ENGAGEMENT
       ├── QUOTE
       ├── CONTRACT
       ├── PAYMENT
       └── INVOICE
```

Each commercial object keeps its own lifecycle. Relevant transitions emit project events.

Example:

```text
QUOTE.accepted
      ↓
PROJECT EVENT: QUOTE_ACCEPTED
      ↓
PROJECT STATE PROJECTION may become ENGAGED
```

The project state is therefore derived from the event, not duplicated inside the quote and project as independently editable values.

## 13. Impact and cascade

A change that affects the project should pass through the existing impact/cascade architecture:

```text
CHANGE
  ↓
IMPACT ANALYSIS
  ↓
HUMAN VALIDATION when required
  ↓
DECISION
  ↓
CASCADE
  ↓
PROJECT EVENT
  ↓
UPDATED PROJECTIONS
```

The event should explain what happened; the decision should explain why it was accepted; the projections should explain how the current views change.

## 14. Recommended canonical distinction

The convergence is therefore:

```text
PROJECT MEMORY
      ↓
CANONICAL EVENTS / DECISIONS
      ↓
UNIVERSAL OPERATIONAL TIMELINE
      ↓
DERIVED PROJECT STATE
      ↓
PROJECTIONS
```

While:

```text
COMPOSITION TIME
```

remains a distinct engine for temporal media composition, as established by the existing Master Architecture. Operational project time and composition time must not be merged into one semantic object.

## 15. Proposed minimum contracts

### ProjectEvent

```text
id
project_id
type
occurred_at
actor
source
entity_ref?
payload
evidence?
decision_id?
version_id?
```

### ProjectStateProjection

```text
project_id
state
state_since
blocking_items[]
next_action?
derived_from_event_id
updated_at
```

### EntityLifecycle

```text
entity_id
entity_type
state
state_since
```

The exact schemas remain **PROPOSED** until a deeper schema audit is completed.

## 16. Evidence classification

| Finding | Evidence | Classification |
|---|---|---|
| WorldProject → deriveTimeline | Direct source inspection | CONFIRMED |
| Canonical memory → mutation → cascade → projections | Direct WEDDINGCITY source | CONFIRMED |
| Event + review before trusted project state | Direct AIME-TIMELINE audit/source pattern | CONFIRMED |
| Commercial entities have independent lifecycle states | Direct DISPOO source inspection | CONFIRMED |
| One canonical project event stream | Architectural synthesis | PROPOSED |
| Project state derived from events | Architectural synthesis | PROPOSED |
| ProjectEvent schema above | Architectural proposal | PROPOSED |

## 17. Architectural conclusion

The evidence does **not** support collapsing every state in the system into one giant status enum.

It supports something more precise:

```text
ONE PROJECT MEMORY
        ↓
ONE CANONICAL PROJECT EVENT STREAM
        ↓
ONE OPERATIONAL PROJECT TIMELINE
        ↓
MANY DERIVED VIEWS

WITH

LOCAL ENTITY LIFECYCLES
FOR
QUOTE / CONTRACT / PAYMENT / INVOICE / VERSION / ETC.
```

This preserves domain semantics without creating parallel project-status systems.

## 18. Creative Web Studio consequence

For the future agency workflow:

```text
REQUEST
  ↓
PROJECT MEMORY
  ↓
BRIEF
  ↓
COMMERCIAL ENGAGEMENT
  ↓
CONTENT / DESIGN / DEVELOPMENT
  ↓
REVIEW / APPROVAL
  ↓
QA / PROOF
  ↓
PUBLICATION
```

Every meaningful transition can appear once in the project timeline, while each specialized subsystem keeps only the state it genuinely owns.

This gives the Creative Web Studio the intended operating principle:

> **One project. One memory. One operational timeline. Multiple projections.**

## 19. Guardrails

- No source repository modified.
- No source code copied.
- No invented project or commercial data.
- Proposed schemas are explicitly marked PROPOSED.
- Commercial entity states are not erased or generalized away.
- Composition time remains separate from operational project time.
- Human approval remains explicit where a change affects validated project state.

## 20. Next audit question

Before implementation, the next useful audit is the **actual schema/route comparison** for project state, history, comments, approvals and publication across the highest-priority sources.

The goal is to determine which parts of `ProjectEvent`, `Decision`, `Version`, `Approval` and `Publication` are already concretely implemented and which remain architectural synthesis.
