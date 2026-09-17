# NOEMA / AIME — IMPLEMENTATION ROADMAP V1

Status: **PARTIALLY IMPLEMENTED — Phase 0 delivered, Phases 2/6/8 partial, the diagnostic layer implemented, Phases 1/3/4/5/7 not started**

L'en-tête précédent annonçait « Phases 1–8 not started » alors que la table
ci-dessous en marque trois « partiellement ». Une couche normative qui se
contredit à douze lignes d'intervalle ne peut pas servir d'arbitre : celui
qui la consulte cite l'en-tête, et il a tort.

| Phase | Statut | Preuve |
|---|---|---|
| 0 — Contract and safety | **IMPLÉMENTÉE** | `loop/` · 91 tests · les deux preuves de sortie vérifiées |
| 1 — Memory spine | proposée | — |
| 2 — Universal Timeline | **partiellement** | `loop/src/timeline.mjs` · moteur, modes, capacités, granularités |
| 3 — Universal Bureau | proposée | — |
| 4 — Composer | proposée | — |
| 5 — Client collaboration | proposée | — |
| 6 — Action layer | **partiellement** | `loop/src/action.mjs` · registre, autorisation, exécution tracée |
| 7 — Creative Web Studio | proposée | — |
| 8 — Governance and scale | **partiellement** | `loop/src/governance.mjs` · les huit droits de la constitution §6 |
| Transverse — Diagnostic | **IMPLÉMENTÉE** | `diagnostic/` · 23 tests · 38 dépôts mesurés |

Le diagnostic n'est pas une phase : c'est une couche transverse. Elle ne
produit aucune fonctionnalité, elle mesure l'écart entre un projet existant
et le système — le même moteur que celui qui juge les 32 écrans, appliqué à
n'importe quel dépôt. Voir §Diagnostic ci-dessous.

This roadmap turns the convergence architecture into a controlled implementation program. The goal is not to build every feature immediately. The goal is to establish one working spine and attach capabilities to it.

## Phase 0 — Contract and safety

Deliver:

- canonical identifiers;
- provenance/evidence model;
- permission model;
- action contract;
- audit model;
- environment separation;
- test-data policy;
- secrets policy;
- export/recovery specification.

Exit proof:

```text
Every persisted object has an owner, source, visibility and provenance.
Every consequential action has an authorization boundary.
```

**Delivered — `loop/`.** Both clauses are enforced by code, not by
convention, and each has a failing-direction test:

- `loop/src/schema.mjs` `validate()` refuses any object missing
  `created_by`, `source` or `provenance` (with an `origin` and a state
  drawn from the epistemic vocabulary). Refusals are tested, not assumed.
- `loop/src/action.mjs` holds the authorization boundary. Verb cost —
  scope, risk, reversibility, permission — comes from the schema registry
  and cannot be declared down by the caller. `execute()` requires an
  attributed authorization belonging to the person executing; an
  unauthenticated or anonymous call is refused and journaled.

What Phase 0 does **not** yet cover: environment separation, secrets
policy, and export/recovery specification remain unwritten.

## Phase 1 — Memory spine

Deliver:

- Universal Card;
- Person;
- Organization;
- Project;
- Relationship;
- Document reference;
- Media reference;
- confirmation / correction flow;
- Mirror experience.

Exit proof:

```text
A human can tell NOEMA something once,
see what was understood,
correct it,
confirm it,
and reuse it in another context.
```

## Phase 2 — Universal Timeline

Deliver:

- canonical event stream;
- TimelineItem projection;
- READ / PLAN / COMPOSE / REVIEW / LIVE / HISTORY modes;
- event provenance;
- temporal relations;
- next-action projection.

Exit proof:

```text
One project produces multiple timeline views
without duplicating the underlying data.
```

## Phase 3 — Universal Bureau

Deliver:

- LOCAL bridge;
- ingestion;
- classification;
- viewer;
- dossier;
- requirement engine;
- administrative document states;
- generated document versions;
- media processing hooks;
- audit/proof.

Exit proof:

```text
A folder can be understood and proposed into a dossier
without becoming a second source of truth.
```

## Phase 4 — Composer

Deliver:

- Media Library;
- Universal Grid;
- Universal Timeline COMPOSE mode;
- AIME Art Engine;
- versioning;
- comments/proposals;
- approval.

Exit proof:

```text
A real project can move from brief → composition → review → approved version.
```

## Phase 5 — Client collaboration

Deliver:

- tokenized/no-account client portal where appropriate;
- comments;
- proposals;
- requested changes;
- approvals;
- document exchange;
- status projection;
- notifications.

Exit proof:

```text
Client and creator can collaborate on the same canonical project
without duplicate project data.
```

## Phase 6 — Action layer

Deliver:

- Connector Engine;
- Communication Engine;
- Automation / Reminder Engine;
- Permission checks;
- authorization requests;
- execution logs;
- result/proof;
- recovery.

Exit proof:

```text
NOEMA can prepare an external action,
ask for the right authorization,
execute it,
and prove what happened.
```

