# AIME-COMPOSER — Validation / Proof / Cascade Audit

## Evidence

### WEDDINGCITY — CONFIRMED
`src/architecture/aiMemory.ts` defines explicit source confidence, user validation, decision trails, impact analysis, reversibility and provenance. `src/architecture/queryMutationCascade.ts` defines canonical query, validated mutation, cascade execution and projection synchronization. fileciteturn330file0 fileciteturn331file0

### Mission Proof Permanent — CONFIRMED at product level
The project README describes mission tracking with proof of execution, localization, notifications and validation, with persistent proof uploads and verification-oriented infrastructure. fileciteturn333file0

## Reusable primitive

```text
CHANGE / ACTION
      ↓
EVIDENCE
      ↓
REVIEW
      ↓
VALIDATION
      ↓
IMPACT ANALYSIS
      ↓
CASCADE / UPDATE
      ↓
QA / PROOF
      ↓
DECISION RECORD
```

## Creative Web Studio adaptation

```text
CLIENT REQUEST
      ↓
CONTENT / DESIGN CHANGE
      ↓
COMMENT / PROPOSAL
      ↓
NEW VERSION
      ↓
CLIENT APPROVAL
      ↓
IMPACT ANALYSIS
      ├── page
      ├── responsive layouts
      ├── SEO/content metadata
      ├── navigation
      └── QA
      ↓
PROOF / QA
      ↓
PUBLICATION
      ↓
TRACEABLE DECISION
```

## Semantic rules

- COMMENT = observation.
- PROPOSAL = requested change.
- VERSION = concrete state being reviewed.
- APPROVAL = explicit human decision on a version/change.
- PROOF = evidence that an action/result was actually performed or verified.
- CASCADE = propagation of a validated change to dependent projections.
- DECISION RECORD = durable provenance of who changed/validated what, when, and with what impact.

## Important architectural consequence

Validation must not be implemented as a single boolean `approved=true`. Approval belongs to a specific version/change and should preserve actor, timestamp, scope and impact. This is consistent with WEDDINGCITY's decision trail and impact model. fileciteturn330file0

For the future Creative Web Studio, this creates a real client-production contract:

`BRIEF → PRODUCTION → REVIEW → APPROVAL → PROOF → PUBLICATION`

No downstream publication should be represented as approved merely because a comment was resolved.

## Reuse classification

- WEDDINGCITY: `REUSE_ADAPT`
- Mission Proof Permanent: `REUSE_ADAPT`
- Generic web-agency workflow: architectural adaptation, not a claim that either source already implements it.

## Scope guard

This audit does not copy source code, source assets or domain-specific wedding behavior into AIME-COMPOSER. It records reusable architectural primitives and their evidence.