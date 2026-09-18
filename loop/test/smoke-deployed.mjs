#!/usr/bin/env node
/**
 * AIME / NOEMA — SMOKE POST-DÉPLOIEMENT DE LA BOUCLE
 *
 * Un déploiement qui ne prouve pas ce qu'il sert est une opinion. Après
 * chaque mise en ligne, ce smoke demande à l'hôte réel :
 *
 *   1. l'écran de la boucle est servi (HTML, titre attendu) ;
 *   2. /api/state répond en JSON, avec un monde et un runtime honnête ;
 *   3. une décision sans acteur est refusée (400) — la règle centrale
 *      tient sur l'hébergement, pas seulement en local ;
 *   4. une route inconnue sous /api/ renvoie 404 JSON, pas un HTML d'erreur.
 *
 *   BASE_URL=https://… node loop/test/smoke-deployed.mjs
 *
 * Sortie 0 si tout tient, 1 si un contrôle échoue, 2 si la commande est
 * mal formée. Les codes suivent la convention du diagnostic : mesurer et
 * nommer, jamais réparer.
 */
const BASE = (process.env.BASE_URL || 'https://aime-composer.vercel.app').replace(/\/+$/, '');
const failures = [];
const check = (ok, label, detail = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failures.push(label);
};

if (!/^https?:\/\//.test(BASE)) {
  console.error('BASE_URL doit être une URL http(s).');
  process.exit(2);
}

console.log(`\nSMOKE BOUCLE — ${BASE}\n`);

/* 1. L'écran est servi. */
try {
  const r = await fetch(`${BASE}/loop/`);
  const html = await r.text();
  const served = r.status === 200 && (r.headers.get('content-type') || '').includes('text/html');
  check(served, 'l’écran de la boucle est servi (HTML 200)');
  check(/Boucle minimale — AIME \/ NOEMA/.test(html), 'l’écran porte son titre attendu');
} catch (e) {
  check(false, 'l’écran de la boucle est servi (HTML 200)', e.message);
}

/* 2. L'API répond, avec un monde et un runtime honnête. */
try {
  const r = await fetch(`${BASE}/api/state`);
  const type = r.headers.get('content-type') || '';
  const d = await r.json().catch(() => null);
  check(r.status === 200 && type.includes('application/json'), '/api/state répond 200 en JSON');
  check(Array.isArray(d?.entities) && d.entities.length > 0, 'le monde de démonstration est là');
  const rt = d?.runtime;
  check(
    rt && ['server', 'serverless'].includes(rt.mode) && typeof rt.persisted === 'boolean',
    'le runtime est publié (mode, persisted)',
    `reçu : ${JSON.stringify(rt)}`,
  );
  if (rt?.mode === 'serverless') {
    check(rt.persisted === false, 'un hôte serverless ne prétend pas persister sur disque');
  }
} catch (e) {
  check(false, '/api/state répond 200 en JSON', e.message);
}

/* 3. La règle centrale tient sur l'hôte réel. */
try {
  const r = await fetch(`${BASE}/api/decide`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ proposal_id: 'prop-0001', decision: 'accepted' }),
  });
  const d = await r.json().catch(() => ({}));
  check(r.status === 400 && /acteur/.test(d.error || ''), 'une décision sans acteur est refusée (400)');
} catch (e) {
  check(false, 'une décision sans acteur est refusée (400)', e.message);
}

/* 4. Une route inconnue reste un 404 JSON propre. */
try {
  const r = await fetch(`${BASE}/api/inconnue`);
  const type = r.headers.get('content-type') || '';
  const d = await r.json().catch(() => null);
  check(r.status === 404 && type.includes('application/json') && !!d?.error, 'une route inconnue renvoie 404 JSON');
} catch (e) {
  check(false, 'une route inconnue renvoie 404 JSON', e.message);
}

console.log(`\n${failures.length ? '✗' : '✓'} smoke boucle : ${failures.length ? failures.length + ' échec(s)' : 'tout tient'}\n`);
process.exit(failures.length ? 1 : 0);
