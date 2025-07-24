<!--
  RaveTracker v3.0 - Mobile-Optimized Modal
  =========================================
  Touch-friendly modal with swipe gestures, PWA support, and accessibility
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { fade, fly, scale } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'

  export let open = false
  export let title = ''
  export let description = ''
  export let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md'
  export let position: 'center' | 'bottom' | 'top' = 'bottom'
  export let closable = true
  export let closeOnBackdrop = true
  export let closeOnSwipe = true
  export let showHeader = true
  export let showCloseButton = true
  export let fullscreen = false
  export let persistent = false
  export let maxHeight = 'auto'

  const dispatch = createEventDispatcher<{
    close: void
    open: void
    swipeClose: void
    backdropClick: void
  }>()

  // Mobile state
  let modalElement: HTMLElement
  let contentElement: HTMLElement
  let startY = 0
  let currentY = 0
  let isDragging = false
  let swipeDistance = 0
  let isClosing = false
  let supportsVibration = false
  let isStandalone = false
  let keyboardHeight = 0

  // Constants
  const swipeThreshold = 100
  const swipeVelocityThreshold = 0.5

  onMount(() => {
    if (browser) {
      supportsVibration = 'vibrate' in navigator
      isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Keyboard detection for mobile
      const viewport = window.visualViewport
      if (viewport) {
        viewport.addEventListener('resize', handleViewportResize)
      }

      // Prevent body scroll when modal is open
      if (open) {
        document.body.style.overflow = 'hidden'
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
      }
    }
  })

  onDestroy(() => {
    if (browser) {
      // Restore body scroll
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''

      const viewport = window.visualViewport
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportResize)
      }
    }
  })

  // Reactive statements
  $: if (browser && open) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    dispatch('open')
  } else if (browser && !open) {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }

  // Keyboard handling
  const handleViewportResize = () => {
    if (window.visualViewport) {
      const newKeyboardHeight = window.innerHeight - window.visualViewport.height
      keyboardHeight = Math.max(0, newKeyboardHeight)
    }
  }

  // Touch handlers for swipe-to-close
  const handleTouchStart = (event: TouchEvent) => {
    if (!closeOnSwipe || isClosing || position !== 'bottom') return

    startY = event.touches[0].clientY
    currentY = startY
    isDragging = true

    if (supportsVibration) {
      navigator.vibrate(10)
    }
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging || !closeOnSwipe || position !== 'bottom') return

    currentY = event.touches[0].clientY
    swipeDistance = Math.max(0, currentY - startY) // Only allow downward swipe

    // Apply resistance beyond threshold
    if (swipeDistance > swipeThreshold) {
      const excess = swipeDistance - swipeThreshold
      swipeDistance = swipeThreshold + (excess * 0.3)
    }

    if (contentElement) {
      contentElement.style.transform = `translateY(${swipeDistance}px)`
      contentElement.style.transition = 'none'
    }

    // Haptic feedback at threshold
    if (swipeDistance >= swipeThreshold && supportsVibration) {
      navigator.vibrate(30)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || !closeOnSwipe || position !== 'bottom') return

    isDragging = false
    const velocity = swipeDistance / 100 // Simple velocity calculation

    if (swipeDistance >= swipeThreshold || velocity > swipeVelocityThreshold) {
      closeModal('swipe')
    } else {
      // Reset position
      if (contentElement) {
        contentElement.style.transform = 'translateY(0px)'
        contentElement.style.transition = 'transform 0.3s ease-out'
      }
    }

    swipeDistance = 0
  }

  // Modal controls
  const closeModal = (reason: 'close' | 'backdrop' | 'swipe' | 'escape' = 'close') => {
    if (persistent && reason !== 'close') return

    isClosing = true

    if (reason === 'swipe') {
      dispatch('swipeClose')
    } else if (reason === 'backdrop') {
      dispatch('backdropClick')
    }

    // Reset transform
    if (contentElement) {
      contentElement.style.transform = ''
      contentElement.style.transition = ''
    }

    open = false
    dispatch('close')

    // Small delay to allow animation
    setTimeout(() => {
      isClosing = false
    }, 300)
  }

  const handleBackdropClick = (event: MouseEvent) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      closeModal('backdrop')
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && closable) {
      closeModal('escape')
    }
  }

  // Size and position calculations
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'max-w-sm'
      case 'md': return 'max-w-md'
      case 'lg': return 'max-w-lg'
      case 'xl': return 'max-w-xl'
      case 'full': return 'w-full h-full'
      default: return 'max-w-md'
    }
  }

  const getPositionClasses = () => {
    if (fullscreen) return 'inset-0'

    switch (position) {
      case 'center': return 'items-center justify-center p-4'
      case 'bottom': return 'items-end justify-center pb-4 pt-20'
      case 'top': return 'items-start justify-center pt-4 pb-20'
      default: return 'items-end justify-center pb-4'
    }
  }

  const getAnimationProps = () => {
    switch (position) {
      case 'center':
        return { scale: { start: 0.9, opacity: 0 } }
      case 'bottom':
        return { fly: { y: 400, duration: 300, easing: quintOut } }
      case 'top':
        return { fly: { y: -400, duration: 300, easing: quintOut } }
      default:
        return { fly: { y: 400, duration: 300, easing: quintOut } }
    }
  }
