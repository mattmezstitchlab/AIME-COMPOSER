# AIME Universal Bureau & Document System V1

**Status:** PROPOSED / AUDIT CONVERGENCE  
**Branch:** `architecture/universal-bureau-documents-01`  
**Source of truth:** `PROJECT → UNIVERSAL CARD → BUREAU → DOCUMENT / MEDIA / AUTOMATION`  
**Principle:** documentation before implementation.

## 1. Intention

AIME should not treat documents as a secondary attachment feature.

The Universal Card contains the person's reusable memory. The Universal Bureau is the working environment in which that memory, documents, media, projects and administrative evidence can be understood, organized, viewed, transformed and acted upon.

The Bureau is therefore a **universal workspace**, not merely a file manager.

It must support at least:

- administrative documents;
- attestations and certificates;
- association documents;
- independent / micro-entrepreneur documents;
- intermittent performing-arts documents;
- quotations, contracts, invoices and payment documents;
- project briefs and client documents;
- photos, videos, audio and graphics;
- spreadsheets and structured data;
- PDFs and scanned documents;
- correspondence and messages when authorized;
- folders and local files;
- generated documents;
- evidence and proofs;
- automations attached to documents or media.

The user should not have to decide in advance whether something is a "document", "media", "administrative file" or "project asset". NOEMA should understand the content and propose the relevant classification.

## 2. Existing audited sources

### DISPOO — BURO / LOCAL

DISPOO already contains a concrete LOCAL concept for bringing local files and complete folders into the Bureau. The implementation includes recursive folder ingestion, file classification into photos, videos, music, documents, spreadsheets, site and other categories, PDF sorting, local site preview, local video processing and document persistence.  
Reference files include `use-local-files.ts`, `local-classify.ts`, `local-drop.ts`, `local-pdf-sorter.tsx`, `local-film-studio.tsx`, `local-site-preview.ts`, `local-documents.functions.ts` and `buro.local.tsx`.

The most important primitive is:

`LOCAL FILES / FOLDERS → READ → CLASSIFY → VIEW → ORGANIZE → PROCESS`

The LOCAL design must be generalized rather than copied as a separate subsystem.

### AIME Desktop

AIME Desktop established the broader ingestion principle:

`INPUT → INGESTION → OCR / EXTRACTION → RECOGNITION → CLASSIFICATION → STRUCTURATION → NORMALISATION → RELATIONS → CONTEXT → PROPOSITIONS → ACTION`

This becomes the perception and understanding layer of the Universal Bureau.

### AIME Archive

AIME Archive provides the canonical entity, query/mutation, cascade and projection model. The Bureau must never create competing copies of project truth.

### OPUS / MSA prototype

OPUS contains a particularly important administrative-document primitive: the dossier is evaluated against a dynamic set of required documents depending on professional status and situation. Its `pieces-exigees.ts` engine defines requirements, reasons, applicable statuses, acceptable document types, validity periods and states such as `fournie`, `a_renouveler` and `manquante`.

The MSA prototype also contains a Magic Desk with an active dossier, source status, verification state, actions, connector search and explicit human verification. Its Document entity stores dossier relation, name, type, source, status, external link and creation/modification dates.

### Bureau-Uni-MSA

The Base44 prototype contains useful entities that should be treated as audited architectural evidence rather than copied implementation:

- `Document`
- `Dossier`
- `Action`
- `AuditLog`
- `AutomationRule`
- `ConnectorConfig`
- `LinkedEntity`
- `PastedInformation`
- `PersonalSession`
- `Recherche`

The AutomationRule model explicitly includes prepared action, risk level, human-validation requirement, status and execution log.

## 3. Universal model

```text
UNIVERSAL CARD
      ↓
UNIVERSAL BUREAU
      ↓
┌─────────────────────────────────────────────┐
│                                             │
│  DOCUMENTS   MEDIA   PROJECTS   DOSSIERS   │
│  LOCAL       CLOUD    MESSAGES  DATA       │
│                                             │
└─────────────────────────────────────────────┘
      ↓
INGESTION → UNDERSTANDING → RELATIONS
      ↓
PROPOSAL → HUMAN VALIDATION → ACTION
      ↓
PROOF / HISTORY / VERSION
```

