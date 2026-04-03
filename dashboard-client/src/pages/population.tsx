import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  ShieldAlert,
  Play,
  Users,
  Activity,
  Target,
  Crosshair,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ReferenceArea,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
} from "recharts";
import { PopulationPyramid } from "@/components/population-pyramid";
import { FanChart } from "@/components/fan-chart";
import { usePopulation } from "@/lib/population-context";
import {
  MERSCHBACH_DEFAULTS,
  runMonteCarlo,
  runDeterministicProjection,
  calculateLambda,
  calculateNe,
  calculateMSY,
  estimateRMax,
  checkPhilosophyConstraints,
  projectOneYear,
  totalN,
  totalMales,
  totalFemales,
  type PopulationState,
  type PopulationRates,
  type PhilosophyWarning,
} from "@/lib/models/population";

const defaultRates: PopulationRates = {
  survival: MERSCHBACH_DEFAULTS.survival,
  fecundity: MERSCHBACH_DEFAULTS.fecundity,
  sexRatioAtBirth: MERSCHBACH_DEFAULTS.sexRatioAtBirth,
};

export default function Population() {
  const ctx = usePopulation();

  // Sync local sliders with context (two-way)
  const [harvestRate, setHarvestRateLocal] = useState(Math.round(ctx.harvestRate * 100));
  const [K, setKLocal] = useState(ctx.K);
  const [projYears, setProjYears] = useState(MERSCHBACH_DEFAULTS.projectionYears);
  const [initialPop, setInitialPopLocal] = useState(ctx.totalN > 0 ? Math.round(ctx.totalN) : MERSCHBACH_DEFAULTS.initialN);
  const [showWarnings, setShowWarnings] = useState(true);
  const [stochastic, setStochastic] = useState(true);
  const [simKey, setSimKey] = useState(0);

  // Push slider changes to context
  const setHarvestRate = useCallback((v: number) => {
    setHarvestRateLocal(v);
    ctx.setHarvestRate(v / 100);
  }, [ctx]);
  const setK = useCallback((v: number) => {
    setKLocal(v);
    ctx.setK(v);
  }, [ctx]);
  const setInitialPop = useCallback((v: number) => {
    setInitialPopLocal(v);
    ctx.setInitialN(v);
  }, [ctx]);

  const currentState: PopulationState = useMemo(() => {
    // Use context population directly (already accounts for harvest)
    return ctx.population;
  }, [ctx.population]);

  const targetState: PopulationState = useMemo(() => {
    const kRatio = K / MERSCHBACH_DEFAULTS.K;
    return {
      juvenilMale: Math.round(8 * kRatio),
      juvenilFemale: Math.round(8 * kRatio),
      primeMale: Math.round(12 * kRatio),
      primeFemale: Math.round(15 * kRatio),
      senescentMale: Math.round(5 * kRatio),
      senescentFemale: Math.round(8 * kRatio),
    };
  }, [K]);

  const N = totalN(currentState);
  const males = totalMales(currentState);
  const females = totalFemales(currentState);
  const lambda = calculateLambda(currentState, defaultRates, K);
  const ne = calculateNe(males, females);
  const rMax = estimateRMax(defaultRates);
  const msy = calculateMSY(K, rMax);
  const warnings = checkPhilosophyConstraints(currentState, K);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mcResult = useMemo(() => {
    return runMonteCarlo(currentState, defaultRates, K, harvestRate / 100, projYears, 200);
  }, [simKey, K, harvestRate, projYears, currentState]);

  const runSim = useCallback(() => setSimKey((k) => k + 1), []);

  // === λ Time-Series Data (20 years, deterministic) ===
  const lambdaTimeData = useMemo(() => {
    const proj = runDeterministicProjection(currentState, defaultRates, K, harvestRate / 100, 20);
    return proj.map((p) => ({
      year: p.year,
      lambda: Math.round(p.lambda * 1000) / 1000,
    }));
  }, [currentState, K, harvestRate]);

  // === Sensitivity Radar Data ===
  const sensitivityData = useMemo(() => {
    const baseLambda = calculateLambda(currentState, defaultRates, K);

    const perturbAndMeasure = (modifyRates: (r: PopulationRates) => PopulationRates): number => {
      const perturbedRates = modifyRates({ ...defaultRates });
      const perturbedLambda = calculateLambda(currentState, perturbedRates, K);
      return Math.abs(perturbedLambda - baseLambda) / baseLambda;
    };

    const axes = [
      {
        axis: "Kälberüberleben",
        value: perturbAndMeasure((r) => ({
          ...r,
          survival: { ...r.survival, calf: r.survival.calf * 1.1 },
        })),
      },
      {
        axis: "Prime-Überleben",
        value: perturbAndMeasure((r) => ({
          ...r,
          survival: { ...r.survival, prime: r.survival.prime * 1.1 },
        })),
      },
      {
        axis: "Seneszent-Überleben",
        value: perturbAndMeasure((r) => ({
          ...r,
          survival: { ...r.survival, senescent: r.survival.senescent * 1.1 },
        })),
      },
      {
        axis: "Fekundität Prime",
        value: perturbAndMeasure((r) => ({
          ...r,
          fecundity: { ...r.fecundity, prime: r.fecundity.prime * 1.1 },
        })),
      },
      {
        axis: "Fekundität Seneszent",
        value: perturbAndMeasure((r) => ({
          ...r,
          fecundity: { ...r.fecundity, senescent: r.fecundity.senescent * 1.1 },
        })),
      },
      {
        axis: "Entnahmerate",
        value: (() => {
          // Measure how 10% higher harvest rate affects λ
          const proj0 = runDeterministicProjection(currentState, defaultRates, K, harvestRate / 100, 1);
          const proj1 = runDeterministicProjection(
            currentState,
            defaultRates,
            K,
            Math.min(1, (harvestRate / 100) + 0.1),
            1
          );
          const l0 = proj0[1]?.lambda ?? 1;
          const l1 = proj1[1]?.lambda ?? 1;
          return Math.abs(l1 - l0) / Math.max(l0, 0.001);
        })(),
      },
    ];

    // Normalize to max = 1 for radar display
    const maxVal = Math.max(...axes.map((a) => a.value), 0.001);
    return axes.map((a) => ({
      axis: a.axis,
      value: Math.round((a.value / maxVal) * 100) / 100,
      raw: Math.round(a.value * 1000) / 1000,
    }));
  }, [currentState, K, harvestRate]);

  // === Scenario Comparison Data (4 harvest rates, 20 years) ===
  const scenarioData = useMemo(() => {
    const rates = [0, 0.1, 0.2, 0.3];
    const projections = rates.map((hr) =>
      runDeterministicProjection(currentState, defaultRates, K, hr, 20)
    );

    return Array.from({ length: 21 }, (_, i) => ({
      year: i,
      h0: Math.round(projections[0][i].N),
      h10: Math.round(projections[1][i].N),
      h20: Math.round(projections[2][i].N),
      h30: Math.round(projections[3][i].N),
    }));
  }, [currentState, K]);

  return (
    <div className="p-4 space-y-4" data-testid="page-population">
      {/* Title */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Populationsdynamik
        </h2>
        <span className="text-xs text-muted-foreground">Rotwild · Merschbach</span>
      </div>

      {/* Harvest Season Banner */}
      {ctx.harvestedThisSeason.rotwild > 0 && (
        <div
          className="flex items-center gap-3 p-3 rounded-lg border border-[#c49a2a]/30 bg-[#c49a2a]/10"
          data-testid="banner-harvest-season"
        >
          <Target className="h-4 w-4 text-[#c49a2a] shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-[#c49a2a]">Strecke 2026/27:</span>{" "}
            {ctx.harvestedThisSeason.rotwild} Stück entnommen ({ctx.harvestedThisSeason.rotwildMale}♂ / {ctx.harvestedThisSeason.rotwildFemale}♀)
            {ctx.harvestedThisSeason.total > ctx.harvestedThisSeason.rotwild && (
              <span className="text-muted-foreground"> · + {ctx.harvestedThisSeason.total - ctx.harvestedThisSeason.rotwild} andere Wildarten</span>
            )}
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Users className="h-4 w-4" />}
          label="Bestand N"
          value={Math.round(N)}
          subtitle={`${males} M / ${females} W`}
          trend={N > K * 0.5 ? "up" : "down"}
          testId="kpi-n"
        />
        <KPICard
          icon={<Activity className="h-4 w-4" />}
          label="Wachstumsrate λ"
          value={lambda.toFixed(3)}
          subtitle={lambda > 1 ? "Wachsend" : lambda < 1 ? "Abnehmend" : "Stabil"}
          color={lambda > 1 ? "#4a9e4a" : lambda < 1 ? "#b44040" : "#c49a2a"}
          testId="kpi-lambda"
        />
        <KPICard
          icon={<Target className="h-4 w-4" />}
          label="Ne (effektiv)"
          value={Math.round(ne)}
          subtitle={ne >= 50 ? "Über 50-Schwelle" : "Unter 50-Schwelle"}
          badge={ne >= 50 ? "OK" : "Kritisch"}
          badgeColor={ne >= 50 ? "#4a9e4a" : "#b44040"}
          testId="kpi-ne"
        />
        <KPICard
          icon={<Crosshair className="h-4 w-4" />}
          label="MSY"
          value={`${msy.percent}%`}
          subtitle={`≈ ${msy.absolute} Stück/Jahr`}
          testId="kpi-msy"
        />
      </div>

      {/* Deterministic/Stochastic toggle above charts */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">Deterministisch</Label>
        <Switch
          checked={stochastic}
          onCheckedChange={setStochastic}
          data-testid="toggle-stochastic"
        />
        <Label className="text-xs text-muted-foreground">Stochastisch</Label>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Altersklassen-Pyramide
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[260px]">
            <PopulationPyramid state={currentState} targetState={targetState} />
          </CardContent>
        </Card>
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              {stochastic
                ? `Stochastischer Fan-Chart (${projYears}J)`
                : `Deterministische Projektion (${projYears}J)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[260px]">
            <FanChart mcResult={mcResult} K={K} stochastic={stochastic} />
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            Simulationsparameter
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Entnahmerate: {harvestRate.toFixed(0)}%
              </Label>
              <Slider
                value={[harvestRate]}
                onValueChange={([v]) => setHarvestRate(v)}
                min={0}
                max={30}
                step={1}
                data-testid="slider-harvest"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Kapazität K: {K}
              </Label>
              <Slider
                value={[K]}
                onValueChange={([v]) => setK(v)}
                min={30}
                max={150}
                step={1}
                data-testid="slider-k"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Projektionsjahre: {projYears}
              </Label>
              <Slider
                value={[projYears]}
                onValueChange={([v]) => setProjYears(v)}
                min={5}
                max={20}
                step={1}
                data-testid="slider-years"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ausgangspopulation</Label>
              <Input
                type="number"
                min={10}
                max={200}
                value={initialPop}
                onChange={(e) => setInitialPop(Math.max(10, Math.min(200, Number(e.target.value) || 10)))}
                className="h-8 bg-background border-border text-sm"
                data-testid="input-initial-pop"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showWarnings}
                  onCheckedChange={setShowWarnings}
                  data-testid="toggle-warnings"
                />
                <Label className="text-xs text-muted-foreground">Warnungen</Label>
              </div>
              <Button
                size="sm"
                onClick={runSim}
                className="bg-[#c49a2a] hover:bg-[#d4aa3a] text-[#0c1a0c] font-medium"
                data-testid="button-run-sim"
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Simulation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Philosophy warnings */}
      {showWarnings && warnings.length > 0 && (
        <div className="space-y-2" data-testid="warnings-panel">
          {warnings.map((w) => (
            <WarningCard key={w.code} warning={w} />
          ))}
        </div>
      )}

      {/* === NEW: 3 Analysis Cards === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card A: λ-Zeitreihe */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Wachstumsrate λ über Zeit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lambdaTimeData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,30%,16%)" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#8b9a7a", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                  label={{ value: "Jahr", position: "bottom", fill: "#8b9a7a", fontSize: 11, offset: -2 }}
                />
                <YAxis
                  domain={[0.7, 1.4]}
                  tick={{ fill: "#8b9a7a", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                  label={{ value: "λ", position: "insideLeft", fill: "#8b9a7a", fontSize: 12, angle: -90, offset: 5 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a2e1a",
                    border: "1px solid #2d5016",
                    borderRadius: "6px",
                    color: "#e8e4d9",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [value.toFixed(3), "λ"]}
                  labelFormatter={(label) => `Jahr ${label}`}
                />
                {/* Red danger zone below 0.9 */}
                <ReferenceArea y1={0.7} y2={0.9} fill="#b44040" fillOpacity={0.08} />
                {/* Green growth zone above 1.0 */}
                <ReferenceArea y1={1.0} y2={1.4} fill="#4a9e4a" fillOpacity={0.06} />
                {/* Stability threshold at λ=1 */}
                <ReferenceLine
                  y={1}
                  stroke="#c49a2a"
                  strokeDasharray="8 4"
                  strokeWidth={1.5}
                  label={{ value: "λ=1", position: "right", fill: "#c49a2a", fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="lambda"
                  stroke="#4a9e4a"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: "#4a9e4a" }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#4a9e4a] rounded" />
                λ deterministisch
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-4 h-0.5 rounded"
                  style={{
                    backgroundImage: "repeating-linear-gradient(90deg, #c49a2a 0, #c49a2a 4px, transparent 4px, transparent 8px)",
                  }}
                />
                Stabilität (λ=1)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card B: Sensitivitäts-Radar */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Sensitivitätsanalyse (±10% Perturbation)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={sensitivityData}>
                <PolarGrid stroke="hsl(110,30%,16%)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "#8b9a7a", fontSize: 9 }}
                />
                <Radar
                  name="Sensitivität"
                  dataKey="value"
                  stroke="#c49a2a"
                  fill="#c49a2a"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a2e1a",
                    border: "1px solid #2d5016",
                    borderRadius: "6px",
                    color: "#e8e4d9",
                    fontSize: 12,
                  }}
                  formatter={(_: any, __: string, props: any) => {
                    const raw = props?.payload?.raw;
                    return [raw !== undefined ? `Δλ/λ = ${raw}` : "", "Elastizität"];
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-sm bg-[#c49a2a] opacity-40" />
                Relative Elastizität (normiert)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card C: Szenario-Vergleich */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Szenario-Vergleich: Entnahmeraten
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scenarioData} margin={{ top: 5, right: 55, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,30%,16%)" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#8b9a7a", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                  label={{ value: "Jahr", position: "bottom", fill: "#8b9a7a", fontSize: 11, offset: -2 }}
                />
                <YAxis
                  tick={{ fill: "#8b9a7a", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                  label={{ value: "N", position: "insideLeft", fill: "#8b9a7a", fontSize: 12, angle: -90, offset: 5 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a2e1a",
                    border: "1px solid #2d5016",
                    borderRadius: "6px",
                    color: "#e8e4d9",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      h0: "0% Entnahme",
                      h10: "10% Entnahme",
                      h20: "20% Entnahme",
                      h30: "30% Entnahme",
                    };
                    return [Math.round(value), labels[name] || name];
                  }}
                  labelFormatter={(label) => `Jahr ${label}`}
                />
                {/* K reference line */}
                <ReferenceLine
                  y={K}
                  stroke="#8b9a7a"
                  strokeDasharray="8 4"
                  strokeWidth={1}
                  label={{ value: `K=${K}`, position: "right", fill: "#8b9a7a", fontSize: 10 }}
                />
                <Line type="monotone" dataKey="h0" stroke="#4a9e4a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="h10" stroke="#c49a2a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="h20" stroke="#d4782a" strokeWidth={2} strokeDasharray="8 4" dot={false} />
                <Line type="monotone" dataKey="h30" stroke="#b44040" strokeWidth={2} strokeDasharray="8 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#4a9e4a] rounded" />
                0%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#c49a2a] rounded" />
                10%
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-4 h-0.5 rounded"
                  style={{
                    backgroundImage: "repeating-linear-gradient(90deg, #d4782a 0, #d4782a 4px, transparent 4px, transparent 8px)",
                  }}
                />
                20%
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-4 h-0.5 rounded"
                  style={{
                    backgroundImage: "repeating-linear-gradient(90deg, #b44040 0, #b44040 4px, transparent 4px, transparent 8px)",
                  }}
                />
                30%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  subtitle,
  trend,
  color,
  badge,
  badgeColor,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  trend?: "up" | "down";
  color?: string;
  badge?: string;
  badgeColor?: string;
  testId: string;
}) {
  return (
    <Card className="bg-card border-card-border" data-testid={testId}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted-foreground">{icon}</span>
          {trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-[#4a9e4a]" />}
          {trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-[#b44040]" />}
          {badge && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
              style={{ borderColor: badgeColor, color: badgeColor }}
            >
              {badge}
            </Badge>
          )}
        </div>
        <div
          className="text-xl font-semibold font-mono"
          style={{ color: color || "#e8e4d9" }}
        >
          {value}
        </div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 opacity-70">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function WarningCard({ warning }: { warning: PhilosophyWarning }) {
  const borderColor =
    warning.level === "danger" ? "#b44040" : warning.level === "warning" ? "#c49a2a" : "#5b7a8a";
  const Icon =
    warning.level === "danger" ? ShieldAlert : warning.level === "warning" ? AlertTriangle : Info;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg border"
      style={{ borderColor, background: `${borderColor}10` }}
      data-testid={`warning-${warning.code}`}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: borderColor }} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: borderColor }}>
            {warning.code}
          </span>
          <span className="text-sm font-medium text-foreground">{warning.title}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{warning.message}</p>
      </div>
    </div>
  );
}
