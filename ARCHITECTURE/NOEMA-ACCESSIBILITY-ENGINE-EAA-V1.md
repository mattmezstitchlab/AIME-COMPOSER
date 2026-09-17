# NOEMA ACCESSIBILITY ENGINE — EAA / RGAA V1

**Status:** PROPOSED — documentation/audit only, no source project modified  
**Objective:** converge the existing accessibility scanner and the accessibility requirements already present across AIME projects into one auditable engine.

## 1. Strategic position

AIME should not create a generic “accessibility widget”.

The target is an **Accessibility Audit + Remediation Intelligence** layer capable of:

1. accepting a public URL;
2. crawling a defined scope;
3. analyzing the rendered interface;
4. analyzing source code when available;
5. testing keyboard and interaction paths;
6. testing responsive/zoom/reflow behavior;
7. checking assistive-technology semantics;
8. mapping findings to WCAG / RGAA / EN 301 549 / EAA obligations where applicable;
9. distinguishing automated evidence from tests requiring human validation;
10. producing a traceable report;
11. explaining the actual code location and remediation path when source is available;
12. re-scanning after correction;
13. preserving the audit history.

The product must never claim legal certification solely from an automated scan.

## 2. Legal scope — do not oversimplify EAA

The European Accessibility Act (Directive (EU) 2019/882) applies from **28 June 2025** to specified products and services, including e-commerce, consumer banking, certain transport services, electronic communications and other categories. It does **not** make every ordinary website automatically subject to the same EAA obligations. Microenterprises providing services have an exemption under the Directive, subject to the applicable national implementation. citeturn1search1turn1search9

Therefore the engine must begin with **SCOPE / APPLICABILITY**, not with a simplistic “EAA compliant / non-compliant” badge.

```text
URL / PROJECT
   ↓
ORGANISATION / SERVICE CONTEXT
   ↓
JURISDICTION
   ↓
APPLICABILITY
   ↓
REFERENCE PROFILE
   ↓
AUDIT
```

Possible profiles:

- `EAA_SERVICE`
- `RGAA_FR_PUBLIC_OR_ARTICLE47`
- `WCAG_2_2_AA`
- `EN_301_549`
- `CUSTOM_ACCESSIBILITY`
- combinations when justified.

The report must clearly separate **legal applicability**, **technical reference**, and **observed accessibility defects**.

## 3. Existing SCAN primitive

The existing `mattmezstitchlab/scan` repository already provides a concrete foundation:

- Node/Express service;
- Playwright Chromium;
- axe-core Playwright;
- URL normalization;
- same-domain crawling;
- configurable page limit with a 50-page safety cap;
- 30-second page timeout;
- WCAG 2A / 2AA / 2.1A / 2.1AA axe tags;
- severity mapping;
- WCAG criterion extraction;
- page-level violation output.

This is **REUSE_ADAPT**, not a new scanner. The actual implementation confirms these capabilities. fileciteturn138file0L1-L6 fileciteturn139file0L1-L7

### Existing limitation

The current scanner is primarily an axe/runtime scanner. It should not be treated as a complete accessibility audit engine because important tests remain outside automatic axe coverage: keyboard journeys, focus order, screen-reader behavior, dynamic interaction semantics, zoom/reflow, media alternatives, content comprehension and expert/manual tests.

The engine therefore needs **multiple evidence layers**.

## 4. Unified audit architecture

```text
                         ACCESSIBILITY ENGINE
                                  │
             ┌────────────────────┼────────────────────┐
             ↓                    ↓                    ↓
        URL / RUNTIME          SOURCE CODE          HUMAN TEST
             │                    │                    │
        Playwright              AST/HTML/CSS       Guided protocol
        axe-core                JSX/TSX/etc.       Keyboard
        DOM probe               semantics          Screen reader
        visual probe            components         Cognitive review
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  ↓
                         EVIDENCE NORMALIZER
                                  ↓
                         CRITERION MAPPING
                                  ↓
                   WCAG / RGAA / EN 301 549
                                  ↓
                           APPLICABILITY
                                  ↓
                       FINDINGS + CONFIDENCE
                                  ↓
                    REMEDIATION / PROOF / RE-SCAN
```

