/**
 * Monde de démonstration.
 *
 * Aucune donnée de démonstration n'est inventée pour combler un vide :
 * ce qui est inconnu reste marqué comme inconnu. C'est la capacité du
 * lieu — et non un nombre plausible — qui bloque la composition de
 * l'affiche, et le moteur doit pouvoir le dire.
 */
import { provenance } from './src/store.mjs';

const DECLARED = (unavailable) => ({ unavailable, declared: true });
const HUMAN = { source: 'saisie humaine', confidence: 'high', status: 'approved' };

export function seed(store, actor = 'a.meunier') {
  const org = store.create('organization', {
    display_name: 'Conservatoire de Lyon', kind: 'client',
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });

  const project = store.create('project', {
    title: 'Atelier Nord', owner_id: org.id, template: 'identité + site + imprimés',
    requires: [
      { target_id: null, field: 'content.capacity', blocks: "le format de l'affiche" },
    ],
    ...HUMAN, provenance: provenance('brief client', 'confirmed'), created_by: actor,
  });

  /* Le lieu : capacité volontairement inconnue. */
  const venue = store.put('object', {
    id: store.nextId('object'), type: 'place',
    content: { name: 'Salle des Fêtes', city: 'Brières-les-Scellées', capacity: null },
    project_id: project.id,
    source: 'extraction', provenance: provenance('calendrier de production', 'extracted'),
    confidence: 'medium', status: 'draft', created_by: 'noema',
  });
  /* Le requis pointe maintenant sur l'identifiant réel. */
  project.requires[0].target_id = venue.id;
  store.put('project', project, { actor, cause: 'write' });

  const camille = store.create('person', {
    display_name: 'Camille Vasseur', roles: ['saxophone', 'composition'],
    availability: DECLARED(['2026-09-17']),
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });
  const leon = store.create('person', {
    display_name: 'Léon Ferrand', roles: ['saxophone', 'arrangement'],
    availability: DECLARED(['2026-09-17']),
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });
  const nour = store.create('person', {
    display_name: 'Nour Belkacem', roles: ['violoncelle'],
    availability: DECLARED([]),
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });

  const rehearsal = store.create('event', {
    type: 'rehearsal', start_at: '2026-09-17', description: 'Répétition générale',
    participants: [camille.id, leon.id, nour.id],
    candidate_dates: ['2026-09-24', '2026-09-25'],
    project_id: project.id,
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });

  const concert = store.create('event', {
    type: 'performance', start_at: '2026-10-03', description: 'Concert — Salle des Fêtes',
    participants: [camille.id, leon.id, nour.id], candidate_dates: [],
    project_id: project.id,
    ...HUMAN, provenance: provenance('saisie', 'confirmed'), created_by: actor,
  });

  const asset = store.create('asset', {
    kind: 'image', rights_until: '2026-09-30', usage_count: 3,
    ...HUMAN, provenance: provenance('import', 'confirmed'), created_by: actor,
  });

  store.create('relation', {
    from_id: camille.id, relation_type: 'intervenes_on', to_id: concert.id,
    source: 'saisie humaine', provenance: provenance('saisie', 'confirmed'),
    confidence: 'high', status: 'approved', created_by: actor,
  });

  return { org, project, venue, camille, leon, nour, rehearsal, concert, asset };
}
