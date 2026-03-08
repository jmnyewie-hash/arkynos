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
      courses: {
        Row: {
          course_code: string
          course_name: string
          created_at: string
          department: string
          id: string
          program_id: string | null
          university: string
        }
        Insert: {
          course_code: string
          course_name: string
          created_at?: string
          department: string
          id?: string
          program_id?: string | null
          university: string
        }
        Update: {
          course_code?: string
          course_name?: string
          created_at?: string
          department?: string
          id?: string
          program_id?: string | null
          university?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          created_at: string
          department: string
          id: string
          program_name: string
          university: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          program_name: string
          university: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          program_name?: string
          university?: string
        }
        Relationships: []
      }
      resource_flags: {
        Row: {
          created_at: string
          description: string | null
          flagged_by: string
          id: string
          reason: Database["public"]["Enums"]["flag_reason"]
          resolved_at: string | null
          resolved_by: string | null
          resource_id: string
          status: Database["public"]["Enums"]["flag_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          flagged_by: string
          id?: string
          reason: Database["public"]["Enums"]["flag_reason"]
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id: string
          status?: Database["public"]["Enums"]["flag_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          flagged_by?: string
          id?: string
          reason?: Database["public"]["Enums"]["flag_reason"]
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string
          status?: Database["public"]["Enums"]["flag_status"]
        }
        Relationships: [
          {
            foreignKeyName: "resource_flags_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          downloads: number
          file_path: string
          file_url: string
          id: string
          is_hidden: boolean
          is_preferred: boolean
          resource_type: Database["public"]["Enums"]["resource_type"]
          title: string
          uploaded_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_path: string
          file_url: string
          id?: string
          is_hidden?: boolean
          is_preferred?: boolean
          resource_type: Database["public"]["Enums"]["resource_type"]
          title: string
          uploaded_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_path?: string
          file_url?: string
          id?: string
          is_hidden?: boolean
          is_preferred?: boolean
          resource_type?: Database["public"]["Enums"]["resource_type"]
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_downloads: { Args: { resource_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      flag_reason:
        | "wrong_category"
        | "inappropriate_content"
        | "spam"
        | "copyright_violation"
        | "low_quality"
        | "other"
      flag_status: "pending" | "resolved" | "dismissed"
      resource_type:
        | "past_question"
        | "lecture_notes"
        | "textbook"
        | "lab_manual"
        | "recommended_books"
        | "solution_manual"
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
      app_role: ["admin", "user"],
      flag_reason: [
        "wrong_category",
        "inappropriate_content",
        "spam",
        "copyright_violation",
        "low_quality",
        "other",
      ],
      flag_status: ["pending", "resolved", "dismissed"],
      resource_type: [
        "past_question",
        "lecture_notes",
        "textbook",
        "lab_manual",
        "recommended_books",
        "solution_manual",
      ],
    },
  },
} as const