## 5. Audit dimensions

### A. Perceivable

- text alternatives;
- image alternatives;
- decorative image handling;
- captions/transcripts;
- colour contrast;
- non-colour cues;
- text resizing;
- zoom;
- reflow;
- responsive content;
- spacing;
- orientation;
- flashing / seizure risk;
- audio controls;
- meaningful visual information alternatives.

### B. Operable

**Keyboard is a first-class audit dimension.**

Test:

- every interactive element reachable;
- logical Tab sequence;
- no keyboard trap;
- visible focus;
- focus not hidden behind fixed UI;
- focus restoration after modal/dialog;
- Escape behavior;
- Enter/Space behavior;
- skip links;
- menus;
- dialogs;
- tabs;
- accordions;
- carousels;
- custom controls;
- drag-and-drop alternatives;
- pointer target size where applicable;
- timeout handling;
- reduced-motion behavior.

The audit must not reduce keyboard accessibility to the presence of `tabindex`.

### C. Understandable

- page language;
- predictable navigation;
- consistent naming;
- clear labels;
- form instructions;
- error identification;
- error recovery;
- status messages;
- understandable authentication;
- understandable payment flows;
- cognitive load;
- clear headings and information hierarchy.

### D. Robust

- semantic HTML;
- accessible names and descriptions;
- ARIA validity and correct role/state/property use;
- landmark structure;
- heading hierarchy;
- form associations;
- live regions;
- dynamic DOM changes;
- custom components;
- compatibility with assistive technologies;
- no reliance on CSS-only meaning.

The four dimensions correspond to the familiar perceivable / operable / understandable / robust model used by accessibility references. The EAA itself requires accessible services and interfaces, including multiple input/output options and interoperability with assistive technologies. citeturn1search4turn0search7

## 6. Keyboard Engine

A dedicated **Keyboard Engine** is mandatory.

```text
PAGE
 ↓
TAB MAP
 ↓
FOCUS GRAPH
 ↓
INTERACTION PATHS
 ↓
BLOCKERS / TRAPS / ORDER ERRORS
 ↓
EVIDENCE
```

It should produce a focus graph:

```text
START
 ↓
SKIP LINK
 ↓
HEADER
 ↓
NAV
 ↓
MAIN
 ↓
SECTION
 ↓
ACTION
 ↓
DIALOG
 ↓
RETURN FOCUS
```

For complex widgets, use the appropriate composite keyboard pattern rather than forcing every visual cell into an independent Tab stop. This is especially important for grids, timelines and dense visual interfaces. Existing AIME research already identified this requirement for complex grid-like experiences. fileciteturn135file2L162-L164

## 7. Screen-reader / semantic engine

The engine must inspect:

- accessible names;
- roles;
- states;
- descriptions;
- landmarks;
- headings;
- lists;
- tables;
- forms;
- dialogs;
- live regions;
- hidden content;
- DOM order versus visual order.

Where automation can only infer compatibility, mark the finding:

`REQUIRES_ASSISTIVE_TECH_TEST`.

Do not present DOM heuristics as proof of NVDA, VoiceOver, JAWS or other real screen-reader compatibility.

## 8. Visual / zoom / reflow engine

Run defined viewport and zoom scenarios:

- desktop baseline;
- mobile baseline;
- 200% zoom;
- narrow viewport / reflow;
- large text / spacing scenarios where testable;
- light/dark where relevant;
- reduced motion;
- high contrast / forced-colour scenarios where testable.

Check:

- content clipping;
- overlapping controls;
- hidden focus;
- horizontal double-scroll;
- fixed overlays blocking content;
- inaccessible menus;
- unreadable text;
- loss of functionality.

AIME launch audits already specify keyboard, focus, 200% zoom, contrast, screen reader and reduced motion as explicit tests. fileciteturn135file1L125-L136

