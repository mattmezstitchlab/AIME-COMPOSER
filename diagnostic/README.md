# Diagnostic AIME — mesurer un projet externe

Un projet existant peut être jugé par le Design System **sans le modifier**.

```bash
node diagnostic/diagnose.mjs ../mon-projet           # un dossier local (chemin positionnel)
node diagnostic/diagnose.mjs --owner O --repo R      # un dépôt GitHub
node diagnostic/survey.mjs                           # tous les dépôts du compte, comparés
node diagnostic/survey.mjs --repo A --repo B         # une sélection, comparée
node diagnostic/survey.mjs --path ../un-projet       # un dossier local, comparé
node diagnostic/survey.mjs --json | node diagnostic/report.mjs > RAPPORT.md
npm test                                             # depuis diagnostic/ : la suite de tests
```

`diagnose.mjs` sort en 0 si le projet ne présente aucun écart, en 1 s'il en
présente, en 2 si la commande est mal formée.

Aucune écriture dans le projet examiné — c'est un test, pas une promesse.

## Ce qui est mesuré

Le moteur est `design-system/js/qa.js` : **celui qui juge les 32 écrans du
système**, pas une copie. Un projet est jugé dans les mêmes conditions
qu'eux, et les feuilles de style du système sont fournies comme
vocabulaire, pour que « utiliser `t-h1` » ne soit pas compté comme une
incohérence.

Les douze familles sont évaluées sauf `CONTRAST`, déclarée
`REFERENCE_ONLY` : son calcul a besoin des deux thèmes du système, donc
il mesure **nos** primitives, pas votre projet. Le compter reviendrait à
vous facturer nos dettes.

`CONSISTENCY` est jugée mais interprétée avec prudence : son silence sur
un projet externe signifie « ce projet n'utilise pas le système », pas
« il est cohérent ».

## Ce que le rapport publie

- **densité** (écarts / écran), jamais un score sur 100 — un 78/100
  inventé ne dirait pas ce qui ne va pas ;
- **adoption** : combien de classes système le projet utilise déjà ;
- **répartition par famille**, et les écrans les plus touchés ;
- **ordre de réparation** — pas une note : l'ordre dans lequel les
  chantiers ont le plus d'effet pour le moins d'effort ;
- **fichiers écartés**, pour qu'aucune exclusion ne soit silencieuse.

Le classement par écran **somme au total publié**. C'est une propriété
testée, pas une coïncidence : le moteur borne par défaut sa liste détaillée
à 40 écarts par famille pour rester lisible, et un appelant qui compte à
partir de cette liste au lieu de la montrer sous-déclare. Le diagnostic
demande la liste entière (`issueLimit: Infinity`).

## Générer un rapport écrit

`survey.mjs --json` rend la mesure brute ; `report.mjs` la met en forme.
Aucun chiffre d'un rapport ainsi produit n'est recopié à la main — un total
recopié est un total qui peut mentir sans que personne ne s'en aperçoive.

La progression du sondage part sur **stderr**, donc stdout reste du JSON
pur et se pipe directement vers `jq`, un tableur ou `report.mjs`.

Un exemple produit : `AUDIT/DIAGNOSTIC-SURVEY-V1.md`.

## Limites

- La collecte est statique : du HTML rendu par JavaScript n'est pas vu.
- **Aucune mise en page réelle n'est jugée.** `ALIGNMENT` et
  `OVERFLOW` sont des heuristiques ; les 32 écrans du système sont
  vérifiés au rendu par `qa/verify-dom.mjs`, ce que ce diagnostic ne
  fait pas pour un projet tiers.
- Chaque dépôt distant est cloné peu profond **sur sa branche par défaut** :
  le rapport décrit l'état publié, pas un travail en cours.
- `diagnostic/.work/` contient les clones jetables — hors Git.
