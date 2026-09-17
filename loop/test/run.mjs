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
import { validate, EPISTEMIC_KEYS, CONFIDENCE_LEVELS, fromDataModelConfidence, isEstablished } from '../src/schema.mjs';

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

/* ── Bilan ─────────────────────────────────────────────────────── */
console.log(`\n${failures.length ? '✗' : '✓'} ${pass} test(s) réussi(s) · ${failures.length} échec(s)\n`);
if (failures.length) process.exit(1);
