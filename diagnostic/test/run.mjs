#!/usr/bin/env node
/**
 * AIME / NOEMA — TESTS DU DIAGNOSTIC
 *
 * Ce qui est testé ici, ce sont les propriétés qui font qu'un rapport
 * mérite d'être montré à un client :
 *
 *   · il ne sous-déclare jamais — chaque écran du projet est jugé ;
 *   · il n'invente rien — aucun écart qui ne sorte du moteur du système ;
 *   · il dit ce qu'il ne mesure pas ;
 *   · il ne modifie pas le projet qu'il examine.
 *
 * Un diagnostic qui se trompe dans le sens optimiste est pire qu'un
 * diagnostic absent : il donne une confiance qui ne repose sur rien.
 */
import { collect, densityOf, exclusions, IGNORED_DIRS } from '../src/collect.mjs';
import { diagnose, recommend, PROJECT_FAMILIES, REFERENCE_ONLY } from '../src/diagnose.mjs';
import { reference } from '../src/reference.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push({ name, message: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}\n      reçu : ${JSON.stringify(a)}\n      attendu : ${JSON.stringify(b)}`); };
const ok = (v, m) => { if (!v) throw new Error(m); };
const throws = (fn, m) => { try { fn(); } catch { return; } throw new Error(m); };

/* ── Un projet de test, écrit à la main ────────────────────────── */
function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), 'aime-diag-'));

  /* Un écran conforme : tout vient du système. */
  /* Viewport inclus : son absence est un écart réel, et ma première
     fixture l'oubliait. Le test reprochait alors à l'outil un défaut
     qui était le sien. */
  writeFileSync(join(dir, 'conforme.html'), `<!doctype html>
<html lang="fr" data-aime-theme="dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Conforme</title></head>
<body><main class="l-page"><h1 class="t-h1">Titre</h1>
<p class="t-body">Texte.</p></main></body></html>`);

  /* Un écran fautif : couleur littérale, emoji, pas de h1, champ sans nom. */
  writeFileSync(join(dir, 'fautif.html'), `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Fautif</title></head>
<body><div style="color:#ff3b30">texte</div>
<button type="button">✓ Valider</button>
<textarea placeholder="sans nom"></textarea></body></html>`);

  /* Un écran dense mais écrit à la main — le cas qui a fait mentir
     la première version du collecteur. */
  writeFileSync(join(dir, 'dense.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Dense</title><style>${'.x{padding:13px}'.repeat(400)}</style></head><body><h1 class="t-h1">Dense</h1><div class="x">contenu</div></body></html>`);

  /* Des artefacts qui ne doivent pas être jugés. */
  mkdirSync(join(dir, 'dist'));
  writeFileSync(join(dir, 'dist', 'bundle.html'), '<html><body>généré</body></html>');
  mkdirSync(join(dir, 'node_modules', 'pkg'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', 'pkg', 'index.html'), '<html><body>dépendance</body></html>');

  return dir;
}

const REF = reference();

/* ══ COLLECTE ═══════════════════════════════════════════════════ */
console.log('\nCOLLECTE');

test('tous les écrans du projet sont collectés — aucune sous-déclaration', () => {
  const dir = makeProject();
  const c = collect(dir);
  eq(c.pages.map((p) => p.name), ['conforme.html', 'dense.html', 'fautif.html'],
    'la liste des écrans collectés est fausse');
});

test('un fichier dense écrit à la main n\'est pas écarté', () => {
  const dir = makeProject();
  const c = collect(dir);
  const dense = c.pages.find((p) => p.name === 'dense.html');
  ok(dense, 'l\'écran dense a été écarté');
  ok(dense.density > 500, `densité inattendue : ${dense.density}`);
});

test('les artefacts de build sont exclus, et l\'exclusion est dite', () => {
  const dir = makeProject();
  const c = collect(dir);
  ok(!c.pages.some((p) => p.name.includes('dist')), 'dist/ a été jugé');
  ok(!c.pages.some((p) => p.name.includes('node_modules')), 'node_modules/ a été jugé');
  ok(c.skipped.some((s) => s.path === 'dist'), 'l\'exclusion de dist/ n\'est pas déclarée');
  ok(c.skipped.some((s) => s.path === 'node_modules'), 'l\'exclusion de node_modules/ n\'est pas déclarée');
});

test('un projet sans écran est signalé, pas noté zéro écart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-vide-'));
  const c = collect(dir);
  const d = diagnose(c, REF);
  eq(d.ok, false, 'un projet vide a été diagnostiqué comme conforme');
  ok(/aucun écran/i.test(d.reason), `raison illisible : ${d.reason}`);
});

