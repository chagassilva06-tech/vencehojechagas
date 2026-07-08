import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paperclip, Eye } from "lucide-react";

const isPdf = (name?: string | null) => !!name && /\.pdf$/i.test(name);

interface Props {
  url: string;
  name?: string | null;
  className?: string;
  variant?: "link" | "button";
}

export function AttachmentPreview({ url, name, className, variant = "link" }: Props) {
  const [open, setOpen] = useState(false);
  const label = name ?? "Anexo";
  const pdf = isPdf(name) || /\.pdf($|\?)/i.test(url);

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={className ?? "text-accent hover:underline inline-flex items-center gap-1"}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {label}
        </button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={className ?? "h-7 gap-1 text-xs hover:bg-accent hover:text-accent-foreground"}
          onClick={() => setOpen(true)}
        >
          <Eye className="h-3.5 w-3.5" /> Visualizar
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-sm truncate">{label}</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2 flex items-center justify-center bg-muted/20 max-h-[80vh] overflow-auto">
            {pdf ? (
              <iframe src={url} title={label} className="w-full h-[75vh] rounded-md border" />
            ) : (
              <img src={url} alt={label} className="max-w-full max-h-[75vh] object-contain rounded-md" />
            )}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button type="button" variant="outline" size="sm" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
              Abrir em nova aba
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
