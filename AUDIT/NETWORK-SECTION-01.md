# NETWORK-SECTION-01 — AIME Network discovery section

## Statut

**CONFIRMED — source code inspected**

Source repository: `mattmezstitchlab/aime-network`

Source commit inspected: `2e2810b22c260e4f33034184f361dfeeff2ef29d`

Source path: `src/components/aime/network/NetworkSection.tsx`

Source is not modified by AIME-COMPOSER.

## Section

### NetworkSection

The component is explicitly described by its source as the network map, search, filters, card panel and lower timeline. It was extracted from the former `/reseau` route so the same section can live on the homepage.

Confirmed responsibilities:

- network/map exploration
- search
- universe/category filters
- city filter
- professional-role filter
- intention direction filter (`recherche` / `proposition`)
- adopted-world filter
- program/follower filtering
- card glance / pinned glance
- cluster glance
- card panel
- lower timeline
- navigation/composer entry points

## Architecture evidence

`NetworkSection` imports and coordinates real AIME Network primitives including:

- `CardsMap`
- `IntentionFlux`
- `CardGlance`, `CardOverlay`, `GlanceBubble`
- `CardPanel`
- `aimesQuery`
- `cardsQuery`
- `categoriesQuery`
- `compositionsQuery`
- `myCardQuery`
- `encountersQuery`
- `universesQuery`
- `followersQuery`
- universe/category matching utilities
- trade-world mapping
- intention reading
- card visualisation
- card semantics

## Confirmed interaction model

```text
NETWORK
  ↓
SEARCH / INTENTION
  ↓
MAP + CARDS
  ↓
FILTER
  ├── Universe
  ├── Category / métier
  ├── City
  ├── Role
  ├── Recherche / Proposition
  └── Mon monde / adopted
  ↓
GLANCE
  ↓
CARD PANEL
  ↓
TIMELINE / ENCOUNTER / COMPOSER
```

## Important design principle

The network is not merely a visual map. It is a discovery surface combining **ENTITY + RELATION + SEARCH + ENGAGEMENT + TIME**.

The source also keeps search and map exploration connected: a world can resolve to trades, trades to cards, and an insufficient exact result can widen to related universe matches.

## Reuse classification

**REUSE_ADAPT**

Reason: the interaction pattern is broadly reusable for a creative web studio or project browser, but the source implementation depends on AIME-specific card types, queries, universe taxonomy, authentication and wedding-role presets.

The reusable primitive is the interaction model, not a blind source-code copy.

## AIME-COMPOSER extraction target

```text
DISCOVERY SURFACE
  ├── Search / intention
  ├── Spatial or visual index
  ├── Faceted filters
  ├── Entity preview
  ├── Entity detail
  ├── Related timeline
  └── Engagement / next action
```

Potential Creative Web Studio adaptation:

```text
CREATIONS / PROJECTS
  ↓
SEARCH / DOMAIN / STYLE / TYPE
  ↓
VISUAL INDEX
  ↓
PROJECT PREVIEW
  ↓
PROJECT DETAIL
  ↓
TIMELINE / CASE STUDY
  ↓
CREATE SIMILAR PROJECT
```

This adaptation is a hypothesis derived from the confirmed interaction architecture; it is not a claim that AIME Network is a generic creative-studio product.

## Source integrity

- No source repository modified.
- No source asset copied.
- No fictitious media declared as extracted.
- Evidence level remains explicit.
