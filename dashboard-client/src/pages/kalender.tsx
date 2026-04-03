import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wind,
  Thermometer,
  Moon,
  Sun,
  Eye,
} from "lucide-react";

// ── WMO Weather Code to Emoji ──────────────────────────────────
function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 56 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

// ── Wind / Thermik model ──────────────────────────────────────
const WIND_DIRS = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"] as const;
type WindDir = (typeof WIND_DIRS)[number];

const HOCHSITZ_WIND: { id: string; name: string; optimal: WindDir }[] = [
  { id: "hs_01", name: "Eichenberg", optimal: "SO" },
  { id: "hs_02", name: "Dhrontal", optimal: "SW" },
  { id: "hs_03", name: "Windbruch", optimal: "N" },
  { id: "hs_04", name: "K81-Rand", optimal: "W" },
  { id: "hs_05", name: "Nordhang", optimal: "S" },
];

function windAngle(dir: WindDir): number {
  const idx = WIND_DIRS.indexOf(dir);
  return idx * 45;
}

function windScore(current: WindDir, optimal: WindDir): number {
  const diff = Math.abs(windAngle(current) - windAngle(optimal));
  const angle = Math.min(diff, 360 - diff);
  return Math.cos((angle * Math.PI) / 180);
}

function windLabel(score: number): { text: string; color: string; bg: string } {
  if (score > 0.7) return { text: "Optimal", color: "text-green-400", bg: "bg-green-900/40" };
  if (score >= 0.3) return { text: "Möglich", color: "text-yellow-400", bg: "bg-yellow-900/40" };
  return { text: "Ungünstig", color: "text-red-400", bg: "bg-red-900/40" };
}

function tempLabel(temp: number): { text: string; color: string; detail: string } {
  if (temp < 5) return { text: "Gut", color: "text-green-400", detail: "Gut für Ansitz — Wild aktiver in der Kälte" };
  if (temp <= 15) return { text: "Neutral", color: "text-yellow-400", detail: "Neutral" };
  return { text: "Warm", color: "text-red-400", detail: "Warm — Wildaktivität eingeschränkt" };
}

// ── Moon phase ───────────────────────────────────────────────
function getMoonPhase(date: Date): { name: string; icon: string; emoji: string } {
  // Approximate moon phase using a known new moon date
  const knownNew = new Date(2026, 0, 29).getTime(); // Jan 29 2026 new moon approx
  const cycle = 29.53058867;
  const diff = (date.getTime() - knownNew) / (1000 * 60 * 60 * 24);
  const phase = ((diff % cycle) + cycle) % cycle;
  if (phase < 1.85) return { name: "Neumond", icon: "🌑", emoji: "🌑" };
  if (phase < 7.38) return { name: "Zunehmend", icon: "🌒", emoji: "🌒" };
  if (phase < 9.23) return { name: "Erstes Viertel", icon: "🌓", emoji: "🌓" };
  if (phase < 14.77) return { name: "Zunehmend", icon: "🌔", emoji: "🌔" };
  if (phase < 16.61) return { name: "Vollmond", icon: "🌕", emoji: "🌕" };
  if (phase < 22.15) return { name: "Abnehmend", icon: "🌖", emoji: "🌖" };
  if (phase < 23.99) return { name: "Letztes Viertel", icon: "🌗", emoji: "🌗" };
  if (phase < 27.68) return { name: "Abnehmend", icon: "🌘", emoji: "🌘" };
  return { name: "Neumond", icon: "🌑", emoji: "🌑" };
}

// ── Jagdzeiten (RLP) ─────────────────────────────────────────
interface Jagdzeit {
  wildart: string;
  jagdzeitStart?: [number, number]; // [month, day]
  jagdzeitEnd?: [number, number];
  schonzeitStart?: [number, number];
  schonzeitEnd?: [number, number];
  ganzjaehrig?: boolean;
  jagdzeitText: string;
  schonzeitText: string;
}

