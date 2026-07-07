import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Calendar, CheckCircle2, Mail, Repeat, Shield, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/vencehoje-logo.png";
import heroIllustration from "@/assets/hero-illustration.png";
import heroIllustrationWebp from "@/assets/hero-illustration.webp";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-[oklch(0.96_0.03_160)]">
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[oklch(0.94_0.08_160)] via-[oklch(0.90_0.10_160)] to-[oklch(0.84_0.13_160)] text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.12)] border-b border-white/40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="VenceHoje" width={36} height={36} loading="eager" decoding="async" fetchPriority="high" className="h-9 w-9 object-contain" />
            <span className="font-bold text-lg">VenceHoje</span>
          </div>
        </div>
      </header>


      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="h-[640px] w-[640px] rounded-full bg-accent/25" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="h-[520px] w-[520px] rounded-full bg-accent/40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-4 md:pt-10 md:pb-6 grid md:grid-cols-2 gap-10 items-start">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-2 w-2 rounded-full bg-accent" /> Plano gratuito com até 20 lembretes
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Nunca mais <span className="text-accent">esqueça</span> uma conta para pagar.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Cadastre seus vencimentos, receba lembretes automáticos por e-mail e mantenha
              o controle de tudo em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => { setTab("signin"); setOpen(true); }}
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.18),0_6px_14px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all"
              >
                Entrar
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => { setTab("signup"); setOpen(true); }}
                className="shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_10px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all"
              >
                Criar conta
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <picture>
              <source srcSet={heroIllustrationWebp} type="image/webp" />
              <img
                src={heroIllustration}
                alt="Painel VenceHoje com calendário, faturas e lembretes"
                width={560}
                height={560}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="relative w-full max-w-md md:max-w-lg h-auto drop-shadow-xl"
              />
            </picture>
          </div>
        </div>
      </section>

      <section style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }} className="mx-auto max-w-6xl px-4 pt-2 pb-24 grid md:grid-cols-3 gap-6">
        {[
          { icon: Bell, title: "Lembretes automáticos", desc: "Escolha avisos 3 dias antes, 1 dia antes ou no dia do vencimento." },
          { icon: Repeat, title: "Recorrência", desc: "Mensal, semanal, anual ou personalizada. O próximo vencimento é criado sozinho." },
          { icon: Mail, title: "Notificações por e-mail", desc: "Receba tudo direto na sua caixa de entrada, sem instalar app." },
          { icon: Calendar, title: "Calendário visual", desc: "Veja o mês inteiro e planeje seus pagamentos." },
          { icon: CheckCircle2, title: "Marcar como pago", desc: "Registre data, valor e comprovante em um clique." },
          { icon: Shield, title: "Seus dados protegidos", desc: "Cada usuário só acessa seus próprios lembretes." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-2px_4px_rgba(0,0,0,0.06),0_8px_20px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_6px_rgba(0,0,0,0.08),0_16px_32px_rgba(0,0,0,0.14),0_4px_10px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300">
            <f.icon className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} By Francisco Chagas
      </footer>

      <AuthDialog open={open} setOpen={setOpen} tab={tab} setTab={setTab} />
    </div>
  );
}

function AuthDialog({
  open, setOpen, tab, setTab,
}: { open: boolean; setOpen: (v: boolean) => void; tab: "signin" | "signup"; setTab: (v: "signin" | "signup") => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Conta criada! Enviamos um e-mail para ${email} para confirmar seu acesso.`, { duration: 8000 });
  }

  async function forgotPassword() {
    if (!email) return toast.error("Digite seu e-mail para recuperar a senha.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao VenceHoje</DialogTitle>
          <DialogDescription>Entre na sua conta ou crie uma gratuita.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-4">
            <form onSubmit={signIn} className="space-y-3">
              <div>
                <Label>E-mail</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Senha</Label>
                  <button type="button" onClick={forgotPassword} className="text-xs text-accent hover:underline" disabled={loading}>
                    Esqueceu a senha?
                  </button>
                </div>
                <PasswordInput value={password} onChange={setPassword} show={showSignIn} toggle={() => setShowSignIn((s) => !s)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>Entrar</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={signUp} className="space-y-3">
              <div><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <Label>Senha</Label>
                <PasswordInput value={password} onChange={setPassword} show={showSignUp} toggle={() => setShowSignUp((s) => !s)} minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>Criar conta grátis</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PasswordInput({
  value, onChange, show, toggle, minLength,
}: { value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; minLength?: number }) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

