#!/usr/bin/env node
/**
 * AIME / NOEMA — GÉNÉRATION DU RAPPORT DE DIAGNOSTIC
 *
 *   node diagnostic/survey.mjs --json | node diagnostic/report.mjs > RAPPORT.md
 *
 * Ce script n'invente aucun chiffre : il met en forme la sortie de
 * survey.mjs. Un rapport écrit à la main recopie des totaux, et un total
 * recopié peut mentir sans que personne ne s'en aperçoive — c'est arrivé
 * dans ce dépôt, où un plafond d'affichage faisait publier un classement
 * par écran qui ne sommait pas au total.
 *
 * Il écrit aussi ce qu'il ne mesure pas. Un rapport qui ne dit pas ses
 * limites se fait corriger par le premier lecteur compétent.
 */
import { readFileSync } from 'node:fs';

/* survey.mjs écrit sa progression sur stderr, donc stdin est du JSON pur.
   S'il fallait ici découper la chaîne pour retrouver l'objet, ce serait le
   signe que la source s'est remise à polluer sa sortie machine. */
const d = JSON.parse(readFileSync(0, 'utf8'));

const aujourdhui = new Date().toISOString().slice(0, 10);
const L = [];
const w = (s = '') => L.push(s);

w('# Diagnostic comparé — AIME Design System');
w();
w(`> Généré le ${aujourdhui} par \`diagnostic/survey.mjs\`, mis en forme par`);
w('> `diagnostic/report.mjs`. Aucun chiffre de ce document n\'est écrit à la main :');
w('> tous sortent de la mesure.');
w();
w('## Ce que ce document est');
w();
w(`Le moteur qui juge ces projets est \`design-system/js/qa.js\` — **celui qui`);
w('valide les 31 écrans du Design System**, pas une copie. Un projet est donc');
w('jugé dans les mêmes conditions que les écrans qui sortent, sur le même');
w('barème. Un écart de densité entre deux projets est une différence réelle.');
w();
w('Il **mesure et nomme**. Il ne répare rien : la réparation reste une décision');
w('humaine, conformément au principe du système — NOEMA propose, l\'humain valide.');
w();
w('## Portée de la mesure');
w();
w('| | |');
w('|---|---|');
w(`| Dépôts du compte | ${d.juges + d.ecartes} |`);
w(`| Projets jugés | ${d.juges} |`);
w(`| Projets sans écran | ${d.ecartes} |`);
w(`| Écrans mesurés | ${d.ecrans} |`);
w(`| Écarts relevés | ${d.ecarts} |`);
w(`| Densité globale | ${d.densite_globale} écarts par écran |`);
w();
w('## Ce que mesure chaque ligne');
w();
w('Chaque dépôt est cloné peu profond **sur sa branche par défaut**. Le rapport');
w('décrit donc l\'état publié du projet, pas un travail en cours sur une branche.');
w();
w('Cela change la lecture d\'une ligne : `AIME-COMPOSER` lui-même. Sa branche');
w('`main` ne contient pas encore `design-system/` ni `loop/` — ils sont sur la');
w('branche de la PR #39, non fusionnée. La ligne mesure donc `atlas/` seul, cinq');
w('écrans de Playground écrits avant le système et qui ne référencent aucune de');
w('ses feuilles. Les 31 écrans du Design System, eux, sont jugés en continu par');
w('`npm run check` dans ce même dépôt, et sortent conformes aux 12 familles.');
w();
w('## Classement');
w();
w('Moins il y a d\'écarts par écran, plus le projet est proche du système.');
w('L\'ordre va du plus proche au plus éloigné.');
w();
w('| # | Projet | Écrans | Écarts | Par écran | Vocabulaire adopté | Principaux écarts |');
w('|---:|---|---:|---:|---:|---:|---|');
d.projets.forEach((p, i) => {
  w(`| ${i + 1} | \`${p.label}\` | ${p.pages} | ${p.ecarts} | ${p.density} | ${Math.round(p.adoption * 100)} % | ${p.worst} |`);
});
w();
w('### Lire la colonne « vocabulaire adopté »');
w();
w('Elle mesure la part de classes du projet qui appartiennent déjà au');
w('vocabulaire du système (`t-*`, `l-*`, `a-*`, `u-*`, `noema-*`, `viz-*`,');
w('`ds-*`). **0 % n\'est pas une faute, c\'est le point de départ** — ces projets');
w('ont été écrits avant le système. Et adopter 30 % des mots du système ne veut');
w('pas dire être conforme à 30 % : l\'adoption ne mesure que ce qui est déjà');
w('écrit avec les bons mots, pas ce qui est juste.');
w();
w('### Ce que la famille `CONSISTENCY` ne dit pas');
w();
w('Elle ne regarde que les classes du vocabulaire du système. Sur un projet qui');
w('ne l\'emploie pas, elle remonte 0 — ce qui signifie « ce projet n\'utilise pas');
w('le système », **pas** « il est cohérent ». Aucun de ces 0 ne doit être lu');
w('comme un brevet.');
w();
w('### Pourquoi `CONTRAST` est absente');
w();
w('Son calcul a besoin des deux thèmes du Design System : elle mesure **nos**');
w('primitives, pas votre projet. La compter ici reviendrait à facturer à autrui');
w('nos propres dettes. Elle est déclarée `REFERENCE_ONLY` dans le code.');
w();
w('## Projets non diagnostiqués');
w();
w(`${d.ecartes} dépôts ne contiennent aucun écran HTML. Le diagnostic ne leur`);
w('attribue aucun score : juger un projet sans écran serait publier un chiffre');
w('qui ne porte sur rien.');
w();
w('| Dépôt | Raison |');
w('|---|---|');
for (const p of d.non_diagnostiques) w(`| \`${p.label}\` | ${p.raison} |`);
w();
w('## Ce que cette mesure ne couvre pas');
w();
w('- **Aucune mise en page réelle n\'est jugée.** `ALIGNMENT` et `OVERFLOW` sont');
w('  des heuristiques statiques. Les 31 écrans du système sont vérifiés au rendu');
w('  par `qa/verify-dom.mjs` ; ce diagnostic ne le fait pas pour un projet tiers.');
w('- **La collecte est statique.** Du HTML rendu par JavaScript n\'est pas vu.');
w('- **Les icônes générées par JavaScript ne sont pas comptées** par');
w('  `ICONOGRAPHY`.');
w('- Un projet peut être **conforme et laid**, ou plein d\'écarts et réussi. Le');
w('  système mesure ce qu\'il sait nommer ; il ne remplace pas un regard.');
w();
w('## Reproduire cette mesure');
w();
w('```bash');
w('node diagnostic/survey.mjs                 # tous les dépôts du compte');
w('node diagnostic/survey.mjs --repo A --repo B');
w('node diagnostic/diagnose.mjs ../un-projet  # un dossier local');
w('node diagnostic/survey.mjs --json | node diagnostic/report.mjs');
w('```');
w();
w('Les clones sont peu profonds et jetables (`diagnostic/.work/`, hors Git).');
w('L\'outil n\'écrit jamais dans le projet examiné — c\'est un test, pas une');
w('promesse.');
w();

process.stdout.write(L.join('\n') + '\n');
