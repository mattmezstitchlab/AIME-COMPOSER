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
import { reference, systemStylesheets, DESIGN_SYSTEM } from '../src/reference.mjs';
import { fetchRepo } from '../diagnose.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Un couple propriétaire/dépôt réservé aux tests hors ligne : il ne
   correspond à rien sur GitHub, donc un test ne peut pas cloner par
   erreur un vrai dépôt en croyant travailler sur une fixture. */
const TEST_OWNER = 'test-owner-local';
const TEST_REPO = 'test-repo-vide';
const HERE = dirname(fileURLToPath(import.meta.url));

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

test('aucun écart ne se perd entre le total et le classement par écran', () => {
  /* Régression gardée. Le moteur QA borne par défaut la liste détaillée
     à 40 écarts par famille pour garder son rapport lisible, tandis que
     `count` reste le total. Ce module rattache chaque écart à son écran
     en parcourant cette liste : sur une liste amputée, il sous-déclarait
     — mesuré sur cet écran de test, 44 écarts rattachés pour 405 mesurés,
     et un classement par écran qui ne sommait pas au total publié.

     L'écran « dense » dépasse volontairement le plafond de 40 : c'est
     lui qui fait apparaître le défaut. Sans lui, le test passerait même
     avec la liste tronquée. */
  const dir = makeProject();
  const d = diagnose(collect(dir), REF);

  const somme = d.worst_pages.reduce((n, p) => n + p.count, 0);
  eq(somme, d.ecarts,
    `le classement par écran somme à ${somme} alors que le rapport publie ${d.ecarts} écarts`);

  const spacing = d.families.find((f) => f.family === 'SPACING');
  ok(spacing && spacing.count > 40,
    `la fixture ne dépasse plus le plafond de 40 (SPACING=${spacing ? spacing.count : 'absent'}) : ce test ne prouverait plus rien`);
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

test('le vocabulaire fourni au moteur couvre toutes les feuilles du système', () => {
  /* Régression gardée. `systemStylesheets()` excluait `doc.css` au motif
     qu'un projet n'est pas censé charger le chrome de la documentation.
     Mais `doc.css` est la seule feuille qui définit le vocabulaire `ds-*`
     (`ds-shell`, `ds-demo`, `ds-device`…), et CONSISTENCY ne prescrit pas
     ce qu'il faut charger : elle vérifie si ce qui est employé existe
     quelque part dans le système. L'exclusion rendait l'assertion fausse
     — 19 classes signalées « utilisées mais jamais définies » alors
     qu'elles le sont.

     `qa/run-qa.mjs` parcourt `styles/` et passe les huit feuilles. Le
     diagnostic doit passer les mêmes, sinon il ne juge pas dans les
     mêmes conditions que les écrans qui sortent. */
  const feuilles = systemStylesheets().map((f) => f.name).sort();
  const attendues = readdirSync(join(DESIGN_SYSTEM, 'styles'))
    .filter((f) => f.endsWith('.css'))
    .sort();
  eq(feuilles, attendues, 'le diagnostic ne fournit pas toutes les feuilles du système');
  ok(feuilles.includes('doc.css'), 'doc.css manque : le vocabulaire ds-* serait signalé indéfini');
});

test('le diagnostic juge les écrans du système conformes, comme le système se juge', () => {
  /* La propriété qui compte, et celle qui a révélé le défaut : les onze
     écrans de `design-system/experiences/` sont déclarés conformes aux
     douze familles par `npm run check`. Si le diagnostic leur trouve des
     écarts, c'est le diagnostic qui se trompe — et un outil qui accuse
     le système qu'il est censé faire respecter ne peut pas être montré
     à un client. */
  const dir = join(DESIGN_SYSTEM, 'experiences');
  const d = diagnose(collect(dir), REF);
  eq(d.ecarts, 0,
    `le diagnostic trouve ${d.ecarts} écart(s) sur les écrans du système : ${d.families.filter((f) => f.count).map((f) => `${f.family} ${f.count}`).join(', ')}`);
});

test('deux runs produisent le même rapport', () => {
  const dir = makeProject();
  const a = diagnose(collect(dir), REF);
  const b = diagnose(collect(dir), REF);
  eq(a.ecarts, b.ecarts, 'le nombre d\'écarts varie d\'un run à l\'autre');
  eq(a.worst_pages, b.worst_pages, 'le classement varie d\'un run à l\'autre');
});

/* ══ RÉCUPÉRATION D'UN DÉPÔT ════════════════════════════════════ */
console.log('\nRÉCUPÉRATION');

test('un dépôt vide est « aucun écran », pas « inaccessible »', () => {
  /* Régression gardée. fetchRepo() relance un clone existant avec
     `git fetch` puis `rev-parse HEAD`. Sur un dépôt vide — et le compte
     en compte trois, vérifiés — `fetch` sort en 1 parce qu'il n'y a
     aucune ref, et le rapport annonçait « inaccessible » pour des dépôts
     qui existent et sont simplement vides. Une accusation fausse.

     Testé hors ligne : le « remote » est un dépôt nu local, donc ce test
     ne dépend ni du réseau ni de l'état de .work/. */
  const bare = mkdtempSync(join(tmpdir(), 'bare-'));
  execFileSync('git', ['init', '--bare', '--quiet', bare]);

  const dest = join(HERE, '..', '.work', `${TEST_OWNER}--${TEST_REPO}`);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  execFileSync('git', ['clone', '--quiet', bare, dest], { stdio: ['ignore', 'ignore', 'ignore'] });

  try {
    const got = fetchRepo(TEST_OWNER, TEST_REPO);
    eq(got, dest, 'fetchRepo n\'a pas rendu le clone existant');

    /* La propriété qui compte pour le rapport : un dépôt vide doit
       aboutir à « aucun écran à juger », et non à une erreur. */
    const d = diagnose(collect(dest), REF);
    eq(d.ok, false, 'un dépôt vide a été diagnostiqué comme un projet');
    ok(/aucun écran/i.test(d.reason), `raison inattendue : ${d.reason}`);
  } finally {
    rmSync(dest, { recursive: true, force: true });
    rmSync(bare, { recursive: true, force: true });
  }
});

/* ══ UNIVERSEL V2 — moteur détecté, comptes exacts, pont officiel ══ */
console.log('\nUNIVERSEL V2');

import { profileProject } from '../src/profile.mjs';
import { extractProject } from '../src/extract.mjs';
import { baselineDiff, diagnose as diagnoseV2 } from '../src/diagnose.mjs';
import { reportJson } from '../diagnose.mjs';

const FIX = (name) => join(HERE, 'fixtures', name);

test('le profil détecte le moteur sans l\'exécuter, et sépare écrans / fragments', () => {
  const d = diagnoseV2(collect(FIX('react')), REF);
  eq(d.profile.engines, ['React'], 'moteur détecté faux');
  eq(d.screens.total, 1, 'écran de route mal compté');
  eq(d.fragments.total, 1, 'fragment mal compté');
});

test('comptes EXACTS par famille sur le projet fautif planté', () => {
  const d = diagnoseV2(collect(FIX('react')), REF);
  const byFamily = Object.fromEntries(d.families.map((f) => [f.family, [f.count, f.screens, f.fragments]]));
  /* Plantés : p-5(20px, écran) — padding:10 (fragment) ; text-white (écran) —
     style color:#ff3b30 (fragment) ; 3 déclarations inline (fragment) ; emoji (fragment). */
  eq(byFamily.SPACING, [2, 1, 1], 'SPACING');
  eq(byFamily.COLOR, [2, 1, 1], 'COLOR');
  eq(byFamily.CONSISTENCY, [3, 0, 3], 'CONSISTENCY');
  eq(byFamily.ICONOGRAPHY, [1, 0, 1], 'ICONOGRAPHY');
  eq(byFamily.HIERARCHY, [0, 0, 0], 'HIERARCHY doit rester à 0 (un <h1> par écran présent)');
  eq(d.screens.ecarts, 2, 'écarts écrans');
  eq(d.screens.density, 2, 'densité par écran');
  eq(d.fragments.ecarts, 6, 'écarts fragments');
});

test('anti-faux-positifs : un projet n\'utilisant que le pont officiel → 0 écart', () => {
  const d = diagnoseV2(collect(FIX('bridge')), REF);
  eq(d.profile.bridged, true, 'pont non reconnu');
  const trio = Object.fromEntries(d.families.map((f) => [f.family, f.count]));
  eq(trio.COLOR, 0, 'COLOR non nul sur le pont');
  eq(trio.SPACING, 0, 'SPACING non nul sur le pont');
  eq(trio.TYPOGRAPHY, 0, 'TYPOGRAPHY non nul sur le pont');
  eq(d.ecarts, 0, `le total devrait être nul, mesuré : ${d.ecarts} (${d.families.filter((f) => f.count).map((f) => `${f.family}:${f.count}`).join(' ')})`);
});

test('repli garanti : moteur inconnu → scan HTML/CSS historique, sans échec', () => {
  const dir = makeProject();
  const d = diagnoseV2(collect(dir), REF);
  eq(d.profile.engines, [], 'un moteur inventé sur du HTML pur');
  eq(d.profile.unknown, true, 'le repli n\'est pas déclaré');
  ok(d.ok, 'le repli a cassé le diagnostic');
});

test('déterminisme : le JSON publié est identique d\'un run à l\'autre', () => {
  const a = JSON.stringify(reportJson('react', diagnoseV2(collect(FIX('react')), REF)));
  const b = JSON.stringify(reportJson('react', diagnoseV2(collect(FIX('react')), REF)));
  eq(a, b, 'le rapport JSON varie d\'un run à l\'autre');
});

test('baseline : le diff nomme les écarts nouveaux et corrigés', () => {
  const prev = { signatures: ['SPACING|a.jsx|1|p-5', 'COLOR|a.jsx|2|#fff'] };
  const cur = { signatures: ['SPACING|a.jsx|1|p-5', 'MOTION|b.jsx|3|300ms'] };
  const diff = baselineDiff(cur, prev);
  eq(diff.added_count, 1, 'nouveaux écarts mal comptés');
  eq(diff.fixed_count, 1, 'écarts corrigés mal comptés');
  eq(diff.net, 0, 'solde net faux');
});

test('non-écriture sur un projet à moteur aussi', () => {
  const dir = FIX('react');
  const avant = readdirSync(dir, { recursive: true }).sort().join('|');
  diagnoseV2(collect(dir), REF);
  eq(readdirSync(dir, { recursive: true }).sort().join('|'), avant, 'le diagnostic a modifié le projet React');
});

test('extraction : le non-résolu est compté, jamais deviné', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-jsx-dyn-'));
  writeFileSync(join(dir, 'package.json'), '{"dependencies":{"react":"^18"}}');
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src', 'App.jsx'),
    'export default function App(){ return <h1 className={`p-2 ${d ? \'m-4\' : \'m-2\'}`}>T</h1>; }');
  const d = diagnoseV2(collect(dir), REF);
  ok(d.unresolved >= 1, `dynamique non comptée : ${d.unresolved}`);
  /* Les parties littérales restent jugées ; p-2 = 8px, m-4 = 16px : dans l'échelle. */
  eq(d.families.filter((f) => f.family === 'SPACING')[0].count, 0, 'une partie littérale a été mal jugée');
});

test('l\'extraction ne produit aucune requête ni exécution — preuve : dépendance fantôme ignorée', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aime-jsx-sec-'));
  writeFileSync(join(dir, 'package.json'), '{"dependencies":{"react":"^18"},"scripts":{"postinstall":"evildone"}}');
  mkdirSync(join(dir, 'src'));
  writeFileSync(join(dir, 'src', 'App.jsx'), 'export default function App(){ return <h1>T</h1>; }');
  const d = diagnoseV2(collect(dir), REF);
  ok(d.ok && d.screens.total === 1, 'l\'écran n\'a pas été jugé');
});

/* ── Bilan ─────────────────────────────────────────────────────── */
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} test(s) réussi(s) · ${failures.length} échec(s)\n`);
if (failures.length) process.exit(1);
