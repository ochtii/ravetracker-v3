<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { user, isAdmin } from '$lib/stores/auth'
  import { currentEvent, eventActions } from '$lib/stores/events'
  // import { realtimeManager } from '$lib/realtime/realtime-stores'
  import { subscribeToEvent, unsubscribeFromEvent } from '$lib/realtime/realtime-service'
  import type { PageData } from './$types'
  import { cn } from '$lib/utils'

  export let data: PageData

  let loading = false
  let error = ''
  let isAttending = false
  let isInterested = false
  let attendanceCount = 0
  let interestedCount = 0
  let imageError = false
  let selectedImageIndex = 0
  let showImageGallery = false
  let hasSubscription = false

  const eventId = $page.params.id

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Kostenlos'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '/images/event-placeholder.jpg'
    if (imagePath.startsWith('http')) return imagePath
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/event-images/${imagePath}`
  }

  const handleAttend = async () => {
    if (!$user) {
      goto('/auth/login')
      return
    }

    loading = true
    try {
      if (isAttending) {
        await eventActions.leaveEvent(eventId)
        isAttending = false
        attendanceCount--
      } else {
        await eventActions.joinEvent(eventId)
        isAttending = true
        attendanceCount++
        // Remove interest if attending
        if (isInterested) {
          isInterested = false
          interestedCount--
        }
      }
    } catch (err: any) {
      error = err.message || 'Fehler beim Aktualisieren der Teilnahme'
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
        await eventActions.removeInterest(eventId)
        isInterested = false
        interestedCount--
      } else {
        await eventActions.showInterest(eventId)
        isInterested = true
        interestedCount++
        // Remove attendance if showing interest
        if (isAttending) {
          isAttending = false
          attendanceCount--
        }
      }
    } catch (err: any) {
      error = err.message || 'Fehler beim Aktualisieren des Interesses'
    } finally {
      loading = false
    }
  }

  const handleShare = () => {
    if (navigator.share && $currentEvent) {
      navigator.share({
        title: $currentEvent.title,
        text: $currentEvent.description || '',
        url: window.location.href
      })
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
    }
  }

  const openImageGallery = (index: number) => {
    selectedImageIndex = index
    showImageGallery = true
  }

  const closeImageGallery = () => {
    showImageGallery = false
  }

  const nextImage = () => {
    if ($currentEvent?.images) {
      selectedImageIndex = (selectedImageIndex + 1) % $currentEvent.images.length
    }
  }

  const prevImage = () => {
    if ($currentEvent?.images) {
      selectedImageIndex = selectedImageIndex === 0 
        ? $currentEvent.images.length - 1 
        : selectedImageIndex - 1
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (hasSubscription || !$user) return

    try {
      // Subscribe to event updates
      subscribeToEvent(eventId, $user)
      hasSubscription = true
    } catch (err) {
      console.error('Failed to setup realtime subscriptions:', err)
    }
  }

  onMount(async () => {
    if (browser) {
      // Load event details
      try {
        await eventActions.loadEvent(eventId)
        
        if ($user) {
          // Load user's attendance status
          const { data } = await eventActions.getUserAttendance(eventId)
          if (data) {
            isAttending = data.status === 'going'
            isInterested = data.status === 'interested'
          }
          
          // Setup real-time subscriptions
          setupRealtimeSubscriptions()
        }

        // Load attendance counts
        if ($currentEvent) {
          attendanceCount = $currentEvent.going_count || 0
          interestedCount = $currentEvent.interested_count || 0
        }

      } catch (err: any) {
        error = err.message || 'Event konnte nicht geladen werden'
      }
    }
  })

  onDestroy(() => {
    if (browser && hasSubscription && $user) {
      unsubscribeFromEvent(eventId, $user)
      hasSubscription = false
    }
  })

  // Handle keyboard navigation for image gallery
  const handleKeydown = (event: KeyboardEvent) => {
    if (showImageGallery) {
      switch (event.key) {
        case 'Escape':
          closeImageGallery()
          break
        case 'ArrowLeft':
          prevImage()
          break
        case 'ArrowRight':
          nextImage()
          break
      }
    }
  }
</script>

<svelte:head>
  {#if $currentEvent}
    <title>{$currentEvent.title} - RaveTracker v3.0</title>
    <meta name="description" content={$currentEvent.description || `${$currentEvent.title} - Event Details auf RaveTracker`} />
    <meta property="og:title" content={$currentEvent.title} />
    <meta property="og:description" content={$currentEvent.description || ''} />
    <meta property="og:image" content={getImageUrl($currentEvent.cover_image_url)} />
    <meta property="og:url" content={$page.url.href} />
    <meta property="og:type" content="event" />
  {:else}
    <title>Event wird geladen... - RaveTracker v3.0</title>
  {/if}
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

{#if error}
  <!-- Error State -->
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
    <div class="bg-red-500/20 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
      <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <h1 class="text-2xl font-bold text-white mb-2">Event nicht gefunden</h1>
      <p class="text-red-300 mb-6">{error}</p>
      <button
        on:click={() => goto('/events')}
        class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
      >
        Zurück zu Events
      </button>
    </div>
  </div>

{:else if !$currentEvent}
  <!-- Loading State -->
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-white text-lg">Event wird geladen...</p>
    </div>
  </div>

{:else}
  <!-- Event Details -->
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
    <!-- Hero Section -->
    <div class="relative h-96 md:h-[500px] overflow-hidden">
      {#if !imageError}
        <img
          src={getImageUrl($currentEvent.cover_image_url)}
          alt={$currentEvent.title}
          class="w-full h-full object-cover"
          on:error={() => imageError = true}
        />
      {:else}
        <div class="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <svg class="w-24 h-24 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
        </div>
      {/if}
      
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/50"></div>
      
      <!-- Content -->
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div class="container mx-auto">
          <!-- Status Badge -->
          <div class="mb-4">
            <span class={cn(
              "inline-block px-3 py-1 rounded-full text-sm font-medium",
              $currentEvent.status === 'published' ? "bg-green-500/20 text-green-300 border border-green-500/30" :
              $currentEvent.status === 'draft' ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
              "bg-red-500/20 text-red-300 border border-red-500/30"
            )}>
              {$currentEvent.status === 'published' ? 'Live' : 
               $currentEvent.status === 'draft' ? 'Draft' : 'Cancelled'}
            </span>
          </div>

          <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">{$currentEvent.title}</h1>
          
          <div class="flex flex-wrap items-center gap-6 text-lg text-gray-200">
            <div class="flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>{formatDate($currentEvent.date_time)}</span>
            </div>

            <div class="flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>{formatTime($currentEvent.date_time)}</span>
            </div>

            {#if $currentEvent.location_name}
              <div class="flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span>{$currentEvent.location_name}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <button
        on:click={() => history.back()}
        class="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
        aria-label="Zurück"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- Edit Button (for admins/organizers) -->
      {#if $user && ($isAdmin || $currentEvent.organizer_id === $user.id)}
        <button
          on:click={() => goto(`/events/${eventId}/edit`)}
          class="absolute top-6 right-6 p-3 bg-purple-600/80 backdrop-blur-sm text-white rounded-full hover:bg-purple-700 transition-colors"
          aria-label="Event bearbeiten"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Description -->
          {#if $currentEvent.description}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 class="text-2xl font-semibold text-white mb-4">Beschreibung</h2>
              <div class="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {$currentEvent.description}
              </div>
            </div>
          {/if}

          <!-- Genres -->
          {#if $currentEvent.genres && $currentEvent.genres.length > 0}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 class="text-2xl font-semibold text-white mb-4">Genres</h2>
              <div class="flex flex-wrap gap-3">
                {#each $currentEvent.genres as genre}
                  <span class="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
                    {genre}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Gallery -->
          {#if $currentEvent.images && $currentEvent.images.length > 0}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 class="text-2xl font-semibold text-white mb-4">Galerie</h2>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                {#each $currentEvent.images as image, index}
                  <button
                    on:click={() => openImageGallery(index)}
                    class="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt="Event Bild {index + 1}"
                      class="w-full h-full object-cover"
                    />
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Additional Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#if $currentEvent.dress_code}
              <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-white mb-2">Dress Code</h3>
                <p class="text-gray-300">{$currentEvent.dress_code}</p>
              </div>
            {/if}

            {#if $currentEvent.age_restriction}
              <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-white mb-2">Altersfreigabe</h3>
                <p class="text-gray-300">Ab {$currentEvent.age_restriction} Jahren</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Action Buttons -->
          {#if $user && $currentEvent.status === 'published'}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div class="space-y-4">
                <button
                  on:click={handleAttend}
                  disabled={loading}
                  class={cn(
                    "w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200",
                    isAttending 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  )}
                >
                  {loading ? 'Wird aktualisiert...' : isAttending ? 'Teilnahme bestätigt' : 'Teilnehmen'}
                </button>

                <button
                  on:click={handleInterest}
                  disabled={loading}
                  class={cn(
                    "w-full px-6 py-3 rounded-lg font-medium transition-all duration-200",
                    isInterested 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  )}
                >
                  {isInterested ? 'Interesse entfernen' : 'Interessiert'}
                </button>

                <button
                  on:click={handleShare}
                  class="w-full px-6 py-3 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                  </svg>
                  Teilen
                </button>
              </div>
            </div>
          {:else if !$user}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
              <p class="text-gray-300 mb-4">Melde dich an, um an diesem Event teilzunehmen</p>
              <button
                on:click={() => goto('/auth/login')}
                class="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Anmelden
              </button>
            </div>
          {/if}

          <!-- Event Stats -->
          <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Event-Statistiken</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Teilnehmer</span>
                <span class="text-white font-medium">{attendanceCount}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-300">Interessiert</span>
                <span class="text-white font-medium">{interestedCount}</span>
              </div>
              {#if $currentEvent.capacity}
                <div class="flex items-center justify-between">
                  <span class="text-gray-300">Kapazität</span>
                  <span class="text-white font-medium">{$currentEvent.capacity}</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style="width: {Math.min((attendanceCount / $currentEvent.capacity) * 100, 100)}%"
                  ></div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Event Details -->
          <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Event-Details</h3>
            <div class="space-y-3">
              {#if $currentEvent.price_min !== null}
                <div class="flex items-center justify-between">
                  <span class="text-gray-300">Preis</span>
                  <span class="text-white font-medium">
                    {#if $currentEvent.price_max && $currentEvent.price_max !== $currentEvent.price_min}
                      {formatPrice($currentEvent.price_min)} - {formatPrice($currentEvent.price_max)}
                    {:else}
                      {formatPrice($currentEvent.price_min)}
                    {/if}
                  </span>
                </div>
              {/if}

              {#if $currentEvent.end_time}
                <div class="flex items-center justify-between">
                  <span class="text-gray-300">Ende</span>
                  <span class="text-white font-medium">
                    {formatDate($currentEvent.end_time)} - {formatTime($currentEvent.end_time)}
                  </span>
                </div>
              {/if}

              {#if $currentEvent.location_address}
                <div>
                  <span class="text-gray-300 block mb-1">Adresse</span>
                  <span class="text-white">{$currentEvent.location_address}</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Contact & Links -->
          {#if $currentEvent.website_url || $currentEvent.facebook_url || $currentEvent.instagram_url}
            <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h3 class="text-lg font-semibold text-white mb-4">Links</h3>
              <div class="space-y-3">
                {#if $currentEvent.website_url}
                  <a
                    href={$currentEvent.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Website
                  </a>
                {/if}

                {#if $currentEvent.facebook_url}
                  <a
                    href={$currentEvent.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                {/if}

                {#if $currentEvent.instagram_url}
                  <a
                    href={$currentEvent.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.197-1.559-.748-.948-.878-2.108-.355-3.197.523-1.089 1.611-1.833 2.891-1.833 1.72 0 3.117 1.397 3.117 3.117-.001 1.72-1.398 3.116-3.118 3.116l-.338-.644zm7.138 0c-1.297 0-2.448-.611-3.197-1.559-.748-.948-.878-2.108-.355-3.197.523-1.089 1.611-1.833 2.891-1.833 1.72 0 3.117 1.397 3.117 3.117-.001 1.72-1.398 3.116-3.118 3.116l-.338-.644z"/>
                    </svg>
                    Instagram
                  </a>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Image Gallery Modal -->
  {#if showImageGallery && $currentEvent?.images}
    <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <!-- Close Button -->
      <button
        on:click={closeImageGallery}
        class="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        aria-label="Galerie schließen"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Navigation -->
      {#if $currentEvent.images.length > 1}
        <button
          on:click={prevImage}
          class="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label="Vorheriges Bild"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <button
          on:click={nextImage}
          class="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label="Nächstes Bild"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      {/if}

      <!-- Image -->
      <img
        src={getImageUrl($currentEvent.images[selectedImageIndex])}
        alt="Event Bild {selectedImageIndex + 1}"
        class="max-w-full max-h-full object-contain"
        on:click={closeImageGallery}
      />

      <!-- Image Counter -->
      {#if $currentEvent.images.length > 1}
        <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {selectedImageIndex + 1} / {$currentEvent.images.length}
        </div>
      {/if}
    </div>
  {/if}
{/if}
