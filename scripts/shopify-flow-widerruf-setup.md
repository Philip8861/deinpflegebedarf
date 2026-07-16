# Shopify Flow — Eingangsbestätigung Widerruf (§ 356a BGB)

Diese Anleitung richtet die **automatische Kunden-E-Mail** und die **interne Benachrichtigung** ein. Das Theme allein kann keine E-Mails an Kunden versenden — dafür ist Shopify Flow erforderlich.

## Voraussetzungen

- Shopify-Plan mit **Shopify Flow** (Shopify Plus oder Flow als Add-on)
- Seite `/pages/vertrag-widerrufen` im Admin angelegt (Handle: `vertrag-widerrufen`, Template: `page.vertrag-widerrufen`)
- Kontaktformular-Tag: `widerruf` (wird vom Theme gesetzt)

## Workflow 1: Eingangsbestätigung an Kunden

### Trigger

**Kontaktformular eingereicht** (Contact form submitted)

### Bedingung

- `contact.tags` enthält `widerruf`
- ODER `contact.subject` enthält `Widerrufserklärung`

### Aktion: E-Mail an Kunden senden

**An:** `{{ contact.email }}`

**Betreff:** `Eingangsbestätigung Ihres Widerrufs – deinpflegebedarf.de`

**Text (Vorlage):**

```
Guten Tag {{ contact.name }},

wir bestätigen den Eingang Ihrer Widerrufserklärung.

Eingegangen am: {{ "now" | date: "%d.%m.%Y", "Europe/Berlin" }}
Eingegangen um: {{ "now" | date: "%H:%M", "Europe/Berlin" }} Uhr (Europe/Berlin)
Vorgangsnummer: {{ contact.Vorgangsnummer }}

Ihre übermittelten Angaben:

Angaben zur Bestellung:
{{ contact.Bestellangaben }}

Umfang des Widerrufs:
{{ contact.Widerrufsumfang }}

Betroffene Artikel:
{% if contact["Betroffene Artikel"] != blank %}{{ contact["Betroffene Artikel"] }}{% else %}Gesamte Bestellung{% endif %}

Ihre Erklärung:
„Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel.“

{% if contact.Zusatznachricht != blank %}
Zusätzliche Nachricht:
{{ contact.Zusatznachricht }}
{% endif %}

Diese Nachricht bestätigt den Eingang Ihrer Widerrufserklärung. Sie enthält noch keine Aussage über die rechtliche Prüfung oder die weitere Rückabwicklung.

Freundliche Grüße
deinpflegebedarf.de
```

> **Hinweis:** Feldnamen in Flow müssen exakt den Hidden-Feldern im Theme entsprechen (`Vorgangsnummer`, `Bestellangaben`, `Widerrufsumfang`, `Betroffene Artikel`, `Zusatznachricht`).

## Workflow 2: Interne Benachrichtigung

### Trigger & Bedingung

Identisch zu Workflow 1.

### Aktion: E-Mail an Shop

**An:** `deinpflegebedarf@alltagshilfe-sued.de` (oder die in Shopify hinterlegte Kontakt-E-Mail)

**Betreff:** `Neuer Widerruf — {{ contact.Vorgangsnummer }}`

**Text:** Vollständiger Inhalt aus `contact.body` (enthält alle strukturierten Daten inkl. Submission-ID und Zeitstempel).

## Fehlerbehandlung

Bei fehlgeschlagenem E-Mail-Versand in Flow:

1. **Aktion „Interne E-Mail“** an technischen Ansprechpartner mit Fehlerdetails
2. Optional: **Metafield / Google Sheet / Notion** als Fallback-Protokoll (keine Marketing-Tracker)

## Datenspeicherung in Shopify

- Widerrufe landen als **Kontaktanfragen** im Shopify-Admin (Kunden → Kontaktformulare)
- Strukturierte Daten zusätzlich im Feld `contact[body]`
- Vorgangsnummer: `contact[Vorgangsnummer]`
- Submission-ID: `contact[Submission-ID]`

## Keine Tracker

Flow-Workflows dürfen **keine** Daten an Meta Pixel, Google Ads, Klaviyo-Marketing o. Ä. senden, sofern nicht ausdrücklich datenschutzrechtlich freigegeben.

## Test nach Einrichtung

1. Test-Widerruf auf `/pages/vertrag-widerrufen` absenden
2. Prüfen: Kunden-E-Mail innerhalb weniger Minuten
3. Prüfen: Interne E-Mail im Postfach
4. Prüfen: Eintrag im Shopify-Admin unter Kontaktformularen
