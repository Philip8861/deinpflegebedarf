#!/usr/bin/env python3
"""Generate FAQ page locale keys and categories liquid snippet."""
import json
from pathlib import Path

ROOT = "https://deinpflegebedarf.de"

def url(path: str) -> str:
    return ROOT + path

W = url("/pages/widerrufsbelehrung")
D = url("/pages/datenschutzerklaerung")
V = url("/pages/versand-zahlung")
A = url("/pages/agb")
I = url("/pages/impressum")
R = url("/pages/pflegeratgeber")
C = url("/pages/cookie-einstellungen")

CATEGORIES = [
    ("Bestellung", [
        ("Wie kann ich bei deinpflegebedarf.de bestellen?", "<p>Sie können Ihre gewünschten Produkte direkt in unserem Online-Shop auswählen, in den Warenkorb legen und anschließend über den Checkout bestellen. Vor dem Absenden der Bestellung können Sie Ihre Angaben nochmals prüfen und korrigieren.</p>"),
        ("Erhalte ich eine Bestellbestätigung?", "<p>Ja. Nach Abschluss Ihrer Bestellung erhalten Sie eine Bestellbestätigung per E-Mail. Bitte prüfen Sie auch Ihren Spam-Ordner, falls die E-Mail nicht direkt sichtbar ist.</p>"),
        ("Kann ich meine Bestellung nachträglich ändern?", "<p>Bitte kontaktieren Sie uns so schnell wie möglich, wenn Sie eine Bestellung ändern möchten. Solange die Bestellung noch nicht verarbeitet oder versendet wurde, prüfen wir gerne, ob eine Änderung noch möglich ist.</p>"),
        ("Kann ich meine Bestellung stornieren?", f'<p>Wenn Ihre Bestellung noch nicht versendet wurde, können Sie uns kontaktieren und eine Stornierung anfragen. Sollte die Bestellung bereits versendet worden sein, können Sie als Verbraucher Ihr gesetzliches Widerrufsrecht nutzen. Weitere Informationen finden Sie auf unserer Seite <a href="{W}">Widerrufsbelehrung</a>.</p>'),
        ("Kann ich auch ohne Kundenkonto bestellen?", "<p>Ob eine Bestellung als Gast oder mit Kundenkonto möglich ist, hängt von den aktuell im Shop aktivierten Einstellungen ab. Wenn ein Kundenkonto genutzt wird, können Sie dort je nach Funktion Ihre Bestellungen und Daten einsehen.</p>"),
        ("Ich habe keine Bestellbestätigung erhalten. Was kann ich tun?", "<p>Bitte prüfen Sie zuerst Ihren Spam-Ordner und kontrollieren Sie, ob die E-Mail-Adresse korrekt eingegeben wurde. Wenn Sie keine Bestätigung finden, kontaktieren Sie uns bitte mit Ihrem Namen und möglichst weiteren Angaben zur Bestellung.</p>"),
    ]),
    ("Versand und Lieferung", [
        ("Wohin liefert deinpflegebedarf.de?", "<p>Wir liefern innerhalb Deutschlands. Eine Lieferung ins Ausland bieten wir derzeit nicht an.</p>"),
        ("Wie lange dauert die Lieferung?", "<p>Der Versand erfolgt in der Regel <strong>innerhalb von 1–3 Werktagen</strong> nach Zahlungseingang bzw. nach erfolgreicher Zahlungsbestätigung. Bei einzelnen Produkten kann eine abweichende Lieferzeit gelten. In diesem Fall wird diese direkt beim Produkt oder im Bestellprozess angezeigt.</p>"),
        ("Wie hoch sind die Versandkosten?", f'<p>Die Versandkosten werden im Warenkorb und im Checkout vor Abschluss der Bestellung deutlich angezeigt.</p><p>Standardversand innerhalb Deutschlands: <strong>5,99 €</strong></p><p>Ab einem Bestellwert von <strong>150,00 €</strong> liefern wir versandkostenfrei.</p><p>Weitere Details finden Sie auf der Seite <a href="{V}">Versand &amp; Zahlung</a>.</p>'),
        ("Mit welchem Versanddienstleister wird geliefert?", "<p>Der Versand erfolgt mit einem von uns ausgewählten Versanddienstleister. Je nach Bestellung, Paketgröße, Gewicht und Lieferadresse kann der Versand insbesondere über DHL, Deutsche Post, DPD, GLS, Hermes oder einen vergleichbaren Versanddienstleister erfolgen.</p>"),
        ("Erhalte ich eine Sendungsverfolgung?", "<p>Wenn eine Sendungsverfolgung verfügbar ist, erhalten Sie nach Versand Ihrer Bestellung eine Versandbestätigung mit Tracking-Link per E-Mail.</p>"),
        ("Was passiert, wenn mein Paket nicht zugestellt werden kann?", "<p>Bitte achten Sie darauf, Ihre Lieferadresse vollständig und korrekt anzugeben. Wenn ein Paket aufgrund einer fehlerhaften Adresse, Nichtabholung oder Annahmeverweigerung an uns zurückgesendet wird, setzen wir uns mit Ihnen in Verbindung. Zusätzliche Kosten für einen erneuten Versand können entstehen, wenn die Rücksendung durch fehlerhafte Angaben oder Nichtabholung verursacht wurde.</p>"),
        ("Kann ich an eine Packstation liefern lassen?", "<p>Wenn der jeweilige Versanddienstleister eine Lieferung an Packstationen unterstützt, kann dies möglich sein. Bitte achten Sie darauf, die Adresse vollständig und korrekt anzugeben. Ob eine Packstation im Einzelfall beliefert werden kann, hängt vom Versanddienstleister, Paketformat und Produkt ab.</p>"),
        ("Kann meine Bestellung in mehreren Paketen kommen?", "<p>Ja, in Einzelfällen kann eine Bestellung in mehreren Paketen oder Teillieferungen versendet werden. Dadurch entstehen Ihnen keine zusätzlichen Versandkosten, sofern nicht ausdrücklich etwas anderes vereinbart wurde.</p>"),
    ]),
    ("Zahlung", [
        ("Welche Zahlungsarten bieten Sie an?", "<p>In unserem Online-Shop stehen Ihnen folgende Zahlungsarten zur Verfügung:</p><ul><li>Klarna</li><li>PayPal</li><li>Visa</li><li>Mastercard</li><li>Google Pay</li></ul><p>Die tatsächlich verfügbaren Zahlungsarten werden Ihnen im Checkout angezeigt.</p>"),
        ("Wann wird meine Zahlung fällig?", "<p>Der Kaufpreis ist im Rahmen des Bestellabschlusses fällig, sofern bei der gewählten Zahlungsart nichts anderes angegeben ist. Bei Klarna können je nach gewählter Zahlungsart abweichende Zahlungsfristen gelten.</p>"),
        ("Kann ich mit Klarna bezahlen?", "<p>Ja, sofern Klarna im Checkout für Ihre Bestellung verfügbar ist. Je nach Verfügbarkeit können Klarna-Zahlungsarten wie Rechnung, Sofortzahlung, Ratenzahlung oder andere Klarna-Dienste angeboten werden. Die konkret verfügbaren Optionen werden im Checkout angezeigt.</p>"),
        ("Kann ich mit PayPal bezahlen?", "<p>Ja. Bei Zahlung mit PayPal werden Sie im Bestellprozess zu PayPal weitergeleitet oder die Zahlung wird über die PayPal-Zahlungsabwicklung durchgeführt. Nach erfolgreicher Zahlungsbestätigung wird Ihre Bestellung weiterbearbeitet.</p>"),
        ("Kann ich mit Kreditkarte bezahlen?", "<p>Ja. Sie können Ihre Bestellung mit Visa oder Mastercard bezahlen, sofern diese Zahlungsart im Checkout angezeigt wird.</p>"),
        ("Kann ich mit Google Pay bezahlen?", "<p>Ja, sofern Google Pay im Checkout für Ihr Gerät und Ihre Zahlungsart verfügbar ist.</p>"),
        ("Speichern Sie meine Kreditkartendaten?", "<p>Nein. Wir speichern keine vollständigen Kreditkartendaten. Die Zahlungsabwicklung erfolgt über die eingebundenen Zahlungsdienstleister bzw. die technische Zahlungsinfrastruktur des Shops.</p>"),
        ("Ist die Zahlung sicher?", "<p>Ja. Unser Online-Shop nutzt eine verschlüsselte Verbindung. Sie erkennen dies in der Regel daran, dass die Adresszeile Ihres Browsers mit „https://“ beginnt und ein Schloss-Symbol angezeigt wird.</p>"),
    ]),
    ("Produkte und Pflegebedarf", [
        ("Welche Produkte finde ich bei deinpflegebedarf.de?", "<p>In unserem Shop finden Sie Pflegebedarf für den Alltag, insbesondere Pflegeprodukte, Hygieneartikel, Inkontinenzprodukte und weitere Artikel, die pflegebedürftige Menschen, Angehörige und Pflegepersonen im Alltag unterstützen können.</p>"),
        ("Sind die Produkte für Senioren und pflegebedürftige Menschen geeignet?", "<p>Viele unserer Produkte sind speziell für den Pflegealltag, ältere Menschen, pflegebedürftige Personen und unterstützende Angehörige gedacht. Bitte beachten Sie die jeweiligen Produktbeschreibungen, Größenangaben und Anwendungshinweise.</p>"),
        ("Kann ich mich beraten lassen, wenn ich unsicher bin?", "<p>Ja. Wenn Sie unsicher sind, welches Produkt passend ist, können Sie uns gerne kontaktieren. Wir helfen Ihnen im Rahmen unserer Möglichkeiten weiter.</p><p>Telefon: <a href=\"tel:+4983349893330\">08334 / 9893330</a><br>E-Mail: <a href=\"mailto:deinpflegebedarf@alltagshilfe-sued.de\">deinpflegebedarf@alltagshilfe-sued.de</a></p>"),
        ("Wie finde ich die passende Größe bei Inkontinenzprodukten?", "<p>Achten Sie bei Inkontinenzprodukten auf die Größenangaben, den Hüft- oder Taillenumfang, die Saugstärke und die jeweilige Anwendungssituation. Die passende Größe ist wichtig, damit das Produkt gut sitzt, sicher hält und angenehm getragen werden kann.</p>"),
        ("Worauf sollte ich bei Inkontinenzprodukten achten?", "<p>Wichtig sind vor allem passende Größe, Saugstärke, Hautverträglichkeit, Tragekomfort und die Alltagssituation. Je nachdem, ob das Produkt tagsüber, nachts, unterwegs oder bei stärkerer Inkontinenz genutzt wird, können unterschiedliche Produkte sinnvoll sein.</p>"),
        ("Was bedeutet Saugstärke bei Inkontinenzprodukten?", "<p>Die Saugstärke beschreibt, wie viel Flüssigkeit ein Produkt aufnehmen kann. Eine höhere Saugstärke kann bei stärkerer Inkontinenz oder längerer Tragedauer sinnvoll sein. Gleichzeitig sollte das Produkt gut sitzen und zur persönlichen Situation passen.</p>"),
        ("Warum ist Hautschutz im Pflegealltag wichtig?", "<p>Hautschutz kann im Pflegealltag wichtig sein, weil empfindliche oder beanspruchte Haut besonderen Schutz benötigt. Besonders bei Inkontinenz, häufigem Waschen oder längerer Belastung der Haut können geeignete Pflege- und Schutzprodukte helfen, die Haut zu unterstützen.</p>"),
        ("Was ist der Unterschied zwischen Pflegeprodukten und Hygieneartikeln?", "<p>Pflegeprodukte dienen häufig der Reinigung, Pflege oder Unterstützung der Haut. Hygieneartikel werden vor allem genutzt, um Sauberkeit, Schutz und Hygiene im Alltag sicherzustellen. Viele Produkte überschneiden sich im Pflegealltag, zum Beispiel bei Inkontinenzversorgung, Hautschutz oder Körperpflege.</p>"),
        ("Sind die Produkte auch für pflegende Angehörige geeignet?", "<p>Ja. Viele Produkte in unserem Shop sind auch für Angehörige gedacht, die eine Person zu Hause unterstützen oder pflegen. Sie können helfen, den Pflegealltag hygienischer, sicherer und einfacher zu gestalten.</p>"),
        ("Kann ich Produkte für eine andere Person bestellen?", "<p>Ja. Sie können Produkte auch für Angehörige oder eine andere pflegebedürftige Person bestellen. Bitte achten Sie darauf, die korrekte Lieferadresse anzugeben und die Produkte passend zum Bedarf der Person auszuwählen.</p>"),
    ]),
    ("Pflegehilfsmittel, Pflegebox und Pflegekasse", [
        ("Was sind Pflegehilfsmittel?", "<p>Pflegehilfsmittel sind Produkte, die die häusliche Pflege erleichtern, Beschwerden lindern oder eine selbstständigere Lebensführung unterstützen können. Dazu können je nach Situation zum Verbrauch bestimmte Pflegehilfsmittel oder andere unterstützende Produkte gehören.</p>"),
        ("Kann ich Pflegeprodukte über die Pflegekasse abrechnen?", "<p>Bestimmte Pflegehilfsmittel zum Verbrauch können bei bestehendem Pflegegrad unter bestimmten Voraussetzungen über die Pflegekasse abgerechnet werden. Ob und in welchem Umfang eine Kostenübernahme möglich ist, hängt von Ihrer persönlichen Situation und den Vorgaben der Pflegekasse ab.</p>"),
        ("Was ist eine Pflegebox?", "<p>Eine Pflegebox enthält typischerweise zum Verbrauch bestimmte Pflegehilfsmittel für die häusliche Pflege. Welche Produkte enthalten sind und ob eine Kostenübernahme durch die Pflegekasse möglich ist, hängt von den jeweiligen Voraussetzungen, dem Anbieter und der Genehmigung der Pflegekasse ab.</p>"),
        ("Bieten Sie eine Pflegebox an?", "<p>Unser Sortiment richtet sich an Menschen, die Pflegebedarf für den Alltag suchen. Ob und in welcher Form Pflegeboxen oder abrechenbare Pflegehilfsmittel angeboten werden, entnehmen Sie bitte den aktuellen Informationen im Shop oder kontaktieren Sie uns direkt.</p>"),
        ("Was ist der Unterschied zwischen Pflegehilfsmitteln und normalen Pflegeprodukten?", "<p>Pflegehilfsmittel sind Produkte, die unter bestimmten Voraussetzungen von der Pflegekasse übernommen werden können. Normale Pflegeprodukte können ebenfalls im Pflegealltag helfen, werden aber nicht immer von der Pflegekasse bezahlt. Entscheidend sind Produktart, Bedarf, Pflegegrad und die Voraussetzungen der jeweiligen Pflegekasse.</p>"),
        ("Brauche ich einen Pflegegrad für Pflegehilfsmittel?", "<p>Für eine Kostenübernahme bestimmter Pflegehilfsmittel durch die Pflegekasse ist in der Regel ein anerkannter Pflegegrad erforderlich. Die genauen Voraussetzungen hängen von der jeweiligen Leistung und der Pflegekasse ab.</p>"),
        ("Was ist der Entlastungsbetrag?", "<p>Der Entlastungsbetrag ist eine Leistung der Pflegeversicherung, die pflegebedürftige Menschen mit anerkanntem Pflegegrad unter bestimmten Voraussetzungen für anerkannte Unterstützungsangebote nutzen können. Ob und wie der Entlastungsbetrag genutzt werden kann, hängt von der jeweiligen Leistung, dem Bundesland und den Vorgaben der Pflegekasse ab.</p>"),
        ("Helfen Sie auch bei Fragen zum Pflegegrad?", "<p>Wenn Sie Fragen rund um Pflegegrad, Pflegehilfsmittel oder Unterstützung im Pflegealltag haben, können Sie uns gerne kontaktieren. Wir geben Ihnen allgemeine Hinweise und unterstützen Sie im Rahmen unserer Möglichkeiten. Eine verbindliche Entscheidung trifft immer die zuständige Pflegekasse.</p>"),
    ]),
    ("Hygieneartikel und Rückgabe", [
        ("Darf ich geöffnete Hygieneartikel zurückgeben?", "<p>Bei versiegelten Hygieneartikeln kann das Widerrufsrecht ausgeschlossen sein, wenn die Versiegelung nach der Lieferung entfernt wurde und die Ware aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet ist.</p><p>Bitte öffnen oder entfernen Sie vorhandene Hygienesiegel daher nur, wenn Sie die Ware behalten möchten.</p>"),
        ("Welche Produkte können vom Widerruf ausgeschlossen sein?", "<p>Das kann insbesondere für versiegelte Hygieneartikel, bestimmte Pflegeprodukte, Inkontinenzprodukte, geöffnete oder entsiegelte Verbrauchsprodukte sowie vergleichbare Waren gelten, sofern diese aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind und die Versiegelung entfernt wurde.</p>"),
        ("Was ist, wenn ein Hygieneartikel beschädigt oder falsch geliefert wurde?", "<p>Ihre gesetzlichen Gewährleistungsrechte bleiben bei mangelhafter, beschädigter oder falsch gelieferter Ware selbstverständlich unberührt. Bitte kontaktieren Sie uns möglichst zeitnah mit Ihrer Bestellnummer und einer kurzen Beschreibung des Problems.</p>"),
        ("Warum kann das Widerrufsrecht bei Hygieneartikeln eingeschränkt sein?", "<p>Der Grund liegt im Gesundheits- und Hygieneschutz. Bestimmte Waren können nach dem Öffnen oder Entfernen einer Versiegelung nicht mehr sicher weitergegeben oder erneut verkauft werden. Deshalb gelten für solche Produkte besondere Regeln.</p>"),
    ]),
    ("Rückgabe, Widerruf und Reklamation", [
        ("Kann ich meine Bestellung widerrufen?", f'<p>Verbrauchern steht grundsätzlich ein gesetzliches Widerrufsrecht zu. Die Widerrufsfrist beträgt in der Regel 14 Tage ab Erhalt der Ware. Alle Details finden Sie auf unserer Seite <a href="{W}">Widerrufsbelehrung</a>.</p>'),
        ("Wie widerrufe ich meine Bestellung?", f'<p>Sie können uns eine eindeutige Erklärung per E-Mail oder Brief senden. Die genauen Informationen sowie das Muster-Widerrufsformular finden Sie auf unserer Seite <a href="{W}">Widerrufsbelehrung</a>.</p>'),
        ("Wer trägt die Rücksendekosten?", "<p>Die unmittelbaren Kosten der Rücksendung trägt der Kunde, sofern in der Widerrufsbelehrung nichts anderes angegeben ist.</p>"),
        ("Was mache ich, wenn ein Artikel beschädigt oder falsch geliefert wurde?", "<p>Bitte kontaktieren Sie uns möglichst zeitnah mit Ihrer Bestellnummer und einer kurzen Beschreibung des Problems.</p><p>E-Mail: <a href=\"mailto:deinpflegebedarf@alltagshilfe-sued.de\">deinpflegebedarf@alltagshilfe-sued.de</a><br>Telefon: <a href=\"tel:+4983349893330\">08334 / 9893330</a></p><p>Wenn möglich, senden Sie uns bitte ein Foto der beschädigten oder falsch gelieferten Ware. Ihre gesetzlichen Gewährleistungsrechte bleiben selbstverständlich bestehen.</p>"),
        ("Was mache ich bei einem Transportschaden?", "<p>Bitte melden Sie sichtbare Transportschäden möglichst zeitnah bei uns. Für Verbraucher gilt: Ihre gesetzlichen Rechte bleiben auch dann bestehen, wenn Sie einen Transportschaden nicht sofort melden. Eine schnelle Meldung hilft uns jedoch bei der Klärung mit dem Versanddienstleister.</p>"),
        ("Wann bekomme ich mein Geld zurück?", f'<p>Nach einem wirksamen Widerruf erstatten wir Zahlungen nach den gesetzlichen Vorgaben. Weitere Informationen finden Sie in unserer <a href="{W}">Widerrufsbelehrung</a>. Bei Rücksendungen können wir die Rückzahlung verweigern, bis wir die Ware zurückerhalten haben oder Sie den Nachweis erbracht haben, dass Sie die Ware zurückgesandt haben.</p>'),
        ("Muss ich einen Grund für den Widerruf angeben?", "<p>Nein. Wenn Ihnen ein gesetzliches Widerrufsrecht zusteht, müssen Sie keinen Grund angeben.</p>"),
    ]),
    ("Kundenkonto und Datenschutz", [
        ("Wie werden meine Daten verarbeitet?", f'<p>Informationen zur Verarbeitung personenbezogener Daten finden Sie in unserer <a href="{D}">Datenschutzerklärung</a>.</p>'),
        ("Welche Daten werden bei einer Bestellung verarbeitet?", f'<p>Für die Bestellabwicklung verarbeiten wir insbesondere Name, Rechnungsadresse, Lieferadresse, E-Mail-Adresse, bestellte Produkte, Zahlungsstatus und Versandinformationen. Weitere Informationen finden Sie in unserer <a href="{D}">Datenschutzerklärung</a>.</p>'),
        ("Nutzen Sie Shopify?", "<p>Ja. Unser Online-Shop wird über Shopify betrieben. Shopify stellt die technische Shop-Plattform bereit, über die Produkte angezeigt, Warenkörbe verwaltet und Bestellungen abgewickelt werden.</p>"),
        ("Nutzen Sie Shopify-Apps?", "<p>Wir nutzen Shopify als Shop-Plattform und Shopify Flow zur Automatisierung interner Shop-Prozesse. Nach aktuellem Stand nutzen wir keine weiteren zusätzlichen Shopify-Apps, die über Shopify Flow und die Standardfunktionen des Shops hinaus personenbezogene Daten verarbeiten.</p>"),
        ("Kann ich Auskunft über meine gespeicherten Daten erhalten?", f'<p>Ja. Sie haben nach Maßgabe der gesetzlichen Vorschriften verschiedene Datenschutzrechte, darunter das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Widerspruch. Weitere Informationen finden Sie in unserer <a href="{D}">Datenschutzerklärung</a>.</p>'),
    ]),
    ("Kontakt und Kundenservice", [
        ("Wie erreiche ich den Kundenservice?", "<p>Sie erreichen uns unter:</p><p>Telefon: <a href=\"tel:+4983349893330\">08334 / 9893330</a><br>E-Mail: <a href=\"mailto:deinpflegebedarf@alltagshilfe-sued.de\">deinpflegebedarf@alltagshilfe-sued.de</a></p><p>Servicezeiten:<br>Montag bis Freitag: 08:30 – 16:00 Uhr</p>"),
        ("Was sollte ich bei einer Anfrage angeben?", "<p>Damit wir Ihnen schnell helfen können, geben Sie bitte möglichst Ihre Bestellnummer, Ihren Namen und eine kurze Beschreibung Ihres Anliegens an.</p>"),
        ("Kann ich mich vor dem Kauf beraten lassen?", "<p>Ja. Wenn Sie Fragen zu Produkten, Größen, Inkontinenzversorgung, Hautschutz oder Pflegebedarf haben, können Sie uns gerne kontaktieren. Wir helfen Ihnen im Rahmen unserer Möglichkeiten weiter.</p>"),
        ("Wo finde ich die rechtlichen Informationen?", f'<p>Unsere rechtlichen Informationen finden Sie im Footer unseres Online-Shops:</p><ul><li><a href="{A}">AGB</a></li><li><a href="{I}">Impressum</a></li><li><a href="{D}">Datenschutzerklärung</a></li><li><a href="{W}">Widerrufsbelehrung</a></li><li><a href="{V}">Versand &amp; Zahlung</a></li><li><a href="{C}">Cookie-Einstellungen</a></li></ul>'),
        ("Wo finde ich Tipps und Wissen rund um Pflege?", f'<p>In unserem <a href="{R}">Pflegeratgeber</a> finden Sie verständliche Informationen, praktische Tipps und hilfreiches Wissen rund um Pflege, Pflegehilfsmittel, Inkontinenzversorgung, Hautschutz, Pflegegrad und Unterstützung im Alltag.</p>'),
    ]),
    ("Ratgeber und Pflegewissen", [
        ("Was finde ich im Pflegeratgeber?", f'<p>In unserem <a href="{R}">Pflegeratgeber</a> finden Sie verständliche Erklärungen, Tipps und praktische Informationen rund um Pflege, Pflegebedarf und Unterstützung im Alltag. Die Inhalte sollen Angehörigen, pflegebedürftigen Menschen und Interessierten helfen, sich besser zu orientieren.</p>'),
        ("Ersetzt der Pflegeratgeber eine medizinische Beratung?", "<p>Nein. Unsere Ratgeberinhalte dienen der allgemeinen Information und ersetzen keine medizinische, pflegerische oder rechtliche Beratung. Bei gesundheitlichen Beschwerden, Unsicherheiten oder konkreten medizinischen Fragen wenden Sie sich bitte an ärztliches oder pflegerisches Fachpersonal.</p>"),
        ("Warum schreiben Sie über Pflegegrad, Pflegehilfsmittel und Inkontinenz?", "<p>Diese Themen betreffen viele Menschen im Pflegealltag. Unser Ziel ist es, wichtige Informationen verständlich und alltagsnah zu erklären, damit Betroffene und Angehörige schneller passende Hilfe und passende Produkte finden.</p>"),
        ("Kann ich Themen für den Ratgeber vorschlagen?", "<p>Ja. Wenn Sie eine Frage oder ein Thema haben, das viele Menschen im Pflegealltag betrifft, können Sie uns gerne kontaktieren. Wir prüfen, ob wir dazu hilfreiche Informationen im Ratgeber bereitstellen können.</p>"),
    ]),
]

def escape_liquid(s: str) -> str:
    return s.replace('\\', '\\\\').replace('"', '\\"')

def main():
    theme = Path(__file__).resolve().parent.parent
    locale = {}
    idx = 0
    cat_ranges = []
    liquid_lines = [
        "{% comment %} FAQ-Seite — Kategorien + Accordion-Einträge {% endcomment %}",
        "{%- liquid",
        "  assign faq_locale = 'sections.pflege_faq_page'",
        "-%}",
        "",
    ]

    for cat_label, items in CATEGORIES:
        start = idx + 1
        liquid_lines.append(f'<h3 class="pflege-faq-accordion__category">{cat_label}</h3>')
        liquid_lines.append('<div class="pflege-faq-accordion__list" role="list">')
        for q, a in items:
            idx += 1
            locale[f"faq_{idx}_q"] = q
            locale[f"faq_{idx}_a"] = a
            liquid_lines.append(
                f"{{% render 'pflege-faq-accordion-item', section_id: section_id, index: {idx}, locale_root: faq_locale %}}"
            )
        liquid_lines.append("</div>")
        liquid_lines.append("")
        cat_ranges.append((start, idx, cat_label))

    locale.update({
        "meta_title": "FAQ | Häufige Fragen zu Pflegebedarf, Versand & Zahlung",
        "meta_description": "Antworten auf häufige Fragen zu deinpflegebedarf.de: Bestellung, Versand, Zahlung, Pflegeprodukte, Inkontinenzprodukte, Pflegehilfsmittel, Rückgabe, Widerruf und Kundenservice.",
        "heading": "Häufige Fragen",
        "intro_lead": "Hier finden Sie Antworten auf die wichtigsten Fragen rund um Bestellung, Versand, Zahlung, Rückgabe und unsere Pflegeprodukte. Wenn Ihre Frage nicht beantwortet wird, erreichen Sie uns gerne persönlich.",
        "contact_phone": "08334 / 9893330",
        "contact_email": "deinpflegebedarf@alltagshilfe-sued.de",
        "contact_hours": "Montag bis Freitag: 08:30 – 16:00 Uhr",
        "faq_count": str(idx),
    })

    snippet_path = theme / "snippets" / "pflege-faq-page-categories.liquid"
    snippet_path.write_text("\n".join(liquid_lines) + "\n", encoding="utf-8")

    out_json = theme / "scripts" / "pflege_faq_page.locale.json"
    out_json.write_text(json.dumps({"pflege_faq_page": locale}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {idx} FAQs, {len(CATEGORIES)} categories")
    print(f"Snippet: {snippet_path}")
    print(f"Locale fragment: {out_json}")

if __name__ == "__main__":
    main()
