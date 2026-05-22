/* PflegeShop — Seite „Empfohlene Artikel“ (Ergebnisanzeige). */
(function () {
  'use strict';

  var PF = window.PflegeFinder;
  if (!PF) return;

  function findDataScript(root, selector) {
    if (root) {
      var inRoot = root.querySelector(selector);
      if (inRoot) return inRoot;
    }
    return document.querySelector(selector);
  }

  function init(root) {
    if (!root || root.__pflegeEmpfohleneInit) return;
    root.__pflegeEmpfohleneInit = true;

    var configEl = findDataScript(root, 'script[data-pflege-finder-config]');
    var productsEl = findDataScript(root, 'script[data-pflege-finder-products]');
    var viewport = root.querySelector('[data-pflege-empfohlene-viewport]');
    if (!configEl || !productsEl || !viewport) return;

    var config = PF.safeJSON(configEl.textContent, {});
    var products = PF.safeJSON(productsEl.textContent, []);
    var answers = PF.loadAnswers();

    if (!answers) {
      renderNoAnswers(viewport);
      return;
    }

    if (!config.hasCollection || !products.length) {
      renderEmpty(
        viewport,
        'Empfehlungen sind aktuell noch nicht verfügbar',
        'Wir haben aktuell noch keine Produkte für den Finder freigegeben. Bitte schauen Sie in Kürze wieder vorbei oder stöbern Sie direkt in unserem Shop.'
      );
      return;
    }

    var groups = PF.buildResultGroups(products, answers);

    if (!groups.length) {
      renderEmpty(
        viewport,
        'Keine passenden Artikel gefunden',
        'Auf Basis Ihrer Angaben konnten wir aktuell keine passenden Produkte zuordnen. Bitte starten Sie den Produktfinder erneut oder kontaktieren Sie uns für eine persönliche Beratung.'
      );
      return;
    }

    renderGroups(viewport, groups, config);
  }

  function renderNoAnswers(viewport) {
    viewport.innerHTML = '';
    var box = PF.el('div', { class: 'pflege-finder-empty pflege-empfohlene-empty' });
    var p = PF.el('p', { class: 'pflege-finder-empty__body' });
    p.textContent =
      'Starten Sie den Produktfinder, um persönliche Empfehlungen zu erhalten.';
    box.appendChild(p);
    box.appendChild(createStartButton());
    viewport.appendChild(box);
  }

  function renderEmpty(viewport, title, body) {
    viewport.innerHTML = '';
    var box = PF.el('div', { class: 'pflege-finder-empty' });
    var h = PF.el('h2', { class: 'pflege-finder-empty__title' });
    h.textContent = title;
    var p = PF.el('p', { class: 'pflege-finder-empty__body' });
    p.textContent = body;
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(createStartButton());
    viewport.appendChild(box);
  }

  function createStartButton(config) {
    var wrap = PF.el('div', { class: 'pflege-finder-results__restart' });
    var btn = PF.el('button', {
      type: 'button',
      class: 'pflege-finder-restart',
      'data-pflege-finder-open': '',
    });
    btn.textContent = 'Produktfinder starten';
    wrap.appendChild(btn);
    return wrap;
  }

  function renderGroups(viewport, groups) {
    viewport.innerHTML = '';
    var container = PF.el('div', { class: 'pflege-finder-results' });

    var heading = PF.el('h1', { class: 'pflege-finder-results__title' });
    heading.textContent = 'Ihre empfohlenen Artikel';
    container.appendChild(heading);

    groups.forEach(function (group) {
      container.appendChild(renderGroup(group));
    });

    var restartWrap = PF.el('div', { class: 'pflege-finder-results__restart' });
    var restart = PF.el('button', {
      type: 'button',
      class: 'pflege-finder-restart',
      'data-pflege-finder-open': '',
    });
    restart.textContent = 'Neue Empfehlung starten';
    restartWrap.appendChild(restart);
    container.appendChild(restartWrap);

    viewport.appendChild(container);
  }

  function renderGroup(group) {
    var section = PF.el('section', { class: 'pflege-finder-group' });
    var head = PF.el('header', { class: 'pflege-finder-group__head' });
    var title = PF.el('h2', { class: 'pflege-finder-group__title' });
    title.textContent = group.title;
    head.appendChild(title);
    section.appendChild(head);

    if (group.notice) {
      var notice = PF.el('aside', {
        class: 'pflege-finder-notice pflege-finder-notice--wounds',
        role: 'note',
      });
      var noticeBody = PF.el('p', { class: 'pflege-finder-notice__body' });
      noticeBody.textContent = group.notice;
      notice.appendChild(noticeBody);
      section.appendChild(notice);
    }

    var grid = PF.el('div', { class: 'pflege-finder-cards' });
    group.items.forEach(function (item) {
      grid.appendChild(renderProductCard(item));
    });
    section.appendChild(grid);
    return section;
  }

  function renderProductCard(p) {
    var card = PF.el('article', { class: 'pflege-finder-card' });

    var media = PF.el('a', { class: 'pflege-finder-card__media', href: p.url || '#' });
    if (p.image_url) {
      var img = PF.el('img', {
        src: p.image_url,
        alt: p.image_alt || p.title,
        loading: 'lazy',
        decoding: 'async',
      });
      media.appendChild(img);
    } else {
      media.classList.add('pflege-finder-card__media--placeholder');
    }
    card.appendChild(media);

    var body = PF.el('div', { class: 'pflege-finder-card__body' });

    var title = PF.el('h3', { class: 'pflege-finder-card__title' });
    var titleLink = PF.el('a', { href: p.url || '#' });
    titleLink.textContent = p.title || '';
    title.appendChild(titleLink);
    body.appendChild(title);

    if (p.price_html) {
      var price = PF.el('div', { class: 'pflege-finder-card__price' });
      price.textContent = PF.stripHtml(p.price_html);
      body.appendChild(price);
    }

    if (p.finder && p.finder.empfehlungstext) {
      var rec = PF.el('p', { class: 'pflege-finder-card__recommend' });
      rec.textContent = String(p.finder.empfehlungstext);
      body.appendChild(rec);
    }

    var actions = PF.el('div', { class: 'pflege-finder-card__actions' });
    var link = PF.el('a', { class: 'pflege-finder-card__cta', href: p.url || '#' });
    link.textContent = 'Zum Produkt';
    actions.appendChild(link);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function boot() {
    document.querySelectorAll('[data-pflege-empfohlene-artikel]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
