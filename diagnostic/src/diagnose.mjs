/**
 * AIME / NOEMA — DIAGNOSTIC V1
 *
 * Fait passer un projet quelconque devant le juge du Design System :
 * le moteur `design-system/js/qa.js`, celui-là même qui valide les 31
 * écrans du système.
 *
 * Ce module ne réinvente aucune règle. Il fournit au moteur le barème
 * de référence — tokens, icônes, échelles — et le source du projet, et
 * il rend ce que le moteur mesure.
 *
 * TROIS PRINCIPES :
 *
 *   1. Le diagnostic ne répare rien. Il mesure et il nomme. La
 *      réparation reste une décision humaine — c'est le principe même
 *      du système : NOEMA propose, l'humain valide.
 *
 *   2. Le rapport dit ce qu'il ne mesure pas. Certaines familles
 *      décrivent le Design System lui-même et non le projet ; les
 *      présenter comme des écarts du projet serait un mensonge.
 *
 *   3. Aucun score inventé. La mesure publiée est une densité d'écarts
 *      par écran — comparable d'un projet à l'autre parce qu'elle est
 *      produite par le même juge, sur le même barème.
 */
import { audit } from '../../design-system/js/qa.js';

/**
 * Familles qui jugent réellement le projet examiné.
 *
 * `CONTRAST` en est exclue : elle vérifie les paires de couleurs du
 * Design System, pas celles du projet. La compter comme un écart du
 * projet attribuerait à autrui une mesure qui parle de nous.
 *
 * `CONSISTENCY` est incluse mais signalée : elle ne regarde que les
 * classes du vocabulaire du système. Un projet qui ne l'emploie pas
 * remontera 0 — ce qui est une information (« ce projet n'utilise pas
 * le système »), pas un brevet de conformité.
 */
export const PROJECT_FAMILIES = [
  'ALIGNMENT', 'SPACING', 'TYPOGRAPHY', 'COLOR', 'ICONOGRAPHY',
  'HIERARCHY', 'RESPONSIVE', 'OVERFLOW', 'FOCUS', 'MOTION', 'CONSISTENCY',
];

/** Familles présentes dans le rapport mais qui décrivent la référence. */
export const REFERENCE_ONLY = ['CONTRAST'];

/**
 * Diagnostique un projet collecté.
 *
 * @param {{pages:Array, cssFiles:Array, skipped:Array, root:string}} collected
 * @param {{tokenCss:object, tokensJson:object, sprite:string}} reference
 */
