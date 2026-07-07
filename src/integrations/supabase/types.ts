export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          cor: string
          created_at: string
          icone: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string
          icone?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          icone?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          data_alvo: string
          dias_antes: number
          enviado_em: string
          id: string
          reminder_id: string
          tipo: string
          user_id: string
        }
        Insert: {
          data_alvo: string
          dias_antes: number
          enviado_em?: string
          id?: string
          reminder_id: string
          tipo: string
          user_id: string
        }
        Update: {
          data_alvo?: string
          dias_antes?: number
          enviado_em?: string
          id?: string
          reminder_id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          comprovante_url: string | null
          created_at: string
          data_pagamento: string
          id: string
          observacoes: string | null
          reminder_id: string
          user_id: string
          valor_pago: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          id?: string
          observacoes?: string | null
          reminder_id: string
          user_id: string
          valor_pago?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string
          id?: string
          observacoes?: string | null
          reminder_id?: string
          user_id?: string
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avisos_padrao: number[]
          created_at: string
          email: string | null
          id: string
          nome: string | null
          updated_at: string
        }
        Insert: {
          avisos_padrao?: number[]
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          updated_at?: string
        }
        Update: {
          avisos_padrao?: number[]
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          anexo_nome: string | null
          anexo_url: string | null
          avisos: number[]
          categoria_id: string | null
          created_at: string
          data_vencimento: string
          id: string
          intervalo_dias: number | null
          observacoes: string | null
          recorrencia: Database["public"]["Enums"]["recurrence_type"]
          status: Database["public"]["Enums"]["reminder_status"]
          titulo: string
          updated_at: string
          user_id: string
          valor: number | null
        }
        Insert: {
          anexo_nome?: string | null
          anexo_url?: string | null
          avisos?: number[]
          categoria_id?: string | null
          created_at?: string
          data_vencimento: string
          id?: string
          intervalo_dias?: number | null
          observacoes?: string | null
          recorrencia?: Database["public"]["Enums"]["recurrence_type"]
          status?: Database["public"]["Enums"]["reminder_status"]
          titulo: string
          updated_at?: string
          user_id: string
          valor?: number | null
        }
        Update: {
          anexo_nome?: string | null
          anexo_url?: string | null
          avisos?: number[]
          categoria_id?: string | null
          created_at?: string
          data_vencimento?: string
          id?: string
          intervalo_dias?: number | null
          observacoes?: string | null
          recorrencia?: Database["public"]["Enums"]["recurrence_type"]
          status?: Database["public"]["Enums"]["reminder_status"]
          titulo?: string
          updated_at?: string
          user_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_consents: {
        Row: {
          aceite_em: string | null
          cancelado_em: string | null
          created_at: string
          id: string
          nome: string
          origem_aceite: string
          permissao: string
          status: string
          texto_autorizacao: string
          updated_at: string
          user_id: string
          whatsapp_numero: string
        }
        Insert: {
          aceite_em?: string | null
          cancelado_em?: string | null
          created_at?: string
          id?: string
          nome: string
          origem_aceite?: string
          permissao?: string
          status?: string
          texto_autorizacao: string
          updated_at?: string
          user_id: string
          whatsapp_numero: string
        }
        Update: {
          aceite_em?: string | null
          cancelado_em?: string | null
          created_at?: string
          id?: string
          nome?: string
          origem_aceite?: string
          permissao?: string
          status?: string
          texto_autorizacao?: string
          updated_at?: string
          user_id?: string
          whatsapp_numero?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      recurrence_type:
        | "none"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "custom"
      reminder_status: "pending" | "paid" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      recurrence_type: [
        "none",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "custom",
      ],
      reminder_status: ["pending", "paid", "archived"],
    },
  },
} as const
