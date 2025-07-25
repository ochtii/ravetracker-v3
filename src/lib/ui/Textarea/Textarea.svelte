<script lang="ts">
  export let value = ''
  export let placeholder = ''
  export let disabled = false
  export let readonly = false
  export let required = false
  export let rows = 4
  export let resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'vertical'
  export let maxLength: number | undefined = undefined
  export let name = ''
  export let id = ''
  export let error = ''
  export let label = ''
  export let helperText = ''

  const resizeClasses = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: 'resize-y'
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement
    value = target.value
  }
</script>

<div class="flex flex-col space-y-1">
  {#if label}
    <label
      for={id || name}
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}

  <textarea
    {id}
    {name}
    {placeholder}
    {disabled}
    {readonly}
    {required}
    {rows}
    {maxLength}
    bind:value
    on:input={handleInput}
    on:focus
    on:blur
    on:keydown
    on:keyup
    on:change
    class="w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 {resizeClasses[resize]} {
      error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
    } {
      disabled
        ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
        : 'bg-white'
    } dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 {
      error
        ? 'dark:border-red-500 dark:focus:ring-red-500'
        : 'dark:focus:ring-blue-500 dark:focus:border-blue-500'
    }"
    {...$$restProps}
  />

  {#if error}
    <p class="text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  {:else if helperText}
    <p class="text-sm text-gray-500 dark:text-gray-400">
      {helperText}
    </p>
  {/if}

  {#if maxLength}
    <div class="flex justify-end">
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {value.length}/{maxLength}
      </span>
    </div>
  {/if}
</div>
