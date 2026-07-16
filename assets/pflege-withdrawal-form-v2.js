/**
 * Elektronische Widerrufsfunktion (§ 356a BGB) — zweistufiger Ablauf.
 * Übermittlung per fetch() an Shopify /contact (wie Rezept-Formular).
 * Kunden-E-Mail: Google Apps Script Webhook (scripts/widerruf-email-kostenlos-apps-script.md).
 * Build: 2026-07-16-live-fix-b
 */
(function () {
  'use strict';

  var DECLARATION =
    'Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel.';

  var STORAGE_PREFIX = 'pflege-wd-submitted-';
  var SUBMIT_TIMEOUT_MS = 20000;
  var ERROR_TEXT =
    'Die Widerrufserklärung konnte nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns per E-Mail.';

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

  function bindPrintButton(root) {
    var printBtn = qs(root, '[data-pflege-withdrawal-print]');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        window.print();
      });
    }
  }

  function showClientSuccess(root, form, data) {
    var payload = data || readStoredSuccess();
    if (!payload) return false;

    var intro = qs(root, '.pflege-withdrawal__page-intro');
    if (intro) intro.hidden = true;

    form.innerHTML = buildSuccessHtml(payload);
    var success = qs(root, '[data-pflege-withdrawal-success]');
    if (success) {
      bindPrintButton(root);
      success.focus();
      if (typeof success.scrollIntoView === 'function') {
        success.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    try {
      var url = new URL(window.location.href);
      url.searchParams.set('widerruf', '1');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (e) {}

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

  function isChallengeUrl(url) {
    return String(url || '').indexOf('/challenge') !== -1 || String(url || '').indexOf('shopify-challenge') !== -1;
  }

  function hasExplicitError(html) {
    if (!html) return false;
    if (html.indexOf('data-pflege-withdrawal-sent-error') !== -1) return true;
    if (html.indexOf('pflege-withdrawal__alert--error') !== -1 && html.indexOf('role="alert"') !== -1) return true;
    return false;
  }

  function evaluateSubmitResponse(result) {
    var html = result.html || '';
    var url = result.url || '';
    if (isChallengeUrl(url) || html.indexOf('shopify-challenge') !== -1) return false;
    if (hasExplicitError(html)) return false;
    if (url.indexOf('contact_posted=true') !== -1) return true;
    if (html.indexOf('data-pflege-withdrawal-sent-marker') !== -1) return true;
    return false;
  }

  function submitContactForm(form, onComplete) {
    var action = form.getAttribute('action') || form.action || '/contact';
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timedOut = false;
    var timeoutId = window.setTimeout(function () {
      timedOut = true;
      if (controller) controller.abort();
      onComplete(false);
    }, SUBMIT_TIMEOUT_MS);

    fetch(action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
      .then(function (response) {
        return response.text().then(function (html) {
          return { ok: response.ok, url: response.url || '', html: html };
        });
      })
      .then(function (result) {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        onComplete(evaluateSubmitResponse(result));
      })
      .catch(function () {
        if (timedOut) return;
        window.clearTimeout(timeoutId);
        onComplete(false);
      });
  }

  function enhanceSuccess(root, success) {
    var caseDisplay = qs(success, '[data-pflege-withdrawal-case-display]');
    var caseId = sessionStorage.getItem('pflege-wd-last-case-id');

    if (!caseId) {
      var pre = qs(root, '.pflege-withdrawal__receipt-pre');
      if (pre && pre.textContent) {
        var match = pre.textContent.match(/Vorgangsnummer:\s*(WD-[^\n\r]+)/);
        if (match) caseId = trim(match[1]);
      }
    }

    if (caseId && caseDisplay && !caseDisplay.textContent) {
      caseDisplay.textContent = caseId;
    }
  }

  function showSubmitError(root, message) {
    var statusEl = qs(root, '[data-pflege-withdrawal-submit-status]');
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.setAttribute('role', 'alert');
      statusEl.textContent = message || ERROR_TEXT;
    }
  }

  var WEBHOOK_URL_LIVE =
    'https://script.google.com/macros/s/AKfycbx2I3NGzrUUqJlqB6D14TNf4E0KEz6tMkcJY1z6SpeVc0hvFDoKq1BlCzOZ2AVq2ART/exec';

  function resolveWebhookUrl(root) {
    var url = root.getAttribute('data-pflege-withdrawal-email-webhook');
    if (!url || url.indexOf('AKfycbx2I3NG') === -1) {
      return WEBHOOK_URL_LIVE;
    }
    return url;
  }

  function sendCustomerEmailWebhook(root, payload) {
    var url = resolveWebhookUrl(root);
    if (!url) return;

    var slimPayload = {
      type: payload.type,
      name: payload.name,
      customer_email: payload.customer_email,
      case_id: payload.case_id,
      order_info: payload.order_info,
      scope: payload.scope,
      partial_items: payload.partial_items,
      message: payload.message,
      received_date: payload.received_date,
      received_time: payload.received_time,
      timezone: payload.timezone,
    };

    sendWebhookViaHiddenForm(url, slimPayload);
    sendWebhookViaGetImage(url, slimPayload);

    try {
      var json = JSON.stringify(slimPayload);
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        var blob = new Blob([json], { type: 'text/plain;charset=UTF-8' });
        navigator.sendBeacon(url, blob);
      }
    } catch (e) {}

    try {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(slimPayload),
      }).catch(function () {});
    } catch (e2) {}
  }

  function sendWebhookViaHiddenForm(url, payload) {
    try {
      var frameId = 'pflege-wd-webhook-frame';
      var frame = document.getElementById(frameId);
      if (!frame) {
        frame = document.createElement('iframe');
        frame.id = frameId;
        frame.name = frameId;
        frame.title = 'Widerruf Webhook';
        frame.setAttribute('aria-hidden', 'true');
        frame.style.cssText = 'display:none;width:0;height:0;border:0;';
        document.body.appendChild(frame);
      }

      var form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = frameId;
      form.style.display = 'none';
      form.setAttribute('accept-charset', 'UTF-8');

      Object.keys(payload).forEach(function (key) {
        var value = payload[key];
        if (value == null || value === '') return;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      window.setTimeout(function () {
        if (form.parentNode) form.parentNode.removeChild(form);
      }, 3000);
    } catch (e) {}
  }

  function sendWebhookViaGetImage(url, payload) {
    try {
      var keys = Object.keys(payload);
      var params = [];

      keys.forEach(function (key) {
        var value = payload[key];
        if (value == null || value === '') return;
        params.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
      });

      if (!params.length) return;

      var getUrl = url + (url.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
      var img = new Image();
      img.alt = '';
      img.src = getUrl;
    } catch (e) {}
  }

  function buildWebhookPayload(data, stamp, receipt) {
    return {
      type: 'widerruf',
      shop: window.location.hostname || '',
      name: data.name,
      customer_email: data.email,
      case_id: data.caseId,
      order_info: data.orderInfo,
      scope: getScopeLabel(data.scope),
      partial_items: data.scope === 'partial' ? data.partialItems : 'Gesamte Bestellung',
      order_date: data.orderDate || '',
      message: data.message || '',
      declaration: DECLARATION,
      received_date: stamp.date,
      received_time: stamp.time,
      timezone: stamp.tz,
      receipt: receipt,
    };
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
      bindPrintButton(root);
      success.focus();
      return;
    }

    var isSubmitting = false;
    var submitSettled = false;

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

    function resetSubmitUi() {
      isSubmitting = false;
      submitSettled = false;
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.removeAttribute('aria-busy');
        confirmBtn.textContent = 'Widerruf bestätigen';
      }
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      if (isSubmitting || submitSettled) return;

      var step2 = qs(root, '[data-pflege-withdrawal-step="2"]');
      if (!step2 || step2.hidden) {
        return;
      }

      var data = validateStep1(root);
      if (!data) {
        setStep(root, 1);
        return;
      }

      var submissionId = data.submissionId || generateSubmissionId();
      var storageKey = STORAGE_PREFIX + submissionId;

      if (sessionStorage.getItem(storageKey) === '1') {
        showSubmitError(
          root,
          'Diese Widerrufserklärung wurde bereits übermittelt. Bitte laden Sie die Seite neu, wenn Sie einen weiteren Widerruf erklären möchten.'
        );
        return;
      }

      var stamp = nowStamp();
      syncHiddenFields(root, data, stamp);

      var caseInput = qs(root, '[data-pflege-withdrawal-case-id]');
      if (caseInput && caseInput.value) {
        data.caseId = caseInput.value;
      }

      var bodyInput = qs(root, '[data-pflege-withdrawal-body]');
      var receipt = bodyInput ? bodyInput.value : buildBody(data, stamp);

      sessionStorage.setItem('pflege-wd-last-receipt', receipt);
      sessionStorage.setItem('pflege-wd-last-stamp', JSON.stringify(stamp));
      sessionStorage.setItem('pflege-wd-last-case-id', data.caseId);
      sessionStorage.setItem('pflege-wd-last-email', data.email);

      isSubmitting = true;
      submitSettled = false;

      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.setAttribute('aria-busy', 'true');
        confirmBtn.textContent = 'Wird übermittelt …';
      }
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.removeAttribute('role');
        statusEl.textContent = 'Ihre Widerrufserklärung wird übermittelt. Bitte warten …';
      }

      submitContactForm(form, function (ok) {
        if (submitSettled) return;
        submitSettled = true;

        if (ok) {
          sessionStorage.setItem(storageKey, '1');
          var payload = {
            caseId: data.caseId,
            email: data.email,
            receipt: receipt,
            date: stamp.date,
            time: stamp.time,
            tz: stamp.tz,
          };
          sendCustomerEmailWebhook(root, buildWebhookPayload(data, stamp, receipt));
          showClientSuccess(root, form, payload);
          isSubmitting = false;
          return;
        }

        resetSubmitUi();
        showSubmitError(root, ERROR_TEXT);
      });
    });

    form.addEventListener(
      'invalid',
      function (ev) {
        ev.preventDefault();
        var step2 = qs(root, '[data-pflege-withdrawal-step="2"]');
        if (step2 && !step2.hidden) {
          setStep(root, 1);
          validateStep1(root);
        }
      },
      true
    );
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
