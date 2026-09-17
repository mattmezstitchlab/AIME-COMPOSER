#!/usr/bin/env node
/**
 * AIME / NOEMA — DIAGNOSTIC DE PROJET
 *
 * Fait passer un projet devant le juge du Design System et rend un
 * rapport : ce qui s'écarte du système, où, et par quoi commencer.
 *
 *   node diagnostic/diagnose.mjs <chemin-vers-le-projet>
 *   node diagnostic/diagnose.mjs --owner mattmezstitchlab --repo Butterfly
 *
 * Le diagnostic ne répare rien. Il mesure, il nomme, il priorise.
 * La réparation reste une décision humaine.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { collect } from './src/collect.mjs';
import { diagnose, recommend } from './src/diagnose.mjs';
import { reference } from './src/reference.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, '.work');

export { reference };

/** Récupère un dépôt GitHub en lecture seule, dans un dossier jetable. */
export function fetchRepo(owner, repo, { depth = 1, refresh = true } = {}) {
  const dest = join(WORK, `${owner}--${repo}`);
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };

  /* Un diagnostic doit pouvoir être relancé. `gh repo clone` refuse un
     dossier existant : sans ce traitement, le second run échouait et
     l'outil n'était utilisable qu'une fois par dépôt. */
  if (existsSync(dest)) {
    if (!refresh) return dest;
    /* Rejouer l'état courant plutôt que re-télécharger : plus rapide, et
       cela garantit qu'on juge bien la tête du dépôt. */
    execFileSync('git', ['-C', dest, 'fetch', '--depth', String(depth), 'origin'], { stdio: 'ignore', env });
    const branch = execFileSync('git', ['-C', dest, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8', env }).trim();
    execFileSync('git', ['-C', dest, 'reset', '--hard', `origin/${branch}`], { stdio: 'ignore', env });
    return dest;
  }

  /* Clone peu profond : on juge l'état courant, pas l'historique. */
  execFileSync('gh', ['repo', 'clone', `${owner}/${repo}`, dest, '--', `--depth=${depth}`, '--quiet'], {
    stdio: 'inherit',
    env,
  });
  return dest;
}

/* ── Rendu console ─────────────────────────────────────────────── */
const bar = (n, max, width = 24) => {
  if (!max) return '';
  const filled = Math.max(1, Math.round((n / max) * width));
  return '█'.repeat(filled) + '·'.repeat(Math.max(0, width - filled));
};

export function printReport(name, d, recs) {
  const line = '─'.repeat(72);
  console.log(`\n${line}`);
  console.log(`  ${name}`);
  console.log(line);

  if (!d.ok) {
    console.log(`  ${d.reason}\n`);
    return;
  }

  console.log(`  ${d.pages} écran(s) · ${d.stylesheets} feuille(s) de style · ${d.skipped.length} fichier(s) écarté(s)`);
  console.log(`  ${d.ecarts} écart(s) · densité ${d.density} par écran`);
  console.log(`  vocabulaire du système employé : ${d.adoption.system_classes_used}/${d.adoption.total_classes} classes`);

  console.log(`\n  FAMILLE          ÉCARTS  `);
  const max = Math.max(...d.families.map((f) => f.count), 1);
  for (const f of d.families) {
    const mark = f.count === 0 ? '✓' : '✗';
    console.log(`  ${mark} ${f.family.padEnd(14)} ${String(f.count).padStart(5)}  ${bar(f.count, max)}`);
  }

  if (d.worst_pages.length) {
    console.log('\n  ÉCRANS LES PLUS TOUCHÉS');
    for (const p of d.worst_pages.slice(0, 6)) {
      console.log(`    ${String(p.count).padStart(5)}  ${p.name}`);
    }
  }

  console.log('\n  PAR OÙ COMMENCER');
  for (const r of recs) {
    console.log(`    ${r.priority || '·'}  ${r.title}`);
    console.log(`       ${r.detail}`);
  }

  console.log(`\n  NON MESURÉ PAR CE RAPPORT`);
  console.log(`    · ${d.reference_only.map((f) => f.family).join(', ')} — décrivent le Design System, pas le projet`);
  console.log(`    · la mise en page réelle : jsdom n'a pas de moteur de layout`);
  console.log(`    · ${d.skipped.length} fichier(s) écarté(s) : ${[...new Set(d.skipped.map((s) => s.reason))].join(' · ') || 'aucun'}`);
  console.log('');
}

/* ── Point d'entrée ────────────────────────────────────────────── */
/* Un module importé — par un test, par un autre outil — ne doit rien
   exécuter. Sans ce garde, importer `reference` depuis les tests
   affichait l'aide du CLI et sortait du processus. */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : null;
};

if (!isMain) {
  /* Importé : on ne fait rien. */
} else if (args.length && !args[0].startsWith('--')) {
  const target = resolve(args[0]);
  const collected = collect(target);
  const d = diagnose(collected, reference());
  printReport(args[0], d, recommend(d));
  process.exit(d.ok && d.density === 0 ? 0 : 1);
} else if (flag('owner') && flag('repo')) {
  const dest = fetchRepo(flag('owner'), flag('repo'));
  const collected = collect(dest);
  const d = diagnose(collected, reference());
  printReport(`${flag('owner')}/${flag('repo')}`, d, recommend(d));
  process.exit(d.ok && d.density === 0 ? 0 : 1);
} else {
  console.log(`
Diagnostic de projet — AIME Design System

  node diagnostic/diagnose.mjs <chemin>            diagnostique un dossier local
  node diagnostic/diagnose.mjs --owner O --repo R  clone et diagnostique un dépôt

Le diagnostic mesure et nomme. Il ne répare rien : la réparation reste
une décision humaine.
`);
  process.exit(2);
}
