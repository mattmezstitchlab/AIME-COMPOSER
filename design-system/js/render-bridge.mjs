#!/usr/bin/env node
/**
 * AIME DESIGN SYSTEM — PONT OFFICIEL (génération)
 *
 * Le système ne fait pas que juger : il peut être ADOPTÉ depuis
 * n'importe quel moteur. Ce script génère, depuis tokens.json (seule
 * source de vérité) :
 *
 *   · bridge/tailwind.preset.cjs — preset Tailwind dont l'échelle est
 *     exactement celle du système (espacements fermés, couleurs =
 *     rôles, tailles = 9 rôles, rayons = 4 niveaux, 6 durées) — les
 *     classes écrites avec ce preset sont dans le système par
 *     construction, et le diagnostic les reconnaît ;
 *   · bridge/tailwind.preset.mjs — la même chose en module ESM.
 *
 * Généré, jamais édité à la main : un preset recopié peut diverger,
 * et un preset divergent fait mentir la promesse « zéro écart ».
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DS = join(HERE, '..');
const OUT = join(DS, 'bridge');
const tokens = JSON.parse(readFileSync(join(DS, 'tokens/tokens.json'), 'utf8'));

/* ── Rôles couleur → variables CSS : le preset référence les tokens,
   jamais leurs valeurs — le thème clair/sombre continue de fonctionner. */
const ROLE = (r) => `var(--aime-color-${r})`;
const roles = Object.keys(tokens.themes.dark);
const colors = {};
for (const r of roles) {
  const key = r.replace(/-(\w)/g, (m, c) => c.toUpperCase()); /* accent-hover → accentHover */
  colors[r] = ROLE(r);
  void key;
}
/* Les utilitaires Tailwind lisent mieux avec des noms kebab : bg-accent, text-muted… */

const spaceScale = tokens.space.scale; /* [4,8,12,16,24,32,48,64,96,128] */
const spacing = { 0: '0px', px: '1px', hairline: '1px' };
spaceScale.forEach((px, i) => { spacing[i + 1] = `${px}px`; });

const fontSize = {};
for (const role of tokens.typography.roles) {
  const key = role.role.toLowerCase(); /* META → meta, BODY-SMALL → body-sm */
  fontSize[key] = [`${role.size}px`, { lineHeight: String(role.leading ?? 1.2) }];
}

const borderRadius = {};
for (const [name, px] of Object.entries(tokens.radius)) borderRadius[name] = `${px}px`;

const transitionDuration = {};
for (const [name, ms] of Object.entries(tokens.motion.duration)) transitionDuration[name] = `${ms}ms`;

const preset = {
  content: [],
  theme: {
    colors,
    spacing,
    borderRadius,
    fontSize,
    transitionDuration,
    transitionTimingFunction: {
      /* Les courbes du système, par nom — pas de cubic-bezier littéral. */
      ...Object.fromEntries(Object.entries(tokens.motion.ease || {}).map(([k, v]) => [k, v])),
    },
    extend: {},
  },
  plugins: [],
};

const header = `/**
 * AIME DESIGN SYSTEM — PONT OFFICIEL (généré par js/render-bridge.mjs)
 * Ne pas éditer : régénérer via \`node design-system/js/render-bridge.mjs\`.
 *
 * Échelle fermée du système : ${spaceScale.join(' · ')} px
 * Tailles typographiques : ${tokens.typography.roles.map((r) => `${r.role.toLowerCase()} ${r.size}`).join(', ')}
 * Durées : ${Object.entries(tokens.motion.duration).map(([k, v]) => `${k} ${v}`).join(' · ')} ms
 *
 * Les couleurs sont des RÉFÉRENCES aux variables du système (var(--aime-*)) :
 * charger design-system/tokens/tokens.css reste la condition du thème.
 */
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'tailwind.preset.cjs'),
  `${header}\nmodule.exports = ${JSON.stringify(preset, null, 2)};\n`);
writeFileSync(join(OUT, 'tailwind.preset.mjs'),
  `${header}\nexport default ${JSON.stringify(preset, null, 2)};\n`);

console.log(`pont généré : bridge/tailwind.preset.cjs + .mjs (${roles.length} rôles, ${spaceScale.length} pas, ${Object.keys(fontSize).length} tailles)`);
