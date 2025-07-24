<!--
  RaveTracker v3.0 - Security & Monitoring Dashboard
  ==================================================
  Comprehensive security dashboard with real-time monitoring,
  threat analysis, and admin security tools
-->

<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { isAuthenticated, isAdmin, profile } from '$lib/stores/auth'
  import { goto } from '$app/navigation'
  import SecurityLog from '$lib/components/admin/SecurityLog.svelte'
  import ThreatIndicator from '$lib/components/admin/ThreatIndicator.svelte'
  import { securityService } from '$lib/services/security-service'
  import type { IPBlock, EmailBlock, SecurityEvent, SecurityReport } from '$lib/types/invite'

  // Authentication check
  $: if (!$isAuthenticated || !$isAdmin) {
    goto('/admin/login')
  }

  // Tab management
  let activeTab = 'overview'
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'log', label: 'Activity Log', icon: '📝' },
    { id: 'threats', label: 'Threat Analysis', icon: '🚨' },
    { id: 'blocking', label: 'IP & Email Blocking', icon: '🚫' },
    { id: 'settings', label: 'Security Settings', icon: '⚙️' },
    { id: 'reports', label: 'Reports', icon: '📄' }
  ]

  // Data
  let securityEvents: SecurityEvent[] = []
  let blockedIPs: IPBlock[] = []
  let blockedEmails: EmailBlock[] = []
  let securityReport: SecurityReport | null = null
  let loading = false

  // Forms
  let newIPBlock = { ip: '', reason: '', duration: 24 }
  let newEmailBlock = { email: '', reason: '' }
  let rateLimit = { validation: { limit: 10, window: 60 }, invite: { limit: 1, window: 60 } }
  let emergencyLockdown = false

  // Update URL when tab changes
  $: if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', activeTab)
    window.history.replaceState({}, '', url.toString())
  }

  // Load initial data
  onMount(async () => {
    // Get tab from URL
    const urlTab = $page.url.searchParams.get('tab')
    if (urlTab && tabs.some(t => t.id === urlTab)) {
      activeTab = urlTab
    }

    await loadSecurityData()
  })

  async function loadSecurityData() {
    try {
      loading = true

      const [events, ips, emails] = await Promise.all([
        securityService.getSecurityEvents(),
        securityService.getBlockedIPs(),
        securityService.getBlockedEmails()
      ])

      securityEvents = events
      blockedIPs = ips
      blockedEmails = emails
      emergencyLockdown = securityService.getSystemStatus() === 'emergency_locked'
      
    } catch (err) {
      console.error('Error loading security data:', err)
    } finally {
      loading = false
    }
  }

  async function blockIP() {
    if (!newIPBlock.ip.trim() || !newIPBlock.reason.trim()) {
      alert('Please enter both IP address and reason')
      return
    }

    try {
      await securityService.blockIP(
        newIPBlock.ip.trim(),
        newIPBlock.reason.trim(),
        newIPBlock.duration,
        $profile?.id || 'admin'
      )
      
      newIPBlock = { ip: '', reason: '', duration: 24 }
      await loadSecurityData()
      
    } catch (err) {
      alert('Failed to block IP: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function unblockIP(ipAddress: string) {
    try {
      await securityService.unblockIP(ipAddress, $profile?.id || 'admin')
      await loadSecurityData()
    } catch (err) {
      alert('Failed to unblock IP: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function blockEmail() {
    if (!newEmailBlock.email.trim() || !newEmailBlock.reason.trim()) {
      alert('Please enter both email address and reason')
      return
    }

    try {
      await securityService.blockEmail(
        newEmailBlock.email.trim(),
        newEmailBlock.reason.trim(),
        $profile?.id || 'admin'
      )
      
      newEmailBlock = { email: '', reason: '' }
      await loadSecurityData()
      
    } catch (err) {
      alert('Failed to block email: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function unblockEmail(email: string) {
    try {
      await securityService.unblockEmail(email)
      await loadSecurityData()
    } catch (err) {
      alert('Failed to unblock email: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function updateRateLimit(type: 'validation' | 'invite_creation') {
    try {
      const config = rateLimit[type === 'validation' ? 'validation' : 'invite']
      await securityService.updateRateLimit(type, config.limit, config.window)
      alert(`Rate limit updated for ${type}`)
    } catch (err) {
      alert('Failed to update rate limit: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function toggleEmergencyLockdown() {
    const confirm = window.confirm(
      emergencyLockdown 
        ? 'Are you sure you want to disable emergency lockdown?' 
        : 'Are you sure you want to enable emergency lockdown? This will block all new registrations.'
    )
    
    if (!confirm) return

    try {
      await securityService.emergencyLockdown(
        !emergencyLockdown,
        emergencyLockdown ? undefined : 'Manual activation from security dashboard'
      )
      emergencyLockdown = !emergencyLockdown
      await loadSecurityData()
    } catch (err) {
      alert('Failed to toggle emergency lockdown: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function resolveEvent(eventId: string) {
    try {
      await securityService.resolveSecurityEvent(eventId, $profile?.id || 'admin')
      await loadSecurityData()
    } catch (err) {
      alert('Failed to resolve event: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function generateReport(type: 'weekly' | 'incident' | 'threat_assessment') {
    try {
      loading = true
      securityReport = await securityService.generateSecurityReport(type)
    } catch (err) {
      alert('Failed to generate report: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      loading = false
    }
  }

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  function getSeverityColor(severity: string): string {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-red-400', 
      critical: 'text-purple-400'
    }
    return colors[severity as keyof typeof colors] || 'text-gray-400'
  }
</script>

<svelte:head>
  <title>Security Dashboard - RaveTracker Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Security & Monitoring Dashboard</h1>
      <p class="text-gray-300">Monitor system security, analyze threats, and manage access controls</p>
    </div>

    <!-- Emergency Status Banner -->
    {#if emergencyLockdown}
      <div class="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🚨</span>
            <div>
              <h3 class="text-red-300 font-semibold">Emergency Lockdown Active</h3>
              <p class="text-red-400 text-sm">All new registrations are currently blocked</p>
            </div>
          </div>
          <button
            on:click={toggleEmergencyLockdown}
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Disable Lockdown
          </button>
        </div>
      </div>
    {/if}

    <!-- Navigation Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
        {#each tabs as tab}
          <button
            on:click={() => activeTab = tab.id}
            class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors {
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }"
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        {/each}
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="space-y-6">
      {#if activeTab === 'overview'}
        <!-- Overview Tab -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <!-- Threat Indicator -->
          <div class="xl:col-span-2">
            <ThreatIndicator showDetails={true} compact={false} />
          </div>

          <!-- Recent Events -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <h3 class="text-lg font-semibold text-white mb-4">Recent Security Events</h3>
            <div class="space-y-3 max-h-96 overflow-auto">
              {#each securityEvents.slice(0, 10) as event}
                <div class="flex items-start justify-between p-3 bg-gray-700/30 rounded">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="{getSeverityColor(event.severity)} font-medium text-sm">
                        {event.severity.toUpperCase()}
                      </span>
                      <span class="text-gray-400 text-xs">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p class="text-white text-sm">{event.description}</p>
                    <p class="text-gray-400 text-xs">IP: {event.ipAddress}</p>
                  </div>
                  {#if !event.resolved}
                    <button
                      on:click={() => resolveEvent(event.id)}
                      class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Resolve
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

      {:else if activeTab === 'log'}
        <!-- Activity Log Tab -->
        <SecurityLog height="700px" />

      {:else if activeTab === 'threats'}
        <!-- Threat Analysis Tab -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThreatIndicator showDetails={true} compact={false} />
          
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <h3 class="text-lg font-semibold text-white mb-4">All Security Events</h3>
            <div class="space-y-2 max-h-96 overflow-auto">
              {#each securityEvents as event}
                <div class="p-3 bg-gray-700/30 rounded border border-gray-600/50">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="{getSeverityColor(event.severity)} font-medium">
                        {event.severity.toUpperCase()}
                      </span>
                      <span class="text-gray-400 text-sm">{event.type.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <span class="text-xs text-gray-400">{formatDate(event.timestamp)}</span>
                  </div>
                  <p class="text-white mb-2">{event.description}</p>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-400">IP: {event.ipAddress}</span>
                    {#if event.resolved}
                      <span class="text-green-400">✅ Resolved</span>
                    {:else}
                      <button
                        on:click={() => resolveEvent(event.id)}
                        class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                      >
                        Resolve
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

      {:else if activeTab === 'blocking'}
        <!-- IP & Email Blocking Tab -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- IP Blocking -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">IP Address Blocking</h3>
            
            <!-- Add New IP Block -->
            <div class="mb-6 p-4 bg-gray-700/30 rounded-lg">
              <h4 class="text-md font-medium text-white mb-3">Block New IP</h4>
              <div class="space-y-3">
                <input
                  type="text"
                  bind:value={newIPBlock.ip}
                  placeholder="IP Address (e.g., 192.168.1.1)"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                >
                <input
                  type="text"
                  bind:value={newIPBlock.reason}
                  placeholder="Reason for blocking"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                >
                <div class="flex items-center gap-3">
                  <span class="text-sm text-gray-400">Duration (hours):</span>
                  <input
                    type="number"
                    bind:value={newIPBlock.duration}
                    min="1"
                    max="8760"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white w-20"
                  >
                  <button
                    on:click={blockIP}
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Block IP
                  </button>
                </div>
              </div>
            </div>

            <!-- Blocked IPs List -->
            <div class="space-y-2 max-h-80 overflow-auto">
              {#each blockedIPs as block}
                <div class="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                  <div class="flex-1">
                    <div class="text-white font-mono">{block.ipAddress}</div>
                    <div class="text-sm text-gray-400">{block.reason}</div>
                    <div class="text-xs text-gray-500">
                      Blocked: {formatDate(block.blockedAt)} 
                      {#if block.isActive}
                        | Expires: {formatDate(block.expiresAt)}
                      {:else}
                        | Inactive
                      {/if}
                    </div>
                  </div>
                  {#if block.isActive}
                    <button
                      on:click={() => unblockIP(block.ipAddress)}
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Unblock
                    </button>
                  {:else}
                    <span class="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm">Inactive</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          <!-- Email Blocking -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Email Address Blocking</h3>
            
            <!-- Add New Email Block -->
            <div class="mb-6 p-4 bg-gray-700/30 rounded-lg">
              <h4 class="text-md font-medium text-white mb-3">Block New Email</h4>
              <div class="space-y-3">
                <input
                  type="email"
                  bind:value={newEmailBlock.email}
                  placeholder="Email Address"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                >
                <input
                  type="text"
                  bind:value={newEmailBlock.reason}
                  placeholder="Reason for blocking"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
                >
                <button
                  on:click={blockEmail}
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Block Email
                </button>
              </div>
            </div>

            <!-- Blocked Emails List -->
            <div class="space-y-2 max-h-80 overflow-auto">
              {#each blockedEmails as block}
                <div class="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                  <div class="flex-1">
                    <div class="text-white">{block.email}</div>
                    <div class="text-sm text-gray-400">{block.reason}</div>
                    <div class="text-xs text-gray-500">
                      Blocked: {formatDate(block.blockedAt)}
                    </div>
                  </div>
                  <button
                    on:click={() => unblockEmail(block.email)}
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    Unblock
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>

      {:else if activeTab === 'settings'}
        <!-- Security Settings Tab -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Rate Limiting -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Rate Limiting</h3>
            
            <div class="space-y-6">
              <!-- Validation Rate Limit -->
              <div>
                <h4 class="text-md font-medium text-white mb-3">Code Validation</h4>
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    bind:value={rateLimit.validation.limit}
                    min="1"
                    max="100"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white w-20"
                  >
                  <span class="text-gray-400">attempts per</span>
                  <input
                    type="number"
                    bind:value={rateLimit.validation.window}
                    min="1"
                    max="1440"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white w-20"
                  >
                  <span class="text-gray-400">minutes</span>
                  <button
                    on:click={() => updateRateLimit('validation')}
                    class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Update
                  </button>
                </div>
              </div>

              <!-- Invite Creation Rate Limit -->
              <div>
                <h4 class="text-md font-medium text-white mb-3">Invite Creation</h4>
                <div class="flex items-center gap-3">
                  <input
                    type="number"
                    bind:value={rateLimit.invite.limit}
                    min="1"
                    max="10"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white w-20"
                  >
                  <span class="text-gray-400">invites per</span>
                  <input
                    type="number"
                    bind:value={rateLimit.invite.window}
                    min="1"
                    max="1440"
                    class="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white w-20"
                  >
                  <span class="text-gray-400">minutes</span>
                  <button
                    on:click={() => updateRateLimit('invite_creation')}
                    class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Emergency Controls -->
          <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Emergency Controls</h3>
            
            <div class="space-y-4">
              <div class="p-4 {emergencyLockdown ? 'bg-red-900/20 border border-red-500' : 'bg-gray-700/30'} rounded-lg">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="text-md font-medium text-white">Emergency Lockdown</h4>
                    <p class="text-sm text-gray-400">Block all new registrations</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm {emergencyLockdown ? 'text-red-400' : 'text-green-400'}">
                      {emergencyLockdown ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      on:click={toggleEmergencyLockdown}
                      class="px-4 py-2 {emergencyLockdown ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded transition-colors"
                    >
                      {emergencyLockdown ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
                {#if emergencyLockdown}
                  <div class="text-sm text-red-300">
                    ⚠️ All invite code validation is currently blocked. Only existing users can access the system.
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

      {:else if activeTab === 'reports'}
        <!-- Reports Tab -->
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-white">Security Reports</h3>
            <div class="flex gap-2">
              <button
                on:click={() => generateReport('weekly')}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                disabled={loading}
              >
                Weekly Report
              </button>
              <button
                on:click={() => generateReport('threat_assessment')}
                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                disabled={loading}
              >
                Threat Assessment
              </button>
            </div>
          </div>

          {#if loading}
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span class="ml-3 text-gray-400">Generating report...</span>
            </div>
          {:else if securityReport}
            <div class="space-y-6">
              <!-- Report Header -->
              <div class="border-b border-gray-700/50 pb-4">
                <h4 class="text-xl font-semibold text-white">{securityReport.title}</h4>
                <p class="text-gray-400 mt-1">{securityReport.summary}</p>
                <p class="text-sm text-gray-500 mt-2">
                  Generated: {formatDate(securityReport.generatedAt)} | 
                  Period: {formatDate(securityReport.period.start)} - {formatDate(securityReport.period.end)}
                </p>
              </div>

              <!-- Metrics -->
              <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div class="text-center p-4 bg-gray-700/30 rounded">
                  <div class="text-2xl font-bold text-white">{securityReport.metrics.totalAttempts}</div>
                  <div class="text-sm text-gray-400">Total Attempts</div>
                </div>
                <div class="text-center p-4 bg-gray-700/30 rounded">
                  <div class="text-2xl font-bold text-red-400">{securityReport.metrics.blockedAttempts}</div>
                  <div class="text-sm text-gray-400">Blocked</div>
                </div>
                <div class="text-center p-4 bg-gray-700/30 rounded">
                  <div class="text-2xl font-bold text-yellow-400">{securityReport.metrics.newThreats}</div>
                  <div class="text-sm text-gray-400">New Threats</div>
                </div>
                <div class="text-center p-4 bg-gray-700/30 rounded">
                  <div class="text-2xl font-bold text-green-400">{securityReport.metrics.resolvedIncidents}</div>
                  <div class="text-sm text-gray-400">Resolved</div>
                </div>
                <div class="text-center p-4 bg-gray-700/30 rounded">
                  <div class="text-2xl font-bold text-blue-400">{securityReport.metrics.falsePositives}</div>
                  <div class="text-sm text-gray-400">False Positives</div>
                </div>
              </div>

              <!-- Trends -->
              <div>
                <h5 class="text-lg font-medium text-white mb-3">Trends</h5>
                <div class="space-y-2">
                  {#each securityReport.trends as trend}
                    <div class="flex items-center justify-between p-3 bg-gray-700/30 rounded">
                      <span class="text-white">{trend.metric}</span>
                      <div class="flex items-center gap-2">
                        <span class="text-{trend.direction === 'up' ? 'red' : trend.direction === 'down' ? 'green' : 'gray'}-400">
                          {trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '→'}
                          {trend.percentage > 0 ? `${trend.percentage}%` : 'No change'}
                        </span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Recommendations -->
              <div>
                <h5 class="text-lg font-medium text-white mb-3">Recommendations</h5>
                <div class="space-y-2">
                  {#each securityReport.recommendations as recommendation}
                    <div class="flex items-start gap-2 p-3 bg-blue-900/20 rounded">
                      <span class="text-blue-400 mt-0.5">•</span>
                      <span class="text-gray-300">{recommendation}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {:else}
            <div class="text-center py-12 text-gray-400">
              <p class="text-lg">📊 No Report Generated</p>
              <p class="text-sm mt-2">Click one of the buttons above to generate a security report</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
