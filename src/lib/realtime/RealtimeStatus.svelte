<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { 
    connectionStatus, 
    notifications, 
    unreadNotificationsCount,
    adminBroadcasts,
    criticalBroadcasts
  } from '$lib/realtime/realtime-stores'
  import { realtimeActions } from '$lib/realtime/realtime-stores'
  
  export let showConnectionStatus = true
  export let showNotificationBadge = true
  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right'

  let showNotifications = false
  let showBroadcasts = false

  // Auto-hide notifications after 5 seconds
  let notificationTimeout: NodeJS.Timeout

  $: if ($criticalBroadcasts.length > 0) {
    showBroadcasts = true
  }

  onMount(() => {
    // Auto-hide critical broadcasts after 10 seconds
    const hideTimeout = setTimeout(() => {
      showBroadcasts = false
    }, 10000)

    return () => clearTimeout(hideTimeout)
  })

  function toggleNotifications() {
    showNotifications = !showNotifications
    if (showNotifications) {
      // Mark all as read when opened
      $notifications.forEach(n => {
        if (!n.read) {
          realtimeActions.markNotificationRead(n.id)
        }
      })
    }
  }

  function dismissBroadcast(broadcastId: string) {
    adminBroadcasts.update(broadcasts => 
      broadcasts.filter(b => b.id !== broadcastId)
    )
  }

  function getPositionClasses() {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      default:
        return 'top-4 right-4'
    }
  }

  function getConnectionStatusColor() {
    switch ($connectionStatus) {
      case 'connected':
        return 'bg-glass-success border-glass-success-border'
      case 'connecting':
        return 'bg-glass-warning border-glass-warning-border'
      default:
        return 'bg-glass-error border-glass-error-border'
    }
  }

  function formatTimeAgo(timestamp: string) {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  onDestroy(() => {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }
  })
</script>

<!-- Realtime Status Panel -->
<div class="fixed {getPositionClasses()} z-50 space-y-3 max-w-sm">
  
  <!-- Connection Status -->
  {#if showConnectionStatus}
    <div class="glass-card p-3 {getConnectionStatusColor()}">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 rounded-full {$connectionStatus === 'connected' ? 'bg-green-400' : $connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}"></div>
        <span class="text-sm font-medium text-white">
          {$connectionStatus === 'connected' ? 'Connected' : $connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
        {#if $connectionStatus === 'connected'}
          <div class="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Notifications -->
  {#if showNotificationBadge}
    <div class="glass-card p-3 bg-glass-primary border-glass-primary-border">
      <button 
        on:click={toggleNotifications}
        class="flex items-center justify-between w-full"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5.5-7.5V7a3 3 0 00-6 0v2.5L3 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="text-sm font-medium text-white">Notifications</span>
        </div>
        
        {#if $unreadNotificationsCount > 0}
          <div class="bg-glass-accent text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
            {$unreadNotificationsCount > 99 ? '99+' : $unreadNotificationsCount}
          </div>
        {/if}
      </button>

      {#if showNotifications}
        <div class="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {#each $notifications.slice(0, 10) as notification (notification.id)}
            <div class="glass-card p-3 bg-glass-surface border-glass-surface-border">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-white">{notification.title}</h4>
                  <p class="text-xs text-glass-text-secondary mt-1">{notification.message}</p>
                  <span class="text-xs text-glass-text-muted mt-1 block">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </div>
                
                {#if !notification.read}
                  <div class="w-2 h-2 bg-glass-accent rounded-full flex-shrink-0 mt-1"></div>
                {/if}
              </div>
            </div>
          {:else}
            <div class="text-center text-glass-text-secondary text-sm py-4">
              No notifications yet
            </div>
          {/each}
          
          {#if $notifications.length > 10}
            <button class="w-full text-center text-glass-accent text-sm py-2 hover:text-glass-accent-hover transition-colors">
              View all notifications
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Critical Admin Broadcasts -->
  {#if showBroadcasts && $criticalBroadcasts.length > 0}
    <div class="space-y-2">
      {#each $criticalBroadcasts as broadcast (broadcast.id)}
        <div class="glass-card p-4 bg-glass-error border-glass-error-border animate-pulse">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <span class="text-sm font-bold text-white uppercase tracking-wide">
                  {broadcast.priority} Alert
                </span>
              </div>
              
              <h4 class="text-base font-semibold text-white">{broadcast.title}</h4>
              <p class="text-sm text-glass-text-secondary mt-1">{broadcast.message}</p>
              <span class="text-xs text-glass-text-muted mt-2 block">
                {formatTimeAgo(broadcast.timestamp)}
              </span>
            </div>
            
            <button 
              on:click={() => dismissBroadcast(broadcast.id)}
              class="text-glass-text-muted hover:text-white transition-colors ml-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for notifications */
  .max-h-80::-webkit-scrollbar {
    width: 4px;
  }
  
  .max-h-80::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
  
  .max-h-80::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  .max-h-80::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>
