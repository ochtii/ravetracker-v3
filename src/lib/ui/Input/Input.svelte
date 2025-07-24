<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { cn, getVariantClasses, getSizeClasses } from '../types'
  import type { InputProps } from '../types'

  export let type: InputProps['type'] = 'text'
  export let value: InputProps['value'] = ''
  export let placeholder: InputProps['placeholder'] = ''
  export let disabled = false
  export let readonly = false
  export let required = false
  export let error: InputProps['error'] = ''
  export let label: InputProps['label'] = ''
  export let hint: InputProps['hint'] = ''
  export let size: 'sm' | 'md' | 'lg' = 'md'
  export let variant: 'default' | 'solid' = 'default'

  let className = ''
  export { className as class }

  const dispatch = createEventDispatcher<{
    change: Event
    input: Event
  }>()

  function handleChange(event: Event) {
    dispatch('change', event)
  }

  function handleInput(event: Event) {
    dispatch('input', event)
  }

  $: inputClass = cn(
    // Base styles
    'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
    // Variant styles
    getVariantClasses(variant, 'input'),
    // Size styles
    getSizeClasses(size, 'input'),
    // Error state
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    // Custom class
    className
  )

  let inputId = `input-${Math.random().toString(36).substr(2, 9)}`
</script>

<div class="space-y-1">
  {#if label}
    <label for={inputId} class="block text-sm font-medium text-white/90">
      {label}
      {#if required}
        <span class="text-red-400">*</span>
      {/if}
    </label>
  {/if}

  <input
    id={inputId}
    {type}
    bind:value
    {placeholder}
    {disabled}
    {readonly}
    {required}
    class={inputClass}
    on:change={handleChange}
    on:input={handleInput}
    {...$$restProps}
  />

  {#if error}
    <p class="text-sm text-red-400 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </p>
  {:else if hint}
    <p class="text-sm text-white/60">{hint}</p>
  {/if}
</div>
