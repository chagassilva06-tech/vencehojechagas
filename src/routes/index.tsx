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
        <div className="bg-white flex flex-col items-center justify-center p-6 md:p-10">
          <p className="text-center text-[#0077FF] font-semibold text-lg md:text-xl tracking-tight">
            Nunca mais esqueça seus vencimentos.
          </p>
          <p className="text-center text-gray-500 text-sm mt-1 mb-5 max-w-sm">
            Um painel simples para controlar tudo o que vence hoje, amanhã e no mês.
          </p>

          {/* Mockup do sistema */}
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-br from-white via-[#F5FAFF] to-[#DCEBFB] ring-1 ring-black/5 shadow-[0_18px_40px_-18px_rgba(21,101,216,0.4),0_6px_14px_-8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-6px_14px_-8px_rgba(21,101,216,0.25)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#009DFF] to-[#0077FF]" />
                <span className="text-xs font-semibold text-gray-700">Meu painel</span>
              </div>
              <span className="text-[10px] text-gray-500">Hoje</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded-lg bg-gradient-to-b from-white to-[#F1F7FF] p-2.5 ring-1 ring-black/5 shadow-[0_4px_10px_-4px_rgba(21,101,216,0.25),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_-2px_rgba(21,101,216,0.15)]">
                <p className="text-[10px] text-gray-500">A vencer</p>
                <p className="text-base font-bold text-[#0077FF]">R$ 1.240</p>
              </div>
              <div className="rounded-lg bg-gradient-to-b from-white to-[#F1F7FF] p-2.5 ring-1 ring-black/5 shadow-[0_4px_10px_-4px_rgba(21,101,216,0.25),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_-2px_rgba(21,101,216,0.15)]">
                <p className="text-[10px] text-gray-500">Pagos no mês</p>
                <p className="text-base font-bold text-[#2BC48A]">R$ 3.980</p>
              </div>
            </div>

            <ul className="space-y-2">
              {[
                { icon: BellRing, label: "Internet — Vence hoje", tag: "R$ 129", color: "text-[#E85D5D]" },
                { icon: CalendarCheck2, label: "Aluguel — em 3 dias", tag: "R$ 1.100", color: "text-gray-700" },
                { icon: Sparkles, label: "Streaming — em 7 dias", tag: "R$ 39", color: "text-gray-700" },
              ].map((r) => (
                <li
                  key={r.label}
                  className="flex items-center justify-between rounded-lg bg-gradient-to-b from-white to-[#F4F9FF] px-3 py-2 ring-1 ring-black/5 shadow-[0_4px_10px_-4px_rgba(21,101,216,0.25),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-2px_4px_-2px_rgba(21,101,216,0.15)]"
                >
                  <span className="flex items-center gap-2 text-[11px] text-gray-700">
                    <r.icon className="h-3.5 w-3.5 text-[#0077FF]" />
                    {r.label}
                  </span>
                  <span className={`text-[11px] font-semibold ${r.color}`}>{r.tag}</span>
                </li>
              ))}
            </ul>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 w-full max-w-sm text-center">
            <div className="rounded-xl bg-[#F5FAFF] ring-1 ring-black/5 p-2">
              <BellRing className="h-4 w-4 text-[#0077FF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 leading-tight">Lembretes automáticos</p>
            </div>
            <div className="rounded-xl bg-[#F5FAFF] ring-1 ring-black/5 p-2">
              <CalendarCheck2 className="h-4 w-4 text-[#0077FF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 leading-tight">Calendário integrado</p>
            </div>
            <div className="rounded-xl bg-[#F5FAFF] ring-1 ring-black/5 p-2">
              <ShieldCheck className="h-4 w-4 text-[#0077FF] mx-auto mb-1" />
              <p className="text-[10px] text-gray-600 leading-tight">Dados protegidos</p>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} setOpen={setAuthOpen} tab={authTab} setTab={setAuthTab} />
    </div>
  );
}

