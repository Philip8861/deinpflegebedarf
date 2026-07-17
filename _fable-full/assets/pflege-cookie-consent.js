/**
 * PflegeShop — gemeinsame Cookie-Einwilligung (Shopify Customer Privacy API)
 */
window.PflegeCookieConsent = (function () {
  'use strict';

  var LS_KEY = 'pflege_cmp_choice';
  var LS_TS = 'pflege_cmp_ts';
  var MAX_AGE_MS = 400 * 24 * 60 * 60 * 1000;

  function loadConsentApi(done) {
    if (!window.Shopify || typeof window.Shopify.loadFeatures !== 'function') {
      done(new Error('Shopify.loadFeatures fehlt'));
      return;
    }
    window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (err) {
      done(err || null);
    });
  }

  function getApi() {
    return window.Shopify && window.Shopify.customerPrivacy;
  }

  function isYesNo(v) {
    return v === 'yes' || v === 'no';
  }

  function visitorHasDecided(cp) {
    cp = cp || getApi();
    if (!cp) return false;
    try {
      var c = cp.currentVisitorConsent();
      if (!c) return false;
      return isYesNo(c.analytics) || isYesNo(c.marketing);
    } catch (e) {
      return false;
    }
  }

  function readStoredChoice() {
    try {
      var v = localStorage.getItem(LS_KEY);
      var ts = parseInt(localStorage.getItem(LS_TS), 10);
      if (v !== 'all' && v !== 'essential' && v !== 'custom') return null;
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

  function bodyFromKind(kind) {
    if (kind === 'all') {
      return { analytics: true, marketing: true, preferences: true };
    }
    if (kind === 'essential') {
      return { analytics: false, marketing: false, preferences: true };
    }
    return null;
  }

  function bodyFromBooleans(analytics, marketing, preferences) {
    return {
      analytics: !!analytics,
      marketing: !!marketing,
      preferences: preferences !== false,
    };
  }

  function consentToBooleans(c) {
    if (!c) {
      return { analytics: false, marketing: false, preferences: true };
    }
    return {
      analytics: c.analytics === 'yes',
      marketing: c.marketing === 'yes',
      preferences: c.preferences !== 'no',
    };
  }

  function setTrackingConsent(body, done) {
    var cp = getApi();
    if (!cp) {
      done(new Error('customerPrivacy fehlt'));
      return;
    }
    cp.setTrackingConsent(body, function () {
      done(null);
    });
  }

  function applyKind(kind, done) {
    var body = bodyFromKind(kind);
    if (!body) {
      done(new Error('Unbekannte Voreinstellung'));
      return;
    }
    setTrackingConsent(body, function (err) {
      if (!err) persistChoice(kind);
      done(err);
    });
  }

  function hideBannerIfPresent() {
    var banner = document.getElementById('pflege-cookie-banner');
    if (banner && visitorHasDecided()) {
      banner.hidden = true;
    }
  }

  return {
    loadConsentApi: loadConsentApi,
    getApi: getApi,
    visitorHasDecided: visitorHasDecided,
    readStoredChoice: readStoredChoice,
    persistChoice: persistChoice,
    clearStoredChoice: clearStoredChoice,
    bodyFromKind: bodyFromKind,
    bodyFromBooleans: bodyFromBooleans,
    consentToBooleans: consentToBooleans,
    setTrackingConsent: setTrackingConsent,
    applyKind: applyKind,
    hideBannerIfPresent: hideBannerIfPresent,
  };
})();
