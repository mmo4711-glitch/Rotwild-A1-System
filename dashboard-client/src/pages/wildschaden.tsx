import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Printer,
  Crosshair,
  TreePine,
  Snowflake,
  Info,
} from "lucide-react";
import {
  MERSCHBACH_DEFAULTS,
  calculateLambda,
  calculateMSY,
  estimateRMax,
  checkPhilosophyConstraints,
  totalN,
  totalMales,
  totalFemales,
  type PopulationState,
  type PopulationRates,
} from "@/lib/models/population";

const defaultRates: PopulationRates = {
  survival: MERSCHBACH_DEFAULTS.survival,
  fecundity: MERSCHBACH_DEFAULTS.fecundity,
  sexRatioAtBirth: MERSCHBACH_DEFAULTS.sexRatioAtBirth,
};

interface HarvestRow {
  klasse: string;
  bestand: number;
  entnahme: number;
  begruendung: string;
}

export default function Wildschaden() {
  // === Section A: Risk model sliders ===
  const [densityRatio, setDensityRatio] = useState(0.72); // N/K
  const [edgeDistance, setEdgeDistance] = useState(350); // meters
  const [snowDepth, setSnowDepth] = useState(15); // cm

  // Risk formula: Carpio et al. 2021
  const w1 = 0.60;
  const w2 = 0.25;
  const w3 = 0.15;

  const snowFactor = Math.min(snowDepth / 100, 1);
  const edgeFactor = 1 - Math.min(edgeDistance / 1000, 1);
  const risk = w1 * densityRatio + w2 * edgeFactor + w3 * snowFactor;

  const riskClassification =
    risk < 0.3
      ? { label: "Gering", color: "#4a9e4a" }
      : risk < 0.5
        ? { label: "Mittel", color: "#c49a2a" }
        : risk < 0.7
          ? { label: "Hoch", color: "#d4782a" }
          : { label: "Sehr Hoch", color: "#b44040" };

  // === Section B: Harvest optimizer ===
  const K = MERSCHBACH_DEFAULTS.K;
  const currentState: PopulationState = useMemo(() => {
    const N = Math.round(densityRatio * K);
    const ratio = N / MERSCHBACH_DEFAULTS.initialN;
    return {
      juvenilMale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilMale * ratio)),
      juvenilFemale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilFemale * ratio)),
      primeMale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeMale * ratio)),
      primeFemale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeFemale * ratio)),
      senescentMale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentMale * ratio)),
      senescentFemale: Math.max(1, Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentFemale * ratio)),
    };
  }, [densityRatio, K]);

  const N = totalN(currentState);
  const lambda = calculateLambda(currentState, defaultRates, K);
  const rMax = estimateRMax(defaultRates);
  const msy = calculateMSY(K, rMax);
  const warnings = checkPhilosophyConstraints(currentState, K);

  const month = new Date().getMonth() + 1;
  const isProtectionMonth = month >= 5 && month <= 10;
  const isLowPop = N < 0.4 * K;

  // Harvest table
  const harvestRows: HarvestRow[] = useMemo(() => {
    // Calculate recommended harvest
    const msyTotal = msy.absolute;
    // Proportional allocation by class
    return [
      {
        klasse: "Kälber ♂",
        bestand: currentState.juvenilMale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.15),
        begruendung: "30% Kälberanteil",
      },
      {
        klasse: "Kälber ♀",
        bestand: currentState.juvenilFemale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.15),
        begruendung: "30% Kälberanteil",
      },
      {
        klasse: "Prime ♂",
        bestand: currentState.primeMale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.25),
        begruendung: "25% Prime-Hirsche",
      },
      {
        klasse: "Prime ♀",
        bestand: currentState.primeFemale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.15),
        begruendung: "15% — G23 beachten",
      },
      {
        klasse: "Seneszent ♂",
        bestand: currentState.senescentMale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.20),
        begruendung: "20% Alttiere",
      },
      {
        klasse: "Seneszent ♀",
        bestand: currentState.senescentFemale,
        entnahme: isLowPop ? 0 : Math.round(msyTotal * 0.10),
        begruendung: "10% — G15 beachten",
      },
    ];
  }, [currentState, msy.absolute, isLowPop]);

  const totalHarvest = harvestRows.reduce((sum, r) => sum + r.entnahme, 0);

  return (
    <div className="p-4 space-y-4" data-testid="page-wildschaden">
      {/* Title */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Wildschaden & Abschuss
        </h2>
        <span className="text-xs text-muted-foreground">Risikomodell · Abschussplanung</span>
      </div>

      {/* === Section A: Wildschaden-Risikomodell === */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <TreePine className="h-4 w-4 text-[#c49a2a]" />
            Wildschaden-Risikomodell
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-[1fr_300px] gap-6">
            {/* Sliders */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Crosshair className="h-3.5 w-3.5" />
                  Populationsdichte (N/K): {densityRatio.toFixed(2)}
                </Label>
                <Slider
                  value={[densityRatio]}
                  onValueChange={([v]) => setDensityRatio(v)}
                  min={0}
                  max={1.5}
                  step={0.01}
                  data-testid="slider-density"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 (leer)</span>
                  <span>0.5</span>
                  <span>1.0 (K)</span>
                  <span>1.5</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <TreePine className="h-3.5 w-3.5" />
                  Abstand zur Agrarfläche: {edgeDistance}m
                </Label>
                <Slider
                  value={[edgeDistance]}
                  onValueChange={([v]) => setEdgeDistance(v)}
                  min={0}
                  max={1000}
                  step={10}
                  data-testid="slider-edge"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0m (Feldrand)</span>
                  <span>500m</span>
                  <span>1000m (tief im Wald)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Snowflake className="h-3.5 w-3.5" />
                  Schneetiefe: {snowDepth}cm
                </Label>
                <Slider
                  value={[snowDepth]}
                  onValueChange={([v]) => setSnowDepth(v)}
                  min={0}
                  max={100}
                  step={1}
                  data-testid="slider-snow"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0cm</span>
                  <span>50cm</span>
                  <span>100cm</span>
                </div>
              </div>
            </div>

            {/* Risk Meter */}
            <div className="space-y-4">
              <div className="rounded-lg border border-card-border bg-background p-4 space-y-3">
                <div className="text-xs text-muted-foreground text-center">Risikoindex</div>
                <div
                  className="text-4xl font-mono font-bold text-center"
                  style={{ color: riskClassification.color }}
                  data-testid="text-risk-value"
                >
                  {risk.toFixed(2)}
                </div>
                <Badge
                  variant="outline"
                  className="w-full justify-center text-sm py-1"
                  style={{ borderColor: riskClassification.color, color: riskClassification.color }}
                  data-testid="badge-risk-class"
                >
                  {riskClassification.label}
                </Badge>

                {/* Risk bar */}
                <div className="w-full h-3 rounded-full overflow-hidden bg-background border border-card-border">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(risk * 100, 100)}%`,
                      background: `linear-gradient(90deg, #4a9e4a 0%, #c49a2a 40%, #d4782a 60%, #b44040 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>0</span>
                  <span>0.3</span>
                  <span>0.5</span>
                  <span>0.7</span>
                  <span>1.0</span>
                </div>

                {/* Formula breakdown */}
                <div className="text-[10px] text-muted-foreground space-y-0.5 pt-2 border-t border-card-border">
                  <div className="flex justify-between">
                    <span>Dichte (w₁={w1})</span>
                    <span className="font-mono">{(w1 * densityRatio).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Randnähe (w₂={w2})</span>
                    <span className="font-mono">{(w2 * edgeFactor).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schnee (w₃={w3})</span>
                    <span className="font-mono">{(w3 * snowFactor).toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {risk > 0.6 && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg border"
                  style={{ borderColor: "#b44040", background: "#b4404010" }}
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#b44040]" />
                  <p className="text-xs text-[#b44040]">
                    Hohes Wildschadenrisiko! Vergrämungsmaßnahmen und verstärkte Bejagung empfohlen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Model status note */}
          <div className="mt-4 flex items-start gap-2 p-2.5 rounded-lg border border-card-border bg-background">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">
              Modell-Status: Hypothese — nicht kalibriert. Gewichtungen basieren auf Carpio et al. 2021 (Dichte als Primärtreiber).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* === Section B: Abschuss-Optimierer === */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#c49a2a]" />
              Abschuss-Optimierer
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="text-xs"
              data-testid="button-print"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Jahresabschussplan drucken
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          {/* MSY info */}
          <div className="p-3 rounded-lg border border-card-border bg-background">
            <p className="text-sm text-foreground">
              Bei K=<span className="font-mono font-semibold text-[#c49a2a]">{K}</span> und λ=
              <span className="font-mono font-semibold text-[#c49a2a]">{lambda.toFixed(3)}</span> beträgt der
              maximale nachhaltige Ertrag{" "}
              <span className="font-mono font-semibold text-[#c49a2a]">{msy.absolute}</span> Stück/Jahr (
              {msy.percent}%).
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Aktuelle Population: {Math.round(N)} Stück ({totalMales(currentState)} ♂ / {totalFemales(currentState)} ♀)
            </p>
          </div>

          {/* Philosophy constraint badges */}
          <div className="flex flex-wrap gap-2" data-testid="constraint-badges">
            {isLowPop ? (
              <Badge
                variant="outline"
                className="text-xs py-1 px-3"
                style={{ borderColor: "#b44040", color: "#b44040" }}
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                G22: Nullentnahme empfohlen (N &lt; 0.4K)
              </Badge>
            ) : isProtectionMonth ? (
              <Badge
                variant="outline"
                className="text-xs py-1 px-3"
                style={{ borderColor: "#c49a2a", color: "#c49a2a" }}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                G23: Kein Alttier-Abschuss Mai–Okt
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs py-1 px-3"
                style={{ borderColor: "#4a9e4a", color: "#4a9e4a" }}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Alle Hegephilosophie-Regeln eingehalten
              </Badge>
            )}
          </div>

          {/* Harvest table */}
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Klasse</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Bestand</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Empfohlene Entnahme</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Begründung</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvestRows.map((row) => (
                  <TableRow key={row.klasse} className="border-card-border">
                    <TableCell className="text-sm font-medium text-foreground">{row.klasse}</TableCell>
                    <TableCell className="text-sm font-mono text-right text-foreground">{row.bestand}</TableCell>
                    <TableCell className="text-sm font-mono text-right" data-testid={`harvest-${row.klasse}`}>
                      <span
                        className="font-semibold"
                        style={{ color: row.entnahme === 0 ? "#b44040" : "#c49a2a" }}
                      >
                        {row.entnahme}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.begruendung}</TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="border-card-border bg-background/50">
                  <TableCell className="text-sm font-semibold text-foreground">Gesamt</TableCell>
                  <TableCell className="text-sm font-mono font-semibold text-right text-foreground">
                    {Math.round(N)}
                  </TableCell>
                  <TableCell
                    className="text-sm font-mono font-semibold text-right"
                    style={{ color: "#c49a2a" }}
                  >
                    {totalHarvest}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {isLowPop ? "Keine Entnahme — Bestandsaufbau" : `MSY: ${msy.absolute} Stück/Jahr`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Additional warnings from population model */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((w) => {
                const borderColor =
                  w.level === "danger" ? "#b44040" : w.level === "warning" ? "#c49a2a" : "#5b7a8a";
                const Icon =
                  w.level === "danger" ? ShieldAlert : w.level === "warning" ? AlertTriangle : Info;
                return (
                  <div
                    key={w.code}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                    style={{ borderColor, background: `${borderColor}10` }}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: borderColor }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: borderColor }}>
                          {w.code}
                        </span>
                        <span className="text-sm font-medium text-foreground">{w.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
