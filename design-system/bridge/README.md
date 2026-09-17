# Adopter le Design System depuis votre moteur

Le système ne fait pas que juger les projets — il peut être **adopté** sans
changer de moteur. Ce dossier contient les artefacts d'adoption, **générés
depuis `tokens/tokens.json`**, jamais édités à la main :

- `tailwind.preset.cjs` / `.mjs` — preset Tailwind v3 dont l'échelle est
  exactement celle du système ;
- `../tokens/tokens.css` — les variables (déjà livrées) : la couche commune
  à toutes les adoptions, quel que soit le framework.

## React / Vue / Svelte / Astro (sans Tailwind)

Chargez `tokens.css`, puis utilisez les composants et classes du système —
le diagnostic reconnaît le vocabulaire (`t-*`, `l-*`, `a-*`, `u-*`) et le
mesure dans l'`adoption`, jamais en écart.

```js
import 'aime-design-system/tokens/tokens.css'; // chemin à adapter
```

## Tailwind v3

```js
// tailwind.config.js
module.exports = {
  presets: [require('aime-design-system/bridge/tailwind.preset.cjs')],
  content: ['./src/**/*.{js,jsx,ts,tsx,vue,svelte,html}'],
};
```

Et dans la feuille d'entrée, **avant** les directives Tailwind :

```css
@import "aime-design-system/tokens/tokens.css";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Ce qui change par rapport à Tailwind standard — c'est le contrat :

| Classe | Valeur ici | valeur Tailwind standard |
|---|---|---|
| `p-5` | **24 px** (space-5 du système) | 20 px — hors échelle, écart SPACING |
| `text-body` | 16 px (rôle BODY) | — |
| `bg-accent` | `var(--aime-color-accent)` | — |
| `bg-gray-500` | — | palette externe → écart COLOR, sauf pont |
| `rounded-lg` | 8 px (niveau) | 8 px ✓ |
| `duration-200` | base du système | 200 ms ✓ |

Les classes que le preset ne connaît pas (`p-11`, `bg-gray-500`) n'existent
pas pour votre build : l'erreur est visible à l'écriture, pas au rapport.

## Ce que vaut l'adoption, mesuré

Un projet qui n'utilise **que** ce pont sort avec **zéro écart** sur les
familles couvertes (`COLOR`, `SPACING`, `TYPOGRAPHY`, `MOTION`, `ALIGNMENT`) —
c'est un test de ce dépôt, pas une promesse
(`diagnostic/test/fixtures/bridge/`). La convergence vers zéro se suit dans
le temps avec :

```bash
node diagnostic/diagnose.mjs <projet> --json > base.json
node diagnostic/diagnose.mjs <projet> --baseline base.json
```

## Règles du pont

1. Les couleurs sont des **références** `var(--aime-*)` : `tokens.css` est la
   condition du thème clair/sombre.
2. Le preset est **généré** (`node design-system/js/render-bridge.mjs`) —
   jamais édité, sinon la promesse « zéro écart » ment.
3. Adopter n'oblige à rien d'autre : le système se mesure, il ne s'impose pas.
