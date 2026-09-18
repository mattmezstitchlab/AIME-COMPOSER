/**
 * AIME / NOEMA — ROUTEUR API DE LA BOUCLE
 *
 * Extrait de server.mjs : les routes /api/* sont celles du serveur local
 * complet — un seul routeur, deux hôtes. Le serveur local (server.mjs) le
 * compose avec les fichiers statiques ; une fonction serverless
 * (api/[[...route]].mjs) le branche sans rien réécrire. Si une règle change
 * (une décision sans acteur refusée, la provenance obligatoire), elle change
 * ici et s'applique partout — les tests parlent HTTP au routeur, jamais à
 * une copie.
 *
 * Le routeur ne sait pas où il tourne : il reçoit un `runtime` honnête —
 * { mode: 'server', persisted: true } quand un disque existe,
 * { mode: 'serverless', persisted: false } quand rien n'est garanti — et le
 * publie dans /api/state. L'écran affiche la vérité de son hôte, jamais une
 * promesse de persistance que l'hôte ne tient pas.
 *
 *   GET  /api/state            le monde : entités, journal, observation, runtime
 *   POST /api/observe          NOEMA observe et écrit ses propositions
 *   POST /api/decide           un humain tranche { proposal_id, decision, actor, reason }
 *   POST /api/intend           une phrase humaine → propositions (jamais des faits)
 *   POST /api/authorize        un humain autorise ou refuse une action
 *   POST /api/execute          exécute une action autorisée (simulé, tracé)
 *   GET  /api/posture          la posture affichée de NOEMA
 *   GET  /api/rights           les huit droits et leur vocabulaire
 *   POST /api/memory/*         les huit droits de la mémoire
 *   GET  /api/timeline         projection du flux canonique (?mode=&granularity=&project_id=)
 *   GET  /api/timeline/moteur  modes, capacités, granularités
 *   POST /api/timeline/move    déplace l'événement canonique (jamais une copie)
 *   POST /api/timeline/complete  achève un événement
 *   POST /api/reset            repart du monde de démonstration
 *
 * Trois règles côté routeur, les mêmes que dans les modules :
 *   · une décision sans acteur est refusée (400) ;
 *   · NOEMA ne peut pas appeler /api/decide à la place d'un humain —
 *     l'acteur est obligatoire et tracé ;
 *   · aucune route n'écrit un objet sans provenance.
 */
import { observe, propose, decide } from './noema.mjs';
import { interpret, submit } from './intention.mjs';
import { draft, authorize, execute, posture } from './action.mjs';
import {
  voir, comprendre, corriger, supprimer, pauser, limiter, partager, revoquer, droits,
} from './governance.mjs';
import { project, move, complete, moteur } from './timeline.mjs';
import { seed } from '../seed.mjs';

const json = (res, code, body) => {
  const out = JSON.stringify(body, null, 2);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(out) });
  res.end(out);
};

