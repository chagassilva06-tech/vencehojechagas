import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, formatCurrency, daysUntil, formatDate, recurrenceLabels, type Reminder } from "@/lib/reminders";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Clock, Plus, TrendingUp, Eye, Paperclip, Search, Trophy, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data: reminders } = useSuspenseQuery({
    queryKey: ["reminders"],
    queryFn: () => fetchReminders(),
  });
  const [viewing, setViewing] = useState<Reminder | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  const pending = reminders.filter((r) => r.status === "pending");
  const overdue = pending.filter((r) => daysUntil(r.data_vencimento) < 0);
  const tomorrow = pending.filter((r) => daysUntil(r.data_vencimento) === 1);
  const next3 = pending.filter((r) => { const d = daysUntil(r.data_vencimento); return d >= 0 && d <= 3; });
  const totalPending = pending.reduce((s, r) => s + (r.valor ?? 0), 0);
  const paidCount = reminders.filter((r) => r.status === "paid").length;
  const finalizados = reminders.filter((r) => r.status === "paid");

  const markPaid = useMutation({
    mutationFn: async (r: Reminder) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Não autenticado");
      const { error: pErr } = await supabase.from("payments").insert({
        reminder_id: r.id,
        user_id: uid,
        valor_pago: r.valor,
        data_pagamento: new Date().toISOString().slice(0, 10),
      });
      if (pErr) throw pErr;
      const { error } = await supabase.from("reminders").update({ status: "paid" }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Marcado como pago");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteReminder = useMutation({
    mutationFn: async (r: Reminder) => {
      const { error } = await supabase.from("reminders").delete().eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Lembrete excluído");
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const upcoming = pending
    .filter((r) => daysUntil(r.data_vencimento) >= 0)
    .filter((r) => {
      const d = new Date(r.data_vencimento + "T00:00:00");
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .filter((r) => !appliedSearch || r.titulo.toLowerCase().includes(appliedSearch.toLowerCase()))
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Uma visão rápida das suas contas</p>
        </div>
        <Link to="/lembretes">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Novo lembrete
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl ring-4 ring-red-400/70 shadow-[0_20px_45px_-8px_rgba(239,68,68,0.75)] hover:ring-red-300 hover:shadow-[0_30px_60px_-10px_rgba(239,68,68,0.9)] transition-all"><StatCard title="Atrasados" value={overdue.length} icon={AlertTriangle} gradient="from-red-500 to-red-700" /></div>
        <div className="rounded-xl ring-4 ring-orange-400/70 shadow-[0_20px_45px_-8px_rgba(249,115,22,0.75)] hover:ring-orange-300 hover:shadow-[0_30px_60px_-10px_rgba(249,115,22,0.9)] transition-all"><StatCard title="Vence amanhã" value={tomorrow.length} icon={Clock} gradient="from-orange-400 to-orange-600" pulse={tomorrow.length > 0} /></div>
        <div className="rounded-xl ring-4 ring-yellow-400/70 shadow-[0_20px_45px_-8px_rgba(234,179,8,0.75)] hover:ring-yellow-300 hover:shadow-[0_30px_60px_-10px_rgba(234,179,8,0.9)] transition-all"><StatCard title="Próximos 3 dias" value={next3.length} icon={TrendingUp} gradient="from-yellow-400 to-amber-500" /></div>
        <Link to="/concluidas" className="block cursor-pointer rounded-xl ring-4 ring-emerald-400/70 shadow-[0_20px_45px_-8px_rgba(16,185,129,0.75)] hover:ring-emerald-300 hover:shadow-[0_30px_60px_-10px_rgba(16,185,129,0.9)] transition-all"><StatCard title="Pagos" value={paidCount} icon={CheckCircle2} gradient="from-emerald-400 to-emerald-600" /></Link>
        <Link to="/concluidas" className="block cursor-pointer rounded-xl ring-4 ring-sky-400/70 shadow-[0_20px_45px_-8px_rgba(56,189,248,0.75)] hover:ring-sky-300 hover:shadow-[0_30px_60px_-10px_rgba(56,189,248,0.9)] transition-all"><StatCard title="Finalizados" value={finalizados.length} icon={Trophy} gradient="from-sky-400 to-blue-600" /></Link>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-[0_10px_25px_-8px_rgba(16,185,129,0.35)] ring-1 ring-accent/20 hover:shadow-[0_18px_35px_-10px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Total pendente</span>
              <span className="text-2xl font-bold text-accent">{formatCurrency(totalPending)}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-[0_10px_25px_-8px_rgba(16,185,129,0.35)] ring-1 ring-accent/20 hover:shadow-[0_18px_35px_-10px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Em aberto no mês</span>
              <span className="text-2xl font-bold text-accent">{formatCurrency(upcoming.reduce((s, r) => s + (r.valor ?? 0), 0))}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <span>Próximos vencimentos</span>
            <form
              onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search); }}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lembrete..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  list="dashboard-titles"
                  autoComplete="on"
                />
                <datalist id="dashboard-titles">
                  {Array.from(new Set(reminders.map((r) => r.titulo))).map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <Button type="submit" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Buscar</Button>
              {appliedSearch && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setAppliedSearch(""); }}>Limpar</Button>
              )}
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum lembrete pendente. 🎉</p>}
          {upcoming.map((r) => {
            const d = daysUntil(r.data_vencimento);
            const bc = d === 0 ? "border-l-4 border-l-destructive" : d === 1 ? "border-l-4 border-l-orange-500" : d <= 3 ? "border-l-4 border-l-yellow-500" : "border-l-4 border-l-primary/60";
            return (
              <div key={r.id} className={`${bc} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-muted/50 transition-all duration-200`}>
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg grid place-items-center shrink-0" style={{ backgroundColor: (r.categories?.cor ?? "#10B981") + "22", color: r.categories?.cor ?? "#10B981" }}>
                    <span className="text-xs font-bold">{r.categories?.nome?.charAt(0) ?? "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate text-sm sm:text-base">{r.titulo}</div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                      <span className="sm:hidden font-semibold text-foreground">{formatCurrency(r.valor)} • </span>
                      {r.categories?.nome} • {formatDate(r.data_vencimento)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <span className="font-semibold hidden sm:inline">{formatCurrency(r.valor)}</span>
                  <Badge variant={d === 0 ? "destructive" : d <= 1 ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                    {d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `em ${d}d`}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex" onClick={() => setViewing(r)} title="Ver detalhes">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 sm:px-3 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    disabled={markPaid.isPending}
                    onClick={() => markPaid.mutate(r)}
                    title="Marcar como pago"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Pago</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleting(r)}
                    title="Excluir lembrete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>


      {overdue.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Atrasados</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {overdue.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-l-4 border-l-destructive shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div>
                  <div className="font-medium">{r.titulo}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(r.data_vencimento)} • {Math.abs(daysUntil(r.data_vencimento))} dias em atraso</div>
                </div>
                <span className="font-semibold text-destructive">{formatCurrency(r.valor)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewing?.titulo}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Categoria:</span> {viewing.categories?.nome ?? "—"}</div>
              <div><span className="text-muted-foreground">Vencimento:</span> {formatDate(viewing.data_vencimento)}</div>
              <div><span className="text-muted-foreground">Valor:</span> {formatCurrency(viewing.valor)}</div>
              <div><span className="text-muted-foreground">Recorrência:</span> {recurrenceLabels[viewing.recorrencia]}</div>
              <div><span className="text-muted-foreground">Status:</span> {viewing.status}</div>
              {viewing.observacoes && <div><span className="text-muted-foreground">Observações:</span> {viewing.observacoes}</div>}
              {viewing.anexo_url && <div><a href={viewing.anexo_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />{viewing.anexo_nome ?? "Anexo"}</a></div>}
              <div className="pt-2"><Link to="/lembretes" className="text-accent hover:underline text-sm">Abrir em Lembretes →</Link></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lembrete?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleting?.titulo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); if (deleting) deleteReminder.mutate(deleting); }}
              disabled={deleteReminder.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, gradient, pulse = false }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; gradient: string; pulse?: boolean }) {
  return (
    <Card className={`relative overflow-hidden border-none text-white bg-gradient-to-br ${gradient} shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300 ${pulse ? "animate-pulse ring-2 ring-white/40" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/80">{title}</div>
            <div className="text-3xl font-bold mt-1 drop-shadow-sm">{value}</div>
          </div>
          <Icon className="h-8 w-8 text-white/90 drop-shadow" />
        </div>
      </CardContent>
    </Card>
  );
}
