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
  /* Types issus d'une intention humaine — même traitement : ce sont des
     propositions, jamais des faits. */
  person: { label: 'À mémoriser', icon: 'ppl-person' },
  relation: { label: 'À relier', icon: 'rel-relation' },
  date: { label: 'Date', icon: 'time-calendar' },
  unknown: { label: 'Inconnu déclaré', icon: 'mem-card' },
  action_request: { label: 'Action demandée', icon: 'apr-approved' },
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
  action: 'apr-approved',
};
const TYPE_LABEL = {
  person: 'Personne', organization: 'Organisation', project: 'Projet',
  object: 'Objet', relation: 'Relation', event: 'Événement', asset: 'Média',
  document: 'Document', version: 'Version', proposal: 'Proposition',
  decision: 'Décision', proof: 'Preuve', action: 'Action',
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
    ${p.materialization_note ? `<p class="t-caption ${p.materialized_id ? 'u-muted' : 'u-strong'}">${ic(p.materialized_id ? 'apr-approved' : 'com-alert')} ${esc(p.materialization_note)}${p.materialized_id ? ` <span class="u-mono">${esc(p.materialized_id)}</span>` : ''}</p>` : ''}
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
    decision: 'dec', proof: 'prf', action: 'act',
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

/* Le risque et le périmètre viennent du registre côté serveur : l'écran
   les affiche, il ne les calcule pas. */
const RISK = { low: 'faible', medium: 'moyen', high: 'élevé' };
const ACTION_STATE = {
  pending_authorization: { label: 'en attente d\u2019autorisation', tone: 'warning' },
  authorized: { label: 'autorisée', tone: 'accent' },
  refused: { label: 'refusée', tone: 'error' },
  executed: { label: 'exécutée', tone: 'success' },
};

function renderAction(a) {
  const s = ACTION_STATE[a.status] || { label: a.status, tone: 'warning' };
  const pending = a.status === 'pending_authorization';
  const authed = a.status === 'authorized';
  return `<article class="noema-card noema-rail" data-certainty="${a.status === 'executed' ? 'confirmed' : 'proposed'}" data-id="${esc(a.id)}">
    <div class="noema-card__head">
      <span class="noema-card__kind">${ic('apr-approved')}Action</span>
      <span class="a-badge a-badge--${s.tone}">${esc(s.label)}</span>
      <span class="l-spacer"></span>
      <span class="t-caption u-mono">${esc(a.scope)} · risque ${esc(RISK[a.risk] || a.risk)} · ${a.reversible ? 'réversible' : 'irréversible'}</span>
    </div>
    <p class="noema-card__title">${esc(a.label)} — ${esc(a.object)}</p>
    <ul class="noema-card__list">
      <li><strong>permission</strong> — <span class="u-mono">${esc(a.permission_required)}</span></li>
      ${a.authorized_by ? `<li><strong>autorisée par</strong> — <span class="u-mono">${esc(a.authorized_by)}</span></li>` : ''}
      ${a.executed_at ? `<li><strong>exécutée</strong> — <span class="u-mono">${esc(a.executed_at)}</span></li>` : ''}
    </ul>
    <div class="noema-card__foot">
      ${pending ? `
        <button type="button" class="a-btn a-btn--sm a-btn--primary" data-authorize="1" data-target="${esc(a.id)}">Autoriser</button>
        <button type="button" class="a-btn a-btn--sm a-btn--ghost" data-authorize="0" data-target="${esc(a.id)}">Refuser</button>
      ` : authed ? `
        <button type="button" class="a-btn a-btn--sm a-btn--primary" data-execute="${esc(a.id)}">Exécuter</button>
      ` : `<span class="t-caption u-muted">aucune action possible</span>`}
      <span class="l-spacer"></span>
      <span class="t-caption u-mono">${esc(a.id)}</span>
    </div>
  </article>`;
}

function render(d) {
  const proposals = (d.entities || []).filter((e) => e.id?.startsWith('prop-'));
  const open = proposals.filter((p) => p.status === 'open');
  const closed = proposals.filter((p) => p.status !== 'open');
  const proofs = (d.entities || []).filter((e) => e.id?.startsWith('prf-'));

  $('#h-counts').innerHTML = `
    <span class="a-badge a-badge--accent">${open.length} en attente</span>
    <span class="a-badge">${d.entities.length} entités</span>
    <span class="a-badge">${proofs.length} preuve(s)</span>
    ${(d.entities || []).some((e) => e.id?.startsWith('act-')) ? `<span class="a-badge a-badge--warning">${(d.entities || []).filter((e) => e.id?.startsWith('act-') && e.status !== 'executed').length} action(s)</span>` : ''}`;
  $('#h-stamp').textContent = `observation du ${new Date(d.now).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}`;

  $('#proposals').innerHTML = proposals.length
    ? [...open, ...closed].map(renderProposal).join('')
    : '<p class="t-body-sm u-muted">NOEMA n’a rien d’assez sûr à proposer. Cliquez sur « Faire observer NOEMA ».</p>';

  const actions = (d.entities || []).filter((e) => e.id?.startsWith('act-'));
  $('#actions').innerHTML = actions.length
    ? actions.map(renderAction).join('')
    : '<p class="t-body-sm u-muted">Aucune action préparée. NOEMA ne crée jamais une action de son propre chef : elle naît d\u2019une intention validée.</p>';

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
    for (const sel of ['#proposals', '#withheld', '#world', '#proofs', '#actions']) {
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

/* ── Intention ─────────────────────────────────────────────────
   « Lire sans écrire » montre ce que NOEMA a compris AVANT toute
   écriture. C'est le principe GARDIENNE appliqué à l'écran : on ne
   découvre ce que la machine a retenu qu'après coup, sinon.
   ──────────────────────────────────────────────────────────── */
const intentionText = () => document.querySelector('#i-text').value;

function renderIntention(d, wrote) {
  const out = document.querySelector('#intention-out');
  if (!d) return;
  const cand = (d.candidates || []);
  const unparsed = (d.unparsed || []);
  out.innerHTML = `
    ${cand.length ? `<div class="l-stack">${cand.map((c) => `<div class="l-row l-row--between u-pad u-surface">
      <span class="l-row">${ic(KIND[c.kind]?.icon || 'noe-inferred')}
        <span><span class="t-body-sm u-strong">${esc(c.title)}</span><br><span class="t-caption u-muted">${esc(KIND[c.kind]?.label || c.kind)}</span></span>
      </span>
      <span class="l-row">${conf(c.confidence)}<span class="t-caption u-muted">${esc(STATE.inferred.label)}</span></span>
    </div>`).join('')}</div>` : '<p class="t-body-sm u-muted">Aucun candidat reconnu dans cette phrase.</p>'}
    ${unparsed.length ? `<p class="t-caption u-strong">${ic('com-alert')} Non compris : ${esc(unparsed.join(' · '))}</p>`
      : (cand.length ? '<p class="t-caption u-muted">Toute la phrase a été reconnue.</p>' : '')}
    ${wrote ? `<p class="t-caption u-muted">${wrote.length} proposition(s) créée(s) — aucune n\u2019est un fait tant que vous ne l\u2019avez pas validée.</p>` : ''}`;
  resolveIcons(out);
}

document.querySelector('#i-read').addEventListener('click', async () => {
  const text = intentionText();
  if (!text.trim()) { window.AIME?.toast?.({ title: 'Rien à lire', body: 'Écrivez d\u2019abord une intention.', tone: 'warning' }); return; }
  const r = await fetch('/api/intend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, dry_run: true }) });
  const d = await r.json();
  if (!r.ok) { window.AIME?.toast?.({ title: 'Refusé', body: d.error, tone: 'error' }); return; }
  renderIntention(d, null);
});

document.querySelector('#i-submit').addEventListener('click', async () => {
  const text = intentionText();
  if (!text.trim()) { window.AIME?.toast?.({ title: 'Rien à proposer', body: 'Écrivez d\u2019abord une intention.', tone: 'warning' }); return; }
  const r = await fetch('/api/intend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, actor: 'a.meunier' }) });
  const d = await r.json();
  if (!r.ok) { window.AIME?.toast?.({ title: 'Refusé', body: d.error, tone: 'error' }); return; }
  renderIntention(d, d.written);
  render(d.state);
  window.AIME?.toast?.({ title: `${d.written.length} proposition(s)`, body: 'En attente de votre validation.', tone: 'accent' });
});
document.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) /* Autoriser et exécuter sont deux actes distincts, tous deux attribués.
   Le serveur refuse les deux sans acteur. */
document.addEventListener('click', (e) => {
  const auth = e.target.closest('[data-authorize]');
  if (auth) {
    post('/api/authorize', {
      action_id: auth.dataset.target,
      grant: auth.dataset.authorize === '1',
      actor: 'a.meunier',
      reason: auth.dataset.authorize === '1' ? 'autorisée depuis l\u2019écran de la boucle' : 'refusée depuis l\u2019écran de la boucle',
    });
    return;
  }
  const exec = e.target.closest('[data-execute]');
  if (exec) {
    post('/api/execute', { action_id: exec.dataset.execute, actor: 'a.meunier' }).then((d) => {
      if (d?.result) window.AIME?.toast?.({ title: 'Exécutée', body: d.result.detail, tone: 'success' });
    });
  }
});

load(); });

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
