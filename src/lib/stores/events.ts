import { writable, derived, get } from 'svelte/store'
import { db, realtime, handleSupabaseError } from '$lib/utils/supabase'
import { user } from '$lib/stores/auth'
import type { Database } from '$lib/types/database'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventUpdate = Database['public']['Tables']['events']['Update']
type EventAttendance = Database['public']['Tables']['event_attendance']['Row']

// Event stores
export const events = writable<Event[]>([])
export const featuredEvents = writable<Event[]>([])
export const userEvents = writable<Event[]>([])
export const currentEvent = writable<Event | null>(null)
export const loading = writable<boolean>(false)
export const error = writable<string | null>(null)

// Filters and search
export const searchQuery = writable<string>('')
export const filters = writable<{
  genres: string[]
  location: string
  dateRange: { start: string; end: string } | null
  priceRange: { min: number; max: number } | null
  status: string[]
}>({
  genres: [],
  location: '',
  dateRange: null,
  priceRange: null,
  status: ['published']
})

// Pagination
export const pagination = writable<{
  page: number
  limit: number
  total: number
  hasMore: boolean
}>({
  page: 1,
  limit: 12,
  total: 0,
  hasMore: false
})

// Real-time subscription
let eventsSubscription: any = null

// Derived stores
export const filteredEvents = derived(
  [events, searchQuery, filters],
  ([$events, $searchQuery, $filters]) => {
    let filtered = $events

    // Search filter
    if ($searchQuery.trim()) {
      const query = $searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location_name?.toLowerCase().includes(query) ||
        event.genres?.some(genre => genre.toLowerCase().includes(query))
      )
    }

    // Genre filter
    if ($filters.genres.length > 0) {
      filtered = filtered.filter(event =>
        event.genres?.some(genre => $filters.genres.includes(genre))
      )
    }

    // Location filter
    if ($filters.location.trim()) {
      filtered = filtered.filter(event =>
        event.location_name?.toLowerCase().includes($filters.location.toLowerCase())
      )
    }

    // Date range filter
    if ($filters.dateRange) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date_time)
        const startDate = new Date($filters.dateRange!.start)
        const endDate = new Date($filters.dateRange!.end)
        return eventDate >= startDate && eventDate <= endDate
      })
    }

    // Price range filter
    if ($filters.priceRange) {
      filtered = filtered.filter(event =>
        event.price >= $filters.priceRange!.min &&
        event.price <= $filters.priceRange!.max
      )
    }

    // Status filter
    if ($filters.status.length > 0) {
      filtered = filtered.filter(event =>
        $filters.status.includes(event.status)
      )
    }

    return filtered
  }
)

export const upcomingEvents = derived(
  events,
  ($events) => $events.filter(event => 
    new Date(event.date_time) > new Date() && event.status === 'published'
  ).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
)

export const pastEvents = derived(
  events,
  ($events) => $events.filter(event => 
    new Date(event.date_time) < new Date() && event.status === 'published'
  ).sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
)

export const myOrganizedEvents = derived(
  [userEvents, user],
  ([$userEvents, $user]) => {
    if (!$user) return []
    return $userEvents.filter(event => event.organizer_id === $user.id)
  }
)

