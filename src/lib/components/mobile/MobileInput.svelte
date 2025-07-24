<!--
  RaveTracker v3.0 - Mobile-Optimized Input Component
  =================================================
  Touch-friendly input with haptic feedback and progressive enhancement
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { browser } from '$app/environment'
  
  export let type: 'text' | 'email' | 'password' | 'tel' | 'url' = 'text'
  export let value = ''
  export let placeholder = ''
  export let disabled = false
  export let readonly = false
  export let required = false
  export let error = ''
  export let label = ''
  export let hint = ''
  export let autocomplete = ''
  export let inputmode: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search' = 'text'
  export let enterkeyhint: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' = 'done'
  export let autofocus = false
  export let maxlength: number | undefined = undefined
  export let minlength: number | undefined = undefined
  export let pattern: string | undefined = undefined
  export let size: 'sm' | 'md' | 'lg' = 'md'
  export let variant: 'default' | 'minimal' | 'glass' = 'default'
  export let fullWidth = true
  export let showCharCount = false
  export let enableHaptic = true

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{
    input: { value: string; event: Event }
    change: { value: string; event: Event }
    focus: { event: FocusEvent }
    blur: { event: FocusEvent }
    keydown: { event: KeyboardEvent }
    keyup: { event: KeyboardEvent }
  }>()

  let inputElement: HTMLInputElement
  let isFocused = false
  let hasValue = false
  let inputId = `mobile-input-${Math.random().toString(36).substr(2, 9)}`

  // Haptic feedback (iOS/Android)
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptic || !browser) return
    
    // iOS Haptic Engine
    if ('navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
    
    // Web Vibration API fallback
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'light' ? 10 : type === 'medium' ? 20 : 30)
    }
  }

  // Progressive Web App detection
  const isPWA = () => {
    if (!browser) return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://')
  }

  // Handle input events
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    value = target.value
    hasValue = value.length > 0
    dispatch('input', { value, event })
  }

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    value = target.value
    dispatch('change', { value, event })
  }

  const handleFocus = (event: FocusEvent) => {
    isFocused = true
    if (enableHaptic) hapticFeedback('light')
    dispatch('focus', { event })
  }

  const handleBlur = (event: FocusEvent) => {
    isFocused = false
    dispatch('blur', { event })
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    dispatch('keydown', { event })
    
    // Haptic feedback for important keys
    if (enableHaptic && ['Enter', 'Backspace'].includes(event.key)) {
      hapticFeedback('light')
    }
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    dispatch('keyup', { event })
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-5 py-4 text-lg min-h-[56px]'
  }

  // Variant classes
  const variantClasses = {
    default: 'bg-white/10 border border-white/20 text-white placeholder-white/50',
    minimal: 'bg-transparent border-b-2 border-white/20 text-white placeholder-white/50 rounded-none px-0',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10 text-white placeholder-white/40'
  }

  // Dynamic classes
  $: inputClass = [
    // Base classes
    'w-full rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
    // Touch optimization
    'touch-manipulation select-text',
    // Size
    sizeClasses[size],
    // Variant
    variantClasses[variant],
    // Focus state
    isFocused && !error ? 'border-purple-400 ring-2 ring-purple-400/20' : '',
    // Error state
    error ? 'border-red-400 ring-2 ring-red-400/20' : '',
    // Has value state
    hasValue ? 'border-white/30' : '',
    // Full width
    fullWidth ? 'w-full' : '',
    // Custom classes
    className
  ].filter(Boolean).join(' ')

  // Character count
  $: charCount = value.length
  $: isNearLimit = maxlength && charCount > maxlength * 0.8

  onMount(() => {
    hasValue = value.length > 0
    
    if (autofocus) {
      // Delay autofocus for better mobile UX
      setTimeout(() => {
        inputElement?.focus()
      }, 100)
    }
  })
</script>

<div class="mobile-input-wrapper space-y-1">
  <!-- Label -->
  {#if label}
    <label 
      for={inputId} 
      class="block text-sm font-medium text-white/90 mb-1"
      class:text-purple-300={isFocused && !error}
      class:text-red-300={error}
    >
      {label}
      {#if required}
        <span class="text-red-400 ml-1">*</span>
      {/if}
    </label>
  {/if}

  <!-- Input Container -->
  <div class="relative">
    <input
      bind:this={inputElement}
      id={inputId}
      {type}
      bind:value
      {placeholder}
      {disabled}
      {readonly}
      {required}
      {autocomplete}
      {inputmode}
      {enterkeyhint}
      {maxlength}
      {minlength}
      {pattern}
      class={inputClass}
      on:input={handleInput}
      on:change={handleChange}
      on:focus={handleFocus}
      on:blur={handleBlur}
      on:keydown={handleKeyDown}
      on:keyup={handleKeyUp}
      aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
      aria-invalid={error ? 'true' : 'false'}
      {...$$restProps}
    />

    <!-- Character Count -->
    {#if showCharCount && maxlength}
      <div 
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs pointer-events-none"
        class:text-red-400={isNearLimit}
        class:text-white/50={!isNearLimit}
      >
        {charCount}/{maxlength}
      </div>
    {/if}
  </div>

  <!-- Error Message -->
  {#if error}
    <div 
      id="{inputId}-error"
      class="flex items-center gap-2 text-sm text-red-400 animate-in slide-in-from-top-1 duration-200"
      role="alert"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </div>
  {/if}

  <!-- Hint -->
  {#if hint && !error}
    <p 
      id="{inputId}-hint"
      class="text-sm text-white/60"
    >
      {hint}
    </p>
  {/if}
</div>

<style>
  /* iOS-specific optimizations */
  @supports (-webkit-appearance: none) {
    .mobile-input-wrapper input {
      -webkit-appearance: none;
      -webkit-border-radius: 0.5rem;
    }
  }

  /* Android-specific optimizations */
  @media screen and (-webkit-min-device-pixel-ratio: 2) {
    .mobile-input-wrapper input {
      font-size: 16px; /* Prevents zoom on focus */
    }
  }

  /* PWA-specific styles */
  @media (display-mode: standalone) {
    .mobile-input-wrapper {
      --input-padding-top: env(safe-area-inset-top, 0px);
      --input-padding-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .mobile-input-wrapper * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .mobile-input-wrapper input {
      border-width: 2px;
    }
  }
</style>
