/**
 * PflegeShop — Inkontinenz Testpaket Modal
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var ROOT_OPEN_CLASS = 'pflege-inko-modal-open';
  var ERROR_TEXT =
    'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.';
  var SUBMITTING_TEXT = 'Wird gesendet …';
  var SUBMIT_TEXT = 'Jetzt kostenlos anfragen';

  function focusables(root) {
    return root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

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

    if (!firstname.value.trim()) {
      setFieldError(firstname, 'required');
      firstInvalid = firstInvalid || firstname;
    }
    if (!lastname.value.trim()) {
      setFieldError(lastname, 'required');
      firstInvalid = firstInvalid || lastname;
    }
    if (!phone.value.trim()) {
      setFieldError(phone, 'required');
      firstInvalid = firstInvalid || phone;
    }
    if (!email.value.trim() || !isEmail(email.value)) {
      setFieldError(email, 'invalid');
      firstInvalid = firstInvalid || email;
    }
    if (!consent.checked) {
      setFieldError(consent, 'required');
      firstInvalid = firstInvalid || consent;
    }

    if (firstInvalid) {
      firstInvalid.focus();
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
    if (root.parentElement !== document.body) {
      document.body.appendChild(root);
    }

    var lastFocused = null;
    var openTrigger = document.querySelector('[data-pflege-inko-testpaket-open]');
    var form = root.querySelector('[data-pflege-inko-testpaket-form]');
    var formPanel = root.querySelector('[data-pflege-inko-form-panel]');
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
      if (formPanel) formPanel.hidden = true;
      if (successPanel) {
        successPanel.hidden = false;
        var btn = successPanel.querySelector('[data-pflege-inko-modal-close]');
        if (btn) btn.focus();
      }
    }

    function resetFormState() {
      hideError();
      if (form) {
        form.reset();
        clearFieldErrors(form);
      }
      if (formPanel) formPanel.hidden = false;
      if (successPanel) successPanel.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = SUBMIT_TEXT;
      }
      isSubmitting = false;
    }

    function open() {
      lastFocused = document.activeElement;
      resetFormState();
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function () {
        root.classList.add('is-open');
      });
      document.documentElement.classList.add(ROOT_OPEN_CLASS);

      var first = root.querySelector('.pflege-inko-modal__close');
      if (first && typeof first.focus === 'function') {
        try {
          first.focus();
        } catch (e) {}
      }
    }

    function close() {
      root.classList.remove('is-open');
      root.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove(ROOT_OPEN_CLASS);

      window.setTimeout(function () {
        if (!root.classList.contains('is-open')) {
          root.hidden = true;
          resetFormState();
        }
      }, 200);

      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    }

    function onKeydown(e) {
      if (root.hidden || !root.classList.contains('is-open')) return;

      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'Tab' || e.keyCode === 9) {
        var nodes = focusables(root);
        if (!nodes.length) return;
        var firstNode = nodes[0];
        var lastNode = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        } else if (!e.shiftKey && document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    }

    function onSubmit(e) {
      e.preventDefault();
      if (isSubmitting || !form) return;

      hideError();
      var data = validateForm(form);
      if (!data) return;

      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = SUBMITTING_TEXT;
      }

      var payload = new FormData(form);
      payload.set('contact[name]', data.firstname + ' ' + data.lastname);
      payload.set('contact[body]', buildBody(data));

      fetch('/contact#contact_form', {
        method: 'POST',
        body: payload,
        headers: {
          Accept: 'application/json',
        },
      })
        .then(function (response) {
          if (!response.ok) throw new Error('submit_failed');
          return response
            .json()
            .then(function (json) {
              if (json && (json.posted_successfully === true || json.status === 'success')) {
                return true;
              }
              throw new Error('submit_failed');
            })
            .catch(function () {
              return true;
            });
        })
        .then(function () {
          showSuccess();
          isSubmitting = false;
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
      el.addEventListener('click', close);
    });

    if (form) {
      form.addEventListener('submit', onSubmit);
    }

    document.addEventListener('keydown', onKeydown);
  }

  function start() {
    document.querySelectorAll('[data-pflege-inko-testpaket-modal]').forEach(initModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
