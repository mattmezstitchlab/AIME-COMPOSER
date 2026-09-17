#!/usr/bin/env node
/**
 * AIME / NOEMA — TESTS DE LA BOUCLE
 *
 * Zéro dépendance. Chaque test nomme ce qu'il vérifie et échoue
 * bruyamment. Sort en code 1 au premier échec.
 *
 * Les propriétés testées sont les invariants du système, pas des
 * détails d'implémentation :
 *   · rien n'entre sans provenance ;
 *   · une proposition n'est jamais un fait ;
 *   · la confiance a trois degrés, jamais un nombre ;
 *   · sous le seuil, NOEMA se tait ;
 *   · une décision humaine laisse une trace attribuable.
 */
import { createStore, provenance } from '../src/store.mjs';
import { observe, propose, decide, confidenceOf, worthProposing, PROPOSAL_THRESHOLD } from '../src/noema.mjs';
import { validate, EPISTEMIC_KEYS, CONFIDENCE_LEVELS, fromDataModelConfidence, isEstablished, ACTION_VERBS } from '../src/schema.mjs';
import { interpret, submit } from '../src/intention.mjs';
import { draft, authorize, execute, posture } from '../src/action.mjs';
import { voir, comprendre, corriger, supprimer, pauser, limiter, partager, revoquer, isPaused, droits, activeGrants } from '../src/governance.mjs';

let pass = 0;
const failures = [];
const NOW = '2026-09-17T16:00:00Z';

function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push({ name, message: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split('\n').join('\n      ')}`);
  }
}
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}\n      reçu : ${JSON.stringify(a)}\n      attendu : ${JSON.stringify(b)}`); };
const ok = (v, m) => { if (!v) throw new Error(m); };
const throws = (fn, m) => { try { fn(); } catch { return; } throw new Error(m); };

/* ── Un monde de démonstration ─────────────────────────────────── */
function seedWorld() {
  const s = createStore(null, { now: () => NOW });

  s.create('person', {
    display_name: 'Camille Vasseur', roles: ['saxophone', 'composition'],
    availability: { unavailable: ['2026-09-17'], declared: true },
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  s.create('person', {
    display_name: 'Léon Ferrand', roles: ['saxophone', 'arrangement'],
    availability: { unavailable: ['2026-09-17'], declared: true },
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  s.create('person', {
    display_name: 'Nour Belkacem', roles: ['violoncelle'],
    availability: { unavailable: [], declared: true },
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });

  s.create('project', {
    title: 'Atelier Nord', owner_id: 'org-0001',
    requires: [{ target_id: 'obj-0001', field: 'content.capacity', blocks: "le format de l'affiche" }],
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  /* Le lieu : capacité inconnue, volontairement. */
  s.put('object', {
    id: 'obj-0001', type: 'place', content: { name: 'Salle des Fêtes', capacity: null },
    project_id: 'prj-0001',
    source: 'extraction', provenance: provenance('calendrier', 'extracted'),
    confidence: 'medium', status: 'draft', created_by: 'noema',
  });

  s.create('event', {
    type: 'rehearsal', start_at: '2026-09-17', description: 'Répétition générale',
    participants: ['ppl-0001', 'ppl-0002', 'ppl-0003'],
    candidate_dates: ['2026-09-24', '2026-09-25'],
    project_id: 'prj-0001',
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });

  s.create('asset', {
    kind: 'image', rights_until: '2026-09-30', usage_count: 3,
    source: 'import', provenance: provenance('import', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });

  return s;
}

/* ══════════════════════════════════════════════════════════════
   1. LE CONTRAT DE DONNÉES
   ══════════════════════════════════════════════════════════════ */
console.log('\nCONTRAT DE DONNÉES');

test('un objet sans provenance est refusé', () => {
  const s = createStore(null, { now: () => NOW });
  throws(
    () => s.create('person', { display_name: 'Sans origine', created_by: 'x' }),
    "le store a accepté un objet sans provenance — la Phase 0 du roadmap est violée",
  );
});

test('un objet sans auteur est refusé', () => {
  const s = createStore(null, { now: () => NOW });
  throws(
    () => s.create('person', { display_name: 'Anonyme', source: 'x', provenance: provenance('x', 'observed') }),
    'le store a accepté un objet sans created_by',
  );
});

test('un identifiant non canonique est refusé', () => {
  const s = createStore(null, { now: () => NOW });
  throws(
    () => s.put('person', {
      id: 'personne-1', display_name: 'X', source: 'x',
      provenance: provenance('x', 'observed'), created_by: 'y',
    }),
    "le store a accepté un identifiant hors du schéma « ppl-… »",
  );
});

test('une confiance numérique est refusée', () => {
  /* Un pourcentage est une fausse précision : le contrat le refuse. */
  const bad = {
    id: 'ppl-0001', display_name: 'X', source: 'x',
    provenance: provenance('x', 'observed'), confidence: 0.87,
    created_by: 'y', created_at: NOW,
  };
  const errs = validate('person', bad);
  ok(errs.some((e) => e.includes('confidence')), `validate() n'a pas signalé 0.87 : ${errs}`);

  const s = createStore(null, { now: () => NOW });
  throws(() => s.put('person', bad), 'le store a accepté une confiance numérique');
});

test('une horloge réelle est acceptée (secondes fractionnaires)', () => {
  /* Régression : la regex ISO refusait new Date().toISOString(), et les
     tests ne le voyaient pas parce qu'ils utilisaient une date fixe. */
  const s = createStore(null);
  const p = s.create('person', {
    display_name: 'Horloge réelle', source: 'test',
    provenance: provenance('test', 'observed'), created_by: 'test',
  });
  ok(/T\d{2}:\d{2}:\d{2}\.\d+Z$/.test(p.created_at), `created_at inattendu : ${p.created_at}`);
  eq(validate('person', p).length, 0, 'un objet horodaté par une horloge réelle est rejeté');
});

test('les trois degrés de confiance sont exactement low, medium, high', () => {
  eq(CONFIDENCE_LEVELS, ['low', 'medium', 'high'], 'les degrés de confiance ont changé');
});

test('un état épistémique hors vocabulaire est refusé', () => {
  const errs = validate('person', {
    id: 'ppl-0001', display_name: 'X', source: 'x',
    provenance: { origin: 'x', state: 'peut-etre' }, created_by: 'y', created_at: NOW,
  });
  ok(errs.some((e) => e.includes('provenance.state')), `un état inventé a passé la validation : ${errs}`);
});

test('le vocabulaire du data model se rattache sans perte', () => {
  eq(fromDataModelConfidence('DECLARED'), 'observed', 'DECLARED');
  eq(fromDataModelConfidence('SUGGESTED'), 'proposed', 'SUGGESTED');
  eq(fromDataModelConfidence('UNKNOWN'), null, 'UNKNOWN doit rester une absence, pas un état');
  throws(() => fromDataModelConfidence('INVENTÉ'), 'une classe inconnue a été acceptée');
});

/* ══════════════════════════════════════════════════════════════
   2. LA CONFIANCE
   ══════════════════════════════════════════════════════════════ */
console.log('\nCONFIANCE');

test('la confiance ne retourne jamais un nombre', () => {
  const cases = [
    [], [{ state: 'inferred' }], [{ state: 'observed' }],
    [{ state: 'confirmed' }], [{ state: 'confirmed' }, { state: 'confirmed' }],
    [{ state: 'confirmed' }, { state: 'confirmed' }, { state: 'extracted' }],
  ];
  for (const c of cases) {
    const r = confidenceOf(c);
    ok(CONFIDENCE_LEVELS.includes(r), `confiance « ${r} » hors des trois degrés pour ${JSON.stringify(c)}`);
  }
});

test('une déduction seule ne dépasse jamais « faible »', () => {
  const many = Array.from({ length: 10 }, () => ({ state: 'inferred', ref: 'x' }));
  eq(confidenceOf(many), 'low', 'dix déductions ont suffi à monter la confiance');
});

test('il faut au moins une évidence ANCRÉE pour dépasser « faible »', () => {
  /* Une seule perception directe est trop mince : poids 1, seuil 2. */
  eq(confidenceOf([{ state: 'observed' }]), 'low', 'une observation isolée a suffi');
  /* Deux perceptions directes se corroborant : on peut déranger quelqu'un. */
  eq(confidenceOf([{ state: 'observed' }, { state: 'observed' }]), 'medium', 'deux observations ancrées');
  eq(confidenceOf([{ state: 'confirmed' }, { state: 'observed' }]), 'medium', 'confirmée + observée');
});

test('« élevé » exige deux évidences établies et un poids suffisant', () => {
  eq(confidenceOf([{ state: 'confirmed' }, { state: 'confirmed' }, { state: 'extracted' }]), 'high', 'trois ancrées');
  eq(confidenceOf([{ state: 'confirmed' }]), 'medium', 'une seule évidence ancrée ne suffit pas à « élevé »');
});

test('deux déclarations enregistrées suffisent à proposer', () => {
  /* Deux personnes se déclarent indisponibles : deux perceptions directes,
     aucune validation humaine. Cela doit atteindre « moyen », sinon NOEMA
     ne pourrait jamais rien proposer à partir de ses propres observations. */
  eq(confidenceOf([{ state: 'observed', ref: 'a' }, { state: 'observed', ref: 'b' }]), 'medium',
    'deux observations ancrées devraient suffire à « moyen »');
  eq(worthProposing(confidenceOf([{ state: 'observed', ref: 'a' }, { state: 'observed', ref: 'b' }])), true,
    'deux déclarations devraient rendre une proposition montrable');
});

/* ══════════════════════════════════════════════════════════════
   3. L'OBSERVATION ET LE SILENCE
   ══════════════════════════════════════════════════════════════ */
console.log('\nOBSERVATION');

test('NOEMA observe le monde et produit des propositions', () => {
  const s = seedWorld();
  const { drafts, proposable } = observe(s, { now: NOW });
  ok(drafts.length >= 3, `attendu au moins 3 ébauches (report, droits, manque), reçu ${drafts.length}`);
  ok(proposable.length >= 2, `attendu au moins 2 propositions montrables, reçu ${proposable.length}`);
});

test('toute proposition porte au moins une évidence citée', () => {
  const s = seedWorld();
  for (const d of observe(s, { now: NOW }).drafts) {
    ok(d.evidence.length > 0, `${d.kind} n'a aucune évidence`);
    for (const e of d.evidence) {
      ok(EPISTEMIC_KEYS.includes(e.state), `évidence en état inconnu « ${e.state} »`);
      ok(Boolean(e.ref), 'une évidence sans référence');
    }
  }
});

test('LE SILENCE : sous le seuil, rien n’est proposé', () => {
  const s = createStore(null, { now: () => NOW });
  /* Une seule personne, aucune indisponibilité déclarée, aucun droit,
     aucun requis : le monde est trop pauvre pour qu'on dérange quelqu'un. */
  s.create('person', {
    display_name: 'Seule', roles: ['piano'], availability: { unavailable: [] },
    source: 'saisie', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  const { written, observed } = propose(s, { now: NOW, actor: 'noema' });
  eq(observed, 0, 'le moteur a inventé quelque chose à dire sur un monde vide');
  eq(written.length, 0, 'le moteur a écrit une proposition alors que rien ne le justifiait');
});

test('une déduction isolée ne déclenche aucune proposition', () => {
  eq(worthProposing('low'), false, 'une confiance faible a été jugée digne');
  eq(worthProposing(PROPOSAL_THRESHOLD), true, 'le seuil lui-même devrait passer');
});

test('observer n’écrit rien dans le store', () => {
  const s = seedWorld();
  const before = s.all().length;
  observe(s, { now: NOW });
  eq(s.all().length, before, 'observe() a modifié le store : l’observation ne doit rien écrire');
});

/* ══════════════════════════════════════════════════════════════
   4. UNE PROPOSITION N'EST PAS UN FAIT
   ══════════════════════════════════════════════════════════════ */
console.log('\nPROPOSITION ≠ FAIT');

test('une proposition écrite est en état « proposed », statut « open »', () => {
  const s = seedWorld();
  const { written } = propose(s, { now: NOW });
  ok(written.length > 0, 'aucune proposition écrite');
  for (const p of written) {
    eq(p.provenance.state, 'proposed', `${p.id} n'est pas en état proposed`);
    eq(p.status, 'open', `${p.id} n'est pas en statut open`);
    eq(isEstablished(p), false, `${p.id} est considérée comme un fait établi`);
  }
});

test('proposer ne modifie jamais l’objet visé', () => {
  const s = seedWorld();
  const evt = s.byType('event')[0];
  const avant = JSON.stringify(evt);
  propose(s, { now: NOW });
  eq(JSON.stringify(s.get(evt.id)), avant, "l'événement a été modifié par la seule observation");
});

test('NOEMA ne re-propose pas deux fois la même chose', () => {
  const s = seedWorld();
  const first = propose(s, { now: NOW }).written.length;
  const second = propose(s, { now: NOW }).written.length;
  ok(first > 0, 'premier passage vide');
  eq(second, 0, `le moteur a re-proposé ${second} chose(s) déjà ouvertes`);
});

/* ══════════════════════════════════════════════════════════════
   5. LA VALIDATION HUMAINE
   ══════════════════════════════════════════════════════════════ */
console.log('\nVALIDATION HUMAINE');

test('accepter transforme la proposition en fait, avec trace', () => {
  const s = seedWorld();
  const p = propose(s, { now: NOW }).written[0];
  const { decision, proof, proposal } = decide(s, {
    proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', reason: 'le 24 convient', now: NOW,
  });
  eq(proposal.status, 'accepted', 'statut après acceptation');
  eq(proposal.provenance.state, 'confirmed', "acceptée mais toujours en état « proposed »");
  eq(proposal.provenance.decided_by, 'a.meunier', 'décision non attribuable');
  eq(decision.decision, 'accepted', 'décision');
  eq(decision.actor, 'a.meunier', 'auteur de la décision');
  eq(proof.proof_type, 'validation', 'aucune preuve produite');
  eq(proof.evidence_ref, decision.id, 'la preuve ne cite pas la décision');
});

test('refuser laisse la proposition non établie', () => {
  const s = seedWorld();
  const p = propose(s, { now: NOW }).written[0];
  const { proposal } = decide(s, { proposal_id: p.id, decision: 'rejected', actor: 'a.meunier', now: NOW });
  eq(proposal.status, 'rejected', 'statut après refus');
  eq(isEstablished(proposal), false, 'une proposition refusée est devenue un fait');
});

test('une décision sans auteur est refusée', () => {
  const s = seedWorld();
  const p = propose(s, { now: NOW }).written[0];
  throws(
    () => decide(s, { proposal_id: p.id, decision: 'accepted', now: NOW }),
    'une décision anonyme a été acceptée',
  );
});

test('on ne décide pas deux fois', () => {
  const s = seedWorld();
  const p = propose(s, { now: NOW }).written[0];
  decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  throws(
    () => decide(s, { proposal_id: p.id, decision: 'rejected', actor: 'l.ferrand', now: NOW }),
    'une proposition déjà tranchée a pu être re-tranchée',
  );
});

test('un fait confirmé ne se rétrograde pas en silence', () => {
  const s = seedWorld();
  const p = propose(s, { now: NOW }).written[0];
  decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  const confirmed = s.get(p.id);
  throws(
    () => s.put('proposal', { ...confirmed, provenance: { ...confirmed.provenance, state: 'inferred' } }),
    'un fait confirmé a été rétrogradé sans décision',
  );
});

/* ══════════════════════════════════════════════════════════════
   6. LA BOUCLE COMPLÈTE
   ══════════════════════════════════════════════════════════════ */
console.log('\nBOUCLE COMPLÈTE');

test('intention → mémoire → timeline → proposition → validation → preuve', () => {
  const s = createStore(null, { now: () => NOW });

  /* MÉMOIRE */
  const org = s.create('organization', {
    display_name: 'Conservatoire de Lyon', kind: 'client',
    source: 'saisie', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  const project = s.create('project', {
    title: 'Atelier Nord', owner_id: org.id,
    source: 'intention humaine', provenance: provenance('brief', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  const a = s.create('person', {
    display_name: 'Camille Vasseur', roles: ['saxophone'],
    availability: { unavailable: ['2026-09-17'], declared: true },
    source: 'saisie', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });
  const b = s.create('person', {
    display_name: 'Léon Ferrand', roles: ['saxophone'],
    availability: { unavailable: ['2026-09-17'], declared: true },
    source: 'saisie', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });

  /* TIMELINE */
  const evt = s.create('event', {
    type: 'rehearsal', start_at: '2026-09-17', description: 'Répétition générale',
    participants: [a.id, b.id], candidate_dates: ['2026-09-24'], project_id: project.id,
    source: 'saisie', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: 'a.meunier',
  });

  /* PROPOSITION */
  const { written } = propose(s, { now: NOW });
  const reschedule = written.find((p) => p.requested_change.kind === 'reschedule');
  ok(reschedule, 'aucune proposition de report produite');
  eq(reschedule.target_id, evt.id, 'la proposition ne vise pas le bon événement');
  ok(reschedule.requested_change.title.includes('2026-09-24'), 'la date proposée est absente du titre');

  /* VALIDATION */
  const { proof, decision } = decide(s, {
    proposal_id: reschedule.id, decision: 'accepted', actor: 'a.meunier',
    reason: 'le 24 réunit le plateau', now: NOW,
  });

  /* PREUVE */
  ok(s.get(proof.id), 'la preuve n\'est pas persistée');
  eq(s.get(proof.id).validation_state, 'accepted', 'état de validation');
  ok(s.get(decision.id), 'la décision n\'est pas persistée');

  /* La boucle est refermée : le journal contient chaque étape. */
  const ops = s.journal.map((j) => `${j.op}:${j.type || j.id}`);
  for (const attendu of ['create:organization', 'create:project', 'create:event', 'create:proposal', 'create:decision', 'create:proof']) {
    ok(ops.includes(attendu), `étape manquante du journal : ${attendu}\n      journal : ${ops.join(', ')}`);
  }
});

test('tout objet du journal a un acteur', () => {
  const s = seedWorld();
  propose(s, { now: NOW });
  const p = s.byType('proposal')[0];
  decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  for (const j of s.journal) {
    ok(j.actor, `entrée de journal sans acteur : ${JSON.stringify(j)}`);
    ok(j.at, `entrée de journal sans horodatage : ${JSON.stringify(j)}`);
  }
});

/* ── INTENTION : l'entrée de la boucle ─────────────────────────── */
console.log('\nINTENTION');

const PHRASE = 'Camille Vasseur est saxophoniste ; il faut la capacité de la salle ; envoyer l\u2019annonce pour le 24 septembre';

test('interpret() ne lit rien dans le store et n\u2019écrit rien', () => {
  const s = seedWorld();
  const before = s.all().length;
  const r = interpret(PHRASE);
  ok(r.candidates.length >= 4, `attendu au moins 4 candidats, reçu ${r.candidates.length}`);
  eq(s.all().length, before, 'interpret() a écrit dans le monde');
});

test('aucun candidat n\u2019est marqué confirmé', () => {
  for (const c of interpret(PHRASE).candidates) {
    eq(c.confidence, 'low', `« ${c.title} » porte une confiance trop haute`);
    for (const e of c.evidence) eq(e.state, 'inferred', `évidence « ${e.state} » — une phrase seule n\u2019est pas une évidence ancrée`);
  }
});

test('l\u2019apostrophe typographique est reconnue', () => {
  const r = interpret('envoyer l\u2019annonce');
  ok(r.candidates.some((c) => c.kind === 'action_request'), 'l\u2019apostrophe \u2019 n\u2019a pas été reconnue');
});

test('un chiffre dans la phrase ne bloque pas la lecture', () => {
  const r = interpret('envoyer l\u2019annonce pour le 24 septembre');
  const kinds = r.candidates.map((c) => c.kind);
  ok(kinds.includes('action_request') && kinds.includes('date'), `lecture incomplète : ${kinds.join(', ')}`);
});

test('submit() ne crée que des propositions ouvertes', () => {
  const s = seedWorld();
  const before = { person: s.byType('person').length, total: s.all().length };
  const { written } = submit(s, PHRASE, { actor: 'noema', now: NOW });
  ok(written.length >= 4, `attendu au moins 4 propositions, reçu ${written.length}`);
  for (const p of written) {
    ok(p.id.startsWith('prop-'), `submit() a créé autre chose qu\u2019une proposition : ${p.id}`);
    eq(p.status, 'open', 'une proposition d\u2019intention n\u2019est pas ouverte');
    eq(p.provenance.state, 'inferred', 'une intention humaine n\u2019est pas un fait');
    eq(p.target_id, null, 'une création ne doit pas s\u2019accrocher à un objet au hasard');
  }
  eq(s.byType('person').length, before.person, 'submit() a créé une personne sans validation humaine');
  eq(s.all().length - before.total, written.length, 'submit() a écrit autre chose que ses propositions');
});

test('ce qui n\u2019est pas compris est déclaré, pas deviné', () => {
  const r = interpret('xyzzy plugh frobnicate');
  eq(r.candidates.length, 0, 'un verbiage inconnu a produit des candidats');
  ok(r.unparsed.length > 0, 'ce qui n\u2019est pas lu doit être déclaré comme non lu');
});

test('une proposition sans cible n\u2019est admise que pour une création', () => {
  const base = {
    id: 'prop-9999', requested_change: { kind: 'note', title: 'x' }, author: 'noema',
    evidence: [{ state: 'inferred', ref: 'r' }], source: 's', target_id: null, status: 'open',
    provenance: provenance('o', 'inferred'), created_by: 'a', created_at: NOW,
  };
  ok(validate('proposal', base).length > 0, 'une proposition sans cible et sans type de création est passée');
  ok(validate('proposal', { ...base, requested_change: { kind: 'person', title: 'x' } }).length === 0,
    'une création déclarée sans cible a été refusée');
});

/* ── ACTION : la sortie de la boucle ───────────────────────────── */
console.log('\nACTION');

test('le coût d\u2019une action vient du registre, pas de l\u2019appelant', () => {
  const errs = validate('action', {
    id: 'act-0001', verb: 'send', scope: 'external', risk: 'low', reversible: false,
    permission_required: 'external_communication', source: 's',
    provenance: provenance('o', 'inferred'), created_by: 'a', created_at: NOW,
  });
  ok(errs.some((e) => e.includes('risk')), 'se déclarer moins risqué que son verbe est passé');
});

test('un verbe inconnu est refusé, jamais approximé', () => {
  const s = seedWorld();
  const r = draft(s, { verb: 'transférer', object: 'le contrat' });
  eq(r.ok, false, 'un verbe hors registre a été accepté');
  eq(s.byType('action').length, 0, 'un verbe refusé a tout de même créé une action');
});

test('une action naît en attente d\u2019autorisation, jamais exécutée', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  eq(action.status, 'pending_authorization', 'une action neuve n\u2019attend pas l\u2019autorisation');
  eq(action.authorized_by, null, 'une action neuve se déclare déjà autorisée');
  eq(action.scope, ACTION_VERBS.send.scope, 'le périmètre ne vient pas du registre');
});

test('exécuter sans autorisation est refusé et journalisé', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  throws(() => execute(s, { action_id: action.id, actor: 'a.meunier', now: NOW }),
    'une action non autorisée a été exécutée');
  eq(s.get(action.id).status, 'pending_authorization', 'l\u2019action a changé d\u2019état malgré le refus');
  ok(s.journal.some((j) => j.op === 'refusal'), 'le refus n\u2019a pas été journalisé');
});

test('une autorisation sans acteur est refusée', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  throws(() => authorize(s, { action_id: action.id, actor: '', grant: true, now: NOW }),
    'une autorisation anonyme est passée');
});

test('l\u2019autorisation n\u2019est pas transférable', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  authorize(s, { action_id: action.id, actor: 'a.meunier', grant: true, now: NOW });
  throws(() => execute(s, { action_id: action.id, actor: 'autre.personne', now: NOW }),
    'quelqu\u2019un d\u2019autre a pu exécuter une action autorisée par autrui');
});

test('une action autorisée puis exécutée laisse une preuve d\u2019exécution', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  const { proof: authProof } = authorize(s, { action_id: action.id, actor: 'a.meunier', grant: true, reason: 'concert confirmé', now: NOW });
  eq(authProof.proof_type, 'validation', 'l\u2019autorisation ne produit pas de preuve');

  const { action: done, result } = execute(s, { action_id: action.id, actor: 'a.meunier', now: NOW });
  eq(done.status, 'executed', 'l\u2019action autorisée n\u2019a pas été exécutée');
  ok(done.executed_at, 'une action exécutée sans horodatage');
  ok(result.detail.includes('simulé'), 'l\u2019exécution prétend sortir de la machine');
  ok(s.byType('proof').some((p) => p.proof_type === 'execution'), 'aucune preuve d\u2019exécution');
});

test('exécuter deux fois la même action est refusé', () => {
  const s = seedWorld();
  const { action } = draft(s, { verb: 'envoyer', object: 'l\u2019annonce' });
  authorize(s, { action_id: action.id, actor: 'a.meunier', grant: true, now: NOW });
  execute(s, { action_id: action.id, actor: 'a.meunier', now: NOW });
  throws(() => execute(s, { action_id: action.id, actor: 'a.meunier', now: NOW }),
    'une action a pu être exécutée deux fois');
});

test('NOEMA déclare ne pas pouvoir agir seule', () => {
  const p = posture();
  eq(p.can_suggest, true, 'NOEMA devrait pouvoir suggérer');
  eq(p.can_execute_alone, false, 'NOEMA se déclare capable d\u2019agir seule');
  ok(p.verbs.every((v) => v.permission), 'un verbe sans permission requise');
  ok(p.verbs.filter((v) => v.scope === 'external').every((v) => v.risk === 'high'),
    'une action externe n\u2019est pas classée à risque élevé');
});

/* ── MATÉRIALISATION : la validation change le monde ───────────── */
console.log('\nMATÉRIALISATION');

/** Soumet une phrase et renvoie la proposition d'un type donné. */
function intentionPour(s, phrase, kind) {
  const { written } = submit(s, phrase, { actor: 'noema', now: NOW });
  const p = written.find((x) => x.requested_change.kind === kind);
  if (!p) throw new Error(`aucune proposition « ${kind} » produite par « ${phrase} »`);
  return p;
}

test('valider une intention crée la personne', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'Iris Fontaine est clarinettiste', 'person');
  const before = s.byType('person').length;
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  ok(materialization?.materialized, `rien n'a été créé : ${materialization?.reason}`);
  eq(s.byType('person').length, before + 1, 'la personne n\u2019a pas été mémorisée');
  const created = s.get(materialization.id);
  eq(created.display_name, 'Iris Fontaine', 'mauvais nom mémorisé');
  eq(created.provenance.state, 'confirmed', 'un objet validé n\u2019est pas confirmé');
  eq(s.get(p.id).materialized_id, materialization.id, 'la proposition ne retient pas ce qu\u2019elle a produit');
});

test('rejeter une intention ne crée rien', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'Iris Fontaine est clarinettiste', 'person');
  const before = s.byType('person').length;
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'rejected', actor: 'a.meunier', now: NOW });
  eq(materialization, null, 'une intention rejetée a été matérialisée');
  eq(s.byType('person').length, before, 'une intention rejetée a créé une personne');
});

test('une personne déjà mémorisée n\u2019est pas dupliquée', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'Camille Vasseur est saxophoniste', 'person');
  const before = s.byType('person').length;
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  eq(materialization.materialized, false, 'un doublon a été créé');
  eq(s.byType('person').length, before, 'le nombre de personnes a changé');
  ok(/existe déjà/.test(materialization.reason), `raison illisible : ${materialization.reason}`);
});

test('une relation vers une personne inconnue n\u2019est pas inventée', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'Camille travaille avec Zénon Inconnu', 'relation');
  const before = s.byType('relation').length;
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  eq(materialization.materialized, false, 'une relation vers un inconnu a été créée');
  eq(s.byType('relation').length, before, 'une relation fantôme est apparue');
  ok(/pas encore mémorisé/.test(materialization.reason), `raison illisible : ${materialization.reason}`);
});

test('une relation entre deux personnes connues est créée', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'Camille travaille avec Nour', 'relation');
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  ok(materialization.materialized, `relation non créée : ${materialization.reason}`);
  const rel = s.get(materialization.id);
  eq(rel.relation_type, 'collaborates_with', 'mauvais type de relation');
  ok(rel.from_id !== rel.to_id, 'relation d\u2019une personne avec elle-même');
});

test('un inconnu est enregistré comme inconnu, jamais comblé', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'il faut la capacité de la salle', 'unknown');
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  ok(materialization.materialized, `l\u2019inconnu n\u2019a pas été enregistré : ${materialization.reason}`);
  const obj = s.get(materialization.id);
  eq(obj.type, 'unknown', 'l\u2019inconnu a été enregistré sous un autre type');
  eq(obj.content.filled, false, 'l\u2019inconnu a été comblé');
  ok(obj.content.missing, 'l\u2019objet ne dit pas ce qui manque');
});

test('valider une demande d\u2019action ne l\u2019exécute pas', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'envoyer l\u2019annonce du concert', 'action_request');
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  ok(materialization.materialized, `aucune action préparée : ${materialization.reason}`);
  const act = s.get(materialization.id);
  eq(act.status, 'pending_authorization', 'valider une intention a exécuté l\u2019action');
  eq(act.authorized_by, null, 'l\u2019action se déclare autorisée sans personne');
  eq(act.executed_at, null, 'l\u2019action a été exécutée');
});

test('une date seule ne crée aucun événement', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'répétition le 24 septembre', 'date');
  const before = s.byType('event').length;
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  eq(materialization.materialized, false, 'un événement a été créé à partir d\u2019une date seule');
  eq(s.byType('event').length, before, 'un événement fantôme est apparu');
  ok(s.get(p.id).materialization_note, 'l\u2019échec n\u2019est pas écrit sur la proposition');
});

test('un échec de matérialisation n\u2019annule pas la décision humaine', () => {
  const s = seedWorld();
  const p = intentionPour(s, 'répétition le 24 septembre', 'date');
  const { decision: dec, proof } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  eq(dec.decision, 'accepted', 'la décision a été défaite');
  eq(s.get(p.id).status, 'accepted', 'la proposition n\u2019est plus acceptée');
  ok(proof.proof_type === 'validation', 'aucune preuve de la décision');
});

/* ── GOUVERNANCE : la mémoire appartient à l'humain ────────────── */
console.log('\nGOUVERNANCE DE LA MÉMOIRE');

const LATER = '2026-12-31T23:59:59Z';

test('les huit droits sont exposés, dans l\u2019ordre de la constitution', () => {
  eq(droits().rights, ['voir', 'comprendre', 'corriger', 'supprimer', 'pauser', 'limiter', 'partager', 'révoquer'],
    'les huit droits ne correspondent pas à la constitution §6');
  eq(droits().categories, ['personnelle', 'projet', 'partagée', 'temporaire', 'sensible'],
    'les catégories ne correspondent pas à la constitution §6');
});

test('aucun droit ne s\u2019exerce sans acteur', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  for (const [name, fn] of [
    ['voir', () => voir(s, { subject_id: who })],
    ['comprendre', () => comprendre(s, { id: who })],
    ['corriger', () => corriger(s, { id: who, field: 'display_name', value: 'x' })],
    ['supprimer', () => supprimer(s, { id: who })],
    ['pauser', () => pauser(s, { subject_id: who, until: LATER })],
    ['limiter', () => limiter(s, { id: who, category: 'sensible' })],
    ['partager', () => partager(s, { id: who, grantee: 'x@y', purpose: 'p', expires_at: LATER })],
    ['révoquer', () => revoquer(s, { grant_id: 'grt-0001' })],
  ]) {
    throws(fn, `le droit « ${name} » s\u2019exerce sans acteur`);
  }
});

test('VOIR rend la provenance et la confiance de chaque information', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const v = voir(s, { subject_id: who, actor: 'a.meunier' });
  ok(v.known.length > 0, 'VOIR ne remonte rien sur une personne du monde');
  for (const k of v.known) {
    ok('state' in k && 'confidence' in k, `entrée sans provenance ni confiance : ${k.id}`);
    ok('origin' in k, `entrée sans origine : ${k.id}`);
  }
  ok(s.journal.some((j) => j.op === 'right:voir'), 'VOIR n\u2019a pas été tracé');
});

test('COMPRENDRE remonte la chaîne et dit où elle s\u2019arrête', () => {
  const s = seedWorld();
  const { written } = submit(s, 'Iris Fontaine est clarinettiste', { actor: 'noema', now: NOW });
  const p = written[0];
  const { materialization } = decide(s, { proposal_id: p.id, decision: 'accepted', actor: 'a.meunier', now: NOW });
  const c = comprendre(s, { id: materialization.id, actor: 'a.meunier' });
  ok(c.chain.length >= 1, 'aucune chaîne remontée');
  ok(c.terminates_on, 'la chaîne ne dit pas où elle s\u2019arrête');
  ok(s.journal.some((j) => j.op === 'right:comprendre'), 'COMPRENDRE n\u2019a pas été tracé');
});

test('CORRIGER ne remplace jamais en silence', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const avant = s.get(who).display_name;
  const r = corriger(s, { id: who, field: 'display_name', value: 'Camille V.-Ferrand', actor: 'a.meunier', reason: 'usage', now: NOW });
  ok(r.corrected, 'la correction n\u2019a pas eu lieu');
  eq(r.before, avant, 'l\u2019ancienne valeur n\u2019est pas conservée');
  const dec = s.get(r.decision.id);
  eq(dec.before.display_name, avant, 'la décision ne retient pas l\u2019ancienne valeur');
  eq(dec.actor, 'a.meunier', 'la correction n\u2019est pas attribuée');
  eq(s.get(who).display_name, 'Camille V.-Ferrand', 'la nouvelle valeur n\u2019est pas écrite');
  eq(s.get(who).provenance.state, 'confirmed', 'une correction humaine n\u2019est pas confirmée');
});

test('corriger vers la même valeur ne fabrique pas de décision', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const avant = s.byType('decision').length;
  const r = corriger(s, { id: who, field: 'display_name', value: s.get(who).display_name, actor: 'a.meunier', now: NOW });
  eq(r.corrected, false, 'une correction identique a été enregistrée');
  eq(s.byType('decision').length, avant, 'une décision inutile a été créée');
});

test('SUPPRIMER efface le contenu et laisse une pierre tombale', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const r = supprimer(s, { id: who, actor: 'a.meunier', reason: 'demande de la personne', now: NOW });
  eq(s.get(who), null, 'le contenu a survécu à la suppression');
  const tomb = s.get(r.tombstone.id);
  eq(tomb.target_id, who, 'la pierre tombale ne désigne pas l\u2019objet supprimé');
  eq(tomb.deleted_by, 'a.meunier', 'la suppression n\u2019est pas attribuée');
  for (const interdit of ['content', 'display_name', 'title', 'body', 'value']) {
    eq(tomb[interdit], undefined, `la pierre tombale conserve « ${interdit} »`);
  }
  ok(validate('tombstone', tomb).length === 0, 'la pierre tombale est invalide');
});

test('le schéma refuse une pierre tombale qui conserverait le contenu', () => {
  const errs = validate('tombstone', {
    id: 'tmb-0001', target_id: 'ppl-0001', target_type: 'person', deleted_by: 'a', deleted_at: NOW,
    display_name: 'Camille', source: 's', provenance: provenance('o', 'confirmed'),
    created_by: 'a', created_at: NOW,
  });
  ok(errs.some((e) => e.includes('display_name')), 'une pierre tombale avec contenu est passée');
});

test('supprimer révoque les partages de l\u2019objet', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi de projet', expires_at: LATER, actor: 'a.meunier', now: NOW });
  eq(activeGrants(s, who).length, 1, 'le partage n\u2019est pas actif');
  const r = supprimer(s, { id: who, actor: 'a.meunier', now: NOW });
  eq(r.revoked_grants.length, 1, 'le partage a survécu à la suppression');
  eq(activeGrants(s, who).length, 0, 'un partage reste actif sur un objet supprimé');
});

test('PAUSER exclut le sujet de l\u2019observation', () => {
  const s = seedWorld();
  const avant = observe(s, { now: NOW });
  const cible = avant.proposable[0]?.target_id || avant.drafts[0]?.target_id;
  ok(cible, 'le monde de démonstration ne produit aucune observation');
  pauser(s, { subject_id: cible, until: LATER, actor: 'a.meunier', reason: 'demande explicite', now: NOW });
  ok(isPaused(s.get(cible), NOW), 'le sujet n\u2019est pas marqué en pause');
  const apres = observe(s, { now: NOW });
  ok(apres.drafts.every((d) => d.target_id !== cible), 'un sujet en pause continue d\u2019être observé');
  ok(apres.silenced >= 1, 'les ébauches écartées ne sont pas comptées');
});

test('une pause expirée ne bloque plus rien', () => {
  const s = seedWorld();
  const cible = observe(s, { now: NOW }).drafts[0].target_id;
  pauser(s, { subject_id: cible, until: '2026-01-01T00:00:00Z', actor: 'a.meunier', now: NOW });
  eq(isPaused(s.get(cible), NOW), false, 'une pause expirée bloque encore');
  ok(observe(s, { now: NOW }).drafts.some((d) => d.target_id === cible), 'le sujet n\u2019est pas réobservé après échéance');
});

test('une pause sans échéance vérifiable est refusée', () => {
  const s = seedWorld();
  const cible = observe(s, { now: NOW }).drafts[0].target_id;
  throws(() => pauser(s, { subject_id: cible, until: 'bientôt', actor: 'a.meunier', now: NOW }),
    'une pause à échéance invalide est passée');
});

test('LIMITER impose le plafond de la catégorie', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  throws(() => limiter(s, { id: who, category: 'sensible', visibility: 'publique', actor: 'a.meunier', now: NOW }),
    'une information sensible a pu être rendue publique');
  const r = limiter(s, { id: who, category: 'projet', visibility: 'projet', actor: 'a.meunier', now: NOW });
  eq(r.object.category, 'projet', 'la catégorie n\u2019a pas été appliquée');
});

test('passer en privé révoque les partages', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi', expires_at: LATER, actor: 'a.meunier', now: NOW });
  const r = limiter(s, { id: who, category: 'personnelle', visibility: 'privée', actor: 'a.meunier', now: NOW });
  eq(r.revoked_grants.length, 1, 'les partages ont survécu au passage en privé');
});

test('PARTAGER exige une finalité et une échéance', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  throws(() => partager(s, { id: who, grantee: 'x@y', expires_at: LATER, actor: 'a.meunier', now: NOW }),
    'un partage sans finalité est passé');
  throws(() => partager(s, { id: who, grantee: 'x@y', purpose: 'suivi', actor: 'a.meunier', now: NOW }),
    'un partage perpétuel est passé');
});

test('une information sensible ne se partage pas', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  limiter(s, { id: who, category: 'sensible', visibility: 'privée', actor: 'a.meunier', now: NOW });
  throws(() => partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi', expires_at: LATER, actor: 'a.meunier', now: NOW }),
    'une information sensible a été partagée');
});

test('rien ne sort d\u2019un sujet en pause', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  pauser(s, { subject_id: who, until: LATER, actor: 'a.meunier', now: NOW });
  throws(() => partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi', expires_at: LATER, actor: 'a.meunier', now: NOW }),
    'un partage est sorti d\u2019un sujet en pause');
});

test('RÉVOQUER retire l\u2019accès sans effacer le partage', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const { grant } = partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi', expires_at: LATER, actor: 'a.meunier', now: NOW });
  eq(activeGrants(s, who).length, 1, 'le partage n\u2019est pas actif');
  const r = revoquer(s, { grant_id: grant.id, actor: 'a.meunier', reason: 'fin de mission', now: NOW });
  ok(r.revoked, 'la révocation n\u2019a pas eu lieu');
  eq(s.get(grant.id).status, 'revoked', 'le partage n\u2019est pas marqué révoqué');
  ok(s.get(grant.id), 'le partage a été effacé au lieu d\u2019être révoqué');
  eq(activeGrants(s, who).length, 0, 'un partage révoqué reste actif');
  eq(s.get(who).shared_with.length, 0, 'le bénéficiaire figure encore sur l\u2019objet');
});

test('révoquer deux fois ne produit qu\u2019une révocation', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  const { grant } = partager(s, { id: who, grantee: 'client@atelier', purpose: 'suivi', expires_at: LATER, actor: 'a.meunier', now: NOW });
  revoquer(s, { grant_id: grant.id, actor: 'a.meunier', now: NOW });
  const seconde = revoquer(s, { grant_id: grant.id, actor: 'a.meunier', now: NOW });
  eq(seconde.revoked, false, 'une seconde révocation a été enregistrée');
});

test('chaque droit exercé laisse une trace attribuée', () => {
  const s = seedWorld();
  const who = s.byType('person')[0].id;
  voir(s, { subject_id: who, actor: 'a.meunier' });
  comprendre(s, { id: who, actor: 'a.meunier' });
  corriger(s, { id: who, field: 'roles', value: ['saxophone'], actor: 'a.meunier', now: NOW });
  pauser(s, { subject_id: who, until: LATER, actor: 'a.meunier', now: NOW });
  limiter(s, { id: who, category: 'projet', actor: 'a.meunier', now: NOW });
  const ops = s.journal.filter((j) => j.op.startsWith('right:')).map((j) => j.op);
  for (const attendu of ['right:voir', 'right:comprendre', 'right:corriger', 'right:pauser', 'right:limiter']) {
    ok(ops.includes(attendu), `trace manquante : ${attendu}`);
  }
  for (const j of s.journal.filter((x) => x.op.startsWith('right:'))) {
    eq(j.actor, 'a.meunier', `trace de droit sans acteur : ${j.op}`);
  }
});

/* ── Bilan ─────────────────────────────────────────────────────── */
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} test(s) réussi(s) · ${failures.length} échec(s)\n`);
if (failures.length) process.exit(1);
