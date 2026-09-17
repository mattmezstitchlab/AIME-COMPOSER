# MEDIA-ATLAS-01

## Purpose

Record real media mechanisms discovered in source repositories before extracting assets into AIME-COMPOSER.

This atlas distinguishes media **references**, **storage**, **application**, and **composition**. A media key or URL is not treated as an extracted asset until its source file, dimensions/duration, storage location, and reuse status are verified.

## Evidence rules

- **CONFIRMED** — source code directly inspected.
- **DOCUMENTED** — described by repository documentation only.
- **CONCEPT** — intended/future behavior.

## DISPOO — narrative media system

### Source

`src/components/discover-experience.tsx`

### Evidence

**CONFIRMED**.

### Media mechanism

The page resolves media through `useSiteMedia()` and stored values through `mediaForStoredValue()` / `mediaKeyOf()`. The presentation film also has a stored video value, poster fallback, and a dedicated `film-accueil` media key.

### Real media references observed

- `film-accueil`
- `hero-evenement-mariage`
- `hero-evenementiel`
- `hero-photographe`
- `hero-dj`
- `hero-buro-mariage`
- `hero-traiteur`
- `hero-studio-mariage`

These are **source media references**, not yet extracted asset records.

### Composition pattern

`DiscoverSection` binds one visual key to one narrative section and resolves video/poster/loop media at render time.

Reusable primitive: **NARRATIVE MEDIA SLOT**.

Potential Creative Web Studio use:

`SECTION → MEDIA SLOT → VIDEO / POSTER / LOOP`

Reuse classification: **REUSE_ADAPT**.

### Important observation

The media system is already decoupled enough to support changing the visual assigned to a section without changing the narrative structure. This is directly relevant to the future Project Viewer / Composer.

## DISPOO — operational media/document folders

`BuroFoldersStrip` exposes named destinations for Jour J, reservations, requests, quotes, contracts, invoices, messages, passport and local files.

Reusable primitive: **CONTENT / DOCUMENT DESTINATION**.

This is not an asset library by itself, but it demonstrates a useful separation between creative media and operational project material.

Reuse classification: **REUSE_ADAPT**.

## DISPOO — concrete media registry and storage

### Source

`src/assets/site-media.ts`

### Evidence

**CONFIRMED** at commit `cb38525f73239619fe625d073d2fe093d7b8ff72`.

### Source-of-truth structure

DISPOO explicitly models a site visual as a single media entry containing:

- historical/hosted source URL
- poster image
- ordered deposited video filenames
- local fallback loop

The registry currently declares **12 media keys** including `hero-accueil`, `hero-evenement-mariage`, `hero-evenementiel`, `hero-traiteur`, `hero-photographe`, `hero-beaute`, `hero-musique`, `hero-dj`, `hero-studio-mariage`, `hero-buro-mariage`, `hero-artisan` and `film-accueil`.

The source comments also establish a deliberate one-placement/one-visual rule: a visible shot reused at several locations is treated as a duplicate rather than an optimization.

### Storage layers

DISPOO uses three ordered availability layers:

1. real deposited files in `public/media/video`, discovered through `manifest.json`;
2. embedded local `/media/boucle-*.mp4` fallback loops;
3. historical hosted `.asset.json` URLs retained for manual configuration but not selected automatically.

This is a strong provenance pattern for AIME-COMPOSER because **availability is resolved without changing the semantic media key**.

### Concrete source paths observed

The registry directly references local poster assets and `.mp4.asset.json` source descriptors, for example:

- `@/assets/hero-accueil-poster.jpg`
- `@/assets/hero-evenement-mariage-poster.jpg`
- `@/assets/hero-photographe-poster.jpg`
- `@/assets/film-accueil-poster.jpg`
- `@/assets/hero-evenement-mariage.mp4.asset.json`
- `@/assets/hero-photographe.mp4.asset.json`
- `@/assets/hero-dj.mp4.asset.json`
- `@/assets/hero-studio-mariage.mp4.asset.json`

These are now **verified source-file references**, but dimensions and durations still require direct asset inspection.

### Public delivery endpoint

`src/routes/api/public/site-media.$.ts` documents a public `site-media` delivery mechanism that serves an uploaded site media file through a short-lived signed URL.

`src/routes/api/public/playlist-photo.ts` also confirms uploads into the Supabase Storage bucket `site-media`.

This establishes that DISPOO has both **repository media** and **owner-uploaded storage media**. They must remain separate provenance classes in the Composer.

### Reusable primitive

**MEDIA RESOLUTION / PROVENANCE REGISTRY**

`MEDIA KEY → SOURCE CANDIDATES → BEST AVAILABLE ASSET → FALLBACK`

Reuse classification: **REUSE_ADAPT**.

## Timeline Theater — Studio MediaLibrary

### Source

`src/components/studio/MediaLibrary.tsx`

### Evidence

**CONFIRMED**.

### Media types

- image
- video
- audio

### Targets

- background
- gallery
- music

### Sources

The library combines:

- built-in visual library
- built-in moment videos/posters
- uploaded media
- playlist tracks

### Upload flow

Uploaded files are classified from MIME type, stored in Supabase Storage bucket `wedding-media`, registered in `media_assets`, and immediately applied to the current target.

### Interaction

The library supports:

- search
- tabs for Images / Videos / Musiques
- click-to-apply
- drag-and-drop
- selected-media indication
- media deletion

### Architectural limitation observed

The current abstraction applies a selected media item to a selected scene/target. It is **not yet a general media-clip model with independent timeline position, duration, layer and start/end controls**.

Reusable primitive: **MEDIA LIBRARY → TARGET APPLICATION**.

