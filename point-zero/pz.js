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
 *      n'est envoyé, provenance conservée.
 *   4. Z4 — Inspecteur : projection de la sélection unique (canvas, média,
 *      placement, carte) ; les champs de géométrie éditent la présentation
 *      locale, jamais une donnée canonique.
 *   5. Z4b — Rail NOEMA : propositions ouvertes + intention (intend/decide)
 *      contre la boucle réelle ; hors ligne, il le dit et n'invente rien.
 *   6. Z5 — Dock : Timeline (/api/timeline, 6 modes), Cartes (mémoire
 *      /api/state), ＋ Import universel.
 *
 * Ce module ne contient aucune règle métier : tout vient des moteurs
 * (loop API, atlas media.json, QA-REPORT.json). Un écran qui recalculerait
 * créerait une seconde source de vérité. Script module — une phrase
 * incomplète devient un état, jamais une erreur console.
 */

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
      : `sélection : ${kind === 'place' ? 'placement' : kind === 'media' ? 'média du bureau' : 'carte mémoire'}`;
  }
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
        ${row('empreinte', it.sha ? `<span class="u-mono">${esc(it.sha.slice(0, 8))}</span>` : 'locale', false)}
      </div>
      <div class="inspector__group">
        <p class="t-label">Provenance</p>
        ${it.local
          ? row('source', 'dossier local — rien n\u2019a été envoyé')
          : row('source', `<a class="a-text-btn" href="${esc(it.source || it.url)}" target="_blank" rel="noopener noreferrer">fichier source sur GitHub</a>`)}
      </div>
      <div class="inspector__group">
        <div class="l-row">
          ${it.url ? `<a class="a-btn a-btn--sm" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">Voir</a>` : ''}
          ${(it.kind === 'image' || it.kind === 'vecteur') ? `<button type="button" class="a-btn a-btn--sm a-btn--primary" data-ins-place>Placer sur la grille</button>` : ''}
        </div>
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
const Bureau = { data: null, source: 'github', mode: 'tout', q: '', repoFilter: '', local: [] };

const KIND_ICON = {
  image: 'med-image', video: 'med-video', audio: 'med-audio',
  vecteur: 'med-qr', document: 'doc-document', autre: 'mem-archive',
};
const EXT_KIND = [
  [/^(png|jpe?g|webp|gif|avif|bmp|ico)$/, 'image'],
  [/^(mp4|webm|mov|m4v)$/, 'video'],
  [/^(mp3|wav|ogg|flac|aac|m4a)$/, 'audio'],
  [/^(svg)$/, 'vecteur'],
  [/^(pdf|md|txt|docx?|odt|csv|rtf)$/, 'document'],
];

function visibleMediaCount() {
  return Bureau.source === 'github' ? (Bureau.data?.items?.length || 0) : Bureau.local.length;
}

function filteredItems() {
  let items = Bureau.source === 'github' ? (Bureau.data?.items || []) : Bureau.local;
  if (Bureau.repoFilter) items = items.filter((i) => i.repo === Bureau.repoFilter);
  if (Bureau.mode !== 'tout') items = items.filter((i) => i.kind === Bureau.mode);
  if (Bureau.q) items = items.filter((i) => i.name.toLowerCase().includes(Bureau.q));
  return items;
}

function mediaCard(it) {
  const visual = it.kind === 'image' || it.kind === 'vecteur';
  const thumb = visual
    ? `<div class="umedia" data-format="1-1"><img loading="lazy" src="${esc(it.url)}" alt=""></div>`
    : `<div class="umedia is-empty" data-format="1-1">${ic(KIND_ICON[it.kind] || 'mem-card', 'a-ic a-ic--lg')}<span class="umedia__label">${esc(it.ext || it.kind)}</span></div>`;
  const where = it.local ? `local · ${esc(it.rel || '')}` : esc(it.repo || '');
  return `
  <article class="ucard ucard--tile" data-id="${esc(it.id)}">
    ${thumb}
    <div class="ucard__head">
      <span class="ucard__title">${esc(it.name)}</span>
      <span class="ucard__sub">${where}</span>
    </div>
    <div class="ucard__foot">
      <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-media-select="${esc(it.id)}">Inspecter</button>
      ${it.url ? `<button type="button" class="a-btn a-btn--sm a-btn--ghost" data-copy="${esc(it.url)}">Copier</button>` : ''}
      ${visual && it.url ? `<button type="button" class="a-btn a-btn--sm" data-place="${esc(it.id)}">Placer</button>` : ''}
    </div>
  </article>`;
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
}

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

/* ── ＋ · IMPORT UNIVERSEL ───────────────────────────────────── */
const fileDir = $('#pz-file-dir');
const fileMulti = $('#pz-file-multi');
const importField = $('#pz-uimport-field');
const importText = $('#pz-uimport-text');

function ingestFiles(files) {
  const created = [];
  for (const f of files) {
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    const kind = EXT_KIND.find(([re]) => re.test(ext))?.[1] || 'autre';
    const canBlob = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    const blob = canBlob && ['image', 'video', 'audio', 'vecteur'].includes(kind) ? URL.createObjectURL(f) : null;
    created.push({
      id: `loc-${Bureau.local.length + created.length}`,
      name: f.name,
      kind, ext,
      size: f.size || null,
      local: true,
      rel: f.webkitRelativePath || f.name,
      url: blob || '',
      source: '',
    });
  }
  Bureau.local.push(...created);
  setSource('local');
  toast?.({ title: `${created.length} fichier(s) classé(s)`, text: 'Lecture locale — rien n\u2019a été envoyé. Validez avant toute mémorisation.', tone: 'accent' });
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
  const pl = e.target.closest('[data-place]');
  if (pl) {
    place(filteredItems().find((i) => i.id === pl.dataset.place));
    return;
  }
  const ms = e.target.closest('[data-media-select]');
  if (ms) {
    const it = filteredItems().find((i) => i.id === ms.dataset.mediaSelect);
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
bindToggle('#pz-snap', 'snap', (on) => {
  const mark = $('#pz-snap-mark');
  if (mark) mark.hidden = !on;
  if ($('#pz-snap')) $('#pz-snap').setAttribute('aria-pressed', on ? 'true' : 'false');
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
      return `<article class="utl__item"${state}>
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
  }
});

/* ── Z1 · badge QA — le rapport réel du dernier run ───────────── */
async function loadQa() {
  const b = $('#pz-qa');
  if (!b) return;
  try {
    const r = await fetch('../design-system/tokens/QA-REPORT.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const q = await r.json();
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
