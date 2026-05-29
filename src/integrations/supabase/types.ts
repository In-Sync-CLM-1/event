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
      attendee_schedules: {
        Row: {
          added_at: string
          id: string
          registration_id: string
          session_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          registration_id: string
          session_id: string
        }
        Update: {
          added_at?: string
          id?: string
          registration_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_schedules_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_schedules_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_awards: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          registration_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          registration_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_awards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badge_awards_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json | null
          description: string | null
          event_id: string
          icon_url: string | null
          id: string
          name: string
          points_value: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          event_id: string
          icon_url?: string | null
          id?: string
          name: string
          points_value?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          event_id?: string
          icon_url?: string | null
          id?: string
          name?: string
          points_value?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_url: string | null
          created_at: string
          event_id: string
          id: string
          is_default: boolean
          name: string
          template_config: Json
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          event_id: string
          id?: string
          is_default?: boolean
          name: string
          template_config?: Json
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          created_at?: string
          event_id?: string
          id?: string
          is_default?: boolean
          name?: string
          template_config?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          created_at: string
          event_id: string
          id: string
          issued_at: string
          metadata: Json | null
          pdf_url: string | null
          registration_id: string
          template_id: string | null
        }
        Insert: {
          certificate_number: string
          created_at?: string
          event_id: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          pdf_url?: string | null
          registration_id: string
          template_id?: string | null
        }
        Update: {
          certificate_number?: string
          created_at?: string
          event_id?: string
          id?: string
          issued_at?: string
          metadata?: Json | null
          pdf_url?: string | null
          registration_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          method: string | null
          registration_id: string
          session_id: string | null
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          method?: string | null
          registration_id: string
          session_id?: string | null
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          method?: string | null
          registration_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          expires_at: string | null
          id: string
          is_gated: boolean | null
          session_id: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          expires_at?: string | null
          id?: string
          is_gated?: boolean | null
          session_id?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          expires_at?: string | null
          id?: string
          is_gated?: boolean | null
          session_id?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_library_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_library_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_shares: {
        Row: {
          content_id: string
          created_at: string
          id: string
          recipient_email: string
          recipient_registration_id: string | null
          share_token: string
          sharer_id: string
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          recipient_email: string
          recipient_registration_id?: string | null
          share_token: string
          sharer_id: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          recipient_email?: string
          recipient_registration_id?: string | null
          share_token?: string
          sharer_id?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_shares_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_shares_recipient_registration_id_fkey"
            columns: ["recipient_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_views: {
        Row: {
          content_id: string
          duration_seconds: number | null
          id: string
          registration_id: string
          viewed_at: string
        }
        Insert: {
          content_id: string
          duration_seconds?: number | null
          id?: string
          registration_id: string
          viewed_at?: string
        }
        Update: {
          content_id?: string
          duration_seconds?: number | null
          id?: string
          registration_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_views_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_views_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_scores: {
        Row: {
          breakdown: Json | null
          calculated_at: string
          event_id: string
          id: string
          registration_id: string
          score: number | null
          tier: string | null
        }
        Insert: {
          breakdown?: Json | null
          calculated_at?: string
          event_id: string
          id?: string
          registration_id: string
          score?: number | null
          tier?: string | null
        }
        Update: {
          breakdown?: Json | null
          calculated_at?: string
          event_id?: string
          id?: string
          registration_id?: string
          score?: number | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_scores_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_organizers: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          logo_url: string | null
          max_capacity: number | null
          registration_deadline: string | null
          settings: Json | null
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          logo_url?: string | null
          max_capacity?: number | null
          registration_deadline?: string | null
          settings?: Json | null
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          logo_url?: string | null
          max_capacity?: number | null
          registration_deadline?: string | null
          settings?: Json | null
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          invitee_email: string | null
          invitee_name: string | null
          inviter_id: string
          referral_code: string
          registered_at: string | null
          registration_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          inviter_id: string
          referral_code: string
          registered_at?: string | null
          registration_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          invitee_email?: string | null
          invitee_name?: string | null
          inviter_id?: string
          referral_code?: string
          registered_at?: string | null
          registration_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          created_at: string
          custom_css: string | null
          custom_html: string | null
          event_id: string
          id: string
          is_published: boolean | null
          page_type: string
          sections: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_css?: string | null
          custom_html?: string | null
          event_id: string
          id?: string
          is_published?: boolean | null
          page_type?: string
          sections?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_css?: string | null
          custom_html?: string | null
          event_id?: string
          id?: string
          is_published?: boolean | null
          page_type?: string
          sections?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_bookings: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number
          event_id: string
          follow_up_required: boolean | null
          id: string
          message: string | null
          outcome_notes: string | null
          outcome_rating: number | null
          requester_registration_id: string
          scheduled_start: string | null
          spot_id: string | null
          status: string
          target_registration_id: string
          topics_discussed: string[] | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          event_id: string
          follow_up_required?: boolean | null
          id?: string
          message?: string | null
          outcome_notes?: string | null
          outcome_rating?: number | null
          requester_registration_id: string
          scheduled_start?: string | null
          spot_id?: string | null
          status?: string
          target_registration_id: string
          topics_discussed?: string[] | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number
          event_id?: string
          follow_up_required?: boolean | null
          id?: string
          message?: string | null
          outcome_notes?: string | null
          outcome_rating?: number | null
          requester_registration_id?: string
          scheduled_start?: string | null
          spot_id?: string | null
          status?: string
          target_registration_id?: string
          topics_discussed?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_requester_registration_id_fkey"
            columns: ["requester_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "meeting_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_bookings_target_registration_id_fkey"
            columns: ["target_registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_requests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string | null
          requester_id: string
          slot_id: string | null
          status: string | null
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          requester_id: string
          slot_id?: string | null
          status?: string | null
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          requester_id?: string
          slot_id?: string | null
          status?: string | null
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "meeting_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_requests_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_slots: {
        Row: {
          created_at: string
          end_time: string
          event_id: string
          id: string
          is_available: boolean | null
          location: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          end_time: string
          event_id: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          end_time?: string
          event_id?: string
          id?: string
          is_available?: boolean | null
          location?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_spots: {
        Row: {
          capacity: number | null
          created_at: string
          event_id: string
          id: string
          is_active: boolean | null
          location: string | null
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_spots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      points_log: {
        Row: {
          activity_type: string
          awarded_at: string
          awarded_by: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          points: number
          registration_id: string
        }
        Insert: {
          activity_type: string
          awarded_at?: string
          awarded_by?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          points: number
          registration_id: string
        }
        Update: {
          activity_type?: string
          awarded_at?: string
          awarded_by?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          points?: number
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_log_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          designation: string | null
          email: string
          full_name: string | null
          id: string
          linkedin_url: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          designation?: string | null
          email: string
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          designation?: string | null
          email?: string
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          checked_in_at: string | null
          company: string | null
          confirmed_at: string | null
          created_at: string
          custom_fields: Json | null
          designation: string | null
          email: string
          event_id: string
          full_name: string
          id: string
          linkedin_url: string | null
          phone: string | null
          qr_code: string | null
          registered_at: string
          registration_number: string
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          company?: string | null
          confirmed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          designation?: string | null
          email: string
          event_id: string
          full_name: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          qr_code?: string | null
          registered_at?: string
          registration_number: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          company?: string | null
          confirmed_at?: string | null
          created_at?: string
          custom_fields?: Json | null
          designation?: string | null
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          qr_code?: string | null
          registered_at?: string
          registration_number?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_claims: {
        Row: {
          claimed_at: string
          fulfilled: boolean | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          registration_id: string
          reward_id: string
        }
        Insert: {
          claimed_at?: string
          fulfilled?: boolean | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          registration_id: string
          reward_id: string
        }
        Update: {
          claimed_at?: string
          fulfilled?: boolean | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          registration_id?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          claimed_count: number | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          points_required: number
          quantity: number | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          claimed_count?: number | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          points_required?: number
          quantity?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          claimed_count?: number | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          points_required?: number
          quantity?: number | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      session_speakers: {
        Row: {
          id: string
          session_id: string
          speaker_id: string
        }
        Insert: {
          id?: string
          session_id: string
          speaker_id: string
        }
        Update: {
          id?: string
          session_id?: string
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_speakers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          event_id: string
          id: string
          location: string | null
          max_capacity: number | null
          sort_order: number | null
          start_time: string
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          location?: string | null
          max_capacity?: number | null
          sort_order?: number | null
          start_time: string
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          location?: string | null
          max_capacity?: number | null
          sort_order?: number | null
          start_time?: string
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          bio: string | null
          company: string | null
          created_at: string
          event_id: string
          id: string
          name: string
          photo_url: string | null
          social_links: Json | null
          sort_order: number | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          company?: string | null
          created_at?: string
          event_id: string
          id?: string
          name: string
          photo_url?: string | null
          social_links?: Json | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          company?: string | null
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          photo_url?: string | null
          social_links?: Json | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          created_at: string
          event_id: string
          id: string
          logo_url: string | null
          name: string
          sort_order: number | null
          tier: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          logo_url?: string | null
          name: string
          sort_order?: number | null
          tier?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          tier?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      auth_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_event_organizer: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "event_manager"
        | "staff"
        | "attendee"
        | "sales_rep"
      event_status: "draft" | "published" | "cancelled" | "completed"
      registration_status:
        | "pending"
        | "confirmed"
        | "waitlisted"
        | "cancelled"
        | "checked_in"
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
        "super_admin",
        "event_manager",
        "staff",
        "attendee",
        "sales_rep",
      ],
      event_status: ["draft", "published", "cancelled", "completed"],
      registration_status: [
        "pending",
        "confirmed",
        "waitlisted",
        "cancelled",
        "checked_in",
      ],
    },
  },
} as const
