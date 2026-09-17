/**
 * AIME DESIGN SYSTEM V1 — Direction artistique (chapitre 21).
 *
 * Choix dans le système, puis transmission. La page lit tokens.json — elle ne
 * recopie aucune valeur que le système ne publie. Les réglages s'appliquent
 * en variables CSS sur le conteneur d'aperçu (rien d'audité n'est écrit en
 * dur), et le brief exporté dit exactement ce qui a été choisi : thème,
 * step d'accent dans la rampe fuchsia, densité, mouvement, niveau d'arrondi.
 *
 * Thème, densité et mouvement sont posés sur <html> pour le temps de la
 * visite afin d'être visibles en vrai — contrairement au sélecteur du
 * châssis, rien n'est persisté.
 */
(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = document.querySelector('meta[name="a-root"]')?.content || './';

  function resolveIcons(rootEl = document) {
    for (const u of rootEl.querySelectorAll('use[data-a-icon]')) {
      u.setAttribute('href', `${root}assets/aime-icons.svg#i-${u.dataset.aIcon}`);
      delete u.dataset.aIcon;
    }
  }

  const toast = (title, tone = 'success') => window.AIME?.toast?.({ title, tone });

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast(label);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* refusé */ }
      ta.remove();
      toast(ok ? label : 'La copie a été refusée', ok ? 'success' : 'error');
    }
  }

  function saveBlob(name, text, type = 'text/css') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ── État de la direction ────────────────────────────────────── */
  const RADIUS = { none: 0, small: 4, medium: 8, large: 14 };
  const RADIUS_LABEL = { none: 'aucun (0)', small: 'discret (4)', medium: 'système (8)', large: 'généreux (14)' };
  const state = { theme: 'dark', accentStep: '500', density: 'normal', motion: 'full', radius: 'medium' };
  let ramp = null; /* rampe fuchsia {300:'#…',…} lue dans tokens.json */

  /* Dérivation le long de la rampe, comme le système le fait lui-même :
     hover un cran vers le clair, active un cran vers le foncé, texte le
     cran lisible sur fond. Les steps triés gardent la logique monotone. */
  function accentSet() {
    if (!ramp) return null;
    const steps = Object.keys(ramp).sort((a, b) => Number(a) - Number(b));
    const i = steps.indexOf(state.accentStep);
    const at = (j) => ramp[steps[Math.min(steps.length - 1, Math.max(0, j))]];
    return {
      step: state.accentStep,
      token: `--aime-p-fuchsia-${state.accentStep}`,
      accent: at(i),
      hover: at(i - 1),
      active: at(i + 1),
      text: ramp['300'] || at(0),
      subtle: `color-mix(in srgb, ${at(i)} 12%, transparent)`,
      on: '#08080A',
    };
  }

  /* Thème/densité/mouvement sur le document (visite uniquement), accent et
     rayon en surcharges de variables sur le conteneur d'aperçu. */
  function apply() {
    const html = document.documentElement;
    html.dataset.aimeTheme = state.theme;
    if (state.density === 'normal') delete html.dataset.aimeDensity;
    else html.dataset.aimeDensity = state.density;
    if (state.motion === 'reduced') html.dataset.aimeMotion = 'reduced';
    else delete html.dataset.aimeMotion;

    const pv = $('#dp-preview');
    if (pv) {
      const a = accentSet();
      if (a) {
        pv.style.setProperty('--aime-color-accent', a.accent);
        pv.style.setProperty('--aime-color-accent-hover', a.hover);
        pv.style.setProperty('--aime-color-accent-active', a.active);
        pv.style.setProperty('--aime-color-accent-text', a.text);
        pv.style.setProperty('--aime-color-accent-on', a.on);
      }
      pv.style.setProperty('--aime-radius-medium', `${RADIUS[state.radius]}px`);
    }
    renderCss();
  }

  function cssText() {
    const a = accentSet();
    const lines = [
      `/* tokens.custom.css — généré le ${new Date().toISOString().slice(0, 10)} par design-system/direction.html`,
      `   À poser APRÈS tokens.css. Ces surcharges sont des jetons ; aucun`,
      `   composant ne doit recopier une valeur. */`,
      `:root {`,
    ];
    if (a) {
      lines.push(
        `  --aime-color-accent: ${a.accent}; /* ${a.token} */`,
        `  --aime-color-accent-hover: ${a.hover};`,
        `  --aime-color-accent-active: ${a.active};`,
        `  --aime-color-accent-text: ${a.text};`,
        `  --aime-color-accent-on: ${a.on};`,
      );
      if (state.theme === 'light') {
        lines.push(`  /* thème clair : l'accent texte repasse un cran vers le foncé pour tenir le contraste */`);
        lines.push(`  --aime-color-accent-text: ${state.accentStep === '300' ? a.active : a.accent};`);
      }
    }
    lines.push(`  --aime-radius-medium: ${RADIUS[state.radius]}px; /* niveau ${state.radius} */`, `}`);
    return lines.join('\n');
  }

  function briefText() {
    const a = accentSet();
    const choices = {
      theme: state.theme,
      accent: a ? { step: Number(state.accentStep), token: a.token, accent: a.accent, hover: a.hover, active: a.active, text: a.text, on: a.on } : 'tokens indisponibles',
      densite: state.density,
      mouvement: state.motion === 'reduced' ? 'reduced (prefers-reduced-motion respecté partout)' : 'complet',
      arrondi_medium: `${RADIUS[state.radius]}px (${RADIUS_LABEL[state.radius]})`,
    };
    return [
      `# Direction artistique — brief agent (AIME DESIGN SYSTEM V1)`,
      ``,
      `Généré le ${new Date().toISOString()} depuis design-system/direction.html`,
      ``,
      `## Choix`,
      `- thème : ${state.theme}`,
      `- accent : fuchsia step ${state.accentStep}${a ? ` (${a.accent})` : ''}`,
      `- densité : ${state.density}`,
      `- mouvement : ${choices.mouvement}`,
      `- arrondi medium : ${choices.arrondi_medium}`,
      ``,
      `## Application`,
      `1. Poser le fichier tokens.custom.css ci-dessous après tokens.css du projet cible.`,
      `2. Thème, densité et mouvement se portent par attribut : data-aime-theme="${state.theme}"${state.density !== 'normal' ? `, data-aime-density="${state.density}"` : ''}${state.motion === 'reduced' ? ', data-aime-motion="reduced"' : ''} sur <html>.`,
      `3. Ne décliner l'accent que dans la même rampe fuchsia — le build refuse toute couleur qui manque sa cible de contraste.`,
      `4. Aucune couleur littérale hors des jetons, aucun espacement hors échelle, aucun emoji.`,
      `5. Jouer le Design QA puis le diagnostic sur le projet : il doit mesurer mieux, jamais moins bien.`,
      ``,
      '```json',
      JSON.stringify(choices, null, 2),
      '```',
      ``,
      '```css',
      cssText(),
      '```',
    ].join('\n');
  }

  function renderCss() {
    const el = $('#dp-css');
    if (el) el.textContent = cssText();
  }

  /* ── Paramètres : délégation sur les groupes de pills ────────── */
  const GROUPS = { 'dp-theme': 'theme', 'dp-density': 'density', 'dp-motion': 'motion', 'dp-radius': 'radius', 'dp-accent': 'accentStep' };
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.a-pill--button[data-val]');
    if (!pill) return;
    const groupEl = pill.closest('[id^="dp-"]');
    if (!groupEl || !GROUPS[groupEl.id]) return;
    state[GROUPS[groupEl.id]] = pill.dataset.val;
    groupEl.querySelectorAll('.a-pill--button').forEach((p) => {
      if (p === pill) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
    apply();
  });

  $('#dp-copy')?.addEventListener('click', () => copyText(briefText(), 'Brief agent copié — choix + consignes + CSS'));
  $('#dp-dl')?.addEventListener('click', () => {
    saveBlob('tokens.custom.css', cssText());
    toast('tokens.custom.css téléchargé');
  });

  /* ── Accent : la rampe lue dans tokens.json, jamais recopiée ─── */
  function renderAccent() {
    const box = $('#dp-accent');
    if (!box) return;
    if (!ramp) {
      box.innerHTML = `<span class="t-body-sm u-muted">tokens.json indisponible — l'accent reste celui du système ; les autres réglages fonctionnent.</span>`;
      return;
    }
    const steps = Object.keys(ramp).sort((a, b) => Number(a) - Number(b));
    box.innerHTML = steps
      .map(
        (s) => `<button type="button" class="ds-swatch" data-val="${s}"${s === state.accentStep ? ' aria-current="true"' : ''} aria-label="Accent fuchsia ${s}">
          <span class="ds-swatch__chip" style="background:var(--aime-p-fuchsia-${s})"></span>
          <span class="ds-swatch__name">${s}</span>
        </button>`,
      )
      .join('');
  }
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('#dp-accent .ds-swatch');
    if (!sw) return;
    state.accentStep = sw.dataset.val;
    $('#dp-accent')?.querySelectorAll('.ds-swatch').forEach((p) => {
      if (p === sw) p.setAttribute('aria-current', 'true');
      else p.removeAttribute('aria-current');
    });
    apply();
  });

  if (typeof fetch === 'function') {
    fetch(`${root}tokens/tokens.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((t) => {
        ramp = t.primitives?.fuchsia || null;
        renderAccent();
        apply();
      })
      .catch(() => {
        renderAccent();
        apply();
      });
  } else {
    /* jsdom (vérification DOM) : les réglages par défaut suffisent. */
    renderAccent();
    apply();
  }
})();
