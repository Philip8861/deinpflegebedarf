# Widerruf — Kunden-E-Mail mit Zapier (nur Trial)

> ⚠️ **Nicht dauerhaft kostenlos.** Webhooks by Zapier sind **Premium** — nach der Pro-Trial kostenpflichtig.  
> **Dauerhaft gratis:** `scripts/widerruf-email-kostenlos-apps-script.md`

Shopify Flow und Mechanic sind **nicht nötig**.

---

## Teil 1: Zapier-Webhook erstellen (ca. 5 Minuten)

### Schritt 1 — Zap anlegen

1. Auf [zapier.com](https://zapier.com) registrieren (kostenlos)
2. **Zap erstellen**
3. **Trigger:** „Webhooks by Zapier“ → **Catch Hook**
4. Zapier zeigt eine **Webhook-URL** — kopieren (z. B. `https://hooks.zapier.com/hooks/catch/123456/abcdef/`)

### Schritt 2 — Test-Daten senden

Zapier wartet auf Testdaten. Einmalig im Browser diese URL mit Test-POST aufrufen — oder nach Theme-Einrichtung einen Test-Widerruf absenden.

Minimale Testdaten (JSON):

```json
{
  "type": "widerruf",
  "name": "Max Mustermann",
  "email": "test@beispiel.de",
  "case_id": "WD-20260716-1234",
  "order_info": "Bestellung #1234",
  "scope": "Gesamte Bestellung",
  "received_date": "16.07.2026",
  "received_time": "10:00",
  "timezone": "Europe/Berlin"
}
```

In Zapier: **Test trigger** → Daten sollten erscheinen.

### Schritt 3 — E-Mail-Aktion

1. **Aktion:** „E-Mail by Zapier“ → **Send Outbound Email**  
   (Alternativ: Gmail → **Send Email**, wenn Sie Gmail nutzen)
2. **To:** `email` (aus Webhook-Feld wählen)
3. **Subject:**

```
Eingangsbestätigung Ihres Widerrufs – deinpflegebedarf.de
```

4. **Body** (Felder aus Webhook einfügen):

```
Guten Tag {{name}},

wir bestätigen den Eingang Ihrer Widerrufserklärung.

Eingegangen am: {{received_date}}
Eingegangen um: {{received_time}} Uhr ({{timezone}})
Vorgangsnummer: {{case_id}}

Angaben zur Bestellung:
{{order_info}}

Umfang des Widerrufs:
{{scope}}

Betroffene Artikel:
{{partial_items}}

Ihre Erklärung:
„Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die angegebene Bestellung beziehungsweise die angegebenen Artikel.“

{{#if message}}
Zusätzliche Nachricht:
{{message}}
{{/if}}

Diese Nachricht bestätigt den Eingang Ihrer Widerrufserklärung. Sie enthält noch keine Aussage über die rechtliche Prüfung oder die weitere Rückabwicklung.

Freundliche Grüße
deinpflegebedarf.de
```

> Hinweis: Zapier-Feldnamen ggf. aus der Dropdown-Liste wählen (`name`, `email`, `case_id`, …).

5. **From:** Ihre Absender-Adresse (z. B. `deinpflegebedarf@alltagshilfe-sued.de`)
6. Zap **aktivieren**

---

## Teil 2: Webhook im Shopify-Theme eintragen

1. Shopify Admin → **Online Store → Themes → Anpassen**
2. Seite **„Vertrag widerrufen“** öffnen
3. Section **„PflegeShop Rechtsseite“** anklicken
4. Feld **„Webhook-URL für Kunden-Eingangsbestätigung“**:
   - Zapier-Webhook-URL einfügen
5. **Speichern**

*(Alternativ: URL in `templates/page.vertrag-widerrufen.json` unter `widerruf_email_webhook_url` eintragen und Theme deployen.)*

---

## Teil 3: Testen

1. `/pages/vertrag-widerrufen` im Inkognito-Fenster öffnen
2. Test-Widerruf absenden
3. Prüfen:
   - ✅ Bestätigungsseite im Shop
   - ✅ E-Mail an Kunden-Adresse
   - ✅ E-Mail an deinpflegebedarf@... (Shopify-Standard)

---

## Was das Theme sendet (Webhook-Payload)

| Feld | Inhalt |
|------|--------|
| `type` | `widerruf` |
| `name` | Name |
| `email` | Kunden-E-Mail |
| `case_id` | Vorgangsnummer |
| `order_info` | Angaben zur Bestellung |
| `scope` | Gesamte / Teil der Bestellung |
| `partial_items` | Artikel oder „Gesamte Bestellung“ |
| `message` | Optionale Nachricht |
| `received_date` | Datum |
| `received_time` | Uhrzeit |
| `timezone` | Europe/Berlin |
| `receipt` | Vollständiger Text |

Keine Zahlungsdaten, keine IP-Adresse.

---

## Alternative: Google Apps Script (100 % kostenlos, kein Limit)

Für höheres Volumen ohne Zapier-Limit:

1. Google Apps Script Web-App erstellen, die JSON empfängt und `MailApp.sendEmail()` aufruft
2. Web-App-URL im Theme-Feld eintragen (gleiches Feld wie Zapier)

Anleitung: https://developers.google.com/apps-script/guides/web

---

## Häufige Fragen

**Reicht die Bestätigungsseite im Browser ohne E-Mail?**  
Als „dauerhafter Datenträger“ (Drucken/PDF) teilweise ja — für § 356a BGB ist die **E-Mail-Eingangsbestätigung** aber vorgesehen. Webhook-Lösung empfohlen.

**Ist Zapier DSGVO-konform?**  
Zapier verarbeitet Daten als Auftragsverarbeiter — in Datenschutzerklärung ergänzen (siehe `scripts/widerruf-datenschutz-verarbeitung.md`).

**Was wenn der Webhook fehlschlägt?**  
Der Widerruf gilt trotzdem als übermittelt (Shopify-Kontaktformular). Kunde sieht die Bestätigungsseite.
