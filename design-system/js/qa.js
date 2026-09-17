/**
 * AIME DESIGN SYSTEM V1 — DESIGN QA
 *
 * Un écran n'est pas terminé tant que ces règles ne sont pas respectées.
 * Ce module ne dépend d'aucun DOM : il travaille sur du texte et du JSON,
 * donc les MÊMES règles s'exécutent dans `npm run qa` et dans le navigateur.
 *
 * Familles : ALIGNMENT · SPACING · TYPOGRAPHY · COLOR · CONTRAST ·
 *            ICONOGRAPHY · HIERARCHY · RESPONSIVE · OVERFLOW · FOCUS ·
 *            MOTION · CONSISTENCY
 */

/* ══════════════════════════════════════════════════════════════
   OUTILS
   ══════════════════════════════════════════════════════════════ */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

export function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === '\n') n++;
  return n;
}

/** Découpe un CSS en règles {sélecteur, corps, contexte d'at-rule}. */
export function parseRules(css) {
  const clean = stripComments(css);
  const rules = [];
  const walk = (text, offset, ctx) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open === -1) break;
      const prelude = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const inner = text.slice(open + 1, j - 1);
      const abs = offset + i;
      if (/^@(media|supports|container|layer|scope)/.test(prelude)) {
        walk(inner, offset + open + 1, prelude);
      } else if (prelude && !prelude.startsWith('@')) {
        rules.push({ selector: prelude, body: inner, ctx, line: lineOf(clean, abs) });
      }
      i = j;
    }
  };
  walk(clean, 0, null);
  return rules;
}

/** Déclarations d'un corps de règle. */
export function decls(body) {
  const out = [];
  for (const raw of body.split(';')) {
    const d = raw.trim();
    if (!d || !d.includes(':')) continue;
    const at = d.indexOf(':');
    out.push({ prop: d.slice(0, at).trim(), value: d.slice(at + 1).trim() });
  }
  return out;
}

