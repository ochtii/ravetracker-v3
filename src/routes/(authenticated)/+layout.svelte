<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState, authActions } from '$lib/stores/auth';

  let loading = true;

  onMount(async () => {
    // Initialize auth state
    await authActions.initialize();
    loading = false;
  });

  async function handleLogout() {
    await authActions.signOut();
    goto('/auth/login');
  }
</script>

{#if loading}
  <!-- Loading State -->
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p class="text-white">Lädt...</p>
    </div>
  </div>
{:else}
  <!-- Authenticated Layout -->
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <!-- Navigation -->
    <nav class="bg-black/20 backdrop-blur-md border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center">
            <a href="/dashboard" class="text-2xl font-bold text-white">
              RaveTracker
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a 
              href="/dashboard" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="/events" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Events
            </a>
            <a 
              href="/search" 
              class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Suche
            </a>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            {#if $authState.profile}
              <span class="text-gray-300 text-sm">
                Hallo, {$authState.profile.display_name || $authState.profile.username || 'User'}!
              </span>
            {/if}
            
            <button
              on:click={handleLogout}
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>
  </div>
{/if}
