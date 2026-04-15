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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievement_standard: {
        Row: {
          created_at: string
          curriculum_id: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_standard_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: true
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_sessions: {
        Row: {
          activity_id: string
          created_at: string
          current_question_id: string | null
          host_id: string
          id: string
          join_code: string
          locked_at: string | null
          state: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          current_question_id?: string | null
          host_id: string
          id?: string
          join_code: string
          locked_at?: string | null
          state?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          current_question_id?: string | null
          host_id?: string
          id?: string
          join_code?: string
          locked_at?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_content_item: {
        Row: {
          class_id: string | null
          content_item_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          class_id?: string | null
          content_item_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          class_id?: string | null
          content_item_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_content_item_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_content_item_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          teacher_notes: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          teacher_notes?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          teacher_notes?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_code: string | null
          class_name: string
          created_at: string
          curriculum_id: string | null
          end_date: string
          id: string
          is_demo: boolean
          school_id: string
          start_date: string
          subject: string
          teacher_id: string
          term: string
          updated_at: string
          year_level: string
        }
        Insert: {
          class_code?: string | null
          class_name: string
          created_at?: string
          curriculum_id?: string | null
          end_date: string
          id?: string
          is_demo?: boolean
          school_id: string
          start_date: string
          subject: string
          teacher_id: string
          term: string
          updated_at?: string
          year_level: string
        }
        Update: {
          class_code?: string | null
          class_name?: string
          created_at?: string
          curriculum_id?: string | null
          end_date?: string
          id?: string
          is_demo?: boolean
          school_id?: string
          start_date?: string
          subject?: string
          teacher_id?: string
          term?: string
          updated_at?: string
          year_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item: {
        Row: {
          code: string
          created_at: string
          curriculum_id: string | null
          description: string
          display_code: string | null
          id: string
          strand_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          curriculum_id?: string | null
          description: string
          display_code?: string | null
          id?: string
          strand_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          curriculum_id?: string | null
          description?: string
          display_code?: string | null
          id?: string
          strand_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: false
            referencedRelation: "strand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_content_item_curriculum"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item_tag: {
        Row: {
          content_item_id: string
          tag_id: string
        }
        Insert: {
          content_item_id: string
          tag_id: string
        }
        Update: {
          content_item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_item_tag_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum: {
        Row: {
          authority: string
          created_at: string
          id: string
          learning_area: string
          updated_at: string
          version: string
          year_band: string
          year_level_description: string
        }
        Insert: {
          authority: string
          created_at?: string
          id?: string
          learning_area: string
          updated_at?: string
          version: string
          year_band: string
          year_level_description: string
        }
        Update: {
          authority?: string
          created_at?: string
          id?: string
          learning_area?: string
          updated_at?: string
          version?: string
          year_band?: string
          year_level_description?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_default: boolean
          layout_config: Json
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          layout_config?: Json
          name?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          layout_config?: Json
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dashboard_layouts_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          config: Json
          created_at: string
          data_source: string
          filters: Json
          id: string
          layout_id: string
          position: Json
          title: string
          updated_at: string
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          data_source: string
          filters?: Json
          id?: string
          layout_id: string
          position?: Json
          title: string
          updated_at?: string
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          data_source?: string
          filters?: Json
          id?: string
          layout_id?: string
          position?: Json
          title?: string
          updated_at?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_dashboard_widgets_layout"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "dashboard_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      enrolments: {
        Row: {
          class_id: string
          created_at: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_options: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_results: {
        Row: {
          ai_feedback: string | null
          created_at: string
          id: string
          percent_score: number | null
          question_id: string
          raw_score: number | null
          response_data: Json | null
          student_id: string
          updated_at: string
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string
          id?: string
          percent_score?: number | null
          question_id: string
          raw_score?: number | null
          response_data?: Json | null
          student_id: string
          updated_at?: string
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string
          id?: string
          percent_score?: number | null
          question_id?: string
          raw_score?: number | null
          response_data?: Json | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_question_results_question"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          blooms_taxonomy: string | null
          content_item: string | null
          created_at: string
          general_capabilities: string[] | null
          id: string
          marking_criteria: Json | null
          max_score: number | null
          model_answer: string | null
          number: number
          question: string | null
          question_type: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          blooms_taxonomy?: string | null
          content_item?: string | null
          created_at?: string
          general_capabilities?: string[] | null
          id?: string
          marking_criteria?: Json | null
          max_score?: number | null
          model_answer?: string | null
          number: number
          question?: string | null
          question_type?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          blooms_taxonomy?: string | null
          content_item?: string | null
          created_at?: string
          general_capabilities?: string[] | null
          id?: string
          marking_criteria?: Json | null
          max_score?: number | null
          model_answer?: string | null
          number?: number
          question?: string | null
          question_type?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          normalised_percent: number | null
          percent_score: number | null
          raw_score: number | null
          student_id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          normalised_percent?: number | null
          percent_score?: number | null
          raw_score?: number | null
          student_id: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          normalised_percent?: number | null
          percent_score?: number | null
          raw_score?: number | null
          student_id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_answers: {
        Row: {
          answer_id: string
          id: string
          is_correct: boolean
          participant_id: string
          question_id: string
          received_at: string
          score_awarded: number
          session_id: string
          time_taken_ms: number
        }
        Insert: {
          answer_id: string
          id?: string
          is_correct: boolean
          participant_id: string
          question_id: string
          received_at?: string
          score_awarded?: number
          session_id: string
          time_taken_ms?: number
        }
        Update: {
          answer_id?: string
          id?: string
          is_correct?: boolean
          participant_id?: string
          question_id?: string
          received_at?: string
          score_awarded?: number
          session_id?: string
          time_taken_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "session_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          anon_id: string | null
          display_name: string
          id: string
          joined_at: string
          score: number
          session_id: string
        }
        Insert: {
          anon_id?: string | null
          display_name: string
          id?: string
          joined_at?: string
          score?: number
          session_id: string
        }
        Update: {
          anon_id?: string | null
          display_name?: string
          id?: string
          joined_at?: string
          score?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "activity_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      strand: {
        Row: {
          created_at: string
          curriculum_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strand_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curriculum"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          category: string
          class_session_id: string
          created_at: string | null
          id: string
          note: string
          rating: number
          student_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          class_session_id: string
          created_at?: string | null
          id?: string
          note: string
          rating: number
          student_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          class_session_id?: string
          created_at?: string | null
          id?: string
          note?: string
          rating?: number
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_responses: {
        Row: {
          confidence_rating: number | null
          created_at: string | null
          id: string
          student_id: string | null
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_rating?: number | null
          created_at?: string | null
          id?: string
          student_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_rating?: number | null
          created_at?: string | null
          id?: string
          student_id?: string | null
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          student_id: string
          updated_at: string
          year_level: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          student_id: string
          updated_at?: string
          year_level?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          student_id?: string
          updated_at?: string
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      tag: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["tag_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["tag_type"]
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assessment_format: string | null
          blooms_taxonomy: string | null
          class_id: string
          class_session_id: string | null
          content_item_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          is_exit_ticket: boolean | null
          is_legacy: boolean | null
          key_skill: string | null
          max_score: number | null
          name: string
          status: string | null
          task_type: string | null
          updated_at: string
          weight_percent: number | null
        }
        Insert: {
          assessment_format?: string | null
          blooms_taxonomy?: string | null
          class_id: string
          class_session_id?: string | null
          content_item_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_exit_ticket?: boolean | null
          is_legacy?: boolean | null
          key_skill?: string | null
          max_score?: number | null
          name: string
          status?: string | null
          task_type?: string | null
          updated_at?: string
          weight_percent?: number | null
        }
        Update: {
          assessment_format?: string | null
          blooms_taxonomy?: string | null
          class_id?: string
          class_session_id?: string | null
          content_item_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_exit_ticket?: boolean | null
          is_legacy?: boolean | null
          key_skill?: string | null
          max_score?: number | null
          name?: string
          status?: string | null
          task_type?: string | null
          updated_at?: string
          weight_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_item"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          openai_vault_id: string | null
          role: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          openai_vault_id?: string | null
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          openai_vault_id?: string | null
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "QUIZ"
        | "POLL"
        | "FLASHCARDS"
        | "EXIT_TICKET"
        | "BUZZER"
        | "FORM"
      tag_type: "concept" | "capability" | "blooms_taxonomy"
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
      activity_type: [
        "QUIZ",
        "POLL",
        "FLASHCARDS",
        "EXIT_TICKET",
        "BUZZER",
        "FORM",
      ],
      tag_type: ["concept", "capability", "blooms_taxonomy"],
    },
  },
} as const
