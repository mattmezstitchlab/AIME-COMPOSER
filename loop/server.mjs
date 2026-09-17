#!/usr/bin/env node
/**
 * AIME / NOEMA — SERVEUR DE LA BOUCLE
 *
 * Sans dépendance. Sert le dépôt en statique et expose la boucle en JSON.
 *
 *   GET  /api/state            le monde : entités, journal, observation en cours
 *   POST /api/observe          NOEMA observe et écrit ses propositions
 *   POST /api/decide           un humain tranche { proposal_id, decision, actor, reason }
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
