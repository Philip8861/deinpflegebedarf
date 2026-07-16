# Widerruf — Kunden-E-Mail: Warum Flow „Kontaktformular“ nicht findet

## Empfehlung: Google Apps Script (dauerhaft 0 €)

**Anleitung:** `scripts/widerruf-email-kostenlos-apps-script.md`

Zapier Webhooks sind **Premium** — nach der 8-Tage-Trial kostenpflichtig. Nicht für Dauerbetrieb geeignet.

---

## Das Problem (Flow)

In Shopify Flow gibt es **keinen Trigger „Kontaktformular eingereicht“** für Theme-Formulare (`{% form 'contact' %}`).

Deshalb zeigt die Suche nach **„Kontaktformular“** → **Keine Ergebnisse gefunden**.

Das Widerrufsformular auf `/pages/vertrag-widerrufen` ist ein **Theme-Kontaktformular** — wie das Rezept-Formular. Es löst **keinen** Shopify-Flow-Workflow aus.

| Formular-Typ | Shop-Mail an deinpflegebedarf@... | Flow-Trigger | Kunden-Mail per Flow |
|--------------|-----------------------------------|--------------|----------------------|
| Theme `{% form 'contact' %}` (Widerruf, Rezept) | ✅ automatisch | ❌ nicht verfügbar | ❌ nicht möglich |
| **Shopify Forms** App | ✅ | ✅ „Metaobjekt-Eintrag erstellt“ | ⚠️ nur mit Einschränkungen |

---

## Lösungsoptionen für Kunden-E-Mail beim Widerruf

### Option A — Google Apps Script (empfohlen, dauerhaft 0 €)

**Kostenlos, kein Trial, kein Monatslimit für normale Widerrufsmengen.**

**Anleitung:** `scripts/widerruf-email-kostenlos-apps-script.md`

1. Skript auf script.google.com anlegen
2. Als Web-App deployen (`Anyone` + URL mit `/exec`)
3. URL im Theme eintragen (Customizer → „PflegeShop Rechtsseite“)

---

### Option B — Zapier (nur Trial, danach kostenpflichtig)

Webhooks by Zapier = **Premium**. Nach Trial Ende nicht mehr gratis.

Kurzanleitung (falls Trial nutzen): `scripts/widerruf-email-kostenlos-zapier.md`

---

### Option C — Mechanic App (kostenpflichtig)

Mechanic kann transaktionale E-Mails senden — **nicht nötig**, wenn Zapier/Apps Script genutzt wird.

Kosten: ab ca. 16 USD/Monat.

---

### Option D — Shopify Forms App + Flow

1. App **Shopify Forms** installieren
2. Widerrufsformular **neu** in Shopify Forms bauen
3. In Flow Trigger suchen: **„Metaobjekt-Eintrag erstellt“** (nicht „Kontaktformular“)
4. Metaobjekt-Definition = Ihr Shopify-Formular wählen
5. Aktion: E-Mail senden

Nachteil: Zweistufiger §-356a-Ablauf müsste in Shopify Forms neu umgesetzt werden — **nicht empfohlen** für eure aktuelle Lösung.

---

## Was in Flow stattdessen suchen (nur Shopify Forms)

| Deutsch (ca.) | Englisch |
|---------------|----------|
| Metaobjekt-Eintrag erstellt | Metaobject entry created |

**Nicht** suchen: Kontaktformular, Contact form, Formular eingereicht

---

## Aktueller Stand eures Shops

- ✅ Widerruf wird zuverlässig an Shopify übermittelt (`fetch()` wie Rezept)
- ✅ Shop erhält Benachrichtigung (wenn Kontaktformular in Benachrichtigungen aktiv)
- ✅ Kunde sieht Bestätigungsseite im Browser
- ✅ Theme unterstützt kostenlosen Webhook für Kunden-E-Mail (nach Einrichtung)
- ⚠️ Kunden-E-Mail — **Webhook in Zapier/Apps Script einmalig einrichten**

---

## Empfehlung

**Google Apps Script** — dauerhaft kostenlos, Theme-Formular bleibt, §-356a-Ablauf bleibt.

Siehe: `scripts/widerruf-email-kostenlos-apps-script.md`
