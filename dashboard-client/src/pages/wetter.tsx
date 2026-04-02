import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Eye,
  Moon,
} from "lucide-react";

// ── WMO Weather Code to Emoji ────────────────────────────────
function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 55) return "🌦️";
  if (code >= 56 && code <= 57) return "🌧️";
  if (code >= 61 && code <= 65) return "🌧️";
  if (code >= 66 && code <= 67) return "🌨️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

function wmoDescription(code: number): string {
  if (code === 0) return "Klar";
  if (code === 1) return "Überwiegend klar";
  if (code === 2) return "Teilweise bewölkt";
  if (code === 3) return "Bedeckt";
  if (code === 45) return "Nebel";
  if (code === 48) return "Reifnebel";
  if (code >= 51 && code <= 55) return "Nieselregen";
  if (code >= 56 && code <= 57) return "Gefrierender Niesel";
  if (code >= 61 && code <= 63) return "Regen";
  if (code >= 64 && code <= 65) return "Starkregen";
  if (code >= 66 && code <= 67) return "Gefrierender Regen";
  if (code >= 71 && code <= 75) return "Schneefall";
  if (code === 77) return "Schneegriesel";
  if (code >= 80 && code <= 82) return "Regenschauer";
  if (code >= 85 && code <= 86) return "Schneeschauer";
  if (code >= 95) return "Gewitter";
  return "Unbekannt";
}