const readBody = (req) => new Promise((done, fail) => {
  let raw = '';
  req.on('data', (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
  req.on('end', () => { try { done(raw ? JSON.parse(raw) : {}); } catch (e) { fail(e); } });
  req.on('error', fail);
});

/**
 * Construit le routeur API de la boucle.
 *
 * @param {{ store: object, runtime?: { mode: 'server'|'serverless', persisted: boolean } }} options
 * @returns {(req: object, res: object) => Promise<boolean>} true si la requête
 *   était une route /api/* (traitée, réponse terminée), false sinon — l'hôte
 *   (serveur statique, fonction serverless) garde la main sur le reste.
 */
export function createLoopApi({ store, runtime = { mode: 'server', persisted: true } }) {
  /** Ce que l'écran a besoin de voir, et rien de plus. */
  function snapshot() {
    const { drafts, proposable, withheld } = observe(store);
    return {
      now: new Date().toISOString(),
      runtime,
      entities: store.all(),
      journal: store.journal.slice(-40),
      observation: {
        total: drafts.length,
        proposable: proposable.map((d) => ({ kind: d.kind, target_id: d.target_id, confidence: d.confidence, title: d.title })),
        withheld: withheld.map((d) => ({ kind: d.kind, target_id: d.target_id, confidence: d.confidence, title: d.title })),
      },
    };
  }

  return async function loopApi(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = decodeURIComponent(url.pathname);
    if (!path.startsWith('/api/')) return false;

    try {
      if (path === '/api/state' && req.method === 'GET') {
        json(res, 200, snapshot());
        return true;
      }

      if (path === '/api/observe' && req.method === 'POST') {
        const result = propose(store, { actor: 'noema' });
        store.save();
        json(res, 200, { ...result, state: snapshot() });
        return true;
      }

      if (path === '/api/decide' && req.method === 'POST') {
        const body = await readBody(req);
        /* Une décision anonyme est refusée : c'est le cœur du système. */
        if (!body.actor) { json(res, 400, { error: 'une décision sans acteur est refusée' }); return true; }
        if (!body.proposal_id) { json(res, 400, { error: 'proposal_id obligatoire' }); return true; }
        if (!['accepted', 'rejected', 'deferred'].includes(body.decision)) {
          json(res, 400, { error: `décision inconnue : « ${body.decision} »` });
          return true;
        }
        const out = decide(store, body);
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/intend' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.text || !String(body.text).trim()) {
          json(res, 400, { error: 'aucune intention à lire : « text » est vide' });
          return true;
        }
        /* `dry_run` permet à l'écran de montrer ce que NOEMA a compris
           AVANT d'écrire quoi que ce soit. C'est le principe GARDIENNE :
           on propose d'abord, on n'enregistre qu'ensuite. */
        if (body.dry_run) { json(res, 200, { ...interpret(body.text), written: [], state: snapshot() }); return true; }
        const out = submit(store, body.text, { actor: body.actor || 'noema' });
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/authorize' && req.method === 'POST') {
        const body = await readBody(req);
        /* Même règle que /api/decide : pas d'acteur, pas d'autorisation. */
        if (!body.actor) { json(res, 400, { error: 'une autorisation sans acteur est refusée' }); return true; }
        if (!body.action_id) { json(res, 400, { error: 'action_id obligatoire' }); return true; }
        const out = authorize(store, body);
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/execute' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.actor) { json(res, 400, { error: 'une exécution sans acteur est refusée' }); return true; }
        if (!body.action_id) { json(res, 400, { error: 'action_id obligatoire' }); return true; }
        const out = execute(store, body);
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/posture' && req.method === 'GET') {
        json(res, 200, posture());
        return true;
      }

      /* ── Gouvernance de la mémoire ───────────────────────────
         Huit droits, une seule règle transversale : aucun ne s'exerce
         sans acteur. Le routeur refuse avant d'appeler le module, pour
         que le refus soit identique quel que soit le droit.
         ──────────────────────────────────────────────────────── */
      /* ── Timeline universelle ────────────────────────────────
         Une projection, jamais une seconde source de vérité : GET
         n'écrit rien, et move() frappe l'événement canonique.
         ──────────────────────────────────────────────────────── */
      if (path === '/api/timeline' && req.method === 'GET') {
        const mode = url.searchParams.get('mode') || 'PLAN';
        const granularity = url.searchParams.get('granularity') || 'JOUR';
        const project_id = url.searchParams.get('project_id') || null;
        json(res, 200, project(store, { mode, granularity, project_id }));
        return true;
      }

      if (path === '/api/timeline/moteur' && req.method === 'GET') {
        json(res, 200, moteur());
        return true;
      }

      if (path === '/api/timeline/move' && req.method === 'POST') {
        const body = await readBody(req);
        /* Le mode est vérifié côté serveur : une interface qui autoriserait
           un déplacement en READ ne pourrait pas le faire passer. */
        if (!body.actor) { json(res, 400, { error: 'un déplacement sans acteur est refusé' }); return true; }
        if (!body.item_id) { json(res, 400, { error: 'item_id obligatoire' }); return true; }
        const out = move(store, body);
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/timeline/complete' && req.method === 'POST') {
        const body = await readBody(req);
        if (!body.actor) { json(res, 400, { error: 'un achèvement sans acteur est refusé' }); return true; }
        if (!body.item_id) { json(res, 400, { error: 'item_id obligatoire' }); return true; }
        const out = complete(store, body);
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/rights' && req.method === 'GET') {
        json(res, 200, droits());
        return true;
      }

      if (path.startsWith('/api/memory/') && req.method === 'POST') {
        const right = path.slice('/api/memory/'.length);
        const body = await readBody(req);
        if (!body.actor) {
          json(res, 400, { error: `le droit « ${right} » exige un acteur — un droit anonyme n'est pas vérifiable` });
          return true;
        }
        const HANDLERS = {
          voir: () => voir(store, { subject_id: body.subject_id, actor: body.actor }),
          comprendre: () => comprendre(store, { id: body.id, actor: body.actor }),
          corriger: () => corriger(store, body),
          supprimer: () => supprimer(store, body),
          pauser: () => pauser(store, { subject_id: body.subject_id, until: body.until, actor: body.actor, reason: body.reason }),
          limiter: () => limiter(store, body),
          partager: () => partager(store, body),
          revoquer: () => revoquer(store, { grant_id: body.grant_id, actor: body.actor, reason: body.reason }),
        };
        if (!HANDLERS[right]) {
          json(res, 404, { error: `droit inconnu : « ${right} » (${Object.keys(HANDLERS).join(', ')})` });
          return true;
        }
        const out = HANDLERS[right]();
        store.save();
        json(res, 200, { ...out, state: snapshot() });
        return true;
      }

      if (path === '/api/reset' && req.method === 'POST') {
        store.reset();
        seed(store);
        store.save();
        json(res, 200, { ok: true, state: snapshot() });
        return true;
      }

      json(res, 404, { error: `route inconnue : ${req.method} ${path}` });
      return true;
    } catch (e) {
      json(res, 400, { error: e.message });
      return true;
    }
  };
}
