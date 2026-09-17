/**
 * AIME DESIGN SYSTEM V1 — comportements des composants.
 * Amélioration progressive : sans JavaScript, le contenu reste lisible.
 * Chaque comportement applique le contrat d'accessibilité du composant
 * (focus piégé et rendu, fermeture par Échap, tabindex cheminant).
 */
(function () {
  const FOCUSABLE = 'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
  const openLayers = [];

  function trap(e, layer) {
    if (e.key !== 'Tab') return;
    const items = [...layer.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLayer(el, opener) {
    el.hidden = false;
    el.dataset.aOpen = 'true';
    openLayers.push({ el, opener });
    const target = el.querySelector('[data-a-autofocus]') || el.querySelector(FOCUSABLE);
    target?.focus();
  }

  function closeLayer(entry) {
    const i = openLayers.indexOf(entry);
    if (i === -1) return;
    openLayers.splice(i, 1);
    entry.el.hidden = true;
    delete entry.el.dataset.aOpen;
    entry.opener?.focus();
  }

  function closeTop() {
    if (openLayers.length) closeLayer(openLayers[openLayers.length - 1]);
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-a-open]');
    if (opener) {
      e.preventDefault();
      const target = document.querySelector(opener.dataset.aOpen);
      if (!target) return;
      if (target.hidden === false) {
        closeLayer(openLayers.find((l) => l.el === target));
      } else {
        if (target.dataset.aScrim !== 'false') {
          const scrim = document.createElement('div');
          scrim.className = 'a-scrim';
          scrim.dataset.aScrimEl = 'true';
          scrim.addEventListener('click', closeTop);
          document.body.appendChild(scrim);
          target.addEventListener(
            'transitionend',
            () => {},
            { once: true },
          );
          target._scrim = scrim;
        }
        openLayer(target, opener);
      }
      return;
    }

    if (e.target.closest('[data-a-close]')) {
      e.preventDefault();
      const layer = e.target.closest('[data-a-layer]') || openLayers[openLayers.length - 1]?.el;
      const entry = openLayers.find((l) => l.el === layer);
      if (entry) {
        entry.el._scrim?.remove();
        closeLayer(entry);
      }
      return;
    }

    /* Popover / menu : un seul ouvert à la fois, fermeture au clic extérieur */
    const popOpener = e.target.closest('[data-a-pop]');
    document.querySelectorAll('[data-a-pop-target]').forEach((p) => {
      if (popOpener && p.id === popOpener.dataset.aPop.slice(1)) return;
      if (!p.contains(e.target) && !e.target.closest('[data-a-pop]')) {
        p.hidden = true;
        document.querySelector(`[data-a-pop="#${p.id}"]`)?.setAttribute('aria-expanded', 'false');
      }
    });
    if (popOpener) {
      e.preventDefault();
      const pop = document.querySelector(popOpener.dataset.aPop);
      if (!pop) return;
      const willOpen = pop.hidden;
      pop.hidden = !willOpen;
      pop.dataset.aPopTarget = 'true';
      popOpener.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) {
        const r = popOpener.getBoundingClientRect();
        pop.classList.add('a-pop--anchored');
        pop.style.insetBlockStart = `${Math.round(r.bottom + 6)}px`;
        pop.style.insetInlineStart = `${Math.round(Math.min(r.left, window.innerWidth - pop.offsetWidth - 8))}px`;
        pop.querySelector(FOCUSABLE)?.focus();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const entry = openLayers[openLayers.length - 1];
      if (entry) {
        entry.el._scrim?.remove();
        closeLayer(entry);
        return;
      }
      const openPop = [...document.querySelectorAll('[data-a-pop-target]')].find((p) => !p.hidden);
      if (openPop) {
        openPop.hidden = true;
        const o = document.querySelector(`[data-a-pop="#${openPop.id}"]`);
        o?.setAttribute('aria-expanded', 'false');
        o?.focus();
      }
    }
    if (e.key === 'Tab' && openLayers.length) trap(e, openLayers[openLayers.length - 1].el);
  });

  /* Nettoyage du scrim quand une couche se ferme */
  const observer = new MutationObserver((entries) => {
    for (const m of entries) {
      if (m.target.hidden) m.target._scrim?.remove();
    }
  });
  document.querySelectorAll('[data-a-layer]').forEach((el) => observer.observe(el, { attributes: true, attributeFilter: ['hidden'] }));

  /* ── TABS : tabindex cheminant + flèches ──────────────────── */
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const map = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1, Home: -i, End: tabs.length - 1 - i };
        if (!(e.key in map)) return;
        e.preventDefault();
        const next = tabs[(i + map[e.key] + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  });

  /* ── TOASTS ───────────────────────────────────────────────── */
  const region = () => {
    let r = document.querySelector('.a-toast-region');
    if (!r) {
      r = document.createElement('div');
      r.className = 'a-toast-region';
      r.setAttribute('role', 'status');
      r.setAttribute('aria-live', 'polite');
      document.body.appendChild(r);
    }
    return r;
  };
  window.AIME = window.AIME || {};
  window.AIME.toast = function ({ title, text, tone = '', timeout = 5000 } = {}) {
    const el = document.createElement('div');
    el.className = `a-toast${tone ? ` a-toast--${tone}` : ''}`;
    el.innerHTML = `<div class="a-toast__body"><p class="a-toast__title"></p>${text ? '<p class="a-toast__text"></p>' : ''}</div>
      <button type="button" class="a-icon-btn" data-a-dismiss aria-label="Fermer la notification"></button>`;
    el.querySelector('.a-toast__title').textContent = title || '';
    if (text) el.querySelector('.a-toast__text').textContent = text;
    region().appendChild(el);
    const kill = () => el.remove();
    el.querySelector('[data-a-dismiss]').addEventListener('click', kill);
    setTimeout(kill, timeout);
    return el;
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a-toast]');
    if (!t) return;
    window.AIME.toast({ title: t.dataset.aToast, text: t.dataset.aToastText || '', tone: t.dataset.aTone || '' });
  });

  /* ── BEFORE / AFTER ───────────────────────────────────────── */
  document.querySelectorAll('.ba').forEach((ba) => {
    const after = ba.querySelector('.ba__layer--after');
    const handle = ba.querySelector('.ba__handle');
    if (!after || !handle) return;
    handle.setAttribute('role', 'slider');
    handle.setAttribute('tabindex', '0');
    handle.setAttribute('aria-label', 'Position de la comparaison avant / après');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');
    handle.setAttribute('aria-valuenow', '50');
    const set = (pct) => {
      const v = Math.max(0, Math.min(100, pct));
      after.style.clipPath = `inset(0 0 0 ${v}%)`;
      handle.style.insetInlineStart = `${v}%`;
      handle.setAttribute('aria-valuenow', String(Math.round(v)));
    };
    const fromEvent = (e) => {
      const r = ba.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      set((x / r.width) * 100);
    };
    handle.addEventListener('keydown', (e) => {
      const cur = Number(handle.getAttribute('aria-valuenow'));
      if (e.key === 'ArrowLeft') set(cur - 5);
      else if (e.key === 'ArrowRight') set(cur + 5);
      else return;
      e.preventDefault();
    });
    let dragging = false;
    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => dragging && fromEvent(e));
    handle.addEventListener('pointerup', () => (dragging = false));
  });

  /* ── BARRE DE COMMANDE (démonstration filtrante) ──────────── */
  document.querySelectorAll('[data-a-cmdbar]').forEach((bar) => {
    const input = bar.querySelector('.cmdbar__input');
    const items = [...bar.querySelectorAll('.cmdbar__item')];
    const groups = [...bar.querySelectorAll('.cmdbar__group')];
    if (!input) return;
    let index = 0;
    const paint = () => {
      const visible = items.filter((i) => i.hidden === false);
      items.forEach((i) => i.setAttribute('aria-selected', 'false'));
      if (visible[index]) visible[index].setAttribute('aria-selected', 'true');
    };
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      index = 0;
      items.forEach((i) => {
        i.hidden = q.length > 0 && !i.textContent.toLowerCase().includes(q);
      });
      groups.forEach((g) => {
        let el = g.nextElementSibling;
        let any = false;
        while (el && !el.classList.contains('cmdbar__group')) {
          if (el.classList.contains('cmdbar__item') && !el.hidden) any = true;
          el = el.nextElementSibling;
        }
        g.hidden = !any;
      });
      paint();
    });
    input.addEventListener('keydown', (e) => {
      const visible = items.filter((i) => i.hidden === false);
      if (e.key === 'ArrowDown') index = Math.min(index + 1, visible.length - 1);
      else if (e.key === 'ArrowUp') index = Math.max(index - 1, 0);
      else if (e.key === 'Enter') {
        e.preventDefault();
        window.AIME.toast({ title: visible[index]?.textContent.trim() || 'Aucun résultat', tone: 'accent' });
        return;
      } else return;
      e.preventDefault();
      paint();
      visible[index]?.scrollIntoView({ block: 'nearest' });
    });
  });

  /* ── Rejouer un mouvement à la demande ─────────────────────
     [data-a-replay="#id"] relance l'animation de la cible en retirant puis
     reposant sa classe. Aucune démonstration ne boucle en continu : le
     mouvement reste sous le contrôle de la personne qui regarde. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-a-replay]');
    if (!btn) return;
    const target = document.querySelector(btn.dataset.aReplay);
    if (!target) return;
    const cls = target.className;
    target.className = '';
    void target.offsetWidth; // reflow : l'animation repart de zéro
    target.className = cls;
  });

  /* ── Sélecteurs de démonstration (mode Timeline, format Grille…) */
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-a-set]');
    if (!el) return;
    const target = document.querySelector(el.dataset.aSet);
    if (!target) return;
    target.dataset[el.dataset.aAttr] = el.value;
    document.querySelectorAll(`[data-a-set="${el.dataset.aSet}"]`).forEach((s) => {
      [...s.options].forEach((o) => (o.selected = o.value === el.value));
    });
  });
})();
