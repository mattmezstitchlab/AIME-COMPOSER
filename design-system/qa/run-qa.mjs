/**
 * AIME DESIGN SYSTEM V1 — exécuteur QA.
 * `npm run qa` : lance le build puis l'audit complet du système livré.
 * Sortie non nulle si une seule règle échoue.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit } from '../js/qa.js';
import { evaluateContrast } from '../src/tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

/* 1. Sources du système */
const tokenCss = { name: 'tokens/tokens.css', text: read('tokens/tokens.css') };
const tokensJson = JSON.parse(read('tokens/tokens.json'));
const sprite = read('assets/aime-icons.svg');

const cssFiles = walk(join(ROOT, 'styles'))
  .filter((p) => p.endsWith('.css'))
  .sort()
  .map((p) => ({ name: relative(ROOT, p), text: readFileSync(p, 'utf8') }));

/* 2. Tous les écrans construits avec le système.
       Le périmètre n'est pas le dossier : c'est l'usage. Tout écran qui
       charge les feuilles du Design System est audité comme les autres,
       y compris ceux de la boucle NOEMA. Un écran exempté d'audit est un
       écran qui finira par inventer un style. */
const LOOP = join(ROOT, '..', 'loop');
const roots = [ROOT, ...(existsSync(LOOP) ? [LOOP] : [])];
const pages = roots
  .flatMap((r) => walk(r))
  .filter((p) => p.endsWith('.html') && !p.includes('node_modules'))
  .sort()
  .map((p) => ({ name: relative(join(ROOT, '..'), p), html: readFileSync(p, 'utf8') }));

/* 3. Contraste : le contrat partagé, rejoué sur l'artefact livré */
const contrast = evaluateContrast();

/* 4. Audit */
const report = audit({ cssFiles, tokenCss, tokensJson, pages, sprite, live: { contrast } });
report.contrast = {
  total: contrast.rows.length,
  pass: contrast.rows.filter((r) => r.ok).length,
  worst: [...contrast.rows].sort((a, b) => a.ratio - b.ratio)[0],
};

/* 5. Rapport console */
const pad = (s, n) => String(s).padEnd(n);
console.log('\nAIME DESIGN SYSTEM V1 — DESIGN QA');
console.log(`  périmètre : ${report.scope.css} feuilles CSS · ${report.scope.pages} écrans HTML · ${report.scope.icons} icônes\n`);
for (const c of report.checks) {
  const mark = c.result === 'pass' ? '✓' : '✗';
  console.log(`  ${mark} ${pad(c.family, 14)} ${c.result === 'pass' ? 'conforme' : `${c.count} écart${c.count > 1 ? 's' : ''}`}`);
  for (const i of c.issues.slice(0, 8)) {
    console.log(`      ${pad(i.file, 34)}${i.line ? `:${i.line}`.padEnd(6) : '      '}${i.message}`);
  }
  if (c.issues.length > 8) console.log(`      … ${c.issues.length - 8} autres`);
  if (c.truncated) console.log(`      … ${c.truncated} non affichés`);
}
console.log(`\n  contraste    ${report.contrast.pass}/${report.contrast.total} paires · pire ${report.contrast.worst.fg}/${report.contrast.worst.bg} = ${report.contrast.worst.ratio}:1`);

writeFileSync(join(ROOT, 'tokens/QA-REPORT.json'), JSON.stringify(report, null, 2) + '\n');

if (!report.pass) {
  console.error(`\n✗ QA REFUSÉ — ${report.issues} écart(s) au système. Rapport : tokens/QA-REPORT.json\n`);
  process.exit(1);
}
console.log(`\n✓ QA VALIDÉ — ${report.checks.length} familles conformes. Rapport : tokens/QA-REPORT.json\n`);
