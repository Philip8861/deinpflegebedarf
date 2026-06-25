(function () {
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
        recoverPanel.querySelector('input, button')?.focus();
      });
    });

    root.querySelectorAll('[data-pflege-login-show-login]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        recoverPanel.hidden = true;
        loginPanel.hidden = false;
        loginPanel.querySelector('#CustomerEmail')?.focus();
      });
    });

    if (window.location.hash === '#recover') {
      loginPanel.hidden = true;
      recoverPanel.hidden = false;
    }
  }

  document.querySelectorAll('[data-pflege-customer-login]').forEach(function (root) {
    initPasswordToggles(root);
    initPanels(root);
  });
})();
