(function () {
  'use strict';

  var CMP = window.PflegeCookieConsent;
  if (!CMP) return;

  var root = document.querySelector('[data-pflege-cookie-settings]');
  if (!root) return;

  var statusEl = root.querySelector('[data-pflege-cookie-status]');
  var analyticsInput = root.querySelector('[data-pflege-cookie-analytics]');
  var marketingInput = root.querySelector('[data-pflege-cookie-marketing]');
  var preferencesInput = root.querySelector('[data-pflege-cookie-preferences]');
  var saveBtn = root.querySelector('[data-pflege-cookie-save]');
  var acceptAllBtn = root.querySelector('[data-pflege-cookie-accept-all]');
  var essentialBtn = root.querySelector('[data-pflege-cookie-essential]');

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.className = 'pflege-cookie-settings__status pflege-cookie-settings__status--' + (type || 'info');
    statusEl.setAttribute('role', type === 'error' ? 'alert' : 'status');
    statusEl.focus();
  }

  function syncTogglesFromConsent() {
    var cp = CMP.getApi();
    if (!cp) return;
    try {
      var booleans = CMP.consentToBooleans(cp.currentVisitorConsent());
      if (analyticsInput) analyticsInput.checked = booleans.analytics;
      if (marketingInput) marketingInput.checked = booleans.marketing;
      if (preferencesInput) preferencesInput.checked = booleans.preferences;
    } catch (e) {
      /* ignore */
    }
  }

  function readToggles() {
    return {
      analytics: analyticsInput ? analyticsInput.checked : false,
      marketing: marketingInput ? marketingInput.checked : false,
      preferences: preferencesInput ? preferencesInput.checked : true,
    };
  }

  function setTogglesFromKind(kind) {
    var body = CMP.bodyFromKind(kind);
    if (!body) return;
    if (analyticsInput) analyticsInput.checked = body.analytics;
    if (marketingInput) marketingInput.checked = body.marketing;
    if (preferencesInput) preferencesInput.checked = body.preferences;
  }

  function saveCustom(done) {
    var toggles = readToggles();
    var body = CMP.bodyFromBooleans(toggles.analytics, toggles.marketing, toggles.preferences);
    CMP.setTrackingConsent(body, function (err) {
      if (err) {
        done(err);
        return;
      }
      CMP.persistChoice('custom');
      CMP.hideBannerIfPresent();
      done(null);
    });
  }

  function bindButtons() {
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        saveBtn.disabled = true;
        saveCustom(function (err) {
          saveBtn.disabled = false;
          if (err) {
            setStatus('Ihre Einstellung konnte nicht gespeichert werden. Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.', 'error');
            return;
          }
          setStatus('Ihre Cookie-Einstellungen wurden gespeichert.', 'success');
        });
      });
    }

    if (acceptAllBtn) {
      acceptAllBtn.addEventListener('click', function () {
        acceptAllBtn.disabled = true;
        setTogglesFromKind('all');
        CMP.applyKind('all', function (err) {
          acceptAllBtn.disabled = false;
          if (err) {
            setStatus('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.', 'error');
            return;
          }
          syncTogglesFromConsent();
          setStatus('Sie haben alle optionalen Cookies akzeptiert.', 'success');
        });
      });
    }

    if (essentialBtn) {
      essentialBtn.addEventListener('click', function () {
        essentialBtn.disabled = true;
        setTogglesFromKind('essential');
        CMP.applyKind('essential', function (err) {
          essentialBtn.disabled = false;
          if (err) {
            setStatus('Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.', 'error');
            return;
          }
          syncTogglesFromConsent();
          setStatus('Es werden nur technisch notwendige Cookies verwendet.', 'success');
        });
      });
    }
  }

  CMP.loadConsentApi(function (err) {
    if (err) {
      setStatus('Cookie-Verwaltung ist derzeit nicht verfügbar. Bitte aktivieren Sie in Shopify unter Einstellungen → Kunden-Datenschutz die Einwilligung für Ihre Zielregion.', 'error');
      if (saveBtn) saveBtn.disabled = true;
      if (acceptAllBtn) acceptAllBtn.disabled = true;
      if (essentialBtn) essentialBtn.disabled = true;
      return;
    }

    syncTogglesFromConsent();
    bindButtons();

    document.addEventListener(
      'visitorConsentCollected',
      function () {
        syncTogglesFromConsent();
      },
      false
    );
  });
})();