Reuse classification: **REUSE_ADAPT**.

Future Composer abstraction:

`MEDIA ASSET → MEDIA CLIP → TIMELINE POSITION → DURATION → LAYER → PREVIEW`

## AIME Network — canonical project media projection

### Sources

- `src/lib/aime/world/types.ts`
- `src/lib/aime/world/derive.ts`

### Evidence

**CONFIRMED** by direct source inspection.

### Canonical model

`WorldProject` is explicitly described as the single source model. Its `media` collection is part of the canonical project alongside people, providers, moments, tasks, documents, payments, tracks and messages. The project model also carries `Confidence` and optional `Fact.source` provenance fields.

`WorldMedia` currently contains:

- `id`
- `kind`: `photo | video`
- `at`
- `title`
- optional `detail`
- optional `url`
- optional `thumb`
- optional `personIds`
- `confidence`

### Projection behavior

`deriveTimeline(project)` does not create a second media store. It projects each `WorldMedia` item into a timeline marker with:

- semantic timeline id
- temporal position
- media kind
- optional thumbnail URL
- optional media URL
- title/detail
- project/universe context
- person relations
- source `média`
- confidence metadata

The resulting timeline is then enriched with project relations and user edits without replacing the canonical source object.

### Reusable primitive

**CANONICAL MEDIA → PROJECTION**

Pattern:

`PROJECT MEMORY → MEDIA RECORD → TIMELINE PROJECTION`

Reuse classification: **REUSE_ADAPT**.

### Important limitation

AIME Network's current `WorldMedia` model is a **project-memory media record**, not a global asset-management model. It has no verified storage-provider field, storage path, dimensions, duration, variants, media role or independent clip/layer placement.

Therefore it should **not** become the final `MediaRecord` schema for AIME-COMPOSER. It is stronger as the source-of-truth/projection pattern than as the complete asset schema.

### Architectural convergence

AIME Network provides the missing upstream layer in the current atlas:

`PROJECT MEMORY → CANONICAL MEDIA → PROJECTION`

Timeline Theater provides composition:

`MEDIA ASSET → CLIP → TIMELINE`

DISPOO provides resolution/provenance:

`MEDIA KEY → SOURCE CANDIDATES → AVAILABLE ASSET`

Together these suggest a three-layer media architecture for AIME-COMPOSER:

```text
PROJECT MEMORY
      ↓
CANONICAL MEDIA RECORD
      ↓
ASSET / STORAGE RESOLUTION
      ↓
MEDIA SLOT or MEDIA CLIP
      ↓
TIMELINE / PAGE / SECTION COMPOSITION
      ↓
PREVIEW / PUBLICATION
```

No final schema should be implemented yet: storage, asset metadata and clip placement still need direct inspection across the priority repositories.

## Cross-project conclusion

The audit now distinguishes three levels:

### Level 1 — Media identity

`MEDIA KEY / SEMANTIC ROLE`

### Level 2 — Media asset

`SOURCE FILE / STORAGE OBJECT / POSTER / VIDEO / AUDIO`

### Level 3 — Media composition

`ASSET → SLOT / CLIP → TIMELINE → EXPERIENCE`

AIME-COMPOSER should preserve this distinction. A project may expose a semantic media key without exposing its underlying file yet. Conversely, a stored asset can exist without being assigned to a visible section.

### Recommended canonical record

```text
MediaRecord
├── id
├── semantic_key
├── source_project
├── source_path
├── storage_provider
├── storage_path
├── media_type
├── role
├── poster
├── variants
├── dimensions
├── duration
├── source_section
├── evidence
├── availability
└── reuse_status
```

`dimensions` and `duration` remain nullable until verified. No values should be invented from filenames or assumptions.

## Next extraction targets

1. Resolve DISPOO media registry/storage paths and real dimensions/durations where available.
2. Inspect Timeline Theater timeline clip/application model.
3. Inspect AIME Network media projections.
4. Map verified media records into Project Viewer without copying source assets.
5. Only then design global media replacement/composition operations.

## Addendum — transversal scan of all 38 repos (2026-09-17)

**CONFIRMED** by `atlas/build-media.mjs` (git trees API, recursive, subtree descent budgeted against truncation):

- **366 media items** across **12 of 38** repositories; every repository was opened on its default branch, none was skipped.
- Trees read **without truncation** at this scan date; if GitHub ever truncates a large tree, the scanner now descends each subtree and would mark the repository `truncated` in the catalogue instead of pretending full coverage.
- **Audio: zero committed file.** This is a fact of the trees, not a scanner gap. DISPOO's narrative media (the `film-accueil` / `hero-*` keys above) resolve at runtime against **application storage outside git** (Supabase-backed registries), which is why no audio payload ever appears in a default branch.
- **Videos: 7** (6 in byaime-one-page, 1 in nails-profile) — all playable from their raw/CDN URLs.
- **119 content duplicates** detected by git blob sha (identical bytes, different paths — e.g. `img/` mirrored into `public/img/`, and `attached_assets/` duplicates of `artifacts/…/public/videos/`). Duplicates are content-level, not name-level.
- Three repositories are **empty Git repositories** (no commit on the default branch): DISPOORED, aimeplay, byaimeapp — recorded as `vide` in the catalogue's coverage table, shown in the page.

The atlas page (`atlas/`) renders this coverage per repository and plays video/audio inline; its **local mode** applies the Universal Bureau contract (LOCAL FILES/FOLDERS → READ → CLASSIFY → VIEW → ORGANIZE → PROCESS; originals preserved, provenance kept, nothing sent or synced, human validates — UNIVERSAL-BUREAU-DOCUMENTS-V1.md §12–13).
