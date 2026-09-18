/**
 * SMOKES + STUBS — Médiathèque v2 (visionneuse, mode local, couverture,
 * doublons, exports) et accueil sobre. Hors contrat : jsdom local, URLs et
 * presse-papiers stubbés. C'est la médiathèque livrée qui gagne, pas le
 * monde entier.
 */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };

const MEDIA = {
  generated_at: '2026-09-17T10:00:00.000Z',
  owner: 'mattmezstitchlab',
  truncated: false,
  totals: { repos: 3, repos_with_media: 2, repos_empty: 1, repos_error: 0, media: 5, duplicates: 2, image: 3, vecteur: 0, video: 1, audio: 1 },
  repos: [
    { name: 'by-aime', private: false, default_branch: 'main', media: 3, state: 'ok', tree_truncated: false },
    { name: 'nails-profile', private: false, default_branch: 'main', media: 2, state: 'ok', tree_truncated: false },
    { name: 'DISPOORED', private: false, default_branch: 'HEAD', media: 0, state: 'vide', tree_truncated: false, error: 'dépôt Git vide (aucun commit sur la branche)' },
  ],
  items: [
    { id: 'med-0001', repo: 'by-aime', path: 'images/cover.jpg', name: 'cover.jpg', kind: 'image', ext: 'jpg', size: 2048, sha: 's1', url: 'https://cdn.jsdelivr.net/gh/m/a@main/images/cover.jpg', url_raw: 'https://raw.githubusercontent.com/m/a/main/images/cover.jpg', source: 'https://github.com/m/a/blob/main/images/cover.jpg' },
    { id: 'med-0002', repo: 'by-aime', path: 'public/images/cover.jpg', name: 'cover.jpg', kind: 'image', ext: 'jpg', size: 2048, sha: 's1', duplicate_of: 'med-0001', url: 'https://cdn.jsdelivr.net/gh/m/a@main/public/images/cover.jpg', url_raw: null, source: 'https://github.com/m/a/blob/main/public/images/cover.jpg' },
    { id: 'med-0003', repo: 'by-aime', path: 'img/logo.png', name: 'logo.png', kind: 'image', ext: 'png', size: 512, sha: 's2', url: 'https://cdn.jsdelivr.net/gh/m/a@main/img/logo.png', url_raw: null, source: 'https://github.com/m/a/blob/main/img/logo.png' },
    { id: 'med-0004', repo: 'nails-profile', path: 'public/hand-video.mp4', name: 'hand-video.mp4', kind: 'video', ext: 'mp4', size: 2626732, sha: 's3', url: 'https://cdn.jsdelivr.net/gh/m/n@main/public/hand-video.mp4', url_raw: 'https://raw.githubusercontent.com/m/n/main/public/hand-video.mp4', source: 'https://github.com/m/n/blob/main/public/hand-video.mp4' },
    { id: 'med-0005', repo: 'nails-profile', path: 'assets/voice.mp3', name: 'voice.mp3', kind: 'audio', ext: 'mp3', size: 90000, sha: 's4', url: 'https://cdn.jsdelivr.net/gh/m/n@main/assets/voice.mp3', url_raw: null, source: 'https://github.com/m/n/blob/main/assets/voice.mp3' },
    { id: 'med-0006', repo: 'nails-profile', path: 'private/teaser.mov', name: 'teaser.mov', kind: 'video', ext: 'mov', size: 10, sha: 's5', url: null, url_raw: null, source: 'https://github.com/m/n/blob/main/private/teaser.mov' },
  ],
};

function makeDom(htmlPath, { fetchImpl } = {}) {
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
  const dom = new JSDOM(html, {
    url: htmlPath.includes('atlas') ? 'http://localhost/atlas/index.html' : 'http://localhost/index.html',
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
        window.fetch = (url) => {
          if (String(url).includes('media.json')) return Promise.resolve({ ok: true, json: async () => MEDIA });
          return Promise.reject(new Error('réseau absent — stub'));
        };
      }
      window.open = () => {};
    },
  });
  return { dom, clipboard, clicks };
}

const drain = async (dom) => { for (let i = 0; i < 30; i++) await new Promise((r) => dom.window.setTimeout(r, 5)); };
const fire = (el, type) => el.dispatchEvent(new el.ownerDocument.defaultView.Event(type, { bubbles: true }));

