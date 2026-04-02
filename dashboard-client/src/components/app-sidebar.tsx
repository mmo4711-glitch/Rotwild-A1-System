import { Link, useLocation } from "wouter";
import { BarChart3, Map, Dna, Activity, ShieldAlert } from "lucide-react";
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

const navItems = [
  { title: "Populationsdynamik", url: "/", icon: BarChart3 },
  { title: "Habitatbewertung", url: "/habitat", icon: Map },
  { title: "Ne-Genetik", url: "/genetics", icon: Dna },
  { title: "Wildschaden", url: "/wildschaden", icon: ShieldAlert },
  { title: "System-Health", url: "/health", icon: Activity },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="sidebar">
      <SidebarHeader className="p-4 border-b border-[hsl(110,30%,16%)]">
        <div className="flex items-center gap-3">
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-widest uppercase text-muted-foreground">
            Module
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location === "/" || location === ""
                    : location.startsWith(item.url);
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
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-[hsl(110,30%,16%)]">
        <div className="text-[10px] text-muted-foreground">
          <p>v2.1.0 · Rotwild-A1</p>
          <p className="mt-1 opacity-60">© 2026 Jagdhandbuch</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
