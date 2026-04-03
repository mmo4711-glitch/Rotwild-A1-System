import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  CheckSquare,
  Wind,
  Printer,
  Crosshair,
  ClipboardList,
} from "lucide-react";
import { usePopulation } from "@/lib/population-context";
import { Link } from "wouter";

// ── Constants ─────────────────────────────────────────────────

const SECTORS = ["Nord", "Ost", "Süd", "West"];
const TARGET_SPECIES = ["Rotwild", "Schwarzwild", "Rehwild"];
const HOCHSITZE = [
  { id: "hs_01", name: "HS 01 — Eichenberg", sector: "Nord" },
  { id: "hs_02", name: "HS 02 — Dhrontal", sector: "Ost" },
  { id: "hs_03", name: "HS 03 — Windbruch", sector: "Süd" },
  { id: "hs_04", name: "HS 04 — K81-Rand", sector: "West" },
  { id: "hs_05", name: "HS 05 — Nordhang", sector: "Nord" },
];

const SAFETY_RULES = [
  "Kugelfang muss in jedem Schussfeld gewährleistet sein",
  "Schussrichtung: Nur in den Kugelfang, nie in Richtung anderer Stände",
  "Beginn und Ende nur auf Signal des Jagdleiters",
  "Angeschossenes Wild wird erst nach Ende der Drückjagd nachgesucht",
  "Hochsitze vor der Jagd auf Standsicherheit prüfen",
];

const CHECKLIST_ITEMS = [
  "Untere Jagdbehörde informiert (§ 25 LJG RLP)",
  "Nachbarreviere informiert",
  "Rettungsdienst/Notarzt-Nummer bereitgelegt",
  "Erste-Hilfe-Kasten vorhanden",
  "Sammelplatz festgelegt (Koordinaten)",
  "Signalkleidung für alle Teilnehmer",
  "Hundeführer bestätigt",
  "Nachsuche-Gespann organisiert",
  "Wildkammer/Kühlraum vorbereitet",
  "Strecke-Lege-Protokoll vorbereitet",
  "Wetter geprüft (Philosophie: max 2 DJ/Jahr, nur Okt–Jan)",
];

// ── Wind helpers ──────────────────────────────────────────────

function windArrow(dir: string | null): string {
  if (!dir) return "";
  const arrows: Record<string, string> = {
    N: "↑", NO: "↗", O: "→", SO: "↘",
    S: "↓", SW: "↙", W: "←", NW: "↖",
  };
  return arrows[dir] || "";
}

const OPTIMAL_WIND: Record<string, string[]> = {
  hs_01: ["S", "SW", "SO"],
  hs_02: ["W", "NW", "SW"],
  hs_03: ["N", "NO", "NW"],
  hs_04: ["O", "NO", "SO"],
  hs_05: ["S", "SW", "W"],
};

