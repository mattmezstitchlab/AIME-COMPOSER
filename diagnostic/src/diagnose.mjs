/**
 * AIME / NOEMA — DIAGNOSTIC V2 (universel, par moteur)
 *
 * Fait passer un projet quelconque devant le juge du Design System :
 * le moteur `design-system/js/qa.js`, celui-là même qui valide les
 * écrans du système. Quel que soit le moteur du projet — React, Next,
 * Vue, Svelte, Tailwind, CSS-in-JS ou HTML pur — c'est le même juge,
 * sur le même barème, jamais une copie.
 *
 * TROIS PRINCIPES (inchangés) :
 *
 *   1. Le diagnostic ne répare rien. Il mesure et il nomme.
 *   2. Le rapport dit ce qu'il ne mesure pas — familles qui exigent le
 *      DOM rendu, valeurs dynamiques non résolues, exclusions.
 *   3. Aucun score inventé. La mesure publiée est une densité d'écarts
 *      par écran — comparable parce qu'elle sort du même juge.
 *
 * V2 ajoute : le profil de moteur (nommé, jamais jugé), la séparation
 * écrans / fragments, l'extraction multi-sources, le pont officiel
 * (un projet branché sur les artefacts générés du système converge
 * vers zéro sans changer de moteur), et le suivi par baseline.
 */
import { audit } from '../../design-system/js/qa.js';
import { profileProject } from './profile.mjs';
import { extractProject } from './extract.mjs';

/**
 * Familles qui jugent réellement le projet examiné.
 *
 * `CONTRAST` en est exclue : elle vérifie les paires de couleurs du
 * Design System, pas celles du projet. La compter comme un écart du
 * projet attribuerait à autrui une mesure qui parle de nous.
 */
export const PROJECT_FAMILIES = [
  'ALIGNMENT', 'SPACING', 'TYPOGRAPHY', 'COLOR', 'ICONOGRAPHY',
  'HIERARCHY', 'RESPONSIVE', 'OVERFLOW', 'FOCUS', 'MOTION', 'CONSISTENCY',
];

/** Familles présentes dans le rapport mais qui décrivent la référence. */
export const REFERENCE_ONLY = ['CONTRAST'];

/** Familles dont la géométrie réelle exige un DOM : déclarées, pas jouées. */
export const DOM_REQUIRED = ['ALIGNMENT (rendu)', 'RESPONSIVE (rendu)', 'OVERFLOW (rendu)'];

/**
 * Diagnostique un projet collecté.
 *
 * @param {object} collected sortie de collect() (V2)
 * @param {object} reference sortie de reference()
 */
