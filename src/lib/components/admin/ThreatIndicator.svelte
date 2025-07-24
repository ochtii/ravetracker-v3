<!--
  RaveTracker v3.0 - Threat Indicator Component
  ============================================
  Visual threat level indicator with real-time monitoring
  and automated threat analysis
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { securityService } from '$lib/services/security-service'
  import type { ThreatAnalysis, SecurityDashboardStats } from '$lib/types/invite'

  export let showDetails = true
  export let compact = false

  let threatAnalysis: ThreatAnalysis | null = null
  let dashboardStats: SecurityDashboardStats | null = null
  let loading = true
  let error = ''

  // Auto-refresh
  let refreshInterval: NodeJS.Timeout

  const threatLevelColors = {
    low: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-300',
      glow: 'shadow-green-500/25',
      pulse: 'animate-pulse-green'
    },
    medium: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50', 
      text: 'text-yellow-300',
      glow: 'shadow-yellow-500/25',
      pulse: 'animate-pulse-yellow'
    },
    high: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-300',
      glow: 'shadow-red-500/25',
      pulse: 'animate-pulse-red'
    },
    critical: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/50',
      text: 'text-purple-300',
      glow: 'shadow-purple-500/25',
      pulse: 'animate-pulse-purple'
    }
  }

  const systemStatusColors = {
    normal: 'text-green-400',
    elevated: 'text-yellow-400',
    high: 'text-red-400',
    emergency_locked: 'text-purple-400'
  }

  const threatIcons = {
    low: '🟢',
    medium: '🟡', 
    high: '🔴',
    critical: '🟣'
  }

  const systemStatusIcons = {
    normal: '✅',
    elevated: '⚠️',
    high: '🚨',
    emergency_locked: '🔒'
  }

  function getThreatLevelLabel(level: string): string {
    return {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
      critical: 'Critical Risk'
    }[level] || level.toUpperCase()
  }

  function getSystemStatusLabel(status: string): string {
    return {
      normal: 'Normal',
      elevated: 'Elevated',
      high: 'High Alert',
      emergency_locked: 'Emergency Lockdown'
    }[status] || status.replace('_', ' ').toUpperCase()
  }

  function getIndicatorTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      ip_frequency: '📊',
      email_pattern: '📧',
      code_guessing: '🔢',
      timing_pattern: '⏱️',
      geographic_anomaly: '🌍'
    }
    return icons[type] || '⚠️'
  }

  function formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`
  }

  async function loadThreatData() {
    try {
      loading = true
      error = ''
      
      const [analysis, stats] = await Promise.all([
        securityService.analyzeThreat(),
        securityService.getDashboardStats()
      ])
      
      threatAnalysis = analysis
      dashboardStats = stats
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load threat data'
      console.error('Error loading threat data:', err)
    } finally {
      loading = false
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = setInterval(loadThreatData, 30000) // Refresh every 30 seconds
  }

  onMount(() => {
    loadThreatData()
    startAutoRefresh()

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
    }
  })
</script>

<style>
  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  }
  
  @keyframes pulse-yellow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); }
  }
  
  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  }
  
  @keyframes pulse-purple {
    0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(168, 85, 247, 0); }
  }

  .animate-pulse-green { animation: pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-pulse-yellow { animation: pulse-yellow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-pulse-red { animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-pulse-purple { animation: pulse-purple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
</style>

{#if loading && !threatAnalysis}
  <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
    <div class="flex items-center justify-center">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
      <span class="ml-2 text-gray-400">Analyzing threats...</span>
    </div>
  </div>
{:else if error}
  <div class="bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-700/50 p-4">
    <div class="flex items-center text-red-400">
      <span class="text-lg">⚠️</span>
      <span class="ml-2">Error: {error}</span>
    </div>
  </div>
{:else if threatAnalysis && dashboardStats}
  <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
    <!-- Main Threat Level Display -->
    <div class="p-4 {compact ? '' : 'pb-6'}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">System Threat Level</h3>
        <div class="text-xs text-gray-400">
          Updated: {dashboardStats.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div class="flex items-center gap-6">
        <!-- Threat Level Indicator -->
        <div class="relative">
          <div class="
            w-24 h-24 rounded-full border-4 flex items-center justify-center
            {threatLevelColors[threatAnalysis.level].bg}
            {threatLevelColors[threatAnalysis.level].border}
            {threatAnalysis.level === 'critical' ? threatLevelColors[threatAnalysis.level].pulse : ''}
          ">
            <div class="text-center">
              <div class="text-2xl">{threatIcons[threatAnalysis.level]}</div>
              <div class="text-xs {threatLevelColors[threatAnalysis.level].text} font-bold">
                {formatPercentage(threatAnalysis.score)}
              </div>
            </div>
          </div>
        </div>

        <!-- Status Information -->
        <div class="flex-1 space-y-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400">Threat Level:</span>
              <span class="font-semibold {threatLevelColors[threatAnalysis.level].text}">
                {getThreatLevelLabel(threatAnalysis.level)}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm text-gray-400">System Status:</span>
              <span class="font-semibold {systemStatusColors[dashboardStats.systemStatus]}">
                {systemStatusIcons[dashboardStats.systemStatus]} {getSystemStatusLabel(dashboardStats.systemStatus)}
              </span>
            </div>
          </div>

          <!-- Quick Stats -->
          {#if !compact}
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div class="text-center">
                <div class="text-xl font-bold text-white">{dashboardStats.suspiciousActivities}</div>
                <div class="text-gray-400">Suspicious</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-white">{dashboardStats.blockedIPs}</div>
                <div class="text-gray-400">Blocked IPs</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-white">{Math.round(dashboardStats.successRate)}%</div>
                <div class="text-gray-400">Success Rate</div>
              </div>
              <div class="text-center">
                <div class="text-xl font-bold text-white">{dashboardStats.uniqueIPs}</div>
                <div class="text-gray-400">Unique IPs</div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Detailed Analysis -->
    {#if showDetails && !compact && threatAnalysis.indicators.length > 0}
      <div class="border-t border-gray-700/50 p-4">
        <h4 class="text-md font-semibold text-white mb-3">Threat Indicators</h4>
        <div class="space-y-2">
          {#each threatAnalysis.indicators as indicator}
            <div class="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div class="flex items-center gap-3">
                <span class="text-lg">{getIndicatorTypeIcon(indicator.type)}</span>
                <div>
                  <div class="text-white font-medium">{indicator.description}</div>
                  <div class="text-sm text-gray-400">
                    {indicator.type.replace('_', ' ').toUpperCase()} • Count: {indicator.count}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <span class="px-2 py-1 rounded text-xs {
                  indicator.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                  indicator.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-green-500/20 text-green-300'
                }">
                  {indicator.severity.toUpperCase()}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recommendations -->
    {#if showDetails && !compact && threatAnalysis.recommendations.length > 0}
      <div class="border-t border-gray-700/50 p-4">
        <h4 class="text-md font-semibold text-white mb-3">Recommendations</h4>
        <div class="space-y-2">
          {#each threatAnalysis.recommendations as recommendation}
            <div class="flex items-start gap-2 text-sm">
              <span class="text-blue-400 mt-0.5">•</span>
              <span class="text-gray-300">{recommendation}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Auto Actions -->
    {#if showDetails && !compact && threatAnalysis.autoActions.length > 0}
      <div class="border-t border-gray-700/50 p-4">
        <h4 class="text-md font-semibold text-white mb-3">Automated Actions</h4>
        <div class="space-y-2">
          {#each threatAnalysis.autoActions as action}
            <div class="flex items-center justify-between p-2 bg-blue-900/20 rounded">
              <div class="flex items-center gap-2">
                <span class="text-blue-400">🤖</span>
                <span class="text-blue-300 font-medium">
                  {action.action.replace('_', ' ').toUpperCase()}
                </span>
                <span class="text-gray-400">•</span>
                <span class="text-gray-300 text-sm">{action.reason}</span>
              </div>
              {#if action.appliedAt}
                <span class="text-xs text-gray-400">
                  Applied: {action.appliedAt.toLocaleTimeString()}
                </span>
              {:else}
                <span class="text-xs text-yellow-400">Pending</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
