(() => {
  'use strict';

  if (!document.body.classList.contains('pflege-category-filtered-page')) return;

  const section = document.querySelector('[data-pflege-category-filtered]');
  if (!section) return;

  const designMode = document.documentElement.classList.contains('shopify-design-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Kopfbereich: kurz nacheinander — blockiert Produkte nicht */
  const HEADER_STEP_SEC = 0.035;
  /* Produkte: sofort sichtbar, schneller Aufbau */
  const CARD_START_SEC = 0.04;
  const CARD_STEP_SEC = 0.028;
  const CARD_STAGGER_CAP = 8;
  const REFRESH_CARD_STEP = 0.022;

  const footerRoot = document.querySelector('.pflege-site-footer-stack');
  const seen = new Set();
  let headerMarked = false;
  let footerMarked = false;

  const HEADER_SELECTORS = [
    '.pflege-cat-filtered__promo-copy',
    '.pflege-cat-filtered__title',
    '.pflege-cat-filtered__lead',
    '.pflege-cat-filtered__toolbar--desktop',
    '.pflege-cat-filtered__toolbar--mobile',
    '.pflege-cat-filtered__sidebar',
    '.pflege-cat-trust__item',
  ];

  const FOOTER_SELECTORS = [
    '.pflege-advantages-us__title',
    '.pflege-advantages-us__subtitle',
    '.pflege-advantages-us__item',
    '.ct-hp-rating__stars',
    '.ct-hp__summary',
    '.ct-hp h2.ct-hp__title',
    '.ct-hp__subline',
    '.ct-hp__showcase',
    '.pflege-faq-accordion__title',
    '.pflege-faq-accordion__intro',
    '.pflege-faq-accordion__item',
  ];

  /** @param {Element} el @param {number} delaySec */
  function markEl(el, delaySec, isCard) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    el.classList.add('pflege-cat-entrance-el');
    if (isCard) el.classList.add('pflege-cat-entrance-el--card');
    el.style.setProperty('--pce-delay', delaySec + 's');
  }

  function markHeaderElements() {
    if (headerMarked) return;
    let index = 0;
    HEADER_SELECTORS.forEach((selector) => {
      section.querySelectorAll(selector).forEach((el) => {
        markEl(el, index * HEADER_STEP_SEC, false);
        index += 1;
      });
    });
    headerMarked = true;
  }

  /** @param {number} cardCount */
  function markFooterElements(cardCount) {
    if (footerMarked || !footerRoot) return;
    const staggeredCards = Math.min(cardCount, CARD_STAGGER_CAP);
    const footerStart =
      CARD_START_SEC + staggeredCards * CARD_STEP_SEC + 0.18;
    let index = 0;
    FOOTER_SELECTORS.forEach((selector) => {
      footerRoot.querySelectorAll(selector).forEach((el) => {
        markEl(el, footerStart + index * HEADER_STEP_SEC, false);
        index += 1;
      });
    });
    footerMarked = true;
  }

  /** @param {boolean} refresh */
  function animateProductCards(refresh) {
    const grid = section.querySelector('[data-pflege-cat-grid]');
    if (!grid) return;

    grid.querySelectorAll('.pflege-cat-card').forEach((el) => {
      seen.delete(el);
      el.classList.remove('pflege-cat-entrance-el', 'pflege-cat-entrance-el--card');
      el.style.removeProperty('--pce-delay');
    });

    if (!refresh) markHeaderElements();

    const cards = grid.querySelectorAll('.pflege-cat-card');
    const step = refresh ? REFRESH_CARD_STEP : CARD_STEP_SEC;
    const start = refresh ? 0 : CARD_START_SEC;

    cards.forEach((el, i) => {
      const capped = Math.min(i, CARD_STAGGER_CAP);
      markEl(el, start + capped * step, true);
    });

    if (!refresh) markFooterElements(cards.length);

    if (refresh && !reduceMotion && !designMode) {
      grid.querySelectorAll('.pflege-cat-entrance-el--card').forEach((el) => {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      });
    }
  }

  function reveal() {
    document.documentElement.classList.add('pflege-cat-entrance-ready');
  }

  function runInitial() {
    animateProductCards(false);
    if (designMode || reduceMotion) {
      reveal();
    } else {
      requestAnimationFrame(reveal);
    }
  }

  runInitial();

  document.addEventListener(
    'pflege:category-grid-updated',
    () => {
      animateProductCards(true);
    },
    { passive: true }
  );

  document.addEventListener(
    'shopify:section:load',
    (ev) => {
      const root = ev.target;
      if (!(root instanceof HTMLElement)) return;
      if (!root.querySelector('[data-pflege-category-filtered]')) return;
      headerMarked = false;
      footerMarked = false;
      seen.clear();
      runInitial();
    },
    { passive: true }
  );
})();