## Phase 7 — Creative Web Studio

Deliver:

- Site Foundation;
- universal footer/legal projection;
- page/section composition;
- semantic sitemap;
- SEO metadata;
- structured data;
- analytics + consent;
- accessibility QA;
- publication/release;
- monitoring.

Exit proof:

```text
A project can become a complete website
from one canonical source of truth.
```

## Phase 8 — Governance and scale

Deliver:

- export snapshot;
- restore proposal;
- retention;
- deletion/correction;
- permission revocation;
- audit history;
- backup;
- recovery;
- monitoring;
- migration/versioning.

Exit proof:

```text
The user can understand, correct, export, revoke and recover their memory.
```

## Diagnostic — transverse, implemented

Not a phase. The diagnostic delivers no feature: it measures the distance
between an existing project and the system, so that convergence stops being
an intention and becomes a number that can be argued with.

```bash
node diagnostic/diagnose.mjs ../a-project        # a local folder
node diagnostic/diagnose.mjs --owner O --repo R  # a GitHub repository
node diagnostic/survey.mjs                       # every repo of the account, ranked
```

Three constraints, because a measurement shown to a client must survive
being read line by line:

- **It is the system's own engine** — `design-system/js/qa.js`, the one that
  validates the 32 shipped screens, not a copy. A project is judged under the
  same conditions as the screens that ship, on the same scale.
- **It never writes to the project it examines.** It measures and names.
  Repairing stays a human decision, per the founding principle.
- **It publishes no invented score.** The figure is a density — issues per
  screen — plus the families involved, the screens most affected, and an order
  of repair. A 78/100 would say nothing about what is wrong while giving the
  number an authority the measurement does not have.

`CONTRAST` is declared `REFERENCE_ONLY`: it needs both themes of the system, so
it measures our primitives, not the project's. Counting it would bill a
third-party project for our debts.

Exit proof:

```text
23 tests · 38 repositories measured · 18 projects with screens, 80 screens,
8 398 issues · report generated from the measurement, not written by hand
```

Measured report: `AUDIT/DIAGNOSTIC-SURVEY-V1.md`.

## Implementation priority

```text
FOUNDATION
   ↓
MEMORY
   ↓
TIMELINE
   ↓
BUREAU
   ↓
COMPOSER
   ↓
COLLABORATION
   ↓
ACTION
   ↓
SITE
   ↓
GOVERNANCE
```

## No feature-first development

A feature must not be implemented merely because it looks useful in isolation.

Before implementation, classify it:

```text
CORE
PROJECTION
ENGINE
CONNECTOR
EXPERIENCE
AUTOMATION
GOVERNANCE
```

Then identify the canonical object it reads/writes.

## Quality gate

Every phase must pass:

1. Architecture review.
2. Source-of-truth review.
3. Security/privacy review.
4. Automated tests.
5. Integration tests.
6. Regression tests.
7. Accessibility review where UI is involved.
8. Provenance/proof review.
9. Human validation of consequential behavior.

Automated testing is necessary but does not itself constitute legal, accessibility or regulatory certification.

## Final objective

The first meaningful milestone is not a large application.

It is a small but complete loop:

```text
HUMAN
 ↓
GARDIENNE
 ↓
INTENTION
 ↓
MEMORY
 ↓
PROJECT
 ↓
TIMELINE
 ↓
PROPOSAL
 ↓
VALIDATION
 ↓
ACTION
 ↓
PROOF
```

Once this loop is real, the rest of NOEMA becomes an expansion of the same architecture rather than a collection of disconnected products.

### State of the loop

| Maillon | Statut | Où |
|---|---|---|
| HUMAN | réel | écran + `actor` obligatoire sur toute écriture |
| GARDIENNE | réel | `POST /api/intend {dry_run}` — lire avant d'écrire |
| INTENTION | réel | `loop/src/intention.mjs` |
| MEMORY | réel | `loop/src/store.mjs` + `governance.mjs` (les huit droits) |
| PROJECT | partiel | `project_id` transverse, présent dans le monde de démonstration |
| TIMELINE | réel | `loop/src/timeline.mjs` — un moteur, six modes, projection sans écriture |
| PROPOSAL | réel | `noema.mjs` `propose()` — état `proposed`, statut `open` |
| VALIDATION | réel | `noema.mjs` `decide()` — seul chemin vers un fait |
| ACTION | réel | `loop/src/action.mjs` — autorisation et exécution distinctes |
| PROOF | réel | preuve sur décision, autorisation et exécution |

The loop is closed: all ten links exist and are tested. Verified by
`cd loop && npm test` — 91 tests, 0 failures.

The Timeline is a **projection, never a second source of truth**.
`project()` writes nothing — asserted by a test that checks both the
entity count and the journal length across all six modes. `move()`
mutates the canonical event and refuses to touch anything the Timeline
does not project. One engine, six modes: what changes between them is
the active capability set, not the data model.

What remains partial: PROJECT has no engine of its own beyond the
transverse `project_id`, and Phase 0 still lacks environment separation,
secrets policy and export/recovery.
