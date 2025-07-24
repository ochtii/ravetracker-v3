<!--
  RaveTracker v3.0 - Mobile-Optimized Toast System
  ================================================
  Swipe-to-dismiss, haptic feedback, PWA-ready notifications
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { fade, fly } from 'svelte/transition'
  import { writable } from 'svelte/store'

  export let position: 'top' | 'bottom' = 'top'
  export let maxToasts = 5
  export let defaultDuration = 5000
  export let enableSwipeToDismiss = true
  export let enableHapticFeedback = true

  interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    persistent?: boolean
    actions?: Array<{
      label: string
      action: () => void
      style?: 'primary' | 'secondary'
    }>
    icon?: string
    progress?: boolean
  }

  const dispatch = createEventDispatcher<{
    toastDismissed: { id: string }
    toastClicked: { toast: Toast }
    actionClicked: { toast: Toast; actionIndex: number }
  }>()

  // Store for managing toasts
  export const toasts = writable<Toast[]>([])
  let toastElements: { [id: string]: HTMLElement } = {}
  let timeouts: { [id: string]: number } = {}

  // Mobile features
  let supportsVibration = false
  let isStandalone = false
  let notificationPermission: NotificationPermission = 'default'

  // Swipe handling
  let swipeStates: { [id: string]: {
    startX: number
    currentX: number
    isDragging: boolean
    swipeDistance: number
  }} = {}

  onMount(() => {
    if (browser) {
      supportsVibration = 'vibrate' in navigator && enableHapticFeedback
      isStandalone = window.matchMedia('(display-mode: standalone)').matches
      
      // Check notification permission
      if ('Notification' in window) {
        notificationPermission = Notification.permission
      }
    }
  })

  onDestroy(() => {
    // Clear all timeouts
    Object.values(timeouts).forEach(clearTimeout)
  })

  // Toast management functions
  export const addToast = (toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = { id, ...toast }

    toasts.update(current => {
      const updated = [newToast, ...current].slice(0, maxToasts)
      
      // Show native notification if PWA and permission granted
      if (isStandalone && notificationPermission === 'granted' && toast.type === 'info') {
        showNativeNotification(newToast)
      }

      // Haptic feedback
      if (supportsVibration) {
        const vibrationPattern = getVibrationPattern(toast.type)
        navigator.vibrate(vibrationPattern)
      }

      return updated
    })

    // Auto-dismiss timer
    if (!toast.persistent) {
      const duration = toast.duration || defaultDuration
      timeouts[id] = window.setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }

  export const dismissToast = (id: string) => {
    toasts.update(current => current.filter(t => t.id !== id))
    
    if (timeouts[id]) {
      clearTimeout(timeouts[id])
      delete timeouts[id]
    }
    
    delete toastElements[id]
    delete swipeStates[id]
    
    dispatch('toastDismissed', { id })
  }

  export const dismissAll = () => {
    toasts.update(() => [])
    Object.values(timeouts).forEach(clearTimeout)
    timeouts = {}
    toastElements = {}
    swipeStates = {}
  }

  // Convenience methods
  export const success = (title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'success', title, message, ...options })

  export const error = (title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'error', title, message, persistent: true, ...options })

  export const warning = (title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'warning', title, message, ...options })

  export const info = (title: string, message?: string, options?: Partial<Toast>) => 
    addToast({ type: 'info', title, message, ...options })

  // Helper functions
  const getVibrationPattern = (type: Toast['type']): number[] => {
    switch (type) {
      case 'success': return [100, 50, 100]
      case 'error': return [200, 100, 200, 100, 200]
      case 'warning': return [150, 100, 150]
      case 'info': return [50]
      default: return [50]
    }
  }

  const showNativeNotification = (toast: Toast) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    try {
      const notification = new Notification(toast.title, {
        body: toast.message,
        icon: '/icon-192.png',
        badge: '/icon-64.png',
        tag: toast.id,
        requireInteraction: toast.persistent
      })

      notification.onclick = () => {
        window.focus()
        dismissToast(toast.id)
        dispatch('toastClicked', { toast })
      }
    } catch (err) {
      console.warn('Failed to show native notification:', err)
    }
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-100'
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-100'
      case 'warning':
        return 'bg-amber-500/20 border-amber-500/30 text-amber-100'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-100'
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-100'
    }
  }

  const getToastIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
      case 'error':
        return 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
      case 'warning':
        return 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
      case 'info':
        return 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  }

  // Swipe handling
  const handleTouchStart = (event: TouchEvent, toastId: string) => {
    if (!enableSwipeToDismiss) return

    const touch = event.touches[0]
    swipeStates[toastId] = {
      startX: touch.clientX,
      currentX: touch.clientX,
      isDragging: true,
      swipeDistance: 0
    }

    if (supportsVibration) {
      navigator.vibrate(10)
    }
  }

  const handleTouchMove = (event: TouchEvent, toastId: string) => {
    const state = swipeStates[toastId]
    if (!state || !state.isDragging) return

    const touch = event.touches[0]
    state.currentX = touch.clientX
    state.swipeDistance = touch.clientX - state.startX

    const element = toastElements[toastId]
    if (element) {
      const absDistance = Math.abs(state.swipeDistance)
      const maxDistance = element.offsetWidth * 0.5
      const constrainedDistance = Math.sign(state.swipeDistance) * Math.min(absDistance, maxDistance)
      
      element.style.transform = `translateX(${constrainedDistance}px)`
      element.style.opacity = `${1 - (absDistance / maxDistance)}`
    }
  }

  const handleTouchEnd = (toastId: string) => {
    const state = swipeStates[toastId]
    if (!state || !state.isDragging) return

    state.isDragging = false
    const absDistance = Math.abs(state.swipeDistance)
    const element = toastElements[toastId]

    if (absDistance > 100) {
      // Dismiss toast
      if (element) {
        element.style.transform = `translateX(${state.swipeDistance > 0 ? '100%' : '-100%'})`
        element.style.opacity = '0'
      }
      
      setTimeout(() => dismissToast(toastId), 200)
      
      if (supportsVibration) {
        navigator.vibrate(50)
      }
    } else {
      // Reset position
      if (element) {
        element.style.transform = 'translateX(0px)'
        element.style.opacity = '1'
        element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
        
        setTimeout(() => {
          if (element) {
            element.style.transition = ''
          }
        }, 300)
      }
    }
  }

  const handleToastClick = (toast: Toast) => {
    dispatch('toastClicked', { toast })
  }

  const handleActionClick = (toast: Toast, actionIndex: number) => {
    const action = toast.actions?.[actionIndex]
    if (action) {
      action.action()
      dispatch('actionClicked', { toast, actionIndex })
      
      if (supportsVibration) {
        navigator.vibrate(50)
      }
    }
  }
