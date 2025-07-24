<script lang="ts">
  import { supabase } from '$lib/utils/supabase';
  import { goto } from '$app/navigation';

  let email = '';
  let loading = false;
  let success = false;
  let error = '';

  async function handleSubmit() {
    if (!email.trim()) {
      error = 'Bitte geben Sie Ihre E-Mail-Adresse ein';
      return;
    }

    loading = true;
    error = '';

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (resetError) {
        throw resetError;
      }

      success = true;
    } catch (err) {
      console.error('Password reset error:', err);
      error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<svelte:head>
  <title>Passwort zurücksetzen - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Passwort zurücksetzen</h1>
      <p class="text-gray-300">
        Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
      </p>
    </div>

    <div class="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
      {#if success}
        <!-- Success State -->
        <div class="text-center">
          <div class="text-green-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">E-Mail gesendet!</h2>
          <p class="text-gray-300 mb-6">
            Wir haben Ihnen einen Link zum Zurücksetzen des Passworts an <strong>{email}</strong> gesendet.
          </p>
          <p class="text-gray-400 text-sm mb-6">
            Überprüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht erhalten haben.
          </p>
          <div class="space-y-3">
            <button
              type="button"
              on:click={() => goto('/auth/login')}
              class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Zurück zur Anmeldung
            </button>
            <button
              type="button"
              on:click={() => { success = false; email = ''; }}
              class="w-full bg-transparent border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      {:else}
        <!-- Form -->
        <form on:submit|preventDefault={handleSubmit}>
          <div class="mb-6">
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              id="email"
              bind:value={email}
              on:keydown={handleKeyDown}
              disabled={loading}
              class="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="ihre.email@beispiel.de"
              required
            />
          </div>

          {#if error}
            <div class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p class="text-red-300 text-sm">{error}</p>
            </div>
          {/if}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Wird gesendet...
            {:else}
              Reset-Link senden
            {/if}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-gray-400 text-sm">
            Passwort wieder eingefallen? 
            <a 
              href="/auth/login" 
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Zurück zur Anmeldung
            </a>
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
