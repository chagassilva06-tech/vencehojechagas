import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function normalizarNumeroBR(numero: string): string {
  const somenteDigitos = numero.replace(/\D/g, "");
  // Se já vier com código do país, mantém; caso contrário assume BR (+55).
  if (somenteDigitos.startsWith("55") && somenteDigitos.length >= 12) {
    return `+${somenteDigitos}`;
  }
  if (somenteDigitos.length >= 10 && somenteDigitos.length <= 11) {
    return `+55${somenteDigitos}`;
  }
  return `+${somenteDigitos}`;
}

export const enviarWhatsappTeste = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1) Verificar consentimento ativo e autorizado
    const { data: consent, error: consentErr } = await supabase
      .from("whatsapp_consents")
      .select("id, nome, whatsapp_numero, permissao, status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (consentErr) throw new Error(consentErr.message);
    if (
      !consent ||
      consent.status !== "ativo" ||
      consent.permissao !== "autorizado" ||
      !consent.whatsapp_numero
    ) {
      throw new Error(
        "Não foi possível enviar a mensagem. Verifique se o número de WhatsApp está cadastrado e se a autorização de envio está ativa.",
      );
    }

    // 2) Buscar lembrete mais próximo (pendente) para preencher a mensagem
    const { data: lembrete } = await supabase
      .from("reminders")
      .select("id, titulo, data_vencimento, categoria_id, categories(nome)")
      .eq("user_id", userId)
      .order("data_vencimento", { ascending: true })
      .limit(1)
      .maybeSingle();

    const titulo = lembrete?.titulo ?? "Lembrete de exemplo";
    const categoria =
      (lembrete as { categories?: { nome?: string } } | null)?.categories?.nome ??
      "Geral";
    const vencimento = lembrete?.data_vencimento
      ? new Date(lembrete.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    const mensagem =
      `Olá! Este é um teste do sistema de lembretes.\n\n` +
      `Lembrete: ${titulo}\n` +
      `Categoria: ${categoria}\n` +
      `Vencimento: ${vencimento}\n\n` +
      `Se você recebeu esta mensagem, o envio de lembretes pelo WhatsApp está funcionando corretamente.\n\n` +
      `Para deixar de receber lembretes, acesse as configurações da sua conta e cancele a autorização de envio por WhatsApp.`;

    // 3) Enviar via Twilio WhatsApp
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
    const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      throw new Error("Integração de mensagens não configurada.");
    }
    if (!TWILIO_WHATSAPP_FROM) {
      throw new Error(
        "Número de origem do WhatsApp não configurado. Configure TWILIO_WHATSAPP_FROM.",
      );
    }

    const toNumber = normalizarNumeroBR(consent.whatsapp_numero);
    const fromFormatted = TWILIO_WHATSAPP_FROM.startsWith("whatsapp:")
      ? TWILIO_WHATSAPP_FROM
      : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

    const resp = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${toNumber}`,
        From: fromFormatted,
        Body: mensagem,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Twilio WhatsApp falhou [${resp.status}]: ${body}`);
      throw new Error(
        "Não foi possível enviar a mensagem. Verifique se o número de WhatsApp está cadastrado e se a autorização de envio está ativa.",
      );
    }

    // 4) Registrar no histórico (não altera status do lembrete)
    if (lembrete?.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications_log").insert({
        user_id: userId,
        reminder_id: lembrete.id,
        tipo: "whatsapp_teste",
        data_alvo: lembrete.data_vencimento,
        dias_antes: 0,
      });
    }

    return { ok: true, para: toNumber };
  });
