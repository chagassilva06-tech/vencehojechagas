import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReminders, fetchPayments, formatCurrency, formatDate } from "@/lib/reminders";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, CheckCircle2, Paperclip, Undo2 } from "lucide-react";
import { toast } from "sonner";
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
  data: string;
  valor: number | null;
  anexo_url: string | null;
  source: "payment" | "reminder";
};

function Concluidas() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: payments } = useSuspenseQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: paidReminders } = useSuspenseQuery({
    queryKey: ["reminders", "paid"],
    queryFn: () => fetchReminders({ status: "paid" }),
  });
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Item | null>(null);

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
      data: p.data_pagamento,
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
        data: r.data_vencimento,
        valor: r.valor,
        anexo_url: r.anexo_url,
        source: "reminder",
      })),
  ].sort((a, b) => b.data.localeCompare(a.data));


  const filtered = items.filter((i) =>
    !search || i.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, i) => s + (Number(i.valor) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar à tela principal</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-accent" />
          Contas Concluídas
        </h1>
        <p className="text-sm text-muted-foreground">Tudo que já foi finalizado / pago</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300"><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide opacity-90 drop-shadow-sm">Total pago</div>
          <div className="text-2xl font-bold drop-shadow">{formatCurrency(total)}</div>
        </CardContent></Card>
        <Card className="relative overflow-hidden border-none text-white bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25),0_6px_10px_-6px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300"><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide opacity-90 drop-shadow-sm">Registros</div>
          <div className="text-2xl font-bold drop-shadow">{filtered.length}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            Nenhuma conta concluída ainda
          </CardContent></Card>
        )}
        {filtered.map((i) => (
          <Card key={i.id} className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg grid place-items-center shrink-0"
                style={{ backgroundColor: i.cor + "22", color: i.cor }}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{i.titulo}</span>
                  {i.anexo_url && (
                    <a href={i.anexo_url} target="_blank" rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {i.categoria ?? "Sem categoria"} • {formatDate(i.data)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold">{formatCurrency(i.valor)}</div>
                <Badge className="mt-1 bg-accent text-accent-foreground">Pago</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={revert.isPending}
                onClick={() => setPending(i)}
              >
                <Undo2 className="h-4 w-4 mr-1" /> Reverter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(v) => !v && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar como pendente?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.titulo} voltará ao Dashboard para nova validação.
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
    </div>
  );
}
