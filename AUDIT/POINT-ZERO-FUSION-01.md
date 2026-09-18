# AUDIT — POINT ZERO · FUSION DE L'INTERFACE — 01

**Date :** 18 septembre 2026
**Branche :** `arena/01a0b3ba-aime-composer`
**Cible auditée :** `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md` — l'interface unique (grille universelle au centre, panneaux latéraux rétractables, dock Timeline/Cartes/＋, Bureau à gauche, Inspecteur + NOEMA à droite, header format/projet/QA).
**Méthode :** l'existant est mesuré, pas décrit de mémoire. Niveaux d'évidence hérités de MASTER-ARCHITECTURE-V1 §16 : `CONFIRMED` (code ou mesure inspectés directement), `DOCUMENTED` (spec auditée, pas encore d'implémentation), `CONCEPT` (intention), `NOT_AUDITED` (preuve insuffisante).
**Périmètre :** ce dépôt. Les dépôts sources (DISPOO, OPUS, AIME Desktop…) restent des références, jamais des copies.

---

## 1. Synthèse

**Verdict : la cible POINT ZERO est fondée architecturalement, et elle est plus proche qu'elle ne paraît.** Chaque zone demandée possède déjà soit du code CONFIRMED, soit une spec DOCUMENTED cohérente avec le code — il n'y a aucune contradiction entre la vision et l'architecture consolidée (MASTER, FINAL-CONVERGENCE, UNIVERSAL-GRID, TIMELINE-UNIVERSELLE, BUREAU). Au contraire : la cible demandée est *exactement* la composition que ces documents préparaient (CANVAS + TIMELINE + INSPECTOR de GRILLE §8, Bureau universel, une sélection trois projections).

Mesuré aujourd'hui :

| Organe | Preuve vivante | État |
|---|---|---|
| Design System | `npm run qa` → **12/12 familles conformes, 80/80 paires de contraste, 34 écrans, 86 icônes, 10 feuilles CSS** | CONFIRMED |
| Boucle NOEMA | `npm test` → **91 tests unitaires + 36 tests API réussis** ; décision sans acteur refusée (400) sur le même routeur aux deux hôtes | CONFIRMED |
| Médiathèque (atlas) | `atlas/media.json` (17 sept. 2026) : **38 dépôts · 366 médias** (338 images, 7 vidéos, 21 vecteurs, **0 audio**) · **119 doublons par empreinte** · 0 erreur · scan non tronqué — couverture publiée | CONFIRMED |
| Entrée universelle (accueil) | `home-resolver.test.mjs` → **109/109** ; menu « ＋ » déjà livré (Dossier local, Lien GitHub, Coller URL) + aperçu « Lire sans écrire » | CONFIRMED |
| Diagnostic | même moteur QA appliqué à n'importe quel projet (local ou GitHub) — survey : 18 projets · 80 écrans · 8 398 problèmes (`AUDIT/DIAGNOSTIC-SURVEY-V1.md`) | CONFIRMED (rapport généré de mesure) |
| Moteur spatial interactif (canvas : drag, snap réel, guides déplaçables) | n'existe pas — `ugrid` est une projection statique conforme, sans comportement | **ÉCART PRINCIPAL** |
| Dock (trois segments + tiroirs) | n'existe pas comme pattern ; toutes ses briques existent | ÉCART MOYEN |
| Coquille fusionnée (une page, cinq zones, rétraction) | n'existe pas ; `l-shell`/`l-pane` livrent les primitives | ÉCART MOYEN |

**Ce qui sépare l'existant de POINT ZERO tient en trois chantiers** — un moteur d'interaction (canvas + dock), une coquille (assemblage + état de présentation), et l'ingestion multi-formats (PDF/ZIP). Tout le reste est un branchement de ce qui est déjà prouvé et testé.

## 2. État mesuré de l'existant (preuves, pas promesses)

### 2.1 Design System — la grammaire est complète et en vigueur

- 23 primitives couleur, 21 rôles × 2 thèmes, contrat de contraste appliqué à la génération (le build refuse une couleur hors cible).
- 9 rôles typographiques, échelle d'espacement fermée à 10 pas, 7 primitives de mouvement avec durées nommées.
- **86 glyphes · 17 catégories · 0 emoji** — dont déjà : `grd-grid/grd-guides/grd-snap/grd-ruler/grd-format`, `time-*` (timeline, playhead, history), `med-*` (image, video, audio, library), `act-add` (le « ＋ »), `noe-mark` + 6 états épistémiques, `cmp-*` (composer, node, connect), `set-sliders` (réglages inspecteur).
- **Les cinq organes sont livrés en CSS** (`aime.css`, 420 lignes) : `ucard` (8 types, états proposed/superseded/inconnu), `umedia` (7 formats + visionneuse lecteur), `utl` (marqueurs typés, mode COMPOSE à lanes/clips/ruler déjà stylé), `ugrid` (7 profils `data-format` dont A5, carte, 16:9, 9:16, web, **stitch** — colonnes, zone sûre, fond perdu, tiers), `composer` (palette, `cnode`, `clink`, toolbar).
- **Les patterns structurels existent** : `ohead` (tête d'objet), `cmdbar` (palette de commandes), `inspector` (groupes, rangées dt/dd — aime.css §fin, documenté dans `patterns.html`), `l-shell` (top/main/foot), **`l-pane--start` (280 px) / `l-pane--end` (340 px)**, `l-canvas` (fond pointillé), `l-guide` (guides positionnés par variables `--a-x/--a-y`) ; le ratio d'or 1,618 est en token (`--aime-ratio-golden`) et sert déjà les partitions (`l-split--golden`, `l-shell__main--3` au breakpoint 1024 px).
- 13 patterns, langage dataviz, couche NOEMA complète (`noema.css`) : 6 états portés par la forme, provenance `prov`, confiance en 3 niveaux jamais en pourcentage.
- **`direction.html`** prouve le mécanisme « fondé sur le design system, modifiable » : direction artistique *dans* le système par override de tokens, aperçu en direct, export `tokens.custom.css` — appliquer reste une décision humaine re-mesurée par le diagnostic.
- 34 écrans livrés audités, dont **11 écrans d'expérience** qui préfigurent chaque zone : `bureau.html`, **`composer.html` (déjà trois colonnes : palette · canvas+timeline compacte · inspecteur)**, `grid.html`, `timeline.html`, `universal-card.html`, `media-library.html`, `noema.html`, `playground.html`, `public-site.html`, `client-portal.html`, index des expériences.

**Conclusion de mesure : la cible ne demande aucun style que le système ne sache expliquer.** Le dock et la coquille seront des extensions du système (patterns `pz-*`/`dock`/`uimport` proposés), soumises aux mêmes 12 familles — c'est la règle §10 du DS et la règle permanente d'INNOVATION-OPPORTUNITES.

### 2.2 Boucle NOEMA — l'agent est déjà une API gouvernée

`loop/src/http.mjs` — un seul routeur, deux hôtes (serveur local à persistance disque atomique / fonction serverless à démo mémoire honnête) :

```text
/api/state · /api/observe · /api/intend · /api/decide · /api/authorize ·
/api/execute · /api/posture · /api/timeline · /api/timeline/moteur ·
/api/timeline/move · /api/timeline/complete · /api/rights · /api/memory/* · /api/reset
```

- Les modules (`noema.mjs` 439 l., `governance.mjs` 450 l., `timeline.mjs` 324 l., `intention.mjs` 284 l., `schema.mjs` 361 l., `action.mjs` 183 l., `store.mjs` 124 l.) portent **toutes** les règles que le rail NOEMA de POINT ZERO devra projeter : extraction d'intention, confiance sous seuil = silence, provenance obligatoire à l'écriture, droits de mémoire (`/api/rights`, `/api/memory/:right`), refus d'une décision sans acteur (400) sur tout hôte.
- `ui.mjs` (568 l.) prouve qu'un écran peut être **sans aucune règle métier** : il affiche ce que l'API renvoie. C'est le modèle exact des quatre projections de la coquille.
- Badge d'honnêteté du runtime (`server · persisté` vs `serverless · démo réinitialisée à froid`) déjà publié dans `/api/state` et affiché — directement réutilisable dans le header Z1.

### 2.3 Médiathèque — le panneau Bureau existe déjà en page entière

`atlas/` : catalogue **généré, jamais manuscrit** ; scan transversal des arbres git (38/38 dépôts, sous-arbres descendus si troncature GitHub, budget plafonné et signalé) ; viewer réel (jsDelivr, repli raw) ; **vidéo et audio joués dans la page** ; mode local (dossier lu et classé dans le navigateur — photos/vidéos/audio/vecteurs — rien d'envoyé, chemins relatifs = provenance, contrat Bureau) ; recherche, filtres type/provenance, bascule GitHub/local **entièrement client-side** ; chaque carte : télécharger, vérifier, copier liens, **brief agent + manifeste JSON**, script `.sh`. Smokes comportementaux dédiés (`smoke-medias-v2.mjs`, 5 familles).

**Donc : Z2 = la médiathèque, intégrée dans un `l-pane` et augmentée des dossiers contextuels. Zéro fonction à réinventer.**

### 2.4 Entrée universelle — le « ＋ » a déjà un résolveur pur à 109 tests

`home.js` (640 l.) + `home-resolver.mjs` dupliqué pour test : résolution pure `resolveAction(raw, mode) → { intention, label, destination, aperçu }` ; garde-fou « Diagnostic GitHub uniquement si parse réussit » ; aperçu universel **sans naviguer ni écrire**. C'est le noyau du contrat d'import universel §8 de la spec — à étendre (PDF, ZIP, dépôt complet) sans changer sa nature (pur, testé, en un seul endroit).

### 2.5 Diagnostic — l'analyse QA du header existe déjà comme moteur

Le même moteur que la QA des 34 écrans juge n'importe quel dossier/dépôt, publie une **densité** et des familles, jamais un score inventé ; CONTRAST exclu par honnêteté de périmètre. La spec EAA (`NOEMA-ACCESSIBILITY-ENGINE-EAA-V1.md`, 569 l., DOCUMENTED) fournit le pack de contrôle ; **garde-fou hérité** : un contrôle automatisé n'est jamais présenté comme une certification (FINAL-MISSING-ORGANS §12).

## 3. Cartographie de la cible — exigence → existant → écart

Légende classification (MASTER §15) : `REUSE_DIRECT` · `REUSE_ADAPT` · `REFERENCE_ONLY` · `SOURCE_DEPENDENT` · `À CONSTRUIRE`.

### Z1 · Header (projet, format, QA, NOEMA, thème)

| Exigence | Existant | Écart | Classification |
|---|---|---|---|
| Tête d'objet (projet, états, actions) | pattern `ohead` + `experiences/composer.html` | sélecteur de projet branché sur mémoire | REUSE_ADAPT |
| Choix de format web/print/social/broderie | spec FormatProfile (GRILLE §4, DOCUMENTED) + 7 `data-format` CSS | le sélecteur doit *reprojeter* le canvas (avertissements débordement, GRILLE §12) | REUSE_ADAPT |
| Choix EAA | spec moteur EAA (569 l., DOCUMENTED) | pack de contrôle = nouvelle famille QA projetée | REFERENCE_ONLY → à brancher |
| Analyse QA dans le header | moteur `diagnostic/` CONFIRMED | projection inline (densité + familles) | REUSE_DIRECT (moteur) / À CONSTRUIRE (projection) |
| Badge NOEMA honnête + thème | `/api/state` runtime + clé de thème partagée | rien | REUSE_DIRECT |

### Z2 · Bureau gauche (dossiers, Local, modes par type, cartes + fonctions)

| Exigence | Existant | Écart | Classification |
|---|---|---|---|
| Cartes médias + fonctions (voir/télécharger/vérifier/liens/brief/.sh) | `atlas/` complet, 366 médias référencés | compaction en panneau | REUSE_ADAPT |
| Modes visuel/vidéo/audio/vecteur/document | filtres typés atlas + tuiles type | onglet audio = constat « 0 audio commité » à afficher tel quel | REUSE_DIRECT |
| Mode Local | ingest local du navigateur (atlas) | relire un dossier, delta (INNOVATION P2.6, CONCEPT) | REUSE_ADAPT |
| Source GitHub tous dépôts | scan transversal + couverture | rafraîchissement à la demande depuis la coquille | REUSE_ADAPT |
| Dossiers contextuels (Magic Folder) | MASTER §11 + regroupements atlas | vues dynamiques nommées (par empreinte, projet, sélection) | À CONSTRUIRE (léger : vues, pas copies) |
| Glisser une carte vers le canvas | — | drag source → placement (MASTER §7) | À CONSTRUIRE (dépend du moteur spatial) |

### Z3 · Grille universelle au centre — le Point Zéro

| Exigence | Existant | Écart | Classification |
|---|---|---|---|
| Profils de format, géométrie automatique (trim/bleed/safe) | spec §4/§6 + `ugrid` statique (colonnes, safe, bleed, tiers, snap mark) | moteur de profil (données → projection) | REUSE_ADAPT |
| Origine 0,0 visible, origine-centre (réticule rouge) | spec §1 (DOCUMENTED) ; inspiration broderie = métier du compte | rendu du réticule + déplacement d'origine | À CONSTRUIRE (rendu simple, borne : métadonnée) |
| Grille magnétique réelle (snap, tolérance, priorités, explication) | spec §2/§7 | **moteur d'accrochage** | À CONSTRUIRE |
| Guides déplaçables/verrouillables | spec §3 + `l-guide` positionné par variables | interaction (drag, clavier, numérique) | REUSE_ADAPT |
| Placement d'objets sur le canvas (drag, resize, alignement) | `cnode`/`umedia` statiques ; COMPOSITION-MODEL (DOCUMENTED) | **moteur spatial** | À CONSTRUIRE — *cœur du chantier* |
| Coordonnées spatiales+temporelles d'un objet | spec §8 (GRILLE) | liaison selection↔clip | À CONSTRUIRE (fin, il y a déjà `start/duration` dans utl) |

### Z4 · Inspecteur droit + Z4b · rail NOEMA

| Exigence | Existant | Écart | Classification |
|---|---|---|---|
| Groupes propriétés (position, texte, image, réglages) type Framer | pattern `inspector` (groupes dl/dt/dd) | rangées éditables (champs `a-input`/`a-select` liés aux tokens) | REUSE_ADAPT |
| Valeurs limitées au système, modifiable par overrides | 9 rôles typo, échelle fermée, `direction.html` (export CSS) | application de l'override à la composition courante + re-mesure | REUSE_ADAPT |
| Édition = proposition tracée (change → impact → cascade) | MASTER §6 + `/api/decide` | UI d'impact avant application | À CONSTRUIRE (projection, règles déjà dans la boucle) |
| Provenance toujours présente | `prov` + `ucard__facts` + `is-unknown` | rien | REUSE_DIRECT |
| Rail NOEMA bas du panneau : intention, propositions, validation | `loop/` entier + champ de `home.js` + 6 états `noema.css` | forme compacte (file réduite + champ), contexte de sélection | REUSE_ADAPT |

### Z5 · Dock (Timeline ◂ · ＋ · Cartes ▸)

| Exigence | Existant | Écart | Classification |
|---|---|---|---|
| Timeline compacte persistante + tiroir montage | `utl` + `utl--compose` déjà stylé (lanes, clips, ruler) + API timeline de la boucle (move/complete bornées, testées) | repli compact ↔ étendu, zoom, synchronisation sélection | REUSE_ADAPT |
| Modes READ/PLAN/COMPOSE/REVIEW/LIVE/HISTORY | spec TIMELINE §2 + pastilles de mode de composer.html | bascule de mode = bascule de projection | REUSE_ADAPT |
| ＋ importer URL/dossier/ZIP/PDF/GitHub/texte | résolveur 109/109 + 3 entrées livrées + ingest local atlas | parse PDF/ZIP local, dédup sha, couverture d'import publiée | REUSE_ADAPT + **À CONSTRUIRE (ingestion multi-formats)** |
| Tiroir Cartes Universelles | `ucard` 8 types + mémoire loop | segment dock + dépôt vers canvas/timeline/NOEMA | REUSE_ADAPT |
| Le dock comme pattern borné (hauteur compacte) | règle TIMELINE §12 généralisée | pattern `dock` nouveau dans le système | À CONSTRUIRE (pattern, pas logique) |

## 4. Traversants vérifiés

1. **Une seule source de vérité** — compatible : la coquille n'a qu'un `ShellState` de présentation (spec §10) ; les moteurs restent les seules vérités. Aucun module de la coquille ne recalcule (précédent positif : `ui.mjs`).
2. **Une sélection, quatre projections** — extension naturelle de canvas↕timeline↕inspecteur (TIMELINE §12) au tiroir Cartes. Contractuellement simple, à tester en DOM.
3. **NOEMA propose, l'humain valide** — aucune zone ne contourne la boucle : imports → propositions ; éditions → changements tracés ; validation → décision attribuée. La coquille ne crée **aucun chemin d'écriture nouveau**, elle consomme `/api/decide`.
4. **Honnêteté d'hébergement** — le badge runtime du header hérite mot pour mot le contrat serverless ; la médiathèque et l'import local conservent « rien n'est envoyé ».
5. **EAA** — la coquille passe par les mêmes cibles (44/24 px, focus outline, zoom 400 %) et ajoute : rétraction au clavier annoncée (`aria-expanded`), overlays petits écrans avec focus piégé (mécanisme `aime-ui.js` éprouvé), motion réduite honorée. Le pack EAA du header est un contrôle affiché, jamais une certification.

## 5. Les vrais chantiers (hiérarchisés)

```text
E1 · MOTEUR SPATIAL DU CANVAS — drag/resize/snap/guides/origine 0,0
     Tout le reste l'attend. Bornes nettes : géométrie canonique ≠ grille
     (GRILLE §2/§12), priorités d'accrochage spécifiées (§7).
E2 · COQUILLE — 5 zones, rétraction (COLLAPSE/EXPAND système), ShellState
     de présentation, état persistant local. Assemblage de primitives
     existantes + 3 patterns proposés.
E3 · DOCK — pattern `dock` + tiroirs + synchronisation sélection/timeline.
E4 · INGESTION MULTI-FORMATS — PDF/ZIP lus localement, couverture d'import,
     dédup par empreinte. Décision à trancher : parseur embarqué (poids)
     vs référence différée. Jamais d'envoi silencieux.
E5 · PROJECTIONS VIVANTES — Bureau←media.json+local, rail NOEMA←loop API,
     QA header←diagnostic. Du branchement, pas de la logique.
E6 · DOSSIERS CONTEXTUELS — vues dynamiques (empreinte/projet/sélection).
```

## 6. Risques et garde-fous

| Risque | Gravité | Garde-fou (déjà dans le corpus) |
|---|---|---|
| Le dock devient une app dans l'app | moyen | règle §12 TIMELINE généralisée (spec §7) : hauteur compacte bornée, un seul tiroir ouvert |
| Canvas libre hors tokens | élevé | DS §2/§10 : si l'écran ne peut être écrit avec le système, on étend le système ; QA 12 familles en gate, refus de publier sinon |
| L'inspecteur écrit un fait sans traçabilité | élevé | toute édition → `/api/decide` avec acteur ; refus 400 sinon ; états portés par la forme |
| Import massif silencieux | élevé | écriture = validation humaine (BUREAU §8) ; couverture d'import publiée ; local jamais envoyé |
| Parseurs PDF/ZIP alourdissent et floutent le contrat local | moyen | décision d'embarquage explicite Phase 4 ; badge honnête si extraction différée |
| 35e écran = coût QA croissant | faible | QA linéaire et déjà automatisée ; smokes dédiés (modèle `smoke-medias-v2`) |
| Duplication coquille ↔ pages existantes | moyen | les 5 surfaces restent lisibles seules pendant la migration ; la coquille absorbe, ne copie pas (règle COMPOSER) |

## 7. Plan par phases (gates mesurables, chaque phase publiable)

| Phase | Livrable | Gate de sortie |
|---|---|---|
| **P0 · Cadrage** *(cette livraison)* | spec + audit | validation humaine de la cible (cette décision) |
| **P1 · Coquille statique** | `design-system/experiences/point-zero.html` (ou `/point-zero/`) : 5 zones assemblées, rétraction, données honnêtes (inconnu affiché, aucune invention) | 12 familles QA conformes (35e écran audité) + `verify` DOM + revue |
| **P2 · Projections vivantes** | Bureau←atlas (GitHub+local), rail NOEMA←loop (intend/decide), QA header←diagnostic, badge runtime | smokes médias au vert dans la coquille ; tests API-panneau sur hôte éphémère ; décision sans acteur refusée depuis la coquille |
| **P3 · Moteur spatial** | drag/drop Bureau→canvas, snap + explication d'accrochage, guides déplaçables, origine 0,0, sélection unique synchronisée (4 projections) | tests d'interaction DOM + QA ; benchmark de régression visuelle (pires paires contraste inchangées) |
| **P4 · Import universel complet** | PDF/ZIP locaux, dédup empreinte, couverture d'import, propositions NOEMA d'ingestion | smoke d'ingestion étendu ; aucune écriture non validée démontrée en test |
| **P5 · Profils avancés** | pack EAA projeté, profil broderie (origine-centre, référence couleur type DMC), projection publication | famille EAA en gate ; QA toujours verte sur 35+ écrans |

Effort relatif : P3 > P4 > P2 ≈ P1 > P5 > P0. Rien dans P1–P2 n'attend P3 : une version utile de la coquille (Bureau + NOEMA + QA + Cartes + Timeline branchés, canvas statique conforme) existe **avant** le moteur spatial.

## 8. Limites de cet audit (déclarées, comme la couverture d'un scan)

- Les smokes jsdom (`verify-dom.mjs`, `smoke-medias-v2.mjs`) n'ont pas été exécutés ici : la devDependency `jsdom` n'est pas installée dans cet environnement. La QA CSS/HTML (12 familles) et tous les tests Node (91+36+109) sont mesurés verts aujourd'hui.
- Les chiffres du survey diagnostic (18 projets, 80 écrans, 8 398 problèmes) datent du 17 sept. 2026 et sont repris de `AUDIT/DIAGNOSTIC-SURVEY-V1.md` (rapport généré de mesure).
- `media.json` date du 17 sept. 2026 ; le scan est rejouable à la demande (`node atlas/build-media.mjs`).
- Aucun test navigateur réel (clavier, lecteur d'écran, zoom) n'a été mené — limite déjà déclarée par `verify-dom.mjs` pour les géométries.
- L'inventaire média hors-git (stockages applicatifs, angle mort audio mesuré) reste `NOT_AUDITED` — INNOVATION P2.5 le traite par lecture de manifests en repli.

## 9. Décisions demandées (validation humaine — la boucle l'exige)

1. **Valider la cible** `ARCHITECTURE/POINT-ZERO-INTERFACE-V1.md` comme direction de fusion (ou l'amender — ce document se relit zone par zone).
2. **Autoriser P1** : construire l'écran de coquille statique, 35e écran audité du système.
3. **Autoriser l'extension du système** : trois patterns (`pz-*`, `dock`, `uimport`) soumis aux mêmes 12 familles.
4. **Arbitrer P4** : parseur PDF/ZIP embarqué vs extraction différée (poids vs immédiateté — peut attendre P3).

> Proposition NOEMA/AIME — appliquer reste votre décision. *NOEMA propose. L'humain valide.*
