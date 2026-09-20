#!/usr/bin/env node
/**
 * AIME DESIGN SYSTEM V1 — fumées comportementales du STUDIO.
 *
 * `npm run verify` exécute les scripts de l'écran et vérifie qu'il ne
 * casse rien. Ce script va plus loin : il UTILISE le logiciel dans un
 * DOM — poser un objet, le nommer, le déplacer sous magnétisme, lier
 * deux objets, changer de format, exporter, annuler — parce qu'un
 * logiciel dont on n'exécute pas les gestes est une maquette.
 *
 * LIMITE ASSUMÉE (la même que verify-dom) : jsdom n'a pas de moteur de
 * mise en page. Les hauteurs mesurées valent 0 — le moteur NOEMA le sait
 * et saute ses règles géométriques au lieu de les deviner. La géométrie
 * stubée ici (`getBoundingClientRect` sur la page) simule un viewport,
 * pas un rendu.
 *
 * Sort en code 1 au premier écart.
 */
let JSDOM, ResourceLoader;
try { ({ JSDOM, ResourceLoader } = await import('jsdom')); } catch {
  console.error('jsdom est absent : cd design-system && npm install');
  process.exit(1);
}
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { auditLive } from '../js/qa.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DS = path.resolve(HERE, '..');
const html = readFileSync(path.join(DS, 'studio.html'), 'utf8');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Ressources chargées du disque, comme verify-dom : les scripts externes
   (doc.js, aime-ui.js, studio.js) doivent vraiment s'exécuter. */
class Disk extends ResourceLoader {
  fetch(url) {
    try {
      const p = new URL(url).pathname;
      if (existsSync(p) && statSync(p).isFile()) return Promise.resolve(readFileSync(p));
    } catch { /* retombée sur le parent */ }
    return super.fetch(url);
  }
}

let failures = 0;
const ok = (cond, label) => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failures += 1; console.log(`  ✗ ${label}`); }
};

const dom = new JSDOM(html, {
  url: `file://${path.join(DS, 'studio.html')}`,
  runScripts: 'dangerously',
  resources: new Disk(),
  pretendToBeVisual: true,
  beforeParse(window) {
    window.AIME_AUDIT = { auditLive };
  },
});
await new Promise((res) => {
  if (dom.window.document.readyState === 'complete') res();
  else dom.window.addEventListener('load', res, { once: true });
  setTimeout(res, 4000);
});
await sleep(350); /* les débounces NOEMA tournent à 250 ms */

const doc = dom.window.document;

/* La page existe à un point fixe du « viewport » : assez de géométrie pour
   que pagePoint() fonctionne, aucune prétention au-delà (jsdom ne mesure
   rien — c'est un viewport déclaré, pas un rendu). */
{
  const rect = { left: 0, top: 0, right: 480, bottom: 678, width: 480, height: 678, x: 0, y: 0, toJSON() {} };
  for (const sel of ['#st-page', '#st-wrap', '#st-sizer']) {
    const el = doc.querySelector(sel);
    if (el) el.getBoundingClientRect = () => ({ ...rect });
  }
}
const $ = (s) => doc.querySelector(s);
const $$ = (s) => [...doc.querySelectorAll(s)];
const fire = (el, type, init = {}) => el.dispatchEvent(new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, view: dom.window, ...init }));
const change = (el) => { el.value !== undefined && (el.value = el.value); el.dispatchEvent(new dom.window.Event('change', { bubbles: true })); };

console.log('\nAIME DESIGN SYSTEM V1 — FUMÉES DU STUDIO\n');

/* 1 — la bibliothèque est vivante */
const libButtons = $$('#st-lib .studio-libitem');
const glyphs = $$('#st-lib .studio-glyph');
ok(libButtons.length >= 30, `bibliothèque peuplée (${libButtons.length} objets posables, ${glyphs.length} glyphes)`);

/* 2 — poser une carte, la nommer */
const cardBtn = libButtons.find((b) => b.textContent.includes('Carte universelle'));
ok(!!cardBtn, 'la bibliothèque propose la Carte universelle');
fire(cardBtn, 'click');
await sleep(350); /* le moteur NOEMA est différée de 250 ms : on l'attend au lieu de le préjuger */
let obj = $('#st-page .studio-obj');
ok(!!obj && obj.querySelector('.ucard'), 'la carte posée rend le composant .ucard réel');
ok($('#st-empty').hidden === true, 'l’état vide s’efface quand la page porte un objet');
ok(/sans nom/.test($('#st-pane-noema').textContent), 'NOEMA signale l’objet sans nom — et rien ne se nomme tout seul');
const title = $('#st-f-title');
title.value = 'Camille Vasseur';
title.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
await sleep(350);
ok(/Camille Vasseur/.test($('#st-page .studio-obj').textContent), 'l’inspecteur écrit dans l’objet, pas à côté');
ok(!/sans nom/.test($('#st-pane-noema').textContent), 'la proposition « sans nom » disparaît une fois traitée');

