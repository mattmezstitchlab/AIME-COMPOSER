# NOEMA / AIME — INTEGRATION MAP V1

Status: **PROPOSED / ARCHITECTURAL INTEGRATION**

This document closes the transition between architectural convergence and implementation. It does not introduce a new top-level engine. It defines how the already identified organs connect, what each one owns, and where information must flow.

## 1. The organism

```text
                         NOEMA
                           │
                     ┌─────┴─────┐
                     │ GARDIENNE │
                     └─────┬─────┘
                           │
                INTENTION / CONTEXT / SIGNALS
                           │
                    ┌──────▼──────┐
                    │    MEMORY   │
                    └──────┬──────┘
                           │
              PERSON / ORG / PROJECT / OBJECT
                           │
                    ┌──────▼──────┐
                    │  WORLD MODEL│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   TIMELINE             BUREAU            COMPOSER
        │                  │                  │
        │             DOCUMENT / MEDIA        │
        │                  │                  │
        └──────────────┬───┴───────┬──────────┘
                       │            │
                  SITE FOUNDATION  RELATIONS
                       │            │
                 PUBLICATION     CONNECTIONS
                       │            │
                       └─────┬──────┘
                             │
                      ACTION / PROOF
                             │
                         GOVERNANCE
```

The diagram is conceptual. It does not imply a single runtime process or a single database implementation.

## 2. Canonical ownership

| Capability | Canonical owner | Projections / consumers |
|---|---|---|
| Person / Organization | Universal Card / Memory | profiles, projects, documents, sites |
| Project | Project Memory | timeline, bureau, composer, portal, site |
| Relationship | Relation Engine | discovery, introductions, projects |
| Event / temporal fact | Universal Timeline | planning, history, live views, communication |
| Document | Universal Bureau / Document Engine | dossiers, portal, contracts, site, communication |
| Media Asset | Universal Media Library | composer, website, social, documents |
| Composition | Composer | preview, version, publication |
| Site identity / legal / SEO | Site Foundation | footer, legal pages, metadata, sitemap |
| Permission | Permission Engine | every protected read/write/action |
| External connection | Connector Engine | import, sync, external action |
| Action | Universal Action Contract | communication, automation, publication, payment |
| Evidence / proof | Proof Engine | QA, audit, publication, documents, actions |
| Financial position | Financial Engine | timeline, scenarios, regulated providers |
| Visual communication | Visual Communication Engine | social, web, print, event media |

A projection may display or transform canonical information. It must not silently become a second canonical owner.

## 3. Universal information flow

```text
INPUT
  ↓
INGESTION
  ↓
UNDERSTANDING
  ↓
EVIDENCE / CONFIDENCE
  ↓
CANONICAL MEMORY
  ↓
RELATIONS + CONTEXT + TIME
  ↓
PROJECTION / PROPOSAL
  ↓
HUMAN VALIDATION WHEN REQUIRED
  ↓
ACTION / PUBLICATION
  ↓
RESULT
  ↓
PROOF
  ↓
MEMORY UPDATE
```

This is the common loop behind documents, websites, communications, finances, media and automation.

## 4. Gardienne integration

The Gardienne is the entry point, not a second data model.

```text
PARLER / ÉCRIRE / SOUFFLER / MONTRER
            ↓
       CONTEXT SENSE
            ↓
       INTENTION / NEED
            ↓
      MEMORY PROPOSAL
            ↓
       MIRROR / CONFIRM
```

The Gardienne may discover that the user is describing:

- a new person;
- an organization;
- a project;
- a document;
- a media asset;
- an event;
- a financial situation;
- a website request;
- a communication need;
- a relationship opportunity.

It routes the intention to the canonical model rather than creating a Gardienne-specific record.

## 5. Memory integration

Memory is the persistence spine.

```text
UNIVERSAL CARD
    ├── PERSON
    ├── ORGANIZATION
    ├── PROJECT
    ├── RELATION
    ├── DOCUMENT REF
    ├── MEDIA REF
    └── KNOWLEDGE REF
```

Every new memory item must have:

