# AUDIT — POINT ZERO · CONVERGENCE DU SITE & SUPPRESSION PROGRESSIVE DES PAGES — 01

**Date :** 18 septembre 2026
**Branche :** `arena/01a0b43f-aime-composer`
**Cible auditée :** `point-zero/` — l'interface unique définie par `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md`, analysée en tant que point de convergence de **tout le site**, dans le but de supprimer des pages petit à petit.
**Méthode :** l'existant est mesuré contre le code au commit `f2fe4ba`, pas décrit de mémoire. Niveaux d'évidence hérités de MASTER-ARCHITECTURE-V1 §16 : `CONFIRMED` (code ou mesure inspectés directement), `DOCUMENTED` (spec auditée, pas encore d'implémentation), `CONCEPT` (intention), `NOT_AUDITED` (preuve insuffisante).
**Documents liés :** `AUDIT/POINT-ZERO-FUSION-01.md` (la fusion, phases P1–P5 livrées) · `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md` (la cible) · `AUDIT/MEDIA-ATLAS-01.md` · `AUDIT/DIAGNOSTIC-SURVEY-V1.md`.

---

## 1. Synthèse

**Verdict : Point Zero est bien l'interface unique — la coquille existe, elle est auditéee (35e écran), et elle projette déjà les quatre moteurs du dépôt sans en recalculer aucune règle. Mais aujourd'hui, aucune page ne peut être supprimée : le critère de complétude §13-1 de la spec (« tout ce qui était possible sur `atlas/`, `loop/` et l'accueil reste possible sans quitter la coquille ») n'est pas encore mesuré vrai. Les manques sont comptés, nommés, et chacun correspond à une tranche de travail bornée.**

Mesuré au 18 septembre 2026 :

| Grandeur | Mesure | État |
|---|---|---|
| Fichiers HTML du dépôt | **36** (4 surfaces produit · 19 chapitres doc · 1 atelier DA · 11 écrans d'expérience · 1 fixture de test · la coquille elle-même) | CONFIRMED (`find`, §3) |
| Zones de la coquille livrées | Z1–Z5 complètes (`pz.js`, 1 276 lignes, zéro règle métier) | CONFIRMED |
| Fonctions de `atlas/` déjà dans le Bureau | catalogue, filtres type/nom/dépôt, doublons, mode local enrichi (SHA-256, ZIP, PDF), couverture, copie de lien, placement | CONFIRMED (§4.2) |
| Fonctions de `atlas/` manquantes dans la coquille | **7** : visionneuse réelle, lecture vidéo/audio, téléchargement, vérification, brief agent + manifeste JSON, script `.sh`, sélection multiple | CONFIRMED (§4.2) |
| Fonctions de `loop/` déjà dans la coquille | intention (lecture/écriture), propositions ouvertes + décision attribuée, timeline 6 modes + achèvement, cartes mémoire, synchronisation flux↔carte | CONFIRMED (§4.3) |
| Fonctions de `loop/` manquantes | **9** : observer, actions (autoriser/exécuter), retenues affichées, journal, monde, les 8 droits mémoire, preuves, réinitialisation, granularité | CONFIRMED (§4.3) |
| Fonctions de l'accueil manquantes | **4** : mode Diagnostic (commande `owner/repo`), lien Direction artistique, résolution d'URL distante, routeur d'aperçu | CONFIRMED (§4.1) |
| Pages supprimables aujourd'hui | **0** — §13-1 non satisfait ; toute suppression avant parité serait une perte de fonction, pas une convergence | CONFIRMED |
| Plan de suppression | **4 vagues** à gates mesurables, chacune publiable, aucune suppression sans parité démontrée | DOCUMENTED (§6) |

La convergence n'est pas à sens unique : la coquille possède déjà des capacités que les pages d'origine n'ont pas (import ZIP/PDF local empreinté, dossiers contextuels, moteur spatial magnétique, pack EAA, synchronisation timeline↔carte). Supprimer une page ne sera donc jamais « effacer » : ce sera **acter qu'une projection de la coquille remplace l'original, à fonctions égales ou supérieures**.

## 2. Anatomie profonde de Point Zero — ce que la coquille est réellement

### 2.1 Contrat structurel (mesuré)

La coquille applique le principe de FINAL-CONVERGENCE-V1 : **une mémoire · une sélection · une coquille · plusieurs projections**. Mesuré dans `point-zero/pz.js` :

- **Zéro règle métier.** Le module le déclare en tête et le tient : tout vient de `loop` (API), `atlas/media.json`, `design-system/tokens/QA-REPORT.json`, `pz-import.mjs` (lectures locales pures). Aucune donnée canonique n'est recalculée ni stockée.
- **État de présentation seul** : `localStorage` sous la clé `aime-pz-*` (panneaux, format, source, dossier, toggles). Conformité spec §10 — la coquille n'a pas d'état métier.
- **Une sélection globale** (`Selection = { kind, ref }`) projetée en quatre endroits : canvas, inspecteur, timeline (via `entity_ref`), cartes. Le méta du canvas l'affiche : « une sélection, quatre projections ».
- **Honnêteté hors ligne** : chaque zone qui perd son moteur le dit (`offlineBlock`) et n'invente rien — le badge NOEMA a trois états réels (`en ligne`, `en ligne · démo`, `hors ligne`), hérités du contrat server/serverless.

### 2.2 Zone par zone — le mesuré et le manquant

| Zone | Livré (CONFIRMED, code) | Manquant pour la convergence |
|---|---|---|
| **Z1 Header** | sélecteur de projet (depuis `/api/state`), 9 profils de format (`FORMATS`, spec GRILLE §4), badge QA réel (`QA-REPORT.json`), pack EAA (`auditLive` + noms accessibles + contraste du rapport), badge runtime NOEMA, thème partagé (`aime-ds-theme`) | lien vers l'atelier Direction artistique ; projection du diagnostic appliqué à *un projet extérieur* (mode diag de l'accueil) |
| **Z2 Bureau** | `atlas/media.json` réel (ligne 508 : `fetch('../atlas/media.json')`), bascule GitHub/local, filtres type/nom/dépôt, dossiers contextuels `Tous/Doublons/Placés` (vues par empreinte, jamais des copies), couverture par dépôt, absence audio nommée, cartes `Inspecter/Copier/Placer` | les 7 fonctions cartes de la médiathèque (§4.2) — la spec §4 les exige « sans exception » |
| **Z3 Canvas** | 9 profils, origine 0,0 (réticule), colonnes/safe/bleed/tiers, glisser à capture de pointeur, aimantation `STOP 24` + rattrapage `CENTRE/BORD` ±8 px avec étiquette de la règle appliquée, clavier complet (flèches ±4, Maj ±24, Suppr), placement = référence à l'asset, jamais une copie | resize des placements, guides déplaçables (spec §5), avertissements de débordement au changement de profil (GRILLE §12) |
| **Z4 Inspecteur** | 4 natures de sélection (média, placement, carte, contrôle EAA) + état format par défaut ; champs X/Y/W synchronisés en direct pendant le glisser ; géométrie déclarée « projection locale » (jamais canonique) | édition des valeurs du système par override (mécanisme `direction.html`), édition tracée `CHANGE → IMPACT → /api/decide` (spec §6) |
| **Z4b Rail NOEMA** | `/api/state`, propositions ouvertes avec `Valider/Refuser` (`/api/decide`, acteur `point.zero.shell` — le refus 400 sans acteur tient donc aussi depuis la coquille), intention `dry_run` (« Lire sans écrire ») et écriture de propositions, retenues comptées dans la sortie | file complète des 6 états épistémiques en rail, contexte de sélection injecté dans l'intention, attribution (`noe-mark` rail dédié) |
| **Z5 Dock** | Timeline `/api/timeline` (6 modes, granularité SEMAINE, achèvement si la capacité `COMPLETE` est présente), Cartes `ucard` depuis `/api/state`, ＋ Import (dossier, fichiers, lien GitHub/texte) ; un seul tiroir ouvert, Échap ferme | granularités année→minute, modes COMPOSE en lanes/clips (le CSS `utl--compose` existe, la projection pas encore), sélecteur de projet filtrant les cartes |

### 2.3 Le moteur d'import — l'avance de la coquille

`pz-import.mjs` (pur, zéro dépendance, **31/31 tests**) fait plus que l'accueil et l'atlas réunis sur la lecture locale : classification 7 familles, index ZIP (EOCD + central directory), triage PDF (version/pages/titre), SHA-256 (`crypto.subtle`, « non calculée » déclarée au-delà de 64 Mio), couverture d'import publiée dans le Bureau, intention NOEMA pré-remplie **jamais envoyée automatiquement** (critère §13-4). C'est la preuve que la convergence enrichit : l'atlas n'a pas d'équivalent de ce pipeline.

## 3. Inventaire du site — 36 fichiers HTML, quatre natures

Mesuré par parcours du dépôt au commit `f2fe4ba`. Chaque fichier reçoit un statut au regard de la convergence :

- **ABSORBABLE** — surface produit dont les fonctions doivent migrer dans la coquille avant suppression.
- **RÉFÉRENCE** — reste hors coquille, la coquille y pointe (spec §3 : « avec accès au détail »).
- **INCONTOURNABLE** — grammaire du système ; la coquille en est une projection, elle ne l'absorbe pas.
- **DÉCISION HUMAINE** — le sort exige une validation explicite (la boucle l'exige).
- **FIXTURE** — n'est pas une page.

| # | Fichier | Nature | Statut |
|---|---|---|---|
| 1 | `index.html` (+ `home.js`, 640 l. + `home-resolver.mjs`, 109/109 tests) | Accueil — porte universelle, champ NOEMA, 4 modes, menu ＋ | **ABSORBABLE** (vague 3) |
| 2 | `atlas/index.html` (+ `media.js`, 601 l.) | Médiathèque plein écran | **ABSORBABLE** (vague 1) — `media.json` et `build-media.mjs` restent, ce sont des données et un générateur |
| 3 | `loop/index.html` (+ `ui.mjs`, 568 l.) | Écran de la boucle NOEMA | **ABSORBABLE** (vague 2) — `loop/src/*` (le moteur, l'API) et `loop/server.mjs` restent |
| 4 | `point-zero/index.html` (+ `pz.js`, `pz-import.mjs`) | La coquille | l'absorbante |
| 5 | `design-system/index.html` + 18 chapitres (foundations, color, typography, space, motion, icons, components, aime-components, noema-components, patterns, universal-card/timeline/grid, composer, dataviz, responsive, accessibility, qa) | Documentation normative du système (19 chapitres) | **INCONTOURNABLE** — la grammaire n'est pas une page-silo |
| 6 | `design-system/direction.html` (+ `direction.js`) | Atelier de direction artistique, export brief/`tokens.custom.css` | **DÉCISION HUMAINE** (§6, vague 4) |
| 7–17 | `design-system/experiences/` — index, playground, composer, universal-card, timeline, grid, bureau, media-library, noema, public-site, client-portal (11 écrans) | Écrans d'expérience ayant préfiguré les zones de la coquille | **DÉCISION HUMAINE** (§6, vague 4) |
| 18 | `diagnostic/test/fixtures/hierarchy-coquille/index.html` | Fixture du moteur de diagnostic | **FIXTURE** — intouchable |

**Comptage QA mesuré :** le périmètre « 35 écrans audités » (README) se décompose en 19 chapitres + 1 direction + 11 expériences + 1 boucle + 1 atlas + 1 accueil + 1 coquille. `run-qa.mjs` et `verify-dom.mjs` construisent ce périmètre **dynamiquement** (parcours de `design-system/` et `loop/` + liste explicite `index.html`, `atlas/index.html`, `point-zero/index.html`) : supprimer un fichier ne casse pas les scripts, mais **réduit mécaniquement le nombre d'écrans audités** — chaque vague devra donc mettre à jour les textes qui citent ce nombre (README ×3, `design-system/README.md`, `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md`).

## 4. Matrice de couverture — fonction par fonction

Légende : ✓ = présent dans la coquille (CONFIRMED, code) · ◐ = présent partiellement · ✗ = absent (bloquant pour la suppression).

### 4.1 Accueil (`index.html` + `home.js`) — 4 manques

| Fonction de l'accueil | Dans la coquille | Preuve / écart |
|---|---|---|
| Champ d'intention NOEMA + « Lire sans écrire » + « Proposer » | ✓ | rail Z4b : `intend(dry)` contre `/api/intend` réel |
| Menu ＋ : Dossier local | ✓ | `uimport` → `webkitdirectory`, enrichi SHA-256/ZIP/PDF |
| Menu ＋ : Fichiers | ✓ | `uimport` → `multiple` |
| Menu ＋ : Lien GitHub | ◐ | `resolveImport` ne filtre le Bureau que si le dépôt est **dans le catalogue** ; sinon toast honnête — l'accueil proposait en plus le diagnostic du dépôt |
| Menu ＋ : Coller une URL | ✗ | déclaré « étape dédiée » dans la coquille ; l'accueil l'annonçait aussi « en préparation » — parité faible, à trancher |
| Mode Diagnostic (`owner/repo` → commande `node diagnostic/diagnose.mjs …`) | ✗ | `resolveAction` (home.js l.138) produit la commande vérifiable ; rien d'équivalent dans la coquille |
| Mode Direction artistique (→ `direction.html`) | ✗ | aucun lien de la coquille vers l'atelier |
| Mode Médiathèque (→ `atlas/`) | ✓ | le Bureau **est** la médiathèque (projetée) |
| Routeur d'aperçu pur « sans naviguer ni écrire » (109/109 tests) | ◐ | la coquille a ses propres toasts ; le résolveur pur n'y est pas branché |
| Exemples d'intentions (3 entrées du menu) | ✗ | confort, non bloquant |
| Badge runtime + thème | ✓ | Z1, même clé de thème |

### 4.2 Médiathèque (`atlas/`) — 7 manques, tous listés par la spec §4 (« les mêmes fonctions que la médiathèque, **sans exception** »)

| Fonction de l'atlas | Dans le Bureau | Preuve / écart |
|---|---|---|
| Catalogue généré (38 dépôts, 366 médias, couverture) | ✓ | `fetch('../atlas/media.json')` — même source de vérité |
| Viseur : image réelle, jsDelivr + repli raw | ✗ | la coquille affiche `it.url` sans repli ni visionneuse |
| Lecture vidéo/audio **dans la page** | ✗ | cartes de la coquille : image ou tuile type, jamais de lecteur |
| Télécharger le fichier | ✗ | absent (`media.js` l.92 `downloadFile`) |
| Vérifier (contrôle du fichier) | ✗ | absent |
| Copier les liens | ✓ | bouton `Copier` par carte |
| Brief agent structuré (consigne + manifeste JSON) | ✗ | absent (`media.js` l.369 `briefText`) |
| Script `.sh` de récupération | ✗ | absent (`media.js` l.404 `shText`) |
| Sélection multiple + barre d'actions | ✗ | la coquille n'a qu'une sélection unique d'inspecteur |
| Recherche, filtres type/dépôt/provenance | ✓ | nom/type/dépôt ; provenance = bascule source |
| Bascule GitHub/local, classement local sans envoi | ✓ | enrichi : SHA-256, index ZIP/PDF, couverture d'import |
| Doublons par empreinte | ✓ | dossier contextuel `Doublons` |
| URL `?source=local` (deep-link depuis l'accueil) | ✗ | la coquille persiste la source en `localStorage`, pas en URL |

### 4.3 Boucle NOEMA (`loop/`) — 9 manques *(état au 18 sept. matin ; tous absorbés par l'addendum V2-a ci-dessous)*

| Fonction de l'écran loop | Dans la coquille | Preuve / écart |
|---|---|---|
| Intention (lecture/écriture) | ✓ | rail Z4b, acteur requis côté routeur |
| Propositions ouvertes + Valider/Refuser attribués | ✓ | `/api/decide` ; le refus 400 sans acteur tient depuis la coquille |
| « Faire observer NOEMA » (`/api/observe`) | ✗ | absent |
| Actions : autoriser puis exécuter (`/api/authorize`, `/api/execute`) | ✗ | absent — les deux actes distincts ne sont projetés nulle part dans la coquille |
| Retenues sous le seuil, affichées comme retenues | ◐ | comptées dans la sortie d'intention ; pas de section dédiée |
| Journal append-only (acteur, cause, horodatage) | ✗ | absent |
| Monde (toutes entités en grille) | ◐ | le tiroir Cartes liste les entités ; pas la vue « monde » complète |
| Timeline 6 modes | ✓ | `/api/timeline`, sélecteur de mode |
| Granularités année→minute | ✗ | SEMAINE codée en dur dans l'appel |
| Mémoire — les huit droits (`/api/rights`, `/api/memory/*`) | ✗ | absent |
| Preuves | ✗ | absent |
| Réinitialisation (`/api/reset`) | ✗ | absent |
| Synchronisation flux↔carte par `entity_ref` | ✓ | **en avance sur l'écran loop**, qui ne le fait pas |

### 4.4 Surfaces qui ne sont pas des candidates

- **`design-system/` (19 chapitres + qa.html)** : la grammaire et son rapport. La coquille s'appuie dessus (ses patterns `pz-*`/`dock`/`uimport` y sont jugés) ; elle ne les absorbe pas. Le badge QA de Z1 pointe vers `qa.html` comme « détail » — exactement le rôle prévu par la spec §3.
- **`diagnostic/`** : moteur terminal + README. L'accueil en fait un mode ; la coquille pourrait exposer la commande générée (vague 3), mais le diagnostic lui-même n'est pas une page à absorber.
- **`api/[[...route]].mjs`**, `loop/src/*`, `atlas/build-media.mjs`, `atlas/media.json` : moteurs et données — jamais des pages.

## 5. Ce que Point Zero ne doit jamais absorber

1. **La documentation du système** — remplacer les chapitres par la coquille serait confondre la grammaire et une de ses phrases.
2. **Les moteurs** (`loop/src`, `diagnostic/`, `build-media.mjs`) — la coquille consomme leurs APIs ; elle n'est pas leur hôte exclusif (la fonction serverless `api/[[...route]].mjs` sert le même routeur sans coquille).
3. **La fixture de diagnostic** — elle sert à mesurer, pas à être vue.
4. **L'atelier `direction.html` tant qu'une décision humaine n'existe pas** — son mécanisme (override de tokens + export) est le modèle de l'inspecteur « fondé sur le système, modifiable » (spec §6) ; l'absorber avant que l'inspecteur sache appliquer un override serait perdre un outil qui marche.

## 6. Plan de suppression progressive — quatre vagues, zéro suppression sans parité

Chaque vague est **publiable indépendamment** et suit le même contrat : d'abord la parité (fonctions manquantes portées dans la coquille + smokes), ensuite seulement la suppression, avec toutes ses dépendances mécaniques mises à jour dans le même changement.

### Vague 0 — aujourd'hui : aucune suppression, un pivot

Aucune page n'est supprimable tant que §13-1 n'est pas satisfait. La seule action immédiate est de faire de la coquille le **pivot affiché** : elle l'est déjà dans la navigation de l'accueil (« Point Zero » en premier lien) — ce statut est confirmé, rien d'autre n'est nécessaire.

### Vague 1 — le Bureau absorbe la médiathèque → suppression de `atlas/index.html`

**Tranche de parité (les 7 fonctions, spec §4) :**
1. visionneuse réelle avec repli raw (reprendre le mécanisme `media.js`) ;
2. lecture vidéo/audio dans le panneau (lecteur `umedia`) ;
3. téléchargement ;
4. vérification ;
5. brief agent + manifeste JSON ;
6. script `.sh` de récupération ;
7. sélection multiple avec barre d'actions (copier liens / brief / `.sh`).

**Gates de suppression :** smokes de parité (modèle `smoke-medias-v2.mjs`, re-ciblés sur `point-zero/index.html`) · QA 12/12 · verify DOM complet · revue manuelle « chaque carte du Bureau offre les mêmes fonctions ».
**Dépendances mécaniques de la suppression :** `run-qa.mjs` et `verify-dom.mjs` (retirer `atlas/index.html` de la liste explicite) · `smoke-medias-v2.mjs` (chemins absolus vers `atlas/index.html`) · liens dans `index.html` (nav, pied, « quatre entrées », menu ＋) et `home.js` (destination `atlas/`) · `<noscript>` de `point-zero/index.html` · section Médiathèque du README · comptage « 35 écrans » des textes.
**Ce qui reste :** `atlas/media.json`, `atlas/build-media.mjs`, les smokes re-ciblés.

#### Addendum V1-a — tranche de parité LIVRÉE (18 sept. 2026)

| Fonction (spec §4) | Livrée dans le Bureau | Preuve (smoke `design-system/qa/smoke-point-zero-bureau.mjs`) |
|---|---|---|
| 1. Visionneuse réelle | `mediaThumb()` : image jsDelivr + `data-fallback` raw ; 1er échec → repli, 2e → tuile « inaccessible — voir la source » | 4 tests |
| 2. Lecture vidéo/audio dans le panneau | `<video controls preload=metadata>` / `<audio controls>` sur la vraie source ; un seul lecteur à la fois ; dépôt privé → tuile honnête, pas de lecteur | 5 tests |
| 3. Télécharger | `downloadFile()` : local = objet du navigateur (zéro réseau) ; distant = CDN → repli raw → ouverture de la source (jamais un téléchargement simulé) | 4 tests |
| 4. Vérifier | `verifyFile()` : distant = sha1 « blob » git des octets servis (CDN puis raw) comparé au `sha` du catalogue ; local = SHA-256 recalculé sur l'objet ; sans octets → « non vérifiable », jamais « conforme » | 4 tests |
| 5. Brief agent + manifeste JSON | `briefText()` : consigne + manifeste (`url_cdn`, `url_repli`, `empreinte`, `verification` — `null` si non vérifié) | 4 tests |
| 6. Script `.sh` | `shText()` : curl CDN ‖ raw, ligne `git hash-object` de contrôle d'empreinte, LOCAL/SANS-URL avoués | 3 tests |
| 7. Sélection multiple | `Bureau.selected` + barre `#pz-selbar` (liens · brief · .sh · tout cocher visibles · effacer), case aussi dans l'inspecteur | 6 tests |

Mode local : mêmes fonctions, zéro requête réseau (4 tests). Total **38/38**.

**Défaut préexistant corrigé au passage :** `ingestFiles()` (P4) comparait le retour de `classifyName()` — un objet `{ ext, kind }` — à la chaîne `'archive'` : aucun fichier local n'était reconnu (ni aperçu, ni index ZIP, ni filtre de type). Le smoke local l'a révélé ; corrigé par déstructuration.

**Gates re-mesurées après la tranche :** QA 12/12 · verify DOM 35/35 sans erreur · smokes atlas 69/69 (inchangés — `atlas/index.html` est toujours là) · import 31/31 · résolveur 109/109 · boucle 36/36 API.

**Reste avant suppression d'`atlas/index.html` :** revue humaine « chaque carte du Bureau offre les mêmes fonctions » dans un navigateur réel (lecteurs, téléchargement, CORS du CDN pour la vérification — jsdom ne les couvre pas), puis l'étape 2 de la vague (dépendances mécaniques listées ci-dessus, dans le même changement).

#### Addendum V1-b — suppression EXÉCUTÉE (18 sept. 2026, validation humaine « ok go »)

Supprimés : `atlas/index.html`, `atlas/media.js`. Conservés : `atlas/media.json`, `atlas/build-media.mjs` (le catalogue et son générateur — source de vérité du Bureau).

Dépendances re-ciblées dans le même changement :

| Dépendance | Avant | Après |
|---|---|---|
| `design-system/qa/run-qa.mjs`, `verify-dom.mjs` | liste explicite avec `atlas/index.html` | retirée ; périmètre **34 écrans** (commentaire mis à jour) |
| `design-system/qa/smoke-medias-v2.mjs` | 28 smokes atlas + accueil | smokes atlas retirés (prouvés par `smoke-point-zero-bureau.mjs`) ; accueil 41/41 dont « aucun lien `atlas/` ne subsiste » |
| `index.html` (nav, menu ＋, « quatre entrées », pied) | `atlas/` | `point-zero/#pz-bureau` ; l'entrée 01 dit qu'elle vit dans la coquille |
| `home.js` + `home-resolver.mjs` (+ test) | destination `atlas/` ; Dossier local → `atlas/index.html?source=local` | `point-zero/#pz-bureau` ; `point-zero/index.html?source=local` |
| `point-zero/pz.js` | pas de grammaire d'URL | `?source=local` → mode local + ＋ ouvert (3 smokes) |
| `point-zero/index.html` `<noscript>` | lien vers la page atlas | lien vers le catalogue `atlas/media.json` |
| README (×3 comptages, section Médiathèque, Point Zero), `design-system/README.md`, spec §13-7 | « 35 écrans », « 34 autres » | « 34 écrans », « 33 autres » |

Gates après suppression : QA 12/12 sur 34 écrans · verify DOM 34/34 · smokes Bureau 41/41 · smokes accueil 41/41 · résolveur 109/109 · import 31/31 · boucle 36/36.

Non touché, volontairement : `diagnostic/report.mjs` (mesure le dépôt tel qu'il est, n'importe pas la page) · `AUDIT/MEDIA-ATLAS-01.md` (historique, reste vrai comme audit des mécanismes).

### Vague 2 — le dock et le rail absorbent l'écran de la boucle → suppression de `loop/index.html`

**Tranche de parité (les 9 fonctions) :** observer · autoriser/exécuter les actions · retenues en section dédiée · journal · vue monde · les huit droits mémoire · preuves · réinitialisation · granularités de la timeline. Le tout en projection pure — les règles vivent déjà dans `loop/src/http.mjs`.
**Gates :** parité + « une décision sans acteur est refusée (400) depuis la coquille » démontré par test · boucle `npm test` vert après adaptation.
**Dépendances mécaniques, mesurées — c'est la vague la plus câblée :**
- `loop/server.mjs` : la racine `/` sert `loop/index.html` — il faut décider ce que sert la racine du serveur local (proposition : `point-zero/index.html`) ;
- `loop/test/api.mjs` : trois tests affirment que `/` sert l'écran de la boucle (contenu « NOEMA propose »), que `/loop/` et `/design-system/` servent leur index, et que `/loop/ui.mjs` est servi ;
- `loop/test/smoke-deployed.mjs` : vérifie `/loop/` 200 + le titre exact « Boucle minimale — AIME / NOEMA » sur l'hôte réel — le smoke post-déploiement doit être re-ciblé sur la coquille (vérifier `/point-zero/` + son titre), sinon la gate de déploiement devient fausse ;
- `run-qa.mjs`/`verify-dom.mjs` parcourent `loop/` : la suppression retire un écran du périmètre, les textes de comptage suivent ;
- liens de l'accueil, fil d'ariane de la page supprimée, README section Boucle.
**Ce qui reste :** tout `loop/src/`, `seed.mjs`, `server.mjs`, les tests adaptés.

#### Addendum V2-a — tranche de parité LIVRÉE (18 sept. 2026, validation « ok »)

Les neuf manques de §4.3 sont absorbés, en projection pure : `pz.js` ne contient aucune règle métier nouvelle — chaque acte est un appel à `loop/src/http.mjs`, chaque écran une re-projection de `state` par une fonction unique `applyState(state)` (rail, cartes, actions, retenues, journal, preuves, sujets, compteurs, inspecteur).

| Manque §4.3 | Livré dans la coquille | Preuve (smoke `design-system/qa/smoke-point-zero-loop.mjs`, **vraie boucle** sur monde jetable) |
|---|---|---|
| 1. « Faire observer NOEMA » | bouton **Observer** en tête du rail Z4 → `/api/observe` ; toast « écrites / retenues » | 5 tests — dont « aucun fait n'a été écrit, seules des `prop-` sont apparues » |
| 2. Actions : autoriser **puis** exécuter | onglet **Actions** du tiroir Cartes : périmètre · risque · réversibilité du registre, bouton Autoriser (`/api/authorize`, `grant:true`) puis, séparément, Exécuter (`/api/execute`) ; badge de compte sur l'onglet | 7 tests — dont « valider une intention ne l'exécute pas » et « exécution anonyme refusée (400) » |
| 3. Retenues | onglet **Retenues** : kind · cible · confiance · titre ; l'absence est nommée | 2 tests |
| 4. Journal | onglet **Journal** : table 5 colonnes (horodatage · opération · type/id · acteur · cause) sur les 40 dernières entrées du serveur | 3 tests |
| 5. Monde | onglet **Monde** : toutes les entités, source · auteur, badge de provenance porté par la forme (`nstate`) | 3 tests |
| 6. Les huit droits | onglet **Droits** : sujet (personnes · projets · objets) + 8 boutons → `/api/memory/<droit>` ; le refus serveur est affiché tel quel (`a-state--error`), jamais adouci | 13 tests — dont « PAUSER puis PARTAGER : le serveur refuse, la coquille le montre », « droit anonyme → 400 », « huit `right:*` au journal » |
| 7. Preuves | onglet **Preuves** (`viz-proof`) : type · référence · cible cliquable (`data-card`) | 3 tests |
| 8. Réinitialisation | bouton **Réinitialiser** (ghost) : 1er clic arme 6 s + « Confirmer la réinitialisation » ; 2e clic → `/api/reset` ; toutes les projections suivent | 3 tests |
| 9. Granularités | `<select>` 7 granularités (ANNÉE→MINUTE) envoyé au moteur ; buckets, capacités et retards publiés ; « +1 jour » n'apparaît que si le moteur publie `MOVE` (READ : aucun bouton) | 6 tests |

Règle cœur re-démontrée depuis la coquille : décision, exécution et droit **sans acteur → 400** (3 tests) ; chaque requête POST porte `actor: point.zero.shell` (décision d'attribution : la coquille signe en son nom, distinct du `a.meunier` de l'écran loop). Total **50/50**.

**Défaut préexistant corrigé au passage (`loop/src/noema.mjs`) :** `propose()` écrivait les propositions d'observation avec un identifiant calculé par un compteur **local** au module (`prop-0001…`), remis à zéro à chaque observation, alors que `store.create` numérote par `db.sequence`. Conséquence : la première intention soumise après une observation retombait sur `prop-000N` déjà pris — et si cette proposition avait été **acceptée**, le store refusait (à raison) de rétrograder un fait confirmé : l'intention échouait avec « exige une décision humaine (cause: 'supersede') ». L'identifiant vient désormais du store ; l'écran loop souffrait du même défaut sans le montrer. Boucle `npm test` : 91 + 36 verts, inchangés.

**Gates re-mesurées après la tranche :** QA 12/12 · verify DOM 34/34 · smokes Bureau 41/41 · smokes NOEMA 50/50 · boucle 36/36 API.

**Reste avant suppression de `loop/index.html` (feu vert humain requis) :** revue dans un navigateur réel (le tiroir en 6 onglets, le tiroir timeline en PLAN avec déplacement) ; puis, dans le **même changement**, les dépendances mécaniques listées ci-dessus : racine `/` de `loop/server.mjs` → `point-zero/index.html`, les trois tests de `loop/test/api.mjs`, `smoke-deployed.mjs` re-ciblé sur `/point-zero/` et son titre, `run-qa.mjs`/`verify-dom.mjs` (33 écrans), liens de l'accueil, README section Boucle, `loop/ui.mjs` (n'a plus de lecteur).

### Vague 3 — la coquille absorbe l'accueil → l'accueil devient un seuil

**Tranche de parité (les 4 fonctions) :** mode Diagnostic (générer la commande `node diagnostic/diagnose.mjs --owner O --repo R` en aperçu sans écriture — prolongement naturel de `resolveImport`), lien Direction artistique, branchement du résolveur pur `home-resolver.mjs` (109/109, il survit à la page), décision explicite sur l'URL distante (l'accueil la disait déjà « en préparation » — la parité peut être « les deux disent la même chose »).
**Choix de seuil (décision humaine, §8-D2) :** soit `index.html` devient une page seuil minimale redirigeant vers `/point-zero/`, soit la coquille devient la racine. La première option respecte la philosophie « la porte universelle » du README et préserve les entrées statiques (Vercel sert `index.html` à la racine) ; elle garde aussi un lieu pour le `noscript` et le contrat « lu statiquement, rien ne simule ».
**Dépendances mécaniques :** `run-qa.mjs`/`verify-dom.mjs` liste explicite · `smoke-medias-v2.mjs` section accueil · `home-resolver.test.mjs` (le module pur reste, la page change) · README « Page d'accueil » · liens `../index.html` depuis `atlas/` (déjà supprimé en vague 1), `point-zero/` (`pz__brand`).
**Ce qui reste :** `home-resolver.mjs` et ses 109 tests (fonction pure réutilisée par la coquille).

### Vague 4 — décision sur les références : expériences et atelier

- **Les 11 écrans d'expérience** ont préfiguré les zones que la coquille réalise désormais en vrai. Deux issues honnêtes : (a) **gel** — ils restent la démonstration de la grammaire, au prix d'une maintenance doublonnée avec la coquille ; (b) **suppression** de ceux dont la zone est réalisée (bureau, media-library, timeline, universal-card, grid, composer, noema au minimum) — rien ne casse techniquement (le périmètre QA est dynamique), mais le nombre d'écrans audités baisse et chaque texte qui le cite doit suivre. **NI l'une NI l'autre ne sera faite sans validation humaine** : ce sont des écrans du système, pas des pages-silos.
- **`direction.html`** : à ne toucher qu'une fois l'inspecteur capable d'appliquer un override de tokens à la composition courante (spec §6) — jusque-là c'est le seul lieu où le mécanisme est prouvé.

### Ordre recommandé

```text
Vague 1 (atlas)  →  Vague 2 (loop)  →  Vague 3 (accueil)  →  Vague 4 (décision références)
     7 fonctions        9 fonctions        4 fonctions           arbitrage humain
```

La vague 1 est la plus encadrée par la spec (§4 l'exige littéralement) et la moins câblée dans les tests ; c'est par elle qu'il faut commencer. La vague 2 est la plus câblée (serveur, tests, smoke de déploiement). La vague 3 est un choix de produit. La vague 4 est un arbitrage.

## 7. Garde-fous

| Risque | Gravité | Garde-fou |
|---|---|---|
| Supprimer avant la parité = perte de fonction | élevé | gate §13-1 par vague : smokes de parité + revue, aucune suppression dans le même changement que la parité — deux temps, deux mesures |
| Liens morts / 404 après suppression | élevé | précédent mesuré : le 404 de `/loop/` avait été trouvé exactement ainsi ; chaque vague embarque un test de navigation (serveur local + grep des références) |
| Le périmètre QA silently rétréci | moyen | le comptage est dynamique (rien ne casse) mais les textes citent « 35 écrans » : mise à jour obligatoire dans le même changement, et mention explicite dans le README que le périmètre converge avec le produit |
| La coquille devient la seule surface et concentre les pannes | moyen | l'honnêteté hors ligne reste : chaque zone dit quand son moteur est absent ; les moteurs et leurs hôtes (serveur local, fonction serverless) survivent à toutes les suppressions |
| Tests de déploiement faux après vague 2 | élevé | `smoke-deployed.mjs` re-ciblé **avant** la suppression, sinon la gate post-déploiement valide un écran qui n'existe plus |
| Confondre vitesse et convergence | moyen | une vague = un PR = une parité mesurée ; « petit à petit » est le contrat, pas un défaut |

## 8. Décisions demandées (validation humaine — la boucle l'exige)

1. **Valider le plan en quatre vagues** et son ordre (atlas → loop → accueil → références), chaque suppression restant conditionnée à sa gate de parité.
2. **Choisir le seuil** (vague 3) : accueil réduit en page de redirection vers `/point-zero/`, ou coquille à la racine.
3. **Trancher le sort des 11 écrans d'expérience** (vague 4) : gel ou suppression partielle — après les vagues 1–3, quand la coquille aura prouvé la parité en usage réel.
4. **Confirmer `direction.html` comme atelier référencé** tant que l'inspecteur ne sait pas appliquer un override de tokens.

## 9. Limites de cet audit (déclarées, comme la couverture d'un scan)

- La parité est mesurée par inspection du code et des tests (91+36 boucle, 109 résolveur, 31 import, QA 12/12 du 18 sept.), pas par test navigateur réel — la vague 1 a produit ses smokes jsdom dédiés (38/38, addendum V1-a) ; la lecture effective des lecteurs HTML5 et la politique CORS du CDN restent à observer dans un navigateur.
- `atlas/media.json` date du 17 sept. 2026 ; rejouable (`node atlas/build-media.mjs`).
- Le comptage « 36 fichiers HTML » inclut la fixture de diagnostic ; toute génération future de page par le diagnostic dans `.work/` est hors périmètre (comportement déjà exclu par `run-qa.mjs`).
- Les géométries réelles de la coquille (repli des panneaux < 1024 px) ne sont pas vérifiables sous jsdom — limite déjà déclarée par `verify-dom.mjs`.

---

> **Proposition AIME — la convergence est prête en architecture, mesurée en écarts, planifiée en vagues. Supprimer reste votre décision, et jamais avant la parité. *NOEMA propose. L'humain valide.***
