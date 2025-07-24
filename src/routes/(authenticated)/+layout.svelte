<script lang="ts">
  import { onMount } from 'svelte';
  import { authActions } from '$lib/stores/auth';

  let loading = true;

  onMount(async () => {
    // Initialize auth state
    await authActions.initialize();
    loading = false;
  });
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
  <slot />
{/if}
