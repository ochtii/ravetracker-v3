import { writable, derived, type Readable } from 'svelte/store'
import type { RealtimeManager, RealtimeEvent, EventSubscriptionPayload, AttendanceSubscriptionPayload, NotificationSubscriptionPayload, PresenceUser } from './realtime-manager'

// Connection status store
export const connectionStatus = writable<'connecting' | 'connected' | 'disconnected'>('disconnected')

// Events store
export const realtimeEvents = writable<Map<string, EventSubscriptionPayload>>(new Map())

// Attendance store with event aggregation
export const eventAttendance = writable<Map<string, AttendanceSubscriptionPayload[]>>(new Map())

// Notifications store
export const notifications = writable<NotificationSubscriptionPayload[]>([])

// Unread notifications count
export const unreadNotificationsCount = derived(
  notifications,
  ($notifications) => $notifications.filter(n => !n.read).length
)

// Presence store for live events
export const eventPresence = writable<Map<string, PresenceUser[]>>(new Map())

// Live event feed
export const liveEventFeed = writable<Array<{
  id: string
  type: 'status' | 'location' | 'time' | 'lineup' | 'announcement'
  eventId: string
  message: string
  timestamp: string
  data?: any
}>>([])

// Admin broadcasts
export const adminBroadcasts = writable<Array<{
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  timestamp: string
}>>([])

// Event capacity tracking
export const eventCapacities = writable<Map<string, {
  current: number
  capacity?: number
  percentage: number
  waitlist?: number
}>>(new Map())

// Realtime manager instance
let realtimeManager: RealtimeManager | null = null

export function initializeRealtime(manager: RealtimeManager) {
  realtimeManager = manager
  setupEventHandlers(manager)
}

