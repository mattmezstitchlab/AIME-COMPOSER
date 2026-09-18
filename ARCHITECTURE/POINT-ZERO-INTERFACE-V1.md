# POINT ZERO — INTERFACE UNIVERSELLE V1

**Statut :** PROPOSÉ puis **VALIDÉ par l'humain (18 sept. 2026)** — Phases 1 à 5 livrées (18 sept. 2026) : coquille, dossiers contextuels (Bureau), moteur spatial magnétique + clavier + synchronisation timeline↔carte, import local réel pur zéro-dépendance (`pz-import.mjs` : ZIP/PDF/SHA-256, couverture publiée, intention NOEMA sans envoi automatique), pack de contrôle EAA en signaux automatiques. Mesures : addendum d'`AUDIT/POINT-ZERO-FUSION-01.md`.
**Dépend de :** UNIVERSAL-GRID-V1 · TIMELINE-UNIVERSELLE-V1 · UNIVERSAL-BUREAU-DOCUMENTS-V1 · AIME-DESIGN-SYSTEM-V1 · NOEMA-CONSTITUTION-V1 · FINAL-CONVERGENCE-V1 · FINAL-MISSING-ORGANS-V1
**Audit d'alignement :** `AUDIT/POINT-ZERO-FUSION-01.md` — l'audit mesure l'existant contre cette cible ; ce document définit la cible.

## 1. Définition

POINT ZERO est **l'interface unique** de AIME-COMPOSER : une seule coquille qui fusionne les cinq organes (Carte, Média, Timeline, Grille, Composer), le Bureau, le diagnostic et NOEMA — au lieu de les laisser dispatcher sur des pages séparées.

Le nom vient de la Grille Universelle : UNIVERSAL-GRID-V1 §1 prévoit un mode **origine-centre** avec un réticule `0,0` visible, inspiré des flux broderie/patron. Le point zéro est le point où commence tout projet : la grille au centre de l'écran, l'origine au centre de la grille, et tout le reste — panneaux, dock, agent — en orbite autour.

```text
ORIGINE 0,0  →  GRILLE  →  COMPOSITION  →  PROJET  →  EXPÉRIENCE
```

Un seul principe structurel, hérité de FINAL-CONVERGENCE-V1 :

> **UNE MÉMOIRE · UNE SÉLECTION · UNE COQUILLE · PLUSIEURS PROJECTIONS**

Aucune zone de POINT ZERO ne recalcule une règle métier et ne détient une copie concurrente d'une donnée canonique. La coquille entière est une projection : elle affiche ce que les moteurs (loop, atlas, diagnostic, design system) savent déjà.

## 2. Anatomie

