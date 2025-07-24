<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { RegisterForm } from '$lib/components/auth'
  import InviteCodeInput from '$lib/components/InviteCodeInput.svelte'
  import { user } from '$lib/stores/auth'
  import type { PageData } from './$types'
  import type { ValidationResult } from '$lib/types/invite'

  export let data: PageData

  // State
  let inviteCodeValue = data.inviteCode || ''
  let validationResult: ValidationResult | null = data.prevalidationResult
  let rateLimitInfo = data.rateLimitInfo
  let showRegistrationForm = false

  // Check if user is already logged in
  onMount(() => {
    if ($user) {
      const redirectTo = $page.url.searchParams.get('redirectTo') || '/dashboard'
      goto(redirectTo, { replaceState: true })
    }

    // Show form immediately if invite code is pre-validated
    if (validationResult?.isValid) {
      showRegistrationForm = true
    }
  })

  // Handle invite code validation
  function handleInviteValidation(event: CustomEvent<{ code: string; isValid: boolean; result?: ValidationResult }>) {
    const { code, isValid, result } = event.detail
    
    inviteCodeValue = code
    validationResult = result || null

    // Update rate limit info from validation result
    if (result?.rateLimitInfo) {
      rateLimitInfo = {
        remaining: result.rateLimitInfo.attemptsRemaining,
        resetTime: new Date(Date.now() + result.rateLimitInfo.timeUntilReset * 1000),
        isBlocked: result.rateLimitInfo.isBlocked
      }
    }

    // Show/hide registration form based on validation
    showRegistrationForm = isValid
  }

  // Handle successful registration
  function handleRegisterSuccess() {
    goto('/auth/confirm-email-sent', { replaceState: true })
  }
</script>

<svelte:head>
  <title>Registrieren - RaveTracker</title>
  <meta name="description" content="Erstelle dein kostenloses RaveTracker-Konto und entdecke die besten Rave-Events in deiner Nähe." />
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4 py-8">
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Bei RaveTracker anmelden</h1>
      <p class="text-white/70">Erstelle dein kostenloses Konto</p>
    </div>

    <!-- Invite Code Input Step -->
    {#if !showRegistrationForm}
      <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
        <div class="text-center mb-6">
          <div class="bg-purple-500/20 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white mb-2">Einladungscode eingeben</h2>
          <p class="text-white/60 text-sm">
            Um dich zu registrieren, benötigst du einen gültigen Einladungscode
          </p>
        </div>

        <InviteCodeInput
          bind:value={inviteCodeValue}
          required={true}
          {rateLimitInfo}
          on:validate={handleInviteValidation}
        />

        {#if validationResult?.isValid}
          <div class="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div class="flex items-center text-green-400 text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Code gültig! Du kannst jetzt mit der Registrierung fortfahren.
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Registration Form Step -->
    {#if showRegistrationForm}
      <div class="transition-all duration-500 ease-in-out">
        <!-- Progress Indicator -->
        <div class="flex items-center justify-between mb-6 text-sm">
          <div class="flex items-center text-green-400">
            <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Code: {inviteCodeValue}
          </div>
          <button
            type="button"
            class="text-white/60 hover:text-white transition-colors"
            on:click={() => showRegistrationForm = false}
          >
            Ändern
          </button>
        </div>

        <!-- Enhanced Register Form with invite code pre-filled -->
        <RegisterForm 
          inviteCode={inviteCodeValue}
          on:success={handleRegisterSuccess} 
        />
      </div>
    {:else}
      <!-- Alternative registration method info -->
      <div class="text-center mt-6">
        <p class="text-white/40 text-sm mb-4">
          Kein Einladungscode? Hier sind andere Möglichkeiten:
        </p>
        <div class="space-y-2 text-xs">
          <a 
            href="/community/join" 
            class="block text-purple-400 hover:text-purple-300 transition-colors"
          >
            → Der Community beitreten
          </a>
          <a 
            href="/events" 
            class="block text-purple-400 hover:text-purple-300 transition-colors"
          >
            → An Events teilnehmen
          </a>
          <a 
            href="/help/invite-codes" 
            class="block text-purple-400 hover:text-purple-300 transition-colors"
          >
            → Mehr über Einladungscodes erfahren
          </a>
        </div>
      </div>
    {/if}

    <!-- Footer -->
    <div class="text-center mt-6 space-y-2">
      <p class="text-white/60 text-sm">
        Bereits ein Konto? 
        <a 
          href="/auth/login" 
          class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Jetzt anmelden
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
        ·
        <a 
          href="/imprint" 
          class="hover:text-white/60 transition-colors"
        >
          Impressum
        </a>
      </div>
    </div>
  </div>
</div>
