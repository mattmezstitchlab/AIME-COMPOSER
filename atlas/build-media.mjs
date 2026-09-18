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

/* Traverse complète garantie : l'endpoint `?recursive=1` tronque les très
   gros arbres (champ `truncated`). Dans ce cas on descend dans chaque
   sous-arbre — borne d'appels pour ne pas dérailler, et si la borne saute
   on LE DIT dans le catalogue plutôt que prétendre une couverture entière. */
const CALL_BUDGET = 240;
let calls = 0;

function fetchTree(repo, sha) {
  calls++;
  return gh(['api', `repos/${OWNER}/${repo}/git/trees/${encodeURIComponent(sha)}?recursive=1`]);
}

function walkTree(repo, branch) {
  const out = [];
  const root = fetchTree(repo, branch);
  const queue = [];
  let truncated = root.truncated;
  if (root.truncated) {
    for (const n of root.tree || []) {
      if (n.type === 'tree') queue.push(n);
      else out.push(n);
    }
    /* En mode dégradé, le sommaire racine contient les dossiers : on les
       re-télécharge chacun en récursif, ce qui passe chacun sous la limite. */
    const dirs = (root.tree || []).filter((n) => n.type === 'tree');
    const saw = new Set(dirs.map((d) => d.sha));
    /* Les fichiers du sommaire racine tronqué peuvent être incomplets — on
       garde ceux qu'on a (sha unique, donc pas de doublon). */
    while (queue.length && calls < CALL_BUDGET) {
      const dir = queue.shift();
      if (!dir || !dir.path) continue;
      try {
        const sub = fetchTree(repo, dir.sha);
        for (const n of sub.tree || []) {
          if (n.type === 'tree') {
            if (!saw.has(n.sha)) { saw.add(n.sha); queue.push(n); }
          } else {
            out.push({ ...n, path: `${dir.path}/${n.path}` });
          }
        }
        if (!sub.truncated) truncated = calls >= CALL_BUDGET;
      } catch { /* un sous-arbre indisponible ne masque pas les autres */ }
    }
    if (queue.length && calls >= CALL_BUDGET) truncated = true;
    else if (!queue.length) truncated = false;
  } else {
    out.push(...(root.tree || []).filter((n) => n.type === 'blob'));
  }
  /* Déduplication par sha : hors mode tronqué les chemins sont déjà uniques. */
  const uniq = new Map();
  for (const n of out) {
    if (n.type !== 'blob') continue;
    if (!uniq.has(n.path)) uniq.set(n.path, n);
  }
  return { files: [...uniq.values()], truncated };
}

const repos = gh(['repo', 'list', OWNER, '--limit', '100', '--json', 'name,isPrivate,defaultBranchRef']);
console.log(`${repos.length} dépôts trouvés sur ${OWNER}.`);

const items = [];
const covered = [];
let truncated = false;

for (const r of repos) {
  const name = r.name;
  const branch = r.defaultBranchRef?.name || 'HEAD';
  const rec = { name, private: !!r.isPrivate, default_branch: branch, media: 0, state: 'ok', tree_truncated: false };
  try {
    const { files, truncated: cut } = walkTree(name, branch);
    rec.tree_truncated = cut;
    if (cut) truncated = true;
    for (const n of files) {
      if (!n.path || EXCLUDE.test(n.path)) continue;
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
        sha: n.sha || null,
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
    const raw = ((e.stderr ? String(e.stderr) : '') + ' ' + (e.message || 'erreur'));
    const isEmpty = /Git Repository is empty/i.test(raw);
    rec.state = isEmpty ? 'vide' : 'erreur';
    rec.error = (isEmpty ? 'dépôt Git vide (aucun commit sur la branche)' : raw).split('\n')[0].slice(0, 120);
  }
  covered.push(rec);
  console.log(`  ${rec.state !== 'ok' ? '✗' : '✓'} ${name} : ${rec.media} média(s)${rec.error ? ` — ${rec.error}` : ''}${rec.tree_truncated ? ' — arbre tronqué (borne d\u2019appels)' : ''}`);
  if (items.length >= MAX_ITEMS) break;
}

const counts = {};
for (const it of items) counts[it.kind] = (counts[it.kind] || 0) + 1;
/* Doublons réels : même contenu (sha git), pas même nom — gravé dans l'arbre. */
const bySha = {};
for (const it of items) if (it.sha) (bySha[it.sha] = bySha[it.sha] || []).push(it);
const duplicateGroups = Object.values(bySha).filter((g) => g.length > 1);
for (const g of duplicateGroups) for (const it of g) it.duplicate_of = g[0].id;
const duplicates = items.filter((it) => it.duplicate_of).length;

const catalog = {
  generated_at: new Date().toISOString(),
  generator: 'atlas/build-media.mjs',
  owner: OWNER,
  truncated,
  totals: {
    repos: covered.length,
    repos_with_media: covered.filter((c) => c.media > 0).length,
    repos_empty: covered.filter((c) => c.state === 'vide').length,
    repos_error: covered.filter((c) => c.state === 'erreur').length,
    media: items.length,
    duplicates,
    ...counts,
  },
  repos: covered,
  items,
};
writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
console.log(`\n${items.length} médias · ${catalog.totals.repos_with_media}/${covered.length} dépôts avec médias · ${duplicates} doublon(s) de contenu`);
console.log(`Catalogue : ${OUT}`);
