import { supabase } from "@/integrations/supabase/client";

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
export type ReminderStatus = "pending" | "paid" | "archived";

export interface Category {
  id: string; nome: string; icone: string; cor: string;
}
export interface Reminder {
  id: string; user_id: string; categoria_id: string | null;
  titulo: string; valor: number | null; observacoes: string | null;
  data_vencimento: string; hora_vencimento?: string | null; recorrencia: Recurrence; intervalo_dias: number | null;
  avisos: number[]; status: ReminderStatus; anexo_url: string | null; anexo_nome: string | null;
  created_at: string; updated_at: string;
  categories?: Category | null;
}
export interface Payment {
  id: string; reminder_id: string; user_id: string;
  data_pagamento: string; valor_pago: number | null; comprovante_url: string | null; observacoes: string | null;
  created_at: string;
}

export async function fetchReminders(filter?: { status?: ReminderStatus | "all"; }): Promise<Reminder[]> {
  let q = supabase.from("reminders").select("*, categories(*)").order("data_vencimento", { ascending: true });
  if (filter?.status && filter.status !== "all") q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Reminder[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("nome");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchPayments(): Promise<(Payment & { reminders?: Reminder | null })[]> {
  const { data, error } = await supabase.from("payments").select("*, reminders(*, categories(*))")
    .order("data_pagamento", { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Payment & { reminders?: Reminder | null })[];
}

export async function uploadAttachment(userId: string, file: File): Promise<{ path: string; url: string; name: string }> {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("attachments").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = await supabase.storage.from("attachments").createSignedUrl(path, 60 * 60 * 24 * 365);
  return { path, url: data?.signedUrl ?? "", name: file.name };
}

export function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

export const recurrenceLabels: Record<Recurrence, string> = {
  none: "Sem repetição", daily: "Diária", weekly: "Semanal",
  monthly: "Mensal", yearly: "Anual", custom: "Personalizada",
};
