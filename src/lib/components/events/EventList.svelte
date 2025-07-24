<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { events, loading, error, pagination, eventActions } from '$lib/stores/events'
  // import { realtimeManager } from '$lib/realtime/realtime-stores'
  import EventCard from './EventCard.svelte'
  import type { Database } from '$lib/types/database'

  type Event = Database['public']['Tables']['events']['Row']

  export let layout: 'grid' | 'list' = 'grid'
  export let showFilters = true
  export let showLoadMore = true
  export let infiniteScroll = true
  export let limit = 12

  let container: HTMLElement
  let loadingMore = false
  let hasSubscription = false

  // Infinite scroll logic
  const handleScroll = () => {
    if (!infiniteScroll || !showLoadMore || loadingMore || !$pagination.hasMore) return

    const scrollPosition = window.innerHeight + window.scrollY
    const threshold = document.body.offsetHeight - 1000

    if (scrollPosition >= threshold) {
      loadMore()
    }
  }

  const loadMore = async () => {
    if (loadingMore || !$pagination.hasMore) return

    loadingMore = true
    try {
      await eventActions.loadMore()
    } catch (err) {
      console.error('Failed to load more events:', err)
    } finally {
      loadingMore = false
    }
  }

  const refresh = async () => {
    try {
      await eventActions.refreshEvents()
    } catch (err) {
      console.error('Failed to refresh events:', err)
    }
  }

  // Real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (hasSubscription) return

    try {
      // Subscribe to event changes
      // TODO: Subscribe to real-time updates
      // $realtimeManager?.subscribeToEvents()
      hasSubscription = true
    } catch (err) {
      console.error('Failed to setup realtime subscriptions:', err)
    }
  }

  onMount(() => {
    if (browser) {
      // Load initial events if not already loaded
      if ($events.length === 0) {
        eventActions.loadEvents({ limit })
      }

      // Setup infinite scroll
      if (infiniteScroll) {
        window.addEventListener('scroll', handleScroll, { passive: true })
      }

      // Setup real-time subscriptions
      setupRealtimeSubscriptions()
    }
  })

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('scroll', handleScroll)
      
      // Clean up real-time subscriptions
      if (hasSubscription) {
        // TODO: Unsubscribe from real-time updates
        // $realtimeManager.unsubscribeFromEvents()
        hasSubscription = false
      }
    }
  })
</script>

<div bind:this={container} class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-white mb-2">Events</h2>
      <p class="text-gray-400">
        {$pagination.total > 0 ? `${$events.length} von ${$pagination.total} Events` : 'Keine Events gefunden'}
      </p>
    </div>

    <!-- Layout Toggle -->
    <div class="flex items-center gap-2">
      <button
        on:click={refresh}
        disabled={$loading}
        class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
        aria-label="Events aktualisieren"
      >
        <svg class="w-5 h-5" class:animate-spin={$loading} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>

      <div class="flex rounded-lg bg-white/10 p-1">
        <button
          on:click={() => layout = 'grid'}
          class={`p-2 rounded transition-colors ${
            layout === 'grid' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="Grid-Ansicht"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          </svg>
        </button>
        <button
          on:click={() => layout = 'list'}
          class={`p-2 rounded transition-colors ${
            layout === 'list' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="Listen-Ansicht"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Error State -->
  {#if $error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <div>
          <h3 class="text-red-300 font-medium">Fehler beim Laden der Events</h3>
          <p class="text-red-200 text-sm">{$error}</p>
        </div>
        <button
          on:click={() => {
            error.set(null)
            refresh()
          }}
          class="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  {/if}

  <!-- Loading State (Initial) -->
  {#if $loading && $events.length === 0}
    <div class="space-y-6">
      <!-- Loading Header -->
      <div class="animate-pulse">
        <div class="h-8 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div class="h-4 bg-gray-700 rounded w-1/6"></div>
      </div>

      <!-- Loading Grid -->
      <div class={`grid gap-6 ${
        layout === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {#each Array(limit) as _}
          <div class="animate-pulse">
            {#if layout === 'grid'}
              <div class="bg-gray-700 rounded-xl h-80"></div>
            {:else}
              <div class="bg-gray-700 rounded-lg h-24"></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

  <!-- Events Grid/List -->
  {:else if $events.length > 0}
    <div class={`grid gap-6 ${
      layout === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'
    }`}>
      {#each $events as event (event.id)}
        <EventCard 
          {event} 
          variant={layout === 'grid' ? 'card' : 'list'}
        />
      {/each}
    </div>

    <!-- Load More Button -->
    {#if showLoadMore && $pagination.hasMore && !infiniteScroll}
      <div class="flex justify-center">
        <button
          on:click={loadMore}
          disabled={loadingMore}
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loadingMore ? 'Lädt...' : 'Mehr laden'}
        </button>
      </div>
    {/if}

    <!-- Infinite Scroll Loading -->
    {#if infiniteScroll && loadingMore}
      <div class="flex justify-center py-8">
        <div class="flex items-center gap-3">
          <div class="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-gray-400">Lädt weitere Events...</span>
        </div>
      </div>
    {/if}

  <!-- Empty State -->
  {:else}
    <div class="text-center py-16">
      <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      </div>
      
      <h3 class="text-xl font-semibold text-white mb-2">Keine Events gefunden</h3>
      <p class="text-gray-400 mb-6">Entweder gibt es momentan keine Events oder deine Filter sind zu restriktiv.</p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          on:click={() => {
            // Reset filters
            eventActions.resetFilters()
            eventActions.loadEvents({ limit })
          }}
          class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
        >
          Filter zurücksetzen
        </button>
        
        <button
          on:click={refresh}
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Neu laden
        </button>
      </div>
    </div>
  {/if}

  <!-- Real-time Status -->
  {#if hasSubscription}
    <div class="fixed bottom-4 right-4 z-50">
      <div class="bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-2 rounded-lg backdrop-blur-sm text-sm">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live Updates aktiv
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
