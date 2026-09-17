/**
 * AIME DESIGN SYSTEM V1 — build.
 *
 * Génère, à partir d'une source unique :
 *   tokens/tokens.css        la bibliothèque CSS (seul fichier autorisé à contenir des littéraux couleur)
 *   tokens/tokens.json       la même bibliothèque, lisible par machine (moteur EAA, sync Figma, QA)
 *   tokens/CONTRAST-REPORT.md  la preuve de contraste de chaque paire de rôles
 *   assets/aime-icons.svg    le sprite de la famille d'icônes
 *   tokens/icons.json        l'inventaire des icônes
 *
 * Le build ÉCHOUE si une paire de rôles ne respecte pas son seuil WCAG.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  primitives,
  statusRamps,
  buildThemes,
  contrast,
  r2,
  typeScale,
  typeFluid,
  fontFamilies,
  fontWeights,
  space,
  spaceAliases,
  controlHeights,
  radius,
  shadows,
  motion,
  layout,
  breakpoints,
  deviceProfiles,
  layers,
  TARGETS,
  TYPE_RATIO,
  SURFACES,
  SURFACE_LABEL,
  contrastPairs,
  STATUS_PAIRS,
  evaluateContrast,
} from './tokens.mjs';
import { icons, categories, ICON_CONTRACT } from './icons.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = (rel, body) => {
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return rel;
};

const HEADER = `/* AIME DESIGN SYSTEM V1 — fichier généré par src/build.mjs.
   Ne pas éditer à la main : éditer src/tokens.mjs puis lancer npm run build. */`;

const { dark, light, statuses, resolved } = buildThemes();

/* ─────────────────────────────────────────────────────────────── *
 * 1. PRÉUVE DE CONTRASTE — aucune couleur sans rapport mesuré
 * ─────────────────────────────────────────────────────────────── */
const { rows, failures: contrastFailures } = evaluateContrast();
const failures = [...contrastFailures];
const pairs = contrastPairs();

/* ─────────────────────────────────────────────────────────────── *
 * 2. tokens.css
 * ─────────────────────────────────────────────────────────────── */
const primitiveBlock = Object.entries(primitives)
  .map(([fam, ramp]) => `  /* ${fam} */\n${Object.entries(ramp).map(([k, v]) => `  --aime-p-${fam}-${k}: ${v};`).join('\n')}`)
  .join('\n\n');

const themeBlock = (theme, themeName) => {
  const statusLines = Object.keys(statusRamps)
    .flatMap((name) => {
      const s = statuses[`${themeName}.${name}`];
      return ['text', 'border', 'solid', 'on-solid', 'surface'].map((k) => `  --aime-color-${name}-${k}: ${s[k]};`);
    })
    .join('\n');
  return `${Object.entries(theme)
    .map(([k, v]) => `  --aime-color-${k}: ${v};`)
    .join('\n')}\n${statusLines}`;
};

const typeBlock = typeScale
  .map((t) => {
    const key = t.role.toLowerCase();
    const fluid = typeFluid[t.role];
    const size = fluid ? `clamp(${fluid.min}px, ${fluid.slope}vw + ${fluid.offset}px, ${fluid.max}px)` : `${t.size}px`;
    return `  /* ${t.role} — mesure max ${t.measure}ch */
  --aime-text-${key}-size: ${size};
  --aime-text-${key}-lh: ${t.lh};
  --aime-text-${key}-ls: ${t.ls}em;
  --aime-text-${key}-weight: ${t.weight};
  --aime-text-${key}-measure: ${t.measure}ch;
  --aime-text-${key}-family: var(--aime-font-${t.font});`;
  })
  .join('\n');

const spaceBlock = space.map((v, i) => `  --aime-space-${i + 1}: ${v}px;`).join('\n');
const spaceAliasBlock = Object.entries(spaceAliases)
  .map(([alias, ref]) => `  --aime-${alias}: var(--aime-${ref});`)
  .join('\n');
const controlBlock = Object.entries(controlHeights)
  .map(([k, v]) => `  --aime-control-${k}: ${v}px;`)
  .join('\n');
const radiusBlock = Object.entries(radius)
  .map(([k, v]) => `  --aime-radius-${k}: ${v === 999 ? '999px' : `${v}px`};`)
  .join('\n');
const shadowBlock = Object.entries(shadows)
  .map(([k, v]) => `  --aime-shadow-${k}: ${v};`)
  .join('\n');
const motionBlock =
  Object.entries(motion.duration)
    .map(([k, v]) => `  --aime-motion-${k}: ${v}ms;`)
    .join('\n') +
  '\n' +
  Object.entries(motion.ease)
    .map(([k, v]) => `  --aime-ease-${k}: ${v};`)
    .join('\n');
const layoutBlock = [
  ...Object.entries(layout.columns).map(([k, v]) => `  --aime-columns-${k}: ${v};`),
  ...Object.entries(layout.gutter).map(([k, v]) => `  --aime-gutter-${k}: ${v}px;`),
  ...Object.entries(layout.margin).map(([k, v]) => `  --aime-margin-${k}: ${v}px;`),
  ...Object.entries(layout.measure).map(([k, v]) => `  --aime-measure-${k}: ${v}px;`),
  `  --aime-canvas-max: ${layout.canvasMax}px;`,
  `  --aime-ratio-golden: ${layout.golden};`,
  `  --aime-type-ratio: ${TYPE_RATIO};`,
].join('\n');
const bpBlock = Object.entries(breakpoints)
  .map(([k, v]) => `  --aime-bp-${k}: ${v}px;`)
  .join('\n');
const layerBlock = Object.entries(layers)
  .map(([k, v]) => `  --aime-z-${k}: ${v};`)
  .join('\n');

/* États de connaissance NOEMA — le sens est porté par la forme, jamais par la seule couleur. */
const knowledgeStates = [
  ['observed', 'info', 'dotted', 'noe-observed', 'Observé'],
  ['extracted', 'info', 'dashed', 'noe-extracted', 'Extrait'],
  ['inferred', 'warning', 'dashed', 'noe-inferred', 'Déduit'],
  ['proposed', 'accent', 'dashed', 'noe-proposed', 'Proposé'],
  ['confirmed', 'success', 'solid', 'noe-confirmed', 'Confirmé'],
  ['superseded', 'muted', 'solid', 'noe-superseded', 'Remplacé'],
];
const knowledgeBlock = knowledgeStates
  .map(([key, role, style, glyph, label]) => {
    const fg = role === 'accent' ? 'var(--aime-color-accent-text)' : role === 'muted' ? 'var(--aime-color-text-subtle)' : `var(--aime-color-${role}-text)`;
    const bd = role === 'accent' ? 'var(--aime-color-accent)' : role === 'muted' ? 'var(--aime-color-border)' : `var(--aime-color-${role}-border)`;
    return `  /* ${label} — ${style === 'solid' ? 'fait établi' : 'non établi'} */
  --aime-state-${key}-fg: ${fg};
  --aime-state-${key}-bd: ${bd};
  --aime-state-${key}-style: ${style};
  --aime-state-${key}-glyph: '${glyph}';`;
  })
  .join('\n');

const tokensCss = `${HEADER}

