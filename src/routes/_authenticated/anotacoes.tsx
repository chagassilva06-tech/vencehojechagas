import { createFileRoute } from "@tanstack/react-router";
import { NotesBlock } from "@/components/notes-block";
import { StickyNote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/anotacoes")({
  component: Anotacoes,
});

function Anotacoes() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-primary" />
          Bloco de Anotações
        </h1>
        <p className="text-sm text-muted-foreground">Suas notas pessoais</p>
      </div>
      <NotesBlock />
    </div>
  );
}
