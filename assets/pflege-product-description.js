/**
 * ProductDescriptionSection — Ausgabe-Hilfen für Shopify product.description.
 * Entfernt optional Legacy-Abschnitte (nur exakte Überschriften).
 * Wrappt erkannte h2/h3-Abschnitte generisch in optische Blöcke.
 */
(function () {
  var REMOVE_HEADINGS = ['auf einen blick', 'anwendung', 'produkteigenschaften'];

  var TECH_PATTERN =
    /technische|spezifikation|produktdaten|abmessung|maße|inhaltstoff|zusammensetzung|material/i;
  var MANUFACTURER_PATTERN = /hersteller/i;
  var HIGHLIGHT_PATTERN =
    /highlight|vorteil|einsatz|merkmal|eigenschaft|anwendungsbereich|produktinfo/i;

  function normalize(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function headingLevel(node) {
    return parseInt(node.tagName.charAt(1), 10);
  }

  function isUnwantedSectionHeading(node) {
    if (!/^H[1-6]$/.test(node.tagName)) return false;
    var text = normalize(node.textContent);
    return REMOVE_HEADINGS.some(function (label) {
      return text === label || text.indexOf(label + ':') === 0 || text.indexOf(label + ' –') === 0;
    });
  }

  function removeSectionFromHeading(heading) {
    var level = headingLevel(heading);
    var node = heading.nextElementSibling;

    heading.remove();

    while (node) {
      var next = node.nextElementSibling;
      if (/^H[1-6]$/.test(node.tagName) && headingLevel(node) <= level) {
        break;
      }
      node.remove();
      node = next;
    }
  }

  function cleanUnwantedSections(container) {
    Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).forEach(function (heading) {
      if (isUnwantedSectionHeading(heading)) {
        removeSectionFromHeading(heading);
      }
    });
  }

  function blockModifierFromHeading(text) {
    var t = normalize(text);
    if (TECH_PATTERN.test(t)) return 'product-description-block--technical';
    if (MANUFACTURER_PATTERN.test(t)) return 'product-description-block--manufacturer';
    if (HIGHLIGHT_PATTERN.test(t)) return 'product-description-block--highlight';
    return 'product-description-block--default';
  }

  function wrapTables(container) {
    container.querySelectorAll('table').forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains('product-description-table-wrap')) {
        return;
      }
      var wrap = document.createElement('div');
      wrap.className = 'product-description-table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function wrapH3SubsectionsSafe(block) {
    var children = Array.from(block.children);
    var groups = [];
    var current = null;

    children.forEach(function (child) {
      if (/^H3$/i.test(child.tagName)) {
        current = [child];
        groups.push(current);
      } else if (current) {
        current.push(child);
      }
    });

    if (groups.length < 2) return;

    var grid = document.createElement('div');
    grid.className = 'product-description-subgrid';

    groups.forEach(function (group) {
      var sub = document.createElement('div');
      sub.className = 'product-description-subblock';
      group.forEach(function (node) {
        sub.appendChild(node);
      });
      grid.appendChild(sub);
    });

    block.insertBefore(grid, groups[0][0]);
  }

  function wrapTopLevelSections(container) {
    var elements = Array.from(container.children);
    if (!elements.length) return;

    var fragment = document.createDocumentFragment();
    var currentBlock = null;
    var introBlock = null;

    elements.forEach(function (el) {
      if (/^H2$/i.test(el.tagName)) {
        currentBlock = document.createElement('div');
        currentBlock.className =
          'product-description-block ' + blockModifierFromHeading(el.textContent);
        currentBlock.appendChild(el);
        fragment.appendChild(currentBlock);
        return;
      }

      if (currentBlock) {
        currentBlock.appendChild(el);
        return;
      }

      if (!introBlock) {
        introBlock = document.createElement('div');
        introBlock.className = 'product-description-block product-description-block--intro';
        fragment.appendChild(introBlock);
      }
      introBlock.appendChild(el);
    });

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(fragment);

    container.querySelectorAll('.product-description-block').forEach(function (block) {
      if (!block.classList.contains('product-description-block--intro')) {
        wrapH3SubsectionsSafe(block);
      }
    });
  }

  function normalizeInlineTypography(container) {
    container.querySelectorAll('[style]').forEach(function (el) {
      if (!el.style) return;
      el.style.removeProperty('font-size');
      el.style.removeProperty('font-size-adjust');
      el.style.removeProperty('line-height');
      el.style.removeProperty('font-family');
      el.style.removeProperty('font-weight');
      if (!el.getAttribute('style') || !el.getAttribute('style').trim()) {
        el.removeAttribute('style');
      }
    });

    container.querySelectorAll('font').forEach(function (el) {
      el.removeAttribute('size');
      el.removeAttribute('face');
    });
  }

  function enhanceProductDescription(container) {
    if (!container || container.getAttribute('data-pflege-description-ready') === 'true') return;

    normalizeInlineTypography(container);
    cleanUnwantedSections(container);
    wrapTopLevelSections(container);
    wrapTables(container);
    normalizeInlineTypography(container);

    container.setAttribute('data-pflege-description-ready', 'true');
  }

  function init() {
    document.querySelectorAll('[data-pflege-product-description]').forEach(enhanceProductDescription);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
