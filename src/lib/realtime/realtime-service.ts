import { supabase } from '$lib/utils/supabase'
import { RealtimeManager } from './realtime-manager'
import { initializeRealtime } from './realtime-stores'
import type { User } from '@supabase/supabase-js'

let realtimeManager: RealtimeManager | null = null

export function initializeRealtimeSystem(user?: User | null) {
  if (realtimeManager) {
    // Already initialized, just update user context if needed
    return realtimeManager
  }

  // Create realtime manager
  realtimeManager = new RealtimeManager(supabase)
  
  // Initialize stores
  initializeRealtime(realtimeManager)

  // Setup user-specific subscriptions if user is logged in
  if (user) {
    setupUserSubscriptions(user)
  }

  // Setup global subscriptions
  setupGlobalSubscriptions()

  return realtimeManager
}

function setupUserSubscriptions(user: User) {
  if (!realtimeManager) return

  // Subscribe to personal notifications
  realtimeManager.subscribeToNotifications(user.id)

  // Subscribe to events organized by user
  realtimeManager.subscribeToEvents({ organizer_id: user.id })

  // Request notification permission
  realtimeManager.requestNotificationPermission()
}

function setupGlobalSubscriptions() {
  if (!realtimeManager) return

  // Subscribe to all events for global feed
  realtimeManager.subscribeToEvents()
  
  // Subscribe to all attendance changes for real-time updates
  realtimeManager.subscribeToAttendance()
  
  // Subscribe to admin broadcasts
  realtimeManager.subscribeToAdminBroadcasts()
  
  // Subscribe to live event feed
  realtimeManager.subscribeToLiveEventFeed()
}

export function subscribeToEvent(eventId: string, user?: User) {
  if (!realtimeManager) return

  // Subscribe to specific event attendance
  realtimeManager.subscribeToAttendance(eventId)

  // Subscribe to event presence if user is provided
  if (user) {
    const userInfo = {
      user_id: user.id,
      username: user.user_metadata?.username,
      avatar_url: user.user_metadata?.avatar_url,
      status: 'online' as const,
      last_seen: new Date().toISOString()
    }
    
    realtimeManager.subscribeToEventPresence(eventId, userInfo)
  }
}

export function unsubscribeFromEvent(eventId: string) {
  if (!realtimeManager) return

  realtimeManager.unsubscribe(`attendance:${eventId}`)
  realtimeManager.unsubscribe(`presence:event:${eventId}`)
}

export function sendAdminBroadcast(message: {
  type: string
  title: string
  message: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  target_users?: string[]
}) {
  if (!realtimeManager) return

  return realtimeManager.sendAdminBroadcast(message)
}

export function sendLiveEventUpdate(eventId: string, update: {
  type: 'status' | 'location' | 'time' | 'lineup' | 'announcement'
  message: string
  data?: any
}) {
  if (!realtimeManager) return

  return realtimeManager.sendLiveEventUpdate(eventId, update)
}

export function getRealtimeManager() {
  return realtimeManager
}

export function cleanupRealtime() {
  if (realtimeManager) {
    realtimeManager.unsubscribeAll()
    realtimeManager = null
  }
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupRealtime)
}
