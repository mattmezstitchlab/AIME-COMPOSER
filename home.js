/**
 * AIME-COMPOSER — page d'accueil du dépôt.
 * Refonte de la porte universelle : résolveur pur + aperçu universel.
 *
 * Responsabilités :
 *   1. Résoudre les icônes déclaratives `data-a-icon`.
 *   2. Maintenir la préférence de thème clair / sombre.
 *   3. Gérer le bloc central style Manus :
 *      - menu « + » (Dossier local → atlas/?source=local, Lien GitHub, Coller URL, intentions prêtes) ;
 *      - sélection exclusive des pastilles de modes (Diagnostic, Médiathèque, Direction artistique, Boucle NOEMA)
 *        avec contrat aria-current (cf design-system/components.html) ;
 *      - résolveur pur resolveAction(raw, activeMode) -> { intention, label, destination, aperçu } ;
 *      - label du bouton Lancer contextuel via le résolveur ;
 *      - Aperçu universel (ex Lire sans écrire) : affiche l'action résolue sans naviguer ni écrire ;
 *      - Garde-fou diag : Diagnostic GitHub uniquement si parseGitHub réussit.
 *   4. Surveiller l'état de la boucle NOEMA (/api/state) et mettre à jour les badges.
 *
 * Script classique (defer) compatible jsdom.
 * Le résolveur est dupliqué dans home-resolver.mjs pour les tests Node — garder synchro.
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
  const submitBtn = select('#h-noema-submit');
  const previewBtn = select('#h-noema-read');

  /* ── Analyseurs d'URL et de références (copie de home-resolver.mjs) ───── */
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

  const LABELS = {
    da: 'Ouvrir la Direction artistique',
    media: 'Ouvrir la Médiathèque',
    diag: 'Lancer le diagnostic',
    noema: 'Proposer à NOEMA',
  };

  function resolveAction(raw, activeMode) {
    const trimmed = String(raw ?? '').trim();
    const mode = activeMode || 'noema';
    const gh = parseGitHub(trimmed);
    const httpUrl = parseHttpUrl(trimmed);
    if (gh) {
      return {
        intention: 'diag-github',
        label: LABELS.diag,
        destination: `diagnostic:github:${gh.owner}/${gh.repo}`,
        owner: gh.owner,
        repo: gh.repo,
        command: `node diagnostic/diagnose.mjs --owner ${gh.owner} --repo ${gh.repo}`,
        raw: trimmed,
        mode,
        aperçu: {
          title: `Diagnostic GitHub — ${gh.owner}/${gh.repo}`,
          body: `Le moteur de diagnostic mesure le projet sans y écrire. Commande vérifiable :`,
          command: `node diagnostic/diagnose.mjs --owner ${gh.owner} --repo ${gh.repo}`,
          destination: `diagnostic:github:${gh.owner}/${gh.repo}`,
        },
      };
    }
    if (httpUrl) {
      return {
        intention: 'diag-site',
        label: LABELS.diag,
        destination: httpUrl,
        url: httpUrl,
        raw: trimmed,
        mode,
        aperçu: {
          title: `Diagnostic de site en ligne — en préparation`,
          body: `URL détectée : ${httpUrl}. Le diagnostic de site en ligne (moteur EAA / WCAG 2.1 AA) est en préparation. Le diagnostic actuel analyse les arbres de sources via le terminal.`,
          url: httpUrl,
          destination: httpUrl,
        },
      };
    }
    if (mode === 'da') {
      return {
        intention: 'da',
        label: LABELS.da,
        destination: 'design-system/direction.html',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Direction artistique — l’atelier',
          body: `Ouvrira l’atelier DA : thème, accent, densité, rayons. Export du brief agent ou du tokens.custom.css.`,
          destination: 'design-system/direction.html',
        },
      };
    }
    if (mode === 'media') {
      return {
        intention: 'media',
        label: LABELS.media,
        destination: 'atlas/',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Médiathèque',
          body: `Ouvrira le catalogue universel (arbres git des dépôts) et le mode Dossier local — référencement sans copie, rien n’est envoyé.`,
          destination: 'atlas/',
        },
      };
    }
    if (mode === 'diag') {
      if (!trimmed) {
        return {
          intention: 'diag-empty',
          label: LABELS.diag,
          destination: 'diagnostic/README.md',
          raw: trimmed,
          mode,
          aperçu: {
            title: 'Diagnostic — choisir une cible',
            body: `Collez un lien GitHub (https://github.com/owner/repo ou owner/repo) pour lancer la mesure sans jamais écrire dans le projet.`,
            destination: 'diagnostic/README.md',
          },
        };
      }
      if (trimmed.includes(' ')) {
        return {
          intention: 'noema',
          label: LABELS.noema,
          destination: 'noema:intent',
          raw: trimmed,
          mode: 'diag',
          fallback: true,
          aperçu: {
            title: 'Intention pour NOEMA',
            body: `Texte libre détecté en mode Diagnostic — sera proposé à NOEMA (aucune commande fabriquée) : « ${trimmed} »`,
            destination: 'noema:intent',
          },
        };
      }
      return {
        intention: 'diag-invalid',
        label: LABELS.diag,
        destination: null,
        raw: trimmed,
        mode,
        error: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
        aperçu: {
          title: 'Diagnostic — format invalide',
          body: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
          error: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
          destination: null,
        },
      };
    }
    if (mode === 'noema') {
      if (!trimmed) {
        return {
          intention: 'noema-empty',
          label: LABELS.noema,
          destination: 'loop/',
          raw: trimmed,
          mode,
          aperçu: {
            title: 'Boucle NOEMA — ouvrir la boucle',
            body: `Aucune intention saisie. Ouvrira la Boucle NOEMA : NOEMA propose, vous validez.`,
            destination: 'loop/',
          },
        };
      }
      return {
        intention: 'noema',
        label: LABELS.noema,
        destination: 'noema:intent',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Intention pour NOEMA',
          body: `Sera proposé à NOEMA : « ${trimmed} » — rien n’est un fait tant qu’un humain n’a pas validé.`,
          destination: 'noema:intent',
        },
      };
    }
    if (!trimmed) {
      return {
        intention: 'noema-empty',
        label: LABELS.noema,
        destination: 'loop/',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Boucle NOEMA — ouvrir la boucle',
          body: `Aucune intention saisie. Ouvrira la Boucle NOEMA.`,
          destination: 'loop/',
        },
      };
    }
    return {
      intention: 'noema',
      label: LABELS.noema,
      destination: 'noema:intent',
      raw: trimmed,
      mode,
      aperçu: {
        title: 'Intention pour NOEMA',
        body: `Sera proposé à NOEMA : « ${trimmed} »`,
        destination: 'noema:intent',
      },
    };
  }

  // Expose pour jsdom/tests (non bloquant)
  if (typeof window !== 'undefined') {
    window.AIME = window.AIME || {};
    window.AIME.resolveAction = resolveAction;
    window.AIME.parseGitHub = parseGitHub;
    window.AIME.parseHttpUrl = parseHttpUrl;
  }

  /* ── Gestion des modes en pastilles (contrat aria-current) ───────── */
  let activeMode = 'noema';

  function syncPills() {
    modePills.forEach((p) => {
      const match = p.dataset.hMode === activeMode;
      if (match) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
      p.classList.toggle('is-active', match);
    });
  }

  function setMode(mode) {
    if (activeMode === mode) {
      // En mode NOEMA défaut, on ne désactive pas : NOEMA reste sélectionné
      // Pour les autres, un second clic revient à NOEMA (défaut explicite)
      if (mode === 'noema') return;
      activeMode = 'noema';
    } else {
      activeMode = mode;
    }
    syncPills();
    updateSubmitLabel();
    if (!field.value.trim()) {
      renderModeHint(activeMode);
    } else {
      // Si champ non vide, rafraîchit le label sans écraser la sortie
      updateSubmitLabel();
    }
  }

  // Init : NOEMA actif
  syncPills();

  modePills.forEach((p) => {
    p.addEventListener('click', () => {
      setMode(p.dataset.hMode);
    });
  });

  function renderModeHint(mode) {
    if (!out) return;
    if (mode === 'diag') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Diagnostic actif</p>
        <p>Collez un lien GitHub (<span class="u-strong">https://github.com/owner/repo</span> ou <span class="u-strong">owner/repo</span>) pour lancer la mesure sans jamais écrire dans le projet. Format attendu : <span class="u-mono">owner/repo</span>.</p>
      </div>`;
    } else if (mode === 'media') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Médiathèque actif</p>
        <p>Ouvrira le catalogue universel des dépôts ou le mode Dossier local (classer, voir et écouter ce qui vit sur votre poste — rien n’est envoyé).</p>
      </div>`;
    } else if (mode === 'da') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Direction artistique actif</p>
        <p>Ouvrira l’atelier DA : réglez thème, accent, rayons et densité, puis exportez le brief agent ou le CSS conforme EAA.</p>
      </div>`;
    } else if (mode === 'noema') {
      out.innerHTML = `<div class="ds-rule">
        <p class="ds-rule__title">Mode Boucle NOEMA actif</p>
        <p>Exprimez une intention en vos mots : mémoriser une personne, signaler une donnée manquante ou demander une action. NOEMA propose, l’humain valide.</p>
      </div>`;
    }
    resolveIcons(out);
  }

  // Hint initial
  renderModeHint(activeMode);

  function updateSubmitLabel() {
    if (!submitBtn || !field) return;
    const r = resolveAction(field.value, activeMode);
    submitBtn.textContent = r.label;
    submitBtn.setAttribute('aria-label', `${r.label} — ${r.aperçu?.destination || r.destination || ''}`);
    submitBtn.title = r.aperçu?.title || '';
  }

  function navigateTo(url) {
    window.location.href = url;
  }

  /* ── Menu « + » (actions et intentions) ─────────────────────── */
  document.addEventListener('click', (e) => {
    const pop = select('#h-plus-menu');
    const itemAction = e.target.closest('[data-h-action]');
    const itemIntent = e.target.closest('[data-h-intent]');

    if (itemAction) {
      const act = itemAction.dataset.hAction;
      if (pop) pop.hidden = true;
      select('#h-plus-btn')?.setAttribute('aria-expanded', 'false');

      if (act === 'folder') {
        // Plus de picker local ici : l'unique picker vit dans atlas/?source=local
        navigateTo('atlas/index.html?source=local');
      } else if (act === 'github') {
        setMode('diag');
        if (field) {
          field.value = 'mattmezstitchlab/AIME-COMPOSER';
          field.focus();
          updateSubmitLabel();
        }
      } else if (act === 'url') {
        setMode('diag');
        if (field) {
          field.value = 'https://';
          field.focus();
          updateSubmitLabel();
        }
      }
      return;
    }

    if (itemIntent) {
      setMode('noema');
      if (field) {
        field.value = itemIntent.dataset.hIntent;
        field.focus();
        updateSubmitLabel();
      }
      if (pop) pop.hidden = true;
      select('#h-plus-btn')?.setAttribute('aria-expanded', 'false');
      return;
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
        : 'Rien n’a été écrit.'}
        La décision se prend <a class="a-text-btn" href="loop/">dans la boucle</a>.</p>`);
    }
    if (!cands.length && !unparsed.length) {
      parts.push('<p class="t-body-sm u-muted">NOEMA n’a rien retenu de cette phrase — elle préfère se taire plutôt que deviner.</p>');
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

  /* ── Aperçu universel (ex Lire sans écrire) : jamais une navigation ───── */
  function renderPreview() {
    if (!field || !out) return;
    const raw = field.value || '';
    const r = resolveAction(raw, activeMode);
    const dest = r.aperçu?.destination || r.destination || '';
    const isDiagInvalid = r.intention === 'diag-invalid';
    const badge = isDiagInvalid ? 'a-badge a-badge--error' : 'a-badge';
    const cardKind = isDiagInvalid ? `${ic('com-alert')}Format invalide` : `${ic(r.intention.startsWith('diag') ? 'prf-shield' : r.intention === 'media' ? 'med-library' : r.intention === 'da' ? 'set-sliders' : 'noe-proposed')}Aperçu — ${esc(r.label)}`;
    const body = esc(r.aperçu?.body || '');
    const command = r.aperçu?.command ? `<pre class="ds-code">${esc(r.aperçu.command)}</pre>` : '';
    const urlLine = r.url ? `<p class="t-caption u-muted">URL : ${esc(r.url)}</p>` : '';
    const destLine = dest && dest !== 'noema:intent' ? `<p class="t-caption u-muted">Destination : <span class="u-mono">${esc(dest)}</span></p>` : '';
    const rawLine = r.raw ? `<p class="t-body-sm">« ${esc(r.raw)} »</p>` : '<p class="t-body-sm u-muted">Aucune saisie.</p>';
    out.innerHTML = `<div class="noema-card noema-rail" data-certainty="${isDiagInvalid ? 'uncertain' : 'proposed'}">
        <div class="noema-card__head">
          <span class="noema-card__kind">${cardKind}</span>
          <span class="${badge}">Aperçu</span>
        </div>
        <p class="noema-card__title">${esc(r.aperçu?.title || r.label)}</p>
        ${rawLine}
        <p class="noema-card__body">${body}</p>
        ${command}
        ${urlLine}
        ${destLine}
        <p class="t-caption u-muted">Aperçu : rien n’a été écrit ni navigué. Cliquez sur « ${esc(r.label)} » pour exécuter.</p>
      </div>`;
    resolveIcons(out);
  }

  /* ── Exécution réelle (Lancer) : navigue ou parle à NOEMA ─────────── */
  function executeAction() {
    if (!field || !out) return;
    const raw = field.value || '';
    const r = resolveAction(raw, activeMode);
    if (r.intention === 'diag-github') {
      out.innerHTML = `<div class="noema-card noema-rail" data-certainty="confirmed">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic('prf-shield')}Diagnostic GitHub</span>
          <span class="nstate" data-state="confirmed">${ic('noe-confirmed', 'a-ic a-ic--state')}Vérifié</span>
        </div>
        <p class="noema-card__title">Cible : ${esc(r.owner)}/${esc(r.repo)}</p>
        <p class="noema-card__body">Le moteur de diagnostic mesure le projet sans y écrire. Exécutez la commande officielle dans un terminal :</p>
        <pre class="ds-code">${esc(r.command)}</pre>
        <p class="t-caption u-muted">La mesure relève la densité d'écarts par écran sur les 12 familles du Design System.</p>
        <div class="noema-card__foot">
          <a class="a-btn a-btn--sm" href="diagnostic/README.md">${ic('doc-document')}Documentation du diagnostic</a>
        </div>
      </div>`;
      resolveIcons(out);
      return;
    }
    if (r.intention === 'diag-site') {
      out.innerHTML = `<div class="noema-card noema-card--alert noema-rail" data-certainty="uncertain">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic('com-alert')}Diagnostic de site en ligne</span>
          <span class="a-badge a-badge--warning">en préparation</span>
        </div>
        <p class="noema-card__title">URL détectée : ${esc(r.url)}</p>
        <p class="noema-card__body"><span class="u-strong">diagnostic de site en ligne : en préparation</span> (moteur EAA à venir). Le diagnostic actuel analyse les arbres de sources (HTML, React, Tailwind, Vue, Svelte) via le terminal ; le scan d'URL rendue en direct arrive avec l'axe B (moteur EAA / WCAG 2.1 AA).</p>
        <div class="noema-card__foot">
          <a class="a-text-btn" href="diagnostic/README.md"><span class="t-caption">Voir le périmètre actuel du diagnostic</span>${ic('nav-arrow-right', 'a-ic a-ic--sm')}</a>
        </div>
      </div>`;
      resolveIcons(out);
      return;
    }
    if (r.intention === 'diag-invalid') {
      out.innerHTML = `<div class="noema-card noema-rail" data-certainty="uncertain">
        <div class="noema-card__head">
          <span class="noema-card__kind">${ic('com-alert')}Format invalide</span>
          <span class="a-badge a-badge--error">à corriger</span>
        </div>
        <p class="noema-card__title">${esc(r.error)}</p>
        <p class="noema-card__body">Exemple valide : <span class="u-mono">mattmezstitchlab/AIME-COMPOSER</span> ou <span class="u-mono">https://github.com/owner/repo</span>. Sinon, exprimez votre intention pour NOEMA.</p>
        <p class="t-caption u-muted">Saisie : « ${esc(r.raw)} »</p>
      </div>`;
      resolveIcons(out);
      return;
    }
    if (r.intention === 'diag-empty') {
      navigateTo(r.destination);
      return;
    }
    if (r.intention === 'da') {
      navigateTo(r.destination);
      return;
    }
    if (r.intention === 'media') {
      navigateTo(r.destination);
      return;
    }
    if (r.intention === 'noema-empty') {
      navigateTo(r.destination);
      return;
    }
    // noema (avec texte) — y compris fallback diag -> noema
    if (r.intention === 'noema') {
      talk(false);
      return;
    }
  }

  // Listeners
  previewBtn?.addEventListener('click', () => renderPreview());
  submitBtn?.addEventListener('click', () => executeAction());

  field?.addEventListener('input', () => updateSubmitLabel());
  field?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeAction();
    }
  });

  // Init label
  updateSubmitLabel();
})();
