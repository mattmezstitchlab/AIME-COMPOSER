# AIME-COMPOSER — FUNCTIONAL WIRING AUDIT V1

Status: **AUDIT / EVIDENCE-BASED / NO CODE CHANGE**
Date: 2026-09-17

## Purpose

This audit distinguishes what the current Playground visibly presents from what is actually connected to a real data source, external service, canonical model or execution path.

The audit is deliberately conservative: an interface element is not considered functional merely because it exists or changes visual state.

## Classification

- **CONNECTED / REAL** — evidence of a working path exists.
- **PARTIALLY CONNECTED** — meaningful behavior exists but an important dependency or persistence layer is missing.
- **LOCAL PROTOTYPE** — behavior exists only in browser/local state.
- **SIMULATED** — interface imitates a capability without executing the real operation.
- **PLACEHOLDER** — visual surface exists but behavior is absent/minimal.
- **DOCUMENTED ONLY** — architecture exists without corresponding implementation in the Playground.
- **NOT IMPLEMENTED** — no functional surface.
- **BLOCKED / EXTERNAL** — architecture is clear but execution depends on an external connector/provider.

## Executive finding

The Playground is currently a **functional interaction prototype**, not yet a connected NOEMA runtime.

The strongest working layer is the local Composer workspace. The Universal Card, Timeline and Grid demonstrate useful interaction patterns, but several behaviors remain local or simulated. The architecture documents are significantly ahead of the executable wiring.

The immediate example reported during live testing is confirmed: Universal Card music input is **LOCAL PROTOTYPE**, not a music search.

## 1. Navigation / Playground

**Status: PARTIALLY CONNECTED**

Evidence: `atlas/index.html` exposes four prototype surfaces through an iframe: Composer, Universal Card, Universal Timeline and Universal Grid.

Current behavior:
- navigation swaps iframe source;
- there is no application router;
- child surfaces have historically lacked a universal home affordance;
- PR #20 addresses Composer home navigation specifically.

Source of truth: none; this is prototype navigation.

Next slice:
- establish one predictable navigation contract;
- make every child surface able to return to Playground;
- preserve active surface and deep-link state.

W3C emphasizes consistent, predictable navigation and controls. 

## 2. Composer canvas

**Status: PARTIALLY CONNECTED / LOCAL PROTOTYPE**

Evidence: `atlas/composer.html` implements node creation, selection, deletion, renaming, links, presets, local save/restore, JSON import/export and preview.

Current behavior:
- nodes are held in in-memory `state`;
- local persistence uses `localStorage`;
- preview is generated from the local workspace;
- primitives carry audited source/evidence/reuse metadata;
- no canonical Project/Memory backend is connected.

PR #20 specifically addresses click-vs-drag stability and home navigation.

Source of truth: local Composer state.

Next slice:
- connect Composer project identity to canonical Project/Memory;
- make composition a projection/version rather than the canonical asset store;
- persist decisions/proposals/versions through the universal contracts.

## 3. Universal Card

**Status: LOCAL PROTOTYPE**

Evidence: `atlas/universal-card.html` reads and writes `aime-universal-card` in `localStorage`.

Current behavior:
- fields update the visual card;
- save/reset are local;
- sensitive fields are visibly marked as prototype-only;
- no canonical Person/Organization/Project memory backend is connected.

Source of truth: browser localStorage.

Risk: the UI can look like a persistent identity system while it is only a local prototype.

Next slice:
- canonical Universal Card projection from Memory;
- source/confidence/status/visibility/permission metadata;
- Mirror → confirmation/correction.

## 4. Universal Card — music

**Status: LOCAL PROTOTYPE / NOT CONNECTED**

Evidence: the `song` field only updates `songName` and the Play control toggles a CSS/UI state. There is no catalog query, provider result, preview source, track identifier or music connector.

Required flow:

```text
TITLE / ARTIST
 → SEARCH INTENT
 → MUSIC CONNECTOR
 → REAL RESULTS
 → HUMAN SELECTS
 → PROVIDER PREVIEW IF ALLOWED
 → CANONICAL TRACK REFERENCE
 → CARD / PLAYLIST / COMPOSER
```

Required safeguards:
- explicit provider/source;
- no invented results;
- partial/spelling-tolerant search;
- `NO RESULT` and `AMBIGUOUS` states;
- preview rights distinction;
- no client-side secrets;
- provenance.

## 5. Media Library

**Status: DOCUMENTED ONLY at NOEMA architecture level; prototype evidence not yet sufficient for connected behavior**

