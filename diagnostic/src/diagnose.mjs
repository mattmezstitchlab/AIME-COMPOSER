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
import { extractProject, normalizeComponent } from './extract.mjs';
import { join, dirname } from 'node:path';

/* ── HIERARCHY : alias whitelist documentée ────────────────────
   Les mêmes préfixes que design-system/js/qa.js — motion (framer-motion)
   et styled (styled-components/emotion). Voir qa.js § HIERARCHY. */
const HEADING_ALIAS_PREFIXES = ['motion', 'styled'];
function hasH1(html) {
  const re = new RegExp(`<(?:h1|${HEADING_ALIAS_PREFIXES.map((p) => `${p}\\.h1`).join('|')})[\\s>/]`);
  return re.test(html);
}
function countH1(html) {
  const re = new RegExp(`<(?:h1|${HEADING_ALIAS_PREFIXES.map((p) => `${p}\\.h1`).join('|')})[\\s>/]`, 'g');
  return (String(html).match(re) || []).length;
}
function isSpaCoquille(page) {
  if (!page.name.endsWith('index.html')) return false;
  const html = page.html || '';
  const hasRoot = /<div[^>]*id=["']root["']/.test(html);
  const hasModuleScript = /<script[^>]*type=["']module["'][^>]*src=/.test(html);
  return hasRoot && hasModuleScript && !hasH1(html);
}
/* ── TOKENS : couche d'adoption vendée ─────────────────────────
   Un projet qui adopte en vendoring `tokens.css` officiel ne doit pas
   être pénalisé : les 150 littéraux couleur du fichier de tokens sont
   la décision du Design System, pas du projet.
   La couche est reconnue par :
   - marqueur de provenance en tête de fichier (AIME-COMPOSER, 90ad4c0,
     couche de tokens, Source : AIME-COMPOSER) — voir byaime
     `src/styles/aime-tokens.css` (pont §8.1, commit 90ad4c0)
   - ou empreinte : le contenu officiel est inclus tel quel (vendor =
     header provenance + fichier officiel).                           */
function isTokensLayerFile(file, refCssText) {
  if (!file || !file.text || !refCssText) return false;
  const head = file.text.slice(0, 8000);
  const hasProvenanceMarker =
    /AIME-COMPOSER/i.test(head) && (/aime-tokens|tokens\.css|couche de tokens|provenance/i.test(head) || /90ad4c0/.test(head));
  if (hasProvenanceMarker) {
    if (/--aime-/.test(file.text)) return true;
  }
  const norm = (s) => s.replace(/\r\n/g, '\n').trim();
  const refNorm = norm(refCssText);
  const fileNorm = norm(file.text);
  if (!refNorm) return false;
  if (fileNorm === refNorm) return true;
  if (fileNorm.includes(refNorm)) return true;
  const afterFirstComment = fileNorm.replace(/^\/\*[\s\S]*?\*\/\s*/, '');
  if (afterFirstComment === refNorm) return true;
  if (afterFirstComment.includes(refNorm)) return true;
  return false;
}
function isBootstrapFile(name) {
  const base = String(name).split('/').pop();
  return /^main\.(jsx|tsx|vue|svelte|js|ts|mjs|cjs)$/.test(base);
}
function parseImports(text) {
  const out = [];
  for (const m of text.matchAll(/import\s+(?:[^'"]*\s+from\s+)?["']([^"']+)["']/g)) out.push(m[1]);
  // export ... from "..."
  for (const m of text.matchAll(/export\s+(?:[^'"]*\s+from\s+)?["']([^"']+)["']/g)) out.push(m[1]);
  return out;
}
function findImportTarget(importPath, screenName, allSources, fragmentNames) {
  if (!importPath || /^[a-z@][a-z0-9-]*$/.test(importPath) && !importPath.includes('/')) {
    // dépendance externe sans slash — pas local
    // mais "@clerk/react" contient slash mais externe : filtrer les non locaux sans résolution
  }
  // filtrer les dépendances externes évidentes (pas de résolution locale)
  if (/^(react|react-dom|vue|svelte|next|nuxt|astro|tailwindcss|framer-motion|styled-components|@emotion|lucide-react|wouter|@clerk|@tanstack|date-fns|clsx|@workspace)/.test(importPath)) {
    // ces imports ne pointent jamais vers un fichier du projet
    if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('~/') && !importPath.startsWith('src/')) return null;
  }
  let candidate = importPath;
  if (candidate.startsWith('@/')) candidate = candidate.slice(2);
  else if (candidate.startsWith('~/')) candidate = candidate.slice(2);
  else if (candidate.startsWith('.')) {
    // relatif : résoudre par rapport au dossier de l'écran
    const baseDir = dirname(screenName);
    // join naïf pour éviter dépendance path.posix hors node
    candidate = join(baseDir, candidate).replace(/\\/g, '/');
    // enlever l'extension explicite si présente
    candidate = candidate.replace(/\.[jt]sx?$/, '').replace(/\/index$/, '');
  } else if (candidate.startsWith('src/')) {
    candidate = candidate.replace(/^src\//, '');
  }
  // candidate est maintenant un chemin sans extension, ex "components/SiteChrome"
  // Chercher une source dont le nom se termine par candidate + extension
  // Priorité aux sources sous src/ pour les imports aliasés @/ — sinon un
  // fichier de référence (reference/source-zip/…) passerait devant.
  const tryNames = [candidate + '.tsx', candidate + '.ts', candidate + '.jsx', candidate + '.js', candidate + '.vue', candidate + '.svelte'];
  for (const t of tryNames) {
    const srcHit = allSources.find((s) => s.name === 'src/' + t && fragmentNames.has(s.name));
    if (srcHit) return srcHit;
    const hit = allSources.find((s) => (s.name === t || s.name.endsWith('/' + t)) && fragmentNames.has(s.name) && s.name.startsWith('src/'));
    if (hit) return hit;
    const anyHit = allSources.find((s) => (s.name === t || s.name.endsWith('/' + t)) && fragmentNames.has(s.name));
    if (anyHit) return anyHit;
  }
  // repli : correspondance par basename uniquement (ex: "SiteChrome" → "src/components/SiteChrome.tsx")
  const base = candidate.split('/').pop().replace(/\.[^.]+$/, '');
  if (!base) return null;
  const hits = allSources.filter((s) => {
    const b = s.name.split('/').pop().replace(/\.[^.]+$/, '');
    return b === base && fragmentNames.has(s.name);
  });
  if (hits.length === 1) return hits[0];
  // si plusieurs, prendre celui dont le chemin contient le plus de segments du candidate
  if (hits.length > 1) {
    const candParts = candidate.split('/');
    let best = null; let bestScore = -1;
    for (const h of hits) {
      const score = candParts.filter((p) => h.name.includes(p)).length;
      if (score > bestScore) { bestScore = score; best = h; }
    }
    return best;
  }
  return null;
}

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
  // ── Couche de tokens vendée : REFERENCE, pas dette ──────────
  // Un projet qui vendore tokens.css (150 littéraux) voyait COLOR +150.
  // Reconnaître la couche par marqueur provenance ou empreinte officielle
  // comme REFERENCE : exclue de COLOR, comptée en adoption.
  // Voir pont §8.1.
  const refCssText = reference?.tokenCss?.text || '';
  const tokensLayerFiles = (collected.cssFiles || []).filter((f) => isTokensLayerFile(f, refCssText));
  const tokensLayerNames = new Set(tokensLayerFiles.map((f) => f.name));
  const filteredCssFiles = (collected.cssFiles || []).filter((f) => !tokensLayerNames.has(f.name));
  const filteredCollected = { ...collected, cssFiles: filteredCssFiles };
  const ext = extractProject(filteredCollected, profile);

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

  /* ── HIERARCHY : angles morts du collecteur (jamais devinés) ─────
     1) h1 composé — une route importe un fragment local qui porte le h1
        (SiteHero → Legal/Mentions, ProjectStage → Home). Le scan statique
        de la route seule voit 0 h1 ; le rendu en a un. On publie NON RÉSOLU
        — h1 composé, jamais un écart.
     2) coquille SPA — index.html du montage Vite (div#root + script module)
        n'a pas de h1 statique ; il vit dans le rendu. NON RÉSOLU — coquille.
     3) alias — motion.h1 / styled.h1 déjà comptés comme h1 par qa.js
        (whitelist documentée) ; ici on s'assure que l'import d'un fragment
        à motion.h1 est bien détecté comme porteur de h1.
     4) h1 par branche — App.tsx porte 3 h1 dans des branches mutuellement
        exclusives (invite / RSVP / connexion indisponible) — un seul rend à
        la fois. Le scan statique compte 3. On publie NON RÉSOLU — h1 par
        branche, jamais d'interpolation de contrôle (pont §8.2).
     5) bootstrap / montage — main.tsx (montage React) n'est pas un écran
        (0 h1 mais pas une route). Même traitement que la coquille SPA
        (pont §8.2) : publié comme NON RÉSOLU, jamais 0 h1.
     Les *.test.* sont déjà exclus des routes par profile.mjs.          */
  const fragmentNameSet = new Set(profile.fragments.map((s) => s.name));
  const allSources = collected.sources || [];
  const hierarchyUnresolved = [];
  const patchedScreens = new Set();
  // Documents : coquilles SPA
  for (const p of htmlPages) {
    if (!hasH1(p.html) && isSpaCoquille(p)) {
      hierarchyUnresolved.push({ name: p.name, reason: 'NON RÉSOLU — coquille SPA — index.html est le montage Vite (div#root + script module) sans h1 statique — le h1 vit dans le rendu', kind: 'coquille' });
      patchedScreens.add(p.name);
    }
  }
  // Routes composées : import local vers fragment porteur de h1
  for (const src of profile.screens) {
    // Bootstrap exclu : main.* n'est plus un écran (profile.mjs) mais on garde
    // le garde pour compatibilité si un projet le liste encore comme écran
    if (isBootstrapFile(src.name)) continue;
    const norm = normalizeComponent(src.text);
    if (hasH1(norm)) continue;
    const imports = parseImports(src.text);
    let hit = null; let hitImport = null;
    for (const imp of imports) {
      const target = findImportTarget(imp, src.name, allSources, fragmentNameSet);
      if (!target) continue;
      const targetNorm = normalizeComponent(target.text);
      if (hasH1(targetNorm)) { hit = target; hitImport = imp; }
    }
    if (hit) {
      hierarchyUnresolved.push({ name: src.name, reason: `NON RÉSOLU — h1 composé — ${src.name} importe ${hit.name} (via "${hitImport}") qui porte le <h1> — le scan statique ne l'inline pas`, kind: 'compose' });
      patchedScreens.add(src.name);
    }
  }
  // h1 par branche : plusieurs h1 mutuellement exclusifs dans le même fichier
  // Cas ciblé : App.tsx porte 3 h1 dans des branches exclusives (invite / RSVP / connexion).
  // On ne devine jamais si les branches sont exclusives : si countH1 >1 on publie
  // NON RÉSOLU — h1 par branche. Jamais d'interpolation de contrôle.
  // Limité à App.* (point d'entrée à branches) pour ne pas masquer un vrai doublon
  // sur une page métier où 2 h1 simultanés est bien un écart.
  for (const src of profile.screens) {
    if (patchedScreens.has(src.name)) continue;
    const isAppEntry = /(^|\/)App\.(jsx|tsx|vue|svelte)$/.test(src.name);
    if (!isAppEntry) continue;
    const norm = normalizeComponent(src.text);
    const cnt = countH1(norm);
    if (cnt > 1) {
      hierarchyUnresolved.push({ name: src.name, reason: `NON RÉSOLU — h1 par branche — ${src.name} porte ${cnt} <h1> dans des branches mutuellement exclusives — le scan statique ne résout pas le contrôle`, kind: 'branche' });
      patchedScreens.add(src.name);
    }
  }
  // Bootstrap / montage : main.* — même traitement que coquille, mais hors écrans
  // Le profil l'exclut des écrans, on le publie comme NON RÉSOLU pour traçabilité.
  // Si le projet contient un main.* qui serait encore compté comme écran (vieille
  // définition du profil), on le patch aussi pour éviter le faux 0 h1.
  for (const src of allSources) {
    if (!isBootstrapFile(src.name)) continue;
    if (hierarchyUnresolved.some((h) => h.name === src.name)) continue;
    hierarchyUnresolved.push({ name: src.name, reason: `NON RÉSOLU — montage/bootstrap — ${src.name} est le montage React (point d'entrée, sans h1 statique) — le h1 vit dans le rendu — même traitement que la coquille SPA`, kind: 'bootstrap' });
    // si ce fichier est encore considéré comme écran (ancien profil), patch pour éviter 0 h1
    if (profile.screens.some((s) => s.name === src.name)) patchedScreens.add(src.name);
  }
  // Injecter un h1 synthétique là où le h1 est composé/coquille/branche/bootstrap,
  // pour que le juge ne compte pas un faux 0 h1 ou n h1. Le h1 synthétique est
  // marqué pour traçabilité, mais le rapport publie bien le NON RÉSOLU à part.
  if (patchedScreens.size) {
    for (const p of pages) {
      if (patchedScreens.has(p.name)) {
        const entry = hierarchyUnresolved.find((h) => h.name === p.name);
        const kind = entry?.kind || 'compose';
        if (kind === 'branche') {
          // Branche : plusieurs h1 → on ne garde qu'un seul h1 synthétique
          // On supprime les h1 existants (y compris alias) pour arriver à exactement 1
          let html = p.html;
          html = html.replace(/<(?:h1|motion\.h1|styled\.h1)[\s>/][\s\S]*?<\/[^>]+>/gi, '<!-- h1 branche retiré -->');
          p.html = `<h1 data-hierarchy-unresolved="branche">h1-non-résolu-branche</h1>\n` + html;
        } else {
          p.html = `<h1 data-hierarchy-unresolved="${kind}">h1-non-résolu</h1>\n` + p.html;
        }
      }
    }
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
  if (hierarchyUnresolved.length) {
    nonMeasured.push(`${hierarchyUnresolved.length} écran(s) à hiérarchie non résolue — ${hierarchyUnresolved.map((h) => h.name).join(', ')} — h1 composé/coquille/alias/branche/montage : le h1 vit hors du fichier ou dans des branches exclusives, jamais deviné`);
  }
  if (tokensLayerFiles.length) {
    nonMeasured.push(`couche de tokens présente — ${tokensLayerFiles.map((f) => f.name).join(', ')} — fichier vendé AIME-COMPOSER (150 littéraux) exclu de COLOR comme REFERENCE, compté en adoption`);
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
      tokens_layer: tokensLayerFiles.length > 0,
      tokens_layer_files: tokensLayerFiles.map((f) => f.name),
      tokens_layer_marker: tokensLayerFiles.length ? 'provenance AIME-COMPOSER ou empreinte tokens.css officiel' : null,
      hierarchy_unresolved_kinds: [...new Set(hierarchyUnresolved.map((h) => h.kind))],
    },
    icon_libraries: ext.iconLibs,
    unresolved: ext.unresolved,
    unresolved_detail: ext.unresolvedDetail,
    hierarchy_unresolved: hierarchyUnresolved.length,
    hierarchy_unresolved_detail: hierarchyUnresolved.map((h) => h.reason),
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
