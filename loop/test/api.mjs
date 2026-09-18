#!/usr/bin/env node
/**
 * AIME / NOEMA — TESTS DE LA COUCHE SERVEUR
 *
 * Pourquoi ce fichier existe : les règles les plus importantes du système
 * — « pas d'acteur, pas d'écriture » — sont appliquées à DEUX endroits,
 * dans les modules et dans les routes. Les modules étaient testés ; les
 * routes ne l'étaient pas. Leur seul examen était manuel, à coups de
 * curl : c'est exactement ainsi que le 404 sur `/loop/` avait été trouvé,
 * et rien n'empêchait sa réapparition.
 *
 * Zéro dépendance : `node:http` réel, port éphémère, monde jetable.
 * Chaque test parle HTTP pour de vrai — un test qui appellerait le
 * handler directement ne prouverait rien sur le routage.
 */
import { createLoopServer, currentStore } from '../server.mjs';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0;
const failures = [];
const ACTOR = 'a.meunier';

function test(name, fn) {
  return fn().then(
    () => { pass += 1; console.log(`  ✓ ${name}`); },
    (e) => { failures.push({ name, message: e.message }); console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`); },
  );
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}\n      reçu : ${JSON.stringify(a)}\n      attendu : ${JSON.stringify(b)}`); };
const ok = (v, m) => { if (!v) throw new Error(m); };

/* ── Un serveur réel, sur un port éphémère, avec un monde jetable ── */
const dir = mkdtempSync(join(tmpdir(), 'aime-api-'));
const server = createLoopServer({ db: join(dir, 'world.json') });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const get = async (path) => {
  const r = await fetch(`${BASE}${path}`);
  const text = await r.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body, type: r.headers.get('content-type') || '' };
};
const post = async (path, payload) => {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const text = await r.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, body };
};
/** Remet le monde à zéro entre les groupes de tests. */
const reset = () => post('/api/reset', {});

/* ══ STATIQUE ═══════════════════════════════════════════════════ */
console.log('\nSERVEUR — statique');

await test('la racine sert l\'écran de la boucle', async () => {
  const r = await get('/');
  eq(r.status, 200, 'la racine ne répond pas 200');
  ok(r.body.includes('NOEMA propose'), 'la racine ne sert pas l\'écran attendu');
});

await test('un chemin de dossier sert son index — le 404 de /loop/', async () => {
  /* Régression gardée : `/loop/` renvoyait 404 parce que le serveur ne
     résolvait que `/` vers index.html. */
  for (const p of ['/loop/', '/design-system/']) {
    const r = await get(p);
    eq(r.status, 200, `${p} ne sert pas son index.html`);
  }
});

await test('les modules et feuilles sont servis avec le bon type MIME', async () => {
  const ui = await get('/loop/ui.mjs');
  eq(ui.status, 200, 'ui.mjs inaccessible');
  ok(ui.type.includes('javascript'), `ui.mjs servi en « ${ui.type} »`);
  const css = await get('/design-system/tokens/tokens.css');
  eq(css.status, 200, 'tokens.css inaccessible');
  ok(css.type.includes('text/css'), `tokens.css servi en « ${css.type} »`);
});

await test('un chemin inconnu renvoie 404, pas l\'écran', async () => {
  const r = await get('/ceci-n-existe-pas.html');
  eq(r.status, 404, 'un chemin inconnu ne renvoie pas 404');
});

await test('une remontée de répertoire est refusée', async () => {
  const r = await fetch(`${BASE}/../package.json`);
  ok(r.status === 404 || r.status === 400, `remontée de répertoire acceptée (${r.status})`);
});

/* ══ L'ACTEUR EST OBLIGATOIRE — PARTOUT ═════════════════════════ */
console.log('\nSERVEUR — aucune écriture sans acteur');

await reset();

/* Chaque route qui écrit doit refuser un appel anonyme. C'est la règle
   la plus importante du système : si une seule route l'oublie, NOEMA
   peut agir seule par ce chemin. */
