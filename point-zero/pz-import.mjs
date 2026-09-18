/**
 * AIME — POINT ZERO · moteur d'import local (pur, testable).
 *
 * Aucune dépendance, aucun accès DOM, aucun réseau : ce module lit des
 * octets et des noms, et rend des constats. Les décisions (« mémoriser »,
 * « classer comme contrat ») restent à NOEMA et à l'humain — jamais ici.
 *
 *   classifyName(nom)      → extension + type universel
 *   zipIndex(octets)       → table des entrées d'un ZIP (central directory)
 *   pdfTriage(octets)      → version, nombre de pages, titre d'un PDF
 *   summarizeImport(lots)  → couverture publiée d'un import (doublons par empreinte)
 *
 * Testé par pz-import.test.mjs — `node point-zero/pz-import.test.mjs`.
 */

/* ── Classification universelle (visuel/vidéo/audio/vecteur/…) ── */
const EXT_KIND = [
  [/^(png|jpe?g|webp|gif|avif|bmp|ico)$/, 'image'],
  [/^(mp4|webm|mov|m4v)$/, 'video'],
  [/^(mp3|wav|ogg|flac|aac|m4a)$/, 'audio'],
  [/^(svg)$/, 'vecteur'],
  [/^(pdf|md|txt|docx?|odt|csv|rtf)$/, 'document'],
];

export function classifyName(name) {
  const base = String(name || '').split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
  if (ext === 'zip') return { ext, kind: 'archive' };
  const hit = EXT_KIND.find(([re]) => re.test(ext));
  return { ext, kind: hit ? hit[1] : 'autre' };
}

/* ── ZIP : index central, lu localement ─────────────────────────
   On lit la fin de catalogue (EOCD) puis chaque entrée du central
   directory. Aucune décompression ici : l'index est un constat —
   l'extraction d'une entrée utilise DecompressionStream côté écran,
   quand le navigateur la fournit. */
const EOCD_SIG = 0x06054b50;
const CDIR_SIG = 0x02014b50;

export function zipIndex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  /* L'EOCD est dans les derniers octets (commentaire possible ≤ 64 Ko). */
  const min = Math.max(0, bytes.length - 65557);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd === -1) return { ok: false, reason: 'fin de catalogue introuvable — archive illisible ou tronquée', entries: [] };
  const count = view.getUint16(eocd + 10, true);
  let off = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let n = 0; n < count && off + 46 <= bytes.length; n++) {
    if (view.getUint32(off, true) !== CDIR_SIG) break;
    const method = view.getUint16(off + 10, true);
    const packed = view.getUint32(off + 20, true);
    const size = view.getUint32(off + 24, true);
    const nameLen = view.getUint16(off + 28, true);
    const extraLen = view.getUint16(off + 30, true);
    const commentLen = view.getUint16(off + 32, true);
    const name = new TextDecoder('utf-8').decode(bytes.slice(off + 46, off + 46 + nameLen));
    const dir = name.endsWith('/');
    entries.push({ name, dir, size, packed, method: method === 0 ? 'stocké' : method === 8 ? 'déflaté' : `méthode ${method}` });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return { ok: true, count, entries, files: entries.filter((e) => !e.dir).length };
}

/* ── PDF : triage honnête, pas une extraction déguisée ──────────
   Ce que l'on mesure vraiment : version déclarée, nombre d'objets
   page, titre d'Info si présent. Le texte intégral attend l'étape
   dédiée de P4 — être exact sur ce qu'on ne lit pas. */
export function pdfTriage(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  if (!head.startsWith('%PDF-')) return { ok: false, reason: 'signature %PDF absente — ce n\u2019est pas un PDF lisible', pages: 0 };
  const version = head.slice(5, 8);
  /* Le corps est lu en latin1 : suffisant pour les objets et les titres
     PDFDoc/ASCII. Un titre UTF-16 (BOM FE FF) ressortirait en caractères
     doublés — limite déclarée, l'extraction fidèle reste l'étape P4. */
  const body = new TextDecoder('latin1').decode(bytes);
  const pages = (body.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const tm = body.match(/\/Title\s*\(([^)\r\n]{1,200})/);
  return { ok: true, version, pages, title: tm ? tm[1].trim() : null };
}

/* ── Couverture publiée d'un import ─────────────────────────────
   lots : [{ name, kind, size, sha?, skip? }]
   → totaux par type, éléments écartés NOMMÉS avec raison, doublons
     regroupés par empreinte. Une absence ou un échec est un constat,
     jamais un angle mort. */
export function summarizeImport(lots) {
  const byKind = {};
  const skipped = [];
  const groups = new Map();
  for (const it of lots || []) {
    if (it.skip) { skipped.push({ name: it.name, reason: it.skip }); continue; }
    byKind[it.kind] = (byKind[it.kind] || 0) + 1;
    if (it.sha) {
      const g = groups.get(it.sha) || [];
      g.push(it.name);
      groups.set(it.sha, g);
    }
  }
  const dupes = [...groups.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([sha, names]) => ({ sha: sha.slice(0, 12), names }));
  const hashed = (lots || []).filter((i) => i.sha).length;
  const kept = (lots || []).filter((i) => !i.skip);
  return {
    total: (lots || []).length,
    kept: kept.length,
    byKind,
    skipped,
    dupes,
    hashed,
    unhashed: kept.length - hashed,
  };
}
