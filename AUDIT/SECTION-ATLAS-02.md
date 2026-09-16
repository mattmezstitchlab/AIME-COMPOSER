# SECTION-ATLAS-02 — DISPOO / Creative narrative surface

Date: 2026-09-16
Status: CONFIRMED SOURCE EXTRACTION
Branch: `feat/project-viewer`

## Purpose

Extend the factual section atlas with directly inspected sections from priority repositories. This record distinguishes the observed source structure from any future generic Creative Web Studio abstraction.

Evidence levels:
- **CONFIRMED** — source component directly inspected.
- **DOCUMENTED** — documented but not fully inspected.
- **CONCEPT** — intended/future behavior.
- **NOT_AUDITED** — no evidence collected.

Reuse classes:
- `REUSE_DIRECT`
- `REUSE_ADAPT`
- `REFERENCE_ONLY`
- `SOURCE_DEPENDENT`
- `UNKNOWN`

---

## 1. DISPOO — `DiscoverExperience`

Repository: `mattmezstitchlab/dispoo`

Source: `src/components/discover-experience.tsx`

Evidence: **CONFIRMED**

The component is a real long-form discovery surface rather than a generic dashboard. It combines a presentation film, seven major narrative sections, additional audience/trades/editorial sections and a final CTA.

### Section 0 — Presentation film

- Component: `PresentationFilm`
- Related component: `HeroVideo`
- Media resolution: `useSiteContent`, `useSiteMedia`, `mediaForStoredValue`, `mediaKeyOf`
- Role: explain the product before the narrative sequence.
- Media behavior: stored film value is resolved to repository media; stale hosted URLs are handled; a dedicated poster is selected.
- Primitive mapping: `MEDIA`, `PLAYBACK`, `NARRATIVE`
- Reuse: `REUSE_ADAPT`
- Dependency: DISPOO site-content/media system.

### Section 01 — IMAGINER

- Component: `DiscoverSection`
- id: `dispo`
- visualKey: `hero-evenement-mariage`
- CTA: `/mon-evenement`
- Role: turn a first intention into a structured starting point.
- Primitive mapping: `INTENTION`, `PROJECT MEMORY`, `COMPOSITION`
- Reuse: `REUSE_ADAPT`
- Limitation: current content is wedding-specific.

### Section 02 — TROUVER

- Component: `DiscoverSection`
- id: `tempo`
- visualKey: `hero-evenementiel`
- CTA: `/recherche`
- Role: make professionals discoverable and comparable.
- Primitive mapping: `SEARCH`, `ENTITY`, `RELATION`, `ENGAGEMENT`
- Reuse: `REUSE_ADAPT`
- Limitation: current implementation is coupled to DISPOO search/professional data.

### Section 03 — COMPOSER

- Component: `DiscoverSection`
- id: `chrono`
- visualKey: `hero-photographe`
- CTA: `/mon-evenement`
- Role: assemble the right professional roles at the right time.
- Primitive mapping: `COMPOSITION`, `ENTITY`, `TIME`, `ENGAGEMENT`
- Reuse: `REUSE_ADAPT`
- Limitation: current content is event/wedding-oriented.

### Section 04 — ORCHESTRER

- Component: `DiscoverSection`
- id: `info`
- visualKey: `hero-dj`
- CTA: `/mon-evenement#deroule`
- Role: expose the common event-day sequence and coordinate interventions.
- Primitive mapping: `TIMELINE`, `COMPOSITION`, `RELATION`, `TIME`
- Reuse: `REUSE_ADAPT`
- Limitation: event-day semantics are domain-specific, while the underlying sequence pattern is generic.

### Section 05 — VALIDER

- Component: `DiscoverSection`
- id: `geo`
- visualKey: `hero-buro-mariage`
- CTA: `/buro`
- Role: consolidate requests, quotes, contracts, deposits and invoices and expose pending validation.
- Primitive mapping: `DOCUMENT`, `ENGAGEMENT`, `APPROVAL`, `TRANSACTION`
- Reuse: `REUSE_ADAPT`
- Limitation: current implementation depends on DISPOO Bureau/commercial entities.

