#!/usr/bin/env node
/**
 * AIME / NOEMA — DIAGNOSTIC DE PROJET (V2 universelle)
 *
 * Fait passer un projet devant le juge du Design System et rend un
 * rapport : ce qui s'écarte du système, où, et par quoi commencer —
 * quel que soit son moteur (React, Next, Vue, Svelte, Tailwind, HTML).
 *
 *   node diagnostic/diagnose.mjs <chemin-vers-le-projet>
 *   node diagnostic/diagnose.mjs --owner mattmezstitchlab --repo Butterfly
 *   node diagnostic/diagnose.mjs <chemin> --json
 *   node diagnostic/diagnose.mjs <chemin> --baseline rapport-precedent.json
 *
 * Le diagnostic ne répare rien. Il mesure, il nomme, il priorise.
 * La réparation reste une décision humaine.
 *
 * Codes de sortie : 0 = conforme · 1 = écarts (ou cible non jugeable) ·
 * 2 = commande mal formée.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { collect } from './src/collect.mjs';
import { diagnose, recommend, baselineDiff } from './src/diagnose.mjs';
import { reference } from './src/reference.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, '.work');

export { reference };

/** Récupère un dépôt GitHub en lecture seule, dans un dossier jetable. */
export function fetchRepo(owner, repo, { depth = 1, refresh = true } = {}) {
  const dest = join(WORK, `${owner}--${repo}`);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

  if (existsSync(dest)) {
    if (!refresh) return dest;

    /* Un dépôt vide n'a aucune ref : il doit rester « aucun écran à
       juger », jamais « inaccessible » (régression gardée par les tests). */
    const refs = execFileSync('git', ['-C', dest, 'ls-remote', '--heads', 'origin'], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!refs) return dest;

    execFileSync('git', ['-C', dest, 'fetch', '--depth', String(depth), 'origin'], { stdio: 'ignore', env });

    const branch = execFileSync('git', ['-C', dest, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!branch || branch === 'HEAD') return dest;

    execFileSync('git', ['-C', dest, 'reset', '--hard', `origin/${branch}`], { stdio: 'ignore', env });
    return dest;
  }

  execFileSync('gh', ['repo', 'clone', `${owner}/${repo}`, dest, '--', `--depth=${depth}`, '--quiet'], {
    stdio: 'inherit',
    env,
  });
  return dest;
}

/* ── Sortie machine déterministe ───────────────────────────────── */
/** Le JSON publié est un document : aucun horodatage — deux exécutions
    sur la même entrée donnent le même rapport, c'est testé. */
export function reportJson(target, d) {
  if (!d.ok) return { version: '2.0.0', cible: target, ok: false, raison: d.reason, profil: d.profile || null };
  const fam = (f) => ({
    famille: f.family,
    ecarts: f.count,
    ecrans: f.screens ?? 0,
    fragments: f.fragments ?? 0,
    resultat: f.count ? 'ECARTS' : 'CONFORME',
    exemples: (f.top || []).slice(0, 5).map((i) => i.message),
  });
  return {
    version: '2.0.0',
    cible: target,
    ok: true,
    moteur_du_juge: d.engine.rationale,
    profil: {
      moteurs: d.profile.engines,
      preuves: d.profile.evidence,
      pont_officiel: d.profile.bridged,
      inconnu: d.profile.unknown,
      manifests_illisibles: d.profile.manifest_errors,
    },
    ecrans: {
      total: d.screens.total,
      documents: d.page_units.documents,
      routes: d.page_units.routes,
      ecarts: d.screens.ecarts,
      densite: d.screens.density,
      plus_touches: d.screens.worst.slice(0, 10).map((w) => ({ nom: w.name, ecarts: w.count })),
    },
    fragments: {
      total: d.fragments.total,
      ecarts: d.fragments.ecarts,
      densite: d.fragments.density,
      plus_touches: d.fragments.worst.slice(0, 10).map((w) => ({ nom: w.name, ecarts: w.count })),
    },
    ecarts: d.ecarts,
    densite: d.density,
    familles: d.families.map(fam),
    reference_seule: d.reference_only.map((f) => f.family),
    adoption: d.adoption,
    bibliotheques_icones_tierces: d.icon_libraries,
    non_resolu: d.unresolved,
    non_resolu_detail: d.unresolved_detail,
    hierarchie_non_resolue: d.hierarchy_unresolved || 0,
    hierarchie_non_resolue_detail: d.hierarchy_unresolved_detail || [],
    non_mesure: d.non_measured,
    exclusions: { fichiers_ecartes: d.skipped.length, detail: d.skipped.slice(0, 20) },
    signatures: d.signatures,
  };
}

/* ── Rendu console ─────────────────────────────────────────────── */
const bar = (n, max, width = 24) => {
  if (!max) return '';
  const filled = Math.max(1, Math.round((n / max) * width));
  return '█'.repeat(filled) + '·'.repeat(Math.max(0, width - filled));
};

export function printReport(name, d, recs, baseline = null) {
  const line = '─'.repeat(72);
  console.log(`\n${line}`);
  console.log(`  ${name}`);
  console.log(line);

  if (!d.ok) {
    console.log(`  ${d.reason}\n`);
    return;
  }

  /* Le profil moteur est une information, jamais un reproche. */
  const moteurs = d.profile.engines.length ? d.profile.engines.join(' · ') : 'HTML/CSS (aucun moteur détecté)';
  console.log(`  profil : ${moteurs}${d.profile.bridged ? ' · PONT OFFICIEL détecté' : ''}`);
  console.log(`  ${d.screens.total} écran(s) — ${d.page_units.documents} document(s), ${d.page_units.routes} route(s) · ${d.fragments.total} fragment(s) · ${d.sheets} feuille(s)`);
  console.log(`  écarts sur écrans : ${d.screens.ecarts} · densité ${d.screens.density} par écran`);
  if (d.fragments.total) console.log(`  écarts sur fragments : ${d.fragments.ecarts} (rapporté à part — la densité par écran reste comparable)`);
  console.log(`  vocabulaire du système employé : ${d.adoption.system_classes_used}/${d.adoption.total_classes} classes · ${d.adoption.tokens_referenced || 0} référence(s) var(--aime-*) en utilitaires`);

  console.log(`\n  FAMILLE          ÉCARTS  (écr · frag)`);
  const max = Math.max(...d.families.map((f) => f.count), 1);
  for (const f of d.families) {
    const mark = f.count === 0 ? '✓' : '✗';
    console.log(`  ${mark} ${f.family.padEnd(14)} ${String(f.count).padStart(5)}  (${String(f.screens ?? 0).padStart(3)} · ${String(f.fragments ?? 0).padStart(3)})  ${bar(f.count, max)}`);
  }

  if (d.screens.worst.length) {
    console.log('\n  ÉCRANS LES PLUS TOUCHÉS');
    for (const p of d.screens.worst.slice(0, 6)) {
      console.log(`    ${String(p.count).padStart(5)}  ${p.name}`);
    }
  }
  if (d.fragments.worst?.length) {
    console.log('\n  FRAGMENTS LES PLUS TOUCHÉS');
    for (const p of d.fragments.worst.slice(0, 4)) {
      console.log(`    ${String(p.count).padStart(5)}  ${p.name}`);
    }
  }
  if (d.hierarchy_unresolved) {
    console.log(`\n  HIÉRARCHIE NON RÉSOLUE — ${d.hierarchy_unresolved} écran(s) : le h1 vit hors du fichier, jamais deviné`);
    for (const r of (d.hierarchy_unresolved_detail || []).slice(0, 10)) console.log(`    · ${r}`);
  }
  if (d.icon_libraries?.length) {
    console.log(`\n  BIBLIOTHÈQUES D'ICÔNES TIERCES (nommées, jamais comptées en écarts)\n    ${d.icon_libraries.join(' · ')}`);
  }

  console.log('\n  PAR OÙ COMMENCER');
  for (const r of recs) {
    console.log(`    ${r.priority || '·'}  ${r.title}`);
    console.log(`       ${r.detail}`);
  }

  if (baseline) {
    console.log('\n  BASELINE (différence avec l\'exécution précédente)');
    console.log(`    nouveaux écarts :  ${baseline.added_count}`);
    console.log(`    écarts corrigés :  ${baseline.fixed_count}`);
    console.log(`    solde :            ${baseline.net > 0 ? '+' : ''}${baseline.net}`);
    for (const s of baseline.added.slice(0, 5)) console.log(`    + ${s.split('|')[0]} — ${s.split('|').slice(3).join('|')}`);
  }

  console.log(`\n  NON MESURÉ PAR CE RAPPORT`);
  for (const n of d.non_measured) console.log(`    · ${n}`);
  console.log('');
}

/* ── Point d'entrée ────────────────────────────────────────────── */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};
const has = (name) => args.includes(`--${name}`);

