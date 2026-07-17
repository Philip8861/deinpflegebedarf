(function () {
  function setItemState(item, open) {
    var trigger = item.querySelector('[data-faq-accordion-trigger]');
    var panel = item.querySelector('[data-faq-accordion-panel]');
    if (!trigger || !panel) return;

    item.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }

  function initAccordion(root) {
    if (!root || root.dataset.pflegeFaqInit === 'true') return;
    root.dataset.pflegeFaqInit = 'true';

    var singleOpen = root.getAttribute('data-single-open') !== 'false';
    var firstOpen = root.getAttribute('data-first-open') === 'true';
    var items = root.querySelectorAll('[data-faq-accordion-item]');

    items.forEach(function (item) {
      var trigger = item.querySelector('[data-faq-accordion-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        if (singleOpen && !isOpen) {
          items.forEach(function (other) {
            if (other !== item) setItemState(other, false);
          });
        }

        setItemState(item, !isOpen);
      });
    });

    items.forEach(function (item) {
      setItemState(item, false);
    });

    if (firstOpen && items.length > 0) {
      setItemState(items[0], true);
    }
  }

  function initLoadMore(root) {
    var btn = root.querySelector('[data-faq-load-more]');
    var extra = root.querySelector('[data-faq-extra]');
    var labelEl = btn && btn.querySelector('.pflege-faq-accordion__load-more-label');
    if (!btn || !extra || !labelEl) return;

    var labelMore = btn.getAttribute('data-faq-label-more') || labelEl.textContent || '';
    var labelLess = btn.getAttribute('data-faq-label-less') || '';

    btn.addEventListener('click', function () {
      var hidden = extra.hasAttribute('hidden');

      if (hidden) {
        extra.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('is-expanded');
        labelEl.textContent = labelLess;
      } else {
        extra.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-expanded');
        labelEl.textContent = labelMore;
        extra.querySelectorAll('[data-faq-accordion-item].is-open').forEach(function (el) {
          setItemState(el, false);
        });
      }
    });
  }

  function initRoot(root) {
    initAccordion(root);
    initLoadMore(root);
  }

  function boot() {
    document.querySelectorAll('[data-pflege-faq-accordion]').forEach(initRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (event) {
    var roots = event.target && event.target.querySelectorAll('[data-pflege-faq-accordion]');
    if (!roots || !roots.length) return;
    roots.forEach(initRoot);
  });
})();
