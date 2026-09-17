/**
 * AIME DESIGN SYSTEM V1 — source de vérité des tokens.
 *
 * Règle systémique : ce fichier est le SEUL endroit où une couleur est écrite en littéral.
 * Tout le reste du système (styles, pages, expériences) ne référence que des tokens.
 * Le build échoue si une paire de rôles ne respecte pas son seuil de contraste WCAG :
 * aucune couleur n'entre dans le système sans preuve.
 */

/* ------------------------------------------------------------------ *
 * WCAG 2.x — luminance relative et rapport de contraste
 * ------------------------------------------------------------------ */
export const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

export const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const r2 = (n) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ *
 * PRIMITIVES — palette
 * Trois familles seulement : neutres chauds, ivoire, fuchsia.
 * Les neutres tirent très légèrement vers l'ivoire (hue chaude) pour que
 * le mode sombre reste matériel et non clinique.
 * ------------------------------------------------------------------ */
export const primitives = {
  neutral: {
    '950': '#08080A',
    '900': '#0C0C0E',
    '850': '#111114',
    '800': '#16161A',
    '700': '#1E1E23',
    '600': '#2A2A31',
    '500': '#3A3A43',
    '400': '#56565F',
    '300': '#7A7A83',
    '200': '#A2A2A8',
    '100': '#C9C8C4',
    '050': '#E6E4DE',
  },
  ivoire: {
    '000': '#FFFFFF',
    '050': '#F5F3EE',
    '100': '#FBFAF7',
    '150': '#F2F0EA',
  },
  fuchsia: {
    '200': '#FFA9D6',
    '300': '#FF7AC4',
    '400': '#FF4FB0',
    '500': '#FF2F9E',
    '600': '#DE1183',
    '700': '#AE0A66',
    '800': '#7A0748',
  },
};

/* Rampes fonctionnelles — une par rôle d'état, trois degrés seulement. */
export const statusRamps = {
  success: { light: '#0E7A4E', mid: '#149461', dark: '#5FD6A4' },
  warning: { light: '#8A5300', mid: '#B57208', dark: '#E5A63C' },
  error: { light: '#B3271F', mid: '#D2392E', dark: '#FF8A80' },
  info: { light: '#1D5C9C', mid: '#2A74BC', dark: '#8CC4F5' },
};

/* ------------------------------------------------------------------ *
 * SEUILS — ce que le système s'engage à respecter
 * ------------------------------------------------------------------ */
export const TARGETS = {
  text: 4.5, // texte courant, sur TOUTES les surfaces
  textLarge: 3, // texte ≥ 24px / 19px gras
  ui: 3, // WCAG 1.4.11 — limite qui IDENTIFIE un objet (contrôle, sélection, état)
  accentText: 4.5, // le fuchsia n'est jamais décoratif : il doit être lisible
  /* Séparateurs structurels : WCAG 1.4.11 ne s'applique pas à un filet décoratif.
     Le système exige seulement qu'il reste perceptible, et l'écrit. */
  separator: 1.1,
  edge: 1.25,
};

/* Sélecteur de neutre : remonte ou descend la rampe jusqu'au seuil.
   Utilisé pour que les bordures soient DÉDUITES du contraste, pas choisies à l'œil. */
export const NEUTRAL_ASC = ['950', '900', '850', '800', '700', '600', '500', '400', '300', '200', '100', '050'];

export function pickNeutral(startKey, direction, backgrounds, min) {
  const i = NEUTRAL_ASC.indexOf(startKey);
  const seq = direction === 'lighter' ? NEUTRAL_ASC.slice(i) : NEUTRAL_ASC.slice(0, i + 1).reverse();
  for (const k of seq) {
    const hex = primitives.neutral[k];
    const worst = Math.min(...backgrounds.map((bg) => contrast(hex, bg)));
    if (worst >= min) return { key: k, hex, ratio: worst };
  }
  const k = seq[seq.length - 1];
  return { key: k, hex: primitives.neutral[k], ratio: Math.min(...backgrounds.map((bg) => contrast(primitives.neutral[k], bg))) };
}

/* ------------------------------------------------------------------ *
 * SÉLECTEUR — choisit dans une rampe le premier degré qui atteint la cible
 * ------------------------------------------------------------------ */
