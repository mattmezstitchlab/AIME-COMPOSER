# AIME Administrative Document Engine V1

**Status:** PROPOSED / CONVERGENCE  
**Depends on:** Universal Card, Universal Bureau, Project Memory, Universal Timeline, NOEMA Governance  
**Primary evidence:** OPUS / MSA prototype, Bureau-Uni-MSA, DISPOO commercial layer.

## 1. Purpose

Create one universal document engine capable of understanding, preparing, generating, checking, versioning and tracking administrative and professional documents without creating a separate application for every profession.

The engine must distinguish:

- what is known;
- what was extracted;
- what is inferred;
- what is required;
- what is missing;
- what is expired;
- what is inconsistent;
- what has been verified by a human;
- what may be generated;
- what may be transmitted;
- what requires explicit authorization.

## 2. Universal document lifecycle

```text
INTENTION
 ↓
CONTEXT
 ↓
SOURCE OF TRUTH
 ↓
REQUIREMENTS
 ↓
DOCUMENT / TEMPLATE
 ↓
VARIABLE RESOLUTION
 ↓
CHECKS
 ↓
PREVIEW
 ↓
HUMAN APPROVAL
 ↓
SIGN / SEND / EXPORT
 ↓
PROOF
 ↓
ARCHIVE / FOLLOW-UP
```

## 3. Document states

```text
DRAFT
→ READY_FOR_REVIEW
→ APPROVED
→ SIGNED
→ SENT
→ RECEIVED
→ REJECTED
→ SUPERSEDED
→ ARCHIVED
```

A generated document must never overwrite a previous approved version.

## 4. Universal source model

Every generated document references canonical data rather than duplicating it.

Examples:

- legal identity from Site Foundation;
- client identity from Universal Card / project;
- service from Project / Engagement;
- price from commercial layer;
- bank information from authorized private data;
- dates from Timeline;
- supporting evidence from Bureau;
- signature status from Approval;
- publication status from Site Foundation.

This gives:

`SOURCE → GENERATION → VERSION → PROOF`

## 5. Document families

### Commercial

- quotation;
- contract;
- amendment;
- invoice;
- credit note where applicable;
- payment receipt / evidence.

### Professional

- engagement letter;
- employer / client certificate;
- certificate of activity;
- CV;
- portfolio;
- professional attestation.

### Association

- statutes;
- minutes;
- board decisions;
- grant application;
- activity report;
- financial report;
- membership certificate;
- authorization letters.

### Independent / micro-entrepreneur

- business identity document;
- registration evidence;
- quotation;
- invoice;
- contract;
- insurance certificate;
- tax/social documents;
- banking documents.

### Performing arts / intermittent

- engagement documents;
- employment contracts;
- payslips;
- employer attestations;
- activity log;
- supporting evidence;
- rights-monitoring dossier.

### Administrative

- application forms;
- declarations;
- attestations;
- supporting letters;
- response letters;
- dossier cover sheets;
- document lists;
- requests for missing pieces.

## 6. Requirement engine

A document workflow begins with requirements, not with a blank template.

```text
OBJECTIVE
+
PERSON / ORGANIZATION
+
PROFESSIONAL STATUS
+
JURISDICTION
+
DATE / EVENT
+
EXISTING EVIDENCE
↓
REQUIREMENT ENGINE
↓
DOCUMENT PLAN
```

Each requirement carries:

- source/reference;
- applicability condition;
- accepted evidence;
- mandatory/optional status;
- validity rule;
- current state;
- explanation;
- human-review requirement.

## 7. MSA contribution

The MSA work is especially valuable because it demonstrates that a dossier cannot be reduced to a fixed checklist.

The existing OPUS implementation has a `pieces-exigees` engine where requirements depend on professional status and the actual imported documents. It supports document types, validity periods, missing/renewal states and explanations for why a piece is required.

The MSA prototype also models:

- active dossier;
- source;
- verification status;
- linked actions;
- connector search;
- audit logs;
- automation rules.

The architectural extraction is:

```text
STATUS / SITUATION
      ↓
REQUIRED PIECES
      ↓
ACTUAL DOCUMENTS
      ↓
MATCH
      ↓
MISSING / EXPIRED / CONFLICT
      ↓
ACTION
```

This is directly reusable outside MSA.

## 8. Event-oriented administration

The older MSA analysis identified an important UX problem: administrative systems can expose database procedures rather than the real-life event the agent is trying to process.

The reusable pattern is:

```text
LIFE / WORK EVENT
 ↓
IMPACTED FACTS
 ↓
REQUIRED PIECES
 ↓
GUIDED STEPS
 ↓
VALIDATION
 ↓
CASCADE
 ↓
AUDIT
```

