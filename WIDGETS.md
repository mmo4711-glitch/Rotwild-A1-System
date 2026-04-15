# Widget-Katalog — 56 Gadgets in 15 Modulen

Jagdhandbuch Merschbach Dashboard v2.5.0 · 56 Widgets · 18 einstellbar · Alle live

---

## Populationsdynamik · `/#/population` · `pages/population.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 1 | KPI-Karten (4×) | Zahlenwert + Trend | — | `pages/population.tsx` |
| 2 | Altersklassen-Pyramide | Balkendiagramm | Über Slider | `components/population-pyramid.tsx` |
| 3 | Stochastischer Fan-Chart | Flächendiagramm | Über Slider + Toggle | `components/fan-chart.tsx` |
| 4 | λ-Zeitreihe (20J) | Liniendiagramm | Über Slider | `pages/population.tsx` (inline) |
| 5 | Sensitivitäts-Radar | Spinnendiagramm | — (berechnet) | `pages/population.tsx` (inline) |
| 6 | Szenario-Vergleich | 4-Linien-Chart | — (berechnet) | `pages/population.tsx` (inline) |

**Slider/Controls:**
- Entnahmerate: `0–30%` (Default 5%)
- Kapazität K: `30–150` (Default 62)
- Projektionsjahre: `5–20` (Default 10)
- Ausgangspopulation: Zahleneingabe (Default 45)
- Deterministisch/Stochastisch: Toggle
- Warnungen ein/aus: Toggle

**Modell:** `lib/models/population.ts` → Leslie-Matrix 6×6, Bonenfant-Hierarchie, Monte Carlo 500 Läufe

---

## Habitatbewertung · `/#/habitat` · `pages/habitat.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 7 | Leaflet-Karte | Interaktive Karte | Zoom, Pan, Klick | `components/hsi-map.tsx` |
| 8 | HSI-Gesamt-Score | Große Zahl + Badge | Per Klick auf Zone | `components/hsi-panel.tsx` |
| 9 | 6 Covariaten-Balken | Horizontale Balken | Über Was-wäre-wenn | `components/hsi-panel.tsx` |
| 10 | Was-wäre-wenn Slider (3×) | Slider | ✅ | `components/hsi-panel.tsx` |

