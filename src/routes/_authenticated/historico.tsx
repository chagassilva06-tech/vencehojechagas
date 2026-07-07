import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPayments, fetchReminders, formatCurrency, formatDate } from "@/lib/reminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Activity, CheckCircle2, ArrowLeft, Bell, Mail, MessageCircle, ShieldCheck } from "lucide-react";


export const Route = createFileRoute("/_authenticated/historico")({
  component: Historico,
});

type Item = {
  id: string;
  titulo: string;
  categoria?: string | null;
  valor: number | null;
  data: string;
  comprovante_url?: string | null;
  source: "payment" | "reminder";
};

function Historico() {
  const { data: payments } = useSuspenseQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const { data: reminders } = useSuspenseQuery({ queryKey: ["reminders"], queryFn: () => fetchReminders() });
  const [search, setSearch] = useState("");

  const { data: avisos = [] } = useQuery({
    queryKey: ["notifications_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications_log")
        .select("id, enviado_em, data_alvo, dias_antes, tipo, reminder_id, reminders(titulo)")
        .order("enviado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const paidReminders = reminders.filter((r) => r.status === "paid");
  const paidWithPayment = new Set(payments.map((p) => p.reminder_id));

  const items: Item[] = [
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      titulo: p.reminders?.titulo ?? "Lembrete removido",
      categoria: p.reminders?.categories?.nome ?? null,
      valor: p.valor_pago,
      data: p.data_pagamento,
      comprovante_url: p.comprovante_url,
      source: "payment" as const,
    })),
    ...paidReminders
      .filter((r) => !paidWithPayment.has(r.id))
      .map((r) => ({
        id: `r-${r.id}`,
        titulo: r.titulo,
        categoria: r.categories?.nome ?? null,
        valor: r.valor,
        data: r.data_vencimento,
        source: "reminder" as const,
      })),
  ].sort((a, b) => b.data.localeCompare(a.data));

  const filtered = items.filter((it) => !search || it.titulo.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, it) => s + (it.valor ?? 0), 0);

  const recent = [...payments]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 5);

  const titleOptions = Array.from(new Set(items.map((it) => it.titulo).filter(Boolean)));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Dashboard</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} finalizados • Total: <span className="text-accent font-semibold">{formatCurrency(total)}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">Este histórico é permanente — não é apagado ao sair ou atualizar a página.</p>
      </div>

      <Card className="shadow-md border-l-4 border-l-emerald-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Permissões de envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Mail className="h-4 w-4 text-accent" />
            <span className="font-medium">E-mail:</span>
            <Badge className="bg-emerald-500 text-white">Autorizado</Badge>
            <span className="text-muted-foreground text-xs">Você autorizou o envio ao criar sua conta.</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">WhatsApp:</span>
            <Badge variant="outline">Em breve</Badge>
            <span className="text-muted-foreground text-xs">Requer autorização explícita antes do primeiro envio.</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-accent" /> Avisos enviados ({avisos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {avisos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aviso enviado ainda.</p>}
          {avisos.map((a: { id: string; enviado_em: string; data_alvo: string; dias_antes: number; tipo: string; reminders?: { titulo: string } | null }) => (
            <div key={a.id} className="flex items-center justify-between text-sm p-2 rounded-md border-l-4 border-l-primary/40 bg-muted/30">
              <div className="min-w-0">
                <span className="font-medium truncate">{a.reminders?.titulo ?? "Lembrete removido"}</span>
                <span className="text-muted-foreground"> — {a.tipo} • {a.dias_antes === 0 ? "no dia" : `${a.dias_antes}d antes`} • venc. {formatDate(a.data_alvo)}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{new Date(a.enviado_em).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </CardContent>
      </Card>


      {recent.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-accent" /> Últimas ações do Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-md border-l-4 border-l-accent bg-muted/30">
                <div className="min-w-0">
                  <span className="font-medium truncate">{p.reminders?.titulo ?? "Lembrete removido"}</span>
                  <span className="text-muted-foreground"> — marcado como pago em {formatDate(p.data_pagamento)}</span>
                </div>
                <span className="font-semibold text-accent shrink-0 ml-2">{formatCurrency(p.valor_pago)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          list="historico-titles"
          autoComplete="on"
        />
        <datalist id="historico-titles">
          {titleOptions.map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum lembrete finalizado ainda</CardContent></Card>}
        {filtered.map((it) => (
          <Card key={it.id} className="shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-accent">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg grid place-items-center bg-accent/10 text-accent shrink-0">
                {it.source === "payment" ? <FileText className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate flex items-center gap-2">
                  {it.titulo}
                  {it.source === "reminder" && <Badge variant="secondary" className="text-[10px]">sem pagamento</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{it.categoria} • {it.source === "payment" ? "pago" : "finalizado"} em {formatDate(it.data)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-accent">{formatCurrency(it.valor)}</div>
                {it.comprovante_url && <a href={it.comprovante_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">comprovante</a>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
