<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { clickOutside } from '$lib/utils/actions'

  export let position: 'top' | 'bottom' | 'left' | 'right' | 'bottom-left' | 'bottom-right' = 'bottom'
  export let showClose = true
  export let autoClose = false
  export let autoCloseDelay = 5000

  const dispatch = createEventDispatcher<{
    close: void
  }>()

  let tooltipElement: HTMLDivElement
  let autoCloseTimer: NodeJS.Timeout

  function handleClose() {
    dispatch('close')
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose()
    }
  }

  function getPositionClasses(): string {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      case 'bottom-left':
        return 'top-full right-0 mt-2'
      case 'bottom-right':
        return 'top-full left-0 mt-2'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
    }
  }

  function getArrowClasses(): string {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
      case 'bottom-left':
        return 'bottom-full right-3 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800'
      case 'bottom-right':
        return 'bottom-full left-3 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800'
    }
  }

  onMount(() => {
    // Auto close timer
    if (autoClose) {
      autoCloseTimer = setTimeout(() => {
        handleClose()
      }, autoCloseDelay)
    }

    // Focus trap
    if (tooltipElement) {
      tooltipElement.focus()
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer)
      }
    }
  })
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  bind:this={tooltipElement}
  class="invite-info-tooltip absolute z-50 {getPositionClasses()}"
  use:clickOutside
  on:click_outside={handleClose}
  tabindex="-1"
  role="tooltip"
  aria-label="Informationen zum Einladungscode"
  transition:fade={{ duration: 200 }}
>
  <!-- Arrow -->
  <div class="absolute w-0 h-0 border-4 {getArrowClasses()}"></div>
  
  <!-- Content -->
  <div 
    class="bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700 p-4 w-80 max-w-sm"
    transition:fly={{ duration: 200, y: position.includes('top') ? 10 : -10 }}
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center">
        <div class="bg-purple-500/20 rounded-full p-2 mr-3">
          <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="font-semibold text-white">Einladungscode</h3>
      </div>
      
      {#if showClose}
        <button
          type="button"
          class="text-gray-400 hover:text-white transition-colors p-1 -m-1"
          on:click={handleClose}
          aria-label="Schließen"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      {/if}
    </div>

    <!-- Main Description -->
    <div class="space-y-3 text-sm text-gray-300">
      <p class="leading-relaxed">
        RaveTracker verwendet ein <strong class="text-white">Einladungssystem</strong>, um die Qualität unserer Community zu gewährleisten und Spam zu verhindern.
      </p>

      <!-- Code Format -->
      <div class="bg-gray-700/50 rounded-lg p-3">
        <div class="flex items-center mb-2">
          <svg class="w-4 h-4 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium text-white">Code-Format</span>
        </div>
        <p class="text-xs">
          Der Code besteht aus <strong>6 Zeichen</strong> (Buchstaben und Zahlen)<br>
          Beispiel: <code class="bg-gray-600 px-1 py-0.5 rounded text-purple-300 font-mono">ABC123</code>
        </p>
      </div>

      <!-- How to get a code -->
      <div class="space-y-2">
        <div class="flex items-center">
          <svg class="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium text-white">Wie bekomme ich einen Code?</span>
        </div>
        <ul class="list-disc list-inside text-xs space-y-1 ml-6">
          <li>Von einem bereits registrierten Benutzer</li>
          <li>Durch Teilnahme an Community-Events</li>
          <li>Von Moderatoren oder Administratoren</li>
          <li>Über offizielle Social Media Kanäle</li>
        </ul>
      </div>

      <!-- Security info -->
      <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
        <div class="flex items-start">
          <svg class="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="text-xs">
            <p class="text-amber-300 font-medium mb-1">Wichtige Hinweise:</p>
            <ul class="list-disc list-inside space-y-0.5 text-amber-200/80">
              <li>Codes sind nur einmal verwendbar</li>
              <li>Sie laufen nach 30 Tagen ab</li>
              <li>Bei zu vielen falschen Versuchen erfolgt eine temporäre Sperre</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Help section -->
      <div class="border-t border-gray-600 pt-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">
            Kein Code? 
            <a 
              href="/community" 
              class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Community beitreten
            </a>
          </span>
          <a 
            href="/help/invite-codes" 
            class="text-xs text-gray-400 hover:text-white transition-colors flex items-center"
          >
            Mehr Hilfe
            <svg class="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .invite-info-tooltip {
    /* Ensure tooltip appears above other elements */
    z-index: 9999;
  }

  /* Custom scrollbar for long content */
  .invite-info-tooltip :global(*::-webkit-scrollbar) {
    width: 4px;
  }

  .invite-info-tooltip :global(*::-webkit-scrollbar-track) {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  .invite-info-tooltip :global(*::-webkit-scrollbar-thumb) {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .invite-info-tooltip :global(*::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 255, 255, 0.5);
  }

  /* Code styling */
  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  /* Animation for smooth appearance */
  .invite-info-tooltip {
    animation: tooltipAppear 0.2s ease-out;
  }

  @keyframes tooltipAppear {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-5px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .invite-info-tooltip :global(.w-80) {
      width: calc(100vw - 2rem);
      max-width: 20rem;
    }
  }
</style>