### Section 06 — PARTAGER

- Component: `DiscoverSection`
- id: `echo`
- visualKey: `hero-traiteur`
- CTA: `/messages` for authenticated users or `/auth` otherwise.
- Role: keep messages, documents and schedule changes connected to the project and notify the relevant people.
- Primitive mapping: `COLLABORATION`, `DOCUMENT`, `RELATION`, `VERSION`, `ENGAGEMENT`
- Reuse: `REUSE_ADAPT`
- Limitation: current messaging/auth infrastructure is DISPOO-specific.

### Section 07 — RACONTER

- Component: `DiscoverSection`
- id: `demo`
- visualKey: `hero-studio-mariage`
- CTAs: `/recherche`, `/professionnels`
- Role: turn professional know-how into an attractive public presentation through photos, video, services and pricing.
- Primitive mapping: `MEDIA`, `IDENTITY`, `PUBLICATION`, `SEARCH`
- Reuse: `REUSE_ADAPT`
- Limitation: professional profile and Studio dependencies are DISPOO-specific.

### Following sections

The same source component then composes:

- `WeddingTradesSection`
- `AudienceSection`
- `MagazineTeaser`
- final CTA section

These are **CONFIRMED as route composition elements**, but their internal structures are not promoted to reusable section records by this audit pass.

---

## 2. Important reusable pattern discovered

The strongest reusable element is not the wedding copy or the individual visual keys. It is the narrative progression:

```text
IMAGINER
   ↓
TROUVER
   ↓
COMPOSER
   ↓
ORCHESTRER
   ↓
VALIDER
   ↓
PARTAGER
   ↓
RACONTER
```

For a Creative Web Studio this can become an abstraction only after adaptation:

```text
DÉFINIR
   ↓
EXPLORER
   ↓
STRUCTURER
   ↓
PRODUIRE
   ↓
VALIDER
   ↓
PARTAGER
   ↓
PUBLIER
```

This is an **architectural hypothesis**, not a claim that DISPOO already implements a generic web-agency workflow.

---

## 3. Media evidence

The source directly references concrete media keys including:

- `film-accueil`
- `hero-evenement-mariage`
- `hero-evenementiel`
- `hero-photographe`
- `hero-dj`
- `hero-buro-mariage`
- `hero-traiteur`
- `hero-studio-mariage`

At this stage these are recorded as **real source media references**, not yet as extracted asset files. Dimensions, duration, exact storage paths and rights/licensing status still require the dedicated media inventory pass.

Therefore the Project Viewer must not display these as extracted downloadable assets yet.

---

## 4. Mapping to Creative Web Studio

| DISPOO source pattern | Potential Creative Web Studio role | Status |
|---|---|---|
| Presentation Film | Studio introduction / case-study film | REUSE_ADAPT |
| IMAGINER | Brief / project intention | REUSE_ADAPT |
| TROUVER | Inspiration / references / capabilities | REUSE_ADAPT |
| COMPOSER | Sitemap / feature composition / offer | REUSE_ADAPT |
| ORCHESTRER | Production Timeline | REUSE_ADAPT |
| VALIDER | Content / quote / contract / approval | REUSE_ADAPT |
| PARTAGER | Client collaboration / messages | REUSE_ADAPT |
| RACONTER | Public case study / project publication | REUSE_ADAPT |

No code is copied into AIME-COMPOSER by this audit entry.

---

## 5. Next extraction targets

1. Inspect `DiscoverSection` itself to isolate its visual/layout contract.
2. Inspect the real media registry behind `useSiteMedia` and `mediaForStoredValue`.
3. Record actual file paths, dimensions and durations for the eight media references.
4. Inspect `WeddingTradesSection`, `AudienceSection` and `MagazineTeaser` before exposing them in the Viewer.
5. Continue with Timeline Theater and OPUS Admin section extraction.
6. Map confirmed records into the Project Viewer without replacing evidence with invented demo content.
