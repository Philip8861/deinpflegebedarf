/**
 * Widerruf — Kunden-Eingangsbestätigung (§ 356a BGB)
 * Webhook für deinpflegebedarf.de Theme
 *
 * KOMPLETTES SKRIPT zum Kopieren in script.google.com.
 * Nach dem Einfügen: Bereitstellen → Bereitstellungen verwalten →
 * Stift ✏️ → Version: „Neue Version" → Bereitstellen.
 * (NIEMALS „Neue Bereitstellung" — sonst ändert sich die URL!)
 */
var CONFIG = {
  shopName: 'deinpflegebedarf.de',
  replyTo: 'deinpflegebedarf@alltagshilfe-sued.de',
};

function parseInput(e) {
  if (!e) return null;

  if (e.postData && e.postData.contents) {
    var contents = String(e.postData.contents);
    try {
      return JSON.parse(contents);
    } catch (err) {
      if (contents.indexOf('=') !== -1) {
        var parsed = parseFormUrlEncoded_(contents);
        if (parsed && parsed.type) return parsed;
      }
    }
  }

  if (e.parameter && e.parameter.type) {
    return e.parameter;
  }

  return null;
}

function parseFormUrlEncoded_(raw) {
  var out = {};
  String(raw || '')
    .split('&')
    .forEach(function (pair) {
      if (!pair) return;
      var parts = pair.split('=');
      var key = decodeURIComponent(parts[0] || '').replace(/\+/g, ' ');
      var val = decodeURIComponent(parts.slice(1).join('=') || '').replace(/\+/g, ' ');
      if (key) out[key] = val;
    });
  return out;
}

function getCustomerRecipient(data) {
  var candidates = [data.customer_email, data.email];
  for (var i = 0; i < candidates.length; i++) {
    var val = String(candidates[i] || '').trim();
    if (val && val.indexOf('@') !== -1) return val;
  }
  return '';
}

function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    if (params.type === 'widerruf') {
      return handleWiderruf(params);
    }
    return textResponse('Widerruf-Webhook aktiv');
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var data = parseInput(e);
    if (!data) {
      return jsonResponse({ ok: false, error: 'Keine Daten' });
    }
    return handleWiderruf(data);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function handleWiderruf(data) {
  if (data.type !== 'widerruf') {
    return jsonResponse({ ok: false, error: 'Unbekannter Typ' });
  }

  var recipient = getCustomerRecipient(data);

  if (!recipient || !data.case_id) {
    return jsonResponse({ ok: false, error: 'Pflichtfelder fehlen', debug: { customer_email: data.customer_email || '', email: data.email || '' } });
  }

  // Duplikat-Schutz: Das Theme sendet den Webhook über mehrere Kanäle
  // gleichzeitig (Zuverlässigkeit). Pro Vorgangsnummer nur EINE E-Mail.
  var cache = CacheService.getScriptCache();
  var dedupeKey = 'wd-sent-' + data.case_id;
  if (cache.get(dedupeKey)) {
    return jsonResponse({ ok: true, sent_to: recipient, deduped: true });
  }
  cache.put(dedupeKey, '1', 21600); // 6 Stunden

  var subject =
    'Eingangsbestätigung Ihres Widerrufs – ' + CONFIG.shopName;

  var body = buildEmailBody(data, recipient);
  var htmlBody = buildEmailHtml(data);

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    replyTo: CONFIG.replyTo,
    name: CONFIG.shopName,
  });

  return jsonResponse({ ok: true, sent_to: recipient });
}

