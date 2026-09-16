# ROUTE ATLAS 01 — Routes/pages directly observed

Date: 2026-09-16
Status: IN PROGRESS

This file records route evidence directly observed through repository source search. It is intentionally conservative: a route listed here is evidence that the route file exists, not that every UI section inside it has already been audited.

## 1. aime-network

Observed route files include:

| Route file | Surface / interpretation | Evidence |
|---|---|---|
| `src/routes/index.tsx` | homepage / entry | CONFIRMED |
| `src/routes/reseau.tsx` | network / encounters surface | CONFIRMED |
| `src/routes/recherche.tsx` | search surface | CONFIRMED |
| `src/routes/mon-espace.tsx` | personal/project workspace | CONFIRMED |
| `src/routes/projets.nouveau.tsx` | new project entry | CONFIRMED |
| `src/routes/projets.$id.index.tsx` | project workspace | CONFIRMED |
| `src/routes/projets.$id.facture.tsx` | invoice route, redirected into project timeline | CONFIRMED |
| `src/routes/projets.$id.musicbox.tsx` | music layer, redirected into project timeline | CONFIRMED |
| `src/routes/projets.$id.paiements.tsx` | payments layer, redirected into project timeline | CONFIRMED |
| `src/routes/projets.$id.participants.tsx` | participants layer, redirected into project timeline | CONFIRMED |
| `src/routes/tv.tsx` | TV surface / redirect-capable entry | CONFIRMED |
| `src/routes/fil.tsx` | feed / timeline-like entry | CONFIRMED |
| `src/routes/mcp.ts` | MCP integration endpoint | CONFIRMED |
| `src/routes/sitemap[.]xml.ts` | sitemap | CONFIRMED |

### Architectural observation
Several historical feature routes explicitly redirect back toward the project/timeline surface. This is direct evidence for the project's own convergence effort: finance, music and participant views are treated as layers of the project rather than necessarily independent products.

## 2. dispoo

Direct source inspection already confirms the public booking entry:

- `src/routes/reserver.$slug.tsx` — public reservation/request flow.
- `src/routes/magazine.$slug.tsx` — public editorial/article surface.

The reservation route contains service selection, booking/request mode, availability computation, customer information, options and payment handoff.

Status: CONFIRMED.

## 3. byaime-one-page

Direct repository documentation/source search confirms a workspace architecture with API contract and database schema paths:

- `lib/api-spec/openapi.yaml` — API contract.
- `lib/db/src/schema/aime.ts` — project/membership/invitation/private-file/delivery/RSVP schema ownership.

Route enumeration requires a dedicated next pass; no complete route list is claimed here.

Status: PARTIAL / CONFIRMED evidence, enumeration pending.

## 4. timeline-theater

Observed route files:

| Route file | Surface | Evidence |
|---|---|---|
| `src/routes/index.tsx` | landing / generator | CONFIRMED |
| `src/routes/studio.tsx` | Studio / editor | CONFIRMED |
| `src/routes/demo.tsx` | demo experience | CONFIRMED |
| `src/routes/w.$slug.tsx` | public experience | CONFIRMED |
| `src/routes/apercu.tsx` | preview | CONFIRMED |
| `src/routes/variantes.tsx` | variants | CONFIRMED |
| `src/routes/auth.tsx` | authentication | CONFIRMED |

The strongest reusable surface is `studio.tsx`, because it assembles Timeline, preview, inspector, media library, settings, guests, AI assistant, persistence, publication and undo/redo around one composition document.

## 5. SILLAGE

Direct source inspection has confirmed the implemented API domain around events, track library, playlists, folders, timeline moments, moment-track links, proposals, votes and sharing. A complete route/page enumeration remains a next-pass task.

Status: DOMAIN CONFIRMED / ROUTE ENUMERATION PENDING.

## 6. WEDDINGCITY

Direct source inspection confirms an implemented architecture layer in `src/architecture/queryMutationCascade.ts`, including QuerySystem, MutationSystem, CascadeEngine and ProjectionSyncSystem. A complete route/page enumeration remains pending.

Status: ARCHITECTURE CONFIRMED / ROUTE ENUMERATION PENDING.

## 7. AIME-TIMELINE

Direct source inspection confirms the implemented Timeline and IntelligentAnalysis surfaces. Complete route enumeration remains pending.

Status: UI/DOMAIN CONFIRMED / ROUTE ENUMERATION PENDING.

## 8. mission-proof-permanent

The repository contains implemented API/client/Drizzle areas. The core workflow has been directly identified as action → proof → localisation → timestamp → validation. Complete route enumeration remains pending.

Status: DOMAIN CONFIRMED / ROUTE ENUMERATION PENDING.

## 9. opus-admin

Observed route files include:

| Route file | Surface | Evidence |
|---|---|---|
| `src/routes/index.tsx` | public entry | CONFIRMED |
| `src/routes/auth.tsx` | authentication | CONFIRMED |
| `src/routes/diagnostic.tsx` | diagnostic/intake | CONFIRMED |
| `src/routes/monde.tsx` | world/overview | CONFIRMED |
| `src/routes/suivi.$token.tsx` | tokenized follow-up | CONFIRMED |
| `src/routes/_authenticated/route.tsx` | authenticated shell | CONFIRMED |
| `src/routes/_authenticated/direction.tsx` | direction/operations | CONFIRMED |
| `src/routes/sitemap[.]xml.ts` | sitemap | CONFIRMED |

Further section/component extraction is required before reuse classification becomes definitive.

# Current status

This atlas establishes the first route-level evidence layer. It does **not** yet satisfy the PR #4 merge gate.

Next:

1. enumerate remaining routes for priority repositories;
2. inspect major route components;
3. identify section boundaries;
4. identify media slots and real assets;
5. map sections to primitives;
6. expose those records in the Project Viewer;
7. run the Vercel Preview and visual/functional checks;
8. only then decide whether PR #4 is merge-ready.
