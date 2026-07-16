/**
 * PflegeShop — Grundpreis-Fallback (PAngV), wenn kein Shopify-Einheitspreis gesetzt ist.
 */
(function () {
  'use strict';

  function formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(cents, window.theme && window.theme.moneyFormat ? window.theme.moneyFormat : undefined);
    }
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  function parseNumber(str) {
    if (!str) return 0;
    var n = parseFloat(String(str).replace(',', '.').replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function extractParen(text) {
    var match = String(text || '').match(/\(([^)]+)\)/i);
    return match ? match[1].trim().toLowerCase() : '';
  }

  function computeGrundpreis(priceCents, variantTitle, productTitle) {
    var blob = (variantTitle || '') + ' ' + (productTitle || '');
    var paren = extractParen(variantTitle) || extractParen(productTitle);
    var scan = blob.toLowerCase();

    var mlMatch = (paren.match(/([\d.,]+)\s*ml/) || scan.match(/([\d.,]+)\s*ml/));
    if (mlMatch) {
      var ml = parseNumber(mlMatch[1]);
      if (ml > 0) {
        return formatMoney(Math.round((priceCents * 1000) / ml)) + ' / 1 l';
      }
    }

    var literMatch = paren.match(/([\d.,]+)\s*(?:l|liter)\b/) || scan.match(/([\d.,]+)\s*(?:l|liter)\b/);
    if (literMatch && !/ml/.test(literMatch[0])) {
      var liters = parseNumber(literMatch[1]);
      if (liters > 0) {
        return formatMoney(Math.round(priceCents / liters)) + ' / 1 l';
      }
    }

    var kgMatch = paren.match(/([\d.,]+)\s*kg/) || scan.match(/([\d.,]+)\s*kg/);
    if (kgMatch) {
      var kg = parseNumber(kgMatch[1]);
      if (kg > 0) {
        return formatMoney(Math.round(priceCents / kg)) + ' / 1 kg';
      }
    }

    var gMatch = paren.match(/([\d.,]+)\s*g\b/) || scan.match(/([\d.,]+)\s*g\b/);
    if (gMatch && !/kg/.test(gMatch[0])) {
      var grams = parseNumber(gMatch[1]);
      if (grams > 0) {
        return formatMoney(Math.round((priceCents * 1000) / grams)) + ' / 1 kg';
      }
    }

    var countMatch = paren.match(/([\d.,]+)\s*(?:stück|stk\.?|st\.)/i) || scan.match(/([\d.,]+)\s*(?:stück|stk\.?|st\.)/i);
    if (countMatch) {
      var count = parseNumber(countMatch[1]);
      if (count > 1) {
        return formatMoney(Math.round(priceCents / count)) + ' / 1 Stück';
      }
    }

    return formatMoney(priceCents) + ' / 1 Stück';
  }

  function updateNode(node) {
    if (!node || node.dataset.grundpreisNative === 'true') return;

    var textEl = node.querySelector('[data-pflege-grundpreis-text]');
    if (!textEl) return;

    var existing = textEl.textContent.trim();
    if (existing) {
      node.hidden = false;
      node.classList.remove('pflege-grundpreis--pending');
      return;
    }

    var price = parseInt(node.getAttribute('data-variant-price'), 10);
    if (!price) {
      node.hidden = true;
      return;
    }

    var result = computeGrundpreis(
      price,
      node.getAttribute('data-variant-title') || '',
      node.getAttribute('data-product-title') || ''
    );

    if (!result) {
      node.hidden = true;
      return;
    }

    textEl.textContent = result;
    node.hidden = false;
    node.classList.remove('pflege-grundpreis--pending');
    node.classList.add('pflege-grundpreis--computed');
  }

  function init(root) {
    (root || document).querySelectorAll('[data-pflege-grundpreis]').forEach(updateNode);
  }

  if (window.__pflegeGrundpreisInit) {
    window.__pflegeGrundpreisInit();
  } else {
    window.__pflegeGrundpreisInit = init;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        init();
      });
    } else {
      init();
    }

    document.addEventListener('shopify:section:load', function () {
      init();
    });
    document.addEventListener('product-info:loaded', function () {
      init();
    });

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, function () {
        window.setTimeout(function () {
          init();
        }, 0);
      });
    }
  }
})();
