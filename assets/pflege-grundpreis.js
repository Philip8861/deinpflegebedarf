/**
 * PflegeShop — Einheitspreis-Fallback (PAngV)
 */
(function () {
  'use strict';

  var UNIT_SEP = 'PRO';

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

  function extractPackCount(blob, variantTitle, productTitle) {
    var count = 0;
    var product = String(productTitle || '');
    var variant = String(variantTitle || '');

    var stkMatch = variant.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*stk/i);
    if (stkMatch) {
      count = parseNumber(stkMatch[1]);
    }

    if (count <= 1) {
      var paren = extractParen(product) || extractParen(variant);
      var parenCount = paren.match(/(\d+(?:[.,]\d+)?)\s*(?:stück|stk\.?|st\.)/i);
      if (parenCount) {
        count = parseNumber(parenCount[1]);
      }
    }

    if (count <= 1) {
      var stueckMatch = product.match(/(\d+(?:[.,]\d+)?)\s*(?:stück|stk\.?|st\.)/i);
      if (stueckMatch) {
        count = parseNumber(stueckMatch[1]);
      }
    }

    return count;
  }

  function isInkoProduct(blob) {
    return /inkontinenz|einlagen|\spants\b|windel|vorlage|\bslip\b|fixierhöschen|netzhose/i.test(blob);
  }

  function isLiquidProduct(blob) {
    return /flasche|sprüh|lotion|shampoo|\bgel\b|balsam|creme|paste|wasch|desinfekt|zahnpasta|spuckbeutel|\böl\b|tonic|serum|milch/i.test(blob);
  }

  function extractMlFromTitle(productTitle) {
    var match = String(productTitle || '').match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
    return match ? parseNumber(match[1]) : 0;
  }

  function extractMlFromText(text, allowParenOnly) {
    var productMl = extractMlFromTitle(text);
    if (productMl > 0) return productMl;

    if (!allowParenOnly) return 0;

    var paren = extractParen(text);
    var parenMatch = paren.match(/(?:ca\.?\s*)?(\d+(?:[.,]\d+)?)\s*ml\b/i);
    if (parenMatch) return parseNumber(parenMatch[1]);

    var scanMatch = String(text || '').toLowerCase().match(/(?:ca\.?\s*)?(\d+(?:[.,]\d+)?)\s*ml\b/i);
    return scanMatch ? parseNumber(scanMatch[1]) : 0;
  }

  function computeUnitPrice(priceCents, variantTitle, productTitle, productType) {
    var blob = (productTitle || '') + ' ' + (variantTitle || '') + ' ' + (productType || '');
    var blobLower = blob.toLowerCase();
    var inko = isInkoProduct(blobLower);
    var liquid = isLiquidProduct(blobLower);
    var packCount = extractPackCount(blobLower, variantTitle, productTitle);

    if (packCount > 1) {
      return formatMoney(Math.round(priceCents / packCount)) + ' ' + UNIT_SEP + ' 1 Stück';
    }

    var titleMl = extractMlFromTitle(productTitle);
    var useLiter = false;
    var ml = 0;

    if (titleMl > 0) {
      ml = titleMl;
      useLiter = true;
    } else if (liquid && !inko) {
      ml = extractMlFromText(variantTitle, true) || extractMlFromText(productTitle, true);
      if (ml > 0) useLiter = true;
    }

    if (useLiter && ml > 0) {
      return formatMoney(Math.round((priceCents * 1000) / ml)) + ' ' + UNIT_SEP + ' Liter';
    }

    var paren = extractParen(variantTitle) || extractParen(productTitle);
    var literMatch = paren.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter)\b/i) || blobLower.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter)\b/i);
    if (literMatch && !/ml/.test(literMatch[0])) {
      var liters = parseNumber(literMatch[1]);
      if (liters > 0) {
        return formatMoney(Math.round(priceCents / liters)) + ' ' + UNIT_SEP + ' Liter';
      }
    }

    var kgMatch = paren.match(/(\d+(?:[.,]\d+)?)\s*kg/i) || blobLower.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
    if (kgMatch) {
      var kg = parseNumber(kgMatch[1]);
      if (kg > 0) {
        return formatMoney(Math.round(priceCents / kg)) + ' ' + UNIT_SEP + ' 1 kg';
      }
    }

    var gMatch = paren.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramm)\b/i);
    if (gMatch && !/kg/.test(gMatch[0])) {
      var grams = parseNumber(gMatch[1]);
      if (grams > 0) {
        return formatMoney(Math.round((priceCents * 1000) / grams)) + ' ' + UNIT_SEP + ' 1 kg';
      }
    }

    return null;
  }

  function updateNode(node) {
    if (!node || node.dataset.grundpreisNative === 'true') return;

    var textEl = node.querySelector('[data-pflege-grundpreis-text]');
    if (!textEl) return;

    var price = parseInt(node.getAttribute('data-variant-price'), 10);
    if (!price) {
      node.hidden = true;
      return;
    }

    var result = computeUnitPrice(
      price,
      node.getAttribute('data-variant-title') || '',
      node.getAttribute('data-product-title') || '',
      node.getAttribute('data-product-type') || ''
    );

    if (!result) {
      textEl.textContent = '';
      node.hidden = true;
      node.classList.remove('pflege-grundpreis--computed');
      node.classList.add('pflege-grundpreis--pending');
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

    document.addEventListener('shopify:section:load', init);
    document.addEventListener('product-info:loaded', init);

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, function () {
        window.setTimeout(init, 0);
      });
    }
  }
})();
