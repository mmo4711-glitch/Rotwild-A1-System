import { Link, useLocation } from "wouter";
import { usePopulation } from "@/lib/population-context";
import {
  BookOpen,
  Compass,
  BarChart3,
  Map,
  Dna,
  ShieldAlert,
  Calendar,
  CloudRain,
  Target,
  Camera,
  BookMarked,
  Sprout,
  Activity,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: any;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Übersicht",
    items: [
      { title: "Handbuch", url: "/handbuch", icon: BookOpen },
      { title: "Philosophie", url: "/philosophie", icon: Compass },
    ],
  },
  {
    label: "Analyse",
    items: [
      { title: "Populationsdynamik", url: "/population", icon: BarChart3 },
      { title: "Habitatbewertung", url: "/habitat", icon: Map },
      { title: "Ne-Genetik", url: "/genetics", icon: Dna },
      { title: "Wildschaden", url: "/wildschaden", icon: ShieldAlert },
      { title: "Jahresvergleich", url: "/vergleich", icon: TrendingUp },
    ],
  },
  {
    label: "Feld",
    items: [
      { title: "Jagdkalender", url: "/kalender", icon: Calendar },
      { title: "Wetter", url: "/wetter", icon: CloudRain },
      { title: "Strecke & Schein", url: "/strecke", icon: Target },
      { title: "Wildkamera", url: "/wildkamera", icon: Camera },
      { title: "Reviertagebuch", url: "/tagebuch", icon: BookMarked },
      { title: "Wildwiesen", url: "/wildwiesen", icon: Sprout },
      { title: "Drückjagd", url: "/drueckjagd", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { title: "System-Health", url: "/health", icon: Activity },
      { title: "Architektur", url: "/architektur", icon: Layers },
    ],
  },
];

/** Wind direction arrow helper */
function windArrow(dir: string | null): string {
  if (!dir) return "";
  const arrows: Record<string, string> = {
    N: "\u2191", NO: "\u2197", O: "\u2192", SO: "\u2198",
    S: "\u2193", SW: "\u2199", W: "\u2190", NW: "\u2196",
  };
  return arrows[dir] || "";
}

/** Compact status bar at the bottom of the sidebar — shows live population + weather at a glance. */
function SidebarStatusBar() {
  const [, navigate] = useLocation();
  const ctx = usePopulation();

  return (
    <button
      onClick={() => navigate("/population")}
      className="w-full text-left rounded-md border border-[hsl(110,30%,16%)] bg-[hsl(130,20%,8%)] px-2.5 py-2 hover:border-[#c49a2a]/40 transition-colors cursor-pointer"
      data-testid="sidebar-status-bar"
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-[#8b9a7a] leading-relaxed">
        <span>
          N: <span className="text-foreground font-semibold">{Math.round(ctx.totalN)}</span>
          {" "}(λ {ctx.lambda.toFixed(2)})
        </span>
        <span>
          K: <span className="text-foreground font-semibold">{ctx.K}</span>
          {" | "}N<sub>e</sub>: {Math.round(ctx.ne)}
        </span>
      </div>
      {(ctx.currentTemp !== null || ctx.currentWind) && (
        <div className="text-[10px] font-mono text-[#8b9a7a] mt-0.5">
          {ctx.currentTemp !== null && (
            <span>
              {"\uD83C\uDF21\uFE0F"} {Math.round(ctx.currentTemp)}°C
            </span>
          )}
          {ctx.currentWind && ctx.currentWindSpeed !== null && (
            <span>
              {" | "}{windArrow(ctx.currentWind)} {ctx.currentWind} {Math.round(ctx.currentWindSpeed)} km/h
            </span>
          )}
        </div>
      )}
    </button>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader className="p-4 border-b border-[hsl(110,30%,16%)]">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Jagdhandbuch Logo"
            >
              <circle cx="16" cy="16" r="14" stroke="#c49a2a" strokeWidth="1.5" />
              <path
                d="M16 4 L16 8 M16 24 L16 28 M4 16 L8 16 M24 16 L28 16"
                stroke="#c49a2a"
                strokeWidth="1"
                strokeLinecap="round"
              />
              <path
                d="M12 10 L16 6 L20 10 M12 10 L12 20 C12 22 14 24 16 24 C18 24 20 22 20 20 L20 10"
                stroke="#c49a2a"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <line x1="12" y1="15" x2="20" y2="15" stroke="#c49a2a" strokeWidth="1" />
            </svg>
            <div>
              <h1 className="font-display text-sm font-semibold tracking-wide text-[#c49a2a]">
                Jagdhandbuch
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                Merschbach
              </p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] tracking-widest uppercase text-[hsl(110,30%,45%)]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        data-testid={`nav-${item.url.replace("/", "") || "home"}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-[hsl(110,30%,16%)] space-y-2">
        <SidebarStatusBar />
        <div className="text-[10px] text-muted-foreground">
          <p>v2.2.0 · Rotwild-A1</p>
          <p className="mt-1 opacity-60">© 2026 Jagdhandbuch</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
