import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachment, type Reminder, type Category, type Recurrence } from "@/lib/reminders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, X, Eye } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: Category[];
  reminder?: Reminder | null;
}

export function ReminderForm({ open, onOpenChange, categories, reminder }: Props) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState(reminder?.titulo ?? "");
  const [categoriaId, setCategoriaId] = useState(reminder?.categoria_id ?? categories[0]?.id ?? "");
  const [valor, setValor] = useState(reminder?.valor?.toString() ?? "");
  const [dataVenc, setDataVenc] = useState(reminder?.data_vencimento ?? new Date().toISOString().slice(0, 10));
  const [horaVenc, setHoraVenc] = useState<string>((reminder as unknown as { hora_vencimento?: string | null })?.hora_vencimento?.slice(0, 5) ?? "");
  const [showHora, setShowHora] = useState<boolean>(!!(reminder as unknown as { hora_vencimento?: string | null })?.hora_vencimento);
  const [observacoes, setObservacoes] = useState(reminder?.observacoes ?? "");
  const [recorrencia, setRecorrencia] = useState<Recurrence>(reminder?.recorrencia ?? "none");
  const [intervaloDias, setIntervaloDias] = useState(reminder?.intervalo_dias?.toString() ?? "30");
  const [avisos, setAvisos] = useState<number[]>(reminder?.avisos ?? [1]);
  const [file, setFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [previewIsPdf, setPreviewIsPdf] = useState(false);

  const isImage = (name?: string | null) => !!name && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
  const isPdf = (name?: string | null) => !!name && /\.pdf$/i.test(name);

  function openPreviewForFile(f: File) {
    const url = URL.createObjectURL(f);
    setPreviewSrc(url);
    setPreviewName(f.name);
    setPreviewIsPdf(f.type === "application/pdf" || isPdf(f.name));
    setPreviewOpen(true);
  }
  function openPreviewForUrl(url: string, name: string) {
    setPreviewSrc(url);
    setPreviewName(name);
    setPreviewIsPdf(isPdf(name));
    setPreviewOpen(true);
  }

  const mut = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      let anexo_url = reminder?.anexo_url ?? null;
      let anexo_nome = reminder?.anexo_nome ?? null;
      if (file) { const up = await uploadAttachment(u.user.id, file); anexo_url = up.url; anexo_nome = up.name; }
      const payload = {
        user_id: u.user.id, categoria_id: categoriaId || null, titulo,
        valor: valor ? Number(valor) : null, observacoes: observacoes || null,
        data_vencimento: dataVenc, recorrencia, intervalo_dias: recorrencia === "custom" ? Number(intervaloDias) : null,
        avisos, anexo_url, anexo_nome,
        hora_vencimento: showHora && horaVenc ? horaVenc : null,
      };
      if (reminder) {
        const { error } = await supabase.from("reminders").update(payload).eq("id", reminder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reminders").insert(payload);
        if (error) throw error;
        // Auto-replicar para o mês seguinte
        const base = new Date(dataVenc + "T00:00:00");
        const nextMonth = base.getMonth() + 1;
        const nextYear = base.getFullYear() + Math.floor(nextMonth / 12);
        const targetMonth = nextMonth % 12;
        const day = base.getDate();
        const lastDay = new Date(nextYear, targetMonth + 1, 0).getDate();
        const d = new Date(nextYear, targetMonth, Math.min(day, lastDay));
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const { error: e2 } = await supabase.from("reminders").insert({ ...payload, data_vencimento: iso });
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success(reminder ? "Lembrete atualizado" : "Lembrete criado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleAviso(v: number) {
    setAvisos((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{reminder ? "Editar lembrete" : "Novo lembrete"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div><Label>Título</Label><Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Internet Vivo" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Data de vencimento</Label>
                <Button
                  type="button"
                  variant={showHora ? "default" : "ghost"}
                  size="sm"
                  className={`h-6 px-2 text-xs gap-1 ${showHora ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                  onClick={() => { setShowHora((v) => !v); if (showHora) setHoraVenc(""); }}
                  title={showHora ? "Remover horário" : "Adicionar horário de término"}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {showHora ? (horaVenc || "--:--") : "Horário"}
                </Button>
              </div>
              <Input type="date" required value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
              {showHora && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input type="time" value={horaVenc} onChange={(e) => setHoraVenc(e.target.value)} className="flex-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowHora(false); setHoraVenc(""); }} title="Remover">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div><Label>Valor (opcional)</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></div>
          <div>
            <Label>Recorrência</Label>
            <Select value={recorrencia} onValueChange={(v) => setRecorrencia(v as Recurrence)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem repetição</SelectItem>
                <SelectItem value="daily">Diária</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recorrencia === "custom" && (
            <div><Label>Intervalo (dias)</Label><Input type="number" min="1" value={intervaloDias} onChange={(e) => setIntervaloDias(e.target.value)} /></div>
          )}
          <div>
            <Label>Quando avisar</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {[{ v: 3, l: "3 dias antes" }, { v: 1, l: "1 dia antes" }, { v: 0, l: "No dia" }].map((a) => {
                const base = dataVenc ? new Date(dataVenc + "T00:00:00") : null;
                let dynLabel = a.l;
                if (base) {
                  base.setDate(base.getDate() - a.v);
                  const formatted = base.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "short" });
                  dynLabel = `Avisar em ${formatted}`;
                }
                return (
                  <label key={a.v} className="flex items-center gap-2 text-sm cursor-pointer group relative" title={dynLabel}>
                    <Checkbox checked={avisos.includes(a.v)} onCheckedChange={() => toggleAviso(a.v)} />
                    <span className="group-hover:hidden">{a.l}</span>
                    <span className="hidden group-hover:inline text-accent">{dynLabel}</span>
                  </label>
                );
              })}
              <label
                className={`flex items-center gap-2 text-sm ${showHora && horaVenc ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                title={showHora && horaVenc ? `Avisar na hora agendada (${horaVenc})` : "Defina o horário no campo de vencimento para habilitar"}
              >
                <Checkbox
                  checked={avisos.includes(-1)}
                  disabled={!showHora || !horaVenc}
                  onCheckedChange={() => toggleAviso(-1)}
                />
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>Hora agendada{showHora && horaVenc ? ` (${horaVenc})` : ""}</span>
              </label>
            </div>
          </div>
          <div><Label>Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} /></div>
          <div>
            <Label>Anexo (boleto/PDF)</Label>
            <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-xs truncate">{file.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs hover:bg-accent hover:text-accent-foreground"
                  onClick={() => openPreviewForFile(file)}
                >
                  <Eye className="h-3.5 w-3.5" /> Visualizar
                </Button>
              </div>
            )}
            {reminder?.anexo_nome && !file && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-xs truncate">Atual: {reminder.anexo_nome}</span>
                {reminder.anexo_url && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs hover:bg-accent hover:text-accent-foreground"
                    onClick={() => openPreviewForUrl(reminder.anexo_url!, reminder.anexo_nome ?? "anexo")}
                  >
                    <Eye className="h-3.5 w-3.5" /> Visualizar
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 bg-background pt-3 -mx-6 px-6 border-t flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" disabled={mut.isPending} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
              {mut.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-sm truncate">{previewName || "Visualizar anexo"}</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-2 flex items-center justify-center bg-muted/20 max-h-[80vh] overflow-auto">
          {previewSrc && previewIsPdf ? (
            <iframe src={previewSrc} title={previewName} className="w-full h-[75vh] rounded-md border" />
          ) : previewSrc ? (
            <img src={previewSrc} alt={previewName} className="max-w-full max-h-[75vh] object-contain rounded-md" />
          ) : null}
        </div>
        {previewSrc && (
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button type="button" variant="outline" size="sm" onClick={() => window.open(previewSrc!, "_blank", "noopener,noreferrer")}>Abrir em nova aba</Button>
            <Button type="button" size="sm" onClick={() => setPreviewOpen(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
