/**
 * MÉDIATHÈQUE — câblage du catalogue, de la sélection et de l'export.
 *
 * La page lit atlas/media.json, généré par atlas/build-media.mjs depuis les
 * arbres git des dépôts : aucune donnée n'est recopiée à la main ici.
 * Règles de conduite :
 *   · une image montre son fichier réel (CDN jsDelivr, repli raw) — si le
 *     fichier ne se charge pas, la tuile de type l'avoue, elle ne triche pas ;
 *   · une vidéo n'est jamais lue dans la page : tuile + lien vers la source ;
 *   · la sélection sert à TRANSMETTRE : liens copiés, brief agent structuré,
 *     ou script .sh de récupération — la décision d'intégrer reste à l'agent,
 *     la validation reste humaine ;
 *   · sans catalogue lisible, la page dit comment le régénérer.
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

  /* ── Utilitaires : presse-papiers, fichier, notification ─────── */
  const toast = (title, tone = 'success') => window.AIME?.toast?.({ title, tone });

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(label);
      return true;
    } catch {
      /* Repli ancien : zone temporaire + execCommand. */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* refusé */ }
      ta.remove();
      toast(ok ? label : 'La copie a été refusée — sélectionnez le texte manuellement', ok ? 'success' : 'error');
      return ok;
    }
  }

  function saveBlob(name, text, type = 'text/plain') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function downloadFile(it) {
    const url = it.url || it.url_raw;
    if (!url) { window.open(it.source, '_blank', 'noreferrer'); return; }
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = it.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
      toast(`« ${it.name} » téléchargé`);
    } catch {
      /* Le fichier refuse d'être aspiré (CORS, couche CDN down) : on ouvre
         la source, on ne simule pas un téléchargement. */
      window.open(it.source, '_blank', 'noreferrer');
      toast('Ouverture de la source — le fichier refuse le téléchargement direct', 'error');
    }
  }

  /* ── Catalogue ───────────────────────────────────────────────── */
  const KIND = {
    image: { label: 'Image', icon: 'med-image' },
    video: { label: 'Vidéo', icon: 'med-video' },
    audio: { label: 'Audio', icon: 'med-audio' },
    vecteur: { label: 'Vecteur', icon: 'grd-guides' },
  };
  const grid = $('#m-grid');
  const state = { q: '', kind: '', repo: '' };
  const selected = new Set();
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
    const on = selected.has(it.id);
    return `<article class="ucard${on ? ' is-selected' : ''}" data-id="${esc(it.id)}">
      <div class="ucard__media">${thumb(it)}</div>
      <div class="ucard__id"><span class="ucard__mark" data-type="media">${ic(k.icon, 'a-ic')}</span>
        <span class="ucard__head"><span class="ucard__type">${esc(k.label)}</span><span class="ucard__title" title="${esc(it.path)}">${esc(it.name)}</span></span></div>
      <dl class="ucard__facts">
        <div class="ucard__fact"><dt>Dépôt</dt><dd class="u-mono">${esc(it.repo)}</dd></div>
        <div class="ucard__fact"><dt>Taille</dt><dd class="u-mono">${humanSize(it.size)}</dd></div>
      </dl>
      <div class="ucard__foot">
        <label class="a-check"><input type="checkbox" data-m-select="${esc(it.id)}"${on ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span><span class="t-caption">choisir</span></label>
        <span class="a-badge">${esc(it.ext)}</span>
        <span class="l-spacer"></span>
        ${it.url || it.url_raw ? `<button type="button" class="a-text-btn" data-m-dl="${esc(it.id)}" aria-label="Télécharger ${esc(it.name)}">${ic('act-export')}<span class="t-caption">télécharger</span></button>` : ''}
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
    if (shownEl) shownEl.textContent = `${shown.length} média(s) affiché(s) · ${repos.size} dépôt(s)`;
    renderSelection();
  }

  /* ── Sélection → transmission ────────────────────────────────── */
  const chosen = () => items.filter((it) => selected.has(it.id));

  function renderSelection() {
    const n = selected.size;
    const bar = $('#m-selbar');
    if (bar) bar.hidden = n === 0;
    const c = $('#m-selcount');
    if (c) c.textContent = String(n);
    grid?.querySelectorAll('.ucard[data-id]')?.forEach((el) => {
      el.classList.toggle('is-selected', selected.has(el.dataset.id));
    });
  }

  const bestUrl = (it) => it.url || it.url_raw || it.source;

  function linksText() {
    return chosen().map((it) => bestUrl(it)).join('\n');
  }

  function briefText() {
    const list = chosen();
    const when = new Date().toISOString().slice(0, 10);
    const manifest = list.map((it) => ({
      nom: it.name,
      type: it.kind,
      extension: it.ext,
      taille_octets: it.size,
      depot: it.repo,
      chemin: it.path,
      url_cdn: it.url,
      url_repli: it.url_raw,
      source: it.source,
    }));
    return [
      `# Brief médias — sélection Médiathèque AIME-COMPOSER`,
      ``,
      `Généré le ${when} · ${list.length} média(s) · provenance : arbres git vérifiés (atlas/build-media.mjs)`,
      ``,
      `## Consigne pour l'agent`,
      `1. Intégrer ces médias dans le projet cible en conservant noms de fichiers et provenance.`,
      `2. Pour chaque entrée : utiliser url_cdn, puis url_repli en cas d'échec ; signaler tout fichier inaccessible au lieu de le remplacer silencieusement.`,
      `3. Ne copier aucun média dans un dépôt sans validation humaine — la décision reste tracée.`,
      `4. Les vidéos ne sont pas lues côté médiathèque : vérifier durée et poids avant intégration.`,
      ``,
      '```json',
      JSON.stringify(manifest, null, 2),
      '```',
    ].join('\n');
  }

  function shText() {
    const list = chosen();
    const lines = [
      '#!/usr/bin/env bash',
      `# Récupération de ${list.length} média(s) — sélection Médiathèque AIME-COMPOSER`,
      '# Chaque fichier d\u2019abord via le CDN, puis via le repli raw ; tout échec est signalé, rien n\u2019est caché.',
      'set -u',
      'mkdir -p media-selection && cd media-selection',
      '',
    ];
    for (const it of list) {
      const urls = [it.url, it.url_raw].filter(Boolean);
      if (!urls.length) {
        lines.push(`echo "SANS-URL ${it.name} — dépôt privé : ${it.source}"`);
        continue;
      }
      lines.push(`curl -sfL -o "${it.name}" "${urls[0]}" \\`);
      const last = urls[urls.length - 1];
      lines.push(urls.length > 1
        ? `  || curl -sfL -o "${it.name}" "${last}" || echo "ÉCHEC ${it.name}"`
        : `  || echo "ÉCHEC ${it.name}"`);
    }
    lines.push('', 'echo "terminé — vérifiez les ÉCHEC éventuels ci-dessus"');
    return lines.join('\n');
  }

  /* ── Événements ──────────────────────────────────────────────── */
  grid?.addEventListener('change', (e) => {
    const box = e.target.closest('[data-m-select]');
    if (!box) return;
    if (box.checked) selected.add(box.dataset.mSelect);
    else selected.delete(box.dataset.mSelect);
    renderSelection();
  });

  document.addEventListener('click', (e) => {
    const dl = e.target.closest('[data-m-dl]');
    if (dl) {
      const it = items.find((x) => x.id === dl.dataset.mDl);
      if (it) downloadFile(it);
      return;
    }
    const pill = e.target.closest('[data-m-kind]');
    if (pill) {
      document.querySelectorAll('[data-m-kind]').forEach((p) => {
        if (p === pill) p.setAttribute('aria-current', 'true');
        else p.removeAttribute('aria-current');
      });
      state.kind = pill.dataset.mKind;
      render();
    }
  });

  $('#m-copy-links')?.addEventListener('click', () => {
    copyText(linksText(), `${selected.size} lien(s) copié(s) — collez-les à votre agent`);
  });
  $('#m-copy-brief')?.addEventListener('click', () => {
    copyText(briefText(), 'Brief agent copié — consigne + manifeste JSON');
  });
  $('#m-dl-sh')?.addEventListener('click', () => {
    saveBlob('mediatheque-selection.sh', shText());
    toast(`Script de récupération (${selected.size} média(s)) téléchargé`);
  });
  $('#m-sel-visible')?.addEventListener('click', () => {
    for (const it of items.filter(matches)) selected.add(it.id);
    render();
    toast(`${selected.size} média(s) sélectionné(s)`);
  });
  $('#m-sel-clear')?.addEventListener('click', () => {
    selected.clear();
    render();
  });

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

  $('#m-q')?.addEventListener('input', (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  $('#m-repo')?.addEventListener('change', (e) => {
    state.repo = e.target.value;
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
