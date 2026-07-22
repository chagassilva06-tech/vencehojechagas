import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Bell,
  CalendarDays,
  History,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  NotebookPen,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  color: string; // active accent color (tailwind text color hex fallback via style)
  countKey?: "lembretes" | "notas" | "categorias";
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    title: "Visão Geral",
    items: [
      { to: "/dashboard", label: "Painel de Controle", icon: LayoutDashboard, color: "#10B981" },
      { to: "/lembretes", label: "Lembretes", icon: Bell, color: "#3B82F6", countKey: "lembretes" },
      { to: "/calendario", label: "Calendário", icon: CalendarDays, color: "#8B5CF6" },
    ],
  },
  {
    title: "Organização",
    items: [
      { to: "/categorias", label: "Categorias", icon: Tag, color: "#EC4899", countKey: "categorias" },
      { to: "/anotacoes", label: "Bloco de Notas", icon: NotebookPen, color: "#F97316", countKey: "notas" },
      { to: "/historico", label: "Histórico", icon: History, color: "#F59E0B" },
    ],
  },
  {
    title: "Finalizados",
    items: [
      { to: "/concluidas", label: "Contas Concluídas", icon: CheckCircle2, color: "#14B8A6" },
    ],
  },
  {
    title: "Configurações",
    items: [
      { to: "/config", label: "Configurações", icon: Settings, color: "#94A3B8" },
    ],
  },
];

