(function () {
  function getPanels(root) {
    return Array.from(root.querySelectorAll('[data-ct-panel]'));
  }

  function getDots(root) {
    return Array.from(root.querySelectorAll('[data-ct-dot]'));
  }

  function mapDotToPanel(dotIndex, panelCount) {
    if (panelCount <= 0) return 0;
    return dotIndex % panelCount;
  }

  function setActive(root, dotIndex) {
    var panels = getPanels(root);
    var dots = getDots(root);
    var panelIx = mapDotToPanel(dotIndex, panels.length);

    panels.forEach(function (p, i) {
      var on = i === panelIx;
      p.classList.toggle('is-active', on);
      if (on) {
        p.removeAttribute('hidden');
        p.setAttribute('aria-hidden', 'false');
      } else {
        p.setAttribute('hidden', '');
        p.setAttribute('aria-hidden', 'true');
      }
    });

    dots.forEach(function (d, i) {
      var on = i === dotIndex;
      d.classList.toggle('is-active', on);
      if (on) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });

    root._ctActiveDot = dotIndex;
  }

  function destroyAuto(root) {
    if (root._ctInterval) {
      clearInterval(root._ctInterval);
      root._ctInterval = null;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  function setupAuto(root) {
    destroyAuto(root);
    if (root.getAttribute('data-ct-auto') !== 'true') return;
    if (prefersReducedMotion()) return;
    var panels = getPanels(root);
    if (panels.length <= 1) return;
    var sec = parseInt(root.getAttribute('data-ct-auto-sec') || '5', 10);
    if (isNaN(sec) || sec < 3) sec = 5;
    var dots = getDots(root);
    if (dots.length <= 1) return;

    root._ctInterval = window.setInterval(function () {
      var next = (root._ctActiveDot != null ? root._ctActiveDot : 0) + 1;
      if (next >= dots.length) next = 0;
      setActive(root, next);
    }, sec * 1000);
  }

  function init(root) {
    if (!root || root._ctInited) return;
    root._ctInited = true;

    var panels = getPanels(root);
    var dots = getDots(root);
    if (!dots.length) return;

    root._ctActiveDot = 0;
    setActive(root, 0);

    dots.forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        setActive(root, idx);
      });
    });

    root.addEventListener('mouseenter', function () {
      destroyAuto(root);
    });
    root.addEventListener('focusin', function () {
      destroyAuto(root);
    });
    root.addEventListener('mouseleave', function () {
      setupAuto(root);
    });

    setupAuto(root);
  }

  function run() {
    document.querySelectorAll('[data-ct-root]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  document.addEventListener('shopify:section:load', function (ev) {
    var n = ev.target && ev.target.querySelector && ev.target.querySelector('[data-ct-root]');
    if (n) {
      n._ctInited = false;
      init(n);
    }
  });

  document.addEventListener('shopify:section:unload', function (ev) {
    var n = ev.target && ev.target.querySelector && ev.target.querySelector('[data-ct-root]');
    if (n) destroyAuto(n);
  });
})();
