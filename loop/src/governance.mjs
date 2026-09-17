/**
 * AIME / NOEMA — GOUVERNANCE DE LA MÉMOIRE V1
 *
 * Constitution §6 : « La mémoire appartient à l'humain. »
 *
 *   VOIR · COMPRENDRE · CORRIGER · SUPPRIMER · PAUSER · LIMITER · PARTAGER · RÉVOQUER
 *
 * Ces huit droits étaient nommés dans la constitution et absents du code.
 * Ce module les implémente comme des opérations réelles sur le store,
 * pas comme des boutons décoratifs.
 *
 * Trois principes de fond :
 *
 *   1. Chaque droit exige un acteur et laisse une trace. Un droit exercé
 *      anonymement n'est pas vérifiable, donc ce n'est pas un droit.
 *
 *   2. CORRIGER ne remplace jamais en silence. La valeur précédente est
 *      conservée dans la décision, la nouvelle est écrite en état
 *      `confirmed`, et l'ancienne passe en `superseded`. Une correction
 *      invisible est une falsification.
 *
 *   3. SUPPRIMER supprime vraiment le contenu — c'est le sens du droit —
 *      mais laisse une pierre tombale : la preuve qu'une suppression a
 *      eu lieu, sans le contenu supprimé. Un effacement qui ne laisse
 *      aucune trace n'est pas auditable ; une suppression qui conserve
 *      le contenu n'est pas une suppression.
 *
 * PAUSER n'est pas décoratif non plus : un sujet en pause est exclu de
 * l'observation (voir `isPaused` et son usage dans noema.mjs).
 */
import { provenance } from './store.mjs';
import {
  MEMORY_RIGHTS,
  MEMORY_CATEGORIES,
  VISIBILITY,
  CATEGORY_VISIBILITY_CEILING,
} from './schema.mjs';

const PREFIX = {
  person: 'ppl', organization: 'org', project: 'prj', object: 'obj', relation: 'rel',
  event: 'evt', asset: 'ast', document: 'doc', version: 'ver', proposal: 'prop',
  decision: 'dec', proof: 'prf', action: 'act', grant: 'grt', tombstone: 'tmb',
};

const typeOf = (id) => Object.keys(PREFIX).find((t) => String(id || '').startsWith(`${PREFIX[t]}-`)) || null;

/** Un droit sans acteur n'est pas exerçable. */
function requireActor(actor, right) {
  if (!actor) throw new Error(`droit « ${right} » exercé sans acteur — refusé : un droit anonyme n'est pas vérifiable`);
}

/* ── VOIR ────────────────────────────────────────────────────────
   Ce que le système sait d'un sujet, avec provenance et confiance.
   La constitution exige que ces deux informations accompagnent les
   informations importantes : elles ne sont pas optionnelles ici.
   ─────────────────────────────────────────────────────────────── */
export function voir(store, { subject_id, actor, right = 'voir' } = {}) {
  requireActor(actor, right);
  if (!subject_id) throw new Error('VOIR sans sujet');

  const subject = store.get(subject_id);
  if (!subject) throw new Error(`sujet « ${subject_id} » inconnu`);

  const known = store.all().filter((e) =>
    e.id !== subject_id && (
      e.from_id === subject_id || e.to_id === subject_id ||
      e.target_id === subject_id || e.owner_id === subject_id ||
      (Array.isArray(e.participants) && e.participants.includes(subject_id))
    ));

  store.trace({ op: 'right:voir', type: typeOf(subject_id), id: subject_id, actor, cause: right });

  return {
    subject: {
      id: subject.id,
      label: subject.display_name || subject.title || subject.id,
      category: subject.category ?? null,
      visibility: subject.visibility ?? null,
      paused_until: subject.paused_until ?? null,
    },
    /* Chaque entrée porte sa provenance et sa confiance : c'est ce qui
       permet de distinguer un fait d'une hypothèse en un coup d'œil. */
    known: known.map((e) => ({
      id: e.id,
      type: typeOf(e.id),
      label: e.display_name || e.title || e.requested_change?.title || e.id,
      origin: e.provenance?.origin ?? null,
      state: e.provenance?.state ?? null,
      confidence: e.confidence ?? null,
      category: e.category ?? null,
      shared_with: e.shared_with ?? [],
    })),
    shared_with: activeGrants(store, subject_id),
  };
}

/* ── COMPRENDRE ──────────────────────────────────────────────────
   Pourquoi NOEMA croit ce qu'elle croit. On remonte la chaîne
   d'évidences jusqu'à la source, décision comprise.
   ─────────────────────────────────────────────────────────────── */
