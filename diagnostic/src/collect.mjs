/**
 * AIME / NOEMA — COLLECTE V1
 *
 * Parcourt un projet et en extrait ce que le Design System sait juger :
 * les écrans HTML et les feuilles CSS.
 *
 * Deux règles de fond :
 *
 *   1. Le parcours est LECTURE SEULE. Ce module n'écrit jamais dans le
 *      projet qu'il examine. Un diagnostic qui modifierait sa cible
 *      cesserait d'être un diagnostic.
 *
 *   2. Les artefacts de build sont exclus. Un `dist/` ou un `node_modules/`
 *      contient du code généré : le diagnostiquer produirait des centaines
 *      d'écarts qui ne correspondent à aucune décision humaine, et noierait
 *      les écarts réels. On juge le source, pas le produit.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';

/** Répertoires qui ne contiennent jamais de source à juger. */
export const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', 'coverage',
  '.next', '.nuxt', '.output', '.svelte-kit', '.parcel-cache', '.vite',
  '.turbo', '.cache', '.npm', '.venv', 'venv', '__pycache__', '.work',
]);

/** Fichiers trop volumineux pour être du markup écrit à la main. */
export const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Densité d'un fichier, en octets par ligne.
 *
 * Ce nombre est une INFORMATION rendue au rapport, pas un critère
 * d'exclusion. J'ai d'abord écrit une heuristique qui écartait les
 * fichiers denses comme « minifiés » : elle rejetait trois écrans sur
 * cinq d'atlas/, qui sont du source écrit à la main simplement rédigé
 * sur peu de lignes. Le diagnostic annonçait alors 227 écarts là où il
 * y en a 485 — une sous-déclaration silencieuse, exactement ce qu'un
 * rapport destiné à des clients ne peut pas se permettre.
 *
 * Un fichier généré se reconnaît à son emplacement (dist/, build/,
 * .next/…), et ces répertoires sont déjà exclus. Deviner au-delà, c'est
 * choisir de mentir par omission. On mesure donc tout ce qui est sous
 * le plafond de taille, et on publie la densité pour que l'humain voie
 * de lui-même si un fichier a l'air généré.
 */
export const densityOf = (text) => {
  const lines = text.split('\n').length;
  return Number((text.length / Math.max(1, lines)).toFixed(0));
};

/**
 * Parcourt un dossier et retourne écrans et feuilles.
 *
 * Retourne aussi `skipped` : ce qui a été écarté, et pourquoi. Dire ce
 * qu'on ne regarde pas fait partie du diagnostic — un rapport qui
 * tait ses exclusions laisse croire qu'il a tout vu.
 */
export function collect(root, { maxBytes = MAX_BYTES } = {}) {
  const abs = resolve(root);
  const pages = [];
  const cssFiles = [];
  const skipped = [];

  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      const rel = relative(abs, full);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
          skipped.push({ path: rel, reason: 'répertoire exclu' });
          continue;
        }
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = extname(entry.name).toLowerCase();
      if (!['.html', '.htm', '.css'].includes(ext)) continue;

      let size;
      try {
        size = statSync(full).size;
      } catch {
        continue;
      }
      if (size > maxBytes) {
        skipped.push({ path: rel, reason: `trop volumineux (${Math.round(size / 1024)} Ko)` });
        continue;
      }

      let text;
      try {
        text = readFileSync(full, 'utf8');
      } catch {
        skipped.push({ path: rel, reason: 'illisible' });
        continue;
      }
      if (ext === '.css') cssFiles.push({ name: rel, text, density: densityOf(text) });
      else pages.push({ name: rel, html: text, density: densityOf(text) });
    }
  };

  walk(abs);

  /* Ordre stable : un rapport doit être reproductible d'un run à l'autre. */
  const byName = (a, b) => a.name.localeCompare(b.name);
  pages.sort(byName);
  cssFiles.sort(byName);

  return { root: abs, pages, cssFiles, skipped };
}

/** Ce que le collecteur exclut — utile au rapport et aux tests. */
export function exclusions() {
  return {
    ignored_dirs: [...IGNORED_DIRS],
    max_bytes: MAX_BYTES,
    reason: 'on juge le source, pas le produit : un artefact de build ne correspond à aucune décision humaine',
  };
}
