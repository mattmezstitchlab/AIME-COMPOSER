# AIME Design System V1

**Status:** PROPOSED / CONVERGENCE  
**Depends on:** Universal Card, Universal Timeline, Universal Grid, Composition Model, NOEMA Constitution, NOEMA Accessibility Engine (EAA)  
**Primary implementation:** `design-system/` — tokens, icon family, CSS layers 2–5, Design QA, 30 shipped screens plus `loop/index.html`, which the same QA audits.  
**Primary evidence:** the running system itself. `npm run qa` and `npm run verify` are the proof, not this document.

## 1. Purpose

One visual system for AIME-COMPOSER and for every future NOEMA interface.

Not a new application. Not a generic SaaS dashboard. Not a growing pile of components and one-off styles. A grammar: a closed set of rules from which every screen is projected, and against which every screen is checked.

The system exists so that five questions always have an immediate visual answer:

- where am I;
- what am I looking at;
- what does NOEMA know;
- what does NOEMA propose;
- what must I decide, and what just happened.

Art direction in one line: **the technology disappears behind the clarity.**

## 2. The grammar

```text
TOKENS → FOUNDATIONS → COMPONENTS → PATTERNS → LAYOUTS → EXPERIENCES
```

Each layer consumes only the layer below it. No layer may invent a value that its parent does not already declare, and no screen may define a style the system cannot explain.

Consequences that are enforced, not aspirational:

- a screen is a projection of the system, never the reverse;
- if a screen cannot be written with the system, the system is incomplete and the fix belongs in the system;
- the Design System outranks any individual screen.

## 3. Naming

| Prefix | Layer | Example |
|---|---|---|
| `t-*` | typographic role | `t-h2`, `t-meta` |
| `l-*` | layout primitive | `l-grid`, `l-measure-md` |
| `a-*` | component, BEM | `a-btn--primary` |
| `u-*` | utility | `u-muted` |
| `ucard` `umedia` `utl` `ugrid` `composer` | AIME organs | `ucard__facts` |
| `noema-*` `nstate` `prov` `conf` `approval` | NOEMA layer | `nstate[data-state]` |
| `cmdbar` `ohead` `sresults` `rview` `vdiff` `ba` `mslot` `spec` | patterns | `ohead__meta` |
| `viz-*` | data visualization | `viz-graph__edge` |
| `ds-*` | documentation chrome | `ds-demo__stage` |

`doc.css` declares no token and no colour. That is the test: if the documentation cannot be written with the system, the system is incomplete.

## 4. Tokens

Single source of truth: `design-system/src/tokens.mjs`. Generated into `tokens/tokens.css` and `tokens/tokens.json`. The generator refuses to emit if a contrast target is missed.

### 4.1 Colour roles

BACKGROUND · SURFACE · SURFACE-ELEVATED · SURFACE-SUNKEN · TEXT · TEXT-MUTED · TEXT-SUBTLE · BORDER · BORDER-SUBTLE · BORDER-STRONG · ACCENT · ACCENT-TEXT · ACCENT-ON · FOCUS-RING · SUCCESS · WARNING · ERROR · INFO, each with text and border declensions. Light and dark, 21 roles × 2 themes.

Fuchsia is a functional signal — accent, focus, proposal. It is never decoration and never a background field.

### 4.2 Contrast contract

One contract, three executors: the build (refuses to generate), the QA (refuses to validate), the colour page (renders it live).

| Target | Ratio | WCAG 2.2 |
|---|---|---|
| text on all four surfaces | 4.5:1 | 1.4.3 |
| accent-text | 4.5:1 | 1.4.3 |
| accent-on | 4.5:1 | 1.4.3 |
| focus-ring | 3:1 | 2.4.11 |
| border-strong, status borders | 3:1 | 1.4.11 |
| border | 1.25:1 | decorative, outside 1.4.11 |
| border-subtle | 1.10:1 | decorative, outside 1.4.11 |

1.4.11 scopes to boundaries that *identify* an object. Separators do not, so they carry documented floors instead of a 3:1 target. On a fuchsia fill the text is ink, not white — white measures 3.41:1 and fails.

### 4.3 Type

Nine roles, modular ratio 1.25: META 11 · CAPTION 12 · LABEL 13 · BODY-SMALL 14 · BODY 16 · H3 20 · H2 25 · H1 31 · DISPLAY 39. Each with family, size, weight, line-height, letter-spacing and a maximum measure. Weights 400/500/600/700 only. Two families: a grotesque sans and a monospace. The monospace carries META, provenance, identifiers, measurements and token names. H1 and DISPLAY are fluid; the other seven are fixed.

LABEL and META are lowercase in the DOM and capitalised by CSS, so a screen reader does not spell them letter by letter.

### 4.4 Space, radius, borders, shadows

Space is closed: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Control heights 24/32/40/48 are sizes, not spacing. Radius: SMALL 4 · MEDIUM 8 · LARGE 14 · PILL 999, with nesting `inner = outer − padding`. Borders: subtle / default / strong / focus / active. Shadows: `raise` and `drag` only, on floating overlays only — depth comes from surface, contrast, space and hierarchy, not from stacked shadows.

### 4.5 Motion

