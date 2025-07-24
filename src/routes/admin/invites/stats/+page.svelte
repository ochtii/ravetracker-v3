<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Alert } from '$lib/components/ui';
  import { InviteStatsCard } from '$lib/components/admin';

  let statsData = {
    overview: {
      totalInvites: 0,
      activeInvites: 0,
      usedInvites: 0,
      expiredInvites: 0,
      conversionRate: 0,
      avgTimeToUse: 0
    },
    timeStats: {
      today: { created: 0, used: 0, expired: 0 },
      thisWeek: { created: 0, used: 0, expired: 0 },
      thisMonth: { created: 0, used: 0, expired: 0 },
      lastMonth: { created: 0, used: 0, expired: 0 }
    },
    userStats: {
      topCreators: [],
      conversionByLevel: {},
      registrationSources: {}
    },
    trends: {
      daily: [],
      weekly: [],
      monthly: []
    },
    loading: true
  };

  let timeFilter = '7d';
  let chartType = 'line';
  let error = '';

  const timeFilterOptions = [
    { value: '24h', label: 'Letzten 24 Stunden' },
    { value: '7d', label: 'Letzten 7 Tage' },
    { value: '30d', label: 'Letzten 30 Tage' },
    { value: '90d', label: 'Letzten 90 Tage' },
    { value: '1y', label: 'Letztes Jahr' }
  ];

  onMount(async () => {
    await loadStatistics();
  });

  async function loadStatistics() {
    statsData.loading = true;
    error = '';

    try {
      const response = await fetch(`/api/admin/invites/stats?timeFilter=${timeFilter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        statsData = { ...statsData, ...data, loading: false };
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Laden der Statistiken';
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      error = 'Netzwerkfehler beim Laden der Statistiken';
    } finally {
      statsData.loading = false;
    }
  }

  function calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  function formatDuration(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  }

  $: {
    if (timeFilter) {
      loadStatistics();
    }
  }
</script>

<svelte:head>
  <title>Invite Statistiken - Admin - RaveTracker</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">
        Detaillierte Invite-Statistiken
      </h1>
      <p class="text-white/70">
        Umfassende Analyse der Invite-System Performance
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <select
        bind:value={timeFilter}
        class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      >
        {#each timeFilterOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      
      <Button
        variant="primary"
        onclick={() => loadStatistics()}
        disabled={statsData.loading}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Aktualisieren
      </Button>
    </div>
  </div>

  <!-- Error Alert -->
  {#if error}
    <Alert variant="error">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </Alert>
  {/if}

  <!-- Main Statistics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <InviteStatsCard
      title="Gesamt Invites"
      value={statsData.overview.totalInvites}
      change={calculatePercentageChange(statsData.timeStats.thisWeek.created, statsData.timeStats.lastMonth.created)}
      trend={statsData.timeStats.thisWeek.created > statsData.timeStats.lastMonth.created ? 'up' : 'down'}
      icon="mail"
      loading={statsData.loading}
    />
    
    <InviteStatsCard
      title="Aktive Codes"
      value={statsData.overview.activeInvites}
      change={calculatePercentageChange(statsData.overview.activeInvites, statsData.overview.totalInvites - statsData.overview.activeInvites)}
      trend="up"
      icon="check-circle"
      loading={statsData.loading}
    />
    
    <InviteStatsCard
      title="Conversion Rate"
      value="{statsData.overview.conversionRate}%"
      change="+2.3%"
      trend="up"
      icon="trending-up"
      loading={statsData.loading}
    />
    
    <InviteStatsCard
      title="Ø Zeit bis Nutzung"
      value={formatDuration(statsData.overview.avgTimeToUse)}
      change="-15%"
      trend="down"
      icon="clock"
      loading={statsData.loading}
    />
  </div>

  <!-- Time-based Statistics -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Today's Stats -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Heute
      </h3>

      {#if statsData.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-white/70">Erstellt</span>
            <span class="text-green-400 font-semibold">{statsData.timeStats.today.created}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Verwendet</span>
            <span class="text-blue-400 font-semibold">{statsData.timeStats.today.used}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Abgelaufen</span>
            <span class="text-yellow-400 font-semibold">{statsData.timeStats.today.expired}</span>
          </div>
        </div>
      {/if}
    </Card>

    <!-- This Week's Stats -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0a1 1 0 110 2H9a1 1 0 110-2m0 0a1 1 0 110 2H9a1 1 0 110-2m7 13a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Diese Woche
      </h3>

      {#if statsData.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-white/70">Erstellt</span>
            <span class="text-green-400 font-semibold">{statsData.timeStats.thisWeek.created}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Verwendet</span>
            <span class="text-blue-400 font-semibold">{statsData.timeStats.thisWeek.used}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Abgelaufen</span>
            <span class="text-yellow-400 font-semibold">{statsData.timeStats.thisWeek.expired}</span>
          </div>
        </div>
      {/if}
    </Card>

    <!-- This Month's Stats -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Dieser Monat
      </h3>

      {#if statsData.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-white/70">Erstellt</span>
            <span class="text-green-400 font-semibold">{statsData.timeStats.thisMonth.created}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Verwendet</span>
            <span class="text-blue-400 font-semibold">{statsData.timeStats.thisMonth.used}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-white/70">Abgelaufen</span>
            <span class="text-yellow-400 font-semibold">{statsData.timeStats.thisMonth.expired}</span>
          </div>
        </div>
      {/if}
    </Card>
  </div>

  <!-- User Performance Stats -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Top Invite Creators -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Top Invite-Ersteller
      </h3>

      {#if statsData.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else if statsData.userStats.topCreators.length === 0}
        <div class="text-center py-8">
          <p class="text-white/60">Keine Daten verfügbar</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each statsData.userStats.topCreators.slice(0, 10) as creator, index}
            <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <span class="text-white font-medium text-sm">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <span class="text-white font-medium">{creator.username}</span>
                  <p class="text-white/60 text-sm">
                    {creator.verification_level} • {creator.successfulInvites}/{creator.totalInvites} erfolgreich
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-purple-400 font-semibold">{creator.totalInvites}</span>
                <p class="text-white/60 text-sm">
                  {((creator.successfulInvites / creator.totalInvites) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>

    <!-- Conversion by User Level -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Conversion nach Benutzer-Level
      </h3>

      {#if statsData.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-3">
          {#each Object.entries(statsData.userStats.conversionByLevel) as [level, data]}
            <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-{level === 'verified' ? 'green' : level === 'trusted' ? 'blue' : level === 'moderator' ? 'purple' : level === 'admin' ? 'yellow' : 'gray'}-400"></div>
                <span class="text-white capitalize">{level}</span>
              </div>
              <div class="text-right">
                <span class="text-white font-semibold">{data.rate}%</span>
                <p class="text-white/60 text-sm">
                  {data.successful}/{data.total}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  </div>

  <!-- Chart Visualization -->
  <Card variant="glass">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Invite-Trends
      </h3>
      
      <div class="flex gap-2">
        <select
          bind:value={chartType}
          class="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          <option value="line">Linienchart</option>
          <option value="bar">Balkendiagramm</option>
          <option value="area">Flächenchart</option>
        </select>
      </div>
    </div>

    {#if statsData.loading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-white/70">Lade Chart-Daten...</span>
      </div>
    {:else if statsData.trends.daily.length === 0}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">Keine Trend-Daten</h3>
        <p class="text-white/60">Nicht genügend Daten für den ausgewählten Zeitraum vorhanden.</p>
      </div>
    {:else}
      <!-- Simple Text-based Chart Representation -->
      <div class="space-y-4">
        <div class="grid grid-cols-7 gap-2 text-xs text-white/60 text-center">
          {#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as day}
            <div>{day}</div>
          {/each}
        </div>
        
        <div class="grid grid-cols-7 gap-2">
          {#each statsData.trends.daily.slice(-7) as dayData, index}
            <div class="text-center">
              <div class="h-20 bg-white/5 rounded flex flex-col justify-end p-2 relative">
                <div 
                  class="bg-gradient-to-t from-purple-500 to-blue-500 rounded-sm transition-all duration-500"
                  style="height: {Math.max(10, (dayData.created / Math.max(...statsData.trends.daily.map(d => d.created))) * 100)}%"
                ></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-white text-xs font-medium">{dayData.created}</span>
                </div>
              </div>
              <div class="text-xs text-white/60 mt-1">
                {dayData.date}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="flex items-center justify-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-gradient-to-t from-purple-500 to-blue-500 rounded"></div>
            <span class="text-white/70">Erstellte Invites</span>
          </div>
        </div>
      </div>
    {/if}
  </Card>

  <!-- Export Options -->
  <Card variant="glass">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Daten exportieren
    </h3>

    <div class="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 114 0v2M9 17h6M9 17a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m12 10V5a2 2 0 00-2-2H9a2 2 0 00-2 2v12" />
        </svg>
        CSV Export
      </Button>
      
      <Button variant="secondary" size="sm">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        PDF Report
      </Button>
      
      <Button variant="secondary" size="sm">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        Teilen
      </Button>
    </div>
  </Card>
</div>
