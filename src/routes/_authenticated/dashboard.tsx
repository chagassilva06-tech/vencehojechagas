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
import { AlertTriangle, CheckCircle2, Clock, Plus, TrendingUp, Eye, Paperclip, Search, Trophy } from "lucide-react";
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

  const pending = reminders.filter((r) => r.status === "pending");
  const overdue = pending.filter((r) => daysUntil(r.data_vencimento) < 0);
  const tomorrow = pending.filter((r) => daysUntil(r.data_vencimento) === 1);
  const next3 = pending.filter((r) => { const d = daysUntil(r.data_vencimento); return d >= 0 && d <= 3; });
  const totalPending = pending.reduce((s, r) => s + (r.valor ?? 0), 0);
  const paidCount = reminders.filter((r) => r.status === "paid").length;
  const finalizados = reminders.filter((r) => r.status === "paid");

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").update({ status: "paid" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Marcado como pago"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcoming = pending
    .filter((r) => daysUntil(r.data_vencimento) >= 0)
    .filter((r) => !appliedSearch || r.titulo.toLowerCase().includes(appliedSearch.toLowerCase()))
    .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
    .slice(0, 8);


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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Atrasados" value={overdue.length} icon={AlertTriangle} color="text-destructive" borderClass="border-l-4 border-l-destructive" />
        <StatCard title="Vence amanhã" value={tomorrow.length} icon={Clock} color="text-warning" borderClass="border-l-4 border-l-orange-500" />
        <StatCard title="Próximos 3 dias" value={next3.length} icon={TrendingUp} color="text-accent" borderClass="border-l-4 border-l-yellow-500" />
        <StatCard title="Pagos" value={paidThisMonth} icon={CheckCircle2} color="text-accent" borderClass="border-l-4 border-l-accent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Total pendente</span>
            <span className="text-2xl font-bold text-accent">{formatCurrency(totalPending)}</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle>Próximos vencimentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">Nenhum lembrete pendente. 🎉</p>}
          {upcoming.map((r) => {
            const d = daysUntil(r.data_vencimento);
            const bc = d === 0 ? "border-l-4 border-l-destructive" : d === 1 ? "border-l-4 border-l-orange-500" : d <= 3 ? "border-l-4 border-l-yellow-500" : "border-l-4 border-l-primary/60";
            return (
              <div key={r.id} className={`${bc} flex items-center justify-between p-3 rounded-lg border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-muted/50 transition-all duration-200`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0" style={{ backgroundColor: (r.categories?.cor ?? "#10B981") + "22", color: r.categories?.cor ?? "#10B981" }}>
                    <span className="text-xs font-bold">{r.categories?.nome?.charAt(0) ?? "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.titulo}</div>
                    <div className="text-xs text-muted-foreground">{r.categories?.nome} • {formatDate(r.data_vencimento)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold hidden sm:inline">{formatCurrency(r.valor)}</span>
                  <Badge variant={d === 0 ? "destructive" : d <= 1 ? "default" : "secondary"}>
                    {d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `em ${d}d`}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setViewing(r)} title="Ver detalhes">
                    <Eye className="h-4 w-4" />
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
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, borderClass = "" }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; borderClass?: string }) {
  return (
    <Card className={`${borderClass} shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{title}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