</script>

<!-- Toast Container -->
{#if $toasts.length > 0}
  <div 
    class="fixed inset-x-0 z-50 pointer-events-none"
    class:top-4={position === 'top'}
    class:bottom-4={position === 'bottom'}
    class:pt-safe-top={position === 'top' && isStandalone}
    class:pb-safe-bottom={position === 'bottom' && isStandalone}
  >
    <div class="flex flex-col gap-2 px-4 max-w-md mx-auto">
      {#each $toasts as toast, index (toast.id)}
        <div
          bind:this={toastElements[toast.id]}
          class="pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-md shadow-lg {getToastStyles(toast.type)}"
          class:animate-pulse={toast.progress}
          on:click={() => handleToastClick(toast)}
          on:touchstart={(e) => handleTouchStart(e, toast.id)}
          on:touchmove={(e) => handleTouchMove(e, toast.id)}
          on:touchend={() => handleTouchEnd(toast.id)}
          in:fly={{ 
            y: position === 'top' ? -50 : 50, 
            duration: 300,
            delay: index * 100 
          }}
          out:fade={{ duration: 200 }}
        >
          <!-- Progress bar for timed toasts -->
          {#if !toast.persistent && toast.duration}
            <div 
              class="absolute top-0 left-0 h-1 bg-current opacity-50"
              style="animation: toast-progress {toast.duration}ms linear"
            ></div>
          {/if}

          <!-- Main content -->
          <div class="flex items-start gap-3 p-4">
            <!-- Icon -->
            <div class="flex-shrink-0 mt-0.5">
              {#if toast.icon}
                <img src={toast.icon} alt="" class="w-5 h-5" />
              {:else}
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d={getToastIcon(toast.type)} clip-rule="evenodd" />
                </svg>
              {/if}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-sm leading-5">
                {toast.title}
              </h4>
              
              {#if toast.message}
                <p class="mt-1 text-sm opacity-90 leading-5">
                  {toast.message}
                </p>
              {/if}

              <!-- Actions -->
              {#if toast.actions && toast.actions.length > 0}
                <div class="flex gap-2 mt-3">
                  {#each toast.actions as action, actionIndex}
                    <button
                      class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200"
                      class:bg-current={action.style === 'primary'}
                      class:text-black={action.style === 'primary'}
                      class:bg-white/20={action.style !== 'primary'}
                      class:hover:bg-white/30={action.style !== 'primary'}
                      on:click|stopPropagation={() => handleActionClick(toast, actionIndex)}
                    >
                      {action.label}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Close button -->
            {#if !toast.persistent}
              <button
                class="flex-shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors duration-200"
                on:click|stopPropagation={() => dismissToast(toast.id)}
                aria-label="Schließen"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            {/if}
          </div>

          <!-- Swipe indicator -->
          {#if enableSwipeToDismiss}
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 opacity-30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Toast progress animation */
  @keyframes toast-progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  /* PWA safe area support */
  .pt-safe-top {
    padding-top: calc(1rem + env(safe-area-inset-top, 0px));
  }

  .pb-safe-bottom {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  }

  /* Touch optimization */
  .pointer-events-auto {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-x;
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .pointer-events-auto {
      animation: none !important;
      transition: none !important;
    }
    
    @keyframes toast-progress {
      from, to {
        width: 0%;
      }
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .backdrop-blur-md {
      backdrop-filter: none;
      background: black;
    }
    
    .border {
      border-width: 2px;
    }
  }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    /* Already optimized for dark mode */
  }
</style>