const JAGDZEITEN: Jagdzeit[] = [
  { wildart: "Rotwild Hirsche", jagdzeitStart: [8, 1], jagdzeitEnd: [1, 31], schonzeitStart: [2, 1], schonzeitEnd: [7, 31], jagdzeitText: "01.08 – 31.01", schonzeitText: "01.02 – 31.07" },
  { wildart: "Rotwild Alttiere", jagdzeitStart: [8, 1], jagdzeitEnd: [1, 31], schonzeitStart: [2, 1], schonzeitEnd: [7, 31], jagdzeitText: "01.08 – 31.01", schonzeitText: "01.02 – 31.07" },
  { wildart: "Rotwild Kälber", jagdzeitStart: [8, 1], jagdzeitEnd: [2, 28], schonzeitStart: [3, 1], schonzeitEnd: [7, 31], jagdzeitText: "01.08 – 28.02", schonzeitText: "01.03 – 31.07" },
  { wildart: "Rehwild Böcke", jagdzeitStart: [5, 1], jagdzeitEnd: [10, 15], schonzeitStart: [10, 16], schonzeitEnd: [4, 30], jagdzeitText: "01.05 – 15.10", schonzeitText: "16.10 – 30.04" },
  { wildart: "Rehwild Ricken", jagdzeitStart: [9, 1], jagdzeitEnd: [1, 31], schonzeitStart: [2, 1], schonzeitEnd: [8, 31], jagdzeitText: "01.09 – 31.01", schonzeitText: "01.02 – 31.08" },
  { wildart: "Rehwild Kitze", jagdzeitStart: [9, 1], jagdzeitEnd: [2, 28], schonzeitStart: [3, 1], schonzeitEnd: [8, 31], jagdzeitText: "01.09 – 28.02", schonzeitText: "01.03 – 31.08" },
  { wildart: "Schwarzwild", ganzjaehrig: true, jagdzeitText: "ganzjährig", schonzeitText: "—" },
  { wildart: "Fuchs", jagdzeitStart: [6, 16], jagdzeitEnd: [2, 28], schonzeitStart: [3, 1], schonzeitEnd: [6, 15], jagdzeitText: "16.06 – 28.02", schonzeitText: "01.03 – 15.06" },
];

function isInSeason(date: Date, jz: Jagdzeit): boolean {
  if (jz.ganzjaehrig) return true;
  if (!jz.jagdzeitStart || !jz.jagdzeitEnd) return false;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const [sm, sd] = jz.jagdzeitStart;
  const [em, ed] = jz.jagdzeitEnd;
  if (sm <= em) {
    // same year range
    return (m > sm || (m === sm && d >= sd)) && (m < em || (m === em && d <= ed));
  }
  // wraps around year
  return (m > sm || (m === sm && d >= sd)) || (m < em || (m === em && d <= ed));
}

function getDayStatus(date: Date): "jagd" | "schonzeit" | "eingeschraenkt" {
  // Count how many species are in season
  let inSeason = 0;
  let total = JAGDZEITEN.length;
  for (const jz of JAGDZEITEN) {
    if (isInSeason(date, jz)) inSeason++;
  }
  // May/Jun have Muttertierschutz → limited
  const m = date.getMonth() + 1;
  if (m === 5 || m === 6) return "eingeschraenkt";
  if (inSeason >= 3) return "jagd";
  if (inSeason > 0) return "eingeschraenkt";
  return "schonzeit";
}

// ── 7/21 Sector rotation ─────────────────────────────────────
const SECTORS = ["Nord", "Ost", "Süd", "West"] as const;
// Epoch: Jan 1 2026
const ROTATION_EPOCH = new Date(2026, 0, 1);

function getActiveSector(date: Date): (typeof SECTORS)[number] {
  const diff = Math.floor((date.getTime() - ROTATION_EPOCH.getTime()) / (1000 * 60 * 60 * 24));
  const cycleDay = ((diff % 28) + 28) % 28;
  const sectorIdx = Math.floor(cycleDay / 7);
  return SECTORS[sectorIdx];
}

function isRestDay(date: Date, sector: (typeof SECTORS)[number]): boolean {
  return getActiveSector(date) !== sector;
}

function isHuntingDay(date: Date, sector: (typeof SECTORS)[number]): boolean {
  return getActiveSector(date) === sector;
}

// ── G23 status ───────────────────────────────────────────────
function getG23Status(month: number): string {
  // Simplified: Apr-Sep no night hunting, Oct-Mar night hunting for SW possible
  if (month >= 4 && month <= 9) {
    return "Nachtjagd auf Schwarzwild: Genehmigungspflichtig";
  }
  return "Nachtjagd auf Schwarzwild: Mit Genehmigung möglich (Nachtsichttechnik § 40a LJG)";
}

// ── Calendar helpers ─────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=Mon ... 6=Sun
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// ── Component ────────────────────────────────────────────────
import { usePopulation } from "@/lib/population-context";

