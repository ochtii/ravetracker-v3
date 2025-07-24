<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/utils/supabase';
  import { authActions } from '$lib/stores/auth';

  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // Handle auth callback
      const { data, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        throw authError;
      }

      if (data.session) {
        // User authenticated successfully
        await authActions.initialize();
        
        // Redirect to intended destination or dashboard
        const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard';
        goto(redirectTo, { replaceState: true });
      } else {
        // No session found, redirect to login
        goto('/auth/login', { replaceState: true });
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      error = err instanceof Error ? err.message : 'Authentication failed';
      
      // Redirect to login with error after 3 seconds
      setTimeout(() => {
        goto('/auth/login?error=' + encodeURIComponent(error || 'Authentication failed'), { replaceState: true });
      }, 3000);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Authentifizierung... - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-8 text-center">
    {#if loading}
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <h1 class="text-2xl font-bold text-white mb-2">Authentifizierung...</h1>
      <p class="text-gray-300">Sie werden angemeldet. Bitte warten.</p>
    {:else if error}
      <div class="text-red-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">Authentifizierung fehlgeschlagen</h1>
      <p class="text-gray-300 mb-4">{error}</p>
      <p class="text-gray-400 text-sm">Sie werden zur Anmeldung weitergeleitet...</p>
    {/if}
  </div>
</div>
