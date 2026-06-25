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
        var inkItem = dialog.querySelector('[data-pflege-cat-submenu-item].is-active-context');
        if (inkItem) {
          var inkBtn = inkItem.querySelector('[data-pflege-cat-submenu-toggle]');
          var inkPanel = inkItem.querySelector('[data-pflege-cat-submenu]');
          if (inkBtn && inkPanel) {
            inkBtn.setAttribute('aria-expanded', 'true');
            inkPanel.hidden = false;
            inkItem.classList.add('is-open');
          }
        }
      }
    });

    dialog.addEventListener('close', function () {
      syncExpanded(false);
      dialog.querySelectorAll('[data-pflege-cat-submenu-item].is-open').forEach(closeItem);
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

    dialog.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener(
        'click',
        function () {
          if (dialog.open) dialog.close();
        },
        { capture: true }
      );
    });

    bindSubmenus(dialog);
  }

  function closeItem(item) {
    if (!item) return;
    var btn = item.querySelector('[data-pflege-cat-submenu-toggle]');
    var panel = item.querySelector('[data-pflege-cat-submenu]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
    item.classList.remove('is-open');
  }

  function toggleItem(btn, dialog) {
    var item = btn.closest('[data-pflege-cat-submenu-item]');
    if (!item) return;
    var panel = item.querySelector('[data-pflege-cat-submenu]');
    var isOpen = btn.getAttribute('aria-expanded') === 'true';

    dialog.querySelectorAll('[data-pflege-cat-submenu-item].is-open').forEach(function (other) {
      if (other !== item) closeItem(other);
    });

    btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    if (panel) panel.hidden = isOpen;
    item.classList.toggle('is-open', !isOpen);
  }

  function bindSubmenus(root) {
    root.querySelectorAll('[data-pflege-cat-submenu-toggle]').forEach(function (btn) {
      if (btn.dataset.pflegeCatSubmenuBound) return;
      btn.dataset.pflegeCatSubmenuBound = 'true';
      var dialog = root.closest('.pflege-category-modal');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(btn, dialog || root);
      });
    });
  }

  document.querySelectorAll('dialog.pflege-category-modal').forEach(init);
})();
