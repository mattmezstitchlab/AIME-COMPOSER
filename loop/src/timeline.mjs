/**
 * AIME / NOEMA — TIMELINE UNIVERSELLE V1
 *
 * Le maillon manquant de la boucle du roadmap.
 *
 *   PROJECT → CANONICAL EVENT STREAM → TIMELINE ENGINE → MODE → VIEW
 *
 * Règle de fond, reprise de TIMELINE-UNIVERSELLE-V1 §1 et §8 :
 *
 *   La Timeline est une projection du projet, jamais une seconde source
 *   de vérité. Une action dans la Timeline ne doit jamais créer une copie
 *   concurrente d'une donnée canonique.
 *
 * Concrètement : `project()` n'écrit RIEN. Elle lit les entités
 * canoniques et les projette en `TimelineItem`. `move()` ne crée pas un
 * nouvel élément : elle modifie l'entité canonique sous-jacente, et le
 * changement est une décision attribuée.
 *
 * Un seul moteur, six modes. Ce qui change d'un mode à l'autre, ce sont
 * les capacités actives — pas le modèle de données, pas le code.
 */
import { provenance } from './store.mjs';

/* ── Modes et capacités ──────────────────────────────────────────
   Les capacités sont le seul levier. Le moteur n'a pas besoin d'une
   Timeline par métier : il a des capacités et des modes.
   ──────────────────────────────────────────────────────────────── */
export const MODES = ['READ', 'PLAN', 'COMPOSE', 'REVIEW', 'LIVE', 'HISTORY'];

export const CAPABILITIES = [
  'MOVE', 'RESIZE', 'EDIT', 'COMMENT', 'LINK', 'MEDIA',
  'SPLIT', 'MERGE', 'DUPLICATE', 'COMPLETE', 'LOCK',
];

/** Ce que chaque mode autorise. Tout le reste est inactif. */
export const MODE_CAPABILITIES = {
  /* Lecture narrative : aucun déplacement structurel. */
  READ: ['COMMENT'],
  /* Organisation métier : on déplace, on relie, on achève. */
  PLAN: ['MOVE', 'EDIT', 'LINK', 'COMPLETE'],
  /* Montage créatif : c'est le capability set de Timeline Theater. */
  COMPOSE: ['MOVE', 'RESIZE', 'EDIT', 'LINK', 'MEDIA', 'SPLIT', 'MERGE', 'DUPLICATE'],
  /* Lecture annotée : commentaires, propositions, décisions. */
  REVIEW: ['COMMENT', 'LINK'],
  /* Jour J : on achève et on signale, on ne réorganise pas en direct. */
  LIVE: ['COMPLETE', 'COMMENT'],
  /* Lecture des versions : rien n'est modifiable depuis l'histoire. */
  HISTORY: [],
};

/** Granularités — le zoom change la représentation, pas les données. */
export const GRANULARITIES = ['ANNÉE', 'MOIS', 'SEMAINE', 'JOUR', 'HEURE', 'MINUTE', 'SECONDE'];

/** Mode initial proposé selon le contexte (§9). Proposition, pas contrainte. */
export const AUTOMATIC_MODES = {
  'site web': ['PLAN', 'COMPOSE'],
  mariage: ['PLAN', 'LIVE'],
  événement: ['PLAN', 'LIVE'],
  'montage vidéo': ['COMPOSE'],
  portfolio: ['READ', 'HISTORY'],
  'suivi client': ['REVIEW'],
  production: ['PLAN', 'COMPOSE'],
  concert: ['PLAN', 'LIVE'],
  répétition: ['PLAN', 'LIVE'],
};

/* ── Projection ────────────────────────────────────────────────── */

const dayMs = 864e5;

/** Capacités qui modifient la structure, par opposition à COMMENT/LINK. */
const STRUCTURAL = ['MOVE', 'RESIZE', 'EDIT', 'SPLIT', 'MERGE', 'DUPLICATE', 'COMPLETE'];

/** Statuts qui closent un événement : passé ce point, il n'est plus en retard. */
const DONE_STATUSES = ['published', 'superseded'];
const parse = (v) => (v ? new Date(v).getTime() : null);

/**
 * Projette le flux canonique d'un projet en éléments de Timeline.
 *
 * N'ÉCRIT RIEN. C'est la garantie structurelle de la règle §8 : une
 * projection qui persisterait deviendrait une seconde source de vérité.
 */
