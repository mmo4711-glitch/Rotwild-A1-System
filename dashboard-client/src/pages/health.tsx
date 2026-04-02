import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, HardDrive, Cpu, Wifi, BookOpen, Clock, Server } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  icon: React.ReactNode;
  latency?: string;
  detail?: string;
}

const services: ServiceStatus[] = [
  {
    name: "Populationsmodell",
    status: "online",
    icon: <Activity className="h-4 w-4" />,
    latency: "12ms",
    detail: "Leslie-Matrix + Monte Carlo aktiv",
  },
  {
    name: "HSI-Engine",
    status: "online",
    icon: <Cpu className="h-4 w-4" />,
    latency: "8ms",
    detail: "6-Kovariaten-Modell betriebsbereit",
  },
  {
    name: "GeoJSON-Service",
    status: "online",
    icon: <Wifi className="h-4 w-4" />,
    latency: "3ms",
    detail: "16 Features geladen",
  },
  {
    name: "BM25 Suchindex",
    status: "degraded",
    icon: <BookOpen className="h-4 w-4" />,
    latency: "45ms",
    detail: "Index nur teilweise aufgebaut (19%)",
  },
  {
    name: "SQLite-Datenbank",
    status: "online",
    icon: <Database className="h-4 w-4" />,
    latency: "2ms",
    detail: "Schema v2.1, 0 Migrationen ausstehend",
  },
  {
    name: "Kartenserver (OSM)",
    status: "online",
    icon: <Server className="h-4 w-4" />,
    latency: "120ms",
    detail: "Tile-Cache kalt, wird befüllt",
  },
];

const statusColors: Record<string, string> = {
  online: "#4a9e4a",
  degraded: "#c49a2a",
  offline: "#b44040",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  degraded: "Eingeschränkt",
  offline: "Offline",
};

export default function Health() {
  const onlineCount = services.filter((s) => s.status === "online").length;
  const totalCount = services.length;

  return (
    <div className="p-4 space-y-4" data-testid="page-health">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          System-Health
        </h2>
        <span className="text-xs text-muted-foreground">
          {onlineCount}/{totalCount} Dienste aktiv
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Service status */}
        <Card className="bg-card border-card-border col-span-2">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground">Dienststatus</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-card-border bg-background"
                  data-testid={`service-${svc.name.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: statusColors[svc.status] }}
                  />
                  <span className="text-muted-foreground shrink-0">{svc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{svc.name}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0"
                        style={{
                          borderColor: statusColors[svc.status],
                          color: statusColors[svc.status],
                        }}
                      >
                        {statusLabels[svc.status]}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{svc.detail}</p>
                  </div>
                  {svc.latency && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {svc.latency}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-3">
          {/* BM25 Index */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-[#c49a2a]" />
                BM25 Suchindex
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Indexabdeckung</span>
                  <span className="font-mono text-[#c49a2a]">19%</span>
                </div>
                <Progress value={19} className="h-2" data-testid="progress-bm25" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Indexierte Dokumente: 42 / 221</p>
                <p>Letzte Aktualisierung: vor 3 Tagen</p>
                <p className="text-[#c49a2a]">Empfehlung: Vollständige Reindexierung durchführen</p>
              </div>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-[#c49a2a]" />
                Speicher
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Heap-Nutzung</span>
                  <span className="font-mono text-foreground">34 MB / 128 MB</span>
                </div>
                <Progress value={26.5} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SQLite DB</span>
                  <span className="font-mono text-foreground">2.1 MB</span>
                </div>
                <Progress value={1.6} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tile-Cache</span>
                  <span className="font-mono text-foreground">12 MB</span>
                </div>
                <Progress value={9.4} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#c49a2a]" />
                Betriebszeit
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono font-bold text-foreground">14d 7h 23m</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Letzter Neustart: 19.03.2026, 08:10 Uhr
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