## 9. Source-code engine

When source is available, the audit should locate the probable remediation point:

```text
FINDING
 ↓
DOM NODE
 ↓
COMPONENT
 ↓
SOURCE FILE
 ↓
LINE / SYMBOL
 ↓
EXPLANATION
 ↓
PROPOSED FIX
```

Supported initial targets:

- HTML;
- JSX / TSX;
- Vue;
- Svelte;
- CSS / SCSS;
- PHP templates;
- common server-rendered templates.

No source access means **URL audit only**.

## 10. Finding model

Every finding should contain:

```text
id
url
page
component?
source_location?
dimension
criterion
reference_profile
severity
confidence
automation_level
evidence
observed_behavior
why_it_matters
recommended_fix
requires_human_test
status
first_seen
last_seen
resolved_at?
```

### Automation level

- `AUTOMATED`
- `SEMI_AUTOMATED`
- `HUMAN_REQUIRED`
- `NOT_TESTABLE`

### Confidence

- `CONFIRMED`
- `HIGH`
- `MEDIUM`
- `LOW`
- `UNVERIFIED`

## 11. Reports

The engine should generate at least four views:

### Executive report

For the client:

- scope;
- applicability;
- overall state without misleading “certification” language;
- major risks;
- priorities;
- estimated remediation work;
- next steps.

### Technical report

For the developer:

- exact URL;
- selector;
- source location if available;
- criterion;
- evidence;
- code-level explanation;
- suggested remediation.

### Compliance matrix

Criterion-by-criterion:

`CONFORME | NON_CONFORME | NON_APPLICABLE | NON_TESTE | A_VERIFIER`

### Remediation plan

```text
CRITICAL / BLOCKING
HIGH
MEDIUM
LOW
BEST PRACTICE
```

Never collapse legal compliance and UX recommendations into the same score.

## 12. Declaration / regulatory deliverables

For French public-sector/RGAA contexts, the system should be able to prepare the appropriate accessibility declaration and action-plan material from the audit evidence, but only after the applicable legal profile is confirmed.

The official RGAA remains the reference for the French public-sector scope, currently version 4.1.2 while RGAA 5 is being prepared. citeturn1search3

The system must not automatically label an EAA service “compliant” merely because an automated WCAG scanner returns zero findings.

## 13. Remediation loop

This is where AIME can become more useful than a conventional scanner:

```text
SCAN
 ↓
UNDERSTAND
 ↓
EXPLAIN
 ↓
LOCATE CODE
 ↓
PROPOSE FIX
 ↓
HUMAN VALIDATES
 ↓
APPLY
 ↓
TEST
 ↓
RE-SCAN
 ↓
PROOF
```

The user can ask:

> « Corrige-moi les problèmes clavier. »

NOEMA should first produce the proposed changes and affected files, then wait for validation before applying consequential changes.

## 14. AIME project convergence audit

| Project / primitive | Accessibility contribution | Status |
|---|---|---|
| `scan` | URL crawl + Playwright + axe + WCAG tagging | **REUSE_DIRECT / ADAPT** |
| AIME Studio | publication / website / mini-site context | **INTEGRATION TARGET** |
| AIME Network | universal timeline, dynamic interaction, public pages | **AUDIT SOURCE** |
| AIME Passport | identity / public profile / forms / public pages | **AUDIT SOURCE** |
| AIME Desktop | document ingestion / OCR / multimodal access | **AUDIT SOURCE** |
| AIME Timeline | temporal interface / keyboard / status review | **AUDIT SOURCE** |
| AIME Archive | state / simulation / rollback / auditability | **PROOF / HISTORY** |
| WEDDINGCITY | complex interactive workflows / cascade | **AUDIT SOURCE** |
| OPUS | client portal / tokenized follow-up / status states | **AUDIT SOURCE** |
| DISPOO | booking / forms / availability / payment | **HIGH-VALUE AUDIT SOURCE** |
| SILLAGE | collaborative composition / controls | **AUDIT SOURCE** |
| Timeline Theater | timeline editor / drag / resize / media | **HIGH-RISK KEYBOARD SOURCE** |
| AIME Composer | canvas / timeline / inspector / grid | **HIGH-RISK KEYBOARD SOURCE** |
| Universal Card | progressive profile / forms / sensitive data | **ACCESSIBILITY + PRIVACY SOURCE** |
| Universal Grid | rulers / guides / snapping / dense visual interaction | **HIGH-RISK ALTERNATIVE-INPUT SOURCE** |
| AIME Art Engine | typography / colour / spacing / contrast / visual QA | **QUALITY ENGINE** |
| NOEMA Gardienne | natural language / voice / text / multimodal entry | **ACCESSIBILITY ENTRY LAYER** |