export function project(store, { project_id = null, mode = 'PLAN', granularity = 'JOUR', now = new Date().toISOString() } = {}) {
  if (!MODES.includes(mode)) throw new Error(`mode inconnu : « ${mode} » (${MODES.join(', ')})`);
  if (!GRANULARITIES.includes(granularity)) {
    throw new Error(`granularité inconnue : « ${granularity} » (${GRANULARITIES.join(', ')})`);
  }

  const capabilities = MODE_CAPABILITIES[mode];
  const nowMs = parse(now);

  /* Le flux canonique : les événements du projet. En mode HISTORY, le
     journal s'y ajoute — l'histoire est une projection du journal, pas
     une copie des événements. */
  const events = store.byType('event')
    .filter((e) => !project_id || e.project_id === project_id);

  const items = events.map((e) => {
    const start = parse(e.start_at);
    const end = parse(e.end_at);
    const duration = end && start ? end - start : (e.duration ?? null);
    /* Un élément sans date n'est pas jeté : il est signalé comme non
       positionné. Inventer une date pour combler le vide serait pire. */
    return {
      id: e.id,
      entity_ref: e.id,
      project_id: e.project_id ?? null,
      type: e.type,
      title: e.description || e.type || e.id,
      start: e.start_at ?? null,
      end: e.end_at ?? null,
      duration,
      status: e.status ?? null,
      actor: e.created_by ?? null,
      source: e.source ?? null,
      parent_id: null,
      relation_ids: e.participants ?? [],
      media_refs: [],
      evidence: e.provenance ? [{ state: e.provenance.state, origin: e.provenance.origin }] : [],
      version_id: null,
      decision_id: null,
      positioned: start !== null,
      /* `editable` vient du mode, pas de l'élément. Mais « éditable » veut
         dire structurellement modifiable : un mode qui n'autorise que
         COMMENT — READ, REVIEW — n'édite rien. Confondre « une capacité
         est active » et « l'élément est modifiable » rendait READ éditable. */
      editable: capabilities.some((c) => STRUCTURAL.includes(c)) && start !== null,
      capabilities: start === null ? capabilities.filter((c) => c === 'COMMENT') : capabilities,
      /* État opérationnel, calculé — utile en LIVE, affiché ailleurs. */
      /* `approved` n'est pas un achèvement : c'est une approbation. Seul
         `published` clôt un événement, `superseded` l'annule. Traiter
         `approved` comme terminé masquait les retards réels. */
      late: start !== null && start < nowMs && !DONE_STATUSES.includes(e.status ?? ''),
      upcoming: start !== null && start >= nowMs,
    };
  });

  /* HISTORY : le journal devient le flux. */
  const history = mode === 'HISTORY'
    ? store.journal
      .filter((j) => !project_id || j.project_id === project_id || j.id?.startsWith('evt-'))
      .map((j, i) => ({
        id: `hist-${i}`,
        entity_ref: j.id ?? null,
        project_id: project_id,
        type: j.op,
        title: `${j.op}${j.cause ? ` · ${j.cause}` : ''}`,
        start: j.at,
        end: null,
        duration: null,
        status: null,
        actor: j.actor,
        source: 'journal',
        parent_id: null,
        relation_ids: [],
        media_refs: [],
        evidence: [],
        version_id: null,
        decision_id: null,
        positioned: true,
        /* L'histoire ne se modifie pas : c'est le sens du mode. */
        editable: false,
        capabilities: [],
        late: false,
        upcoming: false,
      }))
    : [];

  const all = [...items, ...history].sort((a, b) => {
    const ta = parse(a.start), tb = parse(b.start);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  });

  return {
    mode,
    granularity,
    capabilities,
    /* Le bucket est une représentation : il ne modifie aucune donnée. */
    buckets: bucketize(all, granularity),
    items: all,
    unpositioned: all.filter((i) => !i.positioned).map((i) => i.id),
    live: mode === 'LIVE' ? {
      now,
      late: all.filter((i) => i.late).map((i) => i.id),
      next: all.filter((i) => i.upcoming).slice(0, 1)[0]?.id ?? null,
    } : null,
    /* La projection cite sa source : c'est ce qui rappelle qu'elle n'est
       pas la vérité, seulement une vue. */
    source_of_truth: 'event',
  };
}

/** Regroupe par période selon la granularité. Représentation seulement. */
function bucketize(items, granularity) {
  const key = (iso) => {
    if (!iso) return 'sans date';
    const d = new Date(iso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const h = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    switch (granularity) {
      case 'ANNÉE': return `${y}`;
      case 'MOIS': return `${y}-${m}`;
      case 'SEMAINE': {
        const week = Math.floor((d - new Date(Date.UTC(y, 0, 1))) / (7 * dayMs)) + 1;
        return `${y}-S${String(week).padStart(2, '0')}`;
      }
      case 'JOUR': return `${y}-${m}-${day}`;
      case 'HEURE': return `${y}-${m}-${day}T${h}`;
      case 'MINUTE': return `${y}-${m}-${day}T${h}:${min}`;
      default: return iso;
    }
  };
  const map = new Map();
  for (const it of items) {
    const k = key(it.start);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it.id);
  }
  return [...map.entries()].map(([period, ids]) => ({ period, ids }));
}

