import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";

/* ─── SVG Emblem Components ──────────────────────────────────────────── */

function ScrollIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="24" height="32" rx="2" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M12 12 L8 12 C8 8 12 8 12 8" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M12 36 L8 36 C8 40 12 40 12 40" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <line x1="17" y1="16" x2="31" y2="16" stroke="#c49a2a" strokeWidth="1" opacity="0.6" />
      <line x1="17" y1="20" x2="31" y2="20" stroke="#c49a2a" strokeWidth="1" opacity="0.6" />
      <line x1="17" y1="24" x2="28" y2="24" stroke="#c49a2a" strokeWidth="1" opacity="0.6" />
      <line x1="17" y1="28" x2="31" y2="28" stroke="#c49a2a" strokeWidth="1" opacity="0.6" />
      <line x1="17" y1="32" x2="25" y2="32" stroke="#c49a2a" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 38 L18 12 L24 22 L30 14 L42 38 Z" stroke="#c49a2a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M14 38 L22 24 L26 30 L30 26 L38 38" stroke="#c49a2a" strokeWidth="1" opacity="0.4" strokeLinejoin="round" />
      <circle cx="36" cy="12" r="3" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  );
}

function DeerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 8 L16 14 L12 10" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 10 L14 6" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 8 L32 14 L36 10" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 10 L34 6" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="24" cy="22" rx="8" ry="10" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="19" r="1" fill="#c49a2a" opacity="0.6" />
      <circle cx="28" cy="19" r="1" fill="#c49a2a" opacity="0.6" />
      <path d="M20 36 L20 42 M28 36 L28 42" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 30 L24 32 L32 30" stroke="#c49a2a" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function BoarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 L8 36 L40 36 L40 20 L24 8 Z" stroke="#c49a2a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="24" y1="8" x2="24" y2="36" stroke="#c49a2a" strokeWidth="1" opacity="0.3" />
      <line x1="8" y1="22" x2="40" y2="22" stroke="#c49a2a" strokeWidth="1" opacity="0.3" />
      <circle cx="18" cy="28" r="3" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="30" cy="28" r="3" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M20 16 L24 12 L28 16" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 42 C24 42 8 32 8 18 C8 10 16 6 24 6 C32 6 40 10 40 18 C40 32 24 42 24 42Z" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M24 10 L24 38" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <path d="M16 18 L24 22 L32 16" stroke="#c49a2a" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      <path d="M14 26 L24 30 L34 24" stroke="#c49a2a" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4 L14 18 L18 18 L10 30 L16 30 L8 42 L40 42 L32 30 L38 30 L30 18 L34 18 Z" stroke="#c49a2a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="24" y1="34" x2="24" y2="42" stroke="#c49a2a" strokeWidth="2" />
    </svg>
  );
}

function TowerIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="6" width="12" height="8" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M16 14 L16 42 M32 14 L32 42" stroke="#c49a2a" strokeWidth="1.5" />
      <line x1="16" y1="14" x2="32" y2="14" stroke="#c49a2a" strokeWidth="1.5" />
      <line x1="16" y1="22" x2="32" y2="22" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="30" x2="32" y2="30" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <path d="M16 42 L12 42 M32 42 L36 42" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 22 L32 30 M32 22 L16 30" stroke="#c49a2a" strokeWidth="1" opacity="0.3" />
      <rect x="21" y="8" width="6" height="4" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  );
}

function GridMapIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="2" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <line x1="6" y1="30" x2="42" y2="30" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="6" x2="18" y2="42" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="6" x2="30" y2="42" stroke="#c49a2a" strokeWidth="1" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="#c49a2a" opacity="0.7" />
      <circle cx="24" cy="24" r="2" fill="#c49a2a" opacity="0.7" />
      <circle cx="36" cy="36" r="2" fill="#c49a2a" opacity="0.7" />
      <text x="9" y="40" fontSize="6" fill="#c49a2a" opacity="0.5" fontFamily="sans-serif">A</text>
      <text x="21" y="16" fontSize="6" fill="#c49a2a" opacity="0.5" fontFamily="sans-serif">B</text>
      <text x="33" y="28" fontSize="6" fill="#c49a2a" opacity="0.5" fontFamily="sans-serif">C</text>
    </svg>
  );
}

function CameraChartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="14" width="24" height="18" rx="2" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="23" r="5" stroke="#c49a2a" strokeWidth="1" fill="none" />
      <circle cx="18" cy="23" r="2" fill="#c49a2a" opacity="0.4" />
      <path d="M30 19 L38 14 L38 32 L30 27" stroke="#c49a2a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M8 38 L14 34 L20 36 L26 32 L32 35 L38 30 L42 32" stroke="#c49a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <circle cx="10" cy="12" r="1.5" fill="#c49a2a" opacity="0.5" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="18" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="14" stroke="#c49a2a" strokeWidth="0.5" fill="none" opacity="0.4" />
      <polygon points="24,10 27,22 24,26 21,22" fill="#c49a2a" opacity="0.8" />
      <polygon points="24,38 21,26 24,22 27,26" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.5" />
      <line x1="24" y1="6" x2="24" y2="9" stroke="#c49a2a" strokeWidth="1.5" />
      <line x1="24" y1="39" x2="24" y2="42" stroke="#c49a2a" strokeWidth="1.5" />
      <line x1="6" y1="24" x2="9" y2="24" stroke="#c49a2a" strokeWidth="1.5" />
      <line x1="39" y1="24" x2="42" y2="24" stroke="#c49a2a" strokeWidth="1.5" />
    </svg>
  );
}

function ShieldAlertIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4 L40 12 L40 26 C40 34 32 42 24 44 C16 42 8 34 8 26 L8 12 Z" stroke="#c49a2a" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="24" y1="16" x2="24" y2="28" stroke="#c49a2a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="34" r="1.5" fill="#c49a2a" />
      <path d="M16 14 L24 8 L32 14" stroke="#c49a2a" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

function BinocularsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="30" r="8" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="30" r="8" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <circle cx="14" cy="30" r="4" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="34" cy="30" r="4" stroke="#c49a2a" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M22 28 L26 28" stroke="#c49a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 22 L12 14 L16 14 L16 22" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M32 22 L32 14 L36 14 L36 22" stroke="#c49a2a" strokeWidth="1.5" fill="none" />
      <path d="M16 14 L32 14" stroke="#c49a2a" strokeWidth="1" opacity="0.3" />
      <path d="M10 10 L14 14 M38 10 L34 14" stroke="#c49a2a" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Chapter Data ────────────────────────────────────────────────────── */

interface Chapter {
  number: number;
  roman: string;
  title: string;
  description: string;
  icon: () => JSX.Element;
  content: string[];
}

const chapters: Chapter[] = [
  {
    number: 1,
    roman: "I",
    title: "Manifest & Präambel",
    description: "Philosophische Grundlage. Jagd als Kulturerbe und Verantwortung.",
    icon: ScrollIcon,
    content: [
      "Das Jagdkonzept Merschbach beruht auf der Überzeugung, dass Jagd weit mehr ist als die Entnahme von Wild. Sie ist ein kulturelles Erbe, das über Generationen weitergegeben wurde, und eine Verantwortung gegenüber dem Naturraum, den wir bewirtschaften. Im Revier Merschbach — 312 Hektar inmitten des Hunsrücks — verstehen wir uns als Hüter eines komplexen Ökosystems, nicht als dessen Beherrscher.",
      "Dieses Manifest definiert die Leitlinien unserer jagdlichen Praxis. Jede Entscheidung — vom Einzelabschuss bis zur strategischen Bestandsplanung — wird an den 25 Grundsätzen des Merschbach-Kodex gemessen. Wir handeln datengestützt, aber nicht datengetrieben: Die Zahl allein entscheidet nie, sie informiert. Das Urteil bleibt beim Jäger, der sein Revier kennt.",
      "Unser Konzept verbindet traditionelle Waidgerechtigkeit mit modernen Methoden der Wildbiologie. Wir nutzen Populationsdynamik-Modelle, genetische Diversitätsanalysen und systematisches Monitoring — nicht um die Jagd zu technisieren, sondern um bessere Entscheidungen zu treffen. Der Respekt vor dem Tier und seinem Lebensraum steht dabei immer an erster Stelle.",
      "Die Präambel dieses Handbuchs richtet sich an alle, die im Revier Merschbach jagen oder an dessen Bewirtschaftung mitwirken: Revierpächter, Begehungsscheininhaber, Jagdgäste und Partner aus Land- und Forstwirtschaft. Sie soll vermitteln, warum wir tun, was wir tun — und warum manches, was andernorts üblich ist, hier bewusst unterlassen wird.",
      "Merschbach steht für eine Jagd, die sich an der Tragfähigkeit des Lebensraums orientiert, die Sozialstruktur der Wildpopulationen respektiert und den Wildschaden auf ein für die Landwirtschaft erträgliches Maß begrenzt. Dieses Gleichgewicht ist fragil und bedarf ständiger Aufmerksamkeit — genau dafür existiert dieses Handbuch."
    ],
  },
  {
    number: 2,
    roman: "II",
    title: "Naturraum Hunsrück",
    description: "Geologie, Klima, Flora & Fauna des Reviers. 312 ha Mittelgebirge.",
    icon: MountainIcon,
    content: [
      "Das Revier Merschbach liegt im zentralen Hunsrück auf einer Höhe von 380 bis 520 Metern über NN. Die 312 Hektar umfassen ein typisches Mittelgebirgsrelief mit bewaldeten Höhenrücken, offenen Talmulden entlang der Dhron und landwirtschaftlich genutzten Flächen. Die geologische Grundlage bilden devonische Schiefer und Quarzite, überlagert von Lösslehmdecken, die nährstoffreiche Böden mit guter Wasserspeicherkapazität bilden.",
      "Das Klima ist atlantisch geprägt mit Jahresniederschlägen von 850–950 mm und einer mittleren Jahrestemperatur von 7,5°C. Die Vegetationsperiode erstreckt sich von April bis Oktober. Typische Waldgesellschaften sind Hainsimsen-Buchenwälder in den Höhenlagen und Eichen-Hainbuchenwälder an den Hängen. Der Fichtenanteil ist durch die Stürme der letzten Jahrzehnte und den Borkenkäferbefall stark zurückgegangen — eine Entwicklung, die dem Laubmischwald Raum gibt.",
      "Die Kreisstraße K81 durchschneidet das Revier in Nord-Süd-Richtung und stellt eine relevante Störquelle dar, insbesondere für Rotwild-Fernwechsel. Östlich des Reviers befinden sich die Windkraftanlagen des Windparks, deren Rotoren und Infrastrukturwege das Raumverhalten des Wildes nachweislich beeinflussen. Diese anthropogenen Störungen werden im Zonensystem (Kapitel VIII) systematisch berücksichtigt.",
      "Die Fauna umfasst neben den bejagten Arten Rotwild, Schwarzwild, Rehwild und Muffelwild auch bedeutende Vorkommen von Dachs, Fuchs, Baummarder und einer wachsenden Schwarzstorch-Population am Dhron-Oberlauf. Die Avifauna ist mit Schwarzspecht, Rotmilan und Waldkauz vertreten. Die Rückkehr des Wolfes in den Hunsrück ist dokumentiert — erste Hinweise auf Durchzügler liegen seit 2024 vor.",
      "Die Flora der Wildwiesen und Äsungsflächen wird gezielt bewirtschaftet: Die drei Hauptflächen (»Big 3«) tragen Mischungen aus Klee, Luzerne und Kräutern, die als Äsungsgrundlage für das Rotwild in den Sommermonaten dienen und gleichzeitig Insektenhabitate schaffen. Die Edelkastanienbestände entlang des Südhangs liefern im Herbst eine wichtige natürliche Nahrungsquelle."
    ],
  },
  {
    number: 3,
    roman: "III",
    title: "Rotwild-Management",
    description: "Zielbestand 120 Stück. Populationsdynamik, Altersstruktur, Abschussplanung.",
    icon: DeerIcon,
    content: [
      "Das Rotwild bildet die Leitart des Reviers Merschbach. Der aktuelle Bestand wird auf 85 Stück geschätzt, bei einer Tragfähigkeit K von 120 Stück. Die Bestandserhöhung auf den Zielwert erfolgt über ein kontrolliertes Wachstum mit einer jährlichen Entnahme deutlich unterhalb des Zuwachses. Das Management folgt dem Grundsatz G01: Entnahme ≤ Zuwachs — mit einem Sicherheitspuffer von mindestens 15%.",
      "Die Altersstruktur wird über systematische Wildkamera-Auswertung und die Streckenanalyse erhoben. Zielstruktur ist eine Pyramide mit breiter Kälber- und Schmaltier-Basis, einem stabilen Mittelbau adulter Tiere (3–7 Jahre) und einem Anteil von mindestens 3–5 Hirschen über 8 Jahre. Platzhirsche (G16) werden nur in begründeten Ausnahmen entnommen — ihre Präsenz stabilisiert die Sozialstruktur und reduziert Brunftstress.",
      "Die Abschussplanung erfolgt nach dem Prinzip der maximalen nachhaltigen Entnahme (MSY). Der MSY-Rechner berücksichtigt die aktuelle Populationsgröße N, die Tragfähigkeit K, die intrinsische Wachstumsrate r_max und die Alters-/Geschlechtsstruktur. Bei N < 40% K greift Grundsatz G22: Nullentnahme. Bei N zwischen 40% und 70% K wird nur Kälberentnahme empfohlen.",
      "Das Geschlechterverhältnis wird aktiv gesteuert. Der Mindestanteil adulter Weibchen (G15) sichert die Reproduktionsbasis. Die effektive Populationsgröße Ne wird vierteljährlich berechnet — fällt sie unter 50 Individuen, warnt das System vor genetischer Drift und empfiehlt eine Reduktion der Entnahme. Diese Analyse ist im Modul »Ne-Genetik« hinterlegt.",
      "Die saisonale Bejagung folgt dem Intervallprinzip (G05): 7 Tage Jagd, 21 Tage Ruhe pro Sektor. Die Rotwild-Jagd konzentriert sich auf die Monate September (Brunft-Alterspflege) und Oktober bis Januar (Kahlwild-Regulierung). Zwischen Mai und August gilt absoluter Muttertierschutz (G23/B1). Jeder Abschuss wird digital erfasst, GPS-verortet und in die Streckenanalyse eingespeist."
    ],
  },
  {
    number: 4,
    roman: "IV",
    title: "Schwarzwild",
    description: "Bejagungsstrategie, Kirrungen, Drückjagd, Wildschadenprävention.",
    icon: BoarIcon,
    content: [
      "Das Schwarzwild stellt im Revier Merschbach die größte Herausforderung für die Wildschadenprävention dar. Die Population schwankt saisonbedingt stark — Mastjahre der Buche und Eiche können die Reproduktionsrate auf das Doppelte des Durchschnitts anheben. Die Bejagungsstrategie folgt Grundsatz G17: Bachen führend schonen, Frischlinge und Überläufer bevorzugt entnehmen.",
      "Im Revier sind fünf Kirrungspunkte genehmigt und aktiv. Jede Kirrung wird nach einem festen Schema beschickt und mittels Wildkamera überwacht. Die Auswertung der Kameradaten liefert Erkenntnisse über Rottenstruktur, Frequentierung und Tagesrhythmus. Die Kirrungspunkte sind so gewählt, dass sie abseits der Rotwild-Ruhezonen liegen und die landwirtschaftlichen Flächen im Tal flankieren.",
      "Drückjagden werden gemäß Präferenz P4 maximal zweimal pro Jahr durchgeführt, ausschließlich im Zeitraum Oktober bis Januar. Die Organisation erfolgt in Abstimmung mit den Nachbarrevieren der Hegegemeinschaft (G11). Jede Drückjagd wird mit mindestens 8 Tagen Vorlauf geplant, die Stöberhunde werden durch geprüfte Hundeführer geführt, und die Schützenstände sind auf geprüfte Kugelfangverhältnisse ausgelegt.",
      "Die Wildschadenprävention wird in enger Partnerschaft mit den Landwirten (G12) betrieben. Mais- und Kartoffelflächen werden durch mobile Elektrozäune geschützt, ergänzt durch akustische Vergrämung in der Hauptgefährdungszeit Juli bis September. Die Schadensfälle werden im Modul »Wildschaden« dokumentiert und dienen als Grundlage für die Anpassung der Bejagungsintensität.",
      "Die Seuchenlage — insbesondere die Afrikanische Schweinepest (ASP) — wird kontinuierlich beobachtet. Jedes erlegte Stück Schwarzwild wird beprobt, und die Trichinenprobe erfolgt innerhalb von 48 Stunden durch das zuständige Veterinäramt. Die Notfallpläne für einen ASP-Ausbruch sind in Kapitel XI detailliert beschrieben."
    ],
  },
  {
    number: 5,
    roman: "V",
    title: "Rehwild & Muffelwild",
    description: "Bestandspflege, Äsungsverbesserung, Biotopgestaltung.",
    icon: LeafIcon,
    content: [
      "Das Rehwild ist im Revier Merschbach flächendeckend verbreitet, mit einer geschätzten Dichte von 8–10 Stück je 100 Hektar Waldfläche. Die Bejagung orientiert sich am Verbissdruck: Grundsatz G13 fordert einen Tannenverbiss unter 10%. Das jährliche Verbissgutachten der Forstverwaltung dient als objektive Kontrollgröße. Liegt der Verbiss über dem Schwellenwert, wird die Rehwild-Entnahme im betroffenen Sektor erhöht.",
      "Die Rehwild-Jagd erfolgt überwiegend vom Ansitz (Präferenz P1: Ansitz vor Pirsch). In den Morgenstunden werden die Waldrandbereiche und Wildwiesen bejagt, am Abend die Übergangszonen zwischen Wald und Offenland. Die Intervalljagd (G05) gilt auch für das Rehwild: Die sektorweise Beunruhigung wird minimiert, um das Raumverhalten nicht zu destabilisieren.",
      "Das Muffelwild hat im Revier eine besondere Stellung. Der aktuelle Bestand von etwa 13 Stück geht auf eine Auswilderung in den 1970er Jahren zurück. Grundsatz G18 fordert die Stabilisierung auf diesem Niveau. Die Mufflons nutzen bevorzugt die steilen, südexponierten Schieferhänge am östlichen Revierrand — ein Habitat, das von anderen Schalenwildarten kaum frequentiert wird.",
      "Die Äsungsverbesserung dient beiden Arten. Die Wildwiesen werden zweimal jährlich gemäht — der erste Schnitt im Juni, der zweite im September — und mit einer Kräutermischung nachgesät, die gezielt die Winteräsung verbessert. Zusätzlich werden Obstbäume (Wildapfel, Wildbirne) an Waldrändern gepflanzt, die langfristig natürliche Äsungsinseln bilden.",
      "Die Biotopgestaltung umfasst neben den Wildwiesen auch die Anlage von Benjeshecken als Deckungsstrukturen und die Pflege von Feuchtbiotopen entlang der Dhron. Diese Maßnahmen verbessern nicht nur die Lebensraumqualität für Reh- und Muffelwild, sondern fördern gleichzeitig die Biodiversität — von der Gelbbauchunke bis zum Neuntöter."
    ],
  },
  {
    number: 6,
    roman: "VI",
    title: "Lebensraumgestaltung",
    description: "Wildwiesen (Big 3), Wasserstellen, Kastanien, Benjeshecken.",
    icon: TreeIcon,
    content: [
      "Die Lebensraumgestaltung bildet das Fundament der nachhaltigen Jagd in Merschbach. Ein Revier, das seinen Wildtieren ganzjährig hochwertige Äsung, ausreichend Deckung und störungsarme Ruhezonen bietet, reduziert Wildschäden und ermöglicht eine gesunde Populationsentwicklung. Die drei Hauptwildwiesen — intern als »Big 3« bezeichnet — umfassen insgesamt 4,2 Hektar und sind das Herzstück der Äsungsstrategie.",
      "Wildwiese 1 (»Dhronwiese«, 1,8 ha) liegt im Talboden entlang der Dhron und wird von Rotwild bevorzugt in den Abendstunden angenommen. Wildwiese 2 (»Hangwiese«, 1,2 ha) befindet sich am südexponierten Mittelhang und dient primär als Rehwild-Äsung. Wildwiese 3 (»Plateauwiese«, 1,2 ha) liegt auf dem Höhenrücken und wird besonders zur Brunftzeit vom Rotwild frequentiert. Alle drei werden nach dem Grundsatz G14 bewirtschaftet: Mindestens 3 Wildwiesen mit »Big 3«-Pflanzen aktiv.",
      "Die Saatmischung der Wildwiesen kombiniert Rotklee, Luzerne und eine Kräutermischung aus Spitzwegerich, Schafgarbe, Wegwarte und Wilde Möhre. Diese Zusammensetzung liefert eiweißreiche Äsung von Mai bis Oktober und bietet gleichzeitig Nektar- und Pollenquellen für Insekten. Die Düngung erfolgt ausschließlich organisch über Kalkung und Kompost — mineralische Dünger sind im Revier nicht zugelassen.",
      "Die Edelkastanienbestände am Südhang (ca. 0,8 ha) wurden im Rahmen eines Forstprojekts vor 15 Jahren angelegt und tragen seit 2022 regelmäßig Früchte. Im Herbst stellen die Kastanien eine wichtige Mastquelle dar, die das Schwarzwild von den landwirtschaftlichen Flächen ablenkt. Ergänzend wurden drei permanente Wasserstellen angelegt — gespeist durch Quellzuläufe — die ganzjährig Wasser führen.",
      "Die Benjeshecken (Totholzhecken) entlang der Wildwiesen-Ränder dienen als Deckung und Bruthabitat. Sie werden jährlich mit Schnittgut aus der Heckenpflege und Durchforstung ergänzt. Langfristig entwickeln sich aus ihnen naturnahe Heckenstrukturen. Zusätzlich wurden an fünf Stellen Steinhaufen als Reptilienhabitate angelegt — ein Beitrag zur Biodiversität, der über die jagdliche Nutzung hinausgeht."
    ],
  },
  {
    number: 7,
    roman: "VII",
    title: "Jagdliche Infrastruktur",
    description: "5 Hochsitze (Typ A/B/C), Kanzeln, Leitern, DIN-Konformität.",
    icon: TowerIcon,
    content: [
      "Das Revier Merschbach verfügt über fünf fest installierte Hochsitze, die nach den Typen A (geschlossene Kanzel), B (offene Kanzel mit Dach) und C (Leiterstand) klassifiziert sind. Jeder Hochsitz wird jährlich einer Sicherheitsprüfung nach DIN EN 1176 unterzogen. Die Standorte sind so gewählt, dass sie optimale Einsichtmöglichkeiten in die Wildwechsel und Äsungsflächen bieten, ohne die Ruhezonen zu beeinträchtigen.",
      "Typ-A-Kanzeln (2 Stück) befinden sich an der Dhronwiese und am Plateaurand. Sie bieten Witterungsschutz und ermöglichen mehrstündige Ansitze auch bei Regen und Kälte. Die geschlossene Bauweise reduziert die Witterungsexposition des Schützen und damit die Streuung bei weiten Schüssen. Typ-B-Kanzeln (2 Stück) stehen an den Waldrandübergängen mit weitem Schussfeld. Typ-C-Leitern (1 Stück) dienen als flexible Ansitzmöglichkeit im Wald.",
      "Die Schussfeldpflege erfolgt jährlich im Februar/März. Dabei werden Sichtachsen freigeschnitten und Kugelfangverhältnisse überprüft. Jeder Hochsitz verfügt über eine dokumentierte Schussfeldkarte, die Entfernungsmarkierungen und die zulässigen Schusswinkel enthält. Schüsse über 150 Meter werden grundsätzlich nicht empfohlen; die durchschnittliche Schussentfernung im Revier lag 2025 bei 87 Metern.",
      "Zusätzlich zu den festen Einrichtungen werden mobile Ansitzhilfen (Drückjagdstände, Schirme) eingesetzt, insbesondere bei den jährlichen Drückjagden. Diese werden nach Gebrauch zurückgebaut, um die Störung im Revier zu minimieren. Alle Einrichtungen sind mit reflektierenden Markierungen versehen und in der digitalen Revierkarte verortet.",
      "Die Instandhaltung der Infrastruktur ist Pflicht (Grundsatz G24 Begehungsschein): Jeder Begehungsscheininhaber beteiligt sich an mindestens einem Arbeitseinsatz pro Jahr. Die Materialkosten werden über die Jagdpacht finanziert, die Arbeitsleistung erfolgt ehrenamtlich — ein Ausdruck der gemeinschaftlichen Verantwortung für das Revier."
    ],
  },
  {
    number: 8,
    roman: "VIII",
    title: "Zonensystem",
    description: "3 Zonen (A/B/C), 4 Sektoren, 7/21-Intervall, Ruhezonen.",
    icon: GridMapIcon,
    content: [
      "Das Revier Merschbach ist in drei Jagdzonen und vier Sektoren gegliedert. Dieses Zonensystem ist das Kernstück der räumlichen Jagdstrategie und stellt sicher, dass Bejagung und Ruhe in einem ausgewogenen Verhältnis stehen. Die Zonierung basiert auf der Habitatqualität, der Wildverteilung und den anthropogenen Störquellen (K81, Windpark).",
      "Zone A (ca. 80 ha) umfasst die Kernlebensräume des Rotwildes — alte Buchenbestände mit dichtem Unterwuchs, die Dhron-Aue und die angrenzenden Ruheflächen. Zone A ist Ruhezone: Grundsatz G04 verbietet jede jagdliche Aktivität ohne Sondergenehmigung. Nicht einmal das Betreten zur Kirrungspflege ist gestattet. Die Zone dient als Rückzugsraum, insbesondere während der Setzzeit und der Brunft.",
      "Zone B (ca. 140 ha) bildet die Pufferzone um Zone A und umfasst die bewirtschafteten Waldflächen und die Wildwiesen. Hier findet der Großteil der Einzeljagd statt — nach dem Intervallprinzip G05: 7 Tage Bejagung, dann 21 Tage Ruhe. Die vier Sektoren (Nord, Ost, Süd, West) rotieren so, dass zu jedem Zeitpunkt nur ein Sektor bejagt wird. Der aktive Sektor wird im Jagdkalender-Modul angezeigt.",
      "Zone C (ca. 92 ha) umfasst die Randbereiche des Reviers — landwirtschaftliche Flächen, Waldränder entlang der K81 und die Bereiche nahe des Windparks. Hier liegt der Schwerpunkt der Schwarzwild-Bejagung und der Wildschadenprävention. Die Bejagung in Zone C ist weniger restriktiv, da die Störung durch K81 und Windpark ohnehin hoch ist und das Raumverhalten des Wildes bereits gestört.",
      "Die Sektorenrotation wird zentral geplant und im digitalen Jagdkalender veröffentlicht. Jeder Begehungsscheininhaber erhält wöchentlich eine Benachrichtigung über den aktiven Sektor und die geltenden Freigaben. Verstöße gegen die Zonenordnung — insbesondere das ungenehmigte Betreten von Zone A — werden als schwerwiegende Pflichtverletzung gewertet und können den Entzug des Begehungsscheins nach sich ziehen."
    ],
  },
  {
    number: 9,
    roman: "IX",
    title: "Monitoring & Daten",
    description: "Wildkameras, Scheinwerfertaxation, Streckenanalyse, KI-Auswertung.",
    icon: CameraChartIcon,
    content: [
      "Das Monitoring im Revier Merschbach basiert auf vier Datenquellen: Wildkameras, Scheinwerfertaxation, Streckenanalyse und Revierbuch. Grundsatz G19 verpflichtet zur vierteljährlichen Auswertung der Wildkameradaten; Grundsatz G20 fordert, dass alle wesentlichen Entscheidungen auf Daten basieren. Dieses Kapitel beschreibt die Methodik und die Auswertungsprozesse.",
      "Im Revier sind 8 Wildkameras permanent installiert — 4 an Wildwechseln, 2 an Kirrungen, 2 an Wildwiesen. Die Kameras arbeiten mit Infrarot-Auslösung und speichern Datum, Uhrzeit und Temperatur zu jedem Bild. Die quartalsweise Auswertung umfasst: Artbestimmung, Individuenzählung (Rotwild nach Geweihmerkmalen), Aktivitätsmuster und Rottenstruktur (Schwarzwild).",
      "Die KI-gestützte Bildauswertung befindet sich im Aufbau. Ein Klassifikationsmodell unterscheidet bereits zuverlässig zwischen Rot-, Reh-, Schwarz- und Muffelwild. Die nächste Stufe — individuelle Erkennung anhand von Geweihmerkmalen und Fellzeichnung — wird im Rahmen des Moduls »Monitoring« entwickelt. Langfristig soll die automatisierte Auswertung die manuelle Sichtung von derzeit ca. 12.000 Bildern pro Quartal erheblich beschleunigen.",
      "Die Scheinwerfertaxation wird zweimal jährlich durchgeführt — im März (Winterbestand) und im September (nach der Setzzeit). Dabei wird eine festgelegte Transektstrecke von 14 km mit einem Handscheinwerfer abgefahren und alle beobachteten Wildtiere nach Art und Geschlecht erfasst. Die Methode liefert keine absoluten Zahlen, aber relative Trends — und damit eine Validierung der Kameradaten.",
      "Die Streckenanalyse erfasst jeden Abschuss mit: Datum, Uhrzeit, GPS-Koordinaten, Art, Geschlecht, geschätztes Alter, Aufbruchgewicht, Wildbretgewicht und Gesundheitszustand. Diese Daten fließen in das Populationsmodell ein und ermöglichen die Kalibrierung der Bestandsschätzung. Das Modul »Strecke & Schein« visualisiert die Strecke nach Saison, Sektor und Wildart."
    ],
  },
  {
    number: 10,
    roman: "X",
    title: "Philosophie & Ethik",
    description: "25 Grundsätze, Merschbach-Kodex, Waidgerechtigkeit.",
    icon: CompassIcon,
    content: [
      "Die Jagdphilosophie des Reviers Merschbach ist in 25 Grundsätzen kodifiziert, die zusammen den »Merschbach-Kodex« bilden. Diese Grundsätze sind keine unverbindlichen Empfehlungen — sie sind die Geschäftsordnung des Reviers. Jeder Begehungsscheininhaber verpflichtet sich bei Erteilung des Scheins zur Einhaltung. Eine detaillierte interaktive Darstellung findet sich im Modul »Philosophie«.",
      "Der Kodex ruht auf drei Säulen: Nachhaltigkeit (G01–G05), Waidgerechtigkeit (G06–G10) und Gemeinschaft (G11–G25). Die erste Säule stellt sicher, dass die Entnahme den Bestand langfristig nicht gefährdet. Die zweite Säule definiert ethische Standards für den Jagdvorgang selbst — vom sauberen Schuss bis zur sofortigen Nachsuche. Die dritte Säule regelt das Miteinander im Revier und die Verantwortung gegenüber Gesellschaft und Natur.",
      "Drei Grundsätze haben den Status von Blockern — ihre Verletzung ist ausnahmslos unzulässig: B1 (Muttertierschutz Mai–Oktober), B2 (Nullentnahme unter 40% K) und B3 (Zone-A-Verbot ohne Sondergenehmigung). Diese Blocker werden im System automatisch überwacht. Liegt eine Blockerbedingung vor, zeigt das Dashboard einen roten Warnhinweis.",
      "Die Waidgerechtigkeit im Sinne von Merschbach geht über die gesetzlichen Mindestanforderungen hinaus. Grundsatz G03 fordert einen »sauberen Schuss mit kurzer Fluchtdistanz« — das bedeutet in der Praxis: Kein Schuss auf flüchtiges Wild, kein Schuss ohne sicheren Kugelfang, kein Schuss auf Entfernungen über 150 Meter ohne vorherige Entfernungsmessung. Die Nachsuche wird bei jedem zweifelhaften Schuss innerhalb von 30 Minuten durch einen Nachsucheführer eingeleitet.",
      "Der Merschbach-Kodex ist ein lebendes Dokument. Einmal jährlich — am Jahresabschluss der Jagdpächter — wird er überprüft und bei Bedarf angepasst. Änderungen erfordern Einstimmigkeit aller Begehungsscheininhaber. Die aktuelle Version (v3.1, Stand Januar 2026) ist in diesem Handbuch dokumentiert und im Philosophie-Modul interaktiv abrufbar."
    ],
  },
  {
    number: 11,
    roman: "XI",
    title: "Seuchenpräventiv",
    description: "ASP, Trichinellen, Moderhinke. Protokolle und Notfallpläne.",
    icon: ShieldAlertIcon,
    content: [
      "Die Seuchenprävention ist im Revier Merschbach ein fester Bestandteil der jagdlichen Praxis. Drei Erreger stehen im Fokus: das Virus der Afrikanischen Schweinepest (ASP), Trichinella spiralis (Trichinellose bei Schwarzwild) und Dichelobacter nodosus (Moderhinke bei Muffelwild). Für jeden Erreger existiert ein gestuftes Protokoll von der Routineüberwachung bis zum Notfall.",
      "ASP-Prävention: Jedes erlegte oder verendet aufgefundene Stück Schwarzwild wird beprobt — Milzprobe und Lymphknotenprobe werden dem Veterinäramt zugestellt. Die Probenentnahme erfolgt unter Verwendung von Einmalhandschuhen, kontaminationsfreien Behältern und dokumentiertem Probentransport. Im Falle eines positiven Befundes tritt der Notfallplan in Kraft: sofortige Meldung an die Untere Jagdbehörde, Einrichtung einer Kernzone (3 km Radius), Jagdverbot für 72 Stunden, Intensivsuche nach Fallwild.",
      "Die Trichinellenuntersuchung ist für jedes erlegte Wildschwein gesetzlich vorgeschrieben. Im Revier wird die Probe durch den Erleger selbst entnommen (Zwerchfellpfeiler) und innerhalb von 48 Stunden dem amtlichen Trichinenlabor zugeführt. Das Ergebnis wird im Streckenmodul dokumentiert. Bis zum negativen Befund darf das Wildbret nicht in den Verkehr gebracht werden.",
      "Moderhinke bei Muffelwild: Die 13 Mufflons des Reviers werden besonders überwacht. Anzeichen von Klauenerkrankungen — Lahmheit, übermäßiges Liegen, geschwollene Klauen — werden dokumentiert und dem Veterinär gemeldet. Im akuten Fall kann eine Einzelentnahme durch den Revierinhaber verfügt werden, um die Ausbreitung innerhalb der Gruppe zu verhindern.",
      "Die Notfallpläne sind als Aushang an jedem Hochsitz und digital im System hinterlegt. Jeder Begehungsscheininhaber wird jährlich in den Probennahme-Protokollen geschult (G21). Die letzte Schulung fand im November 2025 statt; die nächste ist für Oktober 2026 geplant. Die Zusammenarbeit mit dem Veterinäramt Bernkastel-Wittlich ist durch einen Kooperationsvertrag geregelt."
    ],
  },
  {
    number: 12,
    roman: "XII",
    title: "Vision 2050",
    description: "Klimawandel, Wolf/Luchs, Biodiversität. Langfristplanung 24 Jahre.",
    icon: BinocularsIcon,
    content: [
      "Die Vision 2050 skizziert die langfristige Entwicklung des Reviers Merschbach über einen Horizont von 24 Jahren. Drei Megatrends werden die Jagd im Hunsrück grundlegend verändern: der Klimawandel, die Rückkehr der Großprädatoren (Wolf und Luchs) und die gesellschaftlichen Anforderungen an Biodiversität und Tierschutz. Dieses Kapitel beschreibt, wie wir uns darauf vorbereiten.",
      "Klimawandel: Die Modellierungen des DWD prognostizieren für den Hunsrück bis 2050 eine Erhöhung der Jahresmitteltemperatur um 1,5–2,0°C und eine Verschiebung der Niederschläge von Sommer in den Winter. Für das Revier bedeutet dies: längere Vegetationsperioden, häufigere Trockenstress-Phasen im Sommer, veränderte Mastjahre und eine Verschiebung der Baumartenzusammensetzung hin zu trockenheitstoleranten Arten. Die Edelkastanie wird profitieren; die Fichte wird verschwinden.",
      "Wolf und Luchs: Die Rückkehr des Wolfes in den Hunsrück ist seit 2024 durch Monitoringdaten belegt. Ein residentes Rudel wird bis 2030 erwartet. Der Luchs ist im Pfälzerwald bereits etabliert und wird den Hunsrück mittelfristig besiedeln. Beide Prädatoren werden das Raumverhalten des Rot- und Rehwildes grundlegend verändern — hin zu stärkerem Waldinnenleben und höherer Fluchtbereitschaft. Die Jagdstrategie muss angepasst werden: weniger Ansitz am offenen Feld, mehr Waldjagd.",
      "Biodiversität: Die gesellschaftliche Erwartung an Jagdreviere verschiebt sich von der reinen Wildbewirtschaftung hin zum integrierten Ökosystemmanagement. Das Revier Merschbach positioniert sich bereits heute als Biodiversitäts-Revier: Wildwiesen mit Insektenförderung, Feuchtbiotope, Steinhaufen für Reptilien, Benjeshecken für Brutvögel. Bis 2050 soll der Biodiversitätsindex (Shannon-Wiener) um 30% gegenüber 2025 gesteigert werden.",
      "Die Langfristplanung sieht vor: Aufstockung des Rotwildbestands auf 120 (Ziel: 2030), Etablierung eines genetischen Monitorings mit DNA-Proben aus Losung (Ziel: 2028), Anpassung der Waldrandgestaltung an Wolfs-Prädation (Ziel: 2032), Einführung einer vollautomatisierten Wildkamera-Auswertung mit KI (Ziel: 2027) und die Zertifizierung als »Modellrevier für nachhaltige Jagd« durch den Deutschen Jagdverband (Ziel: 2035). Diese Vision ist ambitioniert — aber jeder der 25 Grundsätze bringt uns ihr ein Stück näher."
    ],
  },
];