There is one Bureau and multiple contextual views.

## 4. One object model, multiple views

A file should not be duplicated merely because it is used by several contexts.

A single source object can appear as:

- a document in the Bureau;
- a proof attached to a project;
- a required piece in an administrative dossier;
- a contract in a commercial engagement;
- a media asset in a website;
- a source for OCR;
- a generated output;
- an item on the Universal Timeline.

Canonical principle:

`ONE ASSET → MANY REFERENCES / PROJECTIONS`

Never:

`ONE ASSET → COPIES PER FEATURE`

## 5. Universal Asset

Proposed canonical abstraction:

```text
Asset
├── id
├── owner / project / organization references
├── source
├── source_type
├── filename / title
├── media_type
├── mime_type
├── size
├── created_at
├── modified_at
├── imported_at
├── content_hash
├── parent_asset_id
├── relations[]
├── tags[]
├── semantic_labels[]
├── evidence
├── rights
├── visibility
├── retention
├── processing_state
├── version_id
└── provenance
```

`Asset` is not automatically public.

Visibility must be explicit:

`PRIVATE → PROJECT → SHARED → PUBLIC`

Sensitive data requires stronger controls.

## 6. Document model

```text
Document
├── asset_id
├── document_type
├── document_family
├── issuer
├── holder
├── reference
├── issue_date
├── effective_date
├── expiry_date
├── jurisdiction
├── status
├── confidence
├── evidence
├── extracted_fields[]
├── linked_persons[]
├── linked_organizations[]
├── linked_projects[]
├── linked_events[]
├── required_for[]
├── generated_from[]
├── version_id
└── audit[]
```

Possible document families:

- IDENTITY
- CIVIL_STATUS
- PROFESSIONAL
- BUSINESS
- ASSOCIATION
- EMPLOYMENT
- SPECTACLE
- SOCIAL_PROTECTION
- TAX
- ACCOUNTING
- BANKING
- INSURANCE
- CONTRACTUAL
- COMMERCIAL
- PROJECT
- EDUCATION
- HEALTH_RELATED
- PROPERTY
- TRANSPORT
- LEGAL
- MEDIA
- CREATIVE
- OTHER

The family is a classification, not a legal conclusion.

## 7. Administrative dossier

A dossier is not a folder. It is a **stateful collection of evidence required to achieve an objective**.

```text
DOSSIER
 ↓
OBJECTIVE
 ↓
CONTEXT
 ↓
REQUIREMENTS
 ↓
DOCUMENTS / EVIDENCE
 ↓
CHECKS
 ↓
MISSING / EXPIRED / CONFLICTING
 ↓
PROPOSAL
 ↓
HUMAN VALIDATION
 ↓
SUBMISSION / ACTION
 ↓
RESPONSE
 ↓
PROOF
 ↓
CLOSURE / FOLLOW-UP
```

This directly generalizes the OPUS `pieces-exigees` engine.

## 8. Requirement engine

A requirement must carry:

```text
Requirement
├── code
├── label
├── why
├── applicable_context
├── applicable_status
├── accepted_document_types[]
├── mandatory
├── validity_rule
├── source_reference
├── evidence_required
├── state
└── human_review_required
```

States:

`UNKNOWN → REQUESTED → RECEIVED → EXTRACTED → CHECKED → VALIDATED`

or:

`MISSING / EXPIRED / INCONSISTENT / REFUSED / NOT_APPLICABLE`

NOEMA must explain why a document is being requested.

## 9. Professional profiles

The Bureau must support multiple professional situations without forcing one universal legal schema.

Examples:

### Micro-entrepreneur / independent

Potential document families:

- registration / business identity;
- SIREN / SIRET evidence;
- professional insurance when applicable;
- tax documents;
- social-contribution documents;
- bank details;
- quotations;
- contracts;
- invoices;
- payment evidence;
- certificates and attestations.

### Association

Potential document families:

- statutes;
- declaration / registration evidence;
- RNA information;
- governance documents;
- minutes;
- annual reports;
- grant files;
- budgets;
- receipts and accounting evidence;
- contracts;
- insurance;
- public funding documents.