The architecture defines Universal Media Library and the `PROJECT → PAGE → SECTION → MEDIA SLOT → REAL ASSET` relationship. Existing audited source projects provide real media primitives, but the current AIME-COMPOSER Playground does not yet expose a connected universal asset registry.

Next slice: import → analyze → classify → provenance → rights → media slot → Composer.

## 6. Universal Timeline

**Status: LOCAL PROTOTYPE**

Evidence: `atlas/timeline.html` contains Plan/Compose/Live/Review/History/Read modes, selectable nodes, zoom controls and a playhead. The mode buttons change labels/visibility, but the timeline data is hard-coded in the HTML.

The file does not currently connect to a canonical event stream.

Important distinction: this is a prototype of the interaction model, not the production Universal Timeline described in architecture.

Next slice: canonical `ProjectEvent` stream → timeline projection → provenance → next-action proposal.

## 7. Universal Grid

**Status: LOCAL PROTOTYPE**

Evidence: `atlas/grid.html` provides formats, units, grid/dots, safe area, bleed, trim, margins, center and snap behavior. The object is movable locally.

Current limitation: the format/reference model is hard-coded and the object is not connected to Composer composition data or a canonical Art Engine.

Next slice: Grid as a reusable composition projection with canonical format profiles and Art Engine constraints.

## 8. Art Engine

**Status: DOCUMENTED ONLY**

Architecture exists for typography, color harmony, iconography, spacing, grid, composition and QA. No evidence in the Playground establishes a full automated Art Engine with provenance and deterministic design decisions.

Next slice: implement a small deterministic token/constraint layer before adding generative styling.

## 9. Gardienne

**Status: DOCUMENTED ONLY**

NOEMA Gardienne is architecturally defined, but no current Playground surface demonstrates the complete Parler / Écrire / Souffler / Montrer → Context Sense → Intention → Mirror → Memory loop.

Next slice: implement a minimal text-first Gardienne with explicit Mirror and confirmation before adding voice/visual signals.

## 10. Memory / Mirror

**Status: PARTIALLY CONNECTED conceptually; NOT IMPLEMENTED as canonical runtime**

Existing audited source projects contain memory/event primitives, and the architecture defines evidence states. The Playground does not yet expose canonical memory persistence, proposal/confirmation records or correction history.

Next slice: Foundation contracts + Memory adapter over an existing canonical project model.

## 11. Relation / matching

**Status: DOCUMENTED ONLY**

Relation Engine and relational intelligence are defined, including skills, intent matching, opportunity radar and human introductions. No connected graph/runtime is established in the Playground.

Next slice: derive relations from canonical Person/Project data rather than introducing a separate graph database prematurely.

## 12. Bureau / LOCAL

**Status: DOCUMENTED ONLY in AIME-COMPOSER; REAL PRIMITIVES EXIST IN AUDITED SOURCE PROJECTS**

DISPOO and related audited projects provide concrete local ingestion/viewer/classification primitives. They have not yet been connected as the Universal Bureau runtime in AIME-COMPOSER.

Next slice: LOCAL bridge → ingestion → classification → canonical asset/document → dossier.

## 13. Documents / administrative generation

**Status: DOCUMENTED ONLY in AIME-COMPOSER**

The Universal Bureau and Administrative Document Engine are architecturally defined. Existing OPUS/MSA work provides evidence for requirements and dossier workflows, but there is no connected universal document generator in the Playground.

Next slice: one real document family with source-of-truth variables → preview → approval → version → proof.

## 14. Financial Engine

**Status: DOCUMENTED ONLY**

The Financial Engine defines MONEY / RECEIVABLE / COMMITMENT / PROJECTION / CAPACITY / SCENARIO and regulated-provider boundaries. No bank or payment-account connector is connected to the Playground.

Next slice: read-only financial evidence adapter first; no autonomous payment or credit decision.

## 15. Visual Communication Engine

**Status: DOCUMENTED ONLY**

The architecture defines event → real media → identity → format → composition → accessibility/rights/proof → approval → export/publish. No universal communication generator is currently wired in the Playground.

Next slice: one event → one master communication object → multiple format projections.

## 16. Site Foundation / legal / SEO / analytics

**Status: DOCUMENTED ONLY**

Architecture is defined, including identity/legal source of truth, semantic sitemap, SEO, analytics/consent and accessibility. No connected site-generation pipeline is demonstrated in the current Playground.

Next slice: canonical Site Foundation object and projections into footer, legal pages, metadata and sitemap.

## 17. Accessibility / EAA

