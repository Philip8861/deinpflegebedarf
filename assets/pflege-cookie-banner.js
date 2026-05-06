/**
 * PflegeShop Cookie-Leiste — Customer Privacy API (Shopify consent-tracking-api)
 */
(function () {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function loadConsentApi(done) {
    if (!window.Shopify || typeof window.Shopify.loadFeatures !== 'function') {
      done(new Error('Shopify.loadFeatures fehlt'));
      return;
    }
    window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (err) {
      done(err || null);
    });
  }

  function init(root) {
    if (!root) return;
    var cp = window.Shopify && window.Shopify.customerPrivacy;
    if (!cp || typeof cp.shouldShowBanner !== 'function') return;

    var show = false;
    try {
      show = cp.shouldShowBanner() === true;
    } catch (e) {
      return;
    }
    if (!show) return;

    root.hidden = false;

    var accept = $('[data-pflege-cookie-accept]', root);
    var decline = $('[data-pflege-cookie-decline]', root);
    if (!accept || !decline) return;

    var finish = function () {
      root.hidden = true;
    };

    accept.addEventListener('click', function () {
      cp.setTrackingConsent({ analytics: true, marketing: true, preferences: true }, finish);
    });

    decline.addEventListener('click', function () {
      cp.setTrackingConsent({ analytics: false, marketing: false, preferences: true }, finish);
    });
  }

  function start() {
    var root = $('#pflege-cookie-banner');
    if (!root) return;

    loadConsentApi(function (err) {
      if (err) return;
      init(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
