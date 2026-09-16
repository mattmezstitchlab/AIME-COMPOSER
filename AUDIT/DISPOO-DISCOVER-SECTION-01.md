# DISPOO — DISCOVER EXPERIENCE / SECTION AUDIT 01

## Statut

- Evidence: **CONFIRMED**
- Source: `mattmezstitchlab/dispoo`
- Source ref: `cb38525f73239619fe625d073d2fe093d7b8ff72`
- Source path: `src/components/discover-experience.tsx`
- Reuse classification: **REUSE_ADAPT**
- Source repository modified: **NO**
- Source assets copied: **NO**

## What is actually implemented

`DiscoverExperience` is a long-form discovery surface composed of a presentation film followed by seven media-led narrative sections. Each section combines a real media slot, editorial copy, an action, and a consistent visual structure.

The seven confirmed stages are:

1. **IMAGINER** — start from date, place, guests and atmosphere.
2. **TROUVER** — discover professionals through search.
3. **COMPOSER** — assemble the right professional team.
4. **ORCHESTRER** — organize the event timeline / Day J.
5. **VALIDER** — centralize requests, quotes, contracts, deposits and invoices.
6. **PARTAGER** — keep messages, documents and schedule changes connected.
7. **RACONTER** — present professional know-how through media and profiles.

The implementation also contains a Bureau folders strip, wedding-trades section, audience section, magazine teaser and final calls to action.

## Confirmed visual primitive

`DiscoverSection` is a reusable editorial pattern:

```text
SECTION
  ├── MEDIA
  │    ├── video
  │    ├── poster
  │    └── fallback loop
  ├── INDEX
  ├── EYEBROW
  ├── WORD / LARGE TYPOGRAPHY
  ├── TITLE
  ├── COPY
  └── ACTIONS
```

The implementation supports normal/reversed media placement and light/dark section variants. The media is resolved through `useSiteMedia(visualKey)` and rendered by `HeroVideo`.

## Real source media keys observed

- `hero-evenement-mariage`
- `hero-evenementiel`
- `hero-photographe`
- `hero-dj`
- `hero-buro-mariage`
- `hero-traiteur`
- `hero-studio-mariage`
- `film-accueil`

These are **source media references**, not extracted assets. Dimensions, duration, storage path and licensing/rights must be audited separately before the Composer exposes them as reusable assets.

## Architectural value for AIME-COMPOSER

This is not merely a wedding landing page. The reusable primitive is a **NARRATIVE SECTION SYSTEM**:

```text
INTENTION / STAGE
      ↓
EDITORIAL MESSAGE
      ↓
VISUAL ASSET
      ↓
ACTION
      ↓
NEXT STAGE
```

For the future Creative Web Studio, the same structural primitive can be adapted to:

```text
DÉFINIR → EXPLORER → STRUCTURER → PRODUIRE → VALIDER → PARTAGER → PUBLIER
```

This adaptation is an architectural proposal, not a claim about the current DISPOO product.

## Why it matters for the Project Viewer

The Viewer should represent this source as:

```text
PROJECT
  ↓
PAGE / DISCOVER EXPERIENCE
  ↓
SECTION
  ├── visual role
  ├── copy role
  ├── CTA role
  ├── theme
  └── media slot
       ↓
     MEDIA KEY
       ↓
     REAL SOURCE ASSET (after media audit)
```

The section itself is reusable independently of its wedding copy. The copy, media key and CTA should remain configurable data rather than becoming hard-coded source code in AIME-COMPOSER.

## Guardrails

- Do not copy the source component into AIME-COMPOSER.
- Do not invent media files or dimensions.
- Preserve provenance for every future extracted asset.
- Keep the narrative section pattern distinct from the final Creative Web Studio product identity.
- Treat wedding-specific vocabulary as template/content data, not as the universal domain model.