const ANONYMOUS = [
  ['/api/decide', { proposal_id: 'prop-0001', decision: 'accepted' }],
  ['/api/authorize', { action_id: 'act-0001', grant: true }],
  ['/api/execute', { action_id: 'act-0001' }],
  ['/api/timeline/move', { item_id: 'evt-0001', start: '2026-09-24' }],
  ['/api/timeline/complete', { item_id: 'evt-0001' }],
  ['/api/memory/voir', { subject_id: 'ppl-0001' }],
  ['/api/memory/comprendre', { id: 'ppl-0001' }],
  ['/api/memory/corriger', { id: 'ppl-0001', field: 'roles', value: ['x'] }],
  ['/api/memory/supprimer', { id: 'ppl-0001' }],
  ['/api/memory/pauser', { subject_id: 'ppl-0001', until: '2026-12-31T00:00:00Z' }],
  ['/api/memory/limiter', { id: 'ppl-0001', category: 'projet' }],
  ['/api/memory/partager', { id: 'ppl-0001', grantee: 'x@y', purpose: 'p', expires_at: '2026-12-31T00:00:00Z' }],
  ['/api/memory/revoquer', { grant_id: 'grt-0001' }],
];

for (const [path, payload] of ANONYMOUS) {
  await test(`${path} refuse un appel sans acteur`, async () => {
    await reset();
    const r = await post(path, payload);
    eq(r.status, 400, `${path} n'a pas refusé l'appel anonyme (${r.status})`);
    ok(/acteur/.test(r.body.error || ''), `${path} : message de refus sans « acteur » — ${r.body.error}`);
  });
}

/* ══ ROUTES ═════════════════════════════════════════════════════ */
console.log('\nSERVEUR — contrat des routes');

await test('GET /api/state expose le monde, le journal et l\'observation', async () => {
  await reset();
  const r = await get('/api/state');
  eq(r.status, 200, 'état inaccessible');
  ok(Array.isArray(r.body.entities), 'aucune liste d\'entités');
  ok(Array.isArray(r.body.journal), 'aucun journal');
  ok(r.body.observation && Array.isArray(r.body.observation.proposable), 'aucune observation');
  ok(r.body.entities.length > 0, 'le monde de démonstration est vide');
});

await test('une route inconnue sous /api/ renvoie 404, pas 500', async () => {
  const r = await get('/api/ceci-n-existe-pas');
  eq(r.status, 404, 'route inconnue mal traitée');
  ok(r.body.error, 'aucun message d\'erreur');
});

await test('un droit inconnu est nommé dans le refus', async () => {
  const r = await post('/api/memory/oublier', { id: 'ppl-0001', actor: ACTOR });
  eq(r.status, 404, 'un droit inconnu n\'est pas refusé en 404');
  ok(/droit inconnu/.test(r.body.error), `message inattendu : ${r.body.error}`);
});

await test('un corps JSON invalide est refusé proprement', async () => {
  const r = await fetch(`${BASE}/api/decide`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{ pas du JSON',
  });
  ok(r.status >= 400 && r.status < 500, `JSON invalide → ${r.status}, attendu 4xx`);
});

await test('mode et granularité invalides sont refusés par la Timeline', async () => {
  for (const q of ['?mode=FÊTE', '?granularity=QUINZAINE']) {
    const r = await get(`/api/timeline${q}`);
    eq(r.status, 400, `${q} n'est pas refusé`);
  }
});

/* ══ BOUCLE COMPLÈTE PAR HTTP ═══════════════════════════════════ */
console.log('\nSERVEUR — la boucle de bout en bout');

