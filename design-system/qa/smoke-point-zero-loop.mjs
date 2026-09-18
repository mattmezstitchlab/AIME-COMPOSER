#!/usr/bin/env node
/**
 * SMOKES — POINT ZERO · NOEMA : parité avec l'écran de la boucle (loop/).
 *
 * Gate de la Vague 2 (AUDIT/POINT-ZERO-CONVERGENCE-01.md). L'audit avait
 * mesuré neuf fonctions de `loop/index.html` absentes de la coquille :
 *
 *   1. observer (NOEMA propose, n'écrit jamais un fait) ;
 *   2. actions : autoriser / exécuter — deux actes attribués ;
 *   3. retenues affichées comme retenues ;
 *   4. journal append-only ;
 *   5. le monde (chaque entité avec provenance, source, auteur) ;
 *   6. les huit droits de la mémoire ;
 *   7. preuves ;
 *   8. réinitialisation ;
 *   9. granularités de la timeline (+ déplacement d'un événement).
 *
 * Ce script n'utilise AUCUN stub d'API : il démarre la vraie boucle
 * (`createLoopServer`, monde jetable, port éphémère) et exécute pz.js dans
 * jsdom contre elle. Les règles du serveur — une décision sans acteur est
 * refusée, autoriser n'exécute pas — sont donc réellement exercées, comme
 * `loop/test/api.mjs` le fait pour l'écran loop.
 *
 *   cd design-system && node qa/smoke-point-zero-loop.mjs
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = await import('jsdom')); } catch {
  console.error('jsdom absent — `cd design-system && npm install`');
  process.exit(1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PAGE = path.join(ROOT, 'point-zero', 'index.html');
const { createLoopServer } = await import(pathToFileURL(path.join(ROOT, 'loop', 'server.mjs')).href);

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };

/* ── La vraie boucle, sur un monde jetable ─────────────────────── */
const dir = mkdtempSync(path.join(tmpdir(), 'pz-loop-'));
const server = createLoopServer({ db: path.join(dir, 'world.json') });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const realFetch = globalThis.fetch;

/* fetch vu par pz.js : /api/* → la boucle ; le reste → disque du dépôt. */
const netLog = [];
const pzFetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  netLog.push({ url, method: init?.method || 'GET', body: init?.body ? JSON.parse(init.body) : null });
  if (url.startsWith('/api/')) return realFetch(BASE + url, init);
  if (/^https?:/.test(url)) return new Response(null, { status: 404 });
  const p = path.resolve(path.dirname(PAGE), url);
  try { return new Response(readFileSync(p), { status: 200 }); } catch { return new Response(null, { status: 404 }); }
};
const direct = async (p, body) => {
  const r = await realFetch(BASE + p, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  return { status: r.status, body: await r.json() };
};

const toasts = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => { if (!/navigation/.test(e.message)) console.error(e.message); });
const html = readFileSync(PAGE, 'utf8');
const dom = new JSDOM(html, {
  url: pathToFileURL(PAGE).href,
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.URL.createObjectURL = () => 'blob:x';
    window.URL.revokeObjectURL = () => {};
    window.AIME = { toast: (o) => toasts.push(o) };
  },
});
const { window } = dom;
const { document } = window;

const globals = {
  document, window, location: window.location, localStorage: window.localStorage,
  fetch: pzFetch, URL: window.URL, Blob: window.Blob, navigator: window.navigator,
  HTMLMediaElement: window.HTMLMediaElement, MutationObserver: window.MutationObserver,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
};
const saved = {};
for (const [k, v] of Object.entries(globals)) {
  saved[k] = globalThis[k];
  try { globalThis[k] = v; } catch { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
}
const drain = async (n = 40) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 5)); };
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));
const tab = (id) => { $(`#pz-tab-${id}`).click(); };

