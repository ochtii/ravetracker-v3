// RaveTracker v3.0 - Generated Database Types
// =============================================
// TypeScript interfaces for all database tables and functions

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// ENUM TYPES
// =====================================================

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'postponed' | 'completed'
export type AttendanceStatus = 'interested' | 'going' | 'not_going' | 'maybe'
export type NotificationType = 'event_reminder' | 'event_update' | 'new_event' | 'system' | 'social'
export type VenueType = 'indoor' | 'outdoor' | 'online' | 'hybrid'

// =====================================================
// TABLE TYPES
// =====================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          username: string | null
          bio: string | null
          avatar_url: string | null
          birth_date: string | null
          website: string | null
          location: string | null
          favorite_genres: string[]
          location_city: string | null
          location_country: string | null
          social_links: Json
          is_organizer: boolean
          is_verified: boolean
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          website?: string | null
          location?: string | null
          favorite_genres?: string[]
          location_city?: string | null
          location_country?: string | null
          social_links?: Json
          is_organizer?: boolean
          is_verified?: boolean
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          website?: string | null
          location?: string | null
          favorite_genres?: string[]
          location_city?: string | null
          location_country?: string | null
          social_links?: Json
          is_organizer?: boolean
          is_verified?: boolean
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      event_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          slug: string | null
          date_time: string
          end_time: string | null
          timezone: string | null
          location_name: string | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          location_coordinates: unknown | null // PostGIS point
          venue_type: string | null
          price_min: number
          price_max: number | null
          currency: string
          capacity: number | null
          age_restriction: number | null
          genres: string[]
          tags: string[]
          lineup: string[]
          organizer_id: string
          category_id: string | null
          status: EventStatus
          is_featured: boolean
          is_private: boolean
          view_count: number
          like_count: number
          share_count: number
          going_count: number
          interested_count: number
          ticket_url: string | null
          website_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          cover_image_url: string | null
          images: string[]
          dress_code: string | null
          social_links: Json
          created_at: string
          updated_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          slug?: string | null
          date_time: string
          end_time?: string | null
          timezone?: string | null
          location_name?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_coordinates?: unknown | null
          venue_type?: string | null
          price_min?: number
          price_max?: number | null
          currency?: string
          capacity?: number | null
          age_restriction?: number | null
          genres?: string[]
          tags?: string[]
          lineup?: string[]
          organizer_id: string
          category_id?: string | null
          status?: EventStatus
          is_featured?: boolean
          is_private?: boolean
          view_count?: number
          like_count?: number
          share_count?: number
          going_count?: number
          interested_count?: number
          ticket_url?: string | null
          website_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          cover_image_url?: string | null
          images?: string[]
          dress_code?: string | null
          social_links?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          slug?: string | null
          date_time?: string
          end_time?: string | null
          timezone?: string | null
          location_name?: string | null
          location_address?: string | null
          location_city?: string | null
          location_country?: string | null
          location_coordinates?: unknown | null
          venue_type?: string | null
          price_min?: number
          price_max?: number | null
          currency?: string
          capacity?: number | null
          age_restriction?: number | null
          genres?: string[]
          tags?: string[]
          lineup?: string[]
          organizer_id?: string
          category_id?: string | null
          status?: EventStatus
          is_featured?: boolean
          is_private?: boolean
          view_count?: number
          like_count?: number
          share_count?: number
          going_count?: number
          interested_count?: number
          ticket_url?: string | null
          website_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          cover_image_url?: string | null
          images?: string[]
          dress_code?: string | null
          social_links?: Json
          created_at?: string
          updated_at?: string
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      event_attendance: {
        Row: {
          id: string
          user_id: string
          event_id: string
          status: AttendanceStatus
          notes: string | null
          notification_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          status?: AttendanceStatus
          notes?: string | null
          notification_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          status?: AttendanceStatus
          notes?: string | null
          notification_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          event_id: string | null
          title: string
          message: string | null
          type: NotificationType
          read: boolean
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id?: string | null
          title: string
          message?: string | null
          type?: NotificationType
          read?: boolean
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string | null
          title?: string
          message?: string | null
          type?: NotificationType
          read?: boolean
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          data?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
      event_images: {
        Row: {
          id: string
          event_id: string
          url: string
          alt_text: string | null
          caption: string | null
          width: number | null
          height: number | null
          file_size: number | null
          mime_type: string | null
          is_primary: boolean
          is_approved: boolean
          storage_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          url: string
          alt_text?: string | null
          caption?: string | null
          width?: number | null
          height?: number | null
          file_size?: number | null
          mime_type?: string | null
          is_primary?: boolean
          is_approved?: boolean
          storage_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          url?: string
          alt_text?: string | null
          caption?: string | null
          width?: number | null
          height?: number | null
          file_size?: number | null
          mime_type?: string | null
          is_primary?: boolean
          is_approved?: boolean
          storage_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      // Views can be added here if needed
    }
    Functions: {
      // Database function return types
      search_events: {
        Args: {
          search_query?: string
          category_filter?: string
          location_city_filter?: string
          location_country_filter?: string
          date_from?: string
          date_to?: string
          genres_filter?: string[]
          organizer_filter?: string
          status_filter?: EventStatus
          limit_count?: number
          offset_count?: number
        }
        Returns: Array<{
          id: string
          title: string
          description: string | null
          slug: string | null
          date_time: string
          end_time: string | null
          location_name: string | null
          location_city: string | null
          location_country: string | null
          price_min: number
          price_max: number | null
          currency: string
          capacity: number | null
          genres: string[]
          tags: string[]
          lineup: string[]
          organizer_id: string
          organizer_name: string | null
          category_id: string | null
          category_name: string | null
          status: EventStatus
          is_featured: boolean
          view_count: number
          like_count: number
          attendance_count: number
          primary_image_url: string | null
          created_at: string
        }>
      }
      get_event_details: {
        Args: {
          event_uuid: string
        }
        Returns: Array<{
          // Event details
          id: string
          title: string
          description: string | null
          slug: string | null
          date_time: string
          end_time: string | null
          timezone: string | null
          location_name: string | null
          location_address: string | null
          location_city: string | null
          location_country: string | null
          venue_type: string | null
          price_min: number
          price_max: number | null
          currency: string
          capacity: number | null
          age_restriction: number | null
          genres: string[]
          tags: string[]
          lineup: string[]
          status: EventStatus
          is_featured: boolean
          is_private: boolean
          view_count: number
          like_count: number
          share_count: number
          ticket_url: string | null
          website_url: string | null
          social_links: Json
          created_at: string
          updated_at: string
          published_at: string | null
          // Organizer details
          organizer_id: string
          organizer_username: string | null
          organizer_name: string | null
          organizer_bio: string | null
          organizer_avatar_url: string | null
          organizer_verified: boolean | null
          // Category details
          category_id: string | null
          category_name: string | null
          category_description: string | null
          category_icon: string | null
          category_color: string | null
          // Attendance stats
          total_attendance: number
          going_count: number
          interested_count: number
          maybe_count: number
          // User's attendance
          user_attendance_status: AttendanceStatus | null
          // Images
          images: Json
        }>
      }
      get_user_profile: {
        Args: {
          user_uuid: string
        }
        Returns: Array<{
          id: string
          user_id: string
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          birth_date: string | null
          age: number | null
          favorite_genres: string[]
          location_city: string | null
          location_country: string | null
          social_links: Json
          is_organizer: boolean
          is_verified: boolean
          is_private: boolean
          created_at: string
          updated_at: string
        }>
      }
      upsert_event_attendance: {
        Args: {
          event_uuid: string
          user_uuid: string
          attendance_status: AttendanceStatus
          attendance_notes?: string
        }
        Returns: string
      }
      get_user_events_attendance: {
        Args: {
          user_uuid: string
          attendance_filter?: AttendanceStatus
          limit_count?: number
          offset_count?: number
        }
        Returns: Array<{
          attendance_id: string
          event_id: string
          event_title: string
          event_date_time: string
          event_location_city: string | null
          event_primary_image: string | null
          attendance_status: AttendanceStatus
          attendance_created_at: string
        }>
      }
      create_notification: {
        Args: {
          user_uuid: string
          notification_title: string
          notification_message: string | null
          notification_type: NotificationType
          event_uuid?: string
          notification_data?: Json
          schedule_for?: string
        }
        Returns: string
      }
      mark_notifications_read: {
        Args: {
          user_uuid: string
          notification_ids?: string[]
        }
        Returns: number
      }
      get_user_notifications: {
        Args: {
          user_uuid: string
          unread_only?: boolean
          limit_count?: number
          offset_count?: number
        }
        Returns: Array<{
          id: string
          title: string
          message: string | null
          type: NotificationType
          read: boolean
          event_id: string | null
          event_title: string | null
          data: Json
          created_at: string
        }>
      }
      get_event_statistics: {
        Args: {
          event_uuid: string
        }
        Returns: Array<{
          total_views: number
          total_likes: number
          total_shares: number
          total_attendees: number
          going_count: number
          interested_count: number
          maybe_count: number
          not_going_count: number
          demographics: Json
          daily_views: Json
        }>
      }
      get_organizer_dashboard: {
        Args: {
          organizer_uuid: string
        }
        Returns: Array<{
          total_events: number
          published_events: number
          draft_events: number
          upcoming_events: number
          past_events: number
          total_attendees: number
          total_views: number
          recent_events: Json
        }>
      }
      increment_event_views: {
        Args: {
          event_uuid: string
        }
        Returns: void
      }
      cleanup_old_notifications: {
        Args: {}
        Returns: number
      }
      update_event_statuses: {
        Args: {}
        Returns: number
      }
      is_admin: {
        Args: {
          user_uuid?: string
        }
        Returns: boolean
      }
      is_event_organizer: {
        Args: {
          event_uuid: string
          user_uuid?: string
        }
        Returns: boolean
      }
      can_view_event: {
        Args: {
          event_uuid: string
          user_uuid?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      event_status: EventStatus
      attendance_status: AttendanceStatus
      notification_type: NotificationType
    }
    CompositeTypes: {
      // Composite types can be added here if needed
    }
  }
}

// =====================================================
// UTILITY TYPES FOR FRONTEND
// =====================================================

// Event with enriched data (as returned by search_events)
export type EventSummary = Database['public']['Functions']['search_events']['Returns'][0]

// Full event details (as returned by get_event_details)
export type EventDetails = Database['public']['Functions']['get_event_details']['Returns'][0]

// User profile with computed fields
export type UserProfile = Database['public']['Functions']['get_user_profile']['Returns'][0]

// User's event attendance
export type UserEventAttendance = Database['public']['Functions']['get_user_events_attendance']['Returns'][0]

// Notification with event info
export type UserNotification = Database['public']['Functions']['get_user_notifications']['Returns'][0]

// Event statistics
export type EventStatistics = Database['public']['Functions']['get_event_statistics']['Returns'][0]

// Organizer dashboard data
export type OrganizerDashboard = Database['public']['Functions']['get_organizer_dashboard']['Returns'][0]

// Table row types (direct database access)
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventCategory = Database['public']['Tables']['event_categories']['Row']
export type EventAttendance = Database['public']['Tables']['event_attendance']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type EventImage = Database['public']['Tables']['event_images']['Row']

// Insert types for creating new records
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventCategoryInsert = Database['public']['Tables']['event_categories']['Insert']
export type EventAttendanceInsert = Database['public']['Tables']['event_attendance']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type EventImageInsert = Database['public']['Tables']['event_images']['Insert']

// Update types for modifying existing records
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type EventCategoryUpdate = Database['public']['Tables']['event_categories']['Update']
export type EventAttendanceUpdate = Database['public']['Tables']['event_attendance']['Update']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type EventImageUpdate = Database['public']['Tables']['event_images']['Update']

// =====================================================
// SEARCH AND FILTER TYPES
// =====================================================

export interface EventSearchFilters {
  query?: string
  category?: string
  city?: string
  country?: string
  dateFrom?: string
  dateTo?: string
  genres?: string[]
  organizer?: string
  status?: EventStatus
  limit?: number
  offset?: number
}

export interface EventSearchResults {
  events: EventSummary[]
  total: number
  hasMore: boolean
}

// =====================================================
// FORM TYPES FOR FRONTEND
// =====================================================

export interface EventCreateForm {
  title: string
  description?: string
  dateTime: string
  endTime?: string
  timezone?: string
  locationName?: string
  locationAddress?: string
  locationCity?: string
  locationCountry?: string
  venueType?: VenueType
  priceMin?: number
  priceMax?: number
  currency?: string
  capacity?: number
  ageRestriction?: number
  genres: string[]
  tags: string[]
  lineup: string[]
  categoryId?: string
  isPrivate?: boolean
  ticketUrl?: string
  websiteUrl?: string
  socialLinks?: Record<string, string>
}

export interface ProfileUpdateForm {
  firstName?: string
  lastName?: string
  username?: string
  bio?: string
  avatarUrl?: string
  birthDate?: string
  favoriteGenres?: string[]
  locationCity?: string
  locationCountry?: string
  socialLinks?: Record<string, string>
  isPrivate?: boolean
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Note: Database type is already exported above as part of the interface declaration
