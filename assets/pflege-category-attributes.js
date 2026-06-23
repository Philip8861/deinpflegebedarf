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
    if (v.indexOf('seni') !== -1) return 'seni-care';
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
    return v.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function isHautpflegeCategory(slug) {
    var s = normalizeText(slug);
    return s === 'hautpflege' || s === 'hautschutz-hautpflege' || s === 'hauschutz-hautpflege';
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

  function deriveProductAttributes(product) {
    if (isHautpflegeCategory(product.categorySlug)) {
      return deriveHautpflegeAttributes(product);
    }
    return deriveDesinfektionAttributes(product);
  }

  function enrichProduct(product) {
    var attrs = deriveProductAttributes(product);
    return Object.assign({}, product, attrs);
  }

  global.PflegeCategoryAttributes = {
    normalizeText: normalizeText,
    isHautpflegeCategory: isHautpflegeCategory,
    deriveProductAttributes: deriveProductAttributes,
    enrichProduct: enrichProduct,
  };
})(typeof window !== 'undefined' ? window : this);
