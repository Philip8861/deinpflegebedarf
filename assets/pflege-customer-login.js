(function () {
  'use strict';

  var IFRAME_NAME = 'pflege-customer-auth-frame';
  var SUBMIT_TIMEOUT_MS = 25000;
  var GENERIC_ERROR =
    'Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Eingaben und versuchen Sie es erneut.';

  function initPasswordToggles(root) {
    root.querySelectorAll('[data-pflege-login-password-toggle]').forEach(function (btn) {
      if (btn.dataset.pflegeLoginPwBound) return;
      btn.dataset.pflegeLoginPwBound = 'true';
      var inputId = btn.getAttribute('data-target');
      var input = inputId ? document.getElementById(inputId) : null;
      if (!input) return;

      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        btn.setAttribute(
          'aria-label',
          show ? 'Passwort verbergen' : 'Passwort anzeigen'
        );
      });
    });
  }

  function initPanels(root) {
    var loginPanel = root.querySelector('[data-pflege-login-panel="login"]');
    var recoverPanel = root.querySelector('[data-pflege-login-panel="recover"]');
    if (!loginPanel || !recoverPanel) return;

    root.querySelectorAll('[data-pflege-login-show-recover]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        loginPanel.hidden = true;
        recoverPanel.hidden = false;
        var email = loginPanel.querySelector('#CustomerEmail');
        var recoverEmail = recoverPanel.querySelector('#RecoverEmail');
        if (email && recoverEmail && email.value) recoverEmail.value = email.value;
        var focusEl = recoverPanel.querySelector('input, button');
        if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
      });
    });

    root.querySelectorAll('[data-pflege-login-show-login]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        recoverPanel.hidden = true;
        loginPanel.hidden = false;
        var emailInput = loginPanel.querySelector('#CustomerEmail');
        if (emailInput && typeof emailInput.focus === 'function') emailInput.focus();
      });
    });

    if (window.location.hash === '#recover') {
      loginPanel.hidden = true;
      recoverPanel.hidden = false;
    }
  }

  function ensureIframe() {
    var iframe = document.getElementById(IFRAME_NAME);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = IFRAME_NAME;
      iframe.name = IFRAME_NAME;
      iframe.title = 'hidden';
      iframe.hidden = true;
      iframe.setAttribute('tabindex', '-1');
      iframe.style.cssText =
        'position:absolute;width:0;height:0;border:0;clip:rect(0,0,0,0);overflow:hidden';
      document.body.appendChild(iframe);
    }
    return iframe;
  }

  function isAccountSuccessPath(pathname) {
    if (!pathname || pathname.indexOf('/account') === -1) return false;
    if (pathname.indexOf('/login') !== -1) return false;
    if (pathname.indexOf('/register') !== -1) return false;
    if (pathname.indexOf('/activate') !== -1) return false;
    if (pathname.indexOf('/reset') !== -1) return false;
    return true;
  }

  function extractErrors(doc) {
    if (!doc) return '';
    var box = doc.querySelector('[data-pflege-auth-error]');
    if (box && box.innerHTML.trim()) return box.innerHTML.trim();

    var errors = doc.querySelector('.pflege-customer-login__errors');
    if (errors && errors.textContent.trim()) return errors.innerHTML.trim();

    var legacy = doc.querySelector('ul.errors, .form__message');
    if (legacy && legacy.textContent.trim()) return legacy.innerHTML.trim();

    return '';
  }

  function showFormError(form, html) {
    var box = form.querySelector('[data-pflege-auth-error]');
    if (!box) return;
    if (html) {
      box.innerHTML = html;
      box.hidden = false;
      box.setAttribute('tabindex', '-1');
      try {
        box.focus({ preventScroll: true });
      } catch (e) {
        box.focus();
      }
    } else {
      box.innerHTML = '';
      box.hidden = true;
    }
  }

  function setSubmitting(form, isSubmitting) {
    var btn = form.querySelector('[data-pflege-auth-submit]');
    if (!btn) return;
    var label = btn.querySelector('[data-pflege-auth-submit-text]');
    if (!label) return;
    if (!label.dataset.pflegeAuthDefaultText) {
      label.dataset.pflegeAuthDefaultText = label.textContent.trim();
    }
    btn.disabled = isSubmitting;
    label.textContent = isSubmitting ? 'Wird verarbeitet …' : label.dataset.pflegeAuthDefaultText;
  }

  function submitAuthForm(form, accountUrl, onSuccess, onError) {
    var iframe = ensureIframe();
    var settled = false;

    function finishSuccess(href) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      iframe.removeEventListener('load', onLoad);
      setSubmitting(form, false);
      onSuccess(href);
    }

    function finishError(message) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      iframe.removeEventListener('load', onLoad);
      setSubmitting(form, false);
      onError(message);
    }

    function onLoad() {
      try {
        var loc = iframe.contentWindow.location;
        var path = loc.pathname || '';
        var href = loc.href || '';

        if (isAccountSuccessPath(path)) {
          finishSuccess(href || accountUrl);
          return;
        }

        var doc = iframe.contentDocument;
        var errHtml = extractErrors(doc);
        if (errHtml) {
          finishError(errHtml);
          return;
        }

        if (path.indexOf('/challenge') !== -1) {
          finishSuccess(href);
        }
      } catch (e) {
        /* ignore transient load states */
      }
    }

    var timeoutId = setTimeout(function () {
      finishError(GENERIC_ERROR);
    }, SUBMIT_TIMEOUT_MS);

    iframe.addEventListener('load', onLoad);
    form.target = IFRAME_NAME;
    form.submit();
  }

  function initAuthForms(root) {
    var accountUrl = root.getAttribute('data-account-url') || '/account';

    root.querySelectorAll('.pflege-customer-login__form--login, .pflege-customer-login__form--register').forEach(
      function (form) {
        if (form.dataset.pflegeAuthBound) return;
        form.dataset.pflegeAuthBound = 'true';

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          showFormError(form, '');
          setSubmitting(form, true);

          submitAuthForm(
            form,
            accountUrl,
            function (href) {
              window.location.href = href || accountUrl;
            },
            function (message) {
              showFormError(form, message || GENERIC_ERROR);
            }
          );
        });
      }
    );
  }

  document.querySelectorAll('[data-pflege-customer-login]').forEach(function (root) {
    initPasswordToggles(root);
    initPanels(root);
    initAuthForms(root);
  });
})();
