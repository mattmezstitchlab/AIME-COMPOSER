/**
 * AIME / NOEMA — EXTRACTION MULTI-SOURCES (V2)
 *
 * Transforme les sources d'un projet à moteur (JSX, TSX, Vue, Svelte,
 * Astro, SCSS, Tailwind, CSS-in-JS) en trois entrées que le MÊME moteur
 * QA sait juger :
 *
 *   1. `sheets` — du CSS réel (blocs styled-components / css`` — le
 *      moteur les juge comme n'importe quelle feuille) ;
 *   2. `pages` — le contenu des composants normalisé (className→class),
 *      pour que les familles de contenu (FOCUS, ICONOGRAPHY, HIERARCHY…)
 *      courent dessus comme sur du HTML — écrans au sommet, fragments
 *      marqués ;
 *   3. `atoms` — observations atomiques (valeur + fichier + ligne +
 *      source) : classes utilitaires, styles inline d'objets, durées.
 *
 * Jamais d'exécution du code du projet. Jamais de valeur devinée : les
 * parties dynamiques non résolues vont dans `unresolved`, publié.
 */
import { lineOf } from '../../design-system/js/qa.js';

/* ══ Barèmes des cartographies utilitaires ════════════════════════
   Tailwind standard : un pas = 4 px (p-5 = 20 px — hors échelle fermée,
   c'est un écart SPACING, pas un avis). L'échelle du pont officiel
   reflète exactement l'échelle du système, par génération. */
const TW_SPACE = (n) => Math.abs(n) * 4;
const AIME_SPACE = { 0: 0, px: 1, 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 9: 96, 10: 128 };
const TW_TEXT = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 };
const AIME_TEXT = { meta: 11, caption: 12, label: 13, 'body-small': 14, body: 16, h3: 20, h2: 25, h1: 31, display: 39 };
const TW_RADIUS = { none: 0, sm: 2, DEFAULT: 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 999 };

const SPACING_PREFIX = /^(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)$/;
const SIZE_PREFIX = /^(w|h|size|min-w|max-w|min-h|max-h)$/;
const COLOR_PREFIX = /^(bg|text|border|border-[trblxyse]|ring|ring-offset|fill|stroke|from|via|to|accent|caret|divide|outline|outline-color|placeholder|decoration|shadow)$/;
const PALETTE_COLORS = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PALETTE_RE = new RegExp(`^(?:${PALETTE_COLORS})(?:-(?:50|[1-9]50|\\d{3}))?$|^white$|^black$`);
const ICON_LIBS = /from\s+["'](lucide-react|@heroicons\/react(?:\/\d{2})?(?:\/[a-z]+)?|react-icons(?:\/[a-z0-9]+)?|@phosphor-icons\/react|@fortawesome\/[a-z-]+|@mui\/icons-material|@tabler\/icons-react|antd)["']/g;

const camel = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const toPx = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  let m = s.match(/^(-?\d+(?:\.\d+)?)px$/i); if (m) return Math.abs(Number(m[1]));
  m = s.match(/^(-?\d+(?:\.\d+)?)(rem|em)$/i); if (m) return Math.abs(Number(m[1])) * 16;
  m = s.match(/^(-?\d+(?:\.\d+)?)$/); if (m) return Math.abs(Number(m[1]));
  return null;
};

/* ══ Littéraux de classes, toutes syntaxes ═══════════════════════ */
/**
 * Retourne les chaînes de classes d'un fichier, avec leur ligne.
 * Couvre : class="…", className="…", className={'…'}, :class="[…]",
 * clsx(…) / cn(…) / classnames(…), template literals (les segments
 * ${…} non résolus sont comptés, jamais devinés).
 */