// Event actions
export const eventActions = {
  // Load events with filters
  loadEvents: async (reset = true) => {
    loading.set(true)
    error.set(null)

    try {
      const currentFilters = get(filters)
      const currentPagination = get(pagination)
      
      const { data, error: dbError } = await db.events.list({
        status: currentFilters.status,
        genres: currentFilters.genres.length > 0 ? currentFilters.genres : undefined,
        location: currentFilters.location || undefined,
        dateFrom: currentFilters.dateRange?.start,
        dateTo: currentFilters.dateRange?.end,
        limit: currentPagination.limit,
        offset: reset ? 0 : (currentPagination.page - 1) * currentPagination.limit
      })

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      if (reset) {
        events.set(data || [])
        pagination.update(p => ({ ...p, page: 1 }))
      } else {
        events.update(current => [...current, ...(data || [])])
        pagination.update(p => ({ ...p, page: p.page + 1 }))
      }

      pagination.update(p => ({
        ...p,
        hasMore: (data?.length || 0) === currentPagination.limit
      }))

    } catch (err) {
      console.error('Load events error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      loading.set(false)
    }
  },

  // Load featured events
  loadFeaturedEvents: async () => {
    try {
      const { data, error: dbError } = await db.events.list({
        status: ['published'],
        limit: 6
      })

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      featuredEvents.set(data?.filter(event => event.featured) || [])
    } catch (err) {
      console.error('Load featured events error:', err)
    }
  },

  // Load user events (attending/organized)
  loadUserEvents: async () => {
    const currentUser = get(user)
    if (!currentUser) return

    try {
      // Load attended events
      const { data: attendanceData, error: attendanceError } = await db.attendance.getByUserId(currentUser.id)
      
      if (attendanceError) {
        throw new Error(handleSupabaseError(attendanceError))
      }

      // Load organized events
      const { data: organizedData, error: organizedError } = await db.events.list({
        status: ['draft', 'published', 'cancelled']
      })

      if (organizedError) {
        throw new Error(handleSupabaseError(organizedError))
      }

      const organizedEvents = organizedData?.filter(event => event.organizer_id === currentUser.id) || []
      const attendedEvents = attendanceData?.map(attendance => attendance.event).filter(Boolean) || []

      userEvents.set([...organizedEvents, ...attendedEvents])
    } catch (err) {
      console.error('Load user events error:', err)
    }
  },

  // Get event by ID
  getEvent: async (id: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: dbError } = await db.events.getById(id)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      currentEvent.set(data)
      return data
    } catch (err) {
      console.error('Get event error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to load event')
      return null
    } finally {
      loading.set(false)
    }
  },

  // Get event by slug
  getEventBySlug: async (slug: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: dbError } = await db.events.getBySlug(slug)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      currentEvent.set(data)
      return data
    } catch (err) {
      console.error('Get event by slug error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to load event')
      return null
    } finally {
      loading.set(false)
    }
  },

  // Create event
  createEvent: async (eventData: EventInsert) => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    loading.set(true)
    error.set(null)

    try {
      const { data, error: dbError } = await db.events.create({
        ...eventData,
        organizer_id: currentUser.id
      })

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      // Update local state
      events.update(current => [data, ...current])
      userEvents.update(current => [data, ...current])

      return data
    } catch (err) {
      console.error('Create event error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to create event')
      throw err
    } finally {
      loading.set(false)
    }
  },

  // Update event
  updateEvent: async (id: string, updates: EventUpdate) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: dbError } = await db.events.update(id, updates)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      // Update local state
      events.update(current => 
        current.map(event => event.id === id ? data : event)
      )
      userEvents.update(current => 
        current.map(event => event.id === id ? data : event)
      )
      
      if (get(currentEvent)?.id === id) {
        currentEvent.set(data)
      }

      return data
    } catch (err) {
      console.error('Update event error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to update event')
      throw err
    } finally {
      loading.set(false)
    }
  },

  // Delete event
  deleteEvent: async (id: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { error: dbError } = await db.events.delete(id)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      // Update local state
      events.update(current => current.filter(event => event.id !== id))
      userEvents.update(current => current.filter(event => event.id !== id))
      
      if (get(currentEvent)?.id === id) {
        currentEvent.set(null)
      }

      return true
    } catch (err) {
      console.error('Delete event error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to delete event')
      throw err
    } finally {
      loading.set(false)
    }
  },

  // Search events
  searchEvents: async (query: string) => {
    if (!query.trim()) {
      await eventActions.loadEvents()
      return
    }

    loading.set(true)
    error.set(null)

    try {
      const { data, error: dbError } = await db.events.search(query, 20)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      events.set(data || [])
    } catch (err) {
      console.error('Search events error:', err)
      error.set(err instanceof Error ? err.message : 'Failed to search events')
    } finally {
      loading.set(false)
    }
  },

  // Update attendance status
  updateAttendance: async (eventId: string, status: EventAttendance['status']) => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    try {
      const { data, error: dbError } = await db.attendance.updateStatus(currentUser.id, eventId, status)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      return data
    } catch (err) {
      console.error('Update attendance error:', err)
      throw err
    }
  },

  // Remove attendance
  removeAttendance: async (eventId: string) => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    try {
      const { error: dbError } = await db.attendance.remove(currentUser.id, eventId)

      if (dbError) {
        throw new Error(handleSupabaseError(dbError))
      }

      return true
    } catch (err) {
      console.error('Remove attendance error:', err)
      throw err
    }
  },

  // Record interaction
  recordInteraction: async (eventId: string, type: Database['public']['Tables']['event_interactions']['Row']['interaction_type'], metadata?: any) => {
    const currentUser = get(user)
    if (!currentUser) return

    try {
      const { data, error: dbError } = await db.interactions.create({
        event_id: eventId,
        user_id: currentUser.id,
        interaction_type: type,
        metadata
      })

      if (dbError) {
        console.error('Record interaction error:', dbError)
      }

      return data
    } catch (err) {
      console.error('Record interaction error:', err)
    }
  },

  // Subscribe to real-time updates
  subscribeToEvents: () => {
    if (eventsSubscription) {
      realtime.unsubscribe(eventsSubscription)
    }

    eventsSubscription = realtime.subscribeToEvents((payload) => {
      const { eventType, new: newEvent, old: oldEvent } = payload

      switch (eventType) {
        case 'INSERT':
          if (newEvent && newEvent.status === 'published') {
            events.update(current => [newEvent, ...current])
          }
          break

        case 'UPDATE':
          if (newEvent) {
            events.update(current => 
              current.map(event => event.id === newEvent.id ? newEvent : event)
            )
            
            if (get(currentEvent)?.id === newEvent.id) {
              currentEvent.set(newEvent)
            }
          }
          break

        case 'DELETE':
          if (oldEvent) {
            events.update(current => current.filter(event => event.id !== oldEvent.id))
            
            if (get(currentEvent)?.id === oldEvent.id) {
              currentEvent.set(null)
            }
          }
          break
      }
    })
  },

  // Unsubscribe from real-time updates
  unsubscribeFromEvents: () => {
    if (eventsSubscription) {
      realtime.unsubscribe(eventsSubscription)
      eventsSubscription = null
    }
  },

  // Update filters
  updateFilters: (newFilters: Partial<typeof filters>) => {
    filters.update(current => ({ ...current, ...newFilters }))
    eventActions.loadEvents(true) // Reload with new filters
  },

  // Update search query
  updateSearchQuery: (query: string) => {
    searchQuery.set(query)
    if (query.trim()) {
      eventActions.searchEvents(query)
    } else {
      eventActions.loadEvents(true)
    }
  },

  // Clear filters
  clearFilters: () => {
    filters.set({
      genres: [],
      location: '',
      dateRange: null,
      priceRange: null,
      status: ['published']
    })
    searchQuery.set('')
    eventActions.loadEvents(true)
  },

  // Clear error
  clearError: () => {
    error.set(null)
  }
}

// Auto-load events when user changes
user.subscribe(($user) => {
  if ($user) {
    eventActions.loadUserEvents()
  } else {
    userEvents.set([])
  }
})

// Popular genres derived from current events
export const popularGenres = derived(
  events,
  ($events) => {
    const genreCounts: Record<string, number> = {}
    
    $events.forEach(event => {
      event.genres?.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      })
    })

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }))
  }
)

// Event statistics
export const eventStats = derived(
  events,
  ($events) => ({
    total: $events.length,
    published: $events.filter(e => e.status === 'published').length,
    upcoming: $events.filter(e => new Date(e.date_time) > new Date()).length,
    free: $events.filter(e => e.price === 0).length,
    paid: $events.filter(e => e.price > 0).length
  })
)
