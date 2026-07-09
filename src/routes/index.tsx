import "@fontsource/outfit/300.css";
import "@fontsource/outfit/700.css";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signup");


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
    toast.success("Bem-vindo de volta!");
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAF3FC] via-[#D2E6FA] to-[#B7D5F3] flex items-center justify-center p-4 md:p-10">
      {/* Decorative blue shapes — softened */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-16 -left-10 h-40 w-[38%] rounded-[40px] bg-gradient-to-b from-[#7FBEFF]/70 to-[#3F8FE0]/60 blur-2xl" />
        <div className="absolute -top-12 -right-8 h-28 w-40 rounded-[40px] bg-gradient-to-b from-[#7FBEFF]/60 to-[#3F8FE0]/50 blur-2xl" />
        <div className="absolute -bottom-16 -left-8 h-32 w-56 rounded-[40px] bg-gradient-to-t from-[#3F8FE0]/60 to-[#7FBEFF]/50 blur-2xl" />
        <div className="absolute -bottom-20 -right-10 h-40 w-[32%] rounded-[40px] bg-gradient-to-t from-[#3F8FE0]/60 to-[#7FBEFF]/50 blur-2xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-7xl min-h-[820px] grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_20px_50px_-24px_rgba(21,101,216,0.35),0_10px_24px_-16px_rgba(0,0,0,0.15)]">
        {/* Left: form */}
        <div className="bg-gradient-to-b from-[#009DFF] to-[#0077FF] px-8 py-12 md:px-14 md:py-14 flex flex-col justify-center">
          {/* 1. Logo */}
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="select-none text-white text-4xl md:text-5xl tracking-tighter flex items-baseline justify-center"
          >
            <span className="font-light opacity-90">Vence</span>
            <span className="font-bold">Hoje</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 opacity-80 animate-pulse" />
          </h1>
          {/* 2. Frase de apoio */}
          <p className="text-center text-white/90 text-sm md:text-[15px] mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
            Organize contas, assinaturas e compromissos em um só lugar.
          </p>

          <form onSubmit={onSubmit} className="space-y-4 max-w-sm w-full mx-auto">
            {/* 3. Campos */}
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl bg-white px-5 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-xl bg-white px-5 pr-12 text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* 4. Opções auxiliares */}
            <div className="flex items-center justify-between text-xs text-white px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm accent-white"
                />
                <span>Manter conectado</span>
              </label>
              <button type="button" onClick={forgotPassword} className="hover:underline">
                Esqueceu a senha?
              </button>
            </div>

            {/* 5. Botão principal — mais destaque */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#2BC48A] hover:bg-[#25b07a] text-white font-bold text-base tracking-wide transition-all disabled:opacity-70 shadow-[0_10px_20px_-8px_rgba(43,196,138,0.55)] ring-1 ring-white/20"
            >
              Entrar
            </button>
            {/* 6. Botão secundário — menos peso */}
            <button
              type="button"
              onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
              className="w-full h-11 rounded-xl bg-transparent hover:bg-white/10 border border-white/40 text-white/90 font-medium text-sm transition-colors"
            >
              Criar minha conta
            </button>
          </form>

          {/* Selos de confiança */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Acesso seguro
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Seus dados são protegidos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-2 py-0.5">
              Ambiente seguro
            </span>
          </div>

          <p className="text-center text-[11px] text-white/75 mt-5 tracking-wide">
            © 2026 VenceHoje — Francisco Chagas
          </p>
        </div>

        {/* Right: mockup / value props */}
        <div className="relative bg-gradient-to-br from-[#F6F9FC] via-[#F4F7FB] to-[#EEF3F9] flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
          {/* Formas decorativas discretas */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#0077FF]/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#2BC48A]/5 blur-3xl" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-center text-[#0A2540] font-bold text-xl md:text-2xl tracking-tight">
              Nunca mais esqueça seus vencimentos.
            </p>
            <p className="text-center text-gray-600 text-[13px] md:text-sm mt-2 mb-6 max-w-sm leading-relaxed">
              Um painel simples para controlar tudo o que vence hoje, amanhã e no mês.
            </p>

            {/* Mockup do sistema */}
            <div className="relative w-full max-w-md rounded-2xl bg-white ring-1 ring-[#0077FF]/10 shadow-[0_24px_50px_-20px_rgba(21,101,216,0.28),0_8px_20px_-10px_rgba(15,23,42,0.12)] p-6">
              {/* Cabeçalho — com autorelevo */}
              <div className="flex items-center justify-between p-3 -mx-2 mb-4 rounded-xl bg-gradient-to-b from-white to-[#F4F9FF] ring-1 ring-[#0077FF]/10 shadow-[0_6px_14px_-8px_rgba(21,101,216,0.3),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_-2px_rgba(21,101,216,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-[#009DFF] to-[#0077FF] grid place-items-center text-white text-xs font-bold shadow-[0_4px_10px_-2px_rgba(0,119,255,0.5)]">
                    F
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#2BC48A] ring-2 ring-white" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[13px] font-semibold text-[#0A2540]">Olá, Francisco</p>
                    <p className="text-[11px] text-gray-500 capitalize">
                      {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[#F4F7FB] p-0.5 ring-1 ring-black/5">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0077FF] shadow-sm">Hoje</span>
                  <span className="px-2 py-0.5 text-[10px] text-gray-500">Semana</span>
                  <span className="px-2 py-0.5 text-[10px] text-gray-500">Mês</span>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3 py-5 border-b border-gray-100">
                <div className="rounded-xl bg-gradient-to-br from-[#EAF3FF] to-[#F6FAFF] p-3 ring-1 ring-[#0077FF]/10 shadow-[0_6px_14px_-8px_rgba(0,119,255,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">A vencer</p>
                  <p className="text-2xl font-extrabold text-[#0077FF] mt-1 tracking-tight">R$ 1.240</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">3 contas nesta semana</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[#E7F8F0] to-[#F5FCF8] p-3 ring-1 ring-[#2BC48A]/15 shadow-[0_6px_14px_-8px_rgba(43,196,138,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Pagos no mês</p>
                  <p className="text-2xl font-extrabold text-[#2BC48A] mt-1 tracking-tight">R$ 3.980</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">12 contas quitadas</p>
                </div>
              </div>

              {/* Lista */}
              <ul className="divide-y divide-gray-100">
                {[
                  { icon: BellRing, label: "Internet", when: "Vence hoje", tag: "R$ 129", bar: "bg-[#E85D5D]", badge: "bg-[#FDECEC] text-[#E85D5D]", badgeText: "Hoje" },
                  { icon: CalendarCheck2, label: "Aluguel", when: "em 3 dias", tag: "R$ 1.100", bar: "bg-[#F5B841]", badge: "bg-[#FDF5E4] text-[#B8830B]", badgeText: "Em breve" },
                  { icon: Sparkles, label: "Streaming", when: "em 7 dias", tag: "R$ 39", bar: "bg-[#2BC48A]", badge: "bg-[#E7F8F0] text-[#1E9B6B]", badgeText: "Sob controle" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center gap-3 py-3">
                    <span className={`h-8 w-1 rounded-full ${r.bar}`} />
                    <div className="h-8 w-8 rounded-lg bg-[#F4F7FB] grid place-items-center ring-1 ring-black/5">
                      <r.icon className="h-4 w-4 text-[#0077FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0A2540] leading-tight">{r.label}</p>
                      <p className="text-[11px] text-gray-500 leading-tight">{r.when}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[13px] font-bold text-[#0A2540]">{r.tag}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.badge}`}>{r.badgeText}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cards de benefício */}
            <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-md text-center">
              <div className="rounded-xl bg-white ring-1 ring-black/5 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] p-3">
                <BellRing className="h-5 w-5 text-[#0077FF] mx-auto mb-1.5" />
                <p className="text-[11px] font-medium text-gray-700 leading-tight">Lembretes automáticos</p>
              </div>
              <div className="rounded-xl bg-white ring-1 ring-black/5 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] p-3">
                <CalendarCheck2 className="h-5 w-5 text-[#0077FF] mx-auto mb-1.5" />
                <p className="text-[11px] font-medium text-gray-700 leading-tight">Calendário integrado</p>
              </div>
              <div className="rounded-xl bg-white ring-1 ring-black/5 shadow-[0_4px_12px_-6px_rgba(15,23,42,0.12)] p-3">
                <ShieldCheck className="h-5 w-5 text-[#0077FF] mx-auto mb-1.5" />
                <p className="text-[11px] font-medium text-gray-700 leading-tight">Dados protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} setOpen={setAuthOpen} tab={authTab} setTab={setAuthTab} />
    </div>
  );
}

