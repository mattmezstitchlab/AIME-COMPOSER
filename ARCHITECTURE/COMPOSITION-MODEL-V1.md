# COMPOSITION MODEL V1

Date: 2026-09-16
Status: DRAFT — architectural synthesis, not implementation

## 1. Objective

Define one generic composition model capable of absorbing the verified primitives from Timeline Theater, SILLAGE and Tempo Narrative without creating three separate engines.

## 2. Core model

```text
PROJECT
  ↓
RESOURCE
  ↓
COLLECTION
  ↓
COMPOSITION
  ↓
CLIP / PLACEMENT
  ↓
CONTEXT
  ↓
VERSION
  ↓
COMMENT / PROPOSAL
  ↓
DECISION / APPROVAL
  ↓
EXPERIENCE
```

## 3. Core objects

### Resource
A reusable source object: image, video, audio, text, document, section, component, design token or other project asset.

Minimum provenance:

- source_project
- source_path
- resource_type
- media_role / semantic_role
- evidence
- reuse_status

### Collection
A logical group of resources. Examples: media library, playlist, page asset set, section library.

### Composition
A structured arrangement of resources for a purpose: page, timeline, presentation, playlist, mini-site or publication.

### Clip / Placement
The concrete use of a resource inside a composition.

Minimum conceptual fields:

- id
- resource_id
- composition_id
- start / order / position
- duration when temporal
- layer when applicable
- context
- version

### Context
Information used to evaluate a placement: preceding/following element, page section, audience, timeline moment, compatibility, energy, constraints or project state.

### Proposal
A requested or suggested modification to a composition.

### Decision
The explicit human outcome of a proposal: accepted, rejected, superseded or deferred.

## 4. Temporal composition

When a composition is temporal:

```text
CLIP
 ├── start
 ├── duration
 ├── layer
 ├── chapter
 └── transition/context
```

Timeline Theater provides the verified editing precedent for this model.

## 5. Collaborative composition

Collaboration is not a separate composition type. It is a capability around the same model:

```text
RESOURCE
 → PROPOSAL
 → COLLABORATOR
 → DECISION
 → PLACEMENT
```

SILLAGE provides the verified precedent for proposals, voting and placement.

## 6. Contextual composition

Tempo Narrative demonstrates that composition can evaluate a resource according to its context, including the relationship with the preceding resource and the evolution of an experience across time.

Generic form:

```text
PLACEMENT A
      ↓
CONTEXT ENGINE
      ↓
PLACEMENT B
      ↓
COMPATIBILITY / CONSTRAINT / EXPERIENCE SIGNAL
```

This must remain advisory unless explicitly validated by the human.

## 7. Creative Web Studio application

The same model supports:

```text
WEBSITE
 ├── PAGE
 │    ├── SECTION
 │    │    ├── MEDIA PLACEMENT
 │    │    ├── CONTENT PLACEMENT
 │    │    └── COMPONENT PLACEMENT
 │    └── VERSION
 ├── COMMENTS
 ├── PROPOSALS
 ├── APPROVALS
 └── PUBLICATION
```

A section from one audited project can therefore be composed with a media resource from another project, provided provenance and reuse classification are explicit.

## 8. Non-goals

- No source-code merger.
- No automatic copying of source assets.
- No assumption that wedding/music models are universal.
- No autonomous approval.
- No hidden mutation of source projects.

## 9. Current evidence

CONFIRMED source primitives:

- Timeline Theater: temporal composition/editorial timeline.
- SILLAGE: collaborative composition, collections, proposals, voting and placement.
- Tempo Narrative: timeline moments, contextual compatibility, energy/context mapping, playlists and guest collaboration.

The model above is the architectural synthesis of those observations and remains a design document until validated against the remaining audited projects.
