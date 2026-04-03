import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Dna, AlertTriangle, CheckCircle, Info } from "lucide-react";

export default function Genetics() {
  const [totalPop, setTotalPop] = useState(45);
  const [neNRatio, setNeNRatio] = useState(0.25);

  const ne = useMemo(() => Math.round(totalPop * neNRatio), [totalPop, neNRatio]);

  const thresholds = [
    { name: "Lokales Ne", value: ne, color: ne >= 50 ? "#4a9e4a" : ne >= 10 ? "#c49a2a" : "#b44040" },
    { name: "Inzucht (10)", value: 10, color: "#b44040" },
    { name: "50/500 (50)", value: 50, color: "#c49a2a" },
    { name: "Langfrist (100)", value: 100, color: "#4a9e4a" },
  ];

  const status =
    ne < 10
      ? { label: "Kritisch", color: "#b44040", icon: AlertTriangle }
      : ne < 50
        ? { label: "Gefährdet", color: "#c49a2a", icon: AlertTriangle }
        : ne < 100
          ? { label: "Bedingt sicher", color: "#c49a2a", icon: Info }
          : { label: "Sicher", color: "#4a9e4a", icon: CheckCircle };

  const StatusIcon = status.icon;

  return (
    <div className="p-4 space-y-4" data-testid="page-genetics">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Ne-Genetik
        </h2>
        <span className="text-xs text-muted-foreground">Effektive Populationsgröße</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Calculator */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Dna className="h-4 w-4 text-[#c49a2a]" />
              Ne-Berechnung
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Zensuspopulation N</Label>
              <Input
                type="number"
                min={5}
                max={500}
                value={totalPop}
                onChange={(e) => setTotalPop(Math.max(5, Math.min(500, Number(e.target.value) || 5)))}
                className="h-8 bg-background border-border text-sm"
                data-testid="input-pop-ne"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ne/N Ratio: {neNRatio.toFixed(2)}
              </Label>
              <Slider
                value={[neNRatio]}
                onValueChange={([v]) => setNeNRatio(v)}
                min={0.15}
                max={0.33}
                step={0.01}
                data-testid="slider-ne-ratio"
              />
              <p className="text-[10px] text-muted-foreground">
                Typisch 0.15–0.33 für Cerviden (Frankham 1995)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status display */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-card-border bg-background">
              <StatusIcon className="h-8 w-8" style={{ color: status.color }} />
              <div>
                <div className="text-3xl font-mono font-bold" style={{ color: status.color }}>
                  {ne}
                </div>
                <div className="text-xs text-muted-foreground">Effektive Populationsgröße</div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: status.color, color: status.color }}
            >
              {status.label}
            </Badge>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Ne &lt; 10:</strong> Unmittelbarer
                Inzuchtverfall, genetischer Strudel wahrscheinlich.
              </p>
              <p>
                <strong className="text-foreground">Ne &lt; 50:</strong> Kurzfristig hoher
                Inzuchtkoeffizient, Fitnessverluste.
              </p>
              <p>
                <strong className="text-foreground">Ne &gt; 50:</strong> 50/500-Regel: kurzfristig
                genetisch stabil.
              </p>
              <p>
                <strong className="text-foreground">Ne &gt; 100:</strong> Langfristig adaptives
                Potenzial erhalten.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bar chart comparison */}
        <Card className="bg-card border-card-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">
              Ne vs. Schwellenwerte
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={thresholds} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,30%,16%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#8b9a7a", fontSize: 10 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                />
                <YAxis
                  tick={{ fill: "#8b9a7a", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(110,30%,16%)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a2e1a",
                    border: "1px solid #2d5016",
                    borderRadius: "6px",
                    color: "#e8e4d9",
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={50} stroke="#c49a2a" strokeDasharray="4 2" strokeWidth={1} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                  {thresholds.map((t, i) => (
                    <Cell key={i} fill={t.color} fillOpacity={i === 0 ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Meta-population context */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground">
            Meta-Populationskontext
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-muted-foreground">
            <div className="space-y-2">
              <h4 className="text-foreground font-medium text-sm">Lokale Population</h4>
              <p>
                Merschbach beherbergt eine lokale Rotwild-Teilpopulation von ca. {totalPop} Stück.
                Mit einem Ne/N-Verhältnis von {neNRatio.toFixed(2)} ergibt sich Ne ≈ {ne}.
              </p>
              <p>
                Eine isolierte Population mit Ne &lt; 50 verliert pro Generation ca. 1% Heterozygotie
                durch genetische Drift.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-foreground font-medium text-sm">Vernetzung & Genfluss</h4>
              <p>
                Im Meta-Populationsverbund (Hunsrück) kann bereits 1 effektiver Migrant pro Generation
                (OMPG = 1) den Inzuchtanstieg halbieren.
              </p>
              <p>
                Empfehlung: Wildbrücken und Korridore erhalten, um den genetischen Austausch mit
                Nachbarrevieren (Morbach, Bernkastel) zu sichern.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Referenz:</strong> Franklin (1980): 50/500-Regel;
                Frankham et al. (2014): effektive Migrantenanzahl.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
