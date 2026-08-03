import "@fontsource/outfit/300.css";
import "@fontsource/outfit/700.css";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, ShieldCheck, BellRing, CalendarCheck2, Sparkles, Calendar, Bell, FileText, Cloud, Check, RefreshCw, Smartphone, BarChart3, Shield } from "lucide-react";
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
      <div className="relative w-full max-w-7xl min-h-[820px] grid grid-cols-1 md:grid-cols-9 rounded-[32px] overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_18px_45px_rgba(0,0,0,0.06)] group transition-all duration-700">
        
        {/* Left: form — 5 cols */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0D73F6] via-[#0057D8] to-[#0047B8] px-8 py-10 md:px-16 md:py-12 flex flex-col justify-center relative overflow-hidden">
          {/* Depth elements for blue side */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute top-1/2 -right-12 w-32 h-32 rounded-full bg-black/5 blur-2xl" />
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
          </div>

          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Logo */}
            <div className="flex flex-col items-center mb-6">
              <h1
                style={{ fontFamily: "'Outfit', sans-serif" }}
                className="select-none text-white text-6xl md:text-[82px] tracking-tighter flex items-baseline justify-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
              >
                <span className="font-light opacity-100">Vence</span>
                <span className="font-bold">Hoje</span>
                <span className="w-2 h-2 rounded-full bg-[#22B378] ml-1 shadow-[0_0_10px_rgba(34,179,120,0.8)]" />
              </h1>
              {/* 2. Frase de apoio */}
              <p className="text-center text-white/95 text-base md:text-lg mt-0.5 max-w-sm mx-auto leading-relaxed font-medium italic drop-shadow-md">
                Organize suas contas, evite atrasos e tenha tranquilidade todos os meses.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 max-w-sm w-full mx-auto">
              {/* 3. Campos com labels */}
              <div className="space-y-1.5 group/input">
                <label className="block text-white/70 text-[11px] font-semibold tracking-wider uppercase pl-1">E-mail</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-white/50 text-sm transition-transform group-focus-within/input:scale-110">📧</span>
                  <input
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[48px] rounded-xl bg-white/10 border border-white/20 px-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                  />
                </div>
              </div>
              <div className="space-y-1.5 group/input">
                <label className="block text-white/70 text-[11px] font-semibold tracking-wider uppercase pl-1">Senha</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-white/50 text-sm transition-transform group-focus-within/input:scale-110">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[48px] rounded-xl bg-white/10 border border-white/20 px-12 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5 animate-in fade-in zoom-in duration-200" />
                    ) : (
                      <Eye className="h-4.5 w-4.5 animate-in fade-in zoom-in duration-200" />
                    )}
                  </button>
                </div>
              </div>

              {/* 4. Opções auxiliares */}
              <div className="flex items-center justify-between px-1 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group/check">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 rounded-md border-2 border-white/30 bg-white/5 transition-all peer-checked:bg-[#22B378] peer-checked:border-[#22B378] group-hover/check:border-white/50 shadow-sm" />
                    <svg
                      className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm font-medium select-none">Manter conectado</span>
                </label>
                <button 
                  type="button" 
                  onClick={forgotPassword} 
                  className="text-[#93C5FD] hover:text-white text-sm font-medium transition-all hover:underline underline-offset-4 decoration-white/30"
                >
                  Esqueceu Senha?
                </button>
              </div>

              {/* 5. Botões */}
              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] rounded-xl bg-[#22B378] hover:bg-[#1E9F6A] text-white font-bold text-base transition-all duration-300 disabled:opacity-70 shadow-[0_8px_20px_rgba(34,179,120,0.25)] hover:shadow-[0_12px_28px_rgba(34,179,120,0.35)] active:scale-[0.98] active:translate-y-0 hover:-translate-y-1 inline-flex items-center justify-center gap-2 group/btn"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <>
                      <span>ENTRAR</span>
                      <Sparkles className="h-4 w-4 opacity-0 group-hover/btn:opacity-100 transition-opacity animate-pulse" />
                    </>
                  )}
                </button>
                
                <div className="text-center">
                  <span className="text-white/50 text-xs">Ainda não possui conta?</span>
                  <button
                    type="button"
                    onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
                    className="ml-2 text-white font-semibold text-xs hover:underline decoration-white/40 underline-offset-4 transition-all"
                  >
                    Criar conta agora
                  </button>
                </div>
              </div>
            </form>

            {/* Rodapé Credibilidade */}
            <div className="mt-14 pt-8 border-t border-white/10 flex flex-col items-center gap-5">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium uppercase tracking-widest">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#22B378]" />
                  <span>Dados Criptografados</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium uppercase tracking-widest">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#22B378] animate-pulse" />
                  <span>Sistemas Ativos</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-[10px] text-white/30 font-medium tracking-wide">
                <span>© 2026 VenceHoje</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <button className="hover:text-white/60 transition-colors">Política</button>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <button className="hover:text-white/60 transition-colors">Termos</button>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-white/40">By Francisco Chagas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: mockup — 4 cols, expanded focus */}
        <div className="md:col-span-4 relative bg-white flex flex-col items-center justify-center p-8 md:p-12 overflow-hidden">
          {/* Enhanced Elegant Transition */}
          <div aria-hidden className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black/5 via-black/[0.01] to-transparent pointer-events-none z-20" />
          <div aria-hidden className="absolute inset-y-0 left-0 w-px bg-gray-100 z-30" />
          
          {/* Right side background elements (Premium background) */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* Soft halos and gradients */}
            <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-[#E0E7FF]/40 blur-[120px] animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-[#DBEAFE]/30 blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>

          <div className="relative z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            <div className="mb-12 text-center">
              <h2 className="text-[#0A2540] font-black text-5xl md:text-6xl tracking-tight mb-4">
                Controle de Gastos
              </h2>
              <p className="text-gray-500 text-lg max-w-sm mx-auto leading-relaxed font-medium">
                Seus dados permanecem protegidos enquanto você organiza seus compromissos financeiros.
              </p>
            </div>

            {/* Illustration Area */}
            <div className="relative w-full aspect-square max-w-sm flex items-center justify-center mb-12">
              {/* Floating elements */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Calendário */}
                <div className="absolute top-[10%] left-[10%] p-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 animate-[float_8s_ease-in-out_infinite]">
                  <Calendar className="w-6 h-6 text-[#2563EB]" />
                </div>
                {/* Sino */}
                <div className="absolute top-[5%] right-[15%] p-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 animate-[float_7s_ease-in-out_infinite_1s]">
                  <Bell className="w-6 h-6 text-[#2563EB]" />
                </div>
                {/* Documento */}
                <div className="absolute bottom-[20%] left-[5%] p-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 animate-[float_9s_ease-in-out_infinite_0.5s]">
                  <FileText className="w-6 h-6 text-[#2563EB]" />
                </div>
                {/* Nuvem */}
                <div className="absolute bottom-[10%] right-[10%] p-3 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 animate-[float_10s_ease-in-out_infinite_2s]">
                  <Cloud className="w-6 h-6 text-[#2563EB]" />
                </div>
                {/* Check */}
                <div className="absolute top-[40%] -left-[5%] p-2 rounded-xl bg-white shadow-lg ring-1 ring-black/5 animate-[float_6s_ease-in-out_infinite_3s]">
                  <Check className="w-5 h-5 text-[#22C55E]" />
                </div>
                {/* Smartphone */}
                <div className="absolute top-[50%] -right-[5%] p-2 rounded-xl bg-white shadow-lg ring-1 ring-black/5 animate-[float_11s_ease-in-out_infinite_1.5s]">
                  <Smartphone className="w-5 h-5 text-[#2563EB]" />
                </div>
                {/* Sincronização */}
                <div className="absolute -bottom-[5%] left-1/3 p-2 rounded-xl bg-white shadow-lg ring-1 ring-black/5 animate-[float_8s_ease-in-out_infinite_4s]">
                  <RefreshCw className="w-5 h-5 text-[#2563EB]" />
                </div>
                {/* Gráfico Abstrato */}
                <div className="absolute top-[25%] right-[0%] p-2 rounded-xl bg-white shadow-lg ring-1 ring-black/5 animate-[float_12s_ease-in-out_infinite_0.2s]">
                  <BarChart3 className="w-5 h-5 text-[#60A5FA]" />
                </div>
              </div>

              {/* Central Shield with Glassmorphism */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] animate-pulse" />
                <div className="relative w-48 h-56 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-2xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-700">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#2563EB]/10 via-transparent to-[#60A5FA]/10" />
                  <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-[35deg] animate-[shimmer_6s_infinite] pointer-events-none" />
                  <Shield className="w-24 h-24 text-[#2563EB] relative z-10 drop-shadow-xl" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Lock className="w-8 h-8 text-white mt-2" />
                  </div>
                </div>

                {/* Orbiting circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-[#2563EB]/10 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2563EB] rounded-full blur-[2px]" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[#60A5FA]/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#60A5FA] rounded-full blur-[1px]" />
                </div>
              </div>
            </div>

            {/* Institutional Benefits */}
            <div className="w-full max-w-md grid grid-cols-2 gap-y-6 gap-x-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#EAF3FF] flex items-center justify-center text-xl transition-transform group-hover:scale-110">🔒</div>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 uppercase tracking-widest leading-tight">Privacidade Garantida</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#EAF3FF] flex items-center justify-center text-xl transition-transform group-hover:scale-110">🛡️</div>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 uppercase tracking-widest leading-tight">Criptografia de Dados</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#EAF3FF] flex items-center justify-center text-xl transition-transform group-hover:scale-110">☁️</div>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 uppercase tracking-widest leading-tight">Sincronização Segura</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-[#EAF3FF] flex items-center justify-center text-xl transition-transform group-hover:scale-110">📅</div>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 uppercase tracking-widest leading-tight">Organização Inteligente</span>
              </div>
            </div>
          </div>
        </div>

        <AuthDialog 
          open={authOpen} 
          onOpenChange={setAuthOpen} 
          defaultTab={authTab} 
        />
      </div>
    </div>
  );
}



