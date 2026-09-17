/**
 * AIME / NOEMA — ACTION V1
 *
 * Le maillon de sortie de la boucle. Jusqu'ici, une validation produisait
 * une preuve : le monde était mis à jour, mais rien n'en sortait. Ce
 * module est le seul endroit où NOEMA peut préparer un effet sur
 * l'extérieur — et il ne peut pas l'exécuter seul.
 *
 * Le contrat, en trois verrous :
 *
 *   1. NOEMA ne crée jamais une action de son propre chef. Une action
 *      naît d'une intention humaine (`intention/phrase`) ou d'une
 *      décision explicite.
 *   2. Le coût d'une action — périmètre, risque, réversibilité,
 *      permission — vient du registre du schéma, jamais de l'appelant.
 *      `validate()` refuse une action qui se déclare moins risquée que
 *      ce que son verbe implique.
 *   3. `execute()` exige une autorisation nommée, attribuée à la même
 *      personne. Une action non autorisée n'est pas exécutée : elle
 *      reste en attente et le refus est journalisé.
 *
 * La constitution est explicite : « Elle peut suggérer un message, une
 * publication, une relance — elle ne peut pas envoyer, publier ou payer
 * sans autorisation explicite. »
 */
import { provenance } from './store.mjs';
import { ACTION_VERBS, ACTION_STATUS } from './schema.mjs';

/* Verbes français → registre. */
const VERBS = {
  envoyer: 'send', publier: 'publish', partager: 'share',
  réserver: 'book', annuler: 'cancel', relancer: 'notify',
  notifier: 'notify', archiver: 'archive',
};

/**
 * Construit une action à partir d'une intention. N'exécute rien.
 *
 * Un verbe non reconnu est refusé plutôt qu'approximé : deviner que
 * « transférer » ressemble à « envoyer » serait lui attribuer un
 * périmètre que personne n'a décidé.
 */
export function draft(store, { verb, object, source = 'intention/phrase', actor = 'noema', now = new Date().toISOString() } = {}) {
  const key = VERBS[String(verb || '').toLowerCase()] || String(verb || '').toLowerCase();
  const spec = ACTION_VERBS[key];
  if (!spec) {
    return { ok: false, error: `action « ${verb} » hors du registre — aucune approximation n'est tentée` };
  }

  const action = store.create('action', {
    verb: key,
    label: spec.label,
    object: String(object || '').trim() || spec.label,
    scope: spec.scope,
    risk: spec.risk,
    reversible: spec.reversible,
    permission_required: spec.permission,
    authorized_by: null,
    executed_at: null,
    source,
    status: 'pending_authorization',
    provenance: provenance('moteur NOEMA', 'inferred'),
    confidence: 'low',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'intention' });

  return { ok: true, action };
}

/**
 * Autorise ou refuse une action. C'est le seul acte qui la rend
 * exécutable, et il exige un acteur : l'autorisation ne se délègue pas.
 */
export function authorize(store, { action_id, actor, grant = true, reason = '', now = new Date().toISOString() } = {}) {
  if (!action_id) throw new Error('autorisation sans identifiant d\'action');
  if (!actor) throw new Error('autorisation sans acteur — refusée');

  const action = store.get(action_id);
  if (!action) throw new Error(`action « ${action_id} » inconnue`);
  if (action.status === 'executed') throw new Error(`action « ${action_id} » déjà exécutée`);

  const updated = store.put('action', {
    ...action,
    status: grant ? 'authorized' : 'refused',
    authorized_by: grant ? actor : null,
    authorization_reason: reason || null,
    authorized_at: now,
    updated_at: now,
    /* Une autorisation humaine est un fait ; un refus reste une intention. */
    provenance: provenance(grant ? actor : 'moteur NOEMA', grant ? 'confirmed' : 'inferred'),
    confidence: grant ? 'high' : 'low',
  }, { actor, cause: grant ? 'authorize' : 'remove' });

  const proof = store.create('proof', {
    target_id: action_id,
    proof_type: grant ? 'validation' : 'dismissal',
    evidence_ref: `authorization:${actor}`,
    captured_at: now,
    validation_state: grant ? 'accepted' : 'rejected',
    source: 'human/authorization',
    provenance: provenance(actor, 'confirmed'),
    confidence: 'high',
    status: 'approved',
    created_by: actor,
    created_at: now,
  }, { actor, cause: grant ? 'authorize' : 'remove' });

  return { action: updated, proof };
}

/**
 * Exécute une action autorisée. C'est le seul effet sur l'extérieur de
 * tout le système, et il est borné :
 *
 *   - une action non autorisée n'est jamais exécutée ;
 *   - l'autorisation doit venir de la personne qui exécute ;
 *   - l'exécution est simulée (aucun SMTP, aucune API externe). Ce qui
 *     est garanti ici, c'est l'ordre des verrous et la trace.
 */
export function execute(store, { action_id, actor, executor = null, now = new Date().toISOString() } = {}) {
  if (!actor) throw new Error('exécution sans acteur — refusée');

  const action = store.get(action_id);
  if (!action) throw new Error(`action « ${action_id} » inconnue`);

  if (action.status !== 'authorized') {
    const reason = `action « ${action_id} » non exécutée : statut « ${action.status} », autorisation explicite requise`;
    store.trace({ op: 'refusal', type: 'action', id: action_id, actor, cause: 'remove' });
    throw new Error(reason);
  }
  if (action.authorized_by !== actor) {
    throw new Error(`action « ${action_id} » autorisée par « ${action.authorized_by} », exécution demandée par « ${actor} » — l'autorisation n'est pas transférable`);
  }

  const run = executor || defaultExecutor;
  const result = run(action);

  const executed = store.put('action', {
    ...action,
    status: 'executed',
    executed_at: now,
    updated_at: now,
    provenance: provenance('moteur NOEMA', 'confirmed'),
    confidence: 'high',
  }, { actor, cause: 'authorize' });

  const proof = store.create('proof', {
    target_id: action_id,
    proof_type: 'execution',
    evidence_ref: result.ref,
    captured_at: now,
    validation_state: 'accepted',
    source: 'engine/execution',
    provenance: provenance('moteur NOEMA', 'confirmed'),
    confidence: 'high',
    status: 'approved',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'authorize' });

  return { action: executed, result, proof };
}

/** Exécuteur par défaut : ne sort pas de la machine, dit ce qu'il ferait. */
function defaultExecutor(action) {
  return {
    ref: `exec-${action.id}`,
    detail: `${action.label} — « ${action.object} » · périmètre ${action.scope} · simulé, aucun service externe appelé`,
  };
}

/** Résume la position de NOEMA sur les actions — pour l'écran et les tests. */
export function posture() {
  return {
    can_suggest: true,
    can_execute_alone: false,
    statuses: ACTION_STATUS,
    verbs: Object.entries(ACTION_VERBS).map(([verb, s]) => ({ verb, ...s })),
  };
}

export { VERBS, ACTION_VERBS, ACTION_STATUS };