/* ─── Chapter Grid Landing ────────────────────────────────────────────── */

function ChapterGrid({ onSelect }: { onSelect: (num: number) => void }) {
  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="handbuch-grid">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold tracking-wide text-[#c49a2a]">
          Jagdkonzept Merschbach
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Digitales Handbuch — 12 Kapitel zur nachhaltigen Revierbewirtschaftung im Hunsrück
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chapters.map((ch) => (
          <Card
            key={ch.number}
            className="group cursor-pointer border border-[hsl(110,25%,18%)] bg-card hover:border-[#c49a2a]/40 transition-colors duration-200"
            onClick={() => onSelect(ch.number)}
            data-testid={`chapter-card-${ch.number}`}
          >
            <div className="p-5 flex flex-col h-full">
              {/* Icon + Number */}
              <div className="flex items-start justify-between mb-3">
                <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <ch.icon />
                </div>
                <span className="font-display text-lg text-[#c49a2a]/60 group-hover:text-[#c49a2a] transition-colors">
                  {ch.roman}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-sm font-semibold tracking-wide text-foreground mb-2">
                {ch.title}
              </h2>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {ch.description}
              </p>

              {/* Read more */}
              <div className="mt-3 flex items-center text-[10px] uppercase tracking-widest text-[#c49a2a]/60 group-hover:text-[#c49a2a] transition-colors">
                <span>Lesen</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Chapter Detail View ─────────────────────────────────────────────── */

function ChapterDetail({ chapterNum, onBack }: { chapterNum: number; onBack: () => void }) {
  const chapter = chapters.find((c) => c.number === chapterNum);
  if (!chapter) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
        <p className="mt-4 text-muted-foreground">Kapitel nicht gefunden.</p>
      </div>
    );
  }

  // Previous / Next
  const prevChapter = chapters.find((c) => c.number === chapterNum - 1);
  const nextChapter = chapters.find((c) => c.number === chapterNum + 1);

  return (
    <div className="max-w-4xl mx-auto" data-testid={`chapter-detail-${chapterNum}`}>
      {/* Decorative header area */}
      <div
        className="relative px-6 pt-6 pb-10"
        style={{
          background:
            "linear-gradient(180deg, hsl(130 20% 14%) 0%, hsl(130 25% 10%) 60%, hsl(130 25% 7%) 100%)",
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6 text-muted-foreground hover:text-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Alle Kapitel
        </Button>

        <div className="flex items-start gap-4">
          <div className="opacity-60">
            <chapter.icon />
          </div>
          <div>
            <span className="font-display text-2xl text-[#c49a2a]/70 tracking-wide block">
              Kapitel {chapter.roman}
            </span>
            <h1 className="font-display text-xl font-semibold tracking-wide text-foreground mt-1">
              {chapter.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">{chapter.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="prose prose-invert prose-sm max-w-none">
          {chapter.content.map((paragraph, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-foreground/85 mb-4"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          {prevChapter ? (
            <Link
              href={`/handbuch/${prevChapter.number}`}
              className="flex items-center text-sm text-muted-foreground hover:text-[#c49a2a] transition-colors"
              data-testid={`nav-prev-chapter-${prevChapter.number}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-display text-xs tracking-wide">
                {prevChapter.roman}. {prevChapter.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {nextChapter ? (
            <Link
              href={`/handbuch/${nextChapter.number}`}
              className="flex items-center text-sm text-muted-foreground hover:text-[#c49a2a] transition-colors"
              data-testid={`nav-next-chapter-${nextChapter.number}`}
            >
              <span className="font-display text-xs tracking-wide">
                {nextChapter.roman}. {nextChapter.title}
              </span>
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Handbuch Page ──────────────────────────────────────────────── */

export default function Handbuch() {
  const [matchGrid] = useRoute("/handbuch");
  const [matchChapter, params] = useRoute("/handbuch/:chapter");

  if (matchChapter && params?.chapter) {
    const chapterNum = parseInt(params.chapter, 10);
    return (
      <ChapterDetail
        chapterNum={chapterNum}
        onBack={() => {
          window.location.hash = "#/handbuch";
        }}
      />
    );
  }

  return (
    <ChapterGrid
      onSelect={(num) => {
        window.location.hash = `#/handbuch/${num}`;
      }}
    />
  );
}
