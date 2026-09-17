# NOEMA — FINAL MISSING ORGANS V1

Status: **PROPOSED / CONVERGENCE AUDIT**

This document identifies the remaining universal organs that should be defined before implementation is generalized across products.

## 1. Connector Engine

Purpose: connect NOEMA to external systems without allowing the connector to become a competing source of truth.

```text
EXTERNAL SOURCE
 → CONNECTOR
 → IMPORT / SYNC
 → NORMALISATION
 → CANONICAL MEMORY

CANONICAL MEMORY
 → PROPOSAL
 → AUTHORIZATION
 → CONNECTOR
 → EXTERNAL ACTION
 → PROOF
```

Examples: email, calendar, storage, payments, music, social networks, accounting, publication services.

Requirements:
- explicit scope;
- read/write capability declaration;
- authorization;
- sync direction;
- conflict strategy;
- rate/error handling;
- provenance;
- disconnect/revoke;
- audit trail.

## 2. Permission & Access Engine

Visibility is not permission.

```text
ACTOR
 + RESOURCE
 + ACTION
 + CONTEXT
 + SENSITIVITY
 + PURPOSE
 + DURATION
 + AUTHORIZATION
 → DECISION
 → AUDIT
```

The engine must support public, private, project, shared, delegated and temporary access.

Sensitive information requires stronger boundaries and must never be published by implication.

## 3. Communication Engine

Communication must become a universal project capability.

```text
MESSAGE / EMAIL / NOTIFICATION / COMMENT / DOCUMENT
 → UNDERSTAND
 → LINK TO ENTITY
 → IDENTIFY ACTION
 → PROPOSE RESPONSE
 → HUMAN VALIDATION WHEN REQUIRED
 → SEND
 → PROOF
```

The same engine handles client comments, validation requests, reminders, transactional email and authorized external communication.

## 4. Automation & Reminder Engine

Automation is a controlled action system, not an uncontrolled cron layer.

```text
EVENT / DATE / CONDITION / EXPIRY
 → TRIGGER
 → CONTEXT
 → PROPOSED ACTION
 → AUTHORIZATION POLICY
 → EXECUTION
 → RESULT
 → PROOF
```

It must support:
- one-time actions;
- recurring actions;
- deadlines;
- expirations;
- renewal reminders;
- inactivity reminders;
- approval waits;
- conditional workflows;
- pause/resume;
- failure/retry;
- human escalation.

## 5. Universal Search Engine

Search must cross all canonical memories.

```text
QUERY
 → SEMANTIC UNDERSTANDING
 → ENTITY / RELATION / TIME / SOURCE FILTERS
 → RESULTS
 → EXPLANATION
 → ACTION
```

Search targets:
- people;
- organizations;
- projects;
- documents;
- media;
- timeline events;
- comments;
- versions;
- decisions;
- knowledge;
- communications.

Every result should preserve provenance and explain why it matched when useful.

## 6. Knowledge / Source Engine

NOEMA needs a formal distinction between a fact and an interpretation.

```text
SOURCE
 → EXTRACTED FACT
 → CONTEXT
 → INTERPRETATION
 → PROPOSAL
 → HUMAN DECISION
```

Source hierarchy should be contextual rather than absolute. Official or primary sources can carry stronger evidentiary weight for factual/legal questions, while user-provided evidence may be authoritative for the user's own information.

The engine must preserve:
- source URL/reference;
- source date;
- retrieval date;
- jurisdiction;
- quoted/extracted evidence;
- confidence;
- applicability;
- expiration/review date.

## 7. Legal / Jurisdiction Engine

The engine does not pretend to be a lawyer or to know all law.

```text
PERSON / ORGANIZATION
 + ACTIVITY
 + JURISDICTION
 + DATE
 + DATA
 + TRANSACTION
 + SITE / SERVICE TYPE
 → APPLICABLE RULES
 → REQUIRED INFORMATION / DOCUMENTS
 → PROPOSAL
 → HUMAN CONFIRMATION WHEN NECESSARY
```

It must be versioned by jurisdiction and date.

For websites, it feeds Site Foundation, legal pages, consent, contracts and publication checks.

For administrative workflows, it feeds requirements and dossier states.

## 8. Site Foundation

The universal website foundation combines:

```text
IDENTITY
LEGAL
CONTENT
SEMANTIC SITEMAP
TECHNICAL SITEMAP
ROBOTS
CANONICAL
STRUCTURED DATA
OPEN GRAPH
SEO
ANALYTICS
CONSENT
ACCESSIBILITY
PUBLICATION
```

