import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Monitor,
  Cpu,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  BookOpen,
  ExternalLink,
} from "lucide-react";

/* ─── Architecture Flow Box Component ─── */
function FlowBox({
  title,
  items,
  icon: Icon,
  accentColor = "#c49a2a",
}: {
  title: string;
  items: string[];
  icon: typeof Database;
  accentColor?: string;
}) {
  return (
    <div
      className="rounded-lg border border-[hsl(110,25%,18%)] bg-[hsl(130,20%,10%)] p-4 min-w-[180px]"
      style={{ borderTopColor: accentColor, borderTopWidth: "2px" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: accentColor }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {title}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Arrow components ─── */
function HArrow() {
  return (
    <div className="flex items-center justify-center px-1">
      <ArrowRight className="h-5 w-5 text-[#c49a2a]/50" />
    </div>
  );
}

function VArrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <ArrowDown className="h-5 w-5 text-[#c49a2a]/50" />
    </div>
  );
}

/* ─── Tech-Stack data ─── */
const techStack = [
  { component: "Frontend", tech: "React + TypeScript + Vite", version: "19.x" },
  { component: "UI Framework", tech: "shadcn/ui + Tailwind CSS", version: "3.x" },
  { component: "Charts", tech: "Recharts", version: "2.x" },
  { component: "Karten", tech: "Leaflet + React-Leaflet", version: "4.x" },
  { component: "Matrixalgebra", tech: "ml-matrix", version: "6.x" },
  { component: "Statistik", tech: "simple-statistics", version: "7.x" },
  { component: "Datenbank", tech: "SQLite + Drizzle ORM", version: "—" },
  { component: "Backend", tech: "Express.js + Node.js", version: "22.x" },
];

/* ─── Wissenschaftliche Quellen ─── */
const references = [
  {
    thema: "Vitalraten-Variabilität",
    quelle: "Gaillard et al. 2000",
    referenz: "Annual Review of Ecology",
    url: "https://doi.org/10.1146/annurev.ecolsys.31.1.367",
  },
  {
    thema: "Rotwild Rum-Langzeitstudie",
    quelle: "Rose et al. 1998",
    referenz: "Journal of Animal Ecology",
    url: "https://doi.org/10.1046/j.1365-2656.1998.00189.x",
  },
  {
    thema: "Dichteabhängigkeit Huftiere",
    quelle: "Bonenfant et al. 2009",
    referenz: "Advances in Ecological Research",
    url: "https://doi.org/10.1016/S0065-2504(09)00405-X",
  },
  {
    thema: "Theta-logistic gescheitert",
    quelle: "Clark et al. 2010",
    referenz: "Methods in Ecology and Evolution",
    url: "https://doi.org/10.1111/j.2041-210X.2010.00029.x",
  },
  {
    thema: "Rotwild Iberian Peninsula",
    quelle: "Carpio et al. 2021",
    referenz: "PeerJ",
    url: "https://doi.org/10.7717/peerj.10519",
  },
  {
    thema: "Genetik deutsche AMUs",
    quelle: "Laumeier et al. 2025",
    referenz: "PLOS ONE",
    url: "https://doi.org/10.1371/journal.pone.0313975",
  },
  {
    thema: "RLP Genotypisierung",
    quelle: "Zachos et al. 2013",
    referenz: "Rothirsch.org",
    url: "https://www.rothirsch.org",
  },
  {
    thema: "Rotwild Bohemian Forest",
    quelle: "Ebert et al. 2023",
    referenz: "Scientific Reports",
    url: "https://doi.org/10.1038/s41598-023-43078-x",
  },
  {
    thema: "RAG Chunking Best Practice",
    quelle: "Weaviate 2025",
    referenz: "weaviate.io",
    url: "https://weaviate.io/blog/chunking-strategies",
  },
  {
    thema: "HSI Waldhabitat",
    quelle: "Borowik et al. 2013",
    referenz: "Acta Theriologica",
    url: "https://doi.org/10.1007/s13364-013-0155-0",
  },
];

/* ─── Module-Übersicht ─── */
const modules = [
  { nr: 0, modul: "Landing", route: "/", features: "Revier-Steckbrief, KPIs, Quick-Links" },
  { nr: 1, modul: "Handbuch", route: "/handbuch", features: "12 Kapitel, SVG-Embleme" },
  { nr: 2, modul: "Philosophie", route: "/philosophie", features: "25 Grundsätze, 3 Blocker, Compliance" },
  { nr: 3, modul: "Population", route: "/population", features: "Pyramide, Fan-Chart, λ, Sensitivität, Szenarios" },
  { nr: 4, modul: "Habitat", route: "/habitat", features: "Leaflet, HSI, 6 Covariaten, Was-wäre-wenn" },
  { nr: 5, modul: "Genetik", route: "/genetik", features: "Ne-Rechner, Schwellenwerte" },
  { nr: 6, modul: "Wildschaden", route: "/wildschaden", features: "Risikomodell, Abschuss-Optimierer" },
  { nr: 7, modul: "Kalender", route: "/kalender", features: "Monatsansicht, Sektorrotation, Thermik" },
  { nr: 8, modul: "Strecke", route: "/strecke", features: "Erfassung, Begehungsschein" },
  { nr: 9, modul: "Health", route: "/health", features: "Dienststatus, BM25" },
  { nr: 10, modul: "Architektur", route: "/architektur", features: "Systemdoku, Tech-Stack, Quellen" },
];

export default function Architektur() {
  return (
    <div className="p-4 space-y-4" data-testid="page-architektur">
      {/* Title */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Architektur
        </h2>
        <span className="text-xs text-muted-foreground">Systemdokumentation · Tech-Stack · Quellen</span>
      </div>

      {/* ─── Section 1: Systemübersicht ─── */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#c49a2a]" />
            Systemübersicht — Datenfluss
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Top row: 3 boxes with arrows */}
          <div className="flex items-stretch justify-center gap-0 overflow-x-auto py-2">
            <FlowBox
              title="Felddaten"
              items={["Strecke", "Kamera", "GPS", "Beobachtung"]}
              icon={Database}
              accentColor="#8b9a7a"
            />
            <HArrow />
            <FlowBox
              title="Modelle"
              items={["Leslie 6×6", "Monte Carlo", "HSI 6-Cov", "Bonenfant"]}
              icon={Cpu}
              accentColor="#c49a2a"
            />
            <HArrow />
            <FlowBox
              title="Visualisierung"
              items={["Pyramide", "Fan-Chart", "Leaflet", "Radar"]}
              icon={Monitor}
              accentColor="#5b9bd5"
            />
          </div>

          {/* Vertical connections */}
          <div className="flex justify-center gap-0 py-0">
            <div className="flex items-center justify-center" style={{ width: "180px" }}>
              <VArrow />
            </div>
            <div style={{ width: "20px" }} />
            <div className="flex items-center justify-center" style={{ width: "180px" }}>
              <VArrow />
            </div>
            <div style={{ width: "20px" }} />
            <div style={{ width: "180px" }} />
          </div>

          {/* Bottom row: 2 boxes */}
          <div className="flex items-stretch justify-center gap-0 py-0">
            <FlowBox
              title="Regelwerk"
              items={["25 Grundsätze", "3 Blocker", "Compliance"]}
              icon={BookOpen}
              accentColor="#4a9e4a"
            />
            <HArrow />
            <FlowBox
              title="Entscheidung"
              items={["Abschussplan", "Empfehlung", "Warnung"]}
              icon={CheckCircle}
              accentColor="#b44040"
            />
          </div>

          <div className="mt-3 text-[10px] text-muted-foreground text-center">
            Datenfluss: Feld → Modell → Visualisierung · Regelwerk → Entscheidung
          </div>
        </CardContent>
      </Card>

      {/* ─── Section 2: Tech-Stack ─── */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Monitor className="h-4 w-4 text-[#c49a2a]" />
            Tech-Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Komponente</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Technologie</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {techStack.map((row) => (
                  <TableRow key={row.component} className="border-card-border">
                    <TableCell className="text-sm font-medium text-foreground">{row.component}</TableCell>
                    <TableCell className="text-sm text-foreground font-mono text-[12px]">{row.tech}</TableCell>
                    <TableCell className="text-sm font-mono text-right text-muted-foreground">
                      {row.version}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Section 3: Wissenschaftliche Grundlagen ─── */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#c49a2a]" />
            Wissenschaftliche Grundlagen
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Thema</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Quelle</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Referenz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {references.map((ref) => (
                  <TableRow key={ref.quelle} className="border-card-border">
                    <TableCell className="text-sm text-foreground">{ref.thema}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{ref.quelle}</TableCell>
                    <TableCell className="text-sm">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c49a2a] hover:underline inline-flex items-center gap-1"
                        data-testid={`link-ref-${ref.quelle.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {ref.referenz}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Section 4: Module-Übersicht ─── */}
      <Card className="bg-card border-card-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#c49a2a]" />
            Module-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="rounded-lg border border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground w-10">#</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Modul</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Route</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-center">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Features</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((mod) => (
                  <TableRow key={mod.nr} className="border-card-border">
                    <TableCell className="text-sm font-mono text-muted-foreground">{mod.nr}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{mod.modul}</TableCell>
                    <TableCell className="text-sm font-mono text-[12px] text-muted-foreground">
                      {mod.route}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0"
                        style={{ borderColor: "#4a9e4a", color: "#4a9e4a" }}
                      >
                        ✅ Live
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{mod.features}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
