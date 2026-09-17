/**
 * AIME-COMPOSER — page d'accueil du dépôt.
 *
 * Trois responsabilités, aucune règle métier :
 *   1. résoudre les icônes déclaratives `data-a-icon` (le châssis documentaire
 *      js/doc.js n'est pas chargé ici : l'accueil a son propre haut de page) ;
 *   2. brancher la conversation NOEMA, la Carte Universelle et la Timeline
 *      Universelle sur la boucle (loop/server.mjs) quand elle tourne — les
 *      règles restent dans les modules de la boucle, jamais recalculées ici ;
 *   3. rester lisible sans boucle : chaque démo porte un repli statique et
 *      l'indique honnêtement — une projection qui se tait plutôt que simuler.
 *
 * Script classique (defer), pas un module : la vérification DOM exécute les
 * scripts classiques avant de contrôler les icônes, donc la résolution doit
 * se faire ici et non dans un <script type="module">.
 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Icônes déclaratives ────────────────────────────────────── */
  function resolveIcons(rootEl = document) {
    const root = document.querySelector('meta[name="a-root"]')?.content || 'design-system/';
    for (const u of rootEl.querySelectorAll('use[data-a-icon]')) {
      u.setAttribute('href', `${root}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
      delete u.dataset.aIcon;
    }
  }
  resolveIcons();

  const ic = (id, cls = 'a-ic a-ic--sm') =>
    `<svg class="${cls}" aria-hidden="true" width="16" height="16"><use data-a-icon="${esc(id)}"/></svg>`;

  /* ── Thème — même clé de préférence que le châssis du Design System ── */
  const THEMES = ['dark', 'light'];
  let theme = 'dark';
  try { theme = localStorage.getItem('aime-ds-theme') || 'dark'; } catch { /* stockage indisponible */ }
  const applyTheme = () => {
    document.documentElement.dataset.aimeTheme = theme;
    $('#h-theme')?.setAttribute('aria-label', `Thème : ${theme}. Basculer sur l'autre thème`);
  };
  applyTheme();
  $('#h-theme')?.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem('aime-ds-theme', theme); } catch { /* préférence non persistée */ }
    applyTheme();
  });

  /* ── Menu « + » : une intention choisie remplit le champ ────── */
  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-h-intent]');
    if (!item) return;
    const fieldEl = $('#h-noema-text');
    if (fieldEl) {
      fieldEl.value = item.dataset.hIntent;
      fieldEl.focus();
    }
    /* Referme le menu : le popover DS se gère au clic extérieur, ici le
       choix est fait — on le replie explicitement. */
    const pop = item.closest('.a-pop');
    if (pop) {
      pop.hidden = true;
      document.querySelector(`[data-a-pop="#${pop.id}"]`)?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── Vocabulaire partagé avec l'écran de la boucle ───────────── */
  const KIND = {
    person: { label: 'À mémoriser', icon: 'ppl-person' },
    relation: { label: 'À relier', icon: 'rel-relation' },
    date: { label: 'Date', icon: 'time-calendar' },
    unknown: { label: 'Inconnu déclaré', icon: 'mem-card' },
    action_request: { label: 'Action demandée', icon: 'apr-approved' },
  };
  const STATE = {
    observed: { label: 'Observé', icon: 'noe-observed' },
    extracted: { label: 'Extrait', icon: 'noe-extracted' },
    inferred: { label: 'Déduit', icon: 'noe-inferred' },
    proposed: { label: 'Proposé', icon: 'noe-proposed' },
    confirmed: { label: 'Confirmé', icon: 'noe-confirmed' },
    superseded: { label: 'Remplacé', icon: 'noe-superseded' },
  };
  const CONF = { low: 'faible', medium: 'moyenne', high: 'élevée' };

  let live = false; /* la boucle répond-elle ? */

  async function api(path, opts) {
    const r = await fetch(path, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  function setStatus() {
    const b = $('#h-noema-status');
    if (!b) return;
    b.textContent = live ? 'NOEMA en ligne' : 'NOEMA hors ligne';
    b.className = live ? 'a-badge a-badge--success' : 'a-badge';
  }

  /* ── Conversation NOEMA ──────────────────────────────────────── */
  const out = $('#h-noema-out');
  const field = $('#h-noema-text');

  function offlineNote() {
    if (!out) return;
    out.innerHTML = `<p class="t-body-sm u-muted">La boucle NOEMA n'est pas branchée sur cet hébergement — la page reste consultable, la conversation demande le serveur de la boucle :</p>
      <pre class="ds-code">node loop/server.mjs\n<i>puis recharger cette page — le badge passera « NOEMA en ligne ».</i></pre>
      <p class="t-caption u-muted">En attendant, la boucle complète — propositions, validation, mémoire, journal — s'ouvre <a class="a-text-btn" href="loop/">sur l'écran de la boucle</a>.</p>`;
  }

  function renderCandidates(d, submitted) {
    if (!out) return;
    /* `interpret` (lecture) rend des `candidates` ; `submit` (dépôt) rend des
       `written` — des entités proposal dont le contenu vit dans
       `requested_change`. Les deux formes affichent les mêmes cartes. */
    const cands = d.candidates || (d.written || []).map((w) => ({
      kind: w.requested_change && w.requested_change.kind,
      title: (w.requested_change && w.requested_change.title) || w.title,
      body: w.requested_change && w.requested_change.body,
      confidence: w.confidence,
      evidence: w.evidence,
    }));
    const unparsed = d.unparsed || [];
    const written = d.written || [];
    const parts = [];
    for (const c of cands) {
      const k = KIND[c.kind] || { label: 'Proposition', icon: 'noe-proposed' };
      const note = c.evidence && c.evidence[0] && c.evidence[0].note;
      parts.push(`<article class="noema-card noema-rail" data-certainty="proposed">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic(k.icon)}${esc(k.label)}</span>
          <span class="nstate" data-state="proposed">${ic('noe-proposed', 'a-ic a-ic--state')}Proposé</span>
        </div>
        <p class="noema-card__title">${esc(c.title)}</p>
        <p class="noema-card__body">${esc(c.body || '')}${note ? ` <span class="u-muted">Preuve : ${esc(note)}</span>` : ''}</p>
        <div class="noema-card__foot"><span class="a-badge">confiance ${esc(CONF[c.confidence] || '—')}</span></div>
      </article>`);
    }
    if (unparsed.length) {
      parts.push(`<div class="u-pad u-surface">
        <p class="t-label">Ce que NOEMA n'a pas compris</p>
        <p class="t-body-sm">${unparsed.map((u) => `« ${esc(u)} »`).join(' ')} — jamais deviné, jamais enregistré.</p>
      </div>`);
    }
    if (submitted) {
      parts.push(`<p class="t-body-sm u-muted">${written.length
        ? `${written.length} proposition(s) déposée(s) à l'état proposed — rien n'est un fait tant qu'un humain n'a pas validé.`
        : 'Rien n\u2019a été écrit.'}
        La décision se prend <a class="a-text-btn" href="loop/">dans la boucle</a>.</p>`);
    }
    if (!cands.length && !unparsed.length) {
      parts.push('<p class="t-body-sm u-muted">NOEMA n\u2019a rien retenu de cette phrase — elle préfère se taire plutôt que deviner.</p>');
    }
    out.innerHTML = parts.join('');
    resolveIcons(out);
  }

  async function talk(dry) {
    if (!field || !out) return;
    const text = (field.value || '').trim();
    if (!text) { field.focus(); return; }
    if (!live) { offlineNote(); return; }
    out.innerHTML = '<p class="t-body-sm u-muted">NOEMA lit…</p>';
    try {
      const d = await api('/api/intend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(dry ? { text, dry_run: true } : { text, actor: 'visiteur' }),
      });
      renderCandidates(d, !dry);
      if (!dry) {
        /* Une écriture peut faire naître une proposition : on relit le monde. */
        api('/api/state').then(renderCard).catch(() => {});
      }
    } catch (e) {
      out.innerHTML = `<div class="a-state a-state--error">
        <span class="a-state__icon">${ic('com-alert', 'a-ic a-ic--lg')}</span>
        <p class="t-body-sm u-strong">NOEMA n'a pas pu lire cette phrase</p>
        <p class="t-caption u-muted">${esc(e.message)}</p></div>`;
      resolveIcons(out);
    }
  }
  $('#h-noema-read')?.addEventListener('click', () => talk(true));
  $('#h-noema-submit')?.addEventListener('click', () => talk(false));

  /* ── Carte Universelle — alimentée par la boucle ─────────────── */
  function renderCard(st) {
    const box = $('#h-card');
    if (!box) return;
    const prj = (st.entities || []).find((e) => e.kind === 'project') || (st.entities || []).find((e) => e.title);
    if (!prj) return;
    const title = prj.title || prj.display_name || prj.id;
    const state = (prj.provenance && prj.provenance.state) || 'observed';
    const stMeta = STATE[state] || STATE.observed;
    const nb = (st.observation && st.observation.proposable && st.observation.proposable.length) || 0;
    box.innerHTML = `<a class="ucard" href="loop/">
      <div class="ucard__id"><span class="ucard__mark" data-type="project">${ic('prj-project', 'a-ic')}</span>
        <span class="ucard__head"><span class="ucard__type">Projet · lu dans la boucle</span><span class="ucard__title">${esc(title)}</span>${prj.template ? `<span class="ucard__sub">${esc(prj.template)}</span>` : ''}</span></div>
      <dl class="ucard__facts"><div class="ucard__fact"><dt>Référence</dt><dd class="u-mono">${esc(prj.id)}</dd></div><div class="ucard__fact"><dt>Confiance</dt><dd>${esc(CONF[prj.confidence] || prj.confidence || '—')}</dd></div></dl>
      <div class="ucard__foot"><span class="nstate" data-state="${esc(state)}">${ic(stMeta.icon, 'a-ic a-ic--state')}${esc(stMeta.label)}</span>${nb ? `<span class="a-badge a-badge--accent">${nb} proposition(s)</span>` : ''}</div>
    </a>`;
    const cap = $('#h-card-cap');
    if (cap) cap.textContent = `Entité vivante lue via GET /api/state — « ${title} », avec ${nb} proposition(s) en attente dans l'observation courante.`;
    resolveIcons(box);
  }

  /* ── Timeline Universelle — projection vivante du flux canonique ── */
  async function loadTimeline() {
    const boxEl = $('#h-timeline');
    if (!boxEl || !live) return;
    const mode = $('#h-tl-mode')?.value || 'PLAN';
    const gran = $('#h-tl-gran')?.value || 'JOUR';
    try {
      const d = await api(`/api/timeline?mode=${encodeURIComponent(mode)}&granularity=${encodeURIComponent(gran)}`);
      const caps = (d.capabilities || []).join(' · ') || 'aucune — lecture seule';
      const ordered = [];
      for (const b of d.buckets || []) {
        for (const id of b.ids) {
          const it = (d.items || []).find((x) => x.id === id);
          if (it) ordered.push(it);
        }
      }
      boxEl.innerHTML = `<p class="t-caption u-muted">mode <span class="u-mono">${esc(d.mode)}</span> · granularité <span class="u-mono">${esc(d.granularity)}</span> · capacités actives <span class="u-mono">${esc(caps)}</span></p>
        <div class="utl l-measure-xl"><div class="utl__list">${ordered.map((it) => {
          const marker = it.late ? 'change' : (it.status === 'published' || it.status === 'completed' ? 'publication' : 'task');
          return `<article class="utl__item"${it.status === 'proposed' ? ' data-state="proposed"' : ''}>
            <span class="utl__marker" data-kind="${marker}" aria-hidden="true"></span>
            <div class="utl__row"><span class="utl__when">${esc(it.start || 'sans date')}</span><span class="utl__title">${esc(it.title)}</span>
              ${it.type ? `<span class="a-badge">${esc(it.type)}</span>` : ''}${it.late ? '<span class="a-badge a-badge--error">en retard</span>' : ''}</div>
            <p class="utl__body">statut ${esc(it.status || '—')} · source ${esc(it.source || '—')}</p></article>`;
        }).join('') || '<p class="t-body-sm u-muted">Aucun événement dans cette projection.</p>'}</div></div>`;
      const cap = $('#h-timeline-cap');
      if (cap) cap.textContent = 'Projection vivante via GET /api/timeline — changer de mode ou de granularité ré-interroge la boucle ; les actions restent dans la boucle.';
    } catch {
      /* Le repli statique reste affiché et sa légende l'indique honnêtement. */
    }
  }
  for (const sel of ['#h-tl-mode', '#h-tl-gran']) {
    $(sel)?.addEventListener('change', loadTimeline);
  }

  /* ── Détection de la boucle ──────────────────────────────────── */
  /* fetch est absent sous jsdom (vérification DOM) : on reste alors sur les
     replis statiques, sans erreur — la page documente déjà comment brancher. */
  if (typeof fetch === 'function') {
    api('/api/state')
      .then((st) => {
        live = true;
        setStatus();
        renderCard(st);
        loadTimeline();
      })
      .catch(() => setStatus());
  } else {
    setStatus();
  }
})();
