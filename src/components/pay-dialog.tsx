import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadAttachment, type Reminder } from "@/lib/reminders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PayDialog({ open, onOpenChange, reminder }: { open: boolean; onOpenChange: (v: boolean) => void; reminder: Reminder | null }) {
  const qc = useQueryClient();
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [valor, setValor] = useState(reminder?.valor?.toString() ?? "");
  const [file, setFile] = useState<File | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      if (!reminder) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      let comprovante_url: string | null = null;
      if (file) { const up = await uploadAttachment(u.user.id, file); comprovante_url = up.url; }
      const { error: e1 } = await supabase.from("payments").insert({
        reminder_id: reminder.id, user_id: u.user.id, data_pagamento: data,
        valor_pago: valor ? Number(valor) : null, comprovante_url,
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("reminders").update({ status: "paid" }).eq("id", reminder.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Pagamento registrado! Se recorrente, o próximo já foi criado.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Marcar como pago</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
          <div><Label>Data do pagamento</Label><Input type="date" required value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div><Label>Valor pago</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><Label>Comprovante (opcional)</Label><Input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {mut.isPending ? "Salvando..." : "Confirmar pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
