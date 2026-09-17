# NOEMA UNIVERSAL VISUAL COMMUNICATION ENGINE V1

Status: PROPOSED / DOCUMENTATION ONLY

## Purpose
Turn a real project, event, booking or publication into ready-to-review visual communications for the appropriate channels and formats, using only verified project information and authorized media.

Example: a musician has a confirmed restaurant performance in one month. NOEMA can detect the upcoming event, understand the venue and activity, retrieve authorized real media, propose a communication concept, generate channel-specific compositions, and present them for human approval.

## Core principle
```text
REAL PROJECT DATA
+ REAL MEDIA
+ REAL DATE / PLACE / TIME
+ PROJECT IDENTITY
+ COMMUNICATION INTENT
        ↓
VISUAL COMMUNICATION ENGINE
        ↓
FORMAT MATRIX
        ↓
COMPOSITION
        ↓
TEXT / IMAGE / BRAND / QR / CTA
        ↓
ACCESSIBILITY + LEGAL + PROVENANCE QA
        ↓
HUMAN VALIDATION
        ↓
EXPORT / SCHEDULE / PUBLISH
```

NOEMA does not invent a venue, date, address, artist, price, sponsor, claim or testimonial. Unknown values remain `À CONFIRMER` or are omitted.

## Event example
Canonical project data can contain artist/organization, event type, venue, venue address, city, date, start/end time, booking status, ticket/reservation URL, event title, authorized portrait/logo/venue media, visual identity, CTA and publication permissions.

NOEMA derives communication variants from the same source of truth:
`EVENT → STORY/VERTICAL, SOCIAL PORTRAIT, SOCIAL LANDSCAPE, SQUARE, EVENT HEADER, WEB BANNER, EMAIL HEADER, DIGITAL SCREEN, PRINT POSTER, QR CARD, OPEN GRAPH / LINK PREVIEW`.

The exact dimensions are channel profiles, not hard-coded assumptions in the project model.

## Communication brief generated automatically
```text
OBJECTIF → announce / invite / remind / recap / thank / convert
PUBLIC → local audience / clients / guests / followers / professionals
MESSAGE → what / where / when / why / action
MEDIA → selected real assets + provenance
IDENTITY → project visual system
FORMATS → requested channels
```

The user should be able to say “prépare la communication” without filling a form. The Gardienne / Intent Engine supplies missing context through conversation.

## Real media first
The Universal Media Library remains the source of truth for visual assets.

```text
MEDIA ASSET
→ REAL FILE / SOURCE
→ PROVENANCE
→ RIGHTS
→ SUBJECT / PEOPLE / PLACE
→ ORIENTATION
→ DIMENSIONS
→ COLOR / STYLE
→ USAGE AUTHORIZATION
→ POSSIBLE ROLES
```

A real photo from the restaurant or performer can be reused in several compositions without duplicating the underlying asset.

DISPOO already provides an evidence base for this principle: its `site-media` system distinguishes known visual keys, uploaded owner media and external media, while its media helpers select real posters/videos or controlled fallbacks.

## Composition engine
Visual communication is not a template list. It is a constrained composition system using the AIME Art Engine:
`CONTENT + MEDIA + IDENTITY + FORMAT → GRID + TYPOGRAPHY + COLOR + ICONOGRAPHY + SPACING + COMPOSITION → CANDIDATE`.

The engine adapts hierarchy, crop, scale, typography and information density to the format while preserving the same communication meaning.

## Format intelligence
Each format profile declares dimensions/aspect ratio, safe areas, hierarchy constraints, minimum readable text, logo rules, CTA rules, QR constraints where applicable, accessibility requirements, platform metadata, export type and print/digital constraints.

A single communication object therefore has many projections:
`COMMUNICATION → FORMAT PROJECTIONS → social / web / email / screen / print`.

## Copy engine
Text is generated from canonical facts, not invented copy:
`FACTS → MESSAGE PRIORITY → AUDIENCE → TONE → LENGTH → FORMAT → COPY PROPOSAL`.

Factual statements retain provenance to the underlying project object. Title, venue, address, date, hours and CTA come from verified project data.

## Visual truth / proof
Each generated communication records:
`source_project, source_event, source_assets[], source_facts[], format_profile, composition_version, copy_version, rights_status, approval_status, published_at?`.

This makes it possible to answer: “Where did this information and this image come from?”

## People and image rights
The engine distinguishes asset ownership, license/usage rights, consent where relevant, identifiable people, publication scope and expiration/revocation. Public availability does not imply free reuse.

## Communication privacy
Public publication is separated from private project data. Personal contact details and non-public financial information must not leak into a generated public visual.

If communications are sent electronically for commercial prospecting, the applicable consent/opposition rules must be respected; CNIL distinguishes promotional prospecting from transactional and relational messages and requires an appropriate legal basis and information.

## Human validation
```text
NOEMA PROPOSES
      ↓
USER REVIEWS
      ↓
EDIT / ACCEPT / REJECT
      ↓
APPROVE
      ↓
EXPORT / SCHEDULE / PUBLISH
```

Nothing public is published merely because a visual was generated.

## Communication timeline
The Universal Timeline can trigger proposals without autonomous publication:
`30 DAYS → announcement proposal; 14 DAYS → reminder; 7 DAYS → final reminder; DAY OF → today visual; AFTER → recap/thank-you`.

Timing is configurable and actual publication/sending requires authorization.

## Universal Communication Object
```text
Communication
├── intent
├── project_ref
├── event_ref?
├── audience
├── message
├── facts[]
├── assets[]
├── rights[]
├── identity
├── formats[]
├── compositions[]
├── versions[]
├── approvals[]
├── exports[]
├── publication[]
└── proof
```

## Generation technologies
The canonical model can support HTML/CSS rendering, SVG generation, image composition, dynamic OG generation, PDF/print rendering and video/motion composition. Satori / `@vercel/og` is one suitable renderer for structured dynamic social preview images.

## Accessibility
Generated communication passes through the unified accessibility layer where applicable. The engine can generate or validate alternative text, contrast, readable hierarchy and equivalent textual information. Information should remain clear, concise, understandable and accessible; different modalities can be used according to context.

## Integration
```text
NOEMA
├── GARDIENNE → intent
├── MEMORY → person / organization / project / event
├── TIMELINE → date / moment / trigger
├── BUREAU → contracts / briefs / documents / proof
├── MEDIA LIBRARY → real authorized assets
├── ART ENGINE → composition / typography / color / grid
├── COMMUNICATION ENGINE → message / formats / variants
├── ACTION ENGINE → export / schedule / publish
└── GOVERNANCE → rights / consent / provenance / audit / rollback
```

## Non-goals
- No automatic publication without authorization.
- No fabricated event information.
- No automatic reuse of unverified images.
- No separate media database.
- No separate project calendar.
- No template-only system disconnected from project truth.

## Final principle
> Une communication n'est pas une image fabriquée à partir de rien. C'est une projection visuelle d'une réalité déjà comprise par NOEMA.

The target experience is simple: **the event exists once; its communication is proposed everywhere it makes sense.**
