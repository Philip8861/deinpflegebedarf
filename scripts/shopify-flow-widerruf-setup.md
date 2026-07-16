# Shopify Flow — Kunden-E-Mail bei Widerruf

> ⚠️ **Nicht geeignet für das Theme-Widerrufsformular**  
> Shopify Flow hat **keinen Trigger** für Theme-Kontaktformulare (`{% form 'contact' %}`).  
> Der Trigger „Kontaktformular eingereicht“ existiert in Flow **nicht** für euer Widerrufsformular.

**Stattdessen (dauerhaft kostenlos):** `scripts/widerruf-email-kostenlos-apps-script.md`

---

Diese Anleitung bleibt nur als Referenz, falls ihr später **Shopify Forms** statt des Theme-Formulars nutzt.

---

## Voraussetzung

- Shopify-Plan mit **Shopify Flow** (Shopify, Advanced oder Plus — im Admin unter **Apps → Flow** prüfen)
- Theme mit Widerrufsformular ist deployed (fetch-Übermittlung wie Rezept-Formular)

---

## Schritt 1: Flow öffnen

1. Shopify Admin → **Apps** → **Flow** öffnen  
   (Falls nicht installiert: im Shopify App Store nach „Shopify Flow“ suchen und installieren)
2. **Workflow erstellen** klicken

---

## Schritt 2: Trigger

1. **Trigger hinzufügen** → **Kontaktformular eingereicht** (Contact form submitted)

---

## Schritt 3: Bedingung (nur Widerrufe)

1. **Bedingung hinzufügen**
2. Feld: **Tags** (oder `contact.tags`)
3. Operator: **enthält** / **contains**
4. Wert: `widerruf`

> Alternativ: Betreff **enthält** `Widerrufserklärung`

---

## Schritt 4: Aktion — E-Mail an Kunden

1. **Aktion hinzufügen** → **E-Mail senden** (Send email)
2. **An:** Variable `contact.email` auswählen (E-Mail des Formulars)
3. **Von:** `deinpflegebedarf@alltagshilfe-sued.de` (oder eure Shop-Absenderadresse)
4. **Betreff:**

```
Eingangsbestätigung Ihres Widerrufs – deinpflegebedarf.de
```

5. **Nachricht:** Inhalt aus `scripts/widerruf-kunden-email-vorlage.txt` kopieren und in Flow einfügen.  
   Variablen in Flow über **Variable einfügen** setzen (siehe Vorlage).

### Verfügbare Variablen in Flow

| Variable | Quelle im Formular |
|----------|-------------------|
| `contact.name` | Name |
| `contact.email` | E-Mail |
| `contact.Vorgangsnummer` | Vorgangsnummer |
| `contact.Bestellangaben` | Angaben zur Bestellung |
| `contact.Widerrufsumfang` | Gesamte / Teil der Bestellung |
| `contact.Betroffene_Artikel` | Betroffene Artikel |
| `contact.Zusatznachricht` | Optionale Nachricht |
| `contact.body` | Vollständiger Text (Fallback) |

---

## Schritt 5: Workflow aktivieren

1. Workflow benennen: `Widerruf — Eingangsbestätigung Kunde`
2. **Speichern**
3. Schalter auf **Aktiv** stellen

---

## Schritt 6: Test

1. `/pages/vertrag-widerrufen` öffnen (Inkognito, ohne Login)
2. Test-Widerruf absenden
3. Prüfen:
   - ✅ Bestätigungsseite im Shop
   - ✅ E-Mail an Kunden-Adresse (ggf. Spam-Ordner)
   - ✅ E-Mail an `deinpflegebedarf@alltagshilfe-sued.de` (Shopify-Standardbenachrichtigung)
   - ✅ Eintrag unter **Kunden → Kontaktformulare**

---

## Optional: Zweiter Flow bei E-Mail-Fehler

Falls die Kunden-E-Mail fehlschlägt:

1. Neuer Workflow oder **Fehlerbehandlung** in Flow
2. Aktion: Interne E-Mail an `deinpflegebedarf@alltagshilfe-sued.de`
3. Betreff: `FEHLER: Widerrufs-E-Mail nicht versendet — {{ contact.Vorgangsnummer }}`

---

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| Keine Kunden-E-Mail | Flow aktiv? Bedingung `widerruf` korrekt? |
| Keine Shop-E-Mail | Einstellungen → Benachrichtigungen → Kontaktformular prüfen |
| Flow-Variablen leer | Theme deployen; Feldnamen exakt wie oben |
| E-Mail im Spam | Absender-Domain SPF/DKIM in Shopify prüfen |

---

## Technischer Hintergrund

Das Widerrufsformular sendet per `fetch()` an Shopify `/contact` — identisch zur zuverlässigen Rezept-Übermittlung. **Dieser Submit löst keinen Shopify-Flow-Trigger aus.** Kunden-E-Mail erfolgt über Google Apps Script (siehe `scripts/widerruf-email-kostenlos-apps-script.md`).
