/**
 * PflegeShop — gestaffelte Seiten-Einblendung (wie kostenfreie Pflegehilfsmittel).
 */
(() => {
  'use strict';

  const roots = [
    document.querySelector('#MainContent'),
    document.querySelector('.pflege-site-footer-stack'),
  ].filter(Boolean);

  if (!roots.length) return;

  const designMode = document.documentElement.classList.contains('shopify-design-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPflegesetsPage = document.body.classList.contains('pflege-pflegesets-page');

  if (isPflegesetsPage) {
    document.documentElement.classList.remove('pflege-site-entrance-prep');
    document.documentElement.classList.add('pflege-site-entrance-ready');
    return;
  }

  const EXCLUDE_ANCESTOR =
    'header, .cart-drawer, .pflege-main-nav-section, .shopify-section-group-header-group, .visually-hidden';

  const STEP_SEC = 0.065;
  const SECTION_STEP_SEC = 0.08;
  const CARD_START_SEC = 0.04;
  const CARD_STEP_SEC = 0.028;
  const CARD_STAGGER_CAP = 8;
  const REFRESH_CARD_STEP = 0.022;
  const HEADER_STEP_SEC = 0.035;

  const seen = new Set();

  const ORDERED_SELECTORS = [
    '.pflege-hero__badge',
    '.pflege-hero__title',
    '.pflege-hero__sub',
    '.pflege-hero__actions .pflege-hero__cta',
    '.pflege-hero__usp',
    '.pfc-free-care__box-products .pflege-bestseller__title',
    '.pfc-free-care__box-products .pflege-bestseller__intro',
    '.pfc-free-care__product-grid-head .pflege-bestseller__title',
    '.pfc-free-care__product-grid-head .pflege-bestseller__intro',
    '.pflege-cat-filtered__promo-copy',
    '.pflege-cat-filtered__title',
    '.pflege-cat-filtered__lead',
    '.pflege-cat-filtered__toolbar--desktop',
    '.pflege-cat-filtered__toolbar--mobile',
    '.pflege-cat-filtered__sidebar',
    '.pflege-cat-trust__item',
    '.pflege-pdp-breadcrumb',
    '.pflege-mock-pdp__brand',
    '.pflege-mock-pdp__product-title',
    '.pflege-pdp-intro',
    '.pflege-mock-pdp__buy-card',
    '.pflege-product-page .product-form__input--pill',
    '.pflege-product-page .pflege-product__purchase-row',
    '.pflege-product-page .pflege-buy-usps__item',
    '.pflege-product-page .pflege-product__trust-unified',
    '.pflege-product-page .pflege-related-products',
    '.pflege-cart-page__title',
    '.pflege-cart-breadcrumb',
    '.pflege-cart-page__inner .cart-items',
    '.pflege-cart-empty-card',
    '.pflege-search__header',
    '.pflege-search__toolbar',
    '.pflege-search__content-inner',
    '.pflege-collection-intro',
    '.pflege-coll-card',
    '.collection-hero__title',
    '.collection-hero__description',
    '.pflege-contact-page__title',
    '.pflege-contact-page__intro',
    '.pflege-contact-page__aside',
    '.pflege-contact-page__form-wrap',
    '.pflege-legal-page__hero',
    '.pflege-legal-page__content',
    '.main-page-title',
    '.pflege-bestseller__title',
    '.pflege-bestseller__intro',
    '.pflege-pflegesets__title',
    '.pflege-pflegesets__sub',
    '.pflege-bestseller--closing-cta .pflege-bestseller__title',
    '.pflege-bestseller--closing-cta .pflege-bestseller__intro',
    '.pflege-bestseller--closing-cta .pflege-bestseller__closing-cta-primary',
    '.pflege-bestseller--closing-cta .pflege-bestseller__closing-cta-secondary',
    '.pflege-advantages-us__title',
    '.pflege-advantages-us__subtitle',
    '.pflege-advantages-us__item',
    '.pflege-faq-accordion__title',
    '.pflege-faq-accordion__intro',
    '.pflege-faq-accordion__item',
    '.ct-hp-rating__stars',
    '.ct-hp__summary',
    '.ct-hp h2.ct-hp__title',
    '.ct-hp__subline',
    '.ct-hp__showcase',
    '.ct-hp__card',
    '.ct-hp__panel.is-active .ct-hp__quote',
    '.ct-hp__panel.is-active .ct-hp__author',
    '.ct-hp__dots',
    '.ct-hp__cta-wrap > .ct-hp__cta',
    '.product-grid-container .title',
    '.product-grid-container .facets__heading',
    '.template-404__code',
    '.template-404__lead',
  ];

  const CARD_SELECTORS = [
    '.pfc-free-care__box-products .pflege-cat-card',
    '.pflege-bestseller__grid .pflege-cat-card',
    '.pflege-pflegesets__grid .pflege-cat-card',
    '.pflege-pflegesets__cat-grid .pflege-cat-card',
    '.pflege-search__grid .pflege-cat-card',
    '.related-products .card-wrapper',
  ];

  /** @param {Element} el */
  function isExcluded(el) {
    return !el || el.closest(EXCLUDE_ANCESTOR);
  }

  /**
   * @param {Element} el
   * @param {number} delaySec
   * @param {'default'|'card'|'section'} kind
   */
  function markEl(el, delaySec, kind) {
    if (!el || seen.has(el) || isExcluded(el)) return false;
    seen.add(el);
    el.classList.add('pflege-site-entrance-el');
    if (kind === 'card') el.classList.add('pflege-site-entrance-el--card');
    if (kind === 'section') el.classList.add('pflege-site-entrance-el--section');
    el.style.setProperty('--pse-delay', delaySec + 's');
    return true;
  }

  function clearCards(grid) {
    if (!grid) return;
    grid.querySelectorAll('.pflege-cat-card').forEach((el) => {
      seen.delete(el);
      el.classList.remove('pflege-site-entrance-el', 'pflege-site-entrance-el--card');
      el.style.removeProperty('--pse-delay');
    });
  }

  function markOrderedElements(startIndex, rootScope) {
    let index = startIndex;
    const scopeRoots = rootScope || roots;
    ORDERED_SELECTORS.forEach((selector) => {
      scopeRoots.forEach((root) => {
        root.querySelectorAll(selector).forEach((el) => {
          if (markEl(el, index * STEP_SEC, 'default')) index += 1;
        });
      });
    });
    return index;
  }

  function markFooterElements(startIndex) {
    const footer = document.querySelector('.pflege-site-footer-stack');
    if (!footer) return startIndex;
    return markOrderedElements(startIndex, [footer]);
  }

  function markCards(refresh) {
    let index = 0;
    CARD_SELECTORS.forEach((selector) => {
      roots.forEach((root) => {
        root.querySelectorAll(selector).forEach((el) => {
          const capped = Math.min(index, CARD_STAGGER_CAP);
          const step = refresh ? REFRESH_CARD_STEP : CARD_STEP_SEC;
          const start = refresh ? 0 : CARD_START_SEC;
          if (markEl(el, start + capped * step, 'card')) index += 1;
        });
      });
    });
    return index;
  }

  function markCategoryCards(refresh) {
    const section = document.querySelector('[data-pflege-category-filtered]');
    if (!section) return;

    const grid = section.querySelector('[data-pflege-cat-grid]');
    if (!grid) return;

    if (refresh) clearCards(grid);

    const cards = grid.querySelectorAll('.pflege-cat-card');
    const step = refresh ? REFRESH_CARD_STEP : CARD_STEP_SEC;
    const start = refresh ? 0 : CARD_START_SEC;

    cards.forEach((el, i) => {
      const capped = Math.min(i, CARD_STAGGER_CAP);
      markEl(el, start + capped * step, 'card');
    });
  }

  function markFallbackSections(startIndex) {
    const main = document.querySelector('#MainContent');
    if (!main) return;

    let index = startIndex;
    main.querySelectorAll(':scope > .shopify-section').forEach((section) => {
      if (section.querySelector('.pflege-site-entrance-el')) return;
      if (section.querySelector('.pflege-pdp-detail, .pflege-product-description-section')) return;
      if (markEl(section, index * SECTION_STEP_SEC, 'section')) index += 1;
    });
  }

  function collectAll(refreshCards) {
    if (!refreshCards) seen.clear();

    const isCategoryFiltered = document.body.classList.contains('pflege-category-filtered-page');

    if (!refreshCards) {
      let index = markOrderedElements(0);
      markFallbackSections(index);
      markFooterElements(index);

      if (isCategoryFiltered) {
        markCategoryCards(false);
      } else {
        markCards(false);
      }
    } else {
      markCategoryCards(true);
    }
  }

  function replayCards(container) {
    if (reduceMotion || designMode) return;
    container.querySelectorAll('.pflege-site-entrance-el--card').forEach((el) => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    });
  }

  function reveal() {
    document.documentElement.classList.add('pflege-site-entrance-prep');
    document.documentElement.classList.add('pflege-site-entrance-ready');
  }

  function runInitial() {
    document.documentElement.classList.add('pflege-site-entrance-ready');
  }

  runInitial();

  document.addEventListener(
    'pflege:category-grid-updated',
    () => {
      collectAll(true);
      const grid = document.querySelector('[data-pflege-cat-grid]');
      if (grid) replayCards(grid);
    },
    { passive: true }
  );

  document.addEventListener(
    'shopify:section:load',
    (ev) => {
      const root = ev.target;
      if (!(root instanceof HTMLElement)) return;
      const prevCount = seen.size;
      collectAll(false);
      if (seen.size > prevCount) {
        replayCards(root);
      }
    },
    { passive: true }
  );
})();