## 15. Unified product

The result is not “AIME Studio + a separate scanner”.

It becomes:

```text
                         AIME STUDIO
                              │
                       PROJECT / WEBSITE
                              │
                    ┌─────────┴─────────┐
                    ↓                   ↓
                COMPOSER           PUBLIC SITE
                    │                   │
                    └─────────┬─────────┘
                              ↓
                  NOEMA ACCESSIBILITY ENGINE
                              │
       ┌──────────────┬───────┼────────┬──────────────┐
       ↓              ↓       ↓        ↓              ↓
     SOURCE         DOM    KEYBOARD  VISUAL        SCREEN READER
       │              │       │        │              │
       └──────────────┴───────┼────────┴──────────────┘
                              ↓
                       EVIDENCE GRAPH
                              ↓
                 WCAG / RGAA / EN 301 549
                              ↓
                     EAA APPLICABILITY
                              ↓
                     AUDIT / REPORT / QA
                              ↓
                    FIX / TEST / RE-SCAN
                              ↓
                          PROOF
```

## 16. Product positioning

Potential service language should remain factual:

> **Analysez votre site. Comprenez ce qui bloque. Sachez quoi corriger. Prouvez ce qui a été corrigé.**

The strongest differentiator is not a compliance badge. It is the bridge between **audit evidence and actual remediation**.

The market already contains scanners and multi-engine approaches; examples include official French RGAA tooling, GitHub's accessibility scanner, and open-source multi-engine scanners. citeturn2search2turn3search4turn3search0

AIME's differentiation should therefore come from convergence with its existing Composer, source-of-truth, project memory, validation, provenance and publication systems rather than from merely duplicating axe-core.

## 17. Mandatory safeguards

- No legal certification claim from automated results alone.
- No invented evidence.
- No fabricated source locations.
- No automatic code modification without human validation.
- Every finding carries evidence and confidence.
- Every exception/exemption is explicitly documented and never inferred silently.
- Sensitive URLs, credentials and authenticated test data must be handled separately and securely.
- Third-party content outside the operator's control must be distinguished from operator-controlled content.

## 18. Next implementation sequence

### Phase 0 — inventory

Audit the existing `scan` repository and all relevant AIME projects without modifying them.

### Phase 1 — normalize

Create the finding/evidence/reference schema.

### Phase 2 — extend runtime

Keep the existing axe/Playwright scanner and add:

- keyboard traversal;
- focus graph;
- zoom/reflow probes;
- reduced-motion scenarios;
- semantic/ARIA probes;
- form interaction probes;
- accessible-name checks;
- dynamic-state checks.

### Phase 3 — source intelligence

Map DOM findings to source files and components where source is available.

### Phase 4 — human test protocol

Create guided manual workflows for screen reader, keyboard, cognitive clarity and complex interactions.

### Phase 5 — report

Generate client, developer, compliance and remediation reports.

### Phase 6 — remediation loop

Proposal → human validation → patch → tests → re-scan → proof.

## 19. Final architectural rule

> **A scanner finds evidence. NOEMA turns evidence into understanding, action and proof.**

That is the distinction between a URL checker and an accessibility engineering system.
