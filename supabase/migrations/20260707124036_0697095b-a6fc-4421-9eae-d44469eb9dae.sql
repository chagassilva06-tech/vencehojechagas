
CREATE TABLE public.whatsapp_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  whatsapp_numero TEXT NOT NULL,
  permissao TEXT NOT NULL DEFAULT 'nao_autorizado' CHECK (permissao IN ('autorizado','nao_autorizado')),
  aceite_em TIMESTAMPTZ,
  origem_aceite TEXT NOT NULL DEFAULT 'configuracoes',
  texto_autorizacao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','cancelado')),
  cancelado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_consents TO authenticated;
GRANT ALL ON public.whatsapp_consents TO service_role;

ALTER TABLE public.whatsapp_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_consents_own" ON public.whatsapp_consents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_whatsapp_consents_user ON public.whatsapp_consents(user_id);

CREATE TRIGGER trg_whatsapp_consents_updated_at
  BEFORE UPDATE ON public.whatsapp_consents
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
