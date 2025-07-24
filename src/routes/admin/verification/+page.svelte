<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Button, Card, Alert, Input, Textarea } from '$lib/components/ui';
  import { VerificationBadge } from '$lib/components';
  import type { PageData } from './$types';

  export let data: PageData;

  let pendingRequests: any[] = [];
  let filteredRequests: any[] = [];
  let loading = true;
  let error = '';
  let success = '';

  // Filters
  let statusFilter = 'all';
  let searchQuery = '';
  let sortBy = 'created_at';
  let sortOrder = 'desc';

  // Bulk actions
  let selectedRequests: string[] = [];
  let bulkAction = '';

  // Review modal
  let reviewModal = {
    open: false,
    request: null as any,
    action: '',
    notes: '',
    submitting: false
  };

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 20;
  let totalPages = 1;

  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'pending', label: 'Ausstehend' },
    { value: 'approved', label: 'Genehmigt' },
    { value: 'rejected', label: 'Abgelehnt' },
    { value: 'needs_info', label: 'Info benötigt' }
  ];

  const sortOptions = [
    { value: 'created_at', label: 'Erstellungsdatum' },
    { value: 'username', label: 'Benutzername' },
    { value: 'status', label: 'Status' },
    { value: 'reviewed_at', label: 'Bearbeitungsdatum' }
  ];

  onMount(async () => {
    await loadRequests();
  });

  async function loadRequests() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/admin/verification/requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        pendingRequests = data.requests || [];
        applyFilters();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Laden der Anträge';
      }
    } catch (err) {
      console.error('Error loading requests:', err);
      error = 'Netzwerkfehler beim Laden der Anträge';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    let filtered = [...pendingRequests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.profiles?.username?.toLowerCase().includes(query) ||
        req.profiles?.email?.toLowerCase().includes(query) ||
        req.request_message?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'username') {
        aValue = a.profiles?.username || '';
        bValue = b.profiles?.username || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    filteredRequests = filtered.slice(startIndex, startIndex + itemsPerPage);
  }

  function handleFilterChange() {
    currentPage = 1;
    selectedRequests = [];
    applyFilters();
  }

  function openReviewModal(request: any, action: 'approve' | 'reject' | 'needs_info') {
    reviewModal = {
      open: true,
      request,
      action,
      notes: '',
      submitting: false
    };
  }

  function closeReviewModal() {
    reviewModal = {
      open: false,
      request: null,
      action: '',
      notes: '',
      submitting: false
    };
  }

  async function submitReview() {
    if (!reviewModal.request || !reviewModal.action) return;

    reviewModal.submitting = true;
    error = '';

    try {
      const response = await fetch('/api/admin/verification/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: reviewModal.request.id,
          action: reviewModal.action,
          notes: reviewModal.notes.trim() || null
        })
      });

      if (response.ok) {
        success = `Antrag erfolgreich ${getActionText(reviewModal.action)}`;
        closeReviewModal();
        await loadRequests();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler beim Bearbeiten des Antrags';
      }
    } catch (err) {
      console.error('Error reviewing request:', err);
      error = 'Netzwerkfehler beim Bearbeiten des Antrags';
    } finally {
      reviewModal.submitting = false;
    }
  }

  function toggleSelectAll() {
    if (selectedRequests.length === filteredRequests.length) {
      selectedRequests = [];
    } else {
      selectedRequests = filteredRequests.map(req => req.id);
    }
  }

  function toggleSelectRequest(requestId: string) {
    if (selectedRequests.includes(requestId)) {
      selectedRequests = selectedRequests.filter(id => id !== requestId);
    } else {
      selectedRequests = [...selectedRequests, requestId];
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedRequests.length === 0) return;

    const confirmMessage = `Möchtest du ${selectedRequests.length} Anträge ${getActionText(bulkAction)}?`;
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch('/api/admin/verification/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestIds: selectedRequests,
          action: bulkAction
        })
      });

      if (response.ok) {
        success = `${selectedRequests.length} Anträge erfolgreich ${getActionText(bulkAction)}`;
        selectedRequests = [];
        bulkAction = '';
        await loadRequests();
      } else {
        const errorData = await response.json();
        error = errorData.message || 'Fehler bei der Bulk-Aktion';
      }
    } catch (err) {
      console.error('Error executing bulk action:', err);
      error = 'Netzwerkfehler bei der Bulk-Aktion';
    }
  }

  function getActionText(action: string) {
    switch (action) {
      case 'approve': return 'genehmigt';
      case 'reject': return 'abgelehnt';
      case 'needs_info': return 'zur Nachbearbeitung markiert';
      default: return 'bearbeitet';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'needs_info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      case 'needs_info': return 'Info benötigt';
      default: return 'Unbekannt';
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

  $: {
    if (statusFilter || searchQuery || sortBy || sortOrder) {
      handleFilterChange();
    }
  }
</script>

<svelte:head>
  <title>Verifizierungs-Management - Admin - RaveTracker</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">
        Verifizierungs-Management
      </h1>
      <p class="text-white/70">
        Verwalte Verifizierungsanträge und erteile Account-Berechtigungen
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <Button
        variant="outline"
        onclick={() => loadRequests()}
        disabled={loading}
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

  <!-- Filters & Controls -->
  <Card variant="glass">
    <div class="space-y-4">
      <!-- Filter Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Status Filter -->
        <div>
          <label class="block text-white font-medium mb-2 text-sm">Status</label>
          <select
            bind:value={statusFilter}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-white font-medium mb-2 text-sm">Suche</label>
          <Input
            bind:value={searchQuery}
            placeholder="Benutzername, E-Mail oder Nachricht..."
            class="w-full"
          />
        </div>

        <!-- Sort By -->
        <div>
          <label class="block text-white font-medium mb-2 text-sm">Sortieren nach</label>
          <select
            bind:value={sortBy}
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
            bind:value={sortOrder}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="desc">Absteigend</option>
            <option value="asc">Aufsteigend</option>
          </select>
        </div>
      </div>

      <!-- Bulk Actions -->
      {#if selectedRequests.length > 0}
        <div class="flex items-center gap-4 pt-4 border-t border-white/10">
          <span class="text-white font-medium">
            {selectedRequests.length} ausgewählt
          </span>
          
          <select
            bind:value={bulkAction}
            class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="">Aktion wählen...</option>
            <option value="approve">Genehmigen</option>
            <option value="reject">Ablehnen</option>
            <option value="needs_info">Info anfordern</option>
          </select>
          
          <Button
            variant="primary"
            onclick={executeBulkAction}
            disabled={!bulkAction}
            size="sm"
          >
            Ausführen
          </Button>
          
          <Button
            variant="outline"
            onclick={() => selectedRequests = []}
            size="sm"
          >
            Auswahl aufheben
          </Button>
        </div>
      {/if}
    </div>
  </Card>

  <!-- Requests Table -->
  <Card variant="glass">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-white/70">Lade Anträge...</span>
      </div>
    {:else if filteredRequests.length === 0}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">Keine Anträge gefunden</h3>
        <p class="text-white/60">Es wurden keine Verifizierungsanträge gefunden, die deinen Filtern entsprechen.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                  on:change={toggleSelectAll}
                  class="w-4 h-4 text-purple-400 bg-transparent border-2 border-white/30 rounded focus:ring-purple-400 focus:ring-2"
                />
              </th>
              <th class="text-left py-3 px-4 text-white font-medium">Benutzer</th>
              <th class="text-left py-3 px-4 text-white font-medium">Status</th>
              <th class="text-left py-3 px-4 text-white font-medium">Erstellt</th>
              <th class="text-left py-3 px-4 text-white font-medium">Bearbeitet</th>
              <th class="text-left py-3 px-4 text-white font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredRequests as request}
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    on:change={() => toggleSelectRequest(request.id)}
                    class="w-4 h-4 text-purple-400 bg-transparent border-2 border-white/30 rounded focus:ring-purple-400 focus:ring-2"
                  />
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                      <span class="text-white font-medium text-sm">
                        {request.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-white font-medium">
                          {request.profiles?.username || 'Unbekannt'}
                        </span>
                        <VerificationBadge 
                          level={request.profiles?.verification_level || 'unverified'} 
                          size="sm"
                          showTooltip={false}
                          inline={true}
                        />
                      </div>
                      <span class="text-white/60 text-sm">
                        {request.profiles?.email || 'Keine E-Mail'}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {getStatusColor(request.status)} bg-current/10">
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td class="py-4 px-4 text-white/70 text-sm">
                  {formatDate(request.created_at)}
                </td>
                <td class="py-4 px-4 text-white/70 text-sm">
                  {request.reviewed_at ? formatDate(request.reviewed_at) : '-'}
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    {#if request.status === 'pending' || request.status === 'needs_info'}
                      <Button
                        variant="success"
                        size="sm"
                        onclick={() => openReviewModal(request, 'approve')}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </Button>
                      
                      <Button
                        variant="error"
                        size="sm"
                        onclick={() => openReviewModal(request, 'reject')}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onclick={() => openReviewModal(request, 'needs_info')}
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </Button>
                    {:else}
                      <span class="text-white/40 text-sm">Bearbeitet</span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div class="text-white/60 text-sm">
            Seite {currentPage} von {totalPages}
          </div>
          
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onclick={() => { currentPage = Math.max(1, currentPage - 1); applyFilters(); }}
              disabled={currentPage === 1}
            >
              Zurück
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); applyFilters(); }}
              disabled={currentPage === totalPages}
            >
              Weiter
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- Review Modal -->
{#if reviewModal.open}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 rounded-xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">
            Antrag {getActionText(reviewModal.action)}
          </h3>
          <button
            on:click={closeReviewModal}
            class="text-white/60 hover:text-white p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Request Info -->
        {#if reviewModal.request}
          <div class="space-y-4 mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span class="text-white font-medium">
                  {reviewModal.request.profiles?.username?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-white font-medium">
                    {reviewModal.request.profiles?.username || 'Unbekannt'}
                  </span>
                  <VerificationBadge 
                    level={reviewModal.request.profiles?.verification_level || 'unverified'} 
                    size="sm"
                    showTooltip={false}
                    inline={true}
                  />
                </div>
                <span class="text-white/60 text-sm">
                  {reviewModal.request.profiles?.email || 'Keine E-Mail'}
                </span>
              </div>
            </div>

            {#if reviewModal.request.request_message}
              <div class="p-4 bg-white/5 rounded-lg">
                <h4 class="text-white font-medium mb-2">Begründung:</h4>
                <p class="text-white/70 text-sm whitespace-pre-wrap">
                  {reviewModal.request.request_message}
                </p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Notes -->
        <div class="mb-6">
          <label class="block text-white font-medium mb-2">
            Admin-Notizen {reviewModal.action === 'needs_info' ? '(erforderlich)' : '(optional)'}
          </label>
          <Textarea
            bind:value={reviewModal.notes}
            placeholder="Füge Notizen hinzu oder erkläre deine Entscheidung..."
            rows="4"
            required={reviewModal.action === 'needs_info'}
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <Button
            variant="primary"
            onclick={submitReview}
            disabled={reviewModal.submitting || (reviewModal.action === 'needs_info' && !reviewModal.notes.trim())}
            loading={reviewModal.submitting}
            class="flex-1"
          >
            {#if reviewModal.submitting}
              Bearbeitung...
            {:else}
              {reviewModal.action === 'approve' ? 'Genehmigen' : 
               reviewModal.action === 'reject' ? 'Ablehnen' : 
               'Info anfordern'}
            {/if}
          </Button>
          
          <Button
            variant="outline"
            onclick={closeReviewModal}
            disabled={reviewModal.submitting}
          >
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
