(function () {
  'use strict';

  var SIGNIN_TITLE = 'E-Mail angeben und direkt einloggen';

  var ACCOUNT_ICONS = {
    orders:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></svg>',
    user:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'log-out':
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    chevron:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clip-rule="evenodd"/></svg>'
  };

  function buildAccountLink(url, label, iconKey, extraClass, rel) {
    var icon = ACCOUNT_ICONS[iconKey] || '';
    var className = 'pflege-account-sheet-link' + (extraClass ? ' ' + extraClass : '');
    var relAttr = rel ? ' rel="' + rel + '"' : '';
    return (
      '<a href="' +
      url +
      '" class="' +
      className +
      '"' +
      relAttr +
      '>' +
      '<span class="pflege-account-sheet-link__icon">' +
      icon +
      '</span>' +
      '<span class="pflege-account-sheet-link__label">' +
      label +
      '</span>' +
      '<span class="pflege-account-sheet-link__chevron">' +
      ACCOUNT_ICONS.chevron +
      '</span>' +
      '</a>'
    );
  }

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
    if (accountEl.shadowRoot.getElementById('pflege-account-sheet-style-v3')) return;
    var style = document.createElement('style');
    style.id = 'pflege-account-sheet-style-v3';
    style.textContent =
      'nav:not(#pflege-account-links), [role="navigation"]:not(#pflege-account-links) { display: none !important; }' +
      '@media (max-width: 750px) {' +
      '.dialog {' +
      'position: fixed !important;' +
      'top: 50% !important;' +
      'left: 50% !important;' +
      'right: auto !important;' +
      'bottom: auto !important;' +
      'inset: auto !important;' +
      'transform: translate(-50%, -50%) !important;' +
      'width: min(calc(100vw - 2rem), 360px) !important;' +
      'max-width: min(calc(100vw - 2rem), 360px) !important;' +
      'max-height: min(90dvh, 100dvh) !important;' +
      'border-radius: 14px !important;' +
      'border-top-left-radius: 14px !important;' +
      'border-top-right-radius: 14px !important;' +
      '--dialog-drawer-opening-animation: none;' +
      '--dialog-drawer-closing-animation: none;' +
      '}' +
      '.dialog[open] {' +
      'animation: pflege-account-dialog-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards !important;' +
      'transform: translate(-50%, -50%) !important;' +
      '}' +
      '.dialog.closing {' +
      'animation: pflege-account-dialog-out 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;' +
      '}' +
      '.dialog .account, .account {' +
      'max-height: min(85dvh, 100dvh) !important;' +
      '}' +
      '}' +
      '@keyframes pflege-account-dialog-in {' +
      'from { opacity: 0; transform: translate(-50%, calc(-50% + 14px)); }' +
      'to { opacity: 1; transform: translate(-50%, -50%); }' +
      '}' +
      '@keyframes pflege-account-dialog-out {' +
      'from { opacity: 1; transform: translate(-50%, -50%); }' +
      'to { opacity: 0; transform: translate(-50%, calc(-50% + 10px)); }' +
      '}' +
      '@media (max-width: 750px) and (prefers-reduced-motion: reduce) {' +
      '.dialog[open], .dialog.closing { animation: none !important; opacity: 1 !important; }' +
      '.dialog.closing { opacity: 0 !important; }' +
      '}' +
      '.pflege-account-sheet-links {' +
      'margin-top: 1.25rem;' +
      'padding: 0.65rem;' +
      'border: 1px solid rgba(216, 226, 238, 0.65);' +
      'border-radius: 14px;' +
      'background: #ffffff;' +
      'box-shadow: 0 10px 28px rgba(20, 73, 110, 0.06);' +
      'display: flex;' +
      'flex-direction: column;' +
      'gap: 0.2rem;' +
      '}' +
      '.pflege-account-sheet-link {' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 0.85rem;' +
      'padding: 0.55rem 0.65rem;' +
      'border-radius: 10px;' +
      'color: #062a55;' +
      'font-size: 15px;' +
      'font-weight: 700;' +
      'text-decoration: none;' +
      'line-height: 1.35;' +
      'transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;' +
      '}' +
      '.pflege-account-sheet-link:hover, .pflege-account-sheet-link:focus-visible {' +
      'background: #f4f9ff;' +
      'outline: none;' +
      'transform: translateX(1px);' +
      '}' +
      '.pflege-account-sheet-link__icon {' +
      'flex: 0 0 auto;' +
      'display: inline-flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'width: 40px;' +
      'height: 40px;' +
      'border-radius: 999px;' +
      'background: #f4f9ff;' +
      'color: #075f84;' +
      '}' +
      '.pflege-account-sheet-link__icon svg {' +
      'width: 20px;' +
      'height: 20px;' +
      'display: block;' +
      '}' +
      '.pflege-account-sheet-link__label {' +
      'flex: 1 1 auto;' +
      'letter-spacing: 0.01em;' +
      '}' +
      '.pflege-account-sheet-link__chevron {' +
      'flex: 0 0 auto;' +
      'display: inline-flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'color: #0b6edc;' +
      'opacity: 0.5;' +
      'transition: opacity 0.18s ease, transform 0.18s ease;' +
      '}' +
      '.pflege-account-sheet-link__chevron svg {' +
      'width: 14px;' +
      'height: 10px;' +
      'display: block;' +
      '}' +
      '.pflege-account-sheet-link:hover .pflege-account-sheet-link__chevron, .pflege-account-sheet-link:focus-visible .pflege-account-sheet-link__chevron {' +
      'opacity: 0.85;' +
      'transform: translateX(2px);' +
      '}' +
      '.pflege-account-sheet-link--logout {' +
      'color: #66758d;' +
      'font-weight: 600;' +
      '}' +
      '.pflege-account-sheet-link--logout .pflege-account-sheet-link__icon {' +
      'background: #f8fbff;' +
      'color: #66758d;' +
      '}' +
      '.pflege-account-sheet-link--logout .pflege-account-sheet-link__chevron {' +
      'color: #66758d;' +
      'opacity: 0.4;' +
      '}';
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
      buildAccountLink(ordersUrl, ordersLabel, 'orders') +
      buildAccountLink(profileUrl, profileLabel, 'user') +
      buildAccountLink(logoutUrl, logoutLabel, 'log-out', 'pflege-account-sheet-link--logout', 'nofollow');

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

    function ensureStyles() {
      if (accountEl.shadowRoot) injectSheetStyles(accountEl);
    }

    customElements.whenDefined('shopify-account').then(ensureStyles);
    ensureStyles();

    accountEl.addEventListener('open', function () {
      ensureStyles();
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
