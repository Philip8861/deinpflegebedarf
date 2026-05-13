(function () {
  const NUDGE_MS = 10000;
  const STORAGE_DISMISS = 'pflegeboxi-dismissed';

  function init() {
    const root = document.getElementById('pflege-pflegeboxi-root');
    if (!root) return;

    const launcher = root.querySelector('[data-pflegeboxi-open]');
    const modal = document.getElementById('pflege-pflegeboxi-dialog');
    if (!launcher || !modal) return;

    if (window.sessionStorage.getItem(STORAGE_DISMISS) === '1') {
      root.hidden = true;
      return;
    }

    const dismissBtn = root.querySelector('[data-pflegeboxi-dismiss]');
    const closeEls = modal.querySelectorAll('[data-pflegeboxi-close]');
    let lastFocus = null;
    let nudgeIntervalId = null;

    function closeModal() {
      modal.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const closeBtn = modal.querySelector('[data-pflegeboxi-close-focus]');
      closeBtn?.focus({ preventScroll: true });
    }

    function dismissLauncher() {
      try {
        window.sessionStorage.setItem(STORAGE_DISMISS, '1');
      } catch (e) {
        /* ignore */
      }
      closeModal();
      if (nudgeIntervalId != null) {
        window.clearInterval(nudgeIntervalId);
        nudgeIntervalId = null;
      }
      root.hidden = true;
    }

    launcher.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    dismissBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissLauncher();
    });

    closeEls.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    });

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    });

    function nudge() {
      launcher.classList.remove('pflege-pflegeboxi-widget__launcher--nudge');
      void launcher.offsetWidth;
      launcher.classList.add('pflege-pflegeboxi-widget__launcher--nudge');
    }

    launcher.addEventListener('animationend', () => {
      launcher.classList.remove('pflege-pflegeboxi-widget__launcher--nudge');
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nudgeIntervalId = window.setInterval(nudge, NUDGE_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
