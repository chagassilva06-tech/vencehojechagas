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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(colors[0]);

  function openNew() { setEditingId(null); setNome(""); setCor(colors[0]); setOpen(true); }
  function openEdit(c: { id: string; nome: string; cor: string }) { setEditingId(c.id); setNome(c.nome); setCor(c.cor); setOpen(true); }

  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      if (editingId) {
        const { error } = await supabase.from("categories").update({ nome, cor }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({ user_id: u.user.id, nome, cor });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success(editingId ? "Atualizada" : "Criada"); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); toast.success("Excluída"); },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Painel</Link>
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4 mr-2" />Nova</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((c) => (
          <Card
            key={c.id}
            className="group relative rounded-2xl border-none shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15),0_6px_10px_-6px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25),0_10px_20px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300 bg-card"
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div
                className="h-20 w-20 rounded-2xl grid place-items-center text-2xl font-bold shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${c.cor}33 0%, ${c.cor}1f 100%)`,
                  color: c.cor,
                  boxShadow: `0 8px 18px -8px ${c.cor}44`,
                }}
              >
                {c.nome.charAt(0).toUpperCase()}
              </div>
              <div className="font-medium text-sm truncate w-full">{c.nome}</div>
              <div className="absolute top-1 right-1 flex opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} title="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) del.mutate(c.id); }} title="Excluir">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
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
              <Button type="submit" disabled={save.isPending}>{editingId ? "Salvar" : "Criar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