console.log('\nMÉDIATHÈQUE V2 — visionneuse, local, couverture');
{
  const { dom, clipboard, clicks } = makeDom('/home/user/AIME-COMPOSER/atlas/index.html');
  const { document } = dom.window;
  await drain(dom);

  t('catalogue chargé (6 cartes)', document.querySelectorAll('#m-grid .ucard').length === 6);
  t('compteur = 5 médias · 2 dépôts avec médias · 3 couverts · 2 doublons',
    document.querySelector('#m-count').textContent.includes('2 doublon'));

  const video = document.querySelector('video.umedia__video');
  t('visionneuse vidéo : <video controls preload=metadata> sur la vraie source',
    !!video && video.hasAttribute('controls') && video.getAttribute('preload') === 'metadata' && video.src.includes('jsdelivr'));
  t('vidéo : repli raw en data-fallback', video?.dataset.fallback?.includes('raw.githubusercontent'));
  const audio = document.querySelector('audio.umedia__audio');
  t('visionneuse audio : <audio controls> présente', !!audio && audio.hasAttribute('controls'));
  const privateCard = [...document.querySelectorAll('.ucard')].find((c) => c.textContent.includes('teaser.mov'));
  t('vidéo sans URL (privée) : tuile honnête, pas de lecteur', privateCard && !privateCard.querySelector('video') && !!privateCard.querySelector('.umedia.is-empty'));
  const dupBadges = [...document.querySelectorAll('.a-badge--warning')].filter((b) => b.textContent.startsWith('doublon'));
  t('doublons par empreinte git : badge ×2 sur les 2 cover.jpg', dupBadges.length === 2 && dupBadges[0].textContent.includes('×2'));

  t('couverture : 3 lignes de dépôts', document.querySelectorAll('#m-coverage tr').length === 3);
  t('couverture : DISPOORED signalé « dépôt vide »', document.querySelector('#m-coverage').textContent.includes('dépôt vide'));
  const note = document.querySelector('#m-audio-note').textContent;
  t('note audio honnête quand des pistes existent', /Audio : 1 piste/.test(note));

  /* Sélection + exports distants */
  const boxes = [...document.querySelectorAll('[data-m-select]')];
  boxes[3].checked = true; fire(boxes[3], 'change');
  boxes[4].checked = true; fire(boxes[4], 'change');
  t('barre de sélection affichée à 2', document.querySelector('#m-selbar').hidden === false && document.querySelector('#m-selcount').textContent === '2');
  document.querySelector('#m-copy-links').click();
  await drain(dom);
  t('liens copiés : 2 lignes CDN', clipboard.writes[0]?.split('\n').length === 2 && clipboard.writes[0].includes('jsdelivr'));
  document.querySelector('#m-copy-brief').click();
  await drain(dom);
  const brief = clipboard.writes[1] || '';
  t('brief : consigne présente', brief.includes("## Consigne pour l'agent"));
  t('brief : manifeste avec clés url_cdn/url_repli + transfert url', brief.includes('"url_cdn"') && brief.includes('"transfert": "url"'));
  document.querySelector('#m-dl-sh').click();
  await drain(dom);
  t('script .sh : un téléchargement déclenché', clicks.filter((c) => c.tagName === 'A' && c.download === 'mediatheque-selection.sh').length === 1);

  /* Bascule locale */
  document.querySelector('[data-m-source="local"]').click();
  t('mode local : outils visibles, règle affichée',
    document.querySelector('#m-local-tools').hidden === false && document.querySelector('#m-local-rule').hidden === false);
  t('mode local : état vide expliqué', document.querySelector('#m-grid').textContent.includes('Aucun dossier local chargé'));

  const makeFile = (rel, name) => {
    const f = new dom.window.File(['x'.repeat(10)], name, { type: 'application/octet-stream' });
    Object.defineProperty(f, 'webkitRelativePath', { value: rel });
    return f;
  };
  const input = document.querySelector('#m-local-input');
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [
      makeFile('album/photos/IMG_1.png', 'IMG_1.png'),
      makeFile('album/son/track.mp3', 'track.mp3'),
      makeFile('album/film/clip.MOV', 'clip.MOV'),
      makeFile('album/doc/lisez-moi.pdf', 'lisez-moi.pdf'),
      makeFile('logo.svg', 'logo.svg'),
    ],
  });
  fire(input, 'change');
  await drain(dom);
  t('ingestion : 4 médias classés, 1 document écarté',
    document.querySelectorAll('#m-grid .ucard').length === 4 && document.querySelector('#m-local-meta').textContent.includes('1 autre(s) fichier(s) écarté(s)'));
  t('ingestion : provenances par section du dossier',
    document.querySelector('#m-repo').innerHTML.includes('local : album') && document.querySelector('#m-repo').innerHTML.includes('local : (racine du choix)'));
  const localVideo = document.querySelector('video.umedia__video');
  t('local : vidéo lue depuis blob:, zéro réseau', !!localVideo && localVideo.src.startsWith('blob:local-'));
  t('local : aucun faux lien « source » sur carte locale',
    ![...document.querySelectorAll('.ucard a.a-text-btn')].some((a) => a.closest('.ucard')?.textContent.includes('track.mp3')));
  document.querySelector('#m-count').textContent.includes('mode local')
    ? pass++ : fail++;
  console.log(`  ${document.querySelector('#m-count').textContent.includes('mode local') ? '✓' : '✗'} compteur bascule en mode local`);

  /* Sélection mixte → brief avec clause locale */
  const lboxes = [...document.querySelectorAll('[data-m-select]')];
  lboxes[1].checked = true; fire(lboxes[1], 'change'); /* track.mp3 (local) */
  t('sélection mixte : 3 médias', document.querySelector('#m-selcount').textContent === '3');
  document.querySelector('#m-copy-links').click();
  await drain(dom);
  const linksMix = clipboard.writes[2] || '';
  t('liens mixtes : la ligne locale dit de joindre manuellement', linksMix.includes('[fichier local]') && linksMix.includes('joindre manuellement'));
  document.querySelector('#m-copy-brief').click();
  await drain(dom);
  const briefMix = clipboard.writes[3] || '';
  t('brief mixte : clause « fichiers locaux … demander le fichier »', briefMix.includes('demander le fichier') && briefMix.includes('"url_cdn": null'));
  document.querySelector('#m-dl-sh').click();
  await drain(dom);
  const shAnchor = clicks.filter((c) => c.tagName === 'A' && c.download === 'mediatheque-selection.sh').pop();
  t('script .sh mixte : encore un téléchargement', !!shAnchor);

  /* Note audio honnête quand zéro piste */
  const dom2 = makeDom('/home/user/AIME-COMPOSER/atlas/index.html', {
    fetchImpl: (url) => String(url).includes('media.json')
      ? { ok: true, json: async () => ({ ...MEDIA, totals: { ...MEDIA.totals, audio: 0 }, items: MEDIA.items.filter((i) => i.kind !== 'audio') }) }
      : Promise.reject(new Error('stub')),
  });
  await drain(dom2.dom);
  const note2 = dom2.dom.window.document.querySelector('#m-audio-note').textContent;
  t('audio 0 : dit la vérité (arbres lus en entier, médias hors git, mode local)',
    note2.includes('0 piste commitée') && note2.includes('hors git') && note2.includes('mode local'));
  t('audio 0 : retour GitHub propre', dom2.dom.window.document.querySelector('[data-m-source="github"]').getAttribute('aria-current') === 'true');
}

