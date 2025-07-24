<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authActions } from '$lib/stores/auth';

  let loading = true;
  let success = false;
  let error: string | null = null;
  let token: string | null = null;

  onMount(async () => {
    // Get token from URL fragments (common for email confirmation)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    token = hashParams.get('access_token') || $page.url.searchParams.get('token');
    
    if (!token) {
      error = 'Kein Bestätigungstoken gefunden';
      loading = false;
      return;
    }

    try {
      const result = await authActions.confirmEmail(token, 'signup');
      
      if (result.data && !result.error) {
        success = true;
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          goto('/dashboard');
        }, 2000);
      } else {
        error = result.error?.message || 'E-Mail-Bestätigung fehlgeschlagen';
      }
    } catch (err) {
      error = 'Ein unerwarteter Fehler ist aufgetreten';
      console.error('Email confirmation error:', err);
    } finally {
      loading = false;
    }
  });

  function handleRetry() {
    window.location.reload();
  }
</script>

{#if loading}
  <div class="flex flex-col items-center justify-center min-h-[200px]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
    <p class="text-gray-600">E-Mail wird bestätigt...</p>
  </div>
{:else if success}
  <div class="text-center">
    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
      <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">E-Mail erfolgreich bestätigt!</h3>
    <p class="text-gray-600 mb-4">Ihr Account wurde aktiviert. Sie werden weitergeleitet...</p>
    <div class="w-full bg-gray-200 rounded-full h-1">
      <div class="bg-green-600 h-1 rounded-full animate-pulse" style="width: 100%"></div>
    </div>
  </div>
{:else if error}
  <div class="text-center">
    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
      <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">Bestätigung fehlgeschlagen</h3>
    <p class="text-gray-600 mb-4">{error}</p>
    <div class="space-y-2">
      <button 
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        on:click={handleRetry}
      >
        Erneut versuchen
      </button>
      <button 
        class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
        on:click={() => goto('/auth/resend-confirmation')}
      >
        Neue Bestätigungs-E-Mail anfordern
      </button>
    </div>
  </div>
{/if}