await test('intention → proposition → validation → objet mémorisé', async () => {
  await reset();
  const lu = await post('/api/intend', { text: 'Iris Fontaine est clarinettiste', dry_run: true });
  eq(lu.status, 200, 'lecture à sec refusée');
  eq(lu.body.written.length, 0, 'dry_run a écrit quelque chose');

  const avant = (await get('/api/state')).body.entities.length;
  const soumis = await post('/api/intend', { text: 'Iris Fontaine est clarinettiste', actor: ACTOR });
  eq(soumis.status, 200, 'soumission refusée');
  ok(soumis.body.written.length >= 1, 'aucune proposition créée');
  for (const p of soumis.body.written) {
    eq(p.status, 'open', 'une proposition d\'intention n\'est pas ouverte');
    eq(p.provenance.state, 'inferred', 'une intention humaine est traitée comme un fait');
  }

  const prop = soumis.body.written[0];
  const decide = await post('/api/decide', { proposal_id: prop.id, decision: 'accepted', actor: ACTOR });
  eq(decide.status, 200, 'décision refusée');
  ok(decide.body.materialization?.materialized, `rien n'a été mémorisé : ${decide.body.materialization?.reason}`);

  const apres = (await get('/api/state')).body.entities;
  eq(apres.length, avant + soumis.body.written.length + 3,
    'le nombre d\'entités ne correspond pas à propositions + décision + preuve + personne');
  ok(apres.some((e) => e.id?.startsWith('ppl-') && e.display_name === 'Iris Fontaine'),
    'la personne validée n\'est pas dans le monde');
});

await test('une décision anonyme ne crée aucune entité', async () => {
  await reset();
  await post('/api/intend', { text: 'Iris Fontaine est clarinettiste', actor: ACTOR });
  const st = await get('/api/state');
  const prop = st.body.entities.find((e) => e.id?.startsWith('prop-'));
  const avant = st.body.entities.length;
  const r = await post('/api/decide', { proposal_id: prop.id, decision: 'accepted' });
  eq(r.status, 400, 'décision anonyme acceptée');
  eq((await get('/api/state')).body.entities.length, avant, 'un appel refusé a tout de même écrit');
});

await test('valider une demande d\'action ne l\'exécute pas', async () => {
  await reset();
  const soumis = await post('/api/intend', { text: 'envoyer l\'annonce du concert', actor: ACTOR });
  const prop = soumis.body.written.find((p) => p.requested_change.kind === 'action_request');
  ok(prop, 'aucune demande d\'action reconnue');
  const decide = await post('/api/decide', { proposal_id: prop.id, decision: 'accepted', actor: ACTOR });
  const actionId = decide.body.materialization.id;
  const st = await get('/api/state');
  const action = st.body.entities.find((e) => e.id === actionId);
  eq(action.status, 'pending_authorization', 'valider une intention a exécuté l\'action');
  eq(action.executed_at, null, 'l\'action est déjà exécutée');
});

await test('autoriser puis exécuter, par la même personne', async () => {
  await reset();
  const soumis = await post('/api/intend', { text: 'envoyer l\'annonce du concert', actor: ACTOR });
  const prop = soumis.body.written.find((p) => p.requested_change.kind === 'action_request');
  const decide = await post('/api/decide', { proposal_id: prop.id, decision: 'accepted', actor: ACTOR });
  const actionId = decide.body.materialization.id;

  const refus = await post('/api/execute', { action_id: actionId, actor: ACTOR });
  eq(refus.status, 400, 'exécution sans autorisation acceptée');

  const autre = await post('/api/authorize', { action_id: actionId, grant: true, actor: ACTOR });
  eq(autre.status, 200, 'autorisation refusée');
  const tiers = await post('/api/execute', { action_id: actionId, actor: 'autre.personne' });
  eq(tiers.status, 400, 'un tiers a pu exécuter une action autorisée par autrui');

  const exec = await post('/api/execute', { action_id: actionId, actor: ACTOR });
  eq(exec.status, 200, 'exécution légitime refusée');
  eq(exec.body.action.status, 'executed', 'l\'action n\'est pas exécutée');
  ok(/simulé/.test(exec.body.result.detail), 'l\'exécution prétend sortir de la machine');
});

