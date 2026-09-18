/**
 * AIME DESIGN SYSTEM V1 — châssis de documentation.
 * Navigation partagée, thème, densité, réduction du mouvement, icônes.
 * Un seul propriétaire de la navigation : aucun écran ne redéfinit le chrome.
 */
(function () {
  const NAV = [
    {
      group: 'Système',
      items: [
        { n: '01', href: 'index.html', label: 'Accueil' },
        { n: '02', href: 'foundations.html', label: 'Foundations' },
      ],
    },
    {
      group: 'Tokens',
      items: [
        { n: '03', href: 'color.html', label: 'Couleur' },
        { n: '04', href: 'typography.html', label: 'Typographie' },
        { n: '05', href: 'space.html', label: 'Espace & grille' },
        { n: '06', href: 'icons.html', label: 'Iconographie' },
      ],
    },
    {
      group: 'Composants',
      items: [
        { n: '07', href: 'components.html', label: 'Fondamentaux' },
        { n: '08', href: 'aime-components.html', label: 'Composants AIME' },
        { n: '09', href: 'noema-components.html', label: 'Composants NOEMA' },
      ],
    },
    {
      group: 'Organes',
      items: [
        { n: '10', href: 'universal-card.html', label: 'Carte Universelle' },
        { n: '11', href: 'universal-timeline.html', label: 'Timeline Universelle' },
        { n: '12', href: 'universal-grid.html', label: 'Grille Universelle' },
        { n: '13', href: 'composer.html', label: 'Composer' },
      ],
    },
    {
      group: 'Règles',
      items: [
        { n: '14', href: 'responsive.html', label: 'Responsive' },
        { n: '15', href: 'accessibility.html', label: 'Accessibilité' },
        { n: '16', href: 'motion.html', label: 'Motion' },
        { n: '17', href: 'dataviz.html', label: 'Data visualisation' },
        { n: '18', href: 'patterns.html', label: 'Patterns' },
        { n: '19', href: 'qa.html', label: 'Design QA' },
      ],
    },
    {
      group: 'Expériences',
      items: [{ n: '20', href: 'experiences/index.html', label: 'Écrans réels' }],
    },
    {
      group: 'Export',
      items: [{ n: '21', href: 'direction.html', label: 'Direction artistique' }],
    },
  ];

  const root = document.querySelector('meta[name="a-root"]')?.content || './';
  const page = location.pathname.split('/').pop() || 'index.html';
  // Tout écran d'expérience pointe sur la même entrée de sommaire.
  const isExp = location.pathname.includes('/experiences/');
  const current = isExp ? 'experiences/index.html' : page;

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
      <a class="a-btn a-btn--sm a-btn--ghost l-hide-mobile" href="${root}qa.html">Design QA</a>
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
