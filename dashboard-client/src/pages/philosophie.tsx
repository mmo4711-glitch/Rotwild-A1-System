import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface Rule {
  id: string;
  title: string;
  description: string;
  active: boolean;
}

interface Blocker {
  id: string;
  title: string;
  grundsatzRef: string;
  triggered: boolean;
  reason: string;
}

interface Warning {
  id: string;
  title: string;
  triggered: boolean;
  reason: string;
}

interface Preference {
  id: string;
  title: string;
  description: string;
}

/* ─── Live Evaluation Logic ──────────────────────────────────────────── */

function evaluateCompliance() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 4=May, 9=Oct
  const monthName = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ][month];

  // Simulated current data
  const N = 85; // current population estimate
  const K = 120; // carrying capacity
  const Ne = 62; // effective population size
  const nKRatio = N / K; // ~0.71
  const isMuttertierschutzzeit = month >= 4 && month <= 9; // May(4)–Oct(9)
  const activeSector = ["Nord", "Ost", "Süd", "West"][Math.floor((now.getDate() - 1) / 7) % 4];
  const dayInCycle = ((now.getDate() - 1) % 28);
  const isJagdphase = dayInCycle < 7;
  const jagdSaison = month >= 9 || month <= 0; // Oct–Jan main season

  // Blockers
  const blockers: Blocker[] = [
    {
      id: "B1",
      title: "Kein Abschuss führender Muttertiere Mai–Oktober",
      grundsatzRef: "= G23",
      triggered: isMuttertierschutzzeit,
      reason: isMuttertierschutzzeit
        ? `Aktiv: ${monthName} liegt im Schutzzeitraum Mai–Oktober`
        : `Inaktiv: ${monthName} liegt außerhalb Mai–Oktober`,
    },
    {
      id: "B2",
      title: "Kein Abschuss bei Bestand unter 40% K",
      grundsatzRef: "= G22",
      triggered: nKRatio < 0.4,
      reason:
        nKRatio < 0.4
          ? `Kritisch: N/K = ${(nKRatio * 100).toFixed(0)}% — unter 40% Schwelle`
          : `OK: N/K = ${(nKRatio * 100).toFixed(0)}% — über 40% Schwelle`,
    },
    {
      id: "B3",
      title: "Keine Jagd in Zone A ohne Sondergenehmigung",
      grundsatzRef: "Ruhezone",
      triggered: true, // always active
      reason: "Permanent aktiv: Zone A ist ganzjährige Ruhezone",
    },
  ];

  // Warning
  const warnings: Warning[] = [
    {
      id: "W1",
      title: "Ne < 50: Genetische Drift — Entnahme kritisch prüfen",
      triggered: Ne < 50,
      reason:
        Ne < 50
          ? `Warnung: Ne = ${Ne} — unter kritischer Schwelle 50`
          : `OK: Ne = ${Ne} — über Schwelle 50`,
    },
  ];

  // 25 Grundsätze
  const grundsaetze: Rule[] = [
    { id: "G01", title: "Nachhaltigkeit", description: "Entnahme ≤ Zuwachs", active: true },
    { id: "G02", title: "Biologische Reife", description: "Kein Jungwild unter 2 Jahren erlegen (außer Kälber)", active: true },
    { id: "G03", title: "Waidgerechtigkeit", description: "Sauberer Schuss, kurze Fluchtdistanz", active: true },
    { id: "G04", title: "Ruhezone-Disziplin", description: "Zone A ist unantastbar", active: true },
    { id: "G05", title: "Intervalljagd", description: `7 Tage Jagd, 21 Tage Ruhe pro Sektor — Sektor ${activeSector} ${isJagdphase ? "aktiv" : "Ruhephase"}`, active: true },
    { id: "G06", title: "Thermik-Bewusstsein", description: "Kein Ansitz bei ungünstigem Wind", active: true },
    { id: "G07", title: "Nachtjagdverbot", description: "Außer Schwarzwild mit Genehmigung", active: true },
    { id: "G08", title: "Trophäen-Ethik", description: "Kein Erlegen allein wegen der Trophäe", active: true },
    { id: "G09", title: "Wildbrethygiene", description: "Aufbruch innerhalb 1 Stunde, Kühlung sicherstellen", active: true },
    { id: "G10", title: "Dokumentationspflicht", description: "Jeder Abschuss wird erfasst (Streckenerfassung)", active: true },
    { id: "G11", title: "Kooperation", description: "Abstimmung mit Nachbarrevieren und Hegegemeinschaft", active: true },
    { id: "G12", title: "Landwirt-Partnerschaft", description: "Wildschadenprävention gemeinsam gestalten", active: true },
    { id: "G13", title: "Waldverjüngung", description: "Verbissdruck unter 10% Tannenverbiss halten", active: true },
    { id: "G14", title: "Äsungsvielfalt", description: "Mindestens 3 Wildwiesen mit \u201EBig 3\u201C Pflanzen aktiv", active: true },
    { id: "G15", title: "Sozialstruktur", description: "Mindestanteil adulter Weibchen im Bestand erhalten", active: true },
    { id: "G16", title: "Hirsch-Schonung", description: "Platzhirsche (8+ Jahre) nur gezielt entnehmen", active: true },
    { id: "G17", title: "Schwarzwild-Schwerpunkt", description: "Bachen führend schonen, Frischlinge bevorzugt", active: true },
    { id: "G18", title: "Muffelwild-Erhalt", description: "Bestand von 13 Stück stabilisieren", active: true },
    { id: "G19", title: "Monitoring-Pflicht", description: "Vierteljährliche Wildkamera-Auswertung", active: true },
    { id: "G20", title: "Datengestützt", description: "Entscheidungen auf Basis von Strecken- und Kameradaten", active: true },
    { id: "G21", title: "Fortbildung", description: "Jährliche Schulung für alle Jäger im Revier", active: true },
    { id: "G22", title: "Jagdverzicht", description: `Nullentnahme wenn N < 40% K — aktuell N/K = ${(nKRatio * 100).toFixed(0)}%`, active: nKRatio >= 0.4 },
    { id: "G23", title: "Muttertierschutz", description: `Keine führenden Alttiere Mai–Oktober — ${monthName}`, active: !isMuttertierschutzzeit },
    { id: "G24", title: "Gästejäger-Standard", description: "Begehungsschein mit Einweisung, Sektorzuweisung", active: true },
    { id: "G25", title: "Transparenz", description: "Jährlicher Hegebericht an die Jagdgenossenschaft", active: true },
  ];

  // Preferences
  const preferences: Preference[] = [
    { id: "P1", title: "Ansitz vor Pirsch", description: "Weniger Störung durch ruhige Ansitzjagd" },
    { id: "P2", title: "Kälberentnahme vor Alttier-Entnahme", description: "Populationsdynamik: Gaillard-Paradoxon" },
    { id: "P3", title: "Morgensitz bei Ostwetterlage, Abendsitz bei Westwetterlage", description: "Optimale Thermik-Ausnutzung" },
    { id: "P4", title: "Drückjagd max. 2× pro Jahr", description: "Nur Oktober–Januar" },
  ];

  const activeCount = grundsaetze.filter((g) => g.active).length;
  const triggeredBlockers = blockers.filter((b) => b.triggered).length;

  return {
    monthName,
    N,
    K,
    Ne,
    nKRatio,
    activeSector,
    isJagdphase,
    jagdSaison,
    isMuttertierschutzzeit,
    blockers,
    warnings,
    grundsaetze,
    preferences,
    activeCount,
    triggeredBlockers,
  };
}

