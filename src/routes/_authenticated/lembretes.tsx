import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, fetchCategories, formatCurrency, daysUntil, formatDate, recurrenceLabels, type Reminder, type ReminderStatus } from "@/lib/reminders";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Pencil, Trash2, CheckCircle2, Archive, Paperclip, Repeat, Eye, ArrowLeft, Clock, CalendarPlus } from "lucide-react";
import { ReminderForm } from "@/components/reminder-form";
import { PayDialog } from "@/components/pay-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/lembretes")({
  component: Lembretes,
});

function Lembretes() {
  const qc = useQueryClient();
  const { data: reminders } = useSuspenseQuery({ queryKey: ["reminders"], queryFn: () => fetchReminders() });
  const { data: categories } = useSuspenseQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReminderStatus | "all">("pending");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState<Reminder | null>(null);
  const [viewing, setViewing] = useState<Reminder | null>(null);


  const filtered = reminders.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (catFilter !== "all" && r.categoria_id !== catFilter) return false;
    if (search && !r.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reminders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Excluído"); },
  });
  const arch = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("reminders").update({ status: "archived" }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Arquivado"); },
  });

  const adiar = useMutation({
    mutationFn: async ({ id, dias, dataAtual }: { id: string; dias: number; dataAtual: string }) => {
      const d = new Date(dataAtual + "T00:00:00");
      d.setDate(d.getDate() + dias);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const { error } = await supabase.from("reminders").update({ data_vencimento: iso }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Vencimento adiado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const repetirProxMes = useMutation({
    mutationFn: async (r: Reminder) => {
      const base = new Date(r.data_vencimento + "T00:00:00");
      const nextMonth = base.getMonth() + 1;
      const nextYear = base.getFullYear() + Math.floor(nextMonth / 12);
      const targetMonth = nextMonth % 12;
      const day = base.getDate();
      const lastDay = new Date(nextYear, targetMonth + 1, 0).getDate();
      const d = new Date(nextYear, targetMonth, Math.min(day, lastDay));
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const { error } = await supabase.from("reminders").insert({
        user_id: r.user_id, categoria_id: r.categoria_id, titulo: r.titulo, valor: r.valor,
        observacoes: r.observacoes, data_vencimento: iso, recorrencia: r.recorrencia,
        intervalo_dias: r.intervalo_dias, avisos: r.avisos, status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Duplicado para o próximo mês"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Dashboard</Link>
      </Button>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lembretes</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} de {reminders.length}</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300"><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide opacity-90 drop-shadow-sm">Total exibido</div>
          <div className="text-xl font-bold drop-shadow">{formatCurrency(filtered.reduce((s, r) => s + (Number(r.valor) || 0), 0))}</div>
          <div className="text-xs opacity-90 mt-1 drop-shadow-sm">{filtered.length} lembrete(s)</div>
          <div className="text-[10px] opacity-90 mt-1 drop-shadow-sm">Refere-se a tudo adicionado de Julho a Dezembro de 2026</div>
        </CardContent></Card>
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-red-500 to-red-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300"><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide opacity-90 drop-shadow-sm">Pendentes</div>
          <div className="text-xl font-bold drop-shadow">{formatCurrency(filtered.filter((r) => r.status === "pending").reduce((s, r) => s + (Number(r.valor) || 0), 0))}</div>
          <div className="text-xs opacity-90 mt-1 drop-shadow-sm">{filtered.filter((r) => r.status === "pending").length} pendente(s)</div>
        </CardContent></Card>
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300"><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide opacity-90 drop-shadow-sm">Pagos</div>
          <div className="text-xl font-bold drop-shadow">{formatCurrency(filtered.filter((r) => r.status === "paid").reduce((s, r) => s + (Number(r.valor) || 0), 0))}</div>
          <div className="text-xs opacity-90 mt-1 drop-shadow-sm">{filtered.filter((r) => r.status === "paid").length} pago(s)</div>
        </CardContent></Card>
      </div>


      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              list="reminder-titles"
              autoComplete="on"
            />
            <datalist id="reminder-titles">
              {Array.from(new Set(reminders.map((r) => r.titulo))).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as ReminderStatus | "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="archived">Arquivados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum lembrete encontrado</CardContent></Card>
        )}
        {filtered.map((r) => {
          const d = daysUntil(r.data_vencimento);
          const isPending = r.status === "pending";
          const borderClass = !isPending
            ? r.status === "paid"
              ? "border-l-4 border-l-accent"
              : "border-l-4 border-l-muted-foreground/40"
            : d < 0
              ? "border-l-4 border-l-destructive"
              : d <= 1
                ? "border-l-4 border-l-orange-500"
                : d <= 3
                  ? "border-l-4 border-l-yellow-500"
                  : "border-l-4 border-l-primary/60";
          return (
            <Card key={r.id} className={`${borderClass} shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
              <CardContent className="p-3 sm:p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-4">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg grid place-items-center shrink-0" style={{ backgroundColor: (r.categories?.cor ?? "#10B981") + "22", color: r.categories?.cor ?? "#10B981" }}>
                  <span className="text-sm font-bold">{r.categories?.nome?.charAt(0) ?? "?"}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate text-sm sm:text-base">{r.titulo}</span>
                    {r.recorrencia !== "none" && <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex"><Repeat className="h-3 w-3 mr-1" />{recurrenceLabels[r.recorrencia]}</Badge>}
                    {r.anexo_url && <a href={r.anexo_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Paperclip className="h-3.5 w-3.5" /></a>}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{r.categories?.nome ?? "Sem categoria"} • {formatDate(r.data_vencimento)}</div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-semibold text-sm sm:text-base">{formatCurrency(r.valor)}</div>
                    {isPending && (
                      <Badge variant={d < 0 ? "destructive" : d === 0 ? "destructive" : d <= 1 ? "default" : "secondary"} className="mt-1 text-[10px] sm:text-xs px-1.5">
                        {d < 0 ? `${Math.abs(d)}d atraso` : d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `em ${d}d`}
                      </Badge>
                    )}
                    {r.status === "paid" && <Badge className="mt-1 bg-accent text-accent-foreground text-[10px] sm:text-xs">Pago</Badge>}
                    {r.status === "archived" && <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs">Arquivado</Badge>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewing(r)}><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
                      {isPending && <DropdownMenuItem onClick={() => { setPaying(r); setPayOpen(true); }}><CheckCircle2 className="h-4 w-4 mr-2" />Marcar como pago</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                      {r.status !== "archived" && <DropdownMenuItem onClick={() => arch.mutate(r.id)}><Archive className="h-4 w-4 mr-2" />Arquivar</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => { if (confirm("Excluir este lembrete?")) del.mutate(r.id); }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>

                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {formOpen && <ReminderForm open={formOpen} onOpenChange={setFormOpen} categories={categories} reminder={editing} />}
      <PayDialog open={payOpen} onOpenChange={setPayOpen} reminder={paying} />
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
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
