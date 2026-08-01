import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export default function AuthDialog({
  open, setOpen, tab, setTab,
}: { open: boolean; setOpen: (v: boolean) => void; tab: "signin" | "signup"; setTab: (v: "signin" | "signup") => void }) {
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
    toast.success(`Conta criada! Enviamos um e-mail para ${email} para confirmar seu acesso.`, { duration: 8000 });
  }

  async function forgotPassword() {
    if (!email) return toast.error("Digite seu e-mail para recuperar a senha.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.08)] border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#0A2540]">VenceHoje</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">Entre na sua conta ou crie uma gratuita.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 ml-1">E-mail</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">📧</span>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-[48px] rounded-lg border-gray-200 pl-11 focus:ring-1 focus:ring-[#0077FF]" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-500 ml-1">Senha</Label>
                  <button type="button" onClick={forgotPassword} className="text-xs text-[#0077FF] hover:underline" disabled={loading}>
                    Esqueceu Senha?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">🔒</span>
                  <PasswordInput value={password} onChange={setPassword} show={showSignIn} toggle={() => setShowSignIn((s) => !s)} />
                </div>
              </div>
              <Button type="submit" className="w-full h-[48px] rounded-lg bg-[#22B378] hover:bg-[#1E9F6A] text-white font-bold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5" disabled={loading}>
                {loading ? "Carregando..." : "ENTRAR"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={signUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 ml-1">Nome</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">👤</span>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} className="h-[48px] rounded-lg border-gray-200 pl-11 focus:ring-1 focus:ring-[#0077FF]" placeholder="Seu nome" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 ml-1">E-mail</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">📧</span>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-[48px] rounded-lg border-gray-200 pl-11 focus:ring-1 focus:ring-[#0077FF]" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-500 ml-1">Senha</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">🔒</span>
                  <PasswordInput value={password} onChange={setPassword} show={showSignUp} toggle={() => setShowSignUp((s) => !s)} minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full h-[48px] rounded-lg bg-[#0077FF] hover:bg-[#0066DD] text-white font-bold transition-all shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5" disabled={loading}>
                {loading ? "Criando conta..." : "CRIAR CONTA"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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
