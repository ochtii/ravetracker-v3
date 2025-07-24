<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import EventList from '$lib/components/events/EventList.svelte'
  import EventFilters from '$lib/components/events/EventFilters.svelte'
  import { user } from '$lib/stores/auth'
  import { events, featuredEvents, eventActions } from '$lib/stores/events'
  import { searchQuery } from '$lib/stores/events'
  import type { PageData } from './$types'

  export let data: PageData = {} as any

  let showFilters = false
  let showMap = false
  let showAdvanced = false
  let currentView: 'featured' | 'all' | 'map' = 'featured'

  // Reactive search from URL params
  $: if (browser && $page.url.searchParams.get('q')) {
    const query = $page.url.searchParams.get('q') || ''
    searchQuery.set(query)
  }

  const toggleFilters = () => {
    showFilters = !showFilters
  }

  const switchView = (view: 'featured' | 'all' | 'map') => {
    currentView = view
    if (view === 'featured') {
      eventActions.loadFeaturedEvents()
    } else if (view === 'all') {
      eventActions.loadEvents({ reset: true })
    }
  }

  onMount(() => {
    // Load initial data
    if ($featuredEvents.length === 0) {
      eventActions.loadFeaturedEvents()
    }
    
    // Handle URL search parameters
    const urlQuery = $page.url.searchParams.get('q')
    if (urlQuery) {
      searchQuery.set(urlQuery)
      currentView = 'all'
      eventActions.loadEvents({ reset: true })
    }
  })
</script>

<svelte:head>
  <title>Events - RaveTracker v3.0</title>
  <meta name="description" content="Entdecke die besten Techno, House und Electronic Music Events in deiner Stadt. Real-time Updates, Tickets und mehr." />
  <meta name="keywords" content="events, techno, house, electronic music, rave, party, tickets" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
  <!-- Hero Section -->
  <div class="relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0 bg-dot-pattern"></div>
    </div>

    <div class="relative container mx-auto px-4 py-16">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-7xl font-bold text-white mb-4">
          <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Events
          </span>
        </h1>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto">
          Entdecke die besten Electronic Music Events in deiner Stadt. 
          Real-time Updates, Tickets und exklusive Parties.
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <div class="flex bg-white/10 backdrop-blur-sm rounded-lg p-1">
          <button
            on:click={() => switchView('featured')}
            class={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'featured'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Featured
          </button>
          <button
            on:click={() => switchView('all')}
            class={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Alle Events
          </button>
          <button
            on:click={() => switchView('map')}
            class={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'map'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            disabled
            title="Kartenansicht kommt bald"
          >
            Karte
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            on:click={toggleFilters}
            class={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              showFilters 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
            }`}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Filter
          </button>

          {#if $user}
            <button
              on:click={() => goto('/events/create')}
              class="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Event erstellen
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="container mx-auto px-4 pb-16">
    <!-- Filters -->
    {#if showFilters}
      <div class="mb-8">
        <EventFilters {showAdvanced} />
      </div>
    {/if}

    <!-- Stats Bar -->
    <div class="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-white">{$events.length}</div>
            <div class="text-sm text-gray-400">Events gefunden</div>
          </div>
          
          {#if currentView === 'featured' && $featuredEvents.length > 0}
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-400">{$featuredEvents.length}</div>
              <div class="text-sm text-gray-400">Featured Events</div>
            </div>
          {/if}

          <div class="text-center">
            <div class="text-2xl font-bold text-green-400">12</div>
            <div class="text-sm text-gray-400">Heute</div>
          </div>

          <div class="text-center">
            <div class="text-2xl font-bold text-blue-400">48</div>
            <div class="text-sm text-gray-400">Diese Woche</div>
          </div>
        </div>

        <!-- Real-time indicator -->
        <div class="flex items-center gap-2 text-sm text-green-400">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live Updates
        </div>
      </div>
    </div>

    <!-- Event Lists -->
    {#if currentView === 'featured'}
      <!-- Featured Events -->
      {#if $featuredEvents.length > 0}
        <div class="mb-12">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold text-white">Featured Events</h2>
            <button
              on:click={() => switchView('all')}
              class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Alle anzeigen →
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each $featuredEvents.slice(0, 6) as event (event.id)}
              <div class="transform hover:scale-105 transition-transform duration-300">
                <!-- EventCard component would go here -->
                <div class="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border border-white/20 rounded-xl p-6 h-full">
                  <div class="flex items-center gap-2 text-sm text-purple-300 mb-3">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    Featured
                  </div>
                  
                  <h3 class="text-xl font-semibold text-white mb-2">{event.title}</h3>
                  <p class="text-gray-300 text-sm mb-4 line-clamp-2">{event.description || 'Keine Beschreibung verfügbar'}</p>
                  
                  <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    {new Date(event.date_time).toLocaleDateString('de-DE')}
                  </div>

                  <button
                    on:click={() => goto(`/events/${event.id}`)}
                    class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Details ansehen
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Recent Events -->
      <div>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-bold text-white">Neueste Events</h2>
        </div>
        <EventList layout="grid" showFilters={false} limit={8} />
      </div>

    {:else if currentView === 'all'}
      <!-- All Events -->
      <EventList layout="grid" {showFilters} />

    {:else if currentView === 'map'}
      <!-- Map View (Placeholder) -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
        <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
        </div>
        
        <h3 class="text-2xl font-semibold text-white mb-4">Kartenansicht kommt bald</h3>
        <p class="text-gray-400 mb-6">
          Wir arbeiten an einer interaktiven Karte, um Events in deiner Nähe zu finden.
        </p>
        
        <button
          on:click={() => switchView('all')}
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Zur Listen-Ansicht
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
