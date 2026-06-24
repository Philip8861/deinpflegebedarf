/**
 * ProductDescriptionSection — Ausgabe-Hilfen für Shopify product.description.
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
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function plainText(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return String(tmp.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function headingLevel(node) {
    return parseInt(node.tagName.charAt(1), 10);
  }

  function endsWithColon(text) {
    if (!text) return false;
    var last = text.charAt(text.length - 1);
    return last === ':' || last === '\uFF1A';
  }

  function isLikelyListHeadingText(text) {
    var t = normalize(text);
    if (!t || t.length < 8) return false;
    if (endsWithColon(t)) return t.length <= 140;
    if (t.length <= 90) {
      return (
        /einsatzbereiche|highlights|technische daten|eigenschaften|anwendung|vorteile|merkmale|herstellerinformationen/.test(
          t
        ) || /^(die |vielseitige |kinderleichte )/.test(t)
      );
    }
    return false;
  }

  function markListHeading(node) {
    if (!node || node.classList.contains('product-description-list-heading')) return;

    if (/^H[1-6]$/.test(node.tagName)) {
      node.classList.add('product-description-section-heading');
      return;
    }

    if (node.tagName === 'P') {
      node.classList.add('product-description-list-heading');
      return;
    }

    var heading = document.createElement('p');
    heading.className = 'product-description-list-heading';
    heading.innerHTML = node.innerHTML;
    node.parentNode.replaceChild(heading, node);
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

  function previousMeaningfulSibling(node) {
    var prev = node.previousElementSibling;
    while (prev) {
      if (/^BR|HR$/i.test(prev.tagName)) {
        prev = prev.previousElementSibling;
        continue;
      }

      var text = normalize(prev.textContent);
      if (!text && !prev.querySelector('img, table, ul, ol, iframe, video')) {
        prev = prev.previousElementSibling;
        continue;
      }

      return prev;
    }
    return null;
  }

  function wrapBareTextBeforeList(list) {
    var parent = list.parentElement;
    if (!parent) return;

    var node = list.previousSibling;
    var nodesToRemove = [];
    var chunks = [];

    while (node) {
      if (node.nodeType === 3) {
        var t = String(node.textContent || '')
          .replace(/\u00a0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (t) chunks.unshift(t);
        nodesToRemove.unshift(node);
        node = node.previousSibling;
      } else if (node.nodeType === 1 && /^BR$/i.test(node.tagName)) {
        nodesToRemove.unshift(node);
        node = node.previousSibling;
      } else {
        break;
      }
    }

    if (!chunks.length) return;

    var text = chunks.join(' ').replace(/\s+/g, ' ').trim();
    if (!isLikelyListHeadingText(text)) return;

    var heading = document.createElement('p');
    heading.className = 'product-description-list-heading';
    heading.textContent = text;
    nodesToRemove.forEach(function (n) {
      n.remove();
    });
    parent.insertBefore(heading, list);
  }

  function splitHeadingParagraphBeforeList(list) {
    var prev = list.previousElementSibling;
    if (!prev || prev.tagName !== 'P' || prev.classList.contains('product-description-list-heading')) {
      return;
    }

    var html = prev.innerHTML;
    var segments = html.split(/(?:<br\s*\/?>\s*){1,}/i);
    if (segments.length < 2) return;

    var lastSegment = plainText(segments[segments.length - 1]);
    if (!isLikelyListHeadingText(lastSegment)) return;

    var introHtml = segments.slice(0, -1).join('<br><br>');
    prev.innerHTML = introHtml;

    if (!normalize(prev.textContent)) {
      prev.remove();
    }

    var heading = document.createElement('p');
    heading.className = 'product-description-list-heading';
    heading.textContent = lastSegment;
    list.parentNode.insertBefore(heading, list);
  }

  function promoteElementBeforeList(list) {
    var prev = previousMeaningfulSibling(list);
    if (!prev || prev.classList.contains('product-description-list-heading')) return;

    if (/^H[1-6]$/.test(prev.tagName)) {
      markListHeading(prev);
      return;
    }

    var text = plainText(prev.innerHTML || prev.textContent);
    if (!isLikelyListHeadingText(text)) return;

    if (/^(P|DIV|SPAN|FONT|STRONG|B)$/i.test(prev.tagName)) {
      markListHeading(prev);
    }
  }

  function processAllListHeadings(container) {
    container.querySelectorAll('ul, ol').forEach(function (list) {
      wrapBareTextBeforeList(list);
      splitHeadingParagraphBeforeList(list);
      promoteElementBeforeList(list);
    });
  }

  function isSectionHeading(node) {
    if (!node || node.nodeType !== 1) return false;
    if (node.classList.contains('product-description-list-heading')) return true;
    if (node.classList.contains('product-description-section-heading')) return true;
    return /^H[2-6]$/.test(node.tagName);
  }

  function wrapLeadSection(container) {
    if (container.querySelector('.product-description-lead')) return;

    var scopes = container.querySelectorAll('.product-description-block--intro');
    if (!scopes.length) scopes = [container];

    scopes.forEach(function (scope) {
      var children = Array.from(scope.children);
      var leadNodes = [];

      for (var i = 0; i < children.length; i++) {
        var node = children[i];
        if (isSectionHeading(node) || /^UL|OL|TABLE$/i.test(node.tagName)) break;
        leadNodes.push(node);
      }

      if (!leadNodes.length) return;

      var lead = document.createElement('div');
      lead.className = 'product-description-lead';
      scope.insertBefore(lead, leadNodes[0]);
      leadNodes.forEach(function (node) {
        lead.appendChild(node);
      });
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
    if (!container) return;
    if (container.getAttribute('data-pflege-description-ready') === 'true') return;

    normalizeInlineTypography(container);
    cleanUnwantedSections(container);
    processAllListHeadings(container);
    wrapTopLevelSections(container);
    processAllListHeadings(container);
    wrapLeadSection(container);
    wrapTables(container);
    normalizeInlineTypography(container);

    container.setAttribute('data-pflege-description-ready', 'true');
  }

  window.PflegeProductDescription = {
    enhance: enhanceProductDescription,
  };

  function init() {
    document.querySelectorAll('[data-pflege-product-description]').forEach(enhanceProductDescription);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
