#!/usr/bin/env node
/**
 * AIME / NOEMA — SERVEUR DE LA BOUCLE
 *
 * Sans dépendance. Sert le dépôt en statique et expose la boucle en JSON.
 *
 *   GET  /api/state            le monde : entités, journal, observation en cours
 *   POST /api/observe          NOEMA observe et écrit ses propositions
 *   POST /api/decide           un humain tranche { proposal_id, decision, actor, reason }
 *   POST /api/intend           une phrase humaine → propositions (jamais des faits)
 *   POST /api/authorize        un humain autorise ou refuse une action
 *   POST /api/execute          exécute une action autorisée (simulé, tracé)
 *   GET  /api/rights           les huit droits et leur vocabulaire
 *   POST /api/memory/voir      ce que le système sait d'un sujet
 *   POST /api/memory/comprendre  pourquoi NOEMA croit ce qu'elle croit
 *   POST /api/memory/corriger  correction humaine attribuée
 *   POST /api/memory/supprimer suppression réelle + pierre tombale
 *   POST /api/memory/pauser    suspendre la collecte sur un sujet
 *   POST /api/memory/limiter   catégorie et plafond de visibilité
 *   POST /api/memory/partager  accord d'accès borné
 *   POST /api/memory/revoquer  retrait d'un accès accordé
 *   GET  /api/timeline         projection du flux canonique (?mode=&granularity=&project_id=)
 *   GET  /api/timeline/moteur  modes, capacités, granularités
 *   POST /api/timeline/move    déplace l'événement canonique (jamais une copie)
 *   POST /api/timeline/complete  achève un événement
 *   POST /api/reset            repart du monde de démonstration
 *
 * Trois règles côté serveur, les mêmes que dans les modules :
 *   · une décision sans acteur est refusée (400) ;
 *   · NOEMA ne peut pas appeller /api/decide à la place d'un humain —
 *     l'acteur est obligatoire et tracé ;
 *   · aucune route n'écrit un objet sans provenance.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './src/store.mjs';
import { observe, propose, decide } from './src/noema.mjs';
import { interpret, submit } from './src/intention.mjs';
import { draft, authorize, execute, posture } from './src/action.mjs';
import {
  voir, comprendre, corriger, supprimer, pauser, limiter, partager, revoquer, droits,
} from './src/governance.mjs';
import { project, move, complete, moteur } from './src/timeline.mjs';
import { seed } from './seed.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PORT = Number(process.env.PORT || 8090);
const DB = join(HERE, 'data', 'world.json');

const store = createStore(DB);
if (store.all().length === 0) {
  seed(store);
  store.save();
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const json = (res, code, body) => {
  const out = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(out) });
  res.end(out);
};

const readBody = (req) => new Promise((done, fail) => {
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
  req.on('end', () => { try { done(raw ? JSON.parse(raw) : {}); } catch (e) { fail(e); } });
  req.on('error', fail);
});

/** Ce que l'écran a besoin de voir, et rien de plus. */
function snapshot() {
  const { drafts, proposable, withheld } = observe(store);
  return {
    now: new Date().toISOString(),
    entities: store.all(),
    journal: store.journal.slice(-40),
    observation: {
      total: drafts.length,
      proposable: proposable.map((d) => ({ kind: d.kind, target_id: d.target_id, confidence: d.confidence, title: d.title })),
      withheld: withheld.map((d) => ({ kind: d.kind, target_id: d.target_id, confidence: d.confidence, title: d.title })),
    },
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = decodeURIComponent(url.pathname);

  /* ── API ─────────────────────────────────────────────────── */
  if (path.startsWith('/api/')) {
    try {
      if (path === '/api/state' && req.method === 'GET') {
        return json(res, 200, snapshot());
      }

      if (path === '/api/observe' && req.method === 'POST') {
        const result = propose(store, { actor: 'noema' });
        store.save();
        return json(res, 200, { ...result, state: snapshot() });
      }

      if (path === '/api/decide' && req.method === 'POST') {
        const body = await readBody(req);
        /* Une décision anonyme est refusée : c'est le cœur du système. */
        if (!body.actor) return json(res, 400, { error: 'une décision sans acteur est refusée' });
        if (!body.proposal_id) return json(res, 400, { error: 'proposal_id obligatoire' });
        if (!['accepted', 'rejected', 'deferred'].includes(body.decision)) {
          return json(res, 400, { error: `décision inconnue : « ${body.decision} »` });
        }
        const out = decide(store, body);
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/intend' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.text || !String(body.text).trim()) {
          return json(res, 400, { error: 'aucune intention à lire : « text » est vide' });
        }
        /* `dry_run` permet à l'écran de montrer ce que NOEMA a compris
           AVANT d'écrire quoi que ce soit. C'est le principe GARDIENNE :
           on propose d'abord, on n'enregistre qu'ensuite. */
        if (body.dry_run) return json(res, 200, { ...interpret(body.text), written: [], state: snapshot() });
        const out = submit(store, body.text, { actor: body.actor || 'noema' });
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/authorize' && req.method === 'POST') {
        const body = await readBody(req);
        /* Même règle que /api/decide : pas d'acteur, pas d'autorisation. */
        if (!body.actor) return json(res, 400, { error: 'une autorisation sans acteur est refusée' });
        if (!body.action_id) return json(res, 400, { error: 'action_id obligatoire' });
        const out = authorize(store, body);
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/execute' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.actor) return json(res, 400, { error: 'une exécution sans acteur est refusée' });
        if (!body.action_id) return json(res, 400, { error: 'action_id obligatoire' });
        const out = execute(store, body);
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/posture' && req.method === 'GET') {
        return json(res, 200, posture());
      }

      /* ── Gouvernance de la mémoire ───────────────────────────
         Huit droits, une seule règle transversale : aucun ne s'exerce
         sans acteur. Le serveur refuse avant d'appeler le module, pour
         que le refus soit identique quel que soit le droit.
         ──────────────────────────────────────────────────────── */
      /* ── Timeline universelle ────────────────────────────────
         Une projection, jamais une seconde source de vérité : GET
         n'écrit rien, et move() frappe l'événement canonique.
         ──────────────────────────────────────────────────────── */
      if (path === '/api/timeline' && req.method === 'GET') {
        const mode = url.searchParams.get('mode') || 'PLAN';
        const granularity = url.searchParams.get('granularity') || 'JOUR';
        const project_id = url.searchParams.get('project_id') || null;
        return json(res, 200, project(store, { mode, granularity, project_id }));
      }

      if (path === '/api/timeline/moteur' && req.method === 'GET') {
        return json(res, 200, moteur());
      }

      if (path === '/api/timeline/move' && req.method === 'POST') {
        const body = await readBody(req);
        /* Le mode est vérifié côté serveur : une interface qui autoriserait
           un déplacement en READ ne pourrait pas le faire passer. */
        if (!body.actor) return json(res, 400, { error: 'un déplacement sans acteur est refusé' });
        if (!body.item_id) return json(res, 400, { error: 'item_id obligatoire' });
        const out = move(store, body);
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/timeline/complete' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.actor) return json(res, 400, { error: 'un achèvement sans acteur est refusé' });
        if (!body.item_id) return json(res, 400, { error: 'item_id obligatoire' });
        const out = complete(store, body);
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/rights' && req.method === 'GET') {
        return json(res, 200, droits());
      }

      if (path.startsWith('/api/memory/') && req.method === 'POST') {
        const right = path.slice('/api/memory/'.length);
        const body = await readBody(req);
        if (!body.actor) {
          return json(res, 400, { error: `le droit « ${right} » exige un acteur — un droit anonyme n'est pas vérifiable` });
        }
        const HANDLERS = {
          voir: () => voir(store, { subject_id: body.subject_id, actor: body.actor }),
          comprendre: () => comprendre(store, { id: body.id, actor: body.actor }),
          corriger: () => corriger(store, body),
          supprimer: () => supprimer(store, body),
          pauser: () => pauser(store, { subject_id: body.subject_id, until: body.until, actor: body.actor, reason: body.reason }),
          limiter: () => limiter(store, body),
          partager: () => partager(store, body),
          revoquer: () => revoquer(store, { grant_id: body.grant_id, actor: body.actor, reason: body.reason }),
        };
        if (!HANDLERS[right]) {
          return json(res, 404, { error: `droit inconnu : « ${right} » (${Object.keys(HANDLERS).join(', ')})` });
        }
        const out = HANDLERS[right]();
        store.save();
        return json(res, 200, { ...out, state: snapshot() });
      }

      if (path === '/api/reset' && req.method === 'POST') {
        store.reset();
        seed(store);
        store.save();
        return json(res, 200, { ok: true, state: snapshot() });
      }

      return json(res, 404, { error: `route inconnue : ${req.method} ${path}` });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  }

  /* ── Statique ────────────────────────────────────────────── */
  let file = join(REPO, path === '/' ? 'loop/index.html' : path);
  /* Un chemin qui se termine par / ou pointe un dossier sert son index. */
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(REPO) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('404 — introuvable');
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nAIME / NOEMA — boucle minimale`);
  console.log(`  écran   http://0.0.0.0:${PORT}/loop/`);
  console.log(`  API     http://0.0.0.0:${PORT}/api/state`);
  console.log(`  données ${relative(REPO, DB)} · ${store.all().length} entités\n`);
});
