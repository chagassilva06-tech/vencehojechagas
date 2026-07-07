import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

function normalizarNumeroBR(numero: string): string {
  const d = numero.replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) return `+${d}`;
  if (d.length >= 10 && d.length <= 11) return `+55${d}`;
  return `+${d}`;
}

// Fuso de São Paulo (UTC-3, sem horário de verão desde 2019)
function hojeSaoPaulo(): string {
  const agora = new Date();
  const sp = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  return sp.toISOString().slice(0, 10);
}

function diffDays(vencimento: string, hoje: string): number {
  const a = new Date(hoje + "T00:00:00Z").getTime();
  const b = new Date(vencimento + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

async function enviarWhatsapp(params: {
  to: string;
  from: string;
  body: string;
  lovableKey: string;
  twilioKey: string;
}) {
  const resp = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.lovableKey}`,
      "X-Connection-Api-Key": params.twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: params.to, From: params.from, Body: params.body }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Twilio ${resp.status}: ${text}`);
  }
  return resp.json();
}

export const Route = createFileRoute("/api/public/hooks/send-whatsapp-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
        const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
        if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_WHATSAPP_FROM) {
          return new Response(
            JSON.stringify({ error: "Integração WhatsApp não configurada." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
        const fromFormatted = TWILIO_WHATSAPP_FROM.startsWith("whatsapp:")
          ? TWILIO_WHATSAPP_FROM
          : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

        const hoje = hojeSaoPaulo();
        // Janela: até 30 dias à frente (cobre avisos padrão de 0/1/3/7 dias)
        const dataMax = new Date(hoje + "T00:00:00Z");
        dataMax.setUTCDate(dataMax.getUTCDate() + 30);
        const dataMaxStr = dataMax.toISOString().slice(0, 10);

        // Hora atual em São Paulo (HH:MM)
        const agoraSP = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const horaAgoraSP = agoraSP.toISOString().slice(11, 16); // "HH:MM"

        const { data: lembretes, error: errLem } = await supabase
          .from("reminders")
          .select("id, user_id, titulo, valor, data_vencimento, hora_vencimento, avisos, categoria_id, categories(nome)")
          .eq("status", "pending")
          .gte("data_vencimento", hoje)
          .lte("data_vencimento", dataMaxStr);
        if (errLem) {
          return new Response(JSON.stringify({ error: errLem.message }), { status: 500 });
        }

        let enviados = 0;
        let ignorados = 0;
        let falhas = 0;
        const detalhes: Array<Record<string, unknown>> = [];

        // Cache de consentimentos por usuário
        const consentCache = new Map<
          string,
          { nome: string; numero: string } | null
        >();

        for (const l of lembretes ?? []) {
          const dias = diffDays(l.data_vencimento, hoje);
          const avisos: number[] = Array.isArray(l.avisos) ? l.avisos : [];

          // Regras:
          // - avisos padrão (0,1,3,...): dispara se avisos.includes(dias)
          // - "Hora agendada" (-1): dispara no dia do vencimento quando a hora atual (SP) >= hora_vencimento
          const horaVenc = (l as { hora_vencimento?: string | null }).hora_vencimento?.slice(0, 5) ?? null;
          const disparoPorDia = avisos.includes(dias) && dias !== -1;
          const disparoPorHora =
            avisos.includes(-1) && dias === 0 && horaVenc != null && horaAgoraSP >= horaVenc;
          if (!disparoPorDia && !disparoPorHora) continue;

          // Chave lógica para o log (dias_antes = -1 quando for "hora agendada")
          const diasLog = disparoPorHora ? -1 : dias;


          // Consentimento
          let consent = consentCache.get(l.user_id);
          if (consent === undefined) {
            const { data: c } = await supabase
              .from("whatsapp_consents")
              .select("nome, whatsapp_numero, permissao, status")
              .eq("user_id", l.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            consent =
              c && c.status === "ativo" && c.permissao === "autorizado" && c.whatsapp_numero
                ? { nome: c.nome, numero: c.whatsapp_numero }
                : null;
            consentCache.set(l.user_id, consent);
          }
          if (!consent) {
            ignorados++;
            continue;
          }

          // Evitar duplicidade (mesmo lembrete + data_alvo + dias_antes)
          const { data: jaEnviado } = await supabase
            .from("notifications_log")
            .select("id")
            .eq("reminder_id", l.id)
            .eq("data_alvo", l.data_vencimento)
            .eq("dias_antes", dias)
            .eq("tipo", "whatsapp_lembrete")
            .limit(1)
            .maybeSingle();
          if (jaEnviado) {
            ignorados++;
            continue;
          }

          const categoria =
            (l as { categories?: { nome?: string } | null }).categories?.nome ?? "Geral";
          const venc = new Date(l.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR");
          const valor =
            l.valor != null
              ? Number(l.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : null;
          const quando =
            dias === 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `vence em ${dias} dias`;

          const mensagem =
            `Olá, ${consent.nome}!\n\n` +
            `Lembrete: ${l.titulo} (${categoria})\n` +
            (valor ? `Valor: ${valor}\n` : "") +
            `Vencimento: ${venc} — ${quando}.\n\n` +
            `Para deixar de receber, acesse Configurações e cancele a autorização de WhatsApp.`;

          try {
            const to = `whatsapp:${normalizarNumeroBR(consent.numero)}`;
            await enviarWhatsapp({
              to,
              from: fromFormatted,
              body: mensagem,
              lovableKey: LOVABLE_API_KEY,
              twilioKey: TWILIO_API_KEY,
            });
            await supabase.from("notifications_log").insert({
              user_id: l.user_id,
              reminder_id: l.id,
              tipo: "whatsapp_lembrete",
              data_alvo: l.data_vencimento,
              dias_antes: dias,
            });
            enviados++;
            detalhes.push({ reminder_id: l.id, dias, ok: true });
          } catch (e) {
            falhas++;
            detalhes.push({
              reminder_id: l.id,
              dias,
              ok: false,
              erro: e instanceof Error ? e.message : String(e),
            });
          }
        }

        return new Response(
          JSON.stringify({
            hoje,
            total_candidatos: lembretes?.length ?? 0,
            enviados,
            ignorados,
            falhas,
            detalhes,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
