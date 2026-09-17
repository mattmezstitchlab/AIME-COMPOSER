# NOEMA GARDIENNE V1

**Status:** PROPOSED — documentation before implementation  
**Purpose:** define the first-contact layer of NOEMA and the progressive construction of the Universal Card.

## 1. Principle

NOEMA does not begin by asking a person to fill a form.

> **NOEMA ne demande pas d'abord de remplir. Elle commence par comprendre.**

The first contact is **La Gardienne**: a conversational, multimodal threshold that takes the temperature of the request, identifies intent progressively, and prepares the next useful action.

Core rule:

> **NOEMA PROPOSE. L'HUMAIN VALIDE.**

## 2. Entry without forms

Primary modes:

- **PARLER** — natural voice conversation.
- **ÉCRIRE** — text conversation.
- **SOUFFLER** — assisted expression for incomplete speech, pauses, murmurs, searching for words or partial thoughts.
- **MONTRER** — where supported, the person can present an image, document, screen, object, sketch or visual situation for contextual understanding.

No mode is mandatory. Voice must never become the only accessibility path.

## 3. Take the temperature

La Gardienne progressively understands:

- **QUI** — person/entity/context;
- **QUOI** — object or project;
- **POURQUOI** — underlying intention;
- **CONTEXTE** — environment and constraints;
- **MOMENT** — urgency or temporal context;
- **BESOIN** — what would actually help now.

It does not turn these dimensions into a questionnaire. It extracts what is already available, then asks only for what is materially missing.

## 4. Progressive Universal Card

The Universal Card is a **living memory**, not an onboarding form.

```text
CONVERSATION
  ↓
OBSERVATION
  ↓
PROPOSITION
  ↓
HUMAN VALIDATION
  ↓
UNIVERSAL CARD
  ↓
MEMORY
```

NOEMA may discover useful profile information during ordinary work:

- identity;
- activity / profession;
- skills;
- specialties;
- experience;
- projects;
- creations;
- interests / universes;
- preferences;
- working style;
- relationships;
- useful practical information;
- authorized portfolio evidence.

Example:

> « Tu viens de me dire que tu travailles comme architecte et que tu cherches à présenter tes projets à de nouveaux clients. J'ai retenu “architecte” et “portfolio professionnel”. Est-ce que je peux les conserver dans ta Carte Universelle ? »

Possible responses:

- **Garder**
- **Modifier**
- **Pas maintenant**
- **Ne plus me demander cela**

## 5. Evidence states

No inference becomes an established fact automatically.

```text
OBSERVED
  ↓
INFERRED / PROBABLE
  ↓
PROPOSED
  ↓
CONFIRMED
```

Each memory item should retain provenance and confidence. The user can correct, delete, pause or revoke it.

## 6. Contextual profile

The same Universal Card can produce different projections without duplicating the source of truth.

Examples:

- wedding context → wedding professional profile;
- web project → creative / professional profile;
- artistic project → artist / creator profile;
- collaboration → skills / experience / portfolio profile.

```text
ONE PERSON
     ↓
ONE SOURCE OF TRUTH
     ↓
MANY AUTHORIZED PROJECTIONS
```

## 7. Gigi / matchmaker principle

NOEMA can identify useful relational opportunities from validated information.

```text
PERSON
 ↓
SKILLS / EXPERIENCE / PROJECTS
 ↓
INTENT
 ↓
NEEDS
 ↓
RELATION GRAPH
 ↓
POSSIBLE CONNECTION
 ↓
EXPLANATION
 ↓
HUMAN VALIDATION
 ↓
INTRODUCTION
```

NOEMA should explain why a connection is proposed and what evidence and permissions support it.

Example:

> **Je vois une connexion intéressante.**
>
> Tu cherches un photographe pour un projet de mariage. Cette personne travaille dans ce domaine et son portfolio correspond au style que tu viens de décrire. Voulez-vous que je vous présente ?

## 8. Non-intrusion

Silence is a capability.

NOEMA should not turn every conversation into a profile-building exercise. It proposes memory only when the information is likely to be useful, durable and authorized.

Relevance should consider:

`UTILITY × CONFIDENCE × CONTEXT × TIMING × AUTHORIZATION`

## 9. Accessibility from the first contact

Accessibility is not a settings page added later. La Gardienne itself must be multimodal and operable without a single required interaction modality.

Supported design principles:

- keyboard-first alternative;
- visible focus;
- screen-reader-compatible structure;
- speech input and text alternative;
- touch and pointer alternatives;
- reduced motion;
- zoom/reflow;
- understandable language;
- captions/transcripts where applicable;
- no information conveyed by colour alone;
- accessible error recovery;
- sufficient time and non-destructive interruption;
- accessible confirmation of what NOEMA understood.

## 10. Mirror

Before a meaningful memory write or action, NOEMA can expose a compact **Mirror**:

> **Voilà ce que j'ai compris.**
>
> Activité: …  
> Projet: …  
> Besoin: …  
> Préférence détectée: …  
> Information proposée à la Carte: …

The person validates or corrects it.

## 11. Relationship to Composer

The Gardienne is upstream of the creative system:

```text
GARDIENNE
 ↓
INTENTION
 ↓
UNIVERSAL CARD / MEMORY
 ↓
BRIEF
 ↓
MEDIA / TIMELINE / GRID
 ↓
COMPOSER
 ↓
ART ENGINE
 ↓
PROPOSITION
 ↓
HUMAN VALIDATION
```

The Gardienne therefore reduces cognitive load before creation rather than adding another dashboard.

## 12. Non-goals

This architecture does not authorize:

- psychological diagnosis;
- automatic publication of inferred profile data;
- automatic disclosure of sensitive information;
- automatic introduction between people;
- treating visual or affective signals as facts;
- replacing explicit human approval for consequential actions.

## 13. Source-of-truth rule

The Universal Card is memory. It is not a second database for every application.

Projects, relationships, media, timelines and publications reference the same authorized identity and memory primitives.

---

**Decision required before implementation:** approve this architecture as the reference for NOEMA's first-contact and progressive-profile layer.