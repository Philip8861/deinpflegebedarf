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

  function revealAll() {
    targets.forEach(reveal);
  }

  if (designMode || reduceMotion) {
    revealAll();
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(revealAll);
    });
  }

  document.addEventListener(
    'shopify:section:load',
    (ev) => {
      const root = ev.target;
      if (!(root instanceof HTMLElement)) return;
      if (root.id && root.id.startsWith('shopify-section-') && root.classList.contains('shopify-section')) {
        reveal(root);
      }
    },
    { passive: true }
  );
})();
