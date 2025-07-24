<!--
  RaveTracker v3.0 - Security Log Component
  ========================================
  Real-time log of all code validation attempts with advanced filtering
  and suspicious activity detection
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { securityService } from '$lib/services/security-service'
  import type { ValidationAttempt } from '$lib/types/invite'

  export let height = '600px'

  let attempts: ValidationAttempt[] = []
  let loading = true
  let error = ''
  let currentPage = 1
  let totalPages = 1
  let totalAttempts = 0

  // Filters
  let showSuccessful = true
  let showFailed = true
  let showSuspicious = true
  let ipFilter = ''
  let dateRangeStart = ''
  let dateRangeEnd = ''

  // Auto-refresh
  let autoRefresh = true
  let refreshInterval: NodeJS.Timeout

  const statusColors = {
    success: 'text-green-400',
    failed: 'text-red-400',
    suspicious: 'text-yellow-400'
  }

  const riskColors = {
    low: 'bg-green-500/20 text-green-300',
    medium: 'bg-yellow-500/20 text-yellow-300', 
    high: 'bg-red-500/20 text-red-300',
    critical: 'bg-purple-500/20 text-purple-300'
  }

  function getRiskLevel(score: number): keyof typeof riskColors {
    if (score >= 0.8) return 'critical'
    if (score >= 0.5) return 'high'
    if (score >= 0.3) return 'medium'
    return 'low'
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  function getCountryFlag(countryCode?: string): string {
    if (!countryCode) return '🌍'
    
    const flags: Record<string, string> = {
      'DE': '🇩🇪',
      'US': '🇺🇸', 
      'GB': '🇬🇧',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'RU': '🇷🇺',
      'CN': '🇨🇳',
      'JP': '🇯🇵'
    }
    
    return flags[countryCode] || '🌍'
  }

  async function loadAttempts() {
    try {
      loading = true
      error = ''

      const filters: any = {}
      
      // Apply success/failure filter
      if (showSuccessful && !showFailed) {
        filters.success = true
      } else if (!showSuccessful && showFailed) {
        filters.success = false
      }

      // Apply suspicious filter
      if (!showSuspicious) {
        filters.suspicious = false
      }

      // Apply IP filter
      if (ipFilter.trim()) {
        filters.ipAddress = ipFilter.trim()
      }

      // Apply date range filter
      if (dateRangeStart && dateRangeEnd) {
        filters.dateRange = {
          start: new Date(dateRangeStart),
          end: new Date(dateRangeEnd)
        }
      }

      const result = await securityService.getValidationAttempts(currentPage, 50, filters)
      attempts = result.attempts
      totalPages = result.pages
      totalAttempts = result.total

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load attempts'
      console.error('Error loading validation attempts:', err)
    } finally {
      loading = false
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    
    if (autoRefresh) {
      refreshInterval = setInterval(loadAttempts, 5000) // Refresh every 5 seconds
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh
    startAutoRefresh()
  }

  function resetFilters() {
    showSuccessful = true
    showFailed = true
    showSuspicious = true
    ipFilter = ''
    dateRangeStart = ''
    dateRangeEnd = ''
    currentPage = 1
    loadAttempts()
  }

  function changePage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page
      loadAttempts()
    }
  }

  onMount(() => {
    loadAttempts()
    startAutoRefresh()

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  })

  // Reactive updates when filters change
  $: if (showSuccessful !== undefined) loadAttempts()
  $: if (showFailed !== undefined) loadAttempts()
  $: if (showSuspicious !== undefined) loadAttempts()
</script>

<div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50" style="height: {height}">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-700/50">
    <div class="flex items-center gap-4">
      <h3 class="text-lg font-semibold text-white">Code Validation Log</h3>
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>Total: {totalAttempts}</span>
        <span>•</span>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full {autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}"></div>
          <span>{autoRefresh ? 'Live' : 'Paused'}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        on:click={toggleAutoRefresh}
        class="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
      >
        {autoRefresh ? 'Pause' : 'Resume'}
      </button>
      <button
        on:click={loadAttempts}
        class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Refresh'}
      </button>
    </div>
  </div>

  <!-- Filters -->
  <div class="p-4 border-b border-gray-700/50 space-y-3">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Status Filters -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">Show:</span>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={showSuccessful} class="rounded">
          <span class="text-green-400">Successful</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={showFailed} class="rounded">
          <span class="text-red-400">Failed</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={showSuspicious} class="rounded">
          <span class="text-yellow-400">Suspicious</span>
        </label>
      </div>

      <!-- IP Filter -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-400">IP:</span>
        <input
          type="text"
          bind:value={ipFilter}
          on:input={loadAttempts}
          placeholder="Filter by IP..."
          class="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 w-32"
        >
      </div>

      <!-- Date Range -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-400">From:</span>
        <input
          type="datetime-local"
          bind:value={dateRangeStart}
          on:change={loadAttempts}
          class="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white w-40"
        >
        <span class="text-sm text-gray-400">To:</span>
        <input
          type="datetime-local"
          bind:value={dateRangeEnd}
          on:change={loadAttempts}
          class="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white w-40"
        >
      </div>

      <button
        on:click={resetFilters}
        class="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
      >
        Reset
      </button>
    </div>
  </div>

  <!-- Log Content -->
  <div class="flex-1 overflow-hidden">
    {#if loading && attempts.length === 0}
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    {:else if error}
      <div class="flex items-center justify-center h-64">
        <div class="text-red-400 text-center">
          <p class="text-lg">⚠️ Error Loading Log</p>
          <p class="text-sm mt-2">{error}</p>
          <button
            on:click={loadAttempts}
            class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    {:else if attempts.length === 0}
      <div class="flex items-center justify-center h-64">
        <div class="text-gray-400 text-center">
          <p class="text-lg">📝 No Attempts Found</p>
          <p class="text-sm mt-2">No validation attempts match your current filters</p>
        </div>
      </div>
    {:else}
      <div class="overflow-auto" style="height: calc({height} - 160px)">
        <div class="space-y-2 p-4">
          {#each attempts as attempt (attempt.id)}
            <div class="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50 hover:border-gray-500/50 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1 space-y-2">
                  <!-- First Row: Time, Status, Code -->
                  <div class="flex items-center gap-4 text-sm">
                    <span class="text-gray-300 font-mono">{formatDate(attempt.attemptedAt)}</span>
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full {attempt.success ? 'bg-green-400' : 'bg-red-400'}"></div>
                      <span class="{attempt.success ? statusColors.success : statusColors.failed}">
                        {attempt.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>
                    <span class="text-white font-mono bg-gray-800 px-2 py-1 rounded text-xs">
                      {attempt.codeAttempted}
                    </span>
                    {#if attempt.isSuspicious}
                      <span class="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                        🚨 SUSPICIOUS
                      </span>
                    {/if}
                  </div>

                  <!-- Second Row: IP, Country, Risk Score -->
                  <div class="flex items-center gap-4 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">IP:</span>
                      <span class="text-white font-mono">{attempt.ipAddress}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <span>{getCountryFlag(attempt.country)}</span>
                      <span class="text-gray-300">{attempt.country || 'Unknown'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">Risk:</span>
                      <span class="px-2 py-1 rounded text-xs {riskColors[getRiskLevel(attempt.riskScore)]}">
                        {Math.round(attempt.riskScore * 100)}%
                      </span>
                    </div>
                    {#if attempt.emailAttempted}
                      <div class="flex items-center gap-2">
                        <span class="text-gray-400">Email:</span>
                        <span class="text-white">{attempt.emailAttempted}</span>
                      </div>
                    {/if}
                  </div>

                  <!-- Third Row: User Agent (truncated) -->
                  {#if attempt.userAgent}
                    <div class="text-xs text-gray-500">
                      <span class="text-gray-400">UA:</span>
                      <span class="font-mono">{attempt.userAgent.substring(0, 80)}{attempt.userAgent.length > 80 ? '...' : ''}</span>
                    </div>
                  {/if}

                  <!-- Metadata -->
                  {#if attempt.metadata && Object.keys(attempt.metadata).length > 0}
                    <div class="flex flex-wrap gap-2 mt-2">
                      {#each Object.entries(attempt.metadata) as [key, value]}
                        <span class="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                          {key}: {JSON.stringify(value)}
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-700/50">
          <div class="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div class="flex items-center gap-2">
            <button
              on:click={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
              class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Previous
            </button>
            <button
              on:click={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              class="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
