(function () {
  function openInkSubmenuIfActive(dialog) {
    var inkItem = dialog.querySelector('[data-pflege-cat-submenu-item].is-active-context');
    if (!inkItem) return;
    var inkBtn = inkItem.querySelector('[data-pflege-cat-submenu-toggle]');
    var inkPanel = inkItem.querySelector('[data-pflege-cat-submenu]');
    if (inkBtn && inkPanel) {
      inkBtn.setAttribute('aria-expanded', 'true');
      inkPanel.hidden = false;
      inkItem.classList.add('is-open');
    }
  }

  function syncTriggerExpanded(dialog, open) {
    var tid = dialog.getAttribute('data-trigger-id');
    var trigger = tid ? document.getElementById(tid) : null;
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openCategoryModal(dialog) {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    dialog.showModal();
    syncTriggerExpanded(dialog, true);
    openInkSubmenuIfActive(dialog);
  }

  function init(dialog) {
    if (!dialog || dialog.dataset.pflegeCategoryModalInit) return;
    dialog.dataset.pflegeCategoryModalInit = 'true';
    var tid = dialog.getAttribute('data-trigger-id');
    var trigger = tid ? document.getElementById(tid) : null;
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      openCategoryModal(dialog);
    });

    dialog.addEventListener('close', function () {
      syncTriggerExpanded(dialog, false);
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

  function bindExternalOpeners() {
    document.querySelectorAll('[data-pflege-category-modal-open]').forEach(function (btn) {
      if (btn.dataset.pflegeCategoryModalOpenBound) return;
      btn.dataset.pflegeCategoryModalOpenBound = 'true';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var dialog = document.querySelector('dialog.pflege-category-modal');
        openCategoryModal(dialog);
      });
    });
  }

  function start() {
    document.querySelectorAll('dialog.pflege-category-modal').forEach(init);
    bindExternalOpeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
