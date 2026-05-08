(function () {
  function init(dialog) {
    if (!dialog || dialog.dataset.pflegeCategoryModalInit) return;
    dialog.dataset.pflegeCategoryModalInit = 'true';
    var tid = dialog.getAttribute('data-trigger-id');
    var trigger = tid ? document.getElementById(tid) : null;
    if (!trigger) return;

    function syncExpanded(open) {
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    trigger.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
        syncExpanded(true);
      }
    });

    dialog.addEventListener('close', function () {
      syncExpanded(false);
      try {
        trigger.focus({ preventScroll: true });
      } catch (_) {
        trigger.focus();
      }
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.querySelectorAll('[data-category-modal-close]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (dialog.open) dialog.close();
      });
    });
  }

  document.querySelectorAll('dialog.pflege-category-modal').forEach(init);
})();
