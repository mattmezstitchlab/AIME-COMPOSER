/**
 * AIME — POINT ZERO · coquille universelle (P1).
 *
 * Responsabilités :
 *   1. Coquille : rétraction des panneaux, tiroirs du dock (un seul ouvert),
 *      popover d'import universel, persistance locale de la présentation.
 *   2. Z3 — Grille Universelle : 9 profils de format, repères, magnétisme,
 *      origine 0,0 (point zéro, réticule du mode origine-centre).
 *   3. Z2 — Bureau : la vraie médiathèque (atlas/media.json, 38 dépôts,
 *      366 médias référencés) + mode local lu dans le navigateur — rien
 *      n'est envoyé, provenance conservée. Parité complète avec atlas/
 *      (POINT-ZERO-INTERFACE-V1 §4, « sans exception ») : visionneuse
 *      réelle avec repli raw, lecture vidéo/audio dans le panneau,
 *      télécharger, vérifier (octets servis vs empreinte git / SHA-256),
 *      copier, brief agent + manifeste JSON, script .sh, sélection multiple.
 *   4. Z4 — Inspecteur : projection de la sélection unique (canvas, média,
 *      placement, carte) ; les champs de géométrie éditent la présentation
 *      locale, jamais une donnée canonique.
 *   5. Z4b — Rail NOEMA : propositions ouvertes + intention (intend/decide)
 *      contre la boucle réelle ; hors ligne, il le dit et n'invente rien.
 *   6. Z5 — Dock : Timeline (/api/timeline, 6 modes), Cartes (mémoire
 *      /api/state), ＋ Import universel.
 *
 * Ce module ne contient aucune règle métier : tout vient des moteurs
 * (loop API, atlas media.json, QA-REPORT.json, pz-import.mjs pour les
 * lectures locales). Un écran qui recalculerait créerait une seconde
 * source de vérité. Script module — une phrase incomplète devient un
 * état, jamais une erreur console.
 */
import { classifyName, zipIndex, pdfTriage, summarizeImport } from './pz-import.mjs';
import { auditLive } from '../design-system/js/qa.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── Icônes déclaratives (même contrat que home.js) ───────────── */
const A_ROOT = document.querySelector('meta[name="a-root"]')?.content || '../design-system/';
function resolveIcons(rootEl = document) {
  for (const u of rootEl.querySelectorAll('use[data-a-icon]')) {
    u.setAttribute('href', `${A_ROOT}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
    delete u.dataset.aIcon;
  }
}
resolveIcons();
const ic = (id, cls = 'a-ic a-ic--sm') =>
  `<svg class="${cls}" aria-hidden="true" width="16" height="16"><use data-a-icon="${esc(id)}"/></svg>`;

const toast = (opts) => window.AIME?.toast?.(opts);

/* ── Présentation persistée (jamais des faits du projet) ─────── */
const store = {
  get(k, d) {
    try { return localStorage.getItem('aime-pz-' + k) ?? d; } catch { return d; }
  },
  set(k, v) {
    try { localStorage.setItem('aime-pz-' + k, v); } catch { /* non persistée */ }
  },
};

/* ── Thème : même clé que le châssis du Design System ────────── */
(function theme() {
  const THEMES = ['dark', 'light'];
  let cur = 'dark';
  try { cur = localStorage.getItem('aime-ds-theme') || 'dark'; } catch { /* indisponible */ }
  const btn = $('#pz-theme');
  const apply = () => {
    document.documentElement.dataset.aimeTheme = cur;
    btn?.setAttribute('aria-label', `Thème : ${cur}. Basculer sur l'autre thème`);
  };
  apply();
  btn?.addEventListener('click', () => {
    cur = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    try { localStorage.setItem('aime-ds-theme', cur); } catch { /* non persistée */ }
    apply();
  });
})();

/* ── Profils de format (UNIVERSAL-GRID-V1 §4) — un profil n'est
   pas une application : même moteur, géométrie différente. ────── */
const FORMATS = {
  web:    { label: 'Web — desktop', meta: '16/10 · px · 12 col.', cols: 12, zero: 'off' },
  'web-m': { label: 'Web — mobile', meta: '390 × 844 · px · 12 col.', cols: 12, zero: 'off' },
  a4:     { label: 'Print — A4', meta: '210 × 297 mm · fond perdu · zone sûre', cols: 6, zero: 'off' },
  a5:     { label: 'Print — A5', meta: '148 × 210 mm · fond perdu · zone sûre', cols: 6, zero: 'off' },
  card:   { label: 'Print — carte de visite', meta: '85 × 55 mm', cols: 6, zero: 'off' },
  '16-9': { label: 'Vidéo — 16/9', meta: '1920 × 1080 · tiers · zone titre', cols: 12, zero: 'off' },
  '9-16': { label: 'Social — 9/16', meta: '1080 × 1920 · zone sûre', cols: 12, zero: 'off' },
  '1-1':  { label: 'Social — 1/1', meta: '1080 × 1080', cols: 12, zero: 'off' },
  stitch: { label: 'Broderie — patron', meta: 'cellules · origine centrée', cols: 0, zero: 'on' },
};

const page = $('#pz-page');
const ugrid = page?.closest('.ugrid');

function applyFormat(id, persist = true) {
  const f = FORMATS[id] || FORMATS.web;
  const sel = $('#pz-format');
  if (sel && sel.value !== id && FORMATS[id]) sel.value = id;
  if (page) {
    page.dataset.format = id;
    if (f.cols > 0) page.dataset.cols = String(f.cols);
    else delete page.dataset.cols;
    const cols = $('#pz-cols');
    if (cols) cols.innerHTML = '<i></i>'.repeat(Math.max(f.cols, 0));
    page.dataset.zero = f.zero === 'on' ? 'on' : (store.get('zero', 'off'));
  }
  if (ugrid) {
    if (id === 'stitch') ugrid.dataset.show = 'cells';
    else delete ugrid.dataset.show;
  }
  const meta = $('#pz-format-meta');
  if (meta) meta.textContent = f.meta;
  const zeroBtn = $('#pz-zero');
  zeroBtn?.setAttribute('aria-pressed', page?.dataset.zero === 'on' ? 'true' : 'false');
  if (persist) store.set('format', id);
  if (Selection.kind === null) renderInspector();
}

/* Remplit le sélecteur une seule fois (optgroups = familles). */
(function fillFormats() {
  const sel = $('#pz-format');
  if (!sel) return;
  const groups = [
    ['Web', ['web', 'web-m']],
    ['Print', ['a4', 'a5', 'card']],
    ['Vidéo & social', ['16-9', '9-16', '1-1']],
    ['Textile', ['stitch']],
  ];
  sel.innerHTML = groups
    .map(([g, ids]) => `<optgroup label="${esc(g)}">${ids.map((id) => `<option value="${esc(id)}">${esc(FORMATS[id].label)}</option>`).join('')}</optgroup>`)
    .join('');
  sel.value = store.get('format', 'web');
  sel.addEventListener('change', () => applyFormat(sel.value));
  resolveIcons(sel.parentElement || document);
})();

/* ── Coquille : panneaux rétractables ─────────────────────────── */
function bindPane(btnSel, paneSel, key, labelBase) {
  const btn = $(btnSel);
  const pane = $(paneSel);
  if (!btn || !pane) return;
  const apply = (open) => {
    pane.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', `${labelBase} : ${open ? 'rétracter' : 'déployer'} le panneau`);
    if (open) pane.classList.add('u-anim-fade');
    store.set(key, open ? 'on' : 'off');
  };
  apply(store.get(key, 'on') === 'on');
  btn.addEventListener('click', () => apply(pane.hidden));
}
bindPane('#pz-toggle-bureau', '#pz-bureau', 'pane-l', 'Bureau');
bindPane('#pz-toggle-inspector', '#pz-pane-end', 'pane-r', 'Inspecteur et NOEMA');

/* ── Coquille : dock & popover (un seul ouvert à la fois) ─────── */
const LAYERS = [
  { btn: '#pz-dock-timeline', box: '#pz-tray-timeline', onOpen: () => loadTimeline() },
  { btn: '#pz-dock-cartes', box: '#pz-tray-cartes', onOpen: () => renderCartes() },
  { btn: '#pz-import-btn', box: '#pz-uimport', onOpen: null },
];
function closeLayers(except = null) {
  for (const l of LAYERS) {
    const box = $(l.box);
    if (box && box !== except) {
      box.hidden = true;
      $(l.btn)?.setAttribute('aria-expanded', 'false');
    }
  }
}
for (const l of LAYERS) {
  const btn = $(l.btn);
  const box = $(l.box);
  if (!btn || !box) continue;
  btn.addEventListener('click', () => {
    const willOpen = box.hidden;
    closeLayers(willOpen ? box : null);
    box.hidden = !willOpen;
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) {
      box.classList.add('u-anim-expand');
      l.onOpen?.();
      box.querySelector('button,select,input')?.focus?.();
    }
  });
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dock__tray') && !e.target.closest('.uimport') && !e.target.closest('.dock__seg')) {
    closeLayers();
  }
  const closer = e.target.closest('[data-tray-close]');
  if (closer) closeLayers();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLayers();
});

/* ── Sélection unique : canvas, média, placement, carte ───────── */
const Selection = { kind: null, ref: null };
const places = [];

function select(kind, ref, el) {
  Selection.kind = kind;
  Selection.ref = ref;
  $$('.pz-place.is-selected').forEach((p) => p.classList.remove('is-selected'));
  if (el) el.classList.add('is-selected');
  const meta = $('#pz-canvas-meta');
  if (meta) {
    meta.textContent = kind === null
      ? 'une sélection, quatre projections'
      : `sélection : ${kind === 'place' ? 'placement' : kind === 'media' ? 'média du bureau' : kind === 'eaa' ? 'contrôle d\u2019accessibilité' : 'carte mémoire'}`;
  }
  $('#pz-eaa')?.setAttribute('aria-pressed', kind === 'eaa' ? 'true' : 'false');
  renderInspector();
}