function setupEventHandlers(manager: RealtimeManager) {
  // Connection status handlers
  manager.on('connection:open', () => {
    connectionStatus.set('connected')
  })

  manager.on('connection:close', () => {
    connectionStatus.set('disconnected')
  })

  manager.on('connection:error', (data) => {
    console.error('Realtime connection error:', data.error)
    connectionStatus.set('disconnected')
  })

  manager.on('connection:failed', () => {
    connectionStatus.set('disconnected')
  })

  // Event change handlers
  manager.on('event:change', (event: RealtimeEvent<EventSubscriptionPayload>) => {
    realtimeEvents.update(events => {
      const newEvents = new Map(events)
      
      if (event.eventType === 'DELETE' && event.old) {
        newEvents.delete(event.old.id)
      } else if (event.new) {
        newEvents.set(event.new.id, event.new)
      }
      
      return newEvents
    })
  })

  manager.on('event:status-changed', (data) => {
    // Handle event status changes (published, cancelled, etc.)
    const { new: newEvent, oldStatus, newStatus } = data
    
    if (newEvent) {
      // Add to live feed
      liveEventFeed.update(feed => {
        const update = {
          id: `status-${newEvent.id}-${Date.now()}`,
          type: 'status' as const,
          eventId: newEvent.id,
          message: `Event status changed from ${oldStatus} to ${newStatus}`,
          timestamp: new Date().toISOString(),
          data: { oldStatus, newStatus }
        }
        return [update, ...feed].slice(0, 50) // Keep last 50 updates
      })
    }
  })

  manager.on('event:capacity-changed', (data) => {
    const { new: newEvent, oldCapacity, newCapacity } = data
    
    if (newEvent) {
      liveEventFeed.update(feed => {
        const update = {
          id: `capacity-${newEvent.id}-${Date.now()}`,
          type: 'announcement' as const,
          eventId: newEvent.id,
          message: `Event capacity updated from ${oldCapacity || 'unlimited'} to ${newCapacity || 'unlimited'}`,
          timestamp: new Date().toISOString(),
          data: { oldCapacity, newCapacity }
        }
        return [update, ...feed].slice(0, 50)
      })
    }
  })

  // Attendance change handlers
  manager.on('attendance:change', (event: RealtimeEvent<AttendanceSubscriptionPayload>) => {
    eventAttendance.update(attendance => {
      const newAttendance = new Map(attendance)
      
      if (event.new) {
        const eventId = event.new.event_id
        const eventAttendees = newAttendance.get(eventId) || []
        
        if (event.eventType === 'INSERT') {
          newAttendance.set(eventId, [...eventAttendees, event.new])
        } else if (event.eventType === 'UPDATE') {
          const updatedAttendees = eventAttendees.map(a => 
            a.id === event.new!.id ? event.new! : a
          )
          newAttendance.set(eventId, updatedAttendees)
        } else if (event.eventType === 'DELETE' && event.old) {
          const filteredAttendees = eventAttendees.filter(a => a.id !== event.old!.id)
          newAttendance.set(eventId, filteredAttendees)
        }
      }
      
      return newAttendance
    })

    // Update capacity tracking
    if (event.new) {
      updateEventCapacity(event.new.event_id)
    }
  })

  manager.on('attendance:status-changed', (data) => {
    const { new: newAttendance, oldStatus, newStatus } = data
    
    if (newAttendance) {
      // Update capacity when someone changes from interested to going
      updateEventCapacity(newAttendance.event_id)
      
      // Add to live feed for significant changes
      if ((oldStatus === 'interested' && newStatus === 'going') || 
          (oldStatus === 'going' && newStatus === 'not_going')) {
        liveEventFeed.update(feed => {
          const update = {
            id: `attendance-${newAttendance.id}-${Date.now()}`,
            type: 'status' as const,
            eventId: newAttendance.event_id,
            message: `Attendance status changed: ${oldStatus} → ${newStatus}`,
            timestamp: new Date().toISOString(),
            data: { userId: newAttendance.user_id, oldStatus, newStatus }
          }
          return [update, ...feed].slice(0, 50)
        })
      }
    }
  })

  // Notification handlers
  manager.on('notification:new', (event: RealtimeEvent<NotificationSubscriptionPayload>) => {
    if (event.new) {
      notifications.update(notifs => [event.new!, ...notifs])
    }
  })

  // Presence handlers
  manager.on('presence:sync', (data) => {
    const { eventId, users } = data
    eventPresence.update(presence => {
      const newPresence = new Map(presence)
      newPresence.set(eventId, users)
      return newPresence
    })
  })

  manager.on('presence:join', (data) => {
    const { eventId, users } = data
    eventPresence.update(presence => {
      const newPresence = new Map(presence)
      const currentUsers = newPresence.get(eventId) || []
      const updatedUsers = [...currentUsers, ...users]
      newPresence.set(eventId, updatedUsers)
      return newPresence
    })
  })

  manager.on('presence:leave', (data) => {
    const { eventId, key, users } = data
    eventPresence.update(presence => {
      const newPresence = new Map(presence)
      const currentUsers = newPresence.get(eventId) || []
      const updatedUsers = currentUsers.filter(user => 
        !users.some((leftUser: PresenceUser) => leftUser.user_id === user.user_id)
      )
      newPresence.set(eventId, updatedUsers)
      return newPresence
    })
  })

  // Admin broadcast handlers
  manager.on('admin:broadcast', (data) => {
    adminBroadcasts.update(broadcasts => {
      const broadcast = {
        id: `admin-${Date.now()}`,
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      }
      return [broadcast, ...broadcasts].slice(0, 20) // Keep last 20 broadcasts
    })
  })

  // Live event feed handlers
  manager.on('live:event-update', (data) => {
    liveEventFeed.update(feed => {
      const update = {
        id: `live-${data.eventId}-${Date.now()}`,
        ...data
      }
      return [update, ...feed].slice(0, 50)
    })
  })

  manager.on('live:event-started', (data) => {
    liveEventFeed.update(feed => {
      const update = {
        id: `started-${data.eventId}-${Date.now()}`,
        type: 'status' as const,
        eventId: data.eventId,
        message: 'Event has started! 🎉',
        timestamp: new Date().toISOString(),
        data
      }
      return [update, ...feed].slice(0, 50)
    })
  })

  manager.on('live:event-ended', (data) => {
    liveEventFeed.update(feed => {
      const update = {
        id: `ended-${data.eventId}-${Date.now()}`,
        type: 'status' as const,
        eventId: data.eventId,
        message: 'Event has ended. Thanks for joining! 👏',
        timestamp: new Date().toISOString(),
        data
      }
      return [update, ...feed].slice(0, 50)
    })
  })
}

