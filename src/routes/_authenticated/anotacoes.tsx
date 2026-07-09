import { createFileRoute } from "@tanstack/react-router";
import { NotesBlock } from "@/components/notes-block";
import { StickyNote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/anotacoes")({
  component: Anotacoes,
});

function Anotacoes() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-blue-600 grid place-items-center shadow-sm shadow-blue-600/30">
          <StickyNote className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Bloco de Anotações
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize suas notas, ideias e lembretes pessoais
          </p>
        </div>
      </div>
      <NotesBlock />
    </div>
  );
}

