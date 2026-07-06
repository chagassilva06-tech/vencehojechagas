import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/reminders";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/categorias")({
  component: Categorias,
});

const colors = ["#10B981","#8B5CF6","#F59E0B","#EAB308","#0EA5E9","#3B82F6","#EF4444","#6B7280","#14B8A6","#EC4899","#6366F1","#64748B"];

function Categorias() {
  const qc = useQueryClient();
  const { data: categories } = useSuspenseQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(colors[0]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("categories").insert({ user_id: u.user.id, nome, cor });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Criada"); setOpen(false); setNome(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Excluída"); },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar à tela principal</Link>
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-2" />Nova</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => (
          <Card key={c.id} className="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: c.cor + "33", border: `2px solid ${c.cor}` }} />
              <div className="flex-1 font-medium">{c.nome}</div>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) del.mutate(c.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
            <div><Label>Nome</Label><Input required value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((c) => (
                  <button type="button" key={c} onClick={() => setCor(c)}
                    className={`h-8 w-8 rounded-full transition ${cor === c ? "ring-2 ring-offset-2 ring-foreground" : ""}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={create.isPending}>Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
