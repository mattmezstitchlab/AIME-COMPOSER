/**
 * AIME / NOEMA — MOTEUR DE PROPOSITIONS V1
 *
 * NOEMA PROPOSE. L'HUMAIN VALIDE.
 *
 * Ce module observe un monde, calcule une confiance, et produit des
 * propositions. Il ne modifie jamais un fait. Il n'agit jamais seul.
 *
 * Trois règles non négociables :
 *
 *   1. UNE PROPOSITION N'EST PAS UN FAIT. Elle entre dans le store avec
 *      l'état `proposed` et le statut `open`. Seul un humain, par une
 *      décision, peut la faire devenir un fait.
 *   2. LA CONFIANCE A TROIS DEGRÉS. low · medium · high. Jamais un
 *      pourcentage : un nombre inventé est une fausse précision.
 *   3. LE SILENCE EST UNE CAPACITÉ. Sous le seuil, le moteur ne produit
 *      rien. Une interface NOEMA vide n'est pas une interface cassée.
 */
import { EPISTEMIC_KEYS } from './schema.mjs';
import { materialize } from './intention.mjs';
import { isPaused } from './governance.mjs';

/* ── Confiance ─────────────────────────────────────────────────── */

/**
 * Poids d'une évidence, selon son état épistémique.
 * Un état qui ne désigne rien de sourcé pèse zéro.
 */
const EVIDENCE_WEIGHT = {
  confirmed: 3,
  extracted: 2,
  observed: 1,
  inferred: 1,
  proposed: 0,
  superseded: 0,
};

/**
 * Évidences ANCRÉES : elles renvoient à quelque chose de perçu ou de
 * sourcé. `observed` en fait partie — une déclaration enregistrée est
 * une perception directe, pas une hypothèse. `inferred` n'en fait pas
 * partie : une déduction reste une déduction, quelle que soit sa quantité.
 */
const GROUNDED = ['confirmed', 'extracted', 'observed'];

/**
 * Calcule la confiance d'un ensemble d'évidences.
 * Retourne 'low' | 'medium' | 'high' — jamais un nombre.
 *
 * La règle est volontairement simple et explicable :
 *   · aucune évidence ancrée            → faible, toujours ;
 *   · deux ancrées et un poids suffisant → élevé ;
 *   · une ancrée au moins                → moyen ;
 *   · sinon                              → faible.
 *
 * Exiger une validation humaine (« confirmé ») pour atteindre « moyen »
 * rendrait NOEMA incapable de proposer quoi que ce soit à partir de ses
 * propres observations : ce serait la priver de sa fonction. En revanche
 * une déduction seule ne monte jamais — c'est la règle de non-intrusion.
 */
export function confidenceOf(evidence) {
  if (!Array.isArray(evidence) || evidence.length === 0) return 'low';

  const total = evidence.reduce((n, e) => n + (EVIDENCE_WEIGHT[e.state] ?? 0), 0);
  const grounded = evidence.filter((e) => GROUNDED.includes(e.state));

  if (grounded.length === 0) return 'low';
  if (total >= 5 && grounded.length >= 2) return 'high';
  if (total >= 2 && grounded.length >= 1) return 'medium';
  return 'low';
}

/**
 * Seuil au-dessous duquel NOEMA se tait.
 * 'medium' : il faut au moins une évidence établie pour déranger quelqu'un.
 */
export const PROPOSAL_THRESHOLD = 'medium';

const RANK = { low: 0, medium: 1, high: 2 };

/** La confiance atteint-elle le seuil de proposition ? */
export const worthProposing = (confidence) => RANK[confidence] >= RANK[PROPOSAL_THRESHOLD];

/* ── Fabrique de proposition ───────────────────────────────────── */

let seq = 0;
const resetSeq = () => { seq = 0; };
const nextProposalId = () => `prop-${String(++seq).padStart(4, '0')}`;

/**
 * Construit une proposition. Ne l'écrit pas : c'est le rôle de l'appelant,
 * qui décide s'il la persiste ou la jette.
 */
