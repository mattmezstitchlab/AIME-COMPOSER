#!/usr/bin/env node
/**
 * AIME DESIGN SYSTEM V1 — vérification DOM.
 *
 * `npm run qa` analyse du texte : feuilles de style et balisage. Ce script
 * complète en exécutant réellement les scripts des écrans dans un DOM,
 * pour vérifier ce qu'une analyse statique ne peut pas voir :
 *
 *   · js/doc.js            injecte bien le chrome et résout les icônes
 *   · js/aime-ui.js        se branche sans erreur
 *   · js/render-tokens.js  rend les tableaux pilotés par les jetons
 *   · le module de color.html rend la table de contraste
 *   · js/qa.js auditLive() s'exécute sur le document vivant
 *
 * LIMITE ASSUMÉE : jsdom n'a pas de moteur de mise en page. scrollWidth,
 * clientWidth et getBoundingClientRect valent toujours 0, donc les volets
 * géométriques d'auditLive (débordement réel, taille des cibles) ne peuvent
 * PAS être vérifiés ici. Ce script le signale au lieu de faire semblant.
 *
 * Sort en code 1 si un script échoue, si une icône ne se résout pas ou si un
 * conteneur token-driven reste vide.
 */
let JSDOM, ResourceLoader, VirtualConsole;
try {
  ({ JSDOM, ResourceLoader, VirtualConsole } = await import('jsdom'));
} catch {
  console.error(`
AIME DESIGN SYSTEM V1 — VÉRIFICATION DOM
  jsdom est absent. C'est la seule dépendance de ce script, et elle n'est
  requise que par lui : build, QA et serveur fonctionnent sans elle.

      cd design-system && npm install

  Sans jsdom cette vérification ne peut PAS être simulée : elle consiste
  précisément à exécuter les scripts des écrans dans un DOM réel.
`);
  process.exit(1);
}
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { auditLive } from '../js/qa.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DS = path.resolve(HERE, '..');
const ROOT = path.resolve(DS, '..');

/* ── Les pages du système ─────────────────────────────────────── */
const pages = [];
for (const f of readdirSync(DS).sort()) {
  if (f.endsWith('.html')) pages.push(path.join(DS, f));
}
for (const sub of ['experiences', path.join('..', 'loop')]) {
  const dir = path.join(DS, sub);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).sort()) {
    if (f.endsWith('.html') && !f.includes('node_modules')) pages.push(path.join(dir, f));
  }
}

/* ── Chargement des ressources depuis le disque ───────────────── */
class Disk extends ResourceLoader {
  fetch(url) {
    try {
      const p = fileURLToPath(new URL(url));
      if (existsSync(p) && statSync(p).isFile()) return Promise.resolve(readFileSync(p));
    } catch {
      /* retombée sur le parent */
    }
    return super.fetch(url);
  }
}

/** fetch() capable de résoudre les URL relatives au dépôt. */
const makeFetch = (baseDir) => async (input, init) => {
  const spec = typeof input === 'string' ? input : input.url;
  const abs = /^https?:/.test(spec) ? spec : pathToFileURL(path.resolve(baseDir, spec)).href;
  if (!abs.startsWith('file://')) return fetch(abs, init);
  const p = fileURLToPath(abs);
  if (!existsSync(p)) {
    return new Response(null, { status: 404, statusText: 'Not Found' });
  }
  return new Response(readFileSync(p), {
    status: 200,
    headers: { 'content-type': p.endsWith('.json') ? 'application/json' : 'text/plain' },
  });
};

const pad = (s, n) => String(s).padEnd(n);
let failures = 0;
const fail = (file, msg) => {
  failures += 1;
  console.log(`      ✗ ${pad(path.relative(ROOT, file), 34)} ${msg}`);
};

console.log('\nAIME DESIGN SYSTEM V1 — VÉRIFICATION DOM');
console.log(`  périmètre : ${pages.length} écrans · exécution réelle des scripts\n`);

const iconIds = new Set(
  (readFileSync(path.join(DS, 'assets/aime-icons.svg'), 'utf8').match(/<symbol id="([^"]+)"/g) || [])
    .map((m) => m.match(/id="([^"]+)"/)[1]),
);

const rows = [];

