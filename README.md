# AIME-COMPOSER

## Visual Atlas

AIME-COMPOSER is the audit and convergence layer above the 64 source projects. It does not merge or replace them.

The current `feat/visual-atlas` branch adds a first interactive visual Atlas at `atlas/index.html`.

### What it shows
- universal primitives and specialized capabilities
- evidence level: CONFIRMED / DOCUMENTED / CONCEPT
- audited source projects for each primitive
- search and filtering
- primitive inspection
- conceptual architecture composition
- project-family catalogue

### Principle

```text
64 PROJECTS
     ↓
AUDIT
     ↓
PRIMITIVES
     ↓
CAPABILITIES
     ↓
ARCHITECTURE
     ↓
PRODUCTS / TEMPLATES
```

The Atlas is deliberately a visual inspection tool first. Source repositories remain independent.

### Preview

`atlas/index.html` is dependency-free and can be deployed as a static site on Vercel. A GitHub-connected Vercel project can generate a Preview deployment for this branch/PR, giving a shareable URL before merge.

See `AUDIT/ATLAS-SPEC.md` for the current specification.