const order = ['dark', 'mid', 'light'];

export function pickStatus(ramp, background, min) {
  for (const key of order) {
    if (contrast(ramp[key], background) >= min) return { key, hex: ramp[key], ratio: contrast(ramp[key], background) };
  }
  return { key: order[order.length - 1], hex: ramp[order[order.length - 1]], ratio: contrast(ramp[order[order.length - 1]], background) };
}

/* ------------------------------------------------------------------ *
 * THÈMES — rôles sémantiques
 * Un rôle = une fonction. Jamais une couleur arbitraire.
 * ------------------------------------------------------------------ */
export function buildThemes() {
  const n = primitives.neutral;
  const iv = primitives.ivoire;
  const f = primitives.fuchsia;

  const dark = {
    background: n['950'],
    surface: n['900'],
    'surface-elevated': n['850'],
    'surface-overlay': n['800'],
    'surface-sunken': n['950'],
    text: iv['050'],
    'text-muted': n['100'],
    'text-subtle': n['200'],
    'text-inverse': n['950'],
    'border-subtle': n['700'],
    border: n['600'],
    'border-strong': null, // résolu par le contraste, plus bas
    accent: f['500'],
    'accent-hover': f['400'],
    'accent-active': f['600'],
    'accent-subtle': 'rgba(255, 47, 158, 0.12)',
    'accent-text': f['300'],
    'accent-on': n['950'],
    'focus-ring': f['300'],
    'grid-line': n['800'],
    scrim: 'rgba(8, 8, 10, 0.72)',
  };

  const light = {
    background: iv['150'],
    surface: iv['100'],
    'surface-elevated': iv['000'],
    'surface-overlay': iv['000'],
    'surface-sunken': iv['150'],
    text: n['950'],
    'text-muted': n['500'],
    'text-subtle': n['400'],
    'text-inverse': iv['050'],
    'border-subtle': n['100'],
    border: n['200'],
    'border-strong': null, // résolu par le contraste, plus bas
    accent: f['600'],
    'accent-hover': f['700'],
    'accent-active': f['800'],
    'accent-subtle': 'rgba(222, 17, 131, 0.10)',
    'accent-text': f['700'],
    'accent-on': iv['000'],
    'focus-ring': f['700'],
    'grid-line': n['100'],
    scrim: 'rgba(242, 240, 234, 0.72)',
  };

  /* border-strong est l'arête qui IDENTIFIE un contrôle (WCAG 1.4.11 → 3:1).
     Sa valeur n'est pas choisie : elle est déduite du pire fond possible. */
  const surfacesOf = (t) => [t.background, t.surface, t['surface-elevated'], t['surface-overlay']];
  const strongDark = pickNeutral('400', 'lighter', surfacesOf(dark), TARGETS.ui);
  const strongLight = pickNeutral('400', 'darker', surfacesOf(light), TARGETS.ui);
  dark['border-strong'] = strongDark.hex;
  light['border-strong'] = strongLight.hex;

  /* Les couleurs d'état sont RÉSOLUES par le contraste, pas choisies à l'œil. */
  const statuses = {};
  for (const [themeName, theme] of Object.entries({ dark, light })) {
    for (const [name, ramp] of Object.entries(statusRamps)) {
      const text = pickStatus(ramp, theme.background, TARGETS.text);
      const ui = pickStatus(ramp, theme.background, TARGETS.ui);
      const onFill = themeName === 'dark' ? n['950'] : iv['000'];
      statuses[`${themeName}.${name}`] = {
        text: text.hex,
        border: ui.hex,
        solid: ui.hex,
        'on-solid': contrast(onFill, ui.hex) >= TARGETS.text ? onFill : theme.text,
        surface: themeName === 'dark' ? `${ui.hex}1F` : `${ui.hex}14`,
        _resolved: { textFrom: text.key, ratioText: r2(text.ratio), ratioUi: r2(ui.ratio) },
      };
    }
  }

  return { dark, light, statuses, resolved: { 'border-strong': { dark: strongDark, light: strongLight } } };
}

