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
    var hadFocus = root.contains(document.activeElement);
    root.hidden = true;
    if (root._pflegeCookieKeydown) {
      document.removeEventListener('keydown', root._pflegeCookieKeydown, true);
      root._pflegeCookieKeydown = null;
    }
    // Fokus nicht im versteckten Banner zurücklassen
    if (hadFocus) {
      var target = document.getElementById('MainContent') || document.body;
      try {
        target.focus({ preventScroll: true });
      } catch (e) {}
    }
  }

  function showBanner(root) {
    root.hidden = false;

    // Screenreader/Tastatur: Banner beim Einblenden fokussieren
    try {
      root.focus({ preventScroll: true });
    } catch (e) {}

    // ESC blendet das Banner für diese Seitenansicht aus (keine Entscheidung gespeichert,
    // Banner erscheint beim nächsten Seitenaufruf erneut)
    if (!root._pflegeCookieKeydown) {
      root._pflegeCookieKeydown = function (e) {
        if (e.key === 'Escape' && !root.hidden) {
          e.preventDefault();
          hideBanner(root);
        }
      };
      document.addEventListener('keydown', root._pflegeCookieKeydown, true);
    }
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
      showBanner(root);
      return;
    }

    var accept = $('[data-pflege-cookie-accept]', root);
    var decline = $('[data-pflege-cookie-decline]', root);
    if (!accept || !decline) return;

    showBanner(root);
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
