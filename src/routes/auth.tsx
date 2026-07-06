import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Você já pode entrar.");
  }

  async function forgotPassword() {
    if (!email) return toast.error("Digite seu e-mail para recuperar a senha.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setLoading(false); return toast.error("Erro ao entrar com Google"); }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[oklch(0.13_0.03_260)]">
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(140deg, oklch(0.22 0.09 155) 0%, oklch(0.16 0.06 160) 55%, oklch(0.12 0.04 165) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "oklch(0.60 0.18 155)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "oklch(0.50 0.15 165)" }}
        />
        <div className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-accent grid place-items-center">
            <Bell className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-bold text-lg">VenceHoje</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold">Sua vida financeira, organizada.</h2>
          <p className="mt-3 text-white/70 max-w-md">
            Cadastre suas contas uma vez e receba lembretes automáticos por e-mail antes de cada vencimento.
          </p>

          <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-5 max-w-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bell className="h-4 w-4 text-accent" /> Por que o VenceHoje?
            </div>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>• Lembretes por e-mail 3 dias antes, 1 dia antes ou no dia.</li>
              <li>• Recorrência mensal, semanal, anual ou personalizada.</li>
              <li>• Dashboard com tudo o que vence nos próximos dias.</li>
            </ul>
          </div>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} VenceHoje</p>
      </div>

      <div className="flex items-center justify-center p-6 bg-[oklch(0.13_0.03_260)]">
        <div className="w-full max-w-md space-y-4">
        <div className="rounded-2xl border border-[oklch(0.28_0.04_260)] bg-[oklch(0.20_0.04_260)] p-4 text-white">
          <div className="text-sm font-semibold">Bem-vindo 👋</div>
          <p className="mt-1 text-xs text-white/70">
            Entre com sua conta ou crie uma gratuita em menos de 1 minuto. Sem cartão de crédito.
          </p>
        </div>
        <Card className="w-full p-6 bg-[oklch(0.18_0.035_260)] border-[oklch(0.28_0.04_260)] text-white">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center">
              <Bell className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-bold">VenceHoje</span>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full bg-[oklch(0.22_0.04_260)]">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={signIn} className="space-y-3">
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Senha</Label>
                    <button
                      type="button"
                      onClick={forgotPassword}
                      className="text-xs text-accent hover:underline"
                      disabled={loading}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showSignIn}
                    toggle={() => setShowSignIn((s) => !s)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Entrar</Button>
              </form>
              <Divider />
              <Button variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white" onClick={googleSignIn} disabled={loading}>
                <GoogleIcon /> Continuar com Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={signUp} className="space-y-3">
                <div><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>E-mail</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div>
                  <Label>Senha</Label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showSignUp}
                    toggle={() => setShowSignUp((s) => !s)}
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>Criar conta grátis</Button>
              </form>
              <Divider />
              <Button variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white" onClick={googleSignIn} disabled={loading}>
                <GoogleIcon /> Cadastrar com Google
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  value, onChange, show, toggle, minLength,
}: { value: string; onChange: (v: string) => void; show: boolean; toggle: () => void; minLength?: number }) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
      <div className="relative flex justify-center text-xs uppercase"><span className="bg-[oklch(0.18_0.035_260)] px-2 text-white/50">ou</span></div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
}
