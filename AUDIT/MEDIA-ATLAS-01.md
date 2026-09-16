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