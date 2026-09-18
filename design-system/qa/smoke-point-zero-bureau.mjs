#!/usr/bin/env node
/**
 * SMOKES — POINT ZERO · Bureau : parité avec la médiathèque (atlas/).
 *
 * Gate de la Vague 1 (AUDIT/POINT-ZERO-CONVERGENCE-01.md) : la spec
 * POINT-ZERO-INTERFACE-V1 §4 exige que chaque carte du Bureau offre « les
 * mêmes fonctions que la médiathèque, sans exception ». Ce script prouve,
 * dans un DOM réel (jsdom), les sept fonctions que l'audit avait mesurées
 * absentes :
 *
 *   1. visionneuse réelle (image jsDelivr + repli raw en data-fallback,
 *      tuile honnête après double échec) ;
 *   2. lecture vidéo / audio dans le panneau ;
 *   3. téléchargement (CDN → repli raw → source) ;
 *   4. vérification des octets servis contre l'empreinte git / SHA-256 ;
 *   5. brief agent + manifeste JSON ;
 *   6. script .sh de récupération ;
 *   7. sélection multiple avec barre d'actions.
 *
 * Hors contrat : réseau, presse-papiers et URL-objets sont stubbés — la
 * vérification lit des octets construits ici, dont le sha1 « blob » git
 * est calculé par node:crypto, exactement comme git le ferait.
 *
 *   cd design-system && node qa/smoke-point-zero-bureau.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash, webcrypto } from 'node:crypto';

let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = await import('jsdom')); } catch {
  console.error('jsdom absent — `cd design-system && npm install`');
  process.exit(1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const PAGE = path.join(ROOT, 'point-zero', 'index.html');

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };

/* ── Octets réels et leur empreinte git (sha1("blob <n>\0" + octets)) ── */
const bytes = (s) => new TextEncoder().encode(s);
const gitSha = (buf) => createHash('sha1').update(`blob ${buf.byteLength}\0`).update(Buffer.from(buf)).digest('hex');
const COVER = bytes('cover-bytes-0123456789');
const LOGO = bytes('logo-bytes');
const COVER_SHA = gitSha(COVER);
const LOGO_SHA = gitSha(LOGO);

const MEDIA = {
  generated_at: '2026-09-17T10:00:00.000Z',
  owner: 'mattmezstitchlab',
  truncated: false,
  totals: { repos: 3, repos_with_media: 2, repos_empty: 1, repos_error: 0, media: 6, duplicates: 2, image: 3, vecteur: 0, video: 2, audio: 1 },
  repos: [
    { name: 'by-aime', private: false, default_branch: 'main', media: 3, state: 'ok', tree_truncated: false },
    { name: 'nails-profile', private: false, default_branch: 'main', media: 3, state: 'ok', tree_truncated: false },
    { name: 'DISPOORED', private: false, default_branch: 'HEAD', media: 0, state: 'vide', tree_truncated: false },
  ],
  items: [
    { id: 'med-0001', repo: 'by-aime', path: 'images/cover.jpg', name: 'cover.jpg', kind: 'image', ext: 'jpg', size: COVER.byteLength, sha: COVER_SHA, url: 'https://cdn.jsdelivr.net/gh/m/a@main/images/cover.jpg', url_raw: 'https://raw.githubusercontent.com/m/a/main/images/cover.jpg', source: 'https://github.com/m/a/blob/main/images/cover.jpg' },
    { id: 'med-0002', repo: 'by-aime', path: 'public/images/cover.jpg', name: 'cover.jpg', kind: 'image', ext: 'jpg', size: COVER.byteLength, sha: COVER_SHA, url: 'https://cdn.jsdelivr.net/gh/m/a@main/public/images/cover.jpg', url_raw: null, source: 'https://github.com/m/a/blob/main/public/images/cover.jpg' },
    /* logo.png : le CDN sert des octets ALTÉRÉS, le repli raw sert les bons. */
    { id: 'med-0003', repo: 'by-aime', path: 'img/logo.png', name: 'logo.png', kind: 'image', ext: 'png', size: LOGO.byteLength, sha: LOGO_SHA, url: 'https://cdn.jsdelivr.net/gh/m/a@main/img/logo.png', url_raw: 'https://raw.githubusercontent.com/m/a/main/img/logo.png', source: 'https://github.com/m/a/blob/main/img/logo.png' },
    { id: 'med-0004', repo: 'nails-profile', path: 'public/hand-video.mp4', name: 'hand-video.mp4', kind: 'video', ext: 'mp4', size: 2626732, sha: 's3', url: 'https://cdn.jsdelivr.net/gh/m/n@main/public/hand-video.mp4', url_raw: 'https://raw.githubusercontent.com/m/n/main/public/hand-video.mp4', source: 'https://github.com/m/n/blob/main/public/hand-video.mp4' },
    { id: 'med-0005', repo: 'nails-profile', path: 'assets/voice.mp3', name: 'voice.mp3', kind: 'audio', ext: 'mp3', size: 90000, sha: 's4', url: 'https://cdn.jsdelivr.net/gh/m/n@main/assets/voice.mp3', url_raw: null, source: 'https://github.com/m/n/blob/main/assets/voice.mp3' },
    /* teaser.mov : dépôt privé, aucune URL — rien ne doit être simulé. */
    { id: 'med-0006', repo: 'nails-profile', path: 'private/teaser.mov', name: 'teaser.mov', kind: 'video', ext: 'mov', size: 10, sha: 's5', url: null, url_raw: null, source: 'https://github.com/m/n/blob/main/private/teaser.mov' },
  ],
};

