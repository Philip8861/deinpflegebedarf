/* PflegeShop Produktfinder — gemeinsame Logik (Kategorien, Scoring, Session). */
(function (global) {
  'use strict';

  var SESSION_KEY = 'pflegefinder_answers';

  var CATEGORY_DEFS = [
    {
      id: 'inkontinenzversorgung',
      title: 'Inkontinenzversorgung',
      always: false,
      isRelevant: function (a) {
        return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
      },
    },
    {
      id: 'koerperpflege',
      title: 'Körperpflege',
      always: false,
      isRelevant: function (a) {
        return a.koerperpflege === 'ja';
      },
    },
    {
      id: 'hautpflege',
      title: 'Hautpflege',
      always: true,
      isRelevant: function () {
        return true;
      },
    },
    {
      id: 'kleine_wundversorgung',
      title: 'Kleine Wundversorgung',
      always: false,
      isRelevant: function (a) {
        return a.kleine_wunden === 'ja';
      },
      notice: function (a) {
        if (a.kleine_wunden !== 'ja') return null;
        return 'Bei offenen, schlecht heilenden oder entzündeten Wunden sollte zusätzlich eine ärztliche oder pflegerische Abklärung erfolgen. Die angezeigten Artikel können die Versorgung im Alltag unterstützen, ersetzen aber keine medizinische Behandlung.';
      },
    },
    {
      id: 'pflegehilfsmittelbox',
      title: 'Kostenfreie Pflegehilfsmittelbox',
      always: false,
      isRelevant: function (a) {
        return a.pflegegrad === 'ja';
      },
    },
    {
      id: 'empfohlene_artikel',
      title: 'Empfohlene Artikel, die zu Ihrer Situation passen',
      always: true,
      isRelevant: function () {
        return true;
      },
    },
  ];

  var CAREGIVER_KEYWORDS = [
    'haendedesinfektion',
    'händedesinfektion',
    'einmalhandschuhe',
    'schutzprodukte',
    'hautschutz',
    'pflegecreme',
    'flaechendesinfektion',
    'flächendesinfektion',
    'entsorgungsbeutel',
  ];

  var MENGE_MAP = {
    wenig: ['tropfen', 'leicht'],
    mittel: ['mittel'],
    viel: ['stark'],
    sehr_viel: ['sehr_stark'],
  };

  var PFLEGEORT_MAP = {
    ausserhalb_bett: ['bad', 'dusche', 'bad_dusche'],
    teilweise_bett: ['bett', 'bad', 'dusche', 'teilweise_bett'],
    ueberwiegend_bett: ['bett'],
  };

  function norm(value) {
    if (value == null) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');
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
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  function isActive(product) {
    var v = product && product.finder && product.finder.active;
    if (v === true || v === 1) return true;
    var n = norm(v);
    return n === 'true' || n === '1' || n === 'yes' || n === 'ja' || n === 'wahr';
  }

  function getErgebnisKategorien(product) {
    return toList(product && product.finder && product.finder.ergebnis_kategorie);
  }

  function productInCategory(product, categoryId) {
    return getErgebnisKategorien(product).indexOf(norm(categoryId)) >= 0;
  }

  function isCaregiverProduct(product) {
    var f = product.finder || {};
    var hay = norm([f.kategorie, product.title].join(' '));
    for (var i = 0; i < CAREGIVER_KEYWORDS.length; i++) {
      if (hay.indexOf(norm(CAREGIVER_KEYWORDS[i])) >= 0) return true;
    }
    return false;
  }

  function scoreProduct(p, a, categoryId) {
    var f = p.finder || {};
    var s = 8;

    if (a.inkontinenz === 'unsicher') {
      if (toList(f.bedarf).length > 0) s += 10;
    } else if (a.inkontinenz === 'ja' && matchesAny(f.bedarf, ['inkontinenz'])) {
      s += 18;
    }

    if (a.koerperpflege === 'ja' && matchesAny(f.bedarf, ['koerperpflege'])) s += 16;

    if (a.hautzustand === 'gereizt') {
      if (matchesAny(f.hautzustand, ['gereizt', 'empfindlich', 'gereizt_empfindlich'])) s += 8;
    } else if (a.hautzustand && matchesAny(f.hautzustand, [a.hautzustand])) s += 8;

    if (a.mobilitaet && matchesAny(f.mobilitaet, [a.mobilitaet])) s += 12;

    if (a.stuhlinkontinenz === 'ja') {
      if (matchesAny(f.inkontinenz_art, ['stuhl', 'urin_stuhl'])) s += 14;
    } else if (a.stuhlinkontinenz === 'unsicher') {
      if (toList(f.inkontinenz_art).length > 0) s += 8;
    } else if (a.stuhlinkontinenz === 'nein' && a.inkontinenz !== 'nein') {
      if (matchesAny(f.inkontinenz_art, ['urin'])) s += 10;
    }

    if (a.menge_urin && MENGE_MAP[a.menge_urin]) {
      if (matchesAny(f.menge_urinverlust, MENGE_MAP[a.menge_urin])) s += 12;
    }

    if (a.geschlecht) {
      var gSet;
      if (a.geschlecht === 'weiblich') gSet = ['frau', 'weiblich', 'unisex'];
      else if (a.geschlecht === 'maennlich') gSet = ['mann', 'maennlich', 'unisex'];
      else gSet = ['unisex', 'alle', 'frau', 'mann', 'weiblich', 'maennlich'];
      if (matchesAny(f.geschlecht, gSet)) s += 8;
    }

    if (a.pflegeort && PFLEGEORT_MAP[a.pflegeort]) {
      if (matchesAny(f.pflegeort, PFLEGEORT_MAP[a.pflegeort])) s += 10;
    }

    if (a.pflegegrad === 'ja' && categoryId === 'pflegehilfsmittelbox') s += 15;

    if (
      categoryId === 'empfohlene_artikel' &&
      a.zielgruppe === 'fuer_andere' &&
      isCaregiverProduct(p)
    ) {
      s += 20;
    }

    if (categoryId === 'kleine_wundversorgung' && a.kleine_wunden === 'ja') s += 6;

    return s;
  }

  function scoreAndFilterForCategory(products, answers, categoryId, minScore) {
    var out = [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!isActive(p)) continue;
      if (p.available === false) continue;
      if (!getErgebnisKategorien(p).length) continue;
      if (!productInCategory(p, categoryId)) continue;
      var s = scoreProduct(p, answers, categoryId);
      if (s < minScore) continue;
      out.push({ p: p, score: s, prio: parsePrio(p.finder && p.finder.prioritaet) });
    }
    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.prio - b.prio;
    });
    return out;
  }

  function getRelevantCategories(answers) {
    return CATEGORY_DEFS.filter(function (cat) {
      return cat.isRelevant(answers);
    });
  }

  function buildResultGroups(products, answers, minScore) {
    var relevant = getRelevantCategories(answers);
    var groups = [];

    relevant.forEach(function (cat) {
      var scored = scoreAndFilterForCategory(products, answers, cat.id, minScore);
      if (!scored.length) return;
      var notice = cat.notice ? cat.notice(answers) : null;
      groups.push({
        id: cat.id,
        title: cat.title,
        notice: notice,
        items: scored.map(function (entry) {
          return entry.p;
        }),
      });
    });

    return groups;
  }

  function saveAnswers(answers) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(answers));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadAnswers() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function buildFlow() {
    return [
      {
        id: 'pflegegrad',
        title: 'Liegt ein Pflegegrad vor?',
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
          { value: 'weiss_nicht', label: 'Ich weiß es nicht' },
        ],
      },
      {
        id: 'zielgruppe',
        title: 'Für wen sind die Artikel gedacht?',
        options: [
          { value: 'fuer_mich', label: 'Für mich selbst' },
          { value: 'fuer_andere', label: 'Für eine andere Person' },
        ],
      },
      {
        id: 'koerperpflege',
        title: 'Findet körperliche Pflege statt?',
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
        ],
      },
      {
        id: 'pflegeort',
        title: 'Wo findet die Pflege hauptsächlich statt?',
        condition: function (a) {
          return a.koerperpflege === 'ja';
        },
        options: [
          { value: 'ausserhalb_bett', label: 'Außerhalb des Bettes, z. B. Bad oder Dusche' },
          { value: 'teilweise_bett', label: 'Teilweise im Bett' },
          { value: 'ueberwiegend_bett', label: 'Überwiegend im Bett' },
        ],
      },
      {
        id: 'inkontinenz',
        title: 'Benötigen Sie Inkontinenzprodukte?',
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
          { value: 'unsicher', label: 'Unsicher' },
        ],
      },
      {
        id: 'geschlecht',
        title: 'Für welches Geschlecht suchen Sie Inkontinenzprodukte?',
        condition: function (a) {
          return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
        },
        options: [
          { value: 'weiblich', label: 'Weiblich' },
          { value: 'maennlich', label: 'Männlich' },
          { value: 'egal', label: 'Egal / Unisex' },
        ],
      },
      {
        id: 'menge_urin',
        title: 'Wie viel Urin geht ungefähr verloren?',
        condition: function (a) {
          return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
        },
        options: [
          { value: 'wenig', label: 'Wenig – einige Tropfen bis ca. ½ Glas' },
          { value: 'mittel', label: 'Mittel – etwa ½ bis 1 Glas' },
          { value: 'viel', label: 'Viel – etwa 1 bis 1½ Gläser' },
          { value: 'sehr_viel', label: 'Sehr viel – mehr als 1½ Gläser oder läuft häufig aus' },
        ],
      },
      {
        id: 'mobilitaet',
        title: 'Wie mobil ist die Person?',
        condition: function (a) {
          return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
        },
        options: [
          { value: 'mobil', label: 'Mobil' },
          { value: 'eingeschraenkt_mobil', label: 'Eingeschränkt mobil' },
          { value: 'bettlaegerig', label: 'Überwiegend im Bett' },
        ],
      },
      {
        id: 'stuhlinkontinenz',
        title: 'Liegt Stuhlinkontinenz vor?',
        condition: function (a) {
          return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
        },
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
          { value: 'unsicher', label: 'Unsicher' },
        ],
      },
      {
        id: 'hautzustand',
        title: 'Wie ist die Haut?',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'trocken', label: 'Trocken' },
          { value: 'sehr_trocken', label: 'Sehr trocken' },
          { value: 'gereizt', label: 'Gereizt oder empfindlich' },
        ],
      },
      {
        id: 'kleine_wunden',
        title: 'Sind kleine Wunden oder gereizte Hautstellen vorhanden?',
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
        ],
      },
    ];
  }

  function dropAnswersAfter(state, stepId) {
    var afterIndex = -1;
    for (var i = 0; i < state.flow.length; i++) {
      if (state.flow[i].id === stepId) {
        afterIndex = i;
        break;
      }
    }
    if (afterIndex < 0) return;
    for (var j = afterIndex + 1; j < state.flow.length; j++) {
      delete state.answers[state.flow[j].id];
    }
  }

  function stripHtml(s) {
    return String(s || '')
      .replace(/<[^>]*>/g, '')
      .trim();
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

  global.PflegeFinder = {
    SESSION_KEY: SESSION_KEY,
    CATEGORY_DEFS: CATEGORY_DEFS,
    buildFlow: buildFlow,
    buildResultGroups: buildResultGroups,
    saveAnswers: saveAnswers,
    loadAnswers: loadAnswers,
    dropAnswersAfter: dropAnswersAfter,
    safeJSON: safeJSON,
    stripHtml: stripHtml,
    el: el,
    isActive: isActive,
  };
})(typeof window !== 'undefined' ? window : this);