/* ══════════════════════════════════════════════════════════════
   COUCHE 1 — TOKENS
   ══════════════════════════════════════════════════════════════ */

/* 1.1 PRIMITIVES — la palette. Elle n'est JAMAIS utilisée directement
       par un composant : seuls les rôles sémantiques sont consommés. */
:root {
${primitiveBlock}
}

/* 1.2 RÔLES SÉMANTIQUES — thème sombre (défaut AIME) */
:root,
:root[data-aime-theme='dark'] {
${themeBlock(dark, 'dark')}
}

/* 1.3 RÔLES SÉMANTIQUES — thème clair */
:root[data-aime-theme='light'] {
${themeBlock(light, 'light')}
}

@media (prefers-color-scheme: light) {
  :root:not([data-aime-theme]) {
${themeBlock(light, 'light')
  .split('\n')
  .map((l) => `  ${l}`)
  .join('\n')}
  }
}

/* 1.4 TYPOGRAPHIE — 9 rôles, une échelle, aucune taille libre */
:root {
  --aime-font-sans: ${fontFamilies.sans};
  --aime-font-mono: ${fontFamilies.mono};
  --aime-font-regular: ${fontWeights.regular};
  --aime-font-medium: ${fontWeights.medium};
  --aime-font-semibold: ${fontWeights.semibold};
  --aime-font-bold: ${fontWeights.bold};
${typeBlock}
}

/* 1.5 ESPACE — échelle fermée : 4 8 12 16 24 32 48 64 96 128 */
:root {
${spaceBlock}
  /* alias fonctionnels */
${spaceAliasBlock}
  /* hauteurs de contrôle (tailles, pas espacements) */
${controlBlock}
}

/* 1.6 RAYON — quatre niveaux, aucun autre */
:root {
${radiusBlock}
}

