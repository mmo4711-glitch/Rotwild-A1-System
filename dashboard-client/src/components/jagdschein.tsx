import { useState, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldX, ShieldAlert, Loader2, Wallet, Printer, Apple } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   SHA-256 helper (browser)
   ───────────────────────────────────────────────────────────── */
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ─────────────────────────────────────────────────────────────
   Deterministic pseudo-QR: 21×21 grid derived from the Nr
   Not a real QR, but looks the part and is unique per Nr.
   ───────────────────────────────────────────────────────────── */
function pseudoQrBits(input: string): boolean[][] {
  const SIZE = 21;
  // FNV-1a hash into a long stream by re-hashing with counter
  function fnv(s: string, salt: number): number {
    let h = 2166136261 ^ salt;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  const bits: boolean[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < SIZE; c++) {
      const idx = r * SIZE + c;
      const salt = Math.floor(idx / 32);
      const shift = idx % 32;
      const h = fnv(input, salt);
      row.push(((h >> shift) & 1) === 1);
    }
    bits.push(row);
  }
  // Draw 3 finder patterns (top-left, top-right, bottom-left)
  const finder = (r0: number, c0: number) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const innerBlack = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const innerWhite =
          (dr === 1 || dr === 5 || dc === 1 || dc === 5) &&
          dr >= 1 && dr <= 5 && dc >= 1 && dc <= 5;
        bits[r0 + dr][c0 + dc] = onBorder || innerBlack ? true : innerWhite ? false : false;
      }
    }
  };
  finder(0, 0);
  finder(0, SIZE - 7);
  finder(SIZE - 7, 0);
  // Quiet zone corners near finders
  for (let i = 0; i < 8; i++) {
    if (bits[7]) bits[7][i] = false;
    if (bits[i]) bits[i][7] = false;
    if (bits[7]) bits[7][SIZE - 1 - i] = false;
    if (bits[i]) bits[i][SIZE - 8] = false;
    if (bits[SIZE - 8]) bits[SIZE - 8][i] = false;
    if (bits[SIZE - 1 - i]) bits[SIZE - 1 - i][7] = false;
  }
  return bits;
}

/* ─────────────────────────────────────────────────────────────
   Pass preview data type
   ───────────────────────────────────────────────────────────── */
