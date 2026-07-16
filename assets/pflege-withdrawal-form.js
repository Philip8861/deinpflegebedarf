/**
 * Elektronische Widerrufsfunktion (§ 356a BGB) — zweistufiger Ablauf.
 * Keine Tracking-Events; keine Daten in URL-Parametern.
 */
(function () {
  'use strict';

  var DECLARATION =
    'Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel.';

  var STORAGE_PREFIX = 'pflege-wd-submitted-';

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function trim(val) {
    return (val || '').replace(/^\s+|\s+$/g, '');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function generateCaseId() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var rand = String(Math.floor(1000 + Math.random() * 9000));
    return 'WD-' + y + m + d + '-' + rand;
  }

  function generateSubmissionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  }

  function formatDateDE(isoDate) {
    if (!isoDate) return '';
    var parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function getTimezone() {
    var root = document.querySelector('[data-pflege-withdrawal]');
    return (root && root.getAttribute('data-pflege-withdrawal-tz')) || 'Europe/Berlin';
  }

  function nowStamp() {
    var now = new Date();
    var tz = getTimezone();
    var dateStr = now.toLocaleDateString('de-DE', { timeZone: tz });
    var timeStr = now.toLocaleTimeString('de-DE', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: dateStr, time: timeStr, tz: tz, iso: now.toISOString() };
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }

  function clearErrors(root) {
    qsa(root, '[data-pflege-withdrawal-error]').forEach(function (el) {
      showError(el, '');
    });
    var alert = qs(root, '[data-pflege-withdrawal-errors]');
    if (alert) alert.hidden = true;
  }

  function getScopeLabel(value) {
    return value === 'partial' ? 'Teil der Bestellung' : 'Gesamte Bestellung';
  }

  function buildBody(data, stamp) {
    var lines = [
      '=== WIDERRUFSERKLÄRUNG (§ 356a BGB) ===',
      '',
      'Vorgangsnummer: ' + data.caseId,
      'Submission-ID: ' + data.submissionId,
      'Eingang (Client): ' + stamp.date + ' ' + stamp.time + ' (' + stamp.tz + ')',
      'Eingang (ISO): ' + stamp.iso,
      '',
      'Name: ' + data.name,
      'E-Mail: ' + data.email,
      '',
      'Angaben zur Bestellung:',
      data.orderInfo,
      '',
      'Umfang des Widerrufs: ' + getScopeLabel(data.scope),
    ];

    if (data.scope === 'partial') {
      lines.push('Betroffene Artikel:', data.partialItems);
    } else {
      lines.push('Betroffene Artikel: Gesamte Bestellung');
    }

    if (data.orderDate) {
      lines.push('', 'Bestelldatum (optional): ' + data.orderDate);
    }

    lines.push('', 'Erklärungstext:', '„' + DECLARATION + '“');

    if (data.message) {
      lines.push('', 'Zusätzliche Nachricht:', data.message);
    }

    lines.push('', '---', 'Keine Zahlungsdaten erfasst. Keine IP-Adresse gespeichert.');
    return lines.join('\n');
  }

  function readFormData(root) {
    var scopeEl = qs(root, '[data-pflege-withdrawal-scope]:checked');
    var orderDateRaw = qs(root, '[data-pflege-withdrawal-order-date]');
    return {
      name: trim(qs(root, '[data-pflege-withdrawal-name]').value),
      email: trim(qs(root, '[data-pflege-withdrawal-email]').value),
      orderInfo: trim(qs(root, '[data-pflege-withdrawal-order-info]').value),
      scope: scopeEl ? scopeEl.value : '',
      partialItems: trim(qs(root, '[data-pflege-withdrawal-partial-items]').value),
      orderDate: orderDateRaw && orderDateRaw.value ? formatDateDE(orderDateRaw.value) : '',
      message: trim(qs(root, '[data-pflege-withdrawal-message]').value),
      caseId: (qs(root, '[data-pflege-withdrawal-case-id]') || {}).value || '',
      submissionId: (qs(root, '[data-pflege-withdrawal-submission-id]') || {}).value || '',
    };
  }

  function validateStep1(root) {
    clearErrors(root);
    var valid = true;
    var data = readFormData(root);

    if (!data.name) {
      showError(qs(root, '[data-pflege-withdrawal-error="name"]'), 'Bitte geben Sie Ihren Vor- und Nachnamen an.');
      valid = false;
    }

    if (!data.email) {
      showError(qs(root, '[data-pflege-withdrawal-error="email"]'), 'Bitte geben Sie Ihre E-Mail-Adresse an.');
      valid = false;
    } else if (!isValidEmail(data.email)) {
      showError(qs(root, '[data-pflege-withdrawal-error="email"]'), 'Bitte geben Sie eine gültige E-Mail-Adresse an.');
      valid = false;
    }

    if (!data.orderInfo) {
      showError(
        qs(root, '[data-pflege-withdrawal-error="order-info"]'),
        'Bitte geben Sie Angaben zur Bestellung an (Bestellnummer oder Bestelldatum und Artikel).'
      );
      valid = false;
    }

    if (!data.scope) {
      showError(qs(root, '[data-pflege-withdrawal-error="scope"]'), 'Bitte wählen Sie den Umfang des Widerrufs.');
      valid = false;
    } else if (data.scope === 'partial' && !data.partialItems) {
      showError(
        qs(root, '[data-pflege-withdrawal-error="partial-items"]'),
        'Bitte nennen Sie die Artikel, die Sie widerrufen möchten.'
      );
      valid = false;
    }

    return valid ? data : null;
  }

  function renderSummary(root, data) {
    var dl = qs(root, '[data-pflege-withdrawal-summary]');
    if (!dl) return;

    var rows = [
      ['Name', data.name],
      ['E-Mail-Adresse', data.email],
      ['Angaben zur Bestellung', data.orderInfo],
      ['Umfang des Widerrufs', getScopeLabel(data.scope)],
    ];

    if (data.scope === 'partial') {
      rows.push(['Betroffene Artikel', data.partialItems]);
    }

    if (data.orderDate) {
      rows.push(['Bestelldatum', data.orderDate]);
    }

    if (data.message) {
      rows.push(['Zusätzliche Nachricht', data.message]);
    }

    rows.push(['Vorgangsnummer', data.caseId]);

    dl.innerHTML = rows
      .map(function (row) {
        return (
          '<div class="pflege-withdrawal__summary-row">' +
          '<dt>' +
          row[0] +
          '</dt>' +
          '<dd>' +
          escapeHtml(row[1]) +
          '</dd>' +
          '</div>'
        );
      })
      .join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasWiderrufQuery() {
    return /(?:^|[?&])widerruf=1(?:&|$)/.test(window.location.search);
  }

  function buildSuccessHtml(data) {
    var emailLine = data.email
      ? ' Eine Eingangsbestätigung wurde an <strong>' + escapeHtml(data.email) + '</strong> gesendet.'
      : '';
    var receiptBlock = data.receipt
      ? '<pre class="pflege-withdrawal__receipt-pre">' + escapeHtml(data.receipt) + '</pre>'
      : '';

    return (
      '<div class="pflege-withdrawal__success" data-pflege-withdrawal-success role="status" tabindex="-1">' +
      '<h2 class="pflege-withdrawal__success-title">Ihr Widerruf wurde übermittelt</h2>' +
      '<p class="pflege-withdrawal__success-lead">Wir haben Ihre Widerrufserklärung am <strong>' +
      escapeHtml(data.date) +
      '</strong> um <strong>' +
      escapeHtml(data.time) +
      ' Uhr (' +
      escapeHtml(data.tz) +
      ')</strong> erhalten.' +
      emailLine +
      '</p>' +
      '<p class="pflege-withdrawal__success-case" data-pflege-withdrawal-success-case>' +
      '<strong>Vorgangsnummer:</strong> <span data-pflege-withdrawal-case-display>' +
      escapeHtml(data.caseId) +
      '</span></p>' +
      '<p class="pflege-withdrawal__success-note">Diese Bestätigung bezieht sich ausschließlich auf den Eingang Ihrer Erklärung — nicht auf eine rechtliche Prüfung oder die Rückabwicklung des Vertrags.</p>' +
      '<article class="pflege-withdrawal__receipt" aria-labelledby="pflege-withdrawal-receipt-title">' +
      '<h3 id="pflege-withdrawal-receipt-title" class="pflege-withdrawal__receipt-title">Ihre übermittelten Angaben</h3>' +
      receiptBlock +
      '<button type="button" class="pflege-withdrawal__print" data-pflege-withdrawal-print>Bestätigung drucken / als PDF speichern</button>' +
      '</article></div>'
    );
  }

  function readStoredSuccess() {
    var caseId = sessionStorage.getItem('pflege-wd-last-case-id');
    if (!caseId) return null;

    var stampRaw = sessionStorage.getItem('pflege-wd-last-stamp');
    var stamp = null;
    if (stampRaw) {
      try {
        stamp = JSON.parse(stampRaw);
      } catch (e) {
        stamp = null;
      }
    }
    if (!stamp) stamp = nowStamp();

    return {
      caseId: caseId,
      email: sessionStorage.getItem('pflege-wd-last-email') || '',
      receipt: sessionStorage.getItem('pflege-wd-last-receipt') || '',
      date: stamp.date,
      time: stamp.time,
      tz: stamp.tz,
    };
  }

  function showClientSuccess(root, form) {
    var data = readStoredSuccess();
    if (!data) return false;

    var intro = qs(root, '.pflege-withdrawal__page-intro');
    if (intro) intro.hidden = true;

    form.innerHTML = buildSuccessHtml(data);
    var success = qs(root, '[data-pflege-withdrawal-success]');
    if (success) {
      var printBtn = qs(root, '[data-pflege-withdrawal-print]');
      if (printBtn) {
        printBtn.addEventListener('click', function () {
          window.print();
        });
      }
      success.focus();
      if (typeof success.scrollIntoView === 'function') {
        success.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    return true;
  }

  function setStep(root, step) {
    var step1 = qs(root, '[data-pflege-withdrawal-step="1"]');
    var step2 = qs(root, '[data-pflege-withdrawal-step="2"]');
    if (step1) step1.hidden = step !== 1;
    if (step2) step2.hidden = step !== 2;

    if (step === 2) {
      var confirmBtn = qs(root, '[data-pflege-withdrawal-confirm]');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.removeAttribute('aria-busy');
      }
      var title = qs(step2, '.pflege-withdrawal__step-title');
      if (title) title.focus();
    } else if (step === 1) {
      var formTitle = qs(root, '#pflege-withdrawal-form-title');
      if (formTitle) formTitle.focus();
    }
  }

  function syncHiddenFields(root, data, stamp) {
    var caseInput = qs(root, '[data-pflege-withdrawal-case-id]');
    var subInput = qs(root, '[data-pflege-withdrawal-submission-id]');
    var bodyInput = qs(root, '[data-pflege-withdrawal-body]');

    if (!data.caseId) {
      data.caseId = generateCaseId();
      if (caseInput) caseInput.value = data.caseId;
    }
    if (!data.submissionId) {
      data.submissionId = generateSubmissionId();
      if (subInput) subInput.value = data.submissionId;
    }

    var scopeHidden = qs(root, '[data-pflege-withdrawal-scope-hidden]');
    var orderHidden = qs(root, '[data-pflege-withdrawal-order-hidden]');
    var itemsHidden = qs(root, '[data-pflege-withdrawal-items-hidden]');
    var dateHidden = qs(root, '[data-pflege-withdrawal-date-hidden]');
    var msgHidden = qs(root, '[data-pflege-withdrawal-message-hidden]');

    if (scopeHidden) scopeHidden.value = getScopeLabel(data.scope);
    if (orderHidden) orderHidden.value = data.orderInfo;
    if (itemsHidden) {
      itemsHidden.value = data.scope === 'partial' ? data.partialItems : 'Gesamte Bestellung';
    }
    if (dateHidden) dateHidden.value = data.orderDate;
    if (msgHidden) msgHidden.value = data.message;
    if (bodyInput) bodyInput.value = buildBody(data, stamp);
  }

  function togglePartialField(root) {
    var checked = qs(root, '[data-pflege-withdrawal-scope]:checked');
    var wrap = qs(root, '[data-pflege-withdrawal-partial-wrap]');
    var items = qs(root, '[data-pflege-withdrawal-partial-items]');
    if (!wrap) return;

    var isPartial = checked && checked.value === 'partial';
    wrap.hidden = !isPartial;
    if (items) {
      if (isPartial) {
        items.setAttribute('required', 'required');
        items.setAttribute('aria-required', 'true');
      } else {
        items.removeAttribute('required');
        items.removeAttribute('aria-required');
        items.value = '';
      }
    }
  }

  function enhanceSuccess(root, success) {
    var caseWrap = qs(success, '[data-pflege-withdrawal-success-case]');
    var caseDisplay = qs(success, '[data-pflege-withdrawal-case-display]');
    var caseId = sessionStorage.getItem('pflege-wd-last-case-id');

    if (!caseId) {
      var pre = qs(root, '.pflege-withdrawal__receipt-pre');
      if (pre && pre.textContent) {
        var match = pre.textContent.match(/Vorgangsnummer:\s*(WD-[^\n\r]+)/);
        if (match) caseId = trim(match[1]);
      }
    }

    if (caseId && caseWrap && caseDisplay) {
      caseDisplay.textContent = caseId;
      caseWrap.hidden = false;
    }
  }

  function initWithdrawal(root) {
    if (!root || root.getAttribute('data-pflege-withdrawal-initialized') === 'true') return;
    root.setAttribute('data-pflege-withdrawal-initialized', 'true');

    var form = qs(root, '[data-pflege-withdrawal-form]');
    if (!form) return;

    if (!qs(root, '[data-pflege-withdrawal-success]') && root.hasAttribute('data-pflege-withdrawal-query-success')) {
      if (showClientSuccess(root, form)) return;
    }

    var success = qs(root, '[data-pflege-withdrawal-success]');
    if (success) {
      enhanceSuccess(root, success);
      success.focus();
      var printBtn = qs(root, '[data-pflege-withdrawal-print]');
      if (printBtn) {
        printBtn.addEventListener('click', function () {
          window.print();
        });
      }
      return;
    }

    qsa(root, '[data-pflege-withdrawal-scope]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        togglePartialField(root);
      });
    });
    togglePartialField(root);

    var reviewBtn = qs(root, '[data-pflege-withdrawal-review]');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', function () {
        var data = validateStep1(root);
        if (!data) {
          var firstError = qs(root, '[data-pflege-withdrawal-error]:not([hidden])');
          if (firstError) {
            var fieldId = firstError.getAttribute('data-pflege-withdrawal-error');
            var fieldMap = {
              name: '[data-pflege-withdrawal-name]',
              email: '[data-pflege-withdrawal-email]',
              'order-info': '[data-pflege-withdrawal-order-info]',
              scope: '[data-pflege-withdrawal-scope]',
              'partial-items': '[data-pflege-withdrawal-partial-items]',
            };
            var input = qs(root, fieldMap[fieldId] || '');
            if (input) input.focus();
          }
          return;
        }

        var stamp = nowStamp();
        syncHiddenFields(root, data, stamp);
        renderSummary(root, data);
        setStep(root, 2);
      });
    }

    var editBtn = qs(root, '[data-pflege-withdrawal-edit]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        setStep(root, 1);
      });
    }

    var confirmBtn = qs(root, '[data-pflege-withdrawal-confirm]');
    var statusEl = qs(root, '[data-pflege-withdrawal-submit-status]');

    form.addEventListener('submit', function (ev) {
      var step2 = qs(root, '[data-pflege-withdrawal-step="2"]');
      if (!step2 || step2.hidden) {
        ev.preventDefault();
        return;
      }

      var data = readFormData(root);
      if (!validateStep1(root)) {
        ev.preventDefault();
        setStep(root, 1);
        return;
      }

      var submissionId = data.submissionId || generateSubmissionId();
      var storageKey = STORAGE_PREFIX + submissionId;

      if (sessionStorage.getItem(storageKey) === '1') {
        ev.preventDefault();
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.textContent =
            'Diese Widerrufserklärung wurde bereits übermittelt. Bitte laden Sie die Seite neu, wenn Sie einen weiteren Widerruf erklären möchten.';
        }
        return;
      }

      var stamp = nowStamp();
      syncHiddenFields(root, data, stamp);

      var caseInput = qs(root, '[data-pflege-withdrawal-case-id]');
      if (caseInput && caseInput.value) {
        data.caseId = caseInput.value;
      }

      var bodyInput = qs(root, '[data-pflege-withdrawal-body]');
      if (bodyInput) {
        sessionStorage.setItem('pflege-wd-last-receipt', bodyInput.value);
      }
      sessionStorage.setItem('pflege-wd-last-stamp', JSON.stringify(stamp));
      sessionStorage.setItem('pflege-wd-last-case-id', data.caseId);
      sessionStorage.setItem('pflege-wd-last-email', data.email);
      sessionStorage.setItem(storageKey, '1');

      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.setAttribute('aria-busy', 'true');
        confirmBtn.textContent = 'Wird übermittelt …';
      }
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = 'Ihre Widerrufserklärung wird übermittelt. Bitte warten …';
      }
    });

    form.addEventListener('invalid', function (ev) {
      ev.preventDefault();
      var step2 = qs(root, '[data-pflege-withdrawal-step="2"]');
      if (step2 && !step2.hidden) {
        setStep(root, 1);
        validateStep1(root);
      }
    }, true);
  }

  function init() {
    qsa(document, '[data-pflege-withdrawal]').forEach(initWithdrawal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
