<script lang="ts">
  import { searchState, searchService, searchFilters } from '$lib/stores/search';
  import { MapPin, Calendar, Clock, Users, Star, Navigation, Heart, Share } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  
  // Props
  export let showLoadMore = true;
  export let showDistance = true;
  export let showInteractions = true;
  
  // State
  let intersectionObserver: IntersectionObserver;
  let loadMoreTrigger: HTMLElement;
  let likedEvents = new Set<string>();
  
  // Reactive values
  $: results = $searchState.results;
  $: isLoading = $searchState.isLoading;
  $: hasMore = $searchState.hasMore;
  $: error = $searchState.error;
  $: filters = $searchFilters;
  
  // Load more results when scrolling
  function setupInfiniteScroll() {
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreTrigger) {
      intersectionObserver.observe(loadMoreTrigger);
    }
  }
  
  async function loadMore() {
    if (!hasMore || isLoading) return;
    
    const currentLength = results.length;
    await searchService.searchEvents(filters, currentLength, 20);
  }
  
  function handleEventClick(event: any) {
    // Track search result click
    if ($searchState.searchId) {
      searchService.trackSearchClick($searchState.searchId, event.id);
    }
    
    // Track view interaction
    searchService.trackUserInteraction(event.id, 'view');
    
    // Navigate to event detail
    goto(`/events/${event.id}`);
  }
  
  async function handleLike(event: any, liked: boolean) {
    try {
      if (liked) {
        likedEvents.add(event.id);
        await searchService.trackUserInteraction(event.id, 'like', 1.5);
      } else {
        likedEvents.delete(event.id);
        // You might want to implement unlike functionality
      }
      likedEvents = likedEvents; // Trigger reactivity
    } catch (error) {
      console.error('Failed to like event:', error);
    }
  }
  
  async function handleShare(event: any) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: `${window.location.origin}/events/${event.id}`
        });
      } else {
        // Fallback: copy to clipboard
        const url = `${window.location.origin}/events/${event.id}`;
        await navigator.clipboard.writeText(url);
        alert('Event link copied to clipboard!');
      }
      
      await searchService.trackUserInteraction(event.id, 'share', 1.2);
    } catch (error) {
      console.error('Failed to share event:', error);
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  function formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  function formatDistance(distance: number | null): string {
    if (!distance) return '';
    return distance < 1 
      ? `${Math.round(distance * 1000)}m away`
      : `${distance.toFixed(1)}km away`;
  }
  
  function getSearchRankColor(rank: number): string {
    if (rank > 0.5) return 'text-green-600';
    if (rank > 0.3) return 'text-yellow-600';
    return 'text-gray-400';
  }
  
  onMount(() => {
    setupInfiniteScroll();
    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
    };
  });
  
  // Re-setup intersection observer when results change
  $: if (results.length > 0) {
    setTimeout(setupInfiniteScroll, 100);
  }
</script>