/* ── Mutation : elle frappe la donnée canonique ────────────────── */

/**
 * Déplace un élément. Modifie l'événement canonique — ne crée jamais
 * d'élément de Timeline persisté.
 *
 * Un mode qui n'autorise pas MOVE refuse le déplacement : la contrainte
 * est appliquée ici, pas seulement dans l'interface.
 */
export function move(store, { item_id, start, end = null, actor, mode = 'PLAN', reason = '', now = new Date().toISOString() } = {}) {
  if (!actor) throw new Error('déplacement sans acteur — refusé');
  if (!MODE_CAPABILITIES[mode]?.includes('MOVE')) {
    throw new Error(`le mode « ${mode} » n'autorise pas MOVE — capacités actives : ${MODE_CAPABILITIES[mode].join(', ') || 'aucune'}`);
  }
  const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!ISO.test(String(start))) throw new Error(`déplacement vers « ${start} » — date ISO attendue`);
  if (end !== null && !ISO.test(String(end))) throw new Error(`fin « ${end} » — date ISO attendue`);
  if (end !== null && parse(end) < parse(start)) throw new Error('un événement ne peut pas finir avant de commencer');

  const event = store.get(item_id);
  if (!event) throw new Error(`« ${item_id} » inconnu — la Timeline ne projette que des entités canoniques`);
  if (!String(item_id).startsWith('evt-')) {
    throw new Error(`« ${item_id} » n'est pas un événement canonique : la Timeline ne déplace pas ce qu'elle ne projette pas`);
  }

  /* Une pause est un droit : on ne déplace pas ce qui est en pause. */
  if (event.paused_until && parse(event.paused_until) > parse(now)) {
    throw new Error(`« ${item_id} » est en pause jusqu'au ${event.paused_until} : rien ne le déplace`);
  }

  const before = { start_at: event.start_at, end_at: event.end_at ?? null };
  if (before.start_at === start && (before.end_at ?? null) === (end ?? null)) {
    return { moved: false, reason: 'l\'événement est déjà à cette position — rien à déplacer' };
  }

  /* La trace précède l'effet : un déplacement non tracé n'a pas eu lieu. */
  const dec = store.create('decision', {
    target_id: item_id,
    decision: 'accepted',
    actor,
    reason: reason || `déplacement en mode ${mode}`,
    before,
    after: { start_at: start, end_at: end },
    reversible: true,
    source: 'human/timeline',
    provenance: provenance(actor, 'confirmed'),
    confidence: 'high',
    status: 'approved',
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'timeline' });

  const moved = store.put('event', {
    ...event,
    start_at: start,
    end_at: end ?? event.end_at ?? null,
    updated_at: now,
    provenance: provenance(actor, 'confirmed', { moved_by: dec.id }),
  }, { actor, cause: 'timeline' });

  store.trace({ op: 'right:timeline', type: 'event', id: item_id, actor, cause: 'timeline' });

  return { moved: true, decision: dec, event: moved, before, after: { start_at: start, end_at: end } };
}

/** Achever un élément — actif en PLAN et en LIVE. */
export function complete(store, { item_id, actor, mode = 'LIVE', now = new Date().toISOString() } = {}) {
  if (!actor) throw new Error('achèvement sans acteur — refusé');
  if (!MODE_CAPABILITIES[mode]?.includes('COMPLETE')) {
    throw new Error(`le mode « ${mode} » n'autorise pas COMPLETE`);
  }
  const event = store.get(item_id);
  if (!event) throw new Error(`« ${item_id} » inconnu`);

  const done = store.put('event', {
    ...event,
    status: 'published',
    updated_at: now,
    provenance: provenance(actor, 'confirmed'),
  }, { actor, cause: 'timeline' });

  store.trace({ op: 'right:timeline', type: 'event', id: item_id, actor, cause: 'complete' });
  return { completed: true, event: done };
}

/** Ce que le moteur expose — pour l'écran et les tests. */
export function moteur() {
  return {
    modes: MODES,
    capabilities: CAPABILITIES,
    mode_capabilities: MODE_CAPABILITIES,
    granularities: GRANULARITIES,
    automatic_modes: AUTOMATIC_MODES,
    source_of_truth: 'event',
    writes_on_project: false,
  };
}
