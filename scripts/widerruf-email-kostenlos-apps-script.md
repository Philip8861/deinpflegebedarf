# Widerruf — Kunden-E-Mail dauerhaft kostenlos (Google Apps Script)

> **0 €/Monat, kein Trial, kein Limit für normale Widerrufsmengen.**  
> Zapier Webhooks sind **Premium** (nach Trial kostenpflichtig) — diese Lösung bleibt gratis.

---

## Was Sie brauchen

- Ein **Google-Konto** (Gmail oder Google Workspace)
- Ca. **10 Minuten** Einrichtungszeit
- Theme mit Widerrufsformular (bereits vorhanden)

Die E-Mail geht vom Google-Konto aus, mit dem Sie das Skript deployen.  
Absender z. B. `deinpflegebedarf@alltagshilfe-sued.de`, wenn diese Adresse in Gmail als **Alias** hinterlegt ist — sonst erscheint Ihre Gmail-Adresse als Absender (rechtlich trotzdem gültig als Eingangsbestätigung).

---

## Schritt 1: Skript anlegen

1. Öffnen: [script.google.com](https://script.google.com)
2. **Neues Projekt** (oder „+“)
3. Projekt umbenennen: `Widerruf Eingangsbestätigung`
4. Standard-Code **komplett löschen**
5. **Diesen Code einfügen:**

```javascript
/**
 * Widerruf — Kunden-Eingangsbestätigung (§ 356a BGB)
 * Webhook für deinpflegebedarf.de Theme
 */
var CONFIG = {
  shopName: 'deinpflegebedarf.de',
  replyTo: 'deinpflegebedarf@alltagshilfe-sued.de',
};

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
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Keine Daten' });
    }

    var data = JSON.parse(e.postData.contents);
    return handleWiderruf(data);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function handleWiderruf(data) {
  if (data.type !== 'widerruf') {
    return jsonResponse({ ok: false, error: 'Unbekannter Typ' });
  }

  if (!data.email || !data.case_id) {
    return jsonResponse({ ok: false, error: 'Pflichtfelder fehlen' });
  }

  var subject =
    'Eingangsbestätigung Ihres Widerrufs – ' + CONFIG.shopName;

  var body = buildEmailBody(data);

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: body,
    replyTo: CONFIG.replyTo,
    name: CONFIG.shopName,
  });

  return jsonResponse({ ok: true });
}

function buildEmailBody(data) {
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
    '„Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel.“',
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
```

6. **Speichern** (Strg+S)

---

## Schritt 2: Web-App deployen

1. Oben rechts: **Deploy** → **New deployment**
2. Zahnrad ⚙️ → **Web app**
3. Einstellungen:

| Feld | Wert |
|------|------|
| **Description** | Widerruf Webhook |
| **Execute as** | Me (Ihr Google-Konto) |
| **Who has access** | **Anyone** |

4. **Deploy** klicken
5. Beim ersten Mal: **Authorize access** → Google-Konto wählen → **Advanced** → **Go to … (unsafe)** → **Allow**  
   (Normal bei selbst erstellten Skripten)
6. **Web app URL** kopieren — endet auf `/exec`  
   Beispiel: `https://script.google.com/macros/s/AKfycb.../exec`

Diese URL ist Ihre **Webhook-URL** fürs Theme.

---

## Schritt 3: URL im Shopify-Theme eintragen

1. Shopify Admin → **Online Store → Themes → Anpassen**
2. Seite **„Vertrag widerrufen“** öffnen
3. Section **„PflegeShop Rechtsseite“** anklicken
4. Feld **„Webhook-URL für Kunden-Eingangsbestätigung“**:
   - Google-Apps-Script-URL einfügen (`.../exec`)
5. **Speichern**

*(Theme muss mit der Webhook-Integration deployed sein.)*

---

## Schritt 4: Testen

1. Inkognito: `https://deinpflegebedarf.de/pages/vertrag-widerrufen`
2. Test-Widerruf mit **Ihrer echten E-Mail** absenden
3. Prüfen:
   - ✅ Bestätigungsseite im Shop
   - ✅ E-Mail im Posteingang (ggf. Spam)
   - ✅ Shop-Mail an deinpflegebedarf@... (Shopify-Standard)

**Logs prüfen** (falls keine E-Mail):
- [script.google.com](https://script.google.com) → Projekt → links **Executions**
- Fehler dort sichtbar (z. B. Quota, ungültige E-Mail)

---

## Kosten & Limits

| | Google Apps Script | Zapier (nach Trial) |
|--|------------------|---------------------|
| Kosten | **0 €** | ab ~20 €/Monat (Webhooks = Premium) |
| E-Mails/Tag | ca. 100 (Gmail) / 1.500 (Workspace) | 100 Tasks/Monat (Free, ohne Webhooks) |

Für Widerrufe mehr als ausreichend.

---

## Absender-Adresse anpassen

In Gmail unter **Einstellungen → Konten → Als Alias senden** die Shop-Adresse `deinpflegebedarf@alltagshilfe-sued.de` hinterlegen.  
Dann in `CONFIG.replyTo` und ggf. als `from` (wenn Alias aktiv):

```javascript
MailApp.sendEmail({
  to: data.email,
  from: 'deinpflegebedarf@alltagshilfe-sued.de', // nur mit verifiziertem Alias
  ...
});
```

Ohne Alias: E-Mail kommt von Ihrer Gmail-Adresse, **Reply-To** ist `deinpflegebedarf@...` — für Kunden antwortbar.

---

## DSGVO

Google verarbeitet Daten als Auftragsverarbeiter. In der Datenschutzerklärung ergänzen (siehe `scripts/widerruf-datenschutz-verarbeitung.md`).

---

## Skript ändern?

Nach Code-Änderung: **Deploy → Manage deployments → Stift ✏️ → Version: New version → Deploy**  
Sonst läuft noch die alte Version.

**Wichtig:** Das Theme nutzt `sendBeacon` und einen GET-Fallback — dafür muss `doGet` im Skript vorhanden sein (siehe aktueller Code oben).

---

## Zapier verwerfen

Den Zapier-Entwurf können Sie löschen — **nicht nötig** für die dauerhafte Lösung.
