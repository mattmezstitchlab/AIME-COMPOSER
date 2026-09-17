/**
 * AIME / NOEMA — CONTRAT DE DONNÉES V1
 *
 * Implémentation de AUDIT/DATA-MODEL-V1.md. Une entité qui ne respecte pas
 * ce contrat est refusée à l'écriture : le store ne peut pas contenir un
 * objet sans propriétaire, sans source ni provenance.
 *
 * Le vocabulaire épistémique n'est PAS redéfini ici. Il est importé du
 * Design System, qui en est la couche inférieure. C'est ce qui rend la
 * divergence impossible : une seule définition, deux consommateurs.
 */
import {
  EPISTEMIC_KEYS,
  EPISTEMIC_STATES,
  CONFIDENCE_LEVELS,
  DATA_MODEL_CONFIDENCE_MAP,
} from '../../design-system/src/tokens.mjs';

/* ── Entités ───────────────────────────────────────────────────── */

/** Préfixe d'identifiant canonique, par type d'entité. */
export const ID_PREFIX = {
  person: 'ppl',
  organization: 'org',
  project: 'prj',
  object: 'obj',
  relation: 'rel',
  event: 'evt',
  asset: 'ast',
  document: 'doc',
  version: 'ver',
  proposal: 'prop',
  decision: 'dec',
  proof: 'prf',
};

/** Champs transverses, d'après DATA-MODEL-V1 §3. */
export const CROSS_CUTTING = [
  'id', 'source', 'provenance', 'confidence', 'status',
  'created_at', 'updated_at', 'created_by', 'project_id',
];

/** Champs propres à chaque entité, au-delà des transverses. */
export const ENTITY_FIELDS = {
  person: ['display_name', 'roles', 'availability'],
  organization: ['display_name', 'kind'],
  project: ['title', 'owner_id', 'template'],
  object: ['type', 'content'],
  relation: ['from_id', 'relation_type', 'to_id'],
  event: ['type', 'start_at', 'end_at', 'description', 'participants'],
  asset: ['kind', 'rights_until', 'usage_count'],
  document: ['title', 'version_id'],
  version: ['target_id', 'number', 'approved_by'],
  proposal: ['target_id', 'requested_change', 'author', 'evidence', 'resulting_id'],
  decision: ['target_id', 'decision', 'actor', 'reason', 'before', 'after', 'reversible'],
  proof: ['target_id', 'proof_type', 'evidence_ref', 'captured_at', 'validation_state'],
};

export const ENTITY_TYPES = Object.keys(ENTITY_FIELDS);

/**
 * Statut de cycle de vie, d'après DATA-MODEL-V1 §4.
 * Une entité peut en utiliser un sous-ensemble, jamais un autre.
 */
export const LIFECYCLE = [
  'discovered', 'draft', 'in_review', 'proposed_change',
  'revision', 'approved', 'qa', 'published', 'superseded',
];

/**
 * Statut spécifique d'une proposition. Une proposition n'est jamais
 * appliquée par la machine : elle attend un humain.
 */
export const PROPOSAL_STATUS = ['open', 'accepted', 'rejected', 'deferred', 'superseded'];

/* ── Vocabulaire épistémique : réexport, jamais copie ──────────── */
export { EPISTEMIC_KEYS, EPISTEMIC_STATES, CONFIDENCE_LEVELS, DATA_MODEL_CONFIDENCE_MAP };

/**
 * Traduit une classe de confiance de DATA-MODEL-V1 §5 vers le vocabulaire
 * du système. Retourne null pour UNKNOWN : l'inconnu n'est pas un état,
 * c'est une absence — il s'affiche par `.is-unknown`, jamais par une valeur.
 */
export function fromDataModelConfidence(klass) {
  if (!(klass in DATA_MODEL_CONFIDENCE_MAP)) {
    throw new Error(`classe de confiance inconnue du data model : ${klass}`);
  }
  return DATA_MODEL_CONFIDENCE_MAP[klass];
}

/* ── Validation ────────────────────────────────────────────────── */

/* ISO 8601, secondes fractionnaires comprises — c'est ce que produit
   new Date().toISOString(). Une regex trop stricte ici rejetterait toute
   horloge réelle : les tests passaient uniquement parce qu'ils utilisaient
   une date fixe sans millisecondes. */
const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Vérifie un objet avant écriture. Retourne la liste des violations ;
 * une liste vide signifie que l'objet est admissible.
 *
 * Règle de fond (roadmap, Phase 0) :
 *   « Every persisted object has an owner, source, visibility and provenance. »
 */
