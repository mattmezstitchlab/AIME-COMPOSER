/**
 * AIME DESIGN SYSTEM V1 — STUDIO.
 * Le logiciel de composition : un canevas (grille universelle), une
 * bibliothèque (tout le menu de gauche devenu objets posables), un
 * inspecteur, un studio NOEMA (propositions · décisions humaines),
 * un studio QA (le module d'audit du système, appliqué à la composition)
 * et un export (brief agent, projection HTML, document JSON).
 *
 * Règle héritée du Composer : la position est une donnée (--a-x/--a-y),
 * jamais un style en dur ; NOEMA propose, l'humain dispose ; une absence
 * reste nommée, jamais simulée.
 */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     OUTILS
     ══════════════════════════════════════════════════════════ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ROOT = document.querySelector('meta[name="a-root"]')?.content || './';
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d || 0; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const stopRound = (v) => Math.round(v / 24) * 24;

  const ic = (name, cls) =>
    `<svg class="${cls || 'a-ic a-ic--sm'}" aria-hidden="true" width="16" height="16" focusable="false"><use href="${ROOT}assets/aime-icons.svg#i-${name}"></use></svg>`;

  function resolveIcons(rootEl) {
    (rootEl || document).querySelectorAll('use[data-a-icon]').forEach((u) => {
      u.setAttribute('href', `${ROOT}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
    });
  }

  const store = {
    get(k, d) { try { return localStorage.getItem('aime-studio-' + k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aime-studio-' + k, v); } catch { /* refusé */ } },
  };

  function toast(title, text, tone) {
    if (window.AIME?.toast) { window.AIME.toast({ title, text, tone: tone || 'accent' }); return; }
    const r = $('.a-toast-region');
    if (!r) return;
    const el = document.createElement('div');
    el.className = `a-toast${tone ? ` a-toast--${tone}` : ''}`;
    el.innerHTML = `<div class="a-toast__body"><p class="a-toast__title"></p>${text ? '<p class="a-toast__text"></p>' : ''}</div><button type="button" class="a-icon-btn" aria-label="Fermer la notification">${ic('nav-close')}</button>`;
    el.querySelector('.a-toast__title').textContent = title || '';
    if (text) el.querySelector('.a-toast__text').textContent = text;
    el.querySelector('button').addEventListener('click', () => el.remove());
    r.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(label);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.className = 'u-sr';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* refusé */ }
      ta.remove();
      toast(ok ? label : 'La copie a été refusée', '', ok ? 'success' : 'error');
    }
  }

  function saveBlob(name, text, type) {
    if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof Blob === 'undefined') {
      toast('Téléchargement indisponible ici', 'Le contexte n’expose pas de téléchargement — copiez le contenu.', 'error');
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Fichier préparé', name, 'success');
  }

  /* ══════════════════════════════════════════════════════════
     PRÉFÉRENCES (mêmes clés que le châssis documentaire)
     ══════════════════════════════════════════════════════════ */
  const html = document.documentElement;
  const prefs = {
    theme: store.get('theme', 'dark') === 'light' ? 'light' : 'dark',
    density: ['compact', 'normal', 'touch'].includes(store.get('density', 'normal')) ? store.get('density', 'normal') : 'normal',
    motion: store.get('motion', 'full') === 'reduced' ? 'reduced' : 'full',
  };
  function applyPrefs() {
    html.dataset.aimeTheme = prefs.theme;
    if (prefs.density === 'normal') delete html.dataset.aimeDensity; else html.dataset.aimeDensity = prefs.density;
    if (prefs.motion === 'reduced') html.dataset.aimeMotion = 'reduced'; else delete html.dataset.aimeMotion;
    store.set('theme', prefs.theme); store.set('density', prefs.density); store.set('motion', prefs.motion);
    const t = $('#st-theme'), d = $('#st-density'), m = $('#st-motion');
    if (t) t.setAttribute('aria-label', `Thème : ${prefs.theme === 'dark' ? 'sombre' : 'clair'}. Changer de thème`);
    if (d) d.setAttribute('aria-label', `Densité : ${prefs.density}. Changer la densité`);
    if (m) {
      m.setAttribute('aria-pressed', prefs.motion === 'reduced' ? 'true' : 'false');
      m.setAttribute('aria-label', `Mouvement : ${prefs.motion === 'reduced' ? 'réduit' : 'complet'}. Basculer`);
    }
    renderDirection();
  }
  $('#st-theme')?.addEventListener('click', () => { prefs.theme = prefs.theme === 'dark' ? 'light' : 'dark'; applyPrefs(); });
  $('#st-density')?.addEventListener('click', () => {
    const order = ['normal', 'compact', 'touch'];
    prefs.density = order[(order.indexOf(prefs.density) + 1) % order.length];
    applyPrefs();
  });
  $('#st-motion')?.addEventListener('click', () => { prefs.motion = prefs.motion === 'reduced' ? 'full' : 'reduced'; applyPrefs(); });

  /* ══════════════════════════════════════════════════════════
     RÉFÉRENTIELS — lus du système, jamais recopiés ailleurs
     ══════════════════════════════════════════════════════════ */
  const STOP = 24;
  const FORMATS = {
    a4: { label: 'A4 · portrait', ratio: [210, 297], w: 480 },
    a5: { label: 'A5 · portrait', ratio: [148, 210], w: 400 },
    card: { label: 'Carte · 85 × 55', ratio: [85, 55], w: 480 },
    '16-9': { label: 'Écran · 16:9', ratio: [16, 9], w: 640 },
    '9-16': { label: 'Écran · 9:16', ratio: [9, 16], w: 280 },
    '1-1': { label: 'Carré · 1:1', ratio: [1, 1], w: 480 },
    web: { label: 'Web · 16:10', ratio: [16, 10], w: 720 },
    mobile: { label: 'Mobile · 375', ratio: [375, 667], w: 376 },
    tablet: { label: 'Tablette · 768', ratio: [768, 1024], w: 768 },
  };
  const COLS_BY_FORMAT = { mobile: 4, tablet: 6 };
  const CARD_TYPES = {
    person: { label: 'Personne', icon: 'ppl-person' },
    organization: { label: 'Organisation', icon: 'ppl-org' },
    project: { label: 'Projet', icon: 'prj-project' },
    event: { label: 'Événement', icon: 'time-calendar' },
    document: { label: 'Document', icon: 'doc-document' },
    place: { label: 'Lieu', icon: 'grd-guides' },
    relation: { label: 'Relation', icon: 'rel-relation' },
    media: { label: 'Média', icon: 'med-image' },
  };
  const STATES = {
    observed: { label: 'Observé', icon: 'noe-observed' },
    extracted: { label: 'Extrait', icon: 'noe-extracted' },
    inferred: { label: 'Déduit', icon: 'noe-inferred' },
    proposed: { label: 'Proposé', icon: 'noe-proposed' },
    confirmed: { label: 'Confirmé', icon: 'noe-confirmed' },
    superseded: { label: 'Remplacé', icon: 'noe-superseded' },
  };
  const TL_KINDS = {
    event: 'Événement', decision: 'Décision', proposal: 'Proposition', task: 'Tâche',
    document: 'Document', communication: 'Communication', publication: 'Publication',
    proof: 'Preuve', change: 'Changement',
  };
  const TEXT_ROLES = {
    display: 'Display', h1: 'Titre 1', h2: 'Titre 2', h3: 'Titre 3', body: 'Corps',
    'body-sm': 'Corps petit', caption: 'Légende', meta: 'Méta', label: 'Label',
  };
  const SURFACES = {
    'surface-sunken': 'surface creusée', surface: 'surface', 'surface-elevated': 'surface élevée', 'surface-overlay': 'surface superposée',
  };
  const GLYPHS = ('act-add act-check act-execute act-export act-play act-publish act-undo apr-approved apr-pending apr-rejected apr-sign ' +
    'cmp-compose cmp-connect cmp-cursor cmp-layers cmp-move cmp-node com-alert com-broadcast com-inbox com-mail com-message ' +
    'doc-clipboard doc-contract doc-document doc-proof doc-version grd-format grd-grid grd-guides grd-ruler grd-snap ' +
    'med-audio med-image med-library med-qr med-video mem-archive mem-bookmark mem-card mem-memory mem-vault ' +
    'nav-arrow-left nav-arrow-right nav-back nav-chevron-down nav-chevron-right nav-close nav-external nav-home nav-menu ' +
    'noe-confirmed noe-extracted noe-inferred noe-mark noe-observed noe-proposed noe-superseded ' +
    'ppl-org ppl-people ppl-person ppl-role prf-evidence prf-fingerprint prf-shield prf-verified prj-brief prj-flag prj-project prj-target ' +
    'rel-group rel-network rel-relation rel-share set-permission set-preferences set-sliders set-theme src-filter src-search src-sort ' +
    'time-calendar time-clock time-history time-playhead time-timeline').split(' ');
  const COLOR_ROLES = [
    ['Neutres', 'background surface surface-elevated surface-overlay surface-sunken text text-muted text-subtle text-inverse border border-subtle border-strong grid-line scrim focus-ring'],
    ['Accent', 'accent accent-hover accent-active accent-on accent-subtle accent-text'],
    ['Succès', 'success-solid success-surface success-border success-text success-on-solid'],
    ['Information', 'info-solid info-surface info-border info-text info-on-solid'],
    ['Avertissement', 'warning-solid warning-surface warning-border warning-text warning-on-solid'],
    ['Erreur', 'error-solid error-surface error-border error-text error-on-solid'],
  ];

  /* ══════════════════════════════════════════════════════════
     MODÈLE — le document
     ══════════════════════════════════════════════════════════ */
  const doc = { name: 'Composition sans titre', format: 'a4', cols: '', objects: [], relations: [], seq: 1 };
  const view = {
    zoom: 1, snap: true, tool: 'select',
    overlays: { cells: false, thirds: false, safe: false, origin: true },
    sideOpen: true, inspectOpen: true, tab: 'inspect',
  };
  let selection = null;           /* { type:'obj'|'rel', id } */
  let linkSource = null;          /* objet source en cours de liaison */
  const dismissed = new Set();    /* propositions NOEMA écartées (session) */
  const journal = [];             /* décisions humaines (session) */
  let lastAudit = null;           /* dernier rapport QA de la composition */

  const nextId = (p) => `${p}-${doc.seq++}`;
  const objById = (id) => doc.objects.find((o) => o.id === id);
  const fmt = () => FORMATS[doc.format] || FORMATS.a4;
  const pageW = () => fmt().w;
  const pageH = () => Math.round((fmt().w * fmt().ratio[1]) / fmt().ratio[0]);

  function objTitle(o) {
    const p = o.props || {};
    switch (o.kind) {
      case 'card': case 'node': case 'noemacard': case 'approval': return p.title || '';
      case 'text': return p.text || '';
      case 'media': return p.label || (p.src ? 'média lié' : '');
      case 'icon': return GLYPHS.includes(p.glyph) ? `icône ${p.glyph}` : '';
      case 'button': case 'badge': case 'pill': case 'tag': return p.label || '';
      case 'field': case 'toggle': return p.label || '';
      case 'frame': return p.label || '';
      case 'timeline': return p.title || '';
      case 'vizbars': case 'vizcols': return p.title || '';
      default: return '';
    }
  }
  const objLabel = (o) => `${KINDS[o.kind]?.label || o.kind}${objTitle(o) ? ` — ${objTitle(o)}` : ' — sans nom'}`;

  /* ── Historique (annuler / rétablir) ─────────────────────── */
  const undoStack = [];
  const redoStack = [];
  const HISTORY_MAX = 100;
  const serialize = () => JSON.stringify({ name: doc.name, format: doc.format, cols: doc.cols, objects: doc.objects, relations: doc.relations, seq: doc.seq });
  function snapshot() {
    undoStack.push(serialize());
    if (undoStack.length > HISTORY_MAX) undoStack.shift();
    redoStack.length = 0;
  }
  function restore(json) {
    const d = JSON.parse(json);
    doc.name = d.name; doc.format = d.format; doc.cols = d.cols || '';
    doc.objects = d.objects || []; doc.relations = d.relations || []; doc.seq = d.seq || 1;
    if (selection && selection.type === 'obj' && !objById(selection.id)) selection = null;
    if (selection && selection.type === 'rel' && !doc.relations.find((r) => r.id === selection.id)) selection = null;
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(serialize());
    restore(undoStack.pop());
    changed(true);
    toast('Annulé', '', 'accent');
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(serialize());
    restore(redoStack.pop());
    changed(true);
    toast('Rétabli', '', 'accent');
  }
  function syncHistoryButtons() {
    const u = $('#st-undo'), r = $('#st-redo');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  /* ── Persistance locale ──────────────────────────────────── */
  let saveTimer = 0;
  function save(quiet) {
    store.set('doc', serialize());
    const at = new Date();
    const el = $('#st-saved');
    if (el) el.textContent = `enregistré ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    if (!quiet && saveTimer) { clearTimeout(saveTimer); saveTimer = 0; }
  }
  function saveSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = 0; save(true); }, 400);
  }

  /* Toute mutation passe ici : rendu, NOEMA, statut, sauvegarde. */
  function changed(fromHistory) {
    renderPage();
    renderStatus();
    renderInspector();
    refreshNoema();
    syncHistoryButtons();
    if (!fromHistory) saveSoon();
  }

  /* ══════════════════════════════════════════════════════════
     RENDU DES OBJETS — les vraies classes du système
     ══════════════════════════════════════════════════════════ */
  const NOEMA_USAGES = {
    question: { label: 'Question', icon: 'com-message' },
    alert: { label: 'Alerte', icon: 'com-alert' },
    proof: { label: 'Preuve', icon: 'doc-proof' },
    action: { label: 'Action proposée', icon: 'act-execute' },
    explanation: { label: 'Explication', icon: 'noe-mark' },
  };

  const KINDS = {
    card: {
      label: 'Carte universelle', w: 240,
      render: (o) => {
        const t = CARD_TYPES[o.props.type] || CARD_TYPES.person;
        const facts = (o.props.facts || []).map((f) =>
          `<div class="ucard__fact"><dt>${esc(f.k)}</dt><dd${f.v ? '' : ' class="is-unknown"'}>${esc(f.v) || 'Inconnu — dit ainsi'}</dd></div>`).join('');
        return `<div class="ucard" data-state="${esc(o.state || 'confirmed')}">
          <div class="ucard__id"><span class="ucard__mark" data-type="${esc(o.props.type)}">${ic(t.icon, 'a-ic')}</span>
          <span class="ucard__head"><span class="ucard__type">${esc(t.label)}</span><span class="ucard__title">${esc(o.props.title) || '—'}</span></span></div>
          ${o.props.sub ? `<span class="ucard__sub">${esc(o.props.sub)}</span>` : ''}
          ${facts ? `<dl class="ucard__facts">${facts}</dl>` : ''}</div>`;
      },
      fields: [
        { name: 'type', label: 'Type', type: 'select', options: Object.entries(CARD_TYPES).map(([v, t]) => [v, t.label]), get: (o) => o.props.type, set: (o, v) => { o.props.type = v; } },
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'sub', label: 'Sous-titre', type: 'text', get: (o) => o.props.sub, set: (o, v) => { o.props.sub = v; } },
        { name: 'facts', label: 'Faits', type: 'lines', hint: 'Une ligne par fait : clé | valeur', get: (o) => (o.props.facts || []).map((f) => `${f.k} | ${f.v}`).join('\n'), set: (o, v) => { o.props.facts = parsePairs(v); } },
      ],
    },
    timeline: {
      label: 'Frise', w: 320,
      render: (o) => {
        const items = (o.props.items || []).map((it) => `
          <article class="utl__item"${it.state ? ` data-state="${esc(it.state)}"` : ''}>
            <span class="utl__marker" data-kind="${esc(it.kind || 'event')}" aria-hidden="true"></span>
            <div class="utl__row"><span class="utl__when">${esc(it.when)}</span><span class="utl__title">${esc(it.title)}</span>
            ${it.state && it.state !== 'confirmed' ? nstateHtml(it.state) : ''}</div>
          </article>`).join('');
        return `<div class="utl">
          <div class="utl__head"><span class="t-label">${esc(o.props.title) || 'Frise'}</span><span class="t-meta">${(o.props.items || []).length} élément(s)</span></div>
          <div class="utl__list">${items || '<p class="t-caption u-muted">Aucun élément — la frise le dit au lieu de l’inventer.</p>'}</div></div>`;
      },
      fields: [
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'items', label: 'Éléments', type: 'lines', hint: 'quand | titre | kind | état', get: (o) => (o.props.items || []).map((i) => [i.when, i.title, i.kind, i.state].join(' | ')).join('\n'), set: (o, v) => {
          o.props.items = v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
            const [when, title, kind, state] = l.split('|').map((s) => s.trim());
            return { when: when || '—', title: title || '—', kind: TL_KINDS[kind] ? kind : 'event', state: STATES[state] ? state : 'confirmed' };
          });
        } },
      ],
    },
    media: {
      label: 'Média', w: 240,
      render: (o) => o.props.src
        ? `<div class="umedia" data-format="${esc(o.props.format)}"><img src="${esc(o.props.src)}" alt="${esc(o.props.label || 'média lié')}" loading="lazy">${o.props.label ? `<span class="umedia__label">${esc(o.props.label)}</span>` : ''}</div>`
        : `<div class="umedia is-empty" data-format="${esc(o.props.format)}">${ic('med-image', 'a-ic a-ic--lg')}<span class="t-caption u-muted">Aucune source liée — l’emplacement est certain, l’asset ne l’est pas.</span></div>`,
      fields: [
        { name: 'format', label: 'Format', type: 'select', options: [['1-1', '1:1'], ['4-5', '4:5'], ['16-9', '16:9'], ['9-16', '9:16'], ['3-2', '3:2'], ['a4', 'A4']], get: (o) => o.props.format, set: (o, v) => { o.props.format = v; } },
        { name: 'src', label: 'Source', type: 'text', hint: 'URL ou chemin — le média reste référencé, jamais copié', get: (o) => o.props.src, set: (o, v) => { o.props.src = v.trim(); } },
        { name: 'label', label: 'Légende', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
      ],
    },
    node: {
      label: 'Nœud Composer', w: 208,
      render: (o) => `<div class="cnode" data-state="${esc(o.state || 'confirmed')}">
        <span class="cnode__type">${esc(o.props.type)}</span>
        <span class="cnode__title">${esc(o.props.title) || '—'}</span>
        ${o.props.desc ? `<span class="cnode__desc">${esc(o.props.desc)}</span>` : ''}
        <span class="cnode__port cnode__port--in" aria-hidden="true"></span>
        <span class="cnode__port cnode__port--out" aria-hidden="true"></span></div>`,
      fields: [
        { name: 'type', label: 'Type', type: 'text', get: (o) => o.props.type, set: (o, v) => { o.props.type = v; } },
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'desc', label: 'Précision', type: 'text', get: (o) => o.props.desc, set: (o, v) => { o.props.desc = v; } },
      ],
    },
    frame: {
      label: 'Zone', w: 240, h: 160,
      render: (o) => `<div class="studio-obj__frame" data-st-frame>${o.props.label ? `<span class="studio-obj__tag">${esc(o.props.label)}</span>` : ''}</div>`,
      fields: [
        { name: 'label', label: 'Nom', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'surface', label: 'Surface', type: 'select', options: Object.entries(SURFACES), get: (o) => o.props.surface, set: (o, v) => { o.props.surface = v; } },
      ],
      postRender: (el, o) => {
        const fr = el.querySelector('[data-st-frame]');
        if (!fr) return;
        fr.style.setProperty('background', `var(--aime-color-${o.props.surface || 'surface-sunken'})`);
        fr.style.setProperty('height', '100%');
        const tag = fr.querySelector('.studio-obj__tag');
        if (tag) { tag.style.setProperty('position', 'static'); tag.hidden = false; }
      },
    },
    text: {
      label: 'Texte', w: 320,
      render: (o) => `<p class="t-${esc(o.props.role)}">${esc(o.props.text) || '<span class="u-muted">Texte à écrire — l’inspecteur le porte.</span>'}</p>`,
      fields: [
        { name: 'role', label: 'Rôle', type: 'select', options: Object.entries(TEXT_ROLES), get: (o) => o.props.role, set: (o, v) => { o.props.role = v; } },
        { name: 'text', label: 'Contenu', type: 'textarea', get: (o) => o.props.text, set: (o, v) => { o.props.text = v; } },
      ],
    },
    button: {
      label: 'Bouton', w: 160, auto: true,
      render: (o) => `<button type="button" class="a-btn${o.props.variant ? ` a-btn--${o.props.variant}` : ''}${o.props.size ? ` a-btn--${o.props.size}` : ''}">${esc(o.props.label) || 'Action'}</button>`,
      fields: [
        { name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'variant', label: 'Variante', type: 'select', options: [['', 'par défaut'], ['primary', 'primaire'], ['ghost', 'fantôme'], ['danger', 'danger']], get: (o) => o.props.variant, set: (o, v) => { o.props.variant = v; } },
        { name: 'size', label: 'Taille', type: 'select', options: [['', 'normale'], ['sm', 'petite'], ['lg', 'grande']], get: (o) => o.props.size, set: (o, v) => { o.props.size = v; } },
      ],
    },
    badge: {
      label: 'Badge', w: 140, auto: true,
      render: (o) => `<span class="a-badge${o.props.tone ? ` a-badge--${o.props.tone}` : ''}">${esc(o.props.label) || 'badge'}</span>`,
      fields: [
        { name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'tone', label: 'Ton', type: 'select', options: [['', 'neutre'], ['accent', 'accent'], ['success', 'succès'], ['warning', 'avertissement'], ['error', 'erreur'], ['info', 'info'], ['superseded', 'remplacé']], get: (o) => o.props.tone, set: (o, v) => { o.props.tone = v; } },
      ],
    },
    pill: {
      label: 'Pastille', w: 140, auto: true,
      render: (o) => `<span class="a-pill${o.props.current ? ' a-pill--button' : ''}"${o.props.current ? ' aria-current="true"' : ''}>${esc(o.props.label) || 'pastille'}</span>`,
      fields: [
        { name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'current', label: 'Courant', type: 'check', get: (o) => o.props.current, set: (o, v) => { o.props.current = v; } },
      ],
    },
    tag: {
      label: 'Étiquette', w: 140, auto: true,
      render: (o) => `<span class="a-tag">${esc(o.props.label) || 'étiquette'}</span>`,
      fields: [{ name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } }],
    },
    field: {
      label: 'Champ', w: 220,
      render: (o) => `<div class="a-field"><label class="a-field__label">${esc(o.props.label) || 'Libellé'}</label><input class="a-input" type="text" value="${esc(o.props.value)}" readonly aria-label="${esc(o.props.label || 'valeur du champ')}">${o.props.hint ? `<span class="a-field__hint">${esc(o.props.hint)}</span>` : ''}</div>`,
      fields: [
        { name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'value', label: 'Valeur', type: 'text', get: (o) => o.props.value, set: (o, v) => { o.props.value = v; } },
        { name: 'hint', label: 'Aide', type: 'text', get: (o) => o.props.hint, set: (o, v) => { o.props.hint = v; } },
      ],
    },
    toggle: {
      label: 'Interrupteur', w: 180, auto: true,
      render: (o) => `<label class="a-toggle"><input type="checkbox"${o.props.on ? ' checked' : ''} readonly tabindex="-1"><span class="a-toggle__track"><span class="a-toggle__thumb"></span></span><span class="a-toggle__text">${esc(o.props.label) || 'Option'}</span></label>`,
      fields: [
        { name: 'label', label: 'Libellé', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'on', label: 'Actif', type: 'check', get: (o) => o.props.on, set: (o, v) => { o.props.on = v; } },
      ],
    },
    progress: {
      label: 'Progression', w: 220,
      render: (o) => `<span class="a-progress${o.props.tone ? ` a-progress--${o.props.tone}` : ''}"><span class="a-progress__bar" data-a-value="${num(o.props.value, 0)}"></span></span>`,
      fields: [
        { name: 'value', label: 'Valeur', type: 'number', min: 0, max: 100, get: (o) => o.props.value, set: (o, v) => { o.props.value = clamp(num(v, 0), 0, 100); } },
        { name: 'tone', label: 'Ton', type: 'select', options: [['', 'neutre'], ['success', 'succès'], ['warning', 'avertissement'], ['error', 'erreur']], get: (o) => o.props.tone, set: (o, v) => { o.props.tone = v; } },
      ],
      postRender: (el, o) => { const bar = el.querySelector('.a-progress__bar'); if (bar) bar.style.setProperty('--a-value', String(num(o.props.value, 0))); },
    },
    avatar: {
      label: 'Avatar', w: 80, auto: true,
      render: (o) => `<span class="a-avatar${o.props.size ? ` a-avatar--${o.props.size}` : ''}" aria-label="${esc(o.props.initials || 'initiales')}">${esc(o.props.initials) || '—'}</span>`,
      fields: [
        { name: 'initials', label: 'Initiales', type: 'text', get: (o) => o.props.initials, set: (o, v) => { o.props.initials = v.slice(0, 3); } },
        { name: 'size', label: 'Taille', type: 'select', options: [['', 'normale'], ['sm', 'petite'], ['lg', 'grande'], ['xl', 'très grande']], get: (o) => o.props.size, set: (o, v) => { o.props.size = v; } },
      ],
    },
    nstate: {
      label: 'État épistémique', w: 140, auto: true,
      render: (o) => nstateHtml(o.props.state),
      fields: [{ name: 'state', label: 'État', type: 'select', options: Object.entries(STATES).map(([v, s]) => [v, s.label]), get: (o) => o.props.state, set: (o, v) => { o.props.state = v; } }],
    },
    noemacard: {
      label: 'Carte NOEMA', w: 280,
      render: (o) => `<article class="noema-card${o.props.usage ? ` noema-card--${o.props.usage}` : ''}" data-certainty="${esc(o.props.certainty)}">
        <div class="noema-card__head"><span class="noema-card__kind">${ic(NOEMA_USAGES[o.props.usage]?.icon || 'noe-mark')}${esc(NOEMA_USAGES[o.props.usage]?.label || 'Proposition')}</span></div>
        <p class="noema-card__title">${esc(o.props.title) || '—'}</p>
        ${o.props.body ? `<p class="noema-card__body">${esc(o.props.body)}</p>` : ''}</article>`,
      fields: [
        { name: 'usage', label: 'Usage', type: 'select', options: [['', 'proposition']].concat(Object.entries(NOEMA_USAGES).map(([v, u]) => [v, u.label])), get: (o) => o.props.usage, set: (o, v) => { o.props.usage = v; } },
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'body', label: 'Corps', type: 'textarea', get: (o) => o.props.body, set: (o, v) => { o.props.body = v; } },
        { name: 'certainty', label: 'Certitude', type: 'select', options: [['proposed', 'proposée'], ['confirmed', 'confirmée'], ['uncertain', 'incertaine'], ['superseded', 'remplacée']], get: (o) => o.props.certainty, set: (o, v) => { o.props.certainty = v; } },
      ],
    },
    approval: {
      label: 'Approbation', w: 240,
      render: (o) => {
        const st = o.props.state || 'pending';
        const head = { pending: ['En attente', 'proposed', 'noe-proposed'], accepted: ['Acceptée', 'confirmed', 'noe-confirmed'], rejected: ['Refusée', 'superseded', 'noe-superseded'], superseded: ['Remplacée', 'superseded', 'noe-superseded'] }[st] || ['En attente', 'proposed', 'noe-proposed'];
        return `<div class="approval" data-state="${esc(st)}">
          <div class="l-row l-row--between"><span class="t-label">${head[0]}</span><span class="nstate" data-state="${head[1]}">${ic(head[2], 'a-ic a-ic--state')}${STATES[head[1]]?.label || head[1]}</span></div>
          <p class="t-body-sm u-strong">${esc(o.props.title) || '—'}</p>
          <div class="approval__decision">${st === 'pending'
            ? `<button type="button" class="a-btn a-btn--sm a-btn--primary">Approuver</button><button type="button" class="a-btn a-btn--sm">Réviser</button>`
            : `<span class="a-avatar a-avatar--sm" aria-label="décideur">${esc(o.props.actor ? o.props.actor.slice(0, 2).toUpperCase() : '—')}</span><span class="t-caption u-muted">${esc(o.props.actor) || 'décideur non nommé'}</span>`}</div></div>`;
      },
      fields: [
        { name: 'title', label: 'Objet', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'state', label: 'Décision', type: 'select', options: [['pending', 'en attente'], ['accepted', 'acceptée'], ['rejected', 'refusée'], ['superseded', 'remplacée']], get: (o) => o.props.state, set: (o, v) => { o.props.state = v; } },
        { name: 'actor', label: 'Décideur', type: 'text', hint: 'une décision sans acteur n’est pas une décision', get: (o) => o.props.actor, set: (o, v) => { o.props.actor = v; } },
      ],
    },
    unknown: {
      label: 'Inconnue', w: 220, auto: true,
      render: (o) => `<span class="noema-unknown">${ic('noe-inferred', 'a-ic a-ic--state')}${esc(o.props.text) || 'Information manquante'}</span>`,
      fields: [{ name: 'text', label: 'Texte', type: 'text', get: (o) => o.props.text, set: (o, v) => { o.props.text = v; } }],
    },
    vizbars: {
      label: 'Barres', w: 260,
      render: (o) => `<div class="viz">
        ${o.props.title ? `<div class="viz__head"><span class="t-label">${esc(o.props.title)}</span></div>` : ''}
        <div class="viz-bars">${(o.props.rows || []).map((r) => `
          <div class="viz-bars__row"${r.role ? ` data-role="${esc(r.role)}"` : ''}${r.proposed ? ' data-certainty="proposed"' : ''}>
            <span class="viz-bars__label">${esc(r.label)}</span>
            <span class="viz-bars__track"><span class="viz-bars__fill" data-a-value="${num(r.value, 0)}"></span></span>
            <span class="viz-bars__value">${num(r.value, 0)}</span></div>`).join('')}</div>
        <div class="viz__foot"><span class="t-caption u-muted">Le hachuré signale une valeur proposée, non validée.</span></div></div>`,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'rows', label: 'Données', type: 'lines', hint: 'libellé | valeur | rôle (success, warning) | proposé ?', get: (o) => (o.props.rows || []).map((r) => [r.label, r.value, r.role || '', r.proposed ? 'proposé' : ''].join(' | ')).join('\n'), set: (o, v) => { o.props.rows = parseRows(v, (label, value, role, proposed) => ({ label, value: clamp(num(value, 0), 0, 100), role: ['success', 'warning'].includes(role) ? role : '', proposed: proposed === 'proposé' })); } },
      ],
      postRender: (el, o) => { (o.props.rows || []).forEach((r, i) => { const f = el.querySelectorAll('.viz-bars__fill')[i]; if (f) f.style.setProperty('--a-value', String(num(r.value, 0))); }); },
    },
    vizcols: {
      label: 'Colonnes', w: 280,
      render: (o) => `<div class="viz">
        ${o.props.title ? `<div class="viz__head"><span class="t-label">${esc(o.props.title)}</span></div>` : ''}
        <div class="viz-cols">${(o.props.cols || []).map((c) => `
          <div class="viz-cols__col"${c.role ? ` data-role="${esc(c.role)}"` : ''}${c.proposed ? ' data-certainty="proposed"' : ''}>
            <span class="viz-cols__bar" data-a-value="${num(c.value, 0)}"></span><span class="viz-cols__key">${esc(c.key)}</span></div>`).join('')}</div>
        <div class="viz__foot"><span class="t-caption u-muted">Jamais plus de douze colonnes : au-delà, on change d’échelle.</span></div></div>`,
      fields: [
        { name: 'title', label: 'Titre', type: 'text', get: (o) => o.props.title, set: (o, v) => { o.props.title = v; } },
        { name: 'cols', label: 'Données', type: 'lines', hint: 'clé | valeur | rôle | proposé ?', get: (o) => (o.props.cols || []).map((c) => [c.key, c.value, c.role || '', c.proposed ? 'proposé' : ''].join(' | ')).join('\n'), set: (o, v) => { o.props.cols = parseRows(v, (key, value, role, proposed) => ({ key, value: clamp(num(value, 0), 0, 100), role: role === 'accent' ? 'accent' : '', proposed: proposed === 'proposé' })).slice(0, 12); } },
      ],
      postRender: (el, o) => { (o.props.cols || []).forEach((c, i) => { const b = el.querySelectorAll('.viz-cols__bar')[i]; if (b) b.style.setProperty('--a-value', String(num(c.value, 0))); }); },
    },
    vizproof: {
      label: 'Preuves', w: 260,
      render: (o) => `<div class="viz-proof">${(o.props.steps || []).map((s) => `
        <div class="viz-proof__step" data-state="${esc(s.state)}"><span class="viz-proof__dot" aria-hidden="true"></span>
        <span class="viz-proof__body"><span class="t-body-sm u-strong">${esc(s.label)}</span>
        <span class="t-caption">${s.state === 'proposed' ? 'à confirmer' : 'confirmé'}</span></span></div>`).join('')}</div>`,
      fields: [{ name: 'steps', label: 'Étapes', type: 'lines', hint: 'libellé | état (confirmé, proposé)', get: (o) => (o.props.steps || []).map((s) => `${s.label} | ${s.state}`).join('\n'), set: (o, v) => { o.props.steps = v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [label, state] = l.split('|').map((s) => s.trim()); return { label: label || '—', state: state === 'proposé' || state === 'proposed' ? 'proposed' : 'confirmed' }; }); } }],
    },
    vizspark: {
      label: 'Étincelle', w: 220,
      render: (o) => {
        const vals = (o.props.values || []).map((v) => clamp(num(v, 0), 0, 100));
        const n = vals.length;
        const pts = vals.map((v, i) => `${(2 + (n > 1 ? (i * 196) / (n - 1) : 98)).toFixed(1)} ${(30 - (v / 100) * 26).toFixed(1)}`).join(' L ');
        const up = n > 1 && vals[n - 1] >= vals[0];
        return `<svg class="viz-spark" viewBox="0 0 200 32" role="img" aria-label="${esc(o.props.label || 'tendance')}${up ? ', en hausse' : ', en baisse'}"><path data-role="accent" d="M ${pts}"/></svg>`;
      },
      fields: [
        { name: 'label', label: 'Légende', type: 'text', hint: 'lue par les lecteurs d’écran', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'values', label: 'Valeurs', type: 'lines', hint: 'un nombre par ligne (0–100)', get: (o) => (o.props.values || []).join('\n'), set: (o, v) => { o.props.values = v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => clamp(num(l, 0), 0, 100)).slice(0, 16); } },
      ],
    },
    vizmatrix: {
      label: 'Matrice', w: 220,
      render: (o) => {
        const cells = (o.props.levels || []).slice(0, 96);
        const n = cells.length;
        return `<div class="viz-matrix" data-a-cols="${n}" role="img" aria-label="${esc(o.props.label || `matrice de ${n} périodes`)}">${cells.map((lv) => `<span class="viz-matrix__cell"${lv > 0 ? ` data-level="${lv === 4 ? 'focus' : lv}"` : ''}></span>`).join('')}</div>`;
      },
      fields: [
        { name: 'label', label: 'Légende', type: 'text', get: (o) => o.props.label, set: (o, v) => { o.props.label = v; } },
        { name: 'levels', label: 'Niveaux', type: 'lines', hint: 'un niveau par ligne : 0 à 3, 4 = focus', get: (o) => (o.props.levels || []).join('\n'), set: (o, v) => { o.props.levels = v.split('\n').map((l) => clamp(Math.round(num(l, 0)), 0, 4)).slice(0, 96); } },
      ],
      postRender: (el, o) => { const m = el.querySelector('.viz-matrix'); if (m) m.style.setProperty('--a-cols', String(clamp(Math.ceil(Math.sqrt((o.props.levels || []).length || 12)), 4, 24))); },
    },
    icon: {
      label: 'Icône', w: 64, auto: true,
      render: (o) => `<span class="studio-obj__frame" style="border-style:dashed"><svg class="a-ic a-ic--lg" aria-hidden="true" width="32" height="32" focusable="false"><use href="${ROOT}assets/aime-icons.svg#i-${esc(o.props.glyph)}"></use></svg></span>`,
      fields: [{ name: 'glyph', label: 'Glyphe', type: 'select', options: GLYPHS.map((g) => [g, g]), get: (o) => o.props.glyph, set: (o, v) => { o.props.glyph = v; } }],
    },
    'p-ohead': {
      label: 'En-tête d’objet', w: 360, specimen: true,
      render: () => `<header class="ohead">
        <nav aria-label="Fil d’ariane (spécimen)"><ol class="a-crumbs"><li><a href="index.html" tabindex="-1">AIME</a><span class="a-crumbs__sep" aria-hidden="true">/</span></li><li><a href="experiences/index.html" tabindex="-1">Projets</a><span class="a-crumbs__sep" aria-hidden="true">/</span></li><li><span aria-current="page">Atelier Nord</span></li></ol></nav>
        <div class="ohead__title-row"><span class="ohead__mark">${ic('prj-project', 'a-ic a-ic--lg')}</span>
        <span class="ohead__titles"><span class="t-meta">Projet</span><span class="t-h2">Atelier Nord</span></span><span class="l-spacer"></span>
        <span class="ohead__actions"><button type="button" class="a-btn a-btn--sm" tabindex="-1">Historique</button><button type="button" class="a-btn a-btn--sm a-btn--primary" tabindex="-1">Composer</button></span></div>
        <div class="ohead__meta"><span class="ohead__states"><span class="nstate" data-state="confirmed">${ic('noe-confirmed', 'a-ic a-ic--state')}Confirmé</span><span class="a-badge">v1.0.4</span><span class="a-badge a-badge--accent">2 propositions</span></span>
        <button type="button" class="prov" aria-expanded="false" tabindex="-1">${ic('prf-evidence', 'a-ic a-ic--state')}Provenance</button>
        <span class="t-meta">spécimen du chapitre 18</span></div></header>`,
    },
    'p-cmdbar': {
      label: 'Barre de commande', w: 320, specimen: true,
      render: () => `<div class="cmdbar">
        <div class="cmdbar__field">${ic('src-search', 'a-ic')}<label class="u-sr">Commande (spécimen)</label><input class="cmdbar__input" type="text" placeholder="Composer, timeline, carte…" readonly tabindex="-1"><kbd class="a-kbd">esc</kbd></div>
        <div class="cmdbar__results">
          <p class="cmdbar__group">Organes</p>
          <button type="button" class="cmdbar__item" tabindex="-1">${ic('cmp-compose')}Ouvrir le Composer<kbd class="a-kbd">C</kbd></button>
          <button type="button" class="cmdbar__item" tabindex="-1">${ic('time-timeline')}Ouvrir la Timeline<kbd class="a-kbd">T</kbd></button>
          <p class="cmdbar__group">Actions</p>
          <button type="button" class="cmdbar__item" tabindex="-1">${ic('act-export')}Exporter la composition<kbd class="a-kbd">⌘E</kbd></button>
        </div>
        <div class="cmdbar__foot"><span class="cmdbar__hint"><kbd class="a-kbd">↑</kbd><kbd class="a-kbd">↓</kbd>naviguer</span><span class="cmdbar__hint"><kbd class="a-kbd">↵</kbd>ouvrir</span></div></div>`,
    },
    'p-vdiff': {
      label: 'Comparaison de versions', w: 360, specimen: true,
      render: () => `<div class="vdiff">
        <div class="vdiff__head"><span class="t-label">v1.0.3 · 2026-09-10</span><span class="t-label">v1.0.4 · 2026-09-17</span></div>
        <div class="vdiff__cols">
          <div><div class="vdiff__line" data-change="removed"><span class="vdiff__sign">−</span><span class="vdiff__text">Titre : Votre projet, votre site</span></div>
          <div class="vdiff__line" data-change="same"><span class="vdiff__sign">=</span><span class="vdiff__text">Section héros · asset-0087</span></div>
          <div class="vdiff__line" data-change="removed"><span class="vdiff__sign">−</span><span class="vdiff__text">Appel à l’action : Découvrir</span></div></div>
          <div><div class="vdiff__line" data-change="added"><span class="vdiff__sign">+</span><span class="vdiff__text">Titre : Composer le monde</span></div>
          <div class="vdiff__line" data-change="same"><span class="vdiff__sign">=</span><span class="vdiff__text">Section héros · asset-0087</span></div>
          <div class="vdiff__line" data-change="added"><span class="vdiff__sign">+</span><span class="vdiff__text">Appel à l’action : Ouvrir le Composer</span></div></div>
        </div></div>`,
    },
    'p-ba': {
      label: 'Avant / Après', w: 280, specimen: true,
      render: () => `<div class="ba">
        <div class="ba__layer u-pad u-surface l-stack l-stack--tight"><span class="t-meta">avant · v1.0.3</span><span class="t-h3">Votre projet, votre site</span><span class="t-body-sm u-muted">Une promesse générique, sans verbe d’action.</span></div>
        <div class="ba__layer ba__layer--after u-pad u-surface l-stack l-stack--tight"><span class="t-meta">après · v1.0.4</span><span class="t-h3">Composer le monde</span><span class="t-body-sm u-muted">Un verbe, une intention, une action possible.</span></div>
        <div class="ba__handle"></div><span class="ba__tag ba__tag--before">avant</span><span class="ba__tag ba__tag--after">après</span></div>`,
    },
    'p-sresults': {
      label: 'Résultats', w: 320, specimen: true,
      render: () => `<div class="sresults">
        <div class="sresults__head"><span class="t-body-sm u-strong">« atelier »</span><span class="sresults__count">3</span></div>
        <div class="sresults__group"><div class="sresults__head"><span class="t-label">Projets</span><span class="sresults__count">2</span></div>
          <a class="sresults__item" href="universal-card.html" tabindex="-1"><span class="t-body-sm u-strong"><mark>Atelier</mark> Nord</span><span class="t-caption u-muted">12 objets · v1.0.4</span></a>
          <a class="sresults__item" href="universal-card.html" tabindex="-1"><span class="t-body-sm u-strong"><mark>Atelier</mark> typographique</span><span class="t-caption u-muted">4 objets · v0.3.1</span></a></div>
        <div class="sresults__group"><div class="sresults__head"><span class="t-label">Lieux</span><span class="sresults__count">1</span></div>
          <a class="sresults__item" href="universal-card.html" tabindex="-1"><span class="t-body-sm u-strong">Salle des Fêtes</span><span class="t-caption u-muted">utilisée par <mark>Atelier</mark> Nord</span></a></div></div>`,
    },
    'p-prov': {
      label: 'Provenance', w: 260, specimen: true,
      render: () => `<div class="l-stack l-stack--tight"><button type="button" class="prov" aria-expanded="false" tabindex="-1">${ic('prf-evidence', 'a-ic a-ic--state')}asset-0087</button>
        <div class="prov__panel"><dl class="prov__row"><dt>Source</dt><dd class="u-mono">atelier-nord/media/0087</dd></dl>
        <dl class="prov__row"><dt>Évidence</dt><dd><span class="a-badge a-badge--success">confirmed</span></dd></dl>
        <dl class="prov__row"><dt>Confiance</dt><dd><span class="conf" data-level="high"><span class="conf__meter" aria-hidden="true"><i></i><i></i><i></i></span><span class="conf__label">élevée</span></span></dd></dl></div></div>`,
    },
  };


  function nstateHtml(state) {
    const s = STATES[state] || STATES.confirmed;
    return `<span class="nstate" data-state="${esc(state)}">${ic(s.icon, 'a-ic a-ic--state')}${s.label}</span>`;
  }
  function parsePairs(v) {
    return v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const i = l.indexOf('|');
      return i === -1 ? { k: l, v: '' } : { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() };
    });
  }
  function parseRows(v, map) {
    return v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const p = l.split('|').map((s) => s.trim());
      return map(p[0] || '—', p[1], p[2] || '', p[3] || '');
    });
  }

  /* ══════════════════════════════════════════════════════════
     CRÉATION D'OBJETS
     ══════════════════════════════════════════════════════════ */
  function addObject(kind, x, y, extra) {
    const k = KINDS[kind];
    if (!k) return null;
    snapshot();
    const o = {
      id: nextId('obj'), kind,
      x: x == null ? 48 : Math.round(x), y: y == null ? 48 : Math.round(y),
      w: k.w, h: k.h || null,
      locked: false, hidden: false, state: 'confirmed',
      source: '', note: '',
      props: extra || {},
    };
    doc.objects.push(o);
    selection = { type: 'obj', id: o.id };
    changed();
    toast(`${k.label} posé`, '', 'success');
    return o;
  }

  function duplicateSelection() {
    const o = selObj();
    if (!o || o.locked) return;
    snapshot();
    const c = JSON.parse(JSON.stringify(o));
    c.id = nextId('obj');
    c.x += STOP; c.y += STOP;
    doc.objects.push(c);
    selection = { type: 'obj', id: c.id };
    changed();
    toast('Objet dupliqué', '', 'success');
  }

  function deleteSelection() {
    if (!selection) return;
    snapshot();
    if (selection.type === 'obj') {
      doc.objects = doc.objects.filter((o) => o.id !== selection.id);
      doc.relations = doc.relations.filter((r) => r.from !== selection.id && r.to !== selection.id);
    } else {
      doc.relations = doc.relations.filter((r) => r.id !== selection.id);
    }
    selection = null;
    changed();
    toast('Supprimé', '', 'accent');
  }

  function moveLayer(dir) {
    const o = selObj();
    if (!o) return;
    const i = doc.objects.indexOf(o);
    const j = i + dir;
    if (j < 0 || j >= doc.objects.length) return;
    snapshot();
    doc.objects.splice(i, 1);
    doc.objects.splice(j, 0, o);
    changed();
  }

  const selObj = () => (selection && selection.type === 'obj' ? objById(selection.id) : null);
  const selRel = () => (selection && selection.type === 'rel' ? doc.relations.find((r) => r.id === selection.id) : null);

  /* ══════════════════════════════════════════════════════════
     RENDU DE LA PAGE
     ══════════════════════════════════════════════════════════ */
  const pageEl = $('#st-page');
  const sizerEl = $('#st-sizer');
  const wrapEl = $('#st-wrap');
  const linksEl = $('#st-links');
  const emptyEl = $('#st-empty');

  function applyPageGeometry() {
    const f = fmt();
    const ratio = `${f.ratio[0]} / ${f.ratio[1]}`;
    const h = Math.round((f.w * f.ratio[1]) / f.ratio[0]);
    pageEl.style.aspectRatio = ratio;
    pageEl.style.width = `${f.w}px`;
    pageEl.style.transform = `scale(${view.zoom})`;
    pageEl.dataset.format = doc.format;
    sizerEl.style.width = `${Math.round(f.w * view.zoom)}px`;
    sizerEl.style.height = `${Math.round(h * view.zoom)}px`;
    const zl = $('#st-zoom-label');
    if (zl) zl.textContent = `${Math.round(view.zoom * 100)} %`;
  }

  function renderPage() {
    applyPageGeometry();
    $$('.studio-obj', pageEl).forEach((el) => el.remove());
    const frag = document.createDocumentFragment();
    for (const o of doc.objects) frag.appendChild(buildObjEl(o));
    pageEl.insertBefore(frag, linksEl.nextSibling);
    renderLinks();
    if (emptyEl) emptyEl.hidden = doc.objects.length > 0;
    const counts = $('#st-counts');
    if (counts) counts.textContent = `${doc.objects.length} objet${doc.objects.length > 1 ? 's' : ''} · ${doc.relations.length} relation${doc.relations.length > 1 ? 's' : ''}`;
  }

  function buildObjEl(o) {
    const k = KINDS[o.kind] || KINDS.frame;
    const el = document.createElement('div');
    el.className = 'studio-obj' + (k.auto ? ' studio-obj--auto' : '') + (o.locked ? ' is-locked' : '') + (o.h ? ' studio-obj--fixed' : '');
    el.dataset.id = o.id;
    if (o.state && o.state !== 'confirmed') el.dataset.state = o.state;
    el.style.setProperty('--a-x', String(o.x));
    el.style.setProperty('--a-y', String(o.y));
    el.style.setProperty('--a-w', String(o.w));
    if (o.h) el.style.setProperty('--a-h', String(o.h));
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${objLabel(o)} — sélectionner`);
    if (o.hidden) el.hidden = true;
    const tag = document.createElement('span');
    tag.className = 'studio-obj__tag';
    tag.textContent = `${k.label}${o.state && o.state !== 'confirmed' ? ` · ${STATES[o.state]?.label || o.state}` : ''}`;
    tag.hidden = true;
    el.appendChild(tag);
    const body = document.createElement('div');
    body.className = 'studio-obj__body';
    body.innerHTML = k.render(o);
    el.appendChild(body);
    if (k.postRender) k.postRender(el, o);
    if (selection && selection.type === 'obj' && selection.id === o.id) {
      el.classList.add('is-selected');
      tag.hidden = false;
      const handle = document.createElement('span');
      handle.className = 'studio-obj__handle';
      handle.dataset.stHandle = o.id;
      handle.setAttribute('title', 'Redimensionner');
      el.appendChild(handle);
    }
    resolveIcons(el);
    return el;
  }

  function renderLinks() {
    const svg = linksEl;
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const H = pageH();
    svg.setAttribute('viewBox', `0 0 ${pageW()} ${H}`);
    for (const r of doc.relations) {
      const a = objById(r.from), b = objById(r.to);
      if (!a || !b) continue;
      const p = document.createElementNS(NS, 'path');
      const hA = measureH(a), hB = measureH(b);
      const x1 = a.x + a.w, y1 = a.y + (hA || 64) / 2;
      const x2 = b.x, y2 = b.y + (hB || 64) / 2;
      const dx = Math.max(48, Math.abs(x2 - x1) / 2);
      p.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
      p.setAttribute('class', 'clink' + (r.state === 'proposed' ? ' is-proposed' : '') + (selection && selection.type === 'rel' && selection.id === r.id ? ' is-active' : ''));
      const t = document.createElementNS(NS, 'title');
      t.textContent = r.label || 'relation sans nom';
      p.appendChild(t);
      p.dataset.rel = r.id;
      svg.appendChild(p);
    }
  }

  /* Hauteur mesurée (navigateur réel) ; 0 en l’absence de moteur de mise en page. */
  function measureH(o) {
    const el = pageEl.querySelector(`.studio-obj[data-id="${o.id}"]`);
    if (!el || typeof el.getBoundingClientRect !== 'function') return 0;
    const h = el.getBoundingClientRect().height / (view.zoom || 1);
    return h > 0 ? Math.round(h) : 0;
  }

  /* ══════════════════════════════════════════════════════════
     INTERACTIONS CANEVAS — sélection, glisser magnétique, taille
     ══════════════════════════════════════════════════════════ */
  const SNAP_HIT = 8;
  let drag = null;

  function pagePoint(e) {
    const rect = pageEl.getBoundingClientRect();
    if (!rect.width && !rect.height) return null;
    return {
      x: (e.clientX - rect.left) / (view.zoom || 1),
      y: (e.clientY - rect.top) / (view.zoom || 1),
    };
  }

  function snapAxis(x, w, pageWv) {
    let v = Math.round(x / STOP) * STOP;
    let label = `STOP ${STOP}`;
    if (pageWv > w && Math.abs(x - (pageWv - w) / 2) <= SNAP_HIT) { v = Math.round((pageWv - w) / 2); label = 'CENTRE'; }
    else if (Math.abs(x) <= SNAP_HIT) { v = 0; label = 'BORD'; }
    else if (pageWv > w && Math.abs(x - (pageWv - w)) <= SNAP_HIT) { v = Math.round(pageWv - w); label = 'BORD'; }
    return { v, label };
  }

  function showSnap(which, pos, label) {
    const el = which === 'x' ? $('#st-snapx') : $('#st-snapy');
    if (!el) return;
    if (which === 'x') el.style.left = `${Math.round(pos)}px`; else el.style.top = `${Math.round(pos)}px`;
    el.setAttribute('data-a-snap', label);
    el.hidden = false;
  }
  function hideSnaps() {
    const x = $('#st-snapx'), y = $('#st-snapy');
    if (x) x.hidden = true;
    if (y) y.hidden = true;
  }

  function select(kind, id) {
    selection = kind ? { type: kind, id } : null;
    renderPage();
    renderInspector();
    renderStatus();
  }

  pageEl.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest?.('.studio-obj__handle');
    const objEl = e.target.closest?.('.studio-obj');
    if (handle && objEl) {
      const o = objById(objEl.dataset.id);
      if (!o || o.locked) return;
      snapshot();
      drag = { mode: 'resize', o, el: objEl, w0: o.w, h0: o.h || 0, start: pagePoint(e) };
      objEl.classList.add('is-dragging');
      try { objEl.setPointerCapture(e.pointerId); } catch { /* indisponible */ }
      e.preventDefault();
      return;
    }
    if (objEl) {
      const o = objById(objEl.dataset.id);
      if (!o) return;
      if (view.tool === 'link') { handleLinkClick(o); return; }
      const wasSelected = selection && selection.type === 'obj' && selection.id === o.id;
      if (!wasSelected) select('obj', o.id);
      if (o.locked) return;
      const pt = pagePoint(e);
      if (!pt) return;
      snapshot();
      /* La sélection reconstruit l'élément : le glisser porte sur l'élément vivant. */
      const liveEl = pageEl.querySelector(`.studio-obj[data-id="${o.id}"]`) || objEl;
      drag = { mode: 'move', o, el: liveEl, dx: pt.x - o.x, dy: pt.y - o.y };
      liveEl.classList.add('is-dragging');
      try { liveEl.setPointerCapture(e.pointerId); } catch { /* indisponible */ }
      e.preventDefault();
      return;
    }
    const rel = e.target.closest?.('[data-rel]');
    if (rel) { select('rel', rel.dataset.rel); return; }
    if (e.target === pageEl || e.target.closest?.('.studio-cols, .studio-thirds, .studio-safe, .studio-origin, .studio-links')) {
      if (view.tool === 'link' && linkSource) { cancelLink(); return; }
      select(null);
    }
  });

  document.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = pagePoint(e);
    if (!pt) return;
    if (drag.mode === 'move') {
      let nx = pt.x - drag.dx;
      let ny = pt.y - drag.dy;
      if (view.snap) {
        const sx = snapAxis(nx, drag.o.w, pageW());
        const sy = snapAxis(ny, 64, pageH());
        nx = sx.v; ny = sy.v;
        if (sx.label !== `STOP ${STOP}`) showSnap('x', nx + drag.o.w / 2, sx.label); else hideSnapsX();
        if (sy.label !== `STOP ${STOP}`) showSnap('y', ny + 32, sy.label); else hideSnapsY();
      } else hideSnaps();
      drag.o.x = Math.round(clamp(nx, -pageW(), pageW() * 2));
      drag.o.y = Math.round(clamp(ny, -pageH(), pageH() * 2));
      drag.el.style.setProperty('--a-x', String(drag.o.x));
      drag.el.style.setProperty('--a-y', String(drag.o.y));
      syncGeomInputs(drag.o);
    } else {
      const w = clamp(Math.round((pt.x - drag.o.x) / 4) * 4, 48, 2048);
      drag.o.w = w;
      if (drag.o.kind === 'frame') drag.o.h = clamp(Math.round((pt.y - drag.o.y) / 4) * 4, 48, 4096);
      drag.el.style.setProperty('--a-w', String(drag.o.w));
      if (drag.o.h) drag.el.style.setProperty('--a-h', String(drag.o.h));
      syncGeomInputs(drag.o);
    }
  });

  function hideSnapsX() { const el = $('#st-snapx'); if (el) el.hidden = true; }
  function hideSnapsY() { const el = $('#st-snapy'); if (el) el.hidden = true; }

  document.addEventListener('pointerup', () => {
    if (!drag) return;
    drag.el.classList.remove('is-dragging');
    hideSnaps();
    drag = null;
    changed();
  });
  document.addEventListener('pointercancel', () => {
    if (!drag) return;
    drag.el.classList.remove('is-dragging');
    hideSnaps();
    drag = null;
  });

  /* Position du pointeur dans la barre d'état */
  wrapEl.addEventListener('pointermove', (e) => {
    const pt = pagePoint(e);
    const el = $('#st-pos');
    if (el) el.textContent = pt ? `x ${Math.round(clamp(pt.x, 0, pageW()))} · y ${Math.round(clamp(pt.y, 0, pageH()))}` : 'x — · y —';
  });

  /* Clic sur le canevas avec un outil de pose (texte, cadre) */
  wrapEl.addEventListener('click', (e) => {
    if (e.target.closest?.('.studio-obj')) return;
    if (view.tool !== 'text' && view.tool !== 'frame') return;
    const pt = pagePoint(e);
    if (!pt) return;
    const kind = view.tool === 'text' ? 'text' : 'frame';
    const k = KINDS[kind];
    const x = clamp(stopRound(pt.x - k.w / 2), 0, Math.max(0, pageW() - k.w));
    const y = clamp(stopRound(pt.y - 40), 0, pageH());
    addObject(kind, x, y, kind === 'text' ? { role: 'body', text: '' } : { label: 'Zone', surface: 'surface-sunken' });
    setTool('select');
  });

  /* ── Outil Lier ──────────────────────────────────────────── */
  function handleLinkClick(o) {
    if (!linkSource) {
      linkSource = o.id;
      toast('Source choisie', `${objLabel(o)} — choisissez la cible.`, 'accent');
      return;
    }
    if (linkSource === o.id) { cancelLink(); return; }
    const a = objById(linkSource);
    linkSource = null;
    setTool('select');
    if (!a) return;
    snapshot();
    const r = { id: nextId('rel'), from: a.id, to: o.id, label: '', state: 'proposed' };
    doc.relations.push(r);
    selection = { type: 'rel', id: r.id };
    changed();
    toast('Relation proposée', 'Nommez-la et confirmez-la à l’inspecteur.', 'accent');
  }
  function cancelLink() {
    linkSource = null;
    setTool('select');
    toast('Liaison annulée', '', 'accent');
  }

  function syncGeomInputs(o) {
    if (!selection || selection.type !== 'obj' || selection.id !== o.id) return;
    ['x', 'y', 'w', 'h'].forEach((key) => {
      const el = $(`#st-geom-${key}`);
      if (el && o[key] != null) el.value = String(o[key]);
    });
  }

  /* ══════════════════════════════════════════════════════════
     CLAVIER
     ══════════════════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName || '');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#st-cmdk-open')?.click(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !typing) { e.preventDefault(); duplicateSelection(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); openExport(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); toast('Enregistré localement', 'Le document vit dans ce navigateur — exportez pour le transmettre.', 'success'); return; }
    if (typing) return;
    if (e.key === 'v' || e.key === 'V') return setTool('select');
    if (e.key === 't' || e.key === 'T') return setTool('text');
    if (e.key === 'f' || e.key === 'F') return setTool('frame');
    if (e.key === 'l' || e.key === 'L') return setTool('link');
    if (e.key === 'Escape') {
      if (linkSource) return cancelLink();
      if (selection) return select(null);
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selection) { e.preventDefault(); deleteSelection(); return; }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomStep(1); return; }
    if (e.key === '-') { e.preventDefault(); zoomStep(-1); return; }
    const o = selObj();
    if (o && !o.locked && e.key.startsWith('Arrow')) {
      e.preventDefault();
      const step = e.shiftKey ? STOP : 4;
      snapshot();
      if (e.key === 'ArrowLeft') o.x -= step;
      if (e.key === 'ArrowRight') o.x += step;
      if (e.key === 'ArrowUp') o.y -= step;
      if (e.key === 'ArrowDown') o.y += step;
      changed();
      /* Le rendu reconstruit l'élément : le focus suit l'objet. */
      pageEl.querySelector(`.studio-obj[data-id="${o.id}"]`)?.focus({ preventScroll: true });
    }
  });

  /* ══════════════════════════════════════════════════════════
     OUTILS · ZOOM · BASCULES
     ══════════════════════════════════════════════════════════ */
  function setTool(tool) {
    view.tool = tool;
    $$('[data-st-tool]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.stTool === tool ? 'true' : 'false'));
    if (tool !== 'link') linkSource = null;
  }
  $$('[data-st-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.stTool)));

  const ZOOMS = [0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5, 2, 3];
  function zoomStep(dir) {
    const i = ZOOMS.findIndex((z) => z >= view.zoom - 0.001);
    const j = clamp((i === -1 ? 5 : i) + dir, 0, ZOOMS.length - 1);
    view.zoom = ZOOMS[j];
    applyPageGeometry();
  }
  $('#st-zoom-in')?.addEventListener('click', () => zoomStep(1));
  $('#st-zoom-out')?.addEventListener('click', () => zoomStep(-1));
  $('#st-zoom-fit')?.addEventListener('click', () => {
    const w = wrapEl.clientWidth;
    if (w > 64) { view.zoom = clamp((w - 48) / pageW(), 0.25, 3); applyPageGeometry(); }
  });

  function bindToggle(sel, apply) {
    const el = $(sel);
    if (!el) return;
    el.addEventListener('click', () => {
      const on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
      apply(on);
      saveView();
    });
  }
  function saveView() { store.set('view', JSON.stringify(view)); }
  function loadView() {
    try {
      const v = JSON.parse(store.get('view', '{}') || '{}');
      Object.assign(view.overlays, v.overlays || {});
      if (typeof v.snap === 'boolean') view.snap = v.snap;
      if (typeof v.sideOpen === 'boolean') view.sideOpen = v.sideOpen;
      if (typeof v.inspectOpen === 'boolean') view.inspectOpen = v.inspectOpen;
      if (typeof v.tab === 'string') view.tab = v.tab;
    } catch { /* vue absente ou illisible : défauts */ }
  }

  bindToggle('#st-snap', (on) => { const el = $('#st-snapstate'); if (el) el.textContent = on ? 'magnétisme STOP 24 actif' : 'magnétisme inactif'; });
  bindToggle('#st-ov-cells', (on) => { view.overlays.cells = on; pageEl.dataset.showCells = String(on); });
  bindToggle('#st-ov-thirds', (on) => { view.overlays.thirds = on; pageEl.dataset.showThirds = String(on); });
  bindToggle('#st-ov-safe', (on) => { view.overlays.safe = on; pageEl.dataset.showSafe = String(on); });
  bindToggle('#st-ov-origin', (on) => { view.overlays.origin = on; pageEl.dataset.showOrigin = String(on); });

  $('#st-toggle-side')?.addEventListener('click', () => {
    view.sideOpen = !view.sideOpen;
    $('#st-side')?.classList.toggle('is-closed', !view.sideOpen);
    $('#st-toggle-side')?.setAttribute('aria-pressed', view.sideOpen ? 'true' : 'false');
    saveView();
  });
  $('#st-toggle-inspect')?.addEventListener('click', () => {
    view.inspectOpen = !view.inspectOpen;
    $('#st-inspect')?.classList.toggle('is-closed', !view.inspectOpen);
    $('#st-toggle-inspect')?.setAttribute('aria-pressed', view.inspectOpen ? 'true' : 'false');
    saveView();
  });

  function setTab(tab) {
    view.tab = tab;
    ['inspect', 'noema', 'qa', 'dir'].forEach((t) => {
      const b = $(`#st-tab-${t}`), p = $(`#st-pane-${t}`);
      if (b) b.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      if (p) p.hidden = t !== tab;
    });
    saveView();
  }
  ['inspect', 'noema', 'qa', 'dir'].forEach((t) => $(`#st-tab-${t}`)?.addEventListener('click', () => setTab(t)));
  $('#st-rail-noema')?.addEventListener('click', () => { setTab('noema'); refreshNoema(); });

  /* ── Format & colonnes ───────────────────────────────────── */
  $('#st-format')?.addEventListener('change', (e) => {
    snapshot();
    doc.format = e.target.value;
    const cols = $('#st-cols');
    if (cols && !cols.value) pageEl.dataset.cols = String(COLS_BY_FORMAT[doc.format] || 12);
    changed();
    toast('Format appliqué', fmt().label, 'success');
  });
  $('#st-cols')?.addEventListener('change', (e) => {
    snapshot();
    doc.cols = e.target.value;
    applyCols();
    saveSoon();
  });
  function applyCols() {
    pageEl.dataset.showCols = doc.cols ? 'true' : 'false';
    if (doc.cols) pageEl.dataset.cols = doc.cols;
    else pageEl.dataset.cols = String(COLS_BY_FORMAT[doc.format] || 12);
  }

  function buildCols() {
    const host = $('#st-colsbg');
    if (!host) return;
    host.innerHTML = '<i></i>'.repeat(12);
  }

  /* ══════════════════════════════════════════════════════════
     BIBLIOTHÈQUE — le menu de gauche, devenu objets
     ══════════════════════════════════════════════════════════ */
  const LIB = [
    {
      title: 'Organes', items: [
        { label: 'Carte universelle', icon: 'mem-card', kind: 'card', props: { type: 'person', title: '', sub: '', facts: [] } },
        { label: 'Frise', icon: 'time-timeline', kind: 'timeline', props: { title: '', items: [] } },
        { label: 'Média', icon: 'med-image', kind: 'media', props: { format: '1-1', src: '', label: '' } },
        { label: 'Nœud Composer', icon: 'cmp-node', kind: 'node', props: { type: 'Personne', title: '', desc: '' } },
        { label: 'Zone', icon: 'grd-format', kind: 'frame', props: { label: 'Zone', surface: 'surface-sunken' } },
      ],
    },
    {
      title: 'Texte — neuf rôles', items: [
        { label: 'Titre 1', icon: 'doc-document', kind: 'text', props: { role: 'h1', text: '' } },
        { label: 'Titre 2', icon: 'doc-document', kind: 'text', props: { role: 'h2', text: '' } },
        { label: 'Corps', icon: 'doc-document', kind: 'text', props: { role: 'body', text: '' } },
        { label: 'Légende', icon: 'doc-document', kind: 'text', props: { role: 'caption', text: '' } },
        { label: 'Méta', icon: 'doc-document', kind: 'text', props: { role: 'meta', text: '' } },
      ],
    },
    {
      title: 'Composants', items: [
        { label: 'Bouton', icon: 'act-play', kind: 'button', props: { label: 'Action', variant: '', size: '' } },
        { label: 'Bouton primaire', icon: 'act-play', kind: 'button', props: { label: 'Action', variant: 'primary', size: '' } },
        { label: 'Badge', icon: 'apr-pending', kind: 'badge', props: { label: 'badge', tone: '' } },
        { label: 'Pastille', icon: 'src-filter', kind: 'pill', props: { label: 'pastille', current: false } },
        { label: 'Étiquette', icon: 'mem-bookmark', kind: 'tag', props: { label: 'étiquette' } },
        { label: 'Champ', icon: 'doc-clipboard', kind: 'field', props: { label: 'Libellé', value: '', hint: '' } },
        { label: 'Interrupteur', icon: 'set-sliders', kind: 'toggle', props: { label: 'Option', on: true } },
        { label: 'Progression', icon: 'act-execute', kind: 'progress', props: { value: 64, tone: '' } },
        { label: 'Avatar', icon: 'ppl-person', kind: 'avatar', props: { initials: 'AM', size: '' } },
      ],
    },
    {
      title: 'NOEMA', items: [
        { label: 'État épistémique', icon: 'noe-mark', kind: 'nstate', props: { state: 'proposed' } },
        { label: 'Carte NOEMA', icon: 'noe-proposed', kind: 'noemacard', props: { usage: '', title: '', body: '', certainty: 'proposed' } },
        { label: 'Approbation', icon: 'apr-sign', kind: 'approval', props: { state: 'pending', title: '', actor: '' } },
        { label: 'Inconnue', icon: 'noe-inferred', kind: 'unknown', props: { text: 'Information manquante' } },
      ],
    },
    {
      title: 'Data visualisation', items: [
        { label: 'Barres', icon: 'grd-grid', kind: 'vizbars', props: { title: 'Répartition', rows: [{ label: 'Identité', value: 100 }, { label: 'Contrats', value: 78, role: 'success' }, { label: 'Impression', value: 46, role: 'warning', proposed: true }] } },
        { label: 'Colonnes', icon: 'time-history', kind: 'vizcols', props: { title: 'Objets par semaine', cols: [{ key: 's33', value: 92, role: 'accent' }, { key: 's36', value: 72 }, { key: 's38', value: 24, proposed: true }] } },
        { label: 'Preuves', icon: 'prf-verified', kind: 'vizproof', props: { steps: [{ label: 'Ressource', state: 'confirmed' }, { label: 'Composition', state: 'confirmed' }, { label: 'Décision', state: 'proposed' }] } },
        { label: 'Étincelle', icon: 'time-playhead', kind: 'vizspark', props: { label: 'Tendance des objets actifs', values: [10, 24, 18, 42, 48, 66, 74] } },
        { label: 'Matrice', icon: 'grd-ruler', kind: 'vizmatrix', props: { label: 'Matrice d’activité', levels: [0, 1, 2, 3, 1, 0, 2, 1, 3, 2, 1, 0] } },
      ],
    },
    {
      title: 'Patterns — spécimens', items: [
        { label: 'En-tête d’objet', icon: 'ohead', libicon: 'nav-home', kind: 'p-ohead', props: {} },
        { label: 'Barre de commande', icon: 'cmdbar', libicon: 'src-search', kind: 'p-cmdbar', props: {} },
        { label: 'Versions', icon: 'vdiff', libicon: 'doc-version', kind: 'p-vdiff', props: {} },
        { label: 'Avant / Après', icon: 'ba', libicon: 'act-undo', kind: 'p-ba', props: {} },
        { label: 'Résultats', icon: 'sresults', libicon: 'src-sort', kind: 'p-sresults', props: {} },
        { label: 'Provenance', icon: 'prov', libicon: 'prf-evidence', kind: 'p-prov', props: {} },
      ],
    },
  ];

  function buildLibrary() {
    const host = $('#st-lib');
    if (!host) return;
    const frag = document.createDocumentFragment();
    for (const group of LIB) {
      const g = document.createElement('div');
      g.className = 'studio-libgroup';
      g.dataset.group = group.title;
      const head = document.createElement('p');
      head.className = 't-label';
      head.textContent = group.title;
      g.appendChild(head);
      const grid = document.createElement('div');
      grid.className = 'studio-libgrid';
      for (const item of group.items) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'studio-libitem';
        b.innerHTML = `${ic(item.libicon || item.icon || 'cmp-compose', 'a-ic')}<span>${esc(item.label)}</span>`;
        b.setAttribute('aria-label', `Poser : ${item.label}`);
        b.addEventListener('click', () => addObject(item.kind, null, null, JSON.parse(JSON.stringify(item.props || {}))));
        grid.appendChild(b);
      }
      g.appendChild(grid);
      frag.appendChild(g);
    }
    /* Icônes : le sprite entier, cherchable. */
    const gi = document.createElement('div');
    gi.className = 'studio-libgroup';
    gi.dataset.group = 'Icônes';
    const hi = document.createElement('p');
    hi.className = 't-label';
    hi.textContent = `Icônes — ${GLYPHS.length} glyphes du sprite`;
    gi.appendChild(hi);
    const grid = document.createElement('div');
    grid.className = 'studio-glyphs';
    for (const g of GLYPHS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'studio-glyph';
      b.innerHTML = ic(g, 'a-ic');
      b.setAttribute('aria-label', `Poser l’icône ${g}`);
      b.addEventListener('click', () => addObject('icon', null, null, { glyph: g }));
      grid.appendChild(b);
    }
    gi.appendChild(grid);
    frag.appendChild(gi);
    /* Couleurs : les rôles, copiables. */
    const gc = document.createElement('div');
    gc.className = 'studio-libgroup';
    gc.dataset.group = 'Couleur';
    const hc = document.createElement('p');
    hc.className = 't-label';
    hc.textContent = 'Couleur — rôles du système';
    gc.appendChild(hc);
    for (const [name, roles] of COLOR_ROLES) {
      const cap = document.createElement('p');
      cap.className = 't-caption u-muted';
      cap.textContent = name;
      gc.appendChild(cap);
      const grid = document.createElement('div');
      grid.className = 'studio-swatchgrid';
      for (const role of roles.split(' ')) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'studio-swatch';
        b.dataset.aCopy = `--aime-color-${role}`;
        b.setAttribute('aria-label', `Copier --aime-color-${role}`);
        b.setAttribute('title', `--aime-color-${role}`);
        b.style.setProperty('background', `var(--aime-color-${role})`);
        grid.appendChild(b);
      }
      gc.appendChild(grid);
    }
    frag.appendChild(gc);
    host.appendChild(frag);
  }

  $('#st-libq')?.addEventListener('input', (e) => {
    filterLib(e.target.value.trim().toLowerCase());
  });
  function filterLib(q) {
    $$('#st-lib .studio-libgroup').forEach((g) => {
      let count = 0;
      $$('.studio-libitem, .studio-glyph, .studio-swatch', g).forEach((it) => {
        const hay = ((it.textContent || '') + ' ' + (it.getAttribute('aria-label') || '') + ' ' + (it.getAttribute('title') || '')).toLowerCase();
        const ok = !q || hay.includes(q);
        it.hidden = !ok;
        if (ok) count++;
      });
      g.hidden = count === 0;
    });
  }

  /* ══════════════════════════════════════════════════════════
     INSPECTEUR
     ══════════════════════════════════════════════════════════ */
  function renderInspector() {
    const pane = $('#st-pane-inspect');
    if (!pane) return;
    const o = selObj();
    const r = selRel();
    if (r) { pane.innerHTML = relationInspector(r); bindInspector(pane, null, r); return; }
    if (!o) {
      const list = doc.objects.map((it, i) => `
        <div class="studio-qa-row"><span class="a-badge">${i + 1}</span>
          <span class="l-spacer">${esc(objLabel(it))}${it.hidden ? ' · masqué' : ''}${it.locked ? ' · verrouillé' : ''}</span>
          <button type="button" class="a-btn a-btn--sm" data-pick="${esc(it.id)}">Choisir</button></div>`).join('');
      pane.innerHTML = `<div class="studio-group"><p class="t-label">Document</p>
        <dl class="inspector__row"><dt>nom</dt><dd class="u-mono">${esc(doc.name)}</dd></dl>
        <dl class="inspector__row"><dt>format</dt><dd>${esc(fmt().label)}</dd></dl>
        <dl class="inspector__row"><dt>colonnes</dt><dd>${doc.cols || `profil (${COLS_BY_FORMAT[doc.format] || 12})`}</dd></dl>
        <dl class="inspector__row"><dt>objets</dt><dd>${doc.objects.length}</dd></dl>
        <dl class="inspector__row"><dt>relations</dt><dd>${doc.relations.length}</dd></dl></div>
        <div class="studio-group"><p class="t-label">Sélection</p>
        <p class="t-caption u-muted">Rien de sélectionné. Cliquez un objet du canevas, ou reprenez-le dans la liste.</p>
        ${list || '<p class="t-caption u-muted">Aucun objet — le canevas est vide, et il le dit.</p>'}</div>
        <div class="studio-group"><p class="t-label">Rappel du système</p>
        <p class="t-caption u-muted">La position est une donnée. Le cadre d’un organe ne change jamais — seul le contenu s’adapte. Une proposition ne ressemble jamais à un fait.</p></div>`;
      $$('[data-pick]', pane).forEach((b) => b.addEventListener('click', () => select('obj', b.dataset.pick)));
      return;
    }
    const k = KINDS[o.kind] || KINDS.frame;
    const rows = [];
    rows.push(`<div class="studio-group"><p class="t-label">Objet</p>
      <dl class="inspector__row"><dt>type</dt><dd>${esc(k.label)}${k.specimen ? ' <span class="a-badge">spécimen</span>' : ''}</dd></dl>
      <dl class="inspector__row"><dt>id</dt><dd class="u-mono">${esc(o.id)}</dd></dl>
      <div class="studio-row"><label for="st-f-state">état</label>
        <select class="a-select" id="st-f-state" data-f="state">${Object.entries(STATES).map(([v, s]) => `<option value="${v}"${o.state === v ? ' selected' : ''}>${s.label}</option>`).join('')}</select></div>
      <div class="studio-pair">
        <label class="a-check"><input type="checkbox" id="st-f-locked"${o.locked ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span>Verrouillé</label>
        <label class="a-check"><input type="checkbox" id="st-f-hidden"${o.hidden ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span>Masqué</label>
      </div></div>`);
    if (k.fields?.length) {
      rows.push(`<div class="studio-group"><p class="t-label">Contenu</p>${k.fields.map((f) => fieldHtml(o, f)).join('')}</div>`);
    }
    rows.push(`<div class="studio-group"><p class="t-label">Géométrie</p>
      <div class="studio-geom">
        <div class="studio-row"><label for="st-geom-x">x</label><input class="a-input" id="st-geom-x" type="number" step="4" value="${o.x}"></div>
        <div class="studio-row"><label for="st-geom-y">y</label><input class="a-input" id="st-geom-y" type="number" step="4" value="${o.y}"></div>
        <div class="studio-row"><label for="st-geom-w">l</label><input class="a-input" id="st-geom-w" type="number" step="4" min="48" value="${o.w}"></div>
        <div class="studio-row"><label for="st-geom-h">h</label><input class="a-input" id="st-geom-h" type="number" step="4" value="${o.h ?? 'auto'}" ${o.h ? '' : 'disabled'}></div>
      </div>
      <div class="studio-actions">
        <button type="button" class="a-btn a-btn--sm" id="st-layer-up">${ic('nav-arrow-right')}Monter le calque</button>
        <button type="button" class="a-btn a-btn--sm" id="st-layer-down">${ic('nav-back')}Descendre le calque</button>
      </div></div>`);
    rows.push(`<div class="studio-group"><p class="t-label">Provenance</p>
      <div class="studio-row"><label for="st-f-src">source</label><input class="a-input" id="st-f-src" type="text" value="${esc(o.source)}" placeholder="d’où vient cet objet"></div>
      <div class="studio-row"><label for="st-f-note">note</label><input class="a-input" id="st-f-note" type="text" value="${esc(o.note)}" placeholder="ce qui reste à établir"></div></div>`);
    rows.push(`<div class="studio-group"><div class="studio-actions">
      <button type="button" class="a-btn a-btn--sm" id="st-dup">${ic('mem-bookmark')}Dupliquer</button>
      <button type="button" class="a-btn a-btn--sm a-btn--danger" id="st-del">${ic('nav-close')}Supprimer</button></div>
      ${k.specimen ? '<p class="t-caption u-muted">Spécimen du chapitre 18 : contenu d’illustration du système, à remplacer avant tout usage réel.</p>' : ''}</div>`);
    pane.innerHTML = rows.join('');
    bindInspector(pane, o, null);
  }

  function fieldHtml(o, f) {
    const id = `st-f-${f.name}`;
    const hint = f.hint ? `<span class="a-field__hint">${esc(f.hint)}</span>` : '';
    if (f.type === 'select') {
      return `<div class="studio-row"><label for="${id}">${esc(f.label)}</label><select class="a-select" id="${id}" data-f="${f.name}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${String(f.get(o)) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
    }
    if (f.type === 'check') {
      return `<label class="a-check"><input type="checkbox" id="${id}" data-f="${f.name}"${f.get(o) ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span>${esc(f.label)}</label>`;
    }
    if (f.type === 'textarea' || f.type === 'lines') {
      return `<div class="studio-row" style="grid-template-columns:minmax(0,1fr)"><label for="${id}">${esc(f.label)}</label><textarea class="a-textarea" id="${id}" data-f="${f.name}" rows="4">${esc(f.get(o))}</textarea>${hint}</div>`;
    }
    if (f.type === 'number') {
      return `<div class="studio-row"><label for="${id}">${esc(f.label)}</label><input class="a-input" id="${id}" data-f="${f.name}" type="number" min="${f.min}" max="${f.max}" value="${num(f.get(o), 0)}"></div>`;
    }
    return `<div class="studio-row"><label for="${id}">${esc(f.label)}</label><input class="a-input" id="${id}" data-f="${f.name}" type="text" value="${esc(f.get(o))}">${hint}</div>`;
  }

  function relationInspector(r) {
    return `<div class="studio-group"><p class="t-label">Relation</p>
      <dl class="inspector__row"><dt>id</dt><dd class="u-mono">${esc(r.id)}</dd></dl>
      <dl class="inspector__row"><dt>de</dt><dd>${esc(objTitle(objById(r.from) || {}) || objById(r.from)?.id || '?')}</dd></dl>
      <dl class="inspector__row"><dt>vers</dt><dd>${esc(objTitle(objById(r.to) || {}) || objById(r.to)?.id || '?')}</dd></dl>
      <div class="studio-row"><label for="st-f-rlabel">nom</label><input class="a-input" id="st-f-rlabel" type="text" value="${esc(r.label)}" placeholder="intervient sur, illustre, suit…"></div>
      <div class="studio-row"><label for="st-f-rstate">état</label><select class="a-select" id="st-f-rstate">
        <option value="proposed"${r.state === 'proposed' ? ' selected' : ''}>Proposé</option>
        <option value="confirmed"${r.state === 'confirmed' ? ' selected' : ''}>Confirmé</option></select></div></div>
      <div class="studio-group"><div class="studio-actions"><button type="button" class="a-btn a-btn--sm a-btn--danger" id="st-del">${ic('nav-close')}Supprimer</button></div>
      <p class="t-caption u-muted">Une relation proposée reste tiretée tant qu’un humain ne l’a pas confirmée.</p></div>`;
  }

  function bindInspector(pane, o, r) {
    if (o) {
      const k = KINDS[o.kind] || KINDS.frame;
      $('#st-f-state', pane)?.addEventListener('change', (e) => { snapshot(); o.state = e.target.value; changed(); });
      $('#st-f-locked', pane)?.addEventListener('change', (e) => { snapshot(); o.locked = e.target.checked; changed(); });
      $('#st-f-hidden', pane)?.addEventListener('change', (e) => { snapshot(); o.hidden = e.target.checked; changed(); });
      for (const f of k.fields || []) {
        const el = $(`#st-f-${f.name}`, pane);
        if (!el) continue;
        el.addEventListener('change', () => {
          snapshot();
          f.set(o, el.type === 'checkbox' ? el.checked : el.value);
          changed();
        });
      }
      ['x', 'y', 'w', 'h'].forEach((key) => {
        const el = $(`#st-geom-${key}`, pane);
        if (!el || el.disabled) return;
        el.addEventListener('change', () => {
          snapshot();
          const v = Math.round(num(el.value, o[key] || 0));
          if (key === 'x') o.x = v;
          if (key === 'y') o.y = v;
          if (key === 'w') o.w = clamp(v, 48, 2048);
          if (key === 'h') o.h = clamp(v, 48, 4096);
          changed();
        });
      });
      $('#st-layer-up', pane)?.addEventListener('click', () => moveLayer(1));
      $('#st-layer-down', pane)?.addEventListener('click', () => moveLayer(-1));
      $('#st-dup', pane)?.addEventListener('click', duplicateSelection);
      $('#st-f-src', pane)?.addEventListener('change', (e) => { snapshot(); o.source = e.target.value; saveSoon(); });
      $('#st-f-note', pane)?.addEventListener('change', (e) => { snapshot(); o.note = e.target.value; saveSoon(); });
    }
    if (r) {
      $('#st-f-rlabel', pane)?.addEventListener('change', (e) => { snapshot(); r.label = e.target.value; changed(); });
      $('#st-f-rstate', pane)?.addEventListener('change', (e) => { snapshot(); r.state = e.target.value; changed(); });
    }
    $('#st-del', pane)?.addEventListener('click', deleteSelection);
  }

  /* ══════════════════════════════════════════════════════════
     NOEMA — propositions locales, décisions humaines
     ══════════════════════════════════════════════════════════ */
  let noemaTimer = 0;
  function refreshNoema() {
    if (noemaTimer) clearTimeout(noemaTimer);
    noemaTimer = setTimeout(() => { noemaTimer = 0; renderNoema(); }, 250);
  }

  function computeProps() {
    const out = [];
    const W = pageW(), H = pageH();
    for (const o of doc.objects) {
      if (o.hidden) continue;
      const t = objTitle(o);
      if (!t && !KINDS[o.kind]?.specimen) {
        out.push({
          key: `unnamed:${o.id}`, severity: 'accent', rule: 'nom accessible',
          message: `« ${KINDS[o.kind]?.label || o.kind} » sans nom`,
          detail: 'Un objet sans nom est un objet que ni un lecteur d’écran ni un agent ne peuvent désigner.',
          action: { kind: 'focus-title', id: o.id },
        });
      }
      if (o.x < 0 || o.y < 0 || o.x + o.w > W) {
        out.push({
          key: `offpage:${o.id}`, severity: 'warning', rule: 'bornes de page',
          message: `« ${t || o.id} » dépasse la page`,
          detail: 'Le placement sort des bornes du format courant.',
          action: { kind: 'clamp', id: o.id },
        });
      } else if (W > o.w + 48 && (o.x < STOP || o.y < STOP || o.x + o.w > W - STOP)) {
        out.push({
          key: `offsafe:${o.id}`, severity: 'info', rule: 'zone sûre',
          message: `« ${t || o.id} » hors zone sûre`,
          detail: 'La marge du profil place le contenu à 24 px du bord ; la zone sûre existe pour être respectée — ou assumée.',
          action: { kind: 'safe', id: o.id },
        });
      }
      if ((o.x % STOP !== 0 || o.y % STOP !== 0) && view.snap) {
        out.push({
          key: `grid:${o.id}`, severity: 'info', rule: 'STOP 24',
          message: `« ${t || o.id} » hors grille`,
          detail: 'Le magnétisme est actif : cette position est un choix manuel. L’aligner sur la grille rend le rythme lisible.',
          action: { kind: 'grid', id: o.id },
        });
      }
    }
    for (let i = 0; i < doc.objects.length; i++) {
      for (let j = i + 1; j < doc.objects.length; j++) {
        const a = doc.objects[i], b = doc.objects[j];
        if (a.hidden || b.hidden) continue;
        const hA = measureH(a) || null, hB = measureH(b) || null;
        if (!hA || !hB) continue; /* sans moteur de mise en page, on ne devine pas */
        const contained = b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w + 2 && b.y + hB <= a.y + hA + 2;
        if (contained) continue;
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + hA, b.y + hB) - Math.max(a.y, b.y);
        if (ox > 8 && oy > 8 && ox * oy > 0.2 * Math.min(a.w * hA, b.w * hB)) {
          out.push({
            key: `overlap:${a.id}:${b.id}`, severity: 'warning', rule: 'recouvrement',
            message: `« ${objTitle(a) || a.id} » et « ${objTitle(b) || b.id} » se recouvrent`,
            detail: 'Un recouvrement partiel se lit comme une erreur de pose, pas comme une intention.',
            action: { kind: 'separate', id: b.id, other: a.id, hA },
          });
        }
      }
    }
    const seen = new Map();
    for (const o of doc.objects) {
      const sig = `${o.kind}|${objTitle(o)}|${o.x}|${o.y}`;
      if (seen.has(sig)) {
        out.push({
          key: `dup:${o.id}`, severity: 'info', rule: 'doublon',
          message: `« ${objTitle(o) || o.id} » existe en double exemplaire`,
          detail: 'Deux fois le même objet au même endroit : l’un des deux n’a pas de fonction.',
          action: { kind: 'dedup', id: o.id },
        });
      }
      seen.set(sig, o);
    }
    for (const r of doc.relations) {
      if (!r.label) {
        out.push({
          key: `relname:${r.id}`, severity: 'info', rule: 'relation nommée',
          message: 'Une relation sans nom',
          detail: 'Le lien existe, son sens non. Nommer une relation, c’est la rendre vérifiable.',
          action: { kind: 'focus-relation', id: r.id },
        });
      }
    }
    return out.filter((p) => !dismissed.has(p.key));
  }

  function applyProposition(p) {
    const o = objById(p.action?.id);
    switch (p.action?.kind) {
      case 'clamp': {
        if (!o) return false;
        snapshot();
        o.x = clamp(stopRound(o.x), 0, Math.max(0, pageW() - o.w));
        o.y = clamp(stopRound(o.y), 0, pageH() - 48);
        break;
      }
      case 'safe': {
        if (!o) return false;
        snapshot();
        o.x = clamp(o.x, STOP, Math.max(STOP, pageW() - STOP - o.w));
        o.y = clamp(o.y, STOP, Math.max(STOP, pageH() - STOP - 48));
        break;
      }
      case 'grid': {
        if (!o) return false;
        snapshot();
        o.x = stopRound(o.x); o.y = stopRound(o.y);
        break;
      }
      case 'separate': {
        if (!o) return false;
        snapshot();
        o.y = stopRound((objById(p.action.other)?.y || 0) + (p.action.hA || 120) + STOP);
        o.x = stopRound(o.x);
        break;
      }
      case 'dedup': {
        if (!o) return false;
        snapshot();
        o.x += STOP; o.y += STOP;
        break;
      }
      case 'focus-title': {
        setTab('inspect');
        const el = $('#st-pane-inspect [data-f="title"], #st-pane-inspect [data-f="text"], #st-pane-inspect [data-f="label"]');
        el?.focus();
        return true;
      }
      case 'focus-relation': {
        setTab('inspect');
        $('#st-f-rlabel')?.focus();
        return true;
      }
      default: return false;
    }
    changed();
    return true;
  }

  function decide(key, prop, accepted) {
    dismissed.add(key);
    let applied = false;
    if (accepted) applied = applyProposition(prop);
    journal.unshift({ at: new Date(), prop, decision: accepted ? (applied ? 'acceptée' : 'acceptée · action indisponible') : 'refusée', actor: 'opérateur local' });
    if (journal.length > 20) journal.pop();
    renderNoema();
    if (accepted && applied) toast('Proposition appliquée', prop.message, 'success');
  }

  function renderNoema() {
    const pane = $('#st-pane-noema');
    if (!pane) return;
    const props = computeProps();
    const badge = $('#st-noema-count');
    if (badge) { badge.textContent = String(props.length); badge.hidden = props.length === 0; }
    const rows = props.slice(0, 12).map((p) => `
      <div class="studio-prop" data-severity="${p.severity}">
        <div class="l-row l-row--between"><span class="t-label">${esc(p.rule)}</span><span class="nstate" data-state="proposed">${ic('noe-proposed', 'a-ic a-ic--state')}Proposition</span></div>
        <p class="t-body-sm u-strong">${esc(p.message)}</p>
        <p class="t-caption u-muted">${esc(p.detail)}</p>
        <div class="studio-prop__actions">
          <button type="button" class="a-btn a-btn--sm a-btn--primary" data-accept="${esc(p.key)}">Appliquer</button>
          <button type="button" class="a-btn a-btn--sm" data-refuse="${esc(p.key)}">Refuser</button>
        </div></div>`).join('');
    const jr = journal.map((j) => `
      <div class="studio-journal__row"><time>${String(j.at.getHours()).padStart(2, '0')}:${String(j.at.getMinutes()).padStart(2, '0')}</time>
      <span>${esc(j.decision)} — ${esc(j.prop.message)}</span></div>`).join('');
    pane.innerHTML = `
      <div class="studio-group"><div class="l-row l-row--between"><p class="t-label">Propositions</p><span class="a-badge${props.length ? ' a-badge--accent' : ''}">${props.length}</span></div>
      <p class="t-caption u-muted">Moteur local. NOEMA propose, l’humain dispose : rien n’est appliqué sans décision explicite, chaque décision porte son acteur.</p>
      ${props.length ? rows : '<p class="t-body-sm u-muted">Aucune proposition en attente — ce n’est pas un vide, c’est un état.</p>'}</div>
      <div class="studio-group"><p class="t-label">Journal des décisions</p>
      <div class="studio-journal">${jr || '<p class="t-caption u-muted">Aucune décision encore.</p>'}</div></div>`;
    $$('[data-accept]', pane).forEach((b) => b.addEventListener('click', () => {
      const p = props.find((x) => x.key === b.dataset.accept);
      if (p) decide(p.key, p, true);
    }));
    $$('[data-refuse]', pane).forEach((b) => b.addEventListener('click', () => {
      const p = props.find((x) => x.key === b.dataset.refuse);
      if (p) decide(p.key, p, false);
    }));
  }

  /* Présence du serveur de boucle : affichée, jamais supposée. */
  async function checkServer() {
    const el = $('#st-noema-badge');
    if (typeof fetch !== 'function') { if (el) el.textContent = 'NOEMA local · moteur intégré'; return; }
    try {
      const res = await fetch('/api/state', { headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (el) el.textContent = `NOEMA en ligne · ${data?.runtime?.mode || data?.mode || 'serveur'}`;
    } catch {
      if (el) el.textContent = 'NOEMA local · moteur intégré';
    }
  }

  /* ══════════════════════════════════════════════════════════
     STUDIO QA — le module du système, appliqué à la composition
     ══════════════════════════════════════════════════════════ */
  function runAudit() {
    const issues = [];
    for (const o of doc.objects) {
      const t = objTitle(o);
      if (!t && !KINDS[o.kind]?.specimen) issues.push(['FOCUS', `${KINDS[o.kind]?.label || o.kind} sans nom accessible (${o.id})`]);
      if (o.x % 4 !== 0 || o.y % 4 !== 0) issues.push(['ALIGNMENT', `« ${t || o.id} » posé hors des multiples de 4`]);
      if (o.x < 0 || o.y < 0 || o.x + o.w > pageW()) issues.push(['OVERFLOW', `« ${t || o.id} » sort des bornes de la page`]);
      const el = pageEl.querySelector(`.studio-obj[data-id="${o.id}"]`);
      if (el && typeof el.getBoundingClientRect === 'function') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.width < 24 || r.height < 24)) issues.push(['FOCUS', `cible « ${t || o.id} » plus petite que 24 px`]);
      }
    }
    for (const r of doc.relations) if (!r.label) issues.push(['HIERARCHY', `relation ${r.id} sans nom`]);
    let live = null;
    if (window.AIME_AUDIT?.auditLive) {
      try { live = window.AIME_AUDIT.auditLive(document); } catch { live = null; }
    }
    lastAudit = {
      at: new Date().toISOString(),
      objects: doc.objects.length,
      issues: issues.map(([family, message]) => ({ family, message })),
      live: live ? { geometry: live.geometry.length, targets: live.targets.length } : null,
    };
    renderQA();
    toast('Audit exécuté', issues.length ? `${issues.length} écart(s) mesuré(s).` : 'Aucun écart mesuré.', issues.length ? 'warning' : 'success');
  }

  function renderQA() {
    const pane = $('#st-pane-qa');
    if (!pane) return;
    const rows = lastAudit
      ? lastAudit.issues.map((i) => `<div class="studio-qa-row"><span class="a-badge">${esc(i.family)}</span><span>${esc(i.message)}</span></div>`).join('') ||
        '<p class="t-body-sm u-muted">Aucun écart mesuré sur cette composition.</p>'
      : '<p class="t-caption u-muted">Lancez l’audit pour mesurer la composition ouverte.</p>';
    const density = lastAudit ? (lastAudit.issues.length / Math.max(1, lastAudit.objects)).toFixed(2) : null;
    pane.innerHTML = `
      <div class="studio-group"><div class="studio-actions"><button type="button" class="a-btn a-btn--sm a-btn--primary" id="st-run-qa">${ic('prf-shield')}Auditer la composition</button></div>
      ${lastAudit ? `<p class="t-caption u-muted">Densité : ${density} écart(s) par objet · ${lastAudit.issues.length} sur ${lastAudit.objects} objet(s) · mesuré ${esc(lastAudit.at.slice(0, 16).replace('T', ' '))}.</p>` : ''}
      <p class="t-caption u-muted">L’audit statique du système (<span class="u-mono">npm run qa</span>) porte sur ce logiciel lui-même ; cet onglet juge la composition ouverte. Les mesures géométriques demandent un navigateur réel — sans moteur de mise en page, elles ne sont pas devinées.</p></div>
      <div class="studio-group"><p class="t-label">Écarts</p>${rows}</div>
      <div class="studio-group"><p class="t-label">Audit vivant (système)</p>
      ${lastAudit?.live
        ? `<p class="t-body-sm">${lastAudit.live.geometry} débordement(s), ${lastAudit.live.targets} cible(s) trop petite(s) — via <span class="u-mono">auditLive()</span>.</p>`
        : '<p class="t-caption u-muted">Module d’audit vivant indisponible dans ce contexte — il n’est pas simulé.</p>'}</div>`;
    $('#st-run-qa', pane)?.addEventListener('click', runAudit);
  }

  /* ══════════════════════════════════════════════════════════
     DIRECTION (chapitre 21 dans le Studio)
     ══════════════════════════════════════════════════════════ */
  function renderDirection() {
    const pane = $('#st-pane-dir');
    if (!pane) return;
    pane.innerHTML = `
      <div class="studio-group"><p class="t-label">Thème</p><div class="studio-actions">
        <button type="button" class="studio-chip" id="st-dir-dark" aria-pressed="${prefs.theme === 'dark'}">Sombre</button>
        <button type="button" class="studio-chip" id="st-dir-light" aria-pressed="${prefs.theme === 'light'}">Clair</button></div></div>
      <div class="studio-group"><p class="t-label">Densité</p><div class="studio-actions">
        ${['normal', 'compact', 'touch'].map((d) => `<button type="button" class="studio-chip" data-dir-density="${d}" aria-pressed="${prefs.density === d}">${d === 'normal' ? 'Normale' : d === 'compact' ? 'Compacte' : 'Tactile'}</button>`).join('')}</div></div>
      <div class="studio-group"><p class="t-label">Mouvement</p><div class="studio-actions">
        <button type="button" class="studio-chip" id="st-dir-motion" aria-pressed="${prefs.motion === 'reduced'}">${prefs.motion === 'reduced' ? 'Réduit' : 'Complet'}</button></div></div>
      <div class="studio-group"><p class="t-label">Aller plus loin</p>
        <p class="t-caption u-muted">La direction artistique complète — step d’accent dans la rampe fuchsia, niveau d’arrondi, brief agent, <span class="u-mono">tokens.custom.css</span> — vit dans le chapitre 21.</p>
        <a class="a-btn a-btn--sm" href="direction.html">${ic('set-sliders')}Ouvrir la direction artistique</a></div>
      <div class="studio-group"><p class="t-label">Document</p>
        <div class="studio-actions"><button type="button" class="a-btn a-btn--sm a-btn--danger" id="st-newdoc">${ic('nav-close')}Nouveau document</button></div>
        <p class="t-caption u-muted">Le document vit dans ce navigateur. L’export le transmet sans rien déplacer.</p></div>`;
    $('#st-dir-dark', pane)?.addEventListener('click', () => { prefs.theme = 'dark'; applyPrefs(); });
    $('#st-dir-light', pane)?.addEventListener('click', () => { prefs.theme = 'light'; applyPrefs(); });
    $$('[data-dir-density]', pane).forEach((b) => b.addEventListener('click', () => { prefs.density = b.dataset.dirDensity; applyPrefs(); }));
    $('#st-dir-motion', pane)?.addEventListener('click', () => { prefs.motion = prefs.motion === 'reduced' ? 'full' : 'reduced'; applyPrefs(); });
    $('#st-newdoc', pane)?.addEventListener('click', () => {
      const sure = typeof window.confirm === 'function' ? window.confirm('Vider le canevas et repartir d’un document neuf ?') : false;
      if (!sure) return;
      snapshot();
      doc.name = 'Composition sans titre';
      doc.format = 'a4';
      doc.cols = '';
      doc.objects = [];
      doc.relations = [];
      doc.seq = 1;
      selection = null;
      const nameEl = $('#st-docname');
      if (nameEl) nameEl.value = doc.name;
      const fmtSel = $('#st-format'), colsSel = $('#st-cols');
      if (fmtSel) fmtSel.value = doc.format;
      if (colsSel) colsSel.value = '';
      applyCols();
      changed();
      toast('Nouveau document', '', 'accent');
    });
  }

  /* ══════════════════════════════════════════════════════════
     EXPORT — brief agent, projection HTML, document JSON
     ══════════════════════════════════════════════════════════ */
  function exportObjectMarkup(o, pad) {
    const k = KINDS[o.kind] || KINDS.frame;
    const inner = k.render(o);
    const style = `--a-x:${o.x};--a-y:${o.y};--a-w:${o.w};${o.h ? `--a-h:${o.h};` : ''}`;
    return `${pad}<div class="sx-obj${k.auto ? ' sx-obj--auto' : ''}" style="${style}" data-kind="${esc(o.kind)}" data-state="${esc(o.state || 'confirmed')}">\n${pad}  ${inner.replace(/\n/g, `\n${pad}  `)}\n${pad}</div>\n`;
  }

  function exportHtml() {
    const objs = doc.objects.map((o) => exportObjectMarkup(o, '      ')).join('');
    const rels = doc.relations.map((r) => {
      const a = objById(r.from), b = objById(r.to);
      if (!a || !b) return '';
      const x1 = a.x + a.w, y1 = a.y + 48, x2 = b.x, y2 = b.y + 48;
      const dx = Math.max(48, Math.abs(x2 - x1) / 2);
      return `      <path class="clink${r.state === 'proposed' ? ' is-proposed' : ''}" d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}"><title>${esc(r.label || 'relation sans nom')}</title></path>\n`;
    }).join('');
    const f = fmt();
    const H = pageH();
    return `<!doctype html>
<html lang="fr" data-aime-theme="${prefs.theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(doc.name)} — projection AIME</title>
<!-- Projection générée par AIME Studio : à servir depuis design-system/ pour que
     les feuilles du système se résolvent. Aucune classe hors système n’est
     consommée, hors la coquille de position (.sx-obj), qui ne porte que des
     variables de donnée. -->
<link rel="stylesheet" href="tokens/tokens.css">
<link rel="stylesheet" href="styles/foundations.css">
<link rel="stylesheet" href="styles/layout.css">
<link rel="stylesheet" href="styles/components.css">
<link rel="stylesheet" href="styles/aime.css">
<link rel="stylesheet" href="styles/noema.css">
<link rel="stylesheet" href="styles/patterns.css">
<link rel="stylesheet" href="styles/dataviz.css">
<style>
body { margin: 0; padding: var(--aime-space-6); background: var(--aime-color-background); color: var(--aime-color-text); }
.sx-stage {
  position: relative; margin: auto; max-width: ${f.w}px; aspect-ratio: ${f.ratio[0]} / ${f.ratio[1]};
  border: var(--aime-border-default); border-radius: var(--aime-radius-large);
  background: var(--aime-color-surface-elevated); overflow: hidden;
}
.sx-obj { position: absolute; left: calc(var(--a-x, 0) * 1px); top: calc(var(--a-y, 0) * 1px); width: calc(var(--a-w, 240) * 1px); }
.sx-obj--auto { width: auto; max-width: calc(var(--a-w, 240) * 1px); }
.sx-obj[data-state='proposed'] .ucard { border-style: dashed; border-color: var(--aime-color-accent); }
.sx-links { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
</style>
</head>
<body>
  <main class="sx-stage" aria-label="${esc(doc.name)}">
    <svg class="sx-links" viewBox="0 0 ${f.w} ${H}" aria-hidden="true">
${rels}    </svg>
${objs}  </main>
</body>
</html>
`;
  }

  function exportJson() {
    return JSON.stringify({
      version: 1,
      tool: { name: 'AIME Studio', system: 'AIME DESIGN SYSTEM V1' },
      generated: new Date().toISOString(),
      name: doc.name,
      format: doc.format,
      cols: doc.cols,
      theme: prefs.theme,
      density: prefs.density,
      motion: prefs.motion,
      objects: doc.objects,
      relations: doc.relations,
      audit: lastAudit,
    }, null, 2);
  }

  function exportBrief() {
    const f = fmt();
    const lines = [];
    lines.push(`# ${doc.name} — brief de composition (AIME Studio)`);
    lines.push('');
    lines.push(`Généré le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} par AIME Studio sur AIME DESIGN SYSTEM V1.`);
    lines.push('');
    lines.push('## Intentions posées');
    lines.push(`- Format de page : ${f.label} (${f.w} × ${pageH()} px, ratios du système).`);
    lines.push(`- Colonnes : ${doc.cols || `profil (${COLS_BY_FORMAT[doc.format] || 12})`} ; magnétisme STOP 24 ${view.snap ? 'actif' : 'inactif'}.`);
    lines.push(`- Direction : thème ${prefs.theme === 'dark' ? 'sombre' : 'clair'}, densité ${prefs.density}, mouvement ${prefs.motion === 'reduced' ? 'réduit' : 'complet'}.`);
    lines.push('');
    lines.push('## Règles du système appliquées par construction');
    lines.push('- Aucune couleur littérale : seuls les rôles (--aime-color-*) sont consommés.');
    lines.push('- Typographie par rôles (neuf), espacement sur l’échelle fermée, positions en multiples de 4 / STOP 24.');
    lines.push('- Les organes gardent leur cadre canonique ; une proposition reste visuellement distincte d’un fait.');
    lines.push('- Les absences sont nommées (média sans source, inconnues) — jamais simulées.');
    lines.push('');
    lines.push('## Manifeste des objets');
    if (!doc.objects.length) lines.push('- (aucun objet — le document est vide, et il le dit.)');
    for (const o of doc.objects) {
      const t = objTitle(o);
      lines.push(`- ${KINDS[o.kind]?.label || o.kind}${t ? ` « ${t} »` : ' (sans nom)'} — ${o.id} · x ${o.x}, y ${o.y}, l ${o.w}${o.state !== 'confirmed' ? ` · état ${STATES[o.state]?.label || o.state}` : ''}${o.source ? ` · source ${o.source}` : ''}`);
    }
    if (doc.relations.length) {
      lines.push('');
      lines.push('## Relations');
      for (const r of doc.relations) {
        const a = objById(r.from), b = objById(r.to);
        lines.push(`- ${a ? objTitle(a) || a.id : '?'} → ${b ? objTitle(b) || b.id : '?'}${r.label ? ` : ${r.label}` : ' (sans nom)'} · ${r.state === 'proposed' ? 'proposée' : 'confirmée'}`);
      }
    }
    if (lastAudit) {
      lines.push('');
      lines.push('## Dernier audit de la composition');
      lines.push(`- ${lastAudit.issues.length} écart(s) pour ${lastAudit.objects} objet(s) — densité ${(lastAudit.issues.length / Math.max(1, lastAudit.objects)).toFixed(2)}.`);
      if (lastAudit.live) lines.push(`- Audit vivant : ${lastAudit.live.geometry} débordement(s), ${lastAudit.live.targets} cible(s) trop petite(s).`);
    }
    lines.push('');
    lines.push('## Reprendre le document');
    lines.push('- Ouvrir design-system/studio.html, tiroir Exporter, coller le JSON puis « Charger ».');
    lines.push('- Ou servir design-system/ et ouvrir la projection .html jointe.');
    return lines.join('\n') + '\n';
  }

  function renderExports() {
    const b = $('#st-out-brief'), h = $('#st-out-html'), j = $('#st-out-json');
    if (b) b.value = exportBrief();
    if (h) h.value = exportHtml();
    if (j) j.value = exportJson();
  }
  function openExport() { renderExports(); $('#st-export-open')?.click(); }

  $('#st-export-open')?.addEventListener('click', () => setTimeout(renderExports, 30));
  $('#st-copy-brief')?.addEventListener('click', () => copyText($('#st-out-brief')?.value || '', 'Brief agent copié'));
  $('#st-copy-html')?.addEventListener('click', () => copyText($('#st-out-html')?.value || '', 'Projection HTML copiée'));
  $('#st-copy-json')?.addEventListener('click', () => copyText($('#st-out-json')?.value || '', 'Document JSON copié'));
  $('#st-dl-brief')?.addEventListener('click', () => saveBlob(`${slug(doc.name)}-brief.md`, $('#st-out-brief')?.value || '', 'text/markdown'));
  $('#st-dl-html')?.addEventListener('click', () => saveBlob(`${slug(doc.name)}.html`, $('#st-out-html')?.value || '', 'text/html'));
  $('#st-dl-json')?.addEventListener('click', () => saveBlob(`${slug(doc.name)}.json`, $('#st-out-json')?.value || '', 'application/json'));
  $('#st-load-json')?.addEventListener('click', () => {
    const raw = $('#st-out-json')?.value || '';
    try {
      const d = JSON.parse(raw);
      if (!Array.isArray(d.objects) || !Array.isArray(d.relations)) throw new Error('objets/relations absents');
      snapshot();
      restore(JSON.stringify({ name: d.name || 'Composition importée', format: FORMATS[d.format] ? d.format : 'a4', cols: d.cols || '', objects: d.objects, relations: d.relations, seq: d.seq || d.objects.length + 1 }));
      const nameEl = $('#st-docname'), fmtSel = $('#st-format'), colsSel = $('#st-cols');
      if (nameEl) nameEl.value = doc.name;
      if (fmtSel) fmtSel.value = doc.format;
      if (colsSel) colsSel.value = doc.cols;
      applyCols();
      changed();
      toast('Document chargé', `${doc.objects.length} objet(s), ${doc.relations.length} relation(s).`, 'success');
    } catch (err) {
      toast('Chargement refusé', `Ce texte n’est pas un document Studio lisible (${err.message}).`, 'error');
    }
  });
  const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'composition';

  /* ══════════════════════════════════════════════════════════
     BARRE DE COMMANDE
     ══════════════════════════════════════════════════════════ */
  const COMMANDS = [];
  function addCommand(group, label, icon, run, hint) { COMMANDS.push({ group, label, icon, run, hint }); }

  function buildCommands() {
    for (const item of LIB.flatMap((g) => g.items)) {
      addCommand('Ajouter', `Poser : ${item.label}`, item.libicon || item.icon, () => addObject(item.kind, null, null, JSON.parse(JSON.stringify(item.props || {}))));
    }
    addCommand('Ajouter', 'Poser : icône (navigateur)', 'med-library', () => { $('#st-libq').value = ''; filterLib(''); toast('Bibliothèque', 'Le navigateur de glyphes attend dans la colonne de gauche.', 'accent'); });
    addCommand('Composition', 'Dupliquer la sélection', 'mem-bookmark', duplicateSelection, 'Ctrl D');
    addCommand('Composition', 'Supprimer la sélection', 'nav-close', deleteSelection, 'Suppr');
    addCommand('Composition', 'Tout désélectionner', 'cmp-cursor', () => select(null), 'Échap');
    addCommand('Composition', 'Annuler', 'act-undo', undo, 'Ctrl Z');
    addCommand('Composition', 'Rétablir', 'act-undo', redo, 'Ctrl Maj Z');
    addCommand('Composition', 'Outil : sélection', 'cmp-cursor', () => setTool('select'), 'V');
    addCommand('Composition', 'Outil : texte', 'doc-document', () => setTool('text'), 'T');
    addCommand('Composition', 'Outil : cadre', 'grd-format', () => setTool('frame'), 'F');
    addCommand('Composition', 'Outil : lier', 'cmp-connect', () => setTool('link'), 'L');
    addCommand('Vue', 'Zoom : ajuster à la fenêtre', 'grd-format', () => $('#st-zoom-fit').click());
    addCommand('Vue', 'Zoom : 100 %', 'grd-ruler', () => { view.zoom = 1; applyPageGeometry(); });
    addCommand('Vue', 'Zoom : 200 %', 'grd-ruler', () => { view.zoom = 2; applyPageGeometry(); });
    addCommand('Vue', 'Basculer le magnétisme', 'cmp-move', () => $('#st-snap').click());
    addCommand('Vue', 'Basculer les cellules', 'grd-grid', () => $('#st-ov-cells').click());
    addCommand('Vue', 'Basculer les tiers', 'grd-guides', () => $('#st-ov-thirds').click());
    addCommand('Vue', 'Basculer la zone sûre', 'grd-ruler', () => $('#st-ov-safe').click());
    addCommand('Vue', 'Basculer l’origine 0,0', 'grd-snap', () => $('#st-ov-origin').click());
    addCommand('Vue', 'Afficher ou masquer la bibliothèque', 'nav-menu', () => $('#st-toggle-side').click());
    addCommand('Vue', 'Afficher ou masquer les studios', 'cmp-layers', () => $('#st-toggle-inspect').click());
    addCommand('Exporter & auditer', 'Exporter la composition', 'act-export', openExport, 'Ctrl E');
    addCommand('Exporter & auditer', 'Auditer la composition', 'prf-shield', () => { setTab('qa'); runAudit(); });
    addCommand('Exporter & auditer', 'Ouvrir le studio NOEMA', 'noe-mark', () => setTab('noema'));
    addCommand('Exporter & auditer', 'Ouvrir la direction artistique', 'set-sliders', () => setTab('dir'));
    addCommand('Exporter & auditer', 'Les 21 chapitres dans le Studio', 'doc-version', () => $('#st-map-open').click());
    addCommand('Exporter & auditer', 'Changer de thème', 'set-theme', () => $('#st-theme').click());
    renderCommandList('');
    const input = $('#st-cmd-input');
    input?.addEventListener('input', () => renderCommandList(input.value));
    input?.addEventListener('keydown', (e) => {
      const items = $$('#st-cmd-results .cmdbar__item').filter((i) => i.hidden === false);
      let index = items.findIndex((i) => i.getAttribute('aria-selected') === 'true');
      if (e.key === 'ArrowDown') { e.preventDefault(); index = Math.min(index + 1, items.length - 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); index = Math.max(index - 1, 0); }
      else if (e.key === 'Enter') { e.preventDefault(); (items[Math.max(0, index)] || items[0])?.click(); return; }
      else return;
      items.forEach((i) => i.setAttribute('aria-selected', 'false'));
      items[index]?.setAttribute('aria-selected', 'true');
      items[index]?.scrollIntoView({ block: 'nearest' });
    });
  }

  let cmdSelected = 0;
  function renderCommandList(q) {
    const host = $('#st-cmd-results');
    if (!host) return;
    const needle = q.trim().toLowerCase();
    let lastGroup = null;
    const list = COMMANDS.filter((c) => !needle || c.label.toLowerCase().includes(needle) || c.group.toLowerCase().includes(needle));
    cmdSelected = clamp(cmdSelected, 0, Math.max(0, list.length - 1));
    host.innerHTML = list.map((c, i) => {
      const head = c.group !== lastGroup ? `<p class="cmdbar__group">${esc(c.group)}</p>` : '';
      lastGroup = c.group;
      return `${head}<button type="button" class="cmdbar__item" data-cmd="${i}"${i === cmdSelected ? ' aria-selected="true"' : ''}>${ic(c.icon || 'cmp-compose')}${esc(c.label)}${c.hint ? `<kbd class="a-kbd">${esc(c.hint)}</kbd>` : ''}</button>`;
    }).join('') || '<p class="cmdbar__group">Aucun résultat</p>';
    $$('.cmdbar__item', host).forEach((b) => b.addEventListener('click', () => {
      const c = list[Number(b.dataset.cmd)];
      if (!c) return;
      c.run();
      document.querySelector('#st-cmdk [data-a-close]')?.click();
    }));
  }

  /* ══════════════════════════════════════════════════════════
     BARRE D'ÉTAT · CHARGEMENT · INIT
     ══════════════════════════════════════════════════════════ */
  function renderStatus() {
    const f = $('#st-fmt');
    if (f) f.textContent = fmt().label;
    const s = $('#st-snapstate');
    if (s) s.textContent = view.snap ? 'magnétisme STOP 24 actif' : 'magnétisme inactif';
    const info = $('#st-selinfo');
    if (info) {
      const o = selObj(), r = selRel();
      info.textContent = o ? objLabel(o) : r ? `relation ${r.label || 'sans nom'}` : '';
    }
  }

  $('#st-docname')?.addEventListener('change', (e) => { snapshot(); doc.name = e.target.value || 'Composition sans titre'; e.target.value = doc.name; changed(); });
  $('#st-undo')?.addEventListener('click', undo);
  $('#st-redo')?.addEventListener('click', redo);
  $('#st-map-open')?.addEventListener('click', () => { /* data-a-open gère l’ouverture */ });
  $('#st-cmdk-open')?.addEventListener('click', () => setTimeout(() => { $('#st-cmd-input')?.focus(); renderCommandList($('#st-cmd-input')?.value || ''); }, 30));

  function loadDoc() {
    const raw = store.get('doc', '');
    if (raw) {
      try {
        const d = JSON.parse(raw);
        doc.name = d.name || doc.name;
        doc.format = FORMATS[d.format] ? d.format : 'a4';
        doc.cols = d.cols || '';
        doc.objects = Array.isArray(d.objects) ? d.objects : [];
        doc.relations = Array.isArray(d.relations) ? d.relations : [];
        doc.seq = d.seq || doc.objects.length + 1;
      } catch { /* document local illisible : on repart d’un canevas vide, et on le dit */ }
    }
    const nameEl = $('#st-docname');
    if (nameEl) nameEl.value = doc.name;
    const fmtSel = $('#st-format');
    if (fmtSel) fmtSel.value = doc.format;
    const colsSel = $('#st-cols');
    if (colsSel) colsSel.value = doc.cols;
  }

  function init() {
    resolveIcons(document);
    loadView();
    loadDoc();
    buildCols();
    buildLibrary();
    buildCommands();
    /* état des bascules depuis la vue persistée */
    $('#st-snap')?.setAttribute('aria-pressed', view.snap ? 'true' : 'false');
    $('#st-ov-cells')?.setAttribute('aria-pressed', view.overlays.cells ? 'true' : 'false');
    $('#st-ov-thirds')?.setAttribute('aria-pressed', view.overlays.thirds ? 'true' : 'false');
    $('#st-ov-safe')?.setAttribute('aria-pressed', view.overlays.safe ? 'true' : 'false');
    $('#st-ov-origin')?.setAttribute('aria-pressed', view.overlays.origin ? 'true' : 'false');
    pageEl.dataset.showCells = String(view.overlays.cells);
    pageEl.dataset.showThirds = String(view.overlays.thirds);
    pageEl.dataset.showSafe = String(view.overlays.safe);
    pageEl.dataset.showOrigin = String(view.overlays.origin);
    $('#st-side')?.classList.toggle('is-closed', !view.sideOpen);
    $('#st-toggle-side')?.setAttribute('aria-pressed', view.sideOpen ? 'true' : 'false');
    $('#st-inspect')?.classList.toggle('is-closed', !view.inspectOpen);
    $('#st-toggle-inspect')?.setAttribute('aria-pressed', view.inspectOpen ? 'true' : 'false');
    setTab(view.tab);
    applyCols();
    applyPrefs();
    renderQA();
    changed(true);
    save(true);
    checkServer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