/* ------------------------------------------------------------------ *
 * TYPOGRAPHIE
 * Règle assumée : la bande UI (11→16) progresse par pas de 1 px, parce que
 * de petites tailles ne doivent pas se multiplier ; la bande éditoriale
 * (16→39) suit l'échelle modulaire 1.25. Le DISPLAY s'étend en fluide.
 * ------------------------------------------------------------------ */
export const TYPE_RATIO = 1.25;

export const typeScale = [
  { role: 'META', size: 11, lh: 1.3, ls: 0.1, weight: 500, measure: 90, font: 'mono', transform: 'uppercase' },
  { role: 'CAPTION', size: 12, lh: 1.4, ls: 0, weight: 400, measure: 90, font: 'sans', transform: 'none' },
  { role: 'LABEL', size: 13, lh: 1.35, ls: 0.08, weight: 500, measure: 40, font: 'sans', transform: 'uppercase' },
  { role: 'BODY-SMALL', size: 14, lh: 1.5, ls: 0, weight: 400, measure: 78, font: 'sans', transform: 'none' },
  { role: 'BODY', size: 16, lh: 1.55, ls: -0.005, weight: 400, measure: 68, font: 'sans', transform: 'none' },
  { role: 'H3', size: 20, lh: 1.25, ls: -0.01, weight: 600, measure: 44, font: 'sans', transform: 'none' },
  { role: 'H2', size: 25, lh: 1.16, ls: -0.02, weight: 600, measure: 38, font: 'sans', transform: 'none' },
  { role: 'H1', size: 31, lh: 1.08, ls: -0.03, weight: 700, measure: 30, font: 'sans', transform: 'none' },
  { role: 'DISPLAY', size: 39, lh: 1.0, ls: -0.045, weight: 700, measure: 24, font: 'sans', transform: 'none' },
];

/* Extension fluide du DISPLAY et du H1 : mêmes ancrages, même ratio. */
export const typeFluid = {
  H1: { min: 31, max: 52, slope: 3.4, offset: 8 },
  DISPLAY: { min: 39, max: 84, slope: 5, offset: 12 },
};

export const fontFamilies = {
  sans: 'Inter, "Inter var", "Helvetica Neue", "Segoe UI Variable Text", system-ui, -apple-system, Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", "Roboto Mono", Menlo, Consolas, monospace',
};

export const fontWeights = { regular: 400, medium: 500, semibold: 600, bold: 700 };

/* ------------------------------------------------------------------ *
 * ESPACE — échelle imposée, aucune valeur hors échelle
 * ------------------------------------------------------------------ */
export const space = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128];

export const spaceAliases = {
  'gap-inline': 'space-2', // 8 — entre éléments d'une même ligne
  'gap-stack': 'space-4', // 16 — empilement courant
  'gap-group': 'space-6', // 32 — entre groupes
  'gap-section': 'space-8', // 96 — entre sections
  'page-margin': 'space-6', // 32 — marge de page (desktop)
  'hairline': 'space-1', // 4 — respiration minimale, jamais en dessous
};

/* Hauteurs de contrôle : multiples de 4, hors échelle d'espacement (ce sont des tailles). */
export const controlHeights = { xs: 24, sm: 32, md: 40, lg: 48 };

/* ------------------------------------------------------------------ *
 * RAYONS — quatre niveaux, aucun autre
 * ------------------------------------------------------------------ */
export const radius = { none: 0, small: 4, medium: 8, large: 14, pill: 999 };

/* ------------------------------------------------------------------ *
 * OMBRES — deux seulement. La profondeur vient de la surface, du contraste
 * et de l'espace. L'ombre est réservée à ce qui flotte au-dessus du plan.
 * ------------------------------------------------------------------ */
export const shadows = {
  none: 'none',
  raise: '0 1px 2px rgba(8,8,10,.10), 0 12px 32px rgba(8,8,10,.22)',
  drag: '0 2px 4px rgba(8,8,10,.16), 0 24px 56px rgba(8,8,10,.34)',
};

/* ------------------------------------------------------------------ *
 * MOTION — sept primitives, quatre durées, trois courbes
 * ------------------------------------------------------------------ */
export const motion = {
  /* cycle et stagger : les deux seules durées longues du système,
     réservées aux indicateurs de chargement et aux séquences. */
  duration: { instant: 80, fast: 140, base: 200, slow: 320, cycle: 900, stagger: 150 },
  ease: {
    out: 'cubic-bezier(.2,.7,.3,1)',
    in: 'cubic-bezier(.5,0,.9,.4)',
    inout: 'cubic-bezier(.4,0,.2,1)',
  },
};

