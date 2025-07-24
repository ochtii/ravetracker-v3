<!--
  RaveTracker v3.0 - InviteManager Component
  =========================================
  Comprehensive invite management interface for users
  Features: Credit display, invite creation, real-time updates, statistics
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { Plus, AlertTriangle, TrendingUp, Users, Copy, Share2, Trash2, RefreshCw } from 'lucide-svelte'
  import { inviteService } from '$lib/services/invite-service'
  import type { Invite, InviteStats } from '$lib/types/invite'
  import InviteCard from './InviteCard.svelte'
  
  // Props
  export let userId: string
  export let initialCredits: number = 0
  export let initialInvites: Invite[] = []
  export let initialStats: InviteStats | null = null

  // Component state
  let credits = initialCredits
  let invites = initialInvites
  let stats = initialStats
  let loading = false
  let creating = false
  let refreshing = false
  let error: string | null = null
  let success: string | null = null

  // Filters and sorting
  let filterStatus: 'all' | 'active' | 'used' | 'expired' = 'all'
  let sortBy: 'created' | 'expires' | 'used' = 'created'
  let sortOrder: 'asc' | 'desc' = 'desc'

  // Real-time update interval
  let updateInterval: NodeJS.Timeout | null = null

  // Computed values
  $: filteredInvites = invites.filter(invite => {
    switch (filterStatus) {
      case 'active':
        return invite.is_active && !invite.used_at && new Date(invite.expires_at) > new Date()
      case 'used':
        return invite.used_at !== null
      case 'expired':
        return invite.is_active && !invite.used_at && new Date(invite.expires_at) <= new Date()
      default:
        return true
    }
  }).sort((a, b) => {
    let aVal: string | Date
    let bVal: string | Date
    
    switch (sortBy) {
      case 'expires':
        aVal = new Date(a.expires_at)
        bVal = new Date(b.expires_at)
        break
      case 'used':
        aVal = a.used_at ? new Date(a.used_at) : new Date(0)
        bVal = b.used_at ? new Date(b.used_at) : new Date(0)
        break
      default:
        aVal = new Date(a.created_at)
        bVal = new Date(b.created_at)
    }
    
    const comparison = aVal > bVal ? 1 : -1
    return sortOrder === 'desc' ? -comparison : comparison
  })

  $: activeCount = invites.filter(i => i.is_active && !i.used_at && new Date(i.expires_at) > new Date()).length
  $: usedCount = invites.filter(i => i.used_at).length
  $: expiredCount = invites.filter(i => i.is_active && !i.used_at && new Date(i.expires_at) <= new Date()).length
  $: expiringCount = invites.filter(i => {
    if (!i.is_active || i.used_at) return false
    const now = new Date()
    const expiry = new Date(i.expires_at)
    const daysDiff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7 && daysDiff > 0
  }).length

  // Lifecycle
  onMount(() => {
    loadData()
    
    // Set up real-time updates every 30 seconds
    if (browser) {
      updateInterval = setInterval(refreshData, 30000)
    }
  })

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })

  // Data loading
  async function loadData() {
    if (loading) return
    
    loading = true
    error = null
    
    try {
      const [invitesResult, statsResult] = await Promise.all([
        inviteService.getUserInvites(userId),
        inviteService.getUserInviteStats(userId)
      ])
      
      invites = invitesResult
      stats = statsResult
      credits = statsResult.currentCredits
    } catch (err) {
      console.error('Failed to load invite data:', err)
      error = 'Fehler beim Laden der Invite-Daten'
    } finally {
      loading = false
    }
  }

  async function refreshData() {
    if (refreshing) return
    
    refreshing = true
    
    try {
      const [invitesResult, statsResult] = await Promise.all([
        inviteService.getUserInvites(userId),
        inviteService.getUserInviteStats(userId)
      ])
      
      invites = invitesResult
      stats = statsResult
      credits = statsResult.currentCredits
    } catch (err) {
      console.error('Failed to refresh data:', err)
    } finally {
      refreshing = false
    }
  }

  // Invite creation
  async function createInvite() {
    if (creating || credits <= 0) return
    
    creating = true
    error = null
    success = null
    
    try {
      const newInvite = await inviteService.createInvite(userId)
      invites = [newInvite, ...invites]
      credits = Math.max(0, credits - 1)
      success = 'Invite-Code erfolgreich erstellt!'
      
      // Clear success message after 3 seconds
      setTimeout(() => success = null, 3000)
      
      // Refresh stats
      await refreshData()
    } catch (err: any) {
      console.error('Failed to create invite:', err)
      error = err.message || 'Fehler beim Erstellen des Invite-Codes'
    } finally {
      creating = false
    }
  }

  // Invite deletion
  async function handleInviteDeleted(event: CustomEvent<{ inviteId: string, restored: boolean }>) {
    const { inviteId, restored } = event.detail
    
    // Remove invite from list
    invites = invites.filter(i => i.id !== inviteId)
    
    // Restore credit if applicable
    if (restored) {
      credits += 1
    }
    
    // Refresh data
    await refreshData()
  }

  // Copy all active codes to clipboard
  async function copyAllCodes() {
    const activeCodes = invites
      .filter(i => i.is_active && !i.used_at && new Date(i.expires_at) > new Date())
      .map(i => i.code)
    
    if (activeCodes.length === 0) {
      error = 'Keine aktiven Codes zum Kopieren vorhanden'
      return
    }
    
    try {
      await navigator.clipboard.writeText(activeCodes.join(', '))
      success = `${activeCodes.length} Codes in die Zwischenablage kopiert`
      setTimeout(() => success = null, 3000)
    } catch (err) {
      error = 'Kopieren fehlgeschlagen'
    }
  }

  // Clear messages
  function clearMessages() {
    error = null
    success = null
  }