```text
SOURCE
CONFIDENCE
STATUS
OWNER
VISIBILITY
PERMISSION
PROVENANCE
VERSION
```

The Mirror exposes what NOEMA understood before confirmation when uncertainty or importance makes that useful.

## 6. Timeline integration

The Universal Timeline is the temporal projection of canonical events and commitments.

It must not duplicate project data.

```text
CANONICAL EVENTS
      ↓
UNIVERSAL TIMELINE
      ├── READ
      ├── PLAN
      ├── REVIEW
      ├── LIVE
      └── HISTORY
```

Composition time remains distinct:

```text
UNIVERSAL TIMELINE / PROJECT TIME
          ≠
COMPOSER / MEDIA TIME
```

The two may reference the same project and assets, but they answer different questions.

## 7. Bureau integration

The Bureau is the workspace projection of documents, media and dossiers.

```text
LOCAL / UPLOAD / CONNECTOR
            ↓
         INGESTION
            ↓
     CLASSIFICATION
            ↓
      CANONICAL ASSET
            ↓
       RELATIONS
            ↓
        DOSSIER
            ↓
       REQUIREMENTS
            ↓
        VALIDATION
            ↓
          PROOF
```

A local folder remains an input surface. Originals and provenance must be preserved.

## 8. Composer integration

The Composer consumes canonical assets and content.

```text
BRIEF / CONTENT / MEDIA
          ↓
       COMPOSER
          ↓
 GRID / TIMELINE / ART ENGINE
          ↓
      COMPOSITION
          ↓
        VERSION
          ↓
 COMMENT / PROPOSAL / APPROVAL
```

The Composer never owns the original media file merely because it uses it in a composition.

## 9. Site Foundation integration

The Site Foundation is the canonical configuration for a website projection.

```text
PERSON / ORGANIZATION
        +
PROJECT
        +
CONTENT / MEDIA
        ↓
SITE FOUNDATION
        ↓
PAGES / SECTIONS
        ↓
LEGAL / SEO / SITEMAP / ANALYTICS / ACCESSIBILITY
        ↓
QA
        ↓
RELEASE
        ↓
PUBLICATION
```

Identity entered once should propagate to the appropriate footer, legal pages, structured data, contact surfaces and publication metadata.

## 10. Financial integration

The Financial Engine must remain a temporal evidence layer above regulated financial providers.

```text
ACCOUNT / INCOME / RECEIVABLE / CONTRACT / BOOKING
                    ↓
             FINANCIAL MEMORY
                    ↓
            FINANCIAL TIMELINE
                    ↓
         FORECAST / SCENARIO / CAPACITY
                    ↓
             PROPOSAL
                    ↓
         HUMAN AUTHORIZATION
                    ↓
       REGULATED PROVIDER / BANK
                    ↓
               RESULT
                    ↓
                 PROOF
```

The engine must keep distinct:

```text
MONEY
RECEIVABLE
COMMITMENT
PROJECTION
CAPACITY
SCENARIO
```

A projection is never silently represented as money available today.

## 11. Visual Communication integration

Visual communication is a projection of real project facts and authorized media.

```text
EVENT / PROJECT
     +
REAL MEDIA
     +
IDENTITY
     +
FORMAT
     ↓
VISUAL COMMUNICATION ENGINE
     ↓
COMPOSITION
     ↓
ACCESSIBILITY / RIGHTS / PROOF
     ↓
HUMAN VALIDATION
     ↓
EXPORT / SCHEDULE / PUBLISH
```

One event should produce a family of format-specific projections rather than independent duplicated designs.

A change to the canonical event should trigger impact analysis for affected communication versions.

## 12. Connector integration

Connectors are adapters at the boundary of NOEMA.

```text
EXTERNAL SYSTEM
      ↓
   CONNECTOR
      ↓
 NORMALISATION
      ↓
 CANONICAL MEMORY
```

For outbound actions:

```text
CANONICAL MEMORY
      ↓
   PROPOSAL
      ↓
 AUTHORIZATION
      ↓
   CONNECTOR
      ↓
 EXTERNAL SYSTEM
      ↓
    RESULT
      ↓
     PROOF
```