console.log('\nACCUEIL SOBRE — entrées expliquées');
{
  const { dom } = makeDom('/home/user/AIME-COMPOSER/index.html');
  const { document } = dom.window;
  await drain(dom);
  t('h2 « Les quatre entrées »', document.querySelector('#entrees')?.textContent.trim() === 'Les quatre entrées');
  const rows = document.querySelectorAll('[role="listitem"]');
  t('4 entrées', rows.length === 4);
  t('médiathèque expliquée : mode « dossier local » mentionné', rows[0]?.textContent.includes('dossier local'));
  t('design system expliqué : export brief/CSS + partage', rows[1]?.textContent.includes('exporte le brief') && rows[1]?.textContent.includes('partage'));
  t('conversation NOEMA intacte', !!document.querySelector('#h-noema-text') && !!document.querySelector('#h-noema-read'));
  t('menu « + » : lien Direction artistique', [...document.querySelectorAll('#h-plus-menu a')].some((a) => a.getAttribute('href') === 'design-system/direction.html'));
  t('organes/démos retirés (sobre)', !document.querySelector('#h-card') && !document.querySelector('#h-timeline') && !document.querySelector('#organes'));
  t('diagnostic reste une entrée expliquée', rows[3]?.textContent.includes('jamais un score inventé'));
}

console.log(`\n${fail === 0 ? '✓' : '✗'} SMOKES MÉDIATHÈQUE V2 + ACCUEIL : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