console.log('\nPOINT ZERO · NOEMA — parité avec l’écran de la boucle (vraie API, monde jetable)');
try {
  await import(`${pathToFileURL(path.join(ROOT, 'point-zero', 'pz.js')).href}?v=${Date.now()}`);
  await drain(60);

  t('badge : NOEMA en ligne (serveur local, persisté)', $('#pz-noema-status')?.textContent === 'NOEMA en ligne');
  t('rail : aucune proposition ouverte à froid — NOEMA se tait', $('#pz-noema-feed').textContent.includes('Aucune proposition ouverte'));
  t('compteurs : 0 en attente · 10 entités · 0 preuve', /0 en attente · 10 entités · 0 preuve/.test($('#pz-noema-counts').textContent));

  /* 5 — le monde */
  $('#pz-dock-cartes').click();
  await drain();
  const cards = $$('#pz-cartes-list [data-card]');
  t('5. monde : 10 cartes, une par entité de la graine', cards.length === 10);
  t('5. monde : chaque carte porte source et auteur (« saisie humaine · a.meunier »)', cards.some((c) => /saisie humaine · a\.meunier/.test(c.textContent)));
  t('5. monde : l’état de provenance est porté par la forme (nstate confirmed / extracted)', !!$('#pz-cartes-list .nstate[data-state="confirmed"]') && !!$('#pz-cartes-list .nstate[data-state="extracted"]'));

  /* 4 — journal */
  tab('journal');
  const rows0 = $$('#pz-journal-body tr').length;
  t('4. journal : la graine est tracée (≥ 10 entrées, acteur + horodatage)', rows0 >= 10 && /system|a\.meunier/.test($('#pz-journal-body').textContent));

  /* 3 — retenues (à froid : rien de retenu, dit comme tel) */
  tab('retenu');
  t('3. retenues : l’absence est nommée, pas un panneau vide', $('#pz-withheld-list').textContent.includes('Rien de retenu'));

  /* 1 — observer */
  $('#pz-noema-observe').click();
  await drain(60);
  const openCards = $$('#pz-noema-feed .noema-card');
  t('1. observer : NOEMA a écrit des propositions ouvertes dans le rail', openCards.length >= 3);
  t('1. observer : les propositions portent corps + preuves (evidence) + cible', !!$('#pz-noema-feed .noema-card__list li') && /evt-|ast-|obj-/.test(openCards[0].textContent));
  t('1. observer : trois décisions possibles — Valider / Reporter / Refuser', !!$('#pz-noema-feed [data-decide="accepted"]') && !!$('#pz-noema-feed [data-decide="deferred"]') && !!$('#pz-noema-feed [data-decide="rejected"]'));
  t('1. observer : le toast dit combien ont été écrites et retenues', /proposition\(s\) écrite\(s\)/.test(toasts.at(-1)?.title || '') && /retenue/.test(toasts.at(-1)?.text || ''));
  t('1. observer : aucun fait n’a été écrit — seules des prop- sont apparues', (await direct('/api/state')).body.entities.filter((e) => !e.id.startsWith('prop-')).length === 10);
  const rows1 = $$('#pz-journal-body tr').length;
  t('4. journal : re-projeté après observation (plus d’entrées qu’avant)', rows1 > rows0);

  /* Règle cœur : une décision sans acteur est refusée par le serveur (la
     coquille envoie toujours son acteur — on le prouve en lisant la requête). */
  const decide = $('#pz-noema-feed [data-decide="accepted"]');
  const propId = decide.dataset.target;
  decide.click();
  await drain(60);
  const decideReq = netLog.find((r) => r.url === '/api/decide');
  t('décider : la coquille attribue toujours la décision (actor = point.zero.shell)', decideReq?.body?.actor === 'point.zero.shell' && decideReq.body.proposal_id === propId);
  t('décider : le serveur refuse une décision anonyme (400) — la règle vit côté boucle', (await direct('/api/decide', { proposal_id: propId, decision: 'accepted' })).status === 400);

  /* 7 — preuves */
  tab('preuves');
  t('7. preuves : une preuve est née de la décision humaine (validation → dec-0001)', $$('#pz-proofs-list .viz-proof__step').length === 1 && /validation/.test($('#pz-proofs-list').textContent) && /dec-0001/.test($('#pz-proofs-list').textContent));
  t('7. preuves : la cible de la preuve ouvre sa carte (data-card)', !!$('#pz-proofs-list [data-card="' + propId + '"]'));
  t('compteurs : 1 preuve après décision', /1 preuve/.test($('#pz-noema-counts').textContent));
  const deferBtn = $('#pz-noema-feed [data-decide="deferred"]');
  deferBtn?.click();
  await drain(60);
  t('décider : « Reporter » est une décision à part entière (deferred, acceptée par l’API)', netLog.some((r) => r.url === '/api/decide' && r.body?.decision === 'deferred') && !$(`#pz-noema-feed [data-target="${deferBtn?.dataset.target}"]`));

  /* 2 — actions : une action naît d'une intention validée */
  $('#pz-noema-text').value = "envoyer l'annonce du concert";
  $('#pz-noema-send').click();
  await drain(80);
  const actProp = $$('#pz-noema-feed .noema-card').find((c) => /Action demandée/.test(c.textContent));
  t('2. actions : l’intention produit une proposition « Action demandée »', !!actProp);
  actProp?.querySelector('[data-decide="accepted"]').click();
  await drain(80);
  tab('actions');
  const pending = $('#pz-actions-list [data-authorize="1"]');
  t('2. actions : valider ne l’exécute pas — elle attend une autorisation', !!pending && /en attente d.autorisation/.test($('#pz-actions-list').textContent));
  t('2. actions : périmètre · risque · réversibilité viennent du registre', /risque (faible|moyen|élevé)/.test($('#pz-actions-list').textContent) && /réversible/.test($('#pz-actions-list').textContent));
  t('2. actions : le badge de l’onglet compte les actions en attente', $('#pz-actions-count').hidden === false && $('#pz-actions-count').textContent === '1');
  pending.click();
  await drain(80);
  const authReq = netLog.find((r) => r.url === '/api/authorize');
  t('2. actions : autoriser est attribué (actor) et distinct d’exécuter', authReq?.body?.actor === 'point.zero.shell' && authReq.body.grant === true && !!$('#pz-actions-list [data-execute]') && !netLog.some((r) => r.url === '/api/execute'));
  $('#pz-actions-list [data-execute]').click();
  await drain(80);
  t('2. actions : exécuter — attribué, puis « exécutée » projetée', netLog.find((r) => r.url === '/api/execute')?.body?.actor === 'point.zero.shell' && /exécutée/.test($('#pz-actions-list').textContent) && !$('#pz-actions-list [data-execute]'));
  t('2. actions : le serveur refuse une exécution anonyme (400)', (await direct('/api/execute', { action_id: 'act-0001' })).status === 400);

  /* 6 — les huit droits */
  tab('droits');
  t('6. droits : huit boutons, huit droits', $$('#pz-m-rights [data-right]').length === 8);
  t('6. droits : sujets = personnes, projets, objets', $$('#pz-m-subject option').length >= 5 && /ppl-0001/.test($('#pz-m-subject').innerHTML));
  $('#pz-m-subject').value = 'ppl-0001';
  const exercise = async (right) => { $(`#pz-m-rights [data-right="${right}"]`).click(); await drain(60); return $('#pz-m-out').textContent; };
  let out = await exercise('voir');
  t('6. VOIR : ce que le système sait, avec catégorie · visibilité · partagé avec', /catégorie/.test(out) && /visibilité/.test(out) && /partagé avec/.test(out) && /information\(s\)/.test(out));
  out = await exercise('comprendre');
  t('6. COMPRENDRE : chaîne de provenance, honnête sur les maillons non confirmés', !!$('#pz-m-out .viz-proof__step') && /s.arrête sur/.test(out));
  out = await exercise('corriger');
  t('6. CORRIGER : avant/après publiés', /before|avant/.test(out) && /after|après/.test(out));
  out = await exercise('limiter');
  t('6. LIMITER : catégorie et visibilité retournées', /projet/.test(out));
  out = await exercise('partager');
  t('6. PARTAGER : un partage (grt-) est créé, avec finalité', /grt-/.test(out) && /suivi de projet/.test(out));
  out = await exercise('revoquer');
  t('6. RÉVOQUER : agit sur le partage existant', /grt-/.test(out) && /revok|révoq/.test(out));
  out = await exercise('pauser');
  t('6. PAUSER : « jusqu’au » retourné', /until|paused/.test(out));
  out = await exercise('partager');
  t('6. PAUSER puis PARTAGER : le serveur refuse (« rien n’en sort ») et le refus est affiché tel quel', /en pause/.test(out) && !!$('#pz-m-out .a-state--error, #pz-m-out .u-error'));
  out = await exercise('supprimer');
  t('6. SUPPRIMER : pierre tombale retournée (le sujet ne s’évapore pas)', /tomb|supprim/.test(out));
  t('6. droits : chaque exercice est attribué à point.zero.shell', netLog.filter((r) => r.url.startsWith('/api/memory/')).every((r) => r.body?.actor === 'point.zero.shell') && netLog.filter((r) => r.url.startsWith('/api/memory/')).length === 9);
  const ops = (await direct('/api/state')).body.journal.map((j) => j.op);
  t('6. droits : les huit sont tracés au journal (right:*)', ['voir', 'comprendre', 'corriger', 'limiter', 'pauser', 'partager', 'révoquer', 'supprimer'].every((d) => ops.includes(`right:${d}`)));
  t('6. droits : un droit anonyme est refusé par le serveur (400)', (await direct('/api/memory/voir', { subject_id: 'ppl-0002' })).status === 400);

  /* 9 — granularités + déplacement */
  $('#pz-dock-timeline').click();
  await drain(60);
  t('9. timeline : sept granularités proposées', $$('#pz-tl-gran option').length === 7);
  $('#pz-tl-gran').value = 'MOIS';
  fire($('#pz-tl-gran'), 'change');
  await drain(60);
  const tlReq = netLog.filter((r) => r.url.startsWith('/api/timeline?')).pop();
  t('9. timeline : la granularité est envoyée au moteur (granularity=MOIS)', /granularity=MOIS/.test(tlReq?.url || '') && /mois/.test($('#pz-tl-meta').textContent));
  t('9. timeline : périodes (buckets) et capacités actives publiées', /période\(s\)/.test($('#pz-tl-meta').textContent) && /capacités/.test($('#pz-tl-meta').textContent));
  const moveBtn = $('#pz-timeline-list [data-tmove]');
  t('9. timeline : en PLAN, un événement éditable offre « +1 jour » (capacité MOVE)', !!moveBtn);
  const before = (await direct('/api/state')).body.entities.find((e) => e.id === moveBtn.dataset.tmove).start_at;
  moveBtn.click();
  await drain(80);
  const after = (await direct('/api/state')).body.entities.find((e) => e.id === moveBtn.dataset.tmove).start_at;
  t('9. timeline : déplacer modifie le fait canonique (+1 jour), attribué', after !== before && new Date(after) - new Date(before) === 864e5 && netLog.find((r) => r.url === '/api/timeline/move')?.body?.actor === 'point.zero.shell');
  $('#pz-tl-mode').value = 'READ';
  fire($('#pz-tl-mode'), 'change');
  await drain(60);
  t('9. timeline : en READ, aucun bouton de déplacement — le moteur décide des capacités', !$('#pz-timeline-list [data-tmove]'));

  /* 8 — réinitialisation, deux clics */
  const entsBefore = (await direct('/api/state')).body.entities.length;
  $('#pz-noema-reset').click();
  await drain(20);
  t('8. reset : un seul clic n’efface rien — confirmation demandée', !netLog.some((r) => r.url === '/api/reset') && /Confirmer/.test($('#pz-noema-reset').textContent) && (await direct('/api/state')).body.entities.length === entsBefore);
  $('#pz-noema-reset').click();
  await drain(80);
  const st = (await direct('/api/state')).body;
  t('8. reset : au second clic, le monde revient à la graine (10 entités, 0 proposition)', netLog.some((r) => r.url === '/api/reset') && st.entities.length === 10 && !st.entities.some((e) => e.id.startsWith('prop-')));
  t('8. reset : toutes les projections suivent (rail vide, 0 preuve, journal de graine)', $('#pz-noema-feed').textContent.includes('Aucune proposition ouverte') && /0 preuve/.test($('#pz-noema-counts').textContent) && $$('#pz-journal-body tr').length === rows0);
} catch (e) {
  fail++;
  console.log(`  ✗ exécution : ${e.stack?.split('\n').slice(0, 3).join(' | ')}`);
} finally {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete globalThis[k];
    else globalThis[k] = v;
  }
  await new Promise((r) => server.close(r));
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? '✓' : '✗'} SMOKES POINT ZERO · NOEMA : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
