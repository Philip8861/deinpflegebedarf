/* PflegeShop Produktfinder — Kategorien, Scoring, Session, Debug. */
(function (global) {
  'use strict';

  var SESSION_KEY = 'pflegefinder_answers';
  var DEBUG = true;

  var CATEGORY_BASE_SCORE = 30;
  var TIER_SCORE_GAP = 12;
  var TIER_MIN_FOR_SPLIT = 5;

  var KOERPER_ROLE_BOOST = {
    ausserhalb_bett: [
      'dusche',
      'bad',
      'shampoo',
      'duschgel',
      'seife',
      'waschlotion',
      'waschemulsion',
      'shower',
    ],
    teilweise_bett: [
      'waschlappen',
      'waschhandschuh',
      'handschuh',
      'shampoohaube',
      'wasch',
      'pflege',
    ],
    ueberwiegend_bett: [
      'waschlappen',
      'waschhandschuh',
      'handschuh',
      'shampoohaube',
      'wasch',
      'bett',
      'pflege',
    ],
  };

  var KOERPER_ROLE_MALUS = ['kamm', 'nagel', 'pinzette', 'zubehoer', 'accessoire'];

  var CATEGORY_KEYS = [
    'inkontinenzversorgung',
    'koerperpflege',
    'hautpflege',
    'kleine_wundversorgung',
    'pflegehilfsmittelbox',
    'empfohlene_artikel',
  ];

  var MIN_SCORE = {
    inkontinenzversorgung: 35,
    koerperpflege: 30,
    hautpflege: 30,
    kleine_wundversorgung: 30,
    pflegehilfsmittelbox: 20,
    empfohlene_artikel: 25,
  };

  var CATEGORY_MAX = {
    inkontinenzversorgung: 5,
    koerperpflege: 8,
    hautpflege: 5,
    kleine_wundversorgung: 5,
    pflegehilfsmittelbox: 2,
    empfohlene_artikel: 5,
  };

  var INKONTINENZ_TOP_BADGE_COUNT = 2;

  var MENGE_PERFECT = {
    wenig: ['tropfen', 'leicht'],
    mittel: ['mittel'],
    viel: ['stark'],
    sehr_viel: ['sehr_stark'],
  };

  var MENGE_NEIGHBOR = {
    wenig: ['mittel'],
    mittel: ['leicht', 'stark'],
    viel: ['mittel', 'sehr_stark'],
    sehr_viel: ['stark'],
  };

  var INKONTINENZ_EINSATZ_PERFECT = {
    unterwegs_tag: ['tag', 'unterwegs'],
    nacht: ['nacht'],
    bett: ['bett', 'nacht'],
  };

  var INKONTINENZ_EINSATZ_NEIGHBOR = {
    unterwegs_tag: ['tag_nacht'],
    nacht: ['bett', 'tag_nacht'],
    bett: ['tag_nacht'],
  };

  var KOERPER_PFLEGEORT_PERFECT = {
    ausserhalb_bett: ['bad', 'dusche', 'koerperpflege'],
    teilweise_bett: ['bad', 'dusche', 'bett', 'koerperpflege', 'bettpflege'],
    ueberwiegend_bett: ['bett', 'bettpflege'],
  };

  var HAUT_PERFECT = {
    normal: ['normal'],
    trocken: ['trocken'],
    sehr_trocken_gereizt: ['sehr_trocken', 'gereizt'],
  };

  var HAUT_NEIGHBOR = {
    normal: ['trocken'],
    trocken: ['normal', 'sehr_trocken', 'gereizt'],
    sehr_trocken_gereizt: ['trocken', 'hautschutz', 'sensitiv', 'mild', 'empfindlich'],
  };

  var ANSWER_ALIASES = {
    bodyCare: 'koerperpflege',
    koerperliche_pflege: 'koerperpflege',
    incontinence: 'inkontinenz',
    gender: 'geschlecht',
    urine_amount: 'menge_urin',
    mobility: 'inkontinenz_einsatz',
    mobilitaet: 'inkontinenz_einsatz',
    stool_incontinence: 'stuhlinkontinenz',
    skin_condition: 'hautzustand',
    small_wounds: 'kleine_wunden',
    care_level: 'pflegegrad',
    care_location: 'pflegeort',
  };

  var TRACKED_PRODUCT_PATTERNS = [
    { label: 'Seni San Classic Prima', re: /seni\s*san\s*classic\s*prima/i },
    { label: 'Seni Classic Basic', re: /seni\s*classic\s*basic/i },
    { label: 'Körperpflege (Beispiel)', re: /./, category: 'koerperpflege', first: true },
    { label: 'Hautpflege (Beispiel)', re: /./, category: 'hautpflege', first: true },
  ];

  var CATEGORY_DEFS = [
    {
      id: 'inkontinenzversorgung',
      title: 'Inkontinenzversorgung',
      isRelevant: function (a) {
        return a.inkontinenz === 'ja';
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

  var PFLEGEGRAD_BLOCK = {
    title: 'Kostenfreie Pflegehilfsmittel ab Pflegegrad 1',
    lead: 'Wussten Sie schon?',
    text:
      'Viele Produkte aus unserem Shop müssen Sie nicht selbst bezahlen. Ab Pflegegrad 1 können Sie Pflegehilfsmittel im Wert von bis zu 42 € monatlich kostenlos über die Pflegekasse erhalten.',
    ctaPrimary: 'Pflegebox jetzt konfigurieren',
    ctaSecondary: 'Weitere Infos',
  };

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

  function scorePriorityBonus(product) {
    var n = parseInt(product && product.finder && product.finder.prioritaet, 10);
    if (n === 1) return { points: 10, label: 'finder.prioritaet=1 (+10)' };
    if (n === 2) return { points: 5, label: 'finder.prioritaet=2 (+5)' };
    return { points: 0, label: 'finder.prioritaet=3/leer (+0)' };
  }

  function productHaystack(product) {
    var f = (product && product.finder) || {};
    return normalizeValue(
      [product.title, f.kategorie, f.empfehlungstext, f.pflegesituation, f.bedarf].join(' ')
    );
  }

  function productInkontinenzTypes(product) {
    var hay = productHaystack(product);
    var types = [];
    if (/pants|windelhose|inkontinenzhose|fixierhose/.test(hay)) types.push('pants');
    if (/slip|fixie/.test(hay)) types.push('slips');
    if (/vorlage|einlage|pad|einleg/.test(hay)) types.push('vorlagen');
    if (/bettschutz|bettschutzeinlage|molton/.test(hay)) types.push('bettschutz');
    return types;
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
    return (
      listOverlap(genders, male) &&
      !listOverlap(genders, female) &&
      !listOverlap(genders, ['unisex', 'neutral', 'alle'])
    );
  }

  function isPureFemaleProduct(genders) {
    if (!genders.length) return false;
    var male = ['mann', 'maennlich', 'herren', 'male'];
    var female = ['frau', 'weiblich', 'damen', 'female'];
    return (
      listOverlap(genders, female) &&
      !listOverlap(genders, male) &&
      !listOverlap(genders, ['unisex', 'neutral', 'alle'])
    );
  }

  function isExclusivelyStuhl(arts) {
    return arts.length > 0 && isExclusivelyLevels(arts, ['stuhl']);
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
      [v.title, v.option1, v.option2, v.option3].forEach(function (t) {
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
    return uniqueList(meta.concat(getVariantMengeLevels(product)));
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

  function addScore(result, label, points) {
    result.score += points;
    var sign = points >= 0 ? '+' : '';
    result.reasons.push(label + ' (' + sign + points + ')');
  }

  function scoreKoerperpflegeRole(product, answers, result) {
    if (answers.koerperpflege !== 'ja' || !answers.pflegeort) return;

    var hay = productHaystack(product);
    var boostKeys = KOERPER_ROLE_BOOST[answers.pflegeort] || [];

    if (matchesKeyword(hay, boostKeys)) {
      var pts = answers.pflegeort === 'ueberwiegend_bett' ? 16 : 14;
      addScore(result, 'Kernprodukt Körperpflege', pts);
    }

    if (
      (answers.pflegeort === 'teilweise_bett' || answers.pflegeort === 'ueberwiegend_bett') &&
      matchesKeyword(hay, KOERPER_ROLE_MALUS)
    ) {
      addScore(result, 'Ergänzungs-/Zubehörartikel', -10);
    }
  }

  function scoreInkontinenzProdukttyp(product, answers, result) {
    if (!answers.inkontinenz_einsatz) return;

    var types = productInkontinenzTypes(product);
    if (!types.length) return;

    if (answers.inkontinenz_einsatz === 'unterwegs_tag') {
      if (types.indexOf('pants') >= 0 || types.indexOf('vorlagen') >= 0) {
        addScore(result, 'Produkttyp für unterwegs/tagsüber', 14);
      }
      if (types.indexOf('slips') >= 0) {
        addScore(result, 'Slip weniger passend unterwegs', -6);
      }
    } else if (answers.inkontinenz_einsatz === 'bett') {
      if (types.indexOf('slips') >= 0 || types.indexOf('vorlagen') >= 0 || types.indexOf('bettschutz') >= 0) {
        addScore(result, 'Produkttyp für Bett', 14);
      }
    } else if (answers.inkontinenz_einsatz === 'nacht') {
      if (types.indexOf('vorlagen') >= 0 || types.indexOf('slips') >= 0 || types.indexOf('pants') >= 0) {
        addScore(result, 'Produkttyp für Nacht', 10);
      }
    }
  }

  function scoreHautpflegeMalus(product, answers, result) {
    if (answers.hautzustand !== 'normal') return;

    var haut = getProductHautzustand(product);
    if (listOverlap(haut, ['sehr_trocken', 'gereizt'])) {
      addScore(result, 'Hautzustand weniger passend zu normal', -8);
    }
  }

  function assignDisplayTier(scored) {
    if (!scored.length) return scored;

    var maxScore = scored[0].score;

    scored.forEach(function (entry) {
      entry.p._score = entry.score;
      if (scored.length < TIER_MIN_FOR_SPLIT) {
        entry.p._tier = 'top';
      } else if (entry.score >= maxScore - TIER_SCORE_GAP) {
        entry.p._tier = 'top';
      } else {
        entry.p._tier = 'more';
      }
    });

    return scored;
  }

  function partitionItemsByTier(products) {
    if (products.length < TIER_MIN_FOR_SPLIT) {
      return { items: products, topItems: products, moreItems: [] };
    }

    var topItems = [];
    var moreItems = [];

    products.forEach(function (p) {
      if (p._tier === 'more') moreItems.push(p);
      else topItems.push(p);
    });

    if (!moreItems.length) {
      return { items: products, topItems: products, moreItems: [] };
    }

    return { items: products, topItems: topItems, moreItems: moreItems };
  }

  function genderAllowedForAnswer(genders, geschlecht) {
    if (!geschlecht) return true;
    if (!genders.length) return true;
    if (listOverlap(genders, ['unisex', 'neutral', 'alle'])) return true;
    if (geschlecht === 'weiblich') {
      return listOverlap(genders, ['frau', 'weiblich', 'damen', 'female']);
    }
    if (geschlecht === 'maennlich') {
      return listOverlap(genders, ['mann', 'maennlich', 'herren', 'male']);
    }
    return true;
  }

  function hasEmpfohleneSituation(answers) {
    return (
      (answers.koerperpflege === 'ja' &&
        (answers.pflegeort === 'teilweise_bett' || answers.pflegeort === 'ueberwiegend_bett')) ||
      answers.stuhlinkontinenz === 'ja' ||
      answers.inkontinenz === 'ja' ||
      answers.pflegegrad === 'ja' ||
      answers.koerperpflege === 'ja'
    );
  }

  /* -------------------------------------------------------- *
   * Antworten
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

    delete a.zielgruppe;

    if (a.inkontinenz === 'unsicher') a.inkontinenz = 'ja';
    if (a.pflegegrad === 'weiss_nicht') a.pflegegrad = 'nein';
    if (a.stuhlinkontinenz === 'unsicher') a.stuhlinkontinenz = 'ja';
    if (a.geschlecht === 'egal') delete a.geschlecht;

    if (a.hautzustand === 'sehr_trocken' || a.hautzustand === 'gereizt') {
      a.hautzustand = 'sehr_trocken_gereizt';
    }

    if (!a.inkontinenz_einsatz && a.mobilitaet) {
      if (a.mobilitaet === 'mobil') a.inkontinenz_einsatz = 'unterwegs_tag';
      else if (a.mobilitaet === 'bettlaegerig') a.inkontinenz_einsatz = 'bett';
      else a.inkontinenz_einsatz = 'nacht';
    }

    return a;
  }

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
   * Harte Ausschlüsse
   * -------------------------------------------------------- */

  function getHardExclusionReason(product, categoryKey, answers) {
    if (categoryKey === 'inkontinenzversorgung') {
      var genders = getProductGenderLevels(product);

      if (answers.geschlecht === 'weiblich' && isPureMaleProduct(genders)) {
        return 'reines Maennerprodukt bei Geschlecht weiblich';
      }
      if (answers.geschlecht === 'maennlich' && isPureFemaleProduct(genders)) {
        return 'reines Frauenprodukt bei Geschlecht maennlich';
      }
      if (answers.geschlecht && genders.length && !genderAllowedForAnswer(genders, answers.geschlecht)) {
        return 'Geschlecht passt nicht (' + genders.join(', ') + ')';
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

      if (answers.stuhlinkontinenz === 'nein') {
        var arts = getProductInkontinenzArt(product);
        if (isExclusivelyStuhl(arts)) {
          return 'reines Stuhlprodukt bei Stuhlinkontinenz Nein';
        }
      }
    }

    return null;
  }

  /* -------------------------------------------------------- *
   * Kategorie-Scoring
   * -------------------------------------------------------- */

  function scoreMengeInkontinenz(product, answers, result) {
    if (!answers.menge_urin) return;

    var levels = getProductMengeLevels(product);
    var perfect = MENGE_PERFECT[answers.menge_urin] || [];
    var neighbor = MENGE_NEIGHBOR[answers.menge_urin] || [];
    var metaLevels = parseMetafieldList(product.finder && product.finder.menge_urinverlust);
    var variantLevels = getVariantMengeLevels(product);

    if (variantLevels.length && !metaLevels.length) {
      result.variantHint = true;
    }

    if (!levels.length) return;

    if (listOverlap(levels, perfect)) {
      addScore(result, 'Urinmenge perfekt (' + levels.join(', ') + ')', 25);
    } else if (listOverlap(levels, neighbor)) {
      addScore(result, 'Urinmenge Nachbarstufe (' + levels.join(', ') + ')', 10);
    } else {
      addScore(result, 'Urinmenge ohne Treffer (' + levels.join(', ') + ')', 0);
    }
  }

  function scoreInkontinenzSituation(product, answers, result) {
    if (!answers.inkontinenz_einsatz) return;

    var anwendungen = getProductAnwendung(product);
    var pflegeort = getProductPflegeort(product);
    var perfect = INKONTINENZ_EINSATZ_PERFECT[answers.inkontinenz_einsatz] || [];
    var neighbor = INKONTINENZ_EINSATZ_NEIGHBOR[answers.inkontinenz_einsatz] || [];
    var combined = uniqueList(anwendungen.concat(pflegeort));

    if (!combined.length) return;

    if (listOverlap(combined, perfect)) {
      addScore(result, 'Einsatzzeit perfekt (' + combined.join(', ') + ')', 15);
    } else if (listOverlap(combined, neighbor)) {
      addScore(result, 'Einsatzzeit Nachbar (' + combined.join(', ') + ')', 6);
    }
  }

  function scoreGenderInkontinenz(product, answers, result) {
    if (!answers.geschlecht) return;

    var genders = getProductGenderLevels(product);
    if (!genders.length) return;

    if (
      listOverlap(genders, ['unisex', 'neutral', 'alle']) ||
      (answers.geschlecht === 'weiblich' && listOverlap(genders, ['frau', 'weiblich'])) ||
      (answers.geschlecht === 'maennlich' && listOverlap(genders, ['mann', 'maennlich']))
    ) {
      addScore(result, 'Geschlecht passt (' + genders.join(', ') + ')', 10);
    }
  }

  function scoreInkontinenzArt(product, answers, result) {
    if (!answers.stuhlinkontinenz) return;

    var arts = getProductInkontinenzArt(product);
    if (!arts.length) return;

    if (answers.stuhlinkontinenz === 'ja') {
      if (listOverlap(arts, ['stuhl', 'urin_stuhl'])) {
        addScore(result, 'Inkontinenzart stuhl/urin_stuhl', 15);
      } else if (listOverlap(arts, ['urin'])) {
        addScore(result, 'Inkontinenzart nur urin', 3);
      }
    } else if (answers.stuhlinkontinenz === 'nein') {
      if (listOverlap(arts, ['urin', 'urin_stuhl'])) {
        addScore(result, 'Inkontinenzart urin/urin_stuhl', 8);
      }
    }
  }

  function scoreHautpflege(product, answers, result) {
    if (!answers.hautzustand) return;

    var haut = getProductHautzustand(product);
    var hay = productHaystack(product);
    var perfect = HAUT_PERFECT[answers.hautzustand] || [answers.hautzustand];
    var neighbor = HAUT_NEIGHBOR[answers.hautzustand] || [];

    if (haut.length) {
      if (listOverlap(haut, perfect)) {
        addScore(result, 'Hautzustand perfekt (' + haut.join(', ') + ')', 22);
      } else if (listOverlap(haut, neighbor)) {
        addScore(result, 'Hautzustand Nachbar (' + haut.join(', ') + ')', 8);
      }
    }

    if (answers.hautzustand === 'sehr_trocken_gereizt') {
      if (
        matchesKeyword(hay, ['gereizt', 'empfindlich', 'sensitiv', 'hautschutz', 'schonend', 'mild'])
      ) {
        addScore(result, 'Hautschutz/Schonende Pflege (Titel/Text)', 8);
      }
    }

    scoreHautpflegeMalus(product, answers, result);
  }

  function scoreKoerperpflege(product, answers, result) {
    if (answers.koerperpflege !== 'ja' || !answers.pflegeort) return;

    var pflegeortMeta = getProductPflegeort(product);
    var situation = getProductPflegesituation(product);
    var combined = uniqueList(pflegeortMeta.concat(situation));
    var perfect = KOERPER_PFLEGEORT_PERFECT[answers.pflegeort] || [];

    if (combined.length && listOverlap(combined, perfect)) {
      var points = answers.pflegeort === 'ueberwiegend_bett' ? 18 : 15;
      addScore(result, 'Pflegeort perfekt (' + combined.join(', ') + ')', points);
    } else if (combined.length && listOverlap(combined, ['koerperpflege'])) {
      addScore(result, 'Koerperpflege allgemein', 6);
    } else if (
      answers.pflegeort === 'teilweise_bett' &&
      combined.length &&
      listOverlap(combined, ['bad', 'dusche', 'bett', 'bettpflege'])
    ) {
      addScore(result, 'Pflegeort Nachbar', 6);
    }

    if (listOverlap(situation, ['koerperpflege', 'bettpflege'])) {
      addScore(result, 'Pflegesituation passt', 10);
    }

    if (answers.inkontinenz === 'ja' && listOverlap(situation, ['inkontinenzwechsel'])) {
      addScore(result, 'Inkontinenzwechsel passend', 8);
    }

    scoreKoerperpflegeRole(product, answers, result);
  }

  function scoreEmpfohleneArtikel(product, answers, result) {
    var hay = productHaystack(product);

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
        addScore(result, 'Koerperpflege im Bett', 12);
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
        addScore(result, 'Stuhlinkontinenz Ja', 12);
      }
    }

    if (answers.inkontinenz === 'ja') {
      if (
        matchesKeyword(hay, ['hygiene', 'entsorgung', 'hautschutz', 'bettschutz', 'desinfektion'])
      ) {
        addScore(result, 'Inkontinenz Ja', 8);
      }
    }

    if (answers.koerperpflege === 'ja') {
      if (matchesKeyword(hay, ['handschuh', 'waschlappen', 'hautschutz'])) {
        addScore(result, 'Koerperpflege Ja', 8);
      }
    }

    if (answers.pflegegrad === 'ja') {
      if (matchesKeyword(hay, ['pflegehilfsmittel', 'verbrauch', 'box', 'hilfsmittel'])) {
        addScore(result, 'Pflegegrad Ja', 5);
      }
    }
  }

  function scoreProductForCategory(product, categoryKey, answers) {
    var result = {
      score: 0,
      reasons: [],
      variantHint: false,
    };

    addScore(result, 'Kategorie passt', CATEGORY_BASE_SCORE);

    var prio = scorePriorityBonus(product);
    addScore(result, prio.label, prio.points);

    if (categoryKey === 'inkontinenzversorgung') {
      scoreMengeInkontinenz(product, answers, result);
      scoreInkontinenzSituation(product, answers, result);
      scoreGenderInkontinenz(product, answers, result);
      scoreInkontinenzArt(product, answers, result);
      scoreInkontinenzProdukttyp(product, answers, result);
    } else if (categoryKey === 'koerperpflege') {
      scoreKoerperpflege(product, answers, result);
    } else if (categoryKey === 'hautpflege') {
      scoreHautpflege(product, answers, result);
    } else if (categoryKey === 'empfohlene_artikel') {
      scoreEmpfohleneArtikel(product, answers, result);
    }

    return result;
  }

  /* -------------------------------------------------------- *
   * Sortierung + Auswahl
   * -------------------------------------------------------- */

  function sortScoredEntries(entries) {
    entries.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (a.prio !== b.prio) return a.prio - b.prio;
      return ((a.p && a.p.title) || '').localeCompare((b.p && b.p.title) || '', 'de');
    });
  }

  function sortByPriority(entries) {
    entries.sort(function (a, b) {
      if (a.prio !== b.prio) return a.prio - b.prio;
      return ((a.p && a.p.title) || '').localeCompare((b.p && b.p.title) || '', 'de');
    });
  }

  function collectCandidates(categoryKey, products, answers) {
    var candidates = [];

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (!isActiveProduct(p) || !productHasCategory(p, categoryKey)) continue;

      var hardReason = getHardExclusionReason(p, categoryKey, answers);
      if (hardReason) {
        candidates.push({ p: p, hardReason: hardReason, fit: null });
        continue;
      }

      var fit = scoreProductForCategory(p, categoryKey, answers);
      candidates.push({ p: p, hardReason: null, fit: fit });
    }

    return candidates;
  }

  function selectByMinScore(candidates, minScore) {
    var scored = [];

    candidates.forEach(function (c) {
      if (c.hardReason || !c.fit) return;
      if (c.fit.score < minScore) return;

      var enriched = Object.assign({}, c.p);
      if (c.fit.variantHint) {
        enriched._variantHint =
          'Bitte passende Größe/Saugstärke auf der Produktseite auswählen.';
      }

      scored.push({
        p: enriched,
        score: c.fit.score,
        prio: getPriority(c.p),
        reasons: c.fit.reasons,
      });
    });

    sortScoredEntries(scored);
    assignDisplayTier(scored);
    return scored.map(function (e) {
      return e.p;
    });
  }

  function buildPriorityFallback(candidates) {
    var eligible = [];

    candidates.forEach(function (c) {
      if (c.hardReason) return;
      eligible.push({ p: c.p, prio: getPriority(c.p) });
    });

    sortByPriority(eligible);
    return eligible.map(function (e) {
      e.p._score = CATEGORY_BASE_SCORE;
      e.p._tier = 'more';
      return e.p;
    });
  }

  function applyCategoryDisplayRules(categoryKey, items) {
    if (!items || !items.length) return [];

    var max = CATEGORY_MAX[categoryKey];
    var limited = items;

    if (max != null && max > 0 && items.length > max) {
      limited = items.slice(0, max);
      if (DEBUG) {
        console.log(
          '[PflegeFinder] Kategorie-Limit angewendet: ' +
            categoryKey +
            ' (' +
            items.length +
            ' -> ' +
            limited.length +
            ')'
        );
      }
    }

    limited.forEach(function (p, index) {
      if (categoryKey === 'inkontinenzversorgung' && index < INKONTINENZ_TOP_BADGE_COUNT) {
        p._topRecommended = true;
      } else {
        delete p._topRecommended;
      }
    });

    return limited;
  }

  function getRecommendedProductsForCategory(categoryKey, products, answers) {
    var minScore = MIN_SCORE[categoryKey] || 30;
    var candidates = collectCandidates(categoryKey, products, answers);
    var result = selectByMinScore(candidates, minScore);

    if (!result.length) {
      var lowered = minScore - 10;
      result = selectByMinScore(candidates, lowered);
      if (result.length) {
        console.warn(
          '[PflegeFinder] Mindestscore gesenkt fuer Kategorie ' +
            categoryKey +
            ': ' +
            minScore +
            ' -> ' +
            lowered
        );
      }
    }

    if (!result.length) {
      result = buildPriorityFallback(candidates);
      if (result.length) {
        console.warn(
          '[PflegeFinder] Fallback genutzt fuer Kategorie ' + categoryKey,
          result.map(function (p) {
            return p.title;
          })
        );
      }
    }

    if (!result.length && isCategoryRelevant(categoryKey, answers)) {
      console.warn(
        '[PflegeFinder] Keine Produkte fuer relevante Kategorie: ' + categoryKey
      );
    }

    return applyCategoryDisplayRules(categoryKey, result);
  }

  /* -------------------------------------------------------- *
   * Debug
   * -------------------------------------------------------- */

  function productDebugRow(p, categoryKey, answers) {
    var hardReason = getHardExclusionReason(p, categoryKey, answers);
    var fit = hardReason ? null : scoreProductForCategory(p, categoryKey, answers);
    var f = p.finder || {};

    return {
      titel: p.title,
      score: fit ? fit.score : null,
      prioritaet: getPriority(p),
      ergebnis_kategorie: f.ergebnis_kategorie,
      menge_urinverlust: f.menge_urinverlust,
      mobilitaet: f.mobilitaet,
      inkontinenz_art: f.inkontinenz_art,
      hautzustand: f.hautzustand,
      pflegeort: f.pflegeort,
      pflegesituation: f.pflegesituation,
      score_gruende: fit ? fit.reasons : [],
      ausschlussgrund: hardReason,
    };
  }

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

  function logCategoryDebug(categoryKey, answers, products, resultItems) {
    if (!DEBUG) return;

    var afterActive = 0;
    var afterHard = 0;
    var rows = [];

    products.forEach(function (p) {
      if (!isActiveProduct(p) || !productHasCategory(p, categoryKey)) return;
      afterActive += 1;
      var row = productDebugRow(p, categoryKey, answers);
      rows.push(row);
      if (!row.ausschlussgrund) afterHard += 1;
    });

    rows.sort(function (a, b) {
      if (a.ausschlussgrund && !b.ausschlussgrund) return 1;
      if (!a.ausschlussgrund && b.ausschlussgrund) return -1;
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      if (a.prioritaet !== b.prioritaet) return a.prioritaet - b.prioritaet;
      return (a.titel || '').localeCompare(b.titel || '', 'de');
    });

    console.log('[PflegeFinder] Kategorie:', categoryKey, {
      relevant: isCategoryRelevant(categoryKey, answers),
      kandidaten_vor_filter: products.length,
      kandidaten_nach_active_und_kategorie: afterActive,
      kandidaten_nach_harten_ausschluessen: afterHard,
      ergebnis_anzahl: resultItems.length,
      mindestscore: MIN_SCORE[categoryKey],
      kategorie_limit: CATEGORY_MAX[categoryKey],
      top_20: rows.slice(0, 20),
    });
  }

  function logTrackedProductsDebug(products, answers) {
    if (!DEBUG) return;

    var seenCategorySample = { koerperpflege: false, hautpflege: false };

    TRACKED_PRODUCT_PATTERNS.forEach(function (track) {
      var matches = [];

      products.forEach(function (p) {
        if (track.category) {
          if (!productHasCategory(p, track.category)) return;
          if (track.first && seenCategorySample[track.category]) return;
          matches.push(p);
          if (track.first) seenCategorySample[track.category] = true;
        } else if (track.re.test(p.title || '')) {
          matches.push(p);
        }
      });

      if (!matches.length) {
        console.warn('[PflegeFinder] Debug: ' + track.label + ' nicht gefunden.');
        return;
      }

      matches.forEach(function (p) {
        var catKey = track.category || 'inkontinenzversorgung';
        if (!track.category && productHasCategory(p, 'inkontinenzversorgung')) {
          catKey = 'inkontinenzversorgung';
        } else if (!track.category && productHasCategory(p, 'hautpflege')) {
          catKey = 'hautpflege';
        } else if (!track.category && productHasCategory(p, 'koerperpflege')) {
          catKey = 'koerperpflege';
        }

        var row = productDebugRow(p, catKey, answers);
        console.log('[PflegeFinder] Debug ' + track.label + ':', {
          kategorie_key: catKey,
          aktiv: isActiveProduct(p),
          kategorie_relevant: isCategoryRelevant(catKey, answers),
          score: row.score,
          prioritaet: row.prioritaet,
          score_gruende: row.score_gruende,
          ausschlussgrund: row.ausschlussgrund,
          metafelder: {
            ergebnis_kategorie: p.finder && p.finder.ergebnis_kategorie,
            menge_urinverlust: p.finder && p.finder.menge_urinverlust,
            mobilitaet: p.finder && p.finder.mobilitaet,
            inkontinenz_art: p.finder && p.finder.inkontinenz_art,
            geschlecht: p.finder && p.finder.geschlecht,
            anwendung: p.finder && p.finder.anwendung,
            hautzustand: p.finder && p.finder.hautzustand,
            pflegeort: p.finder && p.finder.pflegeort,
            prioritaet: p.finder && p.finder.prioritaet,
          },
          wuerde_in_kategorie_erscheinen:
            isActiveProduct(p) &&
            productHasCategory(p, catKey) &&
            isCategoryRelevant(catKey, answers) &&
            !row.ausschlussgrund,
        });
      });
    });
  }

  function simulateTestCase(name, answers, products) {
    if (!DEBUG) return;
    var normalized = normalizeAnswers(answers);
    console.group('[PflegeFinder] Testfall: ' + name);
    logAnswersDebug(normalized);
    var groups = buildResultGroups(products, normalized);
    console.log(
      '[PflegeFinder] Ergebnis-Kategorien:',
      groups.map(function (g) {
        return {
          id: g.id,
          anzahl: g.items.length,
          produkte: g.items.map(function (p) {
            return p.title;
          }),
        };
      })
    );
    console.groupEnd();
  }

  /* -------------------------------------------------------- *
   * Ergebnisgruppen
   * -------------------------------------------------------- */

  function buildResultGroups(products, answers) {
    var normalized = normalizeAnswers(answers);

    logProductLoadStats(products);
    logAnswersDebug(normalized);

    var relevant = getRelevantCategories(normalized);
    var groups = [];

    relevant.forEach(function (cat) {
      var items = getRecommendedProductsForCategory(cat.id, products, normalized);
      logCategoryDebug(cat.id, normalized, products, items);

      if (!items.length) return;

      var parts = partitionItemsByTier(items);

      groups.push({
        id: cat.id,
        title: cat.title,
        notice: cat.notice ? cat.notice(normalized) : null,
        items: parts.items,
        topItems: parts.topItems,
        moreItems: parts.moreItems,
      });
    });

    logTrackedProductsDebug(products, normalized);

    return groups;
  }

  function getPflegegradBlock(answers, urls) {
    var a = normalizeAnswers(answers);
    if (a.pflegegrad !== 'ja') return null;

    return {
      title: PFLEGEGRAD_BLOCK.title,
      lead: PFLEGEGRAD_BLOCK.lead,
      text: PFLEGEGRAD_BLOCK.text,
      ctaPrimary: PFLEGEGRAD_BLOCK.ctaPrimary,
      ctaSecondary: PFLEGEGRAD_BLOCK.ctaSecondary,
      pflegeboxUrl: (urls && urls.pflegeboxUrl) || '/products/pflegebox',
      infoUrl: (urls && urls.infoUrl) || '/pages/pflegehilfsmittel',
    };
  }

  function shouldShowPflegegradBlock(answers) {
    return normalizeAnswers(answers).pflegegrad === 'ja';
  }

  function saveAnswers(answers) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalizeAnswers(answers)));
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
          { value: 'ausserhalb_bett', label: 'Außerhalb des Bettes' },
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
        ],
      },
      {
        id: 'geschlecht',
        title: 'Für wen sollen die Inkontinenzprodukte geeignet sein?',
        condition: function (a) {
          return a.inkontinenz === 'ja';
        },
        options: [
          { value: 'weiblich', label: 'Weiblich' },
          { value: 'maennlich', label: 'Männlich' },
        ],
      },
      {
        id: 'menge_urin',
        title: 'Wie viel Urin geht ungefähr verloren?',
        condition: function (a) {
          return a.inkontinenz === 'ja';
        },
        options: [
          { value: 'wenig', label: 'Wenig – einige Tropfen bis ca. ½ Glas' },
          { value: 'mittel', label: 'Mittel – etwa ½ bis 1 Glas' },
          { value: 'viel', label: 'Viel – etwa 1 bis 1½ Gläser' },
          { value: 'sehr_viel', label: 'Sehr viel – mehr als 1½ Gläser oder läuft häufig aus' },
        ],
      },
      {
        id: 'inkontinenz_einsatz',
        title: 'Wann werden die Produkte hauptsächlich benötigt?',
        condition: function (a) {
          return a.inkontinenz === 'ja';
        },
        options: [
          { value: 'unterwegs_tag', label: 'Unterwegs / tagsüber' },
          { value: 'nacht', label: 'Nachts' },
          { value: 'bett', label: 'Überwiegend im Bett' },
        ],
      },
      {
        id: 'stuhlinkontinenz',
        title: 'Liegt Stuhlinkontinenz vor?',
        condition: function (a) {
          return a.inkontinenz === 'ja';
        },
        options: [
          { value: 'ja', label: 'Ja' },
          { value: 'nein', label: 'Nein' },
        ],
      },
      {
        id: 'hautzustand',
        title: 'Wie ist die Haut?',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'trocken', label: 'Trocken' },
          { value: 'sehr_trocken_gereizt', label: 'Sehr trocken oder gereizt' },
        ],
      },
      {
        id: 'kleine_wunden',
        title: 'Sind kleine offene Wunden vorhanden?',
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
    MIN_SCORE: MIN_SCORE,
    CATEGORY_MAX: CATEGORY_MAX,
    INKONTINENZ_TOP_BADGE_COUNT: INKONTINENZ_TOP_BADGE_COUNT,
    applyCategoryDisplayRules: applyCategoryDisplayRules,
    normalizeValue: normalizeValue,
    normalizeAnswers: normalizeAnswers,
    parseMetafieldList: parseMetafieldList,
    isActiveProduct: isActiveProduct,
    isActive: isActiveProduct,
    productHasCategory: productHasCategory,
    getPriority: getPriority,
    isCategoryRelevant: isCategoryRelevant,
    getRelevantCategories: getRelevantCategories,
    getHardExclusionReason: getHardExclusionReason,
    scoreProductForCategory: scoreProductForCategory,
    getRecommendedProductsForCategory: getRecommendedProductsForCategory,
    buildFlow: buildFlow,
    buildResultGroups: buildResultGroups,
    getPflegegradBlock: getPflegegradBlock,
    shouldShowPflegegradBlock: shouldShowPflegegradBlock,
    simulateTestCase: simulateTestCase,
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
