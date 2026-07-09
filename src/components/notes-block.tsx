import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, Save, Pencil, X, Search, Pin, PinOff, Star, StickyNote, Calendar, Tag, Archive, ArchiveRestore, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  titulo: string | null;
  conteudo: string;
  categoria: string | null;
  pinned: boolean;
  favorito: boolean;
  archived: boolean;
  updated_at: string;
  created_at: string;
};

type SortOption = "recent" | "oldest" | "title";
type ViewMode = "active" | "archived";

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} às ${hh}:${mi}`;
}

export function NotesBlock() {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editConteudo, setEditConteudo] = useState("");
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, titulo, conteudo, categoria, pinned, favorito, archived, updated_at, created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });

  const archivedCount = useMemo(() => notes.filter((n) => n.archived).length, [notes]);
  const activeCount = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);

  const categorias = useMemo(
    () => Array.from(new Set(notes.map((n) => n.categoria).filter(Boolean))) as string[],
    [notes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = notes.filter((n) => {
      if (viewMode === "active" && n.archived) return false;
      if (viewMode === "archived" && !n.archived) return false;
      if (filterCategoria !== "all" && (n.categoria ?? "") !== filterCategoria) return false;
      if (!q) return true;
      return (
        (n.titulo ?? "").toLowerCase().includes(q) ||
        n.conteudo.toLowerCase().includes(q) ||
        (n.categoria ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "title") {
        return (a.titulo ?? "").localeCompare(b.titulo ?? "", "pt-BR", { sensitivity: "base" });
      }
      const ta = new Date(a.updated_at).getTime();
      const tb = new Date(b.updated_at).getTime();
      return sortBy === "recent" ? tb - ta : ta - tb;
    });

    // pinned always on top (only for active view)
    if (viewMode === "active") {
      sorted.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    return sorted;
  }, [notes, search, filterCategoria, sortBy, viewMode]);

  const create = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        titulo: titulo.trim() || null,
        categoria: categoria.trim() || null,
        conteudo: conteudo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      setTitulo("");
      setCategoria("");
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
        .update({
          titulo: editTitulo.trim() || null,
          categoria: editCategoria.trim() || null,
          conteudo: editConteudo.trim(),
        })
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

  const toggleFlag = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: "pinned" | "favorito" | "archived"; value: boolean }) => {
      const patch: Record<string, boolean> = { [field]: value };
      // Ao arquivar, desafixar
      if (field === "archived" && value) patch.pinned = false;
      const { error } = await supabase.from("notes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      if (vars.field === "archived") {
        toast.success(vars.value ? "Anotação arquivada" : "Anotação restaurada");
      }
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
    setEditCategoria(n.categoria ?? "");
    setEditConteudo(n.conteudo);
  }

  return (
    <div className="space-y-5">
      {/* Formulário de nova anotação */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-titulo" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Título da nota
              </Label>
              <Input
                id="note-titulo"
                placeholder="Ex.: Reunião de terça"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-categoria" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Categoria
              </Label>
              <Input
                id="note-categoria"
                placeholder="Ex.: Trabalho, Pessoal, Ideias"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                list="notes-categorias"
              />
              <datalist id="notes-categorias">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-conteudo" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Conteúdo da anotação
            </Label>
            <Textarea
              id="note-conteudo"
              placeholder="Escreva sua anotação aqui..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => create.mutate()}
              disabled={!conteudo.trim() || create.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Adicionar anotação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Abas Ativas / Arquivadas */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("active")}
          className={cn(viewMode === "active" && "bg-blue-600 hover:bg-blue-700 text-white")}
        >
          <StickyNote className="h-4 w-4 mr-1.5" />
          Ativas
          <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit border-0">
            {activeCount}
          </Badge>
        </Button>
        <Button
          variant={viewMode === "archived" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("archived")}
          className={cn(viewMode === "archived" && "bg-slate-700 hover:bg-slate-800 text-white")}
        >
          <Archive className="h-4 w-4 mr-1.5" />
          Arquivadas
          <Badge variant="secondary" className="ml-2 bg-white/20 text-inherit border-0">
            {archivedCount}
          </Badge>
        </Button>
      </div>

      {/* Busca + filtro + ordenação */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por título, conteúdo ou categoria..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="sm:w-52">
              <ArrowUpDown className="h-4 w-4 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes primeiro</SelectItem>
              <SelectItem value="oldest">Mais antigas primeiro</SelectItem>
              <SelectItem value="title">Título A-Z</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {isLoading && (
          <Card className="md:col-span-2"><CardContent className="py-8 text-center text-sm text-muted-foreground">
            Carregando...
          </CardContent></Card>
        )}
        {!isLoading && filtered.length === 0 && (
          <Card className="md:col-span-2 border-dashed border-slate-300 dark:border-slate-700">
            <CardContent className="py-14 flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-950/40 grid place-items-center">
                {viewMode === "archived" ? (
                  <Archive className="h-7 w-7 text-blue-600" />
                ) : (
                  <StickyNote className="h-7 w-7 text-blue-600" />
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {viewMode === "archived"
                    ? "Nenhuma anotação arquivada"
                    : notes.length === 0
                    ? "Nenhuma anotação ainda"
                    : "Nada encontrado"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {viewMode === "archived"
                    ? "As anotações que você arquivar aparecerão aqui."
                    : notes.length === 0
                    ? "Crie sua primeira anotação usando o formulário acima."
                    : "Tente ajustar a busca ou o filtro de categoria."}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filtered.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "group transition-all duration-200 rounded-xl border-slate-200 dark:border-slate-800",
              "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_6px_-2px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.7)]",
              "hover:shadow-[0_6px_14px_-4px_rgba(15,23,42,0.15),0_10px_24px_-8px_rgba(37,99,235,0.18),inset_0_1px_0_rgba(255,255,255,0.85)]",
              "hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-900/60",
              "bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-900/60",
              n.pinned && !n.archived && "ring-1 ring-blue-200 dark:ring-blue-900/50 from-blue-50/60 to-white dark:from-blue-950/20",
              n.archived && "opacity-80 from-slate-50 to-slate-100/60 dark:from-slate-900/60 dark:to-slate-900/40",
            )}
          >
            <CardContent className="p-3.5">

              {editingId === n.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Título da nota</Label>
                      <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Categoria</Label>
                      <Input value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Conteúdo da anotação</Label>
                    <Textarea
                      value={editConteudo}
                      onChange={(e) => setEditConteudo(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => update.mutate()}
                      disabled={!editConteudo.trim() || update.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {n.pinned && !n.archived && (
                          <Pin className="h-3.5 w-3.5 text-blue-600 shrink-0" fill="currentColor" />
                        )}
                        {n.archived && (
                          <Archive className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        )}
                        <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">
                          {n.titulo || "Sem título"}
                        </h3>
                      </div>
                      {n.categoria && (
                        <Badge
                          variant="secondary"
                          className="mt-1.5 bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 font-normal"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {n.categoria}
                        </Badge>
                      )}
                    </div>
                    {!n.archived && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={n.favorito ? "Remover destaque" : "Marcar como importante"}
                          onClick={() => toggleFlag.mutate({ id: n.id, field: "favorito", value: !n.favorito })}
                        >
                          <Star
                            className={cn("h-4 w-4", n.favorito ? "text-orange-500" : "text-slate-400")}
                            fill={n.favorito ? "currentColor" : "none"}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={n.pinned ? "Desafixar" : "Fixar no topo"}
                          onClick={() => toggleFlag.mutate({ id: n.id, field: "pinned", value: !n.pinned })}
                        >
                          {n.pinned ? (
                            <PinOff className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Pin className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-snug line-clamp-3">
                    {n.conteudo}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100 dark:border-slate-800">

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(n.updated_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      {n.archived ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          onClick={() => toggleFlag.mutate({ id: n.id, field: "archived", value: false })}
                          title="Reverter arquivamento"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Reverter
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            onClick={() => startEdit(n)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => toggleFlag.mutate({ id: n.id, field: "archived", value: true })}
                            title="Arquivar"
                          >
                            <Archive className="h-3.5 w-3.5 mr-1" /> Arquivar
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => setDeleting(n)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
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
              {deleting?.titulo ? `"${deleting.titulo}" ` : "Esta anotação "}
              será removida permanentemente. Esta ação não pode ser desfeita.
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
