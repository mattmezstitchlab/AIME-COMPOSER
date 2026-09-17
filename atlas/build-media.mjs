#!/usr/bin/env node
/**
 * MÉDIATHÈQUE — extraction du catalogue.
 *
 * Parcourt les arbres git des dépôts du compte (via `gh api`), relève les
 * fichiers médias — images, vidéos, audio, vecteurs — et écrit `media.json`.
 * Le catalogue est GÉNÉRÉ par cette mesure et jamais écrit à la main : la
 * date `generated_at` et la liste des dépôts couverts sont publiées avec.
 *
 * Un dépôt privé n'est pas lisible depuis un navigateur anonyme : ses entrées
 * portent `url: null` — la médiathèque affiche alors la tuile de type et le
 * lien source GitHub, elle ne simule pas une image qu'elle ne peut pas voir.
 *
 * Usage : node atlas/build-media.mjs [--owner ORG] [--out atlas/media.json]
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : dflt;
};
const OWNER = arg('owner', 'mattmezstitchlab');
const OUT = join(HERE, arg('out', 'media.json'));
const MAX_ITEMS = Number(arg('max', 800));

const KIND = {
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', gif: 'image', avif: 'image',
  svg: 'vecteur',
  mp4: 'video', webm: 'video', mov: 'video', m4v: 'video', avi: 'video',
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', m4a: 'audio',
};
/* Les chemins de fabrication ne sont pas des médias de projet. */
const EXCLUDE = /(^|\/)(node_modules|\.git|dist|build|out|coverage|target|vendor|\.next|\.svelte-kit|\.vercel|__pycache__|\.work)\//;

const gh = (apiArgs) => JSON.parse(execFileSync('gh', apiArgs, { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 }));

const repos = gh(['repo', 'list', OWNER, '--limit', '100', '--json', 'name,isPrivate,defaultBranchRef']);
console.log(`${repos.length} dépôts trouvés sur ${OWNER}.`);

const items = [];
const covered = [];
let truncated = false;

for (const r of repos) {
  const name = r.name;
  const branch = r.defaultBranchRef?.name || 'HEAD';
  const rec = { name, private: !!r.isPrivate, default_branch: branch, media: 0, error: null, tree_truncated: false };
  try {
    const tree = gh(['api', `repos/${OWNER}/${name}/git/trees/${encodeURIComponent(branch)}?recursive=1`]);
    if (tree.truncated) { rec.tree_truncated = true; truncated = true; }
    for (const n of tree.tree || []) {
      if (n.type !== 'blob' || !n.path || EXCLUDE.test(n.path)) continue;
      const ext = n.path.split('.').pop().toLowerCase();
      const kind = KIND[ext];
      if (!kind) continue;
      const p = n.path.split('/').map(encodeURIComponent).join('/');
      const b = encodeURIComponent(branch);
      items.push({
        id: `med-${String(items.length + 1).padStart(4, '0')}`,
        repo: name,
        path: n.path,
        name: n.path.split('/').pop(),
        kind,
        ext,
        size: n.size || 0,
        /* Deux couches de disponibilité : jsDelivr (CDN) puis raw. Un dépôt
           privé n'a ni l'une ni l'autre côté navigateur — tuile honnête. */
        url: r.isPrivate ? null : `https://cdn.jsdelivr.net/gh/${OWNER}/${name}@${b}/${p}`,
        url_raw: r.isPrivate ? null : `https://raw.githubusercontent.com/${OWNER}/${name}/${b}/${p}`,
        source: `https://github.com/${OWNER}/${name}/blob/${b}/${p}`,
      });
      rec.media++;
      if (items.length >= MAX_ITEMS) break;
    }
  } catch (e) {
    rec.error = (e.message || 'erreur').split('\n')[0].slice(0, 120);
  }
  covered.push(rec);
  console.log(`  ${rec.error ? '✗' : '✓'} ${name} : ${rec.media} média(s)${rec.error ? ` — ${rec.error}` : ''}${rec.tree_truncated ? ' — arbre tronqué' : ''}`);
  if (items.length >= MAX_ITEMS) break;
}

const counts = {};
for (const it of items) counts[it.kind] = (counts[it.kind] || 0) + 1;

const catalog = {
  generated_at: new Date().toISOString(),
  generator: 'atlas/build-media.mjs',
  owner: OWNER,
  truncated,
  totals: { repos: covered.length, repos_with_media: covered.filter((c) => c.media > 0).length, media: items.length, ...counts },
  repos: covered,
  items,
};
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
console.log(`\n${items.length} médias · ${catalog.totals.repos_with_media}/${covered.length} dépôts avec médias`);
console.log(`Catalogue : ${OUT}`);
