<script lang="ts">
  import { onMount } from 'svelte';
  import { searchService, recommendationsState } from '$lib/stores/search';
  import { user } from '$lib/stores/auth';
  import { MapPin, Calendar, Clock, Star, TrendingUp, Users, Sparkles } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  
  // Props
  export let type: 'content' | 'collaborative' = 'content';
  export let showType = true;
  export let limit = 6;
  
  // State
  let currentType = type;
  
  // Reactive values
  $: recommendations = $recommendationsState.recommendations;
  $: isLoading = $recommendationsState.loading;
  $: error = $recommendationsState.error;
  
  async function loadRecommendations() {
    if (!$user?.id) return;
    
    await searchService.getRecommendations($user.id, currentType);
  }
  
  function handleRecommendationClick(recommendation: any) {
    // Track interaction
    searchService.trackUserInteraction(recommendation.event_id, 'view', 1.1);
    
    // Navigate to event
    goto(`/events/${recommendation.event_id}`);
  }
  
  function switchType(newType: 'content' | 'collaborative') {
    currentType = newType;
    loadRecommendations();
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  function getScoreColor(score: number): string {
    if (score > 0.7) return 'text-green-600';
    if (score > 0.4) return 'text-yellow-600';
    return 'text-gray-500';
  }
  
  function getScoreIcon(type: string) {
    return type === 'content' ? Sparkles : Users;
  }
  
  onMount(() => {
    if ($user?.id) {
      loadRecommendations();
    }
  });
  
  // Reload when user changes
  $: if ($user?.id) {
    loadRecommendations();
  }
</script>

<div class="recommendations-container">
  <div class="recommendations-header">
    <h2 class="recommendations-title">
      <TrendingUp size={20} />
      Recommended for you
    </h2>
    
    {#if showType && $user}
      <div class="type-toggle">
        <button
          on:click={() => switchType('content')}
          class="toggle-button"
          class:active={currentType === 'content'}
        >
          <Sparkles size={16} />
          Your interests
        </button>
        <button
          on:click={() => switchType('collaborative')}
          class="toggle-button"
          class:active={currentType === 'collaborative'}
        >
          <Users size={16} />
          Similar users
        </button>
      </div>
    {/if}
  </div>
  
  {#if !$user}
    <div class="auth-prompt">
      <div class="auth-icon">🔐</div>
      <h3 class="auth-title">Sign in for personalized recommendations</h3>
      <p class="auth-description">
        Get event suggestions based on your interests and activity.
      </p>
      <button
        on:click={() => goto('/auth')}
        class="auth-button"
      >
        Sign in
      </button>
    </div>
  {:else if error}
    <div class="error-message">
      <p>❌ {error}</p>
      <button
        on:click={loadRecommendations}
        class="retry-button"
      >
        Try again
      </button>
    </div>
  {:else if isLoading}
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>Finding recommendations...</span>
      </div>
    </div>
  {:else if recommendations.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🎯</div>
      <h3 class="empty-title">No recommendations yet</h3>
      <p class="empty-description">
        {#if currentType === 'content'}
          Start attending events to get personalized recommendations based on your interests.
        {:else}
          We need more interaction data to find users with similar tastes.
        {/if}
      </p>
      <button
        on:click={() => goto('/events')}
        class="explore-button"
      >
        Explore events
      </button>
    </div>
  {:else}
    <div class="recommendations-grid">
      {#each recommendations.slice(0, limit) as recommendation (recommendation.event_id)}
        <article class="recommendation-card">
          <!-- Recommendation Header -->
          <div class="recommendation-header">
            <div class="score-indicator">
              <svelte:component 
                this={getScoreIcon(currentType)} 
                size={14} 
                class={getScoreColor(recommendation.similarity_score || 0)}
              />
              <span class="score-value {getScoreColor(recommendation.similarity_score || 0)}">
                {Math.round((recommendation.similarity_score || 0) * 100)}%
              </span>
            </div>
            
            <span class="recommendation-type">
              {currentType === 'content' ? 'Interest match' : 'Similar users'}
            </span>
          </div>
          
          <!-- Event Content -->
          <div class="event-content">
            <h3 class="event-title">
              <button
                on:click={() => handleRecommendationClick(recommendation)}
                class="title-link"
              >
                {recommendation.title}
              </button>
            </h3>
            
            <!-- Event Details -->
            <div class="event-details">
              <div class="detail-item">
                <Calendar size={14} class="text-gray-500" />
                <span>{formatDate(recommendation.date)}</span>
              </div>
              
              {#if recommendation.location}
                <div class="detail-item">
                  <MapPin size={14} class="text-gray-500" />
                  <span>{recommendation.location}</span>
                </div>
              {/if}
            </div>
            
            <!-- Description -->
            {#if recommendation.description}
              <p class="event-description">
                {recommendation.description.length > 100 
                  ? recommendation.description.substring(0, 100) + '...'
                  : recommendation.description}
              </p>
            {/if}
            
            <!-- Recommendation Reason -->
            <div class="recommendation-reason">
              <span class="reason-label">Why recommended:</span>
              <span class="reason-text">{recommendation.recommendation_reason}</span>
            </div>
          </div>
          
          <!-- Action Button -->
          <div class="recommendation-footer">
            <button
              on:click={() => handleRecommendationClick(recommendation)}
              class="view-button"
            >
              View event
            </button>
          </div>
        </article>
      {/each}
    </div>
    
    <!-- View All Button -->
    {#if recommendations.length > limit}
      <div class="view-all-container">
        <button
          on:click={() => goto('/recommendations')}
          class="view-all-button"
        >
          View all {recommendations.length} recommendations
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .recommendations-container {
    @apply space-y-6;
  }
  
  .recommendations-header {
    @apply flex items-center justify-between;
  }
  
  .recommendations-title {
    @apply flex items-center gap-2 text-xl font-semibold text-gray-900;
  }
  
  .type-toggle {
    @apply flex bg-gray-100 rounded-lg p-1;
  }
  
  .toggle-button {
    @apply flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors;
  }
  
  .toggle-button:not(.active) {
    @apply text-gray-600 hover:text-gray-900;
  }
  
  .toggle-button.active {
    @apply bg-white text-blue-600 shadow-sm;
  }
  
  .auth-prompt {
    @apply text-center py-12 space-y-4;
  }
  
  .auth-icon {
    @apply text-4xl;
  }
  
  .auth-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .auth-description {
    @apply text-gray-600 max-w-md mx-auto;
  }
  
  .auth-button {
    @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
  
  .error-message {
    @apply text-center py-8 space-y-4;
  }
  
  .retry-button {
    @apply px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
  
  .loading-container {
    @apply py-12;
  }
  
  .loading-spinner {
    @apply flex items-center justify-center gap-3;
  }
  
  .spinner {
    @apply w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin;
  }
  
  .empty-state {
    @apply text-center py-12 space-y-4;
  }
  
  .empty-icon {
    @apply text-4xl;
  }
  
  .empty-title {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .empty-description {
    @apply text-gray-600 max-w-md mx-auto;
  }
  
  .explore-button {
    @apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors;
  }
  
  .recommendations-grid {
    @apply grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
  }
  
  .recommendation-card {
    @apply bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden;
  }
  
  .recommendation-header {
    @apply flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200;
  }
  
  .score-indicator {
    @apply flex items-center gap-2;
  }
  
  .score-value {
    @apply text-sm font-semibold;
  }
  
  .recommendation-type {
    @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
  }
  
  .event-content {
    @apply p-4 space-y-3;
  }
  
  .event-title {
    @apply text-base font-semibold text-gray-900;
  }
  
  .title-link {
    @apply hover:text-blue-600 transition-colors text-left;
  }
  
  .event-details {
    @apply space-y-1;
  }
  
  .detail-item {
    @apply flex items-center gap-2 text-sm text-gray-600;
  }
  
  .event-description {
    @apply text-sm text-gray-700 leading-relaxed;
  }
  
  .recommendation-reason {
    @apply space-y-1;
  }
  
  .reason-label {
    @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
  }
  
  .reason-text {
    @apply text-sm text-gray-700 italic;
  }
  
  .recommendation-footer {
    @apply p-4 bg-gray-50 border-t border-gray-200;
  }
  
  .view-button {
    @apply w-full px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors;
  }
  
  .view-all-container {
    @apply text-center;
  }
  
  .view-all-button {
    @apply px-6 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors;
  }
</style>
