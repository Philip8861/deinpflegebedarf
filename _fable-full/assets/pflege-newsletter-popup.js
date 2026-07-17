/**
 * PflegeShop — Newsletter-Pop-Up (10 % Rabatt auf erste Bestellung)
 *
 * Verhalten:
 *  - Nur auf der Startseite (template-index Body-Klasse).
 *  - Nicht im Theme-Editor (Shopify.designMode).
 *  - Öffnet 10 s nach Page-Load (data-popup-delay).
 *  - Schließbar via Close-Button, Klick auf Backdrop oder ESC.
 *  - Frequenz-Capping per localStorage:
 *      • Schließen ohne Anmeldung → 30 Tage Pause.
 *      • Newsletter-Anmeldung    → 365 Tage Pause.
 *  - Bei serverseitigem Erfolg (form.posted_successfully?) öffnet das Pop-Up
 *    sofort, damit der Besucher die Bestätigung sieht.
 *  - Fokus-Trap & Body-Scroll-Lock für Barrierefreiheit.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;
  if (window.Shopify && window.Shopify.designMode) return;

  var POPUP_ID = 'pflege-newsletter-popup';
  var BODY_CLASS_INDEX = 'template-index';
  var ROOT_OPEN_CLASS = 'pflege-popup-open';

  var LS_DISMISSED = 'pflege_news_popup_dismissed_ts';
  var LS_SUBSCRIBED = 'pflege_news_popup_subscribed_ts';
  var DAY = 86400000;
  var DISMISS_TTL = 30 * DAY;
  var SUBSCRIBED_TTL = 365 * DAY;

  function readTs(key) {
    try {
      var raw = window.localStorage.getItem(key);
      var v = raw ? parseInt(raw, 10) : 0;
      return isNaN(v) ? 0 : v;
    } catch (e) {
      return 0;
    }
  }

  function writeTs(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (e) {}
  }

  function shouldShow() {
    var sub = readTs(LS_SUBSCRIBED);
    if (sub && Date.now() - sub < SUBSCRIBED_TTL) return false;

    var dis = readTs(LS_DISMISSED);
    if (dis && Date.now() - dis < DISMISS_TTL) return false;

    return true;
  }

  function focusables(root) {
    return root.querySelectorAll(
      'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    );
  }

  function init(root) {
    var lastFocused = null;

    function open() {
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add(ROOT_OPEN_CLASS);
      lastFocused = document.activeElement;

      var emailInput = root.querySelector('input[type="email"]');
      var nodes = focusables(root);
      var target = emailInput || (nodes.length ? nodes[0] : null);
      if (target && typeof target.focus === 'function') {
        try {
          target.focus();
        } catch (e) {}
      }
    }

    function close(remember) {
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove(ROOT_OPEN_CLASS);
      if (remember) writeTs(LS_DISMISSED, Date.now());
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try {
          lastFocused.focus();
        } catch (e) {}
      }
    }

    var closers = root.querySelectorAll('[data-pnp-close]');
    Array.prototype.forEach.call(closers, function (el) {
      el.addEventListener('click', function () {
        close(true);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (root.hidden) return;
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        close(true);
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

    var form = root.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        writeTs(LS_SUBSCRIBED, Date.now());
      });
    }

    if (root.querySelector('[data-pnp-success]')) {
      writeTs(LS_SUBSCRIBED, Date.now());
      open();
      return;
    }

    if (!shouldShow()) return;

    var delay = parseInt(root.getAttribute('data-popup-delay'), 10);
    if (isNaN(delay) || delay < 0) delay = 10000;

    var triggered = false;
    var timer = window.setTimeout(function () {
      if (triggered) return;
      triggered = true;
      open();
    }, delay);

    document.addEventListener(
      'visibilitychange',
      function () {
        if (document.visibilityState === 'hidden' && !triggered) {
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            if (triggered) return;
            triggered = true;
            open();
          }, delay);
        }
      },
      false
    );
  }

  function start() {
    if (!document.body || !document.body.classList.contains(BODY_CLASS_INDEX)) return;
    var root = document.getElementById(POPUP_ID);
    if (!root) return;
    init(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
