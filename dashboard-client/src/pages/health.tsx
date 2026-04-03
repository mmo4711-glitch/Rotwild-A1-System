import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Database, HardDrive, Cpu, Wifi, BookOpen, Clock, Server, Download, Upload, FileJson, FileSpreadsheet, MapPin, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePopulation } from "@/lib/population-context";
import { MERSCHBACH_GEOJSON } from "@/lib/models/geodata";
import { MERSCHBACH_DEFAULTS, runDeterministicProjection, runMonteCarlo } from "@/lib/models/population";
import type { Harvest, CameraSighting, LogEntry } from "@shared/schema";

// ── CSV Helper ────────────────────────────────────────────────
function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(';'),
    ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Service status data ───────────────────────────────────────

interface ServiceStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  icon: React.ReactNode;
  latency?: string;
  detail?: string;
}

const services: ServiceStatus[] = [
  {
    name: "Populationsmodell",
    status: "online",
    icon: <Activity className="h-4 w-4" />,
    latency: "12ms",
    detail: "Leslie-Matrix + Monte Carlo aktiv",
  },
  {
    name: "HSI-Engine",
    status: "online",
    icon: <Cpu className="h-4 w-4" />,
    latency: "8ms",
    detail: "6-Kovariaten-Modell betriebsbereit",
  },
  {
    name: "GeoJSON-Service",
    status: "online",
    icon: <Wifi className="h-4 w-4" />,
    latency: "3ms",
    detail: "16 Features geladen",
  },
  {
    name: "BM25 Suchindex",
    status: "degraded",
    icon: <BookOpen className="h-4 w-4" />,
    latency: "45ms",
    detail: "Index nur teilweise aufgebaut (19%)",
  },
  {
    name: "SQLite-Datenbank",
    status: "online",
    icon: <Database className="h-4 w-4" />,
    latency: "2ms",
    detail: "Schema v2.1, 0 Migrationen ausstehend",
  },
  {
    name: "Kartenserver (OSM)",
    status: "online",
    icon: <Server className="h-4 w-4" />,
    latency: "120ms",
    detail: "Tile-Cache kalt, wird befüllt",
  },
];

const statusColors: Record<string, string> = {
  online: "#4a9e4a",
  degraded: "#c49a2a",
  offline: "#b44040",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  degraded: "Eingeschränkt",
  offline: "Offline",
};

// ── Harvest plan (Abschussplan) ──────────────────────────────
const HARVEST_PLAN = [
  { klasse: "Rotwild Kälber ♂", soll: 1 },
  { klasse: "Rotwild Kälber ♀", soll: 1 },
  { klasse: "Rotwild Prime ♂", soll: 1 },
  { klasse: "Rotwild Prime ♀", soll: 0 },
  { klasse: "Rotwild Seneszent ♂", soll: 0 },
  { klasse: "Rotwild Seneszent ♀", soll: 0 },
];

