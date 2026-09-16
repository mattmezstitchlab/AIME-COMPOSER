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

The audit now distinguishes two levels:

### Level 1 — Media inventory

`ASSET / REFERENCE / STORAGE`

### Level 2 — Media composition

`ASSET → SLOT / CLIP → TIMELINE → EXPERIENCE`

AIME-COMPOSER should preserve this distinction. A project may expose a real media key without exposing the underlying file yet. The Viewer must therefore never present an unresolved media reference as an extracted downloadable asset.

## Next extraction targets

1. Resolve DISPOO media registry/storage paths and real dimensions where available.
2. Inspect Timeline Theater timeline clip/application model.
3. Inspect AIME Network media projections.
4. Map verified media records into Project Viewer without copying source assets.
5. Only then design global media replacement/composition operations.
