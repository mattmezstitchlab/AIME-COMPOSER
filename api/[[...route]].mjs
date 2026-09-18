/**
 * AIME / NOEMA — FONCTION SERVERLESS DE LA BOUCLE
 *
 * Branche le routeur API de la boucle (loop/src/http.mjs — le même que le
 * serveur local complet) sur l'hébergement. Aucune dépendance, aucune
 * réécriture de règle : une décision sans acteur est refusée ici exactement
 * comme ailleurs.
 *
 * Contrat d'honnêteté serverless — il est affiché, jamais caché :
 *   · le monde vit en mémoire, par instance de fonction ;
 *   · il survit tant que l'instance est chaude, et se réinitialise à froid
 *     sur le monde de démonstration ;
 *   · /api/state publie runtime { mode: 'serverless', persisted: false },
 *     et l'écran affiche « démo · réinitialisée à froid » ;
 *   · la persistance disque reste la promesse du serveur local complet
 *     (`node loop/server.mjs`) — elle n'est jamais simulée ici.
 */
import { createStore } from '../loop/src/store.mjs';
import { createLoopApi } from '../loop/src/http.mjs';
import { seed } from '../loop/seed.mjs';

const g = globalThis;
if (!g.__aimeNoemaLoopApi) {
  /* Aucun disque n'est garanti sur cet hôte : mémoire seule, et c'est dit. */
  const store = createStore(null);
  seed(store);
  g.__aimeNoemaLoopApi = createLoopApi({
    store,
    runtime: { mode: 'serverless', persisted: false },
  });
}

export default function handler(req, res) {
  return g.__aimeNoemaLoopApi(req, res);
}
