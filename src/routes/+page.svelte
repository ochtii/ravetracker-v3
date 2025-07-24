<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth'
  import { Button } from '$lib/ui'

  // Redirect authenticated users to dashboard
  onMount(() => {
    if ($user) {
      goto('/dashboard')
    }
  })
</script>

<svelte:head>
  <title>RaveTracker - Entdecke die besten Rave-Events</title>
  <meta name="description" content="Finde und tracke die besten Rave-Events in deiner Nähe. Verbinde dich mit der Rave-Community und verpasse nie wieder ein Event." />
</svelte:head>

<div class="min-h-screen flex flex-col">
  <!-- Hero Section -->
  <section class="flex-1 flex items-center justify-center px-4 py-16">
    <div class="text-center max-w-4xl mx-auto">
      <!-- Logo/Brand -->
      <div class="mb-8">
        <h1 class="text-6xl md:text-7xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text mb-4">
          RaveTracker
        </h1>
        <p class="text-xl md:text-2xl text-white/80 font-light">
          Entdecke die besten Rave-Events in deiner Nähe
        </p>
      </div>

      <!-- Features -->
      <div class="grid md:grid-cols-3 gap-8 mb-12">
        <div class="text-center">
          <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Events entdecken</h3>
          <p class="text-white/60">Finde lokale und internationale Rave-Events</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Favoriten tracken</h3>
          <p class="text-white/60">Speichere deine Lieblings-Events und -Locations</p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-white mb-2">Community</h3>
          <p class="text-white/60">Verbinde dich mit anderen Ravern</p>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="primary" 
          size="lg"
          href="/auth/register"
          class="text-lg px-8 py-4"
        >
          Kostenlos starten
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg"
          href="/auth/login"
          class="text-lg px-8 py-4"
        >
          Anmelden
        </Button>
      </div>

      <!-- Trust indicators -->
      <div class="mt-12 text-center">
        <p class="text-white/40 text-sm mb-4">Vertraut von Tausenden von Ravern weltweit</p>
        <div class="flex justify-center items-center space-x-8 opacity-50">
          <div class="text-white/30 font-semibold">🎧 DJ-Community</div>
          <div class="text-white/30 font-semibold">🎪 Event-Veranstalter</div>
          <div class="text-white/30 font-semibold">🌍 Global Network</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-8">
    <div class="container mx-auto px-4 text-center">
      <div class="text-white/40 text-sm space-x-6">
        <a href="/privacy" class="hover:text-white/60 transition-colors">Datenschutz</a>
        <a href="/terms" class="hover:text-white/60 transition-colors">AGB</a>
        <a href="/imprint" class="hover:text-white/60 transition-colors">Impressum</a>
        <a href="/contact" class="hover:text-white/60 transition-colors">Kontakt</a>
      </div>
      <p class="text-white/40 text-xs mt-4">
        © {new Date().getFullYear()} RaveTracker. Alle Rechte vorbehalten.
      </p>
    </div>
  </footer>
</div>
