/**
 * PDP horizontale Tabs (accessibility: roving tabindex, aria-selected).
 */
(function () {
  function selectTab(root, index) {
    const tabs = root.querySelectorAll('[role="tab"]');
    const panels = root.querySelectorAll('[role="tabpanel"]');
    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      if (i === index) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  function init(root) {
    const tabs = root.querySelectorAll('[role="tab"]');
    const panels = root.querySelectorAll('[role="tabpanel"]');
    if (!tabs.length || !panels.length) return;

    let start = [...tabs].findIndex((t) => t.getAttribute('aria-selected') === 'true');
    if (start < 0) start = 0;
    selectTab(root, start);

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(root, index));

      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (index + dir + tabs.length) % tabs.length;
          tabs[next].focus();
          selectTab(root, next);
        }
      });
    });
  }

  document.querySelectorAll('[data-pflege-horizontal-tabs]').forEach(init);
})();
