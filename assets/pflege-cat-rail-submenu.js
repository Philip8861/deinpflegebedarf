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
    var bar = root.querySelector('.pflege-cat-rail__bar') || root.closest('.pflege-cat-rail__bar');
    if (bar) bar.classList.remove('is-submenu-open');
  }

  function toggleItem(btn) {
    var item = btn.closest('[data-pflege-cat-submenu-item]');
    if (!item) return;
    var panel = item.querySelector('[data-pflege-cat-submenu]');
    var isOpen = btn.getAttribute('aria-expanded') === 'true';
    var scope = item.closest('.pflege-cat-rail--header-row') || item.closest('.pflege-category-modal');

    if (scope) {
      scope.querySelectorAll('[data-pflege-cat-submenu-item].is-open').forEach(function (other) {
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

  function bindRail(rail) {
    if (!rail || rail.dataset.pflegeCatRailSubmenuInit) return;
    rail.dataset.pflegeCatRailSubmenuInit = 'true';

    rail.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-pflege-cat-submenu-toggle]');
      if (!btn || !rail.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      toggleItem(btn);
    });

    document.addEventListener('click', function (e) {
      window.setTimeout(function () {
        if (e.target.closest('[data-pflege-cat-submenu-item]')) return;
        closeAllIn(rail);
      }, 0);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllIn(rail);
    });
  }

  function init() {
    document.querySelectorAll('.pflege-cat-rail--header-row').forEach(bindRail);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
