/* PflegeShop Produktfinder — Kategorien, fachliches Scoring, Session. */
(function (global) {
  'use strict';

  var SESSION_KEY = 'pflegefinder_answers';

  var CATEGORY_LIMITS = {
    inkontinenzversorgung: 4,
    koerperpflege: 4,
    hautpflege: 4,
    kleine_wundversorgung: 3,
    pflegehilfsmittelbox: 2,
    empfohlene_artikel: 5,
  };

  var MIN_SCORE = {
    inkontinenzversorgung: 28,
    koerperpflege: 22,
    hautpflege: 20,
    kleine_wundversorgung: 18,
    pflegehilfsmittelbox: 15,
    empfohlene_artikel: 30,
  };

  var MENGE_ANSWER_MAP = {
    wenig: ['tropfen', 'leicht'],
    mittel: ['mittel'],
    viel: ['stark'],
    sehr_viel: ['sehr_stark'],
  };

  var MENGE_NEIGHBORS = {
    wenig: ['tropfen', 'leicht'],
    mittel: ['leicht', 'mittel', 'stark'],
    viel: ['mittel', 'stark', 'sehr_stark'],
    sehr_viel: ['stark', 'sehr_stark'],
  };

  var MENGE_EXCLUDE = {
    wenig: ['stark', 'sehr_stark'],
    mittel: [],
    viel: [],
    sehr_viel: ['tropfen', 'leicht'],
  };

  var HAUT_NEIGHBORS = {
    normal: ['normal'],
    trocken: ['trocken', 'sehr_trocken'],
    sehr_trocken: ['sehr_trocken', 'trocken'],
    gereizt: ['gereizt', 'empfindlich', 'sensitiv', 'hautschutz'],
  };

  var CATEGORY_DEFS = [
    {
      id: 'inkontinenzversorgung',
      title: 'Inkontinenzversorgung',
      isRelevant: function (a) {
        return a.inkontinenz === 'ja' || a.inkontinenz === 'unsicher';
      },
    },
    {
      id: 'koerperpflege',
      title: 'Körperpflege',
      isRelevant: function (a) {
        return a.koerperpflege === 'ja';
      },
    },
    {
      id: 'hautpflege',
      title: 'Hautpflege',
      isRelevant: function () {
        return true;
      },
    },
    {
      id: 'kleine_wundversorgung',
      title: 'Kleine Wundversorgung',
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
      isRelevant: function (a) {
        return a.pflegegrad === 'ja';
      },
    },
    {
      id: 'empfohlene_artikel',
      title: 'Empfohlene Artikel, die zu Ihrer Situation passen',
      isRelevant: function () {
        return true;
      },
    },
  ];

  /* -------------------------------------------------------- *
   * Hilfsfunktionen
   * -------------------------------------------------------- */

  function normalizeValue(value) {
    if (value == null) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');
  }

  function parseMetafieldList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) {
      return value.map(normalizeValue).filter(Boolean);
    }
    var s = String(value).trim();
    if (!s) return [];
    return s.split(',').map(function (part) {
      return normalizeValue(part);
    }).filter(Boolean);
  }

  function listOverlap(a, b) {
    if (!a.length || !b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (b.indexOf(a[i]) >= 0) return true;
    }
    return false;
  }

  function uniqueList(arr) {
    var out = [];
    arr.forEach(function (v) {
      if (v && out.indexOf(v) < 0) out.push(v);
    });
    return out;
  }

  function isActiveProduct(product) {
    var v = product && product.finder && product.finder.active;
    if (v === true || v === 1) return true;
    var n = normalizeValue(v);
    return n === 'true' || n === '1' || n === 'yes' || n === 'ja' || n === 'wahr';
  }

  function productHasCategory(product, categoryKey) {
    var cats = parseMetafieldList(product && product.finder && product.finder.ergebnis_kategorie);
    if (!cats.length) return false;
    return cats.indexOf(normalizeValue(categoryKey)) >= 0;
  }

  function getPriority(product) {
    var v = product && product.finder && product.finder.prioritaet;
    if (v == null || v === '') return 9999;
    var n = parseInt(v, 10);
    return isFinite(n) ? n : 9999;
  }

  function productHaystack(product) {
    var f = (product && product.finder) || {};
    return normalizeValue(
      [product.title, f.kategorie, f.empfehlungstext, f.pflegesituation, f.bedarf].join(' ')
    );
  }

  function productTypes(product) {
    var hay = productHaystack(product);
    var types = [];
    if (/pants|windelhose|inkontinenzhose|fixierhose/.test(hay)) types.push('pants');
    if (/slip|fixie/.test(hay)) types.push('slips');
    if (/vorlage|einlage|pad/.test(hay)) types.push('vorlagen');
    if (/bettschutz|bettschutzeinlage|molton/.test(hay)) types.push('bettschutz');
    return types;
  }

  function mlToMengeLevel(ml) {
    if (ml <= 0 || !isFinite(ml)) return '';
    if (ml <= 500) return 'leicht';
    if (ml <= 1000) return 'mittel';
    if (ml <= 1800) return 'stark';
    return 'sehr_stark';
  }

  function extractMlFromText(text) {
    var matches = String(text || '').match(/(\d+(?:[.,]\d+)?)\s*ml/gi);
    if (!matches) return [];
    return matches.map(function (m) {
      return parseFloat(m.replace(/ml/i, '').replace(',', '.').trim());
    }).filter(function (n) {
      return isFinite(n) && n > 0;
    });
  }

  function getVariantMengeLevels(product) {
    var levels = [];
    var variants = product && product.variants;
    if (!Array.isArray(variants)) return levels;

    variants.forEach(function (v) {
      var texts = [v.title, v.option1, v.option2, v.option3];
      texts.forEach(function (t) {
        extractMlFromText(t).forEach(function (ml) {
          var level = mlToMengeLevel(ml);
          if (level) levels.push(level);
        });
      });
    });

    return uniqueList(levels);
  }

  function getProductMengeLevels(product) {
    var meta = parseMetafieldList(product.finder && product.finder.menge_urinverlust);
    var fromVariants = getVariantMengeLevels(product);
    return uniqueList(meta.concat(fromVariants));
  }

  function getProductMobilityLevels(product) {
    return parseMetafieldList(product.finder && product.finder.mobilitaet);
  }

  function getProductGenderLevels(product) {
    return parseMetafieldList(product.finder && product.finder.geschlecht);
  }

  function getProductInkontinenzArt(product) {
    return parseMetafieldList(product.finder && product.finder.inkontinenz_art);
  }

  function getProductAnwendung(product) {
    return parseMetafieldList(product.finder && product.finder.anwendung);
  }

  function getProductHautzustand(product) {
    return parseMetafieldList(product.finder && product.finder.hautzustand);
  }

  function getProductPflegeort(product) {
    return parseMetafieldList(product.finder && product.finder.pflegeort);
  }

  function getProductPflegesituation(product) {
    return parseMetafieldList(product.finder && product.finder.pflegesituation);
  }

  function matchesKeyword(hay, keywords) {
    for (var i = 0; i < keywords.length; i++) {
      if (hay.indexOf(normalizeValue(keywords[i])) >= 0) return true;
    }
    return false;
  }

  function hasEmpfohleneSituation(answers) {
    return (
      answers.zielgruppe === 'fuer_andere' ||
      answers.koerperpflege === 'ja' &&
        (answers.pflegeort === 'teilweise_bett' || answers.pflegeort === 'ueberwiegend_bett') ||
      answers.stuhlinkontinenz === 'ja' ||
      answers.inkontinenz === 'ja' ||
      answers.inkontinenz === 'unsicher' ||
      answers.pflegegrad === 'ja'
    );
  }

  function passesGenderFilter(product, answers, categoryKey) {
    if (categoryKey !== 'inkontinenzversorgung') return true;
    if (!answers.geschlecht || answers.inkontinenz === 'nein') return true;

    var genders = getProductGenderLevels(product);
    if (!genders.length) return answers.geschlecht === 'egal';

    if (answers.geschlecht === 'weiblich') {
      return listOverlap(genders, ['frau', 'weiblich', 'unisex', 'neutral', 'alle']);
    }
    if (answers.geschlecht === 'maennlich') {
      return listOverlap(genders, ['mann', 'maennlich', 'unisex', 'neutral', 'alle']);
    }
    return listOverlap(genders, ['unisex', 'neutral', 'alle', 'frau', 'mann', 'weiblich', 'maennlich']);
  }

  function passesStuhlFilter(product, answers, categoryKey) {
    if (categoryKey !== 'inkontinenzversorgung' && categoryKey !== 'empfohlene_artikel') return true;
    if (answers.stuhlinkontinenz !== 'nein') return true;

    var arts = getProductInkontinenzArt(product);
    if (!arts.length) return true;
    return !(arts.length === 1 && arts[0] === 'stuhl');
  }

  function scoreMengeForInkontinenz(product, answers) {
    if (!answers.menge_urin) return { score: 0, excluded: false, variantHint: false };

    var levels = getProductMengeLevels(product);
    var preferred = MENGE_ANSWER_MAP[answers.menge_urin] || [];
    var neighbors = MENGE_NEIGHBORS[answers.menge_urin] || [];
    var exclude = MENGE_EXCLUDE[answers.menge_urin] || [];
    var variantHint = getVariantMengeLevels(product).length > 0 && !levels.length;

    if (!levels.length) {
      return { score: 4, excluded: false, variantHint: variantHint };
    }

    if (listOverlap(levels, exclude)) {
      return { score: 0, excluded: true, variantHint: false };
    }

    if (listOverlap(levels, preferred)) {
      return { score: 28, excluded: false, variantHint: variantHint };
    }

    if (listOverlap(levels, neighbors)) {
      return { score: 14, excluded: false, variantHint: variantHint };
    }

    return { score: 3, excluded: false, variantHint: variantHint };
  }

  function scoreMobility(product, answers, categoryKey) {
    if (categoryKey !== 'inkontinenzversorgung' || !answers.mobilitaet) return 0;

    var levels = getProductMobilityLevels(product);
    var types = productTypes(product);
    var score = 0;

    if (listOverlap(levels, [answers.mobilitaet])) score += 16;

    if (answers.mobilitaet === 'mobil') {
      if (types.indexOf('pants') >= 0 || types.indexOf('vorlagen') >= 0) score += 10;
      if (types.indexOf('slips') >= 0) score -= 4;
    } else if (answers.mobilitaet === 'eingeschraenkt_mobil') {
      if (types.indexOf('pants') >= 0 || types.indexOf('vorlagen') >= 0 || types.indexOf('slips') >= 0) {
        score += 8;
      }
    } else if (answers.mobilitaet === 'bettlaegerig') {
      if (types.indexOf('slips') >= 0 || types.indexOf('vorlagen') >= 0 || types.indexOf('bettschutz') >= 0) {
        score += 12;
      }
      if (types.indexOf('pants') >= 0) score += 2;
    }

    return score;
  }

  function scoreInkontinenzArt(product, answers) {
    if (!answers.stuhlinkontinenz) return 0;
    var arts = getProductInkontinenzArt(product);
    if (!arts.length) return 0;

    if (answers.stuhlinkontinenz === 'ja') {
      if (listOverlap(arts, ['stuhl', 'urin_stuhl'])) return 16;
      return -6;
    }
    if (answers.stuhlinkontinenz === 'unsicher') {
      if (listOverlap(arts, ['stuhl', 'urin_stuhl'])) return 6;
      return 0;
    }
    if (listOverlap(arts, ['urin'])) return 8;
    return 0;
  }

  function scoreAnwendung(product, answers) {
    var anwendungen = getProductAnwendung(product);
    if (!anwendungen.length) return 0;

    var score = 0;
    var bedarf = parseMetafieldList(product.finder && product.finder.bedarf);

    if (
      answers.pflegeort === 'ueberwiegend_bett' ||
      answers.mobilitaet === 'bettlaegerig'
    ) {
      if (listOverlap(anwendungen, ['bett', 'nacht', 'tag_nacht'])) score += 10;
    }
    if (answers.mobilitaet === 'mobil') {
      if (listOverlap(anwendungen, ['tag', 'unterwegs', 'tag_nacht'])) score += 8;
    }
    if (answers.inkontinenz === 'ja' || answers.inkontinenz === 'unsicher') {
      if (listOverlap(bedarf, ['inkontinenz'])) score += 6;
    }
    return score;
  }

  function scoreHautpflege(product, answers) {
    if (!answers.hautzustand) return 0;

    var haut = getProductHautzustand(product);
    var hay = productHaystack(product);
    var preferred = HAUT_NEIGHBORS[answers.hautzustand] || [answers.hautzustand];
    var score = 0;

    if (listOverlap(haut, preferred)) score += 22;

    if (answers.hautzustand === 'gereizt') {
      if (
        matchesKeyword(hay, ['gereizt', 'empfindlich', 'sensitiv', 'hautschutz', 'schonend'])
      ) {
        score += 14;
      }
    }

    if (answers.hautzustand === 'normal' && listOverlap(haut, ['sehr_trocken', 'gereizt'])) {
      score -= 8;
    }

    if (!haut.length && matchesKeyword(hay, preferred)) score += 8;

    return score;
  }

  function scoreKoerperpflege(product, answers) {
    if (answers.koerperpflege !== 'ja') return 0;

    var pflegeort = getProductPflegeort(product);
    var situation = getProductPflegesituation(product);
    var hay = productHaystack(product);
    var score = 0;

    if (answers.pflegeort === 'ausserhalb_bett') {
      if (listOverlap(pflegeort, ['bad', 'dusche', 'bad_dusche'])) score += 18;
      if (listOverlap(situation, ['koerperpflege'])) score += 12;
      if (matchesKeyword(hay, ['dusche', 'bad', 'wasch', 'shampoo'])) score += 8;
    } else if (answers.pflegeort === 'teilweise_bett') {
      if (listOverlap(pflegeort, ['bett', 'bad', 'dusche', 'teilweise_bett'])) score += 14;
      if (listOverlap(situation, ['bettpflege', 'koerperpflege'])) score += 10;
    } else if (answers.pflegeort === 'ueberwiegend_bett') {
      if (listOverlap(pflegeort, ['bett'])) score += 18;
      if (listOverlap(situation, ['bettpflege'])) score += 14;
      if (matchesKeyword(hay, ['waschlappen', 'waschhandschuh', 'bett'])) score += 8;
    }

    return score;
  }

  function scoreEmpfohleneArtikel(product, answers) {
    var hay = productHaystack(product);
    var score = 0;

    if (answers.zielgruppe === 'fuer_andere') {
      if (
        matchesKeyword(hay, [
          'handschuh',
          'desinfektion',
          'schutz',
          'hygiene',
          'hautschutz',
          'entsorgung',
        ])
      ) {
        score += 18;
      }
    }

    if (
      answers.koerperpflege === 'ja' &&
      (answers.pflegeort === 'teilweise_bett' || answers.pflegeort === 'ueberwiegend_bett')
    ) {
      if (
        matchesKeyword(hay, [
          'waschlappen',
          'waschhandschuh',
          'shampoohaube',
          'bettschutz',
          'handschuh',
          'entsorgung',
        ])
      ) {
        score += 16;
      }
    }

    if (answers.stuhlinkontinenz === 'ja') {
      if (
        matchesKeyword(hay, [
          'handschuh',
          'desinfektion',
          'entsorgung',
          'hautschutz',
          'waschlappen',
        ])
      ) {
        score += 16;
      }
    }

    if (answers.inkontinenz === 'ja' || answers.inkontinenz === 'unsicher') {
      if (
        matchesKeyword(hay, [
          'hygiene',
          'entsorgung',
          'hautschutz',
          'bettschutz',
          'desinfektion',
        ])
      ) {
        score += 12;
      }
    }

    if (answers.pflegegrad === 'ja') {
      if (matchesKeyword(hay, ['pflegehilfsmittel', 'verbrauch', 'box', 'hilfsmittel'])) {
        score += 8;
      }
    }

    var situation = getProductPflegesituation(product);
    if (situation.length) score += 6;

    return score;
  }

  function scoreProductForCategory(product, categoryKey, answers) {
    var result = { score: 0, excluded: false, variantHint: false };

    if (!passesGenderFilter(product, answers, categoryKey)) {
      result.excluded = true;
      return result;
    }
    if (!passesStuhlFilter(product, answers, categoryKey)) {
      result.excluded = true;
      return result;
    }

    if (categoryKey === 'inkontinenzversorgung') {
      var menge = scoreMengeForInkontinenz(product, answers);
      if (menge.excluded) {
        result.excluded = true;
        return result;
      }
      result.score += menge.score;
      result.variantHint = menge.variantHint;
      result.score += scoreMobility(product, answers, categoryKey);
      result.score += scoreInkontinenzArt(product, answers);
      result.score += scoreAnwendung(product, answers);
      if (answers.geschlecht && listOverlap(getProductGenderLevels(product), ['frau', 'mann', 'unisex', 'weiblich', 'maennlich'])) {
        result.score += 8;
      }
      return result;
    }

    if (categoryKey === 'koerperpflege') {
      result.score += scoreKoerperpflege(product, answers);
      return result;
    }

    if (categoryKey === 'hautpflege') {
      result.score += scoreHautpflege(product, answers);
      return result;
    }

    if (categoryKey === 'kleine_wundversorgung') {
      result.score += answers.kleine_wunden === 'ja' ? 20 : 0;
      if (matchesKeyword(productHaystack(product), ['wund', 'verband', 'pflaster', 'schutz'])) {
        result.score += 8;
      }
      return result;
    }

    if (categoryKey === 'pflegehilfsmittelbox') {
      result.score += 20;
      return result;
    }

    if (categoryKey === 'empfohlene_artikel') {
      result.score += scoreEmpfohleneArtikel(product, answers);
      if (!hasEmpfohleneSituation(answers)) {
        result.score -= 12;
      }
      return result;
    }

    return result;
  }

  function sortScoredEntries(entries) {
    entries.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.prio !== b.prio) return a.prio - b.prio;
      var titleA = (a.p && a.p.title) || '';
      var titleB = (b.p && b.p.title) || '';
      return titleA.localeCompare(titleB, 'de');
    });
  }

  function getRecommendedProductsForCategory(categoryKey, products, answers) {
    var limit = CATEGORY_LIMITS[categoryKey] || 4;
    var minScore = MIN_SCORE[categoryKey] || 20;

    if (categoryKey === 'empfohlene_artikel' && !hasEmpfohleneSituation(answers)) {
      minScore = 38;
    }

    var scored = [];

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!isActiveProduct(p)) continue;
      if (!productHasCategory(p, categoryKey)) continue;

      var fit = scoreProductForCategory(p, categoryKey, answers);
      if (fit.excluded) continue;

      if (categoryKey === 'inkontinenzversorgung' && answers.menge_urin) {
        var mengeCheck = scoreMengeForInkontinenz(p, answers);
        if (mengeCheck.excluded || mengeCheck.score < 14) continue;
      }

      if (fit.score < minScore) continue;

      var enriched = Object.assign({}, p);
      if (fit.variantHint) {
        enriched._variantHint =
          'Bitte passende Größe/Saugstärke auf der Produktseite auswählen.';
      }

      scored.push({
        p: enriched,
        score: fit.score,
        prio: getPriority(p),
      });
    }

    sortScoredEntries(scored);
    return scored.slice(0, limit).map(function (entry) {
      return entry.p;
    });
  }

  function getRelevantCategories(answers) {
    return CATEGORY_DEFS.filter(function (cat) {
      return cat.isRelevant(answers);
    });
  }

  function buildResultGroups(products, answers) {
    var relevant = getRelevantCategories(answers);
    var groups = [];

    relevant.forEach(function (cat) {
      var items = getRecommendedProductsForCategory(cat.id, products, answers);
      if (!items.length) return;

      groups.push({
        id: cat.id,
        title: cat.title,
        notice: cat.notice ? cat.notice(answers) : null,
        items: items,
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

  function safeJSON(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
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
    CATEGORY_LIMITS: CATEGORY_LIMITS,
    normalizeValue: normalizeValue,
    parseMetafieldList: parseMetafieldList,
    isActiveProduct: isActiveProduct,
    isActive: isActiveProduct,
    productHasCategory: productHasCategory,
    getPriority: getPriority,
    scoreProductForCategory: scoreProductForCategory,
    getRecommendedProductsForCategory: getRecommendedProductsForCategory,
    buildFlow: buildFlow,
    buildResultGroups: buildResultGroups,
    saveAnswers: saveAnswers,
    loadAnswers: loadAnswers,
    dropAnswersAfter: dropAnswersAfter,
    safeJSON: safeJSON,
    stripHtml: stripHtml,
    el: el,
  };
})(typeof window !== 'undefined' ? window : this);
