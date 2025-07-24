<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Button, Card, Alert } from '$lib/components/ui';
  import InviteStatsCard from '$lib/components/InviteStatsCard.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let dashboardStats = {
    overview: {
      totalInvites: 0,
      activeInvites: 0,
      usedInvites: 0,
      expiredInvites: 0,
      conversionRate: 0,
      totalUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0
    },
    credits: {
      totalCreditsGranted: 0,
      totalCreditsUsed: 0,
      averageCreditsPerUser: 0,
      topCreditHolders: []
    },
    security: {
      suspiciousActivities: 0,
      blockedIPs: 0,
      failedAttempts: 0,
      recentAlerts: []
    },
    loading: true
  };

  let quickActions = {
    searchCode: '',
    searchResult: null,
    searchLoading: false,
    bulkCreditAmount: 0,
    bulkCreditTarget: 'all_verified',
    bulkActionLoading: false
  };

  let error = '';
  let success = '';

  onMount(async () => {
    await loadDashboardStats();
  });

  async function loadDashboardStats() {
    dashboardStats.loading = true;
    error = '';

    try {
      const response = await fetch('/api/admin/invites/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        dashboardStats = { ...dashboardStats, ...data, loading: false };
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Laden der Dashboard-Daten';
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      error = 'Netzwerkfehler beim Laden der Dashboard-Daten';
    } finally {
      dashboardStats.loading = false;
    }
  }

  async function searchInviteCode() {
    if (!quickActions.searchCode.trim()) return;

    quickActions.searchLoading = true;
    error = '';

    try {
      const response = await fetch(`/api/admin/invites/search?code=${encodeURIComponent(quickActions.searchCode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        quickActions.searchResult = data.invite;
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Code nicht gefunden';
        quickActions.searchResult = null;
      }
    } catch (err) {
      console.error('Error searching invite code:', err);
      error = 'Netzwerkfehler bei der Code-Suche';
      quickActions.searchResult = null;
    } finally {
      quickActions.searchLoading = false;
    }
  }

  async function toggleCodeStatus(codeId: string, currentStatus: boolean) {
    try {
      const response = await fetch('/api/admin/invites/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inviteId: codeId,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        success = `Code ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`;
        if (quickActions.searchResult && quickActions.searchResult.id === codeId) {
          quickActions.searchResult.is_active = !currentStatus;
        }
        await loadDashboardStats();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Ändern des Code-Status';
      }
    } catch (err) {
      console.error('Error toggling code status:', err);
      error = 'Netzwerkfehler beim Ändern des Code-Status';
    }
  }

  async function executeBulkCreditUpdate() {
    if (quickActions.bulkCreditAmount === 0) {
      error = 'Bitte gib einen Credit-Betrag ein';
      return;
    }

    const confirmMsg = `Möchtest du ${quickActions.bulkCreditAmount > 0 ? 'gewähren' : 'entfernen'} ${Math.abs(quickActions.bulkCreditAmount)} Credits für ${getBulkTargetDescription()}?`;
    if (!confirm(confirmMsg)) return;

    quickActions.bulkActionLoading = true;
    error = '';

    try {
      const response = await fetch('/api/admin/invites/bulk-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: quickActions.bulkCreditAmount,
          target: quickActions.bulkCreditTarget
        })
      });

      if (response.ok) {
        const data = await response.json();
        success = `Credits erfolgreich aktualisiert für ${data.affectedUsers} Benutzer`;
        quickActions.bulkCreditAmount = 0;
        await loadDashboardStats();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler bei der Bulk-Credit-Aktualisierung';
      }
    } catch (err) {
      console.error('Error executing bulk credit update:', err);
      error = 'Netzwerkfehler bei der Bulk-Credit-Aktualisierung';
    } finally {
      quickActions.bulkActionLoading = false;
    }
  }

  function getBulkTargetDescription() {
    switch (quickActions.bulkCreditTarget) {
      case 'all_verified': return 'alle verifizierten Benutzer';
      case 'all_trusted': return 'alle vertrauenswürdigen Benutzer';
      case 'all_users': return 'alle Benutzer';
      case 'low_credits': return 'Benutzer mit wenigen Credits';
      default: return 'ausgewählte Benutzer';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'used': return 'text-blue-400';
      case 'expired': return 'text-yellow-400';
      case 'inactive': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusText(invite: any) {
    if (!invite.is_active) return 'Deaktiviert';
    if (invite.used_by) return 'Verwendet';
    if (new Date(invite.expires_at) < new Date()) return 'Abgelaufen';
    return 'Aktiv';
  }

  $: alertLevel = dashboardStats.security.suspiciousActivities > 10 ? 'high' : 
                  dashboardStats.security.suspiciousActivities > 5 ? 'medium' : 'low';
</script>

<svelte:head>
  <title>Invite Dashboard - Admin - RaveTracker</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">
        Invite Dashboard
      </h1>
      <p class="text-white/70">
        Übersicht und Verwaltung des gesamten Invite-Systems
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <Button
        variant="secondary"
        onclick={() => goto('/admin/invites/stats')}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Detaillierte Statistiken
      </Button>
      
      <Button
        variant="secondary"
        onclick={() => goto('/admin/invites/users')}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        Benutzer-Management
      </Button>
      
      <Button
        variant="primary"
        onclick={() => loadDashboardStats()}
        disabled={dashboardStats.loading}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Aktualisieren
      </Button>
    </div>
  </div>

  <!-- Alerts -->
  {#if error}
    <Alert variant="error">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </Alert>
  {/if}

  {#if success}
    <Alert variant="success">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <span>{success}</span>
    </Alert>
  {/if}

  <!-- Security Alert -->
  {#if alertLevel === 'high'}
    <Alert variant="error">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Hohe Anzahl verdächtiger Aktivitäten erkannt! Überprüfe das Security Dashboard.</span>
    </Alert>
  {:else if alertLevel === 'medium'}
    <Alert variant="warning">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Verdächtige Aktivitäten erkannt. Überwachung empfohlen.</span>
    </Alert>
  {/if}

  <!-- Main Stats Overview -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <InviteStatsCard
      title="Gesamt Invites"
      value={dashboardStats.overview.totalInvites}
      change="+12%"
      trend="up"
      icon="mail"
      loading={dashboardStats.loading}
    />
    
    <InviteStatsCard
      title="Aktive Codes"
      value={dashboardStats.overview.activeInvites}
      change="-3%"
      trend="down"
      icon="check-circle"
      loading={dashboardStats.loading}
    />
    
    <InviteStatsCard
      title="Conversion Rate"
      value="{dashboardStats.overview.conversionRate}%"
      change="+5%"
      trend="up"
      icon="trending-up"
      loading={dashboardStats.loading}
    />
    
    <InviteStatsCard
      title="Neue User (7d)"
      value={dashboardStats.overview.newUsersThisWeek}
      change="+18%"
      trend="up"
      icon="user-plus"
      loading={dashboardStats.loading}
    />
  </div>

  <!-- Quick Actions & Code Search -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Code Search -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Code-Suche & Management
      </h3>

      <div class="space-y-4">
        <div class="flex gap-3">
          <input
            type="text"
            bind:value={quickActions.searchCode}
            placeholder="Invite-Code eingeben..."
            class="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            on:keydown={(e) => e.key === 'Enter' && searchInviteCode()}
          />
          <Button
            variant="primary"
            onclick={searchInviteCode}
            disabled={quickActions.searchLoading || !quickActions.searchCode.trim()}
            loading={quickActions.searchLoading}
          >
            Suchen
          </Button>
        </div>

        {#if quickActions.searchResult}
          <div class="p-4 bg-white/5 rounded-lg border border-white/10">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="text-white font-medium text-lg">{quickActions.searchResult.code}</h4>
                <p class="text-white/60 text-sm">
                  Status: <span class="{getStatusColor(getStatusText(quickActions.searchResult).toLowerCase())}">
                    {getStatusText(quickActions.searchResult)}
                  </span>
                </p>
              </div>
              <div class="flex gap-2">
                <Button
                  variant={quickActions.searchResult.is_active ? "danger" : "success"}
                  size="sm"
                  onclick={() => toggleCodeStatus(quickActions.searchResult.id, quickActions.searchResult.is_active)}
                >
                  {quickActions.searchResult.is_active ? 'Deaktivieren' : 'Aktivieren'}
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-white/60">Erstellt von:</span>
                <p class="text-white">{quickActions.searchResult.creator?.username || 'Unbekannt'}</p>
              </div>
              <div>
                <span class="text-white/60">Erstellt am:</span>
                <p class="text-white">{formatDate(quickActions.searchResult.created_at)}</p>
              </div>
              <div>
                <span class="text-white/60">Läuft ab:</span>
                <p class="text-white">{formatDate(quickActions.searchResult.expires_at)}</p>
              </div>
              <div>
                <span class="text-white/60">Verwendet von:</span>
                <p class="text-white">
                  {quickActions.searchResult.used_by_user?.username || 'Nicht verwendet'}
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Card>

    <!-- Bulk Credit Operations -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        Bulk Credit-Verwaltung
      </h3>

      <div class="space-y-4">
        <div>
          <label class="block text-white font-medium mb-2 text-sm">Zielgruppe</label>
          <select
            bind:value={quickActions.bulkCreditTarget}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="all_verified">Alle verifizierten Benutzer</option>
            <option value="all_trusted">Alle vertrauenswürdigen Benutzer</option>
            <option value="all_users">Alle Benutzer</option>
            <option value="low_credits">Benutzer mit wenigen Credits (&lt;3)</option>
          </select>
        </div>

        <div>
          <label class="block text-white font-medium mb-2 text-sm">Credit-Änderung</label>
          <input
            type="number"
            bind:value={quickActions.bulkCreditAmount}
            placeholder="Positive Zahl für Hinzufügen, negative für Entfernen"
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        </div>

        <div class="text-white/60 text-sm p-3 bg-white/5 rounded-lg">
          <p>
            <strong>Vorschau:</strong> 
            {quickActions.bulkCreditAmount > 0 ? 'Gewähre' : 'Entferne'} 
            {Math.abs(quickActions.bulkCreditAmount)} Credits für {getBulkTargetDescription()}
          </p>
        </div>

        <Button
          variant="primary"
          onclick={executeBulkCreditUpdate}
          disabled={quickActions.bulkActionLoading || quickActions.bulkCreditAmount === 0}
          loading={quickActions.bulkActionLoading}
          class="w-full"
        >
          {#if quickActions.bulkActionLoading}
            Credits werden aktualisiert...
          {:else}
            Credits aktualisieren
          {/if}
        </Button>
      </div>
    </Card>
  </div>

  <!-- Detailed Statistics Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Usage Statistics -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Code-Statistiken
      </h3>

      {#if dashboardStats.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Aktive Codes</span>
            <span class="text-green-400 font-semibold">{dashboardStats.overview.activeInvites}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Verwendete Codes</span>
            <span class="text-blue-400 font-semibold">{dashboardStats.overview.usedInvites}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Abgelaufene Codes</span>
            <span class="text-yellow-400 font-semibold">{dashboardStats.overview.expiredInvites}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-t border-white/10 pt-2">
            <span class="text-white font-medium">Gesamt</span>
            <span class="text-white font-semibold">{dashboardStats.overview.totalInvites}</span>
          </div>
        </div>
      {/if}
    </Card>

    <!-- Credit Statistics -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        Credit-Übersicht
      </h3>

      {#if dashboardStats.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Credits vergeben</span>
            <span class="text-purple-400 font-semibold">{dashboardStats.credits.totalCreditsGranted}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Credits verwendet</span>
            <span class="text-blue-400 font-semibold">{dashboardStats.credits.totalCreditsUsed}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Durchschnitt/User</span>
            <span class="text-green-400 font-semibold">{dashboardStats.credits.averageCreditsPerUser.toFixed(1)}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-t border-white/10 pt-2">
            <span class="text-white font-medium">Verfügbar</span>
            <span class="text-white font-semibold">
              {dashboardStats.credits.totalCreditsGranted - dashboardStats.credits.totalCreditsUsed}
            </span>
          </div>
        </div>
      {/if}
    </Card>

    <!-- Security Overview -->
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Sicherheit
      </h3>

      {#if dashboardStats.loading}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else}
        <div class="space-y-4">
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Verdächtige Aktivitäten</span>
            <span class="text-{alertLevel === 'high' ? 'red' : alertLevel === 'medium' ? 'yellow' : 'green'}-400 font-semibold">
              {dashboardStats.security.suspiciousActivities}
            </span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Blockierte IPs</span>
            <span class="text-red-400 font-semibold">{dashboardStats.security.blockedIPs}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-white/70">Fehlversuche (24h)</span>
            <span class="text-yellow-400 font-semibold">{dashboardStats.security.failedAttempts}</span>
          </div>
          <div class="pt-2 border-t border-white/10">
            <Button
              variant="secondary"
              onclick={() => goto('/admin/security')}
              size="sm"
              class="w-full"
            >
              Security Dashboard
            </Button>
          </div>
        </div>
      {/if}
    </Card>
  </div>

  <!-- Recent Activity -->
  <Card variant="glass">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Aktuelle Aktivitäten
    </h3>

    {#if dashboardStats.loading}
      <div class="flex items-center justify-center py-8">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if dashboardStats.security.recentAlerts.length === 0}
      <div class="text-center py-8">
        <svg class="w-12 h-12 text-white/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-white/60">Keine besonderen Aktivitäten in den letzten 24 Stunden</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each dashboardStats.security.recentAlerts.slice(0, 5) as alert}
          <div class="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
            <div class="w-2 h-2 rounded-full bg-{alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}-400 mt-2"></div>
            <div class="flex-1">
              <p class="text-white text-sm">{alert.message}</p>
              <p class="text-white/60 text-xs mt-1">{formatDate(alert.timestamp)}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card>
</div>
