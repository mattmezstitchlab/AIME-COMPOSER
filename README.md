# AIME-COMPOSER

## Page d'accueil

`index.html` is the repository's front door — an AIME screen like any other, audited
by Design QA with the other 31. It is where the concept is shown working: a
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
npm run verify  # execute the scripts of all 34 audited screens in a DOM (needs the jsdom devDependency)
npm run check   # qa then verify
npm run serve   # serve the repository on http://0.0.0.0:8080/design-system/
```

Contents: 23 colour primitives and 21 roles × 2 themes behind an enforced WCAG
contract · 9 typographic roles · a closed 10-step spacing scale · 86 glyphs in 17
categories, no emoji · 29 fundamental components · the five AIME organs (Universal
Card, Universal Timeline, Universal Grid, Composer, Universal Media) · the NOEMA
layer with its six epistemic states · 13 patterns · a data-visualization language ·
12 automatic Design QA families · 34 audited screens (19 documentation chapters,
the art-direction brief page, 11 experience screens, the NOEMA loop screen, the
Atlas media library, and the repository homepage).

`design-system/direction.html` picks an artistic direction **inside** the system
(theme, accent step in the fuchsia ramp, density, motion, radius level), previews
it live through token overrides, and exports either an agent-ready brief
(choices + application rules + CSS) or a drop-in `tokens.custom.css` — applying
it to a project stays a human decision, re-measured by the diagnostic.

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

## Médiathèque

`atlas/` is the media library: every visual, video, audio track and vector recorded
in the account's repositories, referenced where it lives — never copied here.
The five pre-system Atlas screens were removed; the current page is built with the
Design System and audited with it.

The catalogue is **generated, never handwritten**:

```bash
node atlas/build-media.mjs   # scan the account's git trees via `gh api` → atlas/media.json
```

The page reads `atlas/media.json` and shows each image's real file through a CDN
(jsDelivr, raw fallback); a video is never played in-page (tile + source link);
an unavailable file admits it with its type tile instead of a broken frame.
Search, type filters (images / videos / vectors / audio) and per-repository
filtering are all client-side. Every card can be **downloaded** or **checked**;
the selection toolbar copies plain links, builds a structured **agent brief**
(instructions + JSON manifest with CDN and fallback URLs), or downloads a `.sh`
recovery script — transmitting stays an agent's job, validating stays human.

The mechanisms this library converges (media registries, resolution layers,
per-project storages) are audited in `AUDIT/MEDIA-ATLAS-01.md`.
The old pre-system Atlas specification (`AUDIT/ATLAS-SPEC.md`) is superseded.
