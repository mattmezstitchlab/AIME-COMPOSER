/**
 * AIME-COMPOSER — page d'accueil du dépôt.
 *
 * Deux responsabilités, aucune règle métier :
 *   1. résoudre les icônes déclaratives `data-a-icon` (le châssis documentaire
 *      js/doc.js n'est pas chargé ici : l'accueil a son propre haut de page) ;
 *   2. brancher la conversation NOEMA sur la boucle (loop/server.mjs) quand
 *      elle tourne — les règles restent dans les modules de la boucle, jamais
 *      recalculées ici ; sans boucle, la conversation le dit honnêtement.
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
  const CONF = { low: 'faible', medium: 'moyenne', high: 'élevée' };

  let live = false; /* la boucle répond-elle ? */
  let runtimeMode = null; /* 'server' | 'serverless' | null — la vérité de l'hôte */

  async function api(path, opts) {
    const r = await fetch(path, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  function setStatus() {
    const b = $('#h-noema-status');
    if (!b) return;
    /* Serverless sans disque : la boucle répond, mais son monde est une
       démo réinitialisée à froid — le badge le dit au lieu de promettre
       une persistance que l'hôte ne tient pas. */
    b.textContent = live
      ? runtimeMode === 'serverless' ? 'NOEMA en ligne · démo' : 'NOEMA en ligne'
      : 'NOEMA hors ligne';
    b.title = live && runtimeMode === 'serverless'
      ? 'Monde de démonstration en mémoire, réinitialisé à froid — la persistance disque vit sur le serveur local complet.'
      : '';
    b.className = live ? 'a-badge a-badge--success' : 'a-badge';
  }

  /* ── Conversation NOEMA ──────────────────────────────────────── */
  const out = $('#h-noema-out');
  const field = $('#h-noema-text');

  function offlineNote() {
    if (!out) return;
    out.innerHTML = `<p class="t-body-sm u-muted">La boucle NOEMA n'a pas répondu depuis cet hébergement — la page reste consultable, la conversation demande le serveur de la boucle :</p>
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

  /* ── Détection de la boucle ──────────────────────────────────── */
  /* fetch est absent sous jsdom (vérification DOM) : le badge reste alors
     « hors ligne », sans erreur — la page documente déjà comment brancher. */
  if (typeof fetch === 'function') {
    api('/api/state')
      .then((d) => {
        live = true;
        runtimeMode = d.runtime?.mode || null;
        setStatus();
      })
      .catch(() => setStatus());
  } else {
    setStatus();
  }
})();
