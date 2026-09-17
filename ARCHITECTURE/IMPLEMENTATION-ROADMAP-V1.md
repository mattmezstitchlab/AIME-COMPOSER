# NOEMA / AIME — IMPLEMENTATION ROADMAP V1

Status: **PARTIALLY IMPLEMENTED — Phase 0 delivered, Phases 1–8 not started**

| Phase | Statut | Preuve |
|---|---|---|
| 0 — Contract and safety | **IMPLÉMENTÉE** | `loop/` · 73 tests · les deux preuves de sortie vérifiées |
| 1 — Memory spine | proposée | — |
| 2 — Universal Timeline | proposée | — |
| 3 — Universal Bureau | proposée | — |
| 4 — Composer | proposée | — |
| 5 — Client collaboration | proposée | — |
| 6 — Action layer | **partiellement** | `loop/src/action.mjs` · registre, autorisation, exécution tracée |
| 7 — Creative Web Studio | proposée | — |
| 8 — Governance and scale | **partiellement** | `loop/src/governance.mjs` · les huit droits de la constitution §6 |

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
| **TIMELINE** | **absent** | aucun moteur ; c'est le seul maillon manquant |
| PROPOSAL | réel | `noema.mjs` `propose()` — état `proposed`, statut `open` |
| VALIDATION | réel | `noema.mjs` `decide()` — seul chemin vers un fait |
| ACTION | réel | `loop/src/action.mjs` — autorisation et exécution distinctes |
| PROOF | réel | preuve sur décision, autorisation et exécution |

Nine of ten links exist and are tested. TIMELINE is the remaining gap:
the loop can observe, propose, validate, act and prove, but it cannot
yet reason across time. Everything above is verified by
`cd loop && npm test` — 73 tests, 0 failures.
