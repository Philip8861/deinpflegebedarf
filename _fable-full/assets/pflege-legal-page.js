/*
 * PflegeShop — Auto-Inhaltsverzeichnis für Rechtsseiten
 * Liest H2 (und optional H3) aus [data-pflege-legal-content] und baut Anker-Links.
 */
(function () {
  'use strict';

  function slugify(input) {
    return String(input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'abschnitt';
  }

  function ensureUniqueId(id, used) {
    let base = id || 'abschnitt';
    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = base + '-' + n;
      n += 1;
    }
    used.add(candidate);
    return candidate;
  }

  function buildToc(section) {
    const tocWrap = section.querySelector('[data-pflege-legal-toc]');
    const tocList = section.querySelector('[data-pflege-legal-toc-list]');
    const content = section.querySelector('[data-pflege-legal-content]');
    if (!tocWrap || !tocList || !content) return;

    const headings = content.querySelectorAll('h2');
    if (!headings.length) {
      tocWrap.hidden = true;
      return;
    }

    const usedIds = new Set();
    document.querySelectorAll('[id]').forEach((el) => usedIds.add(el.id));

    const frag = document.createDocumentFragment();
    headings.forEach((h) => {
      const text = (h.textContent || '').trim();
      if (!text) return;

      let id = h.id && h.id.trim();
      if (!id) {
        id = ensureUniqueId(slugify(text), usedIds);
        h.id = id;
      } else {
        usedIds.add(id);
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = text;
      a.addEventListener('click', function (evt) {
        const target = document.getElementById(id);
        if (!target) return;
        evt.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) {
          history.replaceState(null, '', '#' + id);
        }
      });
      li.appendChild(a);
      frag.appendChild(li);
    });

    if (!frag.childNodes.length) {
      tocWrap.hidden = true;
      return;
    }

    tocList.innerHTML = '';
    tocList.appendChild(frag);
    tocWrap.hidden = false;
  }

  function init() {
    document.querySelectorAll('[data-pflege-legal]').forEach(buildToc);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
