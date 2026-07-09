import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, fetchPayments, fetchCategories, formatCurrency, formatDate } from "@/lib/reminders";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Search, CheckCircle2, Paperclip, Undo2, Trash2,
  Wallet, Receipt, CalendarClock, Inbox, ListChecks, Filter, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export const Route = createFileRoute("/_authenticated/concluidas")({
  component: Concluidas,
});

type Item = {
  id: string;
  reminderId: string | null;
  paymentId: string | null;
  titulo: string;
  categoria: string | null;
  cor: string;
  dataPagamento: string;
  dataVencimento: string | null;
  valor: number | null;
  anexo_url: string | null;
  source: "payment" | "reminder";
};

type Periodo = "all" | "7" | "30" | "90" | "year";
type Ordem = "recent" | "old" | "value_desc" | "value_asc" | "title";

function Concluidas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: payments } = useSuspenseQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: paidReminders } = useSuspenseQuery({
    queryKey: ["reminders", "paid"],
    queryFn: () => fetchReminders({ status: "paid" }),
  });
  const { data: categories } = useSuspenseQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("all");
  const [categoria, setCategoria] = useState<string>("all");
  const [ordem, setOrdem] = useState<Ordem>("recent");
  const [pending, setPending] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const remove = useMutation({
    mutationFn: async (item: Item) => {
      if (item.paymentId) {
        const { error: e1 } = await supabase.from("payments").delete().eq("id", item.paymentId);
        if (e1) throw e1;
      }
      if (item.reminderId) {
        const { error: e2 } = await supabase.from("reminders").delete().eq("id", item.reminderId);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Registro excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revert = useMutation({
    mutationFn: async (item: Item) => {
      if (item.paymentId) {
        const { error: e1 } = await supabase.from("payments").delete().eq("id", item.paymentId);
        if (e1) throw e1;
      }
      if (item.reminderId) {
        const { error: e2 } = await supabase.from("reminders").update({ status: "pending" }).eq("id", item.reminderId);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Revertido para Não Pago");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const paidWithPayment = new Set(payments.map((p) => p.reminder_id));
  const items: Item[] = [
    ...payments.map<Item>((p) => ({
      id: `p-${p.id}`,
      reminderId: p.reminder_id,
      paymentId: p.id,
      titulo: p.reminders?.titulo ?? "—",
      categoria: p.reminders?.categories?.nome ?? null,
      cor: p.reminders?.categories?.cor ?? "#10B981",
      dataPagamento: p.data_pagamento,
      dataVencimento: p.reminders?.data_vencimento ?? null,
      valor: p.valor_pago ?? p.reminders?.valor ?? null,
      anexo_url: p.comprovante_url ?? p.reminders?.anexo_url ?? null,
      source: "payment",
    })),
    ...paidReminders
      .filter((r) => !paidWithPayment.has(r.id))
      .map<Item>((r) => ({
        id: `r-${r.id}`,
        reminderId: r.id,
        paymentId: null,
        titulo: r.titulo,
        categoria: r.categories?.nome ?? null,
        cor: r.categories?.cor ?? "#10B981",
        dataPagamento: r.data_vencimento,
        dataVencimento: r.data_vencimento,
        valor: r.valor,
        anexo_url: r.anexo_url,
        source: "reminder",
      })),
  ];

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = (() => {
      if (periodo === "all") return null;
      const d = new Date(today);
      if (periodo === "7") d.setDate(d.getDate() - 7);
      else if (periodo === "30") d.setDate(d.getDate() - 30);
      else if (periodo === "90") d.setDate(d.getDate() - 90);
      else if (periodo === "year") d.setFullYear(d.getFullYear() - 1);
      return d;
    })();

    const list = items.filter((i) => {
      if (search && !i.titulo.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoria !== "all" && i.categoria !== categoria) return false;
      if (cutoff) {
        const dp = new Date(i.dataPagamento + "T00:00:00");
        if (dp < cutoff) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (ordem) {
        case "old": return a.dataPagamento.localeCompare(b.dataPagamento);
        case "value_desc": return (Number(b.valor) || 0) - (Number(a.valor) || 0);
        case "value_asc": return (Number(a.valor) || 0) - (Number(b.valor) || 0);
        case "title": return a.titulo.localeCompare(b.titulo, "pt-BR");
        case "recent":
        default: return b.dataPagamento.localeCompare(a.dataPagamento);
      }
    });
    return list;
  }, [items, search, periodo, categoria, ordem]);

  const totalGeral = items.reduce((s, i) => s + (Number(i.valor) || 0), 0);
  const ultimoPagamento = items.reduce<string | null>((acc, i) => {
    if (!acc || i.dataPagamento > acc) return i.dataPagamento;
    return acc;
  }, null);

  const hasNoData = items.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Painel</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-2xl grid place-items-center shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contas Concluídas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visualize o histórico das contas já pagas</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-[0_15px_35px_-10px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] hover:-translate-y-0.5 transition-all duration-300">
          <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <CardContent className="relative p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest opacity-90">Total pago</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight truncate">{formatCurrency(totalGeral)}</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-white/15 ring-1 ring-white/25 grid place-items-center shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/20 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Contas concluídas</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight text-emerald-700 dark:text-emerald-300">{items.length}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{items.length === 1 ? "registro" : "registros"}</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 grid place-items-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-sky-100 dark:border-sky-900/40 bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-900 dark:to-sky-950/20 shadow-[0_8px_20px_-10px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all duration-300">
          <CardContent className="p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Último pagamento</div>
              <div className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight text-sky-700 dark:text-sky-300">
                {ultimoPagamento ? formatDate(ultimoPagamento) : "—"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">data mais recente</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 grid place-items-center shrink-0">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)]">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              list="concluidas-titles"
            />
            <datalist id="concluidas-titles">
              {Array.from(new Set(items.map((i) => i.titulo))).map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
                <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={ordem} onValueChange={(v) => setOrdem(v as Ordem)}>
                <SelectTrigger><SelectValue placeholder="Ordenar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes primeiro</SelectItem>
                  <SelectItem value="old">Mais antigas primeiro</SelectItem>
                  <SelectItem value="value_desc">Maior valor</SelectItem>
                  <SelectItem value="value_asc">Menor valor</SelectItem>
                  <SelectItem value="title">Título A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {hasNoData ? (
          <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CardContent className="py-14 px-6 flex flex-col items-center text-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-300 grid place-items-center shadow-inner">
                <Inbox className="h-8 w-8" />
              </div>
              <div>
                <div className="text-lg font-semibold">Nenhuma conta concluída ainda</div>
                <div className="text-sm text-muted-foreground mt-1 max-w-sm">
                  As contas marcadas como pagas aparecerão aqui.
                </div>
              </div>
              <Button asChild className="mt-2 bg-sky-600 hover:bg-sky-700 text-white">
                <Link to="/lembretes"><ListChecks className="h-4 w-4 mr-2" />Ver contas pendentes</Link>
              </Button>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum resultado com os filtros atuais
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden lg:block overflow-hidden shadow-[0_4px_14px_-6px_rgba(15,23,42,0.12)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Conta</th>
                      <th className="text-left font-semibold px-4 py-3">Categoria</th>
                      <th className="text-left font-semibold px-4 py-3">Vencimento</th>
                      <th className="text-left font-semibold px-4 py-3">Pagamento</th>
                      <th className="text-right font-semibold px-4 py-3">Valor</th>
                      <th className="text-center font-semibold px-4 py-3">Status</th>
                      <th className="text-right font-semibold px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((i) => (
                      <tr key={i.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: i.cor }} />
                            <span className="font-medium truncate">{i.titulo}</span>
                            {i.anexo_url && (
                              <a href={i.anexo_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                                <Paperclip className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{i.categoria ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{i.dataVencimento ? formatDate(i.dataVencimento) : "—"}</td>
                        <td className="px-4 py-3">{formatDate(i.dataPagamento)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(i.valor)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">Pago</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="h-8" disabled={revert.isPending} onClick={() => setPending(i)}>
                              <Undo2 className="h-4 w-4 sm:mr-1" /> <span className="hidden xl:inline">Reverter</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40"
                              disabled={remove.isPending}
                              onClick={() => setDeleting(i)}
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" /> <span className="hidden xl:inline">Excluir</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-2">
              {filtered.map((i) => (
                <Card
                  key={i.id}
                  className="border border-slate-200 dark:border-slate-800 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.12)] hover:shadow-[0_6px_16px_-6px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-all"
                  style={{ borderLeft: `4px solid ${i.cor}` }}
                >
                  <CardContent className="p-3.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0"
                      style={{ backgroundColor: i.cor + "22", color: i.cor }}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">{i.titulo}</span>
                        {i.anexo_url && (
                          <a href={i.anexo_url} target="_blank" rel="noreferrer" className="text-muted-foreground shrink-0">
                            <Paperclip className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {i.categoria ?? "Sem categoria"} • Pago em {formatDate(i.dataPagamento)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="font-semibold text-sm">{formatCurrency(i.valor)}</div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">Pago</Badge>
                    </div>
                  </CardContent>
                  <div className="px-3.5 pb-3 flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" className="h-8" disabled={revert.isPending} onClick={() => setPending(i)}>
                      <Undo2 className="h-4 w-4 mr-1" /> Reverter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40"
                      disabled={remove.isPending}
                      onClick={() => setDeleting(i)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar como pendente?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.titulo} voltará ao Painel para nova validação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) revert.mutate(pending);
                setPending(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.titulo} será removido permanentemente do histórico. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleting) remove.mutate(deleting);
                setDeleting(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