// Helper function to update event capacity
async function updateEventCapacity(eventId: string) {
  if (!realtimeManager) return

  try {
    // Get current attendance count
    let currentAttendance: AttendanceSubscriptionPayload[] = []
    eventAttendance.subscribe(attendance => {
      currentAttendance = attendance.get(eventId) || []
    })()

    const goingCount = currentAttendance.filter(a => a.status === 'going').length
    const interestedCount = currentAttendance.filter(a => a.status === 'interested').length

    // Get event capacity from events store
    let eventCapacity: number | undefined
    realtimeEvents.subscribe(events => {
      const event = events.get(eventId)
      eventCapacity = event?.capacity
    })()

    const percentage = eventCapacity ? (goingCount / eventCapacity) * 100 : 0

    eventCapacities.update(capacities => {
      const newCapacities = new Map(capacities)
      newCapacities.set(eventId, {
        current: goingCount,
        capacity: eventCapacity,
        percentage,
        waitlist: interestedCount
      })
      return newCapacities
    })
  } catch (error) {
    console.error('Error updating event capacity:', error)
  }
}

// Store actions
export const realtimeActions = {
  // Mark notification as read
  markNotificationRead: (notificationId: string) => {
    notifications.update(notifs => 
      notifs.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  },

  // Clear all notifications
  clearAllNotifications: () => {
    notifications.set([])
  },

  // Clear live event feed
  clearLiveEventFeed: () => {
    liveEventFeed.set([])
  },

  // Clear admin broadcasts
  clearAdminBroadcasts: () => {
    adminBroadcasts.set([])
  },

  // Get event attendance count
  getEventAttendanceCount: (eventId: string): { going: number; interested: number; total: number } => {
    let attendance: AttendanceSubscriptionPayload[] = []
    eventAttendance.subscribe(attendanceMap => {
      attendance = attendanceMap.get(eventId) || []
    })()

    const going = attendance.filter(a => a.status === 'going').length
    const interested = attendance.filter(a => a.status === 'interested').length

    return {
      going,
      interested,
      total: going + interested
    }
  },

  // Get event capacity info
  getEventCapacityInfo: (eventId: string) => {
    let capacityInfo: any = null
    eventCapacities.subscribe(capacities => {
      capacityInfo = capacities.get(eventId)
    })()
    return capacityInfo
  },

  // Get presence users for event
  getEventPresenceUsers: (eventId: string): PresenceUser[] => {
    let users: PresenceUser[] = []
    eventPresence.subscribe(presence => {
      users = presence.get(eventId) || []
    })()
    return users
  }
}

// Derived stores for specific use cases
export const criticalBroadcasts = derived(
  adminBroadcasts,
  ($broadcasts) => $broadcasts.filter(b => b.priority === 'critical')
)

export const recentLiveUpdates = derived(
  liveEventFeed,
  ($feed) => $feed.slice(0, 10) // Last 10 updates
)

export const onlineEventUsers = derived(
  eventPresence,
  ($presence) => {
    const allUsers = Array.from($presence.values()).flat()
    return allUsers.filter(user => user.status === 'online')
  }
)

// Connection health derived store
export const connectionHealth = derived(
  connectionStatus,
  ($status) => ({
    isConnected: $status === 'connected',
    isConnecting: $status === 'connecting',
    isDisconnected: $status === 'disconnected',
    statusText: $status.charAt(0).toUpperCase() + $status.slice(1)
  })
)
