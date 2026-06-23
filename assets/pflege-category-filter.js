/**
 * PflegeShop — Kategorie-Filter (Sidebar + Mobile-Drawer)
 */
(function () {
  'use strict';

  if (typeof PflegeCategoryAttributes === 'undefined') return;

  var BRAND_LABELS = {
    meditrade: 'Meditrade',
    'seni-care': 'Seni Care',
    alcoman: 'Alcoman',
    ethasept: 'Ethasept',
    medizid: 'Medizid',
    sensiderm: 'Sensiderm',
    tiga: 'Tiga Soft',
    sebamed: 'Sebamed',
    linola: 'Linola',
    excipial: 'Excipial',
    bepanthen: 'Bepanthen',
    eucerin: 'Eucerin',
    doppelherz: 'Doppelherz',
  };

  var PROPERTY_LABELS = {
    'vah-gelistet': 'VAH-gelistet',
    parfuemfrei: 'Parfümfrei',
    gebrauchsfertig: 'Gebrauchsfertig',
    viruzid: 'Viruzid',
    bakterizid: 'Bakterizid',
    alkoholfrei: 'Alkoholfrei',
    'medizinprodukte-geeignet': 'Medizinprodukt',
    'ph-hautneutral': 'pH-hautneutral',
    hypoallergen: 'Hypoallergen',
    'mit-duft': 'Mit Duft',
    'dermatologisch-getestet': 'Dermatologisch getestet',
    'sehr-trockene-haut': 'Für sehr trockene Haut',
    hautschutzfilm: 'Hautschutzfilm',
    lanolin: 'Mit Lanolin',
    vegan: 'Vegan',
  };

  var FILTER_CONFIGS = {
    desinfektion: {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'haendedesinfektion', label: 'Händedesinfektion' },
            { value: 'flaechendesinfektion', label: 'Flächendesinfektion' },
            { value: 'desinfektionstuecher', label: 'Desinfektionstücher' },
            { value: 'desinfektionsgel', label: 'Desinfektionsgel' },
            { value: 'spray', label: 'Spray' },
            { value: 'kanister', label: 'Kanister / Nachfüllung' },
          ],
        },
        {
          id: 'applicationAreas',
          label: 'Anwendungsbereich',
          options: [
            { value: 'hand', label: 'Hände' },
            { value: 'surface', label: 'Flächen' },
          ],
        },
        {
          id: 'forms',
          label: 'Darreichungsform',
          options: [
            { value: 'gel', label: 'Gel' },
            { value: 'fluessigkeit', label: 'Flüssigkeit' },
            { value: 'tuecher', label: 'Tücher' },
            { value: 'spray', label: 'Spray' },
            { value: 'kanister', label: 'Kanister' },
          ],
        },
      ],
      badges: ['vah-gelistet', 'parfuemfrei', 'gebrauchsfertig'],
    },
    hautpflege: {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'creme', label: 'Creme' },
            { value: 'lotion', label: 'Lotion' },
            { value: 'oel', label: 'Öl' },
            { value: 'hautschutz', label: 'Hautschutz / Barriercreme' },
            { value: 'schaum', label: 'Schaum / Mousse' },
            { value: 'spray', label: 'Spray' },
          ],
        },
        {
          id: 'applicationAreas',
          label: 'Anwendungsbereich',
          options: [
            { value: 'koerper', label: 'Körper' },
            { value: 'gesicht', label: 'Gesicht' },
            { value: 'haende', label: 'Hände' },
            { value: 'beine-fuesse', label: 'Beine & Füße' },
            { value: 'intimbereich', label: 'Intimbereich' },
            { value: 'wund-schutz', label: 'Wund- & Schutzpflege' },
          ],
        },
        {
          id: 'properties',
          label: 'Eigenschaften',
          options: [
            { value: 'parfuemfrei', label: 'Parfümfrei' },
            { value: 'vegan', label: 'Vegan' },
          ],
        },
      ],
      badges: ['parfuemfrei', 'vegan'],
    },
  };

  function resolveCategoryKey(handle) {
    var h = String(handle || '').toLowerCase();
    if (h === 'hautpflege' || h === 'hautschutz-hautpflege' || h === 'hauschutz-hautpflege') {
      return 'hautpflege';
    }
    return 'desinfektion';
  }

  function getFilterConfig(handle) {
    return FILTER_CONFIGS[resolveCategoryKey(handle)] || FILTER_CONFIGS.desinfektion;
  }

  function parseConfig(root) {
    var node = root.querySelector('[data-pflege-cat-config]');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      console.error('[PflegeCategoryFilter] Config parse error', e);
      return null;
    }
  }

  function getSelectedFilters(form, filterGroups) {
    var selected = {};
    filterGroups.forEach(function (group) {
      selected[group.id] = [];
    });
    selected.priceMin = null;
    selected.priceMax = null;

    if (!form) return selected;

    form.querySelectorAll('input[type="checkbox"][data-filter-group]:checked').forEach(function (input) {
      var groupId = input.getAttribute('data-filter-group');
      if (!selected[groupId]) selected[groupId] = [];
      selected[groupId].push(input.value);
    });

    var priceMin = form.querySelector('[data-price-min]');
    var priceMax = form.querySelector('[data-price-max]');
    if (priceMin && priceMin.value !== '' && priceMin.value !== priceMin.getAttribute('data-default-min')) {
      selected.priceMin = parseInt(priceMin.value, 10);
    }
    if (priceMax && priceMax.value !== '' && priceMax.value !== priceMax.getAttribute('data-default-max')) {
      selected.priceMax = parseInt(priceMax.value, 10);
    }

    return selected;
  }

  function productMatchesFilters(product, selected, filterGroups) {
    for (var i = 0; i < filterGroups.length; i++) {
      var groupId = filterGroups[i].id;
      var values = selected[groupId] || [];
      if (!values.length) continue;

      if (groupId === 'brand') {
        if (values.indexOf(product.brand) === -1) return false;
        continue;
      }

      var productValues = product[groupId] || [];
      var match = values.some(function (value) {
        return productValues.indexOf(value) !== -1;
      });
      if (!match) return false;
    }

    if (selected.priceMin != null && product.priceMax < selected.priceMin) return false;
    if (selected.priceMax != null && product.priceMin > selected.priceMax) return false;

    return true;
  }

  function sortProducts(products, sortKey) {
    var list = products.slice();
    switch (sortKey) {
      case 'price-ascending':
        list.sort(function (a, b) {
          return a.priceMin - b.priceMin || a.title.localeCompare(b.title, 'de');
        });
        break;
      case 'price-descending':
        list.sort(function (a, b) {
          return b.priceMin - a.priceMin || a.title.localeCompare(b.title, 'de');
        });
        break;
      case 'title-ascending':
        list.sort(function (a, b) {
          return a.title.localeCompare(b.title, 'de');
        });
        break;
      case 'title-descending':
        list.sort(function (a, b) {
          return b.title.localeCompare(a.title, 'de');
        });
        break;
      default:
        list.sort(function (a, b) {
          return (a.sortIndex || 0) - (b.sortIndex || 0);
        });
    }
    return list;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderBadges(product, badgeKeys) {
    var badges = [];
    (product.properties || []).forEach(function (prop) {
      if (badgeKeys.indexOf(prop) !== -1) {
        badges.push(PROPERTY_LABELS[prop] || prop);
      }
    });
    if (!badges.length) return '';
    return (
      '<div class="pflege-cat-card__badges">' +
      badges
        .slice(0, 2)
        .map(function (badge) {
          return '<span class="pflege-cat-card__badge">' + escapeHtml(badge) + '</span>';
        })
        .join('') +
      '</div>'
    );
  }

  function renderCard(product, badgeKeys) {
    var cartHtml = '';
    if (product.available && product.variantId && product.variantsCount <= 1) {
      cartHtml =
        '<button type="button" class="pflege-cat-card__cart pflege-bestseller-card__cart" data-variant-id="' +
        escapeHtml(String(product.variantId)) +
        '">' +
        '<span class="pflege-cat-card__cart-icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '</span>' +
        '<span>In den Warenkorb</span>' +
        '</button>';
    } else {
      cartHtml =
        '<a href="' +
        escapeHtml(product.url) +
        '" class="pflege-cat-card__cart pflege-cat-card__cart--link">' +
        '<span class="pflege-cat-card__cart-icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '</span>' +
        '<span>' +
        (product.available ? 'Optionen wählen' : 'Ausverkauft') +
        '</span>' +
        '</a>';
    }

    var unitHtml = product.unitPriceFormatted
      ? '<span class="pflege-cat-card__unit">' + escapeHtml(product.unitPriceFormatted) + '</span>'
      : '';

    return (
      '<li class="pflege-cat-card">' +
      '<article class="pflege-cat-card__inner">' +
      '<div class="pflege-cat-card__media">' +
      renderBadges(product, badgeKeys) +
      (product.image
        ? '<a href="' +
          escapeHtml(product.url) +
          '" class="pflege-cat-card__media-link"><img class="pflege-cat-card__img" src="' +
          escapeHtml(product.image) +
          '" alt="' +
          escapeHtml(product.imageAlt || product.title) +
          '" loading="lazy" width="480" height="480"></a>'
        : '<a href="' +
          escapeHtml(product.url) +
          '" class="pflege-cat-card__media-link pflege-cat-card__media-link--placeholder"><span class="pflege-cat-card__placeholder">Produktbild</span></a>') +
      '</div>' +
      '<div class="pflege-cat-card__body">' +
      '<h3 class="pflege-cat-card__title"><a href="' +
      escapeHtml(product.url) +
      '">' +
      escapeHtml(product.title) +
      '</a></h3>' +
      (product.subtitle
        ? '<p class="pflege-cat-card__desc">' + escapeHtml(product.subtitle) + '</p>'
        : '<p class="pflege-cat-card__desc pflege-cat-card__desc--empty">&nbsp;</p>') +
      '<div class="pflege-cat-card__price-row">' +
      '<span class="pflege-cat-card__price">' +
      escapeHtml(product.priceFormatted) +
      '</span>' +
      unitHtml +
      '</div>' +
      cartHtml +
      '</div>' +
      '</article>' +
      '</li>'
    );
  }

  function countForOption(products, selected, groupId, optionValue, filterGroups) {
    var testSelected = JSON.parse(JSON.stringify(selected));
    // Facetten-Zählung: andere Gruppen behalten, in dieser Gruppe nur die eine Option testen.
    testSelected[groupId] = [optionValue];
    return products.filter(function (product) {
      return productMatchesFilters(product, testSelected, filterGroups);
    }).length;
  }

  function buildDynamicOptions(products, groupId) {
    var map = {};
    products.forEach(function (product) {
      if (groupId === 'brand' && product.brand) {
        map[product.brand] = BRAND_LABELS[product.brand] || product.vendor || product.brand;
      }
      if (groupId === 'sizes') {
        (product.sizes || []).forEach(function (size) {
          map[size] = size;
        });
      }
    });
    return Object.keys(map)
      .sort(function (a, b) {
        return map[a].localeCompare(map[b], 'de', { numeric: true });
      })
      .map(function (value) {
        return { value: value, label: map[value] };
      });
  }

  function renderFilterGroup(group, products, selected, prefix, collapsible, filterGroups) {
    var options = group.options ? group.options.slice() : [];
    if (group.dynamic) options = buildDynamicOptions(products, group.id);
    if (!options.length) return '';

    var openAttr = collapsible ? '' : ' open';
    var html =
      '<details class="pflege-cat-filter__group"' +
      openAttr +
      ' data-filter-group-wrap="' +
      group.id +
      '">' +
      '<summary class="pflege-cat-filter__group-title">' +
      escapeHtml(group.label) +
      '</summary>' +
      '<ul class="pflege-cat-filter__list">';

    options.forEach(function (option) {
      var count = countForOption(products, selected, group.id, option.value, filterGroups);
      var checked = (selected[group.id] || []).indexOf(option.value) !== -1;
      var disabled = count === 0 && !checked;
      html +=
        '<li class="pflege-cat-filter__item">' +
        '<label class="pflege-cat-filter__label' +
        (disabled ? ' is-disabled' : '') +
        '">' +
        '<input type="checkbox" class="pflege-cat-filter__checkbox" data-filter-group="' +
        group.id +
        '" value="' +
        escapeHtml(option.value) +
        '" name="' +
        prefix +
        '-' +
        group.id +
        '" ' +
        (checked ? 'checked' : '') +
        (disabled ? ' disabled' : '') +
        '>' +
        '<span class="pflege-cat-filter__label-text">' +
        escapeHtml(option.label) +
        '</span>' +
        '<span class="pflege-cat-filter__count">(' +
        count +
        ')</span>' +
        '</label>' +
        '</li>';
    });

    html += '</ul></details>';
    return html;
  }

  function formatEuro(cents) {
    return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  function syncPriceRangeVisuals(form) {
    if (!form) return;
    var minInput = form.querySelector('[data-price-min]');
    var maxInput = form.querySelector('[data-price-max]');
    var fill = form.querySelector('[data-price-fill]');
    if (!minInput || !maxInput) return;

    var minBound = parseInt(minInput.getAttribute('min'), 10);
    var maxBound = parseInt(minInput.getAttribute('max'), 10);
    var minVal = parseInt(minInput.value, 10);
    var maxVal = parseInt(maxInput.value, 10);

    if (minVal > maxVal) {
      if (document.activeElement === minInput) {
        maxInput.value = String(minVal);
        maxVal = minVal;
      } else {
        minInput.value = String(maxVal);
        minVal = maxVal;
      }
    }

    var span = maxBound - minBound || 1;
    var leftPct = ((minVal - minBound) / span) * 100;
    var widthPct = ((maxVal - minVal) / span) * 100;

    if (fill) {
      fill.style.left = leftPct + '%';
      fill.style.width = widthPct + '%';
    }

    var minLabel = form.querySelector('[data-price-min-label]');
    var maxLabel = form.querySelector('[data-price-max-label]');
    if (minLabel) minLabel.textContent = formatEuro(minVal);
    if (maxLabel) maxLabel.textContent = formatEuro(maxVal);
  }

  function syncAllPriceRangeVisuals(root) {
    root.querySelectorAll('[data-pflege-cat-filter-form]').forEach(syncPriceRangeVisuals);
  }

  function renderPriceFilter(products, selected, priceBounds) {
    var minBound = priceBounds.min;
    var maxBound = priceBounds.max;
    if (minBound === maxBound) return '';

    var currentMin = selected.priceMin != null ? selected.priceMin : minBound;
    var currentMax = selected.priceMax != null ? selected.priceMax : maxBound;
    var step = Math.max(50, Math.round((maxBound - minBound) / 100));

    return (
      '<details class="pflege-cat-filter__group" open data-filter-group-wrap="price">' +
      '<summary class="pflege-cat-filter__group-title">Preis</summary>' +
      '<div class="pflege-cat-filter__price" data-price-range>' +
      '<div class="pflege-cat-filter__price-values">' +
      '<span data-price-min-label>' +
      formatEuro(currentMin) +
      '</span>' +
      '<span class="pflege-cat-filter__price-sep" aria-hidden="true">–</span>' +
      '<span data-price-max-label>' +
      formatEuro(currentMax) +
      '</span>' +
      '</div>' +
      '<div class="pflege-cat-filter__range-wrap">' +
      '<div class="pflege-cat-filter__range-track" aria-hidden="true">' +
      '<div class="pflege-cat-filter__range-fill" data-price-fill></div>' +
      '</div>' +
      '<input type="range" class="pflege-cat-filter__range pflege-cat-filter__range--min" data-price-min data-default-min="' +
      minBound +
      '" min="' +
      minBound +
      '" max="' +
      maxBound +
      '" step="' +
      step +
      '" value="' +
      currentMin +
      '" aria-label="Mindestpreis">' +
      '<input type="range" class="pflege-cat-filter__range pflege-cat-filter__range--max" data-price-max data-default-max="' +
      maxBound +
      '" min="' +
      minBound +
      '" max="' +
      maxBound +
      '" step="' +
      step +
      '" value="' +
      currentMax +
      '" aria-label="Höchstpreis">' +
      '</div>' +
      '</div>' +
      '</details>'
    );
  }

  function renderFilters(container, products, selected, prefix, collapsible, filterGroups) {
    if (!container) return;
    var priceBounds = {
      min: Math.min.apply(
        null,
        products.map(function (p) {
          return p.priceMin;
        })
      ),
      max: Math.max.apply(
        null,
        products.map(function (p) {
          return p.priceMax;
        })
      ),
    };

    var html = '';
    filterGroups.forEach(function (group) {
      html += renderFilterGroup(group, products, selected, prefix, collapsible, filterGroups);
    });
    html += renderPriceFilter(products, selected, priceBounds);
    container.innerHTML = html;
  }

  function updateCountLabels(root, count) {
    root.querySelectorAll('[data-product-count]').forEach(function (node) {
      node.textContent = count === 1 ? '1 Produkt gefunden' : count + ' Produkte gefunden';
    });
  }

  function applyState(root, products, selected, sortKey, filterConfig, options) {
    options = options || {};
    var filterGroups = filterConfig.groups;
    var badgeKeys = filterConfig.badges;

    var filtered = products.filter(function (product) {
      return productMatchesFilters(product, selected, filterGroups);
    });
    filtered = sortProducts(filtered, sortKey);

    var grid = root.querySelector('[data-pflege-cat-grid]');
    var empty = root.querySelector('[data-pflege-cat-empty]');

    if (grid) {
      grid.innerHTML = filtered.map(function (product) {
        return renderCard(product, badgeKeys);
      }).join('');
    }

    if (empty) {
      empty.hidden = filtered.length > 0;
    }

    updateCountLabels(root, filtered.length);

    if (!options.skipFilterRender) {
      var desktopFilters = root.querySelector('[data-pflege-cat-filters-desktop]');
      var drawerFilters = root.querySelector('[data-pflege-cat-filters-drawer]');
      renderFilters(desktopFilters, products, selected, 'desktop', false, filterGroups);
      renderFilters(drawerFilters, products, selected, 'drawer', true, filterGroups);
      syncAllPriceRangeVisuals(root);
    }
  }

  function resetFilters(root, products, filterConfig) {
    root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (select) {
      select.value = 'manual';
    });
    applyState(root, products, getSelectedFilters(null, filterConfig.groups), 'manual', filterConfig);
  }

  function openDrawer(root) {
    var drawer = root.querySelector('[data-pflege-cat-drawer]');
    var toggle = root.querySelector('[data-pflege-cat-filter-toggle]');
    if (!drawer) return;
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('pflege-cat-drawer-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer(root) {
    var drawer = root.querySelector('[data-pflege-cat-drawer]');
    var toggle = root.querySelector('[data-pflege-cat-filter-toggle]');
    if (!drawer) return;
    drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('pflege-cat-drawer-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function getSortKey(root) {
    var sort = root.querySelector('[data-pflege-cat-sort]');
    return sort ? sort.value : 'manual';
  }

  function initRoot(root) {
    var config = parseConfig(root);
    if (!config || !config.products) return;

    var filterConfig = getFilterConfig(config.collectionHandle);
    var filterGroups = filterConfig.groups;

    var products = config.products.map(function (product, index) {
      var enriched = PflegeCategoryAttributes.enrichProduct(product);
      enriched.sortIndex = index;
      return enriched;
    });

    applyState(root, products, getSelectedFilters(null, filterGroups), 'manual', filterConfig);

    root.addEventListener('change', function (event) {
      var form = event.target.closest('[data-pflege-cat-filter-form]');
      if (!form || !root.contains(form)) return;
      if (!event.target.matches('[data-filter-group], [data-price-min], [data-price-max]')) return;
      applyState(root, products, getSelectedFilters(form, filterGroups), getSortKey(root), filterConfig);
    });

    root.addEventListener('input', function (event) {
      if (!event.target.matches('[data-price-min], [data-price-max]')) return;
      var form = event.target.closest('[data-pflege-cat-filter-form]');
      if (!form || !root.contains(form)) return;
      syncPriceRangeVisuals(form);
      applyState(root, products, getSelectedFilters(form, filterGroups), getSortKey(root), filterConfig, {
        skipFilterRender: true,
      });
    });

    root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (select) {
      select.addEventListener('change', function () {
        root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (other) {
          other.value = select.value;
        });
        var desktopForm = root.querySelector('[data-pflege-cat-filters-desktop]');
        applyState(root, products, getSelectedFilters(desktopForm, filterGroups), select.value, filterConfig);
      });
    });

    root.querySelectorAll('[data-pflege-cat-reset]').forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        resetFilters(root, products, filterConfig);
      });
    });

    var toggle = root.querySelector('[data-pflege-cat-filter-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        if (toggle.getAttribute('aria-expanded') === 'true') closeDrawer(root);
        else openDrawer(root);
      });
    }

    root.querySelectorAll('[data-pflege-cat-drawer-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeDrawer(root);
      });
    });

    var drawerApply = root.querySelector('[data-pflege-cat-drawer-apply]');
    if (drawerApply) {
      drawerApply.addEventListener('click', function () {
        var drawerForm = root.querySelector('[data-pflege-cat-filters-drawer]');
        applyState(root, products, getSelectedFilters(drawerForm, filterGroups), getSortKey(root), filterConfig);
        closeDrawer(root);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer(root);
    });
  }

  function start() {
    document.querySelectorAll('[data-pflege-category-filtered]').forEach(initRoot);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
