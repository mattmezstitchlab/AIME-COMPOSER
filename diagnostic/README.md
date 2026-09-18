# Diagnostic AIME — mesurer un projet externe, quel que soit son moteur

Un projet existant peut être jugé par le Design System **sans le modifier** —
qu'il soit écrit en HTML ou en React, Next, Vue, Svelte, Tailwind,
CSS-in-JS, SCSS.

```bash
node diagnostic/diagnose.mjs ../mon-projet           # un dossier local (chemin positionnel)
node diagnostic/diagnose.mjs --owner O --repo R      # un dépôt GitHub
node diagnostic/diagnose.mjs ../mon-projet --json    # sortie machine, déterministe
node diagnostic/diagnose.mjs ../mon-projet --baseline base.json   # diff avec un run précédent
node diagnostic/survey.mjs                           # tous les dépôts du compte, comparés
node diagnostic/survey.mjs --repo A --repo B         # une sélection, comparée
node diagnostic/survey.mjs --path ../un-projet       # un dossier local, comparé
node diagnostic/survey.mjs --json | node diagnostic/report.mjs > RAPPORT.md
npm test                                             # depuis diagnostic/ : la suite de tests
```

`diagnose.mjs` sort en 0 si le projet ne présente aucun écart, en 1 s'il en
présente, en 2 si la commande est mal formée.

Aucune écriture dans le projet examiné — c'est un test, pas une promesse.

## Comment le juge voit votre moteur

1. **Profil** — le diagnostic lit les manifests (`package.json`,
   `tailwind.config.*`, `@import "tailwindcss"`…) et nomme les moteurs :
   « React · Tailwind v3 ». Le profil décrit, il ne note pas ; un moteur
   inconnu déclenche le repli intégral sur le scan HTML/CSS, jamais un échec.
2. **Écrans vs fragments** — un composant de route (`pages/`, `app/`,
   `routes/`, `views/`, `App`) est un écran ; tout autre composant est un
   fragment, mesuré pareillement mais **rapporté à part** — la densité par
   écran reste comparable à celle d'un projet HTML.
3. **Extraction** — classes (`className`, `clsx()`, template literals),
   Tailwind standard et valeurs arbitraires (`p-[10px]`, `bg-[#171410]`),
   styles inline d'objets (`style={{ padding: 10 }}`), blocs
   `styled.*`/`` css` ``, variables SCSS simples. Le code du projet n'est
   jamais exécuté ; ce qui ne se résout pas statiquement est compté
   « non résolu », publié, jamais deviné.
4. **Jugement** — le moteur `design-system/js/qa.js`, **celui qui juge les
   34 écrans du système**, pas une copie.

## Hiérarchie — ce qui est non résolu, jamais un écart

Quatre angles morts du collecteur, mesurés sur `byaime-one-page` (12 faux
`HIERARCHY` sur 16, corrigés sans deviner) :

- **h1 composé** — une route importe un fragment local qui porte le h1
  (`SiteHero` pour Legal/Mentions, `ProjectStage` pour Home/app). Le scan
  statique d'une route n’inline pas ses imports : on publie
  `NON RÉSOLU — h1 composé — <écran> importe <fragment>`, jamais `0 h1`.
- **alias** — `<motion.h1>` (framer-motion) et `<styled.h1>`
  (styled-components/emotion) sont des h1 à l’exécution. Whitelist
  documentée : `motion`, `styled` → `h1…h6`. Seuls ces préfixes sont
  comptés ; ajouter un préfixe est une décision, pas une devinette.
  Voir `design-system/js/qa.js` § HIERARCHY et
  `diagnostic/src/diagnose.mjs` `HEADING_ALIAS_PREFIXES`.
- **tests** — `*.test.*` et `*.spec.*` ne sont jamais des écrans. Un test
  de page qui rend 2 h1 n’est pas un écran à 2 h1. Exclus des routes par
  `diagnostic/src/profile.mjs` (`isScreen`), comptés comme fragments s’ils
  existent.
- **coquille SPA** — `index.html` du montage Vite (`<div id="root">` +
  `<script type="module" src="/src/main.tsx">`) n’a pas de h1 statique ;
  il vit dans le rendu. On publie `NON RÉSOLU — coquille SPA`, on n’ajoute
  jamais un h1 artificiel au projet. Le rapport distingue alors
  `4 écarts HIERARCHY + 4 non-résolus` (exemple byaime), codes sortie
  inchangés.

Tous ces cas sont comptés, nommés écran par écran dans
`hierarchie_non_resolue` / `hierarchie_non_resolue_detail` et résumés dans
`non_mesuré` — jamais devinés, jamais comptés comme écarts.

## Le pont officiel — converger vers zéro sans changer de moteur

Le système génère son propre preset (`design-system/bridge/`,
voir son README) : `tailwind.preset.cjs` dont l'échelle est exactement celle
des tokens — espacements fermés, couleurs = rôles `var(--aime-*)`, 9 tailles
typographiques, 6 durées. Un projet qui n'utilise que ce pont sort avec
**zéro écart** sur les familles couvertes — démontré par les fixtures de
tests, pas promis. La convergence dans le temps se mesure avec `--baseline`.

## Ce que le rapport publie

- **densité** (écarts / écran), jamais un score sur 100 — un 78/100
  inventé ne dirait pas ce qui ne va pas ;
- **profil moteur**, **écrans/fragments**, bibliothèques d'icônes tierces
  (nommées, jamais comptées), constructions de classes **non résolues** et
  hiérarchies **non résolues** (`h1 composé` / `coquille` / alias) ;
- **adoption** : combien de classes système le projet utilise déjà ;
- **répartition par famille**, et les écrans les plus touchés ;
- **ordre de réparation** — pas une note : l'ordre dans lequel les
  chantiers ont le plus d'effet pour le moins d'effort ;
- **fichiers écartés**, pour qu'aucune exclusion ne soit silencieuse ;
- **`NON MESURÉ`** explicite : `CONTRAST` (référence), la mise en page
  réelle (jsdom n'a pas de moteur de layout), les non-résolus.

Le classement par écran **somme au total publié** — propriété testée.

## Générer un rapport écrit

`survey.mjs --json` rend la mesure brute ; `report.mjs` la met en forme.
`diagnose.mjs --json` rend le rapport complet d'un projet (signatures
d'écarts incluses pour `--baseline`). Aucun chiffre d'un rapport ainsi
produit n'est recopié à la main.

La progression du sondage part sur **stderr**, donc stdout reste du JSON
pur et se pipe directement vers `jq`, un tableur ou `report.mjs`.

Un exemple produit : `AUDIT/DIAGNOSTIC-SURVEY-V1.md`.

## Limites

- Les classes construites dynamiquement (template literals) ne sont pas
  résolues : elles sont **comptées et publiées**, jamais devinées.
- **Aucune mise en page réelle n'est jugée** (géométrie, débordements) ;
  les heuristiques statiques restent bornées et le mode rendu est une
  tranche ultérieure, opt-in.
- Chaque dépôt distant est cloné peu profond **sur sa branche par défaut** :
  le rapport décrit l'état publié, pas un travail en cours.
- `diagnostic/.work/` contient les clones jetables — hors Git.
