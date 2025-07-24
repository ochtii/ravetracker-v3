<script lang="ts">
  import { cn, getVariantClasses } from '../types'
  import type { AlertProps } from '../types'
  
  export let variant: AlertProps['variant'] = 'info'
  export let closable = false
  export let onclose: AlertProps['onclose'] = undefined

  let className = ''
  export { className as class }

  $: computedClass = cn(
    // Base styles
    'flex items-start gap-3 p-4 rounded-lg border',
    // Variant styles
    getVariantClasses(variant || 'info', 'alert'),
    // Custom class
    className
  )

  function handleClose() {
    if (onclose) {
      onclose()
    }
  }
</script>

<div class={computedClass} role="alert">
  <div class="flex-shrink-0 pt-0.5">
    <slot name="icon">
      {#if variant === 'success'}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {:else if variant === 'error'}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {:else if variant === 'warning'}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      {/if}
    </slot>
  </div>
  
  <div class="flex-1 min-w-0">
    <slot />
  </div>
  
  {#if closable}
    <button
      type="button"
      class="flex-shrink-0 p-1 rounded-md hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      on:click={handleClose}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
