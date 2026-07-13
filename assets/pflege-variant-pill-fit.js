/**
 * PflegeShop — Varianten-Pills mobil: Schrift skaliert auf volle Button-Breite.
 */
(function () {
  'use strict';

  var MOBILE_MQL = window.matchMedia('(max-width: 749px)');

  function fitLabel(label) {
    if (!label) return;

    if (!MOBILE_MQL.matches) {
      label.style.removeProperty('font-size');
      label.classList.remove('is-variant-pill-fitted');
      return;
    }

    var fieldset = label.closest('.product-form__input--pill');
    if (!fieldset) return;

    var targetWidth = fieldset.getBoundingClientRect().width;
    if (targetWidth < 48) return;

    label.style.fontSize = '10px';

    var min = 9;
    var max = 17;

    while (max - min > 0.2) {
      var mid = (min + max) / 2;
      label.style.fontSize = mid + 'px';
      if (label.scrollWidth <= targetWidth) {
        min = mid;
      } else {
        max = mid;
      }
    }

    label.style.fontSize = min + 'px';
    label.classList.add('is-variant-pill-fitted');
  }

  function fitAll() {
    document
      .querySelectorAll('.pflege-product-page .product-form__input--pill input[type="radio"] + label')
      .forEach(fitLabel);
  }

  var fitRaf = 0;
  function scheduleFitAll() {
    if (fitRaf) window.cancelAnimationFrame(fitRaf);
    fitRaf = window.requestAnimationFrame(function () {
      fitRaf = 0;
      fitAll();
    });
  }

  function init() {
    fitAll();
    if (window.__pflegeVariantPillFitBound) return;
    window.__pflegeVariantPillFitBound = true;

    window.addEventListener('resize', scheduleFitAll, { passive: true });
    window.addEventListener('orientationchange', scheduleFitAll, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(scheduleFitAll);
      document.querySelectorAll('.pflege-product-page variant-selects').forEach(function (node) {
        ro.observe(node);
      });
    }

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, function () {
        window.setTimeout(scheduleFitAll, 0);
      });
    }

    document.addEventListener('shopify:section:load', scheduleFitAll);
  }

  if (window.__pflegeVariantPillFitInit) {
    window.__pflegeVariantPillFitInit();
  } else {
    window.__pflegeVariantPillFitInit = init;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
