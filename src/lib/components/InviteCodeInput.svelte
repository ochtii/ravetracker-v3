<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { debounce } from '$lib/utils/helpers'
  import InviteInfoTooltip from './InviteInfoTooltip.svelte'
  import { validateInviteCode } from '$lib/services/invite-service'
  import type { ValidationResult } from '$lib/types/invite'

  export let value = ''
  export let disabled = false
  export let required = true
  export let rateLimitInfo: { remaining: number; resetTime: Date } | null = null

  const dispatch = createEventDispatcher<{
    validate: { code: string; isValid: boolean; result?: ValidationResult }
    input: { value: string }
  }>()

  // State
  let inputElement: HTMLInputElement
  let validationState: 'idle' | 'validating' | 'valid' | 'invalid' = 'idle'
  let validationMessage = ''
  let validationResult: ValidationResult | null = null
  let showTooltip = false

  // Debounced validation function
  const debouncedValidation = debounce(async (code: string) => {
    if (code.length !== 6) {
      validationState = 'idle'
      validationMessage = ''
      validationResult = null
      dispatch('validate', { code, isValid: false })
      return
    }

    validationState = 'validating'
    validationMessage = 'Code wird überprüft...'

    try {
      const result = await validateInviteCode(code)
      validationResult = result

      if (result.isValid) {
        validationState = 'valid'
        validationMessage = 'Gültiger Einladungscode!'
        dispatch('validate', { code, isValid: true, result })
      } else {
        validationState = 'invalid'
        validationMessage = result.errorMessage || getErrorMessage(result.errorCode)
        dispatch('validate', { code, isValid: false, result })
      }
    } catch (error) {
      validationState = 'invalid'
      validationMessage = 'Fehler bei der Überprüfung. Versuche es erneut.'
      dispatch('validate', { code, isValid: false })
    }
  }, 500)

  // Format input to uppercase and remove non-alphanumeric
  function formatInput(input: string): string {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  }

  // Handle input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement
    const formattedValue = formatInput(target.value)
    
    // Update value
    value = formattedValue
    target.value = formattedValue

    // Dispatch input event
    dispatch('input', { value: formattedValue })

    // Trigger validation if code is complete
    if (formattedValue.length === 6) {
      debouncedValidation(formattedValue)
    } else if (formattedValue.length === 0) {
      validationState = 'idle'
      validationMessage = ''
      validationResult = null
      dispatch('validate', { code: formattedValue, isValid: false })
    }
  }

  // Handle paste events
  function handlePaste(event: Event) {
    const clipboardEvent = event as ClipboardEvent
    clipboardEvent.preventDefault()
    const pastedText = clipboardEvent.clipboardData?.getData('text') || ''
    const formattedValue = formatInput(pastedText)
    
    value = formattedValue
    if (inputElement) {
      inputElement.value = formattedValue
    }

    dispatch('input', { value: formattedValue })

    if (formattedValue.length === 6) {
      debouncedValidation(formattedValue)
    }
  }

  // Handle keyboard navigation
  function handleKeyDown(event: Event) {
    const keyboardEvent = event as KeyboardEvent
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(keyboardEvent.keyCode)) {
      return
    }
    
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (keyboardEvent.ctrlKey && [65, 67, 86, 88].includes(keyboardEvent.keyCode)) {
      return
    }
    
    // Ensure only alphanumeric characters
    if (!/[A-Za-z0-9]/.test(keyboardEvent.key)) {
      keyboardEvent.preventDefault()
    }
  }

  // Get user-friendly error message
  function getErrorMessage(errorCode?: string): string {
    switch (errorCode) {
      case 'INVALID_CODE':
        return 'Einladungscode nicht gefunden'
      case 'CODE_EXPIRED':
        return 'Einladungscode ist abgelaufen'
      case 'CODE_EXHAUSTED':
        return 'Einladungscode wurde bereits verwendet'
      case 'CODE_INACTIVE':
        return 'Einladungscode ist nicht aktiv'
      case 'RATE_LIMITED':
        return 'Zu viele Versuche. Bitte warte einen Moment.'
      case 'IP_BLOCKED':
        return 'IP-Adresse temporär gesperrt'
      default:
        return 'Ungültiger Einladungscode'
    }
  }

  // Format remaining attempts text - updated for new rateLimitInfo structure
  function formatRateLimitInfo(): string {
    if (!validationResult?.rateLimitInfo) return ''
    
    const info = validationResult.rateLimitInfo
    const minutesUntilReset = Math.ceil(info.timeUntilReset / 60)
    
    if (info.isBlocked) {
      return `IP gesperrt. Entsperrung in ${minutesUntilReset} Minuten.`
    }
    
    if (info.attemptsRemaining === 0) {
      return `Keine Versuche mehr. Reset in ${minutesUntilReset} Minuten.`
    }
    
    return `${info.attemptsRemaining} Versuche verbleibend`
  }

  // Focus input on mount
  onMount(() => {
    if (inputElement && !disabled) {
      inputElement.focus()
    }
  })

  // Reactive statements
  $: isComplete = value.length === 6
  $: showRateLimit = rateLimitInfo && (rateLimitInfo.remaining <= 3 || rateLimitInfo.remaining === 0)

  // Helper functions for CSS classes
  function getInputClass(): string {
    switch (validationState) {
      case 'valid':
        return 'border-green-500 focus:border-green-500'
      case 'invalid':
        return 'border-red-500 focus:border-red-500'
      case 'validating':
        return 'border-blue-500 focus:border-blue-500'
      default:
        return ''
    }
  }

  function getMessageClass(): string {
    switch (validationState) {
      case 'valid':
        return 'text-green-400'
      case 'invalid':
        return 'text-red-400'
      case 'validating':
        return 'text-blue-400'
      default:
        return 'text-white/60'
    }
  }

  function getProgressClass(): string {
    switch (validationState) {
      case 'valid':
        return 'bg-green-500'
      case 'invalid':
        return 'bg-red-500'
      case 'validating':
        return 'bg-blue-500'
      default:
        return 'bg-purple-500'
    }
  }