test('la collecte est en lecture seule', () => {
  const dir = makeProject();
  const avant = readdirSync(dir).sort();
  collect(dir);
  eq(readdirSync(dir).sort(), avant, 'la collecte a modifié le projet');
});

/* ══ DIAGNOSTIC ═════════════════════════════════════════════════ */
console.log('\nDIAGNOSTIC');

test('un écran fautif produit des écarts dans les familles attendues', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  const byFamily = Object.fromEntries(d.families.map((f) => [f.family, f.count]));
  ok(byFamily.COLOR > 0, 'la couleur littérale n\'a pas été détectée');
  ok(byFamily.ICONOGRAPHY > 0, 'l\'emoji n\'a pas été détecté');
  ok(byFamily.HIERARCHY > 0, 'l\'absence de <h1> n\'a pas été détectée');
  ok(byFamily.FOCUS > 0, 'le champ sans nom n\'a pas été détecté');
});

test('un écran conforme ne produit aucun écart', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-ok-'));
  writeFileSync(join(dir, 'ok.html'), readFileSync(join(makeProject(), 'conforme.html'), 'utf8'));
  const d = diagnose(collect(dir), REF);
  eq(d.ecarts, 0, `un écran conforme remonte ${d.ecarts} écart(s)`);
  eq(d.density, 0, 'la densité d\'un projet conforme n\'est pas nulle');
});

test('aucun écart inventé : tout sort du moteur du système', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  /* Chaque famille du rapport doit être une famille que le moteur connaît. */
  const connues = [...PROJECT_FAMILIES, ...REFERENCE_ONLY];
  for (const f of d.families) ok(connues.includes(f.family), `famille inconnue du moteur : ${f.family}`);
  /* Le total publié doit être la somme des familles jugées. */
  const somme = d.families.reduce((n, f) => n + (f.result === 'PASS' ? 0 : f.count), 0);
  eq(d.ecarts, somme, 'le total publié ne correspond pas à la somme des familles');
});

test('CONTRAST n\'est pas imputé au projet', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  ok(!d.families.some((f) => f.family === 'CONTRAST'), 'CONTRAST est compté comme un écart du projet');
  ok(REFERENCE_ONLY.includes('CONTRAST'), 'CONTRAST n\'est pas déclaré comme référence');
});

test('la densité est bien le rapport écarts / écrans', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  eq(d.density, Number((d.ecarts / d.pages).toFixed(1)), 'densité incohérente');
});

test('l\'adoption du vocabulaire est mesurée', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  ok(d.adoption.total_classes > 0, 'aucune classe trouvée');
  ok(d.adoption.system_classes_used >= 2, `classes système détectées : ${d.adoption.system_classes_used}`);
  ok(d.adoption.sample.some((c) => c.startsWith('t-') || c.startsWith('l-')), 'aucun exemple de classe système');
});

