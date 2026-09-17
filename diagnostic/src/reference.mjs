/**
 * AIME / NOEMA — BARÈME DE RÉFÉRENCE
 *
 * Le diagnostic ne contient aucune règle en propre. Il lit le barème
 * depuis le Design System — tokens, icônes, échelles — et le transmet
 * au moteur `design-system/js/qa.js`.
 *
 * S'il contenait ses propres seuils, il pourrait diverger du système
 * qu'il est censé faire respecter, et un projet jugé « conforme » par
 * lui pourrait être refusé par le QA. Une seule source, un seul juge.
 *
 * Ce module est séparé du point d'entrée CLI pour pouvoir être importé
 * sans déclencher d'exécution : un test ne doit pas avoir d'effet de bord.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DS = resolve(HERE, '..', '..', 'design-system');

/** Chemin du Design System — utile aux tests qui vérifient la source. */
export const DESIGN_SYSTEM = DS;

/**
 * Lit le barème. Une seule lecture par processus suffit, mais la
 * fonction reste pure : elle ne mémorise rien, pour qu'un test puisse
 * la rappeler sans hériter d'un état.
 */
export function reference() {
  return {
    tokenCss: { name: 'tokens.css', text: readFileSync(join(DS, 'tokens/tokens.css'), 'utf8') },
    tokensJson: JSON.parse(readFileSync(join(DS, 'tokens/tokens.json'), 'utf8')),
    sprite: readFileSync(join(DS, 'assets/aime-icons.svg'), 'utf8'),
    systemCss: systemStylesheets(),
  };
}

/**
 * Les feuilles du Design System, nommées comme le moteur les attend.
 *
 * Indispensables, et leur absence produisait un rapport faux : sans
 * elles, une classe du système employée à bon escient — `t-h1`,
 * `l-page` — remontait comme « utilisée mais jamais définie ». Le
 * diagnostic punissait donc précisément le comportement qu'il est
 * censé récompenser.
 *
 * Le QA du Design System procède de même : il passe `styles/` en
 * `cssFiles`. Un projet jugé ici est jugé dans les mêmes conditions
 * que les écrans du système, sinon la comparaison n'a pas de sens.
 *
 * `doc.css` est exclue : c'est le chrome de la documentation du
 * système, pas une couche qu'un projet est censé charger.
 */
export function systemStylesheets() {
  const dir = join(DS, 'styles');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.css') && f !== 'doc.css')
    .sort()
    .map((f) => ({ name: f, text: readFileSync(join(dir, f), 'utf8'), system: true }));
}