export function validate(type, obj) {
  const errors = [];
  const need = (field, why) => {
    const v = obj[field];
    if (v === undefined || v === null || v === '') errors.push(`${type}.${field} — ${why}`);
  };

  if (!ENTITY_TYPES.includes(type)) return [`type d'entité inconnu : ${type}`];

  /* Identifiant canonique */
  const prefix = ID_PREFIX[type];
  if (typeof obj.id !== 'string' || !obj.id.startsWith(`${prefix}-`)) {
    errors.push(`${type}.id — attendu « ${prefix}-… », reçu « ${obj.id} »`);
  }

  /* Provenance : obligatoire sur toute entité */
  need('source', 'obligatoire — aucune donnée sans origine');
  if (!obj.provenance || typeof obj.provenance !== 'object') {
    errors.push(`${type}.provenance — obligatoire`);
  } else {
    if (!obj.provenance.origin) {
      errors.push(`${type}.provenance.origin — d'où vient l'information`);
    }
    if (!EPISTEMIC_KEYS.includes(obj.provenance.state)) {
      errors.push(`${type}.provenance.state — « ${obj.provenance.state} » hors du vocabulaire (${EPISTEMIC_KEYS.join(', ')})`);
    }
  }

  /* Confiance : trois degrés, jamais un pourcentage */
  if (obj.confidence !== undefined) {
    if (!CONFIDENCE_LEVELS.includes(obj.confidence)) {
      errors.push(`${type}.confidence — « ${obj.confidence} » hors des trois degrés (${CONFIDENCE_LEVELS.join(', ')})`);
    }
  }

  /* Propriétaire et horodatage */
  need('created_by', 'obligatoire — tout objet a un auteur');
  if (!ISO.test(String(obj.created_at))) errors.push(`${type}.created_at — date ISO attendue`);
  if (obj.updated_at !== undefined && !ISO.test(String(obj.updated_at))) {
    errors.push(`${type}.updated_at — date ISO attendue`);
  }

  /* Statut */
  if (obj.status !== undefined) {
    const allowed = type === 'proposal' ? PROPOSAL_STATUS : LIFECYCLE;
    if (!allowed.includes(obj.status)) {
      errors.push(`${type}.status — « ${obj.status} » hors du cycle (${allowed.join(', ')})`);
    }
  }

  /* Champs propres */
  for (const f of ENTITY_FIELDS[type]) {
    if (REQUIRED_FIELDS[type]?.includes(f)) need(f, 'champ propre obligatoire');
  }

  /* Règles métier */
  if (type === 'relation') {
    if (obj.from_id === obj.to_id) errors.push('relation.from_id — une entité ne peut pas être en relation avec elle-même');
    if (!RELATION_TYPES.includes(obj.relation_type)) {
      errors.push(`relation.relation_type — « ${obj.relation_type} » hors vocabulaire`);
    }
  }
  if (type === 'proposal') {
    /* Le cœur du système : une proposition porte sa preuve et son auteur. */
    if (!Array.isArray(obj.evidence) || obj.evidence.length === 0) {
      errors.push('proposal.evidence — une proposition sans évidence ne peut pas être évaluée');
    } else {
      for (const [i, e] of obj.evidence.entries()) {
        if (!EPISTEMIC_KEYS.includes(e.state)) {
          errors.push(`proposal.evidence[${i}].state — « ${e.state} » hors du vocabulaire`);
        }
        if (!e.ref) errors.push(`proposal.evidence[${i}].ref — chaque évidence cite sa source`);
      }
    }
    if (!PROPOSAL_STATUS.includes(obj.status)) {
      errors.push(`proposal.status — « ${obj.status} » hors (${PROPOSAL_STATUS.join(', ')})`);
    }
  }
  if (type === 'decision') {
    if (!['accepted', 'rejected', 'deferred'].includes(obj.decision)) {
      errors.push(`decision.decision — « ${obj.decision} » hors (accepted, rejected, deferred)`);
    }
    if (!obj.actor) errors.push('decision.actor — une décision sans auteur n\'est pas attribuable');
  }
  if (type === 'proof') {
    if (!obj.evidence_ref) errors.push('proof.evidence_ref — une preuve sans référence n\'en est pas une');
    if (!ISO.test(String(obj.captured_at))) errors.push('proof.captured_at — date ISO attendue');
  }

  return errors;
}

/** Champs propres réellement obligatoires, par entité. */
const REQUIRED_FIELDS = {
  person: ['display_name'],
  organization: ['display_name'],
  project: ['title', 'owner_id'],
  relation: ['from_id', 'relation_type', 'to_id'],
  event: ['type', 'start_at'],
  proposal: ['target_id', 'requested_change', 'author'],
  decision: ['target_id', 'decision', 'actor'],
  proof: ['target_id', 'proof_type'],
};

/** Types de relation, d'après DATA-MODEL-V1 §2 (PERSON / ORGANIZATION). */
export const RELATION_TYPES = [
  'owns', 'collaborates_with', 'client_of', 'member_of',
  'validates', 'provides', 'intervenes_on', 'takes_place_at', 'covers',
];

/**
 * Un objet est-il un fait établi ? Une proposition ne l'est jamais,
 * quelle que soit sa confiance : seul un humain établit un fait.
 */
export function isEstablished(obj) {
  const st = EPISTEMIC_STATES.find((s) => s.key === obj?.provenance?.state);
  return Boolean(st?.established) && obj?.status !== 'open';
}
