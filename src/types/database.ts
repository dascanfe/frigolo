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
          color_token: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color_token: string
          icon: string
          id?: string
          name: string
          slug: string
          sort_order: number
        }
        Update: {
          color_token?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      household_members: {
        Row: {
          avatar_url: string | null
          color: string | null
          display_name: string | null
          household_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          color?: string | null
          display_name?: string | null
          household_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          color?: string | null
          display_name?: string | null
          household_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          stores: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          join_code?: string
          name: string
          stores?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          stores?: string[]
        }
        Relationships: []
      }
      items: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          default_unit: string
          household_id: string | null
          icon: string
          id: string
          is_archived: boolean
          name: string
          season_months: number[]
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          default_unit?: string
          household_id?: string | null
          icon: string
          id?: string
          is_archived?: boolean
          name: string
          season_months?: number[]
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          default_unit?: string
          household_id?: string | null
          icon?: string
          id?: string
          is_archived?: boolean
          name?: string
          season_months?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      list_entries: {
        Row: {
          added_at: string
          added_by: string | null
          checked_at: string | null
          household_id: string
          id: string
          item_id: string
          note: string | null
          quantity: number
          status: string
          store: string | null
          unit: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          checked_at?: string | null
          household_id: string
          id?: string
          item_id: string
          note?: string | null
          quantity?: number
          status?: string
          store?: string | null
          unit?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          checked_at?: string | null
          household_id?: string
          id?: string
          item_id?: string
          note?: string | null
          quantity?: number
          status?: string
          store?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_entries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_entries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          added_by: string | null
          category_id: string
          household_id: string
          id: string
          item_id: string
          purchased_at: string
          purchased_by: string | null
          quantity: number
          trip_id: string
          unit: string | null
        }
        Insert: {
          added_by?: string | null
          category_id: string
          household_id: string
          id?: string
          item_id: string
          purchased_at?: string
          purchased_by?: string | null
          quantity?: number
          trip_id: string
          unit?: string | null
        }
        Update: {
          added_by?: string | null
          category_id?: string
          household_id?: string
          id?: string
          item_id?: string
          purchased_at?: string
          purchased_by?: string | null
          quantity?: number
          trip_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "shopping_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_trips: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          household_id: string
          id: string
          started_at: string
          store: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          household_id: string
          id?: string
          started_at?: string
          store?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          household_id?: string
          id?: string
          started_at?: string
          store?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_trips_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_category_totals: {
        Args: { p_from?: string; p_household_id: string; p_to?: string }
        Returns: {
          category_id: string
          color_token: string
          icon: string
          name: string
          purchase_count: number
          slug: string
          sort_order: number
        }[]
      }
      analytics_item_totals: {
        Args: {
          p_category_id?: string
          p_from?: string
          p_household_id: string
          p_to?: string
        }
        Returns: {
          avg_interval_days: number
          category_color_token: string
          category_id: string
          category_slug: string
          first_purchased_at: string
          item_icon: string
          item_id: string
          item_name: string
          last_purchased_at: string
          purchase_count: number
          total_quantity: number
        }[]
      }
      analytics_members: {
        Args: {
          p_category_id?: string
          p_from?: string
          p_household_id: string
          p_to?: string
        }
        Returns: {
          added_count: number
          color: string
          display_name: string
          user_id: string
        }[]
      }
      analytics_summary: {
        Args: {
          p_category_id?: string
          p_from?: string
          p_household_id: string
          p_to?: string
        }
        Returns: {
          avg_items_per_trip: number
          total_items: number
          trips: number
        }[]
      }
      analytics_weekly: {
        Args: {
          p_bucket?: string
          p_category_id?: string
          p_from?: string
          p_household_id: string
          p_to?: string
        }
        Returns: {
          bucket_start: string
          purchase_count: number
          trips: number
        }[]
      }
      apply_legacy_profile_args: {
        Args: { p_color: string; p_display_name: string; p_user: string }
        Returns: undefined
      }
      auto_complete_trips: {
        Args: { p_household_id?: string }
        Returns: number
      }
      complete_shopping_trip: {
        Args: { p_household_id: string; p_store?: string }
        Returns: string
      }
      create_household: {
        Args: { p_color?: string; p_display_name?: string; p_name: string }
        Returns: string
      }
      delete_household: { Args: { p_household_id: string }; Returns: undefined }
      generate_join_code: { Args: never; Returns: string }
      get_household_invite: {
        Args: { p_code: string }
        Returns: {
          household_id: string
          is_member: boolean
          member_count: number
          name: string
        }[]
      }
      is_household_member: {
        Args: { p_household_id: string }
        Returns: boolean
      }
      is_valid_avatar_url: {
        Args: { p_url: string; p_user: string }
        Returns: boolean
      }
      join_household: {
        Args: { p_code: string; p_color?: string; p_display_name?: string }
        Returns: string
      }
      leave_household: { Args: { p_household_id: string }; Returns: boolean }
      max_households_per_user: { Args: never; Returns: number }
      max_members_per_household: { Args: never; Returns: number }
      normalize_join_code: { Args: { p_code: string }; Returns: string }
      ping: { Args: never; Returns: string }
      rename_household: {
        Args: { p_household_id: string; p_name: string }
        Returns: string
      }
      rename_store: {
        Args: { p_household_id: string; p_new?: string; p_old: string }
        Returns: string[]
      }
      rotate_join_code: { Args: { p_household_id: string }; Returns: string }
      shares_household_with: { Args: { p_user: string }; Returns: boolean }
      update_my_profile: {
        Args: {
          p_avatar_url?: string
          p_color?: string
          p_display_name?: string
        }
        Returns: {
          avatar_url: string | null
          color: string | null
          completed_at: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

