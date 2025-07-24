<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button } from '$lib/components/ui';
  import { actionCodeService } from '$lib/services/action-code-service';
  import type { ActionCodeStats, ActionCodeDashboardStats, ActionCodeDemographics } from '$lib/types/invite';

  export let refreshTrigger = 0;

  // State
  let stats: ActionCodeStats | null = null;
  let dashboardStats: ActionCodeDashboardStats | null = null;
  let demographics: ActionCodeDemographics | null = null;
  let loading = false;
  let selectedTimeRange = '7d';
  let selectedCodeId: string | null = null;

  const timeRanges = [
    { value: '24h', label: 'Letzte 24h' },
    { value: '7d', label: 'Letzte 7 Tage' },
    { value: '30d', label: 'Letzte 30 Tage' },
    { value: '90d', label: 'Letzte 90 Tage' },
    { value: 'all', label: 'Alle Zeit' }
  ];

  onMount(async () => {
    await loadStats();
  });

  $: if (refreshTrigger > 0) {
    loadStats();
  }

  async function loadStats() {
    loading = true;
    
    try {
      // Load dashboard stats
      dashboardStats = await actionCodeService.getDashboardStats();
      
      // Load specific code stats if selected
      if (selectedCodeId) {
        stats = await actionCodeService.getActionCodeStats(selectedCodeId, selectedTimeRange);
        demographics = await actionCodeService.getDemographics(selectedCodeId, selectedTimeRange);
      }
    } catch (error) {
      console.error('Error loading action code stats:', error);
    } finally {
      loading = false;
    }
  }

  function formatNumber(num: number) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatPercentage(value: number, total: number) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }

  function getConversionRate() {
    if (!stats || stats.totalUses === 0) return '0%';
    return ((stats.successfulUses / stats.totalUses) * 100).toFixed(1) + '%';
  }

  function getRoiColor(roi: number) {
    if (roi >= 300) return 'text-green-400';
    if (roi >= 200) return 'text-green-300';
    if (roi >= 100) return 'text-yellow-400';
    if (roi >= 50) return 'text-orange-400';
    return 'text-red-400';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-xl font-bold text-white">Aktionscode-Statistiken</h3>
      <p class="text-white/70">Übersicht über Performance und Verwendung</p>
    </div>
    
    <div class="flex items-center gap-3">
      <select
        bind:value={selectedTimeRange}
        on:change={loadStats}
        class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      >
        {#each timeRanges as range}
          <option value={range.value}>{range.label}</option>
        {/each}
      </select>
      
      <Button
        variant="secondary"
        size="sm"
        onclick={loadStats}
        loading={loading}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </Button>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      <span class="ml-3 text-white/70">Lade Statistiken...</span>
    </div>
  {:else}
    <!-- Dashboard Overview -->
    {#if dashboardStats}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Codes -->
        <Card variant="glass">
          <div class="p-4 text-center">
            <div class="w-12 h-12 mx-auto mb-3 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 class="text-2xl font-bold text-white">{formatNumber(dashboardStats.totalCodes)}</h4>
            <p class="text-white/60 text-sm">Gesamt Codes</p>
            <div class="mt-2 text-xs">
              <span class="text-green-400">{dashboardStats.activeCodes} aktiv</span>
              <span class="text-white/40 mx-2">•</span>
              <span class="text-red-400">{dashboardStats.inactiveCodes} inaktiv</span>
            </div>
          </div>
        </Card>

        <!-- Total Uses -->
        <Card variant="glass">
          <div class="p-4 text-center">
            <div class="w-12 h-12 mx-auto mb-3 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h4 class="text-2xl font-bold text-white">{formatNumber(dashboardStats.totalUses)}</h4>
            <p class="text-white/60 text-sm">Verwendungen</p>
            <div class="mt-2 text-xs">
              <span class="text-green-400">{dashboardStats.successfulUses} erfolgreich</span>
            </div>
          </div>
        </Card>

        <!-- Success Rate -->
        <Card variant="glass">
          <div class="p-4 text-center">
            <div class="w-12 h-12 mx-auto mb-3 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 class="text-2xl font-bold text-white">
              {formatPercentage(dashboardStats.successfulUses, dashboardStats.totalUses)}
            </h4>
            <p class="text-white/60 text-sm">Erfolgsrate</p>
            <div class="mt-2 text-xs">
              <span class="text-red-400">{dashboardStats.totalUses - dashboardStats.successfulUses} fehlgeschlagen</span>
            </div>
          </div>
        </Card>

        <!-- Unique Users -->
        <Card variant="glass">
          <div class="p-4 text-center">
            <div class="w-12 h-12 mx-auto mb-3 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h4 class="text-2xl font-bold text-white">{formatNumber(dashboardStats.uniqueUsers)}</h4>
            <p class="text-white/60 text-sm">Eindeutige Nutzer</p>
            <div class="mt-2 text-xs">
              <span class="text-purple-400">{formatNumber(dashboardStats.totalCreditsIssued)} Credits ausgegeben</span>
            </div>
          </div>
        </Card>
      </div>

      <!-- Top Performing Codes -->
      <Card variant="glass">
        <div class="p-6">
          <h4 class="text-lg font-semibold text-white mb-4">Top Performance Codes</h4>
          
          {#if dashboardStats.topCodes.length > 0}
            <div class="space-y-3">
              {#each dashboardStats.topCodes as code}
                <div 
                  class="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  on:click={() => { selectedCodeId = code.id; loadStats(); }}
                  role="button"
                  tabindex="0"
                >
                  <div class="flex items-center space-x-3">
                    <span class="font-mono text-purple-300 font-semibold">
                      {code.code}
                    </span>
                    <div>
                      <span class="text-white font-medium">
                        {code.name || 'Unbenannt'}
                      </span>
                      <p class="text-white/60 text-xs">
                        {code.type} • {code.campaign || 'Keine Kampagne'}
                      </p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-4 text-right">
                    <div>
                      <span class="text-white font-medium">{code.currentUses}</span>
                      <p class="text-white/60 text-xs">Verwendungen</p>
                    </div>
                    <div>
                      <span class="text-green-400 font-medium">
                        {formatPercentage(code.successfulUses, code.currentUses)}
                      </span>
                      <p class="text-white/60 text-xs">Erfolg</p>
                    </div>
                    <div class="text-right">
                      <span class="{getRoiColor(code.roi)} font-medium">
                        {code.roi.toFixed(0)}%
                      </span>
                      <p class="text-white/60 text-xs">ROI</p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8">
              <svg class="w-12 h-12 text-white/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p class="text-white/60">Noch keine Codes mit Verwendungen gefunden</p>
            </div>
          {/if}
        </div>
      </Card>
    {/if}

    <!-- Detailed Stats for Selected Code -->
    {#if stats && selectedCodeId}
      <Card variant="glass">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-lg font-semibold text-white">Detaillierte Statistiken</h4>
            <Button
              variant="secondary"
              size="sm"
              onclick={() => { selectedCodeId = null; stats = null; demographics = null; }}
            >
              Schließen
            </Button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <!-- Usage Chart -->
            <div class="md:col-span-2">
              <h5 class="text-white font-medium mb-3">Verwendungen über Zeit</h5>
              {#if stats.hourlyUsage.length > 0}
                <div class="bg-white/5 rounded-lg p-4">
                  <div class="flex items-end justify-between h-32 gap-1">
                    {#each stats.hourlyUsage as usage}
                      <div class="flex flex-col items-center flex-1">
                        <div 
                          class="bg-purple-400 rounded-t w-full transition-all duration-300"
                          style="height: {usage.uses > 0 ? Math.max((usage.uses / Math.max(...stats.hourlyUsage.map(u => u.uses))) * 100, 5) : 0}%"
                        ></div>
                        <span class="text-white/60 text-xs mt-1">
                          {new Date(usage.hour).getHours()}h
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {:else}
                <div class="bg-white/5 rounded-lg p-8 text-center">
                  <p class="text-white/60">Keine Verwendungsdaten verfügbar</p>
                </div>
              {/if}
            </div>

            <!-- Key Metrics -->
            <div class="space-y-4">
              <div class="bg-white/5 rounded-lg p-4">
                <h6 class="text-white/80 text-sm mb-2">Conversion Rate</h6>
                <span class="text-2xl font-bold text-green-400">{getConversionRate()}</span>
              </div>
              
              <div class="bg-white/5 rounded-lg p-4">
                <h6 class="text-white/80 text-sm mb-2">Durchschn. Credits/Nutzung</h6>
                <span class="text-2xl font-bold text-blue-400">
                  {stats.totalUses > 0 ? (stats.totalCreditsIssued / stats.totalUses).toFixed(1) : '0'}
                </span>
              </div>
              
              <div class="bg-white/5 rounded-lg p-4">
                <h6 class="text-white/80 text-sm mb-2">ROI</h6>
                <span class="text-2xl font-bold {getRoiColor(stats.roi)}">
                  {stats.roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <!-- Demographics -->
          {#if demographics}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Age Distribution -->
              <div>
                <h5 class="text-white font-medium mb-3">Altersverteilung</h5>
                <div class="space-y-2">
                  {#each Object.entries(demographics.ageGroups) as [age, count]}
                    <div class="flex items-center justify-between">
                      <span class="text-white/80 text-sm">{age}</span>
                      <div class="flex items-center flex-1 mx-3">
                        <div class="bg-white/10 rounded-full h-2 flex-1">
                          <div 
                            class="bg-purple-400 h-2 rounded-full transition-all duration-300"
                            style="width: {formatPercentage(count, Object.values(demographics.ageGroups).reduce((a, b) => a + b, 0)).replace('%', '')}%"
                          ></div>
                        </div>
                        <span class="text-white font-medium text-sm ml-2">{count}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Geographic Distribution -->
              <div>
                <h5 class="text-white font-medium mb-3">Geografische Verteilung</h5>
                <div class="space-y-2">
                  {#each Object.entries(demographics.locations).slice(0, 5) as [location, count]}
                    <div class="flex items-center justify-between">
                      <span class="text-white/80 text-sm">{location}</span>
                      <div class="flex items-center flex-1 mx-3">
                        <div class="bg-white/10 rounded-full h-2 flex-1">
                          <div 
                            class="bg-blue-400 h-2 rounded-full transition-all duration-300"
                            style="width: {formatPercentage(count, Object.values(demographics.locations).reduce((a, b) => a + b, 0)).replace('%', '')}%"
                          ></div>
                        </div>
                        <span class="text-white font-medium text-sm ml-2">{count}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </Card>
    {/if}
  {/if}
</div>