/* 1.7 BORDURE — cinq états logiques */
:root {
  --aime-border-width: 1px;
  --aime-border-width-strong: 2px;
  --aime-border-subtle: var(--aime-border-width) solid var(--aime-color-border-subtle);
  --aime-border-default: var(--aime-border-width) solid var(--aime-color-border);
  --aime-border-strong: var(--aime-border-width) solid var(--aime-color-border-strong);
  --aime-border-active: var(--aime-border-width-strong) solid var(--aime-color-accent);
  --aime-border-focus: var(--aime-border-width-strong) solid var(--aime-color-focus-ring);
  --aime-focus-ring: 0 0 0 2px var(--aime-color-background), 0 0 0 4px var(--aime-color-focus-ring);
  --aime-focus-offset: 2px;
}

/* 1.8 OMBRE — deux seulement ; la profondeur vient de la surface et de l'espace */
:root {
${shadowBlock}
}

/* 1.9 MOTION — sept primitives, quatre durées, trois courbes */
:root {
${motionBlock}
  --aime-motion-primitives: fade, slide, scale, expand, collapse, drag, connect;
}

/* 1.10 LAYOUT — grille, rythme, proportions */
:root {
${layoutBlock}
}

/* 1.11 POINTS DE RUPTURE */
:root {
${bpBlock}
}

/* 1.12 COUCHES */
:root {
${layerBlock}
}

/* 1.13 ÉTATS DE CONNAISSANCE NOEMA — OBSERVED · EXTRACTED · INFERRED ·
        PROPOSED · CONFIRMED · SUPERSEDED.
        Règle : le sens est toujours doublé par une FORME (plein / pointillé /
        tireté / barré). La couleur seule ne porte jamais l'information. */
:root {
${knowledgeBlock}
}

/* 1.14 CONTRAT DE CONTRASTE — seuils que le QA vérifie */
:root {
  --aime-contrast-text: ${TARGETS.text};
  --aime-contrast-large: ${TARGETS.textLarge};
  --aime-contrast-ui: ${TARGETS.ui};
}
`;

/* ─────────────────────────────────────────────────────────────── *
 * 3. tokens.json
 * ─────────────────────────────────────────────────────────────── */
const tokensJson = {
  $schema: 'aime-design-system/v1',
  generated: new Date().toISOString().slice(0, 10),
  primitives,
  themes: { dark, light, statuses },
  typography: {
    ratio: TYPE_RATIO,
    families: fontFamilies,
    weights: fontWeights,
    fluid: typeFluid,
    roles: typeScale,
  },
  space: { scale: space, aliases: spaceAliases, controls: controlHeights },
  radius,
  shadows,
  motion,
  layout,
  breakpoints,
  deviceProfiles,
  layers,
  knowledgeStates: Object.fromEntries(
    knowledgeStates.map(([key, role, style, glyph, label]) => [key, { role, borderStyle: style, glyph, label }]),
  ),
  contrastTargets: TARGETS,
};

/* ─────────────────────────────────────────────────────────────── *
 * 4. Rapport de contraste
 * ─────────────────────────────────────────────────────────────── */
const md = [
  '# AIME — Rapport de contraste V1',
  '',
  `Généré par \`npm run build\` le ${new Date().toISOString().slice(0, 10)}. Toute valeur ci-dessous est calculée`,
  'selon la formule de luminance relative WCAG 2.x, puis comparée au seuil du rôle.',
  'Le build échoue si une ligne est en échec : aucune couleur n\'entre dans le système sans preuve.',
  '',
  '## Règles de cible',
  '',
  '| Rôle | Fonction | Cible | Justification |',
  '|---|---|---|---|',
  '| `text` / `text-muted` / `text-subtle` | contenu | 4.5:1 sur **toutes** les surfaces | WCAG 1.4.3 |',
  '| `accent-text` | signal fuchsia lisible | 4.5:1 | le fuchsia n\'est jamais décoratif |',
  '| `accent-on` | texte sur remplissage fuchsia | 4.5:1 | WCAG 1.4.3 |',
  '| `focus-ring` | anneau de focus | 3:1 | WCAG 2.4.11 |',
  '| `border-strong` | arête qui **identifie** un contrôle | 3:1 | WCAG 1.4.11 |',
  '| `border` | arête de contenant | 1.25:1 | perceptible, non identifiant |',
  '| `border-subtle` | filet séparateur | 1.10:1 | décoratif assumé, jamais seul repère |',
  '',
  '| Thème | Premier plan | Fond | Rapport | Seuil | Résultat | Rôle |',
  '|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.theme} | \`${r.fg}\` | \`${r.bg}\` | **${r.ratio}:1** | ${r.min}:1 | ${r.ok ? 'PASS' : '**FAIL**'} | ${r.why} |`,
  ),
  '',
  `**${rows.filter((r) => r.ok).length} / ${rows.length} paires conformes.**`,
  '',
].join('\n');

