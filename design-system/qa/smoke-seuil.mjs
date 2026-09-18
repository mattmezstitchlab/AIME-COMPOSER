/**
 * SMOKES — le seuil (index.html), après la Vague 3 de
 * AUDIT/POINT-ZERO-CONVERGENCE-01.md.
 *
 * Historique : ce fichier (ex smoke-medias-v2.mjs) portait les smokes de la
 * page Médiathèque (absorbée par le Bureau, Vague 1 — prouvée par
 * smoke-point-zero-bureau.mjs) puis ceux de la porte universelle de
 * l'accueil (résolveur, aperçu, menu ＋ — absorbés par le ＋ de Point Zero,
 * Vague 3 — prouvés au même endroit). Il ne reste à l'accueil qu'un seuil :
 * dire où les choses vivent, y conduire, publier l'état de la boucle.
 * Hors contrat : jsdom local, réseau stubbé.
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };


function makeDom(htmlPath, { fetchImpl, search = '' } = {}) {
  /* jsdom n'exécute pas les <script src> sans chargeur de ressources :
     on inline le JS réel des pages À LA FIN DU BODY (position équivalente
     au `defer` d'origine : tout le DOM existe quand le script tourne). */
  let html = readFileSync(htmlPath, 'utf8');
  const bodies = [];
  const inline = (res) => {
    const file = res.startsWith('../')
      ? res.replace(/^\.\.\//, '/home/user/AIME-COMPOSER/')
      : htmlPath.replace(/\/[^/]*$/, '/') + res;
    const body = readFileSync(file, 'utf8');
    if (/<\/script/i.test(body)) throw new Error('script avec </script> interne');
    bodies.push(`<script>\n${body}\n</script>`);
  };
  html = html.replace(/<script src="([^"]+)" defer><\/script>/g, (m, res) => { inline(res); return ''; });
  html = html.replace('</body>', `${bodies.join('\n')}\n</body>`);
  const clipboard = { writes: [] };
  const clicks = [];
  const targetUrl = `http://localhost/index.html${search}`;
  const dom = new JSDOM(html, {
    url: targetUrl,
    runScripts: 'dangerously',
    beforeParse(window) {
      window.URL.createObjectURL = (blob) => `blob:local-${Math.random().toString(36).slice(2, 8)}`;
      window.URL.revokeObjectURL = () => {};
      Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async (txt) => { clipboard.writes.push(txt); } }, configurable: true });
      const origClick = window.HTMLElement.prototype.click;
      window.HTMLElement.prototype.click = function () { clicks.push(this); return origClick.call(this); };
      if (fetchImpl) {
        window.fetch = (url) => Promise.resolve(fetchImpl(url));
      } else {
        window.fetch = () => Promise.reject(new Error('réseau absent — stub'));
      }
      window.open = () => {};
    },
  });
  return { dom, clipboard, clicks };
}

const drain = async (dom) => { for (let i = 0; i < 30; i++) await new Promise((r) => dom.window.setTimeout(r, 5)); };
const fire = (el, type) => el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));

console.log('\nSEUIL — une porte, pas une vitrine');
{
  const { dom } = makeDom('/home/user/AIME-COMPOSER/index.html');
  const { document } = dom.window;
  await drain(dom);
  const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  t('un seul h1, qui dit la règle : « Une seule interface. »', document.querySelectorAll('h1').length === 1 && document.querySelector('h1').textContent.trim() === 'Une seule interface.');
  t('appel principal : Entrer dans Point Zero', document.querySelector('.ds-hero .a-btn--primary')?.getAttribute('href') === 'point-zero/');
  t('la marque en haut à gauche est le seul chemin « Accueil » : pas de bouton Accueil à droite', document.querySelector('.ds-top .ds-brand')?.getAttribute('href') === 'index.html' && ![...document.querySelectorAll('.ds-top__tools a, .ds-top__tools button')].some((a) => /accueil/i.test(a.textContent)));
  t('plus de barre de navigation secondaire dans l’en-tête (le seuil ne navigue pas à la place de la coquille)', !document.querySelector('.ds-top nav'));
  const rows = document.querySelectorAll('[role="listitem"]');
  t('h2 « Où sont les choses » et 4 entrées', document.querySelector('#entrees')?.textContent.trim() === 'Où sont les choses' && rows.length === 4);
  t('01 Médiathèque → point-zero/#pz-bureau', rows[0]?.querySelector('a')?.getAttribute('href') === 'point-zero/#pz-bureau' && rows[0].textContent.includes('Bureau'));
  t('02 Boucle NOEMA → point-zero/#pz-noema, « vous validez »', rows[1]?.querySelector('a')?.getAttribute('href') === 'point-zero/#pz-noema' && rows[1].textContent.includes('vous validez'));
  t('03 Diagnostic → point-zero/?resolve=1, « jamais un score inventé »', rows[2]?.querySelector('a')?.getAttribute('href') === 'point-zero/?resolve=1' && rows[2].textContent.includes('jamais un score inventé'));
  t('04 Design System (une page) & Direction artistique (#direction)', [...rows[3]?.querySelectorAll('a') || []].map((a) => a.getAttribute('href')).join(' ') === 'design-system/index.html design-system/index.html#direction' && rows[3].textContent.includes('une page'));
  t('aucun lien vers les pages supprimées : atlas/, loop/, chapitres du design system, direction.html', !hrefs.some((h) => /^(atlas|loop)\//.test(h) || /design-system\/(?!index\.html|experiences\/)[a-z-]+\.html/.test(h)));
  t('plus de composer ni de menu ＋ sur le seuil (ils vivent dans Point Zero)', !document.querySelector('#h-noema-text') && !document.querySelector('#h-plus-menu') && !document.querySelector('[data-h-mode]'));
  t('badge NOEMA : hors ligne sans boucle, honnêtement (réseau stubbé absent)', /hors ligne/.test(document.querySelector('#h-noema-status')?.textContent || '') && /hors ligne/.test(document.querySelector('#h-hero-badge')?.textContent || ''));
  t('thème : bouton présent, même clé de préférence que le châssis', !!document.querySelector('#h-theme') && document.documentElement.dataset.aimeTheme === 'dark');
  document.querySelector('#h-theme').click();
  t('thème : bascule et se persiste (aime-ds-theme)', document.documentElement.dataset.aimeTheme === 'light' && dom.window.localStorage.getItem('aime-ds-theme') === 'light');
  t('noscript : dit que tout vit dans Point Zero', /Point Zero/.test(document.querySelector('noscript')?.textContent || ''));
  t('pied : Point Zero · Design QA (#qa) · Diagnostic', [...document.querySelectorAll('.ds-foot a')].map((a) => a.getAttribute('href')).join(' ') === 'point-zero/ design-system/index.html#qa diagnostic/README.md');
}
{
  /* La boucle répond : le seuil le dit, en distinguant le serveur local d'une démo serverless. */
  const { dom } = makeDom('/home/user/AIME-COMPOSER/index.html', { fetchImpl: () => ({ ok: true, json: async () => ({ entities: [], runtime: { mode: 'serverless', persisted: false } }) }) });
  await drain(dom);
  const b = dom.window.document.querySelector('#h-hero-badge');
  t('badge NOEMA : « en ligne · démo » quand l’hôte est serverless, avec l’explication au survol', b?.textContent === 'NOEMA en ligne · démo' && /réinitialisé à froid/.test(b.title) && b.classList.contains('a-badge--success'));
}

console.log(`\n${fail === 0 ? '✓' : '✗'} SMOKES SEUIL : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
