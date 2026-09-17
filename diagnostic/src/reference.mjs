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
 * Le QA du Design System procède de même : `qa/run-qa.mjs` parcourt
 * `styles/` et passe **les huit** feuilles en `cssFiles`. Un projet jugé
 * ici doit l'être dans les mêmes conditions, sinon la comparaison n'a
 * pas de sens.
 *
 * `doc.css` est incluse, et son exclusion était une erreur que la mesure
 * a révélée : c'est la seule feuille qui définit le vocabulaire `ds-*`
 * (`ds-shell`, `ds-demo`, `ds-device`…). Sans elle, ces classes
 * remontaient comme « utilisées mais jamais définies » — 19 faux écarts
 * sur les onze écrans de `design-system/experiences/`, alors même que le
 * QA du système les déclare conformes. J'avais justifié l'exclusion en
 * disant qu'un projet n'est pas censé charger ce chrome : c'est vrai,
 * mais CONSISTENCY ne prescrit pas ce qu'il faut charger, elle vérifie
 * si ce qui est employé existe quelque part dans le système. Rendre
 * l'assertion fausse pour rester cohérent avec une intention, c'est
 * exactement ce qu'un diagnostic ne doit pas faire.
 */
export function systemStylesheets() {
  const dir = join(DS, 'styles');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.css'))
    .sort()
    .map((f) => ({ name: f, text: readFileSync(join(dir, f), 'utf8'), system: true }));
}
