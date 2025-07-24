<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { RegisterForm } from '$lib/components/auth'
  import { user } from '$lib/stores/auth'

  // Check if user is already logged in
  onMount(() => {
    if ($user) {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard'
      goto(redirectTo, { replaceState: true })
    }
  })

  // Handle successful registration
  function handleRegisterSuccess(event: CustomEvent) {
    // After registration, show email confirmation message
    goto('/auth/confirm-email-sent', { replaceState: true })
  }
</script>

<svelte:head>
  <title>Registrieren - RaveTracker</title>
  <meta name="description" content="Erstelle dein kostenloses RaveTracker-Konto und entdecke die besten Rave-Events in deiner Nähe." />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-8">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Bei RaveTracker anmelden</h1>
      <p class="text-white/70">Erstelle dein kostenloses Konto</p>
    </div>

    <!-- Register Form -->
    <RegisterForm on:success={handleRegisterSuccess} />

    <!-- Footer -->
    <div class="text-center mt-6 space-y-2">
      <p class="text-white/60 text-sm">
        Bereits ein Konto? 
        <a 
          href="/auth/login" 
          class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Jetzt anmelden
        </a>
      </p>
      
      <div class="text-xs text-white/40">
        <a 
          href="/privacy" 
          class="hover:text-white/60 transition-colors"
        >
          Datenschutz
        </a>
        ·
        <a 
          href="/terms" 
          class="hover:text-white/60 transition-colors"
        >
          AGB
        </a>
        ·
        <a 
          href="/imprint" 
          class="hover:text-white/60 transition-colors"
        >
          Impressum
        </a>
      </div>
    </div>
  </div>
</div>
