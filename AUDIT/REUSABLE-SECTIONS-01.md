# REUSABLE-SECTIONS-01 — Reusable section audit

Date: 2026-09-16
Branch: `feat/project-viewer`

## Purpose

Identify sections that can become Creative Web Studio building blocks without copying source code blindly.

Classification:
- REUSE_DIRECT — structure can be reused with minimal adaptation
- REUSE_ADAPT — interaction/layout is reusable, visual context must change
- COMPOSE — only the underlying primitive is reusable
- SOURCE_DEPENDENT — strongly coupled to source architecture
- UNKNOWN — insufficient evidence

## 1. DISPOO — Discover Experience

Source: `src/components/discover-experience.tsx`
Evidence: CONFIRMED

The component is a long-form narrative surface composed of a presentation film followed by seven sections:

`IMAGINER → TROUVER → COMPOSER → ORCHESTRER → VALIDER → PARTAGER → RACONTER`

Real media references observed in source:
- `film-accueil`
- `hero-evenement-mariage`
- `hero-evenementiel`
- `hero-photographe`
- `hero-dj`
- `hero-buro-mariage`
- `hero-traiteur`
- `hero-studio-mariage`

Important: these are source media references, not yet extracted asset files. They must not be presented as extracted assets in the Project Viewer until their actual storage/path metadata is inventoried.

Reusable classification: REUSE_ADAPT

Why:
- strong generic narrative-section pattern
- clear separation between visual slot, text, CTA and destination
- current content is wedding/event-specific
- source hooks (`useSiteContent`, `useSiteMedia`) are architecture-dependent

Creative Web Studio adaptation:

`DÉFINIR → EXPLORER → STRUCTURER → PRODUIRE → VALIDER → PARTAGER → PUBLIER`

This is an architectural adaptation, not a claim that DISPOO already implements a generic web-agency workflow.

## 2. AIME Network — Homepage Hero

Source: `src/components/aime/home/HomeHero.tsx`
Evidence: CONFIRMED

Role:
- universal command / intention entry
- free-text interaction
- discovery CTA
- results surface

Primitives:
- INTENTION
- SEARCH
- COMPOSITION (interaction)
- MEDIA/background

Reusable classification: REUSE_ADAPT

Potential Creative Web Studio role:

`Décrivez votre projet` → structured/progressive project intake.

The underlying interaction is reusable; AIME-specific domain behavior and visual treatment should not be copied blindly.

## 3. AIME Network — Universal Timeline Strip

Source: `src/components/aime/home/UniversalTimelineStrip.tsx`
Evidence: CONFIRMED

Role:
- universal project chronology
- reads timeline, documents, folders, threads, people and other project projections
- acts as a condensed project-memory surface

Primitives:
- TIMELINE
- MEMORY
- DOCUMENT
- ENTITY
- RELATION
- INTENTION
- APPROVAL

Reusable classification: REUSE_ADAPT

Creative Web Studio role:

A single project timeline showing:
`Brief → Structure → Content → Design → Development → QA → Publication`

This should become the operational nervous system rather than a secondary dashboard.

## 4. Timeline Theater — Studio

Sources:
- `src/routes/studio.tsx`
- `src/components/studio/TimelineRuler.tsx`
- `src/components/studio/MediaLibrary.tsx`

Evidence: CONFIRMED

Role:
- visual composition studio
- timeline ruler/montage
- media selection
- preview
- scene selection
- zoom, movement and duration controls
- persistence/undo/redo

Reusable classification: COMPOSE

Reason:
The composition model is highly reusable, but the current implementation is coupled to `TimelineDoc`, scenes and wedding-specific studio structures.

Important design finding:
The current Media Library mainly applies selected media to a scene. The stronger generic model is:

`MEDIA → CLIP → TIMELINE → POSITION / DURATION / LAYER → PREVIEW`

This should be treated as a future Composer abstraction, not as an already-existing feature of Timeline Theater.

## 5. SILLAGE / Tempo Narrative — Collaborative composition

Sources:
- `mattmezstitchlab/SILLAGE` — `artifacts/api-server/src/routes/sillage.ts`
- `mattmezstitchlab/tempo-narrative` — `src/lib/allagi.functions.ts`, `src/routes/_authenticated/studio.tsx`

Evidence: CONFIRMED

Both projects independently establish a collaboration layer around a composition rather than merely a shared editor.

### SILLAGE

