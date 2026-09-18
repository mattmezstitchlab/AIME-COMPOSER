/**
 * SMOKES + STUBS — accueil sobre (entrées expliquées, routage du composer).
 *
 * Historique : ce fichier portait aussi les smokes de la page Médiathèque
 * (`atlas/index.html`). Cette page a été absorbée par le Bureau de Point
 * Zero (Vague 1 de AUDIT/POINT-ZERO-CONVERGENCE-01.md) ; ses fonctions sont
 * désormais prouvées, une à une, par `qa/smoke-point-zero-bureau.mjs`.
 * Hors contrat : jsdom local, URLs et presse-papiers stubbés.
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

console.log('\nACCUEIL SOBRE — entrées expliquées');
{
  const { dom } = makeDom('/home/user/AIME-COMPOSER/index.html');
  const { document } = dom.window;
  await drain(dom);
  t('h2 « Les quatre entrées »', document.querySelector('#entrees')?.textContent.trim() === 'Les quatre entrées');
  const rows = document.querySelectorAll('[role="listitem"]');
  t('4 entrées', rows.length === 4);
  t('médiathèque expliquée : mode « dossier local » mentionné', rows[0]?.textContent.includes('dossier local'));
  t('design system + direction artistique distingués', rows[1]?.textContent.includes('Design System') && rows[1]?.textContent.includes('Direction artistique') && rows[1]?.textContent.includes('la doc') && rows[1]?.textContent.includes('l’atelier'));
  t('design system expliquée : export brief/CSS + partage', rows[1]?.textContent.includes('exporte le brief') && rows[1]?.textContent.includes('partage'));
  t('boucle NOEMA expliquée : vous validez', rows[2]?.textContent.includes('vous validez'));
  t('conversation NOEMA intacte', !!document.querySelector('#h-noema-text') && !!document.querySelector('#h-noema-read'));
  t('menu « + » : lien Direction artistique', [...document.querySelectorAll('#h-plus-menu a')].some((a) => a.getAttribute('href') === 'design-system/direction.html'));
  t('menu « + » : lien Médiathèque → le Bureau de Point Zero (plus de page atlas)', [...document.querySelectorAll('#h-plus-menu a')].some((a) => a.getAttribute('href') === 'point-zero/#pz-bureau' && a.textContent.includes('Médiathèque')));
  t('aucun lien vers l’ancienne page atlas/ ne subsiste', ![...document.querySelectorAll('a[href]')].some((a) => /^atlas\//.test(a.getAttribute('href'))));
  t('entrée Médiathèque : dit qu’elle vit dans la coquille', rows[0]?.textContent.includes('Bureau de Point Zero'));
  t('menu « + » : Dossier local sans picker fichier', !!document.querySelector('[data-h-action="folder"]') && !document.querySelector('[data-h-action="file"]') && !document.querySelector('#h-file-picker') && !document.querySelector('#h-folder-picker'));
  t('organes/démos retirés (sobre)', !document.querySelector('#h-card') && !document.querySelector('#h-timeline') && !document.querySelector('#organes'));
  t('diagnostic reste une entrée expliquée', rows[3]?.textContent.includes('jamais un score inventé'));

  /* Bloc central style Manus / Composer & routage — contrat aria-current */
  t('hero central : placeholder du composer style Manus présent',
    document.querySelector('#h-noema-text')?.getAttribute('placeholder')?.includes('Décris ce que tu veux faire'));
  t('hero central : bouton « + » présent avec popover',
    !!document.querySelector('#h-plus-btn') && document.querySelector('#h-plus-btn')?.getAttribute('data-a-pop') === '#h-plus-menu');
  t('hero central : 4 modes en pastilles (Diagnostic, Médiathèque, Direction artistique, Boucle NOEMA)',
    document.querySelectorAll('[data-h-mode]').length === 4);
  t('hero central : badge NOEMA en ligne/démo survit dans le hero',
    !!document.querySelector('#h-hero-badge'));
  t('pills : contrat aria-current (un seul, NOEMA défaut)', (() => {
    const pills = [...document.querySelectorAll('[data-h-mode]')];
    const noema = document.querySelector('[data-h-mode="noema"]');
    const hasAriaCurrent = pills.filter(p => p.hasAttribute('aria-current')).length === 1;
    const noemaActive = noema?.getAttribute('aria-current') === 'true' && noema.classList.contains('is-active');
    const noPressed = pills.every(p => !p.hasAttribute('aria-pressed'));
    return hasAriaCurrent && noemaActive && noPressed;
  })());
  t('bouton Aperçu présent (ex Lire sans écrire)', !!document.querySelector('#h-noema-read') && document.querySelector('#h-noema-read').textContent.includes('Aperçu'));
  t('bouton Lancer contextuel — défaut Proposer à NOEMA', document.querySelector('#h-noema-submit')?.textContent.includes('Proposer à NOEMA'));

  /* Routage réel via résolveur pur */
  const input = document.querySelector('#h-noema-text');
  const submit = document.querySelector('#h-noema-submit');
  const apercu = document.querySelector('#h-noema-read');
  const out = document.querySelector('#h-noema-out');
  const getLabel = () => document.querySelector('#h-noema-submit').textContent;

  // Aperçu universel : ne navigue pas
  input.value = 'https://github.com/mattmezstitchlab/AIME-COMPOSER';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  t('label contextuel : GitHub → Lancer le diagnostic', getLabel().includes('Lancer le diagnostic'));
  apercu.click();
  await drain(dom);
  t('aperçu GitHub : affiche commande sans naviguer', out.innerHTML.includes('diagnostic/diagnose.mjs') && out.innerHTML.includes('Aperçu'));
  // Vérifie que l'aperçu n'a pas navigué (location inchangée)
  t('aperçu ne navigue pas (location inchangée)', dom.window.location.href.includes('index.html'));

  submit.click();
  await drain(dom);
  t('routage : Lien GitHub route vers commande de diagnostic réelle',
    out.innerHTML.includes('diagnostic/diagnose.mjs') && out.innerHTML.includes('mattmezstitchlab'));

  input.value = 'https://mon-site-vitrine.fr';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  t('label contextuel : URL site → Lancer le diagnostic', getLabel().includes('Lancer le diagnostic'));
  apercu.click();
  await drain(dom);
  t('aperçu site : en préparation sans navigation', out.innerHTML.includes('en préparation') && out.innerHTML.includes('Aperçu'));
  submit.click();
  await drain(dom);
  t('routage : Lien URL de site affiche honnêtement « en préparation »',
    out.innerHTML.includes('en préparation') && out.innerHTML.includes('diagnostic de site en ligne'));

  // Modes pills → label contextuel (champ vidé pour éviter que le contenu outranque le mode)
  input.value = '';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  document.querySelector('[data-h-mode="da"]').click();
  await drain(dom);
  t('pill Direction artistique → label Ouvrir la Direction artistique', getLabel().includes('Ouvrir la Direction artistique'));
  apercu.click();
  await drain(dom);
  t('aperçu DA : destination direction.html sans navigation', out.innerHTML.includes('design-system/direction.html') && out.innerHTML.includes('Aperçu'));

  input.value = '';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  document.querySelector('[data-h-mode="media"]').click();
  await drain(dom);
  t('pill Médiathèque → label Ouvrir la Médiathèque', getLabel().includes('Ouvrir la Médiathèque'));
  apercu.click();
  await drain(dom);
  t('aperçu Médiathèque : destination point-zero/#pz-bureau sans navigation', out.innerHTML.includes('point-zero/#pz-bureau') && out.innerHTML.includes('Aperçu'));

  // Garde-fou diag : phrase naturelle en mode diag → NOEMA (contre-cas)
  document.querySelector('[data-h-mode="diag"]').click();
  await drain(dom);
  input.value = 'envoyer l\'annonce du concert pour le 24 septembre';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  t('label garde-fou : diag + phrase naturelle → Proposer à NOEMA', getLabel().includes('Proposer à NOEMA'));
  apercu.click();
  await drain(dom);
  t('aperçu garde-fou : diag + phrase naturelle → aperçu NOEMA, jamais commande fabriquée', out.innerHTML.includes('Proposer à NOEMA') && !out.innerHTML.includes('owner/envoyer'));
  // Et malformé sans espace → diag-invalid
  input.value = 'foobar';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  t('label garde-fou : diag + "foobar" → Lancer le diagnostic (mais invalide)', getLabel().includes('Lancer le diagnostic'));
  apercu.click();
  await drain(dom);
  t('aperçu garde-fou : diag + "foobar" → Format attendu', out.innerHTML.includes('Format attendu'));

  // Contre-cas : GitHub en mode Médiathèque → diagnostic (détection non masquée)
  document.querySelector('[data-h-mode="media"]').click();
  await drain(dom);
  input.value = 'mattmezstitchlab/AIME-COMPOSER';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await drain(dom);
  t('contre-cas : GitHub en mode Médiathèque → Lancer le diagnostic (non masqué)', getLabel().includes('Lancer le diagnostic'));
  apercu.click();
  await drain(dom);
  t('aperçu contre-cas : GitHub en mode Médiathèque → diagnostic', out.innerHTML.includes('Diagnostic GitHub'));

  // Exemple d'intention → setMode noema
  document.querySelector('[data-h-intent]').click();
  await drain(dom);
  t('exemple d’intention → passe en Boucle NOEMA', document.querySelector('[data-h-mode="noema"]').getAttribute('aria-current') === 'true');
  t('exemple remplit le champ', input.value.includes('Camille Vasseur'));

  // Plus > Dossier local → point-zero/?source=local (picker unique, dans le Bureau)
  const plusFolder = document.querySelector('[data-h-action="folder"]');
  t('menu + : Dossier local présent', !!plusFolder);
  // On ne peut pas tester la navigation réelle (jsdom NotImplemented), mais on vérifie que le handler existe sans picker
}

console.log(`\n${fail === 0 ? '✓' : '✗'} SMOKES ACCUEIL : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
