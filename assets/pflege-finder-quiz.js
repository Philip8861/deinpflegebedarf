/* PflegeShop Produktfinder — Wizard, Scoring, Gruppierung, Render.
 *
 * Eingang:
 *   <section data-pflege-finder>
 *     <script type="application/json" data-pflege-finder-config>{...}</script>
 *     <script type="application/json" data-pflege-finder-products>[...]</script>
 *     <div data-pflege-finder-viewport></div>
 *
 * Quelle der Daten: collections['produktfinder'] (in der Liquid-Section serialisiert).
 * Texte sind hartkodiert in Deutsch.
 */
(function () {
  'use strict';

  var SCRIPT_FLAG = '__pflegeFinderInit';

  function init(root) {
    if (!root || root[SCRIPT_FLAG]) return;
    root[SCRIPT_FLAG] = true;

    var configEl = root.querySelector('script[data-pflege-finder-config]');
    var productsEl = root.querySelector('script[data-pflege-finder-products]');
    var viewport = root.querySelector('[data-pflege-finder-viewport]');
    var progressBar = root.querySelector('[data-pflege-finder-progress-bar]');
    if (!configEl || !productsEl || !viewport) return;

    var config = safeJSON(configEl.textContent, {});
    var products = safeJSON(productsEl.textContent, []);

    var state = {
      config: config,
      products: Array.isArray(products) ? products : [],
      answers: {},
      stepIndex: 0,
      flow: buildFlow(),
    };

    render(state, viewport, progressBar);
  }

  /* -------------------------------------------------------- *
   * Flow-Definition (Reihenfolge + Bedingungen)
   * -------------------------------------------------------- */
  function buildFlow() {
    return [
      {
        id: 'bedarf',
        title: 'Wobei benötigen Sie Unterstützung?',
        options: [
          { value: 'inkontinenz', label: 'Inkontinenzversorgung' },
          { value: 'koerperpflege', label: 'Körperpflege' },
          { value: 'hautpflege', label: 'Hautpflege' },
          { value: 'schutz_hygiene', label: 'Schutz & Hygiene' },
          { value: 'verbrauch', label: 'Verbrauchsmaterial' },
          { value: 'unsicher', label: 'Ich bin unsicher' },
        ],
      },
      {
        id: 'geschlecht',
        title: 'Für wen suchen Sie?',
        condition: function (a) { return a.bedarf === 'inkontinenz'; },
        options: [
          { value: 'frau', label: 'Frau' },
          { value: 'mann', label: 'Mann' },
          { value: 'unisex', label: 'Egal / Unisex' },
        ],
      },
      {
        id: 'mobilitaet',
        title: 'Wie mobil ist die Person?',
        condition: function (a) {
          return a.bedarf === 'inkontinenz' || a.bedarf === 'koerperpflege' || a.bedarf === 'unsicher';
        },
        options: [
          { value: 'mobil', label: 'Mobil / selbstständig' },
          { value: 'eingeschraenkt_mobil', label: 'Eingeschränkt mobil' },
          { value: 'bettlaegerig', label: 'Überwiegend im Bett' },
        ],
      },
      {
        id: 'inkontinenz_art',
        title: 'Welche Art von Inkontinenz liegt vor?',
        condition: function (a) { return a.bedarf === 'inkontinenz'; },
        options: [
          { value: 'urin', label: 'Urinverlust' },
          { value: 'stuhl', label: 'Stuhlinkontinenz' },
          { value: 'urin_stuhl', label: 'Urin und Stuhl' },
          { value: 'unsicher', label: 'Unsicher' },
        ],
      },
      {
        id: 'menge_urinverlust',
        title: 'Wie viel Urin geht ungefähr verloren?',
        condition: function (a) {
          return a.bedarf === 'inkontinenz' && (a.inkontinenz_art === 'urin' || a.inkontinenz_art === 'urin_stuhl');
        },
        options: [
          { value: 'tropfen', label: 'Nur Tropfen' },
          { value: 'leicht', label: 'Kleine Mengen' },
          { value: 'mittel', label: 'Mittlere Mengen' },
          { value: 'stark', label: 'Große Mengen' },
          { value: 'sehr_stark', label: 'Sehr große Mengen / läuft häufig aus' },
        ],
      },
      {
        id: 'anwendung',
        title: 'Wann wird der Schutz hauptsächlich benötigt?',
        condition: function (a) { return a.bedarf === 'inkontinenz'; },
        options: [
          { value: 'tag', label: 'Tagsüber' },
          { value: 'nacht', label: 'Nachts' },
          { value: 'tag_nacht', label: 'Tag und Nacht' },
          { value: 'unterwegs', label: 'Unterwegs' },
          { value: 'bett', label: 'Im Bett' },
        ],
      },
      {
        id: 'hautzustand',
        title: 'Wie ist die Haut?',
        condition: function (a) {
          return a.bedarf === 'inkontinenz' || a.bedarf === 'koerperpflege' || a.bedarf === 'hautpflege';
        },
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'trocken', label: 'Trocken' },
          { value: 'sehr_trocken', label: 'Sehr trocken' },
          { value: 'gereizt', label: 'Gereizt' },
          { value: 'wunden', label: 'Wunden vorhanden' },
        ],
      },
      {
        id: 'pflegeort',
        title: 'Wo findet die Körperpflege hauptsächlich statt?',
        condition: function (a) { return a.bedarf !== 'unsicher'; },
        options: [
          { value: 'bad_dusche', label: 'Im Bad / unter der Dusche' },
          { value: 'teilweise_bett', label: 'Teilweise im Bett' },
          { value: 'bett', label: 'Überwiegend im Bett' },
        ],
      },
      {
        id: 'pflegeperson',
        title: 'Wer führt die Pflege durch?',
        options: [
          { value: 'selbst', label: 'Die Person selbst' },
          { value: 'angehoerige', label: 'Angehörige' },
          { value: 'pflegedienst', label: 'Pflegeperson / Dienst' },
        ],
      },
    ];
  }

  /* -------------------------------------------------------- *
   * Render-Loop
   * -------------------------------------------------------- */
  function render(state, viewport, progressBar) {
    var visibleSteps = state.flow.filter(function (s) {
      return !s.condition || s.condition(state.answers);
    });

    if (state.stepIndex >= visibleSteps.length) {
      renderResults(state, viewport, progressBar);
      return;
    }

    var step = visibleSteps[state.stepIndex];
    updateProgress(progressBar, state.stepIndex, visibleSteps.length);

    viewport.innerHTML = '';
    var stepEl = createStep(step, state, viewport, progressBar);
    viewport.appendChild(stepEl);
  }

  function updateProgress(bar, index, total) {
    if (!bar) return;
    var pct = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 0;
    bar.style.width = pct + '%';
    if (bar.parentElement) bar.parentElement.setAttribute('aria-valuenow', String(pct));
  }

  function createStep(step, state, viewport, progressBar) {
    var wrapper = el('div', { class: 'pflege-finder-step' });

    var heading = el('h2', { class: 'pflege-finder-step__title' });
    heading.textContent = step.title;
    wrapper.appendChild(heading);

    var list = el('div', { class: 'pflege-finder-step__options', role: 'radiogroup', 'aria-label': step.title });
    step.options.forEach(function (opt) {
      var btn = el('button', {
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
          dropAnswersAfter(state, step.id);
        }
        state.stepIndex += 1;
        render(state, viewport, progressBar);
      });
      list.appendChild(btn);
    });
    wrapper.appendChild(list);

    if (state.stepIndex > 0) {
      var nav = el('div', { class: 'pflege-finder-step__nav' });
      var back = el('button', { type: 'button', class: 'pflege-finder-back' });
      back.textContent = 'Zurück';
      back.addEventListener('click', function () {
        state.stepIndex = Math.max(0, state.stepIndex - 1);
        var visibleSteps = state.flow.filter(function (s) {
          return !s.condition || s.condition(state.answers);
        });
        var prev = visibleSteps[state.stepIndex];
        if (prev) delete state.answers[prev.id];
        render(state, viewport, progressBar);
      });
      nav.appendChild(back);
      wrapper.appendChild(nav);
    }
    return wrapper;
  }

  /* -------------------------------------------------------- *
   * Ergebnisseite
   * -------------------------------------------------------- */
  function renderResults(state, viewport, progressBar) {
    updateProgress(progressBar, 1, 1);

    viewport.innerHTML = '';
    var container = el('div', { class: 'pflege-finder-results' });

    if (!state.config.hasCollection || !state.products.length) {
      container.appendChild(emptyMessage(
        'Empfehlungen sind aktuell noch nicht verfügbar',
        'Wir haben aktuell noch keine Produkte für den Finder freigegeben. Bitte schauen Sie in Kürze wieder vorbei oder stöbern Sie direkt in unserem Shop.'
      ));
      container.appendChild(restartButton(state, viewport, progressBar));
      viewport.appendChild(container);
      return;
    }

    if (state.answers.hautzustand === 'wunden') {
      container.appendChild(woundsNotice());
    }

    var scored = scoreAndFilter(state.products, state.answers, state.config.minScore || 15);

    if (!scored.length) {
      container.appendChild(emptyMessage(
        'Keine eindeutige Empfehlung möglich',
        'Auf Basis Ihrer Angaben konnten wir aktuell keine eindeutigen Produkte zuordnen. Bitte prüfen Sie Ihre Auswahl oder kontaktieren Sie uns für eine persönliche Beratung.'
      ));
      container.appendChild(restartButton(state, viewport, progressBar));
      viewport.appendChild(container);
      return;
    }

    var groups = buildGroups(scored, state.config.groupCaps || {});
    var anyShown = false;

    var heading = el('h2', { class: 'pflege-finder-results__title' });
    heading.textContent = 'Unsere empfohlenen Artikel';
    container.appendChild(heading);

    groups.forEach(function (g) {
      if (!g.items.length) return;
      anyShown = true;
      container.appendChild(renderGroup(g));
    });

    if (!anyShown) {
      container.appendChild(emptyMessage(
        'Keine eindeutige Empfehlung möglich',
        'Auf Basis Ihrer Angaben konnten wir aktuell keine eindeutigen Produkte zuordnen. Bitte prüfen Sie Ihre Auswahl oder kontaktieren Sie uns für eine persönliche Beratung.'
      ));
    }

    container.appendChild(restartButton(state, viewport, progressBar));
    viewport.appendChild(container);
  }

  function woundsNotice() {
    var box = el('aside', { class: 'pflege-finder-notice pflege-finder-notice--wounds', role: 'note' });
    box.innerHTML =
      '<strong class="pflege-finder-notice__title">Hinweis bei Wunden</strong>' +
      '<p class="pflege-finder-notice__body">Sie haben angegeben, dass Wunden vorhanden sind. Die folgenden Produkte können bei Pflege, Schutz und Hygiene unterstützen. Bei offenen oder schlecht heilenden Wunden sollte zusätzlich eine ärztliche oder pflegerische Abklärung erfolgen.</p>';
    return box;
  }

  function emptyMessage(title, body) {
    var box = el('div', { class: 'pflege-finder-empty' });
    var h = el('h3', { class: 'pflege-finder-empty__title' });
    h.textContent = title;
    var p = el('p', { class: 'pflege-finder-empty__body' });
    p.textContent = body;
    box.appendChild(h); box.appendChild(p);
    return box;
  }

  function restartButton(state, viewport, progressBar) {
    var wrap = el('div', { class: 'pflege-finder-results__restart' });
    var btn = el('button', { type: 'button', class: 'pflege-finder-restart' });
    btn.textContent = 'Neue Empfehlung starten';
    btn.addEventListener('click', function () {
      state.answers = {};
      state.stepIndex = 0;
      render(state, viewport, progressBar);
    });
    wrap.appendChild(btn);
    return wrap;
  }

  function renderGroup(group) {
    var section = el('section', { class: 'pflege-finder-group' });
    var head = el('header', { class: 'pflege-finder-group__head' });
    var title = el('h3', { class: 'pflege-finder-group__title' });
    title.textContent = group.title;
    head.appendChild(title);
    if (group.subtitle) {
      var sub = el('p', { class: 'pflege-finder-group__subtitle' });
      sub.textContent = group.subtitle;
      head.appendChild(sub);
    }
    section.appendChild(head);

    var grid = el('div', {
      class: group.kind === 'service' ? 'pflege-finder-service-list' : 'pflege-finder-cards',
    });
    group.items.forEach(function (item) {
      grid.appendChild(group.kind === 'service' ? renderServiceCard(item) : renderProductCard(item));
    });
    section.appendChild(grid);
    return section;
  }

  function renderProductCard(p) {
    var card = el('article', { class: 'pflege-finder-card' });

    var media = el('a', { class: 'pflege-finder-card__media', href: p.url || '#' });
    if (p.image_url) {
      var img = el('img', {
        src: p.image_url,
        alt: p.image_alt || p.title,
        loading: 'eager',
        decoding: 'async',
      });
      media.appendChild(img);
    } else {
      media.classList.add('pflege-finder-card__media--placeholder');
    }
    card.appendChild(media);

    var body = el('div', { class: 'pflege-finder-card__body' });

    var title = el('h4', { class: 'pflege-finder-card__title' });
    var titleLink = el('a', { href: p.url || '#' });
    titleLink.textContent = p.title || '';
    title.appendChild(titleLink);
    body.appendChild(title);

    if (p.finder && p.finder.empfehlungstext) {
      var rec = el('p', { class: 'pflege-finder-card__recommend' });
      rec.textContent = String(p.finder.empfehlungstext);
      body.appendChild(rec);
    }

    if (p.price_html) {
      var price = el('div', { class: 'pflege-finder-card__price' });
      price.textContent = stripHtml(p.price_html);
      body.appendChild(price);
    }

    var actions = el('div', { class: 'pflege-finder-card__actions' });
    var link = el('a', { class: 'pflege-finder-card__cta', href: p.url || '#' });
    link.textContent = 'Zum Produkt';
    actions.appendChild(link);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  function renderServiceCard(p) {
    var card = el('article', { class: 'pflege-finder-service' });
    var title = el('h4', { class: 'pflege-finder-service__title' });
    var titleLink = el('a', { href: p.url || '#' });
    titleLink.textContent = p.title || '';
    title.appendChild(titleLink);
    card.appendChild(title);

    if (p.finder && p.finder.empfehlungstext) {
      var body = el('p', { class: 'pflege-finder-service__body' });
      body.textContent = String(p.finder.empfehlungstext);
      card.appendChild(body);
    }
    return card;
  }

  /* -------------------------------------------------------- *
   * Scoring + Filter + Gruppierung
   * -------------------------------------------------------- */

  function scoreAndFilter(products, answers, minScore) {
    var out = [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!isActive(p)) continue;
      if (p.available === false) continue;
      var s = scoreProduct(p, answers);
      if (s < minScore) continue;
      out.push({ p: p, score: s, prio: parsePrio(p.finder && p.finder.prioritaet) });
    }
    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.prio - b.prio;
    });
    return out;
  }

  function buildGroups(scored, caps) {
    var byRole = {
      hauptprodukt: [],
      basis_ergaenzung: [],
      situationsprodukt: [],
      zubehoer: [],
      hygiene_schutz: [],
      verbrauch: [],
      service_hinweis: [],
    };
    scored.forEach(function (entry) {
      var role = norm(entry.p.finder && entry.p.finder.produktrolle);
      if (byRole[role]) byRole[role].push(entry.p);
    });

    return [
      {
        kind: 'cards',
        title: 'Ihre wichtigsten Produkte',
        items: byRole.hauptprodukt.slice(0, caps.haupt || 3),
      },
      {
        kind: 'cards',
        title: 'Sinnvolle Ergänzungen',
        items: byRole.basis_ergaenzung.concat(byRole.zubehoer).slice(0, caps.ergaenzung || 4),
      },
      {
        kind: 'cards',
        title: 'Pflege im Bett & Alltag erleichtern',
        items: byRole.situationsprodukt.slice(0, caps.situation || 3),
      },
      {
        kind: 'cards',
        title: 'Verbrauch & Hygiene',
        items: byRole.hygiene_schutz.concat(byRole.verbrauch).slice(0, caps.hygiene || 3),
      },
      {
        kind: 'service',
        title: 'Beratung & Unterstützung',
        items: byRole.service_hinweis.slice(0, caps.service || 2),
      },
    ];
  }

  function scoreProduct(p, a) {
    var f = p.finder || {};
    var role = norm(f.produktrolle);
    var s = 0;

    if (a.bedarf === 'unsicher') {
      if (toList(f.bedarf).length > 0) s += 12;
    } else if (a.bedarf && matchesAny(f.bedarf, [a.bedarf])) {
      s += 20;
    }

    if (a.mobilitaet && matchesAny(f.mobilitaet, [a.mobilitaet])) s += 12;

    if (a.inkontinenz_art && a.inkontinenz_art !== 'unsicher') {
      var inkSet = a.inkontinenz_art === 'urin_stuhl'
        ? ['urin', 'stuhl', 'urin_stuhl']
        : [a.inkontinenz_art];
      if (matchesAny(f.inkontinenz_art, inkSet)) s += 12;
    }

    if (a.menge_urinverlust && matchesAny(f.menge_urinverlust, [a.menge_urinverlust])) s += 12;

    if (a.anwendung) {
      var anwendungSet = a.anwendung === 'tag_nacht' ? ['tag', 'nacht', 'tag_nacht'] : [a.anwendung];
      if (matchesAny(f.anwendung, anwendungSet)) s += 8;
    }

    if (a.geschlecht) {
      var gSet;
      if (a.geschlecht === 'frau') gSet = ['frau', 'unisex'];
      else if (a.geschlecht === 'mann') gSet = ['mann', 'unisex'];
      else gSet = ['unisex', 'alle', 'frau', 'mann'];
      if (matchesAny(f.geschlecht, gSet)) s += 8;
    }

    if (a.pflegeort) {
      var ortMap = {
        bad_dusche: ['bad', 'dusche'],
        teilweise_bett: ['bett', 'bad', 'dusche'],
        bett: ['bett'],
      };
      if (matchesAny(f.pflegeort, ortMap[a.pflegeort] || [])) s += 8;
    }

    if (a.hautzustand && matchesAny(f.hautzustand, [a.hautzustand])) s += 6;

    var inBed = a.mobilitaet === 'bettlaegerig' || a.pflegeort === 'bett' || a.anwendung === 'bett';
    if (inBed && (role === 'situationsprodukt' || role === 'hygiene_schutz' || role === 'verbrauch')) {
      s += 8;
    }

    if (a.inkontinenz_art === 'stuhl' || a.inkontinenz_art === 'urin_stuhl') {
      if (role === 'zubehoer' || role === 'hygiene_schutz' || role === 'basis_ergaenzung' || role === 'verbrauch') {
        s += 8;
      }
    }

    if (a.pflegeperson === 'angehoerige' || a.pflegeperson === 'pflegedienst') {
      if (role === 'zubehoer' || role === 'hygiene_schutz' || role === 'verbrauch') {
        s += 6;
      }
    }

    return s;
  }

  /* -------------------------------------------------------- *
   * Helpers
   * -------------------------------------------------------- */

  function isActive(product) {
    var v = product && product.finder && product.finder.active;
    return v === true || v === 'true' || v === 1 || v === '1';
  }

  function norm(value) {
    if (value == null) return '';
    return String(value).trim().toLowerCase();
  }

  function toList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.map(norm).filter(Boolean);
    var s = String(value);
    if (!s) return [];
    return s.split(/[,;|]/).map(norm).filter(Boolean);
  }

  function matchesAny(productValue, candidates) {
    if (!candidates || !candidates.length) return false;
    var have = toList(productValue);
    if (!have.length) return false;
    var want = candidates.map(norm).filter(Boolean);
    for (var i = 0; i < have.length; i++) {
      for (var j = 0; j < want.length; j++) {
        if (have[i] === want[j]) return true;
      }
    }
    return false;
  }

  function parsePrio(v) {
    if (v == null || v === '') return 9999;
    var n = parseInt(v, 10);
    return isFinite(n) ? n : 9999;
  }

  function safeJSON(text, fallback) {
    try { return JSON.parse(text); } catch (e) { return fallback; }
  }

  function dropAnswersAfter(state, stepId) {
    var afterIndex = -1;
    for (var i = 0; i < state.flow.length; i++) {
      if (state.flow[i].id === stepId) { afterIndex = i; break; }
    }
    if (afterIndex < 0) return;
    for (var j = afterIndex + 1; j < state.flow.length; j++) {
      delete state.answers[state.flow[j].id];
    }
  }

  function stripHtml(s) {
    return String(s || '').replace(/<[^>]*>/g, '').trim();
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function boot() {
    var roots = document.querySelectorAll('[data-pflege-finder]');
    roots.forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