function run(label, target) {
  const collected = collect(target);
  const d = diagnose(collected, reference());

  if (has('json')) {
    process.stdout.write(JSON.stringify(reportJson(label, d), null, 2) + '\n');
    process.exit(d.ok && d.ecarts === 0 ? 0 : 1);
  }

  let baseline = null;
  if (flag('baseline')) {
    try {
      const prev = JSON.parse(readFileSync(resolve(flag('baseline')), 'utf8'));
      const current = reportJson(label, d);
      baseline = baselineDiff(current, prev);
    } catch (e) {
      console.error(`baseline illisible : ${e.message}`);
      process.exit(2);
    }
  }
  printReport(label, d, recommend(d), baseline);
  process.exit(d.ok && d.ecarts === 0 ? 0 : 1);
}

if (!isMain) {
  /* Importé : on ne fait rien. */
} else if (args.length && !args[0].startsWith('--')) {
  run(args[0], resolve(args[0]));
} else if (flag('owner') && flag('repo')) {
  run(`${flag('owner')}/${flag('repo')}`, fetchRepo(flag('owner'), flag('repo')));
} else {
  console.log(`
Diagnostic de projet — AIME Design System

  node diagnostic/diagnose.mjs <chemin>                 diagnostique un dossier local
  node diagnostic/diagnose.mjs --owner O --repo R       clone et diagnostique un dépôt
  node diagnostic/diagnose.mjs <chemin> --json          sortie machine déterministe
  node diagnostic/diagnose.mjs <chemin> --baseline A    diff avec un rapport précédent

Le diagnostic mesure et nomme. Il ne répare rien : la réparation reste
une décision humaine. Codes : 0 conforme · 1 écarts · 2 commande mal formée.
`);
  process.exit(2);
}
