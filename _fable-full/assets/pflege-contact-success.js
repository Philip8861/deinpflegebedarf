/**
 * PflegeShop — Kontaktformular Erfolgs-Pop-up
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var ROOT_OPEN_CLASS = 'pflege-contact-success-open';

  function focusables(root) {
    return root.querySelectorAll(
      'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
  }

  function init(root) {
    var lastFocused = document.activeElement;

    function open() {
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add(ROOT_OPEN_CLASS);

      var btn = root.querySelector('.pflege-contact-success__btn');
      var nodes = focusables(root);
      var target = btn || (nodes.length ? nodes[0] : null);
      if (target && typeof target.focus === 'function') {
        try {
          target.focus();
        } catch (e) {}
      }
    }

    function close() {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove(ROOT_OPEN_CLASS);

      if (window.location.search) {
        window.location.replace(window.location.pathname);
        return;
      }

      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    }

    Array.prototype.forEach.call(root.querySelectorAll('[data-pcs-close]'), function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (root.hidden) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab' || e.keyCode === 9) {
        var nodes = focusables(root);
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    open();
  }

  function start() {
    var root = document.querySelector('[data-pflege-contact-success]');
    if (!root) return;
    init(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
