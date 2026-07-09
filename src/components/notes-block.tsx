import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NotebookPen, Plus, Trash2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Note = {
  id: string;
  titulo: string | null;
  conteudo: string;
  updated_at: string;
};

export function NotesBlock() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editConteudo, setEditConteudo] = useState("");
  const [deleting, setDeleting] = useState<Note | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, titulo, conteudo, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        titulo: titulo.trim() || null,
        conteudo: conteudo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setTitulo("");
      setConteudo("");
      toast.success("Anotação salva");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("notes")
        .update({ titulo: editTitulo.trim() || null, conteudo: editConteudo.trim() })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setEditingId(null);
      toast.success("Anotação atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Anotação excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditTitulo(n.titulo ?? "");
    setEditConteudo(n.conteudo);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-bold">Bloco de Anotações</h2>
      </div>

      <Card className="shadow-md border-amber-100 dark:border-amber-900/40 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
        <CardContent className="p-4 space-y-3">
          <Input
            placeholder="Título (opcional)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="bg-white/70 dark:bg-background/50"
          />
          <Textarea
            placeholder="Escreva sua anotação..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            className="bg-white/70 dark:bg-background/50 resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => create.mutate()}
              disabled={!conteudo.trim() || create.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar anotação
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading && (
          <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Carregando...</CardContent></Card>
        )}
        {!isLoading && notes.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma anotação ainda
          </CardContent></Card>
        )}
        {notes.map((n) => (
          <Card key={n.id} className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              {editingId === n.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Título"
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                  />
                  <Textarea
                    value={editConteudo}
                    onChange={(e) => setEditConteudo(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => update.mutate()}
                      disabled={!editConteudo.trim() || update.isPending}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {n.titulo && <div className="font-semibold text-sm sm:text-base mb-1">{n.titulo}</div>}
                    <div className="text-sm whitespace-pre-wrap break-words text-foreground/90">{n.conteudo}</div>
                    <div className="text-[11px] text-muted-foreground mt-2">
                      {new Date(n.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => startEdit(n)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/40"
                      onClick={() => setDeleting(n)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleting) remove.mutate(deleting.id);
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
