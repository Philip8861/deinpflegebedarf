/**
 * Hero-Text gestaffelt einblenden — nur Startseite, PHM, Inko-Kategorie, Rezept-Landing.
 * Nur Transform (kein opacity: 0), damit kein dunkler Flash entsteht.
 */
(() => {
  'use strict';

  const STEP_SEC = 0.065;
  const main = document.querySelector('#MainContent');
  if (!main) return;

  const designMode = document.documentElement.classList.contains('shopify-design-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isHeroRisePage() {
    const body = document.body;
    if (body.classList.contains('template-index')) return true;
    if (body.classList.contains('pflege-pfc-collection')) return true;
    if (body.classList.contains('template-page-inkontinenzversorgung-auf-rezept')) return true;
    if (body.classList.contains('template-page-inkontinenzversrogung-auf-rezept')) return true;
    if (body.classList.contains('pflege-category-filtered-page') && main.querySelector('.pflege-cat-filtered--inko')) {
      return true;
    }
    return false;
  }

  if (!isHeroRisePage() || designMode || reduceMotion) return;

  const HERO_TEXT_SELECTORS = [
    '.pflege-hero__badge',
    '.pflege-hero__title',
    '.pflege-hero__sub',
    '.pflege-hero__actions .pflege-hero__cta',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__promo-title-lead',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__promo-title-rest',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__promo-title:not(:has(.pflege-cat-filtered__promo-title-lead))',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__promo-lead',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__promo-cta',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__title',
    '.pflege-cat-filtered--inko .pflege-cat-filtered__lead',
  ];

  const seen = new Set();
  let index = 0;

  HERO_TEXT_SELECTORS.forEach((selector) => {
    main.querySelectorAll(selector).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.classList.add('pflege-hero-rise-el');
      el.style.setProperty('--phr-delay', index * STEP_SEC + 's');
      index += 1;
    });
  });

  if (seen.size) {
    document.documentElement.classList.add('pflege-hero-rise-ready');
  }
})();