export default function Kalender() {
  const today = new Date();
  const ctx = usePopulation();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [windDir, setWindDir] = useState<WindDir>("SW");
  const [temperature, setTemperature] = useState(8);

  // Auto-sync wind direction and temperature from live weather
  useEffect(() => {
    if (ctx.currentWind && WIND_DIRS.includes(ctx.currentWind as WindDir)) {
      setWindDir(ctx.currentWind as WindDir);
    }
  }, [ctx.currentWind]);

  useEffect(() => {
    if (ctx.currentTemp !== null) {
      setTemperature(Math.round(ctx.currentTemp));
    }
  }, [ctx.currentTemp]);

  const moonToday = getMoonPhase(today);
  const tempInfo = tempLabel(temperature);
  const activeSector = getActiveSector(today);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = getFirstDayOfWeek(year, month);
    for (let i = 0; i < firstDay; i++) days.push(null);
    const daysInMonth = getDaysInMonth(year, month);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    // Pad to complete weeks
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  // 7/21 rotation strip for current month
  const rotationStrip = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { day: i + 1, sector: getActiveSector(d) };
    });
  }, [year, month]);

  const sectorColors: Record<string, string> = {
    Nord: "bg-blue-600",
    Ost: "bg-emerald-600",
    "Süd": "bg-amber-600",
    West: "bg-purple-600",
  };

  function dayCellColor(date: Date): string {
    const status = getDayStatus(date);
    const sector = getActiveSector(date);
    // Check if it's a rest day for all sectors effectively → show as rest day
    // Actually show the primary status first, then overlay rest indicator
    if (status === "jagd") return "bg-green-900/50 border-green-700/40";
    if (status === "eingeschraenkt") return "bg-yellow-900/40 border-yellow-700/30";
    return "bg-red-900/40 border-red-700/30";
  }

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Calendar className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Jagdkalender
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* ── Main Calendar Area ────────────────────────────── */}
        <div className="space-y-4">
          {/* Month Selector */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardContent className="p-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-display text-base font-semibold tracking-wide">
                {MONTH_NAMES[month]} {year}
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardContent className="p-3 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[500px]">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-[10px] font-semibold text-muted-foreground py-1 uppercase tracking-wider">
                    {wd}
                  </div>
                ))}
                {calendarDays.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="h-16 rounded" />;
                  }
                  const status = getDayStatus(date);
                  const sector = getActiveSector(date);
                  const dayIsToday = isToday(date);
                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-16 rounded border p-1 flex flex-col ${dayCellColor(date)} ${dayIsToday ? "ring-2 ring-[#c49a2a]" : ""}`}
                      data-testid={`calendar-day-${date.getDate()}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${dayIsToday ? "text-[#c49a2a]" : ""}`}>
                          {date.getDate()}
                        </span>
                        {dayIsToday && ctx.currentTemp !== null && ctx.weatherCode !== null && (
                          <span className="text-[8px] text-muted-foreground" title={`${ctx.currentTemp}°C`}>
                            {wmoEmoji(ctx.weatherCode)} {Math.round(ctx.currentTemp)}°
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-end gap-0.5">
                        <span className={`text-[8px] leading-tight font-medium px-1 rounded ${sectorColors[sector]} text-white/90`}>
                          {sector}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 7/21 Rotation Strip */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                7/21-Intervall Sektorrotation — {MONTH_NAMES[month]} {year}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex gap-[2px] flex-wrap">
                {rotationStrip.map((r) => (
                  <div
                    key={r.day}
                    className={`w-7 h-7 flex items-center justify-center rounded text-[9px] font-semibold text-white/90 ${sectorColors[r.sector]}`}
                    title={`Tag ${r.day}: Sektor ${r.sector} aktiv`}
                  >
                    {r.day}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                {SECTORS.map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-sm ${sectorColors[s]}`} />
                    <span className="text-[10px] text-muted-foreground">{s}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend + Schonzeiten Table */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                Legende & Jagdzeiten RLP
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-green-900/50 border border-green-700/40" />
                  <span className="text-[10px] text-muted-foreground">Jagd erlaubt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-red-900/40 border border-red-700/30" />
                  <span className="text-[10px] text-muted-foreground">Schonzeit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-yellow-900/40 border border-yellow-700/30" />
                  <span className="text-[10px] text-muted-foreground">Eingeschränkt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gray-700/50 border border-gray-600/30" />
                  <span className="text-[10px] text-muted-foreground">7/21-Ruhetag</span>
                </div>
              </div>

              {/* Jagdzeiten Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[hsl(110,25%,18%)]">
                      <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Wildart</TableHead>
                      <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Jagdzeit</TableHead>
                      <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Schonzeit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {JAGDZEITEN.map((jz) => {
                      const inSeason = isInSeason(new Date(year, month, 15), jz);
                      return (
                        <TableRow key={jz.wildart} className="border-b border-[hsl(110,25%,18%)]/50">
                          <TableCell className="text-xs py-1.5 font-medium">{jz.wildart}</TableCell>
                          <TableCell className="text-xs py-1.5">
                            <span className={inSeason ? "text-green-400 font-semibold" : ""}>
                              {jz.jagdzeitText}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            <span className={!inSeason ? "text-red-400 font-semibold" : ""}>
                              {jz.schonzeitText}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Sidebar: Heute + Thermik ──────────────── */}
        <div className="space-y-4">
          {/* Heute Panel */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Sun className="h-3.5 w-3.5" />
                Heute — {today.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Aktiver Sektor</span>
                  <Badge className={`${sectorColors[activeSector]} text-white border-none text-[10px]`}>
                    {activeSector}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Mondphase</span>
                  <span className="text-sm">{moonToday.emoji} {moonToday.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Jagdstatus</span>
                  <Badge variant="outline" className={`text-[10px] ${
                    getDayStatus(today) === "jagd" ? "border-green-600 text-green-400" :
                    getDayStatus(today) === "eingeschraenkt" ? "border-yellow-600 text-yellow-400" :
                    "border-red-600 text-red-400"
                  }`}>
                    {getDayStatus(today) === "jagd" ? "Jagd erlaubt" :
                     getDayStatus(today) === "eingeschraenkt" ? "Eingeschränkt" : "Schonzeit"}
                  </Badge>
                </div>
              </div>

              {/* G23 Status */}
              <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">G23 Status</span>
                <p className="text-[11px] leading-tight">{getG23Status(today.getMonth() + 1)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Thermik-Rechner */}
          <Card className="border-[hsl(110,25%,18%)]">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Wind className="h-3.5 w-3.5" />
                Thermik-Ampel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              {/* Live weather indicator */}
              {ctx.currentWind && ctx.currentTemp !== null && (
                <div className="flex items-center gap-2 p-1.5 rounded bg-[#c49a2a]/10 border border-[#c49a2a]/20">
                  <span className="text-[10px] text-[#c49a2a] font-semibold">LIVE</span>
                  <span className="text-[10px] text-muted-foreground">
                    {ctx.currentWind} {ctx.currentWindSpeed} km/h · {Math.round(ctx.currentTemp)}°C
                  </span>
                </div>
              )}

              {/* Wind Direction */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Windrichtung</label>
                <Select value={windDir} onValueChange={(v) => setWindDir(v as WindDir)}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-wind-dir">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIND_DIRS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  Temperatur (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-10"
                    max="35"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="flex-1 accent-[#c49a2a] h-1"
                    data-testid="input-temperature"
                  />
                  <span className="text-sm font-mono w-10 text-right">{temperature}°C</span>
                </div>
                <div className={`text-[11px] ${tempInfo.color}`}>
                  {tempInfo.detail}
                </div>
              </div>

              {/* Hochsitz Ratings */}
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Hochsitz-Bewertung
                </label>
                <div className="space-y-1">
                  {HOCHSITZ_WIND.map((hs) => {
                    const score = windScore(windDir, hs.optimal);
                    const info = windLabel(score);
                    return (
                      <div
                        key={hs.id}
                        className={`flex items-center justify-between p-1.5 rounded text-xs ${info.bg}`}
                        data-testid={`hochsitz-rating-${hs.id}`}
                      >
                        <span className="font-medium">{hs.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">opt. {hs.optimal}</span>
                          <span className={`font-semibold text-[11px] ${info.color}`}>{info.text}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            score > 0.7 ? "bg-green-400" : score >= 0.3 ? "bg-yellow-400" : "bg-red-400"
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optimal Hochsitze Today */}
              <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                  Optimale Hochsitze heute
                </span>
                <div className="flex flex-wrap gap-1">
                  {HOCHSITZ_WIND.filter((hs) => windScore(windDir, hs.optimal) > 0.7).map((hs) => (
                    <Badge key={hs.id} variant="outline" className="text-[10px] border-green-600 text-green-400">
                      {hs.name}
                    </Badge>
                  ))}
                  {HOCHSITZ_WIND.filter((hs) => windScore(windDir, hs.optimal) > 0.7).length === 0 && (
                    <span className="text-[11px] text-muted-foreground">Kein optimaler Hochsitz bei dieser Windrichtung</span>
                  )}
                </div>
              </div>

              {/* Moon phase impact */}
              <div className="flex items-center gap-2 text-xs">
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{moonToday.emoji} {moonToday.name} — {
                  moonToday.name === "Vollmond" ? "Hohe Nachtaktivität, Ansitz abends lohnt" :
                  moonToday.name === "Neumond" ? "Geringe Nachtaktivität, morgens gut" :
                  "Mittlere Wildaktivität"
                }</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
