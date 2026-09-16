# AIME-COMPOSER — DATA MODEL V1

## Status
- Evidence basis: audited source repositories and Master Architecture v1.
- Purpose: define the minimum universal data vocabulary before implementation.
- This is a conceptual architecture document, not a claim that these entities already exist in AIME-COMPOSER.
- Source repositories remain untouched.

## 1. Core principle

AIME-COMPOSER should model one project memory and derive specialized views from it. A feature must not create a second canonical copy of an object merely because it appears in another surface.

Canonical information should have:
- a stable identity;
- an owner/context;
- provenance;
- lifecycle status;
- version history where applicable;
- explicit relations;
- evidence/confidence when information is uncertain;
- projections rather than duplicated domain records.

## 2. Universal entities

### PROJECT
The durable container for a client/user objective and its evolving work.

Minimum conceptual fields:
- id
- type/template
- title
- owner/organization
- status
- context_id
- created_at / updated_at
- source

Examples: wedding website, restaurant website, portfolio, association site, event, professional booking project.

### OBJECT
Generic canonical object representing a meaningful piece of project memory.

Minimum fields:
- id
- type
- project_id/context_id
- content
- status
- provenance
- confidence
- created_at / updated_at

OBJECT is an architectural abstraction; concrete domain types may be specialized without creating unrelated storage systems.

### PERSON / ORGANIZATION
Identity-bearing entities.

Relations may include:
- owns
- collaborates_with
- client_of
- member_of
- validates
- provides

Identity should remain separate from a project so one client can participate in many projects.

### RELATION
Explicit link between canonical entities.

Fields:
- id
- from_id
- relation_type
- to_id
- source
- confidence
- valid_from / valid_to where relevant

Relations are first-class because graph, timeline, context and cascade systems depend on them.

### EVENT
Operational or memory event.

Fields:
- id
- project_id/context_id
- type
- start_at
- end_at/duration
- description
- participants
- resources
- source
- certainty/status

Operational time and composition time must remain distinct.

### CONTEXT
A dynamic collection of related objects without requiring physical duplication.

Examples:
- project workspace
- client context
- magic folder
- event context
- brand context

A context may contain projects, assets, documents, people, relations and timeline projections.

### ASSET
A real media or binary resource.

Fields:
- id
- asset_type
- storage/provider
- source_path or external reference
- MIME type
- dimensions/duration where relevant
- checksum/hash where available
- provenance
- rights/licensing status when documented
- created_at

An asset is not a UI placement. Placement belongs to composition.

### DOCUMENT
A document or document-like source carrying information or proof.

Fields:
- id
- asset_id where applicable
- document_type
- extracted_content
- status
- source
- confidence
- validation state
- version

Document extraction must not silently become validated fact.

### PAGE
A publishable information surface inside a project/site.

Fields:
- id
- project_id
- route/path
- title
- status
- version_id

### SECTION
A structural/content block inside a page.

Fields:
- id
- page_id
- section_type
- order
- content references
- media slots
- design references
- version

### MEDIA_SLOT
A compositional placement, not an asset.

Fields:
- id
- section_id
- role
- constraints
- clip/composition reference

An asset may be reused in multiple slots without duplication.

### COMPOSITION
A structured arrangement of objects/assets/content that produces an experience.

Fields:
- id
- project_id
- type
- inputs
- layers
- ordering
- state
- version_id

### CLIP
A temporal or positional use of an asset inside a composition.

Fields:
- id
- composition_id
- asset_id
- start
- duration
- position
- layer
- crop/transform where applicable

This separates Timeline Theater's composition behavior from canonical asset identity.

### VERSION
Immutable or append-only representation of a meaningful project state.

Fields:
- id
- parent_version_id
- project_id
- author
- change_summary
- created_at
- status

Versions are required for review, rollback and publication traceability.

### COMMENT
An observation attached to a project artifact/version/location.

A COMMENT is not automatically a requested change.

### PROPOSAL
A requested or suggested modification derived from a comment or workflow action.

Fields:
- id
- target
- requested_change
- author
- status
- resulting_version_id

### APPROVAL
Explicit human decision on a target version/content/proposal.

Fields:
- id
- target_id
- decision
- actor
- timestamp
- scope
- evidence

Approval is distinct from comment and proposal.

### DECISION
Durable record of a validated change or architectural/business decision.

Fields:
- id
- actor
- timestamp
- reason
- before/after references
- impact
- reversible
- source

### PROOF
Evidence that an expected action/state/result was achieved.

Fields:
- id
- target
- proof_type
- evidence reference
- captured_at
- location/context where relevant
- validation state

### PUBLICATION
A deployed/published representation of an approved project state.

Fields:
- id
- project_id
- version_id
- channel
- URL/identifier
- publication status
- published_at
- deployment/provenance reference

## 3. Cross-cutting fields

The following should be available where meaningful rather than recreated by every feature:

```text
id
source
provenance
confidence
status
created_at
updated_at
created_by
updated_by
version_id
context_id
project_id
```

Not every entity needs every field. The model should avoid artificial uniformity.

## 4. State model

A generic content/change lifecycle is:

```text
DISCOVERED
  ↓
DRAFT
  ↓
IN_REVIEW
  ↓
PROPOSED_CHANGE
  ↓
REVISION
  ↓
APPROVED
  ↓
QA
  ↓
PUBLISHED
```

This is a conceptual lifecycle. Individual entities may have narrower states.

## 5. Provenance and uncertainty

Every extracted or externally sourced fact should be distinguishable from a human-validated fact.

Conceptual confidence classes:
- CONFIRMED
- DECLARED
- EXTRACTED
- INFERRED
- SUGGESTED
- UNKNOWN

The system must never promote INFERRED or SUGGESTED information to CONFIRMED without an explicit validation event.

## 6. Time model

Two different temporal systems must remain separate:

### Operational time
Used for:
- appointments
- deadlines
- events
- availability
- dependencies
- scheduling

### Composition time
Used for:
- clips
- scenes
- animation
- music
- playback
- presentation order

An operational event can feed a composition, but the two timelines are not the same entity.

## 7. Projection model

Specialized views should derive from canonical data:

```text
CANONICAL MEMORY
      ↓
PROJECTIONS
 ├── Timeline
 ├── Finance
 ├── Documents
 ├── Media
 ├── People
 ├── Search
 ├── Studio
 ├── QA
 └── Publication
```

This follows the strongest pattern found in AIME Network and WEDDINGCITY audits.

## 8. Change propagation

A mutation should conceptually follow:

```text
CHANGE
  ↓
IMPACT ANALYSIS
  ↓
PROPOSAL / VALIDATION
  ↓
CASCADE
  ↓
UPDATED PROJECTIONS
  ↓
DECISION RECORD
```

Not every change requires a cascade. The impact engine determines affected projections and dependent objects.

## 9. Creative Web Studio mapping

The future agency workflow can be represented without introducing a separate domain model:

```text
CLIENT / ORGANIZATION
        ↓
PROJECT
        ↓
BRIEF + CONTENT + ASSETS
        ↓
PAGES + SECTIONS
        ↓
COMPOSITION
        ↓
VERSION
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

Commercial objects such as quote, contract, invoice and payment remain engagement/transaction projections or specialized entities; they do not need to become the universal core.

## 10. Evidence policy

Current confidence for this model:

- CONFIRMED primitive: supported by direct source inspection in the audited repositories.
- ARCHITECTURAL SYNTHESIS: combining multiple confirmed primitives into one proposed model.
- CONCEPT: future implementation or adaptation not yet verified in AIME-COMPOSER.

A proposed entity in this document is not evidence that an implementation already exists.

## 11. Immediate implementation consequence

Before building feature pages, AIME-COMPOSER should establish:

1. canonical IDs and relation references;
2. provenance/evidence vocabulary;
3. project/context ownership;
4. version/approval records;
5. asset vs media-slot separation;
6. operational vs composition time separation;
7. projection boundaries;
8. change/impact records.

Only after these contracts are stable should implementation begin.
