<!--
  RaveTracker v3.0 - Mobile-Optimized Button Component
  ==================================================
  Touch-friendly button with haptic feedback and accessibility features
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { browser } from '$app/environment'
  
  export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' = 'primary'
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
  export let disabled = false
  export let loading = false
  export let type: 'button' | 'submit' | 'reset' = 'button'
  export let href: string | undefined = undefined
  export let fullWidth = false
  export let rounded = true
  export let elevated = false
  export let enableHaptic = true
  export let longPressAction: (() => void) | undefined = undefined
  export let longPressDelay = 500
  
  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{
    click: { event: MouseEvent }
    longpress: { event: MouseEvent }
    touchstart: { event: TouchEvent }
    touchend: { event: TouchEvent }
  }>()

  let buttonElement: HTMLButtonElement | HTMLAnchorElement
  let isPressed = false
  let longPressTimer: number | undefined
  let rippleElements: HTMLElement[] = []

  // Haptic feedback
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!enableHaptic || !browser) return
    
    if ('navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [5],
        medium: [10], 
        heavy: [15]
      }
      navigator.vibrate(patterns[type])
    }
  }

  // Ripple effect for touch feedback
  const createRipple = (event: MouseEvent | TouchEvent) => {
    if (!buttonElement || disabled || loading) return

    const rect = buttonElement.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left - size / 2
    const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'absolute pointer-events-none rounded-full bg-white/20 animate-ping'
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `

    buttonElement.appendChild(ripple)
    rippleElements.push(ripple)

    setTimeout(() => {
      ripple.remove()
      rippleElements = rippleElements.filter(r => r !== ripple)
    }, 300)
  }

  // Event handlers
  const handleClick = (event: MouseEvent) => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }

    hapticFeedback('medium')
    createRipple(event)
    dispatch('click', { event })
  }

  const handleTouchStart = (event: TouchEvent) => {
    if (disabled || loading) return

    isPressed = true
    hapticFeedback('light')
    dispatch('touchstart', { event })

    // Long press detection
    if (longPressAction) {
      longPressTimer = setTimeout(() => {
        if (isPressed) {
          hapticFeedback('heavy')
          dispatch('longpress', { event: event as any })
          longPressAction?.()
        }
      }, longPressDelay)
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    isPressed = false
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = undefined
    }
    dispatch('touchend', { event })
  }

  // Size classes with touch-optimized minimum sizes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px] min-w-[40px]',
    md: 'px-4 py-3 text-base min-h-[48px] min-w-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px] min-w-[56px]',
    xl: 'px-8 py-5 text-xl min-h-[64px] min-w-[64px]'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-600/25',
    secondary: 'bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 text-white',
    ghost: 'bg-transparent hover:bg-white/10 active:bg-white/20 text-white',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-600/25',
    glass: 'bg-white/5 backdrop-blur-md hover:bg-white/10 active:bg-white/15 border border-white/10 text-white'
  }

  // Dynamic classes
  $: buttonClass = [
    // Base classes
    'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent',
    'touch-manipulation select-none overflow-hidden',
    // Size
    sizeClasses[size],
    // Variant
    variantClasses[variant],
    // States
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    loading && 'cursor-wait',
    isPressed && 'scale-95',
    // Shape
    rounded ? 'rounded-lg' : '',
    // Width
    fullWidth ? 'w-full' : '',
    // Elevation
    elevated ? 'shadow-xl' : '',
    // Custom classes
    className
  ].filter(Boolean).join(' ')
</script>

{#if href && !disabled && !loading}
  <a
    bind:this={buttonElement}
    {href}
    class={buttonClass}
    role="button"
    tabindex="0"
    on:click={handleClick}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
    {...$$restProps}
  >
    {#if loading}
      <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32">
          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
        </circle>
      </svg>
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button
    bind:this={buttonElement}
    {type}
    {disabled}
    class={buttonClass}
    on:click={handleClick}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
    {...$$restProps}
  >
    {#if loading}
      <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="32" stroke-dashoffset="32">
          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
        </circle>
      </svg>
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<style>
  /* iOS-specific button optimizations */
  @supports (-webkit-appearance: none) {
    button, a[role="button"] {
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
    }
  }

  /* Prevent text selection on touch */
  button, a[role="button"] {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* PWA safe area support */
  @media (display-mode: standalone) {
    button, a[role="button"] {
      margin-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    button, a[role="button"] {
      transition-duration: 0.01ms !important;
    }
    
    button :global(.animate-spin), a[role="button"] :global(.animate-spin) {
      animation: none !important;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    button, a[role="button"] {
      border: 2px solid;
    }
  }
</style>
