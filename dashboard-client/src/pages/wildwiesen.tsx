import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Sprout, Calculator, CalendarDays } from "lucide-react";

// ── Flächen-Übersicht Data ───────────────────────────────────
const FLAECHEN = [
  { name: "Bergwiese Nord", ha: 1.5, typ: "Dauergrünland", saatgut: "WA Eifel Hochwild", angelegt: "2026-04", status: "Neu angelegt" },
  { name: "Waldwiese Dhrontal", ha: 0.8, typ: "Wildacker", saatgut: "Buchweizen+Phacelia", angelegt: "2025-09", status: "Bestand" },
  { name: "Brachfläche Windbruch", ha: 2.0, typ: "Sukzession", saatgut: "Pioniersaat", angelegt: "2026-05", status: "Geplant" },
  { name: "Randstreifen K81", ha: 0.3, typ: "Blühstreifen", saatgut: "Schafgarbe+Wegwarte", angelegt: "2026-04", status: "Neu angelegt" },
  { name: "Suhle Kimmelsberg", ha: 0.2, typ: "Feuchtfläche", saatgut: "Natürlich", angelegt: "Bestand", status: "Bestand" },
];

function statusColor(status: string): string {
  if (status === "Neu angelegt") return "bg-green-700 text-green-100";
  if (status === "Bestand") return "bg-blue-700 text-blue-100";
  if (status === "Geplant") return "bg-yellow-700 text-yellow-100";
  return "bg-gray-600 text-gray-100";
}

// ── Saatgut-Kalkulator Data ──────────────────────────────────
const MISCHUNGEN = [
  { name: "WA Eifel Hochwild", kgHa: 25, euroKg: 8 },
  { name: "Pioniersaat", kgHa: 15, euroKg: 5 },
  { name: "Blühstreifen", kgHa: 10, euroKg: 12 },
  { name: "Waldstaudenroggen", kgHa: 120, euroKg: 2 },
];

// ── Pflegekalender Data ──────────────────────────────────────
const PFLEGE_KALENDER = [
  { monat: "März", aufgabe: "Kalkung prüfen (pH 5.5–6.5), Zaunreparatur", flaechen: "Alle" },
  { monat: "April", aufgabe: "Frühjahrssaat (Pioniermischung), Walzen", flaechen: "Brachfläche, Randstreifen" },
  { monat: "Mai", aufgabe: "Nachsaat kahle Stellen, Schröpfschnitt", flaechen: "Bergwiese, Waldwiese" },
  { monat: "Juni", aufgabe: "1. Mahd (Randstreifen), Wildschadenkontrolle", flaechen: "Randstreifen, alle" },
  { monat: "Juli", aufgabe: "Schwarzwildschäden reparieren, Bewässern bei Trockenheit", flaechen: "Waldwiese" },
  { monat: "August", aufgabe: "2. Mahd (mosaik, nie komplett), Herbstsaat vorbereiten", flaechen: "Bergwiese" },
  { monat: "September", aufgabe: "Herbstsaat (Waldstaudenroggen), Wildacker anlegen", flaechen: "Brachfläche" },
  { monat: "Oktober", aufgabe: "Winteräsung prüfen, Zugänglichkeit sichern", flaechen: "Alle" },
  { monat: "November", aufgabe: "Wildschadenbilanz erstellen", flaechen: "Alle" },
  { monat: "Dez–Feb", aufgabe: "Ruhe. Keine Bearbeitung. Nur Zaunreparatur bei Bedarf.", flaechen: "—" },
];

const MONTH_MAP: Record<string, number> = {
  "März": 3, "April": 4, "Mai": 5, "Juni": 6, "Juli": 7,
  "August": 8, "September": 9, "Oktober": 10, "November": 11,
};

