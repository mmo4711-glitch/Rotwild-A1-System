import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Population from "@/pages/population";
import Habitat from "@/pages/habitat";
import Genetics from "@/pages/genetics";
import Health from "@/pages/health";
import Wildschaden from "@/pages/wildschaden";
import Kalender from "@/pages/kalender";
import Strecke from "@/pages/strecke";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Population} />
      <Route path="/habitat" component={Habitat} />
      <Route path="/genetics" component={Genetics} />
      <Route path="/wildschaden" component={Wildschaden} />
      <Route path="/kalender" component={Kalender} />
      <Route path="/strecke" component={Strecke} />
      <Route path="/health" component={Health} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center h-10 px-3 border-b border-border shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto overscroll-contain">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <AppLayout />
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