**Status: PARTIALLY CONNECTED**

A real `mattmezstitchlab/scan` project exists using Playwright + axe-core, providing an actual foundation for automated scanning. The broader EAA engine remains architectural and requires keyboard/focus/screen-reader/manual coverage beyond automated axe checks.

The correct status is therefore not “compliant”; it is “automation foundation exists + broader engine not yet integrated”.

## 18. Comments / proposals / approvals

**Status: DOCUMENTED ONLY in Playground**

The architecture defines Comment → Proposal → Revision → Approval. Composer contains a proposed Comment primitive and confirmed Approval/Version primitives, but there is no connected collaborative review backend in the Playground.

Next slice: versioned object → contextual comment → proposal → revision → explicit approval.

## 19. Client Portal

**Status: DOCUMENTED ONLY in Playground**

OPUS provides evidence for a tokenized no-account client follow-up pattern, but it is not wired into the current Playground.

Next slice: read-only project projection → requested action → comment/proposal → approval.

## 20. Connectors

**Status: NOT CONNECTED**

No universal connector runtime is established in the current Playground. Music is the clearest immediate example.

Next slice: connector contract with capabilities, scopes, authorization, sync direction, error handling, provenance and revocation.

## 21. Automation / reminders

**Status: DOCUMENTED ONLY**

The automation model is defined as Trigger → Context → Proposal → Authorization → Execution → Result → Proof. No runtime scheduler/automation engine is connected to the Playground.

Next slice: reminders first, with explicit authorization and audit.

## 22. Search / knowledge

**Status: NOT CONNECTED**

No universal cross-memory search is connected in the Playground.

Next slice: search canonical objects first; add semantic ranking only after deterministic filtering/provenance works.

## 23. Proof / QA

**Status: PARTIALLY CONNECTED**

Composer displays evidence/reuse metadata and audited architecture defines proof contracts. However, the Playground does not yet produce a universal persisted Proof record for meaningful operations.

Next slice: implement a small proof object and attach it to validation/release actions.

## 24. Permissions / governance

**Status: DOCUMENTED ONLY**

The architecture defines permissions, authorization, retention, audit, reversibility and export. The Universal Card prototype explicitly warns that sensitive fields are prototype-only, but there is no canonical permission service in the Playground.

Next slice: read/write authorization boundary before sensitive connectors.

## 25. Export / recovery

**Status: PARTIALLY CONNECTED locally**

Composer supports local JSON export/import. This is useful evidence for portability but is not yet the universal export/recovery contract defined by NOEMA.

Next slice: canonical snapshot manifest containing data, original files, provenance, relations, versions, decisions and permissions.

# Priority backlog

## P0 — Make the prototype honest and navigable

1. Universal home navigation on every child surface.
2. Explicit `PROTOTYPE / LOCAL / SIMULATED / CONNECTED` status where relevant.
3. Fix remaining canvas interaction edge cases.
4. Universal accessibility baseline: labels, focus, keyboard operation, predictable feedback.

## P1 — Connect the first canonical spine

1. Foundation contracts.
2. Memory / Universal Card.
3. Project canonical model.
4. Universal Timeline projection.
5. Mirror + confirmation/correction.
6. Persisted proof records.

## P2 — Connect real external capabilities

1. Music connector.
2. Media ingestion.
3. Bureau / LOCAL.
4. Search.
5. Communication/reminders.

## P3 — Build the creative production loop

1. Grid ↔ Composer.
2. Media Library ↔ Composer.
3. Art Engine constraints.
4. Comment → Proposal → Revision → Approval.
5. Client Portal.
6. Visual Communication Engine.

## P4 — External and governance layers

1. Site Foundation.
2. Accessibility engine integration.
3. Financial read-only connector.
4. Permission service.
5. Export/recovery.
6. Publication/release monitoring.

# First real vertical slice

```text
USER
 ↓
GARDIENNE
 ↓
INTENTION
 ↓
PROJECT
 ↓
MEMORY
 ↓
UNIVERSAL TIMELINE
 ↓
PROPOSAL
 ↓
HUMAN VALIDATION
 ↓
ACTION
 ↓
PROOF
```

The architecture is now broad enough. The next work should be **wiring existing primitives**, not adding another top-level engine.

## Audit rule

If a button changes a CSS class, local state or localStorage but does not reach the intended canonical/external system, it is not classified as connected.

If architecture exists without executable evidence, it is not classified as connected.

If an external service is required but not authorized/configured, it is not classified as connected.

This is the source-of-truth rule for the next implementation phase.
