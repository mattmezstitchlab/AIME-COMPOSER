# MEMORY REVIEW 01 — AIME-TIMELINE

Date: 2026-09-16
Status: DIRECT INSPECTION COMPLETE
Scope: memory events, provenance markers, document review and uncertainty signals

## 1. Source inspected

Repository: `mattmezstitchlab/AIME-TIMELINE`
Ref: `b3626751630f819ccb679c840c0e9b4320a0cdd5`

Direct source files inspected:
- `src/app/components/Timeline.tsx`
- `src/app/components/IntelligentAnalysis.tsx`

## 2. Memory Event

`TimelineEvent` contains:
- stable `id`
- typed event category
- `date`
- `description`
- optional `metadata`

The metadata explicitly supports:
- `declared?: boolean`
- `source?: string`
- arbitrary additional metadata

The UI visibly distinguishes undeclared events with a `Non déclaré` state.

Classification:
**MEMORY EVENT — CONFIRMED — REUSE_ADAPT**

Universal abstraction:

```text
EVENT
 ├─ WHEN
 ├─ WHAT
 ├─ SOURCE
 ├─ DECLARATION / CERTAINTY STATE
 └─ CONTEXT
```

Important limitation: the current model does not yet expose a dedicated structured certainty/confidence type, source locator, source version, or conflict set. Those should not be invented during extraction.

## 3. Intelligent Review

`IntelligentAnalysis` exposes a review state with three levels:
- `coherent`
- `warning`
- `critical`

It also receives:
- `suggestions`
- `actions`
- document records
- OCR upload handling
- document status mutation

The UI therefore implements a concrete review loop:

```text
DOSSIER
  ↓
ANALYSE
  ↓
ÉTAT
  ├─ COHÉRENT
  ├─ INCOHÉRENCE
  └─ ACTION REQUISE
  ↓
SUGGESTIONS / ACTIONS
  ↓
DOCUMENTS
```

Classification:
**INTELLIGENT REVIEW — CONFIRMED — REUSE_ADAPT**

## 4. Document state

`DocumentItem` has:
- `id`
- `name`
- `status`

Allowed status values:
- `manquant`
- `reçu`
- `validé`

The UI can:
- import image/PDF documents for OCR
- add a document manually
- cycle document state
- delete a document
- display missing-document count.

Classification:
**DOCUMENT REVIEW — CONFIRMED — REUSE_ADAPT**

Universal abstraction:

```text
DOCUMENT
  ↓
RECEIPT STATE
  ↓
VALIDATION STATE
  ↓
PROJECT REVIEW
```

## 5. What this adds to AIME-COMPOSER

AIME-TIMELINE contributes a missing human-review layer between raw project memory and validated project state.

The Composer architecture should therefore distinguish:

```text
SOURCE / FACT
      ↓
CANDIDATE EVENT
      ↓
REVIEW
      ↓
VALIDATED MEMORY
      ↓
PROJECTION / TIMELINE
```

This is complementary to WEDDINGCITY's cascade model:

```text
MEMORY
  ↓
CHANGE
  ↓
IMPACT ANALYSIS
  ↓
HUMAN VALIDATION
  ↓
CASCADE
  ↓
PROJECTIONS
```

AIME-TIMELINE handles the **review of uncertain/incomplete information**; WEDDINGCITY handles the **impact of an accepted change**.

## 6. Provenance rule

The current source confirms that an event can carry a source string and declaration state. It does not establish a richer provenance protocol.

For AIME-COMPOSER, provenance should therefore be designed as a first-class record without claiming that AIME-TIMELINE already implements the full model:

```text
PROVENANCE
 ├─ source_id
 ├─ source_type
 ├─ source_locator
 ├─ captured_at
 ├─ extracted_at
 ├─ extraction_method
 ├─ original_value
 ├─ normalized_value
 └─ reviewer / validation state
```

Only fields with real source evidence should be populated for imported projects. The rest remain unknown/null until audited.

This follows the general provenance principle that data history and context need to be tracked separately from the derived result. Provenance research explicitly treats tracking the history/context of data as a distinct concern from the computation itself.

## 7. Uncertainty rule

The existing `declared === false` state is useful evidence for an uncertainty/verification UX, but it should not be renamed internally to `confidence` without additional source evidence.

Recommended Composer vocabulary:
- `DECLARED`
- `UNDECLARED`
- `SOURCE_MISSING`
- `CONFLICTING`
- `PENDING_REVIEW`
- `VALIDATED`

These are Composer-level design candidates, not claims about the existing AIME-TIMELINE schema.

## 8. Reusable section candidates

| Primitive | Evidence | Reuse |
|---|---|---|
| Memory Timeline | CONFIRMED | REUSE_ADAPT |
| Declaration / uncertainty marker | CONFIRMED | REUSE_ADAPT |
| Intelligent Review panel | CONFIRMED | REUSE_ADAPT |
| Document status workflow | CONFIRMED | REUSE_ADAPT |
| OCR intake surface | CONFIRMED | REUSE_ADAPT |

## 9. Creative Web Studio translation

For a future web-creation workflow, the same architecture can become:

```text
CLIENT CONTENT
      ↓
SOURCE / FILE / MESSAGE
      ↓
EXTRACTED FACT
      ↓
PENDING REVIEW
      ↓
CLIENT VALIDATION
      ↓
CANONICAL PROJECT MEMORY
      ↓
DESIGN / COPY / TIMELINE PROJECTIONS
```

Example: a client sends a logo, company description and opening-hours document. The system may extract candidate facts, but publication-facing content should remain pending until the client validates it.

This preserves the project's principle that AI proposes and the human validates.

## 10. Evidence boundaries

Confirmed:
- event chronology
- event source/declaration metadata
- undeclared-event visual state
- review status states
- suggestions/actions UI
- document receipt/validation states
- OCR intake UI

Not confirmed by this pass:
- persistent provenance graph
- cryptographic provenance
- structured source locators
- automatic conflict resolution
- durable audit log
- generalized confidence scoring
- automatic publication cascade

These remain open audit targets, not implemented features.

## 11. Result

AIME-TIMELINE is now classified in AIME-COMPOSER as a **MEMORY + REVIEW primitive** rather than merely a visual timeline.

Its strongest contribution is the transition from information that exists to information that has been reviewed and can safely become project state.