function draft({ kind, target_id, title, body, evidence, author = 'noema', now }) {
  const confidence = confidenceOf(evidence);
  return {
    kind,
    target_id,
    title,
    body,
    evidence,
    confidence,
    /* Une proposition est-elle digne d'être montrée ? */
    worth: worthProposing(confidence),
    draft: {
      id: nextProposalId(),
      type: 'proposal',
      target_id,
      requested_change: { kind, title, body },
      author,
      status: 'open',
      evidence,
      confidence,
      source: 'noema/observation',
      provenance: { origin: 'noema', state: 'proposed', observed_at: now },
      created_by: author,
      created_at: now,
    },
  };
}

/* ── Règles d'observation ────────────────────────────────────────
   Chaque règle lit le monde et retourne zéro, une ou plusieurs
   propositions. Une règle qui n'a rien d'assez sûr à dire ne retourne
   rien — c'est la règle de non-intrusion, appliquée règle par règle.
   ──────────────────────────────────────────────────────────────── */

/**
 * REPORT — des participants se déclarent indisponibles à la date d'un
 * événement. Si une autre date les réunit tous, NOEMA la propose.
 */
function ruleReschedule(store, now) {
  const out = [];
  for (const event of store.byType('event')) {
    const participants = event.participants || [];
    if (participants.length < 2) continue;

    const unavailable = participants.filter((pid) => {
      const p = store.get(pid);
      return Array.isArray(p?.availability?.unavailable) && p.availability.unavailable.includes(event.start_at);
    });
    if (unavailable.length === 0) continue;

    const evidence = unavailable.map((pid) => ({
      state: store.get(pid)?.availability?.declared ? 'observed' : 'inferred',
      ref: pid,
      note: `${store.get(pid)?.display_name || pid} indisponible le ${event.start_at}`,
    }));

    /* Cherche une date où tout le monde est libre. */
    const candidates = event.candidate_dates || [];
    const free = candidates.find((d) => participants.every((pid) => {
      const p = store.get(pid);
      return !(p?.availability?.unavailable || []).includes(d);
    }));

    if (!free) continue;

    /* La disponibilité du lieu n'est pas confirmée : c'est une déduction. */
    evidence.push({
      state: 'inferred',
      ref: `${event.id}/lieu`,
      note: `libre le ${free}, non confirmé par le lieu`,
    });

    out.push(draft({
      kind: 'reschedule',
      target_id: event.id,
      title: `Déplacer « ${event.description || event.id} » au ${free}`,
      body: `${unavailable.length} participant(s) sur ${participants.length} indisponible(s) le ${event.start_at}. Le ${free} réunit tout le monde.`,
      evidence,
      now,
    }));
  }
  return out;
}

/**
 * DROITS — un asset dont les droits expirent bientôt et qui est encore
 * utilisé. Ce n'est pas une hypothèse : c'est une date et un compteur.
 */
function ruleRightsExpiry(store, now, { horizonDays = 21 } = {}) {
  const out = [];
  const today = new Date(now);
  for (const asset of store.byType('asset')) {
    if (!asset.rights_until) continue;
    const days = Math.round((new Date(asset.rights_until) - today) / 86400000);
    if (days > horizonDays) continue;

    const evidence = [
      { state: 'confirmed', ref: `${asset.id}/rights_until`, note: `droits jusqu'au ${asset.rights_until}` },
    ];
    if (asset.usage_count > 0) {
      evidence.push({ state: 'confirmed', ref: `${asset.id}/usages`, note: `${asset.usage_count} composition(s) l'utilisent` });
    }

    out.push(draft({
      kind: 'alert',
      target_id: asset.id,
      title: days < 0
        ? `Droits expirés pour ${asset.id}`
        : `Droits de ${asset.id} expirent dans ${days} jour(s)`,
      body: asset.usage_count > 0
        ? `${asset.usage_count} composition(s) utilisent encore cet asset.`
        : 'Aucune composition ne l\'utilise : rien à traiter.',
      evidence,
      now,
    }));
  }
  return out;
}

/**
 * MANQUE — une information requise est absente et bloque un livrable.
 * NOEMA pose une question au lieu d'inventer une valeur.
 */
