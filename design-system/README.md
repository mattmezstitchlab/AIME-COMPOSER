# AIME DESIGN SYSTEM V1

Système visuel universel destiné à AIME-COMPOSER et aux futures interfaces NOEMA.

> **La technologie disparaît derrière la clarté.**

Ce dossier n'est pas une application : c'est le langage visuel d'AIME, sa documentation
et l'outil qui vérifie que le langage est respecté.

---

## 1. Principe

Le système fonctionne comme une grammaire à six couches. Chaque couche ne consomme que
celle du dessous ; aucune ne peut inventer une valeur, elle la reçoit.

```text
TOKENS → FOUNDATIONS → COMPONENTS → PATTERNS → LAYOUTS → EXPERIENCES
```

Une règle posée au niveau des tokens se propage jusqu'aux écrans. Un écran est une
projection du système, jamais l'inverse.

## 2. Commandes

```bash
cd design-system
npm run build   # génère tokens + icônes, refuse toute couleur non conforme
npm run qa      # build + audit des 12 familles sur le système livré
npm run verify  # exécute réellement les scripts des 19 écrans dans un DOM
npm run check   # qa puis verify — la vérification complète
npm run serve   # sert le dépôt sur http://0.0.0.0:8080/design-system/
```

Aucune dépendance à l'exécution : build, QA et serveur n'utilisent que le moteur
JavaScript. `jsdom` n'est requis que par `npm run verify`, qui exécute les scripts
des écrans dans un DOM.

`npm run verify` vérifie ce que l'analyse de texte ne peut pas voir : `js/doc.js`
injecte le chrome et résout chaque icône, `js/aime-ui.js` se branche sans erreur,
les modules `js/render-tokens.js` remplissent leurs conteneurs, `auditLive()`
s'exécute sur le document vivant. **Limite assumée** : jsdom n'a pas de moteur de
mise en page, donc les volets géométriques d'`auditLive` — débordement réel et
taille des cibles — ne sont pas vérifiés. Ils demandent un navigateur réel.

## 3. Contenu

| Chemin | Rôle |
|---|---|
| `src/tokens.mjs` | Source de vérité : palette, rôles, typographie, espace, motion, layout, contrat de contraste |
| `src/icons.mjs` | Source de vérité de la famille d'icônes (85 pictogrammes, 17 catégories) |
| `src/build.mjs` | Génère les artefacts et **refuse de générer** si un seuil WCAG n'est pas atteint |
| `tokens/tokens.css` | Bibliothèque CSS. Seul fichier du système autorisé à contenir des littéraux couleur |
| `tokens/tokens.json` | La même bibliothèque, lisible par machine (moteur EAA, sync Figma, QA) |
| `tokens/CONTRAST-REPORT.md` | Preuve de contraste de chaque paire de rôles |
| `assets/aime-icons.svg` | Sprite de la famille d'icônes |
| `styles/` | Couches 2 à 5 : foundations · layout · components · aime · noema · patterns · dataviz · doc · pointzero |
| `js/qa.js` | Design QA. Pur texte, donc exécutable à l'identique en Node et dans le navigateur |
| `qa/run-qa.mjs` | Exécuteur : `npm run qa` |
| `qa/verify-dom.mjs` | Exécuteur : `npm run verify` — exécution réelle des scripts des écrans |
| `qa/serve.mjs` | Serveur statique, sans dépendance |

## 4. Ce qui est garanti, et par quoi

