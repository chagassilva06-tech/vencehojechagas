
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  avisos_padrao INT[] NOT NULL DEFAULT ARRAY[1,0],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT 'Tag',
  cor TEXT NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_own" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_categories_user ON public.categories(user_id);

-- Recurrence type
CREATE TYPE public.recurrence_type AS ENUM ('none','daily','weekly','monthly','yearly','custom');
CREATE TYPE public.reminder_status AS ENUM ('pending','paid','archived');

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  valor NUMERIC(12,2),
  observacoes TEXT,
  data_vencimento DATE NOT NULL,
  recorrencia public.recurrence_type NOT NULL DEFAULT 'none',
  intervalo_dias INT,
  avisos INT[] NOT NULL DEFAULT ARRAY[1,0],
  status public.reminder_status NOT NULL DEFAULT 'pending',
  anexo_url TEXT,
  anexo_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_own" ON public.reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_reminders_user_venc ON public.reminders(user_id, data_vencimento);
CREATE INDEX idx_reminders_status ON public.reminders(user_id, status);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_pago NUMERIC(12,2),
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own" ON public.payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);

-- Notifications log (dedupe)
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  dias_antes INT NOT NULL,
  data_alvo DATE NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, tipo, data_alvo, dias_antes)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications_log TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications_log FOR SELECT USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();
CREATE TRIGGER trg_reminders_updated BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.tg_updated_at();

-- Seed on signup: profile + 11 default categories
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), NEW.email)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.categories (user_id, nome, icone, cor) VALUES
    (NEW.id,'Cartões','CreditCard','#8B5CF6'),
    (NEW.id,'Aluguel','Home','#F59E0B'),
    (NEW.id,'Energia','Zap','#EAB308'),
    (NEW.id,'Água','Droplet','#0EA5E9'),
    (NEW.id,'Internet','Wifi','#3B82F6'),
    (NEW.id,'IPVA','Car','#EF4444'),
    (NEW.id,'Impostos','Receipt','#6B7280'),
    (NEW.id,'Celular','Smartphone','#14B8A6'),
    (NEW.id,'Saúde','Heart','#EC4899'),
    (NEW.id,'Estudos','BookOpen','#6366F1'),
    (NEW.id,'Outros','Tag','#64748B');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Advance recurrence when marking as paid
CREATE OR REPLACE FUNCTION public.advance_recurrence() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; nova_data DATE;
BEGIN
  SELECT * INTO r FROM public.reminders WHERE id = NEW.reminder_id;
  IF r.recorrencia = 'none' THEN RETURN NEW; END IF;
  nova_data := CASE r.recorrencia
    WHEN 'daily' THEN r.data_vencimento + INTERVAL '1 day'
    WHEN 'weekly' THEN r.data_vencimento + INTERVAL '1 week'
    WHEN 'monthly' THEN r.data_vencimento + INTERVAL '1 month'
    WHEN 'yearly' THEN r.data_vencimento + INTERVAL '1 year'
    WHEN 'custom' THEN r.data_vencimento + make_interval(days => COALESCE(r.intervalo_dias,30))
  END;
  INSERT INTO public.reminders (user_id, categoria_id, titulo, valor, observacoes, data_vencimento, recorrencia, intervalo_dias, avisos, status)
  VALUES (r.user_id, r.categoria_id, r.titulo, r.valor, r.observacoes, nova_data, r.recorrencia, r.intervalo_dias, r.avisos, 'pending');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_advance_recurrence AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.advance_recurrence();
