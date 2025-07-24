// Enhanced Database Utilities with Error Handling, Caching, and Optimizations
// ===========================================================================

import { supabase } from './supabase'
import type { Database } from '$lib/types/database'
import { get, writable } from 'svelte/store'
import { browser } from '$app/environment'

// Types
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']

export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface QueryOptions {
  useCache?: boolean
  cacheTime?: number // in milliseconds
  retries?: number
  optimistic?: boolean
}

export interface PaginationOptions {
  page: number
  limit: number
  orderBy?: string
  ascending?: boolean
}

// Cache Management
class DatabaseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private maxSize = 100

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 minutes default
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

const dbCache = new DatabaseCache()

// Error Handling
export function handleDatabaseError(error: any): DatabaseError {
  console.error('Database error:', error)
  
  // Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          details: error.details
        }
      case 'PGRST301':
        return {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action.',
          details: error.details
        }
      case '23505':
        return {
          code: 'DUPLICATE_ERROR',
          message: 'This record already exists.',
          details: error.details
        }
      case '23503':
        return {
          code: 'FOREIGN_KEY_ERROR',
          message: 'This action would violate data integrity rules.',
          details: error.details
        }
      default:
        return {
          code: error.code,
          message: error.message || 'An unexpected database error occurred.',
          details: error.details,
          hint: error.hint
        }
    }
  }
  
  // Network errors
  if (error?.name === 'NetworkError' || !navigator.onLine) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your internet connection.'
    }
  }
  
  // Generic errors
  return {
    code: 'UNKNOWN_ERROR',
    message: error?.message || 'An unexpected error occurred.'
  }
}

// Retry mechanism
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return withRetry(operation, retries - 1, delay * 2)
    }
    throw error
  }
}

function shouldRetry(error: any): boolean {
  // Retry on network errors or 5xx server errors
  return (
    error?.name === 'NetworkError' ||
    error?.status >= 500 ||
    !navigator.onLine
  )
}