| Garantie | Mécanisme | Contrôle |
|---|---|---|
| Aucune couleur arbitraire | Seul `tokens.css` contient des littéraux | QA · COLOR |
| Aucun contraste insuffisant | Valeurs déduites du seuil au build, revérifiées sur l'artefact | Build + QA · CONTRAST |
| Aucun espacement libre | Échelle fermée : 4 8 12 16 24 32 48 64 96 128 | QA · SPACING |
| Aucune taille de police libre | 9 rôles typographiques | QA · TYPOGRAPHY |
| Aucun rayon libre | 4 niveaux : 4 · 8 · 14 · pilule | QA · ALIGNMENT |
| Aucune dimension libre | Multiple de 4, ou repère optique ≤ 16 px | QA · ALIGNMENT |
| Aucun emoji d'interface | Famille SVG obligatoire ; flèche interdite dans un contrôle | QA · ICONOGRAPHY |
| Aucun focus supprimé | Outline retiré au pointeur uniquement | QA · FOCUS |
| Aucune durée d'animation libre | 6 durées, 3 courbes, 7 primitives | QA · MOTION |
| Aucun style inexpliqué | Toute classe système doit être définie par le système | QA · CONSISTENCY |

Les 12 familles : ALIGNMENT · SPACING · TYPOGRAPHY · COLOR · CONTRAST · ICONOGRAPHY ·
HIERARCHY · RESPONSIVE · OVERFLOW · FOCUS · MOTION · CONSISTENCY.

Le contrat de contraste est défini une seule fois (`src/tokens.mjs → contrastPairs`) et
exécuté deux fois : par le build, qui refuse de générer, et par le QA, qui refuse de valider.
Ils ne peuvent pas diverger.

## 5. Décisions structurantes

**La cible de contraste dépend de la fonction, pas de l'esthétique.** Un filet séparateur
n'a pas à atteindre 3:1 — il n'identifie rien. Une bordure de champ, si : c'est le seul
indice de l'étendue du contrôle (WCAG 1.4.11). `border-strong` n'est donc pas choisi à
l'œil : il est déduit du pire fond possible.

**Le fuchsia est un signal, pas une décoration.** Il marque la sélection, l'action primaire
unique, la proposition de NOEMA et ce qui attend une décision. En texte il est toujours
servi par `accent-text`, jamais par `accent`.

**Une proposition ne ressemble jamais à un fait.** Le sens est doublé par la forme :
plein · pointillé · tireté · barré. La couleur seule ne porte jamais l'information.

**La confiance ne s'affiche pas en pourcentage.** Trois degrés — `low · medium · high`.
Afficher 87 % de certitude serait une fausse précision.

## 6. État d'avancement

**Livré dans cette branche** — le système complet, sa documentation et ses écrans :

- Tokens : 23 primitives, 21 rôles × 2 thèmes, 4 états × 5 déclinaisons, 9 rôles
  typographiques, échelle d'espace fermée, 4 rayons, 6 durées, layout et breakpoints.
- Iconographie : 86 pictogrammes, 17 catégories, contrat de grille unique.
- Couches CSS 2 à 5 : 29 composants fondamentaux, 5 organes AIME, couche NOEMA,
  13 patterns, langage de data visualisation, moteur de layout responsive.
- Design QA : 12 familles statiques, plus une vérification DOM des 33 écrans — dont la page d'accueil du dépôt et la coquille Point Zero (dont le Bureau a absorbé la page Médiathèque, et le rail NOEMA l'écran de la boucle `loop/`).
- 19 chapitres de documentation, du chapitre 00 au chapitre 19.
- 10 écrans d'expérience (`experiences/`) : Playground, Composer, Carte Universelle,
  Timeline, Grille, Bureau, Médiathèque, NOEMA, site public, portail client — plus
  leur index. Tous composés uniquement avec le système.
- `ARCHITECTURE/AIME-DESIGN-SYSTEM-V1.md`, la spécification normative.

**Ce qui reste ouvert** :

- Les volets géométriques du QA — débordement réel et taille des cibles — demandent
  un navigateur réel. `npm run verify` le signale explicitement au lieu de les
  faire passer pour vérifiés.
- Le branchement du moteur EAA sur `tokens.json` : le contrat est publié et
  lisible par machine, le moteur lui-même est décrit dans
  `ARCHITECTURE/NOEMA-ACCESSIBILITY-ENGINE-EAA-V1.md`.
