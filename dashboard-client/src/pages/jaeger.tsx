import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Users, Wallet, Apple, Eye } from "lucide-react";
import { WalletPassDialog, WalletPassCard, type PassData } from "@/components/jagdschein";
import type { Hunter } from "@shared/schema";

const TYPES = ["Jahresjagdschein", "Tagesjagdschein", "Jugendjagdschein"] as const;
const STATUSES = ["aktiv", "gesperrt", "abgelaufen", "ruht"] as const;
const ROLES = ["Pächter", "Begehungsscheininhaber", "Gast"] as const;

function suggestNr(existing: { jagdscheinNr: string }[]): string {
  const year = new Date().getFullYear();
  const prefix = `RLP-BKS-${year}-`;
  const used = new Set(
    existing
      .filter((h) => h.jagdscheinNr.startsWith(prefix))
      .map((h) => parseInt(h.jagdscheinNr.slice(prefix.length), 10))
      .filter((n) => Number.isFinite(n))
  );
  let n = 1;
  while (used.has(n)) n++;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    aktiv: { bg: "#4a9e4a22", fg: "#6fbf5e", label: "aktiv" },
    abgelaufen: { bg: "#c49a2a22", fg: "#c49a2a", label: "abgelaufen" },
    gesperrt: { bg: "#b4404022", fg: "#c45a4a", label: "gesperrt" },
    ruht: { bg: "#55555522", fg: "#a0a0a0", label: "ruht" },
  };
  const s = map[status] || map.ruht;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.fg}44` }}
    >
      {s.label}
    </span>
  );
}

export default function Jaeger() {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().slice(0, 10);

  const { data: hunters = [], isLoading } = useQuery<Omit<Hunter, "passwordHash">[]>({
    queryKey: ["/api/hunters"],
  });

  const [nr, setNr] = useState("");
  const [pw, setPw] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [validFrom, setValidFrom] = useState(today);
  const [validUntil, setValidUntil] = useState(nextYearStr);
  const [issuer, setIssuer] = useState("LK Bernkastel-Wittlich");
  const [type, setType] = useState<string>("Jahresjagdschein");
  const [status, setStatus] = useState<string>("aktiv");
  const [revier, setRevier] = useState("EJB Merschbach");
  const [role, setRole] = useState<string>("Begehungsscheininhaber");

  // Pass preview state
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletVariant, setWalletVariant] = useState<"apple" | "google" | null>(null);
  const [walletData, setWalletData] = useState<PassData | null>(null);
  const [previewData, setPreviewData] = useState<PassData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const suggested = useMemo(() => suggestNr(hunters), [hunters]);

  const resetForm = () => {
    setNr("");
    setPw("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setValidFrom(today);
    setValidUntil(nextYearStr);
    setIssuer("LK Bernkastel-Wittlich");
    setType("Jahresjagdschein");
    setStatus("aktiv");
    setRevier("EJB Merschbach");
    setRole("Begehungsscheininhaber");
  };

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/hunters", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      toast({
        title: "Jäger registriert",
        description: "Der Jagdschein wurde erfolgreich angelegt.",
      });
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: "Fehler",
        description: err?.message || "Anlage fehlgeschlagen.",
        variant: "destructive",
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hunters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      toast({ title: "Jäger gelöscht" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNr = (nr || suggested).trim();
    if (!finalNr || !pw || !firstName || !lastName) {
      toast({
        title: "Fehlende Angaben",
        description: "Nr, Passwort, Vor- und Nachname sind Pflicht.",
        variant: "destructive",
      });
      return;
    }
    createMut.mutate({
      jagdscheinNr: finalNr,
      password: pw,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate || null,
      validFrom,
      validUntil,
      issuer,
      type,
      status,
      revier: revier || null,
      role,
      photoUrl: null,
      notes: null,
    });
  };

  const openWallet = (h: Omit<Hunter, "passwordHash">, variant: "apple" | "google") => {
    setWalletVariant(variant);
    setWalletData({
      jagdscheinNr: h.jagdscheinNr,
      name: `${h.firstName} ${h.lastName}`,
      validFrom: h.validFrom,
      validUntil: h.validUntil,
      type: h.type,
      status: h.status,
      revier: h.revier,
      role: h.role,
      issuer: h.issuer,
    });
    setWalletOpen(true);
  };

  const openPreview = (h: Omit<Hunter, "passwordHash">) => {
    setPreviewData({
      jagdscheinNr: h.jagdscheinNr,
      name: `${h.firstName} ${h.lastName}`,
      validFrom: h.validFrom,
      validUntil: h.validUntil,
      type: h.type,
      status: h.status,
      revier: h.revier,
      role: h.role,
      issuer: h.issuer,
    });
    setPreviewOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8" data-testid="page-jaeger">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-[0.18em] uppercase text-[#c49a2a]">
          Jägerverwaltung
        </h1>
        <p className="text-sm text-muted-foreground">
          Registrierte Jagdscheine · Administration · {hunters.length} Jäger im System
        </p>
      </div>

      {/* Registration Form */}
      <Card className="bg-[hsl(130,20%,10%)] border-[hsl(110,25%,18%)]">
        <CardHeader className="border-b border-[hsl(110,25%,18%)]">
          <CardTitle className="flex items-center gap-2 text-sm font-display tracking-[0.14em] uppercase text-foreground/90">
            <UserPlus className="h-4 w-4 text-[#c49a2a]" />
            Neuer Jäger · Registrierung
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Jagdschein-Nr.
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={nr}
                    onChange={(e) => setNr(e.target.value)}
                    placeholder={suggested}
                    className="font-mono text-sm"
                    data-testid="input-jaeger-nr"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap text-xs"
                    onClick={() => setNr(suggested)}
                    data-testid="button-suggest-nr"
                  >
                    Vorschlag
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Passwort (initial)
                </Label>
                <Input
                  type="text"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="mind. 3 Zeichen"
                  className="mt-1.5 font-mono text-sm"
                  data-testid="input-jaeger-password"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Vorname
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-firstname"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Nachname
                </Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-lastname"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Geburtsdatum
                </Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-birthdate"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ausstellende Behörde
                </Label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-issuer"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Gültig von
                </Label>
                <Input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-valid-from"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Gültig bis
                </Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-valid-until"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Typ
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Revier
                </Label>
                <Input
                  value={revier}
                  onChange={(e) => setRevier(e.target.value)}
                  className="mt-1.5"
                  data-testid="input-revier"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Rolle
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={createMut.isPending}
                className="bg-[#c49a2a] hover:bg-[#d4aa3a] text-[hsl(130,25%,7%)] font-semibold tracking-wider uppercase text-xs"
                data-testid="button-register-hunter"
              >
                {createMut.isPending ? "Speichere…" : "Jäger registrieren"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="text-xs"
              >
                Zurücksetzen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Registered Hunters Table */}
      <Card className="bg-[hsl(130,20%,10%)] border-[hsl(110,25%,18%)]">
        <CardHeader className="border-b border-[hsl(110,25%,18%)]">
          <CardTitle className="flex items-center gap-2 text-sm font-display tracking-[0.14em] uppercase text-foreground/90">
            <Users className="h-4 w-4 text-[#c49a2a]" />
            Registrierte Jäger · {hunters.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Lade Jäger…</div>
          ) : hunters.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Noch keine Jäger registriert.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(110,25%,18%)]">
                    <TableHead className="text-[10px] uppercase tracking-widest">Nr</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest">Name</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest">Typ</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest">Gültig bis</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest">Rolle</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-widest text-right">
                      Aktionen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hunters.map((h) => (
                    <TableRow
                      key={h.id}
                      className="border-[hsl(110,25%,18%)]"
                      data-testid={`row-hunter-${h.id}`}
                    >
                      <TableCell className="font-mono text-xs">{h.jagdscheinNr}</TableCell>
                      <TableCell className="text-sm">
                        {h.firstName} {h.lastName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.type}</TableCell>
                      <TableCell>{statusBadge(h.status)}</TableCell>
                      <TableCell className="text-xs font-mono">{formatDate(h.validUntil)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.role || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openPreview(h)}
                            title="Pass-Vorschau"
                            data-testid={`button-preview-${h.id}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openWallet(h, "apple")}
                            title="Apple Wallet"
                            data-testid={`button-apple-${h.id}`}
                          >
                            <Apple className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openWallet(h, "google")}
                            title="Google Wallet"
                            data-testid={`button-google-${h.id}`}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-[#c45a4a] hover:text-[#e06060] hover:bg-[#c4404014]"
                            onClick={() => {
                              if (confirm(`Jäger ${h.jagdscheinNr} wirklich löschen?`)) {
                                deleteMut.mutate(h.id);
                              }
                            }}
                            data-testid={`button-delete-${h.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Dialog */}
      <WalletPassDialog
        open={walletOpen}
        onOpenChange={setWalletOpen}
        variant={walletVariant}
        data={walletData}
      />

      {/* Simple preview dialog */}
      {previewOpen && previewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <WalletPassCard data={previewData} />
            <div className="mt-4 text-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="text-xs"
              >
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
