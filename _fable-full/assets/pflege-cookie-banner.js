/**
 * PflegeShop Cookie-Leiste — nutzt PflegeCookieConsent (pflege-cookie-consent.js)
 */
(function () {
  'use strict';

  var CMP = window.PflegeCookieConsent;
  if (!CMP) return;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function hideBanner(root) {
    root.hidden = true;
  }

  function init(root) {
    if (!root) return;
    var cp = CMP.getApi();
    if (!cp) return;

    if (CMP.visitorHasDecided(cp)) {
      hideBanner(root);
      return;
    }

    var stored = CMP.readStoredChoice();
    if (stored === 'custom' && CMP.visitorHasDecided(cp)) {
      hideBanner(root);
      return;
    }
    if (stored === 'all' || stored === 'essential') {
      CMP.applyKind(stored, function () {
        if (CMP.visitorHasDecided(cp)) {
          hideBanner(root);
        } else {
          CMP.clearStoredChoice();
          tryShowBanner(root, cp);
        }
      });
      return;
    }

    tryShowBanner(root, cp);
  }

  function tryShowBanner(root, cp) {
    var show = false;
    try {
      show = cp.shouldShowBanner() === true;
    } catch (e) {
      return;
    }

    if (!show) {
      hideBanner(root);
      return;
    }

    if (root._pflegeCookieBound) {
      root.hidden = false;
      return;
    }

    var accept = $('[data-pflege-cookie-accept]', root);
    var decline = $('[data-pflege-cookie-decline]', root);
    if (!accept || !decline) return;

    root.hidden = false;
    root._pflegeCookieBound = true;

    accept.addEventListener('click', function () {
      CMP.applyKind('all', function () {
        hideBanner(root);
      });
    });

    decline.addEventListener('click', function () {
      CMP.applyKind('essential', function () {
        hideBanner(root);
      });
    });
  }

  function start() {
    var root = $('#pflege-cookie-banner');
    if (!root) return;

    CMP.loadConsentApi(function (err) {
      if (err) return;

      init(root);

      document.addEventListener(
        'visitorConsentCollected',
        function () {
          if (CMP.visitorHasDecided()) hideBanner(root);
        },
        false
      );

      setTimeout(function () {
        if (root.hidden) return;
        if (CMP.visitorHasDecided()) hideBanner(root);
      }, 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