for (const file of pages) {
  const rel = path.relative(ROOT, file);
  const html = readFileSync(file, 'utf8');
  const console_ = new VirtualConsole();
  const errors = [];
  console_.on('jsdomError', (e) => errors.push(e.message));
  console_.on('error', (...a) => errors.push(a.join(' ')));

  const dom = new JSDOM(html, {
    url: pathToFileURL(file).href,
    runScripts: 'dangerously',
    resources: new Disk(),
    pretendToBeVisual: true,
    virtualConsole: console_,
  });
  const { window } = dom;

  // Les scripts `defer` sont exécutés par jsdom ; on attend la fin de charge.
  await new Promise((res) => {
    if (window.document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
    setTimeout(res, 4000);
  });
  await new Promise((r) => setTimeout(r, 50));

  const doc = window.document;
  const notes = [];

  /* 1 — erreurs d'exécution */
  for (const e of errors) fail(file, `erreur d'exécution : ${e.split('\n')[0].slice(0, 90)}`);

  /* 2 — le chrome documentaire a bien été injecté */
  const hasChrome = html.includes('ds-shell');
  if (hasChrome) {
    if (!doc.querySelector('.ds-top')) fail(file, 'js/doc.js n’a pas injecté la barre supérieure');
    else notes.push('chrome');
    if (!doc.querySelector('.ds-side')) fail(file, 'js/doc.js n’a pas injecté la navigation');
  }

  /* 3 — chaque <use> pointe sur une icône qui existe */
  let icons = 0;
  for (const u of doc.querySelectorAll('use')) {
    const href = u.getAttribute('href') || '';
    if (!href.includes('#')) {
      fail(file, `<use> sans référence résolue (data-a-icon="${u.parentElement?.getAttribute?.('data-a-icon') || '?'}")`);
      continue;
    }
    const id = href.split('#').pop();
    if (!iconIds.has(id)) fail(file, `icône inexistante : ${id}`);
    icons += 1;
  }

  /* 4 — les scripts modules (jsdom ne les exécute pas : on le fait) */
  const modules = [...doc.querySelectorAll('script[type="module"]')];
  for (const s of modules) {
    const globals = {
      document: doc,
      window,
      location: window.location,
      localStorage: window.localStorage,
      fetch: makeFetch(path.dirname(file)),
      Response,
      URL,
      MutationObserver: window.MutationObserver,
      requestAnimationFrame: window.requestAnimationFrame?.bind(window) ?? ((cb) => setTimeout(cb, 16)),
      console,
    };
    const saved = {};
    for (const [k, v] of Object.entries(globals)) {
      saved[k] = globalThis[k];
      globalThis[k] = v;
    }
    try {
      if (s.src) {
        const target = path.resolve(path.dirname(file), s.getAttribute('src'));
        if (!existsSync(target)) fail(file, `module absent : ${s.getAttribute('src')}`);
        else await import(`${pathToFileURL(target).href}?v=${Date.now()}`);
      } else {
        const tmp = path.join(DS, '.tmp-inline-module.mjs');
        // Écrit dans le dépôt pour que les imports relatifs du module résolvent.
        const { writeFileSync, unlinkSync } = await import('node:fs');
        writeFileSync(tmp, s.textContent);
        try {
          await import(`${pathToFileURL(tmp).href}?v=${Date.now()}`);
        } finally {
          unlinkSync(tmp);
        }
      }
      notes.push('module');
    } catch (e) {
      fail(file, `module en échec : ${e.message.split('\n')[0].slice(0, 90)}`);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete globalThis[k];
        else globalThis[k] = v;
      }
    }
  }

  /* 5 — les conteneurs token-driven ont bien été remplis */
  for (const box of doc.querySelectorAll('[data-a-render]')) {
    const kind = box.getAttribute('data-a-render');
    const text = (box.textContent || '').trim();
    if (!box.innerHTML.trim() || /Chargement|…$/.test(text) && box.children.length === 0) {
      fail(file, `conteneur token-driven « ${kind} » resté vide`);
    } else {
      notes.push(`rendu:${kind}`);
    }
  }

  /* 6 — auditLive sur le document vivant */
  const live = auditLive(doc);
  if (!live) fail(file, 'auditLive() n’a rien produit sur le document');
  else if (live.geometry.length || live.targets.length) {
    // jsdom ne calcule aucune géométrie : toute valeur non nulle est suspecte.
    fail(file, `auditLive signale ${live.geometry.length} débordement(s), ${live.targets.length} cible(s)`);
  } else notes.push('auditLive');

  rows.push({ rel, icons, modules: modules.length, notes });
  dom.window.close();
}

for (const r of rows) {
  console.log(`  ✓ ${pad(r.rel, 34)} ${String(r.icons).padStart(3)} icônes · ${r.modules} module(s) · ${r.notes.join(' · ')}`);
}

console.log('\n  ⚠ jsdom n’a pas de moteur de mise en page : les volets géométriques');
console.log('    d’auditLive (débordement réel, taille des cibles) ne sont PAS vérifiés ici.');
console.log('    Ils demandent un navigateur réel — voir design-system/README.md.\n');

if (failures) {
  console.log(`✗ VÉRIFICATION DOM REFUSÉE — ${failures} écart(s).\n`);
  process.exit(1);
}
console.log(`✓ VÉRIFICATION DOM VALIDÉE — ${rows.length} écrans exécutés sans erreur.\n`);