function ruleMissingBlocker(store, now) {
  const out = [];
  for (const project of store.byType('project')) {
    for (const req of project.requires || []) {
      const target = store.get(req.target_id);
      if (!target) continue;
      const value = req.field.split('.').reduce((o, k) => o?.[k], target);
      const unknown = value === undefined || value === null || value === '' || value === 'unknown';
      if (!unknown) continue;

      const evidence = [
        { state: 'confirmed', ref: `${project.id}/requires`, note: `« ${req.field} » est requis pour ${req.blocks}` },
        { state: 'observed', ref: `${req.target_id}/${req.field}`, note: 'valeur absente' },
      ];

      out.push(draft({
        kind: 'question',
        target_id: req.target_id,
        title: `Quelle valeur pour « ${req.field} » ?`,
        body: `Cette information conditionne ${req.blocks}. Elle ne figure dans aucune source du projet.`,
        evidence,
        now,
    }));
    }
  }
  return out;
}

/**
 * RAPPROCHEMENT — deux personnes partagent un rôle et ne se connaissent
 * pas. Proposé seulement si les deux rôles sont confirmés : une
 * corrélation n'est pas une certitude, et une compatibilité n'est pas
 * une obligation de collaborer.
 */
function ruleConnection(store, now) {
  const out = [];
  const people = store.byType('person');
  const relations = store.byType('relation');

  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i];
      const b = people[j];
      const shared = (a.roles || []).filter((r) => (b.roles || []).includes(r));
      if (shared.length === 0) continue;

      const linked = relations.some(
        (r) => (r.from_id === a.id && r.to_id === b.id) || (r.from_id === b.id && r.to_id === a.id),
      );
      if (linked) continue;

      const evidence = shared.map((r) => ({
        state: 'extracted',
        ref: `${a.id}+${b.id}/${r}`,
        note: `rôle commun « ${r} »`,
      }));

      out.push(draft({
        kind: 'connection',
        target_id: a.id,
        title: `Rapprocher ${a.display_name} et ${b.display_name}`,
        body: `Rôle(s) commun(s) : ${shared.join(', ')}. Aucune relation enregistrée entre eux.`,
        evidence,
        now,
      }));
    }
  }
  return out;
}

export const RULES = [ruleReschedule, ruleRightsExpiry, ruleMissingBlocker, ruleConnection];

/* ── Observation ───────────────────────────────────────────────── */

/**
 * Observe le monde et retourne TOUTES les ébauches, y compris celles
 * sous le seuil — avec leur drapeau `worth` à false. L'appelant décide
 * de ce qu'il montre. Rien n'est écrit ici.
 */
export function observe(store, { now = new Date().toISOString() } = {}) {
  const drafts = RULES.flatMap((rule) => rule(store, now));

  /* ── PAUSER est un droit, pas un drapeau décoratif ─────────────
     Un sujet en pause est exclu de l'observation : NOEMA ne produit
     aucune ébauche le concernant, pas même une ébauche retenue. Une
     pause qui continuerait d'observer en silence ne serait pas une
     pause. Les ébauches écartées sont comptées, jamais affichées
     comme des propositions.
     ─────────────────────────────────────────────────────────── */
  const paused = (targetId) => {
    const e = store.get(targetId);
    return e ? isPaused(e, now) : false;
  };
  const active = drafts.filter((d) => !d.target_id || !paused(d.target_id));
  const silenced = drafts.length - active.length;

  return {
    now,
    drafts: active,
    proposable: active.filter((d) => d.worth),
    withheld: active.filter((d) => !d.worth),
    silenced,
  };
}

/**
 * Observe et persiste les propositions dignes d'être montrées.
 * Retourne ce qui a été écrit et ce qui a été retenu.
 *
 * C'est la seule écriture que NOEMA s'autorise : créer des objets
 * `proposal` en état `proposed`, statut `open`. Elle ne touche jamais
 * à l'objet visé.
 */
