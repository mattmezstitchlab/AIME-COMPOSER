# COLLABORATION-COMPOSITION-01 — SILLAGE

## Evidence

**Source repository:** `mattmezstitchlab/SILLAGE`

**Source file:** `artifacts/api-server/src/routes/sillage.ts`

**Source ref:** `1a97810070762d94c7c6195fb9cbb48b400992d6`

**Evidence level:** CONFIRMED

**Audit scope:** extract the collaboration/composition primitive only. No source code or source assets are copied into AIME-COMPOSER.

## Confirmed model

SILLAGE exposes a unified event state containing:

- event
- track library
- playlists
- folders
- timeline moments
- guest proposals
- proposal vote counts

The server's `buildState(ownerId)` assembles these related resources into one state representation. `sillage_moments` are ordered by time; each moment can contain tracks. Playlists contain ordered tracks and can preserve a locked state. Proposals are attached to the event and aggregate votes.

This establishes a real collaboration/composition loop:

```text
PROJECT / EVENT
      ↓
RESOURCE LIBRARY
      ↓
COLLECTION / PLAYLIST
      ↓
TIMELINE MOMENT
      ↓
GUEST PROPOSAL
      ↓
VOTE
      ↓
COMPOSITION DECISION
```

## Reusable primitive

**COLLABORATIVE COMPOSITION**

A project contains resources that can be selected, organized into collections, proposed by participants, discussed/voted, and finally attached to temporal composition moments.

The important abstraction is not music itself. Music is the current resource type. The reusable structure is:

```text
RESOURCE
  ↓
COLLECTION
  ↓
PROPOSAL
  ↓
COLLABORATION
  ↓
DECISION
  ↓
PLACEMENT IN COMPOSITION
```

## Architectural implications for AIME-COMPOSER

The future generic composition model should support collaboration without making the collaborator model specific to weddings or music.

Potential generic entities:

- `Resource`
- `Collection`
- `Proposal`
- `Vote`
- `Decision`
- `Clip`
- `Composition`
- `Participant`

A resource can therefore be an image, video, audio track, document, text block, section, component, design variant, or other project object.

A proposal should remain distinct from an approval:

```text
COMMENT
  ↓
PROPOSAL
  ↓
DISCUSSION / VOTE
  ↓
REVISION
  ↓
APPROVAL
```

This aligns with the previously audited WEDDINGCITY distinction between change/impact/validation and with Mission Proof's explicit validation step, without claiming that SILLAGE itself implements those generic workflows.

## Composition relationship

Combined with Timeline Theater, the emerging model is:

```text
RESOURCE
   ↓
COLLECTION
   ↓
PROPOSAL / COLLABORATION
   ↓
DECISION
   ↓
CLIP
   ↓
POSITION / DURATION / LAYER
   ↓
COMPOSITION
```

This is the key bridge between **collaboration** and the future generic **composition engine**.

## Reuse classification

**REUSE_ADAPT**

Reason: the collaboration mechanics are reusable, but the current SILLAGE domain is an event/music application. AIME-COMPOSER should extract the interaction/data primitive, not copy the wedding/music product model.

## Source integrity

- Source repository untouched.
- No source asset copied.
- No invented media.
- No product implementation added.
- This document records only directly evidenced behavior and clearly marked architectural adaptation.
