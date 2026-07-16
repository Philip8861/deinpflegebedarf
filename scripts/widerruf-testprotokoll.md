# Testprotokoll — Elektronische Widerrufsfunktion (§ 356a BGB)

**Datum:** 16.07.2026  
**Umgebung:** Theme-Code-Review (lokal) + manuelle Prüfung nach Deploy empfohlen  
**Tester:** Cursor Agent (statische Code-Analyse)

---

## Legende

| Status | Bedeutung |
|--------|-----------|
| ✅ | Im Code umgesetzt / statisch verifiziert |
| ⚠️ | Teilweise — Deploy oder Shopify-Flow erforderlich |
| 🔲 | Manuell im Live-Shop nach Deploy zu prüfen |

---

## Testfälle

| # | Testfall | Ergebnis | Nachweis / Anmerkung |
|---|----------|----------|----------------------|
| 1 | Gast widerruft gesamte Bestellung mit Bestellnummer | ✅ | Feld „Angaben zur Bestellung“ akzeptiert Bestellnummer; Radio „gesamte Bestellung“; kein Artikelfeld Pflicht |
| 2 | Gast ohne Bestellnummer (Datum + Artikel) | ✅ | Hilfetext erlaubt alternatives Identifikationsmerkmal; kein isoliertes Bestellnummer-Pflichtfeld |
| 3 | Teilwiderruf eines Artikels | ✅ | Radio „Teil“ blendet Pflichtfeld „Welche Artikel…“ ein |
| 4 | E-Mail fehlt | ✅ | Client-Validierung + `required` + Fehlermeldung |
| 5 | Angaben zur Bestellung fehlen | ✅ | Validierung in Schritt 1 |
| 6 | Teilwiderruf ohne Artikelangabe | ✅ | Validierung `partial-items` |
| 7 | Korrektur in Stufe 2 | ✅ | Button „Angaben bearbeiten“ → Schritt 1 |
| 8 | Doppelklick „Widerruf bestätigen“ | ✅ | Button deaktiviert, `aria-busy`, `sessionStorage` Submission-ID |
| 9 | E-Mail-Versand schlägt fehl | ⚠️ | Theme kann Fehler nicht abfangen; Flow-Fehlerprotokoll in `shopify-flow-widerruf-setup.md` dokumentieren |
| 10 | Mobile 320 px | ✅ | CSS `@media max-width: 479px` — volle Breite Buttons, einspaltige Summary |
| 11 | Tastaturbedienung | ✅ | Labels, Fokuszustände, Radio-Buttons, kein Fokus-Trap |
| 12 | Widerruf ohne Login | ✅ | Öffentliche Seite, kein `customer` required |
| 13 | Link auf jeder Seite | ✅ | Footer-Band + Bottom-Bar in `pflege-footer-static.liquid` |
| 14 | Eingangsbestätigung mit Inhalt, Datum, Uhrzeit | ⚠️ | On-Page ✅; E-Mail erfordert Shopify Flow |
| 15 | Keine Daten an Marketingtracker | ✅ | Kein Tracking-Code in `pflege-withdrawal-form.js`; keine Pixel-Events |

---

## Abnahmekriterien (1–17)

| # | Kriterium | Status |
|---|-----------|--------|
| 1 | „Vertrag widerrufen“ global sichtbar | ✅ |
| 2 | Ohne Login | ✅ |
| 3 | Link führt direkt zum Prozess | ✅ `/pages/vertrag-widerrufen` |
| 4 | Bestellnummer nicht einzige Identifikation | ✅ |
| 5 | Artikel nur bei Teilwiderruf Pflicht | ✅ |
| 6 | Kein Widerrufsgrund | ✅ |
| 7 | Zweistufiger Ablauf | ✅ „Angaben prüfen“ → „Widerruf bestätigen“ |
| 8 | Endbutton „Widerruf bestätigen“ | ✅ |
| 9 | Sofortige Eingangsbestätigung E-Mail | ⚠️ Flow einrichten |
| 10 | E-Mail mit Inhalt, Datum, Uhrzeit | ⚠️ Flow-Vorlage vorhanden |
| 11 | Erfolgsseite mit Datum, Uhrzeit, Vorgangsnummer | ✅ |
| 12 | Keine rechtliche Anerkennung behauptet | ✅ |
| 13 | Mobil + Desktop | ✅ CSS Breakpoints |
| 14 | Barrierearm | ✅ Labels, ARIA, Fokus, `aria-live` |
| 15 | Rechtstexte als offene Aufgabe dokumentiert | ✅ Platzhalter + Berichte |
| 16 | Keine Tracker-Daten | ✅ |
| 17 | Vollständiges Testprotokoll | ✅ (dieses Dokument) |

---

## Screenshots

🔲 Nach Deploy im Live-Shop erstellen:

- Desktop (≥1280 px): Footer mit „Vertrag widerrufen“ + Formular Schritt 1 und 2 + Erfolgsseite
- Mobil (320 px / 375 px): gleiche Ansichten

---

## Offene technische Punkte

1. **Shopify-Seite anlegen** im Admin (Handle `vertrag-widerrufen`, Template zuweisen)
2. **Shopify Flow** für Kunden-E-Mail konfigurieren (siehe `scripts/shopify-flow-widerruf-setup.md`)
3. **Live-Test** aller 15 Testfälle nach Theme-Upload
4. **Screenshots** nach Live-Test