Disconnecting a connector must not destroy canonical information already imported unless the retention policy explicitly requires deletion.

## 13. Communication and automation

Communication and automation share the Universal Action Contract.

```text
TRIGGER / INTENT
      ↓
 CONTEXT
      ↓
 PROPOSAL
      ↓
 SCOPE / RISK
      ↓
 AUTHORIZATION
      ↓
 EXECUTION
      ↓
 RESULT
      ↓
 PROOF
```

The distinction is:

- Communication chooses how information is transmitted.
- Automation chooses when and under which conditions an action is proposed or executed.
- Neither owns the underlying project truth.

## 14. Search and knowledge

Search is a cross-memory access layer.

```text
QUERY
 ↓
UNDERSTAND INTENT
 ↓
SEARCH OBJECTS / RELATIONS / TIME / SOURCES
 ↓
RANK / FILTER
 ↓
EXPLAIN MATCH
 ↓
PROPOSE ACTION
```

Knowledge/source handling remains provenance-aware.

A search result is evidence of a match, not automatically proof that the matched statement is true.

## 15. Accessibility integration

Accessibility is both an engine and a publication gate.

```text
COMPOSITION / SITE / DOCUMENT
            ↓
     ACCESSIBILITY ENGINE
            ↓
 AUTOMATED + MANUAL CHECKS
            ↓
       FINDINGS / PROOF
            ↓
     REMEDIATION PROPOSAL
            ↓
        HUMAN REVIEW
```

Automated scanning is a signal and remediation aid. It does not by itself establish complete accessibility conformance; W3C explicitly notes that human evaluation remains necessary. citeturn0search1turn0search8

## 16. Proof and governance integration

Proof is cross-cutting.

```text
ANY IMPORTANT OPERATION
          ↓
       EVIDENCE
          ↓
        FINDING
          ↓
        DECISION
          ↓
        RESULT
          ↓
         PROOF
```

Governance controls:

```text
PROVENANCE
CONFIDENCE
CONSENT
AUTHORIZATION
RETENTION
AUDIT
REVERSIBILITY
EXPORT
RECOVERY
```

## 17. Change propagation

Every canonical change must have a dependency graph.

Example:

```text
EVENT TIME CHANGES
       ↓
IMPACT ANALYSIS
       ├── TIMELINE
       ├── VISUAL COMMUNICATIONS
       ├── SITE EVENT PAGE
       ├── SOCIAL COPY
       ├── REMINDERS
       ├── CLIENT PORTAL
       └── FINANCIAL FORECAST
```

The system proposes affected updates. It does not silently rewrite every projection when human validation is required.

## 18. Implementation boundary

A product repository should implement only the slice required for its experience while respecting the canonical contracts.

```text
AIME-COMPOSER
     ↓
ARCHITECTURE / CONTRACTS / AUDIT
     ↓
PRODUCT REPOSITORY
     ↓
SHARED CONTRACT IMPLEMENTATION
     ↓
EXPERIENCE / PROJECTION
```

AIME-COMPOSER remains the convergence and architecture layer unless a deliberate decision establishes it as an executable product.

## 19. Completion gate

The architecture phase is complete when:

- every top-level capability has a canonical owner;
- every external action uses the Universal Action Contract;
- every important fact has provenance and uncertainty semantics;
- every protected resource uses the Permission model;
- every projection can trace back to canonical memory;
- every consequential action produces a proof record;
- every engine has a defined recovery strategy where applicable;
- no duplicate timeline/card/media/document/permission model remains unexplained;
- implementation can start from Foundation → Memory → Timeline.

After this gate, new ideas should normally be expressed as **projections, integrations, or features attached to an existing organ**, not as new top-level organs.

## 20. Final rule

```text
ONE TRUTH
ONE MEMORY
ONE WORLD
ONE TIMELINE
ONE BUREAU
ONE COMPOSER
ONE PERMISSION MODEL
ONE ACTION MODEL
ONE PROOF MODEL
MANY EXPERIENCES
```

NOEMA is the intelligence that understands and coordinates these relations.
