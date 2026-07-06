import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, CheckCircle2, Mail, Repeat, Shield } from "lucide-react";
import logo from "@/assets/vencehoje-logo.png";
import heroIllustration from "@/assets/hero-illustration.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
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
        {/* Decorative teal circles on the right */}
        <div aria-hidden className="pointer-events-none absolute -right-40 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="h-[640px] w-[640px] rounded-full bg-accent/25" />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 hidden md:block">
          <div className="h-[520px] w-[520px] rounded-full bg-accent/40" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-16 md:pt-10 md:pb-20 grid md:grid-cols-2 gap-10 items-start">
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
              <Link to="/auth" search={{ mode: "signup" } as never}>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-2px_6px_rgba(0,0,0,0.18),0_6px_14px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all">Entre na sua conta</Button>
              </Link>
              <Link to="/auth"><Button size="lg" variant="outline" className="shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all">Já tenho conta</Button></Link>
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 grid md:grid-cols-3 gap-6">
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
    </div>
  );
}