export function comprendre(store, { id, actor, right = 'comprendre' } = {}) {
  requireActor(actor, right);
  const obj = store.get(id);
  if (!obj) throw new Error(`« ${id} » inconnu`);

  const chain = [];
  let cursor = obj;
  const seen = new Set();

  /* Remonte au plus 12 liens : une chaîne infinie serait un cycle, pas
     une explication. */
  while (cursor && chain.length < 12 && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.push({
      id: cursor.id,
      type: typeOf(cursor.id),
      origin: cursor.provenance?.origin ?? null,
      state: cursor.provenance?.state ?? null,
      confidence: cursor.confidence ?? null,
      note: cursor.materialization_note || cursor.reason || cursor.requested_change?.title || cursor.label || null,
    });
    const nextId = cursor.target_id || cursor.resulting_id || cursor.evidence_ref || cursor.decision_ref;
    cursor = nextId ? store.get(nextId) : null;
  }

  store.trace({ op: 'right:comprendre', type: typeOf(id), id, actor, cause: right });

  return {
    id,
    /* Une chaîne s'arrête : soit sur une source, soit sur un objet dont
       on ne peut plus remonter. Dire où elle s'arrête fait partie de la
       réponse. */
    terminates_on: chain.length ? chain[chain.length - 1].id : null,
    chain,
    uncertain: chain.some((c) => !['confirmed', 'extracted'].includes(c.state)),
  };
}

/* ── CORRIGER ────────────────────────────────────────────────────
   Une correction humaine est un fait. Elle ne remplace jamais en
   silence : l'ancienne valeur est conservée, la nouvelle est attribuée.
   ─────────────────────────────────────────────────────────────── */
export function corriger(store, { id, field, value, actor, reason = '', now = new Date().toISOString() } = {}) {
  requireActor(actor, 'corriger');
  if (!field) throw new Error('CORRIGER sans champ désigné');

  const obj = store.get(id);
  if (!obj) throw new Error(`« ${id} » inconnu`);

  const before = field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (JSON.stringify(before) === JSON.stringify(value)) {
    return { corrected: false, reason: 'la valeur est déjà celle demandée — rien à corriger' };
  }

  /* La correction est écrite comme une décision attribuable, pas comme
     un simple overwrite : c'est ce qui la rend contestable plus tard. */
  const dec = store.create('decision', {
    target_id: id,
    decision: 'accepted',
    actor,
    reason: reason || 'correction humaine',
    before: { [field]: before ?? null },
    after: { [field]: value ?? null },
    reversible: true,
    source: 'human/correction',
    provenance: provenance(actor, 'confirmed'),
    confidence: 'high',
    status: 'approved',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'corriger' });

  /* Écriture du champ corrigé, chemin pointillé compris. */
  const keys = field.split('.');
  const next = structuredClone(obj);
  let cursor = next;
  for (const k of keys.slice(0, -1)) {
    if (typeof cursor[k] !== 'object' || cursor[k] === null) cursor[k] = {};
    cursor = cursor[k];
  }
  cursor[keys[keys.length - 1]] = value;

  const corrected = store.put(typeOf(id), {
    ...next,
    updated_at: now,
    provenance: provenance(actor, 'confirmed', { corrected_from: dec.id }),
    confidence: 'high',
  }, { actor, cause: 'corriger' });

  store.trace({ op: 'right:corriger', type: typeOf(id), id, actor, cause: 'corriger' });

  return { corrected: true, decision: dec, object: corrected, before, after: value };
}

/* ── SUPPRIMER ───────────────────────────────────────────────────
   Le contenu disparaît vraiment. Une pierre tombale reste : qui a
   supprimé, quoi, quand, pourquoi — jamais le contenu lui-même.
   ─────────────────────────────────────────────────────────────── */