export default function Drueckjagd() {
  const ctx = usePopulation();

  // ── Form state ──────────────────────────────────────────────
  const [datum, setDatum] = useState("");
  const [zeitBeginn, setZeitBeginn] = useState("09:00");
  const [zeitEnde, setZeitEnde] = useState("14:00");
  const [sektoren, setSektoren] = useState<string[]>([]);
  const [zielwild, setZielwild] = useState<string[]>([]);
  const [schuetzen, setSchuetzen] = useState(8);
  const [treiber, setTreiber] = useState(4);
  const [hundefuehrer, setHundefuehrer] = useState(2);
  const [status, setStatus] = useState("Geplant");
  const [bemerkungen, setBemerkungen] = useState("");

  // ── Standverteilung ─────────────────────────────────────────
  const [assignments, setAssignments] = useState<Record<string, string>>({
    hs_01: "", hs_02: "", hs_03: "", hs_04: "", hs_05: "",
  });

  // ── Checklist ───────────────────────────────────────────────
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  // ── Wildbrethygiene ─────────────────────────────────────────
  const [hygiene, setHygiene] = useState("");

  const checkedCount = Object.values(checked).filter(Boolean).length;

  function toggleSektor(s: string) {
    setSektoren(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function toggleZielwild(s: string) {
    setZielwild(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }
  function toggleCheck(idx: number) {
    setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  const schuetzenOptions = useMemo(() => {
    const opts = [{ value: "", label: "Unbesetzt" }];
    for (let i = 1; i <= schuetzen; i++) {
      opts.push({ value: `jaeger-${i}`, label: `Jäger ${i}` });
    }
    return opts;
  }, [schuetzen]);

  const isDurchgefuehrt = status === "Durchgeführt";

  return (
    <div className="p-4 space-y-6 max-w-[1200px] mx-auto" data-testid="page-drueckjagd">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-5 w-5 text-[#c49a2a]" />
          <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
            Drückjagd-Planer
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-8">
          Planung, Teilnehmer, Stände, Ablauf
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: Nächste Drückjagd
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#c49a2a]" />
            Nächste Drückjagd
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Datum */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Datum</Label>
              <Input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-dj-datum"
              />
            </div>

            {/* Uhrzeit Beginn */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Uhrzeit Beginn</Label>
              <Input
                type="time"
                value={zeitBeginn}
                onChange={(e) => setZeitBeginn(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-dj-beginn"
              />
            </div>

            {/* Uhrzeit Ende */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Uhrzeit Ende</Label>
              <Input
                type="time"
                value={zeitEnde}
                onChange={(e) => setZeitEnde(e.target.value)}
                className="h-8 text-xs"
                data-testid="input-dj-ende"
              />
            </div>

            {/* Sektoren */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sektor(en)</Label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`dj-sektor-${s}`}
                      checked={sektoren.includes(s)}
                      onCheckedChange={() => toggleSektor(s)}
                      data-testid={`checkbox-dj-sektor-${s.toLowerCase()}`}
                    />
                    <label htmlFor={`dj-sektor-${s}`} className="text-xs cursor-pointer">{s}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Zielwildarten */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Zielwildarten</Label>
              <div className="flex flex-wrap gap-2">
                {TARGET_SPECIES.map((sp) => (
                  <div key={sp} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`dj-wild-${sp}`}
                      checked={zielwild.includes(sp)}
                      onCheckedChange={() => toggleZielwild(sp)}
                      data-testid={`checkbox-dj-wild-${sp.toLowerCase()}`}
                    />
                    <label htmlFor={`dj-wild-${sp}`} className="text-xs cursor-pointer">{sp}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Anzahl Schützen */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Anzahl Schützen geplant</Label>
              <Input
                type="number"
                min={1}
                value={schuetzen}
                onChange={(e) => setSchuetzen(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 text-xs"
                data-testid="input-dj-schuetzen"
              />
            </div>

            {/* Anzahl Treiber */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Anzahl Treiber geplant</Label>
              <Input
                type="number"
                min={0}
                value={treiber}
                onChange={(e) => setTreiber(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs"
                data-testid="input-dj-treiber"
              />
            </div>

            {/* Hundeführer */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hundeführer</Label>
              <Input
                type="number"
                min={0}
                value={hundefuehrer}
                onChange={(e) => setHundefuehrer(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-8 text-xs"
                data-testid="input-dj-hundefuehrer"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-dj-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Geplant">Geplant</SelectItem>
                  <SelectItem value="Bestätigt">Bestätigt</SelectItem>
                  <SelectItem value="Durchgeführt">Durchgeführt</SelectItem>
                  <SelectItem value="Abgesagt">Abgesagt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bemerkungen */}
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bemerkungen</Label>
              <Textarea
                value={bemerkungen}
                onChange={(e) => setBemerkungen(e.target.value)}
                className="text-xs min-h-[60px] resize-none"
                placeholder="Besondere Hinweise…"
                data-testid="textarea-dj-bemerkungen"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: Standverteilung
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-[#c49a2a]" />
            Standverteilung
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {/* Wind indicator */}
          {ctx.currentWind && (
            <div className="flex items-center gap-2 mb-4 p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <Wind className="h-4 w-4 text-[#c49a2a]" />
              <span className="text-xs text-muted-foreground">
                Aktuelle Windrichtung:{" "}
                <span className="font-semibold text-foreground">
                  {windArrow(ctx.currentWind)} {ctx.currentWind}
                  {ctx.currentWindSpeed !== null && ` (${Math.round(ctx.currentWindSpeed)} km/h)`}
                </span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HOCHSITZE.map((hs) => {
              const optWinds = OPTIMAL_WIND[hs.id] || [];
              const isOptimal = ctx.currentWind ? optWinds.includes(ctx.currentWind) : false;
              return (
                <div
                  key={hs.id}
                  className="p-3 rounded-lg border border-[hsl(110,25%,18%)] bg-background space-y-2"
                  data-testid={`stand-${hs.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-[#c49a2a]/60 flex items-center justify-center text-xs font-mono font-bold text-[#c49a2a]">
                        {hs.id.replace("hs_0", "")}
                      </div>
                      <div>
                        <span className="text-xs font-medium">{hs.name}</span>
                        <span className="block text-[10px] text-muted-foreground">Sektor {hs.sector}</span>
                      </div>
                    </div>
                    {ctx.currentWind && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          isOptimal
                            ? "border-[#4a9e4a] text-[#4a9e4a]"
                            : "border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        {isOptimal ? "Wind ✓" : "Wind ✗"}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Schütze zuweisen</Label>
                    <Select
                      value={assignments[hs.id]}
                      onValueChange={(v) => setAssignments(prev => ({ ...prev, [hs.id]: v }))}
                    >
                      <SelectTrigger className="h-7 text-xs" data-testid={`select-stand-${hs.id}`}>
                        <SelectValue placeholder="Unbesetzt" />
                      </SelectTrigger>
                      <SelectContent>
                        {schuetzenOptions.map((opt) => (
                          <SelectItem key={opt.value || "none"} value={opt.value || "unbesetzt"}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Optimaler Wind: {optWinds.join(", ")}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: Checkliste vor der Drückjagd
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#c49a2a]" />
            Checkliste vor der Drückjagd
            <Badge variant="outline" className="text-[10px] ml-auto">
              {checkedCount}/{CHECKLIST_ITEMS.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-1.5">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 transition-colors"
                data-testid={`checklist-item-${idx}`}
              >
                <Checkbox
                  id={`check-${idx}`}
                  checked={!!checked[idx]}
                  onCheckedChange={() => toggleCheck(idx)}
                  data-testid={`checkbox-check-${idx}`}
                />
                <label
                  htmlFor={`check-${idx}`}
                  className={`text-xs cursor-pointer flex-1 ${
                    checked[idx] ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: Sicherheitsregeln
         ══════════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#c49a2a]" />
            Sicherheitsregeln
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 space-y-2">
            {SAFETY_RULES.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2" data-testid={`safety-rule-${idx}`}>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-foreground">{rule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5: Nach der Jagd (only when Durchgeführt)
         ══════════════════════════════════════════════════════════ */}
      {isDurchgefuehrt && (
        <Card className="border-[hsl(110,25%,18%)]" data-testid="section-nach-jagd">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#c49a2a]" />
              Nach der Jagd — Zusammenfassung
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Link to Strecke */}
            <div className="p-3 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-xs text-muted-foreground">Strecke-Zusammenfassung: </span>
              <Link href="/strecke" className="text-xs text-[#c49a2a] underline underline-offset-2" data-testid="link-strecke-summary">
                Zur Streckenerfassung →
              </Link>
            </div>

            {/* Wildbrethygiene */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Wildbrethygiene-Notizen
              </Label>
              <Textarea
                value={hygiene}
                onChange={(e) => setHygiene(e.target.value)}
                className="text-xs min-h-[80px] resize-none"
                placeholder="Auffälligkeiten bei der Aufbrechung, Organveränderungen, Trichinenproben…"
                data-testid="textarea-hygiene"
              />
            </div>

            {/* Print button */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2"
              onClick={() => window.print()}
              data-testid="button-print-bericht"
            >
              <Printer className="h-3 w-3" />
              Drückjagd-Bericht drucken
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
