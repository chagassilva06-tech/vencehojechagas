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
      <div className="relative w-full max-w-6xl min-h-[720px] grid grid-cols-1 md:grid-cols-9 rounded-2xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_14px_36px_-20px_rgba(21,101,216,0.28),0_6px_16px_-12px_rgba(0,0,0,0.10)]">
        {/* Left: form — 5 cols */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#0A84E0] to-[#0066DD] px-8 py-10 md:px-16 md:py-12 flex flex-col justify-center">
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
          <p className="text-center text-white text-[15px] md:text-base mt-3 mb-8 max-w-sm mx-auto leading-relaxed font-medium">
            Lembretes simples para tudo que vence.
          </p>

          <form onSubmit={onSubmit} className="space-y-4 max-w-sm w-full mx-auto">
            {/* 3. Campos com labels */}
            <div className="space-y-1.5">
              <label className="block text-white text-xs font-semibold tracking-wide pl-1">E-mail</label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-xl bg-white px-5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/70 shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-white text-xs font-semibold tracking-wide pl-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white px-5 pr-12 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/70 shadow-sm"
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
            </div>

            {/* 4. Opções auxiliares */}
            <div className="flex items-center justify-between text-xs text-white px-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm accent-white"
                />
                <span className="font-medium">Manter conectado</span>
              </label>
              <button type="button" onClick={forgotPassword} className="hover:underline font-medium">
                Esqueceu a senha?
              </button>
            </div>

            {/* 5. Botão principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] rounded-xl bg-[#22B378] hover:bg-[#1E9F6A] active:bg-[#1a8a5c] text-white font-bold text-[15px] tracking-wide transition-colors disabled:opacity-70 shadow-[0_6px_14px_-6px_rgba(34,179,120,0.55)] inline-flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Carregando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
            {/* 6. Botão secundário */}
            <button
              type="button"
              onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
              className="w-full h-[46px] rounded-xl bg-transparent hover:bg-white/10 border border-white/50 text-white font-semibold text-sm transition-colors"
            >
              Criar minha conta
            </button>
          </form>

          {/* Selo de confiança simplificado */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/90">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-medium">Acesso seguro e dados protegidos</span>
          </div>

          <p className="text-center text-[11px] text-white/70 mt-4 tracking-wide">
            © 2026 VenceHoje — Francisco Chagas
          </p>
        </div>

        {/* Right: mockup — 4 cols, mais compacto */}
        <div className="md:col-span-4 relative bg-gradient-to-br from-[#F6F9FC] to-[#EEF3F9] flex flex-col items-center justify-center p-8 md:p-10 overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#0077FF]/5 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#22B378]/5 blur-3xl" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="text-center text-[#0A2540] font-bold text-lg md:text-xl tracking-tight">
              Nunca esqueça um vencimento.
            </p>
            <p className="text-center text-gray-600 text-xs md:text-sm mt-2 mb-5 max-w-xs leading-relaxed">
              Um painel simples para tudo que vence hoje, amanhã e no mês.
            </p>

            {/* Mockup — mais leve */}
            <div className="relative w-full max-w-sm rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_10px_28px_-16px_rgba(21,101,216,0.20)] p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-8 w-8 rounded-full bg-[#0077FF] grid place-items-center text-white text-xs font-bold">
                    F
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#22B378] ring-2 ring-white" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[12px] font-semibold text-[#0A2540]">Olá, Francisco</p>
                    <p className="text-[10px] text-gray-500 capitalize">
                      {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-semibold text-[#0077FF]">Hoje</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pb-4 border-b border-gray-100">
                <div className="rounded-xl bg-[#F4F9FF] p-2.5 ring-1 ring-[#0077FF]/10">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">A vencer</p>
                  <p className="text-lg font-extrabold text-[#0077FF] mt-0.5">R$ 1.240</p>
                </div>
                <div className="rounded-xl bg-[#F0FBF6] p-2.5 ring-1 ring-[#22B378]/15">
                  <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Pagos</p>
                  <p className="text-lg font-extrabold text-[#22B378] mt-0.5">R$ 3.980</p>
                </div>
              </div>

              <ul className="divide-y divide-gray-100">
                {[
                  { icon: BellRing, label: "Internet", when: "Vence hoje", tag: "R$ 129", bar: "bg-[#E85D5D]" },
                  { icon: CalendarCheck2, label: "Aluguel", when: "em 3 dias", tag: "R$ 1.100", bar: "bg-[#F5B841]" },
                  { icon: Sparkles, label: "Streaming", when: "em 7 dias", tag: "R$ 39", bar: "bg-[#22B378]" },
                ].map((r) => (
                  <li key={r.label} className="flex items-center gap-2.5 py-2.5">
                    <span className={`h-7 w-1 rounded-full ${r.bar}`} />
                    <div className="h-7 w-7 rounded-lg bg-[#F4F7FB] grid place-items-center">
                      <r.icon className="h-3.5 w-3.5 text-[#0077FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-[#0A2540] leading-tight">{r.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight">{r.when}</p>
                    </div>
                    <span className="text-[12px] font-bold text-[#0A2540]">{r.tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authOpen} setOpen={setAuthOpen} tab={authTab} setTab={setAuthTab} />
    </div>
  );
}


