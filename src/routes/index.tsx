import "@fontsource/outfit/300.css";
import "@fontsource/outfit/700.css";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import illustration from "@/assets/login-illustration.png";
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
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#DCEBFB] via-[#BFDBFB] to-[#8EC2F5] flex items-center justify-center p-4 md:p-10">
      {/* Decorative blue shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 left-10 h-20 w-[35%] rounded-b-[30px] bg-gradient-to-b from-[#4FA8FF] to-[#1565D8] shadow-[0_10px_25px_-8px_rgba(21,101,216,0.55),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-6px_12px_-6px_rgba(0,0,0,0.25)]" />
        <div className="absolute -top-4 right-0 h-16 w-24 rounded-bl-[30px] bg-gradient-to-b from-[#4FA8FF] to-[#1565D8] shadow-[0_10px_25px_-8px_rgba(21,101,216,0.55),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-6px_12px_-6px_rgba(0,0,0,0.25)]" />
        <div className="absolute -bottom-6 left-0 h-14 w-44 rounded-tr-[30px] bg-gradient-to-t from-[#1565D8] to-[#4FA8FF] shadow-[0_-10px_25px_-8px_rgba(21,101,216,0.55),inset_0_-1px_0_rgba(255,255,255,0.35),inset_0_6px_12px_-6px_rgba(0,0,0,0.25)]" />
        <div className="absolute -bottom-10 right-10 h-20 w-[30%] rounded-t-[30px] bg-gradient-to-t from-[#1565D8] to-[#4FA8FF] shadow-[0_-10px_25px_-8px_rgba(21,101,216,0.55),inset_0_-1px_0_rgba(255,255,255,0.35),inset_0_6px_12px_-6px_rgba(0,0,0,0.25)]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_30px_60px_-20px_rgba(30,144,255,0.35),0_18px_36px_-18px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-12px_24px_-12px_rgba(21,101,216,0.35)]">
        {/* Left: form */}
        <div className="bg-gradient-to-b from-[#009DFF] to-[#0077FF] px-8 py-12 md:px-14 md:py-16 flex flex-col justify-center">
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="select-none text-white text-4xl md:text-5xl tracking-tighter flex items-baseline justify-center mb-8"
          >
            <span className="font-light opacity-90">Vence</span>
            <span className="font-bold">Hoje</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 opacity-80 animate-pulse" />
          </h1>
          <form onSubmit={onSubmit} className="space-y-5 max-w-sm w-full mx-auto">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-full bg-white px-6 text-center text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none shadow-sm"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-full bg-white px-6 pr-12 text-center text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none shadow-sm"
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

            <div className="flex items-center justify-between text-xs text-white px-2">
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


            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-[#2BC48A] hover:bg-[#25b07a] text-white font-semibold text-sm transition-colors disabled:opacity-70 shadow-md"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
              className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white text-white font-semibold text-sm transition-colors"
            >
              Criar conta
            </button>
          </form>
        </div>

        {/* Right: illustration */}
        <div className="bg-white flex flex-col items-center justify-center p-6 md:p-10">
          <p className="text-center text-[#0077FF] font-semibold text-lg md:text-xl mb-4 tracking-tight">
            Nunca mais esqueça seus vencimentos.
          </p>
          <img
            src={illustration}
            alt="Ilustração de login"
            width={1024}
            height={1024}
            className="w-full max-w-md h-auto object-contain"
            loading="eager"
            decoding="async"
          />
          <p className="text-center text-gray-500 text-sm mt-4">
            Receba lembretes antes das datas importantes.
          </p>
        </div>
      </div>
      <p className="relative text-center text-xs text-[#0B1E45]/70 mt-6 tracking-wide">
        © 2026 VenceHoje — Francisco Chagas
      </p>


      <AuthDialog open={authOpen} setOpen={setAuthOpen} tab={authTab} setTab={setAuthTab} />
    </div>
  );
}
