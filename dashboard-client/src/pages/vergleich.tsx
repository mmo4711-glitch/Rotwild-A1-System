import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Info, PieChart as PieChartIcon, BarChart3, Camera, Target } from "lucide-react";
import { usePopulation } from "@/lib/population-context";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Harvest, CameraSighting } from "@shared/schema";

// ── Constants ─────────────────────────────────────────────────

const COLORS_SPECIES = ["#c49a2a", "#4a9e4a", "#b44040", "#6a8caf"];
const COLORS_SEX = ["#6a8caf", "#c49a2a"];
const COLORS_SECTOR = ["#4a9e4a", "#c49a2a", "#b44040", "#6a8caf"];
const MONTHS_ORDER = ["Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez", "Jan", "Feb", "Mär"];
const MONTH_MAP: Record<number, string> = {
  4: "Apr", 5: "Mai", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep",
  10: "Okt", 11: "Nov", 12: "Dez", 1: "Jan", 2: "Feb", 3: "Mär",
};

const HARVEST_PLAN = [
  { klasse: "Rotwild Kälber ♂", soll: 1, matchSpecies: "Rotwild", matchSex: "M", matchAge: ["Kalb/Kitz"] },
  { klasse: "Rotwild Kälber ♀", soll: 1, matchSpecies: "Rotwild", matchSex: "F", matchAge: ["Kalb/Kitz"] },
  { klasse: "Rotwild Prime ♂", soll: 1, matchSpecies: "Rotwild", matchSex: "M", matchAge: ["Jährling", "Adult 2-4J", "Adult 5-8J"] },
  { klasse: "Rotwild Prime ♀", soll: 0, matchSpecies: "Rotwild", matchSex: "F", matchAge: ["Jährling", "Adult 2-4J", "Adult 5-8J"] },
  { klasse: "Rotwild Seneszent ♂", soll: 0, matchSpecies: "Rotwild", matchSex: "M", matchAge: ["Alt 9+J"] },
  { klasse: "Rotwild Seneszent ♀", soll: 0, matchSpecies: "Rotwild", matchSex: "F", matchAge: ["Alt 9+J"] },
];

function getSeasonHarvests(harvests: Harvest[]): Harvest[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const startYear = m >= 4 ? y : y - 1;
  return harvests.filter((h) => {
    if (!h.date) return false;
    const [hy, hm] = h.date.split("-").map(Number);
    if (hy === startYear && hm >= 4) return true;
    if (hy === startYear + 1 && hm <= 3) return true;
    return false;
  });
}

function erfuellungColor(soll: number, ist: number): string {
  if (soll === 0) return "";
  const pct = (ist / soll) * 100;
  if (pct > 110) return "text-red-400";
  if (pct >= 90) return "text-[#4a9e4a]";
  if (pct >= 50) return "text-[#c49a2a]";
  return "text-red-400";
}

// Custom tooltip for Recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-card-border rounded p-2 shadow-lg">
      <p className="text-xs font-medium mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-[10px]" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-card-border rounded p-2 shadow-lg">
      <p className="text-xs">
        <span style={{ color: payload[0].payload.fill }}>{payload[0].name}</span>: {payload[0].value}
      </p>
    </div>
  );
}