</script>

<div class="invite-code-input" class:disabled>
  <!-- Label and Info -->
  <div class="flex items-center justify-between mb-2">
    <label for="invite-code" class="block text-sm font-medium text-white">
      Einladungscode {#if required}<span class="text-red-400">*</span>{/if}
    </label>
    
    <div class="relative">
      <button
        type="button"
        class="text-white/60 hover:text-white/80 transition-colors"
        on:click={() => showTooltip = !showTooltip}
        on:mouseenter={() => showTooltip = true}
        on:mouseleave={() => showTooltip = false}
        aria-label="Informationen zum Einladungscode"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
      </button>
      
      {#if showTooltip}
        <InviteInfoTooltip 
          position="bottom-left"
          on:close={() => showTooltip = false}
        />
      {/if}
    </div>
  </div>

  <!-- Input Field -->
  <div class="relative">
    <input
      bind:this={inputElement}
      id="invite-code"
      type="text"
      placeholder="ABC123"
      {value}
      {disabled}
      class="w-full px-4 py-3 text-center text-lg font-mono tracking-widest uppercase bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 {getInputClass()}"
      autocomplete="off"
      autocapitalize="characters"
      spellcheck="false"
      maxlength="6"
      on:input={handleInput}
      on:paste={handlePaste}
      on:keydown={handleKeyDown}
      aria-describedby={validationMessage ? 'invite-code-error' : undefined}
      aria-invalid={validationState === 'invalid'}
    />

    <!-- Validation Icon -->
    {#if validationState !== 'idle'}
      <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
        {#if validationState === 'validating'}
          <div class="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
        {:else if validationState === 'valid'}
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        {:else if validationState === 'invalid'}
          <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Validation Message -->
  {#if validationMessage}
    <div 
      id="invite-code-error"
      class="mt-2 text-sm {getMessageClass()}"
      role={validationState === 'invalid' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {validationMessage}
    </div>
  {/if}

  <!-- Rate Limit Info -->
  {#if showRateLimit && rateLimitInfo}
    <div class="mt-2 text-xs text-amber-400 flex items-center">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {formatRateLimitInfo()}
    </div>
  {/if}

  <!-- Progress Indicator -->
  <div class="mt-3">
    <div class="flex justify-between text-xs text-white/40 mb-1">
      <span>Code-Eingabe</span>
      <span>{value.length}/6</span>
    </div>
    <div class="w-full bg-white/10 rounded-full h-1">
      <div 
        class="h-1 rounded-full transition-all duration-300 {getProgressClass()}"
        style="width: {(value.length / 6) * 100}%"
      ></div>
    </div>
  </div>
</div>

<style>
  .invite-code-input.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  /* Custom focus styles for better accessibility */
  .invite-code-input :global(input:focus) {
    outline: 2px solid rgb(168 85 247);
    outline-offset: 2px;
  }

  /* Animation for validation states */
  .invite-code-input :global(input) {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
</style>
