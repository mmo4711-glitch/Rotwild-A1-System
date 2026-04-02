import { useLocation } from "wouter";
import { useSidebar } from "@/components/ui/sidebar";
import {
  BookOpen,
  Compass,
  BarChart3,
  Map,
  Calendar,
  Target,
  TrendingDown,
  Leaf,
  ShieldCheck,
} from "lucide-react";

/* ─── antler/tree SVG logo ─── */
function AntlerLogo() {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Jagdhandbuch Merschbach Emblem"
    >
      {/* Outer circle */}
      <circle cx="40" cy="40" r="37" stroke="#c49a2a" strokeWidth="1.2" opacity="0.5" />
      <circle cx="40" cy="40" r="34" stroke="#c49a2a" strokeWidth="0.6" opacity="0.25" />

      {/* Tree trunk */}
      <line x1="40" y1="72" x2="40" y2="38" stroke="#c49a2a" strokeWidth="2" strokeLinecap="round" />

      {/* Tree/antler branches — left */}
      <path
        d="M40 52 L28 42 L22 30"
        stroke="#c49a2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M28 42 L24 46"
        stroke="#c49a2a"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 46 L32 36 L28 24"
        stroke="#c49a2a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32 36 L26 34"
        stroke="#c49a2a"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 40 L36 28 L34 16"
        stroke="#c49a2a"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M36 28 L30 26"
        stroke="#c49a2a"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tree/antler branches — right (mirrored) */}
      <path
        d="M40 52 L52 42 L58 30"
        stroke="#c49a2a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M52 42 L56 46"
        stroke="#c49a2a"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 46 L48 36 L52 24"
        stroke="#c49a2a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M48 36 L54 34"
        stroke="#c49a2a"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 40 L44 28 L46 16"
        stroke="#c49a2a"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M44 28 L50 26"
        stroke="#c49a2a"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Small tips — decorative endpoints */}
      <circle cx="22" cy="30" r="1.5" fill="#c49a2a" opacity="0.6" />
      <circle cx="58" cy="30" r="1.5" fill="#c49a2a" opacity="0.6" />
      <circle cx="34" cy="16" r="1.2" fill="#c49a2a" opacity="0.5" />
      <circle cx="46" cy="16" r="1.2" fill="#c49a2a" opacity="0.5" />
      <circle cx="28" cy="24" r="1.2" fill="#c49a2a" opacity="0.5" />
      <circle cx="52" cy="24" r="1.2" fill="#c49a2a" opacity="0.5" />

      {/* Root lines */}
      <path
        d="M40 72 L36 76 M40 72 L44 76 M40 72 L40 77"
        stroke="#c49a2a"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

/* ─── Sparkline component ─── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block ml-2">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Revier-Steckbrief data ─── */
const steckbriefData = [
  { label: "Gesamtfläche", value: "312 ha" },
  { label: "Wald", value: "240 ha (77%)" },
  { label: "Offenland", value: "72 ha (23%)" },
  { label: "Höhenlage", value: "340–520 m ü.NN" },
  { label: "Rotwild-Bestand", value: "~45 Stück" },
  { label: "Zielbestand (K)", value: "62 / 120" },
  { label: "Hochsitze", value: "5 (Typ A/B/C)" },
  { label: "Wildkameras", value: "3 Stationen" },
];

