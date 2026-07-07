import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { enviarWhatsappTeste } from "@/lib/whatsapp-test.functions";


export const Route = createFileRoute("/_authenticated/config")({
  component: Config,
});

const TEXTO_AUTORIZACAO_WHATSAPP =
  "Quero receber lembretes pelo WhatsApp sobre vencimentos, contas e compromissos cadastrados por mim neste site. Autorizo o envio de mensagens para o número informado. Posso cancelar o recebimento a qualquer momento.";

interface WhatsappConsent {
  id: string;
  nome: string;
  whatsapp_numero: string;
  permissao: "autorizado" | "nao_autorizado";
  aceite_em: string | null;
  status: "ativo" | "cancelado";
  cancelado_em: string | null;
}



function Config() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [avisos, setAvisos] = useState<number[]>([1]);
  const [loading, setLoading] = useState(false);

  // WhatsApp consent state
  const [wppNome, setWppNome] = useState("");
  const [wppNumero, setWppNumero] = useState("");
  const [wppAceite, setWppAceite] = useState(false);
  const [wppLoading, setWppLoading] = useState(false);
  const [wppConsent, setWppConsent] = useState<WhatsappConsent | null>(null);
  const [wppTestLoading, setWppTestLoading] = useState(false);
  const enviarTeste = useServerFn(enviarWhatsappTeste);

  async function enviarMensagemTesteWhatsapp() {
    setWppTestLoading(true);
    try {
      await enviarTeste({});
      toast.success("Mensagem de teste enviada com sucesso para o WhatsApp cadastrado.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg ||
          "Não foi possível enviar a mensagem. Verifique se o número de WhatsApp está cadastrado e se a autorização de envio está ativa.",
      );
    } finally {
      setWppTestLoading(false);
    }
  }

  async function reloadConsent(userId: string) {
    const { data } = await supabase
      .from("whatsapp_consents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setWppConsent((data as WhatsappConsent | null) ?? null);
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setAuthEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) { setNome(data.nome ?? ""); setEmail(data.email ?? u.user.email ?? ""); setAvisos([1]); setWppNome(data.nome ?? ""); }
      else { setEmail(u.user.email ?? ""); }
      await reloadConsent(u.user.id);
    })();
  }, []);

  async function salvarConsentimentoWhatsapp() {
    if (!wppNome.trim()) return toast.error("Informe seu nome.");
    const numeroLimpo = wppNumero.replace(/\D/g, "");
    if (numeroLimpo.length < 10) return toast.error("Informe um número de WhatsApp válido com DDD.");
    if (!wppAceite) return toast.error("Você precisa marcar a autorização para prosseguir.");
    setWppLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setWppLoading(false); return; }
    const { error } = await supabase.from("whatsapp_consents").insert({
      user_id: u.user.id,
      nome: wppNome.trim(),
      whatsapp_numero: numeroLimpo,
      permissao: "autorizado",
      aceite_em: new Date().toISOString(),
      origem_aceite: "configuracoes",
      texto_autorizacao: TEXTO_AUTORIZACAO_WHATSAPP,
      status: "ativo",
    });
    setWppLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Autorização registrada. Você receberá lembretes pelo WhatsApp.");
    setWppAceite(false);
    setWppNumero("");
    await reloadConsent(u.user.id);
  }

  async function cancelarConsentimentoWhatsapp() {
    if (!wppConsent) return;
    setWppLoading(true);
    const { error } = await supabase
      .from("whatsapp_consents")
      .update({ status: "cancelado", permissao: "nao_autorizado", cancelado_em: new Date().toISOString() })
      .eq("id", wppConsent.id);
    setWppLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Recebimento por WhatsApp cancelado.");
    const { data: u } = await supabase.auth.getUser();
    if (u.user) await reloadConsent(u.user.id);
  }


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
      <Button asChild variant="ghost" size="sm" className="-ml-2 bg-sky-100 text-sky-700 hover:bg-sky-200 hover:text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Dashboard</Link>
      </Button>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lembretes por WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wppConsent && wppConsent.status === "ativo" && wppConsent.permissao === "autorizado" ? (
            <div className="space-y-3">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="font-medium text-emerald-800 dark:text-emerald-200">Recebimento autorizado</p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                  Nome: <strong>{wppConsent.nome}</strong><br />
                  Número: <strong>{wppConsent.whatsapp_numero}</strong><br />
                  Aceite em: {wppConsent.aceite_em ? new Date(wppConsent.aceite_em).toLocaleString("pt-BR") : "—"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Os envios serão realizados pela integração oficial com a WhatsApp Business Platform (Cloud API), usando mensagens de lembrete autorizadas por você. Você pode cancelar o recebimento a qualquer momento.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={enviarMensagemTesteWhatsapp}
                  disabled={wppTestLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {wppTestLoading ? "Enviando..." : "Enviar lembrete de teste no WhatsApp"}
                </Button>
                <Button variant="destructive" onClick={cancelarConsentimentoWhatsapp} disabled={wppLoading}>
                  {wppLoading ? "Cancelando..." : "Cancelar recebimento por WhatsApp"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {wppConsent && wppConsent.status === "cancelado" && (
                <div className="rounded-md border border-muted bg-muted/40 p-3 text-xs text-muted-foreground">
                  Recebimento cancelado em {wppConsent.cancelado_em ? new Date(wppConsent.cancelado_em).toLocaleString("pt-BR") : "—"}. Você pode autorizar novamente abaixo.
                </div>
              )}
              <div>
                <Label>Nome</Label>
                <Input value={wppNome} onChange={(e) => setWppNome(e.target.value)} placeholder="Seu nome completo" />
              </div>
              <div>
                <Label>Número de WhatsApp (com DDD)</Label>
                <Input
                  type="tel"
                  value={wppNumero}
                  onChange={(e) => setWppNumero(e.target.value)}
                  placeholder="Ex.: 11987654321"
                  inputMode="tel"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground mt-1">Informe apenas números, incluindo DDD. Para números internacionais, inclua o código do país.</p>
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-3 bg-muted/30">
                <Checkbox
                  checked={wppAceite}
                  onCheckedChange={(v) => setWppAceite(v === true)}
                  className="mt-0.5"
                />
                <span className="leading-snug">{TEXTO_AUTORIZACAO_WHATSAPP}</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Não utilizamos automações não oficiais. O envio será feito por meio da integração oficial com a WhatsApp Business Platform (Cloud API), respeitando o opt-in e opt-out do usuário.
              </p>
              <Button onClick={salvarConsentimentoWhatsapp} disabled={wppLoading || !wppAceite}>
                {wppLoading ? "Salvando..." : "Autorizar recebimento por WhatsApp"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


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