await test('déplacer un événement modifie la donnée canonique', async () => {
  await reset();
  const st = await get('/api/state');
  const evt = st.body.entities.find((e) => e.id?.startsWith('evt-'));
  const nbAvant = st.body.entities.filter((e) => e.id?.startsWith('evt-')).length;

  const r = await post('/api/timeline/move', { item_id: evt.id, start: '2026-11-11', actor: ACTOR, mode: 'PLAN' });
  eq(r.status, 200, 'déplacement refusé');
  const apres = (await get('/api/state')).body.entities;
  eq(apres.find((e) => e.id === evt.id).start_at, '2026-11-11', 'l\'événement canonique n\'a pas bougé');
  eq(apres.filter((e) => e.id?.startsWith('evt-')).length, nbAvant, 'une copie concurrente a été créée');
});

await test('la Timeline refuse un déplacement en mode lecture', async () => {
  await reset();
  const st = await get('/api/state');
  const evt = st.body.entities.find((e) => e.id?.startsWith('evt-'));
  const r = await post('/api/timeline/move', { item_id: evt.id, start: '2026-11-11', actor: ACTOR, mode: 'READ' });
  eq(r.status, 400, 'déplacement accepté en READ');
  ok(/READ/.test(r.body.error), `message inattendu : ${r.body.error}`);
});

await test('les huit droits s\'exercent par HTTP et laissent une trace', async () => {
  await reset();
  const st = await get('/api/state');
  const who = st.body.entities.find((e) => e.id?.startsWith('ppl-')).id;

  eq((await post('/api/memory/voir', { subject_id: who, actor: ACTOR })).status, 200, 'VOIR a échoué');
  eq((await post('/api/memory/comprendre', { id: who, actor: ACTOR })).status, 200, 'COMPRENDRE a échoué');
  eq((await post('/api/memory/corriger', { id: who, field: 'roles', value: ['saxophone'], actor: ACTOR })).status, 200, 'CORRIGER a échoué');
  eq((await post('/api/memory/limiter', { id: who, category: 'projet', visibility: 'projet', actor: ACTOR })).status, 200, 'LIMITER a échoué');
  eq((await post('/api/memory/pauser', { subject_id: who, until: '2026-12-31T00:00:00Z', actor: ACTOR })).status, 200, 'PAUSER a échoué');

  /* En pause, rien ne sort. */
  const partage = await post('/api/memory/partager', { id: who, grantee: 'client@x.fr', purpose: 'suivi', expires_at: '2026-12-31T00:00:00Z', actor: ACTOR });
  eq(partage.status, 400, 'un partage est sorti d\'un sujet en pause');

  await post('/api/memory/pauser', { subject_id: who, until: null, actor: ACTOR });
  const ok2 = await post('/api/memory/partager', { id: who, grantee: 'client@x.fr', purpose: 'suivi', expires_at: '2026-12-31T00:00:00Z', actor: ACTOR });
  eq(ok2.status, 200, 'PARTAGER a échoué hors pause');
  eq((await post('/api/memory/revoquer', { grant_id: ok2.body.grant.id, actor: ACTOR })).status, 200, 'RÉVOQUER a échoué');

  const suppr = await post('/api/memory/supprimer', { id: who, actor: ACTOR, reason: 'demande' });
  eq(suppr.status, 200, 'SUPPRIMER a échoué');
  const apres = (await get('/api/state')).body.entities;
  ok(!apres.some((e) => e.id === who), 'le contenu a survécu à la suppression');
  const tomb = apres.find((e) => e.id?.startsWith('tmb-'));
  ok(tomb, 'aucune pierre tombale');
  for (const f of ['content', 'display_name', 'title', 'body', 'value']) {
    eq(tomb[f], undefined, `la pierre tombale conserve « ${f} »`);
  }

  const ops = (await get('/api/state')).body.journal.map((j) => j.op);
  for (const droit of ['voir', 'comprendre', 'corriger', 'limiter', 'pauser', 'partager', 'révoquer', 'supprimer']) {
    ok(ops.includes(`right:${droit}`), `trace manquante pour le droit « ${droit} »`);
  }
});

