(() => {
  const sel = '[data-pflege-reviews-rail]';

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initRoot(root) {
    const track = root.querySelector('[data-reviews-track]');
    const prev = root.querySelector('[data-reviews-prev]');
    const next = root.querySelector('[data-reviews-next]');
    const form = root.querySelector('.pflege-reviews-rail__form');

    function scrollStep(direction) {
      if (!track || !track.children.length) return;
      const card = track.querySelector('.pflege-reviews-rail__card');
      const amount = card ? card.getBoundingClientRect().width + 16 : 280;
      track.scrollBy({
        left: direction * amount,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }

    prev?.addEventListener('click', () => scrollStep(-1));
    next?.addEventListener('click', () => scrollStep(1));

    if (track && !track.getAttribute('tabindex')) {
      track.setAttribute('tabindex', '0');
    }

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
          bodyOut.value = `Kundenbewertung (Website): ${r}/5 Sterne\n\n${t}`;
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
})();