</script>

<div class="invite-manager">
  <!-- Header with stats -->
  <div class="header-section">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-2">Invite-Management</h2>
        <p class="text-white/70">Verwalte deine Invite-Codes und Credits</p>
      </div>
      
      <button
        on:click={refreshData}
        disabled={refreshing}
        class="btn-icon {refreshing ? 'animate-spin' : ''}"
        title="Daten aktualisieren"
      >
        <RefreshCw class="w-5 h-5" />
      </button>
    </div>

    <!-- Credits and quick stats -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">
          <Plus class="w-6 h-6" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{credits}</div>
          <div class="stat-label">Verfügbare Credits</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Users class="w-6 h-6" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{activeCount}</div>
          <div class="stat-label">Aktive Codes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <TrendingUp class="w-6 h-6" />
        </div>
        <div class="stat-content">
          <div class="stat-value">{usedCount}</div>
          <div class="stat-label">Verwendet</div>
        </div>
      </div>

      {#if expiringCount > 0}
        <div class="stat-card warning">
          <div class="stat-icon">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{expiringCount}</div>
            <div class="stat-label">Laufen bald ab</div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Actions section -->
  <div class="actions-section">
    <div class="flex flex-wrap gap-3 mb-6">
      <button
        on:click={createInvite}
        disabled={creating || credits <= 0}
        class="btn-primary"
      >
        <Plus class="w-4 h-4" />
        {creating ? 'Erstelle...' : 'Neuer Invite'}
      </button>

      {#if activeCount > 0}
        <button
          on:click={copyAllCodes}
          class="btn-secondary"
          title="Alle aktiven Codes kopieren"
        >
          <Copy class="w-4 h-4" />
          Alle kopieren
        </button>
      {/if}

      {#if credits <= 0}
        <div class="flex items-center gap-2 text-amber-400 text-sm">
          <AlertTriangle class="w-4 h-4" />
          Keine Credits verfügbar
        </div>
      {/if}
    </div>

    <!-- Filters and sorting -->
    <div class="filters-section">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="filter-group">
          <label class="filter-label">Status:</label>
          <select bind:value={filterStatus} class="filter-select">
            <option value="all">Alle ({invites.length})</option>
            <option value="active">Aktiv ({activeCount})</option>
            <option value="used">Verwendet ({usedCount})</option>
            <option value="expired">Abgelaufen ({expiredCount})</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Sortierung:</label>
          <select bind:value={sortBy} class="filter-select">
            <option value="created">Erstellt</option>
            <option value="expires">Läuft ab</option>
            <option value="used">Verwendet</option>
          </select>
          <button
            on:click={() => sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'}
            class="sort-toggle"
            title={sortOrder === 'desc' ? 'Absteigend' : 'Aufsteigend'}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Messages -->
  {#if error}
    <div class="message error">
      <AlertTriangle class="w-4 h-4" />
      {error}
      <button on:click={clearMessages} class="message-close">×</button>
    </div>
  {/if}

  {#if success}
    <div class="message success">
      <TrendingUp class="w-4 h-4" />
      {success}
      <button on:click={clearMessages} class="message-close">×</button>
    </div>
  {/if}

  <!-- Loading state -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p class="text-white/70">Lade Invite-Daten...</p>
    </div>
  {:else if filteredInvites.length === 0}
    <!-- Empty state -->
    <div class="empty-state">
      {#if invites.length === 0}
        <Users class="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-white mb-2">Noch keine Invites</h3>
        <p class="text-white/70 mb-6">Erstelle deinen ersten Invite-Code um Freunde einzuladen.</p>
        <button
          on:click={createInvite}
          disabled={creating || credits <= 0}
          class="btn-primary"
        >
          <Plus class="w-4 h-4" />
          Ersten Invite erstellen
        </button>
      {:else}
        <Users class="w-16 h-16 text-white/30 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-white mb-2">Keine passenden Invites</h3>
        <p class="text-white/70">Keine Invites gefunden, die den ausgewählten Filtern entsprechen.</p>
      {/if}
    </div>
  {:else}
    <!-- Invites list -->
    <div class="invites-grid">
      {#each filteredInvites as invite (invite.id)}
        <InviteCard
          {invite}
          {userId}
          on:deleted={handleInviteDeleted}
          on:refreshNeeded={refreshData}
        />
      {/each}
    </div>
  {/if}

  <!-- Statistics section -->
  {#if stats && (stats.totalCreated > 0 || stats.totalUsed > 0)}
    <div class="statistics-section">
      <h3 class="text-lg font-semibold text-white mb-4">Statistiken</h3>
      <div class="stats-detailed">
        <div class="stat-item">
          <span class="stat-name">Gesamt erstellt:</span>
          <span class="stat-value">{stats.totalCreated}</span>
        </div>
        <div class="stat-item">
          <span class="stat-name">Erfolgreich verwendet:</span>
          <span class="stat-value">{stats.totalUsed}</span>
        </div>
        <div class="stat-item">
          <span class="stat-name">Conversion Rate:</span>
          <span class="stat-value">
            {stats.totalCreated > 0 ? Math.round((stats.totalUsed / stats.totalCreated) * 100) : 0}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-name">Erfolgreiche Registrierungen:</span>
          <span class="stat-value">{stats.successfulRegistrations}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .invite-manager {
    @apply space-y-6;
  }

  .header-section {
    @apply space-y-4;
  }

  .stats-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .stat-card {
    @apply bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3;
    @apply border border-white/20 hover:bg-white/15 transition-all duration-200;
  }

  .stat-card.primary {
    @apply bg-purple-600/20 border-purple-500/30;
  }

  .stat-card.warning {
    @apply bg-amber-600/20 border-amber-500/30;
  }

  .stat-icon {
    @apply flex-shrink-0 p-2 rounded-lg bg-white/10;
  }

  .stat-content {
    @apply min-w-0 flex-1;
  }

  .stat-value {
    @apply text-2xl font-bold text-white;
  }

  .stat-label {
    @apply text-sm text-white/70;
  }

  .actions-section {
    @apply space-y-4;
  }

  .filters-section {
    @apply border-t border-white/10 pt-4;
  }

  .filter-group {
    @apply flex items-center gap-2;
  }

  .filter-label {
    @apply text-sm text-white/70 font-medium whitespace-nowrap;
  }

  .filter-select {
    @apply bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm;
    @apply focus:ring-2 focus:ring-purple-500 focus:border-transparent;
  }

  .sort-toggle {
    @apply w-8 h-8 bg-white/10 border border-white/20 rounded-lg;
    @apply flex items-center justify-center text-white hover:bg-white/20;
    @apply transition-colors duration-200;
  }

  .btn-icon {
    @apply w-10 h-10 bg-white/10 border border-white/20 rounded-lg;
    @apply flex items-center justify-center text-white hover:bg-white/20;
    @apply transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg;
    @apply font-medium transition-colors duration-200 flex items-center gap-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg;
    @apply border border-white/20 font-medium transition-colors duration-200 flex items-center gap-2;
  }

  .message {
    @apply p-4 rounded-lg flex items-center gap-3 text-sm relative;
  }

  .message.error {
    @apply bg-red-600/20 border border-red-500/30 text-red-100;
  }

  .message.success {
    @apply bg-green-600/20 border border-green-500/30 text-green-100;
  }

  .message-close {
    @apply absolute top-2 right-2 w-6 h-6 flex items-center justify-center;
    @apply text-current opacity-70 hover:opacity-100 cursor-pointer;
  }

  .loading-state {
    @apply text-center py-12;
  }

  .loading-spinner {
    @apply w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4;
  }

  .empty-state {
    @apply text-center py-12;
  }

  .invites-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
  }

  .statistics-section {
    @apply border-t border-white/10 pt-6;
  }

  .stats-detailed {
    @apply bg-white/5 rounded-lg p-4 space-y-3;
  }

  .stat-item {
    @apply flex justify-between items-center;
  }

  .stat-name {
    @apply text-white/70;
  }

  .stat-item .stat-value {
    @apply text-lg font-semibold text-white;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .stats-grid {
      @apply grid-cols-2;
    }

    .stat-value {
      @apply text-xl;
    }

    .invites-grid {
      @apply grid-cols-1;
    }

    .filters-section .flex {
      @apply flex-col items-start gap-3;
    }

    .filter-group {
      @apply w-full justify-between;
    }
  }
</style>
