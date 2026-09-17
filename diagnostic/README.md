# Diagnostic AIME — mesurer un projet externe

Un projet existant peut être jugé par le Design System **sans le modifier**.

```bash
node diagnostic/diagnose.mjs ../mon-projet          # un dossier local
node diagnostic/diagnose.mjs --owner O --repo R     # un dépôt GitHub
node diagnostic/diagnose.mjs --path . --json        # sortie machine
node diagnostic/survey.mjs                          # tous les dépôts du compte, comparés
node diagnostic/survey.mjs --repo A --repo B        # une sélection, comparée
```

Aucune écriture dans le projet examiné — c'est un test, pas une promesse.

## Ce qui est mesuré

Le moteur est `design-system/js/qa.js` : **celui qui juge les 31 écrans du
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

## Limites

- La collecte est statique : du HTML rendu par JavaScript n'est pas vu.
- **Aucune mise en page réelle n'est jugée.** `ALIGNMENT` et
  `OVERFLOW` sont des heuristiques ; les 31 écrans du système sont
  vérifiés au rendu par `qa/verify-dom.mjs`, ce que ce diagnostic ne
  fait pas pour un projet tiers.
- `diagnostic/.work/` contient les clones jetables — hors Git.
