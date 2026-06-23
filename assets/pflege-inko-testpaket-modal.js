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
  var CONTACT_ENDPOINT = '/contact#contact_form';

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

  function initModal(root) {
    if (!root || root.dataset.pflegeInkoModalInit) return;
    root.dataset.pflegeInkoModalInit = 'true';

    var lastFocused = null;
    var openTrigger = document.querySelector('[data-pflege-inko-testpaket-open]');
    var form = root.querySelector('[data-pflege-inko-testpaket-form]');
    var mainPanel = root.querySelector('[data-pflege-inko-main]');
    var successPanel = root.querySelector('[data-pflege-inko-success]');
    var errorEl = root.querySelector('[data-pflege-inko-form-error]');
    var submitBtn = root.querySelector('[data-pflege-inko-submit]');
    var isSubmitting = false;

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

    function resetFormState() {
      hideError();
      if (form) {
        form.reset();
        clearFieldErrors(form);
      }
      if (mainPanel) mainPanel.hidden = false;
      if (successPanel) successPanel.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
      isSubmitting = false;
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
      e.preventDefault();
      e.stopPropagation();
      if (isSubmitting || !form) return;

      hideError();
      var data = validateForm(form);
      if (!data) {
        showError(VALIDATION_TEXT);
        return;
      }

      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = SUBMITTING_TEXT;
      }

      var payload = new FormData(form);
      payload.set('contact[name]', data.firstname + ' ' + data.lastname);
      payload.set('contact[body]', buildBody(data));

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        body: payload,
        headers: {
          Accept: 'application/json',
        },
      })
        .then(function (response) {
          return response.json().then(function (json) {
            return { ok: response.ok, json: json };
          });
        })
        .then(function (result) {
          if (result.ok && result.json && result.json.posted_successfully === true) {
            showSuccess();
            isSubmitting = false;
            return;
          }
          throw new Error('submit_failed');
        })
        .catch(function () {
          showError(ERROR_TEXT);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = SUBMIT_TEXT;
          }
          isSubmitting = false;
        });
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
      form.addEventListener('submit', onSubmit, true);
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