Identity data is entered once and projected wherever appropriate.

The semantic sitemap adds a human-facing and NOEMA-facing interpretation of the site architecture:

```text
WHO
WHAT
WHY
FOR WHOM
WHAT IS SHOWN
WHAT CAN VISITORS DO
WHAT PROOF EXISTS
```

It can flag missing, duplicated, contradictory or buried information.

## 9. Analytics & Measurement Engine

Analytics must start from an objective, not from a tracking script.

```text
OBJECTIVE
 → SIGNAL
 → CONSENT / LEGAL BASIS
 → MEASUREMENT
 → ANALYSIS
 → INSIGHT
 → PROPOSAL
```

No silent tracking.

The implementation must distinguish technical telemetry, audience measurement, optional analytics and marketing tracking according to the applicable context.

## 10. Signature / Approval Engine

Approval is universal and must be separate from ordinary comments.

```text
DRAFT
 → REVIEW
 → COMMENT
 → REVISION
 → APPROVAL
 → SIGNATURE WHEN REQUIRED
 → LOCK / VERSION
 → PUBLICATION / TRANSMISSION
```

Approval records:
- actor;
- object/version;
- timestamp;
- scope;
- decision;
- evidence;
- authorization;
- signature provider when applicable.

NOEMA must never describe a draft as approved without an explicit decision record.

## 11. Release / Publication Engine

Publication is a controlled release.

```text
BUILD
 → QA
 → ACCESSIBILITY
 → LEGAL
 → SEO
 → SECURITY
 → CONTENT CHECK
 → HUMAN APPROVAL
 → RELEASE
 → PUBLISH
 → VERIFY
 → MONITOR
```

Rollback must be possible where technically feasible.

Publication creates a proof record containing the released version and relevant checks.

Automated validation of structured data is a QA signal, not a guarantee of search appearance; production monitoring remains necessary.

## 12. Universal Proof / QA Engine

One proof system should serve websites, documents, accessibility, media, administrative dossiers and actions.

```text
OBJECT
 → CHECKS
 → EVIDENCE
 → FINDINGS
 → STATUS
 → PROPOSED REMEDIATION
 → HUMAN DECISION
 → RECHECK
 → PROOF
```

Statuses:
- PASS;
- WARNING;
- BLOCKED;
- À CONFIRMER;
- HUMAN DECISION REQUIRED;
- NOT APPLICABLE.

Automated checks must not be presented as universal legal or accessibility certification. The existing accessibility scanner is a concrete foundation, while broader EAA/WCAG/RGAA coverage requires additional checks.

## 13. Export / Portability Engine

The user must be able to leave with their information.

```text
MEMORY
 → EXPORT PLAN
 → DATA
 → ORIGINAL FILES
 → PROVENANCE
 → RELATIONS
 → VERSIONS
 → DECISIONS
 → PERMISSIONS
 → MANIFEST
 → EXPORT
```

Formats can include JSON, CSV, PDF and ZIP where appropriate.

Import should reconstruct the information graph and ask for confirmation where mappings are uncertain.

## 14. Security / Recovery layer

The universal architecture also needs operational safeguards:

- encryption according to sensitivity;
- authentication and session security;
- least-privilege access;
- audit logs;
- backup strategy;
- restore testing;
- incident handling;
- data retention and deletion;
- revocation;
- service dependency visibility.

For systems acting as processors, security, confidentiality, documentation, incident handling, data return/deletion and subcontractor controls must be treated as architecture concerns and mapped to the applicable legal context.

## 15. What is already covered

The following are already represented in the convergence architecture:

- Gardienne;
- Accessibility / EAA;
- Universal Card;
- Universal Bureau;
- Administrative Document Engine;
- Universal Timeline;
- Universal Grid;
- Media Library;
- Composer;
- Art Engine;
- Relation Engine;
- Project lifecycle;
- Client Portal;
- Commercial engagement;
- Cascade / projections;
- Proof / QA concepts;
- Site Foundation / sitemap / SEO / analytics concept.

## 16. What remains after this document

After these organs are defined, the project should stop inventing new top-level engines unless an audit proves a missing universal capability.

The next phase is **integration**, not feature accumulation:

```text
AUDIT
 → MAP
 → NORMALISE
 → IMPLEMENT SHARED CONTRACTS
 → CONNECT ENGINES
 → TEST
 → PROVE
```

The objective is a coherent organism, not a catalogue of features.
