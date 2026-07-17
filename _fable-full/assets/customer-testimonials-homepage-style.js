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

  function openReviewModal(root) {
    var btn = root.querySelector('[data-ct-review-open]');
    var dialog = root.querySelector('[data-ct-review-dialog]');
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
    }
    var focusTarget = dialog.querySelector(
      '.ct-hp__review-status--success, .ct-hp__review-status--error, .ct-hp__review-input, .ct-hp__review-modal__close'
    );
    if (focusTarget && focusTarget.focus) {
      try {
        focusTarget.focus();
      } catch (e) {}
    }
  }

  function closeReviewModal(root) {
    var btn = root.querySelector('[data-ct-review-open]');
    var dialog = root.querySelector('[data-ct-review-dialog]');
    if (dialog && dialog.open) {
      dialog.close();
    }
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function setupReviewForm(root) {
    if (root._ctReviewBound) return;
    var btn = root.querySelector('[data-ct-review-open]');
    var dialog = root.querySelector('[data-ct-review-dialog]');
    if (!btn || !dialog) return;
    root._ctReviewBound = true;

    var hasStatus =
      dialog.querySelector('.ct-hp__review-status--success') ||
      dialog.querySelector('.ct-hp__review-status--error');
    if (hasStatus) {
      openReviewModal(root);
    }

    btn.addEventListener('click', function () {
      openReviewModal(root);
    });

    dialog.querySelectorAll('[data-ct-review-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        closeReviewModal(root);
      });
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) {
        closeReviewModal(root);
      }
    });

    dialog.addEventListener('close', function () {
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    setupReviewRatingPicker(dialog);
  }

  function setupReviewRatingPicker(dialog) {
    dialog.querySelectorAll('[data-ct-review-stars]').forEach(function (group) {
      if (group._ctStarsBound) return;
      group._ctStarsBound = true;

      var hidden = group.querySelector('[data-ct-review-rating-value]');
      var buttons = Array.from(group.querySelectorAll('[data-ct-review-star]'));
      if (!hidden || !buttons.length) return;

      function paintStars(value) {
        buttons.forEach(function (btn, index) {
          var on = index < value;
          btn.classList.toggle('is-active', on);
          btn.setAttribute('aria-checked', on ? 'true' : 'false');
        });
      }

      function setRating(value) {
        hidden.value = String(value);
        group.setAttribute('data-ct-review-rating', String(value));
        paintStars(value);
      }

      buttons.forEach(function (btn) {
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('tabindex', '-1');

        btn.addEventListener('click', function () {
          var value = parseInt(btn.getAttribute('data-ct-review-star'), 10);
          if (!isNaN(value)) setRating(value);
        });

        btn.addEventListener('mouseenter', function () {
          var hover = parseInt(btn.getAttribute('data-ct-review-star'), 10);
          if (!isNaN(hover)) paintStars(hover);
        });
      });

      group.addEventListener('mouseleave', function () {
        var current = parseInt(hidden.value, 10);
        paintStars(isNaN(current) ? 0 : current);
      });

      group.addEventListener('keydown', function (e) {
        var current = parseInt(hidden.value, 10) || 0;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          setRating(Math.min(5, current + 1 || 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          setRating(Math.max(1, current - 1 || 1));
        }
      });
    });
  }

  function setupExpand(root) {
    if (root._ctExpandBound) return;
    var btn = root.querySelector('[data-ct-toggle-expand]');
    var wrap = root.querySelector('[data-ct-expand-wrap]');
    if (!btn || !wrap) return;
    root._ctExpandBound = true;

    var labelEl = btn.querySelector('[data-ct-expand-label]');
    var more = btn.getAttribute('data-ct-label-more');
    var less = btn.getAttribute('data-ct-label-less');

    btn.addEventListener('click', function () {
      var open = wrap.classList.toggle('is-open');
      btn.classList.toggle('is-expanded', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      wrap.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (labelEl && more != null && less != null) {
        labelEl.textContent = open ? less : more;
      }
      if (open && wrap.scrollIntoView) {
        try {
          wrap.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'nearest',
          });
        } catch (e) {}
      }
    });
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

    setupExpand(root);
    setupReviewForm(root);

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
      n._ctExpandBound = false;
      n._ctReviewBound = false;
      init(n);
    }
  });

  document.addEventListener('shopify:section:unload', function (ev) {
    var n = ev.target && ev.target.querySelector && ev.target.querySelector('[data-ct-root]');
    if (n) destroyAuto(n);
  });
})();