export default function Vergleich() {
  const ctx = usePopulation();

  const seasonHarvests = useMemo(() => getSeasonHarvests(ctx.harvests), [ctx.harvests]);

  // ── Pie: by species ─────────────────────────────────────────
  const speciesData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of seasonHarvests) {
      const sp = ["Rotwild", "Rehwild", "Schwarzwild"].includes(h.species) ? h.species : "Sonstige";
      counts[sp] = (counts[sp] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [seasonHarvests]);

  // ── Pie: by sex ─────────────────────────────────────────────
  const sexData = useMemo(() => {
    const m = seasonHarvests.filter(h => h.sex === "M").length;
    const f = seasonHarvests.filter(h => h.sex === "F").length;
    return [
      { name: "♂ Männlich", value: m },
      { name: "♀ Weiblich", value: f },
    ].filter(d => d.value > 0);
  }, [seasonHarvests]);

  // ── Bar: by sector ──────────────────────────────────────────
  const sectorData = useMemo(() => {
    const counts: Record<string, number> = { Nord: 0, Ost: 0, Süd: 0, West: 0 };
    for (const h of seasonHarvests) {
      if (counts[h.sector] !== undefined) counts[h.sector]++;
    }
    return Object.entries(counts).map(([name, Strecke]) => ({ name, Strecke }));
  }, [seasonHarvests]);

  // ── Bar: by month ───────────────────────────────────────────
  const monthData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MONTHS_ORDER) counts[m] = 0;
    for (const h of seasonHarvests) {
      if (!h.date) continue;
      const month = parseInt(h.date.split("-")[1]);
      const label = MONTH_MAP[month];
      if (label) counts[label]++;
    }
    return MONTHS_ORDER.map(m => ({ name: m, Strecke: counts[m] }));
  }, [seasonHarvests]);

  // ── Average weight by species ───────────────────────────────
  const weightStats = useMemo(() => {
    const bySpecies: Record<string, number[]> = {};
    for (const h of seasonHarvests) {
      if (h.weight) {
        if (!bySpecies[h.species]) bySpecies[h.species] = [];
        bySpecies[h.species].push(h.weight);
      }
    }
    return Object.entries(bySpecies).map(([species, weights]) => ({
      species,
      avg: (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1),
      count: weights.length,
    }));
  }, [seasonHarvests]);

  // ── Soll-Ist table ──────────────────────────────────────────
  const sollIst = useMemo(() => {
    return HARVEST_PLAN.map(plan => {
      const ist = seasonHarvests.filter(h =>
        h.species === plan.matchSpecies &&
        h.sex === plan.matchSex &&
        plan.matchAge.includes(h.ageClass)
      ).length;
      const pct = plan.soll > 0 ? Math.round((ist / plan.soll) * 100) : null;
      return { ...plan, ist, pct };
    });
  }, [seasonHarvests]);

  const sollGesamt = HARVEST_PLAN.reduce((s, r) => s + r.soll, 0);
  const istGesamt = sollIst.reduce((s, r) => s + r.ist, 0);
  const pctGesamt = sollGesamt > 0 ? Math.round((istGesamt / sollGesamt) * 100) : null;

  // ── Camera sighting stats ───────────────────────────────────
  const cameraStats = useMemo(() => {
    const total = ctx.sightings.length;
    const byCamera: Record<string, number> = {};
    const bySpecies: Record<string, number> = {};
    for (const s of ctx.sightings) {
      byCamera[s.camera] = (byCamera[s.camera] || 0) + 1;
      if (s.species) {
        bySpecies[s.species] = (bySpecies[s.species] || 0) + 1;
      }
    }
    const speciesPie = Object.entries(bySpecies).map(([name, value]) => ({ name, value }));
    const cameraList = Object.entries(byCamera).map(([camera, count]) => ({ camera, count }));
    return { total, cameraList, speciesPie };
  }, [ctx.sightings]);

  const hasData = seasonHarvests.length > 0;

  return (
    <div className="p-4 space-y-6 max-w-[1200px] mx-auto" data-testid="page-vergleich">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="h-5 w-5 text-[#c49a2a]" />
          <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
            Jahresvergleich
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-8">
          Trends über mehrere Jagdjahre
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: Datengrundlage
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)] bg-[#c49a2a]/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#c49a2a] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-foreground font-medium mb-1">Datengrundlage</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Für aussagekräftige Trends werden mindestens 3 Jagdjahre benötigt.
                Erfassen Sie ab sofort konsequent alle Strecken und Beobachtungen,
                um in den kommenden Jahren fundierte Vergleiche zu ermöglichen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: Saison 2026/27 — laufende Bilanz
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4 text-[#c49a2a]" />
            Saison 2026/27 — laufende Bilanz
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Total stat */}
          <div className="p-3 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Strecke bisher</span>
            <span className="text-2xl font-semibold font-display">
              {seasonHarvests.length}{" "}
              <span className="text-sm font-normal text-muted-foreground">Stück</span>
            </span>
          </div>

          {!hasData ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Noch keine Streckeneinträge in dieser Saison vorhanden.
            </div>
          ) : (
            <>
              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pie: by species */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3 w-3" /> Nach Wildart
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={speciesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {speciesData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS_SPECIES[idx % COLORS_SPECIES.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie: by sex */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <PieChartIcon className="h-3 w-3" /> Nach Geschlecht
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sexData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {sexData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS_SEX[idx % COLORS_SEX.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar: by sector */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3" /> Nach Sektor
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sectorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,15%,20%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(110,10%,55%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(110,10%,55%)" }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Strecke" radius={[3, 3, 0, 0]}>
                        {sectorData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS_SECTOR[idx % COLORS_SECTOR.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar: by month */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3" /> Nach Monat (Apr–Mär)
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,15%,20%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(110,10%,55%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(110,10%,55%)" }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Strecke" fill="#c49a2a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average weight cards */}
              {weightStats.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Durchschnittsgewicht nach Wildart</h4>
                  <div className="flex flex-wrap gap-2">
                    {weightStats.map(ws => (
                      <div key={ws.species} className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)] min-w-[120px]">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">{ws.species}</span>
                        <span className="text-lg font-semibold font-display">
                          {ws.avg} <span className="text-xs font-normal text-muted-foreground">kg</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground block">n = {ws.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: Soll-Ist-Vergleich Abschussplan
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4 text-[#c49a2a]" />
            Soll-Ist-Vergleich Abschussplan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[hsl(110,25%,18%)]">
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Klasse</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground text-center">Soll (Abschussplan)</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground text-center">Ist (erfasst)</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground text-center">Erfüllungsgrad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sollIst.map((row) => (
                  <TableRow key={row.klasse} className="border-b border-[hsl(110,25%,18%)]/50" data-testid={`plan-row-${row.klasse}`}>
                    <TableCell className="text-xs py-1.5">{row.klasse}</TableCell>
                    <TableCell className="text-xs py-1.5 text-center font-mono">{row.soll}</TableCell>
                    <TableCell className="text-xs py-1.5 text-center font-mono">{row.ist}</TableCell>
                    <TableCell className={`text-xs py-1.5 text-center font-mono font-semibold ${row.pct !== null ? erfuellungColor(row.soll, row.ist) : "text-muted-foreground"}`}>
                      {row.pct !== null ? `${row.pct}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Gesamt row */}
                <TableRow className="border-t-2 border-[hsl(110,25%,18%)] font-semibold">
                  <TableCell className="text-xs py-2 font-bold">Gesamt</TableCell>
                  <TableCell className="text-xs py-2 text-center font-mono font-bold">{sollGesamt}</TableCell>
                  <TableCell className="text-xs py-2 text-center font-mono font-bold">{istGesamt}</TableCell>
                  <TableCell className={`text-xs py-2 text-center font-mono font-bold ${pctGesamt !== null ? erfuellungColor(sollGesamt, istGesamt) : "text-muted-foreground"}`}>
                    {pctGesamt !== null ? `${pctGesamt}%` : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> &lt;50% oder &gt;110%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c49a2a]" /> 50–90%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4a9e4a]" /> 90–110%</span>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: Wildkamera-Aktivitätsindex
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#c49a2a]" />
            Wildkamera-Aktivitätsindex
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Sichtungen gesamt</span>
              <span className="text-lg font-semibold font-display">{cameraStats.total}</span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Kameras aktiv</span>
              <span className="text-lg font-semibold font-display">{cameraStats.cameraList.length}</span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Aktivitätsindex</span>
              <span className="text-lg font-semibold font-display">{ctx.sightingIndex.toFixed(2)}</span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Begegnungsrate</span>
              <span className="text-lg font-semibold font-display text-muted-foreground">—</span>
              <span className="text-[9px] text-muted-foreground block">Kamera-Nächte noch nicht erfasst</span>
            </div>
          </div>

          {/* Sightings per camera */}
          {cameraStats.cameraList.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Sichtungen pro Kamera</h4>
              <div className="flex flex-wrap gap-2">
                {cameraStats.cameraList.map(cl => (
                  <Badge key={cl.camera} variant="outline" className="text-[10px] gap-1">
                    {cl.camera}: {cl.count}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Species pie */}
          {cameraStats.speciesPie.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <PieChartIcon className="h-3 w-3" /> Artenverteilung (Wildkamera)
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={cameraStats.speciesPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {cameraStats.speciesPie.map((_, idx) => (
                      <Cell key={idx} fill={COLORS_SPECIES[idx % COLORS_SPECIES.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {cameraStats.total === 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Noch keine Wildkamera-Sichtungen erfasst.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
