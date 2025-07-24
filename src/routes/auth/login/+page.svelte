<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { LoginForm } from '$lib/components/auth'
  import { user } from '$lib/stores/auth'
  import type { PageData } from './$types'

  // Check if user is already logged in
  onMount(() => {
    if ($user) {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard'
      goto(redirectTo, { replaceState: true })
    }
  })

  // Handle successful login
  function handleLoginSuccess(event: CustomEvent) {
    const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard'
    goto(redirectTo, { replaceState: true })
  }
</script>

<svelte:head>
  <title>Anmelden - RaveTracker</title>
  <meta name="description" content="Melde dich bei RaveTracker an, um deine Rave-Events zu verwalten und zu entdecken." />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-8">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Willkommen zurück</h1>
      <p class="text-white/70">Melde dich an, um fortzufahren</p>
    </div>

    <!-- Login Form -->
    <LoginForm on:success={handleLoginSuccess} />

    <!-- Footer -->
    <div class="text-center mt-6 space-y-2">
      <p class="text-white/60 text-sm">
        Noch kein Konto? 
        <a 
          href="/auth/register" 
          class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Jetzt registrieren
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
      </div>
    </div>
  </div>
</div>