For AIME this means a user should be able to say:

> "Je crée mon activité."

> "Je dois préparer mon dossier d'intermittent."

> "Je monte le dossier de l'association."

> "Je dois envoyer le devis puis la facture."

NOEMA should infer the workflow and propose the relevant Bureau view rather than forcing the user to know the internal document taxonomy.

## 9. Professional status as context

The system may maintain a professional context such as:

```text
EMPLOYEE
INDEPENDENT
MICRO_ENTREPRENEUR
ASSOCIATION_OFFICER
ARTIST
PERFORMING_ARTIST
INTERMITTENT
STUDENT
RETIRED
JOB_SEEKER
OTHER
```

These are context labels only. They must not automatically be treated as legal eligibility or entitlement.

A context may have:

- evidence;
- source;
- effective date;
- expiry date;
- confidence;
- human confirmation.

## 10. Generated quotation

Quotation generation should draw from:

```text
SUPPLIER / PROVIDER
+
CLIENT
+
SERVICE
+
DATE / LOCATION
+
QUANTITY / DURATION
+
PRICE
+
TAX CONTEXT
+
COMMERCIAL CONDITIONS
+
VALIDITY
+
LEGAL IDENTITY
```

The engine checks which fields are known and which require confirmation before producing the final version.

## 11. Generated invoice

Invoice generation must use the legal and commercial source of truth.

At minimum, the engine must check the applicable invoice data set before finalization. The exact mandatory fields depend on the transaction and status.

Important architectural principle:

`INVOICE ENGINE ≠ STATIC PDF TEMPLATE`

It is a validation + generation + numbering + version + evidence system.

Current French invoicing rules are evolving: the official Service Public information indicates the electronic-invoicing rollout begins in September 2026 for large companies/ETIs and in September 2027 for SMEs and micro-enterprises, with reception obligations beginning September 2026. The engine must therefore keep regulatory rules versioned rather than hard-coded forever.

## 12. Contract

Contract workflow:

```text
PROPOSAL
 ↓
TERMS
 ↓
CONTRACT DRAFT
 ↓
REVIEW
 ↓
APPROVAL
 ↓
SIGNATURE
 ↓
EXECUTED VERSION
 ↓
FOLLOW-UP
```

Each contract should preserve:

- version;
- parties;
- dates;
- scope;
- referenced project;
- approval;
- signature evidence;
- amendments;
- termination / completion state.

## 13. Attestation engine

An attestation is generated from facts that must be traceable.

```text
FACTS
 ↓
ELIGIBLE TEMPLATE
 ↓
GENERATED WORDING
 ↓
SOURCE REFERENCES
 ↓
HUMAN VALIDATION
 ↓
SIGNED / ISSUED DOCUMENT
```

The engine must not invent an attestation's legal authority or certification status.

## 14. Association mode

An association can have a dedicated context projection without a separate document engine.

Universal Card provides:

- people;
- roles;
- organization identity.

Bureau provides:

- statutes;
- minutes;
- grants;
- budgets;
- reports;
- correspondence.

Project Memory provides:

- actions;
- events;
- deadlines;
- decisions.

Document Engine provides:

- generated files;
- versions;
- approvals;
- proof.

## 15. Intermittent mode

The system should support a dedicated **performing-arts context** without making it a separate application.

The context may connect:

`PERSON → EMPLOYER → ENGAGEMENT → EVENT → HOURS / ACTIVITY → DOCUMENTS → PROOF`

NOEMA can then answer questions such as:

- which engagements are documented;
- which documents are missing;
- which employer evidence is available;
- which dates are represented;
- which information still requires confirmation.

Any rights calculation must remain sourced and jurisdiction-specific.

## 16. MSA mode

The MSA architecture becomes a specialized projection of the same engine:

```text
UNIVERSAL PERSON
      ↓
PROFESSIONAL / ADMINISTRATIVE CONTEXT
      ↓
MSA REQUIREMENT PROFILE
      ↓
DOSSIER
      ↓
DOCUMENT MATCHING
      ↓
VALIDATION
      ↓
ADMINISTRATIVE ACTION
```

The original MSA application remains evidence of the primitive; it is not the canonical implementation.

## 17. Document viewer + action rail

Every document viewer should expose a contextual action rail:

- Open
- Download / export
- Share
- Comment
- Compare version
- Extract information
- Relate to project
- Relate to person
- Add to dossier
- Mark as proof
- Request validation
- Generate derivative
- Archive

High-risk actions require explicit authorization.

## 18. Document comparison

For successive documents, NOEMA should be able to identify:

- unchanged fields;
- changed fields;
- new information;
- removed information;
- date changes;
- version differences;
- contradictions.

Comparison is an observation. It does not itself decide which document is legally authoritative.

