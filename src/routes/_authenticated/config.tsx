import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/config")({
  component: Config,
});

function Config() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [avisos, setAvisos] = useState<number[]>([1, 0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setAuthEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) { setNome(data.nome ?? ""); setEmail(data.email ?? u.user.email ?? ""); setAvisos(data.avisos_padrao ?? [1, 0]); }
      else { setEmail(u.user.email ?? ""); }
    })();
  }, []);

  async function changeAuthEmail() {
    if (!newAuthEmail) return toast.error("Digite o novo e-mail.");
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newAuthEmail });
    setChangingEmail(false);
    if (error) return toast.error(error.message);
    toast.success(`Enviamos um link de confirmação para ${newAuthEmail}. Clique no link para concluir a alteração.`, { duration: 8000 });
    setNewAuthEmail("");
  }

  async function save() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").upsert({ id: u.user.id, nome, email, avisos_padrao: avisos });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Preferências salvas");
  }

  function toggle(v: number) {
    setAvisos((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label>E-mail para receber lembretes</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar e-mail de acesso</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>E-mail atual</Label>
            <Input value={authEmail} disabled readOnly />
          </div>
          <div>
            <Label>Novo e-mail</Label>
            <Input type="email" placeholder="novo@email.com" value={newAuthEmail} onChange={(e) => setNewAuthEmail(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Enviaremos um link de confirmação para o novo endereço. A alteração só é efetivada após você clicar no link.</p>
          <Button onClick={changeAuthEmail} disabled={changingEmail} variant="outline">
            {changingEmail ? "Enviando..." : "Alterar e-mail"}
          </Button>
        </CardContent>

      <Card>
        <CardHeader><CardTitle>Avisos padrão</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">Usado como sugestão ao criar novos lembretes.</p>
          {[{ v: 3, l: "3 dias antes" }, { v: 1, l: "1 dia antes" }, { v: 0, l: "No dia do vencimento" }].map((a) => (
            <label key={a.v} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={avisos.includes(a.v)} onCheckedChange={() => toggle(a.v)} /> {a.l}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Plano</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">Gratuito</p>
          <p className="text-muted-foreground">Até 20 lembretes ativos • Notificações por e-mail</p>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
        {loading ? "Salvando..." : "Salvar preferências"}
      </Button>
    </div>
  );
}
