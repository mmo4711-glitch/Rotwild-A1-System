# Rotwild-A1-System

**Jagdhandbuch Merschbach — Wissenschaftlich fundierte Kern-Module**

Eigenjagdbezirk Merschbach, 312 ha, Landkreis Bernkastel-Wittlich, Rheinland-Pfalz

## Module

### 1. Populationsmodell (`src/models/population/`)
3-Stufen Leslie-Matrix (Juvenil/Prime/Seneszent × 2 Geschlechter) mit:
- **Bonenfant-Hierarchie** für Dichteabhängigkeit (nicht theta-logistisch)
- **Monte-Carlo-Simulation** mit Beta-verteilten Vitalraten (500+ Läufe)
- **Ne-Berechnung** (Effektive Populationsgröße)
- **Philosophie-Integration** (G22 Jagdverzicht, G23 Muttertierschutz, G15 Sozialstruktur)

Parameter validiert gegen:
- Isle of Rum 50-Jahres-Studie (Rose et al. 1998, Clutton-Brock)
- Gaillard et al. 2000 (Annual Review: Vitalraten-Variabilität)
- Carpio et al. 2021 (PeerJ: Dichteabhängigkeit bei Cervus elaphus)
- Clark et al. 2010 (Theta-logistic ist unzuverlässig)

### 2. HSI-Modell (`src/models/hsi/`)
6-Covariaten Habitat Suitability Index:
- Cover, Slope, Aspect, Disturbance, Forest%, Edge
- **Ohne Water** (irrelevant im mesischen Hunsrück, ~800mm/Jahr)
- Geometrisches Mittel (USFWS-Standard)

### 3. Geodaten (`src/geodata/`)
GeoJSON FeatureCollection mit 16 Features:
- Reviergrenze, 3 Zonen (A/B/C), 5 Hochsitze, 3 Wildkameras
- 2 Wildwechsel, K81 Störquelle, Windpark-Eisfallzone

### 4. Pipeline (`src/pipeline/`)
- Recursive Character Splitting (2000 Zeichen, 20% Overlap)
- Deutsche Satzgrenzen-Erkennung
- Fakt-Deduplizierung via String-Similarity

### 5. Health API (`src/api/`)
- `/api/health` Endpoint mit DB, BM25, Retrieval, Memory Checks

## Testergebnis

```
47 bestanden, 0 fehlgeschlagen
```

## Installation

```bash
npm install
npx ts-node tests/run-all-tests.ts
```

## Abhängigkeiten (Minimal-Stack)

| Paket | Größe | Zweck |
|-------|-------|-------|
| ml-matrix | 50KB | Matrixoperationen, Eigenwerte |
| simple-statistics | 30KB | Monte-Carlo, Beta-Verteilung |
| string-similarity | 5KB | Fakt-Deduplizierung |

Gesamt: ~85KB (kein mathjs 700KB, kein leaflet.heat, kein prom-client)

## Lizenz

Privat — Eigenjagdbezirk Merschbach