## 19. Renewal engine

Documents with a validity period can generate a timeline event and a future reminder.

```text
DOCUMENT
 ↓
EXPIRY DATE
 ↓
TIMELINE
 ↓
REMINDER WINDOW
 ↓
PROPOSAL
 ↓
HUMAN CONFIRMATION
```

Reminder timing should be configurable by document family and context.

## 20. Administrative inbox

The Bureau can surface only items requiring attention:

- missing;
- expired;
- conflicting;
- awaiting validation;
- awaiting signature;
- awaiting response;
- awaiting payment;
- ready to send.

This is a projection, not another database.

## 21. Proof layer

Every completed document action should create proof:

```text
ACTION
├── actor
├── authorization
├── source
├── input version
├── output version
├── timestamp
├── destination
└── result
```

This aligns with Mission Proof and the WEDDINGCITY audit/cascade model.

## 22. Safety and privacy

Administrative documents can contain identity, financial, professional, health-related or other sensitive information. The engine must apply least-privilege access, explicit purpose and retention rules.

The CNIL states that personal data should not be kept indefinitely and that retention should be determined according to the purpose of processing. The system therefore needs explicit lifecycle metadata rather than indefinite storage by default.

The CNIL also emphasizes documenting compliance, including processing records, information notices, consent evidence where applicable, contracts and incident procedures.

## 23. Regulatory knowledge

The document engine must separate three things:

### RULE
A sourced legal/regulatory statement.

### APPLICATION
A contextual interpretation of that rule for the current dossier.

### DECISION
A human or authorized professional validation.

Never collapse them into one AI-generated sentence presented as legal certainty.

## 24. Source hierarchy

For administrative and legal information, prefer:

1. official legislation / government source;
2. official public administration source;
3. official social body source;
4. regulator / authority;
5. professional reference;
6. secondary explanatory source.

Every requirement should retain its source reference and verification date.

## 25. Document generation QA

Before final output:

- identity verified;
- parties verified;
- dates coherent;
- amounts coherent;
- numbering valid;
- required fields present;
- applicable tax context checked;
- attachments present;
- referenced documents available;
- privacy classification correct;
- signature status correct;
- output version immutable;
- proof created.

## 26. Universal answer pattern

When a user asks NOEMA:

> "Quels papiers me faut-il ?"

NOEMA should answer structurally:

```text
COMPRIS
→ objective

DÉJÀ DISPONIBLE
→ documents found

IL MANQUE
→ required pieces

À VÉRIFIER
→ uncertain rules / evidence

JE PEUX PRÉPARER
→ drafts / requests / reminders

VALIDATION
→ what the human must confirm
```

This is far more useful than a generic document list.

## 27. Integration with the Universal Bureau

The Document Engine owns document semantics.

The Bureau owns the work surface.

The Universal Card owns reusable identity/context.

The Timeline owns time and history.

The Project owns objectives and relationships.

The Approval layer owns human decisions.

The Proof layer owns evidence.

No subsystem duplicates another subsystem's canonical data.

## 28. Final architecture

```text
NOEMA
  │
  ├── UNIVERSAL CARD
  │      └── person / organization / context
  │
  ├── UNIVERSAL BUREAU
  │      ├── LOCAL
  │      ├── DOCUMENTS
  │      ├── MEDIA
  │      ├── DOSSIERS
  │      ├── GENERATED
  │      └── AUTOMATIONS
  │
  ├── DOCUMENT ENGINE
  │      ├── REQUIREMENTS
  │      ├── OCR / EXTRACTION
  │      ├── GENERATION
  │      ├── VALIDATION
  │      ├── VERSIONING
  │      └── PROOF
  │
  ├── UNIVERSAL TIMELINE
  │      └── deadlines / events / renewals / history
  │
  └── GOVERNANCE
         ├── source
         ├── confidence
         ├── permissions
         ├── retention
         ├── human approval
         └── audit
```

## 29. Architectural conclusion

The MSA work does not become "the administrative module" of AIME.

It becomes one of the clearest proofs that NOEMA needs a universal **Document + Dossier + Evidence + Requirement** engine.

DISPOO contributes the physical Bureau / LOCAL workspace.

AIME Desktop contributes ingestion and understanding.

OPUS contributes dossier intelligence and dynamic required pieces.

AIME Archive contributes canonical data, constraints and cascade.

Mission Proof contributes evidence.

DISPOO commercial flows contribute quotation / contract / payment / invoice relationships.

Universal Card contributes identity and reusable context.

Universal Timeline contributes time and history.

NOEMA orchestrates the whole system while keeping the human decision boundary explicit.

**One Bureau. One document memory. Many contexts. One source of truth.**