/* ------------------------------------------------------------------ *
 * LAYOUT — grille, proportions, rythme
 * ------------------------------------------------------------------ */
export const layout = {
  columns: { mobile: 4, tablet: 6, desktop: 12, wide: 12 },
  gutter: { mobile: 12, tablet: 16, desktop: 24, wide: 32 },
  margin: { mobile: 20, tablet: 32, desktop: 64, wide: 96 },
  measure: { mobile: 480, tablet: 720, desktop: 1040, wide: 1280 },
  canvasMax: 1680,
  golden: 1.618,
};

export const breakpoints = { mobile: 0, tablet: 640, desktop: 1024, wide: 1440 };

/* Largeurs de simulation utilisées par la documentation responsive.
   Elles sont déclarées ici pour ne pas devenir des valeurs libres. */
export const deviceProfiles = { mobile: 375, tablet: 768, desktop: 1280 };

/* Z-index : couches nommées, jamais de valeurs libres. */
export const layers = { base: 0, sticky: 100, dropdown: 400, drawer: 600, overlay: 800, toast: 900, tooltip: 1000 };

/* ------------------------------------------------------------------ *
 * CONTRAT DE CONTRASTE — une seule définition, deux exécuteurs.
 * Le build la refuse à la génération ; le QA la revérifie sur l'artefact
 * livré. Si les deux divergent, c'est un bug du système, pas une opinion.
 * ------------------------------------------------------------------ */
/* ══════════════════════════════════════════════════════════════
   VOCABULAIRE ÉPISTÉMIQUE — contrat partagé
   ══════════════════════════════════════════════════════════════
   UNE seule définition pour tout le projet. Le Design System la
   transforme en jetons visuels (forme + couleur + glyphe) ; la boucle
   NOEMA l'utilise comme type de donnée. Ni l'un ni l'autre ne peut
   inventer un état sans faire échouer la compilation.

   AUDIT/DATA-MODEL-V1.md §5 proposait un vocabulaire différent
   (CONFIRMED · DECLARED · EXTRACTED · INFERRED · SUGGESTED · UNKNOWN).
   La table DATA_MODEL_CONFIDENCE_MAP le rattache à celui-ci : les deux
   couches ne peuvent plus diverger.

   key    — identifiant, utilisé dans les jetons et les données
   role   — famille de couleur sémantique
   style  — LA forme qui porte le sens : pointillé, tireté, plein
   glyph  — pictogramme obligatoire, vérifié à la compilation
   label  — libellé français
   established — vrai si l'état désigne un fait établi
*/
export const EPISTEMIC_STATES = [
  { key: 'observed', role: 'info', style: 'dotted', glyph: 'noe-observed', label: 'Observé', established: false },
  { key: 'extracted', role: 'info', style: 'dashed', glyph: 'noe-extracted', label: 'Extrait', established: false },
  { key: 'inferred', role: 'warning', style: 'dashed', glyph: 'noe-inferred', label: 'Déduit', established: false },
  { key: 'proposed', role: 'accent', style: 'dashed', glyph: 'noe-proposed', label: 'Proposé', established: false },
  { key: 'confirmed', role: 'success', style: 'solid', glyph: 'noe-confirmed', label: 'Confirmé', established: true },
  { key: 'superseded', role: 'muted', style: 'solid', glyph: 'noe-superseded', label: 'Remplacé', established: true },
];

export const EPISTEMIC_KEYS = EPISTEMIC_STATES.map((s) => s.key);

/** Le seul état « établi » qui vaille : un fait confirmé par un humain. */
export const ESTABLISHED_STATES = EPISTEMIC_STATES.filter((s) => s.established).map((s) => s.key);

/* La confiance s'exprime en trois degrés. Jamais en pourcentage :
   un nombre inventé est une fausse précision. */
export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

/* Rattachement du vocabulaire de AUDIT/DATA-MODEL-V1.md §5.
   UNKNOWN n'est pas un état : c'est une absence, affichée par .is-unknown. */
