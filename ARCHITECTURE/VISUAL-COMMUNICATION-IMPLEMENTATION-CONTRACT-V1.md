# VISUAL COMMUNICATION IMPLEMENTATION CONTRACT V1

Status: PROPOSED / DOCUMENTATION ONLY

## Vertical slice
```text
REAL EVENT
→ CANONICAL PROJECT / EVENT
→ TIMELINE DETECTION
→ COMMUNICATION PROPOSAL
→ REAL MEDIA SELECTION
→ FACT EXTRACTION
→ FORMAT MATRIX
→ COMPOSITION CANDIDATES
→ ACCESSIBILITY / RIGHTS / PROVENANCE QA
→ HUMAN APPROVAL
→ EXPORT
→ OPTIONAL SCHEDULE / PUBLISH
→ PROOF
```

## Definition of done
1. The event is canonical and traceable.
2. Every displayed fact has a source.
3. Every selected media asset has provenance and usage status.
4. Formats are generated from format profiles rather than duplicated templates.
5. Text hierarchy survives responsive composition.
6. The user can compare variants.
7. The user can edit or reject any proposal.
8. No public action occurs without authorization.
9. The final export records the exact version used.
10. The system can explain where each factual element came from.

## Stable interfaces
```text
Communication.detectUpcoming(projectId)
Communication.prepareBrief(projectId, eventId)
Communication.selectAssets(communicationId)
Communication.generateCopy(communicationId)
Communication.generateFormats(communicationId, formatIds[])
Communication.review(communicationId)
Communication.approve(communicationId, versionId)
Communication.export(communicationId, versionId, formatId)
Communication.schedule(communicationId, versionId, authorization)
Communication.publish(communicationId, versionId, authorization)
Communication.recordProof(communicationId, result)
```

## First concrete scenario
```text
Matt Mez
→ restaurant booking in one month
→ event exists in Universal Timeline
→ venue/address/time already confirmed
→ Universal Media Library contains authorized saxophone/artist assets
→ NOEMA proposes announcement
→ produces vertical + square + web + print candidates
→ user validates
→ exports are created
→ optional social publication is separately authorized
```

No new calendar, event database or media database is created.

## Relationship to financial engine
The same canonical event may project into both communication and financial layers:
```text
EVENT
├── COMMUNICATION PROJECTION
│   └── announcement / reminder / recap
└── FINANCIAL PROJECTION
    └── receivable / expected payment / cash-flow event
```

## Relationship to Site Foundation
The same identity and facts can feed site pages, semantic sitemap, SEO metadata, structured data, social preview, event visuals, email header and print materials.

## Relationship to Media Library
```text
ONE REAL ASSET
→ website hero
→ social portrait
→ social square
→ poster
→ OG image
→ email
```

No duplication of the underlying asset.

## Relationship to Art Engine
The Communication Engine asks the Art Engine to solve composition. It does not become a second design system.

```text
COMMUNICATION INTENT
        ↓
CONTENT HIERARCHY
        ↓
AIME ART ENGINE
        ↓
FORMAT-SPECIFIC COMPOSITION
```

## Human boundary
The engine may observe, classify, select, propose, compose, compare, explain and export as a draft. It requires explicit authorization before publishing publicly, sending promotional communications, sharing restricted assets, modifying an external channel or replacing an approved publication.

## Architectural rule
> **NOEMA ne crée pas une nouvelle réalité pour communiquer. Elle transforme une réalité déjà comprise en plusieurs formes visuelles adaptées au contexte.**
