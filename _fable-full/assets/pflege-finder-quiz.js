/* PflegeShop Produktfinder — Wizard (Popup + Seite). */
(function () {
  'use strict';

  var PF = window.PflegeFinder;
  if (!PF) return;

  var SCRIPT_FLAG = '__pflegeFinderInit';

  function findDataScript(root, selector) {
    if (root) {
      var inRoot = root.querySelector(selector);
      if (inRoot) return inRoot;
    }
    return document.querySelector(selector);
  }

  function init(root) {
    if (!root || root[SCRIPT_FLAG]) return;
    root[SCRIPT_FLAG] = true;

    var configEl = findDataScript(root, 'script[data-pflege-finder-config]');
    var productsEl = findDataScript(root, 'script[data-pflege-finder-products]');
    var viewport = root.querySelector('[data-pflege-finder-viewport]');
    var progressBar = root.querySelector('[data-pflege-finder-progress-bar]');
    if (!configEl || !productsEl || !viewport) return;

    var config = PF.safeJSON(configEl.textContent, {});
    var products = PF.safeJSON(productsEl.textContent, []);

    var state = {
      config: config,
      products: Array.isArray(products) ? products : [],
      answers: {},
      stepIndex: 0,
      flow: PF.buildFlow(),
      root: root,
    };

    render(state, viewport, progressBar);
  }

  function render(state, viewport, progressBar) {
    var visibleSteps = state.flow.filter(function (s) {
      return !s.condition || s.condition(state.answers);
    });

    if (state.stepIndex >= visibleSteps.length) {
      completeWizard(state);
      return;
    }

    var step = visibleSteps[state.stepIndex];
    updateProgress(progressBar, state.stepIndex, visibleSteps.length);

    viewport.innerHTML = '';
    viewport.appendChild(createStep(step, state, viewport, progressBar));
  }

  function updateProgress(bar, index, total) {
    if (!bar) return;
    var pct = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 0;
    bar.style.width = pct + '%';
    if (bar.parentElement) bar.parentElement.setAttribute('aria-valuenow', String(pct));
  }

  function createStep(step, state, viewport, progressBar) {
    var wrapper = PF.el('div', { class: 'pflege-finder-step' });

    var heading = PF.el('h2', { class: 'pflege-finder-step__title' });
    heading.textContent = step.title;
    wrapper.appendChild(heading);

    var list = PF.el('div', {
      class: 'pflege-finder-step__options',
      role: 'radiogroup',
      'aria-label': step.title,
    });

    step.options.forEach(function (opt) {
      var btn = PF.el('button', {
        type: 'button',
        class: 'pflege-finder-option',
        'data-value': opt.value,
        role: 'radio',
        'aria-checked': 'false',
      });
      btn.textContent = opt.label;
      btn.addEventListener('click', function () {
        var prev = state.answers[step.id];
        state.answers[step.id] = opt.value;
        if (prev !== undefined && prev !== opt.value) {
          PF.dropAnswersAfter(state, step.id);
        }
        state.stepIndex += 1;
        render(state, viewport, progressBar);
      });
      list.appendChild(btn);
    });
    wrapper.appendChild(list);

    if (state.stepIndex > 0) {
      var nav = PF.el('div', { class: 'pflege-finder-step__nav' });
      var back = PF.el('button', { type: 'button', class: 'pflege-finder-back' });
      back.textContent = 'Zurück';
      back.addEventListener('click', function () {
        state.stepIndex = Math.max(0, state.stepIndex - 1);
        var visibleSteps = state.flow.filter(function (s) {
          return !s.condition || s.condition(state.answers);
        });
        var prevStep = visibleSteps[state.stepIndex];
        if (prevStep) delete state.answers[prevStep.id];
        render(state, viewport, progressBar);
      });
      nav.appendChild(back);
      wrapper.appendChild(nav);
    }

    return wrapper;
  }

  function completeWizard(state) {
    PF.saveAnswers(state.answers);

    var resultsUrl = (state.config && state.config.resultsUrl) || '/pages/empfohlene-artikel';
    var dialog = state.root.closest('dialog');

    if (dialog && typeof dialog.close === 'function') {
      try {
        dialog.close();
      } catch (e) {}
    }

    window.location.href = resultsUrl;
  }

  function resetWizard(root) {
    var viewport = root.querySelector('[data-pflege-finder-viewport]');
    var progressBar = root.querySelector('[data-pflege-finder-progress-bar]');
    var configEl = findDataScript(root, 'script[data-pflege-finder-config]');
    var productsEl = findDataScript(root, 'script[data-pflege-finder-products]');
    if (!viewport || !configEl || !productsEl) return;

    var config = PF.safeJSON(configEl.textContent, {});
    var products = PF.safeJSON(productsEl.textContent, []);

    var state = {
      config: config,
      products: Array.isArray(products) ? products : [],
      answers: {},
      stepIndex: 0,
      flow: PF.buildFlow(),
      root: root,
    };

    render(state, viewport, progressBar);
  }

  function initPopupTriggers() {
    if (window.__pflegeFinderPopupInit) return;
    window.__pflegeFinderPopupInit = true;

    var dialog = document.getElementById('pflege-finder-modal');
    if (!dialog) return;

    function openModal() {
      if (typeof dialog.showModal !== 'function') return;
      var root = dialog.querySelector('[data-pflege-finder]');
      if (root) resetWizard(root);
      dialog.showModal();
    }

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-pflege-finder-open]');
      if (!trigger) return;
      e.preventDefault();
      openModal();
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    dialog.querySelectorAll('[data-pflege-finder-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (dialog.open) dialog.close();
      });
    });

    if (window.location.hash === '#pflege-finder-open') {
      openModal();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  function boot() {
    document.querySelectorAll('[data-pflege-finder]').forEach(init);
    initPopupTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
