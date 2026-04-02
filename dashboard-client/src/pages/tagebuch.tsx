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
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Plus, Trash2, Filter } from "lucide-react";
import type { LogEntry } from "@shared/schema";

const CATEGORIES = [
  { value: "Beobachtung", label: "Beobachtung", color: "bg-green-700 text-green-100" },
  { value: "Wildschaden", label: "Wildschaden", color: "bg-red-700 text-red-100" },
  { value: "Maßnahme", label: "Maßnahme", color: "bg-blue-700 text-blue-100" },
  { value: "Jagd", label: "Jagd", color: "bg-yellow-700 text-yellow-100" },
  { value: "Infrastruktur", label: "Infrastruktur", color: "bg-gray-600 text-gray-100" },
  { value: "Sonstiges", label: "Sonstiges", color: "bg-emerald-800 text-emerald-100" },
];

const SECTORS = ["Nord", "Ost", "Süd", "West", "Zentral"];
const PRIORITIES = [
  { value: "normal", label: "Normal" },
  { value: "wichtig", label: "Wichtig" },
  { value: "dringend", label: "Dringend" },
];

function categoryStyle(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.color || "bg-gray-600 text-gray-100";
}

function priorityBadge(p: string | null): { label: string; cls: string } | null {
  if (!p || p === "normal") return null;
  if (p === "wichtig") return { label: "Wichtig", cls: "border-yellow-600 text-yellow-400" };
  if (p === "dringend") return { label: "Dringend", cls: "border-red-600 text-red-400" };
  return null;
}

export default function Tagebuch() {
  const { toast } = useToast();

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");
  const [weather, setWeather] = useState("");
  const [priority, setPriority] = useState("normal");

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { data: entries = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ["/api/log"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/log");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/log", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/log"] });
      toast({ title: "Eintrag erstellt", description: "Der Tagebuch-Eintrag wurde gespeichert." });
      setTitle("");
      setDescription("");
      setCategory("");
      setSector("");
      setWeather("");
      setPriority("normal");
    },
    onError: () => {
      toast({ title: "Fehler", description: "Eintrag konnte nicht gespeichert werden.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/log/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/log"] });
      toast({ title: "Gelöscht", description: "Eintrag wurde entfernt." });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !title) {
      toast({ title: "Pflichtfelder", description: "Kategorie und Titel sind erforderlich.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      date,
      time: time || null,
      category,
      title,
      description: description || null,
      sector: sector || null,
      weather: weather || null,
      priority,
    });
  }

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterSector !== "all" && e.sector !== filterSector) return false;
      if (filterPriority !== "all" && e.priority !== filterPriority) return false;
      if (filterDateFrom && e.date < filterDateFrom) return false;
      if (filterDateTo && e.date > filterDateTo) return false;
      return true;
    });
  }, [entries, filterCategory, filterSector, filterPriority, filterDateFrom, filterDateTo]);

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="h-5 w-5 text-[#c49a2a]" />
        <h1 className="font-display text-lg font-semibold tracking-wide text-[#c49a2a]">
          Reviertagebuch
        </h1>
      </div>

      {/* ── Neuer Eintrag Formular ─────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-log-form">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            Neuer Eintrag
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
                  data-testid="input-log-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Uhrzeit</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-xs"
                  data-testid="input-log-time"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Kategorie *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-log-category">
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Sektor</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="h-8 text-xs" data-testid="select-log-sector">
                    <SelectValue placeholder="Optional..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] uppercase tracking-wider">Titel *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Kurze Beschreibung..."
                  className="h-8 text-xs"
                  data-testid="input-log-title"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Wetter</Label>
                <Input
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  placeholder="z.B. bewölkt, 8°C"
                  className="h-8 text-xs"
                  data-testid="input-log-weather"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider">Priorität</Label>
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      variant={priority === p.value ? "default" : "outline"}
                      size="sm"
                      className={`h-8 text-xs flex-1 ${
                        priority === p.value && p.value === "dringend" ? "bg-red-700 hover:bg-red-600" :
                        priority === p.value && p.value === "wichtig" ? "bg-yellow-700 hover:bg-yellow-600" : ""
                      }`}
                      onClick={() => setPriority(p.value)}
                      data-testid={`button-priority-${p.value}`}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-4">
                <Label className="text-[10px] uppercase tracking-wider">Beschreibung</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detaillierte Beschreibung..."
                  className="text-xs h-20"
                  data-testid="input-log-description"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-[#c49a2a] hover:bg-[#b08925] text-black font-semibold text-xs"
              disabled={createMutation.isPending}
              data-testid="button-submit-log"
            >
              {createMutation.isPending ? "Speichern..." : "Eintrag erstellen"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Filter Bar ────────────────────────────────────────── */}
      <Card className="border-[hsl(110,25%,18%)]" data-testid="card-log-filters">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-7 text-xs w-36" data-testid="filter-category">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="h-7 text-xs w-28" data-testid="filter-sector">
                <SelectValue placeholder="Sektor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Sektoren</SelectItem>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-7 text-xs w-28" data-testid="filter-priority">
                <SelectValue placeholder="Priorität" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-7 text-xs w-32"
              placeholder="Von"
              data-testid="filter-date-from"
            />
            <span className="text-xs text-muted-foreground">bis</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-7 text-xs w-32"
              placeholder="Bis"
              data-testid="filter-date-to"
            />
            {(filterCategory !== "all" || filterSector !== "all" || filterPriority !== "all" || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterSector("all");
                  setFilterPriority("all");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                data-testid="button-clear-filters"
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Timeline / List ───────────────────────────────────── */}
      <div className="space-y-2" data-testid="log-entries-list">
        {filtered.length === 0 ? (
          <Card className="border-[hsl(110,25%,18%)]">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? "Noch keine Einträge vorhanden. Erstelle den ersten Eintrag oben."
                  : "Keine Einträge für die gewählten Filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((entry) => {
            const pBadge = priorityBadge(entry.priority);
            return (
              <Card
                key={entry.id}
                className={`border-[hsl(110,25%,18%)] ${
                  entry.priority === "dringend" ? "border-l-2 border-l-red-600" :
                  entry.priority === "wichtig" ? "border-l-2 border-l-yellow-600" : ""
                }`}
                data-testid={`log-entry-${entry.id}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Date badge */}
                      <div className="shrink-0 w-14 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", { weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold leading-tight">
                          {new Date(entry.date + "T12:00:00").getDate()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(entry.date + "T12:00:00").toLocaleDateString("de-DE", { month: "short", year: "2-digit" })}
                        </p>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={`${categoryStyle(entry.category)} text-[10px] border-none`}>
                            {entry.category}
                          </Badge>
                          {entry.sector && (
                            <Badge variant="outline" className="text-[10px]">
                              {entry.sector}
                            </Badge>
                          )}
                          {pBadge && (
                            <Badge variant="outline" className={`text-[10px] ${pBadge.cls}`}>
                              {pBadge.label}
                            </Badge>
                          )}
                          {entry.time && (
                            <span className="text-[10px] text-muted-foreground">{entry.time} Uhr</span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{entry.title}</p>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{entry.description}</p>
                        )}
                        {entry.weather && (
                          <p className="text-[10px] text-muted-foreground mt-1">Wetter: {entry.weather}</p>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      data-testid={`button-delete-log-${entry.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
