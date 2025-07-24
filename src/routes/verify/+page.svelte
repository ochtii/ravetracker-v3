<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { VerificationRequest } from '$lib/components';
  import type { PageData } from './$types';

  export let data: PageData;

  let currentUser = data.user;
  let profile = data.profile;
  let verificationRequest = data.verificationRequest;

  // Redirect to login if not authenticated
  onMount(() => {
    if (!currentUser) {
      goto('/login?redirect=/verify');
    }
  });
</script>

<svelte:head>
  <title>Konto-Verifizierung - RaveTracker</title>
  <meta name="description" content="Beantrage die Verifizierung deines RaveTracker-Accounts für zusätzliche Credits und erweiterte Features." />
</svelte:head>

{#if currentUser && profile}
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <!-- Background Elements -->
    <div class="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="w-[40rem] h-[40rem] bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full blur-3xl"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Navigation Breadcrumb -->
      <div class="container mx-auto px-4 pt-8">
        <nav class="flex items-center space-x-2 text-sm text-white/60">
          <a href="/" class="hover:text-white transition-colors">Home</a>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <a href="/profile" class="hover:text-white transition-colors">Profil</a>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-white">Verifizierung</span>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto px-4 py-12">
        <VerificationRequest {data} />
      </div>

      <!-- Footer -->
      <footer class="container mx-auto px-4 py-8 text-center text-white/60">
        <p class="text-sm">
          Hast du Fragen zur Verifizierung? 
          <a href="/support" class="text-purple-400 hover:text-purple-300 transition-colors">
            Kontaktiere unseren Support
          </a>
        </p>
      </footer>
    </div>
  </div>
{:else}
  <!-- Loading State -->
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-white/70">Lade Verifizierungsseite...</p>
    </div>
  </div>
{/if}
