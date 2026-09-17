# NOEMA / AIME — IMPLEMENTATION CONTRACT V1

Status: **PROPOSED / READY FOR IMPLEMENTATION**

This document converts the final convergence architecture into implementation rules. It does not introduce new top-level organs. It defines how existing audited primitives must connect without creating duplicate sources of truth.

## 1. Implementation order

Implementation must proceed in vertical slices, not by building every engine independently.

```text
SLICE 0 — FOUNDATION
  canonical IDs / provenance / evidence / permissions / audit

SLICE 1 — MEMORY
  Universal Card / Project / Organization / Person / Document / Media

SLICE 2 — TIMELINE
  canonical event stream → Universal Timeline → modes / projections

SLICE 3 — BUREAU
  LOCAL → ingestion → classification → dossier → requirements → proof

SLICE 4 — COMPOSER
  Media → Grid → Timeline → Art Engine → Version

SLICE 5 — COLLABORATION
  Comment → Proposal → Revision → Approval → Client Portal

SLICE 6 — ACTION
  Connector → Communication → Automation → Authorization → Result → Proof

SLICE 7 — SITE
  Site Foundation → pages → SEO / legal / analytics / accessibility → Release

SLICE 8 — GOVERNANCE
  export → recovery → audit → monitoring → lifecycle maintenance
```

## 2. Canonical object rule

Every persisted object must have a stable identifier and provenance.

Minimum metadata:

```text
id
created_at
updated_at
source
source_type
owner
visibility
permission
confidence
status
version
```

Objects may reference one another, but derived views must not silently become canonical data.

## 3. Universal event contract

All meaningful state changes should be representable as an event:

```text
ProjectEvent
  id
  project_id
  type
  occurred_at
  actor
  source
  entity_ref
  payload
  evidence
  decision_id?
  version_id?
```

The event stream is append-oriented. Current state is derived from events and canonical entities where appropriate.

## 4. Universal action contract

No engine may execute an external or consequential action using a private permission model.

```text
intent
context
proposal
scope
risk
authorization
execution
result
proof
recovery
```

Authorization must explicitly identify:

```text
actor
resource
action
scope
purpose
valid_from
valid_until?
revocable
```

## 5. Evidence and uncertainty

NOEMA must distinguish:

```text
OBSERVED
EXTRACTED
INFERRED
PROPOSED
CONFIRMED
SUPERSEDED
```

UI and APIs must expose uncertainty when it matters. Inference must never be serialized as confirmed fact without a confirmation event.

## 6. Privacy and security by design

Privacy and security are architecture constraints, not post-production checks. Personal-data processing must be minimized, access controlled, auditable and designed with privacy-respecting defaults. Development and test environments should use fictional or anonymized data wherever possible. This aligns with CNIL guidance on privacy by design, security, testing, secrets and access management.

No production secrets or real sensitive personal data belong in the repository, fixtures or demo states.

## 7. Human decision boundary

Default capability:

```text
READ
UNDERSTAND
CLASSIFY
SEARCH
COMPARE
DRAFT
PROPOSE
SIMULATE
EXPLAIN
REMIND
```

Authorization required according to context for:

```text
PUBLISH
SEND
SHARE SENSITIVE DATA
DELETE IRREVERSIBLY
PAY
SIGN / COMMIT
CHANGE EXTERNAL SYSTEMS
```

## 8. Source-of-truth examples

### Identity

```text
Universal Card
   ↓
Site Foundation
   ↓
Footer / Legal / Structured Data / Contact / Documents
```

### Project

```text
Project Memory
   ↓
Timeline / Brief / Composer / Portal / Publication
```

### Media

```text
Universal Media Asset
   ↓
Media Slot
   ↓
Composition / Site / Social / Document
```

### Document

```text
Canonical Document
   ↓
Dossier / Requirement / Generated Version / Portal / Communication
```

## 9. Universal integration interfaces

Each engine should expose a small stable contract rather than internal implementation details.

```text
Memory.read()
Memory.writeProposal()
Memory.confirm()

Search.query()

Relation.find()

Timeline.appendEvent()
Timeline.project()

Document.ingest()
Document.extract()
Document.generate()

Permission.check()
Permission.request()
Permission.revoke()

Action.propose()
Action.authorize()
Action.execute()

Proof.record()
Proof.verify()

Publication.prepare()
Publication.release()
Publication.rollback()

Export.snapshot()
Export.restoreProposal()
```

Names are conceptual contracts, not mandatory function names.

## 10. UI rule

The interface should expose the universal systems progressively.

The human should normally see:

```text
WHAT AM I DOING?
WHAT DOES NOEMA KNOW?
WHAT IS PROPOSED?
WHAT DO I NEED TO VALIDATE?
WHAT HAPPENED?
```

Not the full engine graph.

Advanced users can inspect provenance, evidence, permissions, versions and audit history.

## 11. Definition of done for an engine

An engine is not complete because its UI exists.

It must provide:

- documented purpose;
- source-of-truth definition;
- input/output contract;
- provenance;
- confidence/uncertainty where applicable;
- permission boundary;
- error states;
- audit/proof behavior;
- tests;
- recovery or rollback behavior where relevant;
- integration with the canonical model;
- no duplicate competing database/model.

## 12. Definition of done for a vertical slice

A vertical slice is complete only when:

```text
REAL INPUT
 → UNDERSTANDING
 → CANONICAL DATA
 → USER-VISIBLE PROJECTION
 → PROPOSAL
 → HUMAN VALIDATION
 → ACTION
 → RESULT
 → PROOF
```

works end-to-end with tests and without invented production data.

## 13. First implementation target

The first implementation target is **Foundation + Memory + Timeline**.

Reason: every later system depends on identity, canonical references, provenance, permissions and temporal history.

The first usable experience should therefore be:

```text
NOEMA / GARDIENNE
      ↓
INTENTION
      ↓
PROJECT CREATED
      ↓
CANONICAL MEMORY
      ↓
TIMELINE
      ↓
NEXT ACTION PROPOSED
      ↓
HUMAN VALIDATES
```

This becomes the spine on which Bureau, Composer, Site and external actions attach.

## 14. Non-goals

Do not, during implementation:

- create a second timeline engine;
- create a second profile/card model;
- create a second media library;
- create a second document repository;
- create a second permission system;
- create per-product automation rules that bypass the universal action contract;
- silently copy source-project code or assets;
- invent client/business/legal information;
- equate automated QA with legal or accessibility certification.

## 15. Final rule

If a new feature cannot answer:

```text
WHERE IS THE TRUTH?
WHAT IS THE SOURCE?
WHO CAN CHANGE IT?
WHO CAN SEE IT?
WHAT EVIDENCE SUPPORTS IT?
WHAT DOES IT AFFECT?
WHAT REQUIRES HUMAN VALIDATION?
HOW IS IT PROVEN?
```

it is not ready for implementation.