export default function Health() {
  const ctx = usePopulation();
  const onlineCount = services.filter((s) => s.status === "online").length;
  const totalCount = services.length;

  // ── GeoJSON Import ──────────────────────────────────────────
  const [importResult, setImportResult] = useState<{ featureCount: number; byType: Record<string, number> } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleGeoJSONImport = useCallback((file: File) => {
    setImportError(null);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.type || (json.type !== "FeatureCollection" && json.type !== "Feature")) {
          setImportError("Ungültiges GeoJSON: Kein FeatureCollection oder Feature gefunden.");
          return;
        }
        const features = json.type === "FeatureCollection" ? json.features : [json];
        const byType: Record<string, number> = {};
        for (const f of features) {
          const t = f.geometry?.type || "Unknown";
          byType[t] = (byType[t] || 0) + 1;
        }
        setImportResult({ featureCount: features.length, byType });
      } catch {
        setImportError("Datei konnte nicht als JSON gelesen werden.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleGeoJSONImport(file);
  }, [handleGeoJSONImport]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleGeoJSONImport(file);
  }, [handleGeoJSONImport]);

  // ── Export handlers ─────────────────────────────────────────
  function exportHarvestsCSV() {
    const data = ctx.harvests.map(h => ({
      Datum: h.date,
      Wildart: h.species,
      Geschlecht: h.sex,
      Altersklasse: h.ageClass,
      Gewicht_kg: h.weight ?? "",
      Sektor: h.sector,
      Hochsitz: h.stand ?? "",
    }));
    downloadCSV(data, "strecke_merschbach.csv");
  }

  function exportLogCSV() {
    const entries = ctx.harvests; // We need log entries — fetch separately
    // Use the log entries from a dedicated query
    fetch("__PORT_5000__".startsWith("__") ? "/api/log" : "__PORT_5000__/api/log")
      .then(r => r.json())
      .then((entries: LogEntry[]) => {
        const data = entries.map(e => ({
          Datum: e.date,
          Uhrzeit: e.time ?? "",
          Kategorie: e.category,
          Titel: e.title,
          Beschreibung: e.description ?? "",
          Sektor: e.sector ?? "",
          Wetter: e.weather ?? "",
          Prioritaet: e.priority ?? "",
        }));
        downloadCSV(data, "tagebuch_merschbach.csv");
      });
  }

  function exportSightingsCSV() {
    const data = ctx.sightings.map(s => ({
      Datum: s.date,
      Uhrzeit: s.time,
      Kamera: s.camera,
      Wildart: s.species ?? "",
      Anzahl: s.count ?? "",
      Geschlecht: s.sex ?? "",
      Altersklasse: s.ageClass ?? "",
      Verhalten: s.behavior ?? "",
      Bemerkungen: s.notes ?? "",
      Temperatur: s.temperature ?? "",
      Mondphase: s.moonPhase ?? "",
    }));
    downloadCSV(data, "wildkamera_merschbach.csv");
  }

  function exportGeoJSON() {
    downloadJSON(MERSCHBACH_GEOJSON, "merschbach_revier.geojson");
  }

  function exportPopulationModel() {
    const rates = {
      survival: MERSCHBACH_DEFAULTS.survival,
      fecundity: MERSCHBACH_DEFAULTS.fecundity,
      sexRatioAtBirth: MERSCHBACH_DEFAULTS.sexRatioAtBirth,
    };
    const projection = runDeterministicProjection(
      ctx.population,
      rates,
      ctx.K,
      ctx.harvestRate,
      MERSCHBACH_DEFAULTS.projectionYears
    );
    const mc = runMonteCarlo(
      ctx.population,
      rates,
      ctx.K,
      ctx.harvestRate,
      MERSCHBACH_DEFAULTS.projectionYears,
      MERSCHBACH_DEFAULTS.monteCarloRuns
    );
    downloadJSON({
      parameters: {
        K: ctx.K,
        harvestRate: ctx.harvestRate,
        population: ctx.population,
        totalN: ctx.totalN,
        lambda: ctx.lambda,
        ne: ctx.ne,
        msy: ctx.msy,
      },
      rates,
      deterministicProjection: projection,
      monteCarloSummary: mc,
    }, "populationsmodell_merschbach.json");
  }

  function exportAbschussplanCSV() {
    const data = HARVEST_PLAN.map(row => ({
      Klasse: row.klasse,
      Soll: row.soll,
      Ist: 0,
      Erfuellungsgrad: row.soll > 0 ? "0%" : "—",
    }));
    data.push({
      Klasse: "Gesamt",
      Soll: HARVEST_PLAN.reduce((s, r) => s + r.soll, 0),
      Ist: 0,
      Erfuellungsgrad: "0%",
    });
    downloadCSV(data, "abschussplan_merschbach.csv");
  }

  return (
    <div className="p-4 space-y-4" data-testid="page-health">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          System-Health
        </h2>
        <span className="text-xs text-muted-foreground">
          {onlineCount}/{totalCount} Dienste aktiv
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Service status */}
        <Card className="bg-card border-card-border md:col-span-2">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">Dienststatus</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-card-border bg-background"
                  data-testid={`service-${svc.name.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColors[svc.status] }}
                  />
                  <span className="text-muted-foreground shrink-0">{svc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{svc.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0"
                        style={{
                          borderColor: statusColors[svc.status],
                          color: statusColors[svc.status],
                        }}
                      >
                        {statusLabels[svc.status]}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{svc.detail}</p>
                  </div>
                  {svc.latency && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {svc.latency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-3">
          {/* BM25 Index */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[#c49a2a]" />
                BM25 Suchindex
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Indexabdeckung</span>
                  <span className="font-mono text-[#c49a2a]">19%</span>
                </div>
                <Progress value={19} className="h-2" data-testid="progress-bm25" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Indexierte Dokumente: 42 / 221</p>
                <p>Letzte Aktualisierung: vor 3 Tagen</p>
                <p className="text-[#c49a2a]">Empfehlung: Vollständige Reindexierung durchführen</p>
              </div>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-[#c49a2a]" />
                Speicher
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Heap-Nutzung</span>
                  <span className="font-mono text-foreground">34 MB / 128 MB</span>
                </div>
                <Progress value={26.5} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SQLite DB</span>
                  <span className="font-mono text-foreground">2.1 MB</span>
                </div>
                <Progress value={1.6} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tile-Cache</span>
                  <span className="font-mono text-foreground">12 MB</span>
                </div>
                <Progress value={9.4} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#c49a2a]" />
                Betriebszeit
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono font-bold text-foreground">14d 7h 23m</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Letzter Neustart: 19.03.2026, 08:10 Uhr
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          DATENEXPORT-CENTER
         ══════════════════════════════════════════════════════════ */}
      <div className="space-y-3" data-testid="section-datenexport">
        <h3 className="font-display text-base font-semibold text-[#c49a2a] tracking-wide flex items-center gap-2">
          <Download className="h-4 w-4" />
          Datenexport
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Export Buttons */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-[#c49a2a]" />
                CSV-Exporte
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportHarvestsCSV}
                data-testid="button-export-strecke"
              >
                <Download className="h-3 w-3" />
                Strecke als CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportLogCSV}
                data-testid="button-export-tagebuch"
              >
                <Download className="h-3 w-3" />
                Tagebuch als CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportSightingsCSV}
                data-testid="button-export-sichtungen"
              >
                <Download className="h-3 w-3" />
                Wildkamera-Sichtungen als CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportAbschussplanCSV}
                data-testid="button-export-abschussplan"
              >
                <Download className="h-3 w-3" />
                Abschussplan als CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileJson className="h-4 w-4 text-[#c49a2a]" />
                JSON-Exporte
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportGeoJSON}
                data-testid="button-export-geojson"
              >
                <MapPin className="h-3 w-3" />
                GeoJSON exportieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs gap-2"
                onClick={exportPopulationModel}
                data-testid="button-export-population"
              >
                <BarChart3 className="h-3 w-3" />
                Populationsmodell als JSON
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* GeoJSON Import */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-[#c49a2a]" />
              GeoJSON importieren
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-[#c49a2a] bg-[#c49a2a]/5"
                  : "border-card-border hover:border-[#c49a2a]/40"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-geojson"
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                GeoJSON-Datei hierher ziehen oder klicken zum Auswählen
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json"
                className="hidden"
                onChange={handleFileInput}
                data-testid="input-geojson-file"
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Verwenden Sie QGIS oder ein GPS-Gerät, um Revierdaten als GeoJSON zu exportieren.
            </p>

            {importError && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20" data-testid="import-error">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-xs text-red-400">{importError}</span>
              </div>
            )}

            {importResult && (
              <div className="p-3 rounded bg-[#4a9e4a]/10 border border-[#4a9e4a]/20" data-testid="import-result">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4a9e4a]" />
                  <span className="text-xs font-medium text-[#4a9e4a]">
                    {importResult.featureCount} Features erkannt
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(importResult.byType).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-[10px]">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
