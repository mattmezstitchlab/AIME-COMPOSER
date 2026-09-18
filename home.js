/**
 * AIME-COMPOSER — le seuil (index.html).
 *
 * Depuis la Vague 3 de AUDIT/POINT-ZERO-CONVERGENCE-01.md, l'accueil n'est
 * plus une porte qui fait : il dit où les choses vivent et y conduit. La
 * porte universelle (résolveur pur, aperçu, menu ＋, intentions) a été
 * absorbée par le ＋ de Point Zero (point-zero/pz.js, qui importe
 * home-resolver.mjs — la fonction pure survit à la page).
 *
 * Responsabilités restantes, et rien d'autre :
 *   1. Résoudre les icônes déclaratives `data-a-icon`.
 *   2. Maintenir la préférence de thème clair / sombre (même clé que le châssis).
 *   3. Dire honnêtement si la boucle NOEMA répond (/api/state) — badges.
 *
 * Script classique (defer) compatible jsdom. Aucune règle métier ici.
 */
(function () {
  const select = (sel) => document.querySelector(sel);

  /* ── Icônes déclaratives ────────────────────────────────────── */
  const root = document.querySelector('meta[name="a-root"]')?.content || 'design-system/';
  for (const u of document.querySelectorAll('use[data-a-icon]')) {
    u.setAttribute('href', `${root}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
    delete u.dataset.aIcon;
  }

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

  /* ── État de la boucle NOEMA : publié, jamais déguisé ───────── */
  function setStatus(live, runtimeMode) {
    const label = live
      ? runtimeMode === 'serverless' ? 'NOEMA en ligne · démo' : 'NOEMA en ligne'
      : 'NOEMA hors ligne';
    const title = live && runtimeMode === 'serverless'
      ? 'Monde de démonstration en mémoire, réinitialisé à froid — la persistance disque vit sur le serveur local complet.'
      : live ? '' : 'Démarrez node loop/server.mjs — rien n\u2019est simulé.';
    const cls = live ? 'a-badge a-badge--success' : 'a-badge';
    for (const id of ['#h-noema-status', '#h-hero-badge']) {
      const b = select(id);
      if (!b) continue;
      b.textContent = label;
      b.title = title;
      b.className = cls;
    }
  }

  if (typeof fetch === 'function') {
    fetch('/api/state')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setStatus(true, d.runtime?.mode || null))
      .catch(() => setStatus(false, null));
  } else {
    setStatus(false, null);
  }
})();
