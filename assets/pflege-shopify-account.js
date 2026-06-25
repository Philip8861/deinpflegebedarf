(function () {
  'use strict';

  var SIGNIN_TITLE = 'E-Mail angeben und direkt einloggen';

  function getAccountButton(accountEl) {
    if (!accountEl) return null;
    if (accountEl.shadowRoot) {
      var partBtn = accountEl.shadowRoot.querySelector('[part="signed-out-avatar"]');
      if (partBtn) return partBtn;
      var anyBtn = accountEl.shadowRoot.querySelector('button');
      if (anyBtn) return anyBtn;
    }
    var slotted = accountEl.querySelector('[slot="signed-out-avatar"]');
    if (slotted) {
      var closestBtn = slotted.closest('button');
      if (closestBtn) return closestBtn;
    }
    return null;
  }

  function openAccountSheet(accountEl) {
    if (!accountEl) return;
    if (typeof accountEl.show === 'function') {
      accountEl.show();
      return;
    }
    if (typeof accountEl.open === 'function') {
      accountEl.open();
      return;
    }
    var btn = getAccountButton(accountEl);
    if (btn) btn.click();
  }

  function getSheetRoot(accountEl) {
    if (!accountEl.shadowRoot) return null;
    return (
      accountEl.shadowRoot.querySelector('dialog[open]') ||
      accountEl.shadowRoot.querySelector('[role="dialog"]') ||
      accountEl.shadowRoot.querySelector('[class*="sheet"]') ||
      accountEl.shadowRoot.querySelector('[class*="Sheet"]') ||
      accountEl.shadowRoot.querySelector('div')
    );
  }

  function injectSheetStyles(accountEl) {
    if (!accountEl.shadowRoot) return;
    if (accountEl.shadowRoot.getElementById('pflege-account-sheet-style')) return;
    var style = document.createElement('style');
    style.id = 'pflege-account-sheet-style';
    style.textContent =
      'nav:not(#pflege-account-links), [role="navigation"]:not(#pflege-account-links) { display: none !important; }' +
      '.pflege-account-sheet-links { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--shopify-account-color-border, #d7e1ec); display: flex; flex-direction: column; gap: 0.35rem; }' +
      '.pflege-account-sheet-links a { display: block; padding: 0.65rem 0.75rem; border-radius: 8px; color: var(--shopify-account-color-text, #062a55); font-size: 15px; font-weight: 700; text-decoration: none; line-height: 1.35; }' +
      '.pflege-account-sheet-links a:hover, .pflege-account-sheet-links a:focus-visible { background: var(--shopify-account-color-background-subdued, #f4f9ff); outline: none; }' +
      '.pflege-account-sheet-links a.pflege-account-sheet-links__logout { color: var(--shopify-account-color-text-subdued, #66758d); font-weight: 600; }';
    accountEl.shadowRoot.appendChild(style);
  }

  function injectAccountLinks(accountEl, host) {
    if (!accountEl.shadowRoot || !host) return;
    injectSheetStyles(accountEl);
    var root = accountEl.shadowRoot;
    if (root.getElementById('pflege-account-links')) return;

    var sheet = getSheetRoot(accountEl);
    if (!sheet) return;

    var ordersUrl = host.dataset.pflegeAccountOrdersUrl || '/account';
    var profileUrl = host.dataset.pflegeAccountProfileUrl || '/account/profile';
    var logoutUrl = host.dataset.pflegeAccountLogoutUrl || '/account/logout';
    var ordersLabel = host.dataset.pflegeAccountOrdersLabel || 'Bestellungen';
    var profileLabel = host.dataset.pflegeAccountProfileLabel || 'Profil';
    var logoutLabel = host.dataset.pflegeAccountLogoutLabel || 'Abmelden';

    var wrap = document.createElement('nav');
    wrap.id = 'pflege-account-links';
    wrap.className = 'pflege-account-sheet-links';
    wrap.setAttribute('aria-label', 'Kundenbereich');

    wrap.innerHTML =
      '<a href="' +
      ordersUrl +
      '">' +
      ordersLabel +
      '</a>' +
      '<a href="' +
      profileUrl +
      '">' +
      profileLabel +
      '</a>' +
      '<a href="' +
      logoutUrl +
      '" class="pflege-account-sheet-links__logout" rel="nofollow">' +
      logoutLabel +
      '</a>';

    sheet.appendChild(wrap);
  }

  function customizeSheet(accountEl, host) {
    if (!accountEl.shadowRoot) return;
    var root = accountEl.shadowRoot;

    root.querySelectorAll('h1, h2, h3, p, span, label').forEach(function (node) {
      if (node.children.length > 0) return;
      var t = (node.textContent || '').trim().toLowerCase();
      if (
        t.includes('sign in') ||
        t.includes('anmelden') ||
        t.includes('log in') ||
        t.includes('check your email') ||
        (t.includes('e-mail') && t.includes('code')) ||
        t.includes('mit e-mail')
      ) {
        node.textContent = SIGNIN_TITLE;
      }
    });

    injectAccountLinks(accountEl, host);
  }

  function bindTrigger(trigger) {
    if (trigger.dataset.pflegeAccountBound) return;
    trigger.dataset.pflegeAccountBound = 'true';
    var accountEl = trigger.querySelector('shopify-account');
    if (!accountEl) return;
    var host = trigger.querySelector('.pflege-shopify-account-host') || trigger;

    accountEl.addEventListener('open', function () {
      customizeSheet(accountEl, host);
      setTimeout(function () { customizeSheet(accountEl, host); }, 100);
      setTimeout(function () { customizeSheet(accountEl, host); }, 350);
    });

    trigger.addEventListener('click', function (e) {
      if (e.target.closest('shopify-account')) return;
      e.preventDefault();
      openAccountSheet(accountEl);
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('shopify-account')) return;
      e.preventDefault();
      openAccountSheet(accountEl);
    });
  }

  function init() {
    document.querySelectorAll('[data-pflege-account-trigger]').forEach(bindTrigger);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', init);
})();
