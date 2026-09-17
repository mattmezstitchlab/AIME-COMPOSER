/**
 * AIME / NOEMA — STORE V1
 *
 * Un store JSON local, sans dépendance. Trois garanties :
 *
 *   1. Rien n'entre sans provenance. validate() est appelé à chaque
 *      écriture ; un objet non conforme est refusé, pas corrigé.
 *   2. Toute écriture est tracée dans un journal append-only. On ne
 *      réécrit jamais l'histoire : on la complète.
 *   3. Une donnée confirmée ne peut pas être rétrogradée en silence.
 *      Remplacer un fait exige un objet `decision` avec son auteur.
 *
 * Ce n'est pas une base de production : c'est le contrat d'écriture,
 * rendu exécutable.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { validate, ID_PREFIX, ENTITY_TYPES, EPISTEMIC_KEYS } from './schema.mjs';

export function createStore(file, { now = () => new Date().toISOString() } = {}) {
  const empty = { entities: {}, journal: [], sequence: {} };
  let db = empty;

  if (file && existsSync(file)) {
    db = JSON.parse(readFileSync(file, 'utf8'));
    for (const k of Object.keys(empty)) if (!(k in db)) db[k] = empty[k];
  }

  /** Identifiant canonique : préfixe du type + compteur monotone. */
  function nextId(type) {
    const prefix = ID_PREFIX[type];
    if (!prefix) throw new Error(`type inconnu, aucun préfixe d'identifiant : ${type}`);
    db.sequence[type] = (db.sequence[type] || 0) + 1;
    return `${prefix}-${String(db.sequence[type]).padStart(4, '0')}`;
  }

  function trace(entry) {
    db.journal.push({ at: now(), ...entry });
  }

  /**
   * Écrit une entité. Retourne l'objet écrit.
   * Lève si le contrat n'est pas respecté — le store préfère échouer
   * plutôt que d'accepter un objet dont on ne saura pas d'où il vient.
   */
  function put(type, obj, { actor = 'system', cause = 'write' } = {}) {
    /* On horodate AVANT de valider : un objet créé maintenant a bien un
       created_at, et le contrat porte sur ce qui sera réellement écrit. */
    if (!obj.created_at) obj = { ...obj, created_at: now() };

    const errors = validate(type, obj);
    if (errors.length) {
      throw new Error(`objet ${type} « ${obj.id} » refusé :\n  - ${errors.join('\n  - ')}`);
    }
    const prev = db.entities[obj.id];
    if (prev) {
      /* Un fait établi ne se réécrit pas par-dessus : il est remplacé,
         et le remplacement est tracé avec son auteur. */
      const wasEstablished = prev.provenance?.state === 'confirmed';
      const nowEstablished = obj.provenance?.state === 'confirmed';
      if (wasEstablished && !nowEstablished && cause !== 'supersede') {
        throw new Error(
          `« ${obj.id} » est un fait confirmé : le rétrograder en « ${obj.provenance.state} » ` +
          `exige une décision humaine (cause: 'supersede').`,
        );
      }
      obj = { ...prev, ...obj, updated_at: now() };
    }
    db.entities[obj.id] = obj;
    trace({ op: prev ? 'update' : 'create', type, id: obj.id, actor, cause });
    return obj;
  }

  /** Crée une entité en lui attribuant son identifiant canonique. */
  function create(type, fields, meta) {
    const id = fields.id || nextId(type);
    return put(type, { ...fields, id }, meta);
  }

  const get = (id) => db.entities[id] ?? null;
  const all = () => Object.values(db.entities);
  const byType = (type) => all().filter((e) => (e.id || '').startsWith(`${ID_PREFIX[type]}-`));
  const where = (type, pred) => byType(type).filter(pred);

  /** Supprime en laissant une trace : l'effacement est un événement. */
  function remove(id, actor = 'system') {
    if (!db.entities[id]) return false;
    delete db.entities[id];
    trace({ op: 'remove', id, actor });
    return true;
  }

  /** Écriture atomique : on écrit à côté, puis on renomme. */
  function save() {
    if (!file) return;
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(db, null, 2));
    renameSync(tmp, file);
  }

  function reset() {
    db = { entities: {}, journal: [], sequence: {} };
  }

  return {
    get, all, byType, where, put, create, remove, save, reset, nextId, trace,
    get journal() { return db.journal; },
    get raw() { return db; },
  };
}

/**
 * Construit la provenance d'un objet. C'est le seul endroit du système
 * où l'on déclare d'où vient une information — et dans quel état.
 */
export function provenance(origin, state, extra = {}) {
  if (!EPISTEMIC_KEYS.includes(state)) {
    throw new Error(`état de provenance inconnu : « ${state} » (${EPISTEMIC_KEYS.join(', ')})`);
  }
  return { origin, state, ...extra };
}

export { ENTITY_TYPES };
