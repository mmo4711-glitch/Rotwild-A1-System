# Jagdhandbuch Merschbach — Digital Dashboard

Wissenschaftlich fundiertes Wildtiermanagement-System für den Eigenjagdbezirk Merschbach (312 ha, Hunsrück, RLP).

## Überblick

- **17 Module** in 4 Gruppen (Übersicht, Analyse, Feld, System)
- **Populationsdynamik**: 3-Stufen Leslie-Matrix, Monte-Carlo (500 Läufe), Bonenfant-Hierarchie
- **Habitatbewertung**: 6-Covariaten HSI auf Leaflet-Karte
- **Echtzeit-Wetter**: Open-Meteo API, Jagdwetter-Bewertung, Thermik-Ampel
- **Feldtools**: Jagdkalender (7/21-Rotation), Streckenerfassung, Begehungsschein, Drückjagd-Planer
- **Philosophie-Engine**: 25 Grundsätze, 3 Blocker, Live-Compliance-Score

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS 3 |
| Charts | Recharts 2 |
| Karten | Leaflet + React-Leaflet |
| Matrixalgebra | ml-matrix (50KB) |
| Statistik | simple-statistics (30KB) |
| Datenbank | SQLite + Drizzle ORM |
| Backend | Express.js + Node.js |
| Wetter-API | Open-Meteo (kostenlos, kein API-Key) |

## Installation

```bash
git clone https://github.com/mmo4711-glitch/Rotwild-A1-System.git
cd merschbach-dashboard
npm install
npm run dev
```

## Wissenschaftliche Grundlagen

- Gaillard et al. 2000: Vitalraten-Variabilität bei Huftieren
- Rose et al. 1998: Isle of Rum Red Deer 50-Jahres-Studie
- Bonenfant et al. 2009: Dichteabhängigkeit (Fekundität → Juvenile → Adulte)
- Clark et al. 2010: Theta-logistic ist unzuverlässig
- Carpio et al. 2021: Dichteabhängigkeit bei Cervus elaphus (K=39/km², MSY 30%)
- Laumeier et al. 2025: Genetische Isolation deutscher Rotwild-AMUs
- Borowik et al. 2013: Waldhabitat-Suitability für Huftiere
- Ebert et al. 2023: Rotwilddichte im mitteleuropäischen Wald

## Module

### Übersicht
- **Handbuch**: 12 Kapitel (Manifest bis Vision 2050) mit SVG-Emblemen
- **Philosophie**: 25 Grundsätze, 3 Blocker, 4 Präferenzen, Compliance-Score

### Analyse
- **Populationsdynamik**: Altersklassen-Pyramide, Fan-Chart, λ-Zeitreihe, Sensitivitäts-Radar, Szenario-Vergleich
- **Habitatbewertung**: Leaflet-Karte, HSI pro Zone, Was-wäre-wenn-Slider
- **Ne-Genetik**: Effektive Populationsgröße, Schwellenwert-Vergleich
- **Wildschaden**: Risikomodell, Abschuss-Optimierer, Jahresabschussplan
- **Jahresvergleich**: Saison-Bilanz, Soll-Ist-Vergleich, Aktivitätsindex

### Feld
- **Jagdkalender**: Monatsansicht, 7/21-Sektorrotation, RLP-Jagdzeiten
- **Wetter**: Live Open-Meteo, Jagdwetter-Bewertung, Mondkalender
- **Strecke & Schein**: Abschusserfassung (SQLite), Begehungsschein-Generator
- **Wildkamera**: Sichtungserfassung, Aktivitätsuhr, Monatsstatistik
- **Reviertagebuch**: Chronologisches Log mit Kategorien und Filtern
- **Wildwiesen**: Flächen-Übersicht, Saatgut-Kalkulator, Pflegekalender
- **Drückjagd**: Planer, Standverteilung, Checkliste, Sicherheitsregeln

### System
- **System-Health**: Dienststatus, Datenexport (6 Formate), GeoJSON-Import
- **Architektur**: Datenfluss-Diagramm, Tech-Stack, Quellen

## Lizenz

Privat — Eigenjagdbezirk Merschbach
© 2026 Jagdhandbuch Merschbach