const allItems = groups.flatMap((g) => g.items);
const STORAGE_KEY = "vh:sidebar:collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop rail
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const activeItem =
    allItems.find((n) => location.pathname === n.to) ||
    allItems.find((n) => n.to !== "/dashboard" && location.pathname.startsWith(n.to)) ||
    allItems[0];

  // Counters
  const { data: counts } = useQuery({
    queryKey: ["sidebar-counts"],
    queryFn: async () => {
      const [lem, notas, cats, user] = await Promise.all([
        supabase.from("reminders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("archived", false),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.auth.getUser(),
      ]);
      return {
        lembretes: lem.count ?? 0,
        notas: notas.count ?? 0,
        categorias: cats.count ?? 0,
        email: user.data.user?.email ?? "",
        name:
          (user.data.user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ||
          (user.data.user?.user_metadata as { name?: string } | undefined)?.name ||
          user.data.user?.email?.split("@")[0] ||
          "Usuário",
      };
    },
    staleTime: 30_000,
  });

  const [syncedAt, setSyncedAt] = useState<Date>(new Date());
  useEffect(() => {
    setSyncedAt(new Date());
  }, [counts]);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  function syncedLabel() {
    const diff = Math.max(0, Math.floor((Date.now() - syncedAt.getTime()) / 60000));
    if (diff < 1) return "agora mesmo";
    if (diff === 1) return "há 1 minuto";
    return `há ${diff} minutos`;
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const width = collapsed ? "w-[76px]" : "w-64";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-300 lg:translate-x-0 lg:static text-slate-200",
            width,
            open ? "translate-x-0" : "-translate-x-full",
          )}
          style={{
            background: "linear-gradient(180deg, #0B1220 0%, #0F172A 50%, #111C31 100%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.03)",
          }}
        >
          {/* Logo */}
          <div className={cn("h-16 flex items-center border-b border-white/10", collapsed ? "justify-center px-2" : "justify-between px-4")}>
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-9 w-9 shrink-0 grid place-items-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  boxShadow: "0 6px 16px -6px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <svg viewBox="0 0 40 40" className="h-5 w-5" aria-hidden="true">
                  <path d="M6 22 L16 32 L36 8" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {!collapsed && (
                <div className="min-w-0 leading-tight">
                  <div className="text-[17px] font-bold tracking-tight truncate">
                    <span className="text-white">Vence</span>
                    <span className="text-red-500">Hoje</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">Organize seu dia</div>
                </div>
              )}
            </Link>
            <button className="lg:hidden text-slate-300" onClick={() => setOpen(false)} aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {groups.map((group, gi) => (
              <div key={group.title} className={cn(gi > 0 && "mt-7")}>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {group.title}
                  </div>
                )}
                {collapsed && gi > 0 && <div className="mx-3 mb-3 h-px bg-white/5" />}
                <ul className="space-y-1.5">
                  {group.items.map((item) => {
                    const active =
                      location.pathname === item.to ||
                      (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
                    const count = item.countKey ? counts?.[item.countKey] : undefined;

                    const link = (
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group relative flex items-center h-10 rounded-lg text-[13.5px] font-medium transition-all duration-150",
                          collapsed ? "justify-center mx-1 px-0" : "gap-3 px-3 mx-1",
                          active
                            ? "text-white"
                            : "text-slate-400 hover:text-white hover:translate-x-[2px]",
                        )}
                        style={
                          active
                            ? {
                                background: `linear-gradient(90deg, ${hexA(item.color, 0.18)} 0%, ${hexA(item.color, 0.06)} 60%, transparent 100%)`,
                                boxShadow: `inset 0 0 0 1px ${hexA(item.color, 0.18)}, 0 0 20px -12px ${hexA(item.color, 0.9)}`,
                              }
                            : undefined
                        }
                      >
                        {/* Active left bar */}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-[4px] rounded-r-full transition-all duration-200",
                            active ? "h-6 opacity-100" : "h-0 opacity-0",
                          )}
                          style={{
                            background: item.color,
                            boxShadow: `0 0 10px ${hexA(item.color, 0.8)}`,
                          }}
                        />
                        <item.icon
                          className={cn(
                            "shrink-0 transition-transform duration-150 group-hover:scale-105",
                            collapsed ? "h-[19px] w-[19px]" : "h-[18px] w-[18px]",
                          )}
                          strokeWidth={active ? 2.25 : 1.9}
                          style={{ color: active ? item.color : undefined }}
                        />
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {typeof count === "number" && count > 0 && (
                              <span
                                className={cn(
                                  "ml-auto text-[10.5px] font-semibold px-1.5 h-5 min-w-[20px] grid place-items-center rounded-full",
                                  active ? "text-white" : "text-slate-300",
                                )}
                                style={{
                                  background: hexA(item.color, active ? 0.35 : 0.18),
                                  border: `1px solid ${hexA(item.color, 0.35)}`,
                                }}
                              >
                                {count}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );

                    return (
                      <li key={item.to}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{link}</TooltipTrigger>
                            <TooltipContent side="right" className="font-medium">
                              {item.label}
                              {typeof count === "number" && count > 0 && (
                                <span className="ml-2 text-slate-400">{count}</span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer: user + sync + collapse */}
          <div className="border-t border-white/10 p-3 space-y-2">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2.5 px-1.5">
                  <div
                    className="h-9 w-9 shrink-0 rounded-full grid place-items-center text-white text-sm font-semibold"
                    style={{
                      background: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}
                  >
                    {initials(counts?.name || "U")}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="text-[13px] font-semibold text-white truncate">{counts?.name || "Usuário"}</div>
                    <div className="text-[10.5px] text-slate-400 truncate flex items-center gap-1">
                      <Cloud className="h-3 w-3 text-emerald-400" />
                      Sincronizado · {syncedLabel()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start text-slate-300 hover:text-white hover:bg-white/5 h-9"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </Button>
                  <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="hidden lg:grid place-items-center h-9 w-9 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Recolher menu"
                    title="Recolher menu"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-9 w-9 rounded-full grid place-items-center text-white text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)" }}
                    >
                      {counts?.name ? initials(counts.name) : <UserIcon className="h-4 w-4" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="font-medium">{counts?.name || "Usuário"}</div>
                    <div className="text-xs text-slate-400">Sincronizado · {syncedLabel()}</div>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={signOut}
                      className="grid place-items-center h-9 w-9 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Sair"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sair</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCollapsed(false)}
                      className="hidden lg:grid place-items-center h-9 w-9 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      aria-label="Expandir menu"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expandir menu</TooltipContent>
                </Tooltip>
              </div>
            )}
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
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 font-semibold">
              <activeItem.icon className="h-5 w-5" style={{ color: activeItem.color }} />
              {activeItem.label}
            </div>
            <div />
          </header>
          <main className="flex-1 p-3 sm:p-4 lg:p-8 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function hexA(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
}
