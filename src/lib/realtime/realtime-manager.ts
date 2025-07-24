import { createClient } from '@supabase/supabase-js'
import type { 
  RealtimeChannel, 
  RealtimePostgresChangesPayload,
  RealtimePresenceState 
} from '@supabase/supabase-js'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent<T = any> {
  eventType: RealtimeEventType
  new: T | null
  old: T | null
  errors: string[] | null
  commit_timestamp: string
}

export interface EventSubscriptionPayload {
  id: string
  title: string
  date_time: string
  status: 'draft' | 'published' | 'cancelled'
  organizer_id: string
  capacity?: number
  price: number
  location_name?: string
  genres: string[]
}

export interface AttendanceSubscriptionPayload {
  id: string
  event_id: string
  user_id: string
  status: 'going' | 'interested' | 'not_going'
  registered_at: string
}

export interface NotificationSubscriptionPayload {
  id: string
  user_id: string
  type: 'event_reminder' | 'event_update' | 'admin_broadcast' | 'social'
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: Record<string, any>
}

export interface PresenceUser {
  user_id: string
  username?: string
  avatar_url?: string
  status: 'online' | 'away'
  last_seen: string
}

export class RealtimeManager {
  private client: any
  private channels: Map<string, RealtimeChannel> = new Map()
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private presenceState: Map<string, PresenceUser[]> = new Map()
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected'
  private retryAttempts = 0
  private maxRetries = 5
  private retryDelay = 1000
  private heartbeatInterval?: NodeJS.Timeout

  constructor(supabaseClient: any) {
    this.client = supabaseClient
    this.setupConnectionHandlers()
  }

  private setupConnectionHandlers() {
    // Monitor connection status
    this.client.realtime.onOpen(() => {
      this.connectionStatus = 'connected'
      this.retryAttempts = 0
      this.emit('connection:open', { status: 'connected' })
      this.startHeartbeat()
    })

    this.client.realtime.onClose(() => {
      this.connectionStatus = 'disconnected'
      this.emit('connection:close', { status: 'disconnected' })
      this.stopHeartbeat()
      this.handleReconnection()
    })

    this.client.realtime.onError((error: any) => {
      console.error('Realtime connection error:', error)
      this.emit('connection:error', { error })
    })
  }

  private async handleReconnection() {
    if (this.retryAttempts >= this.maxRetries) {
      console.error('Max reconnection attempts reached')
      this.emit('connection:failed', { attempts: this.retryAttempts })
      return
    }

    this.retryAttempts++
    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1) // Exponential backoff

    console.log(`Attempting to reconnect (${this.retryAttempts}/${this.maxRetries}) in ${delay}ms`)
    
    setTimeout(() => {
      this.connectionStatus = 'connecting'
      this.client.realtime.connect()
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionStatus === 'connected') {
        // Send heartbeat to maintain connection
        this.client.realtime.push({ type: 'heartbeat' })
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }

  // Event subscription for live event updates
  subscribeToEvents(filters: { organizer_id?: string } = {}) {
    const channelName = `events:${filters.organizer_id || 'all'}`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          ...(filters.organizer_id && { filter: `organizer_id=eq.${filters.organizer_id}` })
        },
        (payload: RealtimePostgresChangesPayload<EventSubscriptionPayload>) => {
          this.handleEventChange(payload)
        }
      )

    this.channels.set(channelName, channel)
    channel.subscribe((status) => {
      console.log(`Events subscription status: ${status}`)
      this.emit('subscription:events', { status, channelName })
    })

