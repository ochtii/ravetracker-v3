<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/utils/supabase';

  let loading = true;
  let updating = false;
  let success = false;
  let error = '';
  let password = '';
  let confirmPassword = '';
  let validToken = false;

  onMount(async () => {
    // Check for access token in URL
    const accessToken = $page.url.searchParams.get('access_token');
    const refreshToken = $page.url.searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      try {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          throw sessionError;
        }

        validToken = true;
      } catch (err) {
        console.error('Token validation error:', err);
        error = 'Ungültiger oder abgelaufener Reset-Link';
      }
    } else {
      error = 'Kein gültiger Reset-Link gefunden';
    }

    loading = false;
  });

  async function handleSubmit() {
    if (!password.trim()) {
      error = 'Bitte geben Sie ein neues Passwort ein';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwörter stimmen nicht überein';
      return;
    }

    if (password.length < 6) {
      error = 'Passwort muss mindestens 6 Zeichen lang sein';
      return;
    }

    updating = true;
    error = '';

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      success = true;
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        goto('/auth/login');
      }, 3000);

    } catch (err) {
      console.error('Password update error:', err);
      error = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Passworts';
    } finally {
      updating = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }
</script>

<svelte:head>
  <title>Neues Passwort setzen - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Neues Passwort setzen</h1>
      <p class="text-gray-300">Geben Sie Ihr neues Passwort ein</p>
    </div>

    <div class="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
      {#if loading}
        <!-- Loading State -->
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p class="text-gray-300">Reset-Link wird überprüft...</p>
        </div>

      {:else if !validToken}
        <!-- Invalid Token -->
        <div class="text-center">
          <div class="text-red-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Ungültiger Link</h2>
          <p class="text-gray-300 mb-6">{error}</p>
          <div class="space-y-3">
            <button
              type="button"
              on:click={() => goto('/auth/forgot-password')}
              class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Neuen Reset-Link anfordern
            </button>
            <button
              type="button"
              on:click={() => goto('/auth/login')}
              class="w-full bg-transparent border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Zur Anmeldung
            </button>
          </div>
        </div>

      {:else if success}
        <!-- Success State -->
        <div class="text-center">
          <div class="text-green-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Passwort erfolgreich geändert!</h2>
          <p class="text-gray-300 mb-6">
            Ihr neues Passwort wurde gespeichert. Sie werden zur Anmeldung weitergeleitet.
          </p>
          <button
            type="button"
            on:click={() => goto('/auth/login')}
            class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Jetzt anmelden
          </button>
        </div>

      {:else}
        <!-- Password Reset Form -->
        <form on:submit|preventDefault={handleSubmit}>
          <div class="space-y-4 mb-6">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                id="password"
                bind:value={password}
                on:keydown={handleKeyDown}
                disabled={updating}
                class="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Mindestens 6 Zeichen"
                required
                minlength="6"
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
                Passwort bestätigen
              </label>
              <input
                type="password"
                id="confirmPassword"
                bind:value={confirmPassword}
                on:keydown={handleKeyDown}
                disabled={updating}
                class="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Passwort wiederholen"
                required
              />
            </div>
          </div>

          {#if error}
            <div class="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p class="text-red-300 text-sm">{error}</p>
            </div>
          {/if}

          <button
            type="submit"
            disabled={updating || !password.trim() || !confirmPassword.trim()}
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {#if updating}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Passwort wird aktualisiert...
            {:else}
              Passwort speichern
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
