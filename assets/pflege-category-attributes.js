/**
 * PflegeShop — Produktattribute für Kategorie-Filter ableiten.
 * Kapselt Mapping aus Titel, Tags, Vendor, Typ und Varianten — nicht im UI verteilen.
 */
(function (global) {
  'use strict';

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .trim();
  }

  function buildHaystack(product) {
    return normalizeText(
      [
        product.title,
        product.vendor,
        product.type,
        product.subtitle,
        (product.tags || []).join(' '),
        (product.optionValues || []).join(' '),
      ].join(' ')
    );
  }

  function haystackIncludesFilterValue(product, filterValue) {
    if (!filterValue) return false;
    var hay = buildHaystack(product);
    var needle = normalizeText(filterValue);
    if (!needle) return false;
    if (hay.indexOf(needle) !== -1) return true;
    var compactHay = hay.replace(/-/g, '');
    var compactNeedle = needle.replace(/-/g, '');
    return compactNeedle.length > 0 && compactHay.indexOf(compactNeedle) !== -1;
  }

  function includesAny(hay, needles) {
    return needles.some(function (needle) {
      return hay.indexOf(normalizeText(needle)) !== -1;
    });
  }

  function includesWord(hay, needles) {
    return needles.some(function (needle) {
      var word = normalizeText(needle);
      if (!word) return false;
      var escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('(?:^|[\\s\\-/_,.;(+]|)' + escaped + '(?:$|[\\s\\-/_,.;)+]|)').test(hay);
    });
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function extractSizes(hay, optionValues) {
    var sizes = [];
    var sources = [hay].concat(optionValues || []).map(normalizeText);

    sources.forEach(function (source) {
      var mlMatch = source.match(/(\d{2,4})\s*ml\b/);
      if (mlMatch) sizes.push(mlMatch[1] + ' ml');

      var gMatch = source.match(/(\d{2,4})\s*g\b/);
      if (gMatch) sizes.push(gMatch[1] + ' g');

      var literMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter)\b/);
      if (literMatch) {
        var liters = literMatch[1].replace(',', '.');
        if (parseFloat(liters) >= 1) sizes.push(liters.replace('.0', '') + ' Liter');
      }

      var pieceMatch = source.match(/(\d{2,4})\s*(?:stueck|stück|stk|tücher|tuecher|tuch)\b/);
      if (pieceMatch) sizes.push(pieceMatch[1] + ' Stück');
    });

    return unique(sizes);
  }

  function normalizeBrand(vendor) {
    var v = normalizeText(vendor);
    if (!v) return '';
    if (v.indexOf('meditrade') !== -1) return 'meditrade';
    if (v.indexOf('seni') !== -1) return 'seni';
    if (v.indexOf('molicare') !== -1 || v.indexOf('molcare') !== -1) return 'molicare';
    if (v.indexOf('tena') !== -1) return 'tena';
    if (v === 'id' || v.indexOf('id-') === 0 || v.indexOf(' id ') !== -1) return 'id';
    if (v.indexOf('alcoman') !== -1) return 'alcoman';
    if (v.indexOf('ethasept') !== -1) return 'ethasept';
    if (v.indexOf('medizid') !== -1) return 'medizid';
    if (v.indexOf('sensiderm') !== -1) return 'sensiderm';
    if (v.indexOf('tiga') !== -1) return 'tiga';
    if (v.indexOf('sebamed') !== -1) return 'sebamed';
    if (v.indexOf('linola') !== -1) return 'linola';
    if (v.indexOf('excipial') !== -1) return 'excipial';
    if (v.indexOf('bepanthen') !== -1) return 'bepanthen';
    if (v.indexOf('eucerin') !== -1) return 'eucerin';
    if (v.indexOf('doppelherz') !== -1) return 'doppelherz';
    if (v.indexOf('beesana') !== -1) return 'beesana';
    if (v.indexOf('hartmann') !== -1) return 'hartmann';
    if (v.indexOf('gazofix') !== -1) return 'gazofix';
    if (v.indexOf('octenisan') !== -1) return 'octenisan';
    if (v.indexOf('merci') !== -1) return 'merci';
    return v.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function isVerbrauchsartikelCategory(slug) {
    return normalizeText(slug) === 'verbrauchsartikel';
  }

  function isKoerperpflegeCategory(slug) {
    var s = normalizeText(slug);
    return s === 'koerperpflege' || s === 'korperpflege';
  }

  function isSchutzHandschuheCategory(slug) {
    var s = normalizeText(slug);
    return s === 'schutz-handschuhe' || s === 'schutz-und-handschuhe' || s === 'handschuhe';
  }

  function isHautpflegeCategory(slug) {
    var s = normalizeText(slug);
    return s === 'hautpflege' || s === 'hautschutz-hautpflege' || s === 'hauschutz-hautpflege';
  }

  function isInkontinenzCategory(slug) {
    var s = normalizeText(slug);
    return s === 'inkontinenzversorgung' || s === 'inkontinenz';
  }

  function mlToAbsorbencyLevel(ml) {
    if (ml <= 0 || !isFinite(ml)) return '';
    if (ml <= 500) return 'leicht';
    if (ml <= 1000) return 'mittel';
    if (ml <= 1800) return 'stark';
    return 'extra-stark';
  }

  function extractAbsorbencyLevels(hay, optionValues) {
    var levels = [];
    var sources = [hay].concat(optionValues || []).map(normalizeText);

    sources.forEach(function (source) {
      var mlMatches = source.match(/(\d+(?:[.,]\d+)?)\s*ml/g);
      if (mlMatches) {
        mlMatches.forEach(function (match) {
          var ml = parseFloat(match.replace(/ml/g, '').replace(',', '.').trim());
          var level = mlToAbsorbencyLevel(ml);
          if (level) levels.push(level);
        });
      }
    });

    if (includesAny(hay, ['sehr stark', 'sehr_stark', 'extra stark', 'extra-stark', 'maxi', 'ultimate', 'premium super'])) {
      levels.push('extra-stark');
    } else if (includesAny(hay, ['super', 'stark', 'heavy', 'plus', 'extra plus'])) {
      levels.push('stark');
    }
    if (includesAny(hay, ['mittel', 'medium', 'regular', 'normal'])) {
      levels.push('mittel');
    }
    if (includesAny(hay, ['mini', 'leicht', 'light', 'tropfen', 'extra mini', 'small'])) {
      levels.push('leicht');
    }

    return unique(levels);
  }

  function extractClothingSizes(hay, optionValues) {
    var sizes = [];
    var sources = [hay].concat(optionValues || []).map(normalizeText);
    var order = { xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6 };

    sources.forEach(function (source) {
      var re = /\b(2xl|3xl|xxl|xl|xs|[sml])\b/g;
      var match;
      while ((match = re.exec(source)) !== null) {
        var token = match[1];
        if (token === '2xl' || token === '3xl') token = 'xxl';
        sizes.push(token);
      }
    });

    return unique(sizes).sort(function (a, b) {
      return (order[a] || 99) - (order[b] || 99);
    });
  }

  function extractGenders(hay) {
    var genders = [];
    if (includesAny(hay, ['damen', 'frau', 'weiblich', 'female', 'lady', 'women', 'for her'])) {
      genders.push('damen');
    }
    if (includesAny(hay, ['herren', 'mann', 'maennlich', 'male', 'men', 'for him'])) {
      genders.push('herren');
    }
    if (includesAny(hay, ['unisex', 'neutral', 'alle', 'universal'])) {
      genders.push('unisex');
    }
    if (!genders.length && includesAny(hay, ['seni active', 'seni san', 'seni soft'])) {
      genders.push('unisex');
    }
    return unique(genders);
  }

  function deriveDesinfektionAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var applicationAreas = [];
    var forms = [];
    var properties = [];

    if (
      includesAny(hay, [
        'haendedesinfektion',
        'handdesinfektion',
        'hand desinfektion',
        'handdesinf',
        'alcoman',
        'ethasept',
        'seni care hand',
      ])
    ) {
      productTypes.push('haendedesinfektion');
      applicationAreas.push('hand');
    }

    if (
      includesAny(hay, [
        'flaechendesinfektion',
        'flächendesinfektion',
        'flaechen desinfektion',
        'flächen desinfektion',
        'oberflaechen',
        'oberflächen',
        'medizid',
        'rapid+',
        'rapid plus',
      ])
    ) {
      productTypes.push('flaechendesinfektion');
      applicationAreas.push('surface');
    }

    if (includesAny(hay, ['koerperdesinfektion', 'körperdesinfektion', 'körper desinfektion'])) {
      productTypes.push('koerperdesinfektion');
      applicationAreas.push('body');
    }

    if (includesAny(hay, ['desinfektionstuch', 'desinfektionstücher', 'desinfektionstuecher', 'tücher', 'tuecher'])) {
      productTypes.push('desinfektionstuecher');
      forms.push('tuecher');
    }

    if (includesAny(hay, ['desinfektionsgel', ' desinfektions gel', ' handgel', ' gel ']) || /\bgel\b/.test(hay)) {
      if (hay.indexOf('gel') !== -1) {
        productTypes.push('desinfektionsgel');
        forms.push('gel');
      }
    }

    if (includesAny(hay, ['spray', 'sprueh', 'sprüh'])) {
      productTypes.push('spray');
      forms.push('spray');
    }

    if (includesAny(hay, ['kanister', 'nachfuell', 'nachfüll', 'gebinde', '5 liter', '5 l'])) {
      productTypes.push('kanister');
      forms.push('kanister');
    }

    if (includesAny(hay, ['fluessigkeit', 'flüssigkeit', 'loesung', 'lösung', ' fluessig', ' flüssig'])) {
      forms.push('fluessigkeit');
    }

    if (applicationAreas.indexOf('hand') === -1 && hay.indexOf('hand') !== -1 && hay.indexOf('desinfekt') !== -1) {
      applicationAreas.push('hand');
    }
    if (applicationAreas.indexOf('surface') === -1 && includesAny(hay, ['flaeche', 'fläche', 'oberflaeche', 'oberfläche'])) {
      applicationAreas.push('surface');
    }
    if (applicationAreas.indexOf('body') === -1 && hay.indexOf('koerper') !== -1) {
      applicationAreas.push('body');
    }
    if (includesAny(hay, ['medizinprodukt', 'medizinprodukte', 'med', 'desinfektionsmittel'])) {
      applicationAreas.push('medizinprodukte');
    }
    if (includesAny(hay, ['haushalt', 'pflege', 'alltag'])) {
      applicationAreas.push('haushalt-pflege');
    }

    if (includesAny(hay, ['vah'])) properties.push('vah-gelistet');
    if (includesAny(hay, ['parfuemfrei', 'parfümfrei', 'unparfuemiert', 'unparfümiert'])) properties.push('parfuemfrei');
    if (includesAny(hay, ['gebrauchsfertig', 'ready to use', 'sofort einsatzbereit'])) properties.push('gebrauchsfertig');
    if (includesAny(hay, ['viruzid'])) properties.push('viruzid');
    if (includesAny(hay, ['bakterizid'])) properties.push('bakterizid');
    if (includesAny(hay, ['alkoholfrei'])) properties.push('alkoholfrei');
    if (includesAny(hay, ['medizinprodukt', 'medizinprodukte'])) properties.push('medizinprodukte-geeignet');

    if (!productTypes.length && hay.indexOf('desinfekt') !== -1) {
      productTypes.push('desinfektionsprodukt');
    }

    return {
      categorySlug: product.categorySlug || 'desinfektion',
      productTypes: unique(productTypes),
      applicationAreas: unique(applicationAreas),
      forms: unique(forms),
      skinConditions: [],
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveHautpflegeAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var skinConditions = [];
    var applicationAreas = [];
    var forms = [];
    var properties = [];

    if (
      includesAny(hay, [
        'koerpercreme',
        'pflegecreme',
        'hautcreme',
        'barriercreme',
        'schutzcreme',
        ' body cream',
        'creme',
      ])
    ) {
      productTypes.push('creme');
      forms.push('creme');
    }

    if (includesAny(hay, ['koerperlotion', 'pflegelotion', 'hautlotion', ' body lotion', 'lotion'])) {
      productTypes.push('lotion');
      forms.push('lotion');
    }

    if (includesAny(hay, ['pflegegel', 'koerpergel', 'hautgel', ' waschgel', 'waschgel', ' duschgel', 'duschgel'])) {
      productTypes.push('gel');
      forms.push('gel');
    }

    if (includesAny(hay, ['pflegeoel', 'koerperoel', 'hautoel', ' body oil', 'oel', 'öl'])) {
      productTypes.push('oel');
      forms.push('oel');
    }

    if (includesAny(hay, ['salbe', 'paste', 'zinkpaste', 'zink paste', 'zinksalbe', 'wundsalbe', 'wundpaste'])) {
      productTypes.push('salbe-paste');
      forms.push('salbe');
    }

    if (
      includesAny(hay, [
        'waschlotion',
        'waschemulsion',
        'waschemulsion',
        'waschmilch',
        'reinigungs',
        'wasch',
        'shampoo',
        'dusch',
      ])
    ) {
      productTypes.push('wasch-reinigung');
      forms.push('waschprodukt');
    }

    if (includesAny(hay, ['hautschutz', 'barrier', 'barriere', 'schutzfilm', 'schutzpflege', 'schutzcreme'])) {
      productTypes.push('hautschutz');
      skinConditions.push('hautschutz');
    }

    if (
      includesAny(hay, [
        'feuchttuch',
        'feuchttuecher',
        'pflegetuch',
        'pflegetuecher',
        'waschtuch',
        'waschtuecher',
        'all in one',
        'all-in-one',
      ])
    ) {
      productTypes.push('feuchttuecher');
      forms.push('tuecher');
    }

    if (includesAny(hay, ['schaum', 'mousse', 'foam'])) {
      productTypes.push('schaum');
      forms.push('schaum');
    }

    if (includesAny(hay, ['spray', 'sprueh', 'sprüh', 'koerperspray'])) {
      productTypes.push('spray');
      forms.push('spray');
    }

    if (includesAny(hay, ['normal', 'normale haut', 'normal skin'])) {
      skinConditions.push('normal');
    }
    if (includesAny(hay, ['trocken', 'trockene haut', 'dry skin', 'sehr trocken'])) {
      skinConditions.push('trocken');
    }
    if (includesAny(hay, ['gereizt', 'irritiert', 'empfindlich gereizt', 'sehr_trocken', 'sehr trocken gereizt'])) {
      skinConditions.push('sehr_trocken_gereizt');
    }
    if (includesAny(hay, ['sensitiv', 'sensitive', 'empfindlich', 'mild', 'sanft'])) {
      skinConditions.push('sensitiv');
    }

    if (includesAny(hay, ['koerper', 'körper', 'allover', 'all over', 'koerperpflege', 'ganzer koerper'])) {
      applicationAreas.push('koerper');
    }
    if (includesAny(hay, ['gesicht', 'face', 'antlitz'])) {
      applicationAreas.push('gesicht');
    }
    if (includesAny(hay, ['hand', 'haende', 'hände', 'handpflege'])) {
      applicationAreas.push('haende');
    }
    if (
      includesAny(hay, [
        'fusscreme',
        'fußcreme',
        'fusspflege',
        'fußpflege',
        'fussgel',
        'fußgel',
        'fussspray',
        'fußspray',
        'fuss-pflege',
        'fuss pflege',
      ]) ||
      includesWord(hay, ['fuss', 'fuß', 'fuesse', 'füße', 'fusscreme', 'fußcreme'])
    ) {
      applicationAreas.push('fuss-pflege');
    }
    if (includesAny(hay, ['intim', 'perineal', 'perinealbereich', 'damenbereich'])) {
      applicationAreas.push('intimbereich');
    }
    if (includesAny(hay, ['wund', 'wundpflege', 'wundversorgung', 'wundschutz', 'zink', 'dekubitus'])) {
      applicationAreas.push('wund-schutz');
    }
    if (includesAny(hay, ['inkontinenz', 'inko', 'menge urin', 'urin', 'stuhl'])) {
      applicationAreas.push('inkontinenz');
    }
    if (includesAny(hay, ['bett', 'bettpflege', 'liege', 'liegepflege'])) {
      applicationAreas.push('bett');
    }

    if (includesAny(hay, ['parfuemfrei', 'parfümfrei', 'unparfuemiert', 'unparfümiert', 'ohne parfum', 'ohne duft'])) {
      properties.push('parfuemfrei');
    }
    if (includesAny(hay, ['ph-hautneutral', 'ph hautneutral', 'hautneutral', 'ph neutral'])) {
      properties.push('ph-hautneutral');
    }
    if (includesAny(hay, ['hypoallergen', 'hypoallerg'])) {
      properties.push('hypoallergen');
    }
    if (
      includesAny(hay, ['parfum', 'duft', 'fragrance', 'parfümiert']) &&
      !includesAny(hay, ['parfuemfrei', 'unparfuemiert', 'ohne parfum', 'ohne duft'])
    ) {
      properties.push('mit-duft');
    }
    if (includesAny(hay, ['dermatologisch', 'dermatolog', 'dermatologisch getestet'])) {
      properties.push('dermatologisch-getestet');
    }
    if (includesAny(hay, ['sehr trocken', 'extrem trocken', 'trockene haut'])) {
      properties.push('sehr-trockene-haut');
    }
    if (includesAny(hay, ['hautschutzfilm', 'barrier', 'barriere', 'schutzfilm', 'schutzcreme'])) {
      properties.push('hautschutzfilm');
    }
    if (includesAny(hay, ['lanolin', 'lanolinfrei'])) {
      properties.push('lanolin');
    }
    if (includesAny(hay, ['vegan', 'pflanzlich'])) {
      properties.push('vegan');
    }

    if (!productTypes.length) {
      if (includesAny(hay, ['hautpflege', 'haut schutz', 'pflege', 'skin care'])) {
        productTypes.push('hautpflege-allgemein');
      }
    }

    return {
      categorySlug: product.categorySlug || 'hautpflege',
      productTypes: unique(productTypes),
      skinConditions: unique(skinConditions),
      applicationAreas: unique(applicationAreas),
      forms: unique(forms),
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveInkontinenzAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var absorbency = [];
    var clothingSizes = [];
    var genders = [];
    var properties = [];

    if (
      includesAny(hay, [
        'inkontinenzslip',
        'inkontinenz slip',
        'incontinence slip',
        ' all in one slip',
        ' seni active',
        ' active classic',
        ' active super',
      ]) ||
      (includesWord(hay, ['slip']) && !includesAny(hay, ['bettschutz', 'einlage', 'vorlage']))
    ) {
      productTypes.push('inkontinenzslips');
    }

    if (
      includesAny(hay, [
        'inkontinenzpants',
        'inkontinenz pants',
        'incontinence pants',
        'pull-up',
        'pull up',
        'pullup',
        ' pant ',
        ' pants',
        ' unterhose',
        ' fix pants',
      ])
    ) {
      productTypes.push('inkontinenzpants');
    }

    if (
      !includesAny(hay, ['bettschutz', 'krankenunterlage', 'bettunterlage', 'bettunterlage']) &&
      (includesWord(hay, ['einlage', 'einlagen']) ||
        includesAny(hay, [' seni soft', ' seni super', ' seni normal', 'insert pad', 'insert']))
    ) {
      productTypes.push('einlagen');
    }

    if (includesWord(hay, ['vorlage', 'vorlagen']) || includesAny(hay, ['anatomisch', ' shaped pad'])) {
      productTypes.push('vorlagen');
    }

    if (
      includesAny(hay, [
        'bettschutz',
        'bettschutzeinlage',
        'krankenunterlage',
        'bettunterlage',
        'bettauflage',
        'unterlage waschbar',
      ])
    ) {
      productTypes.push('bettschutzeinlagen');
    }

    absorbency = extractAbsorbencyLevels(hay, product.optionValues);
    clothingSizes = extractClothingSizes(hay, product.optionValues);
    genders = extractGenders(hay);

    if (includesAny(hay, ['rezept', 'rezeptfaehig', 'rezeptfähig', 'prescription', 'hilfsmittel'])) {
      properties.push('rezeptfaehig');
    }
    if (includesAny(hay, ['beliebt', 'bestseller', 'top seller', 'empfohlen'])) {
      properties.push('beliebt');
    }
    if (includesAny(hay, ['atmungsaktiv', 'atmungsaktive', 'breathable', ' breathable'])) {
      properties.push('atmungsaktiv');
    }
    if (includesAny(hay, ['diskret', 'discreet', 'unauffaellig', 'unauffällig'])) {
      properties.push('diskret');
    }

    if (!productTypes.length && includesAny(hay, ['inkontinenz', 'inko', 'incontinence'])) {
      productTypes.push('inkontinenzprodukt');
    }

    return {
      categorySlug: product.categorySlug || 'inkontinenzversorgung',
      productTypes: unique(productTypes),
      absorbency: unique(absorbency),
      clothingSizes: unique(clothingSizes),
      genders: unique(genders),
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveVerbrauchsartikelAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var applicationAreas = [];
    var materials = [];
    var absorbency = [];
    var formats = [];
    var packUnits = [];
    var properties = [];

    if (
      includesAny(hay, [
        'bettschutz',
        'bettschutzeinlage',
        'krankenunterlage',
        'bettunterlage',
        'bettauflage',
        'comcell',
      ])
    ) {
      productTypes.push('bettschutzeinlagen');
      applicationAreas.push('bett');
    }

    if (includesAny(hay, ['schutzschuerze', 'schürze', 'schuerze', 'kittel', 'schutzkittel', 'latzschuerze'])) {
      productTypes.push('schutzschuerzen');
      applicationAreas.push('hygiene');
    }

    if (
      includesAny(hay, [
        'mundschutz',
        'ffp2',
        'ffp3',
        'atemschutz',
        'op-maske',
        'op maske',
        'maske',
        'masken',
      ])
    ) {
      productTypes.push('mundschutz-masken');
      applicationAreas.push('hygiene');
    }

    if (
      includesAny(hay, [
        'abfallbeutel',
        'muellbeutel',
        'müllbeutel',
        'entsorgung',
        'medizinische abfall',
        'abfall',
        'sweep',
      ])
    ) {
      productTypes.push('abfall-entsorgung');
    }

    if (
      includesAny(hay, [
        'tissue',
        'taschentuch',
        'papierhandtuch',
        'putztuch',
        'handtuch',
        'tuch',
        'tuecher',
        'tücher',
      ])
    ) {
      productTypes.push('tuecher-papier');
    }

    if (includesAny(hay, ['unterleger', 'saugeinlage', 'saug einlage', 'sauger', 'saugmatte'])) {
      productTypes.push('unterleger-einlagen');
      applicationAreas.push('bett');
    }

    if (
      includesAny(hay, [
        'toilettenpapier',
        'feuchttuch',
        'feuchttuecher',
        'wc ',
        'toilette',
        'urinal',
        'toilettensitz',
      ])
    ) {
      productTypes.push('wc-hygiene');
      applicationAreas.push('hygiene');
    }

    if (includesAny(hay, ['vlies', 'non-woven', 'nonwoven', 'vliesstoff'])) {
      materials.push('vlies');
    }
    if (includesAny(hay, ['polyethylen', ' pe ', 'kunststoff', 'plastic', 'polypropylen', ' pp '])) {
      materials.push('kunststoff');
    }
    if (includesAny(hay, ['papier', 'zellstoff', 'cellulose', 'tissue'])) {
      materials.push('papier');
    }
    if (includesAny(hay, ['latex']) && !includesAny(hay, ['latexfrei', 'latex frei', 'latex-free'])) {
      materials.push('latex');
    }
    if (includesAny(hay, ['nitril', 'nitrile'])) {
      materials.push('nitril');
    }

    if (includesAny(hay, ['sehr stark', 'extra stark', 'extra-stark', 'maxi', 'super saug'])) {
      absorbency.push('extra-stark');
    } else if (includesAny(hay, ['stark', 'heavy', 'plus', 'hoch saug'])) {
      absorbency.push('stark');
    }
    if (includesAny(hay, ['mittel', 'medium', 'normal', 'regular'])) {
      absorbency.push('mittel');
    }
    if (includesAny(hay, ['leicht', 'light', 'mini', 'tropfen'])) {
      absorbency.push('leicht');
    }

    if (includesAny(hay, ['fluessigkeitsdicht', 'flüssigkeitsdicht', 'wasserdicht', 'pe folie', 'rückseite folie'])) {
      formats.push('fluessigkeitsdicht');
    }
    if (includesAny(hay, ['flach', 'flat', 'liegeformat'])) {
      formats.push('flach');
    }
    if (includesAny(hay, ['mehrlagig', '3-lagig', '4-lagig', '5-lagig', 'multi layer'])) {
      formats.push('mehrlagig');
    }
    if (includesAny(hay, ['anatomisch', 'anatom', 'geformt', 'shaped'])) {
      formats.push('anatomisch');
    }
    if (includesAny(hay, ['selbstklebend', 'klebestreifen', 'fixier', 'haftend'])) {
      formats.push('selbstklebend');
    }

    if (includesAny(hay, ['100 st', '100er', '120 st', '150 st', '200 st', '250 st'])) {
      packUnits.push('pack-100');
    } else if (includesAny(hay, ['50 st', '50er', '60 st', '75 st'])) {
      packUnits.push('pack-50');
    } else if (includesAny(hay, ['25 st', '25er', '30 st', '30er', '20 st', '20er'])) {
      packUnits.push('pack-25');
    }
    if (includesAny(hay, ['rolle', 'roll', 'perforiert'])) {
      packUnits.push('rolle');
    }
    if (includesAny(hay, ['karton', 'gebinde', 'bulk', 'spende'])) {
      packUnits.push('karton');
    }
    if (includesAny(hay, ['einzel', 'single', '1 st', '1er'])) {
      packUnits.push('einzelpack');
    }

    if (includesAny(hay, ['einmal', 'disposable', 'single use', 'einsatz', 'verbrauch'])) {
      properties.push('einweg');
    }
    if (includesAny(hay, ['latexfrei', 'latex frei', 'latex-free'])) {
      properties.push('latexfrei');
    }
    if (includesAny(hay, ['steril', 'sterile'])) {
      properties.push('steril');
    }
    if (includesAny(hay, ['pflegebox', 'pflegehilfsmittel', '42 euro', '42€', 'hilfsmittel'])) {
      properties.push('pflegebox');
    }
    if (includesAny(hay, ['saugfaehig', 'saugfähig', 'saugstark', 'hoch saugfaehig', 'hoch saugfähig'])) {
      properties.push('saugfaehig');
    }

    if (includesAny(hay, ['bett', 'bettpflege', 'liege'])) {
      applicationAreas.push('bett');
    }
    if (includesAny(hay, ['praxis', 'klinik', 'medizin'])) {
      applicationAreas.push('praxis');
    }
    if (includesAny(hay, ['haushalt', 'alltag', 'pflege'])) {
      applicationAreas.push('alltag');
    }
    if (includesAny(hay, ['inkontinenz', 'inko', 'urin', 'stuhl'])) {
      applicationAreas.push('inkontinenz');
    }

    if (!productTypes.length && includesAny(hay, ['verbrauch', 'einweg', 'hygiene'])) {
      productTypes.push('verbrauchsartikel');
    }

    return {
      categorySlug: product.categorySlug || 'verbrauchsartikel',
      productTypes: unique(productTypes),
      applicationAreas: unique(applicationAreas),
      materials: unique(materials),
      absorbency: unique(absorbency),
      formats: unique(formats),
      packUnits: unique(packUnits),
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveKoerperpflegeAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var applicationAreas = [];
    var properties = [];

    if (
      includesAny(hay, [
        'waschhandschuh',
        'waschlappen',
        'waschutensil',
        'waschhandschuhe',
        'einmalwasch',
        'waschtuch',
        'waschtuecher',
      ])
    ) {
      productTypes.push('waschutensilien');
      applicationAreas.push('bett');
      applicationAreas.push('koerper');
    }

    if (includesAny(hay, ['shampoo', 'haarpflege', 'haarshampoo', 'conditioner', 'haarwasch'])) {
      productTypes.push('shampoo-haare');
      applicationAreas.push('haare');
    }

    if (includesAny(hay, ['duschgel', 'dusch', 'badezusatz', 'pflegebad', 'badepflege', 'waschbad', 'bad'])) {
      productTypes.push('dusch-bade');
      applicationAreas.push('bad');
    }

    if (
      includesAny(hay, [
        'zahnpasta',
        'zahnpflege',
        'zahnbuerste',
        'zahnbürste',
        'mundpflege',
        'mouth care',
        'mundwasser',
      ])
    ) {
      productTypes.push('zahn-mund');
      applicationAreas.push('mund');
    }

    if (includesAny(hay, ['deodorant', 'deo ', 'antitranspirant'])) {
      productTypes.push('deodorant');
      applicationAreas.push('koerper');
    }

    if (includesAny(hay, ['rasur', 'rasier', 'shaving'])) {
      productTypes.push('rasur');
      applicationAreas.push('koerper');
    }

    if (includesAny(hay, ['parfuemfrei', 'parfümfrei', 'unparfuemiert', 'ohne parfum'])) {
      properties.push('parfuemfrei');
    }
    if (includesAny(hay, ['hautfreundlich', 'sanft', 'mild', 'sensitiv', 'hautneutral'])) {
      properties.push('hautfreundlich');
    }
    if (includesAny(hay, ['alkoholfrei', 'ohne alkohol'])) {
      properties.push('alkoholfrei');
    }

    if (includesAny(hay, ['bett', 'bettpflege', 'liege'])) {
      applicationAreas.push('bett');
    }
    if (includesAny(hay, ['hand', 'haende', 'hände'])) {
      applicationAreas.push('haende');
    }

    if (!productTypes.length && includesAny(hay, ['koerperpflege', 'koerper', 'pflege', 'hygiene'])) {
      productTypes.push('koerperpflege-allgemein');
    }

    return {
      categorySlug: product.categorySlug || 'koerperpflege',
      productTypes: unique(productTypes),
      applicationAreas: unique(applicationAreas),
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveSchutzHandschuheAttributes(product) {
    var hay = buildHaystack(product);
    var productTypes = [];
    var materials = [];
    var clothingSizes = [];
    var applicationAreas = [];
    var protectionClasses = [];
    var packUnits = [];
    var properties = [];

    if (includesAny(hay, ['handschuh', 'handschuhe', 'untersuchungshandschuh', 'einmalhandschuh'])) {
      productTypes.push('einmalhandschuhe');
      if (includesAny(hay, ['untersuchung', 'untersuchungshandschuh', 'medical exam'])) {
        protectionClasses.push('untersuchung');
      }
    }

    if (includesAny(hay, ['ffp2', 'ffp3', 'mundschutz', 'atemschutz', 'op-maske', 'maske', 'masken'])) {
      productTypes.push('schutzmasken');
    }
    if (includesAny(hay, ['ffp2'])) protectionClasses.push('ffp2');
    if (includesAny(hay, ['ffp3'])) protectionClasses.push('ffp3');
    if (includesAny(hay, ['op-maske', 'op maske', 'typ ii', 'typ 2', 'medizinische maske'])) {
      protectionClasses.push('op-maske');
    }

    if (includesAny(hay, ['schutzbrille', 'visier', 'face shield', 'brille'])) {
      productTypes.push('schutzbrillen');
    }

    if (includesAny(hay, ['schutzschuerze', 'schürze', 'schuerze', 'kittel', 'schutzkittel'])) {
      productTypes.push('schutzschuerzen');
    }

    if (includesAny(hay, ['ueberschuh', 'überschuh', 'galosh', 'schuhueberzieher', 'schuhüberzieher'])) {
      productTypes.push('ueberschuhe');
    }

    if (includesAny(hay, ['schutzanzug', 'overall', 'schutzkleidung', 'schutzbeutel', 'schutzhaube', 'schutzoverall'])) {
      productTypes.push('schutzbekleidung');
    }

    if (includesAny(hay, ['nitril', 'nitrile'])) materials.push('nitril');
    if (includesAny(hay, ['latex']) && !includesAny(hay, ['latexfrei', 'latex frei', 'latex-free'])) {
      materials.push('latex');
    }
    if (includesAny(hay, ['vinyl', 'pvc'])) materials.push('vinyl');
    if (includesAny(hay, ['vlies', 'non-woven', 'nonwoven'])) materials.push('vlies');
    if (includesAny(hay, ['polyethylen', ' pe ', 'polyethylene'])) materials.push('polyethylen');

    clothingSizes = extractClothingSizes(hay, product.optionValues);

    if (includesAny(hay, ['pflege', 'senior', 'altenpflege', 'betreuung'])) {
      applicationAreas.push('pflege');
    }
    if (includesAny(hay, ['praxis', 'klinik', 'arzt', 'medizin'])) {
      applicationAreas.push('praxis');
      applicationAreas.push('medizin');
    }
    if (includesAny(hay, ['haushalt', 'alltag', 'reinigung'])) {
      applicationAreas.push('haushalt');
    }
    if (includesAny(hay, ['hygiene', 'desinfektion', 'schutz'])) {
      applicationAreas.push('hygiene');
    }

    if (includesAny(hay, ['chemikalien', 'chemikalienbestaendig', 'chemikalienbeständig', 'chemo'])) {
      protectionClasses.push('chemikalien');
    }

    if (includesAny(hay, ['200 st', '200er', '240 st'])) {
      packUnits.push('pack-200');
    } else if (includesAny(hay, ['100 st', '100er', '120 st'])) {
      packUnits.push('pack-100');
    } else if (includesAny(hay, ['50 st', '50er', '60 st'])) {
      packUnits.push('pack-50');
    } else if (includesAny(hay, ['25 st', '25er', '30 st', '20 st'])) {
      packUnits.push('pack-25');
    }
    if (includesAny(hay, ['karton', 'gebinde', 'spender', 'box'])) {
      packUnits.push('karton');
    }
    if (includesAny(hay, ['einzel', 'single', '1 st'])) {
      packUnits.push('einzelpack');
    }

    if (includesAny(hay, ['latexfrei', 'latex frei', 'latex-free'])) properties.push('latexfrei');
    if (includesAny(hay, ['puderfrei', 'puder frei', 'powder free'])) properties.push('puderfrei');
    if (includesAny(hay, ['steril', 'sterile'])) properties.push('steril');
    if (includesAny(hay, ['texturiert', 'riffeln', 'griff', 'structured'])) properties.push('texturiert');
    if (includesAny(hay, ['extra lang', 'lang', 'stulpe', '30 cm', '300 mm'])) properties.push('lang');

    if (!productTypes.length && includesAny(hay, ['schutz', 'handschuh', 'hygiene'])) {
      productTypes.push('schutzprodukt');
    }

    return {
      categorySlug: product.categorySlug || 'schutz-handschuhe',
      productTypes: unique(productTypes),
      materials: unique(materials),
      clothingSizes: unique(clothingSizes),
      applicationAreas: unique(applicationAreas),
      protectionClasses: unique(protectionClasses),
      packUnits: unique(packUnits),
      brand: normalizeBrand(product.vendor),
      sizes: extractSizes(hay, product.optionValues),
      properties: unique(properties),
      priceMin: product.priceMin || 0,
      priceMax: product.priceMax || product.priceMin || 0,
    };
  }

  function deriveProductAttributes(product) {
    if (isInkontinenzCategory(product.categorySlug)) {
      return deriveInkontinenzAttributes(product);
    }
    if (isSchutzHandschuheCategory(product.categorySlug)) {
      return deriveSchutzHandschuheAttributes(product);
    }
    if (isKoerperpflegeCategory(product.categorySlug)) {
      return deriveKoerperpflegeAttributes(product);
    }
    if (isVerbrauchsartikelCategory(product.categorySlug)) {
      return deriveVerbrauchsartikelAttributes(product);
    }
    if (isHautpflegeCategory(product.categorySlug)) {
      return deriveHautpflegeAttributes(product);
    }
    return deriveDesinfektionAttributes(product);
  }

  function parseProductTags(product) {
    var tags = product && product.tags;
    if (Array.isArray(tags)) {
      return tags
        .map(function (tag) {
          return String(tag || '').trim();
        })
        .filter(Boolean);
    }
    if (typeof tags === 'string') {
      return tags
        .split(',')
        .map(function (tag) {
          return tag.trim();
        })
        .filter(Boolean);
    }
    return [];
  }

  function compactToken(value) {
    return normalizeText(value).replace(/[\s_-]+/g, '');
  }

  function tagMatchesFilterOption(tag, option) {
    if (!tag || !option) return false;
    var slug = normalizeTagSlug(tag);
    if (slug && slug === option.value) return true;
    if (normalizeText(tag) === normalizeText(option.label)) return true;
    var tagCompact = compactToken(tag);
    if (tagCompact && tagCompact === compactToken(option.value)) return true;
    if (tagCompact && tagCompact === compactToken(option.label)) return true;
    return false;
  }

  function mergeProductTagsIntoAttributes(product, filterGroups) {
    var rawTags = parseProductTags(product);
    var normalizedTags = unique(
      rawTags
        .map(function (tag) {
          return normalizeTagSlug(tag);
        })
        .filter(Boolean)
    );

    (filterGroups || []).forEach(function (group) {
      if (!group.options) return;
      group.options.forEach(function (option) {
        rawTags.forEach(function (tag) {
          if (!tagMatchesFilterOption(tag, option)) return;
          if (!product[group.id]) product[group.id] = [];
          if (product[group.id].indexOf(option.value) === -1) product[group.id].push(option.value);
        });
      });
    });

    product.rawTags = rawTags;
    product.normalizedTags = normalizedTags;
    return product;
  }

  function normalizeTagSlug(value) {
    return normalizeText(value)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function enrichProduct(product) {
    var attrs = deriveProductAttributes(product);
    var rawTags = parseProductTags(product);
    var normalizedTags = unique(
      rawTags
        .map(function (tag) {
          return normalizeTagSlug(tag);
        })
        .filter(Boolean)
    );
    return Object.assign({}, product, attrs, {
      rawTags: rawTags,
      normalizedTags: normalizedTags,
    });
  }

  global.PflegeCategoryAttributes = {
    normalizeText: normalizeText,
    normalizeTagSlug: normalizeTagSlug,
    parseProductTags: parseProductTags,
    tagMatchesFilterOption: tagMatchesFilterOption,
    mergeProductTagsIntoAttributes: mergeProductTagsIntoAttributes,
    buildHaystack: buildHaystack,
    haystackIncludesFilterValue: haystackIncludesFilterValue,
    isHautpflegeCategory: isHautpflegeCategory,
    isInkontinenzCategory: isInkontinenzCategory,
    deriveProductAttributes: deriveProductAttributes,
    enrichProduct: enrichProduct,
  };
})(typeof window !== 'undefined' ? window : this);