export function supprimer(store, { id, actor, reason = '', now = new Date().toISOString() } = {}) {
  requireActor(actor, 'supprimer');
  const obj = store.get(id);
  if (!obj) throw new Error(`« ${id} » inconnu — déjà supprimé, ou jamais existé`);

  const targetType = typeOf(id);

  /* La pierre tombale est écrite AVANT la suppression : si l'écriture
     échoue, on n'a pas supprimé sans trace. */
  const tomb = store.create('tombstone', {
    target_id: id,
    target_type: targetType,
    deleted_by: actor,
    deleted_at: now,
    reason: reason || 'suppression demandée',
    source: 'human/deletion',
    provenance: provenance(actor, 'confirmed'),
    confidence: 'high',
    status: 'published',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'supprimer' });

  /* Les partages accordés sur cet objet sont révoqués du même geste :
     supprimer une information tout en la laissant partagée serait une
     suppression pour apparence. */
  const revoked = store.byType('grant')
    .filter((g) => g.target_id === id && g.status === 'active')
    .map((g) => store.put('grant', {
      ...g,
      status: 'revoked',
      revoked_at: now,
      updated_at: now,
      provenance: provenance(actor, 'confirmed', { revoked_by_deletion: id }),
    }, { actor, cause: 'supprimer' }));

  store.remove(id, actor);
  store.trace({ op: 'right:supprimer', type: targetType, id, actor, cause: 'supprimer' });

  return { deleted: true, tombstone: tomb, revoked_grants: revoked.map((g) => g.id) };
}

/* ── PAUSER ──────────────────────────────────────────────────────
   Suspendre la collecte sur un sujet. Ce n'est pas un drapeau
   décoratif : `observe()` exclut les sujets en pause.
   ─────────────────────────────────────────────────────────────── */
export function pauser(store, { subject_id, until, actor, reason = '', now = new Date().toISOString() } = {}) {
  requireActor(actor, 'pauser');
  const subject = store.get(subject_id);
  if (!subject) throw new Error(`sujet « ${subject_id} » inconnu`);

  const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (until !== null && until !== undefined && !ISO.test(String(until))) {
    throw new Error(`PAUSER — échéance « ${until} » invalide : une pause sans fin n'est pas vérifiable`);
  }

  const paused = store.put(typeOf(subject_id), {
    ...subject,
    paused_until: until ?? null,
    pause_reason: reason || null,
    updated_at: now,
  }, { actor, cause: 'pauser' });

  store.trace({ op: 'right:pauser', type: typeOf(subject_id), id: subject_id, actor, cause: 'pauser' });

  return { paused: paused.paused_until, object: paused };
}

/** Un sujet est en pause si son échéance est dans le futur. */
export function isPaused(entity, now = new Date().toISOString()) {
  const until = entity?.paused_until;
  if (!until) return false;
  return new Date(until).getTime() > new Date(now).getTime();
}

/* ── LIMITER ─────────────────────────────────────────────────────
   Borner ce qui peut être dit d'un sujet : catégorie et plafond de
   visibilité. Le plafond vient du schéma, pas de l'appelant.
   ─────────────────────────────────────────────────────────────── */
export function limiter(store, { id, category, visibility, actor, reason = '', now = new Date().toISOString() } = {}) {
  requireActor(actor, 'limiter');
  const obj = store.get(id);
  if (!obj) throw new Error(`« ${id} » inconnu`);

  if (category !== undefined && !MEMORY_CATEGORIES.includes(category)) {
    throw new Error(`LIMITER — catégorie « ${category} » hors (${MEMORY_CATEGORIES.join(', ')})`);
  }
  const cat = category ?? obj.category;
  if (visibility !== undefined) {
    if (!VISIBILITY.includes(visibility)) {
      throw new Error(`LIMITER — visibilité « ${visibility} » hors (${VISIBILITY.join(', ')})`);
    }
    /* Le plafond est imposé par la catégorie : on ne peut pas se déclarer
       plus visible que sa catégorie ne le permet. */
    if (cat && VISIBILITY.indexOf(visibility) > VISIBILITY.indexOf(CATEGORY_VISIBILITY_CEILING[cat])) {
      throw new Error(`LIMITER — « ${visibility} » dépasse le plafond de la catégorie « ${cat} » (${CATEGORY_VISIBILITY_CEILING[cat]})`);
    }
  }

  const next = store.put(typeOf(id), {
    ...obj,
    category: cat ?? obj.category ?? null,
    visibility: visibility ?? obj.visibility ?? null,
    updated_at: now,
    limit_reason: reason || null,
  }, { actor, cause: 'limiter' });

  /* Réduire la visibilité révoque les partages devenus hors périmètre. */
  const revoked = [];
  if (visibility && (next.visibility === 'privée')) {
    for (const g of store.byType('grant').filter((g) => g.target_id === id && g.status === 'active')) {
      revoked.push(store.put('grant', {
        ...g, status: 'revoked', revoked_at: now, updated_at: now,
        provenance: provenance(actor, 'confirmed', { revoked_by_limit: id }),
      }, { actor, cause: 'limiter' }).id);
    }
  }

  store.trace({ op: 'right:limiter', type: typeOf(id), id, actor, cause: 'limiter' });

  return { object: next, revoked_grants: revoked };
}