export function propose(store, opts = {}) {
  const { now = new Date().toISOString(), actor = 'noema' } = opts;
  resetSeq();
  const { drafts, proposable, withheld } = observe(store, { now });

  /* Ne pas re-proposer ce qui est déjà ouvert sur la même cible. */
  const openKeys = new Set(
    store.byType('proposal')
      .filter((p) => p.status === 'open')
      .map((p) => `${p.requested_change?.kind}:${p.target_id}`),
  );

  const written = [];
  for (const d of proposable) {
    const key = `${d.kind}:${d.target_id}`;
    if (openKeys.has(key)) continue;
    openKeys.add(key);
    written.push(store.create('proposal', d.draft, { actor, cause: 'observation' }));
  }

  return { written, withheld: withheld.map((d) => ({ kind: d.kind, target_id: d.target_id, confidence: d.confidence })), observed: drafts.length };
}

/* ── Décision humaine ──────────────────────────────────────────── */

/**
 * Applique une décision humaine sur une proposition.
 *
 * C'est ICI, et seulement ici, qu'une proposition devient un fait.
 * La machine ne peut pas appeler cette fonction à la place d'un humain :
 * `actor` est obligatoire et la décision est tracée.
 */
export function decide(store, { proposal_id, decision, actor, reason = '', now = new Date().toISOString() }) {
  if (!actor) throw new Error('une décision sans auteur n\'est pas attribuable');
  if (!['accepted', 'rejected', 'deferred'].includes(decision)) {
    throw new Error(`décision inconnue : « ${decision} »`);
  }

  const proposal = store.get(proposal_id);
  if (!proposal) throw new Error(`proposition introuvable : ${proposal_id}`);
  if (proposal.status !== 'open') throw new Error(`« ${proposal_id} » n'est plus ouverte (statut : ${proposal.status})`);

  const before = { status: proposal.status, state: proposal.provenance.state };

  const dec = store.create('decision', {
    target_id: proposal_id,
    decision,
    actor,
    reason,
    before,
    after: { status: decision === 'accepted' ? 'accepted' : decision, state: decision === 'accepted' ? 'confirmed' : 'proposed' },
    reversible: decision !== 'accepted',
    source: 'human/decision',
    provenance: { origin: actor, state: 'confirmed', decided_at: now },
    confidence: 'high',
    status: 'approved',
    created_by: actor,
  }, { actor, cause: 'decision' });

  const status = decision === 'accepted' ? 'accepted' : decision === 'rejected' ? 'rejected' : 'deferred';
  store.put('proposal', {
    ...proposal,
    status,
    resulting_id: dec.id,
    provenance: {
      ...proposal.provenance,
      state: decision === 'accepted' ? 'confirmed' : proposal.provenance.state,
      decided_by: actor,
      decided_at: now,
    },
  }, { actor, cause: 'decision' });

  const proof = store.create('proof', {
    target_id: proposal_id,
    proof_type: decision === 'accepted' ? 'validation' : 'dismissal',
    evidence_ref: dec.id,
    captured_at: now,
    validation_state: decision,
    source: 'human/decision',
    provenance: { origin: actor, state: 'confirmed' },
    confidence: 'high',
    status: 'approved',
    created_by: actor,
  }, { actor, cause: 'decision' });

  /* ── Matérialisation ────────────────────────────────────────
     Une proposition acceptée doit produire quelque chose de réel, sinon
     la validation ne change rien au monde. C'est le seul endroit où une
     intention devient un objet — et une demande d'action y entre en
     attente d'autorisation, jamais en exécution.

     Un échec de matérialisation n'annule pas la décision : la décision
     humaine est un fait, quoi qu'il en coûte ensuite. L'échec est écrit
     sur la proposition, visible, jamais avalé.
     ─────────────────────────────────────────────────────────── */
  let mat = null;
  if (decision === 'accepted' && proposal.requested_change?.fields) {
    mat = materialize(store, proposal, { actor, now });
    store.put('proposal', {
      ...store.get(proposal_id),
      materialized_id: mat.materialized ? mat.id : null,
      materialization_note: mat.reason,
      updated_at: now,
    }, { actor, cause: 'intention' });
  }

  return { decision: dec, proposal: store.get(proposal_id), proof, materialization: mat };
}

export { EPISTEMIC_KEYS };
