(function () {
  var root = document.querySelector('[data-pflege-withdrawal]');
  if (!root) return;

  var toggle = root.querySelector('[data-pflege-withdrawal-toggle]');
  var panel = root.querySelector('[data-pflege-withdrawal-panel]');
  var form = root.querySelector('[data-pflege-withdrawal-form]');
  var success = root.querySelector('[data-pflege-withdrawal-success]');

  function setPanelOpen(open) {
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      setPanelOpen(!isOpen);
      if (!isOpen && success) {
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (success) {
    setPanelOpen(true);
  }

  var printBtn = root.querySelector('[data-pflege-withdrawal-print]');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      document.body.classList.add('pflege-withdrawal-print-mode');
      window.print();
      window.addEventListener(
        'afterprint',
        function () {
          document.body.classList.remove('pflege-withdrawal-print-mode');
        },
        { once: true }
      );
    });
  }

  var receipt = root.querySelector('[data-pflege-withdrawal-receipt]');
  if (receipt && success) {
    try {
      var stored = sessionStorage.getItem('pflege_withdrawal_receipt');
      if (stored) {
        var data = JSON.parse(stored);
        var pre = receipt.querySelector('.pflege-withdrawal__receipt-pre');
        if (pre && !pre.textContent.trim() && data.body) pre.textContent = data.body;
        var emailNote = root.querySelector('[data-pflege-withdrawal-email-note] strong');
        if (emailNote && !emailNote.textContent.trim() && data.email) emailNote.textContent = data.email;
      }
      sessionStorage.removeItem('pflege_withdrawal_receipt');
    } catch (e) {
      /* ignore */
    }
  }

  if (!form) return;

  form.addEventListener('submit', function (event) {
    var bodyField = form.querySelector('[data-pflege-withdrawal-body]');
    if (!bodyField) return;

    var name = (form.querySelector('[data-pflege-withdrawal-name]') || {}).value || '';
    var email = (form.querySelector('[data-pflege-withdrawal-email]') || {}).value || '';
    var order = (form.querySelector('[data-pflege-withdrawal-order]') || {}).value || '';
    var ordered = (form.querySelector('[data-pflege-withdrawal-ordered]') || {}).value || '';
    var received = (form.querySelector('[data-pflege-withdrawal-received]') || {}).value || '';
    var items = (form.querySelector('[data-pflege-withdrawal-items]') || {}).value || '';
    var message = (form.querySelector('[data-pflege-withdrawal-message]') || {}).value || '';
    var confirm = form.querySelector('[data-pflege-withdrawal-confirm]');

    if (!confirm || !confirm.checked) {
      event.preventDefault();
      confirm && confirm.focus();
      return;
    }

    if (!order.trim() || !items.trim()) {
      event.preventDefault();
      return;
    }

    var lines = [
      '--- Widerrufserklärung (Online-Formular) ---',
      '',
      'Der Kunde erklärt hiermit den Widerruf des Kaufvertrags.',
      '',
      'Name: ' + name.trim(),
      'E-Mail: ' + email.trim(),
      'Bestellnummer: ' + order.trim(),
    ];

    if (ordered) lines.push('Bestelldatum: ' + ordered);
    if (received) lines.push('Erhalten am: ' + received);
    lines.push('Artikel / Ware: ' + items.trim());
    if (message.trim()) lines.push('Nachricht: ' + message.trim());
    lines.push('', 'Bestätigung: Ich möchte den Vertrag widerrufen. (angekreuzt)');

    bodyField.value = lines.join('\n');

    try {
      sessionStorage.setItem(
        'pflege_withdrawal_receipt',
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          body: bodyField.value,
          at: new Date().toISOString(),
        })
      );
    } catch (e) {
      /* ignore */
    }
  });
})();
