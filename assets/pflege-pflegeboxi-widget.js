(function () {
  const NUDGE_MS = 5000;
  const STORAGE_DISMISS = 'pflegeboxi-dismissed';
  const DESKTOP_MQ = '(min-width: 750px)';

  function init() {
    const root = document.getElementById('pflege-pflegeboxi-root');
    if (!root) return;

    const launcher = root.querySelector('[data-pflegeboxi-open]');
    const modal = document.getElementById('pflege-pflegeboxi-dialog');
    if (!launcher || !modal) return;

    const desktopMq = window.matchMedia(DESKTOP_MQ);

    function isDesktop() {
      return desktopMq.matches;
    }

    if (window.sessionStorage.getItem(STORAGE_DISMISS) === '1') {
      root.hidden = true;
      return;
    }

    if (!isDesktop()) {
      root.hidden = true;
    }

    const dismissBtn = root.querySelector('[data-pflegeboxi-dismiss]');
    const closeEls = modal.querySelectorAll('[data-pflegeboxi-close]');
    const pills = modal.querySelectorAll('[data-pflegeboxi-q-index]');
    const activeQEl = modal.querySelector('[data-pflegeboxi-active-q]');
    const activeAEl = modal.querySelector('[data-pflegeboxi-active-a]');
    const questionsScroller = modal.querySelector('[data-pflegeboxi-questions]');

    let lastFocus = null;
    let nudgeIntervalId = null;
    let savedScrollPaddingRight = '';
    let savedBodyOverflow = '';

    function lockBodyScrollNoShift() {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      savedScrollPaddingRight = document.body.style.paddingRight;
      savedBodyOverflow = document.body.style.overflow;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px';
      }
      document.body.style.overflow = 'hidden';
    }

    function unlockBodyScroll() {
      document.body.style.paddingRight = savedScrollPaddingRight;
      document.body.style.overflow = savedBodyOverflow;
    }

    function setActiveByIndex(index) {
      let target = null;
      pills.forEach((pill) => {
        const isMatch = String(pill.dataset.pflegeboxiQIndex) === String(index);
        pill.classList.toggle('is-active', isMatch);
        pill.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
        if (isMatch) target = pill;
      });
      if (!target) return;
      const q = target.dataset.pflegeboxiQ || target.textContent.trim();
      const a = target.dataset.pflegeboxiA || '';
      if (activeQEl) activeQEl.textContent = q;
      if (activeAEl) activeAEl.textContent = a;
    }

    function closeModal() {
      modal.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      unlockBodyScroll();
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
      lastFocus = null;
    }

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      lockBodyScrollNoShift();

      if (questionsScroller) questionsScroller.scrollTop = 0;

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

    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveByIndex(pill.dataset.pflegeboxiQIndex);
      });
    });

    function nudge() {
      launcher.classList.remove('pflege-pflegeboxi-widget__launcher--nudge');
      void launcher.offsetWidth;
      launcher.classList.add('pflege-pflegeboxi-widget__launcher--nudge');
    }

    launcher.addEventListener('animationend', () => {
      launcher.classList.remove('pflege-pflegeboxi-widget__launcher--nudge');
    });

    function startNudgeInterval() {
      if (
        nudgeIntervalId != null ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !isDesktop()
      ) {
        return;
      }
      nudgeIntervalId = window.setInterval(nudge, NUDGE_MS);
    }

    function stopNudgeInterval() {
      if (nudgeIntervalId == null) return;
      window.clearInterval(nudgeIntervalId);
      nudgeIntervalId = null;
    }

    startNudgeInterval();

    desktopMq.addEventListener('change', (e) => {
      if (e.matches) {
        if (window.sessionStorage.getItem(STORAGE_DISMISS) !== '1') {
          root.hidden = false;
        }
        startNudgeInterval();
      } else {
        closeModal();
        root.hidden = true;
        stopNudgeInterval();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
