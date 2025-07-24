<script lang="ts">
  import { resendConfirmation } from '$lib/utils/email-confirmation';
  import { goto } from '$app/navigation';

  let email = '';
  let loading = false;
  let success = false;
  let error: string | null = null;

  async function handleResend() {
    if (!email) {
      error = 'Bitte geben Sie Ihre E-Mail-Adresse ein';
      return;
    }

    loading = true;
    error = null;

    try {
      const result = await resendConfirmation(email);
      
      if (result.success) {
        success = true;
      } else {
        error = result.error?.message || 'Fehler beim Senden der Bestätigungs-E-Mail';
      }
    } catch (err) {
      error = 'Ein unerwarteter Fehler ist aufgetreten';
      console.error('Resend error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>E-Mail-Bestätigung erneut senden - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-8">
    {#if success}
      <div class="text-center">
        <div class="text-green-400 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">E-Mail gesendet!</h1>
        <p class="text-gray-300 mb-6">
          Wir haben eine neue Bestätigungs-E-Mail an <strong>{email}</strong> gesendet.
          Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Bestätigungslink.
        </p>
        <button 
          class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          on:click={() => goto('/auth/login')}
        >
          Zur Anmeldung
        </button>
      </div>
    {:else}
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">E-Mail bestätigen</h1>
        <p class="text-gray-300">
          Geben Sie Ihre E-Mail-Adresse ein, um eine neue Bestätigungs-E-Mail zu erhalten.
        </p>
      </div>

      <form on:submit|preventDefault={handleResend} class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            placeholder="ihre.email@beispiel.de"
          />
        </div>

        {#if error}
          <div class="bg-red-500/20 border border-red-500 rounded-lg p-3">
            <p class="text-red-300 text-sm">{error}</p>
          </div>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Wird gesendet...
          {:else}
            Bestätigungs-E-Mail senden
          {/if}
        </button>
      </form>

      <div class="mt-6 text-center">
        <button 
          class="text-gray-400 hover:text-white transition-colors"
          on:click={() => goto('/auth/login')}
        >
          ← Zurück zur Anmeldung
        </button>
      </div>
    {/if}
  </div>
</div>
