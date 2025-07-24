<script lang="ts">
  import { onMount } from 'svelte'
  import { writable, derived } from 'svelte/store'
  import { filters, eventActions } from '$lib/stores/events'
  import { debounce } from '$lib/utils'
  import { cn } from '$lib/utils'

  export let showAdvanced = false
  export let compact = false

  // Local filter state
  const localFilters = writable({
    search: '',
    genres: [] as string[],
    location: '',
    dateRange: null as { start: string; end: string } | null,
    priceRange: null as { min: number; max: number } | null,
    status: ['published'] as string[]
  })

  // Available options
  const genreOptions = [
    'Techno', 'House', 'Trance', 'Hardstyle', 'Drum & Bass',
    'Dubstep', 'Progressive', 'Minimal', 'Acid', 'Industrial',
    'Hardcore', 'Breakbeat', 'Ambient', 'Psytrance', 'Electro'
  ]

  const statusOptions = [
    { value: 'published', label: 'Veröffentlicht' },
    { value: 'draft', label: 'Entwurf' },
    { value: 'cancelled', label: 'Abgesagt' }
  ]

  const locationSuggestions = [
    'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt',
    'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dresden', 'Hannover'
  ]

  let showLocationSuggestions = false
  let selectedGenres = new Set<string>()
  let priceMin = 0
  let priceMax = 100
  let dateFrom = ''
  let dateTo = ''

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    localFilters.update(f => ({ ...f, search: value }))
    applyFilters()
  }, 300)

  const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    debouncedSearch(target.value)
  }

  const toggleGenre = (genre: string) => {
    if (selectedGenres.has(genre)) {
      selectedGenres.delete(genre)
    } else {
      selectedGenres.add(genre)
    }
    selectedGenres = new Set(selectedGenres) // Trigger reactivity
    
    localFilters.update(f => ({ 
      ...f, 
      genres: Array.from(selectedGenres) 
    }))
    applyFilters()
  }

  const updateDateRange = () => {
    const range = dateFrom && dateTo ? { start: dateFrom, end: dateTo } : null
    localFilters.update(f => ({ ...f, dateRange: range }))
    applyFilters()
  }

  const updatePriceRange = () => {
    const range = priceMin >= 0 && priceMax > priceMin 
      ? { min: priceMin, max: priceMax } 
      : null
    localFilters.update(f => ({ ...f, priceRange: range }))
    applyFilters()
  }

  const selectLocation = (location: string) => {
    localFilters.update(f => ({ ...f, location }))
    showLocationSuggestions = false
    applyFilters()
  }

  const applyFilters = () => {
    const current = $localFilters
    filters.set({
      genres: current.genres,
      location: current.location,
      dateRange: current.dateRange,
      priceRange: current.priceRange,
      status: current.status
    })
    eventActions.loadEvents({ reset: true })
  }

  const resetFilters = () => {
    selectedGenres.clear()
    selectedGenres = new Set()
    priceMin = 0
    priceMax = 100
    dateFrom = ''
    dateTo = ''
    
    localFilters.set({
      search: '',
      genres: [],
      location: '',
      dateRange: null,
      priceRange: null,
      status: ['published']
    })
    
    eventActions.resetFilters()
  }

  const getActiveFiltersCount = derived(localFilters, ($localFilters) => {
    let count = 0
    if ($localFilters.search) count++
    if ($localFilters.genres.length > 0) count++
    if ($localFilters.location) count++
    if ($localFilters.dateRange) count++
    if ($localFilters.priceRange) count++
    if ($localFilters.status.length !== 1 || $localFilters.status[0] !== 'published') count++
    return count
  })

  onMount(() => {
    // Initialize with current filters
    const current = $filters
    localFilters.set({
      search: '',
      genres: current.genres,
      location: current.location,
      dateRange: current.dateRange,
      priceRange: current.priceRange,
      status: current.status
    })

    // Set UI state
    selectedGenres = new Set(current.genres)
    if (current.dateRange) {
      dateFrom = current.dateRange.start
      dateTo = current.dateRange.end
    }
    if (current.priceRange) {
      priceMin = current.priceRange.min
      priceMax = current.priceRange.max
    }
  })
</script>

<div class={cn(
  "space-y-4",
  compact ? "p-4 bg-white/5 backdrop-blur-sm rounded-lg" : "p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl"
)}>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <h3 class="text-lg font-semibold text-white">Filter</h3>
      {#if $getActiveFiltersCount > 0}
        <span class="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
          {$getActiveFiltersCount}
        </span>
      {/if}
    </div>
    
    <div class="flex items-center gap-2">
      {#if !compact}
        <button
          on:click={() => showAdvanced = !showAdvanced}
          class="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showAdvanced ? 'Weniger' : 'Erweitert'}
        </button>
      {/if}
      
      {#if $getActiveFiltersCount > 0}
        <button
          on:click={resetFilters}
          class="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Zurücksetzen
        </button>
      {/if}
    </div>
  </div>

  <!-- Search -->
  <div class="relative">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
    <input
      type="text"
      placeholder="Events suchen..."
      on:input={handleSearchInput}
      class="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
    />
  </div>

  <!-- Quick Filters -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Location -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-300 mb-2">Ort</label>
      <input
        type="text"
        placeholder="Stadt eingeben..."
        bind:value={$localFilters.location}
        on:focus={() => showLocationSuggestions = true}
        on:blur={() => setTimeout(() => showLocationSuggestions = false, 200)}
        on:input={() => applyFilters()}
        class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
      
      {#if showLocationSuggestions && $localFilters.location.length === 0}
        <div class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-lg z-10">
          {#each locationSuggestions as location}
            <button
              on:click={() => selectLocation(location)}
              class="w-full px-3 py-2 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {location}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">Datum von</label>
      <input
        type="date"
        bind:value={dateFrom}
        on:change={updateDateRange}
        class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-2">Datum bis</label>
      <input
        type="date"
        bind:value={dateTo}
        on:change={updateDateRange}
        class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </div>
  </div>

  <!-- Advanced Filters -->
  {#if showAdvanced || compact}
    <div class="space-y-4 pt-4 border-t border-white/10">
      <!-- Genres -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">Genres</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {#each genreOptions as genre}
            <button
              on:click={() => toggleGenre(genre)}
              class={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                selectedGenres.has(genre)
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              )}
            >
              {genre}
            </button>
          {/each}
        </div>
      </div>

      <!-- Price Range -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">
          Preis: {priceMin}€ - {priceMax}€
        </label>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-gray-400 mb-1">Min</label>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              bind:value={priceMin}
              on:change={updatePriceRange}
              class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Max</label>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              bind:value={priceMax}
              on:change={updatePriceRange}
              class="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-3">Status</label>
        <div class="flex flex-wrap gap-2">
          {#each statusOptions as option}
            <button
              on:click={() => {
                const newStatus = $localFilters.status.includes(option.value)
                  ? $localFilters.status.filter(s => s !== option.value)
                  : [...$localFilters.status, option.value]
                localFilters.update(f => ({ ...f, status: newStatus }))
                applyFilters()
              }}
              class={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                $localFilters.status.includes(option.value)
                  ? "bg-green-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              )}
            >
              {option.label}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom slider styling */
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: 2px solid #1f2937;
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8b5cf6;
    cursor: pointer;
    border: 2px solid #1f2937;
    box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
  }

  .slider::-webkit-slider-track {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }

  .slider::-moz-range-track {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
  }
</style>
