import { useState } from "react";
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
  const [observacoes, setObservacoes] = useState(reminder?.observacoes ?? "");
  const [recorrencia, setRecorrencia] = useState<Recurrence>(reminder?.recorrencia ?? "none");
  const [intervaloDias, setIntervaloDias] = useState(reminder?.intervalo_dias?.toString() ?? "30");
  const [avisos, setAvisos] = useState<number[]>(reminder?.avisos ?? [1, 0]);
  const [file, setFile] = useState<File | null>(null);

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
      };
      if (reminder) {
        const { error } = await supabase.from("reminders").update(payload).eq("id", reminder.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reminders").insert(payload);
        if (error) throw error;
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
            <div><Label>Data de vencimento</Label><Input type="date" required value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} /></div>
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
            <div className="flex gap-4 mt-2">
              {[{ v: 3, l: "3 dias antes" }, { v: 1, l: "1 dia antes" }, { v: 0, l: "No dia" }].map((a) => (
                <label key={a.v} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={avisos.includes(a.v)} onCheckedChange={() => toggleAviso(a.v)} />
                  {a.l}
                </label>
              ))}
            </div>
          </div>
          <div><Label>Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} /></div>
          <div>
            <Label>Anexo (boleto/PDF)</Label>
            <Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {reminder?.anexo_nome && !file && <p className="text-xs text-muted-foreground mt-1">Atual: {reminder.anexo_nome}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {mut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
