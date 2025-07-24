<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Alert, Input } from '$lib/components/ui';
  import { actionCodeService } from '$lib/services/action-code-service';
  import type { ActionCode, CreateActionCodeData, ActionCodeType } from '$lib/types/invite';

  export let adminId: string;

  // State
  let actionCodes: ActionCode[] = [];
  let loading = false;
  let error = '';
  let success = '';
  
  // Form state
  let showCreateForm = false;
  let createForm: CreateActionCodeData = {
    name: '',
    description: '',
    type: 'campaign',
    customCode: '',
    codeLength: 8,
    validityDays: 30,
    maxUses: 100,
    bonusCredits: 0,
    campaign: '',
    partner: '',
    eventId: ''
  };

  // Filters
  let filters = {
    type: '',
    active: true,
    campaign: '',
    search: ''
  };

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalCodes = 0;

  const actionCodeTypes: { value: ActionCodeType; label: string; description: string }[] = [
    { 
      value: 'campaign', 
      label: 'Marketing-Kampagne', 
      description: 'Codes für Werbekampagnen und Promotions' 
    },
    { 
      value: 'event', 
      label: 'Event-spezifisch', 
      description: 'Codes die an bestimmte Events gebunden sind' 
    },
    { 
      value: 'partner', 
      label: 'Partner-Code', 
      description: 'Codes für Kooperationspartner' 
    },
    { 
      value: 'emergency', 
      label: 'Notfall-Code', 
      description: 'Codes für Systemprobleme oder Notfälle' 
    }
  ];

  onMount(async () => {
    await loadActionCodes();
  });

  async function loadActionCodes() {
    loading = true;
    error = '';

    try {
      const result = await actionCodeService.getActionCodes({
        type: filters.type as ActionCodeType || undefined,
        active: filters.active,
        campaign: filters.campaign || undefined,
        search: filters.search || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      });

      actionCodes = result.codes;
      totalCodes = result.total;
    } catch (err) {
      console.error('Error loading action codes:', err);
      error = 'Fehler beim Laden der Aktionscodes';
    } finally {
      loading = false;
    }
  }

  async function createActionCode() {
    if (!createForm.name.trim()) {
      error = 'Name ist erforderlich';
      return;
    }

    loading = true;
    error = '';

    try {
      await actionCodeService.createActionCode(createForm, adminId);
      success = 'Aktionscode erfolgreich erstellt';
      showCreateForm = false;
      resetCreateForm();
      await loadActionCodes();
    } catch (err: any) {
      console.error('Error creating action code:', err);
      error = err.message || 'Fehler beim Erstellen des Aktionscodes';
    } finally {
      loading = false;
    }
  }

  async function toggleCodeStatus(code: ActionCode) {
    loading = true;
    error = '';

    try {
      if (code.isActive) {
        const reason = prompt('Grund für Deaktivierung (optional):');
        await actionCodeService.deactivateActionCode(code.id, adminId, reason || undefined);
        success = 'Code deaktiviert';
      } else {
        await actionCodeService.reactivateActionCode(code.id, adminId);
        success = 'Code reaktiviert';
      }
      await loadActionCodes();
    } catch (err: any) {
      console.error('Error toggling code status:', err);
      error = err.message || 'Fehler beim Ändern des Code-Status';
    } finally {
      loading = false;
    }
  }

  async function extendCode(code: ActionCode) {
    const daysStr = prompt('Gültigkeit um wie viele Tage verlängern?', '30');
    if (!daysStr) return;

    const days = parseInt(daysStr);
    if (isNaN(days) || days <= 0) {
      error = 'Ungültige Anzahl Tage';
      return;
    }

    loading = true;
    error = '';

    try {
      await actionCodeService.extendActionCode(code.id, days, adminId);
      success = `Code um ${days} Tage verlängert`;
      await loadActionCodes();
    } catch (err: any) {
      console.error('Error extending code:', err);
      error = err.message || 'Fehler beim Verlängern des Codes';
    } finally {
      loading = false;
    }
  }

  function resetCreateForm() {
    createForm = {
      name: '',
      description: '',
      type: 'campaign',
      customCode: '',
      codeLength: 8,
      validityDays: 30,
      maxUses: 100,
      bonusCredits: 0,
      campaign: '',
      partner: '',
      eventId: ''
    };
  }

  function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < createForm.codeLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    createForm.customCode = result;
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

  function getTypeLabel(type: ActionCodeType) {
    return actionCodeTypes.find(t => t.value === type)?.label || type;
  }

  function getStatusColor(code: ActionCode) {
    if (!code.isActive) return 'bg-red-500/20 text-red-300';
    if (new Date(code.expiresAt) <= new Date()) return 'bg-orange-500/20 text-orange-300';
    if (code.maxUses > 0 && code.currentUses >= code.maxUses) return 'bg-gray-500/20 text-gray-300';
    return 'bg-green-500/20 text-green-300';
  }

  function getStatusText(code: ActionCode) {
    if (!code.isActive) return 'Deaktiviert';
    if (new Date(code.expiresAt) <= new Date()) return 'Abgelaufen';
    if (code.maxUses > 0 && code.currentUses >= code.maxUses) return 'Ausgeschöpft';
    return 'Aktiv';
  }

  $: filteredCodes = actionCodes;
  $: totalPages = Math.ceil(totalCodes / itemsPerPage);

  function handleFilterChange() {
    currentPage = 1;
    loadActionCodes();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-white">Aktionscode-Manager</h2>
      <p class="text-white/70">Verwalte Admin-only Aktionscodes für spezielle Zwecke</p>
    </div>
    
    <Button
      variant="primary"
      onclick={() => showCreateForm = !showCreateForm}
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Neuer Aktionscode
    </Button>
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

  <!-- Create Form -->
  {#if showCreateForm}
    <Card variant="glass">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Neuen Aktionscode erstellen</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Grundlegende Informationen -->
          <div class="space-y-4">
            <div>
              <label class="block text-white font-medium mb-2">Name *</label>
              <Input
                bind:value={createForm.name}
                placeholder="z.B. Winter-Kampagne 2025"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-white font-medium mb-2">Beschreibung</label>
              <textarea
                bind:value={createForm.description}
                placeholder="Beschreibung des Zwecks..."
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                rows="3"
              ></textarea>
            </div>

            <div>
              <label class="block text-white font-medium mb-2">Typ</label>
              <select
                bind:value={createForm.type}
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                {#each actionCodeTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
              <p class="text-white/60 text-xs mt-1">
                {actionCodeTypes.find(t => t.value === createForm.type)?.description}
              </p>
            </div>
          </div>

          <!-- Code-Konfiguration -->
          <div class="space-y-4">
            <div>
              <label class="block text-white font-medium mb-2">Code</label>
              <div class="flex gap-2">
                <Input
                  bind:value={createForm.customCode}
                  placeholder="Leer lassen für Zufallscode"
                  class="flex-1"
                />
                <Button
                  variant="secondary"
                  onclick={generateRandomCode}
                  size="sm"
                >
                  Zufällig
                </Button>
              </div>
            </div>

            <div>
              <label class="block text-white font-medium mb-2">Code-Länge</label>
              <input
                type="range"
                bind:value={createForm.codeLength}
                min="6"
                max="12"
                class="w-full"
              />
              <div class="flex justify-between text-white/60 text-xs">
                <span>6</span>
                <span>{createForm.codeLength}</span>
                <span>12</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-white font-medium mb-2">Gültigkeit (Tage)</label>
                <Input
                  type="number"
                  bind:value={createForm.validityDays}
                  min="1"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-white font-medium mb-2">Max. Verwendungen</label>
                <Input
                  type="number"
                  bind:value={createForm.maxUses}
                  min="-1"
                  placeholder="-1 für unbegrenzt"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Zusätzliche Optionen -->
          <div class="md:col-span-2 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-white font-medium mb-2">Bonus Credits</label>
                <Input
                  type="number"
                  bind:value={createForm.bonusCredits}
                  min="0"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-white font-medium mb-2">Kampagne</label>
                <Input
                  bind:value={createForm.campaign}
                  placeholder="z.B. Winter2025"
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-white font-medium mb-2">Partner</label>
                <Input
                  bind:value={createForm.partner}
                  placeholder="z.B. Spotify"
                  class="w-full"
                />
              </div>
            </div>

            {#if createForm.type === 'event'}
              <div>
                <label class="block text-white font-medium mb-2">Event ID</label>
                <Input
                  bind:value={createForm.eventId}
                  placeholder="Event-Kennung eingeben"
                  class="w-full"
                />
              </div>
            {/if}
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <Button
            variant="secondary"
            onclick={() => { showCreateForm = false; resetCreateForm(); }}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onclick={createActionCode}
            disabled={loading || !createForm.name.trim()}
            loading={loading}
          >
            Erstellen
          </Button>
        </div>
      </div>
    </Card>
  {/if}

  <!-- Filters -->
  <Card variant="glass">
    <div class="p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-white font-medium mb-2 text-sm">Typ</label>
          <select
            bind:value={filters.type}
            on:change={handleFilterChange}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="">Alle Typen</option>
            {#each actionCodeTypes as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-white font-medium mb-2 text-sm">Status</label>
          <select
            bind:value={filters.active}
            on:change={handleFilterChange}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value={true}>Aktiv</option>
            <option value={false}>Inaktiv</option>
          </select>
        </div>

        <div>
          <label class="block text-white font-medium mb-2 text-sm">Kampagne</label>
          <Input
            bind:value={filters.campaign}
            on:input={handleFilterChange}
            placeholder="Kampagne filtern..."
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-white font-medium mb-2 text-sm">Suche</label>
          <Input
            bind:value={filters.search}
            on:input={handleFilterChange}
            placeholder="Code oder Name..."
            class="w-full"
          />
        </div>
      </div>
    </div>
  </Card>

  <!-- Action Codes List -->
  <Card variant="glass">
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-white/70">Lade Aktionscodes...</span>
      </div>
    {:else if actionCodes.length === 0}
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-white mb-2">Keine Aktionscodes gefunden</h3>
        <p class="text-white/60">Erstelle den ersten Aktionscode für deine Kampagnen.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-3 px-4 text-white font-medium">Code</th>
              <th class="text-left py-3 px-4 text-white font-medium">Name</th>
              <th class="text-left py-3 px-4 text-white font-medium">Typ</th>
              <th class="text-left py-3 px-4 text-white font-medium">Verwendung</th>
              <th class="text-left py-3 px-4 text-white font-medium">Status</th>
              <th class="text-left py-3 px-4 text-white font-medium">Gültig bis</th>
              <th class="text-left py-3 px-4 text-white font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {#each actionCodes as code}
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-4 px-4">
                  <span class="font-mono text-purple-300 font-semibold text-lg">
                    {code.code}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div>
                    <span class="text-white font-medium">
                      {code.name || 'Unbenannt'}
                    </span>
                    {#if code.description}
                      <p class="text-white/60 text-sm">
                        {code.description}
                      </p>
                    {/if}
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="text-white/80">
                    {getTypeLabel(code.type)}
                  </span>
                  {#if code.campaign}
                    <p class="text-white/60 text-xs">
                      {code.campaign}
                    </p>
                  {/if}
                </td>
                <td class="py-4 px-4">
                  <div class="text-center">
                    <span class="text-white font-medium">
                      {code.currentUses}
                    </span>
                    {#if code.maxUses > 0}
                      <span class="text-white/60">/{code.maxUses}</span>
                    {:else}
                      <span class="text-white/60">/∞</span>
                    {/if}
                    {#if code.maxUses > 0}
                      <div class="w-full bg-white/10 rounded-full h-1.5 mt-1">
                        <div 
                          class="bg-purple-400 h-1.5 rounded-full transition-all duration-300"
                          style="width: {Math.min((code.currentUses / code.maxUses) * 100, 100)}%"
                        ></div>
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(code)}">
                    {getStatusText(code)}
                  </span>
                </td>
                <td class="py-4 px-4 text-white/70 text-sm">
                  {formatDate(code.expiresAt)}
                </td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onclick={() => toggleCodeStatus(code)}
                      title={code.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {#if code.isActive}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      {:else}
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      {/if}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onclick={() => extendCode(code)}
                      title="Verlängern"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      {#if totalPages > 1}
        <div class="flex items-center justify-between p-4 border-t border-white/10">
          <div class="text-white/60 text-sm">
            Seite {currentPage} von {totalPages} ({totalCodes} Codes)
          </div>
          
          <div class="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onclick={() => { if (currentPage > 1) { currentPage--; loadActionCodes(); } }}
              disabled={currentPage === 1}
            >
              Zurück
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onclick={() => { if (currentPage < totalPages) { currentPage++; loadActionCodes(); } }}
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
