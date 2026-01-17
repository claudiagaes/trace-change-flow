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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dependencies: {
        Row: {
          affected_area: string
          created_at: string
          document_type: string
          id: string
          owner_role: Database["public"]["Enums"]["app_role"]
          part_change_id: string
          reason: string
        }
        Insert: {
          affected_area: string
          created_at?: string
          document_type: string
          id?: string
          owner_role: Database["public"]["Enums"]["app_role"]
          part_change_id: string
          reason: string
        }
        Update: {
          affected_area?: string
          created_at?: string
          document_type?: string
          id?: string
          owner_role?: Database["public"]["Enums"]["app_role"]
          part_change_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependencies_part_change_id_fkey"
            columns: ["part_change_id"]
            isOneToOne: false
            referencedRelation: "part_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          message: string
          read_at: string | null
          recipient_id: string
          related_change_id: string | null
          related_task_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message: string
          read_at?: string | null
          recipient_id: string
          related_change_id?: string | null
          related_task_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message?: string
          read_at?: string | null
          recipient_id?: string
          related_change_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_change_id_fkey"
            columns: ["related_change_id"]
            isOneToOne: false
            referencedRelation: "part_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      part_change_files: {
        Row: {
          file_name: string
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id: string
          part_change_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_type: Database["public"]["Enums"]["file_type"]
          id?: string
          part_change_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: Database["public"]["Enums"]["file_type"]
          id?: string
          part_change_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_change_files_part_change_id_fkey"
            columns: ["part_change_id"]
            isOneToOne: false
            referencedRelation: "part_changes"
            referencedColumns: ["id"]
          },
        ]
      }
      part_changes: {
        Row: {
          created_at: string
          created_by: string
          description: string
          geometry_changed: boolean | null
          id: string
          material_changed: boolean | null
          part_id: string | null
          part_name: string
          process_changed: boolean | null
          status: Database["public"]["Enums"]["change_status"]
          supplier_changed: boolean | null
          surface_finish_changed: boolean | null
          tolerances_changed: boolean | null
          updated_at: string
          weight_changed: boolean | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          geometry_changed?: boolean | null
          id?: string
          material_changed?: boolean | null
          part_id?: string | null
          part_name: string
          process_changed?: boolean | null
          status?: Database["public"]["Enums"]["change_status"]
          supplier_changed?: boolean | null
          surface_finish_changed?: boolean | null
          tolerances_changed?: boolean | null
          updated_at?: string
          weight_changed?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          geometry_changed?: boolean | null
          id?: string
          material_changed?: boolean | null
          part_id?: string | null
          part_name?: string
          process_changed?: boolean | null
          status?: Database["public"]["Enums"]["change_status"]
          supplier_changed?: boolean | null
          surface_finish_changed?: boolean | null
          tolerances_changed?: boolean | null
          updated_at?: string
          weight_changed?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          comments: string | null
          completed_at: string | null
          created_at: string
          dependency_id: string
          id: string
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
          updated_document_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          dependency_id: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_document_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          dependency_id?: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
          updated_document_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_dependency_id_fkey"
            columns: ["dependency_id"]
            isOneToOne: false
            referencedRelation: "dependencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_engineer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "engineer"
        | "maintenance"
        | "quality"
        | "manufacturing"
        | "safety"
      change_status: "draft" | "in_progress" | "pending_review" | "completed"
      file_type: "old_part" | "new_part" | "document"
      notification_type:
        | "task_assigned"
        | "task_completed"
        | "change_completed"
        | "comment_added"
      task_status: "pending" | "in_progress" | "completed" | "no_change_needed"
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
      app_role: [
        "engineer",
        "maintenance",
        "quality",
        "manufacturing",
        "safety",
      ],
      change_status: ["draft", "in_progress", "pending_review", "completed"],
      file_type: ["old_part", "new_part", "document"],
      notification_type: [
        "task_assigned",
        "task_completed",
        "change_completed",
        "comment_added",
      ],
      task_status: ["pending", "in_progress", "completed", "no_change_needed"],
    },
  },
} as const