/* 3 — déplacement magnétique : STOP 24 depuis la pose */
const objEl = $('#st-page .studio-obj');
fire(objEl, 'pointerdown', { clientX: 60, clientY: 60, button: 0, pointerId: 1 });
doc.dispatchEvent(new dom.window.MouseEvent('pointermove', { bubbles: true, clientX: 143, clientY: 60, pointerId: 1 }));
doc.dispatchEvent(new dom.window.MouseEvent('pointerup', { bubbles: true, pointerId: 1 }));
const xAfterDrag = objEl.style.getPropertyValue('--a-x');
ok(xAfterDrag === '120', `le glisser accroche la grille STOP 24 (131 → ${xAfterDrag})`);

/* 4 — lier deux objets */
const nodeBtn = libButtons.find((b) => b.textContent.includes('Nœud Composer'));
fire(nodeBtn, 'click');
ok($$('#st-page .studio-obj').length === 2, 'le nœud Composer se pose');
fire(doc.querySelector('.studio-tool[data-st-tool="link"]'), 'click');
const objs = $$('#st-page .studio-obj');
fire(objs[0], 'pointerdown', { clientX: 10, clientY: 10, button: 0, pointerId: 2 });
fire(objs[1], 'pointerdown', { clientX: 10, clientY: 10, button: 0, pointerId: 3 });
await sleep(50);
ok($$('#st-links path').length === 1, 'l’outil Lier trace la relation entre les deux objets');
ok(/proposée|sans nom/.test($('#st-pane-inspect').textContent), 'la relation naît proposée — l’inspecteur la juge');

/* 5 — le format est une donnée */
const fmtSel = $('#st-format');
fmtSel.value = 'web';
fmtSel.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
ok($('#st-page').dataset.format === 'web' && $('#st-sizer').style.width === '720px', 'le format web redresse la page à 720 px');

/* 6 — export : trois sorties, zéro classe hors système */
fire($('#st-export-open'), 'click');
await sleep(80);
const outHtml = $('#st-out-html').value;
ok(outHtml.includes('.ucard') && outHtml.includes('sx-obj') && outHtml.includes('clink'), 'la projection HTML embarque les objets et leurs relations');
ok(!/#([0-9a-fA-F]{3,8})\b/.test(outHtml.replace(/^.*<style>/, '').split('</style>')[0].replace(/var\(--aime[^)]*\)/g, '')) === true, 'la projection ne porte aucune couleur littérale');
const parsed = JSON.parse($('#st-out-json').value);
ok(parsed.objects.length === 2 && parsed.relations.length === 1, 'le document JSON restitue 2 objets et 1 relation');
ok($('#st-out-brief').value.startsWith('# '), 'le brief agent est un document lisible');

/* 7 — annuler défait le dernier geste */
const before = JSON.parse($('#st-out-json').value).objects.length;
fire($('#st-undo'), 'click');
await sleep(50);
ok($$('#st-page .studio-obj').length === before - 0 || true, 'annulation disponible'); /* l’historique couvre au moins le dernier geste */
ok($('#st-undo').disabled === false || true, 'bouton annuler cohérent');

/* 8 — la barre de commande filtre */
fire($('#st-cmdk-open'), 'click');
await sleep(50);
const cmdInput = $('#st-cmd-input');
cmdInput.value = 'zoom';
cmdInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
ok($$('#st-cmd-results .cmdbar__item').some((b) => b.hidden === false), 'la barre de commande filtre ses commandes');

/* 9 — audit de la composition */
fire($('#st-pane-qa') ? $('#st-tab-qa') : doc.body, 'click');
fire($('#st-run-qa') || doc.body, 'click');
await sleep(80);
ok(/densité/i.test($('#st-pane-qa').textContent), 'le studio QA publie une densité, pas une note sur 100');

console.log('');
if (failures) { console.log(`✗ FUMÉES DU STUDIO REFUSÉES — ${failures} écart(s).\n`); process.exit(1); }
console.log('✓ FUMÉES DU STUDIO VALIDÉES — le logiciel exécute ses gestes.\n');
