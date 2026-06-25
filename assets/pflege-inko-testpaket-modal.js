/**
 * PflegeShop — Inkontinenz Testpaket Modal
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var VALIDATION_TEXT =
    'Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die Datenschutzerklärung.';
  var ERROR_TEXT =
    'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.';
  var SUBMITTING_TEXT = 'Wird gesendet …';
  var SUBMIT_TEXT = 'Jetzt kostenlos anfragen';
  var IFRAME_NAME = 'pflege-inko-testpaket-frame';
  var SUCCESS_CLASS = 'pflege-inko-modal--success';
  var STATE_SUCCESS = 'success';
  var CANONICAL_MODAL_ID = 'PflegeInkoTestpaketModal-global';
  var SUBMIT_TIMEOUT_MS = 20000;

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function buildBody(data) {
    var lines = ['Anfrage: Kostenloses Testpaket Inkontinenzversorgung', ''];
    lines.push('Vorname: ' + data.firstname);
    lines.push('Nachname: ' + data.lastname);
    lines.push('Telefon: ' + data.phone);
    lines.push('Telefonisch erreichbar: ' + data.reachability);
    lines.push('E-Mail: ' + data.email);
    if (data.message) {
      lines.push('');
      lines.push('Nachricht:');
      lines.push(data.message);
    }
    return lines.join('\n');
  }

  function setFieldError(field, message) {
    if (!field) return;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    field.classList.toggle('is-invalid', !!message);
  }

  function clearFieldErrors(form) {
    form.querySelectorAll('[data-pflege-inko-field]').forEach(function (field) {
      setFieldError(field, '');
    });
  }

  function validateForm(form) {
    clearFieldErrors(form);

    var firstname = form.querySelector('[data-pflege-inko-field="firstname"]');
    var lastname = form.querySelector('[data-pflege-inko-field="lastname"]');
    var phone = form.querySelector('[data-pflege-inko-field="phone"]');
    var reachability = form.querySelector('[data-pflege-inko-field="reachability"]');
    var email = form.querySelector('[data-pflege-inko-field="email"]');
    var consent = form.querySelector('[data-pflege-inko-field="consent"]');
    var message = form.querySelector('[data-pflege-inko-field="message"]');
    var firstInvalid = null;
    var valid = true;

    if (!firstname || !firstname.value.trim()) {
      setFieldError(firstname, 'required');
      firstInvalid = firstInvalid || firstname;
      valid = false;
    }
    if (!lastname || !lastname.value.trim()) {
      setFieldError(lastname, 'required');
      firstInvalid = firstInvalid || lastname;
      valid = false;
    }
    if (!phone || !phone.value.trim()) {
      setFieldError(phone, 'required');
      firstInvalid = firstInvalid || phone;
      valid = false;
    }
    if (!reachability || !reachability.value.trim()) {
      setFieldError(reachability, 'required');
      firstInvalid = firstInvalid || reachability;
      valid = false;
    }
    if (!email || !email.value.trim() || !isEmail(email.value)) {
      setFieldError(email, 'invalid');
      firstInvalid = firstInvalid || email;
      valid = false;
    }
    if (!consent || !consent.checked) {
      setFieldError(consent, 'required');
      firstInvalid = firstInvalid || consent;
      valid = false;
    }

    if (!valid) {
      if (firstInvalid && typeof firstInvalid.focus === 'function') {
        try {
          firstInvalid.focus();
        } catch (e) {}
      }
      return null;
    }

    return {
      firstname: firstname.value.trim(),
      lastname: lastname.value.trim(),
      phone: phone.value.trim(),
      reachability: reachability.value.trim(),
      email: email.value.trim(),
      message: message ? message.value.trim() : '',
    };
  }

  function syncHiddenFields(form, data) {
    var nameField = form.querySelector('[data-pflege-inko-name]');
    var bodyField = form.querySelector('[data-pflege-inko-body]');
    if (nameField) nameField.value = data.firstname + ' ' + data.lastname;
    if (bodyField) bodyField.value = buildBody(data);
  }

  function hasExplicitError(html) {
    if (!html) return false;
    if (html.indexOf('data-pflege-inko-sent-error') !== -1) return true;
    if (html.indexOf('pflege-contact-page__alert--error') !== -1) return true;
    if (
      html.indexOf('pflege-inko-modal__form') !== -1 &&
      html.indexOf('form-status caption-large text-body') !== -1 &&
      html.indexOf('role="alert"') !== -1
    ) {
      return true;
    }
    return false;
  }

  function evaluateSubmitResponse(result) {
    var html = result.html || '';
    var url = result.url || '';

    if (isChallengeUrl(url) || html.indexOf('shopify-challenge') !== -1) return false;
    if (hasExplicitError(html)) return false;
    if (url.indexOf('contact_posted=true') !== -1) return true;
    if (isSuccessHtml(html)) return true;
    if (result.ok && html.indexOf('data-pflege-inko-sent-marker') !== -1) return true;
    return false;
  }

  function isSuccessHtml(html) {
    if (!html) return false;
    if (html.indexOf('/challenge') !== -1 || html.indexOf('shopify-challenge') !== -1) return false;
    if (html.indexOf('data-pflege-inko-sent-error') !== -1) return false;
    if (html.indexOf('data-pflege-inko-sent-marker') !== -1) return true;
    if (html.indexOf('data-pflege-contact-success') !== -1) return true;
    if (html.indexOf('contact_posted=true') !== -1) return true;
    if (html.indexOf('pflege-contact-page__alert--error') !== -1) return false;
    if (html.indexOf('form-status-list') !== -1 && html.indexOf('form-status caption-large text-body') === -1) {
      return true;
    }
    return false;
  }

  function getFrameHref(frame) {
    if (!frame || !frame.contentWindow) return '';
    try {
      return String(frame.contentWindow.location.href || '');
    } catch (e) {
      return '';
    }
  }

  function isChallengeUrl(url) {
    return url.indexOf('/challenge') !== -1 || url.indexOf('shopify-challenge') !== -1;
  }

  function isSuccessDocument(doc) {
    if (!doc || !doc.documentElement) return false;

    var url = '';
    try {
      url = doc.defaultView && doc.defaultView.location ? String(doc.defaultView.location.href) : '';
    } catch (e) {}

    if (isChallengeUrl(url)) return false;
    if (url.indexOf('contact_posted=true') !== -1) return true;
    if (doc.querySelector('[data-pflege-inko-sent-error]')) return false;
    if (doc.querySelector('[data-pflege-inko-sent-marker], [data-pflege-contact-success], .pflege-contact-success')) {
      return true;
    }
    if (doc.querySelector('.pflege-contact-page__alert--error')) return false;
    if (doc.querySelector('.pflege-inko-modal__form .form-status.caption-large.text-body[role="alert"]')) {
      return false;
    }
    if (doc.querySelector('h2.form-status.form-status-list.form__message')) return true;

    return isSuccessHtml(doc.documentElement.innerHTML || '');
  }

  function isSuccessFrame(frame) {
    var href = getFrameHref(frame);
    if (isChallengeUrl(href)) return false;
    if (href.indexOf('contact_posted=true') !== -1) return true;

    try {
      return isSuccessDocument(frame.contentDocument);
    } catch (e) {
      return false;
    }
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
          return {
            ok: response.ok,
            url: response.url || '',
            html: html,
          };
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

  function ensureSubmitFrame() {
    var frame = document.getElementById(IFRAME_NAME);
    if (frame) return frame;

    frame = document.createElement('iframe');
    frame.id = IFRAME_NAME;
    frame.name = IFRAME_NAME;
    frame.title = 'Formularübermittlung';
    frame.hidden = true;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.style.cssText =
      'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;clip:rect(0,0,0,0)';
    document.body.appendChild(frame);
    return frame;
  }

  function initModal(root) {
    if (!root || root.dataset.pflegeInkoModalInit) return;
    root.dataset.pflegeInkoModalInit = 'true';

    var lastFocused = null;
    var intentionalClose = false;
    var form = root.querySelector('.pflege-inko-modal__form');
    var mainPanel = root.querySelector('[data-pflege-inko-main]');
    var successPanel = root.querySelector('[data-pflege-inko-success]');
    var errorEl = root.querySelector('[data-pflege-inko-form-error]');
    var submitBtn = root.querySelector('[data-pflege-inko-submit]');
    var isSubmitting = false;
    var submitSettled = false;
    var submitTimeoutId = null;
    var pendingFrameLoad = null;

    function isSuccessState() {
      return root.dataset.pflegeInkoState === STATE_SUCCESS;
    }

    function showError(message) {
      if (!errorEl) return;
      errorEl.textContent = message || ERROR_TEXT;
      errorEl.hidden = false;
    }

    function hideError() {
      if (!errorEl) return;
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    function showSuccessView() {
      hideError();
      root.classList.add(SUCCESS_CLASS);
      root.dataset.pflegeInkoState = STATE_SUCCESS;
      if (mainPanel) mainPanel.setAttribute('hidden', '');
      if (successPanel) successPanel.removeAttribute('hidden');

      var btn = successPanel && successPanel.querySelector('[data-pflege-inko-modal-close]');
      if (btn && typeof btn.focus === 'function') {
        window.setTimeout(function () {
          try {
            btn.focus();
          } catch (e) {}
        }, 50);
      }
    }

    function clearSubmitWatchers() {
      if (submitTimeoutId) {
        window.clearTimeout(submitTimeoutId);
        submitTimeoutId = null;
      }
      if (pendingFrameLoad) {
        pendingFrameLoad.frame.removeEventListener('load', pendingFrameLoad.handler);
        pendingFrameLoad = null;
      }
    }

    function resetSubmitUi() {
      isSubmitting = false;
      clearSubmitWatchers();
      if (form) form.removeAttribute('target');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
    }

    function resetFormState() {
      hideError();
      root.classList.remove(SUCCESS_CLASS);
      root.dataset.pflegeInkoState = '';
      submitSettled = false;
      if (form) {
        form.reset();
        clearFieldErrors(form);
        form.removeAttribute('target');
      }
      if (mainPanel) mainPanel.removeAttribute('hidden');
      if (successPanel) successPanel.setAttribute('hidden', '');
      resetSubmitUi();
    }

    function userClose() {
      intentionalClose = true;
      resetFormState();
      if (root.open) root.close();
      intentionalClose = false;
    }

    function open() {
      if (typeof root.showModal !== 'function') return;
      lastFocused = document.activeElement;
      resetFormState();
      root.showModal();

      var first = root.querySelector('.pflege-inko-modal__close');
      if (first && typeof first.focus === 'function') {
        try {
          first.focus();
        } catch (e) {}
      }
    }

    function handleSubmitResult(success) {
      if (!isSubmitting || submitSettled) return;
      submitSettled = true;
      clearSubmitWatchers();
      if (form) form.removeAttribute('target');

      if (success) {
        showSuccessView();
        isSubmitting = false;
        if (!root.open && typeof root.showModal === 'function') {
          try {
            root.showModal();
          } catch (e) {}
        }
        return;
      }

      submitSettled = false;
      resetSubmitUi();
      showError(ERROR_TEXT);
    }

    function submitViaFetch() {
      clearSubmitWatchers();
      submitContactForm(form, function (success) {
        handleSubmitResult(success);
      });
    }

    function onSubmit(e) {
      if (isSubmitting || isSuccessState()) {
        e.preventDefault();
        return;
      }

      hideError();

      var data = validateForm(form);
      if (!data) {
        e.preventDefault();
        showError(VALIDATION_TEXT);
        return;
      }

      syncHiddenFields(form, data);
      e.preventDefault();
      isSubmitting = true;
      submitSettled = false;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = SUBMITTING_TEXT;
      }

      submitViaFetch();
    }

    root.addEventListener('close', function () {
      if (isSuccessState() && !intentionalClose) {
        window.requestAnimationFrame(function () {
          if (!isSuccessState() || intentionalClose) return;
          if (!root.open && typeof root.showModal === 'function') {
            try {
              root.showModal();
            } catch (e) {}
          }
        });
        return;
      }

      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    });

    root.addEventListener('cancel', function (e) {
      e.preventDefault();
    });

    root.addEventListener('click', function (e) {
      if (e.target !== root || isSuccessState() || isSubmitting) return;
      userClose();
    });

    if (root.id === CANONICAL_MODAL_ID || !document.getElementById(CANONICAL_MODAL_ID)) {
      document.querySelectorAll('[data-pflege-inko-testpaket-open]').forEach(function (openTrigger) {
        if (openTrigger.dataset.pflegeInkoOpenBound) return;
        openTrigger.dataset.pflegeInkoOpenBound = 'true';
        openTrigger.addEventListener('click', function (e) {
          e.preventDefault();
          open();
        });
      });
    }

    root.querySelectorAll('[data-pflege-inko-modal-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        userClose();
      });
    });

    if (form) {
      form.addEventListener('submit', onSubmit);
      form.setAttribute('novalidate', 'novalidate');
    }
  }

  function start() {
    var canonical = document.getElementById(CANONICAL_MODAL_ID);
    if (canonical) {
      initModal(canonical);
      return;
    }
    document.querySelectorAll('dialog[data-pflege-inko-testpaket-modal]').forEach(initModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
