<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth'
  import { eventActions } from '$lib/stores/events'
  import type { Database } from '$lib/types/database'
  import { cn } from '$lib/utils'

  type Event = Database['public']['Tables']['events']['Row']

  export let event: Event
  export let variant: 'card' | 'list' | 'compact' = 'card'
  export let showAttendance = true
  export let showShare = true

  let isAttending = false
  let isInterested = false
  let attendanceCount = 0
  let loading = false
  let imageError = false

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Kostenlos'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const handleAttend = async () => {
    if (!$user) {
      goto('/auth/login')
      return
    }

    loading = true
    try {
      if (isAttending) {
        await eventActions.leaveEvent(event.id)
        isAttending = false
        attendanceCount--
      } else {
        await eventActions.joinEvent(event.id)
        isAttending = true
        attendanceCount++
      }
    } catch (error) {
      console.error('Attendance error:', error)
    } finally {
      loading = false
    }
  }

  const handleInterest = async () => {
    if (!$user) {
      goto('/auth/login')
      return
    }

    loading = true
    try {
      if (isInterested) {
        await eventActions.removeInterest(event.id)
        isInterested = false
      } else {
        await eventActions.showInterest(event.id)
        isInterested = true
      }
    } catch (error) {
      console.error('Interest error:', error)
    } finally {
      loading = false
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || '',
        url: `${window.location.origin}/events/${event.id}`
      })
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`)
    }
  }

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '/images/event-placeholder.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-images/${imagePath}`
  }

  onMount(async () => {
    if ($user) {
      // Load user's attendance status
      try {
        const { data } = await eventActions.getUserAttendance(event.id)
        if (data) {
          isAttending = data.status === 'going'
          isInterested = data.status === 'interested'
        }
      } catch (error) {
        console.error('Failed to load attendance:', error)
      }
    }

    // Load attendance count
    attendanceCount = event.going_count || 0
  })
</script>

{#if variant === 'card'}
  <!-- Card Layout -->
  <div class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/25">
    <!-- Image -->
    <div class="relative h-48 overflow-hidden">
      {#if !imageError}
        <img
          src={getImageUrl(event.cover_image_url)}
          alt={event.title}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          on:error={() => imageError = true}
        />
      {:else}
        <div class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <svg class="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
        </div>
      {/if}
      
      <!-- Status Badge -->
      <div class="absolute top-3 left-3">
        <span class={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          event.status === 'published' ? "bg-green-500/20 text-green-300 border border-green-500/30" :
          event.status === 'draft' ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
          "bg-red-500/20 text-red-300 border border-red-500/30"
        )}>
          {event.status === 'published' ? 'Live' : 
           event.status === 'draft' ? 'Draft' : 'Cancelled'}
        </span>
      </div>

      <!-- Price Badge -->
      {#if event.price_min !== null}
        <div class="absolute top-3 right-3">
          <span class="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
            {formatPrice(event.price_min)}
          </span>
        </div>
      {/if}
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Date & Time -->
      <div class="flex items-center gap-2 text-sm text-purple-300 mb-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span>{formatDate(event.date_time)} • {formatTime(event.date_time)}</span>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
        {event.title}
      </h3>

      <!-- Location -->
      {#if event.location_name}
        <div class="flex items-center gap-2 text-sm text-gray-300 mb-3">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span class="truncate">{event.location_name}</span>
        </div>
      {/if}

      <!-- Genres -->
      {#if event.genres && event.genres.length > 0}
        <div class="flex flex-wrap gap-1 mb-3">
          {#each event.genres.slice(0, 3) as genre}
            <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
              {genre}
            </span>
          {/each}
          {#if event.genres.length > 3}
            <span class="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
              +{event.genres.length - 3}
            </span>
          {/if}
        </div>
      {/if}

      <!-- Actions -->
      {#if showAttendance && $user}
        <div class="flex items-center gap-2 mb-3">
          <button
            on:click={handleAttend}
            disabled={loading}
            class={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isAttending 
                ? "bg-green-500 text-white hover:bg-green-600" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            )}
          >
            {loading ? "..." : isAttending ? "Teilnahme" : "Teilnehmen"}
          </button>
          
          <button
            on:click={handleInterest}
            disabled={loading}
            aria-label={isInterested ? "Interesse entfernen" : "Interesse zeigen"}
            class={cn(
              "px-3 py-2 rounded-lg transition-all duration-200",
              isInterested ? "text-red-400" : "text-gray-400 hover:text-red-400"
            )}
          >
            <svg class="w-5 h-5" fill={isInterested ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>

          {#if showShare}
            <button
              on:click={handleShare}
              aria-label="Event teilen"
              class="px-3 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
              </svg>
            </button>
          {/if}
        </div>
      {/if}

      <!-- Stats -->
      <div class="flex items-center justify-between text-sm text-gray-400">
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
          <span>{attendanceCount} teilnehmen</span>
        </div>
        
        <button
          on:click={() => goto(`/events/${event.id}`)}
          class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
        >
          Details →
        </button>
      </div>
    </div>
  </div>

{:else if variant === 'list'}
  <!-- List Layout -->
  <div class="group bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-lg p-4 transition-all duration-300 hover:shadow-lg">
    <div class="flex gap-4">
      <!-- Image -->
      <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        {#if !imageError}
          <img
            src={getImageUrl(event.cover_image_url)}
            alt={event.title}
            class="w-full h-full object-cover"
            on:error={() => imageError = true}
          />
        {:else}
          <div class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <svg class="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white mb-1 truncate group-hover:text-purple-300 transition-colors">
              {event.title}
            </h3>
            
            <div class="flex items-center gap-4 text-sm text-gray-300 mb-2">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{formatDate(event.date_time)} • {formatTime(event.date_time)}</span>
              </div>
              
              {#if event.location_name}
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  <span class="truncate">{event.location_name}</span>
                </div>
              {/if}
            </div>

            {#if event.genres && event.genres.length > 0}
              <div class="flex flex-wrap gap-1">
                {#each event.genres.slice(0, 2) as genre}
                  <span class="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                    {genre}
                  </span>
                {/each}
              </div>
            {/if}
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 ml-4">
            {#if event.price_min !== null}
              <span class="text-white font-medium">
                {formatPrice(event.price_min)}
              </span>
            {/if}
            
            <button
              on:click={() => goto(`/events/${event.id}`)}
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

{:else}
  <!-- Compact Layout -->
  <div class="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-3 transition-all duration-300">
    <div class="flex items-center gap-3">
      <!-- Small Image -->
      <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        {#if !imageError}
          <img
            src={getImageUrl(event.cover_image_url)}
            alt={event.title}
            class="w-full h-full object-cover"
            on:error={() => imageError = true}
          />
        {:else}
          <div class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13"/>
            </svg>
          </div>
        {/if}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4 class="text-white font-medium truncate group-hover:text-purple-300 transition-colors">
          {event.title}
        </h4>
        <p class="text-sm text-gray-400 truncate">
          {formatDate(event.date_time)} • {event.location_name || 'TBA'}
        </p>
      </div>

      <!-- Action -->
      <button
        on:click={() => goto(`/events/${event.id}`)}
        aria-label="Event Details anzeigen"
        class="text-purple-400 hover:text-purple-300 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
