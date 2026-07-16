# Datenschutz — Verarbeitungsbericht Widerrufsfunktion (§ 356a BGB)

**Stand:** Juli 2026  
**Zweck:** Dokumentation für die juristische Anpassung der Datenschutzerklärung. Rechtsgrundlagen und Speicherdauern sind **nicht** festgelegt — diese müssen vom Datenschutzbeauftragten / Rechtsanwalt ergänzt werden.

---

## 1. Erhobene Daten

| Datenfeld | Pflicht | Zweck (fachlich) |
|-----------|---------|------------------|
| Vor- und Nachname | Ja | Zuordnung des Widerrufs |
| E-Mail-Adresse | Ja | Eingangsbestätigung, Rückfragen |
| Angaben zur Bestellung | Ja | Zuordnung zur Bestellung (Bestellnummer oder alternatives Identifikationsmerkmal) |
| Umfang des Widerrufs (gesamt/teil) | Ja | Bearbeitung des Widerrufs |
| Betroffene Artikel | Nur bei Teilwiderruf | Bearbeitung des Teilwiderrufs |
| Bestelldatum | Nein | Hilfe bei Bestellzuordnung |
| Zusätzliche Nachricht | Nein | Optionale Kundenangabe |
| Erklärungstext (fest) | Automatisch | Nachweis der Widerrufserklärung |
| Vorgangsnummer | Automatisch | Eindeutige Referenz |
| Submission-ID | Automatisch | Duplikatvermeidung |
| Zeitstempel (Datum, Uhrzeit, Zeitzone) | Automatisch | Nachweis des Eingangs |
| Zeitzone | Automatisch | Korrekte Zeitangabe in Bestätigung |

**Nicht erhoben:**

- Widerrufsgrund
- Telefonnummer
- Anschrift
- Zahlungsdaten
- Vollständige IP-Adresse (weder im Theme-Code noch in den übermittelten Formulardaten)

---

## 2. Empfänger / eingesetzte Systeme

| System | Rolle | Datenübertragung |
|--------|-------|------------------|
| **Shopify (Kontaktformular)** | Formularübermittlung, Speicherung als Kontaktanfrage | Alle Formulardaten via HTTPS POST |
| **Shopify E-Mail-Benachrichtigung** | Interne Shop-Benachrichtigung bei neuem Kontakt | Standard-Shopify-Notification an Shop-E-Mail |
| **Shopify Flow** (einrichtungspflichtig) | Automatische Eingangsbestätigung an Kunden + interne Meldung | Siehe `scripts/shopify-flow-widerruf-setup.md` |
| **Theme-JavaScript** (`pflege-withdrawal-form.js`) | Validierung, Zwei-Stufen-UI, Duplikatschutz | Lokal im Browser; `sessionStorage` nur für Submission-ID / Vorgangsnummer-Anzeige |

**Nicht eingesetzt für Widerrufsdaten:**

- Meta Pixel
- Google Ads / Conversion Tracking
- Externe Formulardienste (Typeform, Jotform, etc.)
- Marketing-Automation (Klaviyo etc.) — sofern nicht separat freigegeben

---

## 3. Speicherort der Widerrufsvorgänge

1. **Shopify Admin → Kunden → Kontaktformulare** (primär)
2. Strukturierter Volltext in `contact[body]` jeder Anfrage
3. Einzelne Felder als Custom Contact Fields (`Vorgangsnummer`, `Submission-ID`, …)
4. **SessionStorage** im Browser des Kunden (temporär, nur Duplikatschutz und Anzeige der Vorgangsnummer nach Redirect — keine serverseitige Speicherung)

---

## 4. E-Mail-Versand

| E-Mail | Auslöser | Inhalt |
|--------|----------|--------|
| Kunden-Eingangsbestätigung | Shopify Flow nach finalem Submit | Erklärungstext, Datum, Uhrzeit, Vorgangsnummer, alle Angaben |
| Interne Shop-Benachrichtigung | Shopify Standard + optional Flow | Vollständige Widerrufsdaten |

**Wichtig:** Ohne konfigurierten Shopify-Flow-Workflow wird **keine** automatische Kunden-E-Mail versendet. Die On-Page-Bestätigung auf `/pages/vertrag-widerrufen` dient als zusätzlicher dauerhafter Datenträger (Drucken/PDF).

---

## 5. Technische Protokolldaten

- Shopify-Server-Logs (Standard-Shopify-Infrastruktur) können technische Verbindungsdaten verarbeiten — Details in der Shopify-Datenschutz-/Auftragsverarbeitungs-Dokumentation
- Theme speichert **keine** IP-Adressen in Formulardaten
- Formulardaten werden **nicht** in URL-Parametern übertragen (nur `?widerruf=1` als Erfolgsmarker ohne personenbezogene Daten)

---

## 6. Offene juristische Aufgaben

Folgende Punkte müssen in der **Datenschutzerklärung** durch Rechtsanwalt / DSB ergänzt werden:

- [ ] Rechtsgrundlage der Verarbeitung (z. B. Art. 6 Abs. 1 lit. c/f DSGVO)
- [ ] Speicherdauer der Widerrufsdaten
- [ ] Empfängerliste inkl. Shopify als Auftragsverarbeiter
- [ ] Hinweis auf automatische Eingangsbestätigungs-E-Mail
- [ ] Betroffenenrechte (Auskunft, Löschung, etc.)
- [ ] Hinweis auf Shopify Flow als Verarbeitungsschritt

Folgende Punkte müssen in der **Widerrufsbelehrung** juristisch freigegeben werden:

- [ ] Platzhalter `data-legal-review="widerruf-online-356a"` in `snippets/pflege-legal-widerrufsbelehrung-body.liquid`

---

## 7. Shopify-Admin-Aufgabe

Seite im Admin anlegen:

- **Titel:** Vertrag widerrufen
- **Handle:** `vertrag-widerrufen`
- **Template:** `page.vertrag-widerrufen`
- Inhalt im Admin kann leer bleiben (Formular kommt aus dem Theme)