export function classLiterals(text) {
  const found = [];   /* { classes, line } */
  let unresolved = 0;
  const push = (raw, index, { template = false } = {}) => {
    if (template && raw.includes('${')) {
      unresolved += (raw.match(/\$\{/g) || []).length;
      raw = raw.split(/\$\{[^}]*\}/g).join(' ');
    }
    const classes = raw.trim();
    if (classes) found.push({ classes, line: lineOf(text, index) });
  };

  for (const m of text.matchAll(/(?:className|class)\s*=\s*(["'])([^"']*)\1/g)) push(m[2], m.index);
  for (const m of text.matchAll(/(?:className|class)\s*=\s*\{`([^`]*)`\}/g)) push(m[1], m.index, { template: true });
  for (const m of text.matchAll(/(?:className|class)\s*=\s*\{(["'])([^"']*)\1\}/g)) push(m[2], m.index);
  /* Vue / Svelte : :class="[…]", v-bind:class="…" — les littéraux entre quotes. */
  for (const m of text.matchAll(/(?::|v-bind:)class\s*=\s*(["'])([\s\S]*?)\1/g)) {
    for (const q of m[2].matchAll(/(["'`])([^"'`]*?)\1/g)) push(q[2], m.index + (q.index || 0), { template: q[1] === '`' });
  }
  /* Fonctions de composition : clsx(…), cn(…), classnames(…), tv(…). */
  for (const m of text.matchAll(/\b(?:clsx|cn|classnames|tv)\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)) {
    const inner = m[1];
    let any = false;
    for (const q of inner.matchAll(/(["'`])((?:[^"'`])*?)\1/g)) { any = true; push(q[2], m.index + (q.index || 0), { template: q[1] === '`' }); }
    if (!any) unresolved += 1;
  }
  return { found, unresolved };
}

/* ══ Pairing FOCUS — la substitution, pas le token ═════════════════════
   Pont §9 : la famille FOCUS saturait de faux positifs — l'idiome
   canonique accessible shadcn/Tailwind
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
   était compté « anneau supprimé sans substitution ». Or c'est une
   substitution valide, plus accessible que l'outline par défaut.

   La règle, par attribut de classes (SEUL substitut reconnu = le même
   attribut, symétrique de l'exemption CSS `:focus:not(:focus-visible)`) :

     1. `focus-visible:outline-none` ACCOMPAGNÉ de `focus-visible:ring-*`
        (ou `focus-visible:shadow-*`) dans le même attribut = substitution
        valide → PAS un écart ;
     2. `focus:outline-none` (suppression au pointeur) sans substitution
        dans le même attribut = écart ;
     3. `outline-none` nu sans ring adjacent = écart ;
     4. toute paire non appariée est publiée : comptée en écarts et
        nommée dans le détail FOCUS (jamais devinée, jamais tue).

   Le `focus:ring-*` sans suppression d'outline n'est pas évalué ici
   (aucun outline n'est retiré — rien à signaler). Le withdraw
   pointer-only `focus:outline-none` n'est PAS une subsitution : au
   clavier, aucun `focus-visible:` ne restaure l'anneau — écart.
   Un ring au scope `focus:` ne couvre pas le clavier — écart.        */

/* Éclate « variant:base » → variant null si absent. */
const splitVariant = (t) => {
  const i = t.indexOf(':');
  if (i < 0) return { variant: null, rest: t };
  return { variant: t.slice(0, i), rest: t.slice(i + 1) };
};

/* Un substituant est un ring (ou une ombre portée) — reconnaissable par
   son préfixe, quel que soit son scope ou sa valeur (`ring-ring`,
   `ring-2`, `ring-[3px]`, `shadow-[0_0_0_2px]`…). */
const RING_OR_SHADOW = /^(ring|shadow)-/;

/**
 * Juge le pairing FOCUS d'un attribut de classes (valeur de classe,
 * intacte). La substitution n'est valide qu'au MÊME scope, dans le MÊME
 * attribut — la règle 1 du pont §9 nomme `focus-visible:ring-*` pour un
 * retrait au scope `focus-visible:` ; la règle 3 (`nu sans ring adjacent`)
 * exige pour un retrait nu un ring *nu* adjacent. Généralisation stricte :
 * un retrait au scope V est substitué ssi le même attribut porte un
 * `V:ring-*` / `V:shadow-*` de même scope V (V = focus-visible, focus,
 * focus-within, ou aucun scope pour un retrait nu).
 *   - `focus:ring-*` ne substitue PAS un `focus-visible:outline-none`
 *     (scope différent) — la fixture « incomplète » ;
 *   - `focus-within:ring-*` substitue un `focus-within:outline-none`
 *     (même scope) — le retrait n'est pas orphelin.
 * Retourne `{ outline, substitute, ecart }` — `ecart` non nul ssi un
 * retrait d'outline reste sans substitution de même scope.
 */
export function focusPairing(tokenString) {
  const matches = tokenString.match(/\S+/g) || [];
  let outline = null;
  const ringScopes = new Set();

  for (const raw of matches) {
    let t = raw.replace(/^!/, '').replace(/!$/, '');
    if (!t || t === '-') continue;
    const { variant, rest } = splitVariant(t);
    if (rest === 'outline-none') { if (!outline) outline = { variant, raw }; continue; }
    if (RING_OR_SHADOW.test(rest)) ringScopes.add(variant);
  }

  const substitute = outline ? ringScopes.has(outline.variant) : false;

  let ecart = null;
  if (outline && !substitute) {
    ecart = outline.variant === null
      ? `« ${outline.raw} » nu sans ring adjacent de même scope dans le même attribut`
      : outline.variant === 'focus'
        ? `« ${outline.raw} » (suppression au pointeur) sans substitution de même scope (${outline.variant}:ring-* / ${outline.variant}:shadow-*)`
        : `« ${outline.raw} » sans ${outline.variant}:ring-* / ${outline.variant}:shadow-* de même scope dans le même attribut`;
  }

  return { outline, substitute, ecart };
}
/**
 * Transforme UNE classe en atome(s) jugés. La valeur retour n'est
 * jamais un verdict : seul le moteur juge. `tokenized` compte les
 * références var(--aime-*) vues en chemin (adoption du pont).
 */
function judgeClass(rawToken, opts) {
  const atoms = [];
  let token = rawToken;
  let unresolved = 0;
  let tokenized = 0;

  token = token.replace(/^!/, '').replace(/!$/, '');
  while (/:/.test(token)) token = token.split(':').pop();   /* variantes */
  if (!token || token === '-') return { atoms, unresolved, tokenized };

  let negative = false;
  if (token.startsWith('-')) { negative = true; token = token.slice(1); }

  /* Valeur arbitraire : prefixe-[valeur]. */
  const arb = token.match(/^(?<prefix>[a-z][a-z-]*)\[(?<val>[^\]]+)\]$/i);
  if (arb) {
    const { prefix, val } = arb.groups;
    const v = val.replace(/_/g, ' ');
    if (/var\(--aime-/.test(v)) { tokenized += 1; return { atoms, unresolved, tokenized }; }
    if (/var\(/.test(v)) { unresolved += 1; return { atoms, unresolved, tokenized }; }
    if (SPACING_PREFIX.test(prefix)) {
      const px = toPx(v);
      px == null ? (unresolved += 1) : atoms.push({ kind: 'spacing-px', px, context: rawToken });
    } else if (SIZE_PREFIX.test(prefix)) {
      const px = toPx(v);
      px == null ? (unresolved += 1) : atoms.push({ kind: 'size-px', px, context: rawToken });
    } else if (prefix === 'text') {
      const px = toPx(v);
      if (px != null) atoms.push({ kind: 'font-size-px', px, context: rawToken });
      else if (/^(#|rgba?\(|hsla?\()/i.test(v)) atoms.push({ kind: 'color-literal', value: v });
      else if (/^[a-z]+$/i.test(v)) atoms.push({ kind: 'color-literal', value: v });
      else unresolved += 1;
    } else if (COLOR_PREFIX.test(prefix)) {
      if (/^(#|rgba?\(|hsla?\()/i.test(v) || /^[a-z]+$/i.test(v)) atoms.push({ kind: 'color-literal', value: v });
      else unresolved += 1;
    } else if (/^(duration|delay)$/.test(prefix)) {
      const ms = /ms$/.test(v) ? Number(v.slice(0, -2)) : /s$/.test(v) ? Number(v.slice(0, -1)) * 1000 : null;
      ms == null || !Number.isFinite(ms) ? (unresolved += 1) : atoms.push({ kind: 'duration-ms', ms, context: rawToken });
    } else if (/^rounded(-[trblse]{1,2})?$/.test(prefix)) {
      const px = toPx(v);
      px == null ? (unresolved += 1) : atoms.push({ kind: 'radius-px', px, context: rawToken });
    } else if (/^leading$/.test(prefix)) {
      const n = Number(v);
      Number.isFinite(n) ? atoms.push({ kind: 'line-height', value: n, context: rawToken }) : (unresolved += 1);
    } else {
      unresolved += 1; /* préfixe arbitraire inconnu : publié, jamais jugé à l'aveugle */
    }
    return { atoms, unresolved, tokenized };
  }

  /* Classes standard. */
  /* `outline-none` n'est plus un atome direct : il est jugé par pairing
     dans son attribut de classes (focusPairing ci-dessous, pont §9).
     « focus-visible:outline-none focus-visible:ring-* » est une
     substitution valide — jamais un écart. Un outline-none réellement
     défaillant remonte comme atome `focus-unpaired`, jugé FOCUS par qa.js. */
  let m = token.match(/^((?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y))-(.+)$/);
  if (m) {
    const key = m[2];
    if (/^(auto|full|min|max|fit|screen|none)$/.test(key)) return { atoms, unresolved, tokenized };
    if (opts.bridged) {
      if (!(key in AIME_SPACE)) { unresolved += 1; return { atoms, unresolved, tokenized }; }
      atoms.push({ kind: 'spacing-px', px: AIME_SPACE[key], context: rawToken });
    } else {
      const n = key === 'px' ? 0.25 : Number(key);
      /* 0.25 pas = 1 px (`p-px`) : un espacement de 1 px n'est pas dans
         l'échelle fermée, le moteur le dira. */
      if (!Number.isFinite(n)) { unresolved += 1; return { atoms, unresolved, tokenized }; }
      atoms.push({ kind: 'spacing-px', px: TW_SPACE(n), context: rawToken });
    }
    return { atoms, unresolved, tokenized };
  }
  m = token.match(/^(w|h|size|min-w|max-w|min-h|max-h)-(.+)$/);
  if (m) {
    const key = m[2];
    if (/^(auto|full|min|max|fit|screen|svw|lvw|dvw|\d+\/\d+)$/.test(key)) return { atoms, unresolved, tokenized };
    const n = Number(key);
    if (!Number.isFinite(n)) return { atoms, unresolved, tokenized }; /* clés nommées propres au projet */
    atoms.push({ kind: 'size-px', px: TW_SPACE(n), context: rawToken });
    return { atoms, unresolved, tokenized };
  }
  m = token.match(/^text-(.+)$/);
  if (m) {
    const key = m[1];
    const SIZES = opts.bridged ? AIME_TEXT : TW_TEXT;
    if (key in SIZES) atoms.push({ kind: 'font-size-px', px: SIZES[key], context: rawToken });
    else if (PALETTE_RE.test(key)) atoms.push({ kind: 'color-palette', value: rawToken });
    /* text-text, text-muted du pont, classes projets : rien à prouver. */
    return { atoms, unresolved, tokenized };
  }
  m = token.match(/^((?:bg|border|border-[trblxyse]|ring|ring-offset|fill|stroke|from|via|to|accent|caret|divide|placeholder|decoration))-(.+)$/);
  if (m) {
    const key = m[2];
    if (PALETTE_RE.test(key)) atoms.push({ kind: 'color-palette', value: rawToken });
    return { atoms, unresolved, tokenized };
  }
  m = token.match(/^(duration|delay)-(.+)$/);
  if (m) {
    const key = m[2];
    if (!/^(in|out|initial|inherit|none|linear|ease-[a-z]+|\[.*\])$/.test(key)) {
      const n = Number(key);
      Number.isFinite(n) ? atoms.push({ kind: 'duration-ms', ms: n, context: rawToken }) : (unresolved += 1);
    }
    return { atoms, unresolved, tokenized };
  }
  m = token.match(/^rounded(?:-([a-z0-9]+))?$/);
  if (m) {
    const key = m[1] || 'DEFAULT';
    const px = TW_RADIUS[key];
    px == null ? (unresolved += 1) : atoms.push({ kind: 'radius-px', px, context: rawToken });
    return { atoms, unresolved, tokenized };
  }
  return { atoms, unresolved, tokenized };
}

/* ══ Styles inline d'objets (JSX, Vue, Svelte, sx=) ══════════════ */
/** Contenu entre accolades équilibrées à partir d'un index. */
const balanced = (text, start) => {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(start + 1, i); }
  }
  return null;
};

export function inlineObjects(text) {
  const out = [];   /* { props: [{prop, value, isNumber, isVar}], line } */
  const markers = [/style\s*=\s*\{\{/g, /\bsx\s*=\s*\{\{/g, /(?::|v-bind:)style\s*=\s*(["'])\{\{/g];
  for (const re of markers) {
    for (const m of text.matchAll(re)) {
      /* position de la première accolade ouvrante après "={{ / ="{:" */
      const open = text.indexOf('{', m.index);
      const inner = balanced(text, open);
      if (inner == null) continue;
      const base = open + 1;
      const props = [];
      for (const p of inner.matchAll(/(["']?)([\w-]+)\1\s*:\s*(?:"([^"]*)"|'([^']*)'|(-?\d+(?:\.\d+)?)(px)?)/g)) {
        /* En JSX, un nombre nu est un pixel (sémantique React) : c'est un
           littéral comme '10px' — la règle CONSISTENCY le compte pareil. */
        const numericBare = p[5] !== undefined && !p[6];
        const raw = p[3] ?? p[4] ?? (numericBare ? `${p[5]}px` : p[5]);
        props.push({
          prop: camel(p[2]),
          value: raw,
          isVar: /var\(/.test(String(raw)),
          offset: base + p.index,
        });
      }
      out.push({ props, line: lineOf(text, m.index) });
    }
  }
  return out;
}

/** Propriétés inline → atomes (mêmes routages que le moteur CSS). */
const INLINE_SPACING = /^(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?$/;
const INLINE_SIZE = /^(width|height|min-width|min-height|max-width|max-height)$/;
const INLINE_COLOR = /^(color|background|background-color|border-color|border-(top|right|bottom|left)-color|outline-color|fill|stroke|caret-color)$/;

function inlineAtoms({ props }) {
  const atoms = [];
  for (const { prop, value, isVar } of props) {
    if (isVar) continue; /* une référence de token est tolérée, comme en HTML */
    const v = String(value).trim();
    const literal = /\d(px|rem|em|%|vw|vh)|#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(/i.test(v);
    /* Comme le moteur : toute valeur littérale en style inline est CONSISTENCY. */
    if (literal) atoms.push({ kind: 'inline-value', prop, value: v });
    const isColor = /(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/i.test(v);
    if (INLINE_COLOR.test(prop) && isColor) atoms.push({ kind: 'color-literal', value: v });
    if (INLINE_SPACING.test(prop)) {
      const px = toPx(v);
      if (px != null) atoms.push({ kind: 'spacing-px', px, context: `${prop}: ${v}` });
    }
    if (INLINE_SIZE.test(prop)) {
      const px = toPx(v);
      if (px != null) atoms.push({ kind: 'size-px', px, context: `${prop}: ${v}` });
    }
    if (prop === 'font-size') {
      const px = toPx(v);
      if (px != null) atoms.push({ kind: 'font-size-px', px, context: `${prop}: ${v}` });
    }
    if (prop === 'line-height' && !/^(normal|var\()/.test(v)) {
      /* Un ratio nu est nasal ; une valeur en px est ramenée au ratio
         implicite (base 16, la convention navigateur). */
      let n = Number(v);
      if (!Number.isFinite(n) && v.endsWith('px')) n = toPx(v) / 16;
      if (Number.isFinite(n)) atoms.push({ kind: 'line-height', value: n, context: `${prop}: ${v}` });
    }
    if (prop === 'border-radius') {
      const px = toPx(v);
      if (px != null) atoms.push({ kind: 'radius-px', px, context: `${prop}: ${v}` });
    }
  }
  return atoms;
}

/* ══ CSS-in-JS : styled.*`…`, css`…` ═════════════════════════════ */
export function styledBlocks(text) {
  const blocks = [];
  for (const m of text.matchAll(/(?:styled\.[a-z0-9]+|styled\([^)]*\)|css)\s*`([^`]*)`/g)) {
    blocks.push({ css: m[1], line: lineOf(text, m.index) });
  }
  return blocks;
}

/* ══ SCSS : substitution des variables simples ═══════════════════ */
/** Remplace $var par sa valeur littérale quand elle est simple — sinon,
    la variable reste (mieux sous-déclarer qu'inventer une valeur). */
export function scssSubstitute(text) {
  const vars = new Map();
  for (const m of text.matchAll(/^\s*\$([\w-]+)\s*:\s*([^;{]+);/gm)) {
    const v = m[2].trim();
    if (/^(-?\d+(?:\.\d+)?(px|rem|em)?|#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/.test(v)) {
      vars.set(m[1], v);
    }
  }
  let out = text;
  for (const [name, value] of vars) {
    out = out.replace(new RegExp(`\\$${name}\\b(?!\\s*:)`, 'g'), value);
  }
  return out;
}

/* ══ Normalisation JSX/Vue/Svelte vers un « HTML » lisible ═══════ */
export function normalizeComponent(text) {
  return text
    .replace(/className\s*=/g, 'class=')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => ' '.repeat(m.length));
}

/* ══ Extraction du projet ════════════════════════════════════════ */
/**
 * @param {object} collected sorties de collect()
 * @param {object} profile   sorties de profileProject()
 * @returns {{ sheets, pages, atoms, unresolved, unresolvedDetail, iconLibs, tokenized,
 *            screens,set fragments }}
 */
export function extractProject(collected, profile) {
  const sheets = [];
  const pages = [];
  const atoms = [];
  const iconLibs = new Set();
  let unresolved = 0;
  const unresolvedDetail = [];
  let tokenized = 0;

  const screenNames = new Set(profile.screens.map((s) => s.name));
  const opts = { bridged: !!profile.bridged };

  /* SCSS et modules : feuilles telles quelles (variables simples résolues). */
  for (const c of collected.cssFiles || []) {
    sheets.push({ name: c.name, text: c.scss ? scssSubstitute(c.text) : c.text, system: false });
  }

  const allSources = [...(collected.sources || [])];
  for (const src of allSources) {
    const isScreen = screenNames.has(src.name);
    const text = src.text;

    /* classes → atomes */
    const { found, unresolved: u1 } = classLiterals(text);
    unresolved += u1;
    if (u1) unresolvedDetail.push(`${src.name} — ${u1} construction(s) dynamique(s)`);
    for (const { classes, line } of found) {
      for (const rawToken of classes.split(/\s+/)) {
        if (!rawToken || rawToken.startsWith('data-')) continue;
        const r = judgeClass(rawToken, opts);
        unresolved += r.unresolved;
        tokenized += r.tokenized;
        for (const a of r.atoms) atoms.push({ ...a, file: src.name, line, source: `classe utilitaire « ${a.context || rawToken} »`.slice(0, 120) });
      }

      /* pairing FOCUS (pont §9) : un retrait d'outline n'est pas jugé seul,
         il est jugé dans son attribut de classes. outline présent et aucune
         substitution de même scope (ring ou shadow) → atome focus-unpaired.
         Substitution valide → rien. Pas d'outline → rien. */
      const { outline, ecart } = focusPairing(classes);
      if (ecart) {
        atoms.push({ kind: 'focus-unpaired', variant: outline.variant, token: outline.raw, value: ecart, file: src.name, line, source: `classe utilitaire « ${outline.raw} »`.slice(0, 120) });
      }
    }

    /* styles inline d'objets → atomes */
    for (const obj of inlineObjects(text)) {
      for (const a of inlineAtoms(obj)) atoms.push({ ...a, file: src.name, line: obj.line, source: 'style en ligne (objet)' });
    }

    /* styled-components / css`` → feuilles synthétiques, jugées par le moteur */
    const styled = styledBlocks(text);
    styled.forEach((b, i) => {
      sheets.push({
        name: styled.length > 1 ? `${src.name} <styled #${i + 1}>` : `${src.name} <styled>`,
        text: b.css,
        system: false,
        pageLine: b.line,
      });
    });

    /* bibliothèques d'icônes tierces : nommées, jamais comptées deux fois */
    for (const m of text.matchAll(ICON_LIBS)) iconLibs.add(m[1]);

    /* le composant devient une page pour le moteur : écran ou fragment */
    pages.push({
      name: src.name,
      html: normalizeComponent(text),
      density: src.density,
      kind: 'component',
      fragment: !isScreen,
    });
  }

  /* ── Documents HTML : toujours des écrans. Leurs classes HTML ne sont
     pas des utilitaires — sauf présence avérée de Tailwind. */
  const tailwindish = profile.engines.some((e) => e.startsWith('Tailwind'));
  if (tailwindish) {
    for (const p of collected.pages || []) {
      const { found, unresolved: u1 } = classLiterals(p.html);
      unresolved += u1;
      for (const { classes, line } of found) {
        for (const rawToken of classes.split(/\s+/)) {
          if (!rawToken) continue;
          const r = judgeClass(rawToken, opts);
          unresolved += r.unresolved;
          tokenized += r.tokenized;
          for (const a of r.atoms) atoms.push({ ...a, file: p.name, line, source: `classe utilitaire « ${a.context || rawToken} »`.slice(0, 120) });
        }
        const { outline, ecart } = focusPairing(classes);
        if (ecart) {
          atoms.push({ kind: 'focus-unpaired', variant: outline.variant, token: outline.raw, value: ecart, file: p.name, line, source: `classe utilitaire « ${outline.raw} »`.slice(0, 120) });
        }
      }
    }
  }

  /* Ordre stable avant jugement : le rapport doit être reproductible. */
  atoms.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || String(a.kind).localeCompare(String(b.kind)));

  return {
    sheets, pages, atoms,
    unresolved,
    unresolvedDetail: unresolvedDetail.slice(0, 10),
    iconLibs: [...iconLibs].sort(),
    tokenized,
  };
}
