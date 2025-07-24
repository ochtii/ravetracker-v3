import { createClient } from '@supabase/supabase-js'
import type { Database, EventStatus, AttendanceStatus } from '$lib/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing')
  console.error('Please check your .env file and ensure both variables are set correctly.')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Check for dummy values
if (supabaseUrl.includes('dummy-project-id') || supabaseAnonKey.includes('dummy-anon-key')) {
  console.warn('⚠️  You are using dummy Supabase credentials!')
  console.warn('Please replace them with your actual Supabase project credentials.')
  console.warn('Visit https://supabase.com/dashboard to get your project URL and anon key.')
}

// Create Supabase client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'ravetracker-v3'
    }
  }
})

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signInWithProvider: async (provider: 'google' | 'github' | 'discord') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  },

  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    return { data, error }
  }
}

// Database helpers with type safety
export const db = {
  // Events
  events: {
    list: async (filters?: {
      status?: string[]
      genres?: string[]
      location?: string
      dateFrom?: string
      dateTo?: string
      limit?: number
      offset?: number
    }) => {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            is_verified
          ),
          attendance_count:event_attendance(count),
          going_count:event_attendance(count).eq(status, 'going'),
          interested_count:event_attendance(count).eq(status, 'interested')
        `)
        .order('date_time', { ascending: true })

      if (filters?.status?.length) {
        query = query.in('status', filters.status as EventStatus[])
      }

      if (filters?.genres?.length) {
        query = query.overlaps('genres', filters.genres)
      }

      if (filters?.location) {
        query = query.ilike('location_name', `%${filters.location}%`)
      }

      if (filters?.dateFrom) {
        query = query.gte('date_time', filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte('date_time', filters.dateTo)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      return query
    },

    getById: async (id: string) => {
      return supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('id', id)
        .single()
    },

    getBySlug: async (slug: string) => {
      return supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq('slug', slug)
        .single()
    },

    create: async (event: Database['public']['Tables']['events']['Insert']) => {
      return supabase
        .from('events')
        .insert(event)
        .select()
        .single()
    },

    update: async (id: string, updates: Database['public']['Tables']['events']['Update']) => {
      return supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    },

    delete: async (id: string) => {
      return supabase
        .from('events')
        .delete()
        .eq('id', id)
    },

    search: async (query: string, limit = 10) => {
      return supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%`)
        .eq('status', 'published')
        .limit(limit)
    }
  },

  // Profiles
  profiles: {
    getById: async (userId: string) => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
    },

    getByUsername: async (username: string) => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    },

    create: async (profile: Database['public']['Tables']['profiles']['Insert']) => {
      return supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()
    },

    update: async (userId: string, updates: Database['public']['Tables']['profiles']['Update']) => {
      return supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
    }
  },

  // Event Attendance
  attendance: {
    getByEventId: async (eventId: string) => {
      return supabase
        .from('event_attendance')
        .select(`
          *,
          user:profiles!event_attendance_user_id_fkey(
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
    },

    getByUserId: async (userId: string) => {
      return supabase
        .from('event_attendance')
        .select(`
          *,
          event:events(
            id,
            title,
            date_time,
            location_name,
            cover_image_url,
            status
          )
        `)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false })
    },

    getUserAttendanceForEvent: async (userId: string, eventId: string) => {
      return supabase
        .from('event_attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single()
    },

    updateStatus: async (userId: string, eventId: string, status: Database['public']['Tables']['event_attendance']['Row']['status']) => {
      return supabase
        .from('event_attendance')
        .upsert({
          user_id: userId,
          event_id: eventId,
          status,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    },

    remove: async (userId: string, eventId: string) => {
      return supabase
        .from('event_attendance')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId)
    }
  },

  // Event Interactions (would be created later)
  // interactions: {
  //   create: async (interaction: any) => {
  //     // Placeholder for future implementation
  //     return { data: null, error: new Error('Not implemented') }
  //   },
  //   getByEventId: async (eventId: string) => {
  //     return { data: [], error: null }
  //   },
  //   getUserInteractionForEvent: async (userId: string, eventId: string, type: any) => {
  //     return { data: null, error: null }
  //   }
  // },

  // Notifications
  notifications: {
    getByUserId: async (userId: string, limit = 20) => {
      return supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    },

    markAsRead: async (notificationId: string) => {
      return supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
    },

    markAllAsRead: async (userId: string) => {
      return supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    },

    create: async (notification: Database['public']['Tables']['notifications']['Insert']) => {
      return supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()
    }
  }
}

// Storage helpers
export const storage = {
  events: {
    uploadCover: async (eventId: string, file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${eventId}/cover.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('events')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) return { data: null, error }

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName)

      return { data: { path: data.path, publicUrl }, error: null }
    },

    uploadGallery: async (eventId: string, files: File[]) => {
      const uploads = await Promise.all(
        files.map(async (file, index) => {
          const fileExt = file.name.split('.').pop()
          const fileName = `${eventId}/gallery/${index}.${fileExt}`
          
          const { data, error } = await supabase.storage
            .from('events')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            })

          if (error) return { data: null, error }

          const { data: { publicUrl } } = supabase.storage
            .from('events')
            .getPublicUrl(fileName)

          return { data: { path: data.path, publicUrl }, error: null }
        })
      )

      const errors = uploads.filter(upload => upload.error)
      const successes = uploads.filter(upload => upload.data).map(upload => upload.data!.publicUrl)

      return {
        data: successes,
        errors: errors.length > 0 ? errors.map(e => e.error) : null
      }
    }
  },

  profiles: {
    uploadAvatar: async (userId: string, file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) return { data: null, error }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      return { data: { path: data.path, publicUrl }, error: null }
    },

    uploadBanner: async (userId: string, file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/banner.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) return { data: null, error }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      return { data: { path: data.path, publicUrl }, error: null }
    }
  }
}

// Real-time subscriptions
export const realtime = {
  subscribeToEvents: (callback: (payload: any) => void) => {
    return supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        callback
      )
      .subscribe()
  },

  subscribeToEventAttendance: (eventId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`attendance-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .subscribe()
  },

  subscribeToUserNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },

  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel)
  }
}

// Type exports for convenience
export type { Database } from '$lib/types/database'
export type SupabaseClient = typeof supabase

// Error handling helper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === '23505') {
    return 'This item already exists'
  }
  
  if (error?.code === '23503') {
    return 'Related item not found'
  }
  
  if (error?.code === '42501') {
    return 'Permission denied'
  }
  
  if (error?.code === 'PGRST116') {
    return 'Item not found'
  }
  
  return error?.message || 'An unexpected error occurred'
}
