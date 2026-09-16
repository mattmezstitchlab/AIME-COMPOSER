# Project Viewer — extraction specification

## Purpose

Turn the Atlas into a factual browser of the 64 inventoried repositories before exposing reusable sections, components or media in the Composer.

The Viewer is an observation layer. Source repositories remain untouched.

## Evidence rule

Every displayed item must have an evidence level:

- `CONFIRMED` — directly observed in source code, routes, configuration, schema or repository structure.
- `DOCUMENTED` — explicitly described by project documentation/specification but not yet verified in code.
- `CONCEPT` — proposed or inferred architecture; never presented as an existing source capability.
- `NOT_AUDITED` — project is inventoried but the relevant surface has not yet been inspected.

## Extraction hierarchy

```text
PROJECT
  └── ROUTE / PAGE
        └── SECTION
              ├── COMPONENT
              ├── MEDIA SLOT
              │     └── ASSET
              ├── PRIMITIVE
              └── DEPENDENCY
```

## Section record

Each real section discovered during inspection should eventually expose:

- project
- route
- section name
- source path(s)
- evidence level
- visual role
- reusable: `yes | adaptation | no | unknown`
- required dependencies
- referenced assets
- referenced primitives
- notes / limitations

## Asset record

Each real media asset should eventually expose:

- project
- source path
- asset type: image / video / audio / document
- dimensions when available
- duration when available
- media role: hero / gallery / background / cover / icon / content / unknown
- referenced sections
- reusable status
- rights/licensing status when explicitly documented
- evidence level

## Reuse classification

The Viewer must distinguish:

1. `REUSE_DIRECT` — can be reused without architectural change.
2. `REUSE_ADAPT` — reusable after replacing dependencies or adapting structure.
3. `REFERENCE_ONLY` — useful as visual/UX reference, not an extractable module.
4. `SOURCE_DEPENDENT` — tied to a specific project architecture.
5. `UNKNOWN` — insufficient evidence.

## Composer contract

The Composer may consume only records whose source and evidence are explicit.

A future composition operation should therefore look like:

```text
SELECT PROJECT
→ SELECT ROUTE
→ SELECT SECTION
→ INSPECT DEPENDENCIES
→ SELECT MEDIA SLOT
→ SELECT ASSET
→ SELECT PRIMITIVES
→ CLASSIFY REUSE
→ ADD TO COMPOSITION
```

The Composer must not silently copy source code or assets. It should create a composition manifest that references the selected source records.

## Merge gate for PR #4

PR #4 is **not ready to merge yet**. Before merge:

- Project Viewer UI loads correctly on Vercel Preview.
- All 64 inventory entries are represented consistently.
- No placeholder is presented as an observed source section or asset.
- Evidence labels remain visible.
- Project → inspection navigation works.
- Media Library clearly distinguishes audited assets from future placeholders.
- The source repositories remain untouched.

After this gate, the next phase is real repository extraction: routes/pages first, then sections/components, then media assets, then primitive mapping.
