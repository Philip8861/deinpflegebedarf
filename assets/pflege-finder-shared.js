/* PflegeShop Produktfinder — Kategorien, fachliches Scoring, Session. */
(function (global) {
  'use strict';

  var SESSION_KEY = 'pflegefinder_answers';
  var DEBUG = true;
  var BASE_SCORE = 10;
  var FALLBACK_LIMIT = 3;
  var FALLBACK_LIMIT_EMPFOHLEN = 4;

  var CATEGORY_KEYS = [
    'inkontinenzversorgung',
    'koerperpflege',
    'hautpflege',
    'kleine_wundversorgung',
    'pflegehilfsmittelbox',
    'empfohlene_artikel',
  ];

  var CATEGORY_LIMITS = {
    inkontinenzversorgung: 4,
    koerperpflege: 4,
    hautpflege: 4,
    kleine_wundversorgung: 3,
    pflegehilfsmittelbox: 2,
    empfohlene_artikel: 5,
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

  var HAUT_NEIGHBORS = {
    normal: ['normal'],
    trocken: ['trocken', 'sehr_trocken'],
    sehr_trocken: ['sehr_trocken', 'trocken'],
    gereizt: ['gereizt', 'empfindlich', 'sensitiv', 'hautschutz'],
  };

  var ANSWER_ALIASES = {
    bodyCare: 'koerperpflege',
    koerperliche_pflege: 'koerperpflege',
    incontinence: 'inkontinenz',
    gender: 'geschlecht',
    urine_amount: 'menge_urin',
    mobility: 'mobilitaet',
    stool_incontinence: 'stuhlinkontinenz',
    skin_condition: 'hautzustand',
    small_wounds: 'kleine_wunden',
    care_level: 'pflegegrad',
    target_group: 'zielgruppe',
    care_location: 'pflegeort',
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

  function isExclusivelyLevels(levels, allowedOnly) {
    if (!levels.length) return false;
    for (var i = 0; i < levels.length; i++) {
      if (allowedOnly.indexOf(levels[i]) < 0) return false;
    }
    return true;
  }

  function isPureMaleProduct(genders) {
    if (!genders.length) return false;
    var male = ['mann', 'maennlich', 'herren', 'male'];
    var female = ['frau', 'weiblich', 'damen', 'female'];
    var hasMale = listOverlap(genders, male);
    var hasFemale = listOverlap(genders, female);
    var hasUnisex = listOverlap(genders, ['unisex', 'neutral', 'alle']);
    return hasMale && !hasFemale && !hasUnisex;
  }

  function isPureFemaleProduct(genders) {
    if (!genders.length) return false;
    var male = ['mann', 'maennlich', 'herren', 'male'];
    var female = ['frau', 'weiblich', 'damen', 'female'];
    var hasMale = listOverlap(genders, male);
    var hasFemale = listOverlap(genders, female);
    var hasUnisex = listOverlap(genders, ['unisex', 'neutral', 'alle']);
    return hasFemale && !hasMale && !hasUnisex;
  }

  /* -------------------------------------------------------- *
   * Antworten normalisieren
   * -------------------------------------------------------- */

  function normalizeAnswers(raw) {
    if (!raw || typeof raw !== 'object') return {};
    var a = Object.assign({}, raw);

    Object.keys(ANSWER_ALIASES).forEach(function (legacyKey) {
      var canonical = ANSWER_ALIASES[legacyKey];
      if (a[legacyKey] != null && a[canonical] == null) {
        a[canonical] = a[legacyKey];
      }
    });

    return a;
  }

  /* -------------------------------------------------------- *
   * Kategorie-Sichtbarkeit
   * -------------------------------------------------------- */

  function isCategoryRelevant(categoryKey, answers) {
    for (var i = 0; i < CATEGORY_DEFS.length; i++) {
      if (CATEGORY_DEFS[i].id === categoryKey) {
        return CATEGORY_DEFS[i].isRelevant(answers);
      }
    }
    return false;
  }

  function getRelevantCategories(answers) {
    return CATEGORY_DEFS.filter(function (cat) {
      return cat.isRelevant(answers);
    });
  }

  /* -------------------------------------------------------- *
   * Harte Ausschlüsse (nur wenige Regeln)
   * -------------------------------------------------------- */

  function getHardExclusionReason(product, categoryKey, answers) {
    if (categoryKey !== 'inkontinenzversorgung') return null;

    var genders = getProductGenderLevels(product);

    if (answers.geschlecht === 'weiblich' && isPureMaleProduct(genders)) {
      return 'reines Maennerprodukt bei Geschlecht weiblich';
    }
    if (answers.geschlecht === 'maennlich' && isPureFemaleProduct(genders)) {
      return 'reines Frauenprodukt bei Geschlecht maennlich';
    }

    if (answers.menge_urin) {
      var levels = getProductMengeLevels(product);
      if (levels.length) {
        if (
          answers.menge_urin === 'sehr_viel' &&
          isExclusivelyLevels(levels, ['tropfen', 'leicht'])
        ) {
          return 'ausschliesslich tropfen/leicht bei Urinmenge sehr_viel';
        }
        if (answers.menge_urin === 'wenig' && isExclusivelyLevels(levels, ['sehr_stark'])) {
          return 'ausschliesslich sehr_stark bei Urinmenge wenig';
        }
      }
    }

    return null;
  }

  function isHardExcluded(product, categoryKey, answers) {
    return getHardExclusionReason(product, categoryKey, answers) != null;
  }

  /* -------------------------------------------------------- *
   * Scoring (optional — beeinflusst nur Reihenfolge)
   * -------------------------------------------------------- */

  function scoreMengeForInkontinenz(product, answers) {
    if (!answers.menge_urin) return { score: 0, variantHint: false };

    var levels = getProductMengeLevels(product);
    var preferred = MENGE_ANSWER_MAP[answers.menge_urin] || [];
    var neighbors = MENGE_NEIGHBORS[answers.menge_urin] || [];
    var variantHint = getVariantMengeLevels(product).length > 0 && !parseMetafieldList(product.finder && product.finder.menge_urinverlust).length;

    if (!levels.length) {
      return { score: 2, variantHint: variantHint };
    }

    if (listOverlap(levels, preferred)) {
      return { score: 28, variantHint: variantHint };
    }

    if (listOverlap(levels, neighbors)) {
      return { score: 14, variantHint: variantHint };
    }

    return { score: 4, variantHint: variantHint };
  }

  function scoreMobility(product, answers, categoryKey) {
    if (categoryKey !== 'inkontinenzversorgung' || !answers.mobilitaet) return 0;

    var levels = getProductMobilityLevels(product);
    var types = productTypes(product);
    var score = 0;

    if (listOverlap(levels, [answers.mobilitaet])) score += 16;

    if (answers.mobilitaet === 'mobil') {
      if (types.indexOf('pants') >= 0 || types.indexOf('vorlagen') >= 0) score += 10;
      if (types.indexOf('slips') >= 0) score -= 2;
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
      return 0;
    }
    if (answers.stuhlinkontinenz === 'unsicher') {
      if (listOverlap(arts, ['stuhl', 'urin_stuhl'])) return 6;
      return 0;
    }
    if (listOverlap(arts, ['urin'])) return 4;
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
      score -= 4;
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
    var result = { score: BASE_SCORE, variantHint: false };

    if (categoryKey === 'inkontinenzversorgung') {
      var menge = scoreMengeForInkontinenz(product, answers);
      result.score += menge.score;
      result.variantHint = menge.variantHint;
      result.score += scoreMobility(product, answers, categoryKey);
      result.score += scoreInkontinenzArt(product, answers);
      result.score += scoreAnwendung(product, answers);
      if (
        answers.geschlecht &&
        listOverlap(getProductGenderLevels(product), [
          'frau',
          'mann',
          'unisex',
          'weiblich',
          'maennlich',
        ])
      ) {
        result.score += 4;
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
      result.score += answers.kleine_wunden === 'ja' ? 10 : 0;
      if (matchesKeyword(productHaystack(product), ['wund', 'verband', 'pflaster', 'schutz'])) {
        result.score += 8;
      }
      return result;
    }

    if (categoryKey === 'pflegehilfsmittelbox') {
      result.score += 10;
      return result;
    }

    if (categoryKey === 'empfohlene_artikel') {
      result.score += scoreEmpfohleneArtikel(product, answers);
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

  function sortByPriority(entries) {
    entries.sort(function (a, b) {
      if (a.prio !== b.prio) return a.prio - b.prio;
      var titleA = (a.p && a.p.title) || '';
      var titleB = (b.p && b.p.title) || '';
      return titleA.localeCompare(titleB, 'de');
    });
  }

  function productDebugMeta(product) {
    var f = (product && product.finder) || {};
    return {
      titel: product.title,
      ergebnis_kategorie: f.ergebnis_kategorie,
      menge_urinverlust: f.menge_urinverlust,
      mobilitaet: f.mobilitaet,
      hautzustand: f.hautzustand,
      pflegeort: f.pflegeort,
      geschlecht: f.geschlecht,
      inkontinenz_art: f.inkontinenz_art,
    };
  }

  function buildFallbackProducts(categoryKey, candidates, answers, limit) {
    var eligible = [];

    for (var i = 0; i < candidates.length; i++) {
      var p = candidates[i];
      if (!isActiveProduct(p)) continue;
      if (!productHasCategory(p, categoryKey)) continue;
      if (isHardExcluded(p, categoryKey, answers)) continue;
      eligible.push({ p: p, prio: getPriority(p), score: BASE_SCORE });
    }

    sortByPriority(eligible);
    return eligible.slice(0, limit).map(function (entry) {
      return entry.p;
    });
  }

  /* -------------------------------------------------------- *
   * Debug-Ausgaben
   * -------------------------------------------------------- */

  function logProductLoadStats(products) {
    if (!DEBUG) return;

    var active = 0;
    var withCategory = 0;
    var perCategory = {};
    CATEGORY_KEYS.forEach(function (key) {
      perCategory[key] = 0;
    });

    products.forEach(function (p) {
      if (isActiveProduct(p)) active += 1;
      var cats = parseMetafieldList(p.finder && p.finder.ergebnis_kategorie);
      if (cats.length) {
        withCategory += 1;
        cats.forEach(function (cat) {
          if (perCategory[cat] != null) perCategory[cat] += 1;
        });
      }
    });

    console.log('[PflegeFinder] Produkte geladen:', {
      gesamt: products.length,
      aktiv: active,
      mit_ergebnis_kategorie: withCategory,
      pro_kategorie: perCategory,
    });
  }

  function logAnswersDebug(answers) {
    if (!DEBUG) return;

    var visible = CATEGORY_KEYS.filter(function (key) {
      return isCategoryRelevant(key, answers);
    });

    console.log('[PflegeFinder] Antworten (sessionStorage):', answers);
    console.log('[PflegeFinder] Sichtbare Kategorien:', visible);
  }

  function buildCategoryDebugReport(categoryKey, products, answers) {
    var afterActiveCategory = [];
    var afterHardFilter = [];
    var topRows = [];

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!isActiveProduct(p) || !productHasCategory(p, categoryKey)) continue;

      afterActiveCategory.push(p);

      var hardReason = getHardExclusionReason(p, categoryKey, answers);
      var fit = scoreProductForCategory(p, categoryKey, answers);

      topRows.push({
        titel: p.title,
        score: hardReason ? null : fit.score,
        prioritaet: getPriority(p),
        ergebnis_kategorie: p.finder && p.finder.ergebnis_kategorie,
        menge_urinverlust: p.finder && p.finder.menge_urinverlust,
        mobilitaet: p.finder && p.finder.mobilitaet,
        hautzustand: p.finder && p.finder.hautzustand,
        pflegeort: p.finder && p.finder.pflegeort,
        ausschlussgrund: hardReason,
      });

      if (!hardReason) afterHardFilter.push(p);
    }

    topRows.sort(function (a, b) {
      if (a.ausschlussgrund && !b.ausschlussgrund) return 1;
      if (!a.ausschlussgrund && b.ausschlussgrund) return -1;
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if (a.prioritaet !== b.prioritaet) return a.prioritaet - b.prioritaet;
      return (a.titel || '').localeCompare(b.titel || '', 'de');
    });

    return {
      relevant: isCategoryRelevant(categoryKey, answers),
      kandidaten_vor_filter: products.length,
      kandidaten_nach_active_und_kategorie: afterActiveCategory.length,
      kandidaten_nach_harten_ausschluessen: afterHardFilter.length,
      top_20: topRows.slice(0, 20),
    };
  }

  function logCategoryDebug(categoryKey, answers, products, resultItems) {
    if (!DEBUG) return;

    var report = buildCategoryDebugReport(categoryKey, products, answers);
    console.log('[PflegeFinder] Kategorie:', categoryKey, Object.assign({}, report, {
      ergebnis_anzahl: resultItems.length,
    }));
  }

  function logSeniClassicPrimaDebug(products, answers) {
    if (!DEBUG) return;
    if (answers.inkontinenz !== 'ja' && answers.inkontinenz !== 'unsicher') return;

    var target = products.filter(function (p) {
      return /seni.*classic.*prima|seni san classic prima/i.test(p.title || '');
    });

    if (!target.length) {
      console.warn('[PflegeFinder] Seni San Classic Prima nicht in Produktdaten gefunden.');
      return;
    }

    target.forEach(function (p) {
      var reason = getHardExclusionReason(p, 'inkontinenzversorgung', answers);
      var fit = scoreProductForCategory(p, 'inkontinenzversorgung', answers);
      var inCategory = productHasCategory(p, 'inkontinenzversorgung');
      var active = isActiveProduct(p);

      console.log('[PflegeFinder] Seni San Classic Prima Debug:', {
        titel: p.title,
        aktiv: active,
        in_kategorie_inkontinenzversorgung: inCategory,
        harter_ausschluss: reason,
        score: fit.score,
        prioritaet: getPriority(p),
        metafelder: productDebugMeta(p),
        wuerde_erscheinen:
          active &&
          inCategory &&
          !reason &&
          isCategoryRelevant('inkontinenzversorgung', answers),
      });
    });
  }

  /* -------------------------------------------------------- *
   * Produktfilter + Ergebnis
   * -------------------------------------------------------- */

  function getRecommendedProductsForCategory(categoryKey, products, answers) {
    var limit = CATEGORY_LIMITS[categoryKey] || 4;
    var scored = [];

    for (var i = 0; i < products.length; i++) {
      var p = products[i];

      if (!isActiveProduct(p) || !productHasCategory(p, categoryKey)) continue;

      var hardReason = getHardExclusionReason(p, categoryKey, answers);
      if (hardReason) continue;

      var fit = scoreProductForCategory(p, categoryKey, answers);
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
    var result = scored.slice(0, limit).map(function (entry) {
      return entry.p;
    });

    if (!result.length) {
      var fallbackLimit =
        categoryKey === 'empfohlene_artikel' ? FALLBACK_LIMIT_EMPFOHLEN : FALLBACK_LIMIT;
      var fallback = buildFallbackProducts(categoryKey, products, answers, fallbackLimit);
      if (fallback.length) {
        console.warn(
          '[PflegeFinder] Fallback genutzt fuer Kategorie ' + categoryKey,
          fallback.map(function (fp) {
            return fp.title;
          })
        );
        result = fallback;
      }
    }

    return result;
  }

  function buildResultGroups(products, answers) {
    var normalized = normalizeAnswers(answers);

    logProductLoadStats(products);
    logAnswersDebug(normalized);
    logSeniClassicPrimaDebug(products, normalized);

    var relevant = getRelevantCategories(normalized);
    var groups = [];

    relevant.forEach(function (cat) {
      var items = getRecommendedProductsForCategory(cat.id, products, normalized);

      logCategoryDebug(cat.id, normalized, products, items);

      if (!items.length) return;

      groups.push({
        id: cat.id,
        title: cat.title,
        notice: cat.notice ? cat.notice(normalized) : null,
        items: items,
      });
    });

    return groups;
  }

  function saveAnswers(answers) {
    try {
      var normalized = normalizeAnswers(answers);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
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
      if (!parsed || typeof parsed !== 'object') return null;
      return normalizeAnswers(parsed);
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
    DEBUG: DEBUG,
    CATEGORY_DEFS: CATEGORY_DEFS,
    CATEGORY_LIMITS: CATEGORY_LIMITS,
    normalizeValue: normalizeValue,
    normalizeAnswers: normalizeAnswers,
    parseMetafieldList: parseMetafieldList,
    isActiveProduct: isActiveProduct,
    isActive: isActiveProduct,
    productHasCategory: productHasCategory,
    getPriority: getPriority,
    isCategoryRelevant: isCategoryRelevant,
    getHardExclusionReason: getHardExclusionReason,
    scoreProductForCategory: scoreProductForCategory,
    getRecommendedProductsForCategory: getRecommendedProductsForCategory,
    buildFlow: buildFlow,
    buildResultGroups: buildResultGroups,
    logProductLoadStats: logProductLoadStats,
    logAnswersDebug: logAnswersDebug,
    saveAnswers: saveAnswers,
    loadAnswers: loadAnswers,
    dropAnswersAfter: dropAnswersAfter,
    safeJSON: safeJSON,
    stripHtml: stripHtml,
    el: el,
  };
})(typeof window !== 'undefined' ? window : this);