Seven primitives: FADE · SLIDE · SCALE · EXPAND · COLLAPSE · DRAG · CONNECT. Durations instant 80 · fast 140 · base 200 · slow 320 · cycle 900 · stagger 150 ms. Three eases: out, in, inout. No literal duration or curve may appear in a stylesheet. Reduced motion is honoured both by `prefers-reduced-motion` and by `data-aime-motion="reduced"`. Loading is a three-dot fade pulse, never a rotation. No animation is required to understand a screen.

### 4.6 Layout

Columns 4 / 6 / 12 / 12. Gutters 12 / 16 / 24 / 32. Margins 20 / 32 / 64 / 96. Measures 480 / 720 / 1040 / 1280, canvas capped at 1680. Golden ratio 1.618 for composition/inspector partitions. Breakpoints 0 / 640 / 1024 / 1440. Alignment: anything 17 px or larger is a multiple of 4; below that, optical sizes are free.

## 5. Iconography

85 glyphs, 17 categories, one grid, one stroke, one set of caps and angles. No emoji, anywhere, ever. No arrow used as an icon inside an interactive label. Every `<use>` reference and every `data-a-icon` must resolve to a real sprite id — the QA checks both.

Categories: NAVIGATION · MEMORY · PEOPLE · PROJECT · TIMELINE · MEDIA · GRID · COMPOSER · DOCUMENT · ACTION · SEARCH · RELATION · APPROVAL · PROOF · SETTINGS · COMMUNICATION · NOEMA.

## 6. The five organs

| Organ | Answers | Rule |
|---|---|---|
| Universal Card | QUI / QUOI | One frame for eight entity types. Fixed anatomical order: mark, type, title, subtitle, media, facts, state, provenance, actions. |
| Universal Media | ASSET | Referenced, never duplicated. An asset exists once; placements point at it. |
| Universal Timeline | QUAND | One engine, six projections (READ, PLAN, COMPOSE, REVIEW, LIVE, HISTORY). Granularity from year to minute. Nine typed markers. |
| Universal Grid | OÙ / FORMAT | Placement and measurement. Format profiles establish geometry; the user never draws a bleed by hand. |
| Composer | COMMENT | Assembles organs. Never creates a competing copy of a canonical object. |

An unknown value is displayed as unknown, in muted italics. The system never invents demonstration data to fill a gap.

## 7. The NOEMA layer

**NOEMA proposes. The human validates.**

A proposal must never look like a fact. Doubt is therefore carried by form, not colour alone:

| State | Form |
|---|---|
| OBSERVED | dotted border |
| EXTRACTED | dashed border |
| INFERRED | dashed, warning |
| PROPOSED | dashed, accent |
| CONFIRMED | solid border, attributable |
| SUPERSEDED | struck through, retained |

Proposal, Observation, Question, Alert, Explanation, Confirmation, Action and Proof share one chassis. Only the glyph, the border style and the footer actions change.

NOEMA is not a character: no avatar, no face, no decorative bubble. A mark, an attribution rail, a monospace label.

Confidence is `low | medium | high`, never an invented percentage. Provenance exposes SOURCE, EVIDENCE, CONFIDENCE, VERSION, DATE, OWNER, PERMISSION — discreet by default, complete on demand, never in the main hierarchy.

Silence is a capability. When the signal is insufficient, the authorisation absent or the context too uncertain, NOEMA does not speak, recommend, connect or act. An empty NOEMA interface is not a broken one.

## 8. Accessibility

Contrast is computed before it is written. Targets have a minimum size: 24 px compact, 44 px touch (2.5.8). Focus is an outline, never a box-shadow, and any `outline: none` must be compensated in the same file. Every control has an accessible name. Decorative SVG is `aria-hidden`; an icon-only button has an `aria-label`.

Zoom and reflow: nothing is lost at 400 % zoom or at 320 px reflow. No fixed width above the measure, no horizontal overflow.

The system is written so a future EAA engine can answer every question without interpreting the render: the contract is declared in `tokens.json`, the checks are pure functions in `js/qa.js`, and the report is machine-readable.

## 9. Design QA

Twelve families, executed by `npm run qa` over the shipped system:

ALIGNMENT · SPACING · TYPOGRAPHY · COLOR · CONTRAST · ICONOGRAPHY · HIERARCHY · RESPONSIVE · OVERFLOW · FOCUS · MOTION · CONSISTENCY.

Any deviation exits 1. Nothing is published.

**A screen is not finished until these pass.**

A check that cannot fail checks nothing, so every family has been proven to fail by injecting the deviation it is meant to refuse, then restoring the tree. The report records what was checked, what passed, and the worst contrast pair.

### 9.1 What the QA does not check

- content relevance — a screen can be perfectly compliant and say nothing;
- quality of hierarchy — it verifies no level is skipped, not that the chosen title is right;
- real behaviour — no browser engine, so no real keyboard, screen reader or zoom test;
- performance.

`npm run verify` adds a DOM pass with jsdom: it executes the scripts of all 31 audited screens — the 30 of `design-system/` plus `loop/index.html` — confirming the chrome is injected, icons resolve, token-driven containers fill, and `auditLive()` runs on the living document. Its limit is declared by the script itself: jsdom has no layout engine, so the geometric parts of `auditLive` — real overflow and target size — remain unverified and require a real browser.

## 10. Closing rule

No style may exist that the system cannot explain. The Design System outranks any individual screen. A screen is a projection of the system, never the reverse.
