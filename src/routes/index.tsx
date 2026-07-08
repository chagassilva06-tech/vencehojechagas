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


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function forgotPassword() {
    if (!email) return toast.error("Digite seu e-mail para recuperar a senha.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#EAF2FB] flex items-center justify-center p-4 md:p-10">
      {/* Decorative blue shapes */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-10 h-40 w-[55%] rounded-b-[40px] bg-[#1E90FF]" />
        <div className="absolute -top-6 right-0 h-32 w-40 rounded-bl-[40px] bg-[#1E90FF]" />
        <div className="absolute -bottom-10 left-0 h-24 w-72 rounded-tr-[40px] bg-[#1E90FF]" />
        <div className="absolute -bottom-16 right-10 h-40 w-[45%] rounded-t-[40px] bg-[#1E90FF]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-lg overflow-hidden shadow-2xl bg-white">
        {/* Left: form */}
        <div className="bg-gradient-to-b from-[#2FA3FF] to-[#1976FF] px-8 py-12 md:px-14 md:py-16 flex flex-col justify-center">
          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="select-none text-white text-5xl md:text-6xl tracking-tighter flex items-baseline justify-center mb-10"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 rounded-full bg-white px-6 pr-12 text-center text-sm text-gray-700 tracking-widest placeholder:text-gray-400 focus:outline-none shadow-sm"
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
                <span>Lembrar senha</span>
              </label>
              <button type="button" onClick={forgotPassword} className="hover:underline">
                Esqueceu Senha?
              </button>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-[#2BC48A] hover:bg-[#25b07a] text-white font-semibold tracking-[0.3em] text-sm transition-colors disabled:opacity-70 shadow-md"
            >
              ENTRAR
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab("signup"); setAuthOpen(true); }}
              className="w-full h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/60 text-white font-semibold tracking-[0.3em] text-sm transition-colors"
            >
              CRIAR CONTA
            </button>
          </form>
        </div>

        {/* Right: illustration */}
        <div className="bg-white flex items-center justify-center p-6 md:p-10">
          <img
            src={illustration}
            alt="Ilustração de login"
            width={1024}
            height={1024}
            className="w-full max-w-md h-auto object-contain"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