/* ─── Quick-Links data ─── */
const quickLinks = [
  {
    title: "Handbuch",
    route: "/handbuch",
    desc: "12 Kapitel",
    icon: BookOpen,
  },
  {
    title: "Populationsmodell",
    route: "/population",
    desc: "Leslie-Matrix + Monte Carlo",
    icon: BarChart3,
  },
  {
    title: "Karte",
    route: "/habitat",
    desc: "HSI + Zonen",
    icon: Map,
  },
  {
    title: "Kalender",
    route: "/kalender",
    desc: "Jagdzeiten + Thermik",
    icon: Calendar,
  },
  {
    title: "Strecke",
    route: "/strecke",
    desc: "Erfassung + Begehungsschein",
    icon: Target,
  },
  {
    title: "Philosophie",
    route: "/philosophie",
    desc: "25 Grundsätze",
    icon: Compass,
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const { setOpen } = useSidebar();

  const handleQuickLink = (route: string) => {
    setOpen(true);
    navigate(route);
  };

  return (
    <div className="min-h-full" data-testid="page-landing">
      {/* ─── Hero Section ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-6 py-16">
        {/* Subtle radial gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, hsla(130,25%,12%,0.6) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <AntlerLogo />

          <h1
            className="mt-6 font-display text-3xl md:text-4xl font-semibold tracking-[0.25em] text-[#c49a2a] uppercase"
            data-testid="text-hero-title"
          >
            Jagdhandbuch
          </h1>

          <p className="mt-2 text-lg text-foreground/80 font-light tracking-wide">
            Eigenjagdbezirk Merschbach
          </p>

          <p className="mt-2 text-sm text-[#8b9a7a] tracking-wider">
            312 ha · Hunsrück · Rheinland-Pfalz
          </p>

          {/* Animated separator line */}
          <div className="mt-6 w-32 h-px relative overflow-hidden">
            <div className="absolute inset-0 bg-[#c49a2a]/30" />
            <div
              className="absolute inset-y-0 w-16 bg-[#c49a2a]"
              style={{
                animation: "shimmer 3s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0%, 100% { transform: translateX(-64px); opacity: 0.4; }
            50% { transform: translateX(128px); opacity: 1; }
          }
        `}</style>
      </section>

      {/* ─── Revier-Steckbrief ─── */}
      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-[#c49a2a] uppercase mb-6 text-center">
          Revier-Steckbrief
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steckbriefData.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-4"
              data-testid={`card-steckbrief-${item.label.toLowerCase().replace(/[^a-z]/g, "")}`}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Aktueller Status (3 cards) ─── */}
      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-[#c49a2a] uppercase mb-6 text-center">
          Aktueller Status
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Populationsdynamik */}
          <div
            className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-5 space-y-3 cursor-pointer hover:border-[#c49a2a]/40 transition-colors"
            onClick={() => handleQuickLink("/population")}
            data-testid="card-status-population"
          >
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-[#c49a2a]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Populationsdynamik
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-2xl font-mono font-bold text-foreground">N=45</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>λ = 0.969</div>
                <div>N<sub>e</sub> = 43</div>
              </div>
              <MiniSparkline data={[45, 44, 43, 44, 43, 42, 43, 44, 43, 45]} color="#c49a2a" />
            </div>
          </div>

          {/* Card 2: Habitat-Qualität */}
          <div
            className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-5 space-y-3 cursor-pointer hover:border-[#c49a2a]/40 transition-colors"
            onClick={() => handleQuickLink("/habitat")}
            data-testid="card-status-habitat"
          >
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-[#8b9a7a]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Habitat-Qualität
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { zone: "Zone A", hsi: 0.82, w: "82%" },
                { zone: "Zone B", hsi: 0.72, w: "72%" },
                { zone: "Zone C", hsi: 0.68, w: "68%" },
              ].map((z) => (
                <div key={z.zone} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-12">{z.zone}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: z.w, background: "#8b9a7a" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground">{z.hsi.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Compliance */}
          <div
            className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-5 space-y-3 cursor-pointer hover:border-[#c49a2a]/40 transition-colors"
            onClick={() => handleQuickLink("/philosophie")}
            data-testid="card-status-compliance"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#4a9e4a]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Compliance
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-mono font-bold text-[#4a9e4a]">25/25</span>
              <span className="text-xs text-muted-foreground">Grundsätze</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: "#c49a2a20", color: "#c49a2a", border: "1px solid #c49a2a40" }}
              >
                1 Blocker aktiv
              </span>
              <span className="text-muted-foreground">Zone A</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Quick-Links (3×2) ─── */}
      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-[#c49a2a] uppercase mb-6 text-center">
          Module
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => handleQuickLink(link.route)}
              className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-4 text-left hover:border-[#c49a2a]/40 hover:bg-[hsl(130,20%,12%)] transition-colors group"
              data-testid={`quicklink-${link.route.replace("/", "")}`}
            >
              <link.icon className="h-5 w-5 text-[#c49a2a] mb-2 group-hover:text-[#d4aa3a] transition-colors" />
              <div className="text-sm font-semibold text-foreground">{link.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 pb-8 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground/60 tracking-wide">
          v2.1.0 · Rotwild-A1 · Wissenschaftlich fundiert · Gaillard et al. 2000 · Carpio et al. 2021 · Laumeier et al. 2025
        </p>
        <p className="text-[10px] text-muted-foreground/40">
          © 2026 Jagdhandbuch Merschbach
        </p>
      </footer>
    </div>
  );
}
