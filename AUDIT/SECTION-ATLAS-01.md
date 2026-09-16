# SECTION-ATLAS-01 — Route → Section → Component

## Purpose

This document records only sections/components directly evidenced in source repositories. It is an audit layer for the Project Viewer; it is not a design specification and does not claim that unaudited areas are reusable.

Evidence levels:
- **CONFIRMED** — source file/component directly inspected.
- **DOCUMENTED** — documented by repository material but source section not yet fully inspected.
- **CONCEPT** — intended/future behavior only.
- **NOT_AUDITED** — no evidence collected yet.

Reuse classes:
- `REUSE_DIRECT`
- `REUSE_ADAPT`
- `REFERENCE_ONLY`
- `SOURCE_DEPENDENT`
- `UNKNOWN`

## 1. AIME Network — homepage `/`

Source route: `src/routes/index.tsx`

### Section A — Universe introduction
- Evidence: **CONFIRMED**
- Entry component: `src/components/aime/home/HomeUniverses.tsx`
- Child: `src/components/aime/home/UniverseIntro`
- Role: opening/discovery layer exposing the universe selection before the main interaction.
- Interaction: selecting a universe patches the command context; asking a phrase updates the command text and routes the subject into the homepage interaction.
- Primitive mapping: `INTENTION`, `ENTITY`, `SEARCH`, `IDENTITY` (context only).
- Reuse: `REUSE_ADAPT`.
- Dependency: AIME command context; UniverseIntro implementation.
- Notes: the route itself does not contain the visual universe implementation; the section is delegated to the component.

### Section B — Hero / universal command
- Evidence: **CONFIRMED**
- Entry component: `src/components/aime/home/HomeHero.tsx`
- Child components: `UniversalCommandBar`, `HeroResults`
- Role: primary entry point; brand statement, free-text intention/search, discovery CTA.
- Interaction: search term replaces the initial hero state with `HeroResults`; discovery scrolls to the network section.
- Visual/media evidence: animated `MeshGradient` background with explicit colors; no external media asset was established by this inspection.
- Primitive mapping: `INTENTION`, `SEARCH`, `COMPOSITION` (interaction state), `MEDIA` (visual background).
- Reuse: `REUSE_ADAPT`.
- Dependency: Motion, Paper shaders, command context, intent parsing.
- Notes: this is a concrete visual section, but its current implementation is AIME-specific.

### Section C — Universal timeline strip
- Evidence: **CONFIRMED**
- Entry component: `src/components/aime/home/UniversalTimelineStrip.tsx`
- Child/related components observed in imports: `HeroTimeline`, `TimelineView`, `TimelineDetail`, `AimeLoader`, `MarkerReveal`.
- Role: horizontal/hero-level projection of the user's timeline and newly proposed markers.
- Data observed: universal timeline query, documents, folders, threads, people, adoptions, command facts/proposition, enrollment flash markers.
- Interaction: opening a marker can navigate to a related card; unauthenticated users are directed to auth for the starting marker.
- Primitive mapping: `TIMELINE`, `MEMORY`, `DOCUMENT`, `ENTITY`, `RELATION`, `INTENTION`, `APPROVAL`.
- Reuse: `REUSE_ADAPT`.
- Dependency: AIME world/timeline query layer, Bureau queries, command context, auth.
- Notes: strong candidate for the Composer's universal timeline primitive, but the current implementation is deeply coupled to AIME data services.

### Section D — Network discovery
- Evidence: **CONFIRMED** at route composition level.
- Entry component: `src/components/aime/network/NetworkSection.tsx`
- Role: network/card discovery area following the hero and timeline.
- Primitive mapping: `ENTITY`, `RELATION`, `SEARCH`, `ENGAGEMENT`.
- Reuse: `SOURCE_DEPENDENT` pending direct inspection of `NetworkSection` internals.
- Notes: section is known from route composition; its internal sub-sections are not yet claimed as observed.

## 2. Route composition evidence

`src/routes/index.tsx` composes the homepage in this order:

1. `HomeUniverses`
2. `HomeHero`
3. `UniversalTimelineStrip`
4. `NetworkSection`

The route is therefore already a useful reference for a **single-page composition model** where major capabilities are sections over a shared shell rather than separate top-level pages.

## 3. Known architectural convergence

The inspected homepage does not expose independent copies of timeline, documents, adoption, discussion, and intention data. `UniversalTimelineStrip` reads multiple existing query layers and converts them into timeline markers for one presentation surface. This supports the broader Composer hypothesis of **one project memory with multiple projections**, but this document does not generalize that conclusion beyond the inspected code.

## 4. Still pending before PR #4 merge

- Direct inspection of `NetworkSection` and its children.
- Route/section extraction for DISPOO.
- Route/section extraction for Timeline Theater.
- Route/section extraction for OPUS Admin.
- Equivalent direct evidence for SILLAGE, WEDDINGCITY, AIME-TIMELINE and Mission Proof Permanent.
- Real media inventory and source-path mapping.
- Mapping audited sections into the Project Viewer UI.
- Vercel Preview verification.

No source repository was modified by this audit entry.
