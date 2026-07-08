import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ListChecks, Calendar, History, Tags, Settings, LogOut, Menu, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#10B981" },
  { to: "/lembretes", label: "Lembretes", icon: ListChecks, color: "#3B82F6" },
  { to: "/calendario", label: "Calendário", icon: Calendar, color: "#8B5CF6" },
  { to: "/historico", label: "Histórico", icon: History, color: "#F59E0B" },
  { to: "/categorias", label: "Categorias", icon: Tags, color: "#EC4899" },
  { to: "/config", label: "Configurações", icon: Settings, color: "#6B7280" },
  { to: "/concluidas", label: "Contas Concluídas", icon: CheckCircle2, color: "#14B8A6" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const activeItem =
    nav.find((n) => location.pathname === n.to) ||
    nav.find((n) => n.to !== "/dashboard" && location.pathname.startsWith(n.to)) ||
    nav[0];
  const themeColor = "#3B82F6";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-all duration-500 lg:translate-x-0 lg:static text-white",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: `linear-gradient(180deg, #38BDF8 0%, #2563EB 100%)`,
          boxShadow: "inset -1px 0 0 rgba(37,99,235,0.35), 0 0 24px rgba(56,189,248,0.25)",
          color: "#ffffff",
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.25),inset_0_-1px_0_rgba(255,255,255,0.25)]">
          <Link to="/dashboard" className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
              <path d="M6 22 L16 32 L36 8" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-2xl font-extrabold tracking-tight leading-none">
              <span className="text-white">Vence</span><span className="text-sky-200">Hoje</span>
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 p-3 pb-8 space-y-2.5">
          {nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-300 ease-out",
                  active
                    ? "bg-background font-semibold rounded-l-2xl rounded-r-none -mr-3 pl-5"
                    : "rounded-lg text-white/90 hover:bg-white/15 hover:translate-x-0.5"
                )}
                style={
                  active
                    ? { color: item.color }
                    : {
                        background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(0,0,0,0.10) 100%)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.15)",
                      }
                }
              >
                {active && (
                  <>
                    {/* left color bar indicator */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full animate-fade-in"
                      style={{ background: item.color }}
                    />
                    {/* top concave scoop */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-0 -top-6 h-6 w-6 rounded-br-[24px]"
                      style={{ boxShadow: "0 24px 0 0 var(--background)" }}
                    />
                    {/* bottom concave scoop */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-0 -bottom-6 h-6 w-6 rounded-tr-[24px]"
                      style={{ boxShadow: "0 -24px 0 0 var(--background)" }}
                    />
                  </>
                )}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/20">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/15 hover:text-white" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 text-white transition-all duration-500 shadow-sm"
          style={{
            background: `linear-gradient(90deg, #38BDF8 0%, #2563EB 100%)`,
            boxShadow: "0 2px 24px rgba(56,189,248,0.25)",
          }}
        >
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 font-semibold">
            <activeItem.icon className="h-5 w-5" />
            {activeItem.label}
          </div>
          <div />
        </header>
        <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
