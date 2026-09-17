/**
 * MÉDIATHÈQUE — câblage du catalogue.
 *
 * La page lit atlas/media.json, généré par atlas/build-media.mjs depuis les
 * arbres git des dépôts : aucune donnée n'est recopiée à la main dans cette
 * interface. Trois règles de bonne conduite :
 *   · une image montre son fichier réel (CDN jsDelivr, repli raw) — si le
 *     fichier ne se charge pas, la tuile de type l'avoue, elle ne triche pas ;
 *   · une vidéo n'est jamais lue dans la page : tuile + lien vers la source ;
 *   · sans catalogue lisible, la page dit comment le régénérer au lieu de
 *     faire semblant d'être vide.
 *
 * Script classique (defer), comme home.js : la vérification DOM exécute les
 * scripts classiques avant de contrôler les icônes.
 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ── Icônes déclaratives ────────────────────────────────────── */
  function resolveIcons(rootEl = document) {
    const root = document.querySelector('meta[name="a-root"]')?.content || '../design-system/';
    for (const u of rootEl.querySelectorAll('use[data-a-icon]')) {
      u.setAttribute('href', `${root}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
      delete u.dataset.aIcon;
    }
  }
  resolveIcons();
  const ic = (id, cls = 'a-ic a-ic--sm') =>
    `<svg class="${cls}" aria-hidden="true" width="16" height="16"><use data-a-icon="${esc(id)}"/></svg>`;

  /* ── Thème — même préférence que le reste du système ─────────── */
  const THEMES = ['dark', 'light'];
  let theme = 'dark';
  try { theme = localStorage.getItem('aime-ds-theme') || 'dark'; } catch { /* indisponible */ }
  const applyTheme = () => {
    document.documentElement.dataset.aimeTheme = theme;
    $('#m-theme')?.setAttribute('aria-label', `Thème : ${theme}. Basculer sur l'autre thème`);
  };
  applyTheme();
  $('#m-theme')?.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    try { localStorage.setItem('aime-ds-theme', theme); } catch { /* non persistée */ }
    applyTheme();
  });

  /* ── Catalogue ───────────────────────────────────────────────── */
  const KIND = {
    image: { label: 'Image', icon: 'med-image' },
    video: { label: 'Vidéo', icon: 'med-video' },
    audio: { label: 'Audio', icon: 'med-audio' },
    vecteur: { label: 'Vecteur', icon: 'grd-guides' },
  };
  const grid = $('#m-grid');
  const state = { q: '', kind: '', repo: '' };
  let items = [];

  const humanSize = (n) => {
    if (!n) return '—';
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
    return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  };

  const thumb = (it) => {
    const visual = (it.kind === 'image' || it.kind === 'vecteur') && it.url;
    if (visual) {
      return `<div class="umedia${it.kind === 'vecteur' ? ' umedia--contain' : ''}" data-format="16-9" data-kind="${esc(it.kind)}" data-name="${esc(it.name)}" data-ext="${esc(it.ext)}">
        <img src="${esc(it.url)}" alt="" loading="lazy"${it.url_raw ? ` data-fallback="${esc(it.url_raw)}"` : ''}>
      </div>`;
    }
    const k = KIND[it.kind] || KIND.image;
    return `<div class="umedia is-empty" data-format="16-9">
      ${ic(k.icon, 'a-ic a-ic--lg')}
      <span class="umedia__label">${esc(it.ext)} · ${esc(it.name)}</span>
    </div>`;
  };

  const card = (it) => {
    const k = KIND[it.kind] || KIND.image;
    return `<article class="ucard">
      <div class="ucard__media">${thumb(it)}</div>
      <div class="ucard__id"><span class="ucard__mark" data-type="media">${ic(k.icon, 'a-ic')}</span>
        <span class="ucard__head"><span class="ucard__type">${esc(k.label)}</span><span class="ucard__title" title="${esc(it.path)}">${esc(it.name)}</span></span></div>
      <dl class="ucard__facts">
        <div class="ucard__fact"><dt>Dépôt</dt><dd class="u-mono">${esc(it.repo)}</dd></div>
        <div class="ucard__fact"><dt>Taille</dt><dd class="u-mono">${humanSize(it.size)}</dd></div>
      </dl>
      <div class="ucard__foot">
        <span class="a-badge">${esc(it.ext)}</span>
        <span class="l-spacer"></span>
        <a class="a-text-btn" href="${esc(it.source)}" target="_blank" rel="noreferrer"><span class="t-caption">source</span>${ic('nav-external')}</a>
      </div>
    </article>`;
  };

  function matches(it) {
    if (state.kind && it.kind !== state.kind) return false;
    if (state.repo && it.repo !== state.repo) return false;
    if (state.q) {
      const hay = `${it.name} ${it.path} ${it.repo}`.toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  function render() {
    if (!grid) return;
    const shown = items.filter(matches);
    const repos = new Set(shown.map((it) => it.repo));
    grid.innerHTML = shown.length
      ? shown.map(card).join('')
      : `<p class="t-body-sm u-muted">Aucun média ne correspond à ce filtre.</p>`;
    resolveIcons(grid);
    const shownEl = $('#m-shown');
    if (shownEl) {
      shownEl.textContent = `${shown.length} média(s) affiché(s) · ${repos.size} dépôt(s)`;
    }
  }

  /* Une image qui ne se charge pas avoue : deuxième couche (raw), puis
     tuile de type — jamais un carré brisé présenté comme un visuel. */
  grid?.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement)) return;
    const fb = img.dataset.fallback;
    if (fb && img.src !== fb) {
      img.src = fb;
      delete img.dataset.fallback;
      return;
    }
    const media = img.closest('.umedia');
    if (!media) return;
    const k = KIND[media.dataset.kind] || KIND.image;
    media.classList.add('is-empty');
    media.innerHTML = `${ic(k.icon, 'a-ic a-ic--lg')}<span class="umedia__label">${esc(media.dataset.ext || '')} · inaccessible — voir la source</span>`;
    resolveIcons(media);
  }, true);

  /* ── Filtres ─────────────────────────────────────────────────── */
  $('#m-q')?.addEventListener('input', (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  $('#m-repo')?.addEventListener('change', (e) => {
    state.repo = e.target.value;
    render();
  });
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-m-kind]');
    if (!pill) return;
    document.querySelectorAll('[data-m-kind]').forEach((p) => {
      if (p === pill) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
    state.kind = pill.dataset.mKind;
    render();
  });

  function unavailable() {
    if (!grid) return;
    grid.innerHTML = `<p class="t-body-sm u-muted">Le catalogue n'est pas lisible ici. Régénérez-le depuis la racine du dépôt :</p>
      <pre class="ds-code">node atlas/build-media.mjs  <i># écrit atlas/media.json — nécessite gh authentifié</i></pre>`;
    const count = $('#m-count');
    if (count) count.textContent = 'catalogue indisponible';
  }

  if (typeof fetch !== 'function') {
    /* jsdom (vérification DOM) n'a pas fetch : la page reste docile. */
    unavailable();
    return;
  }
  fetch('./media.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => {
      items = d.items || [];
      const count = $('#m-count');
      if (count) {
        const t = d.totals || {};
        count.textContent = `${t.media ?? items.length} médias · ${t.repos_with_media ?? '—'} dépôts avec médias · ${t.repos ?? '—'} couverts`;
      }
      const src = $('#m-source');
      if (src && d.generated_at) {
        const when = new Date(d.generated_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
        src.textContent = `atlas/media.json — généré le ${when} par atlas/build-media.mjs depuis les arbres git (${d.owner}), jamais écrit à la main.`;
      }
      const sel = $('#m-repo');
      if (sel) {
        const repos = [...new Set(items.map((it) => it.repo))].sort();
        sel.innerHTML = `<option value="">Tous les dépôts (${repos.length})</option>${repos
          .map((r) => `<option value="${esc(r)}">${esc(r)} (${items.filter((it) => it.repo === r).length})</option>`)
          .join('')}`;
      }
      render();
    })
    .catch(unavailable);
})();
