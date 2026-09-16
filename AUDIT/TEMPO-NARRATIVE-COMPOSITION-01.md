# TEMPO NARRATIVE — COMPOSITION / COLLABORATION AUDIT

Date: 2026-09-16
Source repository: `mattmezstitchlab/tempo-narrative`
Source ref: `aa2dd0a4c963f816c03a2e4fdd90d9d4b2dce7cb`
Evidence level: CONFIRMED
Reuse classification: REUSE_ADAPT / COMPOSE

## 1. Purpose

Extract the reusable composition primitives from Tempo Narrative without copying its wedding-specific product model.

## 2. Confirmed source evidence

The authenticated Studio route exposes three explicit work modes:

- Playlists
- Timeline
- Invités

The Studio loads a shared workspace and supports adding tracks either to a playlist or directly to a timeline moment. Timeline moments have a start time and duration and can contain ordered tracks. The interface also exposes an energy map and compatibility information between successive tracks.

The repository search also confirms the domain model includes profiles, events, event members, folders, playlists, playlist tracks, timeline moments, moment tracks, suggestions, suggestion votes and share links.

Source: `src/routes/_authenticated/studio.tsx` and repository README/schema evidence.

## 3. Reusable primitive

```text
RESOURCE
   ↓
LIBRARY
   ↓
COLLECTION
   ↓
TEMPORAL MOMENT
   ↓
PLACEMENT
   ↓
COMPATIBILITY / CONTEXT
   ↓
COLLABORATION
   ↓
SHARED EXPERIENCE
```

## 4. What Tempo adds beyond SILLAGE

SILLAGE already confirms the collaborative composition loop:

```text
RESOURCE → COLLECTION → PROPOSAL → COLLABORATION → DECISION → PLACEMENT
```

Tempo Narrative adds a stronger **contextual composition** layer:

- a resource can be evaluated in relation to the previous resource;
- timeline moments have explicit temporal boundaries;
- an energy map represents the evolution of the composition;
- the Studio exposes different working modes over the same workspace;
- guests/collaborators are a first-class surface;
- a public guest link provides a shared experience without requiring the same private Studio surface.

Therefore Tempo should not create a second generic collaboration engine. It contributes contextual composition and experience layers to the same master model.

## 5. Creative Web Studio adaptation

The generic form becomes:

```text
PROJECT
  ↓
RESOURCE LIBRARY
  ├── images
  ├── videos
  ├── copy
  ├── sections
  ├── design tokens
  └── documents
  ↓
COLLECTION / PAGE
  ↓
POSITION / CONTEXT
  ↓
VERSION
  ↓
COMMENT / PROPOSAL
  ↓
COLLABORATION
  ↓
APPROVAL
  ↓
PUBLIC EXPERIENCE
```

The wedding/music vocabulary remains a domain implementation, not the core abstraction.

## 6. Architectural decision

Do not import Tempo Narrative as a separate subsystem.

AIME-COMPOSER should absorb three complementary primitives:

1. Timeline Theater → temporal composition / editing surface.
2. SILLAGE → collaborative resource composition and decisions.
3. Tempo Narrative → contextual composition, compatibility, energy/context mapping and shared experience.

This points toward one unified **COMPOSITION MODEL V1** rather than three engines.

## 7. Source integrity

- Source repository untouched.
- No source assets copied.
- No invented media or data.
- Wedding/music-specific entities are treated as domain examples.
- This audit records observed architecture and explicitly separates generic adaptations from source behavior.
