# AIME-COMPOSER — Master Architecture v1

## Status

- Purpose: consolidate audited architectural primitives from the project corpus.
- This document is architectural analysis, not a claim that every primitive is implemented in AIME-COMPOSER.
- Source repositories remain untouched.
- Evidence must remain traceable to an audited source.

## 1. Core model

The common denominator across the strongest audited projects is a **Project Memory** composed of objects, relations, time, context and provenance.

```text
PROJECT MEMORY
    |
    +-- IDENTITY
    +-- OBJECTS
    +-- RELATIONS
    +-- EVENTS / TIME
    +-- ASSETS / MEDIA
    +-- DOCUMENTS
    +-- CONTEXTS
    +-- DECISIONS
    +-- VERSIONS
    +-- PROVENANCE
```

The project is the source-of-context, not a collection of duplicated feature databases.

## 2. Universal object model

An object may represent a person, organization, page, document, media asset, task, event, service, resource, content item or other domain entity.

Conceptual minimum:

```text
OBJECT
  id
  type
  title / label
  data
  source
  confidence
  status
  created_at
  updated_at
  relations[]
  contexts[]
  provenance
```

Domain-specific fields remain extensions rather than separate core systems.

## 3. Relations

Relations connect objects without duplicating them.

Examples:

```text
CLIENT -> PROJECT
PROJECT -> PAGE
PAGE -> SECTION
SECTION -> ASSET
CLIENT -> DOCUMENT
PERSON -> EVENT
EVENT -> RESOURCE
COMMENT -> VERSION
APPROVAL -> VERSION
```

The same relation mechanism should support different verticals.

## 4. Time

Time has two distinct architectural roles and must not be conflated.

### A. Operational / constraint time

From AIME-ARCHIVE and AIME Network:

```text
EVENT
  -> time
  -> people
  -> resources
  -> constraints
  -> dependencies
```

This answers: **when can / should something happen?**

### B. Composition time

From Timeline Theater / Tempo / SILLAGE:

```text
CLIP
  -> start
  -> duration
  -> order
  -> layer
  -> media
```

This answers: **how is an experience assembled over time?**

These engines can share a universal Timeline concept while keeping their semantics distinct.

## 5. Memory and provenance

AIME-TIMELINE establishes the need for event source, declaration state and document review. AIME Network establishes source/confidence and non-destructive projections.

```text
RAW INPUT
   -> CANDIDATE FACT
   -> REVIEW
   -> VALIDATED MEMORY
   -> PROJECTION
```

Unknown information must remain unknown. The system must not silently manufacture facts or demo data.

## 6. Change, impact and cascade

WEDDINGCITY provides the strongest audited pattern for controlled change:

```text
CHANGE
  -> IMPACT ANALYSIS
  -> USER VALIDATION
  -> CASCADE
  -> UPDATED PROJECTIONS
  -> DECISION RECORD
```

This becomes a cross-cutting architecture service rather than a wedding-specific feature.

Example for a web project:

```text
CHANGE: homepage headline
  -> homepage section
  -> SEO metadata
  -> mobile composition
  -> preview/version
  -> QA checks
  -> publication proposal
```

No downstream mutation should be silently applied when human validation is required.

## 7. Composition

Composition is a first-class layer.

```text
SOURCE OBJECTS / ASSETS
          |
       COMPOSER
          |
     COMPOSITION
          |
        VERSION
          |
       PREVIEW
```

The media model should evolve beyond `SCENE -> MEDIA` toward:

```text
ASSET
  -> CLIP / PLACEMENT
  -> POSITION
  -> DURATION
  -> LAYER
  -> VERSION
```

This permits an asset from one project to be composed into a section or experience from another without copying its source identity.

## 8. Collaboration and validation

The audited collaboration primitives converge on:

```text
COMMENT
   -> PROPOSAL
   -> REVISION
   -> APPROVAL
```

Important semantic distinction:

- COMMENT = observation
- PROPOSAL = requested or proposed change
- APPROVAL = explicit decision

Approval must be attributable and version-specific.

## 9. Workflow

OPUS, Mission Proof and DISPOO contribute complementary workflow patterns.

Generalized workflow:

```text
INTENTION
  -> BRIEF
  -> PRODUCTION
  -> REVIEW
  -> VALIDATION
  -> PROOF / QA
  -> PUBLICATION
  -> ENGAGEMENT
```

