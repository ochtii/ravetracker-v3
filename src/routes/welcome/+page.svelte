<script lang="ts">
  import { onMount } from 'svelte'
  import { Button, Card } from '$lib/ui'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth'

  // Client-seitige Weiterleitung für eingeloggte Nutzer
  onMount(() => {
    if ($user) {
      goto('/(authenticated)/dashboard')
    }
  })

  function handleLogin() {
    goto('/auth/login?redirectTo=/(authenticated)/dashboard')
  }

  function handleRegister() {
    goto('/auth/register?redirectTo=/(authenticated)/dashboard')
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <div class="container mx-auto px-4 py-16">
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
        Willkommen bei RaveTracker
      </h1>
      <p class="text-xl text-gray-300 mb-8">
        Entdecke Events, verfolge deine Lieblings-DJs und tauche ein in die Rave-Szene
      </p>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
      <Card class="bg-white/10 backdrop-blur-lg border-white/20">
        <div class="p-6 text-center">
          <div class="text-4xl mb-4">🎵</div>
          <h3 class="text-xl font-semibold text-white mb-2">Events Entdecken</h3>
          <p class="text-gray-300">
            Finde die besten Rave-Events in deiner Nähe und plane deine nächsten Partys
          </p>
        </div>
      </Card>

      <Card class="bg-white/10 backdrop-blur-lg border-white/20">
        <div class="p-6 text-center">
          <div class="text-4xl mb-4">👥</div>
          <h3 class="text-xl font-semibold text-white mb-2">Community</h3>
          <p class="text-gray-300">
            Verbinde dich mit anderen Ravern und teile deine Erfahrungen
          </p>
        </div>
      </Card>

      <Card class="bg-white/10 backdrop-blur-lg border-white/20">
        <div class="p-6 text-center">
          <div class="text-4xl mb-4">🎧</div>
          <h3 class="text-xl font-semibold text-white mb-2">DJ Tracking</h3>
          <p class="text-gray-300">
            Verfolge deine Lieblings-DJs und verpasse nie wieder ihre Sets
          </p>
        </div>
      </Card>
    </div>

    <div class="text-center">
      <Card class="bg-white/10 backdrop-blur-lg border-white/20 max-w-md mx-auto">
        <div class="p-8">
          <h2 class="text-2xl font-bold text-white mb-4">
            Bereit loszulegen?
          </h2>
          <p class="text-gray-300 mb-6">
            Melde dich an oder registriere dich, um auf dein persönliches Dashboard zuzugreifen
          </p>
          <div class="space-y-3">
            <Button
              on:click={handleLogin}
              class="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Anmelden
            </Button>
            <Button
              on:click={handleRegister}
              variant="outline"
              class="w-full border-white/30 text-white hover:bg-white/10"
            >
              Registrieren
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</div>
