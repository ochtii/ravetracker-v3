/**
 * RaveTracker v3.0 - Mobile PWA Service Worker
 * ============================================
 * Advanced offline capabilities, background sync, and push notifications
 */

const CACHE_VERSION = 'ravetracker-v3-mobile-1.0.0'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const API_CACHE = `${CACHE_VERSION}-api`
const IMAGE_CACHE = `${CACHE_VERSION}-images`

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/app.html',
  '/app.css',
  '/app.js',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  '/offline.html'
]

// API endpoints with different caching strategies
const API_PATTERNS = {
  invite: {
    pattern: /\/api\/invites/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50
  },
  user: {
    pattern: /\/api\/user/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 15 * 60 * 1000, // 15 minutes
    maxEntries: 10
  },
  auth: {
    pattern: /\/api\/auth/,
    strategy: CACHE_STRATEGIES.NETWORK_ONLY,
    maxAge: 0,
    maxEntries: 0
  }
}

// Background sync queues
const SYNC_QUEUES = {
  INVITE_ACTIONS: 'invite-actions',
  USER_UPDATES: 'user-updates',
  ANALYTICS: 'analytics'
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('ravetracker-v3') && 
                     !cacheName.includes(CACHE_VERSION)
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
  } else {
    event.respondWith(handleNavigationRequest(request))
  }
})

// API request handler with different strategies
async function handleApiRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // Find matching API pattern
  const apiConfig = Object.values(API_PATTERNS).find(config => 
    config.pattern.test(pathname)
  )
  
  if (!apiConfig) {
    return fetch(request)
  }

  switch (apiConfig.strategy) {
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, API_CACHE, apiConfig)
    
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, API_CACHE, apiConfig)
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, API_CACHE, apiConfig)
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request)
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request)
    
    default:
      return fetch(request)
  }
}

// Image request handler
async function handleImageRequest(request) {
  return cacheFirst(request, IMAGE_CACHE, {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100
  })
}

// Static asset handler
async function handleStaticRequest(request) {
  return cacheFirst(request, STATIC_CACHE, {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 200
  })
}

// Navigation request handler (SPA fallback)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache or offline page
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html')
    }
    
    throw error
  }
}

// Cache strategies implementation
async function networkFirst(request, cacheName, config) {
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName)
      await cache.put(request, response.clone())
      await cleanupCache(cacheName, config)
    }
    
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse && !isExpired(cachedResponse, config.maxAge)) {
      return cachedResponse
    }
    throw error
  }
}

async function cacheFirst(request, cacheName, config) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse && !isExpired(cachedResponse, config.maxAge)) {
    return cachedResponse
  }
  
  try {
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName)
      await cache.put(request, response.clone())
      await cleanupCache(cacheName, config)
    }
    
    return response
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

async function staleWhileRevalidate(request, cacheName, config) {
  const cachedResponse = await caches.match(request)
  
  // Always try to fetch in background
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.status === 200) {
        const cache = await caches.open(cacheName)
        await cache.put(request, response.clone())
        await cleanupCache(cacheName, config)
      }
      return response
    })
    .catch(() => {
      // Ignore fetch errors in background
    })
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Don't await the fetch promise
    fetchPromise
    return cachedResponse
  }
  
  // Wait for fetch if no cached version
  return fetchPromise
}

// Cache management utilities
async function cleanupCache(cacheName, config) {
  if (!config.maxEntries) return
  
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > config.maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - config.maxEntries)
    await Promise.all(keysToDelete.map(key => cache.delete(key)))
  }
}

function isExpired(response, maxAge) {
  if (!maxAge) return false
  
  const cachedTime = response.headers.get('sw-cached-time')
  if (!cachedTime) return false
  
  return Date.now() - parseInt(cachedTime) > maxAge
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname)
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/_app/') ||
         url.pathname.startsWith('/static/') ||
         /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname)
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case SYNC_QUEUES.INVITE_ACTIONS:
      event.waitUntil(syncInviteActions())
      break
    
    case SYNC_QUEUES.USER_UPDATES:
      event.waitUntil(syncUserUpdates())
      break
    
    case SYNC_QUEUES.ANALYTICS:
      event.waitUntil(syncAnalytics())
      break
  }
})

// Sync functions
async function syncInviteActions() {
  try {
    const actions = await getStoredActions('invite-actions')
    
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        if (response.ok) {
          await removeStoredAction('invite-actions', action.id)
          
          // Notify clients of successful sync
          const clients = await self.clients.matchAll()
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              data: { action, response: response.status }
            })
          })
        }
      } catch (error) {
        console.error('[SW] Failed to sync invite action:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync invite actions:', error)
  }
}

async function syncUserUpdates() {
  try {
    const updates = await getStoredActions('user-updates')
    
    for (const update of updates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        })
        
        if (response.ok) {
          await removeStoredAction('user-updates', update.id)
        }
      } catch (error) {
        console.error('[SW] Failed to sync user update:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync user updates:', error)
  }
}

async function syncAnalytics() {
  try {
    const events = await getStoredActions('analytics')
    
    if (events.length > 0) {
      const response = await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      
      if (response.ok) {
        await clearStoredActions('analytics')
      }
    }
  } catch (error) {
    console.error('[SW] Failed to sync analytics:', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  if (!event.data) {
    return
  }
  
  try {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/icon-64.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        requireInteraction: data.requireInteraction,
        vibrate: data.vibrate || [200, 100, 200]
      })
    )
  } catch (error) {
    console.error('[SW] Failed to show push notification:', error)
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  
  event.notification.close()
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus existing window
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus()
            
            // Send message to client with notification data
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: event.notification.data
            })
            
            return
          }
        }
        
        // Open new window if no existing one
        return self.clients.openWindow('/')
      })
  )
})

// Utility functions for background sync storage
async function getStoredActions(queueName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ravetracker-sync', 1)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([queueName], 'readonly')
      const store = transaction.objectStore(queueName)
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || [])
      }
    }
    
    request.onerror = () => resolve([])
    
    request.onupgradeneeded = () => {
      const db = request.result
      Object.values(SYNC_QUEUES).forEach(queueName => {
        if (!db.objectStoreNames.contains(queueName)) {
          db.createObjectStore(queueName, { keyPath: 'id' })
        }
      })
    }
  })
}

async function removeStoredAction(queueName, id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ravetracker-sync', 1)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([queueName], 'readwrite')
      const store = transaction.objectStore(queueName)
      
      store.delete(id)
      transaction.oncomplete = () => resolve()
    }
    
    request.onerror = () => resolve()
  })
}

async function clearStoredActions(queueName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ravetracker-sync', 1)
    
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction([queueName], 'readwrite')
      const store = transaction.objectStore(queueName)
      
      store.clear()
      transaction.oncomplete = () => resolve()
    }
    
    request.onerror = () => resolve()
  })
}

// Message handling from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION })
      break
    
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch(() => event.ports[0].postMessage({ success: false }))
      break
  }
})

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('ravetracker-v3'))
      .map(name => caches.delete(name))
  )
}

console.log('[SW] Service worker script loaded')
