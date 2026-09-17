/**
 * AIME / NOEMA — INTENTION V1
 *
 * Le maillon d'entrée de la boucle : HUMAIN → GARDIENNE → INTENTION.
 *
 * Une personne dit quelque chose dans ses mots. NOEMA en tire des
 * candidats, et rien d'autre.
 *
 * LIMITE ASSUMÉE : ce module est un extracteur déterministe par motifs,
 * pas un modèle de compréhension. Il ne « comprend » pas une phrase, il
 * reconnaît des formes. Chaque candidat porte donc l'état `inferred`,
 * jamais `confirmed`, et sa confiance reste `low` : une phrase seule
 * n'est pas une évidence ancrée. Un extracteur plus capable (modèle de
 * langue) se brancherait ici sans changer le contrat — ce qui sort doit
 * rester une proposition, pas un fait.
 *
 * Règle absolue : `interpret()` n'écrit rien. `submit()` persiste des
 * propositions, et `decide()` — dans noema.mjs — est le seul chemin qui
 * puisse en faire un fait.
 */
import { provenance } from './store.mjs';
import { draft } from './action.mjs';

/* ── Motifs ──────────────────────────────────────────────────────
   Un motif qui ne reconnaît rien ne devine pas : il retourne une liste
   vide. C'est ce qui permet à `unparsed` d'être honnête.
   ──────────────────────────────────────────────────────────────── */

const MOIS = {
  janvier: 1, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12,
};