/** Découpe une valeur CSS en morceaux, sans couper à l'intérieur d'un calc(). */
export function splitTop(value) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** Retire les régions équilibrées d'une classe donnée (ex. les scènes de démonstration). */
export function stripRegions(html, className) {
  const re = new RegExp(`<([a-z0-9]+)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'g');
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1];
    let depth = 1;
    let i = re.lastIndex;
    const inner = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
    inner.lastIndex = i;
    let t;
    while ((t = inner.exec(html))) {
      if (t[0].startsWith('</')) depth--;
      else depth++;
      if (depth === 0) {
        i = inner.lastIndex;
        break;
      }
    }
    out += html.slice(last, m.index);
    last = i;
    re.lastIndex = i;
  }
  return out + html.slice(last);
}

const pxValues = (value) => [...value.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => Number(m[1]));

/* ══════════════════════════════════════════════════════════════
   RÈGLES DU SYSTÈME (les mêmes que celles documentées)
   ══════════════════════════════════════════════════════════════ */
const SPACING_PROPS = /^(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?$/;
const SIZE_PROPS = /^(width|height|min-width|min-height|max-width|max-height)$/;
/* Tout token d'espacement du système : échelle, alias fonctionnels,
   gouttières et marges de page. Rien d'autre n'est de l'espacement. */
const SPACE_TOKENS =
  /var\(--aime-(space-\d+|gap-inline|gap-stack|gap-group|gap-section|page-margin|hairline|margin-(?:mobile|tablet|desktop|wide)|gutter-(?:mobile|tablet|desktop|wide))\)/;
const SPACING_OK = /^(0|auto|inherit|initial|unset|revert)$/;

/* Le nowrap est autorisé là où le contenu est court par contrat. */
const NOWRAP_OK = /(\.a-btn|\.a-pill|\.a-tag|\.a-badge|\.nstate|\.a-tabs__tab|\.a-crumbs|kbd|\.a-kbd|\.utl__when|\.utl__clip|\.a-toast__title|\.viz-bars__label|\.viz-cols__key|\.ds-row__spec|\.a-menu__item|\.cmdbar__item|\.a-search__kbd|\.a-divider--label|\.ucard__type|\.cnode__title|\.a-select)/;

/* Primitives de motion admises → keyframes autorisées. */
const KEYFRAMES = {
  'a-fade': 'fade',
  'a-slide-up': 'slide',
  'a-slide-in-end': 'slide',
  'a-slide-in-start': 'slide',
  'a-slide-across': 'slide',
  'a-scale-in': 'scale',
  'a-expand': 'expand',
  'a-collapse': 'collapse',
  'a-connect': 'connect',
  'a-dot-fade': 'fade',
  'a-skeleton': 'fade',
};

const SYSTEM_PREFIX = /^(a-|l-|t-|u-|ds-|noema|ucard|utl|ugrid|umedia|composer|cnode|clink|inspector|viz|prov|nstate|sresults|rview|vdiff|ba__|ba-|cmdbar|ohead|mslot|aslot|spec__|approval|conf__|conf$)/;
/* Emoji et dingbats : interdits partout. Les flèches typographiques sont
   autorisées dans le texte courant mais jamais à l'intérieur d'un contrôle. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F0FF}\u{2B00}-\u{2BFF}]/gu;
const ARROW = /[\u{2190}-\u{21FF}\u{2794}\u{27F0}-\u{27FF}]/u;

/* ══════════════════════════════════════════════════════════════
   AUDIT
   ══════════════════════════════════════════════════════════════ */
/**
 * @param {object} input
 *   cssFiles    [{ name, text }]   feuilles du système
 *   tokenCss    { name, text }     tokens.css (seule source de littéraux couleur)
 *   tokensJson  objet              tokens.json
 *   pages       [{ name, html }]   écrans HTML
 *   sprite      texte              aime-icons.svg
 *   live        résultat optionnel de auditLive()
 */
export function audit(input) {
  const { cssFiles = [], tokenCss, tokensJson, pages = [], sprite = '', live = null } = input;
  /* ── Les blocs <style> d'une page sont du CSS comme un autre ──────
     Sans ceci, une page peut embarquer toute sa feuille dans un <style>
     et passer l'audit : les familles CSS ne lisaient que `cssFiles`, et
     les familles HTML retiraient justement les <style> avant de lire.
     Les deux se neutralisaient, et ~120 couleurs littérales d'atlas/
     étaient invisibles.

     Ces blocs sont donc ajoutés à la liste des feuilles, sous un nom qui
     dit d'où ils viennent. Conséquence voulue : leurs classes comptent
     comme définies, et leurs valeurs passent par COLOR, SPACING,
     TYPOGRAPHY, ALIGNMENT et MOTION.
     ───────────────────────────────────────────────────────────────── */
  const pageStyles = [];
  for (const p of pages) {
    const blocks = [...String(p.html).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    blocks.forEach((m, i) => {
      pageStyles.push({
        name: blocks.length > 1 ? `${p.name} <style #${i + 1}>` : `${p.name} <style>`,
        text: m[1],
        /* Ligne de départ dans la page, pour que le rapport pointe juste. */
        pageLine: lineOf(p.html, m.index),
      });
    });
  }

  const sheets = tokenCss ? [tokenCss, ...cssFiles] : [...cssFiles];
  const allCss = [...sheets, ...pageStyles];
  const issues = [];
  const add = (family, file, line, message) => issues.push({ family, file, line, message });

  const rulesByFile = new Map(allCss.map((f) => [f.name, parseRules(f.text)]));

  /* ── COLOR ─────────────────────────────────────────────────── */
  for (const f of allCss) {
    if (tokenCss && f.name === tokenCss.name) continue;
    const clean = stripComments(f.text);
    for (const m of clean.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g)) {
      add('COLOR', f.name, lineOf(clean, m.index), `couleur littérale « ${m[0]} » — utiliser un rôle (--aime-color-*)`);
    }
  }
  /* les pages ne portent aucune couleur en dur non plus */
  for (const p of pages) {
    for (const m of p.html.matchAll(/style="[^"]*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))[ ^"]*"/g)) {
      add('COLOR', p.name, lineOf(p.html, m.index), `couleur littérale dans un style en ligne : ${m[1]}`);
    }
  }

  /* ── CONSISTENCY : tokens définis / référencés ─────────────── */
  const defined = new Set();
  for (const f of allCss) for (const m of stripComments(f.text).matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const f of allCss) {
    const clean = stripComments(f.text);
    for (const m of clean.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const name = m[1];
      if (name.startsWith('--aime-') && !defined.has(name)) {
        add('CONSISTENCY', f.name, lineOf(clean, m.index), `token inconnu : ${name}`);
      }
    }
  }
  for (const p of pages) {
    for (const m of p.html.matchAll(/var\(\s*(--aime-[a-z0-9-]+)/g)) {
      if (!defined.has(m[1])) add('CONSISTENCY', p.name, lineOf(p.html, m.index), `token inconnu : ${m[1]}`);
    }
  }

  /* ── SPACING ───────────────────────────────────────────────── */
  for (const f of allCss) {
    for (const r of rulesByFile.get(f.name)) {
      for (const d of decls(r.body)) {
        if (!SPACING_PROPS.test(d.prop)) continue;
        const parts = splitTop(d.value);
        const bad = parts.filter((part) => {
          if (SPACING_OK.test(part)) return false;
          if (SPACE_TOKENS.test(part)) return false;
          if (/^calc\(/.test(part) && !/px/.test(part)) return false;
          if (/^(inherit|initial|unset|revert|thin|medium|thick)$/.test(part)) return false;
          return true;
        });
        if (bad.length) {
          add('SPACING', f.name, r.line, `${r.selector} { ${d.prop}: ${d.value} } — hors échelle d'espacement`);
        }
      }
    }
  }

  /* ── ALIGNMENT : dimensions, pistes, rayons ────────────────── */
  const devices = Object.values(tokensJson?.deviceProfiles || {});
  const radii = new Set(Object.values(tokensJson?.radius || {}));
  for (const f of allCss) {
    for (const r of rulesByFile.get(f.name)) {
      for (const d of decls(r.body)) {
        if (SIZE_PROPS.test(d.prop) || /^grid-template-(columns|rows)$/.test(d.prop)) {
          for (const px of pxValues(d.value)) {
            const abs = Math.abs(px);
            if (abs <= 16) continue; // échelle optique : marques et filets
            if (abs % 4 === 0) continue;
            if (devices.includes(abs)) continue;
            add('ALIGNMENT', f.name, r.line, `${r.selector} { ${d.prop}: ${px}px } — ni multiple de 4, ni repère optique ≤ 16 px`);
          }
        }
        if (d.prop === 'border-radius') {
          for (const px of pxValues(d.value)) {
            if (!radii.has(px)) add('ALIGNMENT', f.name, r.line, `${r.selector} { border-radius: ${px}px } — rayon hors des quatre niveaux`);
          }
        }
      }
    }
  }

  /* ── TYPOGRAPHY ────────────────────────────────────────────── */
  const sizes = new Set((tokensJson?.typography?.roles || []).map((t) => t.size));
  for (const f of allCss) {
    for (const r of rulesByFile.get(f.name)) {
      for (const d of decls(r.body)) {
        if (d.prop === 'font-size') {
          for (const px of pxValues(d.value)) {
            if (!sizes.has(px)) add('TYPOGRAPHY', f.name, r.line, `${r.selector} { font-size: ${px}px } — hors des 9 rôles typographiques`);
          }
        }
        if (d.prop === 'line-height' && !/^(normal|var\()/.test(d.value)) {
          const n = Number(d.value);
          if (Number.isFinite(n) && (n < 1 || n > 1.6)) {
            add('TYPOGRAPHY', f.name, r.line, `${r.selector} { line-height: ${n} } — hors de l'intervalle 1.0 – 1.6`);
          }
        }
      }
    }
  }

  /* ── MOTION ────────────────────────────────────────────────── */
  const declaredKeyframes = new Set();
  for (const f of allCss) for (const m of stripComments(f.text).matchAll(/@keyframes\s+([a-z0-9-]+)/g)) declaredKeyframes.add(m[1]);
  for (const f of allCss) {
    for (const r of rulesByFile.get(f.name)) {
      for (const d of decls(r.body)) {
        if (/^(transition|animation|transition-duration|animation-duration|transition-delay|animation-delay)$/.test(d.prop)) {
          const ms = [...d.value.matchAll(/(\d*\.?\d+)(m?s)/g)];
          for (const m of ms) {
            const val = m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]);
            if (val === 0 || val === 1) continue; // 0s / 1ms (reduced motion)
            add('MOTION', f.name, r.line, `${r.selector} { ${d.prop}: …${m[0]} } — durée littérale, utiliser var(--aime-motion-*)`);
          }
          for (const m of d.value.matchAll(/\b(a-[a-z-]+)\b/g)) {
            if (!declaredKeyframes.has(m[1]) && !/^(a-fade|a-slide-up|a-scale-in|a-expand)$/.test(m[1])) continue;
            if (!KEYFRAMES[m[1]]) add('MOTION', f.name, r.line, `keyframe « ${m[1]} » hors des sept primitives`);
          }
        }
      }
    }
  }
  const hasReduced = allCss.some((f) => /prefers-reduced-motion/.test(f.text));
  if (!hasReduced) add('MOTION', 'styles/*', 0, 'aucun bloc prefers-reduced-motion : le mouvement n\'est pas désactivable');

  /* ── FOCUS ─────────────────────────────────────────────────── */
  for (const f of allCss) {
    const hasSubstitute = /:focus-within[^{]*\{[^}]*--aime-focus-ring/.test(f.text);
    for (const r of rulesByFile.get(f.name)) {
      for (const d of decls(r.body)) {
        if (d.prop === 'outline' && /^(none|0)$/.test(d.value)) {
          const exempt = /:focus:not\(:focus-visible\)/.test(r.selector);
          if (!exempt && !hasSubstitute) {
            add('FOCUS', f.name, r.line, `${r.selector} { outline: ${d.value} } — anneau supprimé sans substitution`);
          }
        }
      }
    }
  }
  /* Nom accessible de tout élément interactif */
  for (const p of pages) {
    const labelled = new Set([...p.html.matchAll(/<label[^>]*\bfor="([^"]+)"/g)].map((m) => m[1]));
    const interactive = [...p.html.matchAll(/<(button|a\s[^>]*href|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/g)];
    for (const m of interactive) {
      const attrs = m[2] || '';
      const inner = m[3] || '';
      if (/type="(hidden|submit|button|reset)"/.test(attrs) && !/aria-label|value=/.test(attrs) && m[1] === 'input') {
        add('FOCUS', p.name, lineOf(p.html, m.index), 'input sans nom accessible');
        continue;
      }
      const text = inner.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const idm = attrs.match(/\bid="([^"]+)"/);
      const named =
        /aria-label=|aria-labelledby=|title=|<label|alt=/.test(attrs + inner) ||
        text.length > 0 ||
        /<svg[\s\S]*?<title>/.test(inner) ||
        (idm && labelled.has(idm[1]));
      if (!named) add('FOCUS', p.name, lineOf(p.html, m.index), `élément <${m[1]}> sans nom accessible`);
    }
  }

  /* ── ICONOGRAPHY ───────────────────────────────────────────── */
  const spriteIds = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  for (const p of pages) {
    for (const m of p.html.matchAll(/<use href="[^"#]*#([^"]+)"/g)) {
      if (!spriteIds.has(m[1])) add('ICONOGRAPHY', p.name, lineOf(p.html, m.index), `icône inexistante : #${m[1]}`);
    }
    for (const m of p.html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
      const attrs = m[1] || '';
      const inner = m[2] || '';
      const decorative = /aria-hidden="true"/.test(attrs);
      const labelled = /role="img"/.test(attrs) && /aria-label=|<title>/.test(attrs + inner);
      if (!decorative && !labelled) {
        add('ICONOGRAPHY', p.name, lineOf(p.html, m.index), 'SVG ni décoratif (aria-hidden) ni nommé (role="img" + label)');
      }
    }
    const text = p.html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
    for (const m of text.matchAll(EMOJI)) {
      add('ICONOGRAPHY', p.name, lineOf(p.html, p.html.indexOf(m[0])), `emoji « ${m[0]} » dans l'interface — utiliser la famille SVG AIME`);
    }
    /* Une flèche typographique dans un bouton ou un lien est une icône déguisée. */
    for (const m of p.html.matchAll(/<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const label = (m[2] || '').replace(/<[^>]*>/g, ' ');
      if (ARROW.test(label)) {
        add('ICONOGRAPHY', p.name, lineOf(p.html, m.index), `flèche « ${label.trim().slice(0, 24)} » dans un contrôle — utiliser un pictogramme`);
      }
    }
    /* Les icônes déclaratives doivent exister dans le sprite. */
    for (const m of p.html.matchAll(/data-a-icon="([^"]+)"/g)) {
      if (!spriteIds.has(`i-${m[1]}`)) add('ICONOGRAPHY', p.name, lineOf(p.html, m.index), `icône inexistante : ${m[1]}`);
    }
  }
  for (const f of allCss) {
    for (const m of stripComments(f.text).matchAll(/content:\s*["'][^"']*["']/g)) {
      if (EMOJI.test(m[0])) add('ICONOGRAPHY', f.name, lineOf(f.text, m.index), `emoji dans content : ${m[0]}`);
    }
  }

  /* ── HIERARCHY ─────────────────────────────────────────────── */
  for (const p of pages) {
    const hier = stripRegions(p.html, 'ds-demo__stage');
    const h1 = (hier.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) add('HIERARCHY', p.name, 0, `${h1} <h1> — un écran doit avoir exactement un titre de niveau 1`);
    const levels = [...hier.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        add('HIERARCHY', p.name, lineOf(p.html, p.html.indexOf(`<h${levels[i]}`)), `saut de niveau h${levels[i - 1]} → h${levels[i]}`);
      }
    }
    const display = (hier.match(/t-display/g) || []).length;
    if (display > 1) add('HIERARCHY', p.name, 0, `${display} usages de .t-display — un seul affichage par écran`);
  }

  /* ── RESPONSIVE ────────────────────────────────────────────── */
  for (const p of pages) {
    if (!/name="viewport"/.test(p.html)) add('RESPONSIVE', p.name, 0, 'meta viewport absent');
  }
  const bps = Object.values(tokensJson?.breakpoints || {}).filter(Boolean);
  const layoutCss = cssFiles.find((f) => /layout\.css$/.test(f.name));
  if (layoutCss) {
    const used = [...layoutCss.text.matchAll(/@media[^{]*?\((?:min|max)-width:\s*(\d+)px\)/g)].map((m) => Number(m[1]));
    for (const bp of bps) {
      if (bp && !used.includes(bp) && !used.includes(bp - 1)) {
        add('RESPONSIVE', layoutCss.name, 0, `point de rupture ${bp}px jamais traité`);
      }
    }
  }

  /* ── OVERFLOW ──────────────────────────────────────────────── */
  for (const f of allCss) {
    for (const r of rulesByFile.get(f.name)) {
      const d = decls(r.body);
      const nowrap = d.some((x) => x.prop === 'white-space' && x.value === 'nowrap');
      if (!nowrap) continue;
      const handled = d.some((x) => /^(overflow|overflow-x|text-overflow)$/.test(x.prop));
      if (!handled && !NOWRAP_OK.test(r.selector)) {
        add('OVERFLOW', f.name, r.line, `${r.selector} — white-space: nowrap sans gestion de débordement`);
      }
    }
  }

  /* ── CONSISTENCY : classes utilisées / définies ────────────── */
  const definedClasses = new Set();
  for (const f of allCss) for (const m of stripComments(f.text).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) definedClasses.add(m[1]);
  const usedClasses = new Map();
  for (const p of pages) {
    for (const m of p.html.matchAll(/class="([^"]+)"/g)) {
      for (const c of m[1].split(/\s+/)) {
        if (!c) continue;
        if (!usedClasses.has(c)) usedClasses.set(c, { file: p.name, line: lineOf(p.html, m.index) });
      }
    }
  }
  for (const [c, where] of usedClasses) {
    if (definedClasses.has(c)) continue;
    if (SYSTEM_PREFIX.test(c)) {
      add('CONSISTENCY', where.file, where.line, `classe système « ${c} » utilisée mais jamais définie`);
    }
  }
  /* Styles en ligne : une référence de token est tolérée, une valeur est interdite.
     Un écran ne doit jamais décider d'une taille, d'une couleur ou d'un espace. */
  for (const p of pages) {
    for (const m of p.html.matchAll(/style="([^"]+)"/g)) {
      for (const decl of splitTop(m[1].replace(/;\s*$/, ''))) {
        const at = decl.indexOf(':');
        if (at === -1) continue;
        const prop = decl.slice(0, at).trim();
        const value = decl.slice(at + 1).trim();
        const literal = /\d(px|rem|em|%|vw|vh)|#[0-9a-fA-F]{3,8}|rgba?\(/.test(value);
        if (literal) {
          add('CONSISTENCY', p.name, lineOf(p.html, m.index), `style en ligne portant une valeur : ${prop}: ${value}`);
        }
      }
    }
  }

  /* ── CONTRAST — revérifié sur l'artefact livré ─────────────── */
  if (live?.contrast) {
    for (const row of live.contrast.rows) {
      if (!row.ok) add('CONTRAST', 'tokens/tokens.json', 0, `${row.theme} : ${row.fg} sur ${row.bg} = ${row.ratio}:1 (< ${row.min}:1)`);
    }
  }
  if (live?.geometry) {
    for (const g of live.geometry) add('OVERFLOW', g.file, 0, `${g.selector} déborde de ${g.overflow}px`);
    for (const g of live.targets || []) add('FOCUS', g.file, 0, `cible ${g.selector} de ${g.size}px < 24px`);
  }

  /* ── RAPPORT ───────────────────────────────────────────────── */
  const families = ['ALIGNMENT', 'SPACING', 'TYPOGRAPHY', 'COLOR', 'CONTRAST', 'ICONOGRAPHY', 'HIERARCHY', 'RESPONSIVE', 'OVERFLOW', 'FOCUS', 'MOTION', 'CONSISTENCY'];
  const checks = families.map((family) => {
    const own = issues.filter((i) => i.family === family);
    return {
      id: family.toLowerCase(),
      family,
      result: own.length ? 'fail' : 'pass',
      count: own.length,
      issues: own.slice(0, 40),
      truncated: own.length > 40 ? own.length - 40 : 0,
    };
  });

  return {
    version: '1.0.0',
    at: new Date().toISOString(),
    scope: { css: allCss.length, pages: pages.length, icons: spriteIds.size },
    checks,
    issues: issues.length,
    pass: issues.length === 0,
  };
}

/* ══════════════════════════════════════════════════════════════
   AUDIT VIVANT (navigateur uniquement) — géométrie réelle
   ══════════════════════════════════════════════════════════════ */
export function auditLive(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc || !doc.body) return null;
  const file = doc.title || 'document';
  const geometry = [];
  const targets = [];
  const seen = new Set();
  for (const el of doc.body.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'svg', 'use', 'symbol'].includes(tag)) continue;
    if (el.closest('[hidden]')) continue;
    const key = el.className?.toString?.() || tag;
    if (el.scrollWidth - el.clientWidth > 2 && !/auto|scroll|hidden/.test(getComputedStyle(el).overflowX)) {
      const sig = `${tag}.${key}`.slice(0, 60);
      if (!seen.has(sig)) {
        seen.add(sig);
        geometry.push({ file, selector: sig, overflow: el.scrollWidth - el.clientWidth });
      }
    }
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.width < 24 || r.height < 24)) {
        const sig = `${tag}.${key}`.slice(0, 60);
        if (!seen.has(sig)) {
          seen.add(sig);
          targets.push({ file, selector: sig, size: Math.round(Math.min(r.width, r.height)) });
        }
      }
    }
  }
  return { geometry, targets };
}
