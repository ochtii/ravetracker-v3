export interface RealtimeConfig {
  // Connection settings
  reconnect: {
    enabled: boolean
    maxRetries: number
    baseDelay: number
    maxDelay: number
  }
  
  // Heartbeat settings
  heartbeat: {
    enabled: boolean
    interval: number
  }
  
  // Presence settings
  presence: {
    enabled: boolean
    trackActivity: boolean
    activityTimeout: number
  }
  
  // Notification settings
  notifications: {
    browser: boolean
    sound: boolean
    vibration: boolean
  }
  
  // Performance settings
  performance: {
    batchUpdates: boolean
    batchDelay: number
    maxChannels: number
  }
}

export const defaultRealtimeConfig: RealtimeConfig = {
  reconnect: {
    enabled: true,
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000
  },
  
  heartbeat: {
    enabled: true,
    interval: 30000
  },
  
  presence: {
    enabled: true,
    trackActivity: true,
    activityTimeout: 300000 // 5 minutes
  },
  
  notifications: {
    browser: true,
    sound: false,
    vibration: false
  },
  
  performance: {
    batchUpdates: true,
    batchDelay: 100,
    maxChannels: 50
  }
}

// Channel name builders
export const ChannelNames = {
  events: (organizerId?: string) => `events:${organizerId || 'all'}`,
  attendance: (eventId?: string) => `attendance:${eventId || 'all'}`,
  notifications: (userId: string) => `notifications:${userId}`,
  presence: (eventId: string) => `presence:event:${eventId}`,
  adminBroadcasts: () => 'admin:broadcasts',
  liveEventFeed: () => 'live:event-feed'
}

// Event type constants
export const RealtimeEvents = {
  CONNECTION: {
    OPEN: 'connection:open',
    CLOSE: 'connection:close',
    ERROR: 'connection:error',
    FAILED: 'connection:failed'
  },
  
  EVENTS: {
    CHANGE: 'event:change',
    INSERT: 'event:insert',
    UPDATE: 'event:update',
    DELETE: 'event:delete',
    CREATED: 'event:created',
    UPDATED: 'event:updated',
    DELETED: 'event:deleted',
    STATUS_CHANGED: 'event:status-changed',
    CAPACITY_CHANGED: 'event:capacity-changed'
  },
  
  ATTENDANCE: {
    CHANGE: 'attendance:change',
    INSERT: 'attendance:insert',
    UPDATE: 'attendance:update',
    DELETE: 'attendance:delete',
    STATUS_CHANGED: 'attendance:status-changed'
  },
  
  NOTIFICATIONS: {
    NEW: 'notification:new'
  },
  
  PRESENCE: {
    SYNC: 'presence:sync',
    JOIN: 'presence:join',
    LEAVE: 'presence:leave'
  },
  
  ADMIN: {
    BROADCAST: 'admin:broadcast',
    MAINTENANCE: 'admin:maintenance',
    ANNOUNCEMENT: 'admin:announcement',
    EMERGENCY: 'admin:emergency',
    GENERAL: 'admin:general'
  },
  
  LIVE: {
    EVENT_UPDATE: 'live:event-update',
    EVENT_STARTED: 'live:event-started',
    EVENT_ENDED: 'live:event-ended'
  },
  
  SUBSCRIPTION: {
    EVENTS: 'subscription:events',
    ATTENDANCE: 'subscription:attendance',
    NOTIFICATIONS: 'subscription:notifications',
    PRESENCE: 'subscription:presence',
    ADMIN: 'subscription:admin',
    LIVE_FEED: 'subscription:live-feed'
  }
}

// Rate limiting configuration
export const RateLimit = {
  BROADCAST: {
    maxPerMinute: 10,
    maxPerHour: 100
  },
  
  EVENT_UPDATE: {
    maxPerMinute: 20,
    maxPerEvent: 100
  },
  
  PRESENCE_UPDATE: {
    maxPerMinute: 60,
    debounceMs: 1000
  }
}

// Error codes
export const RealtimeErrors = {
  CONNECTION_FAILED: 'REALTIME_CONNECTION_FAILED',
  SUBSCRIPTION_FAILED: 'REALTIME_SUBSCRIPTION_FAILED',
  PERMISSION_DENIED: 'REALTIME_PERMISSION_DENIED',
  RATE_LIMITED: 'REALTIME_RATE_LIMITED',
  INVALID_PAYLOAD: 'REALTIME_INVALID_PAYLOAD',
  CHANNEL_FULL: 'REALTIME_CHANNEL_FULL'
}

// Message types for admin broadcasts
export const BroadcastTypes = {
  GENERAL: 'general',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  FEATURE_ANNOUNCEMENT: 'feature_announcement',
  EMERGENCY_ALERT: 'emergency_alert'
}

// Priority levels
export const Priority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const

// Live event update types
export const LiveUpdateTypes = {
  STATUS: 'status',
  LOCATION: 'location',
  TIME: 'time',
  LINEUP: 'lineup',
  ANNOUNCEMENT: 'announcement'
} as const
