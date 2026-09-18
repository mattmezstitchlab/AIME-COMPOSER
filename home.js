/**
 * AIME-COMPOSER — page d'accueil du dépôt.
 * Refonte de l'accueil : la porte universelle pédagogique style Manus / composer.
 *
 * Responsabilités :
 *   1. Résoudre les icônes déclaratives `data-a-icon`.
 *   2. Maintenir la préférence de thème clair / sombre.
 *   3. Gérer le bloc central style Manus :
 *      - menu « + » (Dossier local, Fichier, Lien GitHub, Coller URL, intentions prêtes) ;
 *      - sélection exclusive des pastilles de modes (Diagnostic, Médiathèque, DA, Boucle) ;
 *      - routage branché sur le réel, jamais simulé :
 *        * texte seul sans mode → conversation NOEMA (branchée sur la boucle) ;
 *        * mode DA → ouverture de design-system/direction.html ;
 *        * mode Médiathèque ou action Dossier local / Fichier → atlas/index.html?source=local (ou catalogue) ;
 *        * Lien GitHub / owner/repo → diagnostic réel (commande vérifiable) ;
 *        * URL web d'un site → annonce honnête « diagnostic de site en ligne : en préparation » (moteur EAA à venir) ;
 *        * mode non implémenté → pastille ou annonce honnête, jamais un bouton mort ;
 *   4. Surveiller l'état de la boucle NOEMA (/api/state) et mettre à jour
 *      les badges (« NOEMA en ligne · démo » ou « NOEMA hors ligne »).
 *
 * Script classique (defer) compatible jsdom.
 */