The server builds a unified owner state containing:
- event
- track library
- playlists
- folders
- timeline moments
- guest proposals

Timeline moments contain time, duration, expected energy, notes, revision and attached tracks. Guest proposals carry guest identity/message/status and vote counts. Uploaded audio has an explicit rights confirmation and private storage flow. fileciteturn213file0

Reusable primitive:

`RESOURCE → COLLECTION / MOMENT → COLLABORATIVE PROPOSAL → VOTE / STATUS → COMPOSITION`

### Tempo Narrative

The authenticated Studio exposes three coordinated surfaces: Playlists, Timeline and Invités. Its workspace model contains playlists, timeline moments, track placements and guest suggestions with status and vote count. fileciteturn216file0 fileciteturn219file0

Suggestions are explicitly modeled as `track_id + guest_name + message + status + votes`, and the owner can move a suggestion through `proposed`, `validated`, `refused` or `discuss`. fileciteturn219file0

Guests can participate without an account through a share token, submit a suggestion and vote with a voter key. fileciteturn219file0 fileciteturn220file0

Reusable primitive:

`SHARED PROJECT → CONTRIBUTION → DISCUSSION / VOTE → OWNER VALIDATION → COMPOSITION`

Reusable classification: **COMPOSE**.

The generic value is not the music domain. It is the collaboration protocol:

```text
PROJECT
  ↓
RESOURCE
  ↓
CONTRIBUTION
  ↓
DISCUSSION / VOTE
  ↓
VALIDATION
  ↓
VERSION / COMPOSITION
```

### Creative Web Studio adaptation

This maps directly to client website production:

```text
CLIENT PROJECT
      ↓
CONTENT / DESIGN ELEMENT
      ↓
CLIENT COMMENT / PROPOSAL
      ↓
DISCUSSION
      ↓
CLIENT APPROVAL
      ↓
REVISION
      ↓
NEW VERSION
```

Important: this is an architectural adaptation of the verified collaboration primitive, not a claim that SILLAGE or Tempo Narrative already implements a generic client website workflow.

## 6. OPUS — Lean project follow-up

Sources:
- `src/routes/suivi.$token.tsx`
- `src/routes/_authenticated/poste.$id.tsx`

Evidence: CONFIRMED

Observed concept:
- one unique link
- one page
- dossier/project state
- chronological thread
- actions

Reusable classification: REUSE_ADAPT

Creative Web Studio role:

`CLIENT → LIEN UNIQUE → PROJET → ÉTAT / TIMELINE / CONTENU / ACTIONS / VALIDATIONS`

This is preferable to creating a large client dashboard when the client only needs to review and act on one project.

## 7. Mission Proof — validation/proof loop

Evidence: CONFIRMED

Primitive:
`MISSION → ACTION → PREUVE → VALIDATION → STATUT FINAL`

Reusable classification: COMPOSE

Creative Web Studio adaptation:
`BRIEF → PRODUCTION → PREVIEW → COMMENTAIRE → RÉVISION → APPROBATION → QA → PUBLICATION`

This is an architectural adaptation of the verified proof/validation primitive.

## Cross-project composition

The current strongest composition is:

```text
PROJECT MEMORY
      ↓
UNIVERSAL TIMELINE
      ↓
┌─────┼─────────┐
↓     ↓         ↓
BRIEF DESIGN    CONTENT
      ↓
COMPOSER / STUDIO
      ↓
VERSION
      ↓
COMMENT / PROPOSAL
      ↓
DISCUSSION / VOTE
      ↓
REVISION
      ↓
APPROVAL
      ↓
PROOF / QA
      ↓
PUBLICATION
```

## Guardrails

1. Source repositories remain untouched.
2. No source asset is considered reusable until its real file/storage reference is known.
3. A reusable section is a design/interaction pattern, not permission to copy architecture-specific code.
4. Wedding-specific content becomes template/context data, not the core data model.
5. The Project Viewer must expose evidence level and reuse classification.
6. `REUSE_DIRECT`, `REUSE_ADAPT`, `COMPOSE`, `SOURCE_DEPENDENT`, and `UNKNOWN` must remain distinct.

## Next extraction targets

1. Real media registry/storage paths for DISPOO.
2. Direct internals of `DiscoverSection` and its media resolution.
3. Timeline Theater preview/variants/publication composition.
4. WEDDINGCITY cascade/projection sections.
5. AIME-TIMELINE review/document sections.
6. Map these records into the Project Viewer.
