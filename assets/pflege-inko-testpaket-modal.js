/**
 * PflegeShop — Inkontinenz Testpaket Modal
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var ERROR_TEXT =
    'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.';
  var VALIDATION_TEXT =
    'Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die Datenschutzerklärung.';
  var SUBMITTING_TEXT = 'Wird gesendet …';
  var SUBMIT_TEXT = 'Jetzt kostenlos anfragen';
  var IFRAME_NAME = 'pflege-inko-testpaket-frame';
  var SUBMIT_TIMEOUT_MS = 20000;

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function buildBody(data) {
    var lines = ['Anfrage: Kostenloses Testpaket Inkontinenzversorgung', ''];
    lines.push('Vorname: ' + data.firstname);
    lines.push('Nachname: ' + data.lastname);
    lines.push('Telefon: ' + data.phone);
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

  function ensureSubmitFrame() {
    var frame = document.getElementById(IFRAME_NAME);
    if (frame) return frame;

    frame = document.createElement('iframe');
    frame.id = IFRAME_NAME;
    frame.name = IFRAME_NAME;
    frame.title = 'Formularübermittlung';
    frame.hidden = true;
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText =
      'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;clip:rect(0,0,0,0)';
    document.body.appendChild(frame);
    return frame;
  }

  function responseLooksSuccessful(html) {
    if (!html) return false;
    return (
      /form-status|form-success|form__message|posted_successfully|contact_posted=true/i.test(html) ||
      /Danke.*Kontakt|Vielen Dank|erfolgreich übermittelt|erfolgreich gesendet/i.test(html)
    );
  }

  function responseLooksFailed(html) {
    if (!html) return false;
    return (
      /form__message--error|field__input--error|class="errors"|default_errors|There was an error/i.test(html) ||
      /Verifying your connection|challenge-platform|hcaptcha/i.test(html)
    );
  }

  function initModal(root) {
    if (!root || root.dataset.pflegeInkoModalInit) return;
    root.dataset.pflegeInkoModalInit = 'true';

    var lastFocused = null;
    var openTrigger = document.querySelector('[data-pflege-inko-testpaket-open]');
    var form = root.querySelector('.pflege-inko-modal__form');
    var mainPanel = root.querySelector('[data-pflege-inko-main]');
    var successPanel = root.querySelector('[data-pflege-inko-success]');
    var errorEl = root.querySelector('[data-pflege-inko-form-error]');
    var submitBtn = root.querySelector('[data-pflege-inko-submit]');
    var isSubmitting = false;
    var submitTimeout = null;
    var submitFrame = ensureSubmitFrame();

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

    function showSuccess() {
      hideError();
      if (mainPanel) mainPanel.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        var btn = successPanel.querySelector('[data-pflege-inko-modal-close]');
        if (btn && typeof btn.focus === 'function') {
          try {
            btn.focus();
          } catch (e) {}
        }
      }
    }

    function clearSubmitTimeout() {
      if (submitTimeout) {
        clearTimeout(submitTimeout);
        submitTimeout = null;
      }
    }

    function resetSubmitUi() {
      clearSubmitTimeout();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
      isSubmitting = false;
      if (form) form.removeAttribute('target');
    }

    function resetFormState() {
      hideError();
      if (form) {
        form.reset();
        clearFieldErrors(form);
        form.removeAttribute('target');
      }
      if (mainPanel) mainPanel.hidden = false;
      if (successPanel) successPanel.hidden = true;
      resetSubmitUi();
    }

    function finishWithError() {
      resetSubmitUi();
      showError(ERROR_TEXT);
    }

    function finishWithSuccess() {
      clearSubmitTimeout();
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
      if (form) form.removeAttribute('target');
      showSuccess();
    }

    function closeModal() {
      if (root.open) root.close();
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

    function handleFrameLoad() {
      if (!isSubmitting) return;

      var html = '';
      try {
        var doc = submitFrame.contentDocument || submitFrame.contentWindow.document;
        html = doc && doc.documentElement ? doc.documentElement.innerHTML : '';
      } catch (e) {
        finishWithError();
        return;
      }

      if (!html || html.length < 80) return;

      if (responseLooksFailed(html)) {
        finishWithError();
        return;
      }

      if (responseLooksSuccessful(html)) {
        finishWithSuccess();
        return;
      }

      if (html.length > 400) {
        finishWithSuccess();
      }
    }

    submitFrame.addEventListener('load', handleFrameLoad);

    root.addEventListener('close', function () {
      resetFormState();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    });

    root.addEventListener('click', function (e) {
      if (e.target === root) closeModal();
    });

    function onSubmit(e) {
      if (isSubmitting) return;

      hideError();
      var data = validateForm(form);
      if (!data) {
        e.preventDefault();
        showError(VALIDATION_TEXT);
        return;
      }

      syncHiddenFields(form, data);

      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = SUBMITTING_TEXT;
      }

      form.setAttribute('target', IFRAME_NAME);

      clearSubmitTimeout();
      submitTimeout = setTimeout(function () {
        if (isSubmitting) finishWithError();
      }, SUBMIT_TIMEOUT_MS);

      // Native Submit zulassen (Shopify hCaptcha / Bot-Schutz)
    }

    if (openTrigger) {
      openTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    }

    root.querySelectorAll('[data-pflege-inko-modal-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });

    if (form) {
      form.addEventListener('submit', onSubmit);
      form.setAttribute('novalidate', 'novalidate');
    }
  }

  function start() {
    document.querySelectorAll('dialog[data-pflege-inko-testpaket-modal]').forEach(initModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