(function () {
  const select = (sel) => document.querySelector(sel);
  const selectAll = (sel) => document.querySelectorAll(sel);
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
  try { theme = localStorage.getItem('aime-ds-theme') || 'dark'; } catch { /* indisponible */ }
  const applyTheme = () => {
    document.documentElement.dataset.aimeTheme = theme;
    select('#h-theme')?.setAttribute('aria-label', `Thème : ${theme}. Basculer sur l'autre thème`);
  };
  applyTheme();
  select('#h-theme')?.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem('aime-ds-theme', theme); } catch { /* non persistée */ }
    applyTheme();
  });

  /* ── État de la boucle NOEMA ────────────────────────────────── */
  let live = false;
  let runtimeMode = null;

  async function api(path, opts) {
    const r = await fetch(path, opts);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    return d;
  }

  function setStatus() {
    const topBadge = select('#h-noema-status');
    const heroBadge = select('#h-hero-badge');
    const label = live
      ? runtimeMode === 'serverless' ? 'NOEMA en ligne · démo' : 'NOEMA en ligne'
      : 'NOEMA hors ligne';
    const title = live && runtimeMode === 'serverless'
      ? 'Monde de démonstration en mémoire, réinitialisé à froid — la persistance disque vit sur le serveur local complet.'
      : '';
    const cls = live ? 'a-badge a-badge--success' : 'a-badge';

    if (topBadge) {
      topBadge.textContent = label;
      topBadge.title = title;
      topBadge.className = cls;
    }
    if (heroBadge) {
      heroBadge.textContent = label;
      heroBadge.title = title;
      heroBadge.className = cls;
    }
  }

  /* ── Détection de la boucle ──────────────────────────────────── */
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

  /* ── Éléments de l'accueil ──────────────────────────────────── */
  const field = select('#h-noema-text');
  const out = select('#h-noema-out');
  const modePills = selectAll('[data-h-mode]');
  const filePicker = select('#h-file-picker');
  const folderPicker = select('#h-folder-picker');

  /* ── Gestion des modes en pastilles ─────────────────────────── */
  let activeMode = null;

  function setMode(mode) {
    if (activeMode === mode) {
      activeMode = null; // bascule désactivation
    } else {
      activeMode = mode;
    }
    modePills.forEach((p) => {
      const match = p.dataset.hMode === activeMode;
      p.setAttribute('aria-pressed', match ? 'true' : 'false');
      p.classList.toggle('is-active', match);
    });
  }

  modePills.forEach((p) => {
    p.addEventListener('click', () => {
      setMode(p.dataset.hMode);
      if (activeMode && !field.value.trim()) {
        renderModeHint(activeMode);
      }
    });
  });

  function renderModeHint(mode) {
    if (!out) return;
    if (mode === 'diag') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Diagnostic actif</p>
        <p>Collez un lien GitHub (<span class="u-strong">https://github.com/owner/repo</span> ou <span class="u-strong">owner/repo</span>) ou le chemin d'un dossier local pour lancer la mesure sans jamais écrire dans le projet.</p>
      </div>`;
    } else if (mode === 'media') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Médiathèque actif</p>
        <p>Cliquez sur « Lancer » pour ouvrir le catalogue universel (38 dépôts du compte) ou utilisez le « + » pour joindre un dossier local sans aucun transfert réseau.</p>
      </div>`;
    } else if (mode === 'da') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Direction artistique actif</p>
        <p>Cliquez sur « Lancer » pour régler thème, accent, rayons et densité dans l'Atelier DA et exporter le brief agent ou le CSS conforme EAA.</p>
      </div>`;
    } else if (mode === 'noema') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Boucle NOEMA actif</p>
        <p>Exprimez une intention en vos mots : mémoriser une personne, signaler une donnée manquante ou demander une action. NOEMA propose, l'humain valide.</p>
      </div>`;
    }
    resolveIcons(out);
  }

  /* ── Analyseurs d'URL et de références ───────────────────────── */
  function parseGitHub(s) {
    const trimmed = (s || '').trim();
    const m1 = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/i);
    if (m1) return { owner: m1[1], repo: m1[2].replace(/\.git$/, '') };
    const m2 = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
    if (m2 && !trimmed.includes('://') && !trimmed.includes(' ')) return { owner: m2[1], repo: m2[2].replace(/\.git$/, '') };
    return null;
  }

  function parseHttpUrl(s) {
    const trimmed = (s || '').trim();
    if (!trimmed.includes('.') || trimmed.includes(' ')) return null;
    try {
      const u = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
      if (u.hostname && u.hostname.includes('.') && !u.hostname.toLowerCase().includes('github.com')) {
        return u.href;
      }
    } catch { /* URL invalide */ }
    return null;
  }

  /* ── Menu « + » (actions et intentions) ─────────────────────── */
  document.addEventListener('click', (e) => {
    const popOpener = e.target.closest('#h-plus-btn');
    const pop = select('#h-plus-menu');
    const itemAction = e.target.closest('[data-h-action]');
    const itemIntent = e.target.closest('[data-h-intent]');

    if (itemAction) {
      const act = itemAction.dataset.hAction;
      if (pop) pop.hidden = true;
      select('#h-plus-btn')?.setAttribute('aria-expanded', 'false');

      if (act === 'folder') {
        if (folderPicker) folderPicker.click();
        else navigateTo('atlas/index.html?source=local');
      } else if (act === 'file') {
        if (filePicker) filePicker.click();
        else navigateTo('atlas/index.html?source=local');
      } else if (act === 'github') {
        setMode('diag');
        if (field) {
          field.value = 'mattmezstitchlab/AIME-COMPOSER';
          field.focus();
        }
      } else if (act === 'url') {
        setMode('diag');
        if (field) {
          field.value = 'https://';
          field.focus();
        }
      }
      return;
    }

    if (itemIntent) {
      if (field) {
        field.value = itemIntent.dataset.hIntent;
        field.focus();
      }
      if (pop) pop.hidden = true;
      select('#h-plus-btn')?.setAttribute('aria-expanded', 'false');
      return;
    }
  });

  function navigateTo(url) {
    window.location.href = url;
  }

  /* Gestion des sélecteurs de fichiers réels */
  folderPicker?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const firstPath = files[0].webkitRelativePath || files[0].name;
      const rootFolder = firstPath.split('/')[0] || 'dossier local';
      if (out) {
        out.innerHTML = `<div class="noema-card noema-rail" data-certainty="confirmed">
          <div class="noema-card__head">
            <span class="noema-card__kind">${ic('com-inbox')}Dossier local sélectionné</span>
            <span class="nstate" data-state="confirmed">${ic('noe-confirmed', 'a-ic a-ic--state')}Vérifié</span>
          </div>
          <p class="noema-card__title">« ${esc(rootFolder)} » (${files.length} fichiers)</p>
          <p class="noema-card__body">Contrat Bureau universel : vos fichiers restent strictement sur votre poste. L'Atelier d'entrée universel et la Médiathèque répertorient sans transférer.</p>
          <div class="noema-card__foot">
            <a class="a-btn a-btn--sm a-btn--primary" href="atlas/index.html?source=local">${ic('med-library')}Ouvrir dans la Médiathèque locale</a>
          </div>
        </div>`;
        resolveIcons(out);
      }
    } else {
      navigateTo('atlas/index.html?source=local');
    }
  });

  filePicker?.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (out) {
        out.innerHTML = `<div class="noema-card noema-rail" data-certainty="confirmed">
          <div class="noema-card__head">
            <span class="noema-card__kind">${ic('doc-document')}Fichier prêt</span>
            <span class="nstate" data-state="confirmed">${ic('noe-confirmed', 'a-ic a-ic--state')}Vérifié</span>
          </div>
          <p class="noema-card__title">${esc(file.name)} (${Math.round(file.size / 1024)} Ko)</p>
          <p class="noema-card__body">Fichier local reconnu. La Médiathèque locale permet de le classer et de produire son brief agent sans copie concurrente.</p>
          <div class="noema-card__foot">
            <a class="a-btn a-btn--sm a-btn--primary" href="atlas/index.html?source=local">${ic('med-library')}Ouvrir la Médiathèque</a>
          </div>
        </div>`;
        resolveIcons(out);
      }
    } else {
      navigateTo('atlas/index.html?source=local');
    }
  });

  /* ── Rendu de la conversation NOEMA ─────────────────────────── */
  const KIND = {
    person: { label: 'À mémoriser', icon: 'ppl-person' },
    relation: { label: 'À relier', icon: 'rel-relation' },
    date: { label: 'Date', icon: 'time-calendar' },
    unknown: { label: 'Inconnu déclaré', icon: 'mem-card' },
    action_request: { label: 'Action demandée', icon: 'apr-approved' },
  };
  const CONF = { low: 'faible', medium: 'moyenne', high: 'élevée' };

  function offlineNote() {
    if (!out) return;
    out.innerHTML = `<p class="t-body-sm u-muted">La boucle NOEMA n'a pas répondu depuis cet hébergement — la page reste consultable, la conversation demande le serveur de la boucle :</p>
      <pre class="ds-code">node loop/server.mjs\n<i>puis recharger cette page — le badge passera « NOEMA en ligne ».</i></pre>
      <p class="t-caption u-muted">En attendant, la boucle complète — propositions, validation, mémoire, journal — s'ouvre <a class="a-text-btn" href="loop/">sur l'écran de la boucle</a>.</p>`;
  }

  function renderCandidates(d, submitted) {
    if (!out) return;
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

  /* ── ROUTAGE PRINCIPAL : LE DISPATCH DE LA PORTE ─────────────── */
  function route(dry = false) {
    if (!field || !out) return;
    const raw = (field.value || '').trim();

    // 1. Si mode Direction artistique
    if (activeMode === 'da') {
      navigateTo('design-system/direction.html');
      return;
    }

    // 2. Si mode Médiathèque
    if (activeMode === 'media') {
      navigateTo('atlas/');
      return;
    }

    // 3. Détection Lien GitHub / owner/repo
    const gh = parseGitHub(raw);
    if (gh || (activeMode === 'diag' && raw && !parseHttpUrl(raw))) {
      const owner = gh ? gh.owner : (raw.includes('/') ? raw.split('/')[0] : 'owner');
      const repo = gh ? gh.repo : (raw.includes('/') ? raw.split('/')[1] : raw);
      out.innerHTML = `<div class="noema-card noema-rail" data-certainty="confirmed">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic('prf-shield')}Diagnostic GitHub</span>
          <span class="nstate" data-state="confirmed">${ic('noe-confirmed', 'a-ic a-ic--state')}Vérifié</span>
        </div>
        <p class="noema-card__title">Cible : ${esc(owner)}/${esc(repo)}</p>
        <p class="noema-card__body">Le moteur de diagnostic mesure le projet sans y écrire. Exécutez la commande officielle dans un terminal :</p>
        <pre class="ds-code">node diagnostic/diagnose.mjs --owner ${esc(owner)} --repo ${esc(repo)}</pre>
        <p class="t-caption u-muted">La mesure relève la densité d'écarts par écran sur les 12 familles du Design System.</p>
        <div class="noema-card__foot">
          <a class="a-btn a-btn--sm" href="diagnostic/README.md">${ic('doc-document')}Documentation du diagnostic</a>
        </div>
      </div>`;
      resolveIcons(out);
      return;
    }

    // 4. Détection Lien URL d'un site en ligne
    const httpUrl = parseHttpUrl(raw);
    if (httpUrl) {
      out.innerHTML = `<div class="noema-card noema-card--alert noema-rail" data-certainty="uncertain">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic('com-alert')}Diagnostic de site en ligne</span>
          <span class="a-badge a-badge--warning">en préparation</span>
        </div>
        <p class="noema-card__title">URL détectée : ${esc(httpUrl)}</p>
        <p class="noema-card__body"><span class="u-strong">diagnostic de site en ligne : en préparation</span> (moteur EAA à venir). Le diagnostic actuel analyse les arbres de sources (HTML, React, Tailwind, Vue, Svelte) via le terminal ; le scan d'URL rendue en direct arrive avec l'axe B (moteur EAA / WCAG 2.1 AA).</p>
        <div class="noema-card__foot">
          <a class="a-text-btn" href="diagnostic/README.md"><span class="t-caption">Voir le périmètre actuel du diagnostic</span>${ic('nav-arrow-right', 'a-ic a-ic--sm')}</a>
        </div>
      </div>`;
      resolveIcons(out);
      return;
    }

    // 5. Si mode Diagnostic sans saisie
    if (activeMode === 'diag' && !raw) {
      navigateTo('diagnostic/README.md');
      return;
    }

    // 6. Si mode Boucle sans saisie
    if (activeMode === 'noema' && !raw) {
      navigateTo('loop/');
      return;
    }

    // 7. Par défaut (texte libre, intention) → Conversation NOEMA
    talk(dry);
  }

  select('#h-noema-read')?.addEventListener('click', () => route(true));
  select('#h-noema-submit')?.addEventListener('click', () => route(false));

  field?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      route(false);
    }
  });

})();
