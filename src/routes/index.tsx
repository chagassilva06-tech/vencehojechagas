import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, CheckCircle2, Mail, Repeat, Shield } from "lucide-react";
import logo from "@/assets/vencehoje-logo-title.png";
import landingBg from "@/assets/landing-bg.png";
import { supabase } from "@/integrations/supabase/client";

const AuthDialog = lazy(() => import("@/components/landing-auth-dialog"));

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
    <div className="min-h-screen bg-[oklch(0.96_0.03_160)] bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: `url(${landingBg})` }}>
      <div className="min-h-screen bg-background/70 backdrop-blur-[2px]">

      <header className="sticky top-0 z-40 bg-gradient-to-b from-[oklch(0.94_0.08_160)] via-[oklch(0.90_0.10_160)] to-[oklch(0.84_0.13_160)] text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.12)] border-b border-white/40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="VenceHoje" loading="eager" decoding="async" fetchPriority="high" className="h-10 w-auto object-contain" />
          </div>
        </div>
      </header>


      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-4 md:pt-10 md:pb-6">
          <div className="text-left max-w-2xl">
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

      {open && (
        <Suspense fallback={null}>
          <AuthDialog open={open} setOpen={setOpen} tab={tab} setTab={setTab} />
        </Suspense>
      )}
    </div>
  );
}


