<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { confirmEmail } from '$lib/utils/email-confirmation';
  import { authActions } from '$lib/stores/auth';

  let loading = true;
  let success = false;
  let error: string | null = null;

  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const type = $page.url.searchParams.get('type') || 'signup';

    if (!token) {
      error = 'Kein Bestätigungstoken gefunden';
      loading = false;
      return;
    }

    try {
      const result = await confirmEmail(token, type);
      
      if (result.success) {
        success = true;
        // Initialize auth to load user profile
        await authActions.initialize();
        
        // Redirect after successful confirmation
        setTimeout(() => {
          goto('/dashboard');
        }, 2000);
      } else {
        error = result.error?.message || 'E-Mail-Bestätigung fehlgeschlagen';
      }
    } catch (err) {
      error = 'Ein unerwarteter Fehler ist aufgetreten';
      console.error('Confirmation error:', err);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>E-Mail bestätigen - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-8 text-center">
    {#if loading}
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <h1 class="text-2xl font-bold text-white mb-2">E-Mail wird bestätigt...</h1>
      <p class="text-gray-300">Bitte warten Sie einen Moment.</p>
    {:else if success}
      <div class="text-green-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">E-Mail erfolgreich bestätigt!</h1>
      <p class="text-gray-300 mb-4">Ihr Account wurde aktiviert. Sie werden weitergeleitet...</p>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div class="bg-green-400 h-2 rounded-full animate-pulse" style="width: 100%"></div>
      </div>
    {:else if error}
      <div class="text-red-400 mb-4">
        <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">Bestätigung fehlgeschlagen</h1>
      <p class="text-gray-300 mb-6">{error}</p>
      <div class="space-y-3">
        <button 
          class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          on:click={() => goto('/auth/login')}
        >
          Zur Anmeldung
        </button>
        <button 
          class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          on:click={() => goto('/')}
        >
          Zur Startseite
        </button>
      </div>
    {/if}
  </div>
</div>
