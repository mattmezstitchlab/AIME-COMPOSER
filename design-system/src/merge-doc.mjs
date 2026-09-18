#!/usr/bin/env node
/**
 * AIME DESIGN SYSTEM V1 — fusion de la documentation en UNE page verticale.
 *
 * Script à usage unique (18 sept. 2026) : lit les 20 chapitres HTML
 * (index + 19) et la page Direction artistique, et écrit un seul
 * `index.html` où chaque chapitre devient une <section class="ds-chapter">.
 *
 * Règles appliquées, pour que la page reste un écran du système :
 *   - un seul <h1> (le hero de l'accueil) ; les heros de chapitre passent
 *     en <h2 class="t-h1">, leurs h2 en h3, leurs h3 en h4 — aucun saut ;
 *   - un seul .t-display hors démos (HIERARCHY) ;
 *   - identifiants de sections préfixés par le chapitre (onze collisions
 *     mesurées : contraste, echelle, etats ×4, familles, focus…) ;
 *   - liens inter-chapitres réécrits en ancres ;
 *   - pagers de chapitre supprimés (le sommaire latéral les remplace) ;
 *   - scripts de chapitre (module de contraste, démo de mouvement,
 *     render-tokens, direction) inclus une seule fois.
 *
 *   node src/merge-doc.mjs          # écrit index.html à partir de src/doc-intro.html + chapitres
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHAPTERS = [
  ['index', '01', 'Accueil'],
  ['foundations', '02', 'Foundations'],
  ['color', '03', 'Couleur'],
  ['typography', '04', 'Typographie'],
  ['space', '05', 'Espace & grille'],
  ['icons', '06', 'Iconographie'],
  ['components', '07', 'Fondamentaux'],
  ['aime-components', '08', 'Composants AIME'],
  ['noema-components', '09', 'Composants NOEMA'],
  ['universal-card', '10', 'Carte Universelle'],
  ['universal-timeline', '11', 'Timeline Universelle'],
  ['universal-grid', '12', 'Grille Universelle'],
  ['composer', '13', 'Composer'],
  ['responsive', '14', 'Responsive'],
  ['accessibility', '15', 'Accessibilité'],
  ['motion', '16', 'Motion'],
  ['dataviz', '17', 'Data visualisation'],
  ['patterns', '18', 'Patterns'],
  ['qa', '19', 'Design QA'],
  ['direction', '21', 'Direction artistique'],
];

/* L'accueil est lu depuis `src/doc-intro.html` (le chapitre 01 d'origine,
   conservé comme source) : la page fusionnée est la sortie, jamais l'entrée. */
const read = (slug) => readFileSync(slug === 'index' ? path.join(DS, 'src', 'doc-intro.html') : path.join(DS, `${slug}.html`), 'utf8');

function mainOf(html) {
  const a = html.indexOf('<main class="ds-main l-page">');
  const b = html.lastIndexOf('</main>');
  if (a < 0 || b < 0) throw new Error('main introuvable');
  return { inner: html.slice(a + '<main class="ds-main l-page">'.length, b), after: html.slice(b + '</main>'.length) };
}

/* Ce qui suit </main> : couches de démo (modale, tiroir) et scripts. */
function tailOf(after) {
  const body = after.replace(/<\/div>\s*<\/body>\s*<\/html>\s*$/, '').replace(/^\s*<\/div>/, '');
  const scripts = [];
  const markup = body.replace(/<script[\s\S]*?<\/script>/g, (m) => { scripts.push(m); return ''; }).trim();
  return { markup, scripts };
}

const sectionIds = (inner) => new Set([...inner.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]));

