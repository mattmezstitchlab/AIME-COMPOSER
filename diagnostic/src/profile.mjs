/**
 * AIME / NOEMA — PROFIL DE PROJET (détection du moteur)
 *
 * Le profil décrit, il ne note pas. « React 18 · Tailwind v3 · SCSS » est
 * une information, jamais un reproche. Un profil inconnu ne casse jamais
 * le diagnostic : repli intégral sur le scan HTML/CSS historique.
 *
 * La détection se fait par lecture des manifests et des signatures de
 * fichiers — jamais en exécutant le code du projet (garantie de
 * sécurité, pas une limite à lever).
 */

/** Signatures de moteurs : dépendances des manifests OU présence de fichiers. */
const ENGINES = [
  { name: 'Next', deps: ['next'], config: /next\.config\./, files: [] },
  { name: 'Nuxt', deps: ['nuxt'], config: /nuxt\./, files: [] },
  { name: 'React', deps: ['react', 'react-dom', 'preact'], config: null, files: ['.jsx', '.tsx'] },
  { name: 'Vue', deps: ['vue'], config: /nuxt\./, files: ['.vue'], unless: ['Nuxt'] },
  { name: 'Svelte / SvelteKit', deps: ['svelte'], config: /svelte\.config\./, files: ['.svelte'] },
  { name: 'Angular', deps: ['@angular/core'], config: /angular\.json/, files: [] },
  { name: 'Astro', deps: ['astro'], config: /astro\.config\./, files: ['.astro'] },
  { name: 'Tailwind v3', deps: ['tailwindcss'], config: /tailwind\.config\.(js|ts|cjs|mjs)$/, files: [] },
  { name: 'CSS-in-JS', deps: ['styled-components', '@emotion/react', '@emotion/styled'], config: null, files: [] },
  { name: 'SCSS', deps: ['sass'], config: null, files: ['.scss'] },
  { name: 'CSS modules', deps: [], config: null, files: ['.module.css'] },
];

/** Indique seulement si `depSet` contient l'un des noms. */
export const hasAnyDeps = (depSet, names) => names.filter((n) => depSet.has(n));

/**
 * Détecte le profil d'un projet collecté.
 *
 * @param {object} collected  sortie de collect() (V2 : sources, packages, configs)
 * @returns {{ engines: string[], evidence: object, screens: Array, fragments: Array,
 *             bridged: boolean, unknown: boolean, scss_files: string[] }}
 */
export function profileProject(collected) {
  const { sources = [], packages = [], configs = [], cssFiles = [], pages = [] } = collected;

  /* Dépendances vues dans tous les manifests du projet (racine, apps/…). */
  const depSet = new Set();
  const manifestErrors = [];
  for (const pkg of packages) {
    try {
      const j = JSON.parse(pkg.text);
      for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const name of Object.keys(j[k] || {})) depSet.add(name);
      }
    } catch {
      /* Un manifest illisible est un fait, pas un échec. */
      manifestErrors.push(pkg.name);
    }
  }

  const configNames = configs.map((c) => c.name);
  const configText = configs.map((c) => c.text).join('\n');
  const fileExt = new Set(sources.map((s) => s.ext));
  const cssNames = cssFiles.map((c) => c.name);

  const engines = [];
  const evidence = {};
  for (const e of ENGINES) {
    const byDeps = hasAnyDeps(depSet, e.deps);
    const byConfig = e.config ? configNames.filter((n) => e.config.test(n)) : [];
    const byFiles = e.files.includes('.module.css')
      ? cssNames.filter((n) => n.endsWith('.module.css') && !n.endsWith('.min.css'))
      : e.files.filter((x) => fileExt.has(x) || (x === '.scss' && cssNames.some((n) => n.endsWith('.scss'))));
    if (!byDeps.length && !byConfig.length && !byFiles.length) continue;
    if (e.unless && e.unless.some((u) => engines.includes(u))) {
      /* Vue sous Nuxt : Nuxt chapeaute, Vue ne doit pas compter deux fois. */
      evidence[e.name] = { sous: e.unless };
      continue;
    }
    engines.push(e.name);
    evidence[e.name] = [
      ...byDeps.map((d) => `dépendance ${d}`),
      ...byConfig.map((f) => `config ${f}`),
      ...(byFiles.length ? [`${byFiles.length} fichier(s) signature`] : []),
    ];
  }

  /* Tailwind v4 : pas de config — un import CSS ou un bloc @theme. */
  if (!engines.includes('Tailwind v3')) {
    const v4 = cssFiles.some((c) => /@import\s+["']tailwindcss["']/.test(c.text) || /@theme\b/.test(c.text));
    if (v4) {
      engines.push('Tailwind v4');
      evidence['Tailwind v4'] = ['@import "tailwindcss" ou @theme en CSS'];
    }
  }
  if (!engines.includes('Tailwind v3') && engines.includes('Tailwind v4') === false) {
    /* Rien : pas de Tailwind. */
  }

  /* ── Écrans vs fragments ──────────────────────────────────────
     Un écran est un document HTML complet, un composant de route
     (pages/ · app/ → page.* · routes/ · views/), ou la racine d'une
     expérience mono-page (App, main). Tout le reste est un fragment —
     mesuré, rapporté à part. */
  const screens = [];
  const fragments = [];
  const isScreen = (name) => {
    const base = name.split('/').pop();
    if (/^_[A-Za-z]+/.test(base)) return false;                 /* _app, _document */
    if (/(^|\/)api\//.test(name)) return false;                 /* endpoints */
    if (/(^|\/)app\//.test(name) && /^page\.[jt]sx?$/.test(base)) return true; /* Next App Router */
    if (/(^|\/)(pages|routes|views)\//.test(name)) return true;
    if (/^(src\/)?(App|main)\.(jsx|tsx|vue|svelte)$/.test(name.replace(/\\/g, '/'))) return true;
    return false;
  };
  for (const s of sources) (isScreen(s.name) ? screens : fragments).push(s);

  /* scss et modules déclarés au profil, pour la lisibilité du rapport. */
  const scss_files = cssFiles.filter((c) => c.scss).map((c) => c.name);

  /* Le pont officiel : un preset Tailwind issu du Design System. */
  const bridged = /design-system[/\\]bridge[/\\]tailwind\.preset[a-z.-]*c?js/.test(configText) ||
    /aime-design-system/.test(configText) && /tailwind/.test(configText) && /preset/.test(configText);

  return {
    engines,
    evidence,
    screens,          /* sources classées écrans (composants de route) */
    fragments,        /* autres sources */
    pages,            /* documents HTML complets — toujours des écrans */
    scss_files,
    bridged,
    unknown: engines.length === 0,
    manifest_errors: manifestErrors,
  };
}
