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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      class_access: {
        Row: {
          class_tag_id: string
          created_at: string
          id: string
          payment_reference: string
          user_id: string
        }
        Insert: {
          class_tag_id: string
          created_at?: string
          id?: string
          payment_reference: string
          user_id: string
        }
        Update: {
          class_tag_id?: string
          created_at?: string
          id?: string
          payment_reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_access_class_tag_id_fkey"
            columns: ["class_tag_id"]
            isOneToOne: false
            referencedRelation: "class_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      class_tags: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_free: boolean
          is_preferred: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_preferred?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_free?: boolean
          is_preferred?: boolean
          name?: string
        }
        Relationships: []
      }
      course_programs: {
        Row: {
          course_id: string
          created_at: string
          id: string
          program_id: string
          semester: number
          year: number
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          program_id: string
          semester?: number
          year?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          program_id?: string
          semester?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_programs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
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
          downloads_today: number
          email: string
          founding_user: boolean
          id: string
          last_download_date: string
          name: string
          paid_semester_id: string | null
          program_id: string | null
          study_year: number | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Insert: {
          created_at?: string
          downloads_today?: number
          email: string
          founding_user?: boolean
          id?: string
          last_download_date?: string
          name: string
          paid_semester_id?: string | null
          program_id?: string | null
          study_year?: number | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id: string
        }
        Update: {
          created_at?: string
          downloads_today?: number
          email?: string
          founding_user?: boolean
          id?: string
          last_download_date?: string
          name?: string
          paid_semester_id?: string | null
          program_id?: string | null
          study_year?: number | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_paid_semester_id_fkey"
            columns: ["paid_semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
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
          author: string | null
          class_tag_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          downloads: number
          file_path: string
          file_url: string
          id: string
          is_hidden: boolean
          is_mad_math: boolean
          is_preferred: boolean
          mad_math_difficulty: string | null
          mad_math_subject: string | null
          mad_math_topic: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          show_in_general: boolean
          title: string
          uploaded_by: string
        }
        Insert: {
          author?: string | null
          class_tag_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          file_path: string
          file_url: string
          id?: string
          is_hidden?: boolean
          is_mad_math?: boolean
          is_preferred?: boolean
          mad_math_difficulty?: string | null
          mad_math_subject?: string | null
          mad_math_topic?: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          show_in_general?: boolean
          title: string
          uploaded_by: string
        }
        Update: {
          author?: string | null
          class_tag_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          downloads?: number
          file_path?: string
          file_url?: string
          id?: string
          is_hidden?: boolean
          is_mad_math?: boolean
          is_preferred?: boolean
          mad_math_difficulty?: string | null
          mad_math_subject?: string | null
          mad_math_topic?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          show_in_general?: boolean
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_class_tag_id_fkey"
            columns: ["class_tag_id"]
            isOneToOne: false
            referencedRelation: "class_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          semester_name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          semester_name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          semester_name?: string
          start_date?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          created_at: string
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
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
      attempt_download: { Args: { p_resource_id: string }; Returns: boolean }
      get_admin_user_stats: { Args: never; Returns: Json }
      get_founding_spots_remaining: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_downloads: { Args: { resource_id: string }; Returns: undefined }
      search_courses: {
        Args: { search_term: string }
        Returns: {
          course_code: string
          course_name: string
          created_at: string
          department: string
          id: string
          program_id: string | null
          university: string
        }[]
        SetofOptions: {
          from: "*"
          to: "courses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
      subscription_tier: "free" | "premium" | "founder"
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
      subscription_tier: ["free", "premium", "founder"],
    },
  },
} as const
