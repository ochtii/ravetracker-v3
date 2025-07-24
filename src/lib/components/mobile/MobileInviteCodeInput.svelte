<!--
  RaveTracker v3.0 - Mobile-Optimized Invite Code Input
  ====================================================
  Touch-friendly invite code input with native share API and offline support
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { debounce } from '$lib/utils/helpers'
  import { validateInviteCode } from '$lib/services/invite-service'
  import MobileInput from './MobileInput.svelte'
  import MobileButton from './MobileButton.svelte'
  import type { ValidationResult } from '$lib/types/invite'

  export let value = ''
  export let disabled = false
  export let required = true
  export let rateLimitInfo: { remaining: number; resetTime: Date } | null = null
  export let offlineMode = false

  const dispatch = createEventDispatcher<{
    validate: { code: string; isValid: boolean; result?: ValidationResult }
    input: { value: string }
    shareRequested: void
  }>()

  // State
  let validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle'
  let validationMessage = ''
  let validationResult: ValidationResult | null = null
  let showInfoModal = false
  let isOnline = true
  let codeInputElement: any
  let prefersReducedMotion = false
  let supportsTouchHaptics = false

  // PWA and native features detection
  let supportsShare = false
  let supportsVibration = false
  let isStandalone = false

  // Offline storage for validation cache
  const CACHE_KEY = 'invite_validation_cache'
  const OFFLINE_CODES_KEY = 'offline_invite_codes'

  onMount(() => {
    if (browser) {
      // Feature detection
      supportsShare = 'share' in navigator && 'canShare' in navigator
      supportsVibration = 'vibrate' in navigator
      isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true
      
      // Accessibility preferences
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      // Online/offline status
      isOnline = navigator.onLine
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      // Touch device detection
      supportsTouchHaptics = 'ontouchstart' in window && 'vibrate' in navigator
    }
  })

  onDestroy(() => {
    if (browser) {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  // Network status handlers
  const handleOnline = () => {
    isOnline = true
    // Re-validate current code when coming back online
    if (value.length === 6) {
      debouncedValidation(value)
    }
  }

  const handleOffline = () => {
    isOnline = false
    validationState = 'idle'
    validationMessage = 'Offline - Code wird bei Verbindung überprüft'
  }

  // Offline validation cache
  const getCachedValidation = (code: string): ValidationResult | null => {
    if (!browser) return null
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
      const cached = cache[code]
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
        return cached.result
      }
    } catch {
      return null
    }
    return null
  }

  const setCachedValidation = (code: string, result: ValidationResult) => {
    if (!browser) return
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
      cache[code] = {
        result,
        timestamp: Date.now()
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch {
      // Ignore cache errors
    }
  }

  // Get offline codes for display
  const getOfflineCodes = (): string[] => {
    if (!browser) return []
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_CODES_KEY) || '[]')
    } catch {
      return []
    }
  }

  const addOfflineCode = (code: string) => {
    if (!browser) return
    try {
      const codes = getOfflineCodes()
      if (!codes.includes(code)) {
        codes.push(code)
        localStorage.setItem(OFFLINE_CODES_KEY, JSON.stringify(codes.slice(-5))) // Keep last 5
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Debounced validation with offline support
  const debouncedValidation = debounce(async (code: string) => {
    if (code.length !== 6) {
      validationState = 'idle'
      validationMessage = ''
      validationResult = null
      dispatch('validate', { code, isValid: false })
      return
    }

    // Check offline cache first
    if (!isOnline || offlineMode) {
      const cached = getCachedValidation(code)
      if (cached) {
        validationResult = cached
        validationState = cached.isValid ? 'valid' : 'invalid'
        validationMessage = cached.isValid ? 
          'Code gültig (Cache)' : 
          (cached.errorMessage || 'Ungültiger Code (Cache)')
        dispatch('validate', { code, isValid: cached.isValid, result: cached })
        return
      } else {
        validationState = 'idle'
        validationMessage = 'Offline - Code in Cache speichern für spätere Prüfung'
        addOfflineCode(code)
        return
      }
    }

    validationState = 'validating'
    validationMessage = 'Code wird überprüft...'

    try {
      const result = await validateInviteCode(code)
      validationResult = result
      setCachedValidation(code, result)

      if (result.isValid) {
        validationState = 'valid'
        validationMessage = 'Gültiger Einladungscode!'
        if (supportsTouchHaptics) {
          navigator.vibrate([100, 50, 100]) // Success pattern
        }
        dispatch('validate', { code, isValid: true, result })
      } else {
        validationState = 'invalid'
        validationMessage = result.errorMessage || getErrorMessage(result.errorCode)
        if (supportsTouchHaptics) {
          navigator.vibrate([200]) // Error pattern
        }
        dispatch('validate', { code, isValid: false, result })
      }
    } catch (error) {
      validationState = 'invalid'
      validationMessage = 'Fehler bei der Überprüfung. Versuche es erneut.'
      if (supportsTouchHaptics) {
        navigator.vibrate([300])
      }
      dispatch('validate', { code, isValid: false })
    }
  }, 500)

  // Format input for invite codes
  const formatInput = (input: string): string => {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  }

  // Handle input changes
  const handleInput = (event: CustomEvent<{ value: string }>) => {
    const formattedValue = formatInput(event.detail.value)
    
    value = formattedValue
    dispatch('input', { value: formattedValue })

    if (formattedValue.length === 6) {
      debouncedValidation(formattedValue)
    } else if (formattedValue.length === 0) {
      validationState = 'idle'
      validationMessage = ''
      validationResult = null
      dispatch('validate', { code: formattedValue, isValid: false })
    }
  }

  // Native share API for PWA
  const handleShare = async () => {
    if (!supportsShare) {
      dispatch('shareRequested')
      return
    }

    try {
      await navigator.share({
        title: 'RaveTracker Einladung',
        text: `Hier ist mein RaveTracker Einladungscode: ${value}`,
        url: `${window.location.origin}/register?invite=${value}`
      })
    } catch (error) {
      // User cancelled or error occurred
      dispatch('shareRequested')
    }
  }

  // Copy to clipboard with fallback
  const copyToClipboard = async () => {
    if (!value) return

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value)
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = value
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      if (supportsTouchHaptics) {
        navigator.vibrate([50])
      }
    } catch (error) {
      console.warn('Copy failed:', error)
    }
  }

  // Error message helper
  const getErrorMessage = (errorCode?: string): string => {
    const messages: Record<string, string> = {
      'INVALID_FORMAT': 'Code muss 6 Zeichen lang sein',
      'CODE_NOT_FOUND': 'Code nicht gefunden',
      'CODE_EXPIRED': 'Code ist abgelaufen',
      'CODE_USED': 'Code wurde bereits verwendet',
      'RATE_LIMITED': 'Zu viele Versuche. Bitte warte einen Moment.',
      'SYSTEM_ERROR': 'Systemfehler. Versuche es später erneut.'
    }
    return messages[errorCode || ''] || 'Ungültiger Code'
  }

  // Progress indicator
  $: progressWidth = (value.length / 6) * 100
  $: progressColor = validationState === 'valid' ? 'bg-green-500' : 
                     validationState === 'invalid' ? 'bg-red-500' : 
                     validationState === 'validating' ? 'bg-blue-500' : 'bg-purple-500'
</script>

<div class="mobile-invite-input space-y-4" class:offline={!isOnline}>
  <!-- Header with title and offline indicator -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold text-white">
        Einladungscode {#if required}<span class="text-red-400">*</span>{/if}
      </h3>
      <p class="text-sm text-white/60">
        {#if !isOnline}
          <span class="inline-flex items-center gap-1 text-amber-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Offline-Modus
          </span>
        {:else}
          6-stelliger alphanumerischer Code
        {/if}
      </p>
    </div>

    <!-- Info button -->
    <MobileButton
      variant="ghost"
      size="sm"
      on:click={() => showInfoModal = true}
      aria-label="Informationen zum Einladungscode"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
    </MobileButton>
  </div>

  <!-- Main input -->
  <MobileInput
    bind:this={codeInputElement}
    type="text"
    bind:value
    placeholder="ABC123"
    {disabled}
    inputmode="text"
    enterkeyhint="done"
    maxlength={6}
    autocomplete="off"
    size="lg"
    variant="glass"
    class="text-center text-xl font-mono tracking-widest uppercase {getInputStateClass()}"
    on:input={handleInput}
    enableHaptic={supportsTouchHaptics}
  />

  <!-- Progress Bar -->
  <div class="space-y-2">
    <div class="flex justify-between text-xs text-white/60">
      <span>Eingabe-Fortschritt</span>
      <span>{value.length}/6</span>
    </div>
    <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div 
        class="h-full rounded-full transition-all duration-300 {progressColor}"
        style="width: {progressWidth}%"
      />
    </div>
  </div>

  <!-- Validation Message -->
  {#if validationMessage}
    <div 
      class="flex items-center gap-2 p-3 rounded-lg {getMessageClass()}"
      class:animate-pulse={validationState === 'validating'}
    >
      {#if validationState === 'validating'}
        <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32">
            <animate attributeName="stroke-dasharray" dur="1s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
          </circle>
        </svg>
      {:else if validationState === 'valid'}
        <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      {:else if validationState === 'invalid'}
        <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      {:else}
        <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      {/if}
      <span class="text-sm">{validationMessage}</span>
    </div>
  {/if}

  <!-- Rate Limit Info -->
  {#if rateLimitInfo && rateLimitInfo.remaining < 5}
    <div class="flex items-center gap-2 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-200">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <div class="text-xs">
        <div>Noch {rateLimitInfo.remaining} Versuche übrig</div>
        <div>Zurücksetzung: {rateLimitInfo.resetTime.toLocaleTimeString()}</div>
      </div>
    </div>
  {/if}

  <!-- Action Buttons for valid codes -->
  {#if validationState === 'valid' && value}
    <div class="flex gap-3">
      <MobileButton
        variant="secondary"
        class="flex-1"
        on:click={copyToClipboard}
        enableHaptic={supportsTouchHaptics}
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Kopieren
      </MobileButton>

      {#if supportsShare}
        <MobileButton
          variant="glass"
          class="flex-1"
          on:click={handleShare}
          enableHaptic={supportsTouchHaptics}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Teilen
        </MobileButton>
      {/if}
    </div>
  {/if}

  <!-- Offline Codes Display -->
  {#if !isOnline && getOfflineCodes().length > 0}
    <div class="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
      <h4 class="text-sm font-medium text-blue-200 mb-2">Offline gespeicherte Codes:</h4>
      <div class="flex flex-wrap gap-2">
        {#each getOfflineCodes() as code}
          <button
            class="px-2 py-1 bg-blue-500/30 hover:bg-blue-500/40 rounded text-xs font-mono"
            on:click={() => value = code}
          >
            {code}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Info Modal -->
{#if showInfoModal}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    on:click={() => showInfoModal = false}
  >
    <div 
      class="bg-gray-900 border border-white/20 rounded-xl max-w-sm w-full max-h-[80vh] overflow-y-auto"
      on:click|stopPropagation
    >
      <div class="p-4 border-b border-white/20 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Einladungscode Info</h3>
        <MobileButton
          variant="ghost"
          size="sm"
          on:click={() => showInfoModal = false}
          aria-label="Schließen"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </MobileButton>
      </div>
      
      <div class="p-4 space-y-3 text-sm text-white/80">
        <div>
          <h4 class="font-medium text-white mb-1">Was ist ein Einladungscode?</h4>
          <p>Ein 6-stelliger alphanumerischer Code, den bestehende Mitglieder erstellen können, um neue Nutzer einzuladen.</p>
        </div>
        
        <div>
          <h4 class="font-medium text-white mb-1">Wo bekomme ich einen Code?</h4>
          <p>Frage Freunde, die bereits bei RaveTracker sind, oder besuche Events, wo Codes geteilt werden.</p>
        </div>

        {#if !isOnline}
          <div class="p-2 bg-amber-500/20 border border-amber-500/30 rounded">
            <h4 class="font-medium text-amber-200 mb-1">Offline-Modus</h4>
            <p class="text-amber-200/80">Codes werden zwischengespeichert und bei Internetverbindung validiert.</p>
          </div>
        {/if}
        
        {#if isStandalone}
          <div class="p-2 bg-purple-500/20 border border-purple-500/30 rounded">
            <h4 class="font-medium text-purple-200 mb-1">PWA Features</h4>
            <p class="text-purple-200/80">Als App installiert: Native Teilen, Haptic Feedback und Offline-Unterstützung verfügbar.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .mobile-invite-input.offline {
    opacity: 0.9;
  }

  /* Ensure proper mobile input handling */
  .mobile-invite-input :global(input) {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  /* PWA-specific styles */
  @media (display-mode: standalone) {
    .mobile-invite-input {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .mobile-invite-input * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>

<script context="module">
  export function getInputStateClass(): string {
    return validationState === 'valid' ? 'border-green-400 ring-green-400/20' :
           validationState === 'invalid' ? 'border-red-400 ring-red-400/20' :
           validationState === 'validating' ? 'border-blue-400 ring-blue-400/20' :
           'border-white/20'
  }

  export function getMessageClass(): string {
    return validationState === 'valid' ? 'bg-green-500/20 border-green-500/30 text-green-200' :
           validationState === 'invalid' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
           validationState === 'validating' ? 'bg-blue-500/20 border-blue-500/30 text-blue-200' :
           'bg-white/10 border-white/20 text-white/80'
  }
</script>
