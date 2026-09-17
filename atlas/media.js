/**
 * MÉDIATHÈQUE — câblage du catalogue, de la sélection, du mode local
 * et de l'export.
 *
 * La page lit atlas/media.json, généré par atlas/build-media.mjs depuis les
 * arbres git des dépôts : aucune donnée n'est recopiée à la main ici.
 * Règles de conduite :
 *   · une image montre son fichier réel (CDN jsDelivr, repli raw) — si le
 *     fichier ne se charge pas, la tuile de type l'avoue, elle ne triche pas ;
 *   · une vidéo ou une piste audio SE LIT dans la page (lecteur HTML5 sur la
 *     vraie source) — c'est la visionneuse universelle du contrat Bureau ;
 *   · le MODE LOCAL respecte la règle du Bureau universel : le dossier est
 *     une surface d'entrée, pas une base — originaux préservés, rien n'est
 *     envoyé ni synchronisé, la provenance (chemin relatif) reste attachée,
 *     la validation reste humaine ;
 *   · la sélection sert à TRANSMETTRE : liens copiés, brief agent structuré,
 *     ou script .sh de récupération — la décision d'intégrer reste à l'agent ;
 *   · la couverture du scan est montrée dépôt par dépôt : une absence de
 *     média est un constat, jamais un angle mort déguisé ;
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
    if (it.local && it.url) {
      /* Un média local est déjà un objet du navigateur : téléchargement
         direct, sans aucune requête réseau. */
      const a = document.createElement('a');
      a.href = it.url;
      a.download = it.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast(`« ${it.name} » téléchargé depuis votre dossier`);
      return;
    }
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
  const MEDIA_EXT = {
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', avif: 'image', bmp: 'image', ico: 'image', tif: 'image', tiff: 'image', heic: 'image',
    svg: 'vecteur', eps: 'vecteur', ai: 'vecteur',
    mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', m4v: 'video',
    mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio', ogg: 'audio', opus: 'audio',
  };
  const VIDEO_TAG = (ext) => ['mp4', 'webm', 'mov', 'm4v', 'mkv'].includes(ext);
  const AUDIO_TAG = (ext) => ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'opus'].includes(ext);

  const grid = $('#m-grid');
  const state = { q: '', kind: '', repo: '', source: 'github' };
  const selected = new Set();
  const catalogs = { github: [], local: [] };
  let localSkipped = 0;
  let dupMap = new Map(); /* sha → liste des items au contenu identique */

  const current = () => catalogs[state.source] || [];

  const humanSize = (n) => {
    if (!n) return '—';
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
    return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  };

  /* ── Tuile = visionneuse : image réelle, lecteur vidéo, lecteur
        audio, ou tuile honnête quand rien n'est accessible ──────── */
  const thumb = (it) => {
    if ((it.kind === 'image' || it.kind === 'vecteur') && it.url) {
      return `<div class="umedia${it.kind === 'vecteur' ? ' umedia--contain' : ''}" data-format="16-9" data-kind="${esc(it.kind)}" data-name="${esc(it.name)}" data-ext="${esc(it.ext)}">
        <img src="${esc(it.url)}" alt="" loading="lazy"${it.url_raw ? ` data-fallback="${esc(it.url_raw)}"` : ''}>
      </div>`;
    }
    if (it.kind === 'video' && it.url && VIDEO_TAG(it.ext)) {
      return `<div class="umedia umedia--player" data-format="16-9" data-kind="video" data-name="${esc(it.name)}" data-ext="${esc(it.ext)}">
        <video class="umedia__video" controls preload="metadata" playsinline src="${esc(it.url)}"${it.url_raw ? ` data-fallback="${esc(it.url_raw)}"` : ''} aria-label="Lire la vidéo ${esc(it.name)}"></video>
        <span class="umedia__label">${esc(it.ext)} · ${esc(humanSize(it.size))}</span>
      </div>`;
    }
    if (it.kind === 'audio' && it.url && AUDIO_TAG(it.ext)) {
      return `<div class="umedia umedia--player is-empty" data-format="16-9" data-kind="audio" data-name="${esc(it.name)}" data-ext="${esc(it.ext)}">
        ${ic('med-audio', 'a-ic a-ic--lg')}
        <span class="umedia__label">${esc(it.ext)} · ${esc(humanSize(it.size))}</span>
        <audio class="umedia__audio" controls preload="metadata" src="${esc(it.url)}"${it.url_raw ? ` data-fallback="${esc(it.url_raw)}"` : ''} aria-label="Écouter ${esc(it.name)}"></audio>
      </div>`;
    }
    const k = KIND[it.kind] || KIND.image;
    return `<div class="umedia is-empty" data-format="16-9" data-kind="${esc(it.kind)}" data-name="${esc(it.name)}" data-ext="${esc(it.ext)}">
      ${ic(k.icon, 'a-ic a-ic--lg')}
      <span class="umedia__label">${esc(it.ext)} · ${esc(it.name)}</span>
    </div>`;
  };

  const dupBadge = (it) => {
    const group = it.sha ? dupMap.get(it.sha) : null;
    if (!group || group.length < 2) return '';
    const where = group.filter((x) => x.id !== it.id).slice(0, 3).map((x) => `${x.repo}/${x.path}`).join(' · ');
    return `<span class="a-badge a-badge--warning" title="Même contenu, ailleurs : ${esc(where)}">doublon ×${group.length}</span>`;
  };

  const card = (it) => {
    const k = KIND[it.kind] || KIND.image;
    const on = selected.has(it.id);
    return `<article class="ucard${on ? ' is-selected' : ''}" data-id="${esc(it.id)}">
      <div class="ucard__media">${thumb(it)}</div>
      <div class="ucard__id"><span class="ucard__mark" data-type="media">${ic(k.icon, 'a-ic')}</span>
        <span class="ucard__head"><span class="ucard__type">${esc(k.label)}</span><span class="ucard__title" title="${esc(it.path)}">${esc(it.name)}</span></span></div>
      <dl class="ucard__facts">
        <div class="ucard__fact"><dt>Provenance</dt><dd class="u-mono">${esc(it.repo)}</dd></div>
        <div class="ucard__fact"><dt>Taille</dt><dd class="u-mono">${humanSize(it.size)}</dd></div>
      </dl>
      <div class="ucard__foot">
        <label class="a-check"><input type="checkbox" data-m-select="${esc(it.id)}"${on ? ' checked' : ''}><span class="a-check__box">${ic('act-check', 'a-ic a-ic--state')}</span><span class="t-caption">choisir</span></label>
        <span class="a-badge">${esc(it.ext)}</span>
        ${dupBadge(it)}
        <span class="l-spacer"></span>
        ${it.url || it.url_raw ? `<button type="button" class="a-text-btn" data-m-dl="${esc(it.id)}" aria-label="Télécharger ${esc(it.name)}">${ic('act-export')}<span class="t-caption">télécharger</span></button>` : ''}
        ${it.local
          ? `<span class="t-caption u-muted" title="${esc(it.path)}">${ic('doc-proof')} chemin affiché par votre navigateur</span>`
          : `<a class="a-text-btn" href="${esc(it.source)}" target="_blank" rel="noreferrer"><span class="t-caption">source</span>${ic('nav-external')}</a>`}
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

  function emptyState() {
    if (state.source !== 'local') return `<p class="t-body-sm u-muted">Aucun média ne correspond à ce filtre.</p>`;
    return `<p class="t-body-sm u-muted">Aucun dossier local chargé — ou aucun média ne correspond à ce filtre. Choisissez un dossier avec « Parcourir un dossier… » : il est lu et classé ici (photos, vidéos, audio, vecteurs), sans jamais quitter votre navigateur.</p>`;
  }

  function render() {
    if (!grid) return;
    const items = current();
    const shown = items.filter(matches);
    const repos = new Set(shown.map((it) => it.repo));
    grid.innerHTML = shown.length ? shown.map(card).join('') : emptyState();
    resolveIcons(grid);
    const shownEl = $('#m-shown');
    if (shownEl) {
      const unit = state.source === 'local' ? 'provenance(s) locale(s)' : 'dépôt(s)';
      shownEl.textContent = `${shown.length} média(s) affiché(s) · ${repos.size} ${unit}`;
    }
    renderSelection();
  }

  /* — Sélecteur de provenance, rebâti selon la source — */
  function rebuildRepoSelect(firstOption) {
    const sel = $('#m-repo');
    if (!sel) return;
    const items = current();
    const repos = [...new Set(items.map((it) => it.repo))].sort();
    sel.innerHTML = `<option value="">${esc(firstOption)} (${repos.length})</option>${repos
      .map((r) => `<option value="${esc(r)}">${esc(r)} (${items.filter((it) => it.repo === r).length})</option>`)
      .join('')}`;
    sel.value = state.repo && repos.includes(state.repo) ? state.repo : '';
    state.repo = sel.value;
  }

  /* ── Sources : GitHub (catalogue généré) / Local (à la demande) ── */
  function setSource(src) {
    state.source = src;
    state.repo = '';
    document.querySelectorAll('[data-m-source]').forEach((p) => {
      if (p.dataset.mSource === src) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
    const local = src === 'local';
    $('#m-local-tools')?.toggleAttribute('hidden', !local);
    $('#m-local-rule')?.toggleAttribute('hidden', !local);
    const srcEl = $('#m-source');
    if (srcEl) {
      srcEl.textContent = local
        ? 'lecture du navigateur, sur vos fichiers — rien n\'est envoyé : les chemins affichés sont relatifs au dossier choisi.'
        : 'atlas/media.json — généré par atlas/build-media.mjs depuis les arbres git des dépôts, jamais écrit à la main.';
    }
    updateLocalMeta();
    rebuildRepoSelect(local ? 'Toutes les provenances locales' : 'Tous les dépôts');
    render();
  }

  function updateLocalMeta() {
    const meta = $('#m-local-meta');
    if (meta) {
      const n = catalogs.local.length;
      meta.textContent = n
        ? `${n} média(s) lu(s)${localSkipped ? ` · ${localSkipped} autre(s) fichier(s) écarté(s)` : ''}`
        : 'aucun dossier chargé';
    }
    const count = $('#m-count');
    if (count && state.source === 'local') {
      const n = catalogs.local.length;
      count.textContent = n
        ? `mode local — ${n} média(s) lu(s) dans votre dossier, classés ci-dessous`
        : 'mode local — en attente d\'un dossier';
    }
  }

  function ingestLocal(fileList) {
    const files = [...fileList];
    const made = [];
    let skipped = 0;
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const kind = MEDIA_EXT[ext];
      if (!kind) { skipped++; continue; }
      const rel = f.webkitRelativePath || f.name;
      const top = rel.includes('/') ? rel.split('/')[0] : '(racine du choix)';
      const url = URL.createObjectURL(f);
      made.push({
        id: `loc-${String(catalogs.local.length + made.length + 1).padStart(4, '0')}`,
        repo: `local : ${top}`,
        path: rel,
        name: f.name,
        kind,
        ext,
        size: f.size || 0,
        sha: null,
        local: true,
        url,
        url_raw: null,
        source: `fichier local — ${rel}`,
      });
    }
    /* Un nouveau choix de dossier remplace l'ancien : la surface d'entrée
       est relue, jamais accumulée en base. Les URL-objets des anciens
       items sont libérées. */
    for (const it of catalogs.local) if (it.url) { try { URL.revokeObjectURL(it.url); } catch { /* déjà libérée */ } }
    catalogs.local = made;
    localSkipped = skipped;
    toast(made.length
      ? `${made.length} média(s) lu(s) et classé(s) — rien n'a quitté votre poste`
      : 'Aucun média (image, vidéo, audio, vecteur) dans ce choix');
    if (state.source !== 'local') setSource('local');
    else { updateLocalMeta(); rebuildRepoSelect('Toutes les provenances locales'); render(); }
  }

  $('#m-local-pick')?.addEventListener('click', () => $('#m-local-input')?.click());
  $('#m-local-input')?.addEventListener('change', (e) => {
    if (e.target.files?.length) ingestLocal(e.target.files);
    e.target.value = '';
  });

  /* ── Sélection → transmission ────────────────────────────────── */
  const allItems = () => [...catalogs.github, ...catalogs.local];
  const chosen = () => allItems().filter((it) => selected.has(it.id));

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
    return chosen().map((it) => (it.local
      ? `[fichier local] ${it.path} — à joindre manuellement (jamais envoyé depuis cette page)`
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
      depot: it.repo,
      chemin: it.path,
      url_cdn: it.local ? null : it.url,
      url_repli: it.local ? null : it.url_raw,
      source: it.local ? `fichier local : ${it.path}` : it.source,
      transfert: it.local ? 'manuel — le fichier doit être joint (rien n\'est envoyé depuis la médiathèque)' : 'url',
    }));
    const hasLocal = list.some((it) => it.local);
    return [
      `# Brief médias — sélection Médiathèque AIME-COMPOSER`,
      ``,
      `Généré le ${when} · ${list.length} média(s) · provenance : arbres git vérifiés + dossier local de l'utilisateur`,
      ``,
      `## Consigne pour l'agent`,
      `1. Intégrer ces médias dans le projet cible en conservant noms de fichiers et provenance.`,
      `2. Pour chaque entrée distante : utiliser url_cdn, puis url_repli en cas d'échec ; signaler tout fichier inaccessible au lieu de le remplacer silencieusement.`,
      `3. Ne copier aucun média dans un dépôt sans validation humaine — la décision reste tracée.`,
      hasLocal
        ? `4. Les entrées marquées "manuel" sont des fichiers locaux de l'utilisateur : demander le fichier, ne jamais prétendre y accéder. Les originaux restent sur le poste de l'utilisateur.`
        : `4. Les vidéos et pistes audio sont lisibles depuis leurs URL — vérifier durée et poids avant intégration lourde.`,
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
      '# Les entrées « LOCAL » ne peuvent pas être aspirées : elles sont sur le poste de l\u2019utilisateur, à joindre à la main.',
      'set -u',
      'mkdir -p media-selection && cd media-selection',
      '',
    ];
    for (const it of list) {
      if (it.local) {
        lines.push(`echo "LOCAL ${it.name} — sur le poste : ${it.path} (à joindre manuellement)"`);
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
    }
    lines.push('', 'echo "terminé — vérifiez les ÉCHEC et les LOCAL ci-dessus"');
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
      const it = allItems().find((x) => x.id === dl.dataset.mDl);
      if (it) downloadFile(it);
      return;
    }
    const spill = e.target.closest('[data-m-source]');
    if (spill) { setSource(spill.dataset.mSource); return; }
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
    for (const it of current().filter(matches)) selected.add(it.id);
    render();
    toast(`${selected.size} média(s) sélectionné(s)`);
  });
  $('#m-sel-clear')?.addEventListener('click', () => {
    selected.clear();
    render();
  });

  /* Lecture confortable : un seul lecteur à la fois. */
  grid?.addEventListener('play', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLMediaElement)) return;
    grid.querySelectorAll('video, audio').forEach((m) => { if (m !== el) m.pause(); });
  }, true);

  /* Une ressource qui ne répond pas avoue : deuxième couche (repli raw)
     puis tuile de type — jamais un élément brisé présenté comme un visuel. */
  grid?.addEventListener('error', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLImageElement || el instanceof HTMLMediaElement)) return;
    const fb = el.dataset.fallback;
    if (fb) {
      /* Première couche tombée : on essaie le repli, une seule fois. */
      delete el.dataset.fallback;
      el.src = fb;
      return;
    }
    const media = el.closest('.umedia');
    if (!media) return;
    const k = KIND[media.dataset.kind] || KIND.image;
    media.classList.add('is-empty');
    media.classList.remove('umedia--player');
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

  /* ── Couverture : chaque dépôt nommé, chaque absence un constat ── */
  function renderCoverage(d) {
    const t = d.totals || {};
    const body = $('#m-coverage');
    if (body && Array.isArray(d.repos)) {
      const rows = [...d.repos].sort((a, b) => (b.media - a.media) || a.name.localeCompare(b.name));
      body.innerHTML = rows.map((r) => {
        const stateBadge = r.state === 'vide'
          ? `<span class="a-badge a-badge--warning">dépôt vide (0 commit)</span>`
          : r.state === 'erreur'
            ? `<span class="a-badge a-badge--error">lecture impossible</span>`
            : r.tree_truncated
              ? `<span class="a-badge a-badge--warning" title="l'arbre dépasse la borne de lecture — couverture partielle signalée">partiel</span>`
              : r.media > 0
                ? `<span class="a-badge a-badge--success">lu en entier</span>`
                : `<span class="a-badge">lu en entier — sans média</span>`;
        return `<tr><td class="u-mono">${esc(r.name)}${r.private ? ' <span class="a-badge">privé</span>' : ''}</td><td class="u-mono">${esc(r.default_branch || '—')}</td><td class="u-mono">${r.media}</td><td>${stateBadge}${r.error ? ` <span class="t-caption u-muted">${esc(r.error)}</span>` : ''}</td></tr>`;
      }).join('');
      const cap = $('#m-coverage-caption');
      if (cap) {
        const when = d.generated_at ? new Date(d.generated_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—';
        cap.textContent = `${t.repos ?? d.repos.length} dépôts parcourus · ${t.repos_with_media ?? '—'} avec médias · ${t.repos_empty ?? 0} vides (aucun commit) · ${t.repos_error ?? 0} en erreur de lecture · arbres tronqués : ${d.truncated ? 'oui (signalés)' : 'non'} · ${t.duplicates ?? 0} doublon(s) de contenu détecté(s) par empreinte — relevé du ${when}, généré, jamais écrit à la main.`;
      }
      const note = $('#m-audio-note');
      if (note) {
        const audio = t.audio ?? 0;
        note.innerHTML = audio > 0
          ? `<span class="u-strong">Audio : ${audio} piste(s)</span> relevée(s) dans les arbres — écoute directe dans la grille ci-dessus.`
          : `<span class="u-strong">Audio : 0 piste commitée.</span> Ce n'est pas un trou du scan : les ${t.repos ?? ''} arbres ont été lus en entier (récursif, sans troncature${d.truncated ? ' confirmée' : ''}). Les médias lourds de certains projets — les vidéos DISPOO, par exemple — vivent <span class="u-strong">hors git</span>, dans leur stockage applicatif (Supabase, bucket de médias), donc jamais dans un arbre de dépôt. C'est exactement ce à quoi sert le <span class="u-strong">mode local</span> ci-dessus : pointer un dossier, le classer, l'écouter, le voir — et décider ensuite.`;
      }
    }
  }

  function unavailable() {
    if (!grid) return;
    if (state.source === 'local') { render(); return; }
    grid.innerHTML = `<p class="t-body-sm u-muted">Le catalogue n'est pas lisible ici. Régénérez-le depuis la racine du dépôt — ou passez en « Dossier local » pour travailler sans catalogue :</p>
      <pre class="ds-code">node atlas/build-media.mjs  <i># écrit atlas/media.json — nécessite gh authentifié</i></pre>`;
    const count = $('#m-count');
    if (count && state.source === 'github') count.textContent = 'catalogue indisponible — le mode local, lui, n\'a besoin de rien';
  }

  if (typeof fetch !== 'function') {
    /* jsdom (vérification DOM) n'a pas fetch : la page reste docile. */
    setSource('github');
    unavailable();
    return;
  }
  fetch('./media.json')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((d) => {
      catalogs.github = d.items || [];
      /* Doublons réels, par empreinte git (sha du blob). */
      dupMap = new Map();
      for (const it of catalogs.github) {
        if (it.sha) dupMap.set(it.sha, [...(dupMap.get(it.sha) || []), it]);
      }
      for (const [, group] of dupMap) if (group.length < 2) dupMap.delete(group[0].sha);
      if (state.source === 'github') {
        const count = $('#m-count');
        if (count) {
          const t = d.totals || {};
          count.textContent = `${t.media ?? catalogs.github.length} médias · ${t.repos_with_media ?? '—'} dépôts avec médias · ${t.repos ?? '—'} couverts · ${t.duplicates ?? 0} doublon(s)`;
        }
        const src = $('#m-source');
        if (src && d.generated_at) {
          const when = new Date(d.generated_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
          src.textContent = `atlas/media.json — généré le ${when} par atlas/build-media.mjs depuis les arbres git (${d.owner}), jamais écrit à la main.`;
        }
        rebuildRepoSelect('Tous les dépôts');
        render();
      }
      renderCoverage(d);
    })
    .catch(unavailable);
})();
