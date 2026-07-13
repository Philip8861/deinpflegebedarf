/**
 * PflegeShop — dynamische Lieferzeit-Schätzung (DE, Europe/Berlin)
 * Mo–Do: ca. +2 bis +4 Kalendertage (Sa/So auf Mo verschieben)
 * Fr: +3 bis +5 | Sa: +2 bis +4 | So: +1 bis +3
 */
(function () {
  'use strict';

  var WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  var MONTHS = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  function padDay(day) {
    return day < 10 ? '0' + day : String(day);
  }

  function getBerlinTodayAtNoon() {
    var now = new Date();
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    var year = 0;
    var month = 0;
    var day = 0;

    parts.forEach(function (part) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10) - 1;
      if (part.type === 'day') day = parseInt(part.value, 10);
    });

    return new Date(year, month, day, 12, 0, 0, 0);
  }

  function addDays(date, days) {
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
  }

  function bumpWeekend(date) {
    var next = new Date(date.getTime());
    var dow = next.getDay();
    if (dow === 6) next.setDate(next.getDate() + 2);
    else if (dow === 0) next.setDate(next.getDate() + 1);
    return next;
  }

  function getDeliveryOffsets(orderDay) {
    if (orderDay === 5) return { min: 3, max: 5 };
    if (orderDay === 6) return { min: 2, max: 4 };
    if (orderDay === 0) return { min: 1, max: 3 };
    return { min: 2, max: 4 };
  }

  function getDeliveryWindow(fromDate) {
    var base = fromDate || getBerlinTodayAtNoon();
    var offsets = getDeliveryOffsets(base.getDay());
    var minDate = bumpWeekend(addDays(base, offsets.min));
    var maxDate = bumpWeekend(addDays(base, offsets.max));

    if (maxDate.getTime() <= minDate.getTime()) {
      maxDate = bumpWeekend(addDays(minDate, 2));
    }

    return { min: minDate, max: maxDate };
  }

  function formatDateParts(date) {
    return {
      weekday: WEEKDAYS[date.getDay()] + '.',
      day: padDay(date.getDate()),
      month: MONTHS[date.getMonth()],
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderDateHtml(date) {
    var parts = formatDateParts(date);
    return (
      '<span class="pflege-product__delivery-date">' +
      '<span class="pflege-product__delivery-date-highlight">' +
      escapeHtml(parts.weekday) +
      '</span> ' +
      '<span class="pflege-product__delivery-date-highlight">' +
      escapeHtml(parts.day) +
      '</span> ' +
      escapeHtml(parts.month) +
      '</span>'
    );
  }

  function renderEstimateHtml(prefix, between, suffix, window) {
    return (
      escapeHtml(prefix) +
      ' ' +
      renderDateHtml(window.min) +
      '<span class="pflege-product__delivery-tail">' +
      ' ' +
      escapeHtml(between) +
      ' ' +
      renderDateHtml(window.max) +
      escapeHtml(suffix) +
      '</span>'
    );
  }

  function updateNode(node) {
    if (!node || node.hidden) return;

    var prefix = node.getAttribute('data-delivery-prefix') || 'Lieferung ca.';
    var between = node.getAttribute('data-delivery-between') || 'bis';
    var suffix = node.getAttribute('data-delivery-suffix') || '.';
    var textEl = node.querySelector('[data-pflege-delivery-estimate-text]');

    if (!textEl) return;

    var windowDates = getDeliveryWindow();
    textEl.innerHTML = renderEstimateHtml(prefix, between, suffix, windowDates);

    var minParts = formatDateParts(windowDates.min);
    var maxParts = formatDateParts(windowDates.max);
    node.setAttribute(
      'aria-label',
      prefix +
        ' ' +
        minParts.weekday +
        ' ' +
        minParts.day +
        '. ' +
        minParts.month +
        ' ' +
        between +
        ' ' +
        maxParts.weekday +
        ' ' +
        maxParts.day +
        '. ' +
        maxParts.month
    );

    fitDeliveryTextWidth(node);
  }

  function fitDeliveryTextWidth(node) {
    var textEl = node && node.querySelector('[data-pflege-delivery-estimate-text]');
    if (!textEl) return;

    var isMobile = window.matchMedia('(max-width: 749px)').matches;
    if (!isMobile || node.hidden) {
      textEl.style.removeProperty('font-size');
      node.classList.remove('is-delivery-fitted');
      return;
    }

    var wrap = node.closest('.pflege-product__purchase-form-wrap');
    var button = wrap && wrap.querySelector('.product-form__submit');
    if (!button) {
      textEl.style.removeProperty('font-size');
      return;
    }

    var targetWidth = button.getBoundingClientRect().width;
    if (targetWidth < 48) return;

    var iconEl = node.querySelector('.pflege-product__delivery-estimate-icon');
    if (iconEl) {
      var iconStyles = window.getComputedStyle(node);
      var iconGap = parseFloat(iconStyles.columnGap || iconStyles.gap || '0') || 0;
      targetWidth = Math.max(32, targetWidth - iconEl.getBoundingClientRect().width - iconGap);
    }

    textEl.style.fontSize = '10px';

    var min = 10;
    var max = 24;

    while (max - min > 0.2) {
      var mid = (min + max) / 2;
      textEl.style.fontSize = mid + 'px';
      if (textEl.scrollWidth <= targetWidth) {
        min = mid;
      } else {
        max = mid;
      }
    }

    textEl.style.fontSize = min + 'px';
    node.classList.add('is-delivery-fitted');
  }

  function fitAllDeliveryWidths() {
    document.querySelectorAll('[data-pflege-delivery-estimate]').forEach(function (node) {
      fitDeliveryTextWidth(node);
    });
  }

  var fitRaf = 0;
  function scheduleFitAll() {
    if (fitRaf) window.cancelAnimationFrame(fitRaf);
    fitRaf = window.requestAnimationFrame(function () {
      fitRaf = 0;
      fitAllDeliveryWidths();
    });
  }

  function init() {
    document.querySelectorAll('[data-pflege-delivery-estimate]').forEach(updateNode);
    syncVisibility();
    bindFitListeners();
    scheduleFitAll();
  }

  function syncVisibility() {
    document.querySelectorAll('[data-pflege-delivery-estimate]').forEach(function (node) {
      var purchaseRow = node.closest('.pflege-product__purchase-row');
      var productForm = purchaseRow && purchaseRow.querySelector('product-form');
      var button = productForm && productForm.querySelector('.product-form__submit');
      var hidden = !button || button.hasAttribute('disabled');
      node.hidden = hidden;
      if (!hidden) fitDeliveryTextWidth(node);
    });
  }

  function bindFitListeners() {
    if (window.__pflegeDeliveryEstimateFitBound) return;
    window.__pflegeDeliveryEstimateFitBound = true;

    window.addEventListener('resize', scheduleFitAll, { passive: true });
    window.addEventListener('orientationchange', scheduleFitAll, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(scheduleFitAll);
      document.querySelectorAll('.pflege-product__purchase-form-wrap').forEach(function (wrap) {
        ro.observe(wrap);
      });
    }
  }

  if (window.__pflegeDeliveryEstimateInit) {
    window.__pflegeDeliveryEstimateInit();
  } else {
    window.__pflegeDeliveryEstimateInit = init;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    document.addEventListener('shopify:section:load', init);
    document.addEventListener('product-info:loaded', init);

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, function () {
        window.setTimeout(init, 0);
      });
    }
  }
})();
