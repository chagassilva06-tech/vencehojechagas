import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchReminders, formatCurrency } from "@/lib/reminders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";


export const Route = createFileRoute("/_authenticated/calendario")({
  component: Calendario,
});

const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function Calendario() {
  const { data: reminders } = useSuspenseQuery({ queryKey: ["reminders"], queryFn: () => fetchReminders() });
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay: Record<string, typeof reminders> = {};
  reminders.forEach((r) => { (byDay[r.data_vencimento] ??= []).push(r); });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Painel</Link>
      </Button>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold truncate">Calendário</h1>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="font-medium w-28 sm:w-40 text-center text-sm sm:text-base">{monthNames[month]} {year}</div>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => <div key={d} className="p-1 sm:p-2 text-center font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="min-h-14 sm:min-h-24" />;
              const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const items = byDay[dateStr] ?? [];
              const isToday = dateStr === today;
              return (
                <div key={i} className={`min-h-14 sm:min-h-24 rounded-md border p-1 sm:p-1.5 text-[10px] sm:text-xs transition-colors overflow-hidden ${isToday ? "border-accent bg-accent/5" : items.length > 0 ? "border-2 border-primary/70 bg-primary/5" : ""}`}>
                  <div className={`font-semibold mb-0.5 sm:mb-1 ${isToday ? "text-accent" : items.length > 0 ? "text-primary" : ""}`}>{d}</div>
                  {/* Mobile: colored dots */}
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {items.slice(0, 4).map((r) => (
                      <span key={r.id} className="h-1.5 w-1.5 rounded-full" title={r.titulo} style={{ backgroundColor: r.categories?.cor ?? "#10B981" }} />
                    ))}
                  </div>
                  {/* Desktop/tablet: item pills */}
                  <div className="hidden sm:block space-y-0.5">
                    {items.slice(0, 3).map((r) => (
                      <div key={r.id} className="truncate rounded px-1 py-0.5" title={`${r.titulo} — ${formatCurrency(r.valor)}`}
                        style={{ backgroundColor: (r.categories?.cor ?? "#10B981") + "22", color: r.categories?.cor ?? "#10B981" }}>
                        {r.titulo}
                      </div>
                    ))}
                    {items.length > 3 && <div className="text-muted-foreground text-[10px]">+{items.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