export function diagnose(collected, reference) {
  const { pages, cssFiles } = collected;

  if (!pages.length) {
    return {
      ok: false,
      reason: 'aucun écran HTML à juger — le diagnostic ne porte sur rien',
      pages: 0,
    };
  }

  /* Les feuilles du système font partie du corpus : sans elles, une
     classe du système employée à bon escient remonterait comme
     « utilisée mais jamais définie », et le diagnostic punirait le
     comportement même qu'il est censé récompenser. C'est aussi ainsi
     que le QA juge les écrans du système.

     Elles sont marquées `system` pour rester distinguables : le projet
     ne doit pas être crédité de feuilles qu'il n'a pas écrites, et un
     écart qui viendrait d'elles ne doit pas lui être imputé. */
  const systemCss = reference.systemCss || [];
  const projectCss = cssFiles.map((f) => ({ ...f, system: false }));

  const report = audit({
    cssFiles: [...systemCss, ...projectCss],
    tokenCss: reference.tokenCss,
    tokensJson: reference.tokensJson,
    pages,
    sprite: reference.sprite,
    /* Indispensable : par défaut le moteur borne la liste détaillée à 40
       écarts par famille pour garder son rapport lisible, tandis que
       `count` reste le total. Or ce module compte à partir de la liste —
       pour rattacher chaque écart à son écran et pour écarter ceux qui
       viennent des feuilles du système. Sur une liste amputée, les deux
       calculs sous-déclaraient : mesuré sur un projet de test, 44 écarts
       rattachés pour 405 réellement mesurés. */
    issueLimit: Infinity,
  });

  /* ── Écarts par famille, sur le périmètre du projet ─────────── */
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

  /* Un écart qui provient d'une feuille du système n'est pas le fait du
     projet. Le compter ici reviendrait à facturer à autrui nos propres
     dettes — et le système est déjà validé par son QA. */
  const fromSystem = (issue) => {
    const f = issue.file || '';
    return f.endsWith('.css') && !cssFiles.some((c) => c.name === f);
  };
  for (const f of judged) {
    const kept = families[f].issues.filter((i) => !fromSystem(i));
    families[f].attributed = kept.length;
    families[f].unattributed = families[f].issues.length - kept.length;
    families[f].issues = kept;
    if (!kept.length) families[f].result = 'PASS';
  }

  const ecarts = judged.reduce((n, f) => n + (families[f].result === 'PASS' ? 0 : families[f].count), 0);

  /* ─— Écarts par écran : ce qui permet de prioriser ────────────
     Un bloc <style> est rapporté par le moteur sous le nom
     « page.html <style> », parce que c'est une feuille à part entière.
     Pour l'humain, il appartient à l'écran : on le rattache donc à sa
     page. Sans cette traduction, un projet qui écrit son CSS en ligne
     — le cas le plus fréquent hors Design System — voyait tous ses
     écarts disparaître du classement par écran.
     ─────────────────────────────────────────────────────────── */
  const pageOf = (file) => {
    if (!file) return null;
    if (perPage.has(file)) return file;
    const m = String(file).match(/^(.+?\.(?:html?|htm))\s+<style/);
    return m && perPage.has(m[1]) ? m[1] : null;
  };
  const perPage = new Map();
  for (const p of pages) perPage.set(p.name, 0);
  for (const f of judged) {
    for (const issue of families[f].issues) {
      const page = pageOf(issue.file);
      if (page) perPage.set(page, perPage.get(page) + 1);
    }
  }
  const worst = [...perPage.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  /* ── Ce que le projet emploie déjà du système ─────────────────
     Un projet n'est pas « non conforme » en bloc : il peut déjà
     employer une partie du vocabulaire. Le mesurer dit par où
     commencer, et c'est plus utile qu'un verdict.
     ─────────────────────────────────────────────────────────── */
  const used = new Set();
  for (const p of pages) {
    for (const m of p.html.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/)) if (c) used.add(c);
    }
  }
  const systemClasses = [...used].filter((c) => SYSTEM_VOCABULARY.test(c));

  return {
    ok: true,
    pages: pages.length,
    stylesheets: cssFiles.length,
    skipped: collected.skipped,
    /* Densité d'écarts par écran : la seule mesure comparable d'un
       projet à l'autre, parce qu'elle sort du même juge. */
    ecarts,
    density: Number((ecarts / pages.length).toFixed(1)),
    families: judged.map((f) => ({ family: f, ...families[f], issues: undefined, top: families[f].issues.slice(0, 5) })),
    reference_only: REFERENCE_ONLY.map((f) => ({ family: f, ...(families[f] || { count: 0, result: 'PASS' }), issues: undefined })),
    worst_pages: worst.slice(0, 10),
    adoption: {
      system_classes_used: systemClasses.length,
      total_classes: used.size,
      /* 0 classe du système n'est pas une faute : c'est le point de départ. */
      ratio: used.size ? Number((systemClasses.length / used.size).toFixed(3)) : 0,
      sample: systemClasses.slice(0, 12),
    },
  };
}

/** Préfixes du vocabulaire du Design System — même source que le QA. */
const SYSTEM_VOCABULARY = /^(a-|l-|t-|u-|ds-|noema|ucard|utl|ugrid|umedia|composer|cnode|clink|inspector|viz|prov|nstate|sresults|rview|vdiff|ba__|ba-|cmdbar|ohead|mslot|aslot|spec__|approval|conf__|conf$)/;

/** Formule une recommandation à partir de ce qui a été mesuré. */
export function recommend(diagnosis) {
  if (!diagnosis.ok) return [{ priority: 0, title: 'Rien à diagnostiquer', detail: diagnosis.reason }];

  const byFamily = Object.fromEntries(diagnosis.families.map((f) => [f.family, f.count]));
  const out = [];

  /* L'ordre n'est pas décoratif : il suit ce qui coûte le moins cher à
     corriger pour le plus d'effet sur la confiance visuelle. */
  if (byFamily.HIERARCHY) {
    out.push({
      priority: 1,
      title: `${byFamily.HIERARCHY} écran(s) sans titre de niveau 1`,
      detail: 'Correction la moins chère du lot : un <h1> par écran. Effet immédiat sur la structure et l\'accessibilité.',
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
      title: `${byFamily.ICONOGRAPHY} icône(s) hors système`,
      detail: 'Emoji ou pictogrammes non nommés. La famille AIME compte 85 glyphes ; s\'y tenir coûte un remplacement par icône.',
    });
  }
  if (byFamily.COLOR) {
    out.push({
      priority: 4,
      title: `${byFamily.COLOR} couleur(s) littérale(s)`,
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
  if (!out.length) {
    out.push({ priority: 0, title: 'Aucun écart mesuré', detail: 'Le projet respecte les familles jugées. Rien à proposer.' });
  }
  return out;
}
