import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Target, FileText, Printer, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Harvest } from "@shared/schema";

const SPECIES = ["Rotwild", "Rehwild", "Schwarzwild", "Fuchs", "Sonstige"];
const AGE_CLASSES = ["Kalb/Kitz", "Jährling", "Adult 2-4J", "Adult 5-8J", "Alt 9+J"];
const SECTORS = ["Nord", "Ost", "Süd", "West"];
const STANDS = [
  { id: "hs_01", name: "HS 01 — Eichenberg" },
  { id: "hs_02", name: "HS 02 — Dhrontal" },
  { id: "hs_03", name: "HS 03 — Windbruch" },
  { id: "hs_04", name: "HS 04 — K81-Rand" },
  { id: "hs_05", name: "HS 05 — Nordhang" },
];

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simple QR-like pattern based on ID using CSS grid
function QRPattern({ id }: { id: string }) {
  // Convert ID chars to a 8x8 bit pattern
  const bits: boolean[] = [];
  for (let i = 0; i < id.length; i++) {
    const code = id.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bits.push(((code >> b) & 1) === 1);
    }
  }
  // Take first 64 bits for 8x8 grid
  const grid = bits.slice(0, 64);
  // Always add finder patterns (corners)
  const size = 8;
  return (
    <div className="inline-grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${size}, 6px)` }}>
      {grid.map((filled, idx) => {
        const row = Math.floor(idx / size);
        const col = idx % size;
        // Finder pattern corners
        const isFinder =
          (row < 2 && col < 2) ||
          (row < 2 && col >= size - 2) ||
          (row >= size - 2 && col < 2);
        return (
          <div
            key={idx}
            className={`w-[6px] h-[6px] ${
              isFinder ? "bg-foreground" : filled ? "bg-foreground" : "bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function Strecke() {
  const { toast } = useToast();

  // ── Harvest form state ────────────────────────────────────
  const [hDate, setHDate] = useState(new Date().toISOString().split("T")[0]);
  const [hSpecies, setHSpecies] = useState("");
  const [hSex, setHSex] = useState("M");
  const [hAge, setHAge] = useState("");
  const [hWeight, setHWeight] = useState("");
  const [hSector, setHSector] = useState("");
  const [hStand, setHStand] = useState("");
  const [hNotes, setHNotes] = useState("");

  // ── Begehungsschein form state ────────────────────────────
  const [bName, setBName] = useState("");
  const [bFrom, setBFrom] = useState("");
  const [bTo, setBTo] = useState("");
  const [bSpecies, setBSpecies] = useState<string[]>([]);
  const [bSectors, setBSectors] = useState<string[]>([]);
  const [bNotes, setBNotes] = useState("");
  const [showSchein, setShowSchein] = useState(false);
  const [scheinId, setScheinId] = useState("");

  // ── API ───────────────────────────────────────────────────
  const { data: harvests = [], isLoading } = useQuery<Harvest[]>({
    queryKey: ["/api/harvests"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/harvests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harvests"] });
      toast({ title: "Strecke erfasst", description: "Eintrag wurde gespeichert." });
      // Reset form
      setHSpecies("");
      setHAge("");
      setHWeight("");
      setHSector("");
      setHStand("");
      setHNotes("");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Eintrag konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/harvests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harvests"] });
    },
  });

  function handleSubmitHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!hSpecies || !hAge || !hSector) {
      toast({ title: "Pflichtfelder fehlen", description: "Bitte Wildart, Altersklasse und Sektor ausfüllen.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      date: hDate,
      species: hSpecies,
      sex: hSex,
      ageClass: hAge,
      weight: hWeight ? parseFloat(hWeight) : null,
      sector: hSector,
      stand: hStand || null,
      notes: hNotes || null,
    });
  }

  // ── Stats ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = harvests.length;
    const rotwild = harvests.filter((h) => h.species === "Rotwild");
    const rotwildM = rotwild.filter((h) => h.sex === "M").length;
    const rotwildF = rotwild.filter((h) => h.sex === "F").length;
    const weights = harvests.filter((h) => h.weight).map((h) => h.weight!);
    const avgWeight = weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : "—";
    const lastDate = harvests.length > 0 ? harvests[0].date : "—";
    return { total, rotwild: rotwild.length, rotwildM, rotwildF, avgWeight, lastDate };
  }, [harvests]);

  // ── Begehungsschein ───────────────────────────────────────
  function handleGenerateSchein(e: React.FormEvent) {
    e.preventDefault();
    if (!bName || !bFrom || !bTo) {
      toast({ title: "Pflichtfelder fehlen", description: "Name und Gültigkeitszeitraum angeben.", variant: "destructive" });
      return;
    }
    setScheinId(generateId());
    setShowSchein(true);
  }

  function toggleBSpecies(sp: string) {
    setBSpecies((prev) => prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]);
  }

  function toggleBSector(sec: string) {
    setBSectors((prev) => prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]);
  }

  return (
    <div className="p-4 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Target className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Strecke & Schein
        </h1>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION A: Streckenerfassung
         ══════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4 text-[#c49a2a]" />
            Streckenerfassung
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSubmitHarvest} className="space-y-4" data-testid="form-harvest">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Datum */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Datum</Label>
                <Input
                  type="date"
                  value={hDate}
                  onChange={(e) => setHDate(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-harvest-date"
                />
              </div>

              {/* Wildart */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Wildart *</Label>
                <Select value={hSpecies} onValueChange={setHSpecies}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-harvest-species">
                    <SelectValue placeholder="Auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Geschlecht */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Geschlecht</Label>
                <RadioGroup value={hSex} onValueChange={setHSex} className="flex gap-3 h-8 items-center">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="M" id="sex-m" data-testid="radio-sex-m" />
                    <Label htmlFor="sex-m" className="text-xs cursor-pointer">♂ Männlich</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="F" id="sex-f" data-testid="radio-sex-f" />
                    <Label htmlFor="sex-f" className="text-xs cursor-pointer">♀ Weiblich</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Altersklasse */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Altersklasse *</Label>
                <Select value={hAge} onValueChange={setHAge}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-harvest-age">
                    <SelectValue placeholder="Auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_CLASSES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gewicht */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gewicht aufgebr. (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={hWeight}
                  onChange={(e) => setHWeight(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="z.B. 65.0"
                  data-testid="input-harvest-weight"
                />
              </div>

              {/* Sektor */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Ort/Sektor *</Label>
                <Select value={hSector} onValueChange={setHSector}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-harvest-sector">
                    <SelectValue placeholder="Auswählen…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hochsitz */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hochsitz</Label>
                <Select value={hStand} onValueChange={setHStand}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-harvest-stand">
                    <SelectValue placeholder="Optional…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Besonderheiten */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Besonderheiten</Label>
                <Textarea
                  value={hNotes}
                  onChange={(e) => setHNotes(e.target.value)}
                  className="text-xs min-h-[32px] h-8 resize-none"
                  placeholder="Optional…"
                  data-testid="input-harvest-notes"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="sm"
              className="text-xs"
              disabled={createMutation.isPending}
              data-testid="button-submit-harvest"
            >
              {createMutation.isPending ? "Wird gespeichert…" : "Erfassen"}
            </Button>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Gesamtstrecke</span>
              <span className="text-lg font-semibold font-display">{stats.total} <span className="text-xs font-normal text-muted-foreground">Stück</span></span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Rotwild</span>
              <span className="text-lg font-semibold font-display">{stats.rotwild} <span className="text-xs font-normal text-muted-foreground">({stats.rotwildM}♂ / {stats.rotwildF}♀)</span></span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">∅ Gewicht</span>
              <span className="text-lg font-semibold font-display">{stats.avgWeight} <span className="text-xs font-normal text-muted-foreground">kg</span></span>
            </div>
            <div className="p-2 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Letzter Abschuss</span>
              <span className="text-sm font-semibold">{stats.lastDate}</span>
            </div>
          </div>

          {/* Streckenübersicht Table */}
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[hsl(110,25%,18%)]">
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Datum</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Wildart</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Geschl.</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Alter</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Gewicht</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Sektor</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">Hochsitz</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-muted-foreground w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      Lade Daten…
                    </TableCell>
                  </TableRow>
                ) : harvests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      Noch keine Streckeneinträge vorhanden.
                    </TableCell>
                  </TableRow>
                ) : (
                  harvests.map((h) => (
                    <TableRow key={h.id} className="border-b border-[hsl(110,25%,18%)]/50" data-testid={`harvest-row-${h.id}`}>
                      <TableCell className="text-xs py-1.5">{h.date}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.species}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.sex === "M" ? "♂" : "♀"}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.ageClass}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.weight ? `${h.weight} kg` : "—"}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.sector}</TableCell>
                      <TableCell className="text-xs py-1.5">{h.stand || "—"}</TableCell>
                      <TableCell className="py-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteMutation.mutate(h.id)}
                          data-testid={`button-delete-harvest-${h.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════
          SECTION B: Begehungsschein-Generator
         ══════════════════════════════════════════════════════ */}
      <Card className="border-[hsl(110,25%,18%)]">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#c49a2a]" />
            Begehungsschein-Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleGenerateSchein} className="space-y-4" data-testid="form-schein">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Gastjäger Name */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gastjäger Name *</Label>
                <Input
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Vor- und Nachname"
                  data-testid="input-schein-name"
                />
              </div>

              {/* Gültig von */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gültig von *</Label>
                <Input
                  type="date"
                  value={bFrom}
                  onChange={(e) => setBFrom(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-schein-from"
                />
              </div>

              {/* Gültig bis */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gültig bis *</Label>
                <Input
                  type="date"
                  value={bTo}
                  onChange={(e) => setBTo(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-schein-to"
                />
              </div>

              {/* Wildarten */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Wildarten</Label>
                <div className="flex flex-wrap gap-2">
                  {["Rotwild", "Rehwild", "Schwarzwild", "Raubwild"].map((sp) => (
                    <div key={sp} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`bs-${sp}`}
                        checked={bSpecies.includes(sp)}
                        onCheckedChange={() => toggleBSpecies(sp)}
                        data-testid={`checkbox-schein-species-${sp.toLowerCase()}`}
                      />
                      <label htmlFor={`bs-${sp}`} className="text-xs cursor-pointer">{sp}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sektoren */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Zugelassene Sektoren</Label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sec) => (
                    <div key={sec} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`bsec-${sec}`}
                        checked={bSectors.includes(sec)}
                        onCheckedChange={() => toggleBSector(sec)}
                        data-testid={`checkbox-schein-sector-${sec.toLowerCase()}`}
                      />
                      <label htmlFor={`bsec-${sec}`} className="text-xs cursor-pointer">{sec}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Besondere Auflagen */}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Besondere Auflagen</Label>
                <Textarea
                  value={bNotes}
                  onChange={(e) => setBNotes(e.target.value)}
                  className="text-xs min-h-[32px] h-8 resize-none"
                  placeholder="Optional…"
                  data-testid="input-schein-notes"
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="text-xs" data-testid="button-generate-schein">
              Begehungsschein erstellen
            </Button>
          </form>

          {/* Generated Begehungsschein Preview */}
          {showSchein && (
            <div className="mt-6" data-testid="schein-preview">
              <div className="border border-[#c49a2a]/40 rounded-lg p-6 bg-card max-w-2xl mx-auto print:border-black print:bg-white print:text-black" id="begehungsschein">
                {/* Header */}
                <div className="text-center border-b border-[#c49a2a]/30 pb-4 mb-4 print:border-black">
                  <h2 className="font-display text-base font-bold tracking-widest uppercase text-[#c49a2a] print:text-black">
                    BEGEHUNGSSCHEIN
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 print:text-gray-600">
                    Eigenjagdbezirk Merschbach
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 print:text-gray-500">
                    Nr. {scheinId}
                  </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Gastjäger</span>
                    <span className="font-semibold">{bName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Gültigkeitszeitraum</span>
                    <span className="font-semibold">{bFrom} — {bTo}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Zugelassene Wildarten</span>
                    <span className="font-semibold">{bSpecies.length > 0 ? bSpecies.join(", ") : "Keine ausgewählt"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Zugelassene Sektoren</span>
                    <span className="font-semibold">{bSectors.length > 0 ? bSectors.join(", ") : "Keine ausgewählt"}</span>
                  </div>
                  {bNotes && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Besondere Auflagen</span>
                      <span>{bNotes}</span>
                    </div>
                  )}
                </div>

                {/* Issue Date + QR */}
                <div className="flex items-end justify-between border-t border-[#c49a2a]/30 pt-4 print:border-black">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500">Ausstellungsdatum</span>
                      <span className="text-xs font-semibold">{new Date().toLocaleDateString("de-DE")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block print:text-gray-500 mb-4">Revierinhaber</span>
                      <div className="border-b border-foreground/40 w-48 print:border-black" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="border border-[hsl(110,25%,18%)] rounded p-1.5 print:border-black">
                      <QRPattern id={scheinId} />
                    </div>
                    <span className="text-[8px] text-muted-foreground font-mono print:text-gray-500">{scheinId}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.print()}
                  data-testid="button-print-schein"
                >
                  <Printer className="h-3 w-3 mr-1.5" />
                  Drucken
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
