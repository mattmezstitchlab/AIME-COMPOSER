/**
 * AIME — POINT ZERO · tests du moteur d'import local.
 *
 * Même école que home-resolver.test.mjs : fonctions pures, octets
 * construits à la main, aucune dépendance.
 *   node point-zero/pz-import.test.mjs
 */
import { classifyName, zipIndex, pdfTriage, summarizeImport } from './pz-import.mjs';

let total = 0;
let failed = 0;
function check(label, got, want) {
  total += 1;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failed += 1;
    console.log(`  ✗ ${label}\n      reçu    : ${JSON.stringify(got)}\n      attendu : ${JSON.stringify(want)}`);
  }
}
function ok(label, cond) {
  total += 1;
  if (!cond) { failed += 1; console.log(`  ✗ ${label}`); }
}

/* ── Construction d'un ZIP minimal (central directory + EOCD).
   Listing seul : les en-têtes locaux ne sont pas requis par zipIndex. */
function buildZip(entries) {
  const parts = [];
  const cd = [];
  for (const e of entries) {
    const nameBytes = new TextEncoder().encode(e.name);
    const rec = new Uint8Array(46 + nameBytes.length);
    const v = new DataView(rec.buffer);
    v.setUint32(0, 0x02014b50, true);
    v.setUint16(4, 20, true);           // version faite par
    v.setUint16(6, 20, true);           // version requise
    v.setUint16(10, e.method ?? 8, true);
    v.setUint32(20, e.packed ?? 0, true);
    v.setUint32(24, e.size ?? 0, true);
    v.setUint16(28, nameBytes.length, true);
    rec.set(nameBytes, 46);
    cd.push(rec);
  }
  const cdSize = cd.reduce((a, r) => a + r.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, 0, true);            // début du catalogue = 0 dans ce fichier jouet
  return new Uint8Array([...cd.flatMap((r) => [...r]), ...eocd]);
}

/* ── classifyName ─────────────────────────────────────────────── */
check('image', classifyName('hero.PNG'), { ext: 'png', kind: 'image' });
check('vidéo', classifyName('film.mov'), { ext: 'mov', kind: 'video' });
check('audio', classifyName('mix.flac'), { ext: 'flac', kind: 'audio' });
check('vecteur', classifyName('logo.svg'), { ext: 'svg', kind: 'vecteur' });
check('document pdf', classifyName('contrat.pdf'), { ext: 'pdf', kind: 'document' });
check('archive', classifyName('backup.ZIP'), { ext: 'zip', kind: 'archive' });
check('chemin complet', classifyName('docs/sous/carte.md'), { ext: 'md', kind: 'document' });
check('sans extension', classifyName('Makefile'), { ext: '', kind: 'autre' });
check('inconnu', classifyName('rendu.blend'), { ext: 'blend', kind: 'autre' });

/* ── zipIndex ─────────────────────────────────────────────────── */
const zip = buildZip([
  { name: 'affiche.pdf', size: 12000, packed: 8000 },
  { name: 'docs/', size: 0, packed: 0 },
  { name: 'docs/lisez-moi.txt', size: 340, packed: 200, method: 0 },
]);
const idx = zipIndex(zip);
ok('zip lisible', idx.ok === true);
check('zip compte', idx.count, 3);
check('zip fichiers (hors dossiers)', idx.files, 2);
check('zip première entrée', idx.entries[0].name, 'affiche.pdf');
check('zip méthode déflatée', idx.entries[0].method, 'déflaté');
check('zip méthode stockée', idx.entries[2].method, 'stocké');
ok('zip dossier repéré', idx.entries[1].dir === true);
ok('zip tailles réelles', idx.entries[0].size === 12000 && idx.entries[0].packed === 8000);

const broken = zipIndex(new Uint8Array([1, 2, 3, 4, 5]));
ok('zip illisible : refus honnête', broken.ok === false && broken.entries.length === 0 && typeof broken.reason === 'string');

/* ── pdfTriage ────────────────────────────────────────────────── */
const pdf = new TextEncoder().encode(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>\n' +
  '2 0 obj<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R>>\n' +
  '4 0 obj<</Type/Page/Parent 2 0 R>>\n' +
  '5 0 obj<</Title (Affiche v3 - Conservatoire)>>',
);
const tri = pdfTriage(pdf);
ok('pdf lisible', tri.ok === true);
check('pdf version', tri.version, '1.4');
check('pdf pages (racine /Pages exclue)', tri.pages, 2);
check('pdf titre', tri.title, 'Affiche v3 - Conservatoire');

const fake = pdfTriage(new TextEncoder().encode('<html><body>nope</body></html>'));
ok('non-pdf : refus honnête', fake.ok === false && typeof fake.reason === 'string');

/* ── summarizeImport ──────────────────────────────────────────── */
const sum = summarizeImport([
  { name: 'a.png', kind: 'image', sha: 'aaaabbbbccccdddd0000' },
  { name: 'copie-a.png', kind: 'image', sha: 'aaaabbbbccccdddd0000' },
  { name: 'film.mp4', kind: 'video', sha: '1111222233334444' },
  { name: 'notes.txt', kind: 'document' },
  { name: 'rendu.blend', kind: 'autre', skip: 'format non classifiable' },
]);
check('total vu', sum.total, 5);
check('conservés', sum.kept, 4);
check('par type', sum.byKind, { image: 2, video: 1, document: 1 });
check('écarté nommé + raison', sum.skipped, [{ name: 'rendu.blend', reason: 'format non classifiable' }]);
ok('doublon par empreinte', sum.dupes.length === 1 && sum.dupes[0].names.includes('a.png') && sum.dupes[0].names.includes('copie-a.png'));
check('empreintes calculées', sum.hashed, 3);
check('empreintes manquantes', sum.unhashed, 1);
check('import vide', summarizeImport([]).total, 0);

/* ── Verdict ──────────────────────────────────────────────────── */
if (failed) {
  console.log(`\n✗ IMPORT : ${failed} échec(s) / ${total}`);
  process.exit(1);
}
console.log(`\n✓ IMPORT : ${total}/${total}`);
