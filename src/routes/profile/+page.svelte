<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { ProfileForm } from '$lib/components/auth'
  import { user, profile } from '$lib/stores/auth'
  import { Button, Card } from '$lib/ui'

  let showEditForm = false
  let loading = false

  // Redirect if not authenticated
  onMount(() => {
    if (!$user) {
      goto('/auth/login?redirectTo=/profile')
    }
  })

  // Handle profile update success
  function handleProfileSuccess(event: CustomEvent) {
    showEditForm = false
    // Profile store will be automatically updated via the auth store
  }

  // Handle profile form cancel
  function handleCancel() {
    showEditForm = false
  }

  // Format date for display
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Nicht angegeben'
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get user initials for avatar fallback
  function getUserInitials() {
    if (!$profile) return 'U'
    const firstName = $profile.first_name || ''
    const lastName = $profile.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  }
</script>

<svelte:head>
  <title>Profil - RaveTracker</title>
  <meta name="description" content="Verwalte dein RaveTracker-Profil und deine Account-Einstellungen." />
</svelte:head>

{#if $user}
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Mein Profil</h1>
        <p class="text-white/70">Verwalte deine Account-Informationen und Einstellungen</p>
      </div>
      
      {#if !showEditForm}
        <Button
          variant="primary"
          onclick={() => showEditForm = true}
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Bearbeiten
        </Button>
      {/if}
    </div>

    {#if showEditForm}
      <!-- Edit Profile Form -->
      <ProfileForm 
        on:success={handleProfileSuccess}
        on:cancel={handleCancel}
      />
    {:else}
      <!-- Profile Display -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Profile Overview -->
        <div class="lg:col-span-1">
          <Card variant="glass" class="text-center">
            <!-- Avatar -->
            <div class="mb-4">
              {#if $profile?.avatar_url}
                <img 
                  src={$profile.avatar_url} 
                  alt="Profilbild"
                  class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white/20"
                />
              {:else}
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20">
                  {getUserInitials()}
                </div>
              {/if}
            </div>

            <!-- Basic Info -->
            <h2 class="text-xl font-bold text-white mb-1">
              {#if $profile?.first_name || $profile?.last_name}
                {$profile.first_name || ''} {$profile.last_name || ''}
              {:else}
                {$user.email}
              {/if}
            </h2>
            
            {#if $profile?.username}
              <p class="text-purple-400 mb-2">@{$profile.username}</p>
            {/if}

            <p class="text-white/60 text-sm mb-4">{$user.email}</p>

            {#if $profile?.bio}
              <p class="text-white/80 text-sm italic">{$profile.bio}</p>
            {/if}
          </Card>
        </div>

        <!-- Profile Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Personal Information -->
          <Card variant="glass">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Persönliche Informationen
            </h3>

            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">Vorname</label>
                <p class="text-white">{$profile?.first_name || 'Nicht angegeben'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">Nachname</label>
                <p class="text-white">{$profile?.last_name || 'Nicht angegeben'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">Benutzername</label>
                <p class="text-white">{$profile?.username || 'Nicht angegeben'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">Geburtsdatum</label>
                <p class="text-white">{formatDate($profile?.birth_date)}</p>
              </div>
            </div>
          </Card>

          <!-- Contact & Social -->
          <Card variant="glass">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Kontakt & Social
            </h3>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-white/70 mb-1">E-Mail</label>
                <p class="text-white">{$user.email}</p>
              </div>
              
              {#if $profile?.website}
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-1">Website</label>
                  <a 
                    href={$profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {$profile.website}
                  </a>
                </div>
              {/if}

              {#if $profile?.location}
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-1">Standort</label>
                  <p class="text-white">{$profile.location}</p>
                </div>
              {/if}
            </div>
          </Card>

          <!-- Account Status -->
          <Card variant="glass">
            <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account-Status
            </h3>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-white/70">E-Mail verifiziert</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {$user.email_confirmed_at ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">
                  {$user.email_confirmed_at ? 'Verifiziert' : 'Ausstehend'}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-white/70">Mitglied seit</span>
                <span class="text-white">
                  {new Date($user.created_at).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-white/70">Letzte Anmeldung</span>
                <span class="text-white">
                  {$user.last_sign_in_at ? new Date($user.last_sign_in_at).toLocaleDateString('de-DE') : 'Nie'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Loading state -->
  <div class="container mx-auto px-4 py-8 text-center">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <p class="text-white/70 mt-4">Lädt...</p>
  </div>
{/if}