### Intermittent performing arts

Potential document families:

- employment contracts;
- engagement documents;
- payslips;
- employer attestations;
- activity records;
- performance evidence;
- training documents;
- social-protection documents;
- documents needed for rights monitoring.

The engine must not hard-code legal eligibility. It should map a user profile to documented requirements and identify the source and verification status.

### MSA / professional-social dossiers

The architecture should preserve the strongest part of the existing MSA work: the required-document set changes according to the professional situation and dossier context.

`PERSON + PROFESSIONAL STATUS + SITUATION + OBJECTIVE → REQUIREMENTS`

## 10. Document generation

The Bureau should generate documents from canonical project/person/company data.

Examples:

- quotation;
- invoice;
- contract;
- certificate;
- attestation;
- letter;
- meeting minutes;
- report;
- association document;
- administrative response;
- project brief;
- client approval document;
- publication package.

Generation flow:

```text
SOURCE OF TRUTH
 ↓
DOCUMENT TEMPLATE
 ↓
VARIABLES
 ↓
VALIDATION
 ↓
PREVIEW
 ↓
HUMAN APPROVAL
 ↓
FINAL DOCUMENT
 ↓
VERSION / PROOF
```

Never generate legal facts that are not present in the source of truth.

Unknown values must remain explicitly unknown or `À CONFIRMER`.

## 11. Office / Bureautique layer

The Bureau becomes the common office layer for:

- documents;
- spreadsheets;
- presentations;
- text documents;
- PDFs;
- forms;
- signatures;
- scans;
- OCR;
- exports;
- generated files;
- comments and revisions.

The user should be able to say:

> "Prépare le devis pour ce client."

or:

> "Retrouve mon attestation d'assurance."

or:

> "Quels documents me manquent pour ce dossier ?"

NOEMA resolves the request against the Universal Card, Bureau, projects, documents and authorized connectors.

## 12. LOCAL mode

LOCAL becomes a universal bridge between the user's computer and the Bureau.

```text
LOCAL
 ↓
SELECT FILE / FOLDER
 ↓
INGEST WITHOUT DUPLICATION
 ↓
RECURSIVE STRUCTURE
 ↓
CLASSIFY
 ↓
OCR / METADATA / PREVIEW
 ↓
RELATE
 ↓
PROPOSE ORGANIZATION
 ↓
USER VALIDATES
```

Supported source categories include:

- photos;
- videos;
- audio/music;
- PDFs;
- office documents;
- spreadsheets;
- websites;
- archives;
- other files.

The existing DISPOO LOCAL classification already demonstrates this category model.

## 13. Visioner universelle

The Bureau needs one viewer shell with contextual renderers.

```text
VIEWER
├── IMAGE
├── VIDEO
├── AUDIO
├── PDF
├── TEXT
├── DOCUMENT
├── SPREADSHEET
├── PRESENTATION
├── WEB
└── UNKNOWN
```

The viewer should expose the same right-side information layer:

- source;
- metadata;
- relations;
- extracted information;
- status;
- rights;
- privacy;
- version;
- comments;
- actions;
- automation.

## 14. Media automation

Media is part of the same Bureau, not a separate island.

Possible prepared operations:

### Photos

- rotate;
- crop;
- resize;
- convert;
- rename;
- classify;
- extract metadata;
- detect duplicates;
- generate variants.

### Video

- transcode;
- extract poster;
- extract frames;
- create preview;
- normalize format;
- detect duration/orientation;
- generate web variants.

### Audio

- metadata extraction;
- waveform;
- format conversion;
- transcription when authorized;
- preview generation.

### Documents

- OCR;
- text extraction;
- page rendering;
- classification;
- field extraction;
- document splitting;
- PDF generation.

Automation must be explicit and reversible.

## 15. Automation model

```text
TRIGGER
 ↓
CONTEXT
 ↓
PROPOSED ACTION
 ↓
RISK
 ↓
AUTHORIZATION
 ↓
EXECUTION
 ↓
RESULT
 ↓
PROOF / LOG
```

Risk levels:

`LOW | MODERATE | HIGH | SENSITIVE`

