# Diagnostic comparé — AIME Design System

> Généré le 2026-09-17 par `diagnostic/survey.mjs`, mis en forme par
> `diagnostic/report.mjs`. Aucun chiffre de ce document n'est écrit à la main :
> tous sortent de la mesure.

## Ce que ce document est

Le moteur qui juge ces projets est `design-system/js/qa.js` — **celui qui
valide les 31 écrans du Design System**, pas une copie. Un projet est donc
jugé dans les mêmes conditions que les écrans qui sortent, sur le même
barème. Un écart de densité entre deux projets est une différence réelle.

Il **mesure et nomme**. Il ne répare rien : la réparation reste une décision
humaine, conformément au principe du système — NOEMA propose, l'humain valide.

## Portée de la mesure

| | |
|---|---|
| Dépôts du compte | 38 |
| Projets jugés | 18 |
| Projets sans écran | 20 |
| Écrans mesurés | 80 |
| Écarts relevés | 8398 |
| Densité globale | 105 écarts par écran |

## Ce que mesure chaque ligne

Chaque dépôt est cloné peu profond **sur sa branche par défaut**. Le rapport
décrit donc l'état publié du projet, pas un travail en cours sur une branche.

Cela change la lecture d'une ligne : `AIME-COMPOSER` lui-même. Sa branche
`main` ne contient pas encore `design-system/` ni `loop/` — ils sont sur une
branche non fusionnée. La ligne mesure donc `atlas/` seul, 5 écrans de
Playground écrits avant le système, qui ne référencent aucune de ses
feuilles. Les 31 écrans du Design System, eux, sont jugés en continu
par `npm run check` dans ce même dépôt, et sortent conformes aux 12 familles.

## Classement

Moins il y a d'écarts par écran, plus le projet est proche du système.
L'ordre va du plus proche au plus éloigné.

| # | Projet | Écrans | Écarts | Par écran | Vocabulaire adopté | Principaux écarts |
|---:|---|---:|---:|---:|---:|---|
| 1 | `mattmezstitchlab/aime-stluc` | 1 | 30 | 30 | 0 % | COLOR 16 · SPACING 7 · MOTION 5 |
| 2 | `mattmezstitchlab/byaime` | 34 | 1206 | 35.5 | 0 % | ICONOGRAPHY 614 · COLOR 384 · MOTION 164 |
| 3 | `mattmezstitchlab/mattmez` | 1 | 38 | 38 | 0 % | COLOR 10 · SPACING 9 · TYPOGRAPHY 8 |
| 4 | `mattmezstitchlab/MONDE-M` | 1 | 38 | 38 | 0 % | COLOR 10 · SPACING 9 · TYPOGRAPHY 8 |
| 5 | `mattmezstitchlab/SILLAGE` | 2 | 85 | 42.5 | 0 % | COLOR 77 · TYPOGRAPHY 2 · ICONOGRAPHY 2 |
| 6 | `mattmezstitchlab/Butterfly-Effect` | 1 | 64 | 64 | 0 % | COLOR 34 · SPACING 10 · TYPOGRAPHY 10 |
| 7 | `mattmezstitchlab/Butterfly` | 4 | 329 | 82.3 | 0 % | COLOR 111 · SPACING 90 · TYPOGRAPHY 70 |
| 8 | `mattmezstitchlab/nexus` | 20 | 1741 | 87 | 1 % | COLOR 755 · SPACING 445 · ALIGNMENT 202 |
| 9 | `mattmezstitchlab/gaia` | 1 | 87 | 87 | 0 % | SPACING 35 · COLOR 33 · OVERFLOW 11 |
| 10 | `mattmezstitchlab/AIME-COMPOSER` | 5 | 485 | 97 | 1 % | COLOR 215 · SPACING 111 · TYPOGRAPHY 61 |
| 11 | `mattmezstitchlab/AIME-ARCHIVE` | 1 | 105 | 105 | 0 % | COLOR 57 · SPACING 15 · ALIGNMENT 13 |
| 12 | `mattmezstitchlab/byaime-one-page` | 3 | 327 | 109 | 0 % | COLOR 194 · SPACING 61 · TYPOGRAPHY 23 |
| 13 | `mattmezstitchlab/MINISITEWEDDING` | 1 | 112 | 112 | 0 % | COLOR 74 · MOTION 21 · SPACING 10 |
| 14 | `mattmezstitchlab/dispoo-app` | 1 | 131 | 131 | 0 % | SPACING 74 · COLOR 38 · ALIGNMENT 13 |
| 15 | `mattmezstitchlab/box` | 1 | 220 | 220 | 0 % | SPACING 68 · COLOR 38 · TYPOGRAPHY 31 |
| 16 | `mattmezstitchlab/AIME-TIMELINE` | 1 | 597 | 597 | 0 % | COLOR 481 · SPACING 67 · MOTION 21 |
| 17 | `mattmezstitchlab/aime-desktop` | 1 | 957 | 957 | 0 % | COLOR 492 · SPACING 280 · TYPOGRAPHY 97 |
| 18 | `mattmezstitchlab/WEDDINGCITY` | 1 | 1846 | 1846 | 0 % | COLOR 852 · SPACING 686 · TYPOGRAPHY 167 |