</script>

<!-- Keyboard event listener -->
{#if open}
  <svelte:window on:keydown={handleKeydown} />
{/if}

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex {getPositionClasses()}"
    on:click={handleBackdropClick}
    bind:this={modalElement}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 150 }}
  >
    <!-- Backdrop blur -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    <!-- Modal Content -->
    <div
      bind:this={contentElement}
      class="relative z-10 w-full {getSizeClasses()} bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden"
      class:rounded-t-3xl={position === 'bottom'}
      class:rounded-b-3xl={position === 'top'}
      class:rounded-2xl={position === 'center'}
      class:rounded-none={fullscreen}
      style="max-height: {maxHeight}; margin-bottom: {keyboardHeight}px"
      on:click|stopPropagation
      on:touchstart={handleTouchStart}
      on:touchmove={handleTouchMove}
      on:touchend={handleTouchEnd}
      in:fly={getAnimationProps().fly}
      out:fly={{ y: position === 'bottom' ? 400 : position === 'top' ? -400 : 0, duration: 200 }}
    >
      <!-- Swipe indicator -->
      {#if closeOnSwipe && position === 'bottom'}
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-12 h-1 bg-white/30 rounded-full"></div>
        </div>
      {/if}

      <!-- Header -->
      {#if showHeader}
        <div class="flex items-center justify-between p-6 pb-4">
          <div class="flex-1">
            {#if title}
              <h2 class="text-xl font-semibold text-white">{title}</h2>
            {/if}
            {#if description}
              <p class="text-sm text-white/70 mt-1">{description}</p>
            {/if}
          </div>

          {#if showCloseButton && closable}
            <button
              class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 -mr-2"
              on:click={() => closeModal('close')}
              aria-label="Schließen"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}

      <!-- Content -->
      <div 
        class="px-6 pb-6"
        class:pt-6={!showHeader}
        class:max-h-96={maxHeight === 'auto'}
        class:overflow-y-auto={maxHeight === 'auto'}
      >
        <slot />
      </div>

      <!-- Footer -->
      {#if $$slots.footer}
        <div class="border-t border-white/10 px-6 py-4 bg-white/5">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Smooth scrolling for modal content */
  .overflow-y-auto {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  /* Prevent touch callouts and highlights */
  .fixed {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* PWA safe area support */
  @media (display-mode: standalone) {
    .items-end {
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    }
    
    .items-start {
      padding-top: calc(1rem + env(safe-area-inset-top, 0px));
    }
  }

  /* Keyboard adaptation */
  @media screen and (max-height: 500px) {
    .max-h-96 {
      max-height: 60vh;
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Focus management */
  .fixed:focus-within {
    outline: none;
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .border-white\/20 {
      border-color: white;
    }
    
    .text-white\/70 {
      color: white;
    }
  }
</style>
