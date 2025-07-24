<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Alert, Input } from '$lib/components/ui';
  import { VerificationBadge } from '$lib/components';

  let usersData = {
    users: [],
    totalUsers: 0,
    totalCredits: 0,
    loading: true
  };

  let filters = {
    search: '',
    verification_level: 'all',
    credit_range: 'all',
    sort_by: 'invite_credits',
    sort_order: 'desc'
  };

  let pagination = {
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1
  };

  let bulkActions = {
    selectedUsers: [] as string[],
    action: '',
    creditAmount: 0,
    executing: false
  };

  let inviteChainModal = {
    open: false,
    userId: '',
    chainData: null,
    loading: false
  };

  let error = '';
  let success = '';

  const verificationLevels = [
    { value: 'all', label: 'Alle Level' },
    { value: 'unverified', label: 'Unverifiziert' },
    { value: 'verified', label: 'Verifiziert' },
    { value: 'trusted', label: 'Vertrauenswürdig' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Administrator' }
  ];

  const creditRanges = [
    { value: 'all', label: 'Alle Credits' },
    { value: '0', label: '0 Credits' },
    { value: '1-5', label: '1-5 Credits' },
    { value: '6-10', label: '6-10 Credits' },
    { value: '11-20', label: '11-20 Credits' },
    { value: '20+', label: '20+ Credits' }
  ];

  const sortOptions = [
    { value: 'invite_credits', label: 'Credits' },
    { value: 'username', label: 'Benutzername' },
    { value: 'verification_level', label: 'Verifizierungslevel' },
    { value: 'created_at', label: 'Registrierungsdatum' },
    { value: 'total_invites_created', label: 'Erstellte Invites' },
    { value: 'successful_invites', label: 'Erfolgreiche Invites' }
  ];

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    usersData.loading = true;
    error = '';

    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        search: filters.search,
        verification_level: filters.verification_level,
        credit_range: filters.credit_range,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      });

      const response = await fetch(`/api/admin/invites/users?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        usersData = { ...data, loading: false };
        pagination.totalPages = Math.ceil(data.totalUsers / pagination.itemsPerPage);
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Laden der Benutzer';
      }
    } catch (err) {
      console.error('Error loading users:', err);
      error = 'Netzwerkfehler beim Laden der Benutzer';
    } finally {
      usersData.loading = false;
    }
  }

  async function updateUserCredits(userId: string, newAmount: number) {
    try {
      const response = await fetch('/api/admin/invites/update-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          credits: newAmount
        })
      });

      if (response.ok) {
        success = 'Credits erfolgreich aktualisiert';
        await loadUsers();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Aktualisieren der Credits';
      }
    } catch (err) {
      console.error('Error updating credits:', err);
      error = 'Netzwerkfehler beim Aktualisieren der Credits';
    }
  }

  function toggleSelectUser(userId: string) {
    if (bulkActions.selectedUsers.includes(userId)) {
      bulkActions.selectedUsers = bulkActions.selectedUsers.filter(id => id !== userId);
    } else {
      bulkActions.selectedUsers = [...bulkActions.selectedUsers, userId];
    }
  }

  function toggleSelectAll() {
    if (bulkActions.selectedUsers.length === usersData.users.length) {
      bulkActions.selectedUsers = [];
    } else {
      bulkActions.selectedUsers = usersData.users.map(user => user.id);
    }
  }

  async function executeBulkAction() {
    if (!bulkActions.action || bulkActions.selectedUsers.length === 0) return;

    const confirmMsg = `Möchtest du ${bulkActions.action} für ${bulkActions.selectedUsers.length} Benutzer ausführen?`;
    if (!confirm(confirmMsg)) return;

    bulkActions.executing = true;
    error = '';

    try {
      const response = await fetch('/api/admin/invites/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: bulkActions.selectedUsers,
          action: bulkActions.action,
          creditAmount: bulkActions.creditAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        success = `Bulk-Aktion erfolgreich für ${data.affectedUsers} Benutzer ausgeführt`;
        bulkActions.selectedUsers = [];
        bulkActions.action = '';
        bulkActions.creditAmount = 0;
        await loadUsers();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler bei der Bulk-Aktion';
      }
    } catch (err) {
      console.error('Error executing bulk action:', err);
      error = 'Netzwerkfehler bei der Bulk-Aktion';
    } finally {
      bulkActions.executing = false;
    }
  }

  async function loadInviteChain(userId: string) {
    inviteChainModal = { open: true, userId, chainData: null, loading: true };

    try {
      const response = await fetch(`/api/admin/invites/chain/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        inviteChainModal.chainData = data;
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Laden der Invite-Kette';
      }
    } catch (err) {
      console.error('Error loading invite chain:', err);
      error = 'Netzwerkfehler beim Laden der Invite-Kette';
    } finally {
      inviteChainModal.loading = false;
    }
  }

  function closeInviteChainModal() {
    inviteChainModal = { open: false, userId: '', chainData: null, loading: false };
  }

  function handleFilterChange() {
    pagination.currentPage = 1;
    bulkActions.selectedUsers = [];
    loadUsers();
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  $: {
    if (filters.search || filters.verification_level || filters.credit_range || filters.sort_by || filters.sort_order) {
      handleFilterChange();
    }
  }
</script>

<svelte:head>
  <title>Benutzer-Management - Admin Invites - RaveTracker</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">
        Benutzer-Management
      </h1>
      <p class="text-white/70">
        Verwalte Invite-Credits und überwache Benutzer-Aktivitäten
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <Button
        variant="secondary"
        onclick={() => window.history.back()}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Zurück
      </Button>
      
      <Button
        variant="primary"
        onclick={() => loadUsers()}
        disabled={usersData.loading}
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Aktualisieren
      </Button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card variant="glass">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/70 text-sm">Gesamt Benutzer</p>
          <p class="text-2xl font-bold text-white">{usersData.totalUsers}</p>
        </div>
        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
      </div>
    </Card>

    <Card variant="glass">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/70 text-sm">Gesamt Credits</p>
          <p class="text-2xl font-bold text-white">{usersData.totalCredits}</p>
        </div>
        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      </div>
    </Card>

    <Card variant="glass">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-white/70 text-sm">Durchschnitt/User</p>
          <p class="text-2xl font-bold text-white">
            {usersData.totalUsers > 0 ? (usersData.totalCredits / usersData.totalUsers).toFixed(1) : '0'}
          </p>
        </div>
        <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>
    </Card>
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

  <!-- Filters -->
  <Card variant="glass">
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
      <!-- Search -->
      <div>
        <label class="block text-white font-medium mb-2 text-sm">Suche</label>
        <Input
          bind:value={filters.search}
          placeholder="Benutzername oder E-Mail..."
          class="w-full"
        />
      </div>

      <!-- Verification Level -->
      <div>
        <label class="block text-white font-medium mb-2 text-sm">Verifizierungslevel</label>
        <select
          bind:value={filters.verification_level}
          class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          {#each verificationLevels as level}
            <option value={level.value}>{level.label}</option>
          {/each}
        </select>
      </div>

      <!-- Credit Range -->
      <div>
        <label class="block text-white font-medium mb-2 text-sm">Credit-Bereich</label>
        <select
          bind:value={filters.credit_range}
          class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          {#each creditRanges as range}
            <option value={range.value}>{range.label}</option>
          {/each}
        </select>
      </div>

      <!-- Sort By -->
      <div>
        <label class="block text-white font-medium mb-2 text-sm">Sortieren nach</label>
        <select
          bind:value={filters.sort_by}
          class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <!-- Sort Order -->
      <div>
        <label class="block text-white font-medium mb-2 text-sm">Reihenfolge</label>
        <select
          bind:value={filters.sort_order}
          class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          <option value="desc">Absteigend</option>
          <option value="asc">Aufsteigend</option>
        </select>
      </div>
    </div>

    <!-- Bulk Actions -->
    {#if bulkActions.selectedUsers.length > 0}
      <div class="flex items-center gap-4 pt-4 border-t border-white/10">
        <span class="text-white font-medium">
          {bulkActions.selectedUsers.length} ausgewählt
        </span>
        
        <select
          bind:value={bulkActions.action}
          class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        >
          <option value="">Aktion wählen...</option>
          <option value="add_credits">Credits hinzufügen</option>
          <option value="set_credits">Credits setzen</option>
          <option value="reset_credits">Credits zurücksetzen</option>
        </select>
        
        {#if bulkActions.action === 'add_credits' || bulkActions.action === 'set_credits'}
          <input
            type="number"
            bind:value={bulkActions.creditAmount}
            placeholder="Anzahl Credits"
            min="0"
            class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        {/if}
        
        <Button
          variant="primary"
          onclick={executeBulkAction}
          disabled={!bulkActions.action || bulkActions.executing}
          loading={bulkActions.executing}
          size="sm"
        >
          Ausführen
        </Button>
        
        <Button
          variant="secondary"
          onclick={() => bulkActions.selectedUsers = []}
          size="sm"
        >
          Auswahl aufheben
        </Button>
      </div>
    {/if}
  </Card>

  <!-- Users Table -->
  <Card variant="glass">
    {#if usersData.loading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-white/70">Lade Benutzer...</span>
      </div>
    {:else if usersData.users.length === 0}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">Keine Benutzer gefunden</h3>
        <p class="text-white/60">Es wurden keine Benutzer gefunden, die deinen Filtern entsprechen.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={bulkActions.selectedUsers.length === usersData.users.length && usersData.users.length > 0}
                  on:change={toggleSelectAll}
                  class="w-4 h-4 text-purple-400 bg-transparent border-2 border-white/30 rounded focus:ring-purple-400 focus:ring-2"
                />
              </th>
              <th class="text-left py-3 px-4 text-white font-medium">Benutzer</th>
              <th class="text-left py-3 px-4 text-white font-medium">Credits</th>
              <th class="text-left py-3 px-4 text-white font-medium">Invites</th>
              <th class="text-left py-3 px-4 text-white font-medium">Erfolgsrate</th>
              <th class="text-left py-3 px-4 text-white font-medium">Registriert</th>
              <th class="text-left py-3 px-4 text-white font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {#each usersData.users as user}
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={bulkActions.selectedUsers.includes(user.id)}
                    on:change={() => toggleSelectUser(user.id)}
                    class="w-4 h-4 text-purple-400 bg-transparent border-2 border-white/30 rounded focus:ring-purple-400 focus:ring-2"
                  />
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <span class="text-white font-medium text-sm">
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-white font-medium">
                          {user.username || 'Unbekannt'}
                        </span>
                        <VerificationBadge 
                          level={user.verification_level || 'unverified'} 
                          size="sm"
                          showTooltip={false}
                          inline={true}
                        />
                      </div>
                      <span class="text-white/60 text-sm">
                        {user.email || 'Keine E-Mail'}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <span class="text-purple-400 font-semibold text-lg">
                      {user.invite_credits || 0}
                    </span>
                    <button
                      class="text-white/60 hover:text-white p-1"
                      title="Credits bearbeiten"
                      on:click={() => {
                        const newAmount = prompt('Neue Credit-Anzahl:', user.invite_credits?.toString() || '0');
                        if (newAmount !== null) {
                          updateUserCredits(user.id, parseInt(newAmount) || 0);
                        }
                      }}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="text-center">
                    <span class="text-white font-medium">
                      {user.total_invites_created || 0}
                    </span>
                    <p class="text-white/60 text-xs">erstellt</p>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="text-center">
                    <span class="text-green-400 font-medium">
                      {user.total_invites_created > 0 
                        ? ((user.successful_invites / user.total_invites_created) * 100).toFixed(1) 
                        : '0'}%
                    </span>
                    <p class="text-white/60 text-xs">
                      {user.successful_invites || 0}/{user.total_invites_created || 0}
                    </p>
                  </div>
                </td>
                <td class="py-4 px-4 text-white/70 text-sm">
                  {formatDate(user.created_at)}
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onclick={() => loadInviteChain(user.id)}
                      title="Invite-Kette anzeigen"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if pagination.totalPages > 1}
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div class="text-white/60 text-sm">
            Seite {pagination.currentPage} von {pagination.totalPages}
          </div>
          
          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onclick={() => { pagination.currentPage = Math.max(1, pagination.currentPage - 1); loadUsers(); }}
              disabled={pagination.currentPage === 1}
            >
              Zurück
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onclick={() => { pagination.currentPage = Math.min(pagination.totalPages, pagination.currentPage + 1); loadUsers(); }}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Weiter
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- Invite Chain Modal -->
{#if inviteChainModal.open}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            Invite-Kette Visualisierung
          </h3>
          <button
            on:click={closeInviteChainModal}
            class="text-white/60 hover:text-white p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        {#if inviteChainModal.loading}
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span class="ml-3 text-white/70">Lade Invite-Kette...</span>
          </div>
        {:else if inviteChainModal.chainData}
          <div class="space-y-4">
            <!-- Chain visualization would go here -->
            <div class="text-center py-8">
              <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <h3 class="text-lg font-semibold text-white mb-2">Invite-Kette</h3>
              <p class="text-white/60">Feature wird in einer zukünftigen Version implementiert.</p>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-white/60">Keine Invite-Kette gefunden.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
