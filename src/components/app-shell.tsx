import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ListChecks, Calendar, History, Tags, Settings, LogOut, Menu, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/vencehoje-logo.png";

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
  const themeColor = activeItem.color;

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
          background: `linear-gradient(180deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
        }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/15">
          <div className="flex items-center gap-2">
            <img src={logo} alt="VenceHoje" width={32} height={32} loading="eager" decoding="async" className="h-8 w-8 object-contain" />
            <span className="font-bold">VenceHoje</span>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
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
                    : "rounded-lg text-white/90 hover:bg-white/10 hover:translate-x-0.5"
                )}
                style={active ? { color: item.color } : undefined}
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
                      className="pointer-events-none absolute right-0 -top-5 h-5 w-5 rounded-br-[20px]"
                      style={{ boxShadow: "0 20px 0 0 var(--background)" }}
                    />
                    {/* bottom concave scoop */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-0 -bottom-5 h-5 w-5 rounded-tr-[20px]"
                      style={{ boxShadow: "0 -20px 0 0 var(--background)" }}
                    />
                  </>
                )}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/15">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 text-white transition-all duration-500 shadow-sm"
          style={{
            background: `linear-gradient(90deg, ${themeColor} 0%, ${themeColor}cc 100%)`,
          }}
        >
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 font-semibold">
            <activeItem.icon className="h-5 w-5" />
            {activeItem.label}
          </div>
          <div />
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
