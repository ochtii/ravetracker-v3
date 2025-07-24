<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { eventPresence, realtimeActions } from '$lib/realtime/realtime-stores'
  import { subscribeToEvent, unsubscribeFromEvent } from '$lib/realtime/realtime-service'
  import type { User } from '@supabase/supabase-js'
  import { fade, scale } from 'svelte/transition'
  
  export let eventId: string
  export let user: User | null = null
  export let showAvatars = true
  export let showUsernames = true
  export let maxUsers = 10
  export let layout: 'horizontal' | 'vertical' | 'grid' = 'horizontal'

  $: presenceUsers = realtimeActions.getEventPresenceUsers(eventId)
  $: onlineUsers = presenceUsers.filter(u => u.status === 'online')
  $: displayUsers = onlineUsers.slice(0, maxUsers)
  $: additionalUsers = Math.max(0, onlineUsers.length - maxUsers)

  let mounted = false

  onMount(() => {
    mounted = true
    if (user) {
      subscribeToEvent(eventId, user)
    }
  })

  onDestroy(() => {
    if (mounted) {
      unsubscribeFromEvent(eventId)
    }
  })

  function getLayoutClasses() {
    switch (layout) {
      case 'vertical':
        return 'flex-col space-y-2'
      case 'grid':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'
      default:
        return 'flex-wrap gap-2'
    }
  }

  function getUserInitials(user: any) {
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return '??'
  }

  function getRandomGradient(userId: string) {
    // Generate consistent gradient based on user ID
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400', 
      'from-green-400 to-blue-400',
      'from-yellow-400 to-red-400',
      'from-pink-400 to-purple-400',
      'from-indigo-400 to-blue-400',
      'from-red-400 to-pink-400',
      'from-cyan-400 to-blue-400'
    ]
    
    return colors[Math.abs(hash) % colors.length]
  }

  function formatLastSeen(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }
</script>

<div class="glass-card p-4 bg-glass-surface border-glass-surface-border">
  
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <h3 class="text-lg font-semibold text-white">Live Attendees</h3>
      <span class="text-sm text-glass-text-secondary">
        ({onlineUsers.length} online)
      </span>
    </div>
    
    {#if onlineUsers.length > 0}
      <div class="text-xs text-glass-text-muted">
        Real-time presence
      </div>
    {/if}
  </div>

  <!-- Presence Users -->
  {#if onlineUsers.length > 0}
    <div class="flex {getLayoutClasses()}">
      
      {#each displayUsers as presenceUser (presenceUser.user_id)}
        <div 
          class="relative group"
          in:scale={{ duration: 200 }}
          out:fade={{ duration: 150 }}
        >
          
          <!-- Avatar or Initial -->
          <div class="relative">
            {#if showAvatars && presenceUser.avatar_url}
              <img
                src={presenceUser.avatar_url}
                alt={presenceUser.username || 'User'}
                class="w-10 h-10 rounded-full object-cover border-2 border-green-400 shadow-lg"
              />
            {:else}
              <div class="w-10 h-10 rounded-full bg-gradient-to-br {getRandomGradient(presenceUser.user_id)} flex items-center justify-center text-white font-semibold text-sm border-2 border-green-400 shadow-lg">
                {getUserInitials(presenceUser)}
              </div>
            {/if}
            
            <!-- Online indicator -->
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-glass-surface shadow-sm"></div>
          </div>

          <!-- Username (if shown and layout allows) -->
          {#if showUsernames && layout !== 'horizontal'}
            <div class="mt-2 text-center">
              <p class="text-xs text-white font-medium truncate">
                {presenceUser.username || 'Anonymous'}
              </p>
              <p class="text-xs text-glass-text-muted">
                {formatLastSeen(presenceUser.last_seen)}
              </p>
            </div>
          {/if}

          <!-- Tooltip for horizontal layout -->
          {#if layout === 'horizontal'}
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div class="bg-glass-surface border border-glass-surface-border rounded-lg px-3 py-2 text-xs text-white shadow-xl">
                <p class="font-medium">{presenceUser.username || 'Anonymous'}</p>
                <p class="text-glass-text-muted">{formatLastSeen(presenceUser.last_seen)}</p>
                
                <!-- Arrow -->
                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-glass-surface border-r border-b border-glass-surface-border rotate-45"></div>
              </div>
            </div>
          {/if}
        </div>
      {/each}

      <!-- Additional users indicator -->
      {#if additionalUsers > 0}
        <div class="relative group">
          <div class="w-10 h-10 rounded-full bg-glass-primary/30 border-2 border-glass-primary-border flex items-center justify-center text-white font-semibold text-xs">
            +{additionalUsers}
          </div>
          
          <!-- Tooltip -->
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div class="bg-glass-surface border border-glass-surface-border rounded-lg px-3 py-2 text-xs text-white shadow-xl whitespace-nowrap">
              {additionalUsers} more {additionalUsers === 1 ? 'person' : 'people'} online
              
              <!-- Arrow -->
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-glass-surface border-r border-b border-glass-surface-border rotate-45"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Activity summary -->
    <div class="mt-4 pt-3 border-t border-glass-surface-border">
      <div class="flex items-center justify-between text-xs text-glass-text-secondary">
        <span>
          {onlineUsers.length} {onlineUsers.length === 1 ? 'person' : 'people'} viewing this event
        </span>
        
        <div class="flex items-center space-x-1">
          <div class="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </div>

  {:else}
    <!-- Empty state -->
    <div class="text-center py-8">
      <svg class="w-12 h-12 text-glass-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
      </svg>
      <p class="text-glass-text-secondary">No one is viewing this event right now</p>
      <p class="text-xs text-glass-text-muted mt-1">
        Come back later or share the event with friends!
      </p>
    </div>
  {/if}

  <!-- User's own presence indicator -->
  {#if user}
    <div class="mt-4 pt-3 border-t border-glass-surface-border">
      <div class="flex items-center space-x-2 text-xs text-glass-accent">
        <div class="w-2 h-2 bg-glass-accent rounded-full"></div>
        <span>You are currently viewing this event</span>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Enhanced tooltip styling */
  .group:hover .opacity-0 {
    animation: fadeInUp 0.2s ease-out forwards;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  /* Pulse animation for online indicators */
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
