import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus } from "lucide-react";
import type { CameraSighting } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

const CAMERAS = [
  { value: "wk_01", label: "Wildkamera Hauptwechsel" },
  { value: "wk_02", label: "Suhle" },
  { value: "wk_03", label: "Wildwiese Ost" },
];

const SPECIES = [
  "Rotwild",
  "Rehwild",
  "Schwarzwild",
  "Fuchs",
  "Hase",
  "Dachs",
  "Marder",
  "Unbekannt",
];

const BEHAVIORS = [
  "Äsend",
  "Ziehend",
  "Ruhend",
  "Flüchtend",
  "Sozial",
  "Sichernd",
];

const AGE_CLASSES = ["Kalb", "Adult", "Alt", "Unbekannt"];

const SPECIES_COLORS: Record<string, string> = {
  Rotwild: "#c49a2a",
  Rehwild: "#6b8e23",
  Schwarzwild: "#708090",
  Fuchs: "#cd853f",
  Hase: "#8fbc8f",
  Dachs: "#696969",
  Marder: "#a0522d",
  Unbekannt: "#778899",
};

export default function Wildkamera() {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("06:00");
  const [camera, setCamera] = useState("");
  const [species, setSpecies] = useState("");
  const [count, setCount] = useState(1);
  const [sex, setSex] = useState("Unbekannt");
  const [ageClass, setAgeClass] = useState("");
  const [behavior, setBehavior] = useState("");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");

  const { data: sightings = [], isLoading } = useQuery<CameraSighting[]>({
    queryKey: ["/api/camera-sightings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/camera-sightings");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/camera-sightings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/camera-sightings"] });
      toast({ title: "Sichtung erfasst", description: "Die Wildkamera-Sichtung wurde gespeichert." });
      setCamera("");
      setSpecies("");
      setCount(1);
      setSex("Unbekannt");
      setAgeClass("");
      setBehavior("");
      setTemperature("");
      setNotes("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Sichtung konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!camera || !species) {
      toast({ title: "Pflichtfelder", description: "Kamera und Wildart sind erforderlich.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      date,
      time,
      camera,
      species,
      count,
      sex,
      ageClass: ageClass || null,
      behavior: behavior || null,
      temperature: temperature ? parseFloat(temperature) : null,
      notes: notes || null,
      moonPhase: null,
    });
  }

  // ── Activity Clock (Radar chart by hour) ───────────────────
  const activityByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}h`,
      Rotwild: 0,
      Rehwild: 0,
      Schwarzwild: 0,
      Andere: 0,
    }));
    sightings.forEach((s) => {
      if (!s.time) return;
      const h = parseInt(s.time.split(":")[0]);
      if (isNaN(h) || h < 0 || h > 23) return;
      const c = s.count || 1;
      if (s.species === "Rotwild") hours[h].Rotwild += c;
      else if (s.species === "Rehwild") hours[h].Rehwild += c;
      else if (s.species === "Schwarzwild") hours[h].Schwarzwild += c;
      else hours[h].Andere += c;
    });
    return hours;
  }, [sightings]);

  // ── Monthly bar chart ──────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months: Record<string, Record<string, number>> = {};
    const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    monthNames.forEach((m) => {
      months[m] = {};
      SPECIES.forEach((sp) => (months[m][sp] = 0));
    });
    sightings.forEach((s) => {
      if (!s.date) return;
      const parts = s.date.split("-");
      const mi = parseInt(parts[1]) - 1;
      if (mi < 0 || mi > 11) return;
      const mName = monthNames[mi];
      const sp = s.species || "Unbekannt";
      const c = s.count || 1;
      if (months[mName][sp] !== undefined) months[mName][sp] += c;
    });
    return monthNames.map((m) => ({ month: m, ...months[m] }));
  }, [sightings]);

  const cameraLabel = (val: string) => CAMERAS.find((c) => c.value === val)?.label || val;

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Camera className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Wildkamera
        </h1>
      </div>

      {/* ── Erfassung-Formular ─────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-sighting-form">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            Sichtung erfassen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Datum</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-sighting-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Uhrzeit</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-sighting-time"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Kamera</Label>
                <Select value={camera} onValueChange={setCamera}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-camera">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Wildart</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-species">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Anzahl</Label>
                <Input
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs"
                  data-testid="input-sighting-count"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Geschlecht</Label>
                <div className="flex gap-2 mt-0.5">
                  {["♂", "♀", "Unbekannt"].map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={sex === s ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs flex-1"
                      onClick={() => setSex(s)}
                      data-testid={`button-sex-${s}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Altersklasse</Label>
                <Select value={ageClass} onValueChange={setAgeClass}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-age-class">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_CLASSES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Verhalten</Label>
                <Select value={behavior} onValueChange={setBehavior}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-behavior">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BEHAVIORS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Temperatur (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-xs"
                  data-testid="input-sighting-temp"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-3">
                <Label className="text-[10px] uppercase tracking-wider">Bemerkungen</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Beobachtungen..."
                  className="text-xs h-16"
                  data-testid="input-sighting-notes"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-[#c49a2a] hover:bg-[#b08925] text-black font-semibold text-xs"
              disabled={createMutation.isPending}
              data-testid="button-submit-sighting"
            >
              {createMutation.isPending ? "Speichern..." : "Sichtung erfassen"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Charts ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Clock */}
        <Card className="border-[hsl(110,25%,18%)]" data-testid="card-activity-clock">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Aktivitätsuhr (Sichtungen nach Stunde)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {sightings.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Noch keine Sichtungen erfasst
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={activityByHour} outerRadius="70%">
                  <PolarGrid stroke="hsl(110,25%,18%)" />
                  <PolarAngleAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  <PolarRadiusAxis tick={{ fontSize: 8, fill: "#64748b" }} />
                  <Radar name="Rotwild" dataKey="Rotwild" stroke={SPECIES_COLORS.Rotwild} fill={SPECIES_COLORS.Rotwild} fillOpacity={0.3} />
                  <Radar name="Rehwild" dataKey="Rehwild" stroke={SPECIES_COLORS.Rehwild} fill={SPECIES_COLORS.Rehwild} fillOpacity={0.3} />
                  <Radar name="Schwarzwild" dataKey="Schwarzwild" stroke={SPECIES_COLORS.Schwarzwild} fill={SPECIES_COLORS.Schwarzwild} fillOpacity={0.3} />
                  <Radar name="Andere" dataKey="Andere" stroke="#778899" fill="#778899" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Tooltip contentStyle={{ background: "hsl(110,30%,10%)", border: "1px solid hsl(110,25%,18%)", borderRadius: "6px", fontSize: "11px" }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Monthly Sightings */}
        <Card className="border-[hsl(110,25%,18%)]" data-testid="card-monthly-chart">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Sichtungen pro Monat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {sightings.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Noch keine Sichtungen erfasst
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ background: "hsl(110,30%,10%)", border: "1px solid hsl(110,25%,18%)", borderRadius: "6px", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  {SPECIES.map((sp) => (
                    <Bar key={sp} dataKey={sp} stackId="a" fill={SPECIES_COLORS[sp]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sichtungen-Tabelle ────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-sightings-table">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Sichtungen ({sightings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {sightings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Sichtungen erfasst. Verwende das Formular oben, um die erste Sichtung einzutragen.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[hsl(110,25%,18%)]">
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Datum</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Uhrzeit</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Kamera</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Wildart</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Anzahl</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Geschlecht</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Alter</TableHead>
                    <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Verhalten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sightings.map((s) => (
                    <TableRow key={s.id} className="border-b border-[hsl(110,25%,18%)]/50" data-testid={`sighting-row-${s.id}`}>
                      <TableCell className="text-xs py-1.5">{s.date}</TableCell>
                      <TableCell className="text-xs py-1.5">{s.time}</TableCell>
                      <TableCell className="text-xs py-1.5">{cameraLabel(s.camera)}</TableCell>
                      <TableCell className="text-xs py-1.5">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: SPECIES_COLORS[s.species || "Unbekannt"], color: SPECIES_COLORS[s.species || "Unbekannt"] }}>
                          {s.species}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs py-1.5 text-center">{s.count}</TableCell>
                      <TableCell className="text-xs py-1.5">{s.sex}</TableCell>
                      <TableCell className="text-xs py-1.5">{s.ageClass || "—"}</TableCell>
                      <TableCell className="text-xs py-1.5">{s.behavior || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
