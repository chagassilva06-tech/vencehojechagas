import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchPayments, formatCurrency, formatDate } from "@/lib/reminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/historico")({
  component: Historico,
});

function Historico() {
  const { data: payments } = useSuspenseQuery({ queryKey: ["payments"], queryFn: fetchPayments });
  const [search, setSearch] = useState("");
  const filtered = payments.filter((p) => !search || p.reminders?.titulo?.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, p) => s + (p.valor_pago ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground">Total pago: <span className="text-accent font-semibold">{formatCurrency(total)}</span></p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por título..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum pagamento registrado ainda</CardContent></Card>}
        {filtered.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg grid place-items-center bg-accent/10 text-accent shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.reminders?.titulo ?? "Lembrete removido"}</div>
                <div className="text-xs text-muted-foreground">{p.reminders?.categories?.nome} • pago em {formatDate(p.data_pagamento)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-accent">{formatCurrency(p.valor_pago)}</div>
                {p.comprovante_url && <a href={p.comprovante_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">comprovante</a>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
