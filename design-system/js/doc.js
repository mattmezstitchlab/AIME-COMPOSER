/**
 * AIME DESIGN SYSTEM V1 — châssis de documentation.
 * Navigation partagée, thème, densité, réduction du mouvement, icônes.
 * Un seul propriétaire de la navigation : aucun écran ne redéfinit le chrome.
 */
(function () {
  /* La documentation est UNE page verticale (index.html) : chaque entrée du
     sommaire est une ancre de chapitre. Les écrans réels (experiences/)
     restent des pages à part — ce sont des écrans, pas des chapitres. */
  const NAV = [
    {
      group: 'Système',
      items: [
        { n: '01', href: 'index.html#intro', label: 'Accueil' },
        { n: '02', href: 'index.html#foundations', label: 'Foundations' },
      ],
    },
    {
      group: 'Tokens',
      items: [
        { n: '03', href: 'index.html#color', label: 'Couleur' },
        { n: '04', href: 'index.html#typography', label: 'Typographie' },
        { n: '05', href: 'index.html#space', label: 'Espace & grille' },
        { n: '06', href: 'index.html#icons', label: 'Iconographie' },
      ],
    },
    {
      group: 'Composants',
      items: [
        { n: '07', href: 'index.html#components', label: 'Fondamentaux' },
        { n: '08', href: 'index.html#aime-components', label: 'Composants AIME' },
        { n: '09', href: 'index.html#noema-components', label: 'Composants NOEMA' },
      ],
    },
    {
      group: 'Organes',
      items: [
        { n: '10', href: 'index.html#universal-card', label: 'Carte Universelle' },
        { n: '11', href: 'index.html#universal-timeline', label: 'Timeline Universelle' },
        { n: '12', href: 'index.html#universal-grid', label: 'Grille Universelle' },
        { n: '13', href: 'index.html#composer', label: 'Composer' },
      ],
    },
    {
      group: 'Règles',
      items: [
        { n: '14', href: 'index.html#responsive', label: 'Responsive' },
        { n: '15', href: 'index.html#accessibility', label: 'Accessibilité' },
        { n: '16', href: 'index.html#motion', label: 'Motion' },
        { n: '17', href: 'index.html#dataviz', label: 'Data visualisation' },
        { n: '18', href: 'index.html#patterns', label: 'Patterns' },
        { n: '19', href: 'index.html#qa', label: 'Design QA' },
      ],
    },
    {
      group: 'Expériences',
      items: [{ n: '20', href: 'experiences/index.html', label: 'Écrans réels' }],
    },
    {
      group: 'Export',
      items: [{ n: '21', href: 'index.html#direction', label: 'Direction artistique' }],
    },
  ];

  const root = document.querySelector('meta[name="a-root"]')?.content || './';
  // Tout écran d'expérience pointe sur la même entrée de sommaire ; sur la
  // page unique, l'entrée courante suit le chapitre visible (voir plus bas).
  const isExp = location.pathname.includes('/experiences/');
  const current = isExp ? 'experiences/index.html' : `index.html#${location.hash.slice(1) || 'intro'}`;

  const icon = (id, cls = 'a-ic a-ic--sm') =>
    `<svg class="${cls}" aria-hidden="true" width="16" height="16" focusable="false"><use href="${root}assets/aime-icons.svg#i-${id}"/></svg>`;

  /* ── Barre supérieure ─────────────────────────────────────── */
  const top = document.createElement('header');
  top.className = 'ds-top';
  top.innerHTML = `
    <button type="button" class="a-icon-btn l-hide-desktop-up" id="a-nav-toggle" aria-label="Ouvrir la navigation" aria-expanded="false" aria-controls="a-side">${icon('nav-menu', 'a-ic a-ic--lg')}</button>
    <a class="ds-brand" href="${root}../index.html" title="Accueil du site AIME-COMPOSER"><span>AIME<i>·</i>COMPOSER</span><small>DESIGN V1</small></a>
    <span class="l-spacer"></span>
    <div class="ds-top__tools">
      <button type="button" class="a-icon-btn" id="a-theme" aria-label="Changer de thème" data-a-tip="Thème"><span class="a-tip" data-a-tip="Thème clair / sombre">${icon('set-theme')}</span></button>
      <button type="button" class="a-icon-btn" id="a-density" aria-label="Changer la densité de cibles" data-a-tip="Densité">${icon('grd-ruler')}</button>
      <button type="button" class="a-icon-btn" id="a-motion" aria-label="Réduire le mouvement" aria-pressed="false" data-a-tip="Mouvement">${icon('time-clock')}</button>
      <a class="a-btn a-btn--sm a-btn--ghost l-hide-mobile" href="${root}index.html#qa">Design QA</a>
    </div>`;

  /* ── Navigation latérale ──────────────────────────────────── */
  const side = document.createElement('nav');
  side.className = 'ds-side';
  side.id = 'a-side';
  side.setAttribute('aria-label', 'Sommaire du Design System');
  side.innerHTML = NAV.map(
    (s) => `<div class="ds-side__group"><p class="ds-side__title">${s.group}</p>${s.items
      .map(
        (i) =>
          `<a class="ds-side__link" href="${root}${i.href}"${i.href === current ? ' aria-current="page"' : ''}><span class="ds-side__num">${i.n}</span>${i.label}</a>`,
      )
      .join('')}</div>`,
  ).join('');

  const shell = document.querySelector('.ds-shell');
  if (shell) {
    shell.prepend(side);
    shell.prepend(top);
  }

  /* ── Page unique : l'entrée courante du sommaire suit le chapitre lu ── */
  const chapters = [...document.querySelectorAll('.ds-chapter[id], #intro')];
  if (!isExp && chapters.length && 'IntersectionObserver' in window) {
    const links = new Map([...side.querySelectorAll('.ds-side__link')].map((a) => [a.getAttribute('href').split('#')[1], a]));
    const setCurrent = (id) => {
      for (const [k, a] of links) {
        if (k === id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    };
    const visible = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null);
      const top = chapters.filter((c) => visible.get(c.id) !== null && visible.get(c.id) !== undefined)
        .sort((a, b) => Math.abs(visible.get(a.id)) - Math.abs(visible.get(b.id)))[0];
      if (top) setCurrent(top.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    chapters.forEach((c) => io.observe(c));
    window.addEventListener('hashchange', () => { if (location.hash) setCurrent(location.hash.slice(1)); });
  }

  /* ── Icônes déclaratives : data-a-icon résout le chemin du sprite */
  document.querySelectorAll('use[data-a-icon]').forEach((u) => {
    u.setAttribute('href', `${root}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
  });

  /* ── Préférences persistées ───────────────────────────────── */
  const html = document.documentElement;
  const store = {
    get(k, d) {
      try {
        return localStorage.getItem('aime-ds-' + k) ?? d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('aime-ds-' + k, v);
      } catch {}
    },
  };

  const THEMES = ['dark', 'light'];
  const DENSITIES = ['compact', 'normal', 'touch'];
  let theme = store.get('theme', 'dark');
  let density = store.get('density', 'normal');
  let motion = store.get('motion', 'full');

  const apply = () => {
    html.dataset.aimeTheme = theme;
    if (density === 'normal') delete html.dataset.aimeDensity;
    else html.dataset.aimeDensity = density;
    if (motion === 'reduced') html.dataset.aimeMotion = 'reduced';
    else delete html.dataset.aimeMotion;
    const t = document.getElementById('a-theme');
    const d = document.getElementById('a-density');
    const m = document.getElementById('a-motion');
    if (t) t.setAttribute('aria-label', `Thème : ${theme}. Activer le thème ${theme === 'dark' ? 'clair' : 'sombre'}`);
    if (d) d.setAttribute('aria-label', `Densité : ${density}. Changer la densité`);
    if (m) {
      m.setAttribute('aria-pressed', motion === 'reduced' ? 'true' : 'false');
      m.setAttribute('aria-label', `Mouvement : ${motion === 'reduced' ? 'réduit' : 'complet'}. Basculer`);
    }
  };
  apply();

  document.getElementById('a-theme')?.addEventListener('click', () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    store.set('theme', theme);
    apply();
  });
  document.getElementById('a-density')?.addEventListener('click', () => {
    density = DENSITIES[(DENSITIES.indexOf(density) + 1) % DENSITIES.length];
    store.set('density', density);
    apply();
  });
  document.getElementById('a-motion')?.addEventListener('click', () => {
    motion = motion === 'reduced' ? 'full' : 'reduced';
    store.set('motion', motion);
    apply();
  });

  /* ── Navigation mobile ────────────────────────────────────── */
  const toggle = document.getElementById('a-nav-toggle');
  toggle?.addEventListener('click', () => {
    const open = side.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fermer la navigation' : 'Ouvrir la navigation');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && side.classList.contains('is-open')) {
      side.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      toggle?.focus();
    }
  });

  /* ── Copie d'une valeur au clic (nuanciers, tokens) ───────── */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a-copy]');
    if (!el) return;
    const value = el.dataset.aCopy;
    navigator.clipboard?.writeText(value).then(
      () => {
        const prev = el.getAttribute('aria-label');
        el.setAttribute('aria-label', `${value} copié`);
        setTimeout(() => el.setAttribute('aria-label', prev || value), 1400);
      },
      () => {},
    );
  });
})();
