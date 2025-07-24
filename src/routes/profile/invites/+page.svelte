<!--
  RaveTracker v3.0 - Profile Invites Page
  =======================================
  User profile section for invite management
  Features: Full invite management interface with user context
-->

<script lang="ts">
  import { page } from '$app/stores'
  import { user, profile } from '$lib/stores/auth'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { ArrowLeft, Users, Info } from 'lucide-svelte'
  import InviteManager from '$lib/components/InviteManager.svelte'
  import type { PageData } from './$types'

  // Page data from server
  export let data: PageData

  // Reactive values
  $: currentUser = $user
  $: userProfile = $profile

  // Redirect if not authenticated
  $: if (!currentUser && typeof window !== 'undefined') {
    goto('/auth/login?redirectTo=' + encodeURIComponent($page.url.pathname))
  }

  // Page title and metadata
  $: pageTitle = `Invite-Management - ${userProfile?.username || 'Profil'}`

  onMount(() => {
    // Set page title
    if (typeof document !== 'undefined') {
      document.title = pageTitle
    }
  })
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content="Verwalte deine RaveTracker Invite-Codes, erstelle neue Invites und lade Freunde ein." />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if currentUser}
  <div class="profile-invites-page">
    <!-- Navigation header -->
    <div class="page-header">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between py-6">
          <div class="flex items-center gap-4">
            <button
              on:click={() => goto('/profile')}
              class="nav-back"
              title="Zurück zum Profil"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            
            <div>
              <h1 class="text-2xl font-bold text-white">Invite-Management</h1>
              <p class="text-white/70">Lade Freunde zu RaveTracker ein</p>
            </div>
          </div>

          <div class="profile-badge">
            <Users class="w-5 h-5" />
            <span class="text-sm font-medium">
              {userProfile?.username || 'User'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="page-content">
      <div class="container mx-auto px-4 pb-8">
        <!-- Help section -->
        <div class="help-section">
          <div class="help-card">
            <div class="flex items-start gap-3">
              <div class="help-icon">
                <Info class="w-5 h-5" />
              </div>
              <div class="help-content">
                <h3 class="font-semibold text-white mb-2">Wie funktionieren Invite-Codes?</h3>
                <ul class="text-sm text-white/70 space-y-1">
                  <li>• Erstelle Invite-Codes mit deinen verfügbaren Credits</li>
                  <li>• Teile die Codes mit Freunden über E-Mail oder Social Media</li>
                  <li>• Codes sind 30 Tage gültig und können nur einmal verwendet werden</li>
                  <li>• Lösche unbenutzte Codes um deine Credits zurückzuerhalten</li>
                  <li>• Verdiene zusätzliche Credits durch Verifizierung und Aktivität</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Invite Manager Component -->
        {#if data.user}
          <InviteManager
            userId={data.user.id}
            initialCredits={data.stats?.currentCredits || 0}
            initialInvites={data.invites || []}
            initialStats={data.stats}
          />
        {:else}
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p class="text-white/70">Lade Benutzerdaten...</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Footer info -->
    <div class="page-footer">
      <div class="container mx-auto px-4 py-6">
        <div class="footer-info">
          <div class="info-grid">
            <div class="info-item">
              <h4 class="font-medium text-white mb-2">Credits verdienen</h4>
              <p class="text-sm text-white/70">
                Verifiziere dein Profil, nimm an Events teil und werde ein aktives Community-Mitglied 
                um mehr Invite-Credits zu verdienen.
              </p>
            </div>
            
            <div class="info-item">
              <h4 class="font-medium text-white mb-2">Sicherheit</h4>
              <p class="text-sm text-white/70">
                Teile deine Codes nur mit vertrauenswürdigen Personen. 
                Missbrauch kann zur Sperrung deines Accounts führen.
              </p>
            </div>
          </div>
          
          <div class="footer-links">
            <button
              on:click={() => goto('/help/invites')}
              class="footer-link"
            >
              Invite-Hilfe
            </button>
            <button
              on:click={() => goto('/help/community-guidelines')}
              class="footer-link"
            >
              Community-Richtlinien
            </button>
            <button
              on:click={() => goto('/profile/verification')}
              class="footer-link"
            >
              Profil verifizieren
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Loading or redirect state -->
  <div class="auth-required">
    <div class="container mx-auto px-4 py-12 text-center">
      <div class="loading-spinner mx-auto mb-4"></div>
      <h2 class="text-xl font-semibold text-white mb-2">Authentifizierung erforderlich</h2>
      <p class="text-white/70 mb-6">Du wirst zur Anmeldung weitergeleitet...</p>
      <button
        on:click={() => goto('/auth/login')}
        class="btn-primary"
      >
        Jetzt anmelden
      </button>
    </div>
  </div>
{/if}

<style>
  .profile-invites-page {
    @apply min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900;
  }

  .page-header {
    @apply border-b border-white/10 bg-black/20 backdrop-blur-sm;
  }

  .nav-back {
    @apply w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg;
    @apply flex items-center justify-center text-white transition-colors;
  }

  .profile-badge {
    @apply flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg;
    @apply border border-white/20 text-white;
  }

  .page-content {
    @apply flex-1;
  }

  .help-section {
    @apply mb-8;
  }

  .help-card {
    @apply bg-blue-600/20 border border-blue-500/30 rounded-xl p-6;
    @apply backdrop-blur-sm;
  }

  .help-icon {
    @apply w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center;
    @apply text-blue-300 flex-shrink-0;
  }

  .help-content {
    @apply flex-1 min-w-0;
  }

  .page-footer {
    @apply border-t border-white/10 bg-black/20 backdrop-blur-sm;
  }

  .footer-info {
    @apply space-y-6;
  }

  .info-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
  }

  .info-item {
    @apply space-y-2;
  }

  .footer-links {
    @apply flex flex-wrap gap-4 justify-center pt-4 border-t border-white/10;
  }

  .footer-link {
    @apply text-sm text-purple-300 hover:text-purple-100 transition-colors;
    @apply underline underline-offset-4;
  }

  .loading-state {
    @apply text-center py-12;
  }

  .loading-spinner {
    @apply w-8 h-8 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin;
  }

  .auth-required {
    @apply min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900;
    @apply flex items-center justify-center;
  }

  .btn-primary {
    @apply px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg;
    @apply font-medium transition-colors duration-200;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .page-header .flex {
      @apply flex-col gap-4 items-start;
    }

    .profile-badge {
      @apply self-end;
    }

    .info-grid {
      @apply grid-cols-1;
    }

    .footer-links {
      @apply flex-col text-center;
    }

    .help-card .flex {
      @apply flex-col gap-3;
    }

    .help-icon {
      @apply self-center;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .profile-invites-page {
      @apply bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900;
    }
  }
</style>
