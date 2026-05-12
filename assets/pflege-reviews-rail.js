(() => {
  const sel = '[data-pflege-reviews-rail]';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getScrollStep(track) {
    const card = track.querySelector('.pflege-reviews-rail__card');
    const gs = getComputedStyle(track);
    const gap = parseFloat(gs.columnGap || gs.gap) || 16;
    return card ? card.getBoundingClientRect().width + gap : 296;
  }

  function syncReviewsNav(track, nav) {
    if (!track || !nav) return;
    const overflow = track.scrollWidth > track.clientWidth + 2;
    nav.hidden = !overflow;
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

  function initRoot(root) {
    if (root.hasAttribute('data-reviews-rail-ready')) return;
    root.setAttribute('data-reviews-rail-ready', '');

    const track = root.querySelector('[data-reviews-track]');
    const nav = root.querySelector('[data-reviews-nav]');
    const prev = root.querySelector('[data-reviews-prev]');
    const next = root.querySelector('[data-reviews-next]');
    const form = root.querySelector('.pflege-reviews-rail__form');
    const panel = root.querySelector('[data-reviews-form-panel]');
    const primaryToggle = root.querySelector('.pflege-reviews-rail__toggle-form');

    function scrollStep(direction) {
      if (!track || !track.children.length) return;
      track.scrollBy({
        left: direction * getScrollStep(track),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }

    prev?.addEventListener('click', () => scrollStep(-1));
    next?.addEventListener('click', () => scrollStep(1));

    if (track && !track.getAttribute('tabindex')) {
      track.setAttribute('tabindex', '0');
    }

    if (track && nav) {
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => syncReviewsNav(track, nav)) : null;
      ro?.observe(track);
      track.addEventListener('scroll', () => syncReviewsNav(track, nav), { passive: true });
      window.addEventListener('resize', () => syncReviewsNav(track, nav), { passive: true });
      syncReviewsNav(track, nav);
    }

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