### Lire la colonne « vocabulaire adopté »

Elle mesure la part de classes du projet qui appartiennent déjà au
vocabulaire du système (`t-*`, `l-*`, `a-*`, `u-*`, `noema-*`, `viz-*`,
`ds-*`). **0 % n'est pas une faute, c'est le point de départ** — ces projets
ont été écrits avant le système. Et adopter 30 % des mots du système ne veut
pas dire être conforme à 30 % : l'adoption ne mesure que ce qui est déjà
écrit avec les bons mots, pas ce qui est juste.

### Ce que la famille `CONSISTENCY` ne dit pas

Elle ne regarde que les classes du vocabulaire du système. Sur un projet qui
ne l'emploie pas, elle remonte 0 — ce qui signifie « ce projet n'utilise pas
le système », **pas** « il est cohérent ». Aucun de ces 0 ne doit être lu
comme un brevet.

### Pourquoi `CONTRAST` est absente

Son calcul a besoin des deux thèmes du Design System : elle mesure **nos**
primitives, pas votre projet. La compter ici reviendrait à facturer à autrui
nos propres dettes. Elle est déclarée `REFERENCE_ONLY` dans le code.

## Projets non diagnostiqués

20 dépôts ne contiennent aucun écran HTML. Le diagnostic ne leur
attribue aucun score : juger un projet sans écran serait publier un chiffre
qui ne porte sur rien.

| Dépôt | Raison |
|---|---|
| `mattmezstitchlab/fuck` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/MISSIONMARIAGE` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/DISPOORED` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/DISPOOWHITE` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/aimeplay` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/byaimeappok` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/byaimeapp` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/portfolio` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/nails-profile` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/lemondeaimebox` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/by-aime` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/AURORA` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/HERA-BY-AIME` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/WEBAIME` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/builder` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/AIMEDESK` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/ETERNITY` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/Aime-Cachet` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/LEMONDEAIME` | aucun écran HTML à juger — le diagnostic ne porte sur rien |
| `mattmezstitchlab/scan` | aucun écran HTML à juger — le diagnostic ne porte sur rien |

## Ce que cette mesure ne couvre pas

- **Aucune mise en page réelle n'est jugée.** `ALIGNMENT` et `OVERFLOW` sont
  des heuristiques statiques. Les 31 écrans du système sont vérifiés au rendu
  par `qa/verify-dom.mjs` ; ce diagnostic ne le fait pas pour un projet tiers.
- **La collecte est statique.** Du HTML rendu par JavaScript n'est pas vu.
- **Les icônes générées par JavaScript ne sont pas comptées** par
  `ICONOGRAPHY`.
- Un projet peut être **conforme et laid**, ou plein d'écarts et réussi. Le
  système mesure ce qu'il sait nommer ; il ne remplace pas un regard.

## Reproduire cette mesure

```bash
node diagnostic/survey.mjs                 # tous les dépôts du compte
node diagnostic/survey.mjs --repo A --repo B
node diagnostic/diagnose.mjs ../un-projet  # un dossier local
node diagnostic/survey.mjs --json | node diagnostic/report.mjs
```

Les clones sont peu profonds et jetables (`diagnostic/.work/`, hors Git).
L'outil n'écrit jamais dans le projet examiné — c'est un test, pas une
promesse.

