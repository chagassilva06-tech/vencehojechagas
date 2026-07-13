
CREATE OR REPLACE FUNCTION public.advance_recurrence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r RECORD; nova_data DATE;
BEGIN
  SELECT * INTO r FROM public.reminders WHERE id = NEW.reminder_id;
  IF r.recorrencia = 'none' THEN RETURN NEW; END IF;
  -- Skip custom recurrence with invalid/zero interval to avoid duplicate same-date reminders
  IF r.recorrencia = 'custom' AND COALESCE(r.intervalo_dias, 0) <= 0 THEN
    RETURN NEW;
  END IF;
  nova_data := CASE r.recorrencia
    WHEN 'daily' THEN r.data_vencimento + INTERVAL '1 day'
    WHEN 'weekly' THEN r.data_vencimento + INTERVAL '1 week'
    WHEN 'monthly' THEN r.data_vencimento + INTERVAL '1 month'
    WHEN 'yearly' THEN r.data_vencimento + INTERVAL '1 year'
    WHEN 'custom' THEN r.data_vencimento + make_interval(days => r.intervalo_dias)
  END;
  -- Extra guard: do not insert a duplicate at same date
  IF nova_data IS NULL OR nova_data = r.data_vencimento THEN
    RETURN NEW;
  END IF;
  -- Avoid inserting if an equivalent pending reminder already exists on that date
  IF EXISTS (
    SELECT 1 FROM public.reminders
    WHERE user_id = r.user_id
      AND titulo = r.titulo
      AND data_vencimento = nova_data
      AND status = 'pending'
  ) THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.reminders (user_id, categoria_id, titulo, valor, observacoes, data_vencimento, recorrencia, intervalo_dias, avisos, status)
  VALUES (r.user_id, r.categoria_id, r.titulo, r.valor, r.observacoes, nova_data, r.recorrencia, r.intervalo_dias, r.avisos, 'pending');
  RETURN NEW;
END; $function$;

DELETE FROM public.reminders WHERE id = '1b3d0eaa-cb9e-4e82-9810-903a0062e5be';
