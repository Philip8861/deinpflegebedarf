(function () {
  const NUDGE_MS = 10000;

  function init() {
    const root = document.getElementById('pflege-pflegeboxi-root');
    if (!root) return;

    const launcher = root.querySelector('[data-pflegeboxi-open]');
    const modal = document.getElementById('pflege-pflegeboxi-dialog');
    if (!launcher || !modal) return;

    const closeEls = modal.querySelectorAll('[data-pflegeboxi-close]');
    let lastFocus = null;

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const closeBtn = modal.querySelector('[data-pflegeboxi-close-focus]');
      closeBtn?.focus({ preventScroll: true });
    }

    function closeModal() {
      modal.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
      lastFocus = null;
    }

    launcher.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
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
      window.setInterval(nudge, NUDGE_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
