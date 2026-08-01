import "@fontsource/outfit/300.css";
import "@fontsource/outfit/700.css";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ShieldCheck, BellRing, CalendarCheck2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import AuthDialog from "@/components/landing-auth-dialog";



export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem("vh_remember");
    return v === null ? true : v === "true";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signup");

  // Persist "manter conectado" e, quando desmarcado, encerra a sessão ao fechar a aba.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vh_remember", String(remember));
    if (remember) return;
    const onUnload = () => {
      try {
        void supabase.auth.signOut({ scope: "local" });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [remember]);

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) return toast.error("Digite um e-mail válido.");
    if (!password) return toast.error("Preencha sua senha.");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = /invalid|credentials/i.test(error.message)
        ? "E-mail ou senha inválidos."
        : error.message;
      return toast.error(msg);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vh_remember", String(remember));
    }
    toast.success(remember ? "Bem-vindo de volta!" : "Sessão ativa apenas nesta janela.");
    navigate({ to: "/dashboard" });
  }

  async function forgotPassword() {
    if (!validateEmail(email)) return toast.error("Digite um e-mail válido para recuperar a senha.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }


  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAF3FC] via-[#DDE9F7] to-[#C5D9EE] flex items-center justify-center p-4 md:p-8">
      {/* Decorative blue shapes — softened */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-16 -left-10 h-40 w-[38%] rounded-[40px] bg-gradient-to-b from-[#7FBEFF]/50 to-[#3F8FE0]/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-40 w-[32%] rounded-[40px] bg-gradient-to-t from-[#3F8FE0]/40 to-[#7FBEFF]/40 blur-3xl" />
      </div>

      {/* Card — form gets more weight (5/9 vs 4/9) */}
      <div className="relative w-full max-w-7xl min-h-[820px] grid grid-cols-1 md:grid-cols-9 rounded-[32px] overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
        {/* Left: form — 5 cols */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0D73F6] to-[#0057D8] px-8 py-10 md:px-16 md:py-12 flex flex-col justify-center">
          {/* 1. Logo */}
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="select-none text-white text-5xl md:text-[56px] tracking-tighter flex items-baseline justify-center mb-1"
          >
            <span className="font-light opacity-90">Vence</span>
            <span className="font-bold">Hoje</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 opacity-80 animate-pulse" />
          </h1>
          {/* 2. Frase de apoio */}
          <p className="text-center text-white/85 text-sm md:text-base mt-0 mb-10 max-w-sm mx-auto leading-relaxed font-medium">
            Lembretes inteligentes para tudo que vence.
          </p>

          <form onSubmit={onSubmit} className="space-y-4 max-w-sm w-full mx-auto">
            {/* 3. Campos com labels */}
            <div className="space-y-1.5">
              <label className="block text-white text-xs font-semibold tracking-wide pl-1">E-mail</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-white/50">📧</span>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[48px] rounded-lg bg-white/10 border border-white/20 px-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/50 shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-white text-xs font-semibold tracking-wide pl-1">Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-white/50">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[48px] rounded-lg bg-white/10 border border-white/20 px-12 pr-12 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/50 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 4. Opções auxiliares */}
            <div className="flex items-center justify-between text-xs text-white px-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded-[4px] accent-[#22B378]"
                />
                <span className="font-medium">Manter conectado</span>
              </label>
              <button type="button" onClick={forgotPassword} className="hover:underline hover:text-white/90 transition-all text-white/70 font-medium">
                Esqueceu Senha?
              </button>
            </div>

            {/* 5. Botão principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-lg bg-[#22B378] hover:bg-[#1E9F6A] text-white font-bold text-[15px] transition-all duration-300 disabled:opacity-70 shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Carregando...
                </>
              ) : (
                "ENTRAR"
              )}
            </button>
            {/* 6. Botão secundário */}
            <button
              type="button"
              onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
              className="w-full h-[48px] rounded-lg bg-transparent hover:bg-white/10 border border-white/30 text-white font-medium text-sm transition-colors"
            >
              Criar Conta
            </button>
          </form>

          {/* Rodapé — Bloco separado */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>🛡 Dados protegidos</span>
            </div>
            <p className="text-[11px] text-white/50 tracking-wide">
              © 2026 VenceHoje — By Francisco Chagas
            </p>
          </div>
        </div>

        {/* Right: mockup — 4 cols, mais compacto */}
        <div className="md:col-span-4 relative bg-gradient-to-br from-white via-[#F6F9FC] to-[#EEF3F9] flex flex-col items-center justify-center p-8 md:p-10 overflow-hidden">
          {/* Transição suave de azul para branco acontece via o gradiente da div pai + esse overlay */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0057D8]/5 to-transparent pointer-events-none" />
          
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#0077FF]/5 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#22B378]/5 blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-center text-[#0A2540] font-bold text-xl md:text-2xl tracking-tight mb-2">
              Nunca mais perca um pagamento.
            </p>
            <p className="text-center text-gray-500 text-xs md:text-sm mb-8 max-w-xs leading-relaxed">
              Um painel inteligente para tudo que vence hoje, amanhã e no mês.
            </p>

            {/* Mockup — animado */}
            <div className="relative w-full max-w-sm rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_30px_80px_rgba(0,0,0,0.08)] p-6 transition-transform duration-500 hover:scale-[1.02]">
              {/* Shine effect animation */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_3s_infinite]" />
              </div>

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full bg-[#0077FF] grid place-items-center text-white text-sm font-bold shadow-lg">
                    F
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22B378] ring-2 ring-white animate-pulse" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-[#0A2540]">Olá, Francisco</p>
                    <p className="text-[11px] text-gray-400 capitalize">
                      {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-bold text-[#0077FF] animate-bounce">Hoje</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-5 border-b border-gray-100">
                <div className="rounded-xl bg-[#F4F9FF] p-3 ring-1 ring-[#0077FF]/10 shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A vencer</p>
                  <p className="text-xl font-extrabold text-[#0077FF] mt-1">R$ 1.240</p>
                </div>
                <div className="rounded-xl bg-[#F0FBF6] p-3 ring-1 ring-[#22B378]/15 shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pagos</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-extrabold text-[#22B378] mt-1">R$ 3.980</p>
                    <Sparkles className="h-3 w-3 text-[#22B378] animate-pulse" />
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mt-4">
                {[
                  { icon: BellRing, label: "Internet", when: "Vence hoje", tag: "R$ 129", bar: "bg-[#E85D5D]", delay: "0ms" },
                  { icon: CalendarCheck2, label: "Aluguel", when: "em 3 dias", tag: "R$ 1.100", bar: "bg-[#F5B841]", delay: "100ms" },
                  { icon: Sparkles, label: "Streaming", when: "em 7 dias", tag: "R$ 39", bar: "bg-[#22B378]", delay: "200ms" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group cursor-default shadow-[0_4px_12px_rgba(0,0,0,0.03)]" style={{ animationDelay: r.delay }}>
                    <div className="relative">
                       <span className={`h-8 w-1.5 rounded-full ${r.bar} block`} />
                       {r.label === "Internet" && <div className="absolute -left-1 top-0 h-8 w-3 bg-red-400/20 blur-sm rounded-full animate-pulse" />}
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-[#F4F7FB] grid place-items-center group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                      <r.icon className="h-4 w-4 text-[#0077FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#0A2540] leading-tight">{r.label}</p>
                      <p className="text-[11px] text-gray-400 leading-tight">{r.when}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#0A2540]">{r.tag}</span>
                      {r.label === "Streaming" && <div className="h-4 w-4 rounded-full bg-[#22B378] text-white flex items-center justify-center text-[10px] animate-in zoom-in duration-500 delay-700">✓</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefícios e Credibilidade */}
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-3 w-full max-w-sm px-2">
               <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                 <span className="text-[#22B378]">✓</span> Lembretes automáticos
               </div>
               <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                 <span className="text-[#22B378]">✓</span> WhatsApp
               </div>
               <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                 <span className="text-[#22B378]">✓</span> E-mail
               </div>
               <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                 <span className="text-[#22B378]">✓</span> Agenda integrada
               </div>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} setOpen={setOpen} tab={authTab} setTab={setAuthTab} />
    </div>
  );
}