<div class="search-results">
  {#if error}
    <div class="error-message">
      <p>❌ {error}</p>
      <button
        on:click={() => searchService.searchEvents(filters)}
        class="retry-button"
      >
        Try again
      </button>
    </div>
  {:else if results.length === 0 && !isLoading}
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">No events found</h3>
      <p class="empty-description">
        Try adjusting your search terms or filters to find more events.
      </p>
    </div>
  {:else}
    <div class="results-grid">
      {#each results as event (event.id)}
        <article class="event-card">
          <!-- Event Image Placeholder -->
          <div class="event-image">
            <div class="image-placeholder">
              <Calendar size={32} class="text-gray-400" />
            </div>
            
            <!-- Search Rank Indicator -->
            {#if event.search_rank > 0}
              <div class="search-rank {getSearchRankColor(event.search_rank)}">
                <Star size={14} />
                <span class="text-xs">{(event.search_rank * 100).toFixed(0)}%</span>
              </div>
            {/if}
            
            <!-- Distance Badge -->
            {#if showDistance && event.distance_km}
              <div class="distance-badge">
                <Navigation size={12} />
                {formatDistance(event.distance_km)}
              </div>
            {/if}
          </div>
          
          <!-- Event Content -->
          <div class="event-content">
            <!-- Header -->
            <div class="event-header">
              <h3 class="event-title">
                <button
                  on:click={() => handleEventClick(event)}
                  class="title-link"
                >
                  {event.title}
                </button>
              </h3>
              
              <!-- Event Status -->
              {#if event.status !== 'approved'}
                <span class="status-badge status-{event.status}">
                  {event.status}
                </span>
              {/if}
            </div>
            
            <!-- Event Details -->
            <div class="event-details">
              <!-- Date & Time -->
              <div class="detail-item">
                <Calendar size={16} class="text-gray-500" />
                <span>{formatDate(event.date)}</span>
                {#if event.time}
                  <Clock size={16} class="text-gray-500" />
                  <span>{formatTime(event.time)}</span>
                {/if}
              </div>
              
              <!-- Location -->
              {#if event.location}
                <div class="detail-item">
                  <MapPin size={16} class="text-gray-500" />
                  <span>{event.location}</span>
                </div>
              {/if}
              
              <!-- Organizer -->
              <div class="detail-item">
                <Users size={16} class="text-gray-500" />
                <span>by {event.organizer_username}</span>
              </div>
            </div>
            
            <!-- Description -->
            {#if event.description}
              <p class="event-description">
                {event.description.length > 150 
                  ? event.description.substring(0, 150) + '...'
                  : event.description}
              </p>
            {/if}
            
            <!-- Tags -->
            {#if event.search_tags && event.search_tags.length > 0}
              <div class="tags-list">
                {#each event.search_tags.slice(0, 3) as tag}
                  <span class="tag">{tag}</span>
                {/each}
                {#if event.search_tags.length > 3}
                  <span class="tag-more">+{event.search_tags.length - 3}</span>
                {/if}
              </div>
            {/if}
            
            <!-- Actions -->
            {#if showInteractions && $user}
              <div class="event-actions">
                <button
                  on:click|stopPropagation={() => handleLike(event, !likedEvents.has(event.id))}
                  class="action-button"
                  class:liked={likedEvents.has(event.id)}
                  title="Like event"
                >
                  <Heart size={16} class={likedEvents.has(event.id) ? 'fill-current' : ''} />
                </button>
                
                <button
                  on:click|stopPropagation={() => handleShare(event)}
                  class="action-button"
                  title="Share event"
                >
                  <Share size={16} />
                </button>
                
                <!-- Popularity Score -->
                {#if event.popularity_score > 0}
                  <div class="popularity-score">
                    <Star size={14} class="text-yellow-500" />
                    <span class="text-sm text-gray-600">{event.popularity_score}</span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
    
    <!-- Load More Trigger -->
    {#if showLoadMore && hasMore}
      <div bind:this={loadMoreTrigger} class="load-more-trigger">
        {#if isLoading}
          <div class="loading-spinner">
            <div class="spinner"></div>
            <span>Loading more events...</span>
          </div>
        {:else}
          <button
            on:click={loadMore}
            class="load-more-button"
          >
            Load more events
          </button>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .search-results {
    @apply w-full max-w-6xl mx-auto;
  }
  
  .error-message {
    @apply text-center py-12 space-y-4;
  }
  
  .retry-button {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
  
  .empty-state {
    @apply text-center py-16 space-y-4;
  }
  
  .empty-icon {
    @apply text-6xl;
  }
  
  .empty-title {
    @apply text-xl font-semibold text-gray-900;
  }
  
  .empty-description {
    @apply text-gray-600 max-w-md mx-auto;
  }
  
  .results-grid {
    @apply grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
  }
  
  .event-card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow;
  }
  
  .event-image {
    @apply relative h-48 bg-gray-100;
  }
  
  .image-placeholder {
    @apply w-full h-full flex items-center justify-center;
  }
  
  .search-rank {
    @apply absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-medium shadow-sm;
  }
  
  .distance-badge {
    @apply absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium;
  }
  
  .event-content {
    @apply p-6 space-y-4;
  }
  
  .event-header {
    @apply flex items-start justify-between gap-3;
  }
  
  .event-title {
    @apply flex-1;
  }
  
  .title-link {
    @apply text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left;
  }
  
  .status-badge {
    @apply px-2 py-1 text-xs font-medium rounded-full;
  }
  
  .status-pending {
    @apply bg-yellow-100 text-yellow-800;
  }
  
  .status-rejected {
    @apply bg-red-100 text-red-800;
  }
  
  .event-details {
    @apply space-y-2;
  }
  
  .detail-item {
    @apply flex items-center gap-2 text-sm text-gray-600;
  }
  
  .event-description {
    @apply text-sm text-gray-700 leading-relaxed;
  }
  
  .tags-list {
    @apply flex flex-wrap gap-2;
  }
  
  .tag {
    @apply px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full;
  }
  
  .tag-more {
    @apply px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full;
  }
  
  .event-actions {
    @apply flex items-center justify-between pt-2 border-t border-gray-100;
  }
  
  .action-button {
    @apply p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-50;
  }
  
  .action-button.liked {
    @apply text-red-500 hover:text-red-600;
  }
  
  .popularity-score {
    @apply flex items-center gap-1;
  }
  
  .load-more-trigger {
    @apply mt-8 text-center;
  }
  
  .loading-spinner {
    @apply flex items-center justify-center gap-3 py-8;
  }
  
  .spinner {
    @apply w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin;
  }
  
  .load-more-button {
    @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
</style>