export const DATA_MODEL_CONFIDENCE_MAP = {
  CONFIRMED: 'confirmed',
  DECLARED: 'observed',
  EXTRACTED: 'extracted',
  INFERRED: 'inferred',
  SUGGESTED: 'proposed',
  UNKNOWN: null,
};

export const SURFACES = ['background', 'surface', 'surface-elevated', 'surface-overlay'];

export const SURFACE_LABEL = {
  background: 'fond de page',
  surface: 'surface',
  'surface-elevated': 'surface élevée',
  'surface-overlay': 'surface flottante',
};

export function contrastPairs() {
  const pairs = [];
  for (const role of ['text', 'text-muted', 'text-subtle']) {
    const label = role === 'text' ? 'Texte courant' : role === 'text-muted' ? 'Texte secondaire' : 'Texte méta';
    for (const s of SURFACES) pairs.push([role, s, TARGETS.text, `${label} sur ${SURFACE_LABEL[s]}`]);
  }
  pairs.push(
    ['accent-text', 'background', TARGETS.accentText, 'Fuchsia en texte sur fond de page'],
    ['accent-text', 'surface', TARGETS.accentText, 'Fuchsia en texte sur surface'],
    ['accent-text', 'surface-elevated', TARGETS.accentText, 'Fuchsia en texte sur surface élevée'],
    ['accent-on', 'accent', TARGETS.text, 'Texte sur remplissage fuchsia'],
    ['accent', 'background', TARGETS.ui, 'Fuchsia en signal non textuel'],
    ['focus-ring', 'background', TARGETS.ui, 'Anneau de focus (WCAG 2.4.11)'],
    ['focus-ring', 'surface', TARGETS.ui, 'Anneau de focus sur surface'],
    ['border-subtle', 'background', TARGETS.separator, 'Filet séparateur (non identifiant)'],
    ['border-subtle', 'surface', TARGETS.separator, 'Filet séparateur sur surface'],
    ['border', 'background', TARGETS.edge, 'Arête de contenant (non identifiante)'],
    ['border', 'surface', TARGETS.edge, 'Arête de contenant sur surface'],
    ['text-inverse', 'text', TARGETS.ui, 'Inversion texte/fond'],
  );
  for (const s of SURFACES) pairs.push(['border-strong', s, TARGETS.ui, `Arête de contrôle sur ${SURFACE_LABEL[s]}`]);
  return pairs;
}

export const STATUS_PAIRS = [
  ['text', 'background', TARGETS.text, 'état en texte sur fond'],
  ['border', 'background', TARGETS.ui, 'état en bordure / repère'],
  ['on-solid', 'solid', TARGETS.text, 'texte sur remplissage d\'état'],
];

/**
 * Évalue le contrat complet sur les thèmes réellement générés.
 * Retourne les lignes de preuve et les échecs. Utilisé par le build
 * (qui refuse de générer) et par le QA (qui refuse de valider).
 */
export function evaluateContrast() {
  const { dark, light, statuses } = buildThemes();
  const rows = [];
  const failures = [];
  for (const themeName of ['dark', 'light']) {
    const theme = themeName === 'dark' ? dark : light;
    for (const [fg, bg, min, why] of contrastPairs()) {
      const ratio = r2(contrast(theme[fg], theme[bg]));
      const ok = ratio >= min;
      if (!ok) failures.push(`${themeName}: ${fg} sur ${bg} = ${ratio}:1 (< ${min}:1)`);
      rows.push({ theme: themeName, fg, bg, ratio, min, ok, why });
    }
    for (const name of Object.keys(statusRamps)) {
      const s = statuses[`${themeName}.${name}`];
      for (const [fg, bg, min, why] of STATUS_PAIRS) {
        const a = s[fg];
        const b = bg === 'solid' ? s.solid : theme[bg];
        const ratio = r2(contrast(a, b));
        const ok = ratio >= min;
        if (!ok) failures.push(`${themeName}: ${name}.${fg} = ${ratio}:1 (< ${min}:1)`);
        rows.push({ theme: themeName, fg: `${name}-${fg}`, bg: bg === 'solid' ? `${name}-solid` : bg, ratio, min, ok, why: `${name} — ${why}` });
      }
    }
  }
  return { rows, failures };
}
