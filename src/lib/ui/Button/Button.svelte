<script lang="ts">
  import { cn, getVariantClasses, getSizeClasses } from '../types'
  import type { ButtonProps } from '../types'
  
  export let variant: ButtonProps['variant'] = 'primary'
  export let size: ButtonProps['size'] = 'md'
  export let disabled = false
  export let loading = false
  export let href: string | undefined = undefined
  export let type: ButtonProps['type'] = 'button'
  export let onclick: ButtonProps['onclick'] = undefined

  let className = ''
  export { className as class }

  $: computedClass = cn(
    // Base styles
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
    // Variant styles
    getVariantClasses(variant || 'primary', 'button'),
    // Size styles
    getSizeClasses(size || 'md', 'button'),
    // Loading state
    loading && 'cursor-wait',
    // Custom class
    className
  )

  function handleClick(event: MouseEvent) {
    if (disabled || loading) {
      event.preventDefault()
      return
    }
    onclick?.(event)
  }
</script>

{#if href && !disabled && !loading}
  <a 
    {href}
    class={computedClass}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    {disabled}
    class={computedClass}
    on:click={handleClick}
    {...$$restProps}
  >
    {#if loading}
      <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
    {/if}
    <slot />
  </button>
{/if}
