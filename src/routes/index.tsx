import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Calendar, CheckCircle2, LogIn, Mail, Repeat, Shield, UserPlus } from "lucide-react";
import logo from "@/assets/vencehoje-logo-title.png";
import workspace from "@/assets/landing-workspace.png";
import { supabase } from "@/integrations/supabase/client";
import bgImage from "@/assets/landing-bg.png.asset.json";

const AuthDialog = lazy(() => import("@/components/landing-auth-dialog"));

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "preload", as: "image", href: workspace, fetchpriority: "high" } as any,
      { rel: "preload", as: "image", href: bgImage.url } as any,
    ],
  }),
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
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: `url(${bgImage.url})` }}>




      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-16 md:pb-12 grid md:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center md:justify-start">
            <img
              src={workspace}
              alt="Ilustração de mesa de trabalho com calendário e relógio"
              width={1280}
              height={1024}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full max-w-lg h-auto md:max-w-[calc(32rem+9cm)]"
            />
          </div>

          <div className="w-full max-w-sm md:justify-self-end rounded-[2.5rem] bg-card overflow-hidden border-2 border-border/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25),0_-8px_20px_-8px_rgba(0,0,0,0.08),12px_0_24px_-12px_rgba(0,0,0,0.15),-12px_0_24px_-12px_rgba(0,0,0,0.15),inset_0_2px_0_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(0,0,0,0.08),inset_2px_0_4px_rgba(255,255,255,0.5),inset_-2px_0_4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-3 px-8 py-6 border-b bg-card shadow-[0_4px_6px_-4px_rgba(0,0,0,0.15)]">
              <BellRing className="h-9 w-9 text-accent shrink-0" strokeWidth={2.5} />
              <div className="flex flex-col">
                <img src={logo} alt="VenceHoje" width={200} height={32} loading="eager" decoding="async" className="h-8 w-auto object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" />
                <span className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">By Francisco Chagas</span>
              </div>
            </div>



            <div className="px-8 pt-14 pb-14 md:pt-16 md:pb-16 text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground/90">
                DASHBOARD
              </h2>
              <p className="mt-3 text-muted-foreground">
                Cadastre seus vencimentos, receba lembretes automáticos por e-mail e mantenha o controle de tudo em um só lugar
              </p>


              <div className="mt-12 flex flex-col gap-3 items-center">
                <Button
                  onClick={() => { setTab("signin"); setOpen(true); }}
                  className="w-full h-11 rounded-full border-2 border-accent-foreground/20 bg-accent text-accent-foreground text-base font-semibold hover:bg-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_-4px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
                >
                  <LogIn className="h-5 w-5" />
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setTab("signup"); setOpen(true); }}
                  className="w-full h-11 rounded-full border-2 border-border text-base font-medium hover:bg-muted"
                >
                  <UserPlus className="h-5 w-5" />
                  Criar Conta
                </Button>


              </div>
            </div>
          </div>


        </div>
      </section>



      <section style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }} className="mx-auto max-w-6xl px-4 pt-2 pb-8 grid md:grid-cols-3 gap-6">
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

      <footer className="border-t py-4 text-center text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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