**Kalibrierte Werte (Issue #2, `de6951f`):**
- Zone A: HSI=0.797, limitiert durch Randdichte (35 m/ha)
- Zone B: HSI=0.880, limitiert durch Deckung (55%)
- Zone C: HSI=0.708, limitiert durch Störung (150m K81)

**Modell:** `lib/models/hsi.ts` → 6 Covariaten, geometrisches Mittel, KEIN Water-Covariate
**Geodaten:** `lib/models/geodata.ts` → 20 GeoJSON-Features, OSM Relation 1258428

---

## Ne-Genetik · `/#/genetik` · `pages/genetics.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 11 | Ne-Rechner | Eingabe + Ergebnis | ✅ N + Ne/N-Slider | `pages/genetics.tsx` |
| 12 | Status-Anzeige | Farbkodiert | — (automatisch) | `pages/genetics.tsx` |
| 13 | Schwellenwert-Diagramm | Balkendiagramm | — | `pages/genetics.tsx` |

**Schwellen:** Ne<10 critically endangered, <50 endangered, <100 vulnerable, ≥100 viable

---

## Wildschaden & Abschuss · `/#/wildschaden` · `pages/wildschaden.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 14 | Risikomodell-Slider (3×) | Slider | ✅ | `pages/wildschaden.tsx` |
| 15 | Risikoindex-Anzeige | Große Zahl + Farbbalken | — (berechnet) | `pages/wildschaden.tsx` |
| 16 | Abschuss-Tabelle | Datentabelle | — (berechnet) | `pages/wildschaden.tsx` |
| 17 | Jahresabschussplan | Druckansicht | Drucken-Button | `pages/wildschaden.tsx` |

**Risikoformel:** `Risk = 0.60 × (N/K) + 0.25 × (1 - dist/1000) + 0.15 × snow_factor` (Carpio-basiert)

---

## Jahresvergleich · `/#/vergleich` · `pages/vergleich.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 18 | Strecke-Bilanz | KPI + Zahl | — | `pages/vergleich.tsx` |
| 19 | Wildart-/Geschlecht-Torte | 2× PieChart | — | `pages/vergleich.tsx` |
| 20 | Sektor-/Monats-Balken | 2× BarChart | — | `pages/vergleich.tsx` |
| 21 | Soll-Ist-Vergleich | Datentabelle | — | `pages/vergleich.tsx` |

**Datenquelle:** `GET /api/harvests` → SQLite `harvests` Tabelle

---

## Philosophie · `/#/philosophie` · `pages/philosophie.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 22 | Blocker-Karten (3×) | Rot/Grün Status | — (automatisch) | `pages/philosophie.tsx` |
| 23 | 25 Grundsätze-Liste | Scrollbare Liste | Aufklappbar | `pages/philosophie.tsx` |
| 24 | Compliance-Ring | Fortschrittsring | — (automatisch) | `pages/philosophie.tsx` |

**Blocker:** B1=G23 (Muttertierschutz Mai–Okt), B2=G22 (N/K<0.4), B3 (Zone A permanent)

---

## Jagdkalender · `/#/kalender` · `pages/kalender.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 25 | Monatskalender | 7-Spalten-Grid | ✅ Monat (< >) | `pages/kalender.tsx` |
| 26 | 7/21-Sektorrotation | Farbstreifen | — | `pages/kalender.tsx` |
| 27 | Thermik-Ampel | Dropdown + Tabelle | ✅ Wind-Dropdown | `pages/kalender.tsx` |
| 28 | Temperatur-Anzeige | Slider + Bewertung | ✅ | `pages/kalender.tsx` |

**Sektoren:** Nord (blau), Ost (grün), Süd (orange), West (lila) · 7 Jagd + 21 Ruhe
**Jagdzeiten:** 8 Wildarten nach LJG RLP

---

## Wetter · `/#/wetter` · `pages/wetter.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 29 | Aktuelles Wetter | Große Zahl + Icon | — (Live API) | `pages/wetter.tsx` |
| 30 | Jagdwetter-Bewertung (3×) | 3 Bewertungskarten | — (berechnet) | `pages/wetter.tsx` |
| 31 | 7-Tage-Vorhersage | 7 Tageskarten | — (Live API) | `pages/wetter.tsx` |
| 32 | Hochsitz-Empfehlung | Tabelle | — (automatisch) | `pages/wetter.tsx` |
| 33 | Mondkalender | Emoji + Monatsstreifen | — (berechnet) | `pages/wetter.tsx` |

**API:** Open-Meteo `api.open-meteo.com` → `GET /api/weather` (Backend-Proxy)
**Koordinaten:** lat=49.8034, lon=7.0053

---

## Strecke & Schein · `/#/strecke` · `pages/strecke.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 34 | Streckenformular | Eingabemaske | ✅ | `pages/strecke.tsx` |
| 35 | Streckenstatistik (4×) | KPI-Karten | — | `pages/strecke.tsx` |
| 36 | Strecken-Tabelle | Datentabelle | Löschbar | `pages/strecke.tsx` |
| 37 | Begehungsschein-Generator | Formular + Vorschau | ✅ | `pages/strecke.tsx` |

**API:** `GET/POST /api/harvests` · **Schema:** `shared/schema.ts` → `harvests` Tabelle

---

## Wildkamera · `/#/wildkamera` · `pages/wildkamera.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 38 | Sichtungsformular | Eingabemaske | ✅ | `pages/wildkamera.tsx` |
| 39 | Aktivitätsuhr | RadarChart | — (berechnet) | `pages/wildkamera.tsx` |
| 40 | Monatsstatistik | Gestapeltes BarChart | — (berechnet) | `pages/wildkamera.tsx` |

**API:** `GET/POST /api/camera-sightings` · **Schema:** `cameraSightings` Tabelle

---

## Reviertagebuch · `/#/tagebuch` · `pages/tagebuch.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 41 | Eintrag-Formular | Eingabemaske | ✅ | `pages/tagebuch.tsx` |
| 42 | Filter-Leiste + Timeline | Multi-Filter + Liste | ✅ 4 Filter | `pages/tagebuch.tsx` |

**Kategorien:** Beobachtung (grün), Wildschaden (rot), Maßnahme (blau), Jagd (gold), Infrastruktur (grau), Sonstiges (sage)
**API:** `GET/POST/DELETE /api/log` · **Schema:** `logEntries` Tabelle

---

## Wildwiesen · `/#/wildwiesen` · `pages/wildwiesen.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 43 | Flächen-Tabelle | Datentabelle | — | `pages/wildwiesen.tsx` |
| 44 | Saatgut-Kalkulator | Eingabe + Ergebnis | ✅ | `pages/wildwiesen.tsx` |
| 45 | Pflegekalender | Monatstabelle | — | `pages/wildwiesen.tsx` |

**Flächen:** Bergwiese Nord 1.5ha, Waldwiese Dhrontal 0.8ha, Brachfläche Windbruch 2.0ha, Randstreifen K81 0.3ha, Suhle Kimmelsberg 0.2ha = 4.8ha
**Saatgut-Preise:** WA Eifel 200€/ha, Pioniersaat 75€/ha, Blühstreifen 120€/ha, WSR 240€/ha

---

## Drückjagd · `/#/drueckjagd` · `pages/drueckjagd.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 46 | Planungsformular | Eingabemaske | ✅ | `pages/drueckjagd.tsx` |
| 47 | Standverteilung (5×) | Hochsitz-Karten | ✅ Dropdown/Stand | `pages/drueckjagd.tsx` |
| 48 | Checkliste (11 Punkte) | Checkboxen | ✅ Anklickbar | `pages/drueckjagd.tsx` |
| 49 | Sicherheitsregeln | Infobox (readonly) | — | `pages/drueckjagd.tsx` |

**Hochsitze:** HS 01 Eichenberg (SO), HS 02 Dhrontal (SW), HS 03 Windbruch (N), HS 04 K81-Rand (W), HS 05 Nordhang (S)

---

## Handbuch · `/#/handbuch` · `pages/handbuch.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 50 | Kapitel-Grid (12×) | Karten mit SVG-Emblemen | Klickbar | `pages/handbuch.tsx` |
| 51 | Kapitel-Detailansicht | Textseite + Navigation | Vor/Zurück | `pages/handbuch.tsx` |

**Kapitel:** I Manifest, II Naturraum, III Rotwild, IV Schwarzwild, V Rehwild/Muffel, VI Lebensraum, VII Infrastruktur, VIII Zonensystem, IX Monitoring, X Philosophie, XI Seuchen, XII Vision 2050

---

## System · `/#/health` + `/#/architektur` · `pages/health.tsx` + `pages/architektur.tsx`

| # | Widget | Typ | Einstellbar | Datei/Komponente |
|---|--------|-----|-------------|------------------|
| 52 | Dienststatus-Karten (6×) | Status-Badges | — | `pages/health.tsx` |
| 53 | Export-Buttons (6×) | Aktions-Buttons | ✅ Klick | `pages/health.tsx` |
| 54 | GeoJSON-Import | Drag-and-Drop | ✅ Datei-Upload | `pages/health.tsx` |
| 55 | Architektur-Diagramm | CSS-Diagramm | — | `pages/architektur.tsx` |
| 56 | Sidebar-Statusbar | Kompakte Anzeige | — (permanent) | `components/app-sidebar.tsx` |

**Statusbar:** `N: 45 (λ 0.97) | K: 62 | Ne: 43 | 4°C | NO 5 km/h`
**State:** `lib/population-context.tsx` → React Context über alle Module

---

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| Widgets gesamt | 56 |
| Einstellbar (Slider/Dropdown/Input/Toggle/Checkbox) | 18 |
| Automatisch berechnet (Modelle, API, Compliance) | 12 |
| Datenerfassungs-Formulare | 6 |
| Diagramme/Charts (Recharts + Leaflet) | 20 |
| Status: ✅ Live | 56/56 |

**Alle Dateipfade relativ zu** `dashboard-client/src/`
