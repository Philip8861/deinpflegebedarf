(() => {
  if (!document.body.classList.contains('pflege-pfc-collection')) return;

  const roots = [
    document.querySelector('#MainContent'),
    document.querySelector('.pflege-site-footer-stack'),
  ].filter(Boolean);

  if (!roots.length) return;

  const designMode = document.documentElement.classList.contains('shopify-design-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Reihenfolge = Lesefluss von oben nach unten */
  const ORDERED_SELECTORS = [
    '.pflege-hero--free-care .pflege-hero__badge',
    '.pflege-hero--free-care .pflege-hero__title',
    '.pflege-hero--free-care .pflege-hero__sub',
    '.pflege-hero--free-care .pflege-hero__actions .pflege-hero__cta',
    '.pflege-hero--free-care .pflege-hero__asset-photo',
    '.pfc-free-care__box-products .pflege-bestseller__title',
    '.pfc-free-care__box-products .pflege-bestseller__intro',
    '.pfc-free-care__box-products .pflege-bestseller-card',
    '.pflege-advantages-us__title',
    '.pflege-advantages-us__subtitle',
    '.pflege-advantages-us__item',
    '.pflege-bestseller--closing-cta .pflege-bestseller__title',
    '.pflege-bestseller--closing-cta .pflege-bestseller__intro',
    '.pflege-bestseller--closing-cta .pflege-bestseller__closing-cta-primary',
    '.pflege-bestseller--closing-cta .pflege-bestseller__closing-cta-secondary',
    '.pflege-bestseller--closing-cta--after-testimonials .pflege-bestseller__title',
    '.pflege-bestseller--closing-cta--after-testimonials .pflege-bestseller__intro',
    '.pflege-bestseller--closing-cta--after-testimonials .pflege-bestseller__closing-cta-primary',
    '.pflege-bestseller--closing-cta--after-testimonials .pflege-bestseller__closing-cta-secondary',
    '.product-grid-container .title',
    '.product-grid-container .facets__heading',
    '.product-grid-container .product-grid .card__heading',
    '.product-grid-container .product-grid .price',
    '.pflege-faq-accordion__title',
    '.pflege-faq-accordion__intro',
    '.pflege-faq-accordion__item',
    '.ct-hp__stars',
    '.ct-hp__eyebrow',
    '.ct-hp h2.ct-hp__title',
    '.ct-hp__panel.is-active .ct-hp__quote',
    '.ct-hp__panel.is-active .ct-hp__name',
    '.ct-hp__panel.is-active .ct-hp__verified',
    '.ct-hp__panel.is-active .ct-hp__source',
    '.ct-hp__dots',
    '.ct-hp__cta-wrap > .ct-hp__cta',
  ];

  const STEP_SEC = 0.065;
  const seen = new Set();

  /** @param {Element} el */
  function mark(el, index) {
    if (seen.has(el)) return;
    seen.add(el);
    el.classList.add('pflege-pfc-entrance-el');
    el.style.setProperty('--pfc-entrance-delay', index * STEP_SEC + 's');
  }

  function collectTargets() {
    let index = 0;
    ORDERED_SELECTORS.forEach((selector) => {
      roots.forEach((root) => {
        root.querySelectorAll(selector).forEach((el) => {
          mark(el, index);
          index += 1;
        });
      });
    });
  }

  function reveal() {
    document.documentElement.classList.add('pflege-pfc-entrance-ready');
  }

  collectTargets();

  if (designMode || reduceMotion) {
    reveal();
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(reveal);
    });
  }

  document.addEventListener(
    'shopify:section:load',
    (ev) => {
      const root = ev.target;
      if (!(root instanceof HTMLElement)) return;
      if (!root.closest('body.pflege-pfc-collection')) return;
      const prevCount = seen.size;
      collectTargets();
      if (seen.size > prevCount) {
        root.querySelectorAll('.pflege-pfc-entrance-el').forEach((el) => {
          el.style.animation = 'none';
          void el.offsetHeight;
          el.style.animation = '';
        });
      }
    },
    { passive: true }
  );
})();