test('les écrans les plus touchés sont classés', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  ok(d.worst_pages.length > 0, 'aucun écran classé');
  /* Le classement doit être décroissant, et un écran fautif passer avant
     un écran conforme. Je n'impose pas lequel des deux écrans fautifs
     arrive en tête : « dense » répète 400 fois un espacement hors échelle,
     il est donc légitimement le plus touché. Fixer « fautif » en premier
     codait mon intuition, pas la mesure. */
  for (let i = 1; i < d.worst_pages.length; i++) {
    ok(d.worst_pages[i - 1].count >= d.worst_pages[i].count, 'le classement n\'est pas décroissant');
  }
  const byName = Object.fromEntries(d.worst_pages.map((p) => [p.name, p.count]));
  eq(byName['conforme.html'], 0, 'l\'écran conforme remonte des écarts');
  ok(byName['fautif.html'] > 0, 'l\'écran fautif ne remonte aucun écart');
  ok(byName['dense.html'] > 0, 'l\'écran dense ne remonte aucun écart');
});

test('le rapport déclare ce qu\'il ne mesure pas', () => {
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);
  ok(Array.isArray(d.skipped), 'les exclusions ne sont pas publiées');
  ok(d.reference_only.length > 0, 'les familles de référence ne sont pas déclarées');
});

/* ══ RECOMMANDATION ═════════════════════════════════════════════ */
console.log('\nRECOMMANDATION');

test('la recommandation suit ce qui a été mesuré, dans l\'ordre du coût', () => {
  const dir = makeProject();
  const recs = recommend(diagnose(collect(dir), REF));
  ok(recs.length > 0, 'aucune recommandation');
  for (let i = 1; i < recs.length; i++) {
    ok(recs[i].priority > recs[i - 1].priority, 'les priorités ne sont pas croissantes');
  }
  /* HIERARCHY et FOCUS sont les moins chers : ils doivent passer avant COLOR. */
  const ordre = recs.map((r) => r.title);
  const iFocus = ordre.findIndex((t) => /focus/i.test(t));
  const iColor = ordre.findIndex((t) => /couleur/i.test(t));
  ok(iFocus >= 0 && iColor >= 0 && iFocus < iColor, 'le focus n\'est pas traité avant les couleurs');
});

test('un projet conforme ne reçoit aucune recommandation de chantier', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-ok2-'));
  writeFileSync(join(dir, 'ok.html'), readFileSync(join(makeProject(), 'conforme.html'), 'utf8'));
  const recs = recommend(diagnose(collect(dir), REF));
  eq(recs.length, 1, 'un projet conforme reçoit des recommandations');
  ok(/aucun écart/i.test(recs[0].title), `recommandation inattendue : ${recs[0].title}`);
});

test('un projet non diagnostiquable reçoit une raison, pas un plan', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-vide2-'));
  const recs = recommend(diagnose(collect(dir), REF));
  eq(recs.length, 1, 'plus d\'une entrée pour un projet vide');
  ok(/rien à diagnostiquer/i.test(recs[0].title), `titre inattendu : ${recs[0].title}`);
});

/* ══ INTÉGRITÉ ══════════════════════════════════════════════════ */
console.log('\nINTÉGRITÉ');

test('le diagnostic ne modifie pas le projet examiné', () => {
  const dir = makeProject();
  const snapshot = () => readdirSync(dir, { recursive: true }).sort().join('|');
  const avant = snapshot();
  diagnose(collect(dir), REF);
  eq(snapshot(), avant, 'le diagnostic a modifié le projet');
});

test('la référence est lue du Design System, pas recopiée', () => {
  const r = reference();
  ok(r.tokenCss.text.includes('--aime-color'), 'tokens.css ne semble pas être celui du système');
  ok(r.tokensJson.deviceProfiles, 'tokens.json n\'a pas deviceProfiles');
  ok(r.sprite.includes('<symbol id='), 'le sprite ne contient aucun symbole');
});

test('deux runs produisent le même rapport', () => {
  const dir = makeProject();
  const a = diagnose(collect(dir), REF);
  const b = diagnose(collect(dir), REF);
  eq(a.ecarts, b.ecarts, 'le nombre d\'écarts varie d\'un run à l\'autre');
  eq(a.worst_pages, b.worst_pages, 'le classement varie d\'un run à l\'autre');
});

/* ── Bilan ─────────────────────────────────────────────────────── */
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} test(s) réussi(s) · ${failures.length} échec(s)\n`);
if (failures.length) process.exit(1);
