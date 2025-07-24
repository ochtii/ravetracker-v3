<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { user, profile } from '$lib/stores/auth'
  import { Button, Card } from '$lib/ui'

  // Redirect if not authenticated
  onMount(() => {
    if (!$user) {
      goto('/auth/login?redirectTo=/dashboard')
    }
  })

  // Get greeting based on time of day
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Guten Morgen'
    if (hour < 18) return 'Guten Tag'
    return 'Guten Abend'
  }

  // Get display name
  function getDisplayName() {
    if ($profile?.first_name) {
      return $profile.first_name
    }
    if ($profile?.username) {
      return $profile.username
    }
    return $user?.email?.split('@')[0] || 'Raver'
  }
</script>

<svelte:head>
  <title>Dashboard - RaveTracker</title>
  <meta name="description" content="Dein persönliches RaveTracker Dashboard mit aktuellen Events und Aktivitäten." />
</svelte:head>

{#if $user}
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <!-- Welcome Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">
        {getGreeting()}, {getDisplayName()}! 🎉
      </h1>
      <p class="text-white/70">
        Willkommen zurück bei RaveTracker. Hier sind deine neuesten Updates.
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <Card variant="glass" class="text-center">
        <div class="text-3xl font-bold text-purple-400 mb-2">0</div>
        <div class="text-white/70">Events besucht</div>
      </Card>
      
      <Card variant="glass" class="text-center">
        <div class="text-3xl font-bold text-pink-400 mb-2">0</div>
        <div class="text-white/70">Favoriten</div>
      </Card>
      
      <Card variant="glass" class="text-center">
        <div class="text-3xl font-bold text-blue-400 mb-2">0</div>
        <div class="text-white/70">Freunde</div>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Upcoming Events -->
      <Card variant="glass">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Anstehende Events
        </h2>
        
        <div class="text-center py-8">
          <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-white/60 mb-4">Keine anstehenden Events</p>
          <Button variant="primary" href="/events">
            Events entdecken
          </Button>
        </div>
      </Card>

      <!-- Recent Activity -->
      <Card variant="glass">
        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Aktivitäten
        </h2>
        
        <div class="text-center py-8">
          <svg class="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p class="text-white/60 mb-4">Noch keine Aktivitäten</p>
          <Button variant="secondary" href="/profile">
            Profil vervollständigen
          </Button>
        </div>
      </Card>
    </div>

    <!-- Feature Cards -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Events -->
      <Card variant="glass" class="group hover:bg-white/10 transition-all duration-200 cursor-pointer">
        <a href="/events" class="block">
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
              <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Events entdecken</h3>
            <p class="text-white/60 text-sm">Finde die besten Rave-Events in deiner Nähe</p>
          </div>
        </a>
      </Card>

      <!-- Favorites -->
      <Card variant="glass" class="group hover:bg-white/10 transition-all duration-200 cursor-pointer">
        <a href="/favorites" class="block">
          <div class="text-center">
            <div class="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-500/30 transition-colors">
              <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Favoriten</h3>
            <p class="text-white/60 text-sm">Deine gespeicherten Events und Locations</p>
          </div>
        </a>
      </Card>

      <!-- Profile -->
      <Card variant="glass" class="group hover:bg-white/10 transition-all duration-200 cursor-pointer">
        <a href="/profile" class="block">
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
              <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Profil</h3>
            <p class="text-white/60 text-sm">Verwalte deine Account-Einstellungen</p>
          </div>
        </a>
      </Card>
    </div>

    <!-- Welcome Message for New Users -->
    {#if !$profile?.first_name && !$profile?.username}
      <Card variant="glass" class="mt-8 border border-purple-500/30">
        <div class="text-center">
          <h3 class="text-xl font-semibold text-purple-400 mb-2">🎊 Willkommen bei RaveTracker!</h3>
          <p class="text-white/70 mb-4">
            Vervollständige dein Profil, um das Beste aus RaveTracker herauszuholen.
          </p>
          <Button variant="primary" href="/profile">
            Profil vervollständigen
          </Button>
        </div>
      </Card>
    {/if}
  </div>
{:else}
  <!-- Loading state -->
  <div class="container mx-auto px-4 py-8 text-center">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    <p class="text-white/70 mt-4">Lädt Dashboard...</p>
  </div>
{/if}