const MOTIFS = [
  {
    /* « Camille Vasseur est saxophoniste » · « Léon Ferrand, arrangeur » */
    kind: 'person',
    pattern: /\b([A-ZÀ-Ý][\p{L}'’ʼ-]+)\s+([A-ZÀ-Ý][\p{L}'’ʼ-]+)\s+(?:est|,)\s+([a-zà-ÿ][\p{L}\p{N}\s-]{2,40}?)(?=[.;,]|$)/u,
    extract(m) {
      return [{
        kind: 'person',
        title: `Mémoriser ${m[1]} ${m[2]} — ${m[3].trim()}`,
        body: 'Extrait de votre phrase. Rien n\'est enregistré avant votre validation.',
        fields: { display_name: `${m[1]} ${m[2]}`, roles: [m[3].trim()] },
      }];
    },
  },
  {
    /* « Camille travaille avec Léon » */
    kind: 'relation',
    pattern: /\b([A-ZÀ-Ý][\p{L}'’ʼ-]+)\s+(?:travaille|joue|collabore)\s+avec\s+([A-ZÀ-Ý][\p{L}'’ʼ-]+)/u,
    extract(m) {
      return [{
        kind: 'relation',
        title: `Relier ${m[1]} et ${m[2]}`,
        body: 'Relation déclarée dans votre phrase, non vérifiée.',
        fields: { from_name: m[1], to_name: m[2], relation_type: 'collaborates_with' },
      }];
    },
  },
  {
    /* « le 24 septembre » · « le 24 septembre 2026 » */
    kind: 'date',
    pattern: /\ble\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?:\s+(\d{4}))?/u,
    extract(m) {
      const year = m[3] || new Date().getFullYear();
      const iso = `${year}-${String(MOIS[m[2].toLowerCase()]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
      return [{
        kind: 'date',
        title: `Retenir la date du ${iso}`,
        body: 'Date lue dans votre phrase. Le système ne sait pas encore à quoi elle se rapporte.',
        fields: { date: iso },
      }];
    },
  },
  {
    /* « il faut la capacité de la salle » · « je ne connais pas X » */
    kind: 'unknown',
    pattern: /\b(?:il (?:faut|manque)|je ne (?:connais|sais) pas|inconnu[e]?)\s+(?:la |le |l['’ʼ] ?)?([a-zà-ÿ][\p{L}\p{N}\s'’ʼ-]{2,40}?)(?=[.;,]|$)/u,
    extract(m) {
      return [{
        kind: 'unknown',
        title: `Marquer « ${m[1].trim()} » comme inconnu`,
        body: 'Information manquante signalée. Elle restera affichée comme absente, jamais comblée par une valeur inventée.',
        fields: { missing: m[1].trim() },
      }];
    },
  },
  {
    /* « envoyer l'annonce » · « publier le site » — demande d'action */
    kind: 'action_request',
    pattern: /\b(envoyer|publier|partager|réserver|annuler|relancer)\s+(?:l['’ʼ] ?|le |la |les )?([a-zà-ÿ][\p{L}\p{N}\s'’ʼ-]{2,40}?)(?=[.;,]|$)/u,
    extract(m) {
      return [{
        kind: 'action_request',
        title: `${m[1][0].toUpperCase()}${m[1].slice(1)} — ${m[2].trim()}`,
        body: 'Action demandée. Elle ne sera ni préparée ni exécutée sans une autorisation explicite.',
        fields: { verb: m[1].toLowerCase(), object: m[2].trim() },
      }];
    },
  },
];

/* ── Interprétation ────────────────────────────────────────────── */

/**
 * Lit une phrase et retourne des candidats. N'écrit rien.
 *
 * Retourne aussi `unparsed` : ce que NOEMA n'a pas su lire. Dire ce
 * qu'on ne comprend pas fait partie du contrat — la constitution est
 * explicite : « Elle doit pouvoir dire qu'elle ne sait pas. »
 */
export function interpret(text) {
  const phrase = String(text || '').trim();
  if (!phrase) return { phrase, candidates: [], unparsed: [] };

  const candidates = [];
  const matched = [];

  for (const motif of MOTIFS) {
    const m = phrase.match(motif.pattern);
    if (!m) continue;
    matched.push(m[0].trim());
    for (const c of motif.extract(m)) {
      candidates.push({
        ...c,
        /* Une phrase seule n'est pas une évidence ancrée : confiance basse,
           par construction. C'est `confidenceOf` dans noema.mjs qui fixe la
           règle — on ne la recalcule pas ici. */
        confidence: 'low',
        evidence: [{ state: 'inferred', ref: 'intention/phrase', note: `« ${m[0].trim()} »` }],
      });
    }
  }

  /* Ce qui reste non reconnu, fragment par fragment. */
  const unparsed = phrase
    .split(/(?<=[.;,])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s && !matched.some((mm) => s.includes(mm)));

  return { phrase, candidates, unparsed };
}

/**
 * Persiste les candidats comme propositions. Comme toute proposition :
 * état `inferred`, statut `open`, et rien d'écrit sur les objets visés.
 *
 * `target_id` reste `null` tant qu'aucun objet existant n'est identifié :
 * une intention qui ne désigne rien de connu ne s'accroche pas à un
 * objet au hasard.
 */
export function submit(store, text, { actor = 'noema', now = new Date().toISOString() } = {}) {
  const { phrase, candidates, unparsed } = interpret(text);

  const written = candidates.map((c) => store.create('proposal', {
    target_id: null,
    requested_change: { kind: c.kind, title: c.title, body: c.body, fields: c.fields },
    author: 'noema',
    evidence: c.evidence,
    resulting_id: null,
    source: 'intention/phrase',
    status: 'open',
    confidence: c.confidence,
    provenance: provenance('intention humaine', 'inferred'),
    created_by: actor,
    created_at: now,
  }, { actor, cause: 'intention' }));

  store.trace({ op: 'intention', actor, cause: 'intention' });

  return { phrase, written, unparsed };
}

/* ── Matérialisation ─────────────────────────────────────────────
   C'est ici, et seulement après une décision humaine `accepted`, qu'une
   intention devient un objet du monde.

   Règle de fond : un applicateur qui ne peut pas aboutir ne force pas.
   Il retourne `materialized: false` avec une raison lisible, plutôt que
   d'inventer l'objet qui manque. Un lien entre deux personnes dont l'une
   n'existe pas encore ne se devine pas.
   ──────────────────────────────────────────────────────────────── */

const APPLIERS = {
  person(store, f, { actor, now }) {
    const name = String(f.display_name || '').trim();
    if (!name) return { materialized: false, reason: 'aucun nom à mémoriser' };
    const existing = store.byType('person').find((p) => p.display_name === name);
    if (existing) {
      return { materialized: false, reason: `« ${name} » existe déjà (${existing.id}) — aucun doublon créé`, id: existing.id };
    }
    const person = store.create('person', {
      display_name: name,
      roles: Array.isArray(f.roles) ? f.roles : [],
      availability: { declared: false },
      source: 'intention humaine validée',
      provenance: provenance(actor, 'confirmed'),
      confidence: 'high',
      status: 'approved',
      created_by: actor,
      created_at: now,
    }, { actor, cause: 'intention' });
    return { materialized: true, id: person.id, reason: `personne « ${name} » mémorisée` };
  },

  relation(store, f, { actor, now }) {
    const find = (name) => store.byType('person').find((p) => (p.display_name || '').includes(name));
    const from = find(f.from_name);
    const to = find(f.to_name);
    /* On ne relie pas des personnes qu'on ne connaît pas. */
    if (!from || !to) {
      const missing = [!from && f.from_name, !to && f.to_name].filter(Boolean).join(' et ');
      return { materialized: false, reason: `${missing} n'est pas encore mémorisé — la relation n'est pas inventée` };
    }
    if (from.id === to.id) return { materialized: false, reason: 'une personne ne peut pas être reliée à elle-même' };
    const dup = store.byType('relation').find((r) =>
      r.from_id === from.id && r.to_id === to.id && r.relation_type === f.relation_type);
    if (dup) return { materialized: false, reason: 'cette relation existe déjà', id: dup.id };

    const rel = store.create('relation', {
      from_id: from.id,
      relation_type: f.relation_type,
      to_id: to.id,
      source: 'intention humaine validée',
      provenance: provenance(actor, 'confirmed'),
      confidence: 'high',
      status: 'approved',
      created_by: actor,
      created_at: now,
    }, { actor, cause: 'intention' });
    return { materialized: true, id: rel.id, reason: `${from.display_name} ↔ ${to.display_name}` };
  },

  unknown(store, f, { actor, now }) {
    /* L'inconnu est conservé comme tel : une case vide explicite, jamais
       une valeur plausible. */
    const obj = store.create('object', {
      type: 'unknown',
      content: { missing: f.missing, declared_by: actor, filled: false },
      source: 'intention humaine validée',
      provenance: provenance(actor, 'confirmed'),
      confidence: 'high',
      status: 'discovered',
      created_by: actor,
      created_at: now,
    }, { actor, cause: 'intention' });
    return { materialized: true, id: obj.id, reason: `« ${f.missing} » enregistré comme inconnu — non comblé` };
  },

  action_request(store, f, { actor, now }) {
    /* Valider une demande d'action ne l'exécute pas : elle entre en attente
       d'autorisation explicite. Deux verrous distincts, jamais fusionnés. */
    const r = draft(store, { verb: f.verb, object: f.object, actor, now, source: 'intention validée' });
    if (!r.ok) return { materialized: false, reason: r.error };
    return {
      materialized: true,
      id: r.action.id,
      reason: `action préparée, en attente d'autorisation — rien n'a été exécuté`,
      pending_authorization: true,
    };
  },

  date() {
    return { materialized: false, reason: 'une date seule ne se rattache à rien : aucun événement créé au hasard' };
  },
};

/**
 * Applique une proposition acceptée. Retourne toujours un résultat lisible,
 * y compris lorsqu'elle ne peut pas aboutir — ne pas aboutir est une
 * réponse, pas une erreur silencieuse.
 */
export function materialize(store, proposal, { actor, now = new Date().toISOString() } = {}) {
  const kind = proposal.requested_change?.kind;
  const fields = proposal.requested_change?.fields || {};
  const apply = APPLIERS[kind];
  if (!apply) {
    return { materialized: false, reason: `aucun applicateur pour « ${kind} » — la proposition reste une intention` };
  }
  return apply(store, fields, { actor, now, proposal });
}

export { MOTIFS, APPLIERS };