/* ── PARTAGER ────────────────────────────────────────────────────
   Accorder un accès. Un partage exige une finalité et une échéance :
   un partage perpétuel n'est pas un droit, c'est un abandon.
   ─────────────────────────────────────────────────────────────── */
export function partager(store, { id, grantee, purpose, expires_at, scope = 'lecture', actor, now = new Date().toISOString() } = {}) {
  requireActor(actor, 'partager');
  const obj = store.get(id);
  if (!obj) throw new Error(`« ${id} » inconnu`);
  if (!grantee) throw new Error('PARTAGER sans bénéficiaire');
  if (!purpose) throw new Error('PARTAGER sans finalité — un partage dont on ne peut pas évaluer le motif n\'est pas accordé');

  /* On ne partage pas ce qui est en pause. */
  if (isPaused(obj, now)) {
    throw new Error(`« ${id} » est en pause jusqu'au ${obj.paused_until} : rien n'en sort`);
  }

  /* Une information sensible ne se partage pas sans décision explicite :
     le plafond de sa catégorie est « privée ». */
  if (obj.category === 'sensible') {
    throw new Error(`« ${id} » est classée sensible — son plafond de visibilité est « privée »`);
  }

  const grant = store.create('grant', {
    target_id: id,
    grantee,
    purpose,
    scope,
    expires_at,
    revoked_at: null,
    category: obj.category ?? 'partagée',
    visibility: 'partagée',
    shared_with: [grantee],
    source: 'human/sharing',
    provenance: provenance(actor, 'confirmed'),
    confidence: 'high',
    status: 'active',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'partager' });

  const next = store.put(typeOf(id), {
    ...obj,
    shared_with: [...new Set([...(obj.shared_with || []), grantee])],
    visibility: obj.visibility === 'privée' || !obj.visibility ? 'partagée' : obj.visibility,
    updated_at: now,
  }, { actor, cause: 'partager' });

  store.trace({ op: 'right:partager', type: typeOf(id), id, actor, cause: 'partager' });

  return { grant, object: next };
}

/* ── RÉVOQUER ────────────────────────────────────────────────────
   Retirer un accès accordé. La révocation est immédiate et tracée ;
   le partage n'est pas effacé, il passe en `revoked`.
   ─────────────────────────────────────────────────────────────── */
export function revoquer(store, { grant_id, actor, reason = '', now = new Date().toISOString() } = {}) {
  requireActor(actor, 'révoquer');
  const grant = store.get(grant_id);
  if (!grant) throw new Error(`partage « ${grant_id} » inconnu`);
  if (grant.status === 'revoked') {
    return { revoked: false, reason: 'ce partage est déjà révoqué', grant };
  }

  const revoked = store.put('grant', {
    ...grant,
    status: 'revoked',
    revoked_at: now,
    updated_at: now,
    revoke_reason: reason || null,
    provenance: provenance(actor, 'confirmed'),
  }, { actor, cause: 'révoquer' });

  /* Le bénéficiaire est retiré de la liste de partage de l'objet. */
  const target = store.get(grant.target_id);
  if (target) {
    const remaining = activeGrants(store, grant.target_id)
      .filter((g) => g.id !== grant_id)
      .map((g) => g.grantee);
    store.put(typeOf(grant.target_id), {
      ...target,
      shared_with: remaining,
      visibility: remaining.length ? target.visibility : 'privée',
      updated_at: now,
    }, { actor, cause: 'révoquer' });
  }

  store.trace({ op: 'right:révoquer', type: 'grant', id: grant_id, actor, cause: 'révoquer' });

  return { revoked: true, grant: revoked };
}

/** Partages actifs sur un objet, échéance comprise. */
export function activeGrants(store, targetId, now = new Date().toISOString()) {
  return store.byType('grant')
    .filter((g) => g.target_id === targetId && g.status === 'active'
      && (!g.expires_at || new Date(g.expires_at).getTime() > new Date(now).getTime()))
    .map((g) => ({ id: g.id, grantee: g.grantee, purpose: g.purpose, scope: g.scope, expires_at: g.expires_at }));
}

/** Ce que le module expose — utile à l'écran et aux tests. */
export function droits() {
  return {
    rights: MEMORY_RIGHTS,
    categories: MEMORY_CATEGORIES,
    visibility: VISIBILITY,
    ceilings: CATEGORY_VISIBILITY_CEILING,
  };
}

export { MEMORY_RIGHTS, MEMORY_CATEGORIES, VISIBILITY, CATEGORY_VISIBILITY_CEILING };
