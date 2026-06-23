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

    ensureSubmitFrame();

    var lastFocused = null;
    var openTrigger = document.querySelector('[data-pflege-inko-testpaket-open]');
    var form = root.querySelector('.pflege-inko-modal__form');
    var mainPanel = root.querySelector('[data-pflege-inko-main]');
    var successPanel = root.querySelector('[data-pflege-inko-success]');
    var errorEl = root.querySelector('[data-pflege-inko-form-error]');
    var submitBtn = root.querySelector('[data-pflege-inko-submit]');
    var isSubmitting = false;

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

    function resetSubmitUi() {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
    }

    function resetFormState() {
      hideError();
      root.classList.remove(SUCCESS_CLASS);
      root.dataset.pflegeInkoState = '';
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
      resetFormState();
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

    function prepareIframeSubmit() {
      ensureSubmitFrame();
      form.setAttribute('target', IFRAME_NAME);
    }

    function sendFormNative() {
      prepareIframeSubmit();
      form.submit();
      form.removeAttribute('target');
      showSuccessView();
    }

    function submitToShopify() {
      if (window.Shopify && window.Shopify.captcha && typeof window.Shopify.captcha.protect === 'function') {
        window.Shopify.captcha.protect(form, sendFormNative);
        return;
      }
      sendFormNative();
    }

    function onSubmit(e) {
      e.preventDefault();

      if (isSubmitting || isSuccessState()) return;

      hideError();

      var data = validateForm(form);
      if (!data) {
        showError(VALIDATION_TEXT);
        return;
      }

      syncHiddenFields(form, data);
      isSubmitting = true;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = SUBMITTING_TEXT;
      }

      try {
        submitToShopify();
      } catch (err) {
        resetSubmitUi();
        showError(ERROR_TEXT);
      }
    }

    root.addEventListener('close', function () {
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    });

    root.addEventListener('cancel', function (e) {
      if (isSuccessState()) e.preventDefault();
    });

    root.addEventListener('click', function (e) {
      if (e.target === root && !isSuccessState()) userClose();
    });

    if (openTrigger) {
      openTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    }

    root.querySelectorAll('[data-pflege-inko-modal-close]').forEach(function (el) {
      el.addEventListener('click', userClose);
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