function stateBadge(state) {
  const MAP = {
    observed: ['noe-observed', 'Observé'], extracted: ['noe-extracted', 'Extrait'],
    inferred: ['noe-inferred', 'Déduit'], proposed: ['noe-proposed', 'Proposé'],
    confirmed: ['noe-confirmed', 'Confirmé'], superseded: ['noe-superseded', 'Remplacé'],
  };
  const [iconId, label] = MAP[state] || ['noe-observed', state || 'Inconnu'];
  return `<span class="nstate" data-state="${esc(state || 'observed')}">${ic(iconId, 'a-ic a-ic--state')}${esc(label)}</span>`;
}

const row = (k, v, unknown = false) =>
  `<dl class="inspector__row"><dt>${esc(k)}</dt><dd${unknown ? ' class="is-unknown"' : ''}>${v}</dd></dl>`;

function renderInspector() {
  const box = $('#pz-inspector-body');
  if (!box) return;
  const f = FORMATS[page?.dataset.format || 'web'];
  let html = '';

  if (Selection.kind === 'media' && Selection.ref) {
    const it = Selection.ref;
    html = `
      <div class="inspector__group">
        <p class="t-label">Média du bureau</p>
        ${row('nom', esc(it.name))}
        ${row('type', `${esc(it.kind)} · ${esc(it.ext || '')}`)}
        ${row('taille', it.size ? `${Math.round(it.size / 1024)} Ko` : 'inconnue', !it.size)}
        ${row('origine', it.local ? `local · ${esc(it.rel || '')}` : esc(it.repo || ''), false)}
        ${row('empreinte', it.sha256 ? `<span class="u-mono">SHA-256 ${esc(it.sha256.slice(0, 12))}…</span>` : it.sha ? `<span class="u-mono">${esc(it.sha.slice(0, 8))}</span>` : it.whyUnhashed ? esc(it.whyUnhashed) : 'non calculée', !it.sha256 && !it.sha)}
        ${it.zip ? row('archive', `${it.zip.count} entrées indexées localement — les originaux restent intacts`) : ''}
        ${it.zipError ? row('archive', esc(it.zipError), true) : ''}
        ${it.pdf ? row('pdf', `${esc(it.pdf.version)} · ${it.pdf.pages} page(s)${it.pdf.title ? ` · « ${esc(it.pdf.title)} »` : ''} — le texte intégral reste une étape dédiée`) : ''}
        ${it.pdfError ? row('pdf', esc(it.pdfError), true) : ''}
        ${row('vérification', it.verify
          ? `${verifyBadge(it)} <span class="t-caption u-muted">${esc(it.verify.detail)}${it.verify.via ? ` · via ${esc(it.verify.via)}` : ''}</span>`
          : 'non vérifié — les octets servis n\u2019ont pas encore été comparés à l\u2019empreinte', !it.verify)}
      </div>
      <div class="inspector__group">
        <p class="t-label">Provenance</p>
        ${it.local
          ? row('source', 'dossier local — rien n\u2019a été envoyé')
          : row('source', `<a class="a-text-btn" href="${esc(it.source || it.url)}" target="_blank" rel="noopener noreferrer">fichier source sur GitHub</a>`)}
        ${!it.local && it.url_raw ? row('repli', `<span class="u-mono t-caption">${esc(it.url_raw)}</span>`) : ''}
      </div>
      <div class="inspector__group">
        <div class="l-row">
          ${it.url ? `<a class="a-btn a-btn--sm" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">Voir</a>` : ''}
          ${it.local || fetchable(it) ? `<button type="button" class="a-btn a-btn--sm" data-pz-dl="${esc(it.id)}">Télécharger</button>` : ''}
          <button type="button" class="a-btn a-btn--sm" data-pz-verify="${esc(it.id)}">Vérifier</button>
          ${(it.kind === 'image' || it.kind === 'vecteur') ? `<button type="button" class="a-btn a-btn--sm a-btn--primary" data-ins-place>Placer sur la grille</button>` : ''}
        </div>
        <label class="a-check"><input type="checkbox" data-pz-select="${esc(it.id)}"${Bureau.selected.has(it.id) ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span><span class="t-caption">dans la sélection à transmettre</span></label>
      </div>`;
  } else if (Selection.kind === 'place' && Selection.ref) {
    const p = Selection.ref;
    html = `
      <div class="inspector__group">
        <p class="t-label">Géométrie — projection locale</p>
        <dl class="inspector__row"><dt><label for="pz-px">x</label></dt><dd><input class="a-input" id="pz-px" type="number" min="0" step="4" value="${p.x}"></dd></dl>
        <dl class="inspector__row"><dt><label for="pz-py">y</label></dt><dd><input class="a-input" id="pz-py" type="number" min="0" step="4" value="${p.y}"></dd></dl>
        <dl class="inspector__row"><dt><label for="pz-pw">largeur</label></dt><dd><input class="a-input" id="pz-pw" type="number" min="24" step="4" value="${p.w}"></dd></dl>
        ${row('unité', 'px — coordonnées de la page')}
        ${row('temporalité', 'non positionné sur la timeline', true)}
      </div>
      <div class="inspector__group">
        <p class="t-label">Asset référencé</p>
        ${row('nom', esc(p.media.name))}
        ${row('origine', p.media.local ? `local · ${esc(p.media.rel || '')}` : esc(p.media.repo || ''))}
        ${row('règle', 'l\u2019asset existe une fois — le placement pointe vers lui')}
      </div>
      <div class="inspector__group">
        <button type="button" class="a-btn a-btn--sm a-btn--danger" data-ins-remove>Retirer de la grille</button>
      </div>`;
  } else if (Selection.kind === 'card' && Selection.ref) {
    const e = Selection.ref;
    html = `
      <div class="inspector__group">
        <p class="t-label">Carte mémoire</p>
        ${row('id', `<span class="u-mono">${esc(e.id)}</span>`)}
        ${row('type', esc(e.type))}
        ${row('statut', esc(e.status || ''), !e.status)}
        ${row('confiance', esc(e.confidence || ''), !e.confidence)}
        ${row('créé par', esc(e.created_by || ''), !e.created_by)}
      </div>
      <div class="inspector__group">
        <p class="t-label">Provenance</p>
        ${e.provenance
          ? row('origine', esc(e.provenance.origin || '')) + row('état', stateBadge(e.provenance.state))
          : row('origine', 'inconnue', true)}
      </div>`;
  } else if (Selection.kind === 'eaa') {
    const r = Eaa.run;
    const fmtFind = (arr, key) => arr.slice(0, 3).map((g) => esc(`${g.selector}${g[key] != null ? ` (${g[key]})` : ''}`)).join(' · ');
    html = r ? `
      <div class="inspector__group">
        <p class="t-label">Pack de contrôle EAA — signaux automatiques</p>
        ${row('exécuté', esc(r.at))}
        ${row('moteur', esc(r.engine))}
      </div>
      <div class="inspector__group">
        <p class="t-label">Géométrie & cibles — auditLive du Design System</p>
        ${row('débordements horizontaux', r.geometry.length ? `${r.geometry.length} — ${fmtFind(r.geometry, 'overflow')}${r.geometry.length > 3 ? '…' : ''}` : 'aucun détecté')}
        ${row('cibles < 24 px', r.targets.length ? `${r.targets.length} — ${fmtFind(r.targets, 'size')}${r.targets.length > 3 ? '…' : ''}` : 'aucune détectée')}
      </div>
      <div class="inspector__group">
        <p class="t-label">Noms accessibles</p>
        ${row('contrôles sans nom', r.unnamed.length ? r.unnamed.map(esc).join(' · ') : 'aucun détecté dans l\u2019arbre visible')}
      </div>
      <div class="inspector__group">
        <p class="t-label">Contraste & mouvement — rapport QA du dernier run</p>
        ${r.contrast
          ? row('contrastes mesurés', `${r.contrast.pass}/${r.contrast.total} conformes — pire : ${esc(r.contrast.worst?.why || '?')} (${r.contrast.worst?.ratio ?? '?'}:1)`)
          : row('contrastes', 'rapport QA non chargé', true)}
        ${row('mouvement réduit', 'pris en charge par le Design System (data-aime-motion)')}
      </div>
      <div class="inspector__group">
        <p class="t-body-sm u-muted">Ces signaux automatiques ne remplacent ni un audit humain ni une certification : ils portent ce que les moteurs mesurent, rien de plus.</p>
        <button type="button" class="a-btn a-btn--sm" data-eaa-rerun>Relancer les signaux</button>
      </div>` : `
      <div class="inspector__group">
        <p class="t-label">Pack de contrôle EAA</p>
        <p class="t-body-sm u-muted">Aucun contrôle exécuté pour l'instant.</p>
        <button type="button" class="a-btn a-btn--sm" data-eaa-rerun>Lancer les signaux</button>
      </div>`;
  } else {
    html = `
      <div class="inspector__group">
        <p class="t-label">Format</p>
        ${row('profil', esc((page?.dataset.format || 'web').toUpperCase()))}
        ${row('géométrie', esc(f.meta))}
        ${row('origine', page?.dataset.zero === 'on' ? '0,0 — centrée (point zéro)' : 'supérieure gauche')}
        ${row('colonnes', f.cols > 0 ? String(f.cols) : 'cellules')}
      </div>
      <div class="inspector__group">
        <p class="t-label">Grille</p>
        ${row('magnétisme', $('#pz-snap')?.getAttribute('aria-pressed') === 'true' ? 'actif' : 'inactif')}
        ${row('repères', $('#pz-guides')?.getAttribute('aria-pressed') === 'true' ? 'visibles' : 'masqués')}
        ${row('règle', 'la grille n\u2019écrit jamais la géométrie canonique')}
      </div>
      <div class="inspector__group">
        <p class="t-label">Composition</p>
        ${row('placements', String(places.length))}
        ${row('médias au bureau', String(visibleMediaCount()))}
        ${row('sélection', 'cliquez un média, un placement ou une carte', true)}
      </div>`;
  }
  box.innerHTML = html;
  resolveIcons(box);
  bindInspectorFields();
}

function bindInspectorFields() {
  const p = Selection.kind === 'place' ? Selection.ref : null;
  if (!p) return;
  const bind = (sel, key, prop) => {
    const input = $(sel);
    if (!input) return;
    input.addEventListener('change', () => {
      const v = Math.max(Number(input.min || 0), Number(input.value) || 0);
      p[key] = v;
      p.el?.style.setProperty(prop, String(v));
      input.value = String(v);
    });
  };
  bind('#pz-px', 'x', '--pz-x');
  bind('#pz-py', 'y', '--pz-y');
  bind('#pz-pw', 'w', '--pz-w');
}

/* ── Z2 · BUREAU — la médiathèque réelle, projetée en panneau ── */
const Bureau = {
  data: null, source: 'github', mode: 'tout', q: '', repoFilter: '', local: [], dossier: 'tous',
  /* Sélection multiple : sert à TRANSMETTRE (liens, brief agent, script .sh)
     — jamais à copier un média dans le dépôt. Distincte de la sélection
     unique de l'inspecteur (Selection). */
  selected: new Set(),
};

const KIND_ICON = {
  image: 'med-image', video: 'med-video', audio: 'med-audio',
  vecteur: 'med-qr', document: 'doc-document', archive: 'mem-vault', autre: 'mem-archive',
};
const KIND_LABEL_FR = { image: 'Image', video: 'Vidéo', audio: 'Audio', vecteur: 'Vecteur', document: 'Document', archive: 'Archive', autre: 'Autre' };
/* Formats que le lecteur HTML5 sait lire dans la page (contrat Bureau §13 :
   la tuile devient lecteur, le média reste à sa source). */
const VIDEO_TAG = ['mp4', 'webm', 'mov', 'm4v', 'mkv'];
const AUDIO_TAG = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'opus'];

const humanSize = (n) => {
  if (!n) return '—';
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
};
const bestUrl = (it) => it.url || it.url_raw || it.source || '';
const fetchable = (it) => Boolean(it.url || it.url_raw);

/* ── Utilitaires de transmission : presse-papiers, fichier ──────── */
async function copyText(text, title) {
  const clip = window.navigator?.clipboard;
  if (clip?.writeText) {
    try {
      await clip.writeText(text);
      toast?.({ title, tone: 'success' });
      return true;
    } catch { /* refusé : repli ci-dessous */ }
  }
  toast?.({ title: 'Copie refusée par le navigateur', text: text.slice(0, 160), tone: 'warning' });
  return false;
}

function saveBlob(name, text, type = 'text/plain') {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    toast?.({ title: 'Téléchargement indisponible ici', text: name, tone: 'warning' });
    return false;
  }
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* déjà libérée */ } }, 4000);
  return true;
}

/* Télécharger = récupérer le fichier réel. Local : l'objet du navigateur,
   zéro réseau. Distant : CDN puis repli raw ; si le fichier refuse d'être
   aspiré (CORS), on ouvre la source — on ne simule pas un téléchargement. */
async function downloadFile(it) {
  if (!it) return;
  const click = (href) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = it.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  if (it.local) {
    if (!it.url) { toast?.({ title: 'Fichier local sans aperçu — rien à télécharger', tone: 'warning' }); return; }
    click(it.url);
    toast?.({ title: `« ${it.name} » téléchargé depuis votre dossier`, tone: 'success' });
    return;
  }
  if (!fetchable(it)) {
    if (it.source) window.open(it.source, '_blank', 'noreferrer');
    toast?.({ title: 'Dépôt privé : ouverture de la source', text: 'Aucune URL publique — le fichier ne peut pas être aspiré d\u2019ici.', tone: 'warning' });
    return;
  }
  for (const url of [it.url, it.url_raw].filter(Boolean)) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      click(u);
      setTimeout(() => { try { URL.revokeObjectURL(u); } catch { /* déjà libérée */ } }, 4000);
      toast?.({ title: `« ${it.name} » téléchargé`, text: url === it.url ? 'via le CDN' : 'via le repli raw', tone: 'success' });
      return;
    } catch { /* couche suivante */ }
  }
  if (it.source) window.open(it.source, '_blank', 'noreferrer');
  toast?.({ title: 'Ouverture de la source — le fichier refuse le téléchargement direct', tone: 'warning' });
}

/* Vérifier = comparer les octets réellement servis à l'empreinte
   cataloguée. Distant : SHA-1 « blob » git (sha1("blob <n>\0" + octets)),
   la même empreinte que l'arbre git — CDN d'abord, repli raw ensuite.
   Local : SHA-256 recalculé sur l'objet du navigateur. Quand rien ne peut
   être lu, la vérification le dit : elle n'affiche jamais « conforme »
   sans avoir lu les octets. */
async function digestHex(algo, buf) {
  if (!window.crypto?.subtle) return null;
  const h = await window.crypto.subtle.digest(algo, buf);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function gitBlobSha1(buf) {
  const head = new TextEncoder().encode(`blob ${buf.byteLength}\0`);
  const all = new Uint8Array(head.length + buf.byteLength);
  all.set(head, 0);
  all.set(new Uint8Array(buf), head.length);
  return digestHex('SHA-1', all);
}
async function verifyFile(it) {
  if (!it) return null;
  const at = new Date().toISOString();
  let result;
  if (!window.crypto?.subtle) {
    result = { ok: null, at, detail: 'empreinte non calculable ici (WebCrypto indisponible)' };
  } else if (it.local) {
    if (!it.url) result = { ok: null, at, detail: 'objet local non relisible — empreinte non recalculée' };
    else {
      try {
        const buf = await (await fetch(it.url)).arrayBuffer();
        const sha = await digestHex('SHA-256', buf);
        result = it.sha256
          ? { ok: sha === it.sha256, at, via: 'local', size: buf.byteLength, sha, detail: sha === it.sha256 ? 'SHA-256 identique à l\u2019empreinte de l\u2019import' : 'SHA-256 différent de l\u2019empreinte de l\u2019import' }
          : { ok: null, at, via: 'local', size: buf.byteLength, sha, detail: 'aucune empreinte de référence (fichier volumineux) — SHA-256 relevé, non comparé' };
      } catch { result = { ok: null, at, detail: 'objet local illisible — non vérifié' }; }
    }
  } else if (!fetchable(it)) {
    result = { ok: null, at, detail: 'dépôt privé, aucune URL publique — non vérifiable d\u2019ici' };
  } else {
    const tried = [];
    result = null;
    for (const url of [it.url, it.url_raw].filter(Boolean)) {
      const via = url === it.url ? 'cdn' : 'raw';
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = await r.arrayBuffer();
        const sha = await gitBlobSha1(buf);
        const sizeOk = it.size ? buf.byteLength === it.size : null;
        if (it.sha && sha === it.sha) {
          result = { ok: true, at, via, size: buf.byteLength, sha, sizeOk, detail: `octets servis (${via}) = blob commité` };
          break;
        }
        tried.push(`${via} : ${it.sha ? 'empreinte différente' : 'pas d\u2019empreinte de référence'}${sizeOk === false ? `, ${buf.byteLength} o ≠ ${it.size} o` : ''}`);
        if (!it.sha) { result = { ok: null, at, via, size: buf.byteLength, sha, sizeOk, detail: 'aucune empreinte git au catalogue — octets lus, non comparés' }; break; }
      } catch (e) {
        tried.push(`${via} : illisible (${e?.message || 'réseau/CORS'})`);
      }
    }
    if (!result) {
      const anyRead = tried.some((t) => t.includes('différente'));
      result = { ok: anyRead ? false : null, at, detail: tried.join(' · ') || 'aucune source lue' };
    }
  }
  it.verify = result;
  toast?.({
    title: result.ok === true ? `« ${it.name} » vérifié` : result.ok === false ? `« ${it.name} » : écart détecté` : `« ${it.name} » : non vérifiable`,
    text: result.detail,
    tone: result.ok === true ? 'success' : result.ok === false ? 'error' : 'warning',
  });
  renderBureau();
  if (Selection.kind === 'media' && Selection.ref === it) renderInspector();
  return result;
}
const verifyBadge = (it) => {
  const v = it.verify;
  if (!v) return '';
  if (v.ok === true) return `<span class="a-badge a-badge--success" title="${esc(v.detail)}">${ic('prf-verified', 'a-ic a-ic--state')}vérifié</span>`;
  if (v.ok === false) return `<span class="a-badge a-badge--error" title="${esc(v.detail)}">écart</span>`;
  return `<span class="a-badge" title="${esc(v.detail)}">non vérifiable</span>`;
};

function visibleMediaCount() {
  return Bureau.source === 'github' ? (Bureau.data?.items?.length || 0) : Bureau.local.length;
}

const allItems = () => (Bureau.source === 'github' ? (Bureau.data?.items || []) : Bureau.local);

/* Dossiers contextuels : des vues dynamiques, jamais des copies
   (MASTER-ARCHITECTURE §11 — Magic Folder). */
function duplicateShas(items) {
  const seen = new Set();
  const dup = new Set();
  for (const i of items) {
    const k = i.sha256 || i.sha;
    if (!k) continue;
    if (seen.has(k)) dup.add(k);
    else seen.add(k);
  }
  return dup;
}

function filteredItems() {
  let items = allItems();
  if (Bureau.repoFilter) items = items.filter((i) => i.repo === Bureau.repoFilter);
  if (Bureau.dossier === 'doublons') {
    const dup = duplicateShas(items);
    items = items.filter((i) => dup.has(i.sha256 || i.sha));
  } else if (Bureau.dossier === 'places') {
    const ids = new Set(places.map((p) => p.media.id));
    items = items.filter((i) => ids.has(i.id));
  }
  if (Bureau.mode !== 'tout') items = items.filter((i) => i.kind === Bureau.mode);
  if (Bureau.q) items = items.filter((i) => i.name.toLowerCase().includes(Bureau.q));
  return items;
}

/* Tuile = visionneuse (même contrat que la médiathèque) : image réelle
   avec repli raw, lecteur vidéo ou audio sur la vraie source, ou tuile
   honnête quand rien n'est accessible — jamais un élément brisé présenté
   comme un visuel. */
function mediaThumb(it) {
  const fb = it.url_raw ? ` data-fallback="${esc(it.url_raw)}"` : '';
  const ext = (it.ext || '').toLowerCase();
  if ((it.kind === 'image' || it.kind === 'vecteur') && it.url) {
    return `<div class="umedia${it.kind === 'vecteur' ? ' umedia--contain' : ''}" data-format="1-1" data-kind="${esc(it.kind)}" data-ext="${esc(ext)}">
      <img loading="lazy" src="${esc(it.url)}" alt=""${fb}>
    </div>`;
  }
  if (it.kind === 'video' && it.url && VIDEO_TAG.includes(ext)) {
    return `<div class="umedia umedia--player" data-format="1-1" data-kind="video" data-ext="${esc(ext)}">
      <video class="umedia__video" controls preload="metadata" playsinline src="${esc(it.url)}"${fb} aria-label="Lire la vidéo ${esc(it.name)}"></video>
      <span class="umedia__label">${esc(ext)} · ${esc(humanSize(it.size))}</span>
    </div>`;
  }
  if (it.kind === 'audio' && it.url && AUDIO_TAG.includes(ext)) {
    return `<div class="umedia umedia--player is-empty" data-format="1-1" data-kind="audio" data-ext="${esc(ext)}">
      ${ic('med-audio', 'a-ic a-ic--lg')}
      <span class="umedia__label">${esc(ext)} · ${esc(humanSize(it.size))}</span>
      <audio class="umedia__audio" controls preload="metadata" src="${esc(it.url)}"${fb} aria-label="Écouter ${esc(it.name)}"></audio>
    </div>`;
  }
  return `<div class="umedia is-empty" data-format="1-1" data-kind="${esc(it.kind)}" data-ext="${esc(ext)}">${ic(KIND_ICON[it.kind] || 'mem-card', 'a-ic a-ic--lg')}<span class="umedia__label">${esc(ext || it.kind)}</span></div>`;
}

function dupBadge(it) {
  const k = it.sha256 || it.sha;
  if (!k) return '';
  const group = allItems().filter((x) => (x.sha256 || x.sha) === k);
  if (group.length < 2) return '';
  const where = group.filter((x) => x.id !== it.id).slice(0, 3).map((x) => x.local ? x.rel : `${x.repo}/${x.path}`).join(' · ');
  return `<span class="a-badge a-badge--warning" title="Même contenu, ailleurs : ${esc(where)}">doublon ×${group.length}</span>`;
}

function mediaCard(it) {
  const visual = it.kind === 'image' || it.kind === 'vecteur';
  const where = it.local ? `local · ${esc(it.rel || '')}` : esc(it.repo || '');
  const on = Bureau.selected.has(it.id);
  return `
  <article class="ucard ucard--tile${on ? ' is-selected' : ''}" data-id="${esc(it.id)}">
    ${mediaThumb(it)}
    <div class="ucard__head">
      <span class="ucard__title" title="${esc(it.path || it.rel || '')}">${esc(it.name)}</span>
      <span class="ucard__sub">${where}${it.size ? ` · ${esc(humanSize(it.size))}` : ''}</span>
    </div>
    <div class="l-row">
      <label class="a-check"><input type="checkbox" data-pz-select="${esc(it.id)}"${on ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span><span class="t-caption">choisir</span></label>
      <span class="a-badge">${esc(it.ext || it.kind)}</span>
      ${dupBadge(it)}
      ${verifyBadge(it)}
    </div>
    <div class="ucard__foot">
      <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-media-select="${esc(it.id)}">Inspecter</button>
      ${it.url ? `<button type="button" class="a-btn a-btn--sm a-btn--ghost" data-copy="${esc(it.url)}">Copier</button>` : ''}
      ${it.local || fetchable(it) ? `<button type="button" class="a-btn a-btn--sm a-btn--ghost" data-pz-dl="${esc(it.id)}" aria-label="Télécharger ${esc(it.name)}">${ic('act-export')}Télécharger</button>` : ''}
      <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-pz-verify="${esc(it.id)}" aria-label="Vérifier ${esc(it.name)}">${ic('prf-fingerprint')}Vérifier</button>
      ${visual && it.url ? `<button type="button" class="a-btn a-btn--sm" data-place="${esc(it.id)}">Placer</button>` : ''}
      ${it.local
        ? ''
        : `<a class="a-text-btn" href="${esc(it.source || bestUrl(it))}" target="_blank" rel="noopener noreferrer"><span class="t-caption">source</span>${ic('nav-external')}</a>`}
    </div>
  </article>`;
}

/* ── Sélection multiple → transmission (liens · brief · .sh) ───── */
const chosen = () => {
  const all = [...(Bureau.data?.items || []), ...Bureau.local];
  return all.filter((it) => Bureau.selected.has(it.id));
};

function renderSelbar() {
  const bar = $('#pz-selbar');
  if (!bar) return;
  const n = Bureau.selected.size;
  bar.hidden = n === 0;
  const c = $('#pz-selcount');
  if (c) c.textContent = String(n);
  $$('#pz-bureau-grid .ucard[data-id]').forEach((el) => {
    el.classList.toggle('is-selected', Bureau.selected.has(el.dataset.id));
    const box = el.querySelector('[data-pz-select]');
    if (box) box.checked = Bureau.selected.has(el.dataset.id);
  });
}

function linksText() {
  return chosen().map((it) => (it.local
    ? `[fichier local] ${it.rel || it.name} — à joindre manuellement (jamais envoyé depuis Point Zero)`
    : bestUrl(it))).join('\n');
}

function briefText() {
  const list = chosen();
  const when = new Date().toISOString().slice(0, 10);
  const manifest = list.map((it) => ({
    nom: it.name,
    type: it.kind,
    extension: it.ext,
    taille_octets: it.size,
    depot: it.local ? `local : ${(it.rel || '').split('/')[0] || '(racine du choix)'}` : it.repo,
    chemin: it.local ? it.rel : it.path,
    empreinte: it.local ? (it.sha256 ? `sha256:${it.sha256}` : null) : (it.sha ? `git-blob:${it.sha}` : null),
    verification: it.verify ? { resultat: it.verify.ok === true ? 'conforme' : it.verify.ok === false ? 'écart' : 'non vérifiable', detail: it.verify.detail, quand: it.verify.at } : null,
    url_cdn: it.local ? null : (it.url || null),
    url_repli: it.local ? null : (it.url_raw || null),
    source: it.local ? `fichier local : ${it.rel}` : it.source,
    transfert: it.local ? 'manuel — le fichier doit être joint (rien n\u2019est envoyé depuis Point Zero)' : 'url',
  }));
  const hasLocal = list.some((it) => it.local);
  return [
    '# Brief médias — sélection Bureau · Point Zero (AIME-COMPOSER)',
    '',
    `Généré le ${when} · ${list.length} média(s) · provenance : arbres git vérifiés + dossier local de l'utilisateur`,
    '',
    '## Consigne pour l\'agent',
    '1. Intégrer ces médias dans le projet cible en conservant noms de fichiers et provenance.',
    '2. Pour chaque entrée distante : utiliser url_cdn, puis url_repli en cas d\'échec ; signaler tout fichier inaccessible au lieu de le remplacer silencieusement.',
    '3. Ne copier aucun média dans un dépôt sans validation humaine — la décision reste tracée.',
    hasLocal
      ? '4. Les entrées marquées "manuel" sont des fichiers locaux de l\'utilisateur : demander le fichier, ne jamais prétendre y accéder. Les originaux restent sur le poste de l\'utilisateur.'
      : '4. Les vidéos et pistes audio sont lisibles depuis leurs URL — vérifier durée et poids avant intégration lourde.',
    '5. Le champ "verification" reflète un contrôle d\'octets fait dans Point Zero ; null = non vérifié, pas « conforme par défaut ».',
    '',
    '```json',
    JSON.stringify(manifest, null, 2),
    '```',
  ].join('\n');
}

function shText() {
  const list = chosen();
  const lines = [
    '#!/usr/bin/env bash',
    `# Récupération de ${list.length} média(s) — sélection Bureau · Point Zero (AIME-COMPOSER)`,
    '# Chaque fichier d\u2019abord via le CDN, puis via le repli raw ; tout échec est signalé, rien n\u2019est caché.',
    '# Les entrées « LOCAL » ne peuvent pas être aspirées : elles sont sur le poste de l\u2019utilisateur, à joindre à la main.',
    'set -u',
    'mkdir -p media-selection && cd media-selection',
    '',
  ];
  for (const it of list) {
    if (it.local) {
      lines.push(`echo "LOCAL ${it.name} — sur le poste : ${it.rel || it.name} (à joindre manuellement)"`);
      continue;
    }
    const urls = [it.url, it.url_raw].filter(Boolean);
    if (!urls.length) {
      lines.push(`echo "SANS-URL ${it.name} — dépôt privé : ${it.source}"`);
      continue;
    }
    lines.push(`curl -sfL -o "${it.name}" "${urls[0]}" ` + '\\');
    const last = urls[urls.length - 1];
    lines.push(urls.length > 1
      ? `  || curl -sfL -o "${it.name}" "${last}" || echo "ÉCHEC ${it.name}"`
      : `  || echo "ÉCHEC ${it.name}"`);
    if (it.sha) lines.push(`[ -f "${it.name}" ] && [ "$(git hash-object "${it.name}" 2>/dev/null)" = "${it.sha}" ] || echo "EMPREINTE ${it.name} — différente du blob commité (${it.sha})"`);
  }
  lines.push('', 'echo "terminé — vérifiez les ÉCHEC, EMPREINTE et LOCAL ci-dessus"');
  return lines.join('\n');
}

function renderBureau() {
  const grid = $('#pz-bureau-grid');
  if (!grid) return;

  if (Bureau.source === 'github' && !Bureau.data) {
    grid.innerHTML = `<div class="a-state a-state--error">
      <span class="a-state__icon">${ic('com-alert', 'a-ic a-ic--lg')}</span>
      <p class="t-h3">Catalogue indisponible</p>
      <p class="t-body-sm u-muted">atlas/media.json n'a pas pu être lu. Régénérez-le avec <span class="u-mono">node atlas/build-media.mjs</span>.</p>
    </div>`;
    resolveIcons(grid);
    return;
  }

  const items = filteredItems();
  const note = $('#pz-bureau-note');
  const count = $('#pz-bureau-count');
  if (Bureau.source === 'github') {
    const t = Bureau.data?.totals || {};
    if (count) count.textContent = `${items.length}/${t.media || 0}`;
    if (note) {
      note.textContent = Bureau.mode === 'audio'
        ? 'Aucun fichier audio commité sur les 38 dépôts — absence mesurée par le scan, pas un filtre qui cache.'
        : `${t.repos || 0} dépôts · ${t.duplicates || 0} doublons par empreinte · référence, jamais copie.`;
    }
  } else {
    if (count) count.textContent = `${items.length}`;
    if (note) {
      note.textContent = Bureau.local.length
        ? `${Bureau.local.length} fichier(s) classé(s) dans le navigateur — rien n'a été envoyé, originaux préservés.`
        : 'Choisissez un dossier via ＋ Importer : lecture et classification locales, rien n\u2019est envoyé.';
    }
  }

  if (!items.length) {
    grid.innerHTML = `<div class="a-state">
      <span class="a-state__icon">${ic(KIND_ICON[Bureau.mode] || 'src-search', 'a-ic a-ic--lg')}</span>
      <p class="t-h3">Aucun élément dans cette vue</p>
      <p class="t-body-sm u-muted">${Bureau.q ? `Aucun nom ne contient « ${esc(Bureau.q)} ».` : 'Une absence est un constat, pas un trou déguisé.'}</p>
    </div>`;
    resolveIcons(grid);
    return;
  }
  grid.innerHTML = items.map(mediaCard).join('');
  resolveIcons(grid);
  renderSelbar();
}

/* ── Bureau : événements de la visionneuse et de la sélection ──── */
(function bindBureauMedia() {
  const grid = $('#pz-bureau-grid');
  if (!grid) return;

  /* Cocher = sélectionner pour transmettre. */
  grid.addEventListener('change', (e) => {
    const box = e.target.closest?.('[data-pz-select]');
    if (!box) return;
    if (box.checked) Bureau.selected.add(box.dataset.pzSelect);
    else Bureau.selected.delete(box.dataset.pzSelect);
    renderSelbar();
  });

  /* Lecture confortable : un seul lecteur à la fois. */
  grid.addEventListener('play', (e) => {
    const el = e.target;
    const Media = window.HTMLMediaElement;
    if (!Media || !(el instanceof Media)) return;
    grid.querySelectorAll('video, audio').forEach((m) => { if (m !== el) m.pause?.(); });
  }, true);

  /* Une ressource qui ne répond pas avoue : repli raw (une fois), puis
     tuile de type — jamais un élément brisé présenté comme un visuel. */
  grid.addEventListener('error', (e) => {
    const el = e.target;
    if (!el || !(el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'AUDIO')) return;
    const fb = el.dataset?.fallback;
    if (fb) {
      delete el.dataset.fallback;
      el.src = fb;
      return;
    }
    const media = el.closest('.umedia');
    if (!media) return;
    media.classList.add('is-empty');
    media.classList.remove('umedia--player');
    media.innerHTML = `${ic(KIND_ICON[media.dataset.kind] || 'mem-card', 'a-ic a-ic--lg')}<span class="umedia__label">${esc(media.dataset.ext || '')} · inaccessible — voir la source</span>`;
    resolveIcons(media);
  }, true);

  /* La case de l'inspecteur vit hors de la grille : même sélection. */
  $('#pz-inspector-body')?.addEventListener('change', (e) => {
    const box = e.target.closest?.('[data-pz-select]');
    if (!box) return;
    if (box.checked) Bureau.selected.add(box.dataset.pzSelect);
    else Bureau.selected.delete(box.dataset.pzSelect);
    renderSelbar();
  });

  $('#pz-sel-links')?.addEventListener('click', () => {
    copyText(linksText(), `${Bureau.selected.size} lien(s) copié(s) — collez-les à votre agent`);
  });
  $('#pz-sel-brief')?.addEventListener('click', () => {
    copyText(briefText(), 'Brief agent copié — consigne + manifeste JSON');
  });
  $('#pz-sel-sh')?.addEventListener('click', () => {
    if (saveBlob('mediatheque-selection.sh', shText())) {
      toast?.({ title: `Script de récupération (${Bureau.selected.size} média(s)) téléchargé`, tone: 'success' });
    }
  });
  $('#pz-sel-visible')?.addEventListener('click', () => {
    for (const it of filteredItems()) Bureau.selected.add(it.id);
    renderSelbar();
    toast?.({ title: `${Bureau.selected.size} média(s) sélectionné(s)`, tone: 'accent' });
  });
  $('#pz-sel-clear')?.addEventListener('click', () => {
    Bureau.selected.clear();
    renderSelbar();
  });
})();

function renderCoverage() {
  const box = $('#pz-bureau-coverage');
  if (!box) return;
  if (Bureau.source === 'local') {
    box.innerHTML = `<p class="t-body-sm u-muted">Mode local : ${Bureau.local.length} fichier(s) lus dans ce navigateur, chemins relatifs conservés comme provenance. Aucun scan, aucun envoi, aucune synchronisation.</p>`;
    return;
  }
  const repos = Bureau.data?.repos || [];
  if (!repos.length) { box.innerHTML = ''; return; }
  box.innerHTML = `
    <p class="t-caption u-muted">généré le ${esc((Bureau.data.generated_at || '').slice(0, 10))} · scan ${Bureau.data.truncated ? 'tronqué (signalé)' : 'complet'}</p>
    <table class="a-table">
      <thead><tr><th>dépôt</th><th>médias</th><th>état</th></tr></thead>
      <tbody>${repos.map((r) => `
        <tr><td><button type="button" class="a-text-btn" data-repo="${esc(r.name)}">${esc(r.name)}</button></td><td>${r.media}</td><td>${r.state === 'ok' ? 'ok' : esc(r.state)}${r.tree_truncated ? ' · tronqué' : ''}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

async function loadBureau() {
  try {
    const r = await fetch('../atlas/media.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    Bureau.data = await r.json();
  } catch {
    Bureau.data = null;
  }
  renderBureau();
  renderCoverage();
}

function setSource(src) {
  Bureau.source = src;
  store.set('source', src);
  $('#pz-src-github')?.setAttribute('aria-pressed', src === 'github' ? 'true' : 'false');
  $('#pz-src-local')?.setAttribute('aria-pressed', src === 'local' ? 'true' : 'false');
  renderBureau();
  renderCoverage();
  renderInspector();
}
$('#pz-src-github')?.addEventListener('click', () => setSource('github'));
$('#pz-src-local')?.addEventListener('click', () => setSource('local'));

$$('#pz-bureau [data-mode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    Bureau.mode = btn.dataset.mode;
    $$('#pz-bureau [data-mode]').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    renderBureau();
  });
});
$('#pz-bureau-q')?.addEventListener('input', (e) => {
  Bureau.q = e.target.value.trim().toLowerCase();
  renderBureau();
});

$$('#pz-bureau [data-dossier]').forEach((btn) => {
  btn.addEventListener('click', () => {
    Bureau.dossier = btn.dataset.dossier;
    $$('#pz-bureau [data-dossier]').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    renderBureau();
  });
});

/* ── ＋ · IMPORT UNIVERSEL ───────────────────────────────────── */
const fileDir = $('#pz-file-dir');
const fileMulti = $('#pz-file-multi');
const importField = $('#pz-uimport-field');
const importText = $('#pz-uimport-text');

async function fileBuffer(f) {
  try { return typeof f.arrayBuffer === 'function' ? await f.arrayBuffer() : null; }
  catch { return null; }
}

async function sha256hex(buf) {
  try {
    if (!window.crypto?.subtle || !buf) return null;
    const h = await window.crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

/* Lecture locale réelle (pz-import.mjs, zéro dépendance) : chaque fichier
   est classé, empreinté SHA-256, les archives et PDF sont indexés — la
   couverture de l'import est publiée dans le Bureau, jamais envoyée. */
const BIG_FILE = 67108864; /* 64 Mio — au-delà, l'empreinte est déclarée non calculée */
const ImportCov = { last: null, zip: null };

async function ingestFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  const canBlob = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
  const lots = [];
  let topZip = null;
  for (const f of list) {
    /* classifyName renvoie { ext, kind } (pz-import.mjs) — la version P4
       comparait l'objet à une chaîne : aucun fichier local n'était reconnu
       (ni aperçu, ni index ZIP, ni filtre par type). Corrigé en Vague 1. */
    const { ext, kind } = classifyName(f.name);
    const inspect = kind === 'archive' || ext === 'pdf';
    const want = inspect || (f.size || 0) <= BIG_FILE;
    const buf = want ? await fileBuffer(f) : null;
    const sha = buf ? await sha256hex(buf) : null;
    const blob = canBlob && ['image', 'video', 'audio', 'vecteur'].includes(kind) ? URL.createObjectURL(f) : null;
    const rec = {
      id: `loc-${Date.now().toString(36)}-${Bureau.local.length}`,
      name: f.name, kind, ext, size: f.size || null,
      local: true, rel: f.webkitRelativePath || f.name,
      url: blob || '', source: '', sha256: sha,
      whyUnhashed: buf || !want ? null : 'fichier volumineux — empreinte non calculée',
    };
    let skipped = null;
    if (kind === 'archive' && buf) {
      const z = zipIndex(buf);
      if (z.ok) {
        rec.zip = { count: z.count, files: z.files.slice(0, 40) };
        if (!topZip) topZip = rec;
      } else { skipped = { name: f.name, reason: z.error }; rec.zipError = z.error; }
    }
    if (ext === 'pdf' && buf) {
      const p = pdfTriage(buf);
      if (p.ok) rec.pdf = p;
      else { skipped = skipped || { name: f.name, reason: p.error }; rec.pdfError = p.error; }
    }
    Bureau.local.push(rec);
    lots.push({ name: f.name, ext, kind, sha256: sha, kept: true, skipped });
  }
  ImportCov.last = summarizeImport(lots);
  ImportCov.zip = topZip;
  setSource('local');
  renderImportCoverage();
}

function renderImportCoverage() {
  const box = $('#pz-bureau-cov');
  const sum = ImportCov.last;
  if (!box || !sum) return;
  box.hidden = false;
  const kinds = Object.entries(sum.byKind).map(([k, n]) => `${n} ${k}`).join(' · ') || 'aucun type reconnu';
  box.innerHTML = `
    <div class="pz-cov l-stack">
      <p class="t-h3">Couverture de l'import — ${sum.kept}/${sum.total} conservés</p>
      <p class="t-body-sm u-muted">${esc(kinds)}${sum.hashed ? ` · ${sum.hashed} empreinte(s) SHA-256` : ''}${sum.unhashed ? ` · ${sum.unhashed} non calculée(s)` : ''}</p>
      ${sum.skipped.length ? `<p class="t-body-sm">Écartés honnêtement : ${sum.skipped.map((s) => `${esc(s.name)} — ${esc(s.reason)}`).join(' · ')}</p>` : ''}
      ${sum.dupes.length ? `<p class="t-body-sm">Doublons d'empreinte : ${sum.dupes.map((d) => `${esc(d.names.join(' = '))} <span class="u-mono">${esc(d.sha)}</span>`).join(' · ')}</p>` : ''}
      ${ImportCov.zip?.zip ? `<p class="t-body-sm u-muted">Archive « ${esc(ImportCov.zip.name)} » : ${ImportCov.zip.zip.count} entrées — ${ImportCov.zip.zip.files.slice(0, 3).map(esc).join(', ')}${ImportCov.zip.zip.files.length > 3 ? '…' : ''}</p>` : ''}
      <div class="l-row">
        <button type="button" class="a-btn a-btn--sm" data-cov-noema>Transmettre à NOEMA en intention</button>
        <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-cov-close>Masquer</button>
      </div>
    </div>`;
}
fileDir?.addEventListener('change', () => ingestFiles([...(fileDir.files || [])]));
fileMulti?.addEventListener('change', () => ingestFiles([...(fileMulti.files || [])]));

document.addEventListener('click', (e) => {
  const mi = e.target.closest('[data-import]');
  if (!mi) return;
  const kind = mi.dataset.import;
  if (kind === 'dir') { fileDir?.click(); return; }
  if (kind === 'files') { fileMulti?.click(); return; }
  if (kind === 'resolve') {
    const show = importField?.hidden !== false;
    if (importField) importField.hidden = !show;
    if (show) importText?.focus();
  }
});
importText?.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  resolveImport(importText.value);
  importText.value = '';
});

function resolveImport(raw) {
  const text = String(raw || '').trim();
  if (!text) return;
  const gh = text.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (gh) {
    const repo = gh[2].replace(/\.git$/, '');
    const known = (Bureau.data?.repos || []).some((r) => r.name === repo);
    if (known) {
      Bureau.repoFilter = repo;
      setSource('github');
      closeLayers();
      toast?.({ title: `Bureau filtré sur « ${repo} »`, text: 'Le dépôt est dans le catalogue transversal (scan du 17 sept.).', tone: 'success' });
    } else {
      toast?.({ title: `« ${repo} » hors catalogue`, text: 'Le scan couvre 38 dépôts ; régénérez-le avec node atlas/build-media.mjs pour l\u2019y lire.', tone: 'warning' });
    }
    return;
  }
  /* Toute autre entrée devient une intention : transmission honnête,
     aucune écriture (PastedInformation → proposition, jamais un fait). */
  const ta = $('#pz-noema-text');
  if (ta) {
    ta.value = text;
    ta.focus();
  }
  closeLayers();
  toast?.({ title: 'Transmis à NOEMA', text: 'Le texte attend votre intention — utilisez « Lire sans écrire » pour voir ce qui est compris.', tone: 'accent' });
}

/* ── Placements sur la grille (projection locale) ─────────────── */
function place(it) {
  if (!it || !(it.kind === 'image' || it.kind === 'vecteur')) return;
  const p = {
    id: `pl-${places.length + 1}`,
    media: it,
    x: 40 + (places.length % 5) * 36,
    y: 40 + (places.length % 4) * 36,
    w: 128,
  };
  const host = $('#pz-places');
  if (!host) return;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pz-place u-anim-scale';
  el.style.setProperty('--pz-x', String(p.x));
  el.style.setProperty('--pz-y', String(p.y));
  el.style.setProperty('--pz-w', String(p.w));
  el.innerHTML = `${it.url ? `<img src="${esc(it.url)}" alt="" loading="lazy">` : ''}<span class="pz-place__label">${esc(it.name)}</span>`;
  el.setAttribute('aria-label', `Placement : ${it.name} — sélectionner`);
  el.addEventListener('click', () => select('place', p, el));
  p.el = el;
  host.appendChild(el);
  places.push(p);
  select('place', p, el);
  toast?.({ title: 'Placement créé', text: 'L\u2019asset reste référencé — la grille porte une position, pas une copie.', tone: 'accent' });
}

function removePlace() {
  const p = Selection.ref;
  if (!p) return;
  p.el?.remove();
  places.splice(places.indexOf(p), 1);
  select(null, null);
}

/* ── Glisser magnétique : la grille propose, jamais n'impose ────
   STOP 24 px (constante du système), CENTRE/BORD à ±8 px ; pendant le
   glisser, l'étiquette d'accrochage porte la règle réellement appliquée. */
const SNAP_STEP = 24;
const SNAP_HIT = 8;
const snapOn = () => $('#pz-snap')?.getAttribute('aria-pressed') === 'true';
let drag = null;

function applyDragSnap(x, w, hostW) {
  let v = Math.round(x / SNAP_STEP) * SNAP_STEP;
  let label = `STOP ${SNAP_STEP}`;
  if (hostW > w && Math.abs(x - (hostW - w) / 2) <= SNAP_HIT) { v = Math.round((hostW - w) / 2); label = 'CENTRE'; }
  else if (Math.abs(x) <= SNAP_HIT) { v = 0; label = 'BORD'; }
  else if (hostW > w && Math.abs(x - (hostW - w)) <= SNAP_HIT) { v = Math.round(hostW - w); label = 'BORD'; }
  return { v, label };
}

function showSnapMark(x, label) {
  const m = $('#pz-snap-mark');
  if (!m) return;
  m.style.setProperty('inline-start', `${Math.round(x)}px`);
  m.setAttribute('data-a-snap', label);
  m.hidden = false;
}
function hideSnapMark() {
  const m = $('#pz-snap-mark');
  if (m) m.hidden = true;
}

function syncPlaceInputs(p) {
  if (Selection.kind !== 'place' || Selection.ref !== p) return;
  const px = $('#pz-px'); const py = $('#pz-py');
  if (px) px.value = String(p.x);
  if (py) py.value = String(p.y);
}

document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest?.('.pz-place');
  if (!el) return;
  const p = places.find((x) => x.el === el);
  const host = $('#pz-places');
  if (!p || !host || typeof host.getBoundingClientRect !== 'function') return;
  const rect = host.getBoundingClientRect();
  drag = { p, el, rect, ox: e.clientX - rect.left - p.x, oy: e.clientY - rect.top - p.y };
  el.classList.add('is-dragging');
  try { el.setPointerCapture(e.pointerId); } catch { /* capture indisponible */ }
});

document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { p, el, rect, ox, oy } = drag;
  let nx = Math.max(0, e.clientX - rect.left - ox);
  const ny = Math.max(0, e.clientY - rect.top - oy);
  if (snapOn()) {
    const s = applyDragSnap(nx, p.w, rect.width);
    nx = s.v;
    showSnapMark(nx, s.label);
  } else {
    hideSnapMark();
  }
  p.x = Math.round(nx);
  p.y = Math.round(ny);
  el.style.setProperty('--pz-x', String(p.x));
  el.style.setProperty('--pz-y', String(p.y));
  syncPlaceInputs(p);
});

function endDrag() {
  if (!drag) return;
  drag.el.classList.remove('is-dragging');
  hideSnapMark();
  if (Selection.kind === 'place' && Selection.ref === drag.p) renderInspector();
  drag = null;
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

/* Clavier : flèches ±4 px, Maj ±24 px (STOP), Suppr retire le placement. */
document.addEventListener('keydown', (e) => {
  const el = e.target.closest?.('.pz-place');
  if (!el) return;
  const p = places.find((x) => x.el === el);
  if (!p) return;
  const step = e.shiftKey ? SNAP_STEP : 4;
  const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (mv) {
    e.preventDefault();
    if (Selection.ref !== p) select('place', p, el);
    p.x = Math.max(0, p.x + mv[0]);
    p.y = Math.max(0, p.y + mv[1]);
    el.style.setProperty('--pz-x', String(p.x));
    el.style.setProperty('--pz-y', String(p.y));
    syncPlaceInputs(p);
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    select('place', p, el);
    removePlace();
  }
});

/* ── Actions déléguées : copie, sélection, placement, bureau ─── */
document.addEventListener('click', (e) => {
  const cp = e.target.closest('[data-copy]');
  if (cp) {
    const v = cp.dataset.copy;
    const clip = window.navigator?.clipboard;
    if (clip?.writeText) {
      clip.writeText(v).then(
        () => toast?.({ title: 'Lien copié', tone: 'success' }),
        () => toast?.({ title: 'Copie refusée par le navigateur', text: v, tone: 'warning' }),
      );
    } else {
      toast?.({ title: 'Presse-papiers indisponible', text: v, tone: 'warning' });
    }
    return;
  }
  const dl = e.target.closest('[data-pz-dl]');
  if (dl) {
    downloadFile(allItems().find((i) => i.id === dl.dataset.pzDl)).catch(() => {});
    return;
  }
  const vf = e.target.closest('[data-pz-verify]');
  if (vf) {
    verifyFile(allItems().find((i) => i.id === vf.dataset.pzVerify)).catch(() => {});
    return;
  }
  const pl = e.target.closest('[data-place]');
  if (pl) {
    place(allItems().find((i) => i.id === pl.dataset.place));
    return;
  }
  const ms = e.target.closest('[data-media-select]');
  if (ms) {
    const it = allItems().find((i) => i.id === ms.dataset.mediaSelect);
    if (it) select('media', it);
    return;
  }
  const rp = e.target.closest('[data-repo]');
  if (rp) {
    Bureau.repoFilter = Bureau.repoFilter === rp.dataset.repo ? '' : rp.dataset.repo;
    renderBureau();
    toast?.({ title: Bureau.repoFilter ? `Filtre : ${Bureau.repoFilter}` : 'Filtre dépôt retiré', tone: 'accent' });
    return;
  }
  if (e.target.closest('[data-ins-place]')) {
    if (Selection.kind === 'media' && Selection.ref) place(Selection.ref);
    return;
  }
  if (e.target.closest('[data-ins-remove]')) removePlace();
  const covClose = e.target.closest('[data-cov-close]');
  if (covClose) {
    const b = $('#pz-bureau-cov');
    if (b) b.hidden = true;
    return;
  }
  if (e.target.closest('[data-cov-noema]')) {
    const sum = ImportCov.last;
    const ta = $('#pz-noema-text');
    if (ta && sum) {
      const kinds = Object.entries(sum.byKind).map(([k, n]) => `${n} ${k}`).join(', ');
      ta.value = `Import local lu dans la fenêtre : ${sum.kept}/${sum.total} fichiers conservés (${kinds}). `
        + `${sum.hashed} empreinte(s) SHA-256 calculée(s), ${sum.dupes.length} groupe(s) de doublons, ${sum.skipped.length} écarté(s). `
        + 'Que proposes-tu pour les classer en mémoire ?';
      closeLayers();
      const pane = $('#pz-pane-end');
      if (pane?.hidden) $('#pz-toggle-inspector')?.click();
      ta.focus();
      toast?.({ title: 'Intention pré-remplie', text: 'Rien n\u2019est envoyé — relisez, puis « Lire sans écrire » ou « Proposer ».', tone: 'accent' });
    }
    return;
  }
  if (e.target.closest('[data-eaa-rerun]')) {
    eaaExecute();
  }
});

/* ── Magnétisme / repères / point zéro ────────────────────────── */
function bindToggle(sel, key, apply) {
  const btn = $(sel);
  if (!btn) return;
  const set = (on) => {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    apply(on);
    store.set(key, on ? 'on' : 'off');
  };
  set(store.get(key, 'on') === 'on');
  btn.addEventListener('click', () => set(btn.getAttribute('aria-pressed') !== 'true'));
  return set;
}
bindToggle('#pz-snap', 'snap', () => {
  /* L'étiquette d'accrochage n'apparaît que pendant un glisser — le
     toggle règle l'aimantation, il ne prétend pas montrer une règle
     appliquée à rien. */
  if (Selection.kind === null) renderInspector();
});
bindToggle('#pz-guides', 'guides', (on) => {
  if (page) page.dataset.guides = on ? 'on' : 'off';
  if (Selection.kind === null) renderInspector();
});
bindToggle('#pz-zero', 'zero', (on) => {
  if (page) page.dataset.zero = on ? 'on' : 'off';
  if (Selection.kind === null) renderInspector();
});

/* ── Z4b · NOEMA — la boucle réelle, projetée sous l'inspecteur ─ */
const Noema = { state: null, live: false, runtime: null };
const ACTOR = 'point.zero.shell';

const KIND_LABEL = {
  reschedule: ['Report', 'time-calendar'], alert: ['Alerte', 'com-alert'],
  question: ['Question', 'com-message'], connection: ['Rapprochement', 'rel-relation'],
  person: ['À mémoriser', 'ppl-person'], relation: ['À relier', 'rel-relation'],
  date: ['Date', 'time-calendar'], unknown: ['Inconnu déclaré', 'mem-card'],
  action_request: ['Action demandée', 'apr-approved'],
};
const CONF_FR = { low: 'faible', medium: 'moyenne', high: 'élevée' };
const TYPE_ICON = {
  person: 'ppl-person', organization: 'ppl-org', project: 'prj-project',
  object: 'mem-card', relation: 'rel-relation', event: 'time-calendar',
  proposal: 'noe-proposed', document: 'doc-document', decision: 'apr-approved',
};

async function api(path, body) {
  const r = await fetch(path, body
    ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
    : undefined);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
  return d;
}

function setNoemaBadge() {
  const b = $('#pz-noema-status');
  if (!b) return;
  const demo = Noema.runtime?.mode === 'serverless';
  const label = Noema.live ? (demo ? 'NOEMA en ligne · démo' : 'NOEMA en ligne') : 'NOEMA hors ligne';
  b.textContent = label;
  b.className = Noema.live ? 'a-badge a-badge--success' : 'a-badge';
  b.title = demo
    ? 'Monde de démonstration en mémoire, réinitialisé à froid — la persistance disque vit sur le serveur local complet.'
    : Noema.live ? 'Serveur local : mémoire persistée sur disque.' : 'La boucle ne répond pas — rien n\u2019est simulé.';
}

function offlineBlock(what) {
  return `<div class="a-state">
    <span class="a-state__icon">${ic('noe-mark', 'a-ic a-ic--lg')}</span>
    <p class="t-h3">NOEMA hors ligne</p>
    <p class="t-body-sm u-muted">${esc(what)} restera vivant avec le serveur : <span class="u-mono">node loop/server.mjs</span>. Aucune donnée n'est inventée en attendant.</p>
  </div>`;
}

function renderRail() {
  const feed = $('#pz-noema-feed');
  if (!feed) return;
  if (!Noema.live) { feed.innerHTML = offlineBlock('Le rail de propositions'); resolveIcons(feed); return; }
  const open = (Noema.state?.entities || []).filter((e) => e.type === 'proposal' && e.status === 'open');
  if (!open.length) {
    feed.innerHTML = `<p class="t-caption u-muted">Aucune proposition ouverte — NOEMA se tait quand elle n'a rien à dire.</p>`;
    return;
  }
  feed.innerHTML = open.map((p) => {
    const [label, iconId] = KIND_LABEL[p.kind] || [p.kind || 'Proposition', 'noe-proposed'];
    return `<article class="noema-card noema-rail" data-certainty="proposed">
      <div class="noema-card__head">
        <span class="noema-card__kind">${ic(iconId)}${esc(label)}</span>
        <span class="nstate" data-state="proposed">${ic('noe-proposed', 'a-ic a-ic--state')}Proposé</span>
      </div>
      <p class="noema-card__title">${esc(p.title || p.kind || p.id)}</p>
      <p class="t-caption u-muted">confiance ${esc(CONF_FR[p.confidence] || p.confidence || 'faible')}</p>
      <div class="noema-card__foot">
        <button type="button" class="a-btn a-btn--sm a-btn--primary" data-decide="accepted" data-target="${esc(p.id)}">Valider</button>
        <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-decide="rejected" data-target="${esc(p.id)}">Refuser</button>
        <span class="l-spacer"></span>
        ${stateBadge(p.provenance?.state || 'proposed')}
      </div>
    </article>`;
  }).join('');
  resolveIcons(feed);
}

function fillProjects() {
  const sel = $('#pz-project');
  if (!sel) return;
  const projects = (Noema.state?.entities || []).filter((e) => e.type === 'project');
  const cur = store.get('project', '');
  sel.innerHTML = '<option value="">Tous les projets</option>' + projects
    .map((p) => `<option value="${esc(p.id)}"${p.id === cur ? ' selected' : ''}>${esc(p.title || p.id)}</option>`).join('');
}

async function bootNoema() {
  try {
    const s = await api('/api/state');
    Noema.state = s;
    Noema.runtime = s.runtime || null;
    Noema.live = true;
  } catch {
    Noema.live = false;
  }
  setNoemaBadge();
  fillProjects();
  renderRail();
  renderCartes();
  if (Noema.live) loadTimeline();
  else {
    const tl = $('#pz-timeline-list');
    if (tl) { tl.innerHTML = offlineBlock('La Timeline universelle'); resolveIcons(tl); }
    const meta = $('#pz-dock-tl-meta');
    if (meta) meta.textContent = 'hors ligne';
  }
}

$('#pz-project')?.addEventListener('change', (e) => {
  store.set('project', e.target.value);
  if (Noema.live) loadTimeline();
});

/* Intention : « Lire sans écrire » (dry_run) / « Proposer » (écrit des
   propositions, jamais des faits — l'acteur est requis côté routeur). */
async function intend(dry) {
  const ta = $('#pz-noema-text');
  const out = $('#pz-noema-out');
  const text = ta?.value.trim() || '';
  if (!text) { toast?.({ title: 'Rien à lire', text: 'Écrivez d\u2019abord une intention.', tone: 'warning' }); return; }
  if (!Noema.live) { toast?.({ title: 'NOEMA hors ligne', text: 'Démarrez node loop/server.mjs — aucune intention n\u2019est simulée.', tone: 'warning' }); return; }
  try {
    const d = await api('/api/intend', dry ? { text, dry_run: true } : { text, actor: ACTOR });
    if (d.state) { Noema.state = d.state; renderRail(); renderCartes(); }
    if (dry) {
      const cands = d.candidates || [];
      const un = d.unparsed || [];
      out.innerHTML = `
        <p class="t-caption u-muted">Lecture sans écriture — rien n'a été enregistré :</p>
        ${cands.length
          ? cands.map((c) => `<p class="t-body-sm">${ic((KIND_LABEL[c.kind] || [])[1] || 'noe-extracted')} ${esc(c.title || c.kind)} <span class="t-meta u-muted">· confiance ${esc(CONF_FR[c.confidence] || 'faible')}</span></p>`).join('')
          : '<p class="t-body-sm u-muted">NOEMA n\u2019a rien reconnu de certain — ce qui n\u2019est pas compris est dit, jamais deviné.</p>'}
        ${un.length ? `<p class="t-caption u-muted">Non reconnu : ${esc(un.join(' · '))}</p>` : ''}`;
    } else {
      out.innerHTML = `<p class="t-caption u-muted">${d.written?.length || 0} proposition(s) écrite(s) — en attente de votre validation. ${d.withheld?.length ? `${d.withheld.length} retenue(s) sous le seuil de confiance (jamais appliquées).` : ''}</p>`;
      toast?.({ title: `${d.written?.length || 0} proposition(s)`, text: 'Validez ou refusez dans le rail NOEMA.', tone: 'accent' });
    }
    resolveIcons(out);
  } catch (err) {
    out.innerHTML = `<p class="t-body-sm u-error">${esc(err.message)}</p>`;
  }
}
$('#pz-noema-read')?.addEventListener('click', () => intend(true));
$('#pz-noema-send')?.addEventListener('click', () => intend(false));

/* ── Z5a · TIMELINE — un moteur, six modes, zéro copie ────────── */
const TL_KIND = {
  performance: 'event', rehearsal: 'event', event: 'event', task: 'task',
  decision: 'decision', proposal: 'proposal', document: 'document', write: 'change', complete: 'proof',
};

function fmtWhen(start) {
  if (!start) return null;
  try {
    return new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return String(start).slice(0, 10); }
}

async function loadTimeline() {
  const list = $('#pz-timeline-list');
  if (!list || !Noema.live) return;
  const mode = $('#pz-tl-mode')?.value || 'PLAN';
  const pid = $('#pz-project')?.value || '';
  try {
    const d = await api(`/api/timeline?mode=${encodeURIComponent(mode)}&granularity=SEMAINE${pid ? `&project_id=${encodeURIComponent(pid)}` : ''}`);
    const items = d.items || [];
    const meta = $('#pz-tl-meta');
    if (meta) meta.textContent = `${items.length} élément(s) · semaine · source : ${esc(d.source_of_truth || 'event')}`;
    const dmeta = $('#pz-dock-tl-meta');
    if (dmeta) dmeta.textContent = `${mode} · ${items.length}`;
    if (!items.length) {
      list.innerHTML = `<div class="a-state"><span class="a-state__icon">${ic('time-timeline', 'a-ic a-ic--lg')}</span>
        <p class="t-h3">Flux vide en mode ${esc(mode)}</p>
        <p class="t-body-sm u-muted">Un élément sans date est signalé, jamais inventé.</p></div>`;
      resolveIcons(list);
      return;
    }
    list.innerHTML = `<div class="utl__list">${items.map((it) => {
      const when = fmtWhen(it.start);
      const kind = TL_KIND[it.type] || 'event';
      const state = it.type === 'proposal' ? ' data-state="proposed"' : '';
      const ent = it.entity_ref ? ` data-entity="${esc(it.entity_ref)}" tabindex="0"` : '';
      return `<article class="utl__item"${state}${ent}>
        <span class="utl__marker" data-kind="${esc(kind)}" aria-hidden="true"></span>
        <div class="utl__row">
          <span class="utl__when">${when ? esc(when) : '<span class="is-unknown">non positionné</span>'}</span>
          <span class="utl__title">${esc(it.title)}</span>
          ${it.late ? '<span class="a-badge a-badge--warning">en retard</span>' : ''}
          ${(it.capabilities || []).includes('COMPLETE') ? `<button type="button" class="a-btn a-btn--sm" data-tcomplete="${esc(it.id)}">Achever</button>` : ''}
        </div>
        <div class="utl__row"><span class="t-meta u-muted">${esc((it.capabilities || []).slice(0, 5).join(' · '))}${it.actor ? ` · ${esc(it.actor)}` : ''}</span></div>
      </article>`;
    }).join('')}</div>`;
  } catch (err) {
    list.innerHTML = `<p class="t-body-sm u-error">${esc(err.message)}</p>`;
  }
}
$('#pz-tl-mode')?.addEventListener('change', () => loadTimeline());

/* ── Z5b · CARTES — la mémoire du projet en cartes ────────────── */
function renderCartes() {
  const box = $('#pz-cartes-list');
  if (!box) return;
  if (!Noema.live) { box.innerHTML = offlineBlock('Les Cartes universelles'); resolveIcons(box); return; }
  const entities = Noema.state?.entities || [];
  const meta = $('#pz-cartes-meta');
  if (meta) meta.textContent = `${entities.length} entité(s) — source : mémoire de la boucle`;
  if (!entities.length) {
    box.innerHTML = '<p class="t-body-sm u-muted">Mémoire vide — une carte par objet, jamais d\u2019invention.</p>';
    return;
  }
  box.innerHTML = entities.map((e) => {
    const title = e.display_name || e.title || e.content?.name || e.description || e.type || e.id;
    const sub = `${e.type}${e.status ? ` · ${e.status}` : ''}`;
    const shape = ['person', 'organization', 'relation'].includes(e.type) ? ` data-type="${esc(e.type)}"` : '';
    return `<button type="button" class="ucard ucard--inline" data-card="${esc(e.id)}">
      <span class="ucard__mark"${shape}>${ic(TYPE_ICON[e.type] || 'mem-card')}</span>
      <span class="ucard__head">
        <span class="ucard__type">${esc(e.type)}</span>
        <span class="ucard__title">${esc(title)}</span>
        <span class="ucard__sub">${esc(sub)}</span>
      </span>
    </button>`;
  }).join('');
  resolveIcons(box);
}

/* ── Actions NOEMA déléguées : décider, achever, carte ────────── */
document.addEventListener('click', async (e) => {
  const dec = e.target.closest('[data-decide]');
  if (dec) {
    try {
      const d = await api('/api/decide', { proposal_id: dec.dataset.target, decision: dec.dataset.decide, actor: ACTOR });
      if (d.state) { Noema.state = d.state; renderRail(); renderCartes(); }
      toast?.({ title: 'Décision enregistrée', text: `${dec.dataset.decide} · attribuée à ${ACTOR}`, tone: 'success' });
    } catch (err) {
      toast?.({ title: 'Décision refusée', text: err.message, tone: 'error' });
    }
    return;
  }
  const tc = e.target.closest('[data-tcomplete]');
  if (tc) {
    try {
      const d = await api('/api/timeline/complete', {
        item_id: tc.dataset.tcomplete, actor: ACTOR, mode: $('#pz-tl-mode')?.value || 'PLAN',
      });
      if (d.state) { Noema.state = d.state; renderRail(); renderCartes(); }
      loadTimeline();
      toast?.({ title: 'Événement achevé', text: 'Le fait canonique a été modifié — la projection suit.', tone: 'success' });
    } catch (err) {
      toast?.({ title: 'Achèvement refusé', text: err.message, tone: 'error' });
    }
    return;
  }
  const cd = e.target.closest('[data-card]');
  if (cd) {
    const ent = (Noema.state?.entities || []).find((x) => x.id === cd.dataset.card);
    if (ent) select('card', ent);
    return;
  }
  /* Synchronisation flux → carte : un clic sur un élément de la timeline
     sélectionne la carte mémoire de la même entité (entity_ref). */
  const tle = e.target.closest('[data-entity]');
  if (tle && tle.dataset.entity && !e.target.closest('button')) {
    selectByEntity(tle.dataset.entity);
  }
});

function selectByEntity(id) {
  const ent = (Noema.state?.entities || []).find((x) => x.id === id);
  if (ent) {
    select('card', ent);
    const pane = $('#pz-pane-end');
    if (pane?.hidden) $('#pz-toggle-inspector')?.click();
    toast?.({ title: 'Carte synchronisée', text: 'Le flux et la carte pointent vers la même entité — zéro copie.', tone: 'accent' });
  } else {
    toast?.({ title: 'Entité hors mémoire chargée', text: 'La projection du flux existe, la carte correspondante n\u2019est pas dans l\u2019état actuel de la boucle.', tone: 'warning' });
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const tle = e.target.closest?.('[data-entity]');
  if (!tle || !tle.dataset.entity || e.target.closest?.('button')) return;
  e.preventDefault();
  selectByEntity(tle.dataset.entity);
});

/* ── P5 · Pack de contrôle EAA — signaux automatiques, jamais une ──
   certification. Le moteur est auditLive du Design System, complété
   par le balayage des noms accessibles et le rapport QA du dernier run. */
const Qa = { report: null };
const Eaa = { run: null };

function eaaExecute() {
  let geometry = [];
  let targets = [];
  let engine = 'auditLive (design-system/js/qa.js)';
  try {
    const live = auditLive(document);
    if (live) { geometry = live.geometry || []; targets = live.targets || []; }
    else engine = 'auditLive indisponible dans ce contexte — signalé, pas simulé';
  } catch { engine = 'auditLive a refusé ce contexte — signalé, pas simulé'; }
  const seenClasses = new Set();
  const unnamed = [];
  for (const el of $$('button, a[href], select, textarea')) {
    if (el.closest('[hidden]')) continue;
    const named = (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
    if (!named) {
      const sig = (el.className?.toString?.() || el.tagName.toLowerCase()).slice(0, 48);
      if (!seenClasses.has(sig)) { seenClasses.add(sig); unnamed.push(sig); }
    }
    if (unnamed.length >= 8) break;
  }
  Eaa.run = {
    at: new Date().toLocaleTimeString('fr-FR'),
    engine, geometry, targets, unnamed,
    contrast: Qa.report?.contrast || null,
  };
  renderInspector();
}

$('#pz-eaa')?.addEventListener('click', () => {
  select('eaa', null);
  const pane = $('#pz-pane-end');
  if (pane?.hidden) $('#pz-toggle-inspector')?.click();
  eaaExecute();
});

/* ── Z1 · badge QA — le rapport réel du dernier run ───────────── */
async function loadQa() {
  const b = $('#pz-qa');
  if (!b) return;
  try {
    const r = await fetch('../design-system/tokens/QA-REPORT.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const q = await r.json();
    Qa.report = q;
    const fam = q.checks?.length || 0;
    const ok = q.checks?.filter((c) => c.result === 'pass').length || 0;
    b.innerHTML = `${ic('prf-shield', 'a-ic a-ic--state')}QA ${ok}/${fam} · ${q.scope?.pages || '?'} écrans`;
    b.className = q.pass ? 'a-badge a-badge--success' : 'a-badge a-badge--warning';
    b.title = q.pass
      ? `Design QA conforme — ${fam} familles, pire contraste ${q.contrast?.worst?.ratio || '?'}:1.`
      : `${q.issues} écart(s) — ouvrir le rapport.`;
    resolveIcons(b.parentElement || document);
  } catch {
    b.textContent = 'QA : rapport indisponible';
    b.className = 'a-badge';
  }
}

/* ── Init ─────────────────────────────────────────────────────── */
(function init() {
  applyFormat(store.get('format', 'web'), false);
  loadBureau().catch(() => {});
  bootNoema().catch(() => {});
  loadQa().catch(() => {});
  renderInspector();
})();
