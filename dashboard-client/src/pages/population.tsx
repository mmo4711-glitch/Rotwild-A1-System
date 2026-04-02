import { useState, useMemo, useCallback } from "react";
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
import { PopulationPyramid } from "@/components/population-pyramid";
import { FanChart } from "@/components/fan-chart";
import {
  MERSCHBACH_DEFAULTS,
  runMonteCarlo,
  calculateLambda,
  calculateNe,
  calculateMSY,
  estimateRMax,
  checkPhilosophyConstraints,
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
  const [harvestRate, setHarvestRate] = useState(Math.round(MERSCHBACH_DEFAULTS.harvestRate * 100));
  const [K, setK] = useState(MERSCHBACH_DEFAULTS.K);
  const [projYears, setProjYears] = useState(MERSCHBACH_DEFAULTS.projectionYears);
  const [initialPop, setInitialPop] = useState(MERSCHBACH_DEFAULTS.initialN);
  const [showWarnings, setShowWarnings] = useState(true);
  const [simKey, setSimKey] = useState(0);

  const currentState: PopulationState = useMemo(() => {
    const ratio = initialPop / MERSCHBACH_DEFAULTS.initialN;
    return {
      juvenilMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilMale * ratio),
      juvenilFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilFemale * ratio),
      primeMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeMale * ratio),
      primeFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeFemale * ratio),
      senescentMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentMale * ratio),
      senescentFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentFemale * ratio),
    };
  }, [initialPop]);

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
  }, [simKey, K, harvestRate, projYears, initialPop]);

  const runSim = useCallback(() => setSimKey((k) => k + 1), []);

  return (
    <div className="p-4 space-y-4" data-testid="page-population">
      {/* Title */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Populationsdynamik
        </h2>
        <span className="text-xs text-muted-foreground">Rotwild · Merschbach</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
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

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-3">
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
              Stochastischer Fan-Chart ({projYears}J)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2 h-[260px]">
            <FanChart mcResult={mcResult} K={K} />
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
          <div className="grid grid-cols-5 gap-4 items-end">
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