/* ─────────────────────────────────────────────────────────────── *
 * 5. Sprite d'icônes
 * ─────────────────────────────────────────────────────────────── */
const sprite = [
  `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">`,
  `  <!-- AIME ICONOGRAPHY V1 — grille 24 · keyline 20 · trait 1.5 · extrémités rondes -->`,
  ...icons.map(
    (i) =>
      `  <symbol id="i-${i.id}" viewBox="${ICON_CONTRACT.viewBox}" fill="${ICON_CONTRACT.fill}" stroke="${ICON_CONTRACT.color}" stroke-width="${ICON_CONTRACT.strokeWidth}" stroke-linecap="${ICON_CONTRACT.linecap}" stroke-linejoin="${ICON_CONTRACT.linejoin}">${i.body}</symbol>`,
  ),
  `</svg>`,
  ``,
].join('\n');

const iconsJson = {
  $schema: 'aime-iconography/v1',
  contract: ICON_CONTRACT,
  categories,
  icons: icons.map((i) => ({ id: `i-${i.id}`, category: i.cat, label: i.label })),
  count: icons.length,
};

/* ─────────────────────────────────────────────────────────────── *
 * 6. Écriture + vérification de cohérence
 * ─────────────────────────────────────────────────────────────── */
const ids = icons.map((i) => i.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) failures.push(`icônes en double : ${dupes.join(', ')}`);

const missingCat = categories.filter((c) => !icons.some((i) => i.cat === c));
if (missingCat.length) failures.push(`catégories sans icône : ${missingCat.join(', ')}`);

/* Chaque état de connaissance doit exister comme icône. */
for (const [, , , glyph] of knowledgeStates) {
  if (!ids.includes(glyph)) failures.push(`état NOEMA sans icône : ${glyph}`);
}

/* Les alias d'espace doivent pointer sur une étape réelle. */
for (const [alias, ref] of Object.entries(spaceAliases)) {
  const idx = Number(ref.split('-')[1]);
  if (!space[idx - 1]) failures.push(`alias d'espace invalide : ${alias} → ${ref}`);
}

write('tokens/tokens.css', tokensCss);
write('tokens/tokens.json', JSON.stringify(tokensJson, null, 2) + '\n');
write('tokens/CONTRAST-REPORT.md', md);
write('tokens/icons.json', JSON.stringify(iconsJson, null, 2) + '\n');
write('assets/aime-icons.svg', sprite);

/* Rapport console */
const byTheme = { dark: rows.filter((r) => r.theme === 'dark'), light: rows.filter((r) => r.theme === 'light') };
console.log('\nAIME DESIGN SYSTEM V1 — build\n');
console.log(`  primitives      ${Object.values(primitives).reduce((a, r) => a + Object.keys(r).length, 0)} couleurs`);
console.log(`  rôles           ${Object.keys(dark).length} par thème × 2 thèmes`);
console.log(`  états           ${Object.keys(statusRamps).length} × 5 déclinaisons`);
console.log(`  typographie     ${typeScale.length} rôles (ratio ${TYPE_RATIO})`);
console.log(`  espace          ${space.length} étapes fermées`);
console.log(`  icônes          ${icons.length} pictogrammes · ${categories.length} catégories`);
console.log(`  border-strong   déduit du contraste → dark ${resolved['border-strong'].dark.hex} (${r2(resolved['border-strong'].dark.ratio)}:1) · light ${resolved['border-strong'].light.hex} (${r2(resolved['border-strong'].light.ratio)}:1)`);
for (const [t, rs] of Object.entries(byTheme)) {
  const worst = [...rs].sort((a, b) => a.ratio - b.ratio)[0];
  console.log(`  contraste ${t.padEnd(5)}  ${rs.filter((r) => r.ok).length}/${rs.length} PASS · pire paire ${worst.fg}/${worst.bg} = ${worst.ratio}:1`);
}

if (failures.length) {
  console.error('\n✗ BUILD REFUSÉ — le système contient des valeurs non conformes :');
  for (const f of failures) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('\n✓ tokens et icônes générés, contrastes conformes.\n');

/* Vérifie que le CSS écrit est bien relisible (garde-fou contre un build vide). */
const back = readFileSync(join(ROOT, 'tokens/tokens.css'), 'utf8');
if (!back.includes('--aime-color-accent:') || !back.includes('--aime-state-proposed-style:')) {
  console.error('✗ tokens.css incomplet');
  process.exit(1);
}