/* ─── Progress Ring Component ─────────────────────────────────────────── */

function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;
  const percentage = ((value / max) * 100).toFixed(0);

  return (
    <div className="relative inline-flex items-center justify-center" data-testid="progress-ring">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(110 15% 20%)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#c49a2a"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-lg font-semibold text-[#c49a2a]">{value}</span>
        <span className="text-[10px] text-muted-foreground">von {max}</span>
      </div>
    </div>
  );
}

/* ─── Section Components ──────────────────────────────────────────────── */

function BlockerSection({ blockers }: { blockers: Blocker[] }) {
  return (
    <div className="space-y-2" data-testid="section-blocker">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400 mb-3">
        <ShieldAlert className="h-4 w-4" /> Blocker ({blockers.length})
      </h3>
      {blockers.map((b) => (
        <Card
          key={b.id}
          className={`border ${
            b.triggered
              ? "border-red-500/40 bg-red-500/5"
              : "border-[hsl(110,25%,18%)] bg-card"
          }`}
          data-testid={`blocker-${b.id}`}
        >
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {b.triggered ? (
                  <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-red-400">{b.id}</span>
                    <span className="text-xs text-muted-foreground">({b.grundsatzRef})</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-0.5">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.reason}</p>
                </div>
              </div>
              <Badge
                variant={b.triggered ? "destructive" : "outline"}
                className="shrink-0 text-[10px]"
              >
                {b.triggered ? "AKTIV" : "INAKTIV"}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WarningSection({ warnings }: { warnings: Warning[] }) {
  return (
    <div className="space-y-2" data-testid="section-warning">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">
        <AlertTriangle className="h-4 w-4" /> Warnung ({warnings.length})
      </h3>
      {warnings.map((w) => (
        <Card
          key={w.id}
          className={`border ${
            w.triggered
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-[hsl(110,25%,18%)] bg-card"
          }`}
          data-testid={`warning-${w.id}`}
        >
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {w.triggered ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-amber-400">{w.id}</span>
                  <p className="text-sm font-medium text-foreground mt-0.5">{w.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
                </div>
              </div>
              <Badge
                variant={w.triggered ? "outline" : "outline"}
                className={`shrink-0 text-[10px] ${
                  w.triggered ? "border-amber-500/40 text-amber-400" : ""
                }`}
              >
                {w.triggered ? "WARNUNG" : "OK"}
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function GrundsaetzeSection({ rules }: { rules: Rule[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} data-testid="section-grundsaetze">
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left mb-3 group">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-400 flex-1">
          Grundsätze (25)
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-start gap-3 p-2.5 rounded-md border ${
                rule.active
                  ? "border-[hsl(110,25%,18%)] bg-card"
                  : "border-red-500/20 bg-red-500/5"
              }`}
              data-testid={`grundsatz-${rule.id}`}
            >
              <span className="text-[10px] font-mono font-bold text-[#c49a2a] mt-0.5 w-7 shrink-0">
                {rule.id}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{rule.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {rule.description}
                </p>
              </div>
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  rule.active ? "bg-emerald-400" : "bg-red-400"
                }`}
                title={rule.active ? "aktiv" : "inaktiv"}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PreferencesSection({ preferences }: { preferences: Preference[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} data-testid="section-preferences">
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left mb-3 group">
        <Info className="h-4 w-4 text-blue-400" />
        <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 flex-1">
          Präferenzen (4)
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5">
          {preferences.map((pref) => (
            <Card
              key={pref.id}
              className="border border-blue-500/20 bg-blue-500/5"
              data-testid={`preference-${pref.id}`}
            >
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono font-bold text-blue-400 mt-0.5 w-5 shrink-0">
                    {pref.id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{pref.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{pref.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ─── Right Column: Live Status Panel ─────────────────────────────────── */

function LiveStatusPanel({
  data,
}: {
  data: ReturnType<typeof evaluateCompliance>;
}) {
  return (
    <div className="space-y-4" data-testid="live-status-panel">
      {/* Compliance Score */}
      <Card className="border border-[hsl(110,25%,18%)] bg-card">
        <CardContent className="p-5 flex flex-col items-center">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Compliance Score
          </h3>
          <ProgressRing value={data.activeCount} max={25} size={130} strokeWidth={10} />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {data.activeCount} von 25 Grundsätzen eingehalten
          </p>
        </CardContent>
      </Card>

      {/* Current Status Cards */}
      <Card className="border border-[hsl(110,25%,18%)] bg-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Aktueller Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* Month */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Monat</span>
            <span className="text-xs font-medium">{data.monthName}</span>
          </div>

          {/* Population */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Population N</span>
            <span className="text-xs font-mono font-medium">{data.N} Stück</span>
          </div>

          {/* Carrying Capacity */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Tragfähigkeit K</span>
            <span className="text-xs font-mono font-medium">{data.K} Stück</span>
          </div>

          {/* N/K Ratio */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">N/K Verhältnis</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.nKRatio >= 0.4 ? "text-emerald-400 border-emerald-500/30" : "text-red-400 border-red-500/30"
              }`}
            >
              {(data.nKRatio * 100).toFixed(0)}%
            </Badge>
          </div>

          {/* Ne */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Eff. Pop. Ne</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.Ne >= 50 ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"
              }`}
            >
              {data.Ne}
            </Badge>
          </div>

          <div className="border-t border-border my-2" />

          {/* Active Sector */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Aktiver Sektor</span>
            <span className="text-xs font-medium">{data.activeSector}</span>
          </div>

          {/* Jagdphase */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">G05 Intervall</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.isJagdphase ? "text-[#c49a2a] border-[#c49a2a]/30" : "text-muted-foreground"
              }`}
            >
              {data.isJagdphase ? "Jagdphase" : "Ruhephase"}
            </Badge>
          </div>

          {/* Muttertierschutz */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">G23 Muttertierschutz</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.isMuttertierschutzzeit
                  ? "text-red-400 border-red-500/30"
                  : "text-emerald-400 border-emerald-500/30"
              }`}
            >
              {data.isMuttertierschutzzeit ? "AKTIV" : "Inaktiv"}
            </Badge>
          </div>

          {/* Season */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground text-xs">Jagdsaison</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.jagdSaison ? "text-[#c49a2a] border-[#c49a2a]/30" : "text-muted-foreground"
              }`}
            >
              {data.jagdSaison ? "Hauptjagd Okt–Jan" : "Nebensaison"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Blocker Status Summary */}
      <Card className="border border-[hsl(110,25%,18%)] bg-card">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Blocker-Status
          </h3>
          <div className="space-y-2">
            {data.blockers.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    b.triggered ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
                <span className="text-xs font-mono text-muted-foreground">{b.id}</span>
                <span className="text-[11px] text-foreground/80 flex-1 truncate">{b.title.split(" ").slice(0, 4).join(" ")}…</span>
                <span className={`text-[10px] font-medium ${b.triggered ? "text-red-400" : "text-emerald-400"}`}>
                  {b.triggered ? "⬤" : "○"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Main Philosophie Page ───────────────────────────────────────────── */

export default function Philosophie() {
  const data = useMemo(() => evaluateCompliance(), []);

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="philosophie-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold tracking-wide text-[#c49a2a]">
          Philosophie & Regelwerk
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          25 Grundsätze · 3 Blocker · 1 Warnung · 4 Präferenzen — Der Merschbach-Kodex
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Rules (60%) */}
        <div className="flex-1 lg:w-[60%] space-y-6">
          <BlockerSection blockers={data.blockers} />
          <WarningSection warnings={data.warnings} />
          <GrundsaetzeSection rules={data.grundsaetze} />
          <PreferencesSection preferences={data.preferences} />
        </div>

        {/* Right Column: Live Status (40%) */}
        <div className="lg:w-[40%] lg:max-w-[400px]">
          <div className="lg:sticky lg:top-6">
            <LiveStatusPanel data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