export default function Wildwiesen() {
  const [flaeche, setFlaeche] = useState(1.0);
  const [mischung, setMischung] = useState(MISCHUNGEN[0].name);

  const currentMonth = new Date().getMonth() + 1; // 1-12

  const selectedMix = MISCHUNGEN.find((m) => m.name === mischung) || MISCHUNGEN[0];
  const benoetigtKg = flaeche * selectedMix.kgHa;
  const kosten = benoetigtKg * selectedMix.euroKg;

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Sprout className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Wildwiesen-Manager
        </h1>
      </div>

      {/* ── Section 1: Flächen-Übersicht ───────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-flaechen">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Flächen-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[hsl(110,25%,18%)]">
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Name</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase text-right">Fläche (ha)</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Typ</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Saatgut</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Angelegt</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLAECHEN.map((f) => (
                  <TableRow key={f.name} className="border-b border-[hsl(110,25%,18%)]/50" data-testid={`flaeche-row-${f.name}`}>
                    <TableCell className="text-xs py-2 font-medium">{f.name}</TableCell>
                    <TableCell className="text-xs py-2 text-right font-mono">{f.ha.toFixed(1)}</TableCell>
                    <TableCell className="text-xs py-2">{f.typ}</TableCell>
                    <TableCell className="text-xs py-2">{f.saatgut}</TableCell>
                    <TableCell className="text-xs py-2">{f.angelegt}</TableCell>
                    <TableCell className="text-xs py-2">
                      <Badge className={`${statusColor(f.status)} text-[10px] border-none`}>
                        {f.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span>Gesamtfläche: <strong className="text-foreground">{FLAECHEN.reduce((s, f) => s + f.ha, 0).toFixed(1)} ha</strong></span>
            <span>Aktive Flächen: <strong className="text-foreground">{FLAECHEN.filter((f) => f.status !== "Geplant").length}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Saatgut-Kalkulator ──────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-kalkulator">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Calculator className="h-3.5 w-3.5" />
            Saatgut-Kalkulator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Fläche (ha)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={flaeche}
                onChange={(e) => setFlaeche(parseFloat(e.target.value) || 0.1)}
                className="h-8 text-xs"
                data-testid="input-flaeche-ha"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">Mischungstyp</Label>
              <Select value={mischung} onValueChange={setMischung}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-mischung">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MISCHUNGEN.map((m) => (
                    <SelectItem key={m.name} value={m.name}>
                      {m.name} ({m.kgHa} kg/ha)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Benötigte Menge</p>
              <p className="text-lg font-bold font-mono" data-testid="text-kg-needed">{benoetigtKg.toFixed(1)} kg</p>
              <p className="text-[10px] text-muted-foreground">{selectedMix.kgHa} kg/ha × {flaeche.toFixed(1)} ha</p>
            </div>
            <div className="p-3 rounded bg-muted/30 border border-[hsl(110,25%,18%)]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ungefähre Kosten</p>
              <p className="text-lg font-bold font-mono text-[#c49a2a]" data-testid="text-cost">
                {kosten.toFixed(0)} €
              </p>
              <p className="text-[10px] text-muted-foreground">{selectedMix.euroKg} €/kg × {benoetigtKg.toFixed(1)} kg</p>
            </div>
          </div>

          {/* Quick reference table */}
          <div className="mt-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Referenz: Kosten pro Hektar</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MISCHUNGEN.map((m) => (
                <div key={m.name} className="p-2 rounded border border-[hsl(110,25%,18%)] text-center">
                  <p className="text-[10px] text-muted-foreground">{m.name}</p>
                  <p className="text-sm font-semibold font-mono">{m.kgHa * m.euroKg} €/ha</p>
                  <p className="text-[9px] text-muted-foreground">{m.kgHa} kg × {m.euroKg} €</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Pflegekalender ──────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-pflegekalender">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            Pflegekalender
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[hsl(110,25%,18%)]">
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase w-24">Monat</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase">Aufgabe</TableHead>
                  <TableHead className="text-[10px] font-semibold tracking-wide uppercase w-44">Flächen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PFLEGE_KALENDER.map((row) => {
                  const monthNum = MONTH_MAP[row.monat];
                  const isCurrentMonth = monthNum === currentMonth;
                  const isDezFeb = row.monat === "Dez–Feb";
                  const isCurrentDezFeb = isDezFeb && (currentMonth === 12 || currentMonth === 1 || currentMonth === 2);
                  const highlight = isCurrentMonth || isCurrentDezFeb;

                  return (
                    <TableRow
                      key={row.monat}
                      className={`border-b border-[hsl(110,25%,18%)]/50 ${
                        highlight ? "bg-[#c49a2a]/10 border-l-2 border-l-[#c49a2a]" : ""
                      }`}
                      data-testid={`pflege-row-${row.monat}`}
                    >
                      <TableCell className={`text-xs py-2 font-semibold ${highlight ? "text-[#c49a2a]" : ""}`}>
                        {row.monat}
                        {highlight && (
                          <Badge className="ml-1.5 bg-[#c49a2a] text-black text-[8px] border-none px-1">
                            Aktuell
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-2">{row.aufgabe}</TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{row.flaechen}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
