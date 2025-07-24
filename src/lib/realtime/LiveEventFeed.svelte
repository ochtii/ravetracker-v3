<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { liveEventFeed, recentLiveUpdates, realtimeActions } from '$lib/realtime/realtime-stores'
  import { fade, fly } from 'svelte/transition'
  
  export let eventId: string | null = null // If null, shows all events
  export let maxItems = 10
  export let autoScroll = true
  export let showTimestamps = true

  let feedContainer: HTMLElement
  let isUserScrolling = false
  let scrollTimeout: NodeJS.Timeout

  $: filteredFeed = eventId 
    ? $liveEventFeed.filter(update => update.eventId === eventId).slice(0, maxItems)
    : $recentLiveUpdates.slice(0, maxItems)

  onMount(() => {
    if (autoScroll) {
      // Auto-scroll to bottom when new items arrive
      const unsubscribe = liveEventFeed.subscribe(() => {
        if (!isUserScrolling && feedContainer) {
          setTimeout(() => {
            feedContainer.scrollTop = feedContainer.scrollHeight
          }, 100)
        }
      })

      return unsubscribe
    }
  })

  function handleScroll() {
    isUserScrolling = true
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
    
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false
    }, 1000)
  }

  function clearFeed() {
    realtimeActions.clearLiveEventFeed()
  }

  function getUpdateIcon(type: string) {
    switch (type) {
      case 'status':
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`
      case 'location':
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>`
      case 'time':
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`
      case 'lineup':
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>`
      case 'announcement':
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                </svg>`
      default:
        return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`
    }
  }

  function getUpdateColor(type: string) {
    switch (type) {
      case 'status':
        return 'text-green-400'
      case 'location':
        return 'text-blue-400'
      case 'time':
        return 'text-yellow-400'
      case 'lineup':
        return 'text-purple-400'
      case 'announcement':
        return 'text-glass-accent'
      default:
        return 'text-glass-text-secondary'
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    
    return date.toLocaleDateString()
  }

  onDestroy(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }
  })
</script>

<div class="glass-card bg-glass-surface border-glass-surface-border h-full flex flex-col">
  
  <!-- Header -->
  <div class="p-4 border-b border-glass-surface-border">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-glass-accent rounded-full animate-pulse"></div>
        <h3 class="text-lg font-semibold text-white">
          {eventId ? 'Event Updates' : 'Live Feed'}
        </h3>
      </div>
      
      <div class="flex items-center space-x-2">
        <span class="text-xs text-glass-text-secondary">
          {filteredFeed.length} updates
        </span>
        
        {#if filteredFeed.length > 0}
          <button
            on:click={clearFeed}
            class="text-glass-text-muted hover:text-glass-text-secondary transition-colors"
            title="Clear feed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Feed Content -->
  <div 
    bind:this={feedContainer}
    on:scroll={handleScroll}
    class="flex-1 overflow-y-auto p-4 space-y-3"
  >
    {#each filteredFeed as update (update.id)}
      <div 
        class="glass-card p-3 bg-glass-primary/10 border-glass-primary-border"
        in:fly={{ y: 20, duration: 300 }}
        out:fade={{ duration: 200 }}
      >
        <div class="flex items-start space-x-3">
          
          <!-- Icon -->
          <div class="flex-shrink-0 {getUpdateColor(update.type)} mt-1">
            {@html getUpdateIcon(update.type)}
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-glass-text-secondary uppercase tracking-wide">
                {update.type.replace('_', ' ')}
              </span>
              
              {#if showTimestamps}
                <span class="text-xs text-glass-text-muted">
                  {formatTimestamp(update.timestamp)}
                </span>
              {/if}
            </div>
            
            <p class="text-sm text-white mt-1 leading-relaxed">
              {update.message}
            </p>
            
            <!-- Additional data display -->
            {#if update.data}
              <div class="mt-2 p-2 bg-glass-surface/50 rounded border border-glass-surface-border">
                <pre class="text-xs text-glass-text-secondary overflow-x-auto">
                  {JSON.stringify(update.data, null, 2)}
                </pre>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <!-- Empty state -->
      <div class="flex-1 flex items-center justify-center py-8">
        <div class="text-center">
          <svg class="w-12 h-12 text-glass-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-2M7 4h10M9 9h6m-6 4h6"/>
          </svg>
          <p class="text-glass-text-secondary">No live updates yet</p>
          <p class="text-xs text-glass-text-muted mt-1">
            Updates will appear here in real-time
          </p>
        </div>
      </div>
    {/each}
  </div>

  <!-- Auto-scroll indicator -->
  {#if autoScroll && isUserScrolling}
    <div class="p-2 border-t border-glass-surface-border">
      <div class="flex items-center justify-center">
        <button
          on:click={() => {
            isUserScrolling = false
            if (feedContainer) {
              feedContainer.scrollTop = feedContainer.scrollHeight
            }
          }}
          class="text-xs text-glass-accent hover:text-glass-accent-hover transition-colors flex items-center space-x-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
          <span>Scroll to latest</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  /* Smooth scrolling */
  .overflow-y-auto {
    scroll-behavior: smooth;
  }
</style>