Cinq zones fixes, quatre rétractables, une toujours visible (Z3).

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Z1 · HEADER                                                          │
│ projet · PROFIL DE FORMAT (web / print / social / broderie / EAA)    │
│ · QA · état NOEMA · thème                                            │
├──┬────────────────────────────────────────────────────────┬──────────┤
│  │                                                        │          │
│  │                     Z3 · CANVAS                        │  Z4 ·    │
│  Z2 · BUREAU              GRILLE UNIVERSELLE               │ INSPECT- │
│ (rétractable)             origine 0,0 = POINT ZÉRO         │ EUR      │
│ dossiers · GitHub/local   guides · snap · profil           │ (rétrac- │
│ visuel/vidéo/audio/…      sélection unique                 │ table)   │
│                          ┌──────────────────────────────┐ │          │
│                          │ Z4b · RAIL NOEMA (bas du     │ │          │
│                          │ panneau droit, toujours      │ │          │
│                          │ sous l'inspecteur)           │ │          │
│                          └──────────────────────────────┘ │          │
├──┴────────────────────────────────────────────────────────┴──────────┤
│ Z5 · DOCK                                                            │
│ [ ◂ Timeline Universelle ]   [ ＋ IMPORT UNIVERSEL ]   [ Cartes ▸ ]  │
└──────────────────────────────────────────────────────────────────────┘
```

| Zone | Rôle | Source de vérité | Organe / écran existant projeté |
|---|---|---|---|
| Z1 Header | où suis-je, dans quel format, quel état | loop runtime + diagnostic + FormatProfile | `ohead` (pattern), `ugrid` profils, `qa.html` |
| Z2 Bureau | d'où viennent les choses | atlas (GitHub scan + local) / Bureau canonique | `atlas/`, `experiences/bureau.html`, `l-pane--start` |
| Z3 Canvas | où se place la composition | Grille Universelle (moteur spatial à construire, §6) | `l-canvas`, `ugrid`, `cnode`, guides `l-guide` |
| Z4 Inspecteur | qu'est-ce que la sélection, quels réglages | objet canonique sélectionné | `inspector` (pattern), `l-pane--end` |
| Z4b Rail NOEMA | que propose NOEMA, que dois-je décider | boucle NOEMA (`/api/*`) | `loop/`, `noema.css` (6 états), champ conversation de `home.js` |
| Z5 Dock | quand / quelles entités / importer | loop timeline + mémoire + ingestion | `utl--compose`, `ucard`, menu « + » de `home.js` |

## 3. Z1 — Header

Une seule ligne, quatre groupes dans l'ordre de lecture :

1. **Projet** — sélecteur de projet actif (fil d'Ariane compact comme `ohead` l'établit : Bureau › Projet › Composition). Changer de projet change la mémoire projetée, jamais la coquille.
2. **Profil de format** — le sélecteur universel de UNIVERSAL-GRID-V1 §4 : `WEB_DESKTOP · WEB_MOBILE · PRINT_A4 · PRINT_A5 · FLYER · BUSINESS_CARD · POSTER · SOCIAL_9_16 · SOCIAL_1_1 · VIDEO_16_9 · EMBROIDERY_PATTERN`. Choisir un profil établit immédiatement la géométrie du canvas (dimensions, marges, fond perdu, zone sûre, repères automatiques §6 de la grille). Un profil n'est jamais une nouvelle application (GRILLE §9).
3. **QA / analyse** — état du diagnostic appliqué à la composition courante : densité de problèmes et familles touchées (jamais un score inventé — contrat du `diagnostic/`), avec accès au détail. Le mode **EAA** est un *pack de contrôle* : il active les familles d'accessibilité de NOEMA-ACCESSIBILITY-ENGINE-EAA-V1 contre l'écran courant, affiché comme un contrôle, jamais comme une certification.
4. **État NOEMA + thème** — badge d'honnêteté du runtime, hérité du contrat serveur/serverless de la boucle : `NOEMA en ligne` (serveur local, persisté) ou `NOEMA en ligne · démo` (mémoire, réinitialisée à froid). Jamais de persistance simulée.

## 4. Z2 — Bureau (panneau latéral gauche, rétractable)

Le Bureau est la surface d'entrée universelle (UNIVERSAL-BUREAU-DOCUMENTS-V1). Le panneau projette **le même atlas que `atlas/` aujourd'hui**, dans la forme compacte d'un panneau :

- **Source** en tête : `GitHub (38 dépôts)` ⇄ `Dossier local`. Bascule sans quitter la coquille ; le mode local lit et classe dans le navigateur, rien n'est envoyé, originaux et provenance préservés (contrat Bureau §8 de FINAL-CONVERGENCE-V1 : surface d'entrée, pas base canonique).
- **Modes** sous forme de filtres typés : `visuel · vidéo · audio · vecteur · document · tout`. Le mode audio affiche honnêtement ce que le scan a mesuré : zéro fichier audio commité — une absence est un constat nommé, pas un onglet vide déguisé.
- **Dossiers contextuels** : collections dynamiques (`Magic Folder` de MASTER-ARCHITECTURE §11) — par dépôt, par projet, par empreinte (doublons), par sélection. Ce sont des vues, pas des copies.
- **Cartes** : chaque asset est une `ucard`/`umedia` compacte avec **les mêmes fonctions que la médiathèque, sans exception** : voir (viewer réel, lecture vidéo/audio in-page), télécharger, vérifier, copier le lien, composer un brief agent (manifeste JSON), script de récupération `.sh`. Aucune fonction n'est retirée parce que la carte vit dans un panneau.
- **Couverture du scan** repliée en bas : le tableau par dépôt (médias, vides, erreurs, doublons par empreinte) reste visible à la demande.
- **Glisser-déposer** : une carte se dépose sur le canvas (→ placement, pas copie : `ASSET → CLIP / PLACEMENT`, MASTER-ARCHITECTURE §7) ou sur le rail NOEMA (→ contexte d'intention).

## 5. Z3 — Canvas central : la Grille Universelle, le Point Zéro

Le canvas est la projection spatiale de la composition. Il applique UNIVERSAL-GRID-V1 sans variante :

- **Origine 0,0** : par profil, coin haut-gauche par défaut ; les profils à origine-centre (broderie, patron) affichent le **réticule rouge `0,0`** au centre — c'est le Point Zéro. Déplacer l'origine est une métadonnée de l'espace, jamais une mutation du contenu (GRILLE §12).
- **Grille magnétique** : visible/cachée, pas majeur, subdivisions, lignes/points, opacité, snap + tolérance, priorités contextuelles (§7 de la grille). L'aimantation explique pourquoi un objet a accroché (`CENTRE`, `12 MM`, `8 COL`).
- **Guides** : objets universels de première classe (`Guide = axe + position + portée + verrou + couleur + libellé + type`) — règles, repères de centre, marges, zones sûres, trim, fond perdu, colonnes, lignes de base.
- **Automatisme print** : `FORMAT → TRIM → BLEED → SAFE AREA → MARGES → REPERES` créés automatiquement ; on ne dessine jamais un fond perdu à la main.
- **Objets** : `cnode` (entités), `umedia` (placements), texte. Un objet sélectionné expose ses coordonnées spatiales **et** temporelles (GRILLE §8) sans dupliquer de donnée.
- Le canvas reste le seul espace jamais rétractable : les panneaux glissent par-dessus ou le redimensionnent, il ne disparaît pas.

## 6. Z4 — Inspecteur (panneau latéral droit) + Z4b — rail NOEMA

### Inspecteur

L'inspecteur est la projection de **la sélection unique** (une sélection, trois projections : canvas ↕ timeline ↕ inspecteur, TIMELINE §12). Comportement cible de type Framer, sur la grammaire du pattern `inspector` existant :

- **Groupes typés par nature de sélection** : `Position & dimensions` (x, y, l, h, calque — champs numériques), `Texte` (contenu, rôle typographique parmi les 9, graisse parmi 400/500/600/700), `Image / média` (source, cadrage, format, slot `aslot` si la place existe sans asset), `Temporalité` (début, durée, piste), `Relations`, `Provenance & état` (toujours présent : source, confiance, version — discret par défaut, complet à la demande).
- **Fondé sur le design system, modifiable** : l'inspecteur n'affiche que des valeurs issues des tokens (rôles typo, échelle d'espacement fermée, rayons) et propose leurs remplacements légitimes par override de tokens — le mécanisme prouvé par `design-system/direction.html` (aperçu en direct, export `tokens.custom.css`). Modifier reste un choix mesuré : le diagnostic pèse à nouveau le résultat.
- **Écriture encadrée** : éditer un fait confirmé produit une proposition de changement tracée (`CHANGE → IMPACT → VALIDATION → CASCADE`, MASTER §6). Un `À confirmer` se corrige par une décision attribuée, jamais par une saisie silencieuse.

### Z4b — Rail NOEMA (bas du panneau droit, permanent)

NOEMA vit en bas du panneau droit, sous l'inspecteur — présente quelle que soit la sélection, silencieuse quand elle n'a rien à dire (le silence est une capacité, AIME-DESIGN-SYSTEM-V1 §7) :

- **Champ d'intention** (une phrase dans les mots de l'humain, pas un formulaire — le composant de `home.js` et de `loop/`), bouton « Lire sans écrire » toujours disponible.
- **File de propositions** : le châssis unique Proposition / Observation / Question / Alerte / Explication avec les six états épistémiques portés par la forme (pointillés, tirets, plein, barré) et les actions du pied (Valider / Écarter / Décider). Valider appelle `/api/decide` avec acteur ; sans acteur la boucle refuse — sur tout hôte.
- **Contexte de sélection** : le rail sait ce qui est sélectionné ; une proposition peut cibler la sélection sans la dupliquer.
- **Attribution** : mark `noe-mark`, rail d'attribution, libellé monospace. NOEMA n'est pas un personnage — pas d'avatar, pas de bulle décorative.

## 7. Z5 — Dock inférieur

Trois segments, une seule rangée, hauteur bornée et compacte par défaut — la Timeline ne doit pas devenir une deuxième application dans l'application (TIMELINE §12), règle étendue au dock entier.

1. **◂ Timeline Universelle** (segment gauche, tiroir extensible vers le haut) : compacte et persistante (position de la composition, tête de lecture, zoom, navigation), extensible en montage (lanes + clips du mode COMPOSE, `utl--compose` déjà livré). Six modes — READ, PLAN, COMPOSE, REVIEW, LIVE, HISTORY — un seul moteur, capacités (`MOVE | RESIZE | EDIT | COMMENT | …`), granularité année→minute. Déplacer un événement modifie son fait canonique, jamais une copie.
2. **＋ Import universel** (segment central, toujours visible) : voir §8.
3. **Cartes Universelles ▸** (segment droit, tiroir) : les entités du projet actif sous forme de `ucard` (personnes, organisations, objets, documents, événements, relations) — la mémoire du projet en cartes, ordre anatomique fixe, états inconnus affichés comme inconnus. Une carte se dépose sur le canvas, sur la timeline ou dans le rail NOEMA.

## 8. Le contrat d'import universel (« ＋ »)

Le « ＋ » généralise le menu de `home.js` (Dossier local, Lien GitHub, Coller URL — résolveur pur prouvé, 109/109 tests) en **un seul point d'entrée pour tout** :

```text
＋ → QUE VEUX-TU IMPORTER ?
    ├── Dossier local        → lecture navigateur, classification Bureau, rien n'est envoyé
    ├── Fichiers (glisser)   → idem, dont PDF et ZIP
    ├── Lien GitHub          → arbre du dépôt en lecture (médiathèque transversale)
    ├── URL                  → lecture sans écriture, proposition de classification
    └── Texte collé          → intention / information collée (PastedInformation audité)
```

Pipeline unique (UNIVERSAL-BUREAU §8, AIME Desktop généralisé) :

```text
INPUT → INGESTION → EXTRACTION → CLASSIFICATION → RELATIONS →
COUVERTURE PUBLIÉE → PROPOSITION NOEMA → VALIDATION HUMAINE → MÉMOIRE
```

Règles inviolables :

- **Jamais d'écriture silencieuse** : un import aboutit à des propositions classées (« 7 images, 2 PDF dont 1 probable contrat »), validées par l'humain avant mémoire. Le bouton « Lire sans écrire » existe à chaque niveau.
- **Couverture publiée** : chaque import publie son périmètre — fichiers lus, illisibles nommés, formats reconnus ou non, doublons par empreinte (dédup sha, mécanisme mesuré : 119 doublons sur le scan du compte).
- **Local = local** : PDF et ZIP sont lus *dans le navigateur* ; aucun original ne quitte la machine sans validation. Les formats lourds de parse (PDF, ZIP) font l'objet d'une décision d'embarquage explicite : parseur local embarqué (poids) ou référence simple + extraction différée — tranché en Phase 4 de l'audit, jamais déguisé.
- **Provenance toujours** : source, chemin, empreinte, date — pour tout objet importé.

## 9. Règles invariables de la coquille

1. **Une sélection, des projections** : canvas, timeline, cartes, inspecteur et rail NOEMA montrent le même objet ; il n'existe qu'une sélection globale.
2. **La coquille n'a pas d'état métier** : ouverture des panneaux, onglets, hauteur du dock sont de la présentation (persistés localement), jamais des faits du projet.
3. **NOEMA propose. L'humain valide.** Aucune écriture, publication, suppression ou transmission sans décision attribuée (boucle NOEMA, toute hôte).
4. **Un profil n'est pas une application** : format, mode timeline et pack de contrôle changent la projection, pas le moteur.
5. **Capacités plutôt que variantes** : pas de dock mariage / dock studio ; un dock, des capacités.
6. **Couverture publiée, absence nommée** : tout inventaire (Bureau, import, QA) dit ce qu'il n'a pas vu.
7. **Aucun style inexplicable** : la coquille est un écran du design system comme les autres (33 au 18 sept. 2026, les pages `atlas/` et `loop/` ayant été absorbées — par le Bureau et par le rail NOEMA) — les parties nouvelles (dock, coquille, rail) entrent dans le système comme patterns, auditées par les 12 familles. L'innovation n'exempte du système pour personne.
8. **Le point zéro est un repère, pas une donnée** : l'origine, les guides et la grille restent des métadonnées d'assistance ; ils ne dupliquent jamais le contenu canonique.

## 10. Contrat d'état de la coquille (présentation)

```text
ShellState
  project_ref            # projet actif (référence, pas copie)
  format_profile_id      # profil UNIVERSAL-GRID actif
  panels
    left:  { open, width, source: github|local, mode: visuel|video|audio|vecteur|document|tout, dossier_ref }
    right: { open, width, onglet: inspecteur, noema_visible }
    dock:  { segment: timeline|import|cartes|aucun, height }
  selection              # { kind: objet|clip|asset|guide|event|carte|null, id }
  qa: { pack: design|eaa, density, families[], checked_at }
```

Tout le reste (objets, événements, assets, propositions, décisions) vit dans les moteurs existants : loop (mémoire + timeline), atlas (médias référencés), diagnostic (mesures). La coquille lit par leurs APIs et ne réécrit rien.

## 11. Nommage design system (proposition d'extension)

Conformément à AIME-DESIGN-SYSTEM-V1 §3, la coquille introduit **au maximum trois patterns nouveaux**, soumis aux mêmes QA :

| Pattern | Préfixe | Contenu |
|---|---|---|
| coquille | `pz-*` | `pz` (grille de zones), `pz__head`, `pz__pane--start/end`, `pz__canvas`, `pz__dock`, poignées de rétraction `pz__grip` |
| dock | `dock` | segments `dock__seg`, bouton d'import `dock__add`, tiroirs `dock__tray`, états compact/étendu |
| import | `uimport` | popover du « ＋ », file d'ingestion, carte de couverture d'import |

Le rail NOEMA réutilise `noema-*`, l'inspecteur le pattern `inspector`, le Bureau `ucard`/`umedia` — aucun préfixe supplémentaire. Les panneaux héritent de `l-pane` ; la rétraction est un comportement (`data-a-*` + motion COLLAPSE/EXPAND, durées du système), pas une nouvelle couche CSS.

## 12. Responsive, accessibilité, motion

- **< 1024 px** : les panneaux deviennent des overlays glissants par-dessus le canvas (comportement déjà prévu par `l-pane` aux petits breakpoints, généralisé) ; le dock se replie en trois boutons égaux ; le rail NOEMA prend le panneau droit entier.
- **Rétraction** : toujours possible au clavier (poignées focusables, `aria-expanded`), jamais au seul geste ; l'état est annoncé aux technologies d'assistance.
- **Mouvement** : COLLAPSE/EXPAND avec durées du système (140/200 ms) ; `prefers-reduced-motion` et `data-aime-motion="reduced"` rendent l'ouverture instantanée.
- **Cibles** : 24 px compact / 44 px tactile ; focus = outline, jamais box-shadow.
- Rien n'est perdu à 400 % de zoom : le canvas zoome le contenu, pas le chrome.

## 13. Critères de complétude de POINT ZERO

La coquille est considérée constituée quand, sur un poste avec le serveur local :

1. tout ce qui était possible sur `atlas/`, `loop/` et l'accueil reste possible **sans quitter la coquille** (fonctions cartes, validation NOEMA, imports de base) ;
2. une sélection dans une zone se reflète dans les trois autres (canvas, timeline, inspecteur, cartes) ;
3. le diagnostic mesure la composition courante et sa densité est affichée dans le header ;
4. un import « ＋ » publie sa couverture et aboutit à des propositions validées — jamais à une écriture silencieuse ;
5. la coquille passe les 12 familles Design QA comme 35e écran audité, et `verify` l'exécute en DOM ;
6. les quinze questions de clôture FINAL-CONVERGENCE-V1 §10 ont chacune une réponse visible dans l'interface.

## 14. Non-buts

- Pas un bureau d'applications : POINT ZERO remplace la navigation entre pages-silos, il n'ajoute pas une page de plus.
- Pas un éditeur Framer complet en Phase 1 : l'inspecteur édite ce que les moteurs savent porter ; le dessin libre, l'auto-layout et les variantes composants sont des extensions ultérieures auditées séparément.
- Pas de persistance déguisée : tant que le serveur local n'est pas lancé, la mémoire est une démo assumée.
- Pas de canvas hors système : si un rendu exige un style que le système ne peut expliquer, le système s'étend (DS §2), jamais l'écran.
