<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ActionCodeManager, ActionCodeStats } from '$lib/components/admin';
  import { Card, Alert, Button } from '$lib/components/ui';
  import { profile, isAuthenticated, isAdmin } from '$lib/stores/auth';

  // State
  let currentUser: any = null;
  let activeTab = 'manager';
  let refreshTrigger = 0;
  let loading = true;
  let error = '';

  const tabs = [
    {
      id: 'manager',
      label: 'Code-Manager',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`,
      description: 'Erstelle und verwalte Admin-only Aktionscodes'
    },
    {
      id: 'stats',
      label: 'Statistiken',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>`,
      description: 'Übersicht über Performance und Analytics'
    }
  ];

  onMount(async () => {
    try {
      // Check authentication and admin privileges
      const currentProfile = $profile;
      const authenticated = $isAuthenticated;
      const adminAccess = $isAdmin;

      if (!authenticated || !currentProfile) {
        error = 'Benutzer nicht authentifiziert';
        goto('/admin/login');
        return;
      }

      if (!adminAccess) {
        error = 'Zugang verweigert. Admin-Berechtigung erforderlich.';
        goto('/admin');
        return;
      }

      currentUser = currentProfile;

      // Check for tab parameter in URL
      const tabParam = $page.url.searchParams.get('tab');
      if (tabParam && tabs.some(tab => tab.id === tabParam)) {
        activeTab = tabParam;
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      error = 'Fehler beim Laden des Benutzerprofils';
      goto('/admin/login');
    } finally {
      loading = false;
    }
  });

  function switchTab(tabId: string) {
    activeTab = tabId;
    
    // Update URL parameter
    const url = new URL($page.url);
    url.searchParams.set('tab', tabId);
    goto(url.toString(), { replaceState: true, noScroll: true });
    
    // Trigger refresh for stats
    if (tabId === 'stats') {
      refreshTrigger++;
    }
  }

  function refreshStats() {
    refreshTrigger++;
  }
</script>

<svelte:head>
  <title>Aktionscode-System - RaveTracker Admin</title>
  <meta name="description" content="Admin-only Aktionscode-System für spezielle Kampagnen und Events" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <div class="container mx-auto px-4 py-8">
    {#if loading}
      <div class="flex items-center justify-center min-h-[50vh]">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-white/70">Lade Aktionscode-System...</p>
        </div>
      </div>
    {:else if error}
      <Card variant="glass">
        <div class="p-8 text-center">
          <Alert variant="error">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </Alert>
          
          <div class="mt-6">
            <Button onclick={() => goto('/admin')} variant="primary">
              Zurück zum Admin-Panel
            </Button>
          </div>
        </div>
      </Card>
    {:else}
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">
              Admin-only Aktionscode-System
            </h1>
            <p class="text-white/70 max-w-2xl">
              Verwalte spezielle Aktionscodes für Marketing-Kampagnen, Events, Partner und Notfälle. 
              Diese Codes können nur von Administratoren erstellt und verwaltet werden.
            </p>
          </div>
          
          <div class="flex items-center gap-3">
            {#if activeTab === 'stats'}
              <Button
                variant="secondary"
                size="sm"
                onclick={refreshStats}
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aktualisieren
              </Button>
            {/if}
            
            <Button
              variant="secondary"
              onclick={() => goto('/admin')}
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück
            </Button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <Card variant="glass">
          <div class="p-1">
            <div class="flex space-x-1">
              {#each tabs as tab}
                <button
                  onclick={() => switchTab(tab.id)}
                  class="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex-1 {
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }"
                >
                  <span class="mr-2">
                    {@html tab.icon}
                  </span>
                  <div class="text-left">
                    <div class="font-medium">{tab.label}</div>
                    <div class="text-xs opacity-80 hidden sm:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </Card>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        {#if activeTab === 'manager'}
          <ActionCodeManager adminId={currentUser.id} />
        {:else if activeTab === 'stats'}
          <ActionCodeStats {refreshTrigger} />
        {/if}
      </div>

      <!-- Footer Info -->
      <div class="mt-12 text-center">
        <div class="bg-white/5 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 class="text-lg font-semibold text-white mb-3">Über das Aktionscode-System</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/70">
            <div class="p-3 bg-white/5 rounded-lg">
              <div class="font-medium text-purple-300 mb-1">Kampagne-Codes</div>
              <p>Für Marketing-Kampagnen und Promotions mit ROI-Tracking</p>
            </div>
            <div class="p-3 bg-white/5 rounded-lg">
              <div class="font-medium text-blue-300 mb-1">Event-Codes</div>
              <p>Spezielle Codes für Events mit Teilnehmerbegrenzung</p>
            </div>
            <div class="p-3 bg-white/5 rounded-lg">
              <div class="font-medium text-green-300 mb-1">Partner-Codes</div>
              <p>Kooperationscodes für externe Partner</p>
            </div>
            <div class="p-3 bg-white/5 rounded-lg">
              <div class="font-medium text-red-300 mb-1">Notfall-Codes</div>
              <p>Für Systemprobleme oder dringende Situationen</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .tab-content {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
