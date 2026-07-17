/* PflegeShop — Seite „Empfohlene Artikel“ (Ergebnisanzeige). */
(function () {
  'use strict';

  var BOOT_ATTEMPTS = 0;
  var BOOT_MAX_ATTEMPTS = 120;

  function getPF() {
    return window.PflegeFinder || null;
  }

  function findDataScript(root, selector) {
    if (root) {
      var inRoot = root.querySelector(selector);
      if (inRoot) return inRoot;
    }
    return document.querySelector(selector);
  }

  function showBootError(viewport, message) {
    if (!viewport) return;
    viewport.innerHTML =
      '<div class="pflege-finder-empty pflege-empfohlene-empty">' +
      '<p class="pflege-finder-empty__body">' +
      message +
      '</p>' +
      '<div class="pflege-finder-results__restart">' +
      '<button type="button" class="pflege-finder-restart" data-pflege-finder-open>Produktfinder starten</button>' +
      '</div></div>';
  }

  function init(root) {
    var PF = getPF();
    var viewport = root && root.querySelector('[data-pflege-empfohlene-viewport]');

    if (!PF) return false;
    if (!root || root.__pflegeEmpfohleneInit) return true;
    if (!viewport) return true;

    root.__pflegeEmpfohleneInit = true;

    var configEl = findDataScript(root, 'script[data-pflege-finder-config]');
    var productsEl = findDataScript(root, 'script[data-pflege-finder-products]');

    if (!configEl || !productsEl) {
      showBootError(
        viewport,
        'Die Produktdaten konnten nicht geladen werden. Bitte laden Sie die Seite neu oder starten Sie den Produktfinder erneut.'
      );
      return true;
    }

    var config = PF.safeJSON(configEl.textContent, {});
    var products = PF.safeJSON(productsEl.textContent, []);
    if (!Array.isArray(products)) products = [];
    var answers = PF.loadAnswers();

    if (!answers) {
      renderNoAnswers(viewport, PF);
      return true;
    }

    if (!config.hasCollection || !products.length) {
      renderEmpty(
        viewport,
        PF,
        'Empfehlungen sind aktuell noch nicht verfügbar',
        'Wir haben aktuell noch keine Produkte für den Finder freigegeben. Bitte schauen Sie in Kürze wieder vorbei oder stöbern Sie direkt in unserem Shop.'
      );
      return true;
    }

    var groups = PF.buildResultGroups(products, answers);
    var pflegegradBlock = null;
    if (PF.shouldShowPflegegradBlock && PF.shouldShowPflegegradBlock(answers)) {
      var root = viewport.closest('[data-pflege-empfohlene-artikel]');
      pflegegradBlock = PF.getPflegegradBlock(answers, {
        pflegeboxUrl: (root && root.getAttribute('data-pflegebox-url')) || '/products/pflegebox',
        infoUrl: (root && root.getAttribute('data-pflegehilfsmittel-url')) || '/pages/pflegehilfsmittel',
      });
    }

    if (!groups.length) {
      renderEmpty(
        viewport,
        PF,
        'Keine passenden Artikel gefunden',
        'Auf Basis Ihrer Angaben konnten wir aktuell keine passenden Produkte zuordnen. Bitte starten Sie den Produktfinder erneut oder kontaktieren Sie uns für eine persönliche Beratung.'
      );
      return true;
    }

    renderGroups(viewport, groups, PF, pflegegradBlock);
    return true;
  }

  function renderNoAnswers(viewport, PF) {
    viewport.innerHTML = '';
    var box = PF.el('div', { class: 'pflege-finder-empty pflege-empfohlene-empty' });
    var p = PF.el('p', { class: 'pflege-finder-empty__body' });
    p.textContent =
      'Starten Sie den Produktfinder, um persönliche Empfehlungen zu erhalten.';
    box.appendChild(p);
    box.appendChild(createStartButton(PF));
    viewport.appendChild(box);
  }

  function renderEmpty(viewport, PF, title, body) {
    viewport.innerHTML = '';
    var box = PF.el('div', { class: 'pflege-finder-empty' });
    var h = PF.el('h2', { class: 'pflege-finder-empty__title' });
    h.textContent = title;
    var p = PF.el('p', { class: 'pflege-finder-empty__body' });
    p.textContent = body;
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(createStartButton(PF));
    viewport.appendChild(box);
  }

  function createStartButton(PF) {
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

  function renderPflegegradBlock(block, PF) {
    var aside = PF.el('aside', {
      class: 'pflege-finder-promo pflege-finder-promo--pflegegrad',
      role: 'region',
      'aria-labelledby': 'pflege-finder-promo-pflegegrad-title',
    });

    var title = PF.el('h2', {
      class: 'pflege-finder-promo__title',
      id: 'pflege-finder-promo-pflegegrad-title',
    });
    title.textContent = block.title;
    aside.appendChild(title);

    var lead = PF.el('p', { class: 'pflege-finder-promo__lead' });
    lead.textContent = block.lead;
    aside.appendChild(lead);

    var text = PF.el('p', { class: 'pflege-finder-promo__text' });
    text.textContent = block.text;
    aside.appendChild(text);

    var actions = PF.el('div', { class: 'pflege-finder-promo__actions' });
    var primary = PF.el('a', {
      class: 'pflege-finder-promo__cta pflege-finder-promo__cta--primary',
      href: block.pflegeboxUrl,
    });
    primary.textContent = block.ctaPrimary;
    actions.appendChild(primary);

    var secondary = PF.el('a', {
      class: 'pflege-finder-promo__cta pflege-finder-promo__cta--secondary',
      href: block.infoUrl,
    });
    secondary.textContent = block.ctaSecondary;
    actions.appendChild(secondary);

    aside.appendChild(actions);
    return aside;
  }

  function renderGroups(viewport, groups, PF, pflegegradBlock) {
    viewport.innerHTML = '';
    var container = PF.el('div', { class: 'pflege-finder-results' });

    var heading = PF.el('h1', { class: 'pflege-finder-results__title' });
    heading.textContent = 'Ihre empfohlenen Artikel';
    container.appendChild(heading);

    if (pflegegradBlock) {
      container.appendChild(renderPflegegradBlock(pflegegradBlock, PF));
    }

    groups.forEach(function (group) {
      container.appendChild(renderGroup(group, PF));
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

  function renderCardGrid(items, PF) {
    var grid = PF.el('div', { class: 'pflege-finder-cards' });
    items.forEach(function (item) {
      grid.appendChild(renderProductCard(item, PF));
    });
    return grid;
  }

  function renderGroup(group, PF) {
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

    var hasSplit =
      group.moreItems &&
      group.moreItems.length &&
      group.topItems &&
      group.topItems.length;

    if (hasSplit) {
      var topWrap = PF.el('div', { class: 'pflege-finder-group__tier' });
      var topLabel = PF.el('h3', { class: 'pflege-finder-group__tier-title' });
      topLabel.textContent = 'Besonders passend';
      topWrap.appendChild(topLabel);
      topWrap.appendChild(renderCardGrid(group.topItems, PF));
      section.appendChild(topWrap);

      var moreWrap = PF.el('div', { class: 'pflege-finder-group__tier pflege-finder-group__tier--more' });
      var moreLabel = PF.el('h3', { class: 'pflege-finder-group__tier-title' });
      moreLabel.textContent = 'Weitere passende Artikel';
      moreWrap.appendChild(moreLabel);
      moreWrap.appendChild(renderCardGrid(group.moreItems, PF));
      section.appendChild(moreWrap);
    } else {
      section.appendChild(renderCardGrid(group.items || group.topItems || [], PF));
    }

    return section;
  }

  function renderProductCard(p, PF) {
    var cardClass = 'pflege-finder-card pf-product-card';
    if (p._tier === 'top') cardClass += ' pflege-finder-card--top';
    var card = PF.el('article', { class: cardClass });

    var media = PF.el('a', { class: 'pflege-finder-card__media', href: p.url || '#' });
    if (p._topRecommended) {
      var badge = PF.el('div', { class: 'pf-recommendation-badge' });
      badge.textContent = 'Am meisten empfohlen';
      badge.setAttribute('aria-label', 'Am meisten empfohlen');
      media.appendChild(badge);
    }
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

    if (p._variantHint) {
      var hint = PF.el('p', { class: 'pflege-finder-card__variant-hint' });
      hint.textContent = String(p._variantHint);
      body.appendChild(hint);
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
    var roots = document.querySelectorAll('[data-pflege-empfohlene-artikel]');
    if (!roots.length) return true;
    if (!getPF()) return false;

    var allOk = true;
    roots.forEach(function (root) {
      if (!init(root)) allOk = false;
    });
    return allOk;
  }

  function bootWhenReady() {
    BOOT_ATTEMPTS += 1;

    if (boot()) return;

    if (BOOT_ATTEMPTS >= BOOT_MAX_ATTEMPTS) {
      document.querySelectorAll('[data-pflege-empfohlene-viewport]').forEach(function (viewport) {
        showBootError(
          viewport,
          'Die Empfehlungen konnten nicht geladen werden. Bitte laden Sie die Seite neu oder starten Sie den Produktfinder erneut.'
        );
      });
      return;
    }

    window.setTimeout(bootWhenReady, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootWhenReady);
  } else {
    bootWhenReady();
  }
})();