function transform(slug, num, label) {
  const html = read(slug);
  let { inner, after } = mainOf(html);
  const tail = tailOf(after);
  const isIntro = slug === 'index';

  /* Pagers et pied : le sommaire latéral et le pied unique les remplacent. */
  inner = inner.replace(/\s*<nav class="ds-pager"[\s\S]*?<\/nav>/g, '');
  let foot = '';
  inner = inner.replace(/\s*<footer class="ds-foot">[\s\S]*?<\/footer>/, (m) => { foot = m.trim(); return ''; });

  /* Identifiants de sections : préfixe par chapitre, références comprises. */
  if (!isIntro) {
    for (const id of sectionIds(inner)) {
      const re = new RegExp(`(id|aria-labelledby)="${id}"`, 'g');
      inner = inner.replace(re, `$1="${slug}-${id}"`);
      inner = inner.replace(new RegExp(`href="#${id}"`, 'g'), `href="#${slug}-${id}"`);
    }
  }

  /* Liens inter-chapitres → ancres (experiences/ garde son chemin). */
  inner = inner.replace(/href="([a-z-]+)\.html(?:#([\w-]+))?"/g, (m, page, frag) => {
    if (page === 'index') return 'href="#intro"';
    return frag ? `href="#${page}-${frag}"` : `href="#${page}"`;
  });

  /* Hiérarchie : un seul h1 et un seul .t-display dans la page. */
  if (!isIntro) {
    inner = inner.replace(/<h3\b/g, '<h4').replace(/<\/h3>/g, '</h4>');
    inner = inner.replace(/<h2\b/g, '<h3').replace(/<\/h2>/g, '</h3>');
    const h1 = inner.match(/<h1 class="t-display">([\s\S]*?)<\/h1>/);
    if (!h1) throw new Error(`${slug} : hero sans h1.t-display`);
    inner = inner.replace(h1[0], `<h2 class="t-h1" id="${slug}-title">${h1[1]}</h2>`);
    inner = inner.replace('<header class="ds-hero">', `<header class="ds-hero ds-chapter__hero">`);
    inner = `\n  <section class="ds-chapter" id="${slug}" aria-labelledby="${slug}-title" data-chapter="${num}">${inner}\n  </section>\n`;
  } else {
    inner = inner.replace('<header class="ds-hero">', '<header class="ds-hero" id="intro">');
  }
  return { inner, foot, tail, slug, num, label };
}

const parts = CHAPTERS.map(([s, n, l]) => transform(s, n, l));
const head = read('index').split('<body>')[0]
  .replace('<title>Accueil — AIME Design System V1</title>', '<title>AIME Design System V1 — la documentation en une page</title>')
  .replace('<script src="js/aime-ui.js" defer></script>', '<script src="js/aime-ui.js" defer></script>\n<script src="js/direction.js" defer></script>');

const intro = parts[0];
const chapters = parts.slice(1);
const tailMarkup = parts.map((p) => p.tail.markup).filter(Boolean).join('\n');
const seen = new Set();
const tailScripts = parts.flatMap((p) => p.tail.scripts).filter((s) => { const k = s.replace(/\s+/g, ' '); if (seen.has(k)) return false; seen.add(k); return true; });

/* Ancres de chapitre : le sommaire de la page, lu aussi par js/doc.js. */
const toc = `
  <nav class="ds-toc" aria-label="Chapitres de la page">
    <p class="t-label">Une page, ${CHAPTERS.length} chapitres</p>
    <ol class="ds-toc__list">${CHAPTERS.slice(1).map(([s, n, l]) => `\n      <li><a class="a-text-btn" href="#${s}"><span class="a-badge">${n}</span>${l}</a></li>`).join('')}
    </ol>
  </nav>
`;

const introInner = intro.inner.replace(/(<\/header>)/, `$1\n${toc}`);

const out = `${head}<body>
<div class="ds-shell">
<main class="ds-main l-page">
${introInner}
${chapters.map((c) => c.inner).join('\n')}
  ${intro.foot.replace('AIME Design System V1 — proposition, à valider avant implémentation.', 'AIME Design System V1 — une seule page verticale, 20 chapitres, les écrans réels à part.')}

</main>
</div>
${tailMarkup}
${tailScripts.join('\n')}
</body>
</html>
`;

/* Garde-fous avant écriture. */
const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) throw new Error(`identifiants en double : ${[...new Set(dup)].join(', ')}`);
const h1s = (out.match(/<h1[\s>]/g) || []).length;
if (h1s !== 1) throw new Error(`${h1s} <h1> — il en faut exactement un`);
for (const m of out.matchAll(/(?:aria-labelledby|aria-controls|for|aria-describedby)="([^"]+)"/g)) {
  for (const ref of m[1].split(/\s+/)) if (!ids.includes(ref)) throw new Error(`référence orpheline : ${ref}`);
}
for (const m of out.matchAll(/href="#([\w-]+)"/g)) if (!ids.includes(m[1])) throw new Error(`ancre orpheline : #${m[1]}`);

const target = path.join(DS, 'index.html');
writeFileSync(target, out);
console.log(`index.html écrit : ${out.split('\n').length} lignes · ${CHAPTERS.length} chapitres · ${ids.length} identifiants uniques · ${tailScripts.length} scripts de fin`);
