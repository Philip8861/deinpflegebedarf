(() => {
  if (!document.body.classList.contains('template-index')) return;

  const main = document.querySelector('#MainContent');
  if (!main) return;

  const designMode = document.documentElement.classList.contains('shopify-design-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @param {Element} el */
  function reveal(el) {
    el.classList.add('pflege-home-in-view');
  }

  const targets = [
    ...main.querySelectorAll(':scope > .shopify-section'),
    ...main.querySelectorAll(':scope > section.pflege-hero--trust-only'),
  ];

  if (designMode || reduceMotion) {
    targets.forEach(reveal);
    return;
  }

  const heroSection = main.querySelector(':scope > .shopify-section.pflege-hero-section');
  if (heroSection) reveal(heroSection);

  if (typeof IntersectionObserver === 'undefined') {
    targets.forEach(reveal);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.02,
    }
  );

  targets.forEach((el) => {
    if (!el.classList.contains('pflege-home-in-view')) io.observe(el);
  });

  document.addEventListener(
    'shopify:section:load',
    (ev) => {
      const root = ev.target;
      if (!(root instanceof HTMLElement)) return;
      if (root.id && root.id.startsWith('shopify-section-') && root.classList.contains('shopify-section')) {
        if (!root.classList.contains('pflege-home-in-view')) io.observe(root);
      }
    },
    { passive: true }
  );
})();