/* Réseau stubbé : media.json, octets des images, 404 ailleurs. */
const NET = {
  'https://cdn.jsdelivr.net/gh/m/a@main/images/cover.jpg': COVER,
  'https://cdn.jsdelivr.net/gh/m/a@main/public/images/cover.jpg': COVER,
  'https://cdn.jsdelivr.net/gh/m/a@main/img/logo.png': bytes('logo-bytes-ALTERED-BY-CDN'),
  'https://raw.githubusercontent.com/m/a/main/img/logo.png': LOGO,
};
const netLog = [];
const makeFetch = (base) => async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  netLog.push(url);
  if (url.includes('media.json')) return new Response(JSON.stringify(MEDIA), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.startsWith('blob:')) {
    const b = blobs.get(url);
    return b ? new Response(await b.arrayBuffer(), { status: 200 }) : new Response(null, { status: 404 });
  }
  if (/^https?:/.test(url)) {
    const body = NET[url];
    return body ? new Response(body, { status: 200 }) : new Response(null, { status: 404, statusText: 'Not Found' });
  }
  /* Relatif au dépôt (QA-REPORT.json, etc.) : disque, sinon 404. */
  const p = path.resolve(base, url);
  return existsSync(p) ? new Response(readFileSync(p), { status: 200 }) : new Response(null, { status: 404 });
};

/* URL-objets : on garde le Blob pour que fetch(blob:) relise les octets. */
const blobs = new Map();
const clicks = [];
const clipboard = [];
const toasts = [];

const html = readFileSync(PAGE, 'utf8');
/* jsdom ne sait pas naviguer : le clic sur <a download> est capturé
   (clicks) et la navigation non implémentée est tue, pas un échec. */
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => { if (!/navigation/.test(e.message)) console.error(e.message); });
const dom = new JSDOM(html, {
  url: pathToFileURL(PAGE).href,
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.URL.createObjectURL = (blob) => { const u = `blob:pz-${blobs.size + 1}`; blobs.set(u, blob); return u; };
    window.URL.revokeObjectURL = () => {};
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async (txt) => { clipboard.push(txt); } }, configurable: true });
    const origClick = window.HTMLElement.prototype.click;
    window.HTMLElement.prototype.click = function () {
      clicks.push(this);
      /* Un <a download> déclencherait une navigation que jsdom n'a pas :
         l'intention (href + download) est capturée, le clic n'est pas relayé. */
      if (this.tagName === 'A' && this.hasAttribute('download')) return undefined;
      return origClick.call(this);
    };
    window.open = () => {};
    window.AIME = { toast: (o) => toasts.push(o) };
    if (!window.crypto?.subtle) Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
    /* jsdom 25 n'a ni Blob.arrayBuffer() ni Blob.text() (les navigateurs
       les ont) : on les dérive de FileReader, que jsdom implémente. */
    const readAs = (blob, how) => new Promise((res, rej) => {
      const fr = new window.FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => rej(fr.error);
      fr[how](blob);
    });
    if (!window.Blob.prototype.arrayBuffer) window.Blob.prototype.arrayBuffer = function () { return readAs(this, 'readAsArrayBuffer'); };
    if (!window.Blob.prototype.text) window.Blob.prototype.text = function () { return readAs(this, 'readAsText'); };
    /* jsdom n'implémente pas la lecture : on rend pause() inoffensif. */
    window.HTMLMediaElement.prototype.pause = function () { this.dataset.paused = '1'; };
    window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  },
});
const { window } = dom;
const { document } = window;

/* Exécution du module ES comme le fait verify-dom.mjs : globaux substitués. */
const globals = {
  document, window, location: window.location, localStorage: window.localStorage,
  fetch: makeFetch(path.dirname(PAGE)), Response, URL: window.URL, Blob: window.Blob,
  TextEncoder, MutationObserver: window.MutationObserver,
  requestAnimationFrame: (cb) => setTimeout(cb, 16), navigator: window.navigator,
  HTMLMediaElement: window.HTMLMediaElement,
};
const saved = {};
for (const [k, v] of Object.entries(globals)) {
  saved[k] = globalThis[k];
  try { globalThis[k] = v; } catch { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
}
const drain = async (n = 40) => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 5)); };
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

console.log('\nPOINT ZERO · BUREAU — parité médiathèque (spec §4, « sans exception »)');
try {
  await import(`${pathToFileURL(path.join(ROOT, 'point-zero', 'pz.js')).href}?v=${Date.now()}`);
  await drain();

  const grid = document.querySelector('#pz-bureau-grid');
  const cards = () => [...grid.querySelectorAll('.ucard[data-id]')];
  t('catalogue projeté : 6 cartes depuis atlas/media.json', cards().length === 6);

  /* 1 — visionneuse réelle */
  const img = grid.querySelector('.ucard[data-id="med-0001"] img');
  t('1. image réelle sur jsDelivr', !!img && img.getAttribute('src').includes('cdn.jsdelivr.net'));
  t('1. repli raw porté par data-fallback', img?.dataset.fallback?.includes('raw.githubusercontent.com'));
  fire(img, 'error');
  t('1. premier échec → bascule sur le repli raw, une seule fois',
    img.getAttribute('src').includes('raw.githubusercontent.com') && !img.dataset.fallback);
  fire(img, 'error');
  const tile = grid.querySelector('.ucard[data-id="med-0001"] .umedia');
  t('1. second échec → tuile honnête « inaccessible — voir la source », pas d’image brisée',
    tile.classList.contains('is-empty') && tile.textContent.includes('inaccessible') && !tile.querySelector('img'));

  /* 2 — lecture vidéo / audio dans le panneau */
  const video = grid.querySelector('.ucard[data-id="med-0004"] video.umedia__video');
  t('2. vidéo : <video controls preload=metadata> sur la vraie source',
    !!video && video.hasAttribute('controls') && video.getAttribute('preload') === 'metadata' && video.getAttribute('src').includes('jsdelivr'));
  t('2. vidéo : repli raw en data-fallback', video?.dataset.fallback?.includes('raw.githubusercontent'));
  const audio = grid.querySelector('.ucard[data-id="med-0005"] audio.umedia__audio');
  t('2. audio : <audio controls> présent dans la carte', !!audio && audio.hasAttribute('controls'));
  fire(video, 'play');
  t('2. un seul lecteur à la fois : l’audio est mis en pause quand la vidéo démarre', audio.dataset.paused === '1');
  const priv = grid.querySelector('.ucard[data-id="med-0006"]');
  t('2. vidéo sans URL (dépôt privé) : tuile honnête, aucun lecteur', !priv.querySelector('video') && !!priv.querySelector('.umedia.is-empty'));

  /* 3 — téléchargement */
  const dlBtn = grid.querySelector('.ucard[data-id="med-0002"] [data-pz-dl]');
  t('3. bouton Télécharger sur une carte téléchargeable', !!dlBtn);
  t('3. pas de bouton Télécharger sur un média sans URL', !priv.querySelector('[data-pz-dl]'));
  dlBtn.click();
  await drain();
  const dlAnchor = clicks.find((c) => c.tagName === 'A' && c.download === 'cover.jpg');
  t('3. téléchargement : les octets sont récupérés puis proposés sous le vrai nom', !!dlAnchor && dlAnchor.href.startsWith('blob:'));
  t('3. téléchargement : le fichier a bien été lu sur le CDN', netLog.includes(MEDIA.items[1].url));

  /* 4 — vérification */
  grid.querySelector('.ucard[data-id="med-0002"] [data-pz-verify]').click();
  await drain();
  const v2 = grid.querySelector('.ucard[data-id="med-0002"] .a-badge--success');
  t('4. vérification : octets servis = blob commité → badge « vérifié »', !!v2 && v2.textContent.includes('vérifié'));
  grid.querySelector('.ucard[data-id="med-0003"] [data-pz-verify]').click();
  await drain();
  const v3 = grid.querySelector('.ucard[data-id="med-0003"] .a-badge--success');
  t('4. vérification : CDN altéré → le repli raw est lu et confirme l’empreinte',
    !!v3 && netLog.includes(MEDIA.items[2].url) && netLog.includes(MEDIA.items[2].url_raw) && v3.title.includes('raw'));
  grid.querySelector('.ucard[data-id="med-0006"] [data-pz-verify]').click();
  await drain();
  const v6 = grid.querySelector('.ucard[data-id="med-0006"] .a-badge[title*="privé"]');
  t('4. vérification : dépôt privé → « non vérifiable », jamais « conforme » sans octets', !!v6 && v6.textContent.includes('non vérifiable'));
  const lastToast = toasts.at(-1);
  t('4. vérification : le toast dit pourquoi (aucune URL publique)', /aucune URL publique/i.test(lastToast?.text || ''));

  /* 7 — sélection multiple */
  const box4 = grid.querySelector('[data-pz-select="med-0004"]');
  const box5 = grid.querySelector('[data-pz-select="med-0005"]');
  box4.checked = true; fire(box4, 'change');
  box5.checked = true; fire(box5, 'change');
  const selbar = document.querySelector('#pz-selbar');
  t('7. barre de sélection affichée à 2', selbar.hidden === false && document.querySelector('#pz-selcount').textContent === '2');
  t('7. cartes cochées marquées is-selected', grid.querySelector('.ucard[data-id="med-0004"]').classList.contains('is-selected'));

  /* copier les liens (déjà présent avant la vague, gardé) */
  document.querySelector('#pz-sel-links').click();
  await drain();
  t('liens copiés : 2 lignes CDN', clipboard[0]?.split('\n').length === 2 && clipboard[0].includes('jsdelivr'));

  /* 5 — brief agent + manifeste JSON */
  document.querySelector('#pz-sel-brief').click();
  await drain();
  const brief = clipboard[1] || '';
  t('5. brief : consigne pour l’agent présente', brief.includes("## Consigne pour l'agent"));
  const jsonBlock = brief.split('```json')[1]?.split('```')[0] || '';
  let manifest = null;
  try { manifest = JSON.parse(jsonBlock); } catch { /* invalide */ }
  t('5. brief : manifeste JSON valide à 2 entrées', Array.isArray(manifest) && manifest.length === 2);
  t('5. brief : url_cdn / url_repli / transfert=url / empreinte git-blob',
    manifest?.[0]?.url_cdn?.includes('jsdelivr') && 'url_repli' in (manifest?.[0] || {}) && manifest?.[0]?.transfert === 'url' && manifest?.[0]?.empreinte?.startsWith('git-blob:'));
  t('5. brief : verification=null quand non vérifié (pas « conforme par défaut »)', manifest?.[0]?.verification === null);

  /* 6 — script .sh */
  document.querySelector('#pz-sel-sh').click();
  await drain();
  const sh = clicks.find((c) => c.tagName === 'A' && c.download === 'mediatheque-selection.sh');
  t('6. script .sh : un téléchargement déclenché', !!sh);
  const shBlob = sh ? blobs.get(sh.href) : null;
  const shTxt = shBlob ? await shBlob.text() : '';
  t('6. script .sh : shebang + curl CDN puis repli raw', shTxt.startsWith('#!/usr/bin/env bash') && shTxt.includes('curl -sfL -o "hand-video.mp4"') && shTxt.includes('raw.githubusercontent.com/m/n/main/public/hand-video.mp4'));
  t('6. script .sh : contrôle d’empreinte git hash-object après récupération', shTxt.includes('git hash-object "hand-video.mp4"'));

  /* 7 — tout cocher / effacer, filtrés */
  document.querySelector('#pz-bureau [data-mode="image"]').click();
  document.querySelector('#pz-sel-visible').click();
  t('7. « Tout cocher (visibles) » n’ajoute que les cartes filtrées (2 + 3 images = 5)', document.querySelector('#pz-selcount').textContent === '5');
  document.querySelector('#pz-sel-clear').click();
  t('7. « Effacer » vide la sélection et masque la barre', selbar.hidden === true && Bureau_selectedCount() === 0);
  document.querySelector('#pz-bureau [data-mode="tout"]').click();

  /* Inspecteur : mêmes fonctions depuis la sélection unique */
  grid.querySelector('.ucard[data-id="med-0003"] [data-media-select]').click();
  const ins = document.querySelector('#pz-inspector-body');
  t('inspecteur : Télécharger + Vérifier + case « dans la sélection » sur le média inspecté',
    !!ins.querySelector('[data-pz-dl="med-0003"]') && !!ins.querySelector('[data-pz-verify="med-0003"]') && !!ins.querySelector('[data-pz-select="med-0003"]'));
  t('inspecteur : ligne « vérification » reflète le contrôle déjà fait', ins.textContent.includes('vérification') && !!ins.querySelector('.a-badge--success'));
  const insBox = ins.querySelector('[data-pz-select="med-0003"]');
  insBox.checked = true; fire(insBox, 'change');
  t('inspecteur : cocher depuis l’inspecteur alimente la même sélection', document.querySelector('#pz-selcount').textContent === '1' && grid.querySelector('[data-pz-select="med-0003"]').checked);

  /* Mode local : mêmes fonctions, zéro réseau */
  const makeFile = (rel, name, content = 'x'.repeat(10)) => {
    const f = new window.File([content], name, { type: 'application/octet-stream' });
    Object.defineProperty(f, 'webkitRelativePath', { value: rel });
    return f;
  };
  const input = document.querySelector('#pz-file-dir');
  Object.defineProperty(input, 'files', { configurable: true, value: [makeFile('album/film/clip.mov', 'clip.mov', 'clip-bytes'), makeFile('album/son/track.mp3', 'track.mp3', 'track-bytes')] });
  const netBefore = netLog.length;
  fire(input, 'change');
  await drain(60);
  const localVideo = grid.querySelector('video.umedia__video');
  t('local : vidéo lue depuis blob:, aucun réseau', !!localVideo && localVideo.getAttribute('src').startsWith('blob:') && netLog.slice(netBefore).every((u) => u.startsWith('blob:') || !/^https?:/.test(u)));
  t('local : aucun lien « source » vers GitHub sur une carte locale', !grid.querySelector('.ucard a[href^="https://github.com"]'));
  const localId = cards()[0].dataset.id;
  const localCard = () => grid.querySelector(`.ucard[data-id="${localId}"]`);
  localCard().querySelector('[data-pz-verify]').click();
  await drain(60);
  /* La grille est re-rendue après vérification : on re-lit la carte. */
  t('local : vérification recalcule le SHA-256 sur l’objet local → « vérifié »', !!localCard().querySelector('.a-badge--success'));
  const lbox = localCard().querySelector('[data-pz-select]');
  lbox.checked = true; fire(lbox, 'change');
  document.querySelector('#pz-sel-brief').click();
  await drain();
  const briefMix = clipboard.at(-1) || '';
  t('local : brief mixte — clause « demander le fichier », url_cdn null, transfert manuel',
    briefMix.includes('demander le fichier') && briefMix.includes('"url_cdn": null') && briefMix.includes('"transfert": "manuel'));
  document.querySelector('#pz-sel-links').click();
  await drain();
  t('local : la ligne de lien dit de joindre manuellement', (clipboard.at(-1) || '').includes('[fichier local]'));
  /* Deep-link ?source=local — la grammaire de routage héritée de la page
     atlas (l'accueil y envoie « Dossier local ») : second DOM, même module. */
  const dom2 = new JSDOM(html, { url: `${pathToFileURL(PAGE).href}?source=local`, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; w.AIME = { toast() {} }; } });
  const g2 = { document: dom2.window.document, window: dom2.window, location: dom2.window.location, localStorage: dom2.window.localStorage, navigator: dom2.window.navigator, HTMLMediaElement: dom2.window.HTMLMediaElement, URL: dom2.window.URL, Blob: dom2.window.Blob, MutationObserver: dom2.window.MutationObserver };
  for (const [k, v] of Object.entries(g2)) { try { globalThis[k] = v; } catch { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); } }
  await import(`${pathToFileURL(path.join(ROOT, 'point-zero', 'pz.js')).href}?v=${Date.now()}-local`);
  await drain();
  const d2 = dom2.window.document;
  t('deep-link ?source=local : arrive en mode Dossier local', d2.querySelector('#pz-src-local')?.getAttribute('aria-pressed') === 'true');
  t('deep-link ?source=local : le ＋ Import est ouvert, prêt pour « Dossier »', d2.querySelector('#pz-uimport')?.hidden === false && !!d2.querySelector('[data-import="dir"]'));
  t('deep-link ?source=local : le Bureau explique la lecture locale sans envoi', /rien n.est envoyé/i.test(d2.querySelector('#pz-bureau-note')?.textContent || ''));
} catch (e) {
  fail++;
  console.log(`  ✗ exécution : ${e.stack?.split('\n').slice(0, 3).join(' | ')}`);
} finally {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete globalThis[k];
    else globalThis[k] = v;
  }
}

function Bureau_selectedCount() {
  return document.querySelectorAll('#pz-bureau-grid [data-pz-select]:checked').length;
}

console.log(`\n${fail === 0 ? '✓' : '✗'} SMOKES POINT ZERO · BUREAU : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