await test('une information sensible ne devient pas publique', async () => {
  await reset();
  const who = (await get('/api/state')).body.entities.find((e) => e.id?.startsWith('ppl-')).id;
  const r = await post('/api/memory/limiter', { id: who, category: 'sensible', visibility: 'publique', actor: ACTOR });
  eq(r.status, 400, 'une information sensible a pu être rendue publique');
  ok(/plafond/.test(r.body.error), `message inattendu : ${r.body.error}`);
});

await test('reset reconstruit le monde de démonstration', async () => {
  await reset();
  const avant = (await get('/api/state')).body.entities.length;
  await post('/api/memory/supprimer', { id: 'ppl-0001', actor: ACTOR });
  await reset();
  eq((await get('/api/state')).body.entities.length, avant, 'reset ne restaure pas le monde');
});

/* ══ PERSISTANCE ════════════════════════════════════════════════ */
console.log('\nSERVEUR — persistance');

await test('une écriture est sauvée sur disque', async () => {
  await reset();
  await post('/api/memory/corriger', { id: 'ppl-0002', field: 'roles', value: ['contrebasse'], actor: ACTOR });
  const { readFileSync } = await import('node:fs');
  const brut = JSON.parse(readFileSync(join(dir, 'world.json'), 'utf8'));
  const personne = Object.values(brut.entities).find((e) => e.id === 'ppl-0002');
  eq(personne.roles, ['contrebasse'], 'la correction n\'est pas sur disque');
  ok(brut.journal.length > 0, 'le journal n\'est pas persisté');
});

/* ══ RUNTIME — l'hôte est publié, jamais déguisé ════════════════ */
console.log('\nSERVEUR — runtime publié');

await test('le serveur local publie son runtime : server, persisté', async () => {
  const r = await get('/api/state');
  eq(r.body.runtime, { mode: 'server', persisted: true }, 'runtime mensonger');
});

await test('un hôte serverless publie sa vérité : démo en mémoire', async () => {
  const { createLoopApi } = await import('../src/http.mjs');
  const { createStore } = await import('../src/store.mjs');
  const { seed } = await import('../seed.mjs');
  const store = createStore(null); /* mémoire seule : aucun disque promis */
  seed(store);
  const api = createLoopApi({ store, runtime: { mode: 'serverless', persisted: false } });
  /* On parle HTTP pour de vrai, comme le reste du fichier : un handler
     appelé directement ne prouverait rien sur le routage. */
  const srv = createServer(api);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const state = await (await fetch(`${base}/api/state`)).json();
  eq(state.runtime, { mode: 'serverless', persisted: false }, 'runtime mensonger');
  ok(state.entities.length > 0, 'le monde de démonstration est absent');
  const refused = await fetch(`${base}/api/decide`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ proposal_id: 'prop-0001', decision: 'accepted' }),
  });
  eq(refused.status, 400, 'une décision sans acteur passe sur un hôte serverless');
  srv.close();
});

await test('la fonction de l\u2019hébergement branche le même routeur, sans ouvrir de port', async () => {
  const mod = await import('../../api/[[...route]].mjs');
  ok(typeof mod.default === 'function', 'pas de handler exporté par défaut');
  const srv = createServer(mod.default);
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const state = await (await fetch(`${base}/api/state`)).json();
  eq(state.runtime, { mode: 'serverless', persisted: false }, 'la fonction déguise son hôte');
  ok(state.entities.length > 0, 'le monde de démonstration est absent');
  /* Le même store sert toutes les requêtes de l'instance : la boucle
     conversationnelle tient tant que l'instance est chaude. */
  const apres = await (await fetch(`${base}/api/state`)).json();
  eq(apres.entities.length, state.entities.length, "l'instance ne tient pas son monde entre deux requêtes");
  srv.close();
});

/* ── Bilan ─────────────────────────────────────────────────────── */
server.close();
rmSync(dir, { recursive: true, force: true });
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} test(s) API réussi(s) · ${failures.length} échec(s)\n`);
if (failures.length) process.exit(1);
