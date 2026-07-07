/**
 * PflegeShop — Kategorie-Filter (Sidebar + Mobile-Drawer)
 * Produkt-Zuordnung zu Filtern: ausschließlich über Shopify-Tags (+ Preis-Slider).
 */
(function () {
  'use strict';

  if (typeof PflegeCategoryAttributes === 'undefined') return;

  var PRICE_FILTER_MIN_CENTS = 0;
  var PRICE_FILTER_MAX_CENTS = 15000;

  var BRAND_LABELS = {
    meditrade: 'Meditrade',
    seni: 'Seni',
    molicare: 'MoliCare',
    tena: 'TENA',
    id: 'iD',
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
    beesana: 'BeeSana',
    hartmann: 'Hartmann',
    gazofix: 'Gazofix',
    octenisan: 'Octenisan',
    merci: 'Merci',
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
    rezeptfaehig: 'Rezeptfähig',
    beliebt: 'Beliebt',
    atmungsaktiv: 'Atmungsaktiv',
    diskret: 'Diskret',
    einweg: 'Einweg',
    latexfrei: 'Latexfrei',
    steril: 'Steril',
    pflegebox: 'Pflegebox',
    hautfreundlich: 'Hautfreundlich',
    saugfaehig: 'Saugfähig',
    alkoholfrei: 'Alkoholfrei',
    puderfrei: 'Puderfrei',
    texturiert: 'Texturiert',
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
            { value: 'zubehoer', label: 'Zubehör' },
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
          ],
        },
        {
          id: 'applicationAreas',
          label: 'Anwendungsbereich',
          options: [
            { value: 'koerper', label: 'Körper' },
            { value: 'gesicht', label: 'Gesicht' },
            { value: 'haende', label: 'Hände' },
            { value: 'fuss-pflege', label: 'Füße' },
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
    inkontinenzversorgung: {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'inkontinenzslips', label: 'Inkontinenzslips' },
            { value: 'inkontinenzpants', label: 'Inkontinenzpants' },
            { value: 'einlagen', label: 'Einlagen' },
            { value: 'vorlagen', label: 'Vorlagen' },
            { value: 'bettschutzeinlagen', label: 'Bettschutzeinlagen' },
            { value: 'fixierhosen-zubehoer', label: 'Fixierhosen & Zubehör' },
            { value: 'reinigung-geruchsentfernung', label: 'Reinigung & Geruchsentfernung' },
          ],
        },
        {
          id: 'absorbency',
          label: 'Saugstärke',
          options: [
            { value: 'leicht', label: 'Leicht', drops: 1 },
            { value: 'mittel', label: 'Mittel', drops: 2 },
            { value: 'stark', label: 'Stark', drops: 3 },
            { value: 'extra-stark', label: 'Extra stark', drops: 4 },
          ],
        },
        {
          id: 'clothingSizes',
          label: 'Größe',
          layout: 'columns',
          options: [
            { value: 's', label: 'S' },
            { value: 'm', label: 'M' },
            { value: 'l', label: 'L' },
            { value: 'xl', label: 'XL' },
            { value: 'xxl', label: 'XXL' },
          ],
        },
        {
          id: 'genders',
          label: 'Geschlecht',
          options: [
            { value: 'damen', label: 'Für Damen' },
            { value: 'herren', label: 'Für Herren' },
          ],
        },
      ],
      badges: ['rezeptfaehig', 'beliebt', 'atmungsaktiv', 'diskret'],
    },
    verbrauchsartikel: {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'wundversorgung-erste-hilfe', label: 'Wundversorgung & Erste Hilfe' },
            { value: 'medikamenten-zubehoer', label: 'Medikamenten Zubehör' },
            { value: 'pflege-alltagshilfen', label: 'Pflege- & Alltagshilfen' },
            { value: 'hygiene-entsorgung', label: 'Hygiene & Entsorgung' },
            { value: 'medizinisches-zubehoer', label: 'Medizinisches Zubehör' },
          ],
        },
      ],
      badges: ['einweg', 'pflegebox'],
    },
    koerperpflege: {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'waschutensilien', label: 'Waschhandschuhe & Waschutensilien' },
            { value: 'shampoo-haare', label: 'Shampoo & Haarpflege' },
            { value: 'dusch-bade', label: 'Dusch- & Badeprodukte' },
            { value: 'zahn-mund', label: 'Zahn- & Mundpflege' },
            { value: 'rasur', label: 'Rasur' },
            { value: 'raum-geruchspflege', label: 'Raum & Geruchspflege' },
          ],
        },
      ],
      badges: ['parfuemfrei', 'hautfreundlich'],
    },
    'schutz-handschuhe': {
      groups: [
        {
          id: 'productTypes',
          label: 'Produkttyp',
          options: [
            { value: 'einmalhandschuhe', label: 'Einmalhandschuhe' },
            { value: 'schutzmasken', label: 'Schutzmasken' },
            { value: 'schutzschuerzen', label: 'Schutzschürzen & Kittel' },
            { value: 'ueberschuhe', label: 'Überschuhe' },
            { value: 'schutzbekleidung', label: 'Schutzbekleidung & Overalls' },
          ],
        },
        {
          id: 'materials',
          label: 'Material',
          options: [
            { value: 'nitril', label: 'Nitril' },
            { value: 'latex', label: 'Latex' },
          ],
        },
        {
          id: 'clothingSizes',
          label: 'Handschuhgröße',
          layout: 'columns',
          options: [
            { value: 'xs', label: 'XS' },
            { value: 's', label: 'S' },
            { value: 'm', label: 'M' },
            { value: 'l', label: 'L' },
            { value: 'xl', label: 'XL' },
            { value: 'xxl', label: 'XXL' },
          ],
        },
      ],
      badges: ['latexfrei', 'puderfrei', 'steril'],
    },
  };

  function resolveCategoryKey(handle) {
    var h = String(handle || '').toLowerCase();
    if (h === 'inkontinenzversorgung' || h === 'inkontinenz') {
      return 'inkontinenzversorgung';
    }
    if (h === 'hautpflege' || h === 'hautschutz-hautpflege' || h === 'hauschutz-hautpflege') {
      return 'hautpflege';
    }
    if (h === 'verbrauchsartikel') {
      return 'verbrauchsartikel';
    }
    if (h === 'koerperpflege' || h === 'korperpflege') {
      return 'koerperpflege';
    }
    if (h === 'schutz-handschuhe' || h === 'schutz-und-handschuhe' || h === 'handschuhe') {
      return 'schutz-handschuhe';
    }
    return 'desinfektion';
  }

  function getFilterConfig(handle) {
    var base = FILTER_CONFIGS[resolveCategoryKey(handle)] || FILTER_CONFIGS.desinfektion;
    return {
      groups: base.groups.slice(),
      badges: base.badges,
    };
  }

  function getStaticFilterValueMap(filterGroups) {
    var map = {};
    filterGroups.forEach(function (group) {
      if (group.dynamic || !group.options) return;
      group.options.forEach(function (option) {
        map[option.value] = group.id;
      });
    });
    return map;
  }

  function getFilterOptionLabel(filterValue, filterGroups) {
    var label = filterValue;
    filterGroups.forEach(function (group) {
      (group.options || []).forEach(function (option) {
        if (option.value === filterValue) label = option.label;
      });
    });
    return label;
  }

  function cloneSelected(selected, filterGroups) {
    var copy = {
      priceMin: selected.priceMin != null ? selected.priceMin : null,
      priceMax: selected.priceMax != null ? selected.priceMax : null,
    };
    filterGroups.forEach(function (group) {
      copy[group.id] = (selected[group.id] || []).slice();
    });
    return copy;
  }

  function createEmptySelected(filterGroups) {
    return cloneSelected({ priceMin: null, priceMax: null }, filterGroups);
  }

  function productMatchesFilterValue(product, filterValue, filterGroups) {
    if (!filterValue) return false;

    var option = {
      value: filterValue,
      label: getFilterOptionLabel(filterValue, filterGroups),
    };
    var rawTags = product.rawTags || PflegeCategoryAttributes.parseProductTags(product);
    var i;
    for (i = 0; i < rawTags.length; i++) {
      if (PflegeCategoryAttributes.tagMatchesFilterOption(rawTags[i], option)) return true;
    }

    var normalizedTags = product.normalizedTags || [];
    return normalizedTags.indexOf(filterValue) !== -1;
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

  function getSelectedFilters(rootOrForm, filterGroups) {
    var selected = {};
    filterGroups.forEach(function (group) {
      selected[group.id] = [];
    });
    selected.priceMin = null;
    selected.priceMax = null;

    if (!rootOrForm) return selected;

    var form = null;
    if (rootOrForm.matches && rootOrForm.matches('[data-pflege-cat-filter-form]')) {
      form = rootOrForm;
    } else if (rootOrForm.querySelector) {
      form =
        rootOrForm.querySelector('[data-pflege-cat-filters-desktop]') ||
        rootOrForm.querySelector('[data-pflege-cat-filters-drawer]');
    }

    if (form) {
      form.querySelectorAll('input[type="checkbox"][data-filter-group]:checked').forEach(function (input) {
        var groupId = input.getAttribute('data-filter-group');
        var value = input.value;
        if (!groupId || !value) return;
        if (!selected[groupId]) selected[groupId] = [];
        if (selected[groupId].indexOf(value) === -1) selected[groupId].push(value);
      });

      var priceMin = form.querySelector('[data-price-min]');
      var priceMax = form.querySelector('[data-price-max]');
      if (priceMin && priceMin.value !== '' && priceMin.value !== priceMin.getAttribute('data-default-min')) {
        selected.priceMin = parseInt(priceMin.value, 10);
      }
      if (priceMax && priceMax.value !== '' && priceMax.value !== priceMax.getAttribute('data-default-max')) {
        selected.priceMax = parseInt(priceMax.value, 10);
      }
    }

    return selected;
  }

  function productMatchesFilters(product, selected, filterGroups) {
    for (var i = 0; i < filterGroups.length; i++) {
      var groupId = filterGroups[i].id;
      var values = selected[groupId] || [];
      if (!values.length) continue;

      var match = values.some(function (value) {
        return productMatchesFilterValue(product, value, filterGroups);
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
        badges.push({
          key: prop,
          label: PROPERTY_LABELS[prop] || prop,
        });
      }
    });
    if (!badges.length) return '';
    return (
      '<div class="pflege-cat-card__badges">' +
      badges
        .slice(0, 2)
        .map(function (badge) {
          var modifier = badge.key === 'rezeptfaehig' ? ' pflege-cat-card__badge--blue' : '';
          return (
            '<span class="pflege-cat-card__badge' +
            modifier +
            '">' +
            escapeHtml(badge.label) +
            '</span>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function renderCard(product, badgeKeys) {
    var cartHtml = '';
    if (product.available && product.variantId && product.variantsCount <= 1) {
      cartHtml =
        '<button type="button" class="pflege-cat-card__cart" data-variant-id="' +
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
      ? '<span class="pflege-cat-card__unit" style="display:block;width:100%;text-align:center;">' + escapeHtml(product.unitPriceFormatted) + '</span>'
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
        : '') +
      '<div class="pflege-cat-card__footer">' +
      '<div class="pflege-cat-card__price-row" style="display:block;width:100%;text-align:center;margin:0;">' +
      '<span class="pflege-cat-card__price" style="display:block;width:100%;text-align:center;">' +
      escapeHtml(product.priceFormatted) +
      '</span>' +
      unitHtml +
      '</div>' +
      cartHtml +
      '</div>' +
      '</div>' +
      '</article>' +
      '</li>'
    );
  }

  function countForOption(products, selected, groupId, optionValue, filterGroups) {
    var testSelected = cloneSelected(selected, filterGroups);
    testSelected[groupId] = [optionValue];
    return products.filter(function (product) {
      return productMatchesFilters(product, testSelected, filterGroups);
    }).length;
  }

  function buildDynamicOptions(products, groupId, filterGroups) {
    var map = {};
    var staticValues = filterGroups ? getStaticFilterValueMap(filterGroups) : {};
    products.forEach(function (product) {
      if (groupId === 'brand' && product.brand) {
        map[product.brand] = BRAND_LABELS[product.brand] || product.vendor || product.brand;
      }
      if (groupId === 'sizes') {
        (product.sizes || []).forEach(function (size) {
          map[size] = size;
        });
      }
      if (groupId === 'tags') {
        (product.rawTags || PflegeCategoryAttributes.parseProductTags(product)).forEach(function (tag) {
          var slug = PflegeCategoryAttributes.normalizeTagSlug(tag);
          if (!slug || staticValues[slug]) return;
          map[slug] = String(tag || '').trim();
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

  function renderDropIcons(count) {
    var html = '<span class="pflege-cat-filter__drops" aria-hidden="true">';
    var i;
    for (i = 0; i < count; i++) {
      html +=
        '<svg class="pflege-cat-filter__drop" xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="currentColor">' +
        '<path d="M6 0C4.2 3.1 1 6.4 1 9.2 1 11.7 3 13.5 6 13.5s5-1.8 5-4.3C11 6.4 7.8 3.1 6 0Z"/>' +
        '</svg>';
    }
    html += '</span>';
    return html;
  }

  function renderFilterGroup(group, products, selected, prefix, collapsible, filterGroups) {
    var options = group.options ? group.options.slice() : [];
    if (group.dynamic) options = buildDynamicOptions(products, group.id, filterGroups);
    if (!options.length) return '';

    var openAttr = collapsible ? '' : ' open';
    var listClass = group.layout === 'columns' ? ' pflege-cat-filter__list--columns' : '';
    var html =
      '<details class="pflege-cat-filter__group"' +
      openAttr +
      ' data-filter-group-wrap="' +
      group.id +
      '">' +
      '<summary class="pflege-cat-filter__group-title">' +
      escapeHtml(group.label) +
      '</summary>' +
      '<ul class="pflege-cat-filter__list' +
      listClass +
      '">';

    options.forEach(function (option) {
      var checked = (selected[group.id] || []).indexOf(option.value) !== -1;
      var count = countForOption(products, selected, group.id, option.value, filterGroups);
      var disabled = count === 0 && !checked;
      var labelPrefix = option.drops ? renderDropIcons(option.drops) : '';
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
        labelPrefix +
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

  function getPriceBounds() {
    return { min: PRICE_FILTER_MIN_CENTS, max: PRICE_FILTER_MAX_CENTS };
  }

  function renderPriceFilter(products, selected, priceBounds, collapsible) {
    var minBound = priceBounds.min;
    var maxBound = priceBounds.max;

    var currentMin = selected.priceMin != null ? selected.priceMin : minBound;
    var currentMax = selected.priceMax != null ? selected.priceMax : maxBound;
    var step = 100;
    var openAttr = collapsible ? '' : ' open';

    return (
      '<details class="pflege-cat-filter__group"' +
      openAttr +
      ' data-filter-group-wrap="price">' +
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
    var openGroups = [];
    container.querySelectorAll('.pflege-cat-filter__group[open]').forEach(function (el) {
      var id = el.getAttribute('data-filter-group-wrap');
      if (id) openGroups.push(id);
    });

    var priceBounds = getPriceBounds();

    var html = '';
    filterGroups.forEach(function (group) {
      html += renderFilterGroup(group, products, selected, prefix, collapsible, filterGroups);
    });
    html += renderPriceFilter(products, selected, priceBounds, collapsible);
    container.innerHTML = html;

    if (collapsible && openGroups.length) {
      openGroups.forEach(function (id) {
        var groupEl = container.querySelector('[data-filter-group-wrap="' + id + '"]');
        if (groupEl) groupEl.open = true;
      });
    }
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
      grid.innerHTML = filtered
        .map(function (product) {
          return renderCard(product, badgeKeys);
        })
        .join('');

      if (root.dataset.pflegeCatAnimReady === 'true') {
        document.dispatchEvent(new CustomEvent('pflege:category-grid-updated', { detail: { root: root } }));
      }
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
    var filterGroups = filterConfig.groups;
    root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (select) {
      select.value = 'manual';
    });
    root._pflegeCatSelected = createEmptySelected(filterGroups);
    applyState(root, products, root._pflegeCatSelected, 'manual', filterConfig);
  }

  function syncDrawerFilters(root, products, selected, filterGroups) {
    var drawerFilters = root.querySelector('[data-pflege-cat-filters-drawer]');
    if (!drawerFilters) return;
    renderFilters(drawerFilters, products, selected, 'drawer', true, filterGroups);
    syncAllPriceRangeVisuals(root);
  }

  function openDrawer(root) {
    var drawer = root.querySelector('[data-pflege-cat-drawer]');
    var toggle = root.querySelector('[data-pflege-cat-filter-toggle]');
    if (!drawer) return;
    syncDrawerFilters(
      root,
      root._pflegeCatProducts || [],
      root._pflegeCatSelected || createEmptySelected(root._pflegeCatFilterGroups || []),
      root._pflegeCatFilterGroups || []
    );
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
    syncDrawerFilters(
      root,
      root._pflegeCatProducts || [],
      root._pflegeCatSelected || createEmptySelected(root._pflegeCatFilterGroups || []),
      root._pflegeCatFilterGroups || []
    );
  }

  function bindDrawerAccordion(root) {
    root.addEventListener(
      'toggle',
      function (event) {
        var details = event.target;
        if (!details.matches || !details.matches('.pflege-cat-filter__group')) return;
        var drawerForm = details.closest('[data-pflege-cat-filters-drawer]');
        if (!drawerForm || !details.open) return;
        drawerForm.querySelectorAll('.pflege-cat-filter__group[open]').forEach(function (other) {
          if (other !== details) other.open = false;
        });
      },
      true
    );
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

    root._pflegeCatProducts = products;
    root._pflegeCatFilterGroups = filterGroups;
    root._pflegeCatSelected = createEmptySelected(filterGroups);
    applyState(root, products, root._pflegeCatSelected, 'manual', filterConfig);

    bindDrawerAccordion(root);

    root.addEventListener('change', function (event) {
      if (!root.contains(event.target)) return;
      if (!event.target.matches('[data-filter-group]')) return;

      var form = event.target.closest('[data-pflege-cat-filter-form]');
      if (form && form.hasAttribute('data-pflege-cat-filters-drawer')) {
        return;
      }

      var groupId = event.target.getAttribute('data-filter-group');
      var value = event.target.value;
      if (!groupId || !value) return;

      var selected = cloneSelected(root._pflegeCatSelected || createEmptySelected(filterGroups), filterGroups);
      if (!selected[groupId]) selected[groupId] = [];

      if (event.target.checked) {
        if (selected[groupId].indexOf(value) === -1) selected[groupId].push(value);
      } else {
        selected[groupId] = selected[groupId].filter(function (item) {
          return item !== value;
        });
      }

      root._pflegeCatSelected = selected;
      applyState(root, products, selected, getSortKey(root), filterConfig);
    });

    root.addEventListener('input', function (event) {
      if (!event.target.matches('[data-price-min], [data-price-max]')) return;
      var form = event.target.closest('[data-pflege-cat-filter-form]');
      if (!form || !root.contains(form)) return;
      syncPriceRangeVisuals(form);
      if (form.hasAttribute('data-pflege-cat-filters-drawer')) {
        return;
      }
      var selected = cloneSelected(root._pflegeCatSelected || createEmptySelected(filterGroups), filterGroups);
      var priceMin = form.querySelector('[data-price-min]');
      var priceMax = form.querySelector('[data-price-max]');
      if (priceMin && priceMin.value !== '' && priceMin.value !== priceMin.getAttribute('data-default-min')) {
        selected.priceMin = parseInt(priceMin.value, 10);
      } else {
        selected.priceMin = null;
      }
      if (priceMax && priceMax.value !== '' && priceMax.value !== priceMax.getAttribute('data-default-max')) {
        selected.priceMax = parseInt(priceMax.value, 10);
      } else {
        selected.priceMax = null;
      }
      root._pflegeCatSelected = selected;
      applyState(root, products, selected, getSortKey(root), filterConfig, {
        skipFilterRender: true,
      });
    });

    root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (select) {
      select.addEventListener('change', function () {
        root.querySelectorAll('[data-pflege-cat-sort]').forEach(function (other) {
          other.value = select.value;
        });
        applyState(
          root,
          products,
          root._pflegeCatSelected || createEmptySelected(filterGroups),
          select.value,
          filterConfig
        );
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
        var selected = getSelectedFilters(drawerForm, filterGroups);
        root._pflegeCatSelected = selected;
        applyState(root, products, selected, getSortKey(root), filterConfig);
        closeDrawer(root);
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeDrawer(root);
    });

    root.dataset.pflegeCatAnimReady = 'true';
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
