#!/usr/bin/env node
/**
 * AIME / NOEMA — SERVEUR DE LA BOUCLE
 *
 * Sans dépendance. Sert le dépôt en statique et expose la boucle en JSON.
 *
 * Les routes /api/* vivent dans src/http.mjs (createLoopApi) : le même
 * routeur sert ce serveur local complet — avec persistance disque — et la
 * fonction serverless de l'hébergement (api/[[...route]].mjs), sans
 * duplication. Les règles (« une décision sans acteur est refusée »,
 * « aucune écriture sans provenance ») sont donc écrites une seule fois.
 *
 * Ici, l'hôte est un serveur qui tourne : runtime { mode: 'server',
 * persisted: true }, publié tel quel dans /api/state.
 *
 *   node loop/server.mjs
 *     écran   http://0.0.0.0:8090/loop/
 *     API     http://0.0.0.0:8090/api/state
 *     données loop/data/world.json (atomique, reload propre)
 *
 * La liste complète des routes est documentée dans src/http.mjs.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './src/store.mjs';
import { createLoopApi } from './src/http.mjs';
import { seed } from './seed.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const PORT = Number(process.env.PORT || 8090);
const DB = join(HERE, 'data', 'world.json');

/* `let` et non `const` : la fabrique ci-dessous réassigne le store, ce qui
   permet de tester le serveur sur un monde jetable, port éphémère compris. */
let store;

/**
 * Construit un serveur de boucle. Exporté pour les tests : sans cela, la
 * seule façon d'exercer une route était de lancer le serveur à la main et
 * de le consulter à la main — c'est exactement ainsi que le 404 sur
 * `/loop/` avait été trouvé, et rien n'empêchait sa réapparition.
 */
export function createLoopServer({ db = DB } = {}) {
  store = createStore(db);
  if (db && store.all().length === 0) {
    seed(store);
    store.save();
  }
  const api = createLoopApi({ store, runtime: { mode: 'server', persisted: true } });
  return createServer(async (req, res) => {
    if (await api(req, res)) return;
    serveStatic(req, res);
  });
}

/** Le store courant — utile aux tests qui vérifient l'état persisté. */
export const currentStore = () => store;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = decodeURIComponent(url.pathname);
  let file = join(REPO, path === '/' ? 'loop/index.html' : path);
  /* Un chemin qui se termine par / ou pointe un dossier sert son index. */
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!file.startsWith(REPO) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('404 — introuvable');
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
}

/* Un module importé par un test ne doit pas ouvrir de port. */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const server = createLoopServer();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\nAIME / NOEMA — boucle minimale`);
    console.log(`  écran   http://0.0.0.0:${PORT}/loop/`);
    console.log(`  API     http://0.0.0.0:${PORT}/api/state`);
    console.log(`  données ${relative(REPO, DB)} · ${store.all().length} entités\n`);
  });
}