// ── Wind Direction helpers ───────────────────────────────────
function degreesToDir(deg: number): string {
  const dirs = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

function windArrow(deg: number): string {
  // Arrow points in the direction wind is coming FROM → rotate by 180 + deg
  const arrows = ["↓", "↙", "←", "↖", "↑", "↗", "→", "↘"];
  const idx = Math.round(deg / 45) % 8;
  return arrows[idx];
}

// ── Moon Phase (pure math) ───────────────────────────────────
function getMoonPhase(date: Date): { phase: string; illumination: number; emoji: string } {
  const synodic = 29.53058770576;
  const ref = new Date(2000, 0, 6, 18, 14);
  const days = (date.getTime() - ref.getTime()) / 86400000;
  const cycle = ((days % synodic) + synodic) % synodic;
  const illumination = (1 - Math.cos((2 * Math.PI * cycle) / synodic)) / 2;

  if (cycle < 1.85) return { phase: "Neumond", illumination, emoji: "🌑" };
  if (cycle < 7.38) return { phase: "Zunehmende Sichel", illumination, emoji: "🌒" };
  if (cycle < 9.23) return { phase: "Erstes Viertel", illumination, emoji: "🌓" };
  if (cycle < 14.77) return { phase: "Zunehmend", illumination, emoji: "🌔" };
  if (cycle < 16.61) return { phase: "Vollmond", illumination, emoji: "🌕" };
  if (cycle < 22.15) return { phase: "Abnehmend", illumination, emoji: "🌖" };
  if (cycle < 23.99) return { phase: "Letztes Viertel", illumination, emoji: "🌗" };
  if (cycle < 27.68) return { phase: "Abnehmende Sichel", illumination, emoji: "🌘" };
  return { phase: "Neumond", illumination, emoji: "🌑" };
}

function moonHuntNote(phase: string): string {
  if (phase === "Vollmond") return "Hohe Nachtaktivität — Wildwechsel verstärkt, Ansitz am Abend kann produktiv sein";
  if (phase === "Neumond") return "Geringe Nachtaktivität — Wild tagsüber aktiver, Morgensitz bevorzugen";
  if (phase.startsWith("Zunehmend") || phase === "Erstes Viertel") return "Steigende Nachtaktivität";
  return "Sinkende Nachtaktivität";
}

// ── Jagdwetter scoring ───────────────────────────────────────
type JagdScore = "Optimal" | "Gut" | "Mäßig" | "Schlecht";

function scoreColor(s: JagdScore): string {
  if (s === "Optimal") return "bg-green-600 text-white";
  if (s === "Gut") return "bg-green-700/80 text-green-100";
  if (s === "Mäßig") return "bg-yellow-700/80 text-yellow-100";
  return "bg-red-700/80 text-red-100";
}

function scoreBadgeColor(s: JagdScore): string {
  if (s === "Optimal" || s === "Gut") return "bg-green-600";
  if (s === "Mäßig") return "bg-yellow-600";
  return "bg-red-600";
}

function ansitzScore(temp: number, wind: number, code: number): { score: JagdScore; details: string[] } {
  const details: string[] = [];
  let pts = 0;
  if (temp < 10) { pts++; details.push(`Temp ${temp}°C → Gut (kalt)`); }
  else { details.push(`Temp ${temp}°C → Warm`); }
  if (wind < 15) { pts++; details.push(`Wind ${wind} km/h → Gut (gering)`); }
  else { details.push(`Wind ${wind} km/h → Stark`); }
  const isRain = code >= 51;
  if (!isRain) { pts++; details.push("Kein Regen → Gut"); }
  else { details.push("Regen → Schlecht"); }

  const score: JagdScore = pts === 3 ? "Optimal" : pts === 2 ? "Gut" : pts === 1 ? "Mäßig" : "Schlecht";
  return { score, details };
}

function pirschScore(temp: number, wind: number, code: number): { score: JagdScore; details: string[] } {
  const details: string[] = [];
  let pts = 0;
  const isLightRain = code >= 51 && code <= 65;
  if (isLightRain) { pts++; details.push("Leichter Regen → Gut (deckt Geräusche)"); }
  else if (code >= 66) { details.push("Starkregen → Ungünstig"); }
  else { details.push("Trocken → Neutral"); }
  if (wind >= 5 && wind <= 15) { pts++; details.push(`Wind ${wind} km/h → Gut (Deckung)`); }
  else if (wind < 5) { details.push(`Wind ${wind} km/h → Zu wenig`); }
  else { details.push(`Wind ${wind} km/h → Zu stark`); }
  const isOvercast = code >= 2;
  if (isOvercast) { pts++; details.push("Bedeckt → Gut (kein Blenden)"); }
  else { details.push("Klar → Blendgefahr"); }

  const score: JagdScore = pts === 3 ? "Optimal" : pts === 2 ? "Gut" : pts === 1 ? "Mäßig" : "Schlecht";
  return { score, details };
}

function drueckjagdScore(wind: number, code: number, daylightH: number): { score: JagdScore; details: string[] } {
  const details: string[] = [];
  let pts = 0;
  const isStorm = code >= 95;
  const isHeavyRain = code >= 64;
  if (!isStorm && !isHeavyRain) { pts++; details.push("Kein Starkregen/Sturm → Erlaubt"); }
  else { details.push("Starkregen/Sturm → Nicht empfohlen"); }
  if (wind < 30) { pts++; details.push(`Wind ${wind} km/h → Sicher`); }
  else { details.push(`Wind ${wind} km/h → Unsicher`); }
  if (daylightH > 8) { pts++; details.push(`${daylightH.toFixed(1)}h Tageslicht → Ausreichend`); }
  else { details.push(`${daylightH.toFixed(1)}h Tageslicht → Kurz`); }

  const score: JagdScore = pts === 3 ? "Optimal" : pts === 2 ? "Gut" : pts === 1 ? "Mäßig" : "Schlecht";
  return { score, details };
}

// ── Hochsitz-Thermik (reuse from kalender) ───────────────────
const WIND_DIRS = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"] as const;
type WindDir = (typeof WIND_DIRS)[number];

const HOCHSITZ_WIND = [
  { id: "hs_01", name: "Eichenberg", optimal: "SO" as WindDir },
  { id: "hs_02", name: "Dhrontal", optimal: "SW" as WindDir },
  { id: "hs_03", name: "Windbruch", optimal: "N" as WindDir },
  { id: "hs_04", name: "K81-Rand", optimal: "W" as WindDir },
  { id: "hs_05", name: "Nordhang", optimal: "S" as WindDir },
];

function windAngle(dir: WindDir): number {
  return WIND_DIRS.indexOf(dir) * 45;
}

function windScoreFn(current: WindDir, optimal: WindDir): number {
  const diff = Math.abs(windAngle(current) - windAngle(optimal));
  const angle = Math.min(diff, 360 - diff);
  return Math.cos((angle * Math.PI) / 180);
}

function windLabel(score: number): { text: string; color: string; bg: string } {
  if (score > 0.7) return { text: "Optimal", color: "text-green-400", bg: "bg-green-900/40" };
  if (score >= 0.3) return { text: "Möglich", color: "text-yellow-400", bg: "bg-yellow-900/40" };
  return { text: "Ungünstig", color: "text-red-400", bg: "bg-red-900/40" };
}

// ── Day name helper ──────────────────────────────────────────
const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Helper: compute daily score for 7-day forecast
function dailyJagdScore(tempMax: number, tempMin: number, wind: number, code: number): JagdScore {
  const avgTemp = (tempMax + tempMin) / 2;
  const a = ansitzScore(avgTemp, wind, code);
  return a.score;
}

// ── Component ────────────────────────────────────────────────
export default function Wetter() {
  const { data: weather, isLoading, error } = useQuery<any>({
    queryKey: ["/api/weather"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/weather");
      return res.json();
    },
    refetchInterval: 600000, // 10 min
  });

  const now = new Date();
  const moon = getMoonPhase(now);

  // Moon calendar strip for current month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const moonStrip = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
    return getMoonPhase(d);
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <CloudRain className="h-5 w-5 text-[#c49a2a]" />
          <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">Wetter</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <CloudRain className="h-5 w-5 text-[#c49a2a]" />
          <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">Wetter</h1>
        </div>
        <Card className="border-red-800/50">
          <CardContent className="p-4">
            <p className="text-sm text-red-400">Wetterdaten konnten nicht geladen werden. Bitte später erneut versuchen.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = weather.current;
  const daily = weather.daily;
  const currentWindDir = degreesToDir(current.wind_direction_10m) as WindDir;

  // Daylight for today
  const todaySunrise = new Date(daily.sunrise[0]);
  const todaySunset = new Date(daily.sunset[0]);
  const daylightHours = (todaySunset.getTime() - todaySunrise.getTime()) / 3600000;

  const ansitz = ansitzScore(current.temperature_2m, current.wind_speed_10m, current.weather_code);
  const pirsch = pirschScore(current.temperature_2m, current.wind_speed_10m, current.weather_code);
  const drueck = drueckjagdScore(current.wind_speed_10m, current.weather_code, daylightHours);

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <CloudRain className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Wetter & Jagdbedingungen
        </h1>
      </div>

      {/* ── Current Weather Card ──────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-current-weather">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{wmoEmoji(current.weather_code)}</span>
              <div>
                <span className="text-4xl font-bold font-mono">{current.temperature_2m}°C</span>
                <p className="text-sm text-muted-foreground mt-1">{wmoDescription(current.weather_code)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Feuchte</p>
                  <p className="text-sm font-semibold">{current.relative_humidity_2m}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-sky-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Wind</p>
                  <p className="text-sm font-semibold">
                    {windArrow(current.wind_direction_10m)} {currentWindDir} {current.wind_speed_10m} km/h
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Druck</p>
                  <p className="text-sm font-semibold">{current.pressure_msl} hPa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-400" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min / Max</p>
                  <p className="text-sm font-semibold">{daily.temperature_2m_min[0]}° / {daily.temperature_2m_max[0]}°</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Letzte Aktualisierung: {new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
          </p>
        </CardContent>
      </Card>

      {/* ── Jagdwetter-Bewertung (3 cards) ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ansitz */}
        <Card className="border-[hsl(110,25%,18%)]" data-testid="card-ansitz">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center justify-between">
              Ansitz-Bewertung
              <Badge className={`${scoreColor(ansitz.score)} text-[10px] border-none`}>{ansitz.score}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {ansitz.details.map((d, i) => (
              <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
            ))}
          </CardContent>
        </Card>

        {/* Pirsch */}
        <Card className="border-[hsl(110,25%,18%)]" data-testid="card-pirsch">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center justify-between">
              Pirsch-Bewertung
              <Badge className={`${scoreColor(pirsch.score)} text-[10px] border-none`}>{pirsch.score}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {pirsch.details.map((d, i) => (
              <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
            ))}
          </CardContent>
        </Card>

        {/* Drückjagd */}
        <Card className="border-[hsl(110,25%,18%)]" data-testid="card-drueckjagd">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center justify-between">
              Drückjagd-Bewertung
              <Badge className={`${scoreColor(drueck.score)} text-[10px] border-none`}>{drueck.score}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-1.5">
            {drueck.details.map((d, i) => (
              <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 7-Tage-Vorhersage ─────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-forecast">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            7-Tage-Vorhersage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {daily.time.map((dateStr: string, i: number) => {
              const d = new Date(dateStr + "T12:00:00");
              const dayName = WEEKDAY_SHORT[d.getDay()];
              const isToday = i === 0;
              const dayScore = dailyJagdScore(
                daily.temperature_2m_max[i],
                daily.temperature_2m_min[i],
                daily.wind_speed_10m_max[i],
                daily.weather_code[i]
              );
              return (
                <div
                  key={dateStr}
                  className={`rounded-lg border p-2 text-center space-y-1 ${
                    isToday ? "border-[#c49a2a]/60 bg-[#c49a2a]/10" : "border-[hsl(110,25%,18%)]"
                  }`}
                  data-testid={`forecast-day-${i}`}
                >
                  <p className={`text-xs font-semibold ${isToday ? "text-[#c49a2a]" : ""}`}>
                    {isToday ? "Heute" : dayName}
                  </p>
                  <span className="text-2xl block">{wmoEmoji(daily.weather_code[i])}</span>
                  <p className="text-xs font-mono">
                    <span className="text-white">{daily.temperature_2m_max[i]}°</span>
                    <span className="text-muted-foreground"> / {daily.temperature_2m_min[i]}°</span>
                  </p>
                  <p className="text-[10px] text-blue-400">
                    {daily.precipitation_sum[i]} mm
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {windArrow(daily.wind_direction_10m_dominant[i])}{" "}
                    {degreesToDir(daily.wind_direction_10m_dominant[i])}{" "}
                    {daily.wind_speed_10m_max[i]} km/h
                  </p>
                  <Badge className={`${scoreBadgeColor(dayScore)} text-white text-[9px] border-none px-1.5`}>
                    {dayScore}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Thermik-Integration ────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-thermik">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            Hochsitz-Empfehlung — Wind {currentWindDir} {current.wind_speed_10m} km/h
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1">
            {HOCHSITZ_WIND.map((hs) => {
              const score = windScoreFn(currentWindDir, hs.optimal);
              const info = windLabel(score);
              return (
                <div
                  key={hs.id}
                  className={`flex items-center justify-between p-1.5 rounded text-xs ${info.bg}`}
                  data-testid={`wetter-hochsitz-${hs.id}`}
                >
                  <span className="font-medium">{hs.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">opt. {hs.optimal}</span>
                    <span className={`font-semibold text-[11px] ${info.color}`}>{info.text}</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        score > 0.7 ? "bg-green-400" : score >= 0.3 ? "bg-yellow-400" : "bg-red-400"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Mondkalender ──────────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-mondkalender">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Moon className="h-3.5 w-3.5" />
            Mondkalender
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-4">
          {/* Current Moon */}
          <div className="flex items-center gap-4">
            <span className="text-5xl">{moon.emoji}</span>
            <div>
              <p className="text-base font-semibold">{moon.phase}</p>
              <p className="text-sm text-muted-foreground">
                Beleuchtung: {(moon.illumination * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {moonHuntNote(moon.phase)}
              </p>
            </div>
          </div>

          {/* Monthly Moon Strip */}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              {now.toLocaleString("de-DE", { month: "long", year: "numeric" })}
            </p>
            <div className="flex gap-[3px] flex-wrap">
              {moonStrip.map((m, i) => {
                const isCurrentDay = i + 1 === now.getDate();
                const brightness = Math.round(m.illumination * 100);
                return (
                  <div
                    key={i}
                    className={`relative group ${isCurrentDay ? "ring-2 ring-[#c49a2a] rounded-full" : ""}`}
                    title={`${i + 1}. — ${m.phase} (${brightness}%)`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{
                        background: `radial-gradient(circle, hsl(50, ${brightness > 50 ? 40 : 10}%, ${
                          10 + brightness * 0.7
                        }%) 0%, hsl(220, 10%, ${5 + brightness * 0.2}%) 100%)`,
                      }}
                    />
                    <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