Default principle:

`HUMAN_VALIDATION = TRUE`

The existing Bureau-Uni-MSA AutomationRule model is direct evidence for this pattern.

## 16. NOEMA action boundary

NOEMA may:

- observe;
- classify;
- extract;
- compare;
- propose;
- prepare;
- request authorization;
- execute authorized low-risk operations;
- report the result.

NOEMA must not silently:

- submit an administrative declaration;
- sign a contract;
- publish a private document;
- transmit sensitive data;
- delete an important file;
- modify canonical identity data;
- make a legal determination.

Principle:

**CERISE PROPOSE. L'HUMAIN VALIDE.**

## 17. Provenance

Every meaningful document fact should be traceable.

```text
FACT
├── source
├── source_document
├── extracted_at
├── extraction_method
├── confidence
├── human_validation
├── validated_by
└── validated_at
```

This is essential for administrative work.

## 18. Privacy and security

The Bureau can contain highly sensitive information. It therefore requires explicit access and retention controls.

Every asset should have:

- owner;
- visibility;
- authorized actors;
- purpose;
- retention policy;
- deletion policy;
- audit history;
- export capability;
- access log where appropriate.

Sensitive documents should not be automatically published, indexed or transmitted.

The CNIL recommends determining retention according to purpose and implementing security measures appropriate to risk. The Bureau must therefore separate storage convenience from lawful retention and access rules.

## 19. Universal Card relationship

The Universal Card is the human/entity memory.

The Bureau is the operational memory of files and evidence.

```text
UNIVERSAL CARD = WHO / WHAT
BUREAU         = WHAT EXISTS / WHAT PROVES IT
PROJECT        = WHAT WE ARE DOING
TIMELINE       = WHEN
GRID           = WHERE / FORMAT
COMPOSER       = HOW IT IS COMPOSED
```

A document may enrich the Universal Card only through a proposed, explainable relation.

Example:

`CV.pdf → extracted profession → proposal → user confirms → profession stored on Universal Card`

## 20. Universal Bureau navigation

The interface should not expose a traditional folder tree as the only navigation.

Primary views:

- **RECENT** — what changed;
- **DOSSIERS** — active objectives;
- **DOCUMENTS** — all documents;
- **MEDIA** — photos/video/audio;
- **LOCAL** — computer/folder bridge;
- **PROJECTS** — project assets;
- **GENERATED** — documents created by AIME;
- **AUTOMATIONS** — prepared and executed actions;
- **ARCHIVE** — historical material.

A contextual search can cross all views.

## 21. Search

Search should be semantic and provenance-aware.

Examples:

> "Montre-moi mes attestations d'assurance encore valides."

> "Quels documents manquent pour mon dossier d'intermittent ?"

> "Trouve le dernier devis envoyé à cet EHPAD."

> "Montre les photos du mariage qui n'ont pas encore été retouchées."

Search results must state source and confidence.

## 22. Universal administrative document matrix

The first architecture should recognize at least these families:

| Family | Examples | Typical relations |
|---|---|---|
| Identity | ID, birth certificate | Person |
| Business | SIREN/SIRET, registration | Organization |
| Association | statutes, minutes, grants | Association |
| Employment | contract, payslip, employer certificate | Person / Organization |
| Performing arts | engagement, payslip, activity proof | Person / Event |
| Social protection | attestations, contribution calls | Person / Organization |
| Accounting | quotation, invoice, receipt | Project / Engagement |
| Contractual | contract, amendment | Person / Organization / Project |
| Insurance | certificates, policies | Person / Organization / Asset |
| Project | brief, specifications, approval | Project |
| Creative | portfolio, image, video, audio | Project / Publication |
| Administrative | forms, responses, proofs | Dossier |

This matrix is a starting ontology, not a closed taxonomy.

## 23. MSA as a proving ground, not the whole product

The MSA project should not be copied as a generic administrative application.

It is valuable because it reveals a general problem:

> A person has a situation. That situation changes the required evidence. The system should understand the event, identify the affected facts, request the right pieces, check them, explain what is missing, and keep a trace.

This generalizes to:

- company administration;
- association administration;
- performing arts;
- employment;
- grants;
- client onboarding;
- insurance;
- project delivery;
- website publication.

## 24. MSA architecture contribution

The existing MSA work contributes five reusable primitives:

1. **Event-oriented administrative workflow** instead of screen-oriented workflow.
2. **Dynamic required-piece engine** based on context and professional status.
3. **Active dossier** with status, source and verification state.
4. **Audit trail** connecting action, author, reason and evidence.
5. **Training / sandbox** around a complex administrative workflow.

The fifth primitive can later become a generic learning/simulation capability in NOEMA.

## 25. Integration with Universal Timeline

Documents and dossiers generate timeline events:

```text
DOCUMENT IMPORTED
DOCUMENT EXTRACTED
DOCUMENT REQUESTED
DOCUMENT RECEIVED
DOCUMENT EXPIRED
DOCUMENT VALIDATED
DOSSIER CREATED
DOSSIER BLOCKED
ACTION PROPOSED
ACTION APPROVED
ACTION EXECUTED
RESPONSE RECEIVED
DOSSIER CLOSED
```

The Universal Timeline remains canonical. The Bureau is a view and work surface over those events.

## 26. Integration with Site Foundation

The same Bureau can contain:

- legal identity documents;
- company registration evidence;
- insurance certificates;
- legal policy versions;
- SEO exports;
- analytics configuration proofs;
- publication proofs;
- accessibility reports.

Therefore:

`SITE FOUNDATION ↔ BUREAU ↔ PROOF`

A generated website can prove which source documents and validated data were used.

## 27. Integration with Accessibility Engine

The Bureau itself must be accessible.

The Accessibility Engine should scan the Bureau and its generated documents/interfaces.

For exported documents, accessibility should be treated as a production quality gate where the format permits it.

## 28. Launch / action gate

Before an important administrative or publication action:

```text
SOURCE
 ↓
UNDERSTANDING
 ↓
REQUIREMENTS
 ↓
MISSING / CONFLICTS
 ↓
PROPOSAL
 ↓
HUMAN REVIEW
 ↓
AUTHORIZATION
 ↓
EXECUTION
 ↓
PROOF
 ↓
TIMELINE
```

No silent finalization.

## 29. Implementation order

### Phase A — architecture

- Universal Asset
- Document
- Dossier
- Requirement
- Automation
- Provenance
- Viewer
- Local bridge

### Phase B — Bureau workspace

- Recent
- Dossiers
- Documents
- Media
- Local
- Generated
- Automations
- Archive

### Phase C — intelligence

- OCR
- classification
- extraction
- semantic search
- relation suggestions
- dynamic requirements
- validity tracking

### Phase D — generation

- quotations
- invoices
- contracts
- attestations
- reports
- association documents
- administrative documents

### Phase E — automation

- media operations
- document operations
- reminders
- renewal alerts
- preparation workflows
- connector workflows

### Phase F — proofs and governance

- audit
- versions
- access history
- retention
- export
- deletion
- human approval

## 30. Non-goals

This architecture does not define:

- a universal legal rules engine that pretends to know every jurisdiction;
- automatic legal certification;
- unrestricted access to personal documents;
- silent cloud synchronization of local files;
- automatic submission of administrative procedures;
- replacement of accountants, lawyers, social bodies or public administrations;
- a new parallel project database.

## 31. Final convergence

The emerging AIME architecture is:

```text
                    NOEMA
                      │
             ┌────────┴────────┐
             │                 │
       UNIVERSAL CARD     UNIVERSAL BUREAU
             │                 │
        WHO / MEMORY      ASSETS / EVIDENCE
             │                 │
             └────────┬────────┘
                      │
                PROJECT MEMORY
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   TIMELINE        COMPOSER         SITE
       │              │              │
      WHEN           HOW          PUBLICATION
       │              │              │
       └──────────────┼──────────────┘
                      │
                 ART ENGINE
                      │
               ACCESSIBILITY
                      │
                 PROOF / QA
```

The Bureau is therefore not another product.

It is one of NOEMA's organs: **the place where the user's world of documents, files, evidence and working material becomes understandable and actionable.**