function buildEmailBody(data, recipient) {
  var lines = [
    'Guten Tag ' + (data.name || '') + ',',
    '',
    'wir bestätigen den Eingang Ihrer Widerrufserklärung.',
    '',
    'Eingegangen am: ' + (data.received_date || ''),
    'Eingegangen um: ' + (data.received_time || '') + ' Uhr (' + (data.timezone || 'Europe/Berlin') + ')',
    'Vorgangsnummer: ' + (data.case_id || ''),
    '',
    'Angaben zur Bestellung:',
    data.order_info || '',
    '',
    'Umfang des Widerrufs:',
    data.scope || '',
    '',
    'Betroffene Artikel:',
    data.partial_items || 'Gesamte Bestellung',
    '',
    'Ihre Erklärung:',
    '„Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel."',
  ];

  if (data.message && String(data.message).trim() !== '') {
    lines.push('', 'Zusätzliche Nachricht:', data.message);
  }

  lines.push(
    '',
    'Diese Nachricht bestätigt den Eingang Ihrer Widerrufserklärung. Sie enthält noch keine Aussage über die rechtliche Prüfung oder die weitere Rückabwicklung.',
    '',
    'Freundliche Grüße',
    CONFIG.shopName
  );

  return lines.join('\n');
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function buildEmailHtml(data) {
  var navy = '#0b2347';
  var headingNavy = '#062a55';
  var accent = '#3f86d9';
  var linkBlue = '#0b6edc';
  var bgSoft = '#eef6ff';
  var bgCard = '#f5faff';
  var border = '#d8eafe';
  var borderSoft = '#e5eef8';
  var muted = '#6f7f95';
  var fontStack =
    "'Nunito Sans','Segoe UI',Arial,Helvetica,sans-serif";

  function row(label, value) {
    return (
      '<tr>' +
      '<td style="padding:6px 0;font-size:14px;color:' + muted + ';white-space:nowrap;vertical-align:top;padding-right:16px;">' + label + '</td>' +
      '<td style="padding:6px 0;font-size:14px;color:' + navy + ';font-weight:600;">' + value + '</td>' +
      '</tr>'
    );
  }

  var infoRows =
    row('Eingegangen am', escapeHtml_(data.received_date)) +
    row('Eingegangen um', escapeHtml_(data.received_time) + ' Uhr (' + escapeHtml_(data.timezone || 'Europe/Berlin') + ')') +
    row('Vorgangsnummer', '<span style="color:' + linkBlue + ';font-weight:700;">' + escapeHtml_(data.case_id) + '</span>');

  var detailRows =
    row('Bestellung', escapeHtml_(data.order_info)) +
    row('Umfang', escapeHtml_(data.scope)) +
    row('Betroffene Artikel', escapeHtml_(data.partial_items || 'Gesamte Bestellung'));

  if (data.order_date && String(data.order_date).trim() !== '') {
    detailRows += row('Bestelldatum', escapeHtml_(data.order_date));
  }
  if (data.message && String(data.message).trim() !== '') {
    detailRows += row('Ihre Nachricht', escapeHtml_(data.message));
  }

  return (
    '<!DOCTYPE html>' +
    '<html lang="de"><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:0;background-color:' + bgSoft + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' + bgSoft + ';padding:24px 12px;">' +
    '<tr><td align="center">' +

    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#fefefe;border:1px solid ' + border + ';border-radius:14px;overflow:hidden;font-family:' + fontStack + ';">' +

    // Kopf: Wordmark wie Homepage
    '<tr><td style="padding:26px 32px 22px;border-bottom:1px solid ' + borderSoft + ';" align="center">' +
    '<a href="https://www.deinpflegebedarf.de" style="text-decoration:none;">' +
    '<span style="font-size:24px;font-weight:800;color:' + headingNavy + ';letter-spacing:-0.5px;">Dein<span style="color:' + accent + ';">Pflegebedarf</span></span>' +
    '</a>' +
    '</td></tr>' +

    // Titel + Bestätigungs-Badge
    '<tr><td style="padding:32px 32px 8px;" align="center">' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="width:52px;height:52px;border-radius:999px;background-color:' + bgSoft + ';text-align:center;vertical-align:middle;font-size:26px;line-height:52px;color:' + accent + ';">&#10003;</td>' +
    '</tr></table>' +
    '<h1 style="margin:18px 0 6px;font-size:22px;line-height:1.25;font-weight:700;color:' + headingNavy + ';letter-spacing:-0.4px;">Ihr Widerruf ist bei uns eingegangen</h1>' +
    '<p style="margin:0;font-size:15px;line-height:1.6;color:' + muted + ';">Guten Tag ' + escapeHtml_(data.name) + ',<br>wir best&auml;tigen den Eingang Ihrer Widerrufserkl&auml;rung.</p>' +
    '</td></tr>' +

    // Eingangs-Karte
    '<tr><td style="padding:24px 32px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:' + bgCard + ';border:1px solid ' + borderSoft + ';border-radius:12px;">' +
    '<tr><td style="padding:18px 22px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + infoRows + '</table>' +
    '</td></tr></table>' +
    '</td></tr>' +

    // Details
    '<tr><td style="padding:24px 32px 0;">' +
    '<p style="margin:0 0 10px;font-size:13px;font-weight:700;color:' + muted + ';text-transform:uppercase;letter-spacing:0.06em;">Ihre &uuml;bermittelten Angaben</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + borderSoft + ';border-radius:12px;">' +
    '<tr><td style="padding:18px 22px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + detailRows + '</table>' +
    '</td></tr></table>' +
    '</td></tr>' +

    // Erklärungstext
    '<tr><td style="padding:24px 32px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="border-left:3px solid ' + accent + ';padding:4px 0 4px 16px;font-size:14px;line-height:1.6;color:' + navy + ';font-style:italic;">' +
    '&bdquo;Hiermit widerrufe ich den von mir abgeschlossenen Vertrag &uuml;ber die angegebene Bestellung beziehungsweise die angegebenen Artikel.&ldquo;' +
    '</td></tr></table>' +
    '</td></tr>' +

    // Rechtlicher Hinweis
    '<tr><td style="padding:24px 32px 28px;">' +
    '<p style="margin:0;font-size:12.5px;line-height:1.6;color:' + muted + ';">Diese Nachricht best&auml;tigt ausschlie&szlig;lich den Eingang Ihrer Widerrufserkl&auml;rung. Sie enth&auml;lt noch keine Aussage &uuml;ber die rechtliche Pr&uuml;fung oder die weitere R&uuml;ckabwicklung. Wir melden uns zeitnah bei Ihnen.</p>' +
    '</td></tr>' +

    // Fußzeile
    '<tr><td style="padding:20px 32px;background-color:' + bgCard + ';border-top:1px solid ' + borderSoft + ';" align="center">' +
    '<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:' + headingNavy + ';">DeinPflegebedarf</p>' +
    '<p style="margin:0;font-size:12px;line-height:1.6;color:' + muted + ';">Fragen? Antworten Sie einfach auf diese E-Mail oder besuchen Sie ' +
    '<a href="https://www.deinpflegebedarf.de" style="color:' + linkBlue + ';text-decoration:none;">www.deinpflegebedarf.de</a></p>' +
    '</td></tr>' +

    '</table>' +
    '</td></tr></table>' +
    '</body></html>'
  );
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function textResponse(text) {
  return ContentService.createTextOutput(text).setMimeType(
    ContentService.MimeType.TEXT
  );
}
