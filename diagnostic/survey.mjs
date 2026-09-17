#!/usr/bin/env node
/**
 * AIME / NOEMA — DIAGNOSTIC COMPARÉ
 *
 * Passe plusieurs projets devant le même juge et les classe.
 *
 *   node diagnostic/survey.mjs                    tous les dépôts HTML du compte
 *   node diagnostic/survey.mjs --repo A --repo B  une sélection
 *   node diagnostic/survey.mjs --path ../projet   un dossier local
 *
 * L'intérêt n'est pas le chiffre absolu mais la comparaison : tous ces
 * projets sont mesurés par le même moteur, sur le même barème, dans les
 * mêmes conditions que les écrans du Design System. Un écart de densité
 * entre deux projets est donc une différence réelle, pas un artefact.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { collect } from './src/collect.mjs';
import { diagnose } from './src/diagnose.mjs';
import { reference } from './src/reference.mjs';
import { fetchRepo } from './diagnose.mjs';

const OWNER = process.env.AIME_OWNER || 'mattmezstitchlab';

const args = process.argv.slice(2);
/* Une seule fonction de lecture d'arguments : la variante « all » que
   j'avais écrite d'abord indexait mal le tableau et renvoyait n'importe
   quoi. Elle n'était appelée par personne — du code mort qui aurait fini
   par être cru. */
const flags = (name) => args.reduce((acc, a, i) => (a === `--${name}` ? [...acc, args[i + 1]] : acc), []);

/* ── Cibles ────────────────────────────────────────────────────── */
let targets = [];

for (const p of flags('path')) targets.push({ label: p, kind: 'path', value: resolve(p) });
for (const r of flags('repo')) targets.push({ label: `${OWNER}/${r}`, kind: 'repo', value: r });

if (!targets.length) {
  /* Aucun argument : tous les dépôts du compte qui contiennent du HTML.
     On ne juge pas un dépôt sans écran — ce serait lui attribuer un
     score de conformité qui ne porte sur rien. */
  const raw = execFileSync('gh', ['repo', 'list', OWNER, '--limit', '200',
    '--json', 'name,primaryLanguage', '--jq', '.[].name'], { encoding: 'utf8' });
  const names = raw.trim().split('\n').filter(Boolean);
  console.log(`\n${names.length} dépôts trouvés sur ${OWNER} — clonage peu profond…\n`);
  for (const name of names) targets.push({ label: `${OWNER}/${name}`, kind: 'repo', value: name });
}

/* ── Mesure ────────────────────────────────────────────────────── */
const REF = reference();
const rows = [];

for (const t of targets) {
  let root;
  try {
    root = t.kind === 'path' ? t.value : fetchRepo(OWNER, t.value);
  } catch (e) {
    rows.push({ label: t.label, error: `inaccessible — ${String(e.message).split('\n')[0]}` });
    continue;
  }
  const collected = collect(root);
  const d = diagnose(collected, REF);
  if (!d.ok) {
    rows.push({ label: t.label, pages: 0, note: d.reason });
    continue;
  }
  rows.push({
    label: t.label,
    pages: d.pages,
    ecarts: d.ecarts,
    density: d.density,
    adoption: d.adoption.ratio,
    worst: d.families.filter((f) => f.count).sort((a, b) => b.count - a.count).slice(0, 3)
      .map((f) => `${f.family} ${f.count}`).join(' · '),
  });
}

/* ── Rendu ─────────────────────────────────────────────────────── */
const judged = rows.filter((r) => r.pages > 0).sort((a, b) => a.density - b.density);
const unjudged = rows.filter((r) => !r.pages);

const line = '─'.repeat(96);
console.log(`\n${line}`);
console.log('  DIAGNOSTIC COMPARÉ — AIME Design System');
console.log(line);
console.log('  Moins il y a d\'écarts par écran, plus le projet est proche du système.\n');
console.log(`  ${'PROJET'.padEnd(34)} ${'ÉCR.'.padStart(5)} ${'ÉCARTS'.padStart(7)} ${'/ÉCRAN'.padStart(7)}  PRINCIPAUX ÉCARTS`);
console.log(`  ${'─'.repeat(92)}`);

for (const r of judged) {
  console.log(`  ${r.label.slice(0, 34).padEnd(34)} ${String(r.pages).padStart(5)} ${String(r.ecarts).padStart(7)} ${String(r.density).padStart(7)}  ${r.worst}`);
}

if (unjudged.length) {
  console.log(`\n  NON DIAGNOSTIQUÉS`);
  for (const r of unjudged) {
    console.log(`  ${r.label.slice(0, 34).padEnd(34)} ${r.error || r.note}`);
  }
}

if (judged.length) {
  const best = judged[0];
  const worst = judged[judged.length - 1];
  console.log(`\n  ${judged.length} projet(s) jugé(s) · ${unjudged.length} écarté(s)`);
  console.log(`  le plus proche du système : ${best.label} (${best.density} écart/écran)`);
  console.log(`  le plus éloigné           : ${worst.label} (${worst.density} écart/écran)`);
}

console.log(`\n  Ce rapport mesure et nomme. Il ne répare rien : la réparation
  reste une décision humaine. Aucune mise en page réelle n'est jugée
  (jsdom n'a pas de moteur de layout).\n`);
