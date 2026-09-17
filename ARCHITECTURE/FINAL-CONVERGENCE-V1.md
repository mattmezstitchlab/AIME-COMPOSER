# NOEMA / AIME — FINAL CONVERGENCE V1

Status: **PROPOSED / ARCHITECTURAL CLOSURE**

This document closes the convergence phase. It does not claim that every capability is implemented. It defines the minimum universal architecture that must exist before implementation begins in the product repositories.

## 1. The final principle

NOEMA is not a collection of applications. It is one intelligence architecture serving many experiences.

```text
HUMAN
  ↓
NOEMA / GARDIENNE
  ↓
MEMORY + CONTEXT + UNDERSTANDING
  ↓
UNIVERSAL PROJECT MODEL
  ↓
ENGINES
  ↓
PROPOSITION
  ↓
HUMAN VALIDATION
  ↓
ACTION
  ↓
PROOF
  ↓
MEMORY
```

The human remains the authority over identity, memory, permissions, sensitive information, publication, and consequential actions.

> CERISE PROPOSE. L’HUMAIN VALIDE.

## 2. Canonical layers

```text
NOEMA
│
├── GARDIENNE
│   ├── PARLER
│   ├── ÉCRIRE
│   ├── SOUFFLER
│   └── MONTRER
│
├── MEMORY
│   ├── UNIVERSAL CARD
│   ├── PROJECT MEMORY
│   ├── DOCUMENTS
│   ├── MEDIA
│   ├── RELATIONS
│   └── KNOWLEDGE
│
├── WORLD MODEL
│   ├── PEOPLE
│   ├── ORGANIZATIONS
│   ├── PROJECTS
│   ├── PLACES
│   ├── TIME
│   └── RELATIONSHIPS
│
├── UNIVERSAL BUREAU
│   ├── LOCAL
│   ├── DOSSIERS
│   ├── DOCUMENTS
│   ├── MEDIA
│   ├── OFFICE
│   └── AUTOMATIONS
│
├── COMPOSER
│   ├── UNIVERSAL TIMELINE
│   ├── UNIVERSAL GRID
│   ├── MEDIA LIBRARY
│   └── AIME ART ENGINE
│
├── SITE FOUNDATION
│   ├── IDENTITY
│   ├── LEGAL
│   ├── SEO
│   ├── SEMANTIC SITEMAP
│   ├── ANALYTICS
│   └── PUBLICATION
│
├── ENGINES
│   ├── CONTEXT
│   ├── MEMORY
│   ├── RELATION
│   ├── INTENT
│   ├── SEARCH
│   ├── KNOWLEDGE / SOURCE
│   ├── DOCUMENT
│   ├── CONNECTOR
│   ├── COMMUNICATION
│   ├── PERMISSION
│   ├── AUTOMATION
│   ├── PLANNING
│   ├── GENERATION
│   ├── ACTION
│   ├── SIGNATURE / APPROVAL
│   ├── ACCESSIBILITY
│   ├── LEGAL / JURISDICTION
│   ├── RELEASE / PUBLICATION
│   ├── PROOF / QA
│   └── EXPORT / PORTABILITY
│
└── GOVERNANCE
    ├── PROVENANCE
    ├── CONFIDENCE
    ├── CONSENT
    ├── AUTHORIZATION
    ├── RETENTION
    ├── AUDIT
    ├── REVERSIBILITY
    └── HUMAN DECISION
```

## 3. One source of truth

Every experience is a projection of canonical data.

```text
CANONICAL MEMORY
      ↓
PROJECT / PERSON / ORGANIZATION / DOCUMENT / MEDIA / EVENT
      ↓
DERIVED VIEWS
      ├── SITE
      ├── CARD
      ├── BUREAU
      ├── TIMELINE
      ├── PORTAL
      ├── DOCUMENT
      ├── EMAIL
      └── PUBLICATION
```

No engine may create a competing hidden source of truth.

A change follows:

```text
CHANGE
 → IMPACT ANALYSIS
 → PROPOSAL
 → HUMAN VALIDATION when required
 → CASCADE
 → UPDATED PROJECTIONS
 → PROOF
```

## 4. Universal action contract

All engines that can act must use the same contract:

```text
INTENT
 → CONTEXT
 → PROPOSED ACTION
 → SCOPE
 → RISK
 → AUTHORIZATION
 → EXECUTION
 → RESULT
 → PROOF
 → REVERSAL / RECOVERY when possible
```

