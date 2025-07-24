<!--
  RaveTracker v3.0 - Mobile-Optimized Invite Manager
  ================================================
  Swipe-enabled invite management with lazy loading and offline support
-->

<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import { browser } from '$app/environment'
  import { invalidateAll } from '$app/navigation'
  import { fade, slide, fly } from 'svelte/transition'
  import { inviteService } from '$lib/services/invite-service'
  import MobileButton from './MobileButton.svelte'
  import MobileInviteCard from './MobileInviteCard.svelte'
  import type { Invite, InviteStats } from '$lib/types/invite'

  export let userId: string
  export let initialCredits: number = 0
  export let initialInvites: Invite[] = []
  export let initialStats: InviteStats | null = null

  const dispatch = createEventDispatcher<{
    inviteCreated: { invite: Invite }
    inviteDeleted: { inviteId: string }
    creditsUpdated: { credits: number }
  }>()

  // State
  let invites: Invite[] = initialInvites
  let credits = initialCredits
  let stats = initialStats
  let loading = false
  let creating = false
  let refreshing = false
  let error = ''
  let success = ''

  // Mobile-specific state
  let currentPage = 0
  let hasMore = true
  let loadingMore = false
  let isOnline = true
  let supportsPullToRefresh = false
  let supportsVibration = false
  let isStandalone = false

  // Filters and sorting
  let activeFilter: 'all' | 'active' | 'used' | 'expired' = 'all'
  let sortBy: 'created' | 'expires' | 'used' = 'created'
  let sortOrder: 'asc' | 'desc' = 'desc'

  // Constants
  const PAGE_SIZE = 10
  const REFRESH_THRESHOLD = 80 // pixels

  // Infinite scroll and pull-to-refresh
  let listContainer: HTMLElement
  let pullToRefreshY = 0
  let isPulling = false
  let touchStartY = 0

  onMount(() => {
    if (browser) {
      // Feature detection
      isOnline = navigator.onLine
      supportsVibration = 'vibrate' in navigator
      isStandalone = window.matchMedia('(display-mode: standalone)').matches
      supportsPullToRefresh = 'ontouchstart' in window

      // Network listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Load data if empty
      if (invites.length === 0) {
        loadInvites()
      }

      // Setup intersection observer for infinite scroll
      setupInfiniteScroll()
    }
  })

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  // Network handlers
  const handleOnline = () => {
    isOnline = true
    refreshData()
  }

  const handleOffline = () => {
    isOnline = false
    error = 'Offline - Einige Funktionen sind eingeschränkt'
    setTimeout(() => error = '', 3000)
  }

  // Infinite scroll setup
  const setupInfiniteScroll = () => {
    if (!browser || !listContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && isOnline) {
          loadMoreInvites()
        }
      },
      { threshold: 0.1 }
    )

    // Observe a sentinel element at the bottom
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    listContainer.appendChild(sentinel)
    observer.observe(sentinel)

    return () => observer.disconnect()
  }

  // Pull-to-refresh handlers
  const handleTouchStart = (event: TouchEvent) => {
    if (!supportsPullToRefresh || listContainer.scrollTop > 0) return
    touchStartY = event.touches[0].clientY
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!supportsPullToRefresh || listContainer.scrollTop > 0) return
    
    const touchY = event.touches[0].clientY
    const pullDistance = touchY - touchStartY

    if (pullDistance > 0) {
      isPulling = true
      pullToRefreshY = Math.min(pullDistance * 0.5, REFRESH_THRESHOLD)
      
      if (pullToRefreshY >= REFRESH_THRESHOLD) {
        if (supportsVibration) {
          navigator.vibrate([50])
        }
      }
    }
  }

  const handleTouchEnd = () => {
    if (!supportsPullToRefresh || !isPulling) return

    if (pullToRefreshY >= REFRESH_THRESHOLD) {
      refreshData()
    }

    isPulling = false
    pullToRefreshY = 0
    touchStartY = 0
  }

  // Data loading functions
  const loadInvites = async () => {
    if (loading) return

    loading = true
    error = ''

    try {
      const result = await inviteService.getUserInvites(userId)
      invites = result.invites || []
      stats = result.stats || null
      credits = result.credits || 0
      currentPage = 0
      hasMore = invites.length >= PAGE_SIZE
    } catch (err) {
      error = err instanceof Error ? err.message : 'Fehler beim Laden der Einladungen'
      if (supportsVibration) {
        navigator.vibrate([200])
      }
    } finally {
      loading = false
    }
  }

  const loadMoreInvites = async () => {
    if (loadingMore || !hasMore) return

    loadingMore = true

    try {
      const nextPage = currentPage + 1
      const result = await inviteService.getUserInvites(userId, nextPage, PAGE_SIZE)
      
      if (result.invites && result.invites.length > 0) {
        invites = [...invites, ...result.invites]
        currentPage = nextPage
        hasMore = result.invites.length >= PAGE_SIZE
      } else {
        hasMore = false
      }
    } catch (err) {
      error = 'Fehler beim Laden weiterer Einladungen'
    } finally {
      loadingMore = false
    }
  }

  const refreshData = async () => {
    if (refreshing) return

    refreshing = true
    currentPage = 0
    hasMore = true

    try {
      await loadInvites()
      success = 'Daten aktualisiert'
      setTimeout(() => success = '', 2000)
    } catch (err) {
      error = 'Fehler beim Aktualisieren'
    } finally {
      refreshing = false
    }
  }

  // Invite management
  const createInvite = async () => {
    if (creating || !isOnline) return

    creating = true
    error = ''

    try {
      const newInvite = await inviteService.createInvite(userId)
      invites = [newInvite, ...invites]
      credits = Math.max(0, credits - 1)
      
      success = 'Einladung erstellt!'
      setTimeout(() => success = '', 3000)

      if (supportsVibration) {
        navigator.vibrate([100, 50, 100])
      }

      dispatch('inviteCreated', { invite: newInvite })
      
      // Optimistic update
      if (stats) {
        stats.total += 1
        stats.active += 1
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Fehler beim Erstellen der Einladung'
      if (supportsVibration) {
        navigator.vibrate([300])
      }
    } finally {
      creating = false
    }
  }

  const handleInviteDeleted = (event: CustomEvent<{ inviteId: string }>) => {
    const { inviteId } = event.detail
    invites = invites.filter(invite => invite.id !== inviteId)
    credits += 1 // Restore credit
    
    success = 'Einladung gelöscht - Credit zurückerstattet'
    setTimeout(() => success = '', 3000)

    dispatch('inviteDeleted', { inviteId })
    dispatch('creditsUpdated', { credits })

    // Update stats
    if (stats) {
      stats.total -= 1
      stats.active -= 1
    }
  }

  // Filtering and sorting
  const filteredInvites = (invites: Invite[]) => {
    let filtered = invites

    // Apply filter
    switch (activeFilter) {
      case 'active':
        filtered = filtered.filter(invite => 
          invite.is_active && !invite.used_at && new Date(invite.expires_at) > new Date()
        )
        break
      case 'used':
        filtered = filtered.filter(invite => invite.used_at)
        break
      case 'expired':
        filtered = filtered.filter(invite => 
          new Date(invite.expires_at) <= new Date() && !invite.used_at
        )
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'created':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'expires':
          aValue = new Date(a.expires_at)
          bValue = new Date(b.expires_at)
          break
        case 'used':
          aValue = a.used_at ? new Date(a.used_at) : new Date(0)
          bValue = b.used_at ? new Date(b.used_at) : new Date(0)
          break
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }

  $: displayedInvites = filteredInvites(invites)
</script>

<!-- Main Container -->
<div 
  class="mobile-invite-manager h-full flex flex-col"
  class:offline={!isOnline}
>
  <!-- Header with Stats -->
  <div 
    class="flex-shrink-0 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border-b border-white/10"
    style="transform: translateY({pullToRefreshY}px)"
  >
    <!-- Pull-to-refresh indicator -->
    {#if isPulling && pullToRefreshY > 20}
      <div 
        class="flex justify-center mb-2 transition-opacity duration-200"
        class:opacity-100={pullToRefreshY >= REFRESH_THRESHOLD}
        class:opacity-50={pullToRefreshY < REFRESH_THRESHOLD}
      >
        <div class="flex items-center gap-2 text-white/60 text-sm">
          <svg 
            class="w-4 h-4 transition-transform duration-200"
            class:rotate-180={pullToRefreshY >= REFRESH_THRESHOLD}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          {pullToRefreshY >= REFRESH_THRESHOLD ? 'Loslassen zum Aktualisieren' : 'Zum Aktualisieren ziehen'}
        </div>
      </div>
    {/if}

    <!-- Credits and Create Button -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-white">Einladungen verwalten</h1>
        <div class="flex items-center gap-2 text-white/70">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
          <span class="text-sm">Credits: {credits}</span>
          {#if !isOnline}
            <span class="text-xs text-amber-400">(Offline)</span>
          {/if}
        </div>
      </div>

      <MobileButton
        variant="primary"
        size="lg"
        disabled={creating || credits <= 0 || !isOnline}
        loading={creating}
        on:click={createInvite}
        enableHaptic={supportsVibration}
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Erstellen
      </MobileButton>
    </div>

    <!-- Quick Stats -->
    {#if stats}
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center p-2 bg-white/5 rounded-lg">
          <div class="text-lg font-bold text-white">{stats.total}</div>
          <div class="text-xs text-white/60">Gesamt</div>
        </div>
        <div class="text-center p-2 bg-white/5 rounded-lg">
          <div class="text-lg font-bold text-green-400">{stats.used}</div>
          <div class="text-xs text-white/60">Verwendet</div>
        </div>
        <div class="text-center p-2 bg-white/5 rounded-lg">
          <div class="text-lg font-bold text-blue-400">{stats.active}</div>
          <div class="text-xs text-white/60">Aktiv</div>
        </div>
      </div>
    {/if}

    <!-- Filter Tabs -->
    <div class="flex bg-white/10 rounded-lg p-1">
      {#each [
        { key: 'all', label: 'Alle', count: invites.length },
        { key: 'active', label: 'Aktiv', count: stats?.active || 0 },
        { key: 'used', label: 'Verwendet', count: stats?.used || 0 },
        { key: 'expired', label: 'Abgelaufen', count: stats?.expired || 0 }
      ] as filter}
        <button
          class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
          class:bg-white/20={activeFilter === filter.key}
          class:text-white={activeFilter === filter.key}
          class:text-white/60={activeFilter !== filter.key}
          on:click={() => activeFilter = filter.key}
        >
          {filter.label}
          {#if filter.count > 0}
            <span class="ml-1 text-xs opacity-75">({filter.count})</span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Status Messages -->
  {#if error}
    <div 
      class="mx-4 mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm flex items-center gap-2"
      in:slide={{ duration: 200 }}
      out:fade={{ duration: 150 }}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </div>
  {/if}

  {#if success}
    <div 
      class="mx-4 mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm flex items-center gap-2"
      in:slide={{ duration: 200 }}
      out:fade={{ duration: 150 }}
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      {success}
    </div>
  {/if}

  <!-- Invite List -->
  <div 
    bind:this={listContainer}
    class="flex-1 overflow-y-auto px-4 py-2"
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
  >
    {#if loading}
      <!-- Loading skeleton -->
      <div class="space-y-3">
        {#each Array(3) as _}
          <div class="animate-pulse bg-white/10 rounded-lg h-24"></div>
        {/each}
      </div>
    {:else if displayedInvites.length === 0}
      <!-- Empty state -->
      <div class="flex flex-col items-center justify-center h-64 text-center">
        <svg class="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7h-3.5m-9 0H4m6 2v4" />
        </svg>
        <h3 class="text-lg font-medium text-white/80 mb-2">
          {activeFilter === 'all' ? 'Noch keine Einladungen' : `Keine ${activeFilter === 'active' ? 'aktiven' : activeFilter === 'used' ? 'verwendeten' : 'abgelaufenen'} Einladungen`}
        </h3>
        <p class="text-white/60 text-sm mb-4">
          {activeFilter === 'all' ? 'Erstelle deine erste Einladung mit dem Button oben.' : 'Ändere den Filter oder erstelle eine neue Einladung.'}
        </p>
        {#if credits > 0 && activeFilter === 'all'}
          <MobileButton
            variant="primary"
            on:click={createInvite}
            disabled={!isOnline}
          >
            Erste Einladung erstellen
          </MobileButton>
        {/if}
      </div>
    {:else}
      <!-- Invite cards -->
      <div class="space-y-3 pb-4">
        {#each displayedInvites as invite, index (invite.id)}
          <div in:fly={{ y: 20, delay: index * 50, duration: 300 }}>
            <MobileInviteCard
              {invite}
              {supportsVibration}
              on:deleted={handleInviteDeleted}
            />
          </div>
        {/each}

        <!-- Loading more indicator -->
        {#if loadingMore}
          <div class="flex justify-center py-4">
            <div class="flex items-center gap-2 text-white/60">
              <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32">
                  <animate attributeName="stroke-dasharray" dur="1s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                </circle>
              </svg>
              <span class="text-sm">Weitere laden...</span>
            </div>
          </div>
        {:else if !hasMore && displayedInvites.length > PAGE_SIZE}
          <div class="text-center py-4 text-white/40 text-sm">
            Alle Einladungen geladen
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Floating Action Button (alternative create button) -->
  {#if !loading && displayedInvites.length > 0}
    <div class="fixed bottom-6 right-6 z-10">
      <MobileButton
        variant="primary"
        size="xl"
        disabled={creating || credits <= 0 || !isOnline}
        loading={creating}
        on:click={createInvite}
        enableHaptic={supportsVibration}
        class="rounded-full shadow-2xl"
        elevated
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </MobileButton>
    </div>
  {/if}
</div>

<style>
  .mobile-invite-manager.offline {
    filter: grayscale(0.2);
  }

  /* Smooth scrolling for mobile */
  .mobile-invite-manager {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
  }

  /* PWA safe area support */
  @media (display-mode: standalone) {
    .mobile-invite-manager {
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .mobile-invite-manager * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