export interface PassData {
  jagdscheinNr: string;
  name: string;
  firstName?: string;
  lastName?: string;
  validUntil: string;
  validFrom?: string;
  type: string;
  status: string;
  revier?: string | null;
  role?: string | null;
  issuer?: string;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

/* ─────────────────────────────────────────────────────────────
   The beautifully-styled wallet pass card
   ───────────────────────────────────────────────────────────── */
export function WalletPassCard({ data }: { data: PassData }) {
  const bits = pseudoQrBits(data.jagdscheinNr);
  const statusValid = data.status === "aktiv";
  const statusColor = statusValid ? "#6fbf5e" : data.status === "abgelaufen" ? "#d49a2a" : "#c45a4a";

  return (
    <div
      className="relative rounded-[18px] overflow-hidden shadow-2xl"
      style={{
        width: 340,
        maxWidth: "100%",
        background:
          "linear-gradient(155deg, #1e3a22 0%, #1a2e1a 45%, #12221a 100%)",
        border: "1px solid rgba(196,154,42,0.35)",
      }}
      data-testid="wallet-pass-card"
    >
      {/* Decorative top gold hairline */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, transparent 0%, #c49a2a 25%, #e9c66b 50%, #c49a2a 75%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          {/* Antler mark */}
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
            <line x1="16" y1="29" x2="16" y2="15" stroke="#c49a2a" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M16 20 L11 16 L9 11" stroke="#c49a2a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M16 20 L21 16 L23 11" stroke="#c49a2a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M16 17 L13 13 L12 8" stroke="#c49a2a" strokeWidth="1" strokeLinecap="round" fill="none" />
            <path d="M16 17 L19 13 L20 8" stroke="#c49a2a" strokeWidth="1" strokeLinecap="round" fill="none" />
          </svg>
          <div>
            <div
              className="font-display font-semibold text-[13px] tracking-[0.28em] leading-tight"
              style={{ color: "#e9c66b", fontFamily: "Cinzel, serif" }}
            >
              JAGDSCHEIN
            </div>
            <div className="text-[10px] tracking-wider text-[#9aae8f] mt-0.5">
              Eigenjagdbezirk Merschbach
            </div>
          </div>
        </div>
        <div
          className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase"
          style={{
            color: statusColor,
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}55`,
          }}
        >
          {statusValid ? "GÜLTIG" : data.status.toUpperCase()}
        </div>
      </div>

      {/* Gold divider */}
      <div
        className="mx-5"
        style={{ height: 1, background: "linear-gradient(90deg, transparent, #c49a2a66, transparent)" }}
      />

      {/* Name block */}
      <div className="px-5 pt-4 pb-3">
        <div className="text-[9px] uppercase tracking-[0.22em] text-[#8ea386] mb-1.5">Inhaber</div>
        <div
          className="font-display font-semibold text-[20px] tracking-wider leading-tight text-white uppercase"
          style={{ fontFamily: "Cinzel, serif" }}
        >
          {data.name}
        </div>
      </div>

      {/* Details grid */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
        <DetailLine label="NR" value={data.jagdscheinNr} mono />
        <DetailLine label="Gültig bis" value={formatDate(data.validUntil)} />
        <DetailLine label="Typ" value={data.type} />
        <DetailLine label="Rolle" value={data.role || "—"} />
        <DetailLine label="Revier" value={data.revier || "—"} />
        <DetailLine label="Ausstellung" value={data.issuer || "LK Bernkastel-Wittlich"} />
      </div>

      {/* QR + Status row */}
      <div className="px-5 pb-5 flex items-end gap-4">
        <div
          className="p-2 rounded"
          style={{ background: "#f2ead6", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(21, 4px)`,
              gridTemplateRows: `repeat(21, 4px)`,
              gap: 0,
            }}
            aria-label={`QR-Code für ${data.jagdscheinNr}`}
          >
            {bits.flatMap((row, r) =>
              row.map((on, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: 4,
                    height: 4,
                    background: on ? "#1a2e1a" : "transparent",
                  }}
                />
              ))
            )}
          </div>
        </div>
        <div className="flex-1 text-right">
          <div className="text-[9px] tracking-widest text-[#8ea386] uppercase">Scan to verify</div>
          <div className="text-[10px] font-mono text-[#c8d6bf] mt-1 break-all">
            verify/{data.jagdscheinNr}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 flex items-center justify-between text-[9px] tracking-wider uppercase"
        style={{
          background: "rgba(0,0,0,0.25)",
          borderTop: "1px solid rgba(196,154,42,0.2)",
          color: "#9aae8f",
        }}
      >
        <span>LK Bernkastel-Wittlich · RLP</span>
        <span style={{ color: "#c49a2a" }}>Merschbach</span>
      </div>
    </div>
  );
}

function DetailLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[8.5px] uppercase tracking-[0.18em] text-[#8ea386] mb-0.5">{label}</div>
      <div
        className="text-[12px] text-white leading-tight"
        style={mono ? { fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.02em" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Wallet modal (Apple / Google simulation)
   ───────────────────────────────────────────────────────────── */
export function WalletPassDialog({
  open,
  onOpenChange,
  variant,
  data,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  variant: "apple" | "google" | null;
  data: PassData | null;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!data) return null;

  const isApple = variant === "apple";
  const title = isApple ? "Apple Wallet · Pass-Vorschau" : "Google Wallet · Pass-Vorschau";
  const note = isApple
    ? "Für echte Apple Wallet Integration wird ein Apple Developer Zertifikat (Pass Type ID + Signing Key) benötigt. Diese Vorschau zeigt, wie Ihr Pass aussehen würde. Kontakt: admin@merschbach-jagd.de"
    : "Für echte Google Wallet Integration wird ein Google Cloud Service Account mit signiertem JWT Save-Link benötigt. Diese Vorschau zeigt, wie Ihr Pass aussehen würde. Kontakt: admin@merschbach-jagd.de";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[hsl(130,20%,9%)] border-[hsl(110,25%,18%)]">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-sm tracking-[0.18em] uppercase font-display text-[#c49a2a] flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div
          className="px-5 pb-5 flex flex-col items-center gap-4 print:bg-white"
          ref={cardRef}
        >
          <WalletPassCard data={data} />

          <p className="text-[11px] text-muted-foreground leading-relaxed text-center max-w-[320px] px-2 print:hidden">
            {note}
          </p>

          <div className="flex items-center gap-2 w-full max-w-[340px] print:hidden">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handlePrint}
              data-testid="button-print-pass"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Als Bild speichern
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-[#c49a2a] hover:bg-[#d4aa3a] text-[hsl(130,25%,7%)]"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-pass"
            >
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────
   Verification widget — used on the landing page
   ───────────────────────────────────────────────────────────── */
type VerifyResult =
  | ({ mode: "full"; valid: boolean; reason: string | null } & PassData & { message?: string })
  | { mode: "full"; valid: false; reason: string; message?: string }
  | { mode: "simple"; valid: boolean; jagdscheinNr: string; status: string; validUntil?: string; reason?: string };

export function JagdscheinVerificationWidget() {
  const [simpleMode, setSimpleMode] = useState(false);
  const [nr, setNr] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletVariant, setWalletVariant] = useState<"apple" | "google" | null>(null);

  const handleReset = () => {
    setResult(null);
    setErr(null);
  };

  const handleFullVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nr.trim() || !pw) {
      setErr("Bitte Nr und Passwort eingeben.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const hash = await sha256Hex(pw);
      const res = await apiRequest("POST", "/api/verify", {
        jagdscheinNr: nr.trim(),
        passwordHash: hash,
      });
      const json = await res.json();
      setResult({ mode: "full", ...json });
    } catch (e: any) {
      setErr("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimpleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nr.trim()) {
      setErr("Bitte Jagdschein-Nr eingeben.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await apiRequest("GET", `/api/verify/${encodeURIComponent(nr.trim())}`);
      const json = await res.json();
      setResult({ mode: "simple", ...json });
    } catch (e: any) {
      setErr("Verbindungsfehler.");
    } finally {
      setLoading(false);
    }
  };

  const openWallet = (variant: "apple" | "google") => {
    setWalletVariant(variant);
    setWalletOpen(true);
  };

  // Result-state UI
  let resultCard: React.ReactNode = null;

  if (result) {
    if (result.mode === "simple") {
      const valid = result.valid;
      const isExpired = result.status === "abgelaufen";
      const color = valid ? "#4a9e4a" : isExpired ? "#c49a2a" : "#b44040";
      const label = valid ? "GÜLTIG" : isExpired ? "ABGELAUFEN" : "UNGÜLTIG";
      resultCard = (
        <div
          className="rounded-lg p-4 flex items-center gap-3"
          style={{
            border: `1px solid ${color}55`,
            background: `${color}14`,
          }}
          data-testid="simple-verify-result"
        >
          {valid ? (
            <ShieldCheck className="h-7 w-7" style={{ color }} />
          ) : isExpired ? (
            <ShieldAlert className="h-7 w-7" style={{ color }} />
          ) : (
            <ShieldX className="h-7 w-7" style={{ color }} />
          )}
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Status {result.jagdscheinNr}
            </div>
            <div className="font-display font-semibold text-sm" style={{ color }}>
              {label}
            </div>
            {result.validUntil && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Gültig bis: <span className="font-mono">{formatDate(result.validUntil)}</span>
              </div>
            )}
          </div>
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            onClick={handleReset}
            data-testid="button-reset-verify"
          >
            Neue Prüfung
          </button>
        </div>
      );
    } else {
      // full mode
      const full = result as any;
      const valid = full.valid;
      const reason = full.reason;
      const isExpired = reason === "abgelaufen";
      const isBlocked = reason === "gesperrt" || reason === "ruht";

      if (valid) {
        resultCard = (
          <div
            className="rounded-lg p-4 space-y-3"
            style={{
              border: "1px solid #4a9e4a55",
              background: "#4a9e4a14",
            }}
            data-testid="full-verify-result-valid"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#6fbf5e]" />
              <span className="font-display text-sm tracking-[0.18em] text-[#6fbf5e] uppercase font-semibold">
                ✓ Jagdschein gültig
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <Field label="Name" value={full.name} />
              <Field label="Nr" value={full.jagdscheinNr} mono />
              <Field label="Gültig bis" value={formatDate(full.validUntil)} />
              <Field label="Typ" value={full.type} />
              <Field label="Status" value={full.status} />
              <Field label="Revier" value={full.revier || "—"} />
              <Field label="Rolle" value={full.role || "—"} />
              <Field label="Ausstellung" value={full.issuer} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#4a9e4a33]">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs bg-black/30 border-white/20 text-white hover:bg-black/50"
                onClick={() => openWallet("apple")}
                data-testid="button-apple-wallet"
              >
                <Apple className="h-3.5 w-3.5 mr-1.5" />
                Apple Wallet
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs bg-white text-gray-900 hover:bg-gray-100 border-white/40"
                onClick={() => openWallet("google")}
                data-testid="button-google-wallet"
              >
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                Google Wallet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={handleReset}
              >
                Neu
              </Button>
            </div>
          </div>
        );
      } else if (isExpired) {
        resultCard = (
          <div
            className="rounded-lg p-4 space-y-2"
            style={{ border: "1px solid #c49a2a55", background: "#c49a2a14" }}
            data-testid="full-verify-result-expired"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-[#c49a2a]" />
              <span className="font-display text-sm tracking-[0.18em] text-[#c49a2a] uppercase font-semibold">
                ⚠ Abgelaufen
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Dieser Jagdschein ist abgelaufen seit{" "}
              <span className="text-foreground font-mono">{formatDate(full.validUntil)}</span>.
              Bitte Verlängerung bei der unteren Jagdbehörde beantragen.
            </div>
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={handleReset}
            >
              Neue Prüfung
            </button>
          </div>
        );
      } else {
        const msg =
          reason === "unknown_nr"
            ? "Jagdschein-Nr nicht gefunden."
            : reason === "wrong_password"
              ? "Falsches Passwort."
              : reason === "gesperrt"
                ? "Dieser Jagdschein wurde gesperrt."
                : reason === "ruht"
                  ? "Dieser Jagdschein ruht."
                  : full.message || "Nicht gültig.";
        resultCard = (
          <div
            className="rounded-lg p-4 space-y-2"
            style={{ border: "1px solid #b4404055", background: "#b4404014" }}
            data-testid="full-verify-result-invalid"
          >
            <div className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-[#c45a4a]" />
              <span className="font-display text-sm tracking-[0.18em] text-[#c45a4a] uppercase font-semibold">
                ✗ Nicht gültig
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{msg}</div>
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={handleReset}
            >
              Neue Prüfung
            </button>
          </div>
        );
      }
    }
  }

  // Wallet pass data
  const walletData: PassData | null =
    result && result.mode === "full" && (result as any).valid
      ? {
          jagdscheinNr: (result as any).jagdscheinNr,
          name: (result as any).name,
          validFrom: (result as any).validFrom,
          validUntil: (result as any).validUntil,
          type: (result as any).type,
          status: (result as any).status,
          revier: (result as any).revier,
          role: (result as any).role,
          issuer: (result as any).issuer,
        }
      : null;

  return (
    <section className="px-6 pb-12 max-w-2xl mx-auto" data-testid="section-jagdschein-verify">
      <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-[#c49a2a] uppercase mb-6 text-center">
        Jagdschein-Verifizierung
      </h2>

      <div
        className="rounded-lg p-6 space-y-4"
        style={{
          border: "1px solid hsl(110, 25%, 18%)",
          background: "hsl(130, 20%, 10%)",
          boxShadow: "0 0 0 1px rgba(196,154,42,0.08), inset 0 1px 0 rgba(196,154,42,0.06)",
        }}
      >
        {!result ? (
          <>
            <form
              onSubmit={simpleMode ? handleSimpleVerify : handleFullVerify}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  Jagdschein-Nr.
                </label>
                <Input
                  value={nr}
                  onChange={(e) => setNr(e.target.value)}
                  placeholder="RLP-BKS-2026-0001"
                  className="font-mono text-sm bg-[hsl(130,25%,7%)] border-[hsl(110,25%,18%)] focus-visible:ring-[#c49a2a]/40"
                  data-testid="input-jagdschein-nr"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {!simpleMode && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                    Passwort
                  </label>
                  <Input
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                    className="text-sm bg-[hsl(130,25%,7%)] border-[hsl(110,25%,18%)] focus-visible:ring-[#c49a2a]/40"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                </div>
              )}

              {err && (
                <div className="text-xs text-[#c45a4a]" data-testid="verify-error">
                  {err}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c49a2a] hover:bg-[#d4aa3a] text-[hsl(130,25%,7%)] font-semibold tracking-wider uppercase text-xs h-10"
                data-testid={simpleMode ? "button-status-check" : "button-verify"}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : simpleMode ? (
                  "Status prüfen"
                ) : (
                  "Verifizieren"
                )}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setSimpleMode((s) => !s);
                  setErr(null);
                }}
                className="text-[11px] text-muted-foreground hover:text-[#c49a2a] underline-offset-4 hover:underline transition-colors"
                data-testid="button-toggle-mode"
              >
                {simpleMode
                  ? "Vollständige Verifizierung (mit Passwort)"
                  : "Nur Status prüfen (ohne Passwort)"}
              </button>
            </div>

            <div className="pt-3 border-t border-[hsl(110,25%,18%)] text-[10px] text-muted-foreground text-center leading-relaxed">
              Passwort wird SHA-256-gehasht übertragen. Der öffentliche Status-Check zeigt keine
              personenbezogenen Daten.
            </div>
          </>
        ) : (
          resultCard
        )}
      </div>

      <WalletPassDialog
        open={walletOpen}
        onOpenChange={setWalletOpen}
        variant={walletVariant}
        data={walletData}
      />
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
      <div
        className="text-foreground"
        style={mono ? { fontFamily: "JetBrains Mono, monospace", fontSize: 12 } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