export function diagnose(collected, reference) {
  const profile = profileProject(collected);
  const ext = extractProject(collected, profile);

  /* Écrans = documents HTML + composants de route. Fragments = le reste,
     mesuré pareillement mais rapporté à part pour garder la densité par
     écran comparable à celle d'hier. */
  const htmlPages = (collected.pages || []).map((p) => ({ ...p, fragment: false }));
  const pages = [...htmlPages, ...ext.pages];
  const isScreen = (p) => !p.fragment;
  const screens = pages.filter(isScreen);
  const fragments = pages.filter((p) => p.fragment);

  if (!screens.length && !fragments.length) {
    return {
      ok: false,
      reason: collected.sources?.length
        ? 'des sources de composants existent mais aucun écran de route n\'a été reconnu (pages/, app/, routes/, views/, App) — le diagnostic ne note pas ce qu\'il ne peut pas localiser'
        : 'aucun écran HTML à juger — le diagnostic ne porte sur rien',
      pages: 0,
      profile,
    };
  }

  const mode = screens.length ? 'ecrans' : 'fragments';
  if (!screens.length) {
    /* Une bibliothèque de composants sans route : densité sur fragments,
       et le rapport le dit au lieu de diviser par zéro. */
  }

  /* Les feuilles du système font partie du corpus (CONSISTENCY des
     classes système), marquées pour ne pas être facturées au projet ;
     puis les feuilles extraites : CSS/SCSS du projet, blocs styled. */
  const systemCss = reference.systemCss || [];
  const report = audit({
    cssFiles: [...systemCss, ...ext.sheets],
    tokenCss: reference.tokenCss,
    tokensJson: reference.tokensJson,
    pages,
    sprite: reference.sprite,
    atoms: ext.atoms,
    issueLimit: Infinity,
  });

  /* ── Attribution : un écart venant d'une feuille du système n'est pas
     le fait du projet. Un fichier projet s'écrit : nom direct, ou
     « <fichier> <style> » / « <fichier> <styled> ». */
  const projectBases = new Set([
    ...ext.sheets.map((s) => s.name),
    ...pages.map((p) => p.name),
  ]);
  const baseOf = (file) => {
    if (!file) return null;
    const m = String(file).match(/^(.+?) <(?:style|styled)/);
    return m ? m[1] : String(file);
  };
  const fromSystem = (issue) => {
    const b = baseOf(issue.file);
    return b ? !projectBases.has(b) : false;
  };

  const families = {};
  for (const check of report.checks) {
    families[check.family] = {
      count: check.count,
      result: check.result,
      judged: PROJECT_FAMILIES.includes(check.family),
      issues: check.issues.map((i) => (typeof i === 'string' ? { message: i, file: null, line: 0 } : i)),
    };
  }
  const judged = PROJECT_FAMILIES.filter((f) => families[f]);
  for (const f of judged) {
    const kept = families[f].issues.filter((i) => !fromSystem(i));
    families[f].attributed = kept.length;
    families[f].unattributed = families[f].issues.length - kept.length;
    families[f].issues = kept;
    if (!kept.length) families[f].result = 'pass';
  }

  /* ── Écrans vs fragments, par famille et par fichier ────────── */
  const screenNames = new Set(screens.map((p) => p.name));
  const fragmentNames = new Set(fragments.map((p) => p.name));
  const ownerOf = (file) => {
    const b = baseOf(file);
    if (b && screenNames.has(b)) return 'screen';
    if (b && fragmentNames.has(b)) return 'fragment';
    return null; /* feuille de style globale, attribut hors écran */
  };

  for (const f of judged) {
    let s = 0; let g = 0;
    for (const i of families[f].issues) {
      const o = ownerOf(i.file);
      if (o === 'screen') s++;
      else if (o === 'fragment') g++;
    }
    families[f].screens = s;
    families[f].fragments = g;
  }

  const ecartsScreens = judged.reduce((n, f) => n + (families[f].result === 'pass' ? 0 : families[f].screens), 0);
  const ecartsFragments = judged.reduce((n, f) => n + (families[f].result === 'pass' ? 0 : families[f].fragments), 0);
  const ecarts = judged.reduce((n, f) => n + (families[f].result === 'pass' ? 0 : families[f].count), 0);

  /* ── Classement par écran (et par fragment, à part) ─────────── */
  const perFile = new Map([...screens, ...fragments].map((p) => [p.name, 0]));
  for (const f of judged) {
    for (const issue of families[f].issues) {
      const b = baseOf(issue.file);
      if (b && perFile.has(b)) perFile.set(b, perFile.get(b) + 1);
    }
  }
  const rank = (set) => [...perFile.entries()]
    .filter(([name]) => set.has(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const worstScreens = rank(screenNames);
  const worstFragments = rank(fragmentNames);

  /* ── Ce que le projet emploie déjà du système ───────────────── */
  const used = new Set();
  for (const p of pages) {
    for (const m of p.html.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c) used.add(c);
    }
  }
  const systemClasses = [...used].filter((c) => SYSTEM_VOCABULARY.test(c));

  /* ── Ce que ce rapport ne mesure pas — publié, jamais extrapolé ─ */
  const nonMeasured = [
    ...REFERENCE_ONLY.map((f) => `${f} — décrit le Design System, pas le projet`),
    'la mise en page réelle (géométrie, débordements, cibles) — jsdom n\'a pas de moteur de layout ; voir le mode rendu (opt-in)',
  ];
  if (ext.unresolved) {
    nonMeasured.push(`${ext.unresolved} construction(s) dynamique(s) de classes — non résolues, jamais devinées`);
  }
  if (profile.unknown) {
    nonMeasured.push('moteur non reconnu — jugement intégral sur HTML/CSS (repli garanti)');
  }

  const screensCount = screens.length || 1;
  const fragmentsCount = fragments.length || 1;

  /* Signatures stables pour la baseline : famille|fichier|ligne|message. */
  const signatures = judged.flatMap((f) =>
    families[f].issues.map((i) => `${f}|${baseOf(i.file) || i.file || ''}|${i.line || 0}|${i.message}`))
    .sort();

  return {
    ok: true,
    version: '2.0.0',
    engine: {
      rationale: 'design-system/js/qa.js — le même moteur que le QA des écrans du système',
    },
    profile: {
      engines: profile.engines,
      evidence: profile.evidence,
      bridged: profile.bridged,
      unknown: profile.unknown,
      manifest_errors: profile.manifest_errors,
      scss_files: profile.scss_files,
    },
    mode,
    pages: screens.length,
    page_units: { documents: htmlPages.length, routes: screens.length - htmlPages.length },
    screens: {
      total: screens.length,
      ecarts: ecartsScreens,
      density: Number((ecartsScreens / screensCount).toFixed(1)),
      worst: worstScreens.slice(0, 10),
    },
    fragments: {
      total: fragments.length,
      ecarts: ecartsFragments,
      density: Number((ecartsFragments / fragmentsCount).toFixed(1)),
      worst: worstFragments.slice(0, 10),
    },
    sheets: ext.sheets.length,
    skipped: collected.skipped,
    ecarts,
    density: Number((ecartsScreens / screensCount).toFixed(1)),
    families: judged.map((f) => ({
      family: f,
      ...families[f],
      issues: undefined,
      top: families[f].issues.slice(0, 5),
    })),
    reference_only: REFERENCE_ONLY.map((f) => ({ family: f, ...(families[f] || { count: 0, result: 'pass' }), issues: undefined })),
    worst_pages: worstScreens,
    adoption: {
      system_classes_used: systemClasses.length,
      total_classes: used.size,
      ratio: used.size ? Number((systemClasses.length / used.size).toFixed(3)) : 0,
      sample: systemClasses.slice(0, 12),
      tokens_referenced: ext.tokenized,
    },
    icon_libraries: ext.iconLibs,
    unresolved: ext.unresolved,
    unresolved_detail: ext.unresolvedDetail,
    non_measured: nonMeasured,
    signatures,
    bridged: profile.bridged,
  };
}

/** Préfixes du vocabulaire du Design System — même source que le QA. */
const SYSTEM_VOCABULARY = /^(a-|l-|t-|u-|ds-|noema|ucard|utl|ugrid|umedia|composer|cnode|clink|inspector|viz|prov|nstate|sresults|rview|vdiff|ba__|ba-|cmdbar|ohead|mslot|aslot|spec__|approval|conf__|conf$)/;

/** Formule une recommandation à partir de ce qui a été mesuré. */
export function recommend(diagnosis) {
  if (!diagnosis.ok) return [{ priority: 0, title: 'Rien à diagnostiquer', detail: diagnosis.reason }];

  const byFamily = Object.fromEntries(diagnosis.families.map((f) => [f.family, f.count]));
  const out = [];

  if (byFamily.HIERARCHY) {
    out.push({
      priority: 1,
      title: `${byFamily.HIERARCHY} écart(s) de hiérarchie (titre de niveau 1, ordre des niveaux)`,
      detail: 'Correction la moins chère du lot : un <h1> par écran, des niveaux ordonnés. Effet immédiat sur la structure et l\'accessibilité.',
    });
  }
  if (byFamily.FOCUS) {
    out.push({
      priority: 2,
      title: `${byFamily.FOCUS} atteinte(s) au focus clavier`,
      detail: 'Un anneau supprimé sans substitution rend le site inutilisable au clavier. C\'est un blocage, pas un détail.',
    });
  }
  if (byFamily.ICONOGRAPHY) {
    out.push({
      priority: 3,
      title: `${byFamily.ICONOGRAPHY} icône(s) hors système${diagnosis.icon_libraries?.length ? ` (bibliothèque(s) tierce(s) : ${diagnosis.icon_libraries.join(', ')})` : ''}`,
      detail: 'Emoji ou pictogrammes non nommés. La famille AIME compte 86 glyphes ; s\'y tenir coûte un remplacement par icône.',
    });
  }
  if (byFamily.COLOR) {
    out.push({
      priority: 4,
      title: `${byFamily.COLOR} couleur(s) littérale(s) ou palette(s) externe(s)`,
      detail: 'Le chantier principal. Chaque littéral doit devenir un rôle. C\'est ce qui rendra le thème clair/sombre possible.',
    });
  }
  if (byFamily.SPACING || byFamily.TYPOGRAPHY) {
    out.push({
      priority: 5,
      title: `${(byFamily.SPACING || 0) + (byFamily.TYPOGRAPHY || 0)} valeur(s) hors échelle`,
      detail: 'Espacements et corps de texte à ramener sur les échelles du système. Mécanique, mais volumineux.',
    });
  }
  if (diagnosis.unresolved) {
    out.push({
      priority: 6,
      title: `${diagnosis.unresolved} construction(s) de classes non résolue(s)`,
      detail: 'Le diagnostic n\'a pas deviné — c\'est sa règle. Pour lever cet angle mort : nommer les classes, ou passer par le pont officiel.',
    });
  }
  if (!out.length) {
    out.push({ priority: 0, title: 'Aucun écart mesuré', detail: 'Le projet respecte les familles jugées. Rien à proposer.' });
  }
  return out;
}

/* ── Baseline : mesurer une migration plutôt que la déclarer ────── */
/**
 * Compare deux rapports (nouveau, ancien) sur leurs signatures d'écarts.
 * Retourne les écarts nouveaux, les écarts corrigés, et l'écart net.
 */
export function baselineDiff(current, previous) {
  const cur = new Set(current.signatures || []);
  const prev = new Set(previous.signatures || []);
  const added = [...cur].filter((s) => !prev.has(s)).sort();
  const fixed = [...prev].filter((s) => !cur.has(s)).sort();
  return {
    added,
    fixed,
    added_count: added.length,
    fixed_count: fixed.length,
    net: added.length - fixed.length,
    /* Un bond +N veut dire que la migration a introduit des écarts ;
       -N qu'elle en corrigé. Zéro : rien n'a bougé, c'est un fait utile. */
  };
}
