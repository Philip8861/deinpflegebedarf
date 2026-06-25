(function () {
  function closeItem(item) {
    if (!item) return;
    var btn = item.querySelector('[data-pflege-cat-submenu-toggle]');
    var panel = item.querySelector('[data-pflege-cat-submenu]');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (panel) panel.hidden = true;
    item.classList.remove('is-open');
  }

  function closeAllIn(root) {
    root.querySelectorAll('[data-pflege-cat-submenu-item].is-open').forEach(closeItem);
    var bar = root.closest('.pflege-cat-rail__bar');
    if (bar) bar.classList.remove('is-submenu-open');
  }

  function toggleItem(btn) {
    var item = btn.closest('[data-pflege-cat-submenu-item]');
    if (!item) return;
    var panel = item.querySelector('[data-pflege-cat-submenu]');
    var isOpen = btn.getAttribute('aria-expanded') === 'true';
    var root = item.closest('.pflege-cat-rail--header-row') || item.closest('.pflege-category-modal');

    if (root) {
      root.querySelectorAll('[data-pflege-cat-submenu-item].is-open').forEach(function (other) {
        if (other !== item) closeItem(other);
      });
    }

    btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    if (panel) panel.hidden = isOpen;
    item.classList.toggle('is-open', !isOpen);

    var bar = item.closest('.pflege-cat-rail__bar');
    if (bar) {
      bar.classList.toggle('is-submenu-open', !isOpen);
    }
  }

  function bindSubmenus(root) {
    root.querySelectorAll('[data-pflege-cat-submenu-toggle]').forEach(function (btn) {
      if (btn.dataset.pflegeCatSubmenuBound) return;
      btn.dataset.pflegeCatSubmenuBound = 'true';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(btn);
      });
    });
  }

  function initRail() {
    var rail = document.querySelector('.pflege-cat-rail--header-row');
    if (!rail) return;
    bindSubmenus(rail);

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-pflege-cat-submenu-item]')) return;
      closeAllIn(rail);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllIn(rail);
    });
  }

  function start() {
    initRail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
