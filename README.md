# AIME-COMPOSER

## Design System

`design-system/` holds **AIME DESIGN SYSTEM V1** — the universal visual system for
AIME-COMPOSER and every future NOEMA interface. It is not an application: it is a
grammar, and every screen is a projection of it.

```text
TOKENS → FOUNDATIONS → COMPONENTS → PATTERNS → LAYOUTS → EXPERIENCES
```

```bash
cd design-system
npm run build   # generate tokens + icons; refuses any colour that misses its contrast target
npm run qa      # build + audit the 12 QA families over the shipped system
npm run verify  # execute the scripts of all 32 audited screens in a DOM (needs the jsdom devDependency)
npm run check   # qa then verify
npm run serve   # serve the repository on http://0.0.0.0:8080/design-system/
```

Contents: 23 colour primitives and 21 roles × 2 themes behind an enforced WCAG
contract · 9 typographic roles · a closed 10-step spacing scale · 85 glyphs in 17
categories, no emoji · 29 fundamental components · the five AIME organs (Universal
Card, Universal Media, Universal Timeline, Universal Grid, Composer) · the NOEMA
layer with its six epistemic states · 13 patterns · a data-visualization language ·
12 automatic Design QA families · 32 audited screens (19 documentation chapters,
11 experience screens, the NOEMA loop screen, and the repository homepage).

Normative specification: `ARCHITECTURE/AIME-DESIGN-SYSTEM-V1.md`.
System documentation and live screens: `design-system/index.html`.

## Diagnostic

`diagnostic/` applies the system's own judge to **any** project — a local folder or
a GitHub repository — without ever writing to it.

```bash
node diagnostic/diagnose.mjs ../a-project             # a local folder
node diagnostic/diagnose.mjs --owner O --repo R       # a GitHub repository
node diagnostic/survey.mjs                            # every repo of the account, ranked
```

It is the same engine that audits the 31 screens of the system, not a copy, so a
project is judged under the same conditions as the screens that ship. The report
publishes a **density** (issues per screen), the families involved, the screens most
affected, and an order of repair — never an invented score out of 100.

`CONTRAST` is excluded: it measures the system's own primitives across both themes,
so counting it would bill a third-party project for our debts. It measures and names.
It repairs nothing — repairing stays a human decision.

Measured across the account — 18 projects with screens, 80 screens, 8 398 issues —
in `AUDIT/DIAGNOSTIC-SURVEY-V1.md`. That report is generated from the measurement,
not written by hand: no total in it was copied.

Details: `diagnostic/README.md`.

## Visual Atlas

AIME-COMPOSER is the audit and convergence layer above the 64 source projects. It does not merge or replace them.

The current `feat/visual-atlas` branch adds a first interactive visual Atlas at `atlas/index.html`.

### What it shows
- universal primitives and specialized capabilities
- evidence level: CONFIRMED / DOCUMENTED / CONCEPT
- audited source projects for each primitive
- search and filtering
- primitive inspection
- conceptual architecture composition
- project-family catalogue

### Principle

```text
64 PROJECTS
     ↓
AUDIT
     ↓
PRIMITIVES
     ↓
CAPABILITIES
     ↓
ARCHITECTURE
     ↓
PRODUCTS / TEMPLATES
```

The Atlas is deliberately a visual inspection tool first. Source repositories remain independent.

### Preview

`atlas/index.html` is dependency-free and can be deployed as a static site on Vercel. A GitHub-connected Vercel project can generate a Preview deployment for this branch/PR, giving a shareable URL before merge.

See `AUDIT/ATLAS-SPEC.md` for the current specification.
