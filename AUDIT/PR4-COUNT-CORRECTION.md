# PR #4 — primitive count correction

Date: 2026-09-16
Branch: `feat/project-viewer`

## Finding

The Project Viewer contains 19 primitive records in `atlas/index.html`:

- 18 universal primitives
- 1 specialized primitive (`BOOKING`)

The current summary already shows `19` as the visible primitive count, but the adjacent explanatory summary still says `18 primitives universelles + 1 spécialisée`.

## Interpretation

The arithmetic is correct: 18 + 1 = 19.

The text is therefore not numerically contradictory, but it can be made clearer by explicitly writing:

`18 primitives universelles + 1 spécialisée = 19`

This is a presentation clarification, not a data-model defect.

## Merge-gate consequence

No source repository is affected.

The remaining hard blocker for PR #4 is still live Preview verification. The interactive Viewer and media-library behavior must be verified in an actual deployed Preview before the merge gate is considered complete.

## Guardrail

Do not promote placeholders to real media assets or claim live verification without evidence.
