(() => {
  const sel = '[data-pflege-reviews-rail]';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setPanelLabels(root, open) {
    const labelOpen = root.querySelector('[data-reviews-toggle-label-open]');
    const labelClose = root.querySelector('[data-reviews-toggle-label-close]');
    if (labelOpen && labelClose) {
      labelOpen.hidden = open;
      labelClose.hidden = !open;
    }
  }

  function setFormPanelOpen(root, panel, primaryToggle, open) {
    panel.classList.toggle('pflege-reviews-rail__form-collapsible--open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    primaryToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    primaryToggle?.setAttribute('data-reviews-expanded', open ? 'true' : 'false');
    setPanelLabels(root, open);
  }

  function bindFormCollapse(root, panel, primaryToggle) {
    const closeBtn = root.querySelector('.pflege-reviews-rail__form-close');

    if (!panel || !primaryToggle) return;

    primaryToggle.addEventListener('click', () => {
      const isOpen = panel.classList.contains('pflege-reviews-rail__form-collapsible--open');
      const next = !isOpen;
      setFormPanelOpen(root, panel, primaryToggle, next);
      if (next && !prefersReducedMotion()) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    closeBtn?.addEventListener('click', () => {
      setFormPanelOpen(root, panel, primaryToggle, false);
      primaryToggle.focus({ preventScroll: true });
    });

    const errors = panel.querySelector('.pflege-reviews-rail__errors');
    if (errors) {
      setFormPanelOpen(root, panel, primaryToggle, true);
    }
  }

  function openReviewSuccessDialog(root, panel, primaryToggle) {
    const dlg = root.querySelector('[data-reviews-success-dialog]');
    if (!dlg || typeof dlg.showModal !== 'function') return;

    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });

    dlg.querySelectorAll('[data-reviews-success-close]').forEach((btn) => {
      btn.addEventListener('click', () => dlg.close());
    });

    dlg.addEventListener('close', () => {
      primaryToggle?.focus({ preventScroll: true });
    });

    try {
      if (panel && primaryToggle) {
        setFormPanelOpen(root, panel, primaryToggle, false);
      }
      dlg.showModal();
      requestAnimationFrame(() => {
        const cta = dlg.querySelector('.pflege-reviews-rail__success-dialog-cta');
        if (cta && typeof cta.focus === 'function') {
          cta.focus({ preventScroll: prefersReducedMotion() });
        }
      });
    } catch (_) {
      dlg.setAttribute('open', '');
    }
  }

  function bindSingleSlider(root) {
    const cards = Array.from(root.querySelectorAll('[data-reviews-card]'));
    const dots = Array.from(root.querySelectorAll('[data-reviews-dot]'));
    if (!cards.length || !dots.length) return;

    function setActive(idx) {
      const target = Math.max(0, Math.min(idx, cards.length - 1));
      cards.forEach((card, i) => {
        const isActive = i === target;
        card.classList.toggle('is-active', isActive);
        if (isActive) {
          card.removeAttribute('hidden');
          card.removeAttribute('aria-hidden');
        } else {
          card.setAttribute('hidden', '');
          card.setAttribute('aria-hidden', 'true');
        }
      });
      dots.forEach((dot, i) => {
        const isActive = i === target;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) {
          dot.removeAttribute('tabindex');
        } else {
          dot.setAttribute('tabindex', '-1');
        }
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => setActive(idx));
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (idx + 1) % dots.length;
          dots[next].focus();
          setActive(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (idx - 1 + dots.length) % dots.length;
          dots[prev].focus();
          setActive(prev);
        } else if (e.key === 'Home') {
          e.preventDefault();
          dots[0].focus();
          setActive(0);
        } else if (e.key === 'End') {
          e.preventDefault();
          dots[dots.length - 1].focus();
          setActive(dots.length - 1);
        }
      });
    });
  }

  function bindSeeAllToggle(root) {
    const btn = root.querySelector('[data-reviews-see-all]');
    const list = root.querySelector('[data-reviews-all-list]');
    if (!btn) return;

    const labelOpen = btn.querySelector('[data-reviews-see-all-open]');
    const labelClose = btn.querySelector('[data-reviews-see-all-close]');

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      const next = !isOpen;
      btn.setAttribute('aria-expanded', next ? 'true' : 'false');

      if (list) {
        if (next) {
          list.removeAttribute('hidden');
        } else {
          list.setAttribute('hidden', '');
        }
      }

      if (labelOpen && labelClose) {
        labelOpen.hidden = next;
        labelClose.hidden = !next;
      }

      if (next && list && !prefersReducedMotion()) {
        list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function initRoot(root) {
    if (root.hasAttribute('data-reviews-rail-ready')) return;
    root.setAttribute('data-reviews-rail-ready', '');

    const form = root.querySelector('.pflege-reviews-rail__form');
    const panel = root.querySelector('[data-reviews-form-panel]');
    const primaryToggle = root.querySelector('.pflege-reviews-rail__toggle-form');

    bindSingleSlider(root);
    bindSeeAllToggle(root);

    if (panel && primaryToggle) {
      bindFormCollapse(root, panel, primaryToggle);
    }
    openReviewSuccessDialog(root, panel, primaryToggle);

    if (form) {
      const bodyOut = form.querySelector('[data-reviews-body-out]');
      const rating = form.querySelector('[data-reviews-rating]');
      const comment = form.querySelector('[data-reviews-comment]');
      const hp = form.querySelector('[data-reviews-hp]');

      form.addEventListener('submit', (e) => {
        if (hp && hp.value && hp.value.trim() !== '') {
          e.preventDefault();
          return false;
        }
        if (bodyOut && rating && comment) {
          const r = String(rating.value || '').trim() || '?';
          const t = String(comment.value || '').trim();
          if (!t) {
            e.preventDefault();
            comment.focus();
            return false;
          }
          bodyOut.value = `Bewertung (Website): ${r}/5 Sterne\n\n${t}`;
        }
        return true;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(sel).forEach(initRoot);
  });

  document.addEventListener('shopify:section:load', (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLElement)) return;
    const root = el.querySelector(sel);
    if (root) initRoot(root);
  });

  document.addEventListener('shopify:section:unload', (ev) => {
    const sid = typeof ev.detail?.sectionId === 'string' ? ev.detail.sectionId : '';
    const sec = sid ? document.getElementById(`shopify-section-${sid}`) : null;
    sec?.querySelectorAll(sel).forEach((root) => root.removeAttribute('data-reviews-rail-ready'));
  });
})();
