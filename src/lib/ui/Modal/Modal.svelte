<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { cn, glassmorphism, animations } from '../types'
  import type { ModalProps } from '../types'

  export let open = false
  export let title: ModalProps['title'] = ''
  export let size: ModalProps['size'] = 'md'
  export let closable = true
  export let backdrop: ModalProps['backdrop'] = 'blur'

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{
    close: void
    open: void
  }>()

  function handleClose() {
    if (!closable) return
    open = false
    dispatch('close')
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && closable && open) {
      handleClose()
    }
  }

  $: if (open) {
    dispatch('open')
  }

  $: modalClass = cn(
    // Base modal styles
    'fixed inset-0 z-50 flex items-center justify-center p-4',
    // Backdrop styles
    getBackdropClasses(backdrop),
    // Animation
    open ? animations.fadeIn : animations.fadeOut
  )

  $: contentClass = cn(
    // Base content styles
    'relative w-full max-h-[90vh] overflow-hidden rounded-xl shadow-2xl',
    // Glassmorphism
    glassmorphism.modal,
    // Size styles
    getSizeClasses(size),
    // Animation
    open ? animations.scaleIn : animations.scaleOut,
    // Custom class
    className
  )

  function getBackdropClasses(backdropType: NonNullable<ModalProps['backdrop']>): string {
    const backdropMap = {
      blur: 'backdrop-blur-sm bg-black/20',
      dark: 'bg-black/50',
      transparent: 'bg-transparent'
    }
    return backdropMap[backdropType] || ''
  }

  function getSizeClasses(modalSize: NonNullable<ModalProps['size']>): string {
    const sizeMap = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw] max-h-[95vh]'
    }
    return sizeMap[modalSize] || ''
  }

  onMount(() => {
    return () => {
      // Cleanup
    }
  })
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div 
    class={modalClass}
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <div class={contentClass}>
      {#if title || closable}
        <header class="flex items-center justify-between p-6 border-b border-white/10">
          {#if title}
            <h2 id="modal-title" class="text-xl font-semibold text-white">
              {title}
            </h2>
          {:else}
            <div></div>
          {/if}
          
          {#if closable}
            <button
              type="button"
              class="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              on:click={handleClose}
              aria-label="Close modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </header>
      {/if}

      <div class="p-6 overflow-y-auto">
        <slot />
      </div>

      {#if $$slots.footer}
        <footer class="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <slot name="footer" />
        </footer>
      {/if}
    </div>
  </div>
{/if}