Commercial operations such as quotes, contracts, booking and payment should remain adapters around the project model, not redefine it.

## 10. Identity

AIME Passport contributes the public identity context.

Identity is more than authentication:

```text
IDENTITY
  -> PERSON / ORGANIZATION
  -> PUBLIC PROFILE
  -> ROLES
  -> RELATIONS
  -> PROJECTS
```

A client can therefore own multiple projects without duplicating their identity.

## 11. Assets and contextual collections

AIME Desktop suggests a universal object approach to imported material:

```text
INPUT
  -> INGESTION
  -> EXTRACTION
  -> CLASSIFICATION
  -> STRUCTURATION
  -> RELATIONS
  -> CONTEXT
```

A contextual collection / Magic Folder is not necessarily a physical folder. It is a dynamic view over related objects.

For media, the canonical model remains:

```text
PROJECT
  -> PAGE
  -> SECTION
  -> MEDIA SLOT
  -> REAL ASSET
```

Each asset should retain provenance:

```text
source_project
source_path
source_section
media_type
media_role
evidence
reuse_status
```

## 12. Proof and QA

Mission Proof generalizes naturally to creative production:

```text
BRIEF
  -> PRODUCTION
  -> PREVIEW
  -> COMMENT
  -> REVISION
  -> APPROVAL
  -> QA
  -> PUBLICATION
```

QA is evidence-producing, not merely a status label.

## 13. Creative Web Studio projection

The architecture supports a domain-neutral Creative Web Studio without making web production the core data model.

```text
CLIENT
  -> PROJECT
  -> BRIEF
  -> CONTENT / ASSETS
  -> STRUCTURE
  -> DESIGN
  -> DEVELOPMENT
  -> REVIEW
  -> APPROVAL
  -> QA
  -> PUBLICATION
```

Domain examples such as wedding, restaurant, hotel, architect, artist, photographer, association or business are templates/context, not separate core architectures.

## 14. What AIME-COMPOSER should be

AIME-COMPOSER should act as the convergence and composition layer:

```text
64 SOURCE PROJECTS
       |
      AUDIT
       |
    PRIMITIVES
       |
   MASTER MODEL
       |
    VIEWER / ATLAS
       |
    COMPOSER
       |
    NEW PROJECTS
```

It should not become a monolithic copy of all source applications.

## 15. Reuse policy

Every extracted capability must be classified:

1. `REUSE_DIRECT`
2. `REUSE_ADAPT`
3. `REFERENCE_ONLY`
4. `SOURCE_DEPENDENT`
5. `UNKNOWN`

No source code or asset should be treated as reusable merely because it is visible in a source repository.

## 16. Evidence policy

Evidence levels:

- `CONFIRMED` — directly inspected source/schema/route/component/config.
- `DOCUMENTED` — described by project documentation but not yet source-confirmed.
- `CONCEPT` — intended or future behavior.
- `NOT_AUDITED` — insufficient evidence.

The Viewer must expose evidence status where practical.

## 17. Current architectural convergence

```text
INTENTION
   |
PROJECT MEMORY
   |
ENTITY / RELATION
   |
TIME / CONTEXT
   |
CONTENT / ASSET / DOCUMENT
   |
COMPOSITION
   |
VERSION
   |
COMMENT / PROPOSAL
   |
VALIDATION / APPROVAL
   |
IMPACT / CASCADE
   |
QA / PROOF
   |
PUBLICATION / EXPERIENCE
   |
ENGAGEMENT / TRANSACTION
```

Cross-cutting concerns:

```text
IDENTITY
PROVENANCE
CONFIDENCE
AUDIT / DECISION RECORD
SEARCH
MEDIA
SECURITY / ACCESS
```

## 18. What is still missing

This architecture is a consolidation, not a final implementation specification.

Remaining audit work includes:

- complete route and section coverage for all high-priority repositories;
- complete real media/storage inventory;
- exact schema comparison across source projects;
- permissions and access-control convergence;
- publication/deployment architecture;
- client/project portal interaction model;
- final Creative Web Studio UX information architecture;
- validation of the Project Viewer against an actual deployed preview;
- final decision on which primitives are implemented in AIME-COMPOSER versus referenced as external engines.

## 19. Merge principle

A master architecture document should be merged only after its evidence and scope have been reviewed. The current branch is intentionally separate from `main`.

The goal is to keep the architecture reviewable and reversible before implementation expands.