// Database Operations
export const db = {
  // Profile Operations
  profiles: {
    async get(userId: string, options: QueryOptions = {}): Promise<{ data: any; error: DatabaseError | null }> {
      const cacheKey = `profile:${userId}`
      
      if (options.useCache !== false) {
        const cached = dbCache.get(cacheKey)
        if (cached) return { data: cached, error: null }
      }

      try {
        const result = await withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
          
          if (error) throw error
          return data
        }, options.retries)

        if (options.useCache !== false) {
          dbCache.set(cacheKey, result, options.cacheTime)
        }

        return { data: result, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async create(profile: Tables['profiles']['Insert']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const result = await withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .insert(profile)
            .select()
            .single()
          
          if (error) throw error
          return data
        })

        // Invalidate cache
        dbCache.invalidate('profile')
        
        return { data: result, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async update(userId: string, updates: Tables['profiles']['Update']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const result = await withRetry(async () => {
          const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single()
          
          if (error) throw error
          return data
        })

        // Update cache
        const cacheKey = `profile:${userId}`
        dbCache.set(cacheKey, result)
        
        return { data: result, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async uploadAvatar(userId: string, file: File): Promise<{ data: string; error: DatabaseError | null }> {
      try {
        // Upload file
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/avatar.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, file, { 
            cacheControl: '3600', 
            upsert: true 
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName)

        // Update profile
        const { error: updateError } = await this.update(userId, { 
          avatar_url: publicUrl 
        })

        if (updateError) throw new Error(updateError.message)

        return { data: publicUrl, error: null }
      } catch (error) {
        return { data: '', error: handleDatabaseError(error) }
      }
    }
  },

  // Event Operations
  events: {
    async list(options: {
      pagination?: PaginationOptions
      filters?: {
        status?: string[]
        genres?: string[]
        location?: string
        dateFrom?: string
        dateTo?: string
        organizer?: string
      }
      cache?: QueryOptions
    } = {}): Promise<{ data: any[]; error: DatabaseError | null; count?: number }> {
      const { pagination, filters, cache = {} } = options
      const cacheKey = `events:${JSON.stringify({ pagination, filters })}`
      
      if (cache.useCache !== false) {
        const cached = dbCache.get(cacheKey)
        if (cached) return { data: cached.data, error: null, count: cached.count }
      }

      try {
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
            category:event_categories(
              id,
              name,
              color,
              icon
            )
          `, { count: 'exact' })

        // Apply filters
        if (filters?.status?.length) {
          query = query.in('status', filters.status)
        }
        
        if (filters?.genres?.length) {
          query = query.overlaps('genres', filters.genres)
        }
        
        if (filters?.location) {
          query = query.or(`location_city.ilike.%${filters.location}%,location_country.ilike.%${filters.location}%`)
        }
        
        if (filters?.dateFrom) {
          query = query.gte('date_time', filters.dateFrom)
        }
        
        if (filters?.dateTo) {
          query = query.lte('date_time', filters.dateTo)
        }
        
        if (filters?.organizer) {
          query = query.eq('organizer_id', filters.organizer)
        }

        // Apply pagination
        if (pagination) {
          const from = (pagination.page - 1) * pagination.limit
          const to = from + pagination.limit - 1
          query = query.range(from, to)
          
          if (pagination.orderBy) {
            query = query.order(pagination.orderBy, { 
              ascending: pagination.ascending ?? false 
            })
          }
        }

        const { data, error, count } = await withRetry(() => query, cache.retries)
        
        if (error) throw error

        const result = { data: data || [], count: count || 0 }
        
        if (cache.useCache !== false) {
          dbCache.set(cacheKey, result, cache.cacheTime)
        }

        return { data: result.data, error: null, count: result.count }
      } catch (error) {
        return { data: [], error: handleDatabaseError(error) }
      }
    },

    async get(id: string, options: QueryOptions = {}): Promise<{ data: any; error: DatabaseError | null }> {
      const cacheKey = `event:${id}`
      
      if (options.useCache !== false) {
        const cached = dbCache.get(cacheKey)
        if (cached) return { data: cached, error: null }
      }

      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('events')
            .select(`
              *,
              organizer:profiles!events_organizer_id_fkey(
                id,
                first_name,
                last_name,
                username,
                avatar_url,
                is_verified,
                is_organizer
              ),
              category:event_categories(
                id,
                name,
                color,
                icon,
                description
              ),
              attendance_count:event_attendance(count),
              attendance:event_attendance(
                id,
                user_id,
                status,
                registered_at
              )
            `)
            .eq('id', id)
            .single()
        }, options.retries)

        if (error) throw error

        if (options.useCache !== false) {
          dbCache.set(cacheKey, data, options.cacheTime)
        }

        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async create(event: Tables['events']['Insert']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('events')
            .insert(event)
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
            .single()
        })

        if (error) throw error

        // Invalidate events cache
        dbCache.invalidate('events')
        
        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async update(id: string, updates: Tables['events']['Update']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('events')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
        })

        if (error) throw error

        // Update cache
        const cacheKey = `event:${id}`
        dbCache.set(cacheKey, data)
        dbCache.invalidate('events')
        
        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async delete(id: string): Promise<{ error: DatabaseError | null }> {
      try {
        const { error } = await withRetry(async () => {
          return await supabase
            .from('events')
            .delete()
            .eq('id', id)
        })

        if (error) throw error

        // Invalidate cache
        dbCache.invalidate('event')
        
        return { error: null }
      } catch (error) {
        return { error: handleDatabaseError(error) }
      }
    },

    async incrementViewCount(id: string): Promise<{ error: DatabaseError | null }> {
      try {
        const { error } = await supabase.rpc('increment_event_views', { event_id: id })
        
        if (error) throw error

        // Invalidate cache for this event
        dbCache.invalidate(`event:${id}`)
        
        return { error: null }
      } catch (error) {
        return { error: handleDatabaseError(error) }
      }
    }
  },

  // Event Attendance Operations
  attendance: {
    async getByUserId(userId: string): Promise<{ data: any[]; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
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
        })

        if (error) throw error

        return { data: data || [], error: null }
      } catch (error) {
        return { data: [], error: handleDatabaseError(error) }
      }
    },

    async getByEventId(eventId: string): Promise<{ data: any[]; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('event_attendance')
            .select(`
              *,
              profile:profiles!event_attendance_user_id_fkey(
                id,
                first_name,
                last_name,
                username,
                avatar_url
              )
            `)
            .eq('event_id', eventId)
            .order('registered_at', { ascending: false })
        })

        if (error) throw error

        return { data: data || [], error: null }
      } catch (error) {
        return { data: [], error: handleDatabaseError(error) }
      }
    },

    async create(attendance: Tables['event_attendance']['Insert']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('event_attendance')
            .insert(attendance)
            .select()
            .single()
        })

        if (error) throw error

        // Invalidate related caches
        dbCache.invalidate(`event:${attendance.event_id}`)
        
        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async update(userId: string, eventId: string, updates: Tables['event_attendance']['Update']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('event_attendance')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .select()
            .single()
        })

        if (error) throw error

        // Invalidate related caches
        dbCache.invalidate(`event:${eventId}`)
        
        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async delete(userId: string, eventId: string): Promise<{ error: DatabaseError | null }> {
      try {
        const { error } = await withRetry(async () => {
          return await supabase
            .from('event_attendance')
            .delete()
            .eq('user_id', userId)
            .eq('event_id', eventId)
        })

        if (error) throw error

        // Invalidate related caches
        dbCache.invalidate(`event:${eventId}`)
        
        return { error: null }
      } catch (error) {
        return { error: handleDatabaseError(error) }
      }
    },

    async getUserAttendanceForEvent(userId: string, eventId: string): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('event_attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .maybeSingle()
        })

        if (error) throw error

        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    }
  },

  // Notification Operations
  notifications: {
    async getByUserId(userId: string, limit = 20): Promise<{ data: any[]; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('notifications')
            .select(`
              *,
              event:events(
                id,
                title,
                date_time,
                location_name
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
        })

        if (error) throw error

        return { data: data || [], error: null }
      } catch (error) {
        return { data: [], error: handleDatabaseError(error) }
      }
    },

    async create(notification: Tables['notifications']['Insert']): Promise<{ data: any; error: DatabaseError | null }> {
      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single()
        })

        if (error) throw error

        return { data, error: null }
      } catch (error) {
        return { data: null, error: handleDatabaseError(error) }
      }
    },

    async markAsRead(id: string): Promise<{ error: DatabaseError | null }> {
      try {
        const { error } = await withRetry(async () => {
          return await supabase
            .from('notifications')
            .update({ 
              read: true, 
              read_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        })

        if (error) throw error

        return { error: null }
      } catch (error) {
        return { error: handleDatabaseError(error) }
      }
    },

    async markAllAsRead(userId: string): Promise<{ error: DatabaseError | null }> {
      try {
        const { error } = await withRetry(async () => {
          return await supabase
            .from('notifications')
            .update({ 
              read: true, 
              read_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('read', false)
        })

        if (error) throw error

        return { error: null }
      } catch (error) {
        return { error: handleDatabaseError(error) }
      }
    },

    async getUnreadCount(userId: string): Promise<{ data: number; error: DatabaseError | null }> {
      try {
        const { count, error } = await withRetry(async () => {
          return await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false)
        })

        if (error) throw error

        return { data: count || 0, error: null }
      } catch (error) {
        return { data: 0, error: handleDatabaseError(error) }
      }
    }
  },

  // Event Categories
  categories: {
    async list(): Promise<{ data: any[]; error: DatabaseError | null }> {
      const cacheKey = 'categories:all'
      const cached = dbCache.get(cacheKey)
      
      if (cached) return { data: cached, error: null }

      try {
        const { data, error } = await withRetry(async () => {
          return await supabase
            .from('event_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order')
        })

        if (error) throw error

        dbCache.set(cacheKey, data || [], 10 * 60 * 1000) // 10 minutes cache

        return { data: data || [], error: null }
      } catch (error) {
        return { data: [], error: handleDatabaseError(error) }
      }
    }
  },

  // Utility functions
  utils: {
    clearCache: () => dbCache.clear(),
    invalidateCache: (pattern?: string) => dbCache.invalidate(pattern),
    
    async healthCheck(): Promise<{ healthy: boolean; error?: DatabaseError }> {
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          
        if (error) throw error
        
        return { healthy: true }
      } catch (error) {
        return { 
          healthy: false, 
          error: handleDatabaseError(error) 
        }
      }
    }
  }
}

// Offline Support
export const offlineStore = writable<boolean>(browser ? !navigator.onLine : false)

if (browser) {
  window.addEventListener('online', () => offlineStore.set(false))
  window.addEventListener('offline', () => offlineStore.set(true))
}

// Connection monitoring
export const connectionStore = writable<'connected' | 'connecting' | 'disconnected'>('connected')

// Auto-retry failed operations when back online
if (browser) {
  window.addEventListener('online', () => {
    connectionStore.set('connected')
    // Could implement queue of failed operations to retry here
  })
}
