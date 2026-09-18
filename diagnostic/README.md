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
   33 écrans du système**, pas une copie.

## Hiérarchie — ce qui est non résolu, jamais un écart

Six angles morts du collecteur, mesurés sur `byaime-one-page` (12 faux
`HIERARCHY` sur 16 au §7, puis 2 vrais du §8, corrigés sans deviner) :

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
  jamais un h1 artificiel au projet.
- **h1 par branche** — `App.tsx` porte 3 h1 dans des branches mutuellement
  exclusives (invitation / RSVP / connexion indisponible) — un seul rend
  à la fois, le scan statique compte 3. On publie
  `NON RÉSOLU — h1 par branche`, jamais d'interpolation de contrôle
  (pont §8.2, limité à `App.*` pour ne pas masquer un vrai doublon sur
  une page métier).
- **montage / bootstrap** — `main.tsx` (montage React, `createRoot`)
  n'est pas un écran — c'est le point d'entrée. Même traitement que la
  coquille SPA : publié `NON RÉSOLU — montage/bootstrap`, jamais `0 h1`
  (pont §8.2, `main.*` exclu des écrans par `profile.mjs`).

Tous ces cas sont comptés, nommés écran par écran dans
`hierarchie_non_resolue` / `hierarchie_non_resolue_detail` et résumés dans
`non_mesuré` — jamais devinés, jamais comptés comme écarts. Codes sortie
inchangés : un projet avec uniquement des NON RÉSOLUS sort en 0 (byaime
passe ainsi à **HIERARCHY 0 vrai écart** au §8).

## Couche de tokens — adoption, pas dette

Un projet qui vendore `src/styles/aime-tokens.css` (copie de
`design-system/tokens/tokens.css`, 150 littéraux, provenance
`AIME-COMPOSER 90ad4c0`) voyait `COLOR 328→478` — le pont punissait qui
adoptait. La couche est désormais reconnue comme **REFERENCE** :

- par marqueur de provenance en tête de fichier (`AIME-COMPOSER`,
  `couche de tokens`, `Source : AIME-COMPOSER`, commit `90ad4c0`) ;
- ou par empreinte : le contenu officiel est inclus tel quel (vendor =
  header + fichier officiel, ou copie exacte).

Cette couche est **exclue de COLOR** (comme `CONTRAST`) et **comptée en
adoption** : `adoption.tokens_layer = true`,
`adoption.tokens_layer_files[]`, `non_mesuré` = « couche de tokens
présente ». Le bridge promet zéro écart pour qui n'utilise que le pont ;
désormais il ne facture plus la couche elle-même (pont §8.1).

## Focus — pairing, la substitution pas le token

La famille `FOCUS` comptait autrefois un écart pour chaque classe
`outline-none`, quelle que soit sa substitution. Or l'idiome canonique
accessible shadcn/Tailwind
`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
est une **substitution valide**, plus accessible que l'outline par défaut
(pont §9 — preuve par intervention : 58 vrais défauts corrigés dans
byaime faisaient passer la mesure de 218 à 217, le seul point gagné
étant un cas CSS). La règle, **par attribut de classes** (le seul
substitut reconnu vit dans le même attribut, symétrique de l'exemption
CSS `:focus:not(:focus-visible)` déjà en vigueur) :

1. `focus-visible:outline-none` **accompagné** de `focus-visible:ring-*`
   (ou `focus-visible:shadow-*`) dans le même attribut = substitution
   valide → **pas un écart** ;
2. `focus:outline-none` (suppression au pointeur) sans substitution dans
   le même attribut = écart — `focus:ring-*` ne substitue rien au
   clavier ;
3. `outline-none` nu sans ring adjacent = écart ;
4. toute paire non appariée est comptée **et nommée** dans le détail
   FOCUS — jamais devinée, jamais tue.

La substitution est de **même scope** : un retrait au scope `V:` est
apparié ssi le même attribut porte `V:ring-*` / `V:shadow-*` — donc
`focus:ring-*` ne substitue pas un `focus-visible:outline-none`
(fixture « incomplète »), tandis que `focus-within:ring-*` apparie un
`focus-within:outline-none` (même scope).

Le `focus:ring-*` sans retrait d'outline n'est pas évalué (aucun anneau
supprimé, rien à signaler). Fixtures `focus-pairing`
(valide / nu / pointeur / incomplète) : comptes exacts, testés. Sur
byaime, FOCUS tombe ainsi de 217 à **l'inventaire réel des paires non
appariées** (attendu proche de zéro).

## Le pont officiel — converger vers zéro sans changer de moteur

Le système génère son propre preset (`design-system/bridge/`,
voir son README) : `tailwind.preset.cjs` dont l'échelle est exactement celle
des tokens — espacements fermés, couleurs = rôles `var(--aime-*)`, 9 tailles
typographiques, 6 durées. Un projet qui n'utilise que ce pont sort avec
**zéro écart** sur les familles couvertes — démontré par les fixtures de
tests, pas promis. La convergence dans le temps se mesure avec `--baseline`.

La **couche de tokens** (`src/styles/aime-tokens.css`) est la marche
d'adoption du pont : les rôles `--aime-*` sont disponibles sans changer
de moteur, mesurée en adoption, jamais facturée.

## Ce que le rapport publie

- **densité** (écarts / écran), jamais un score sur 100 — un 78/100
  inventé ne dirait pas ce qui ne va pas ;
- **profil moteur**, **écrans/fragments**, bibliothèques d'icônes tierces
  (nommées, jamais comptées), constructions de classes **non résolues** et
  hiérarchies **non résolues** (`h1 composé` / `coquille` / alias /
  `branche` / `montage`) ;
- **adoption** : combien de classes système le projet utilise déjà, et
  si la couche de tokens est présente (`tokens_layer`) ;
- **répartition par famille**, et les écrans les plus touchés ;
- **ordre de réparation** — pas une note : l'ordre dans lequel les
  chantiers ont le plus d'effet pour le moins d'effort ;
- **fichiers écartés**, pour qu'aucune exclusion ne soit silencieuse ;
- **`NON MESURÉ`** explicite : `CONTRAST` (référence), la mise en page
  réelle (jsdom n'a pas de moteur de layout), les non-résolus et la
  couche de tokens (`couche de tokens présente`).

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
