/**
 * PflegeShop Cookie-Leiste — Customer Privacy API (Shopify consent-tracking-api)
 *
 * shouldShowBanner() allein reicht nicht: laut Doku zeigt es nicht, ob bereits zugestimmt/abgelehnt wurde.
 * Daher: currentVisitorConsent() + lokales Fallback nach erfolgreicher Wahl.
 */
(function () {
  'use strict';

  var LS_KEY = 'pflege_cmp_choice';
  var LS_TS = 'pflege_cmp_ts';
  var MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000; // etwas über 1 Jahr

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

  /** Explizite Ja/Nein-Entscheidung vom Besucher (nicht nur leer) */
  function visitorHasDecided(cp) {
    try {
      var c = cp.currentVisitorConsent();
      if (!c) return false;
      function decided(v) {
        return v === 'yes' || v === 'no';
      }
      return decided(c.analytics) || decided(c.marketing);
    } catch (e) {
      return false;
    }
  }

  function readStoredChoice() {
    try {
      var v = localStorage.getItem(LS_KEY);
      var ts = parseInt(localStorage.getItem(LS_TS), 10);
      if (v !== 'all' && v !== 'essential') return null;
      if (!ts || isNaN(ts) || Date.now() - ts > MAX_AGE_MS) return null;
      return v;
    } catch (e) {
      return null;
    }
  }

  function persistChoice(kind) {
    try {
      localStorage.setItem(LS_KEY, kind);
      localStorage.setItem(LS_TS, String(Date.now()));
    } catch (e) {}
  }

  function clearStoredChoice() {
    try {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_TS);
    } catch (e) {}
  }

  function bodyFromChoice(kind) {
    if (kind === 'all') {
      return { analytics: true, marketing: true, preferences: true };
    }
    return { analytics: false, marketing: false, preferences: true };
  }

  function applyConsent(cp, kind, root, then) {
    var body = bodyFromChoice(kind);
    cp.setTrackingConsent(body, function () {
      then();
    });
  }

  function hideBanner(root) {
    root.hidden = true;
  }

  function init(root) {
    if (!root) return;
    var cp = window.Shopify && window.Shopify.customerPrivacy;
    if (!cp) return;

    // 1) Bereits in der API gespeichert → nie erneut zeigen
    if (visitorHasDecided(cp)) {
      hideBanner(root);
      return;
    }

    // 2) Vorher gewählt (Refresh / API noch nicht synchron) → Consent erneut mitschicken, Banner aus
    var stored = readStoredChoice();
    if (stored) {
      applyConsent(cp, stored, root, function () {
        if (visitorHasDecided(cp)) {
          hideBanner(root);
        } else {
          // API nimmt nicht an – Nutzer sieht Banner wieder; lokale Daten verwirren sonst
          clearStoredChoice();
          tryShowBanner(root, cp);
        }
      });
      return;
    }

    // 3) Frischer Besuch / keine lokale Wahl
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

    function finish(kind) {
      persistChoice(kind);
      hideBanner(root);
    }

    accept.addEventListener('click', function () {
      applyConsent(cp, 'all', root, function () {
        finish('all');
      });
    });

    decline.addEventListener('click', function () {
      applyConsent(cp, 'essential', root, function () {
        finish('essential');
      });
    });
  }

  /** Kurz warten, bis ggf. Consent-Cookies gelesen wurden (Reload nach Zurück zur Seite) */
  function start() {
    var root = $('#pflege-cookie-banner');
    if (!root) return;

    loadConsentApi(function (err) {
      if (err) return;

      init(root);

      document.addEventListener(
        'visitorConsentCollected',
        function () {
          var cpE = window.Shopify && window.Shopify.customerPrivacy;
          if (!cpE) return;
          if (visitorHasDecided(cpE)) hideBanner(root);
        },
        false
      );

      // Einmal nachgestellt: manchmal erst nach kurzer Verzögerung Werte in currentVisitorConsent
      setTimeout(function () {
        if (root.hidden) return;
        var cp = window.Shopify && window.Shopify.customerPrivacy;
        if (!cp) return;
        if (visitorHasDecided(cp)) {
          hideBanner(root);
        }
      }, 350);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
