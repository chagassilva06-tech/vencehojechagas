import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, ListChecks, Calendar, History, Tags, Settings, LogOut, Menu, X, CheckCircle2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const nav = [
  { to: "/dashboard", label: "Painel de Controle", icon: LayoutDashboard, color: "#10B981" },
  { to: "/lembretes", label: "Lembretes", icon: ListChecks, color: "#3B82F6" },
  { to: "/calendario", label: "Calendário", icon: Calendar, color: "#8B5CF6" },
  { to: "/historico", label: "Histórico", icon: History, color: "#F59E0B" },
  { to: "/categorias", label: "Categorias", icon: Tags, color: "#EC4899" },
  { to: "/config", label: "Configurações", icon: Settings, color: "#6B7280" },
  { to: "/anotacoes", label: "Bloco de Anotações", icon: StickyNote, color: "#F97316" },
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
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static text-slate-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "#0F172A",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="h-7 w-7 shrink-0" aria-hidden="true">
              <path d="M6 22 L16 32 L36 8" fill="none" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xl font-semibold tracking-tight leading-none">
              <span className="text-white">Vence</span><span className="text-red-500">Hoje</span>
            </span>
          </Link>
          <button className="lg:hidden text-slate-300" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-emerald-400"
                  />
                )}
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/5"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 text-slate-200"
          style={{
            background: "#0F172A",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
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
