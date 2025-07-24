<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { searchService, searchFilters, searchState, autocompleteState, hasActiveFilters } from '$lib/stores/search';
  import { MapPin, Calendar, Filter, Search, X, Clock, Users, Star, Navigation } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  
  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Props
  export let placeholder = 'Search events, locations, or topics...';
  export let showFilters = true;
  export let showLocation = true;
  export let autoFocus = false;
  
  // State
  let searchInput: HTMLInputElement;
  let showAutocomplete = false;
  let showAdvancedFilters = false;
  let isGettingLocation = false;
  let userLocation: { lat: number; lng: number } | null = null;
  
  // Reactive values
  $: filters = $searchFilters;
  $: results = $searchState.results;
  $: isLoading = $searchState.isLoading;
  $: suggestions = $autocompleteState.suggestions;
  $: isAutocompleteLoading = $autocompleteState.isLoading;
  
  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (query.length >= 2) {
      await searchService.getAutocomplete(query);
      showAutocomplete = true;
    } else {
      searchService.clearAutocomplete();
      showAutocomplete = false;
    }
  }, 300);
  
  // Event handlers
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const query = target.value;
    
    searchService.updateFilter('query', query);
    debouncedSearch(query);
  }
  
  function handleSuggestionClick(suggestion: any) {
    searchService.updateFilter('query', suggestion.suggestion);
    showAutocomplete = false;
    performSearch();
    
    // Add to search history
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const newHistory = [suggestion.suggestion, ...history.filter((item: string) => item !== suggestion.suggestion)].slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  }
  
  function handleLocationSearch() {
    if (filters.location) {
      searchService.updateFilter('query', filters.location);
      performSearch();
    }
  }
  
  async function getCurrentLocation() {
    isGettingLocation = true;
    try {
      const location = await searchService.getCurrentLocation();
      if (location) {
        userLocation = location;
        searchService.updateFilter('userLat', location.lat);
        searchService.updateFilter('userLng', location.lng);
        performSearch();
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      isGettingLocation = false;
    }
  }
  
  async function performSearch() {
    showAutocomplete = false;
    searchService.clearResults();
    await searchService.searchEvents(filters);
  }
  
  function clearFilters() {
    searchService.resetFilters();
    userLocation = null;
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  }
  
  function removeTag(tagToRemove: string) {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove) || [];
    searchService.updateFilter('tags', newTags);
    performSearch();
  }
  
  function addTag(tag: string) {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      searchService.updateFilter('tags', [...currentTags, tag]);
      performSearch();
    }
  }
  
  // Close autocomplete when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.search-container')) {
      showAutocomplete = false;
    }
  }
  
  // Handle enter key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch();
    } else if (event.key === 'Escape') {
      showAutocomplete = false;
    }
  }
  
  onMount(() => {
    if (autoFocus && searchInput) {
      searchInput.focus();
    }
    document.addEventListener('click', handleClickOutside);
  });
  
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="search-container">
  <!-- Main Search Bar -->
  <div class="relative">
    <div class="search-input-wrapper">
      <Search class="search-icon" size={20} />
      <input
        bind:this={searchInput}
        type="text"
        {placeholder}
        value={filters.query}
        on:input={handleSearchInput}
        on:keydown={handleKeydown}
        class="search-input"
        autocomplete="off"
      />
      
      {#if isLoading}
        <div class="loading-indicator">
          <div class="spinner"></div>
        </div>
      {/if}
      
      {#if filters.query}
        <button
          on:click={() => {
            searchService.updateFilter('query', '');
            searchService.clearAutocomplete();
            searchInput?.focus();
          }}
          class="clear-button"
          type="button"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      {/if}
    </div>
    
    <!-- Autocomplete Dropdown -->
    {#if showAutocomplete && suggestions.length > 0}
      <div class="autocomplete-dropdown">
        {#each suggestions as suggestion}
          <button
            on:click={() => handleSuggestionClick(suggestion)}
            class="autocomplete-item"
            type="button"
          >
            <div class="suggestion-content">
              <span class="suggestion-text">{suggestion.suggestion}</span>
              <span class="suggestion-category">{suggestion.category}</span>
            </div>
            {#if suggestion.category === 'event' && suggestion.popularity}
              <div class="suggestion-meta">
                <Star size={12} class="text-yellow-500" />
                <span class="text-xs text-gray-500">{suggestion.popularity}</span>
              </div>
            {:else if suggestion.usage_count}
              <div class="suggestion-meta">
                <Users size={12} class="text-gray-400" />
                <span class="text-xs text-gray-500">{suggestion.usage_count}</span>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Filter Bar -->
  {#if showFilters}
    <div class="filter-bar">
      <!-- Location Filter -->
      {#if showLocation}
        <div class="filter-group">
          <MapPin size={16} class="text-gray-500" />
          <input
            type="text"
            placeholder="Location"
            bind:value={filters.location}
            on:change={handleLocationSearch}
            class="filter-input"
          />
          
          <button
            on:click={getCurrentLocation}
            disabled={isGettingLocation}
            class="location-button"
            type="button"
            title="Use current location"
          >
            <Navigation size={16} class={isGettingLocation ? 'animate-spin' : ''} />
          </button>
        </div>
      {/if}
      
      <!-- Date Range -->
      <div class="filter-group">
        <Calendar size={16} class="text-gray-500" />
        <input
          type="date"
          bind:value={filters.dateFrom}
          on:change={performSearch}
          class="filter-input"
          min={new Date().toISOString().split('T')[0]}
        />
        <span class="text-gray-400">to</span>
        <input
          type="date"
          bind:value={filters.dateTo}
          on:change={performSearch}
          class="filter-input"
          min={filters.dateFrom || new Date().toISOString().split('T')[0]}
        />
      </div>
      
      <!-- Distance Filter (if location available) -->
      {#if userLocation || filters.userLat}
        <div class="filter-group">
          <span class="filter-label">Within</span>
          <select
            bind:value={filters.maxDistance}
            on:change={performSearch}
            class="filter-select"
          >
            <option value={undefined}>Any distance</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>
      {/if}
      
      <!-- Advanced Filters Toggle -->
      <button
        on:click={() => showAdvancedFilters = !showAdvancedFilters}
        class="filter-toggle"
        class:active={showAdvancedFilters}
        type="button"
      >
        <Filter size={16} />
        More filters
      </button>
      
      <!-- Clear Filters -->
      {#if $hasActiveFilters}
        <button
          on:click={clearFilters}
          class="clear-filters-button"
          type="button"
        >
          <X size={16} />
          Clear all
        </button>
      {/if}
    </div>
  {/if}
  
  <!-- Advanced Filters Panel -->
  {#if showAdvancedFilters}
    <div class="advanced-filters">
      <!-- Event Status -->
      <div class="filter-section">
        <label class="filter-label">Event Status</label>
        <select
          bind:value={filters.status}
          on:change={performSearch}
          class="filter-select"
        >
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="">All</option>
        </select>
      </div>
      
      <!-- Tags -->
      <div class="filter-section">
        <label class="filter-label">Tags</label>
        <div class="tags-input-container">
          {#if filters.tags && filters.tags.length > 0}
            <div class="tags-list">
              {#each filters.tags as tag}
                <span class="tag">
                  {tag}
                  <button
                    on:click={() => removeTag(tag)}
                    class="tag-remove"
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              {/each}
            </div>
          {/if}
          <input
            type="text"
            placeholder="Add tags..."
            on:keydown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                addTag(e.target.value.trim());
                e.target.value = '';
              }
            }}
            class="tags-input"
          />
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Search Results Summary -->
  {#if results.length > 0}
    <div class="results-summary">
      <span class="results-count">
        {$searchState.totalCount} events found
        {#if userLocation && filters.maxDistance}
          within {filters.maxDistance}km
        {/if}
      </span>
      
      {#if $searchState.isLoading}
        <span class="loading-text">Loading more...</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search-container {
    @apply w-full max-w-4xl mx-auto space-y-4;
  }
  
  .search-input-wrapper {
    @apply relative flex items-center;
  }
  
  .search-icon {
    @apply absolute left-4 text-gray-400 pointer-events-none z-10;
  }
  
  .search-input {
    @apply w-full pl-12 pr-20 py-4 text-lg bg-white border-2 border-gray-200 rounded-xl shadow-sm;
    @apply focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none;
    @apply transition-all duration-200;
  }
  
  .loading-indicator {
    @apply absolute right-12 flex items-center;
  }
  
  .spinner {
    @apply w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin;
  }
  
  .clear-button {
    @apply absolute right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors;
  }
  
  .autocomplete-dropdown {
    @apply absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1;
    @apply max-h-80 overflow-y-auto;
  }
  
  .autocomplete-item {
    @apply w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0;
    @apply flex items-center justify-between transition-colors;
  }
  
  .suggestion-content {
    @apply flex items-center gap-3;
  }
  
  .suggestion-text {
    @apply font-medium text-gray-900;
  }
  
  .suggestion-category {
    @apply text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full;
  }
  
  .suggestion-meta {
    @apply flex items-center gap-1;
  }
  
  .filter-bar {
    @apply flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg;
  }
  
  .filter-group {
    @apply flex items-center gap-2;
  }
  
  .filter-input {
    @apply px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none;
  }
  
  .filter-select {
    @apply px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white;
  }
  
  .filter-label {
    @apply text-sm font-medium text-gray-700;
  }
  
  .location-button {
    @apply p-2 text-gray-500 hover:text-blue-500 transition-colors;
  }
  
  .filter-toggle {
    @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700;
    @apply border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors;
  }
  
  .filter-toggle.active {
    @apply bg-blue-50 border-blue-200 text-blue-700;
  }
  
  .clear-filters-button {
    @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600;
    @apply border border-red-200 rounded-lg hover:bg-red-50 transition-colors;
  }
  
  .advanced-filters {
    @apply p-4 bg-white border border-gray-200 rounded-lg space-y-4;
  }
  
  .filter-section {
    @apply space-y-2;
  }
  
  .tags-input-container {
    @apply space-y-2;
  }
  
  .tags-list {
    @apply flex flex-wrap gap-2;
  }
  
  .tag {
    @apply inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm;
  }
  
  .tag-remove {
    @apply text-blue-600 hover:text-blue-800 transition-colors;
  }
  
  .tags-input {
    @apply w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none;
  }
  
  .results-summary {
    @apply flex items-center justify-between text-sm text-gray-600 px-2;
  }
  
  .results-count {
    @apply font-medium;
  }
  
  .loading-text {
    @apply text-blue-600;
  }
</style>