This prevents every connector, automation, document generator or publication system from inventing its own permission model.

## 5. Evidence contract

Every important piece of information can carry:

```text
source
source_type
evidence
observed_at
verified_at
confidence
status
owner
visibility
permission
retention
version
```

Evidence states:

```text
UNKNOWN
 → OBSERVED
 → EXTRACTED
 → INFERRED / PROBABLE
 → PROPOSED
 → CONFIRMED
 → SUPERSEDED
```

NOEMA must never silently convert an inference into a confirmed fact.

## 6. Project lifecycle

The universal project lifecycle is:

```text
INTENTION
 → BRIEF
 → DIRECTION
 → STRUCTURE
 → CONTENT
 → COMPOSITION
 → REVIEW
 → VERSION
 → APPROVAL
 → QA / PROOF
 → PUBLICATION
 → MONITORING
 → MAINTENANCE
 → ARCHIVE
```

Commercial engagement is attached when relevant:

```text
REQUEST
 → QUOTE
 → CONTRACT
 → PAYMENT
 → PRODUCTION
 → INVOICE
```

## 7. Website lifecycle

A website is a project projection, not a separate universe:

```text
PROJECT
 → SITE FOUNDATION
 → PAGES
 → SECTIONS
 → MEDIA SLOTS
 → CONTENT
 → DESIGN
 → DEVELOPMENT
 → ACCESSIBILITY
 → LEGAL
 → SEO
 → ANALYTICS / CONSENT
 → QA
 → APPROVAL
 → RELEASE
 → PUBLICATION
 → MONITORING
```

The Site Foundation is the source of truth for identity, legal information, SEO configuration, sitemap, analytics and publication metadata.

## 8. Universal Bureau lifecycle

```text
INPUT
 → INGESTION
 → UNDERSTANDING
 → CLASSIFICATION
 → RELATION
 → DOSSIER
 → REQUIREMENTS
 → VALIDATION
 → ACTION
 → PROOF
 → ARCHIVE
```

LOCAL mode must preserve originals and provenance. A local folder is an input surface, not the canonical database.

## 9. Human decision boundary

NOEMA may:

- understand;
- classify;
- search;
- compare;
- prepare;
- draft;
- propose;
- remind;
- simulate;
- explain;
- prepare an action.

NOEMA must request appropriate authorization before consequential actions such as publication, transmission of sensitive information, irreversible deletion, contractual commitment, payment, or external communication where authorization is required.

## 10. Closure criteria

The convergence architecture is considered complete when these questions have a single answer:

1. Where does the information live?
2. What is the source?
3. Who owns it?
4. Who can see it?
5. Who can change it?
6. What evidence supports it?
7. What happened to it over time?
8. What depends on it?
9. What can NOEMA propose?
10. What requires human validation?
11. How is the action executed?
12. How is the result proven?
13. How can the user export or recover it?
14. How can the user revoke access?
15. How can the user correct or delete memory?

If an implementation cannot answer these questions, it is not yet integrated into NOEMA.

## 11. Existing audited primitives

This architecture intentionally converges existing evidence instead of recreating it:

- AIME Network → world model, universal timeline projections, discovery.
- OPUS → project lifecycle, client portal, requirements and administrative follow-up.
- DISPOO → commercial engagement, narrative sections, Bureau / LOCAL primitives.
- Timeline Theater → composition timeline.
- SILLAGE / Tempo Narrative → collaborative composition and contextual placement.
- WEDDINGCITY → canonical truth, mutation, cascade and projection synchronization.
- AIME Archive → world constraints and simulation.
- AIME Desktop → ingestion and understanding pipeline.
- AIME Passport → identity and public profile.
- AIME Studio → publication / mini-site projection.
- scan → automated accessibility scanning foundation.
- Mission Proof → proof and QA concepts.

These are evidence and reusable primitives. They are not silently copied into this repository.

## 12. Final architectural statement

```text
ONE MEMORY
ONE WORLD MODEL
ONE PROJECT MODEL
ONE TIMELINE
ONE COMPOSITION SYSTEM
ONE BUREAU
ONE PERMISSION MODEL
ONE ACTION MODEL
ONE PROOF MODEL
MANY EXPERIENCES
```

NOEMA is the intelligence layer that understands how these parts relate.

The goal is not to build a larger dashboard.

The goal is to make complexity disappear for the human using it.

> **NOEMA — L’intelligence qui comprend, relie et agit avec vous.**
