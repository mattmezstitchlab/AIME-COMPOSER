/**
 * AIME / NOEMA — écran de la boucle minimale.
 *
 * Ce module ne contient aucune règle métier : il affiche ce que l'API
 * renvoie. La logique vit dans src/noema.mjs et src/schema.mjs, où elle
 * est testée. Un écran qui recalcule la confiance dans le navigateur
 * créerait une seconde source de vérité.
 *
 * Construit uniquement avec le Design System : aucune classe inventée,
 * aucune couleur, aucun espacement propre.
 */

const $ = (sel) => document.querySelector(sel);

/* Libellés et glyphes — les glyphes viennent de la famille AIME. */
const KIND = {
  reschedule: { label: 'Report', icon: 'time-calendar' },
  alert: { label: 'Alerte', icon: 'com-alert' },
  question: { label: 'Question', icon: 'com-message' },
  connection: { label: 'Rapprochement', icon: 'rel-relation' },
};
const STATE = {
  observed: { label: 'Observé', icon: 'noe-observed' },
  extracted: { label: 'Extrait', icon: 'noe-extracted' },
  inferred: { label: 'Déduit', icon: 'noe-inferred' },
  proposed: { label: 'Proposé', icon: 'noe-proposed' },
  confirmed: { label: 'Confirmé', icon: 'noe-confirmed' },
  superseded: { label: 'Remplacé', icon: 'noe-superseded' },
};
const CONF = { low: 'faible', medium: 'moyenne', high: 'élevée' };
const TYPE_ICON = {
  person: 'ppl-person', organization: 'ppl-org', project: 'prj-project',
  object: 'mem-card', relation: 'rel-relation', event: 'time-calendar',
  asset: 'med-image', document: 'doc-document', version: 'doc-version',
  proposal: 'noe-proposed', decision: 'apr-approved', proof: 'prf-verified',
};
const TYPE_LABEL = {
  person: 'Personne', organization: 'Organisation', project: 'Projet',
  object: 'Objet', relation: 'Relation', event: 'Événement', asset: 'Média',
  document: 'Document', version: 'Version', proposal: 'Proposition',
  decision: 'Décision', proof: 'Preuve',
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (id, cls = 'a-ic a-ic--sm') =>
  `<svg class="${cls}" aria-hidden="true" width="16" height="16"><use data-a-icon="${esc(id)}"/></svg>`;

/** Résout les <use data-a-icon> créés après le chargement. */
function resolveIcons(rootEl = document) {
  for (const u of rootEl.querySelectorAll('use[data-a-icon]')) {
    u.setAttribute('href', `${document.querySelector('meta[name="a-root"]').content}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
    delete u.dataset.aIcon;
  }
}

const state = (key, label) => {
  const s = STATE[key] || { label: key, icon: 'noe-observed' };
  return `<span class="nstate" data-state="${esc(key)}">${ic(s.icon, 'a-ic a-ic--state')}${esc(label || s.label)}</span>`;
};

const conf = (level) => {
  const n = { low: 1, medium: 2, high: 3 }[level] ?? 1;
  return `<span class="conf" data-level="${esc(level)}">
    <span class="conf__meter" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="conf__label">${esc(CONF[level] || level)}${n ? '' : ''}</span>
  </span>`;
};

/* ── Rendu ─────────────────────────────────────────────────────── */

function renderProposal(p) {
  const k = KIND[p.requested_change?.kind] || { label: 'Proposition', icon: 'noe-proposed' };
  const open = p.status === 'open';
  const target = p.target_id;
  return `<article class="noema-card noema-rail" data-certainty="proposed" data-id="${esc(p.id)}">
    <div class="noema-card__head">
      <span class="noema-card__kind">${ic(k.icon)}${esc(k.label)}</span>
      ${state(p.provenance?.state)}
      <span class="l-spacer"></span>
      ${conf(p.confidence)}
    </div>
    <p class="noema-card__title">${esc(p.requested_change?.title || '(sans titre)')}</p>
    <p class="noema-card__body">${esc(p.requested_change?.body || '')}</p>
    <ul class="noema-card__list">
      ${(p.evidence || []).map((e) => `<li><strong>${esc(STATE[e.state]?.label || e.state)}</strong> — ${esc(e.note || '')} <span class="u-mono t-caption">${esc(e.ref || '')}</span></li>`).join('')}
    </ul>
    <div class="noema-card__foot">
      ${open ? `
        <button type="button" class="a-btn a-btn--sm a-btn--primary" data-decide="accepted" data-target="${esc(p.id)}">Valider</button>
        <button type="button" class="a-btn a-btn--sm" data-decide="deferred" data-target="${esc(p.id)}">Reporter</button>
        <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-decide="rejected" data-target="${esc(p.id)}">Refuser</button>
        <span class="l-spacer"></span>
        <span class="t-caption u-mono">${esc(target)}</span>
      ` : `
        <span class="a-badge a-badge--${p.status === 'accepted' ? 'success' : p.status === 'rejected' ? 'error' : 'warning'}">${esc(p.status)}</span>
        <span class="t-caption u-muted">tranchée par ${esc(p.provenance?.decided_by || '—')}</span>
        <span class="l-spacer"></span>
        <span class="t-caption u-mono">${esc(p.resulting_id || '')}</span>
      `}
    </div>
  </article>`;
}

function renderWithheld(w) {
  const k = KIND[w.kind] || { label: w.kind, icon: 'noe-inferred' };
  return `<div class="l-row l-row--between u-pad u-surface">
    <span class="l-row">${ic(k.icon)}<span class="t-body-sm u-muted">${esc(w.title)}</span></span>
    <span class="l-row">${conf(w.confidence)}<span class="t-caption u-muted">sous le seuil</span></span>
  </div>`;
}

function renderEntity(e) {
  const type = Object.keys(TYPE_ICON).find((t) => e.id?.startsWith({
    person: 'ppl', organization: 'org', project: 'prj', object: 'obj', relation: 'rel',
    event: 'evt', asset: 'ast', document: 'doc', version: 'ver', proposal: 'prop',
    decision: 'dec', proof: 'prf',
  }[t] + '-'));
  const title = e.display_name || e.title || e.description || e.requested_change?.title || e.id;
  return `<article class="ucard">
    <div class="ucard__id">
      <span class="ucard__mark" data-type="${esc(type || 'object')}">${ic(TYPE_ICON[type] || 'mem-card', 'a-ic')}</span>
      <span class="ucard__head">
        <span class="ucard__type">${esc(TYPE_LABEL[type] || 'Objet')}</span>
        <span class="ucard__title">${esc(title)}</span>
      </span>
    </div>
    <dl class="ucard__facts">
      <div class="ucard__fact"><dt>état</dt><dd>${state(e.provenance?.state)}</dd></div>
      <div class="ucard__fact"><dt>source</dt><dd class="u-mono">${esc(e.source || '—')}</dd></div>
      <div class="ucard__fact"><dt>auteur</dt><dd class="u-mono">${esc(e.created_by || '—')}</dd></div>
    </dl>
  </article>`;
}

function renderProof(p) {
  return `<div class="viz-proof__step" data-state="${esc(p.provenance?.state || 'confirmed')}">
    <span class="viz-proof__dot" aria-hidden="true"></span>
    <span class="viz-proof__body">
      <span class="t-body-sm u-strong">${esc(p.proof_type)} — ${esc(p.target_id)}</span>
      <span class="t-caption u-mono">${esc(p.evidence_ref)} · ${esc(p.captured_at)} · ${esc(p.validation_state)}</span>
    </span>
  </div>`;
}

function render(d) {
  const proposals = (d.entities || []).filter((e) => e.id?.startsWith('prop-'));
  const open = proposals.filter((p) => p.status === 'open');
  const closed = proposals.filter((p) => p.status !== 'open');
  const proofs = (d.entities || []).filter((e) => e.id?.startsWith('prf-'));

  $('#h-counts').innerHTML = `
    <span class="a-badge a-badge--accent">${open.length} en attente</span>
    <span class="a-badge">${d.entities.length} entités</span>
    <span class="a-badge">${proofs.length} preuve(s)</span>`;
  $('#h-stamp').textContent = `observation du ${new Date(d.now).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`;

  $('#proposals').innerHTML = proposals.length
    ? [...open, ...closed].map(renderProposal).join('')
    : '<p class="t-body-sm u-muted">NOEMA n’a rien d’assez sûr à proposer. Cliquez sur « Faire observer NOEMA ».</p>';

  const withheld = d.observation?.withheld || [];
  $('#withheld').innerHTML = withheld.length
    ? withheld.map(renderWithheld).join('')
    : '<p class="t-body-sm u-muted">Rien de retenu : tout ce qui a été observé atteint le seuil.</p>';

  $('#journal').innerHTML = (d.journal || []).slice().reverse().map((j) => `<tr>
      <td class="u-mono">${esc(j.at)}</td>
      <td>${esc(j.op)}</td>
      <td class="u-mono">${esc(j.id)}</td>
      <td class="u-mono">${esc(j.actor)}</td>
      <td>${esc(j.cause)}</td>
    </tr>`).join('') || '<tr><td colspan="5">Journal vide.</td></tr>';

  $('#world').innerHTML = (d.entities || []).filter((e) => !e.id?.startsWith('prop-')).map(renderEntity).join('');

  $('#proofs').innerHTML = proofs.length
    ? `<div class="viz-proof">${proofs.map(renderProof).join('')}</div>`
    : '<p class="t-body-sm u-muted">Aucune décision prise pour l’instant.</p>';

  resolveIcons(document);
}

/* ── API ───────────────────────────────────────────────────────── */

/**
 * Un écran ne plante pas quand l'API ne répond pas : il le dit, avec
 * l'état d'erreur du système. « Aucun résultat » affiché après une erreur
 * réseau serait un mensonge.
 */
async function load() {
  try {
    const r = await fetch('/api/state');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    render(await r.json());
  } catch (e) {
    for (const sel of ['#proposals', '#withheld', '#world', '#proofs']) {
      const el = document.querySelector(sel);
      if (el) el.innerHTML = `<div class="a-state a-state--error">
        <span class="a-state__icon">${ic('com-alert', 'a-ic a-ic--lg')}</span>
        <p class="t-h3">Le monde n'a pas pu être chargé</p>
        <p class="t-body-sm u-muted">L'API n'a pas répondu (${esc(e.message)}). Rien n'a été perdu : les données existent toujours côté serveur.</p>
        <button type="button" class="a-btn" data-retry>Réessayer</button>
      </div>`;
    }
    const j = document.querySelector('#journal');
    if (j) j.innerHTML = '<tr><td colspan="5">Indisponible.</td></tr>';
    resolveIcons(document);
  }
}

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) {
    window.AIME?.toast?.({ title: 'Refusé', body: d.error, tone: 'error' });
    return;
  }
  render(d.state);
  return d;
}

$('#b-observe').addEventListener('click', async () => {
  const d = await post('/api/observe');
  if (d) window.AIME?.toast?.({ title: `${d.written.length} proposition(s) écrite(s)`, body: `${d.withheld.length} retenue(s) sous le seuil`, tone: 'accent' });
});

$('#b-reset').addEventListener('click', () => post('/api/reset'));
document.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(); });

/* Délégation : les boutons de décision sont recréés à chaque rendu. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-decide]');
  if (!btn) return;
  post('/api/decide', {
    proposal_id: btn.dataset.target,
    decision: btn.dataset.decide,
    /* L'acteur est obligatoire côté serveur. C'est le cœur du système :
       une décision anonyme est refusée, pas corrigée. */
    actor: 'a.meunier',
  });
});

load();
