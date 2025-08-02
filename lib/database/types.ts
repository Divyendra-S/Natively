export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      editing_feedback: {
        Row: {
          created_at: string | null
          editing_session_id: string | null
          feedback_type: string | null
          id: string
          specific_feedback: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          editing_session_id?: string | null
          feedback_type?: string | null
          id?: string
          specific_feedback?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          editing_session_id?: string | null
          feedback_type?: string | null
          id?: string
          specific_feedback?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editing_feedback_editing_session_id_fkey"
            columns: ["editing_session_id"]
            isOneToOne: false
            referencedRelation: "image_editing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      image_editing_sessions: {
        Row: {
          algorithms_applied: string[]
          config_used: Json
          created_at: string | null
          id: string
          image_id: string | null
          processing_time_ms: number | null
          quality_improvement_score: number | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          algorithms_applied: string[]
          config_used: Json
          created_at?: string | null
          id?: string
          image_id?: string | null
          processing_time_ms?: number | null
          quality_improvement_score?: number | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          algorithms_applied?: string[]
          config_used?: Json
          created_at?: string | null
          id?: string
          image_id?: string | null
          processing_time_ms?: number | null
          quality_improvement_score?: number | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_editing_sessions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          analysis_data: Json | null
          created_at: string | null
          id: string
          original_url: string
          processed_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          original_url: string
          processed_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string | null
          id?: string
          original_url?: string
          processed_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          published: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          published?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          image_id: string | null
          max_retries: number | null
          metadata: Json | null
          operation_type: string
          priority: number | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_id?: string | null
          max_retries?: number | null
          metadata?: Json | null
          operation_type: string
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_id?: string | null
          max_retries?: number | null
          metadata?: Json | null
          operation_type?: string
          priority?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_queue_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      user_editing_profiles: {
        Row: {
          average_enhancement_strength: number | null
          created_at: string | null
          favorite_looks: string[] | null
          id: string
          image_type_preferences: Json | null
          preferred_algorithms: Json | null
          style_preferences: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_enhancement_strength?: number | null
          created_at?: string | null
          favorite_looks?: string[] | null
          id?: string
          image_type_preferences?: Json | null
          preferred_algorithms?: Json | null
          style_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_enhancement_strength?: number | null
          created_at?: string | null
          favorite_looks?: string[] | null
          id?: string
          image_type_preferences?: Json | null
          preferred_algorithms?: Json | null
          style_preferences?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          analysis_intensity: string | null
          auto_analyze: boolean | null
          auto_enhance: boolean | null
          color_preference: string | null
          created_at: string | null
          custom_settings: Json | null
          detail_enhancement_level: number | null
          editing_style: string | null
          enhancement_algorithms: string[] | null
          enhancement_strength: number | null
          id: string
          noise_reduction_level: number | null
          notify_analysis_complete: boolean | null
          notify_processing_complete: boolean | null
          preserve_originals: boolean | null
          processing_quality: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_intensity?: string | null
          auto_analyze?: boolean | null
          auto_enhance?: boolean | null
          color_preference?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          detail_enhancement_level?: number | null
          editing_style?: string | null
          enhancement_algorithms?: string[] | null
          enhancement_strength?: number | null
          id?: string
          noise_reduction_level?: number | null
          notify_analysis_complete?: boolean | null
          notify_processing_complete?: boolean | null
          preserve_originals?: boolean | null
          processing_quality?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_intensity?: string | null
          auto_analyze?: boolean | null
          auto_enhance?: boolean | null
          color_preference?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          detail_enhancement_level?: number | null
          editing_style?: string | null
          enhancement_algorithms?: string[] | null
          enhancement_strength?: number | null
          id?: string
          noise_reduction_level?: number | null
          notify_analysis_complete?: boolean | null
          notify_processing_complete?: boolean | null
          preserve_originals?: boolean | null
          processing_quality?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const