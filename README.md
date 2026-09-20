# AIME-COMPOSER

## Page d'accueil

`index.html` is the repository's front door — an AIME screen like any other, audited
by Design QA with the other 34. It is where the concept is shown working: a
conversation field with NOEMA, the Universal Card, the Universal Timeline (both
fed live by the loop when `node loop/server.mjs` runs), the Universal Grid with a
working format selector, the Composer, and the diagnostic applied to external
projects. Served statically it stays readable and says so — nothing simulates.

`home.js` owns that wiring and nothing else: no business rule is recomputed in
the page, the loop's modules stay the only source of truth.

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
npm run verify  # execute the scripts of all 36 audited screens in a DOM (needs the jsdom devDependency)
npm run check   # qa then verify
npm run serve   # serve the repository on http://0.0.0.0:8080/design-system/
```

Contents: 23 colour primitives and 21 roles × 2 themes behind an enforced WCAG
contract · 9 typographic roles · a closed 10-step spacing scale · 86 glyphs in 17
categories, no emoji · 29 fundamental components · the five AIME organs (Universal
Card, Universal Timeline, Universal Grid, Composer, Universal Media) · the NOEMA
layer with its six epistemic states · 13 patterns · a data-visualization language ·
12 automatic Design QA families · 36 audited screens (19 documentation chapters,
the art-direction brief page, 11 experience screens, the NOEMA loop screen, the
Atlas media library, the repository homepage, the Point Zero shell, and the
Studio composer).

`design-system/direction.html` picks an artistic direction **inside** the system
(theme, accent step in the fuchsia ramp, density, motion, radius level), previews
it live through token overrides, and exports either an agent-ready brief
(choices + application rules + CSS) or a drop-in `tokens.custom.css` — applying
it to a project stays a human decision, re-measured by the diagnostic.

Normative specification: `ARCHITECTURE/AIME-DESIGN-SYSTEM-V1.md`.
System documentation and live screens: `design-system/index.html`.

## Studio

`design-system/studio.html` is the **composing application** — the system turned
into software, for what it does best: composing interfaces *with* the grammar
instead of around it. One canvas (the Universal Grid: nine format profiles,
columns, safe area, thirds, 0,0 origin, STOP 24 magnetic snapping), a library
that makes **every chapter of the left menu placeable** (the five organs, the
fundamental components, the six NOEMA states, data-viz, patterns as named
specimens, all 86 sprite glyphs, colour and type roles — no literal ever), an
inspector, a **NOEMA studio** (a local proposition engine — off-page, off-safe,
off-grid, overlaps, duplicates, unnamed objects — where nothing is applied
without an explicit human decision, each one journaled with its actor), a **QA
studio** (the system's own `auditLive()` module applied to the open composition,
published as a density — never an invented score) and an **export** in three
honest outputs: an agent-ready brief, an HTML projection consuming only system
classes, and the JSON document (reloadable).

The keyboard is a first-class input (V/T/F/L tools, arrows nudge, Shift = STOP,
Ctrl+D/Z/K/E), the command bar doubles the visible navigation, theme/density/
motion follow the site-wide settings, and the document autosaves locally — the
export is how it travels, nothing is uploaded. Behavioral smokes run in
`design-system/qa/smoke-studio.mjs`: the software is *used* in a DOM — place,
name, drag with magnetism, link, export, undo.

## Diagnostic

`diagnostic/` applies the system's own judge to **any** project — a local folder or
a GitHub repository — without ever writing to it.

```bash
node diagnostic/diagnose.mjs ../a-project             # a local folder
node diagnostic/diagnose.mjs --owner O --repo R       # a GitHub repository
node diagnostic/survey.mjs                            # every repo of the account, ranked
```

It is the same engine that audits the 36 screens of the system, not a copy, so a
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

## Médiathèque

`atlas/` is the **universal media library**: every visual, video, audio track and
vector recorded in the account's repositories, referenced where it lives — never
copied here — plus, on demand, the media of a **local folder** from your machine.
The five pre-system Atlas screens were removed; the current page is built with the
Design System and audited with it.

The catalogue is **generated, never handwritten**:

```bash
node atlas/build-media.mjs   # scan the account's git trees via `gh api` → atlas/media.json
```

The scan is **transversal**: it opens the default branch of every repository
(38 today), walks each git tree recursively — descending subtrees if GitHub
truncates, budget-capped and honestly flagged — and records a per-repository
coverage table (media count, empty repos, errors, duplicates by blob sha) which
the page displays under « Couverture du scan ». An absence is a finding, never
a hidden corner: zero audio file is committed anywhere, because storage-heavy
media (DISPOO's film/hero system resolved at runtime) live outside git —
the local mode is precisely how those get classified.

The page is a **viewer**: images show their real file (jsDelivr, raw fallback),
videos and audio **play in-page** from their true source, and an unavailable
file admits it with its type tile instead of a broken frame. In **local mode**,
a picked folder is read, classified (photos / videos / audio / vectors), shown
and playable entirely in the browser — originals preserved, relative paths kept
as provenance, nothing uploaded or synced (the Bureau contract). Search, type
filters, provenance filtering and source switch (GitHub / local) are all
client-side. Every card can be **downloaded** or **checked**; the selection
toolbar copies plain links, builds a structured **agent brief** (instructions +
JSON manifest with CDN/fallback URLs, or transfer-by-hand clauses for local
files), or downloads a `.sh` recovery script — transmitting stays an agent's
job, validating stays human.

The mechanisms this library converges (media registries, resolution layers,
per-project storages) are audited in `AUDIT/MEDIA-ATLAS-01.md`, with the
transversal-scan addendum. The old pre-system Atlas specification
(`AUDIT/ATLAS-SPEC.md`) is superseded.

Behavioral smokes (viewer, local ingest, coverage, selection, exports) run in
`design-system/qa/smoke-medias-v2.mjs`:

```bash
cd design-system && node qa/smoke-medias-v2.mjs
```

## Point Zero

`point-zero/` is the **universal shell** — phases P1–P5 of the fusion target audited in
`AUDIT/POINT-ZERO-FUSION-01.md` against `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md`,
all delivered on 2026-09-18.
One screen that projects the existing engines instead of duplicating them.

```bash
node loop/server.mjs   # then open http://0.0.0.0:8090/point-zero/
```

Five zones, one selection: the **Bureau** on the left — the real transversal media
catalogue (38 repositories, 366 referenced media, coverage table) plus the local
folder mode, as cards with their functions — the **Universal Grid** at the center
with nine format profiles and its 0,0 origin crosshair, the **inspector** on the
right with **NOEMA at its foot** (live `/api/intend` + `/api/decide` while the loop
server runs, honestly offline when it does not), and a **dock** holding the
Universal Timeline, the Universal Cards and a single ＋ universal import (local
folder, files, GitHub link, text or URL — everything a read-before-write).
Retractable panels, golden-ratio quiet, no demo data anywhere: unknowns stay
unknown and absences stay named (zero audio file is committed anywhere in the
account — the shell says so rather than hiding it).

Beyond the static shell: contextual **folders** in the Bureau (All / Duplicates /
Placed — dynamic views over content hashes, never copies), a **spatial engine**
(magnetic drag with STOP 24 px snap, CENTRE/BORD guides with their rule label,
full keyboard control) with **timeline↔card synchronisation** through
`entity_ref`, a **pure local import engine** (`point-zero/pz-import.mjs`, zero
dependency — ZIP central directory, PDF triage, SHA-256 dedup, import coverage
published in the Bureau, NOEMA intention pre-filled and never auto-sent), and an
**EAA control pack** of honest automatic signals (auditLive geometry, accessible
names, QA contrast) that says it replaces neither human audit nor certification.

It is the 35th audited screen. Its patterns (`pz-*`, `dock`, `uimport`) live in
`design-system/styles/pointzero.css`, are policed by the same system-prefix rule
in `js/qa.js`, and pass the same 12 QA families — innovation exempts no one.

## Boucle NOEMA

`loop/` is the minimal AIME/NOEMA loop: a provenance-carrying store, a
proposition engine, and **human-only decisions** — a decision without an actor
is refused, on every host, by the same router.

The API routes live in `loop/src/http.mjs` (`createLoopApi`) and are shared by
two hosts without duplication:

| Host | What it is | Runtime published in `/api/state` |
|---|---|---|
| `node loop/server.mjs` | the full local server — static files + API, **disk persistence** (`loop/data/world.json`, atomic writes) | `{ mode: 'server', persisted: true }` |
| `api/[[...route]].mjs` | the hosting function (Vercel) — same router, **in-memory demo world** | `{ mode: 'serverless', persisted: false }` |

**Serverless honesty contract**: on the hosting, the world lives in memory per
function instance — it survives while the instance is warm and resets to the
demonstration seed on cold start. This is *displayed*, never hidden: the
`/loop/` screen shows a "démo · réinitialisée à froid" badge and the home
badge reads "NOEMA en ligne · démo". Disk persistence remains the promise of
the full local server, never simulated.

```bash
cd loop
npm test               # 91 unit + 36 API tests (HTTP, ephemeral ports)
npm run smoke:deployed # post-deploy gate against the real host
# BASE_URL=https://… npm run smoke:deployed
```

The post-deploy smoke checks what a deployment must prove: the screen is
served, `/api/state` answers with a world and an honest runtime, an actor-less
decision is refused (400) on the real host, and unknown API routes stay JSON
404s. A deployment that does not prove what it serves is an opinion.
