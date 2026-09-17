/**
 * AIME DESIGN SYSTEM V1 — rendu token-driven de la documentation.
 * La documentation lit tokens.json au lieu de recopier des valeurs :
 * elle ne peut donc pas diverger du système qu'elle décrit.
 */
const root = document.querySelector('meta[name="a-root"]')?.content || './';
const T = await (await fetch(`${root}tokens/tokens.json`)).json();
const ICONS = await (await fetch(`${root}tokens/icons.json`)).json();

const el = (sel) => document.querySelector(`[data-a-render="${sel}"]`);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hex = (v) => (/^#/.test(v) ? v.toUpperCase() : v);

/* ── Palette primitive ──────────────────────────────────────── */
if (el('palette')) {
  el('palette').innerHTML = Object.entries(T.primitives)
    .map(
      ([fam, ramp]) => `<section class="l-stack l-stack--tight">
        <h3 class="t-label">${esc(fam)}</h3>
        <div class="ds-swatches">${Object.entries(ramp)
          .map(
            ([k, v]) =>
              `<button type="button" class="ds-swatch" data-a-copy="${v}" aria-label="Copier ${v}">
                <span class="ds-swatch__chip" style="background:var(--aime-p-${esc(fam)}-${esc(k)})"></span>
                <span class="ds-swatch__name">--aime-p-${esc(fam)}-${esc(k)}</span>
                <span class="ds-swatch__val">${hex(v)}</span>
              </button>`,
          )
          .join('')}</div>
      </section>`,
    )
    .join('');
}

/* ── Rôles sémantiques, par thème ───────────────────────────── */
if (el('roles')) {
  const groups = {
    Fond: ['background', 'surface', 'surface-elevated', 'surface-overlay', 'surface-sunken'],
    Texte: ['text', 'text-muted', 'text-subtle', 'text-inverse'],
    Bordure: ['border-subtle', 'border', 'border-strong'],
    Signal: ['accent', 'accent-hover', 'accent-active', 'accent-text', 'accent-on', 'accent-subtle', 'focus-ring'],
    États: ['success-text', 'warning-text', 'error-text', 'info-text', 'success-border', 'warning-border', 'error-border', 'info-border'],
  };
  el('roles').innerHTML = ['dark', 'light']
    .map(
      (theme) => `<section class="l-stack l-stack--tight">
        <h3 class="t-label">Thème ${theme === 'dark' ? 'sombre' : 'clair'}</h3>
        ${Object.entries(groups)
          .map(
            ([label, keys]) => `<div class="ds-table-wrap"><table class="ds-table">
              <caption>${esc(label)}</caption>
              <tbody>${keys
                .map((k) => {
                  const v = T.themes[theme][k];
                  if (!v) return '';
                  return `<tr><td>--aime-color-${esc(k)}</td>
                    <td><span class="l-row"><span class="ds-chip" style="background:var(--aime-color-${esc(k)})"></span><span class="u-mono">${hex(v)}</span></span></td></tr>`;
                })
                .join('')}</tbody>
            </table></div>`,
          )
          .join('')}
      </section>`,
    )
    .join('');
}

/* ── Échelle typographique ──────────────────────────────────── */
if (el('type-scale')) {
  const cls = { META: 't-meta', CAPTION: 't-caption', LABEL: 't-label', 'BODY-SMALL': 't-body-sm', BODY: 't-body', H3: 't-h3', H2: 't-h2', H1: 't-h1', DISPLAY: 't-display' };
  el('type-scale').innerHTML = T.typography.roles
    .map(
      (r) => `<div class="ds-row">
        <span class="ds-row__key">${esc(r.role)}</span>
        <span class="${cls[r.role]}">AIME compose le monde</span>
        <span class="ds-row__spec">${r.size}px · ${r.lh} · ${r.ls}em · ${r.weight} · ${r.measure}ch</span>
      </div>`,
    )
    .join('');
}

/* ── Échelle d'espace ───────────────────────────────────────── */
if (el('space-scale')) {
  el('space-scale').innerHTML = T.space.scale
    .map(
      (v, i) => `<div class="ds-row">
        <span class="ds-row__key">space-${i + 1}</span>
        <span class="ds-bar" style="width:var(--aime-space-${i + 1})"></span>
        <span class="ds-row__spec">${v}px</span>
      </div>`,
    )
    .join('');
}
if (el('radius-scale')) {
  el('radius-scale').innerHTML = Object.entries(T.radius)
    .map(
      ([k, v]) => `<div class="ds-row">
        <span class="ds-row__key">radius-${esc(k)}</span>
        <span class="ds-box" style="border-radius:var(--aime-radius-${esc(k)})"></span>
        <span class="ds-row__spec">${v === 999 ? '999px (pilule)' : v + 'px'}</span>
      </div>`,
    )
    .join('');
}
if (el('motion-scale')) {
  el('motion-scale').innerHTML =
    Object.entries(T.motion.duration)
      .map(([k, v]) => `<div class="ds-row"><span class="ds-row__key">motion-${esc(k)}</span><span class="t-caption u-muted">durée unique du système</span><span class="ds-row__spec">${v}ms</span></div>`)
      .join('') +
    Object.entries(T.motion.ease)
      .map(([k, v]) => `<div class="ds-row"><span class="ds-row__key">ease-${esc(k)}</span><span class="u-mono t-caption">${esc(v)}</span><span class="ds-row__spec">courbe</span></div>`)
      .join('');
}

/* ── Iconographie ───────────────────────────────────────────── */
if (el('icons')) {
  el('icons').innerHTML = ICONS.categories
    .map(
      (cat) => `<section class="l-stack l-stack--tight">
        <h3 class="t-label">${esc(cat)} <span class="u-mono">${ICONS.icons.filter((i) => i.category === cat).length}</span></h3>
        <div class="ds-icons">${ICONS.icons.filter((i) => i.category === cat)
          .map(
            (i) => `<figure class="ds-icon">
              <svg class="a-ic a-ic--lg" role="img" aria-label="${esc(i.label)}" width="24" height="24"><use href="${root}assets/aime-icons.svg#${esc(i.id)}"/></svg>
              <figcaption class="ds-icon__id">${esc(i.id)}</figcaption>
            </figure>`,
          )
          .join('')}</div>
      </section>`,
    )
    .join('');
}

/* ── Inventaire des composants documentés ───────────────────── */
if (el('inventory')) {
  el('inventory').textContent = `${ICONS.count} icônes · ${T.typography.roles.length} rôles typographiques · ${T.space.scale.length} étapes d'espacement · ${Object.keys(T.radius).length} rayons`;
}