    return channel
  }

  // Attendance subscription for capacity and social proof
  subscribeToAttendance(eventId?: string) {
    const channelName = `attendance:${eventId || 'all'}`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          ...(eventId && { filter: `event_id=eq.${eventId}` })
        },
        (payload: RealtimePostgresChangesPayload<AttendanceSubscriptionPayload>) => {
          this.handleAttendanceChange(payload)
        }
      )

    this.channels.set(channelName, channel)
    channel.subscribe((status) => {
      console.log(`Attendance subscription status: ${status}`)
      this.emit('subscription:attendance', { status, channelName })
    })

    return channel
  }

  // Notifications subscription for current user
  subscribeToNotifications(userId: string) {
    const channelName = `notifications:${userId}`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: RealtimePostgresChangesPayload<NotificationSubscriptionPayload>) => {
          this.handleNotificationChange(payload)
        }
      )

    this.channels.set(channelName, channel)
    channel.subscribe((status) => {
      console.log(`Notifications subscription status: ${status}`)
      this.emit('subscription:notifications', { status, channelName })
    })

    return channel
  }

  // Admin broadcast channel for system-wide messages
  subscribeToAdminBroadcasts() {
    const channelName = 'admin:broadcasts'
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on('broadcast', { event: 'admin_message' }, (payload: any) => {
        this.handleAdminBroadcast(payload)
      })

    this.channels.set(channelName, channel)
    channel.subscribe((status) => {
      console.log(`Admin broadcasts subscription status: ${status}`)
      this.emit('subscription:admin', { status, channelName })
    })

    return channel
  }

  // Live event feed with presence tracking
  subscribeToEventPresence(eventId: string, userInfo: PresenceUser) {
    const channelName = `presence:event:${eventId}`
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        this.presenceState.set(channelName, this.transformPresenceState(state))
        this.emit('presence:sync', { 
          eventId, 
          users: this.presenceState.get(channelName) 
        })
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        this.emit('presence:join', { 
          eventId, 
          key, 
          users: newPresences 
        })
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        this.emit('presence:leave', { 
          eventId, 
          key, 
          users: leftPresences 
        })
      })

    this.channels.set(channelName, channel)
    
    channel.subscribe(async (status) => {
      console.log(`Event presence subscription status: ${status}`)
      if (status === 'SUBSCRIBED') {
        // Track user presence
        await channel.track(userInfo)
        this.emit('subscription:presence', { status, channelName, eventId })
      }
    })

    return channel
  }

  // Live event feed updates
  subscribeToLiveEventFeed() {
    const channelName = 'live:event-feed'
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!
    }

    const channel = this.client
      .channel(channelName)
      .on('broadcast', { event: 'live_update' }, (payload: any) => {
        this.handleLiveEventUpdate(payload)
      })
      .on('broadcast', { event: 'event_started' }, (payload: any) => {
        this.handleEventStarted(payload)
      })
      .on('broadcast', { event: 'event_ended' }, (payload: any) => {
        this.handleEventEnded(payload)
      })

    this.channels.set(channelName, channel)
    channel.subscribe((status) => {
      console.log(`Live event feed subscription status: ${status}`)
      this.emit('subscription:live-feed', { status, channelName })
    })

    return channel
  }

  // Event handlers
  private handleEventChange(payload: RealtimePostgresChangesPayload<EventSubscriptionPayload>) {
    const event: RealtimeEvent<EventSubscriptionPayload> = {
      eventType: payload.eventType as RealtimeEventType,
      new: payload.new,
      old: payload.old,
      errors: payload.errors,
      commit_timestamp: payload.commit_timestamp
    }

    this.emit('event:change', event)
    this.emit(`event:${payload.eventType.toLowerCase()}`, event)

    // Specific event type handlers
    if (payload.eventType === 'INSERT') {
      this.emit('event:created', event)
    } else if (payload.eventType === 'UPDATE') {
      this.emit('event:updated', event)
      
      // Check for status changes
      if (payload.old?.status !== payload.new?.status) {
        this.emit('event:status-changed', { 
          ...event, 
          oldStatus: payload.old?.status, 
          newStatus: payload.new?.status 
        })
      }

      // Check for capacity changes
      if (payload.old?.capacity !== payload.new?.capacity) {
        this.emit('event:capacity-changed', {
          ...event,
          oldCapacity: payload.old?.capacity,
          newCapacity: payload.new?.capacity
        })
      }
    } else if (payload.eventType === 'DELETE') {
      this.emit('event:deleted', event)
    }
  }

  private handleAttendanceChange(payload: RealtimePostgresChangesPayload<AttendanceSubscriptionPayload>) {
    const event: RealtimeEvent<AttendanceSubscriptionPayload> = {
      eventType: payload.eventType as RealtimeEventType,
      new: payload.new,
      old: payload.old,
      errors: payload.errors,
      commit_timestamp: payload.commit_timestamp
    }

    this.emit('attendance:change', event)
    this.emit(`attendance:${payload.eventType.toLowerCase()}`, event)

    // Status change detection
    if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
      this.emit('attendance:status-changed', {
        ...event,
        oldStatus: payload.old?.status,
        newStatus: payload.new?.status
      })
    }
  }

  private handleNotificationChange(payload: RealtimePostgresChangesPayload<NotificationSubscriptionPayload>) {
    const event: RealtimeEvent<NotificationSubscriptionPayload> = {
      eventType: payload.eventType as RealtimeEventType,
      new: payload.new,
      old: payload.old,
      errors: payload.errors,
      commit_timestamp: payload.commit_timestamp
    }

    this.emit('notification:new', event)
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted' && payload.new) {
      new Notification(payload.new.title, {
        body: payload.new.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }
  }

  private handleAdminBroadcast(payload: any) {
    this.emit('admin:broadcast', payload)
    
    // Handle different broadcast types
    switch (payload.type) {
      case 'system_maintenance':
        this.emit('admin:maintenance', payload)
        break
      case 'feature_announcement':
        this.emit('admin:announcement', payload)
        break
      case 'emergency_alert':
        this.emit('admin:emergency', payload)
        break
      default:
        this.emit('admin:general', payload)
    }
  }

  private handleLiveEventUpdate(payload: any) {
    this.emit('live:event-update', payload)
  }

  private handleEventStarted(payload: any) {
    this.emit('live:event-started', payload)
  }

  private handleEventEnded(payload: any) {
    this.emit('live:event-ended', payload)
  }

  private transformPresenceState(state: RealtimePresenceState): PresenceUser[] {
    return Object.values(state).flat() as PresenceUser[]
  }

  // Event emitter functionality
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.connectionStatus
  }

  getPresenceUsers(eventId: string): PresenceUser[] {
    return this.presenceState.get(`presence:event:${eventId}`) || []
  }

  isChannelSubscribed(channelName: string): boolean {
    return this.channels.has(channelName)
  }

  // Send admin broadcast (for admin users)
  async sendAdminBroadcast(message: {
    type: string
    title: string
    message: string
    priority?: 'low' | 'normal' | 'high' | 'critical'
    target_users?: string[]
  }) {
    const channel = this.channels.get('admin:broadcasts')
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'admin_message',
        payload: {
          ...message,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  // Send live event update
  async sendLiveEventUpdate(eventId: string, update: {
    type: 'status' | 'location' | 'time' | 'lineup' | 'announcement'
    message: string
    data?: any
  }) {
    const channel = this.channels.get('live:event-feed')
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'live_update',
        payload: {
          eventId,
          ...update,
          timestamp: new Date().toISOString()
        }
      })
    }
  }

  // Cleanup
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      channel.unsubscribe()
    })
    this.channels.clear()
    this.eventHandlers.clear()
    this.presenceState.clear()
    this.stopHeartbeat()
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission
    }
    return 'denied'
  }
}
