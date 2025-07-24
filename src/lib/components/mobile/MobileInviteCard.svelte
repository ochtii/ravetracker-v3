<!--
  RaveTracker v3.0 - Mobile-Optimized Invite Card
  ===============================================
  Swipe-to-delete, haptic feedback, and optimized mobile interactions
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { fade, fly } from 'svelte/transition'
  import { inviteService } from '$lib/services/invite-service'
  import MobileButton from './MobileButton.svelte'
  import type { Invite } from '$lib/types/invite'

  export let invite: Invite
  export let supportsVibration = false

  const dispatch = createEventDispatcher<{
    deleted: { inviteId: string }
    shared: { invite: Invite }
    copied: { code: string }
  }>()

  // State
  let deleting = false
  let sharing = false
  let copied = false
  let showActions = false
  let confirmDelete = false

  // Swipe state
  let cardElement: HTMLElement
  let startX = 0
  let currentX = 0
  let isDragging = false
  let swipeDistance = 0
  let swipeThreshold = 80 // pixels

  // Mobile detection
  let isOnline = true
  let supportsShare = false
  let isStandalone = false

  onMount(() => {
    if (browser) {
      isOnline = navigator.onLine
      supportsShare = 'share' in navigator
      isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Network listeners
      window.addEventListener('online', () => isOnline = true)
      window.addEventListener('offline', () => isOnline = false)
    }
  })

  // Computed properties
  $: isExpired = new Date(invite.expires_at) <= new Date()
  $: isUsed = !!invite.used_at
  $: isActive = invite.is_active && !isUsed && !isExpired
  $: statusColor = isUsed ? 'text-green-400' : isExpired ? 'text-red-400' : 'text-blue-400'
  $: statusText = isUsed ? 'Verwendet' : isExpired ? 'Abgelaufen' : 'Aktiv'
  $: canDelete = !isUsed && isActive
  $: inviteUrl = `${window?.location?.origin || ''}/invite/${invite.code}`

  // Swipe handlers
  const handleTouchStart = (event: TouchEvent) => {
    if (!canDelete) return
    
    startX = event.touches[0].clientX
    currentX = startX
    isDragging = true
    
    if (supportsVibration) {
      navigator.vibrate(10)
    }
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging || !canDelete) return
    
    currentX = event.touches[0].clientX
    swipeDistance = Math.min(0, currentX - startX) // Only allow left swipe
    
    // Apply resistance at the threshold
    if (Math.abs(swipeDistance) > swipeThreshold) {
      const excess = Math.abs(swipeDistance) - swipeThreshold
      swipeDistance = -swipeThreshold - (excess * 0.3)
    }
    
    if (cardElement) {
      cardElement.style.transform = `translateX(${swipeDistance}px)`
    }
    
    // Haptic feedback when reaching threshold
    if (Math.abs(swipeDistance) >= swipeThreshold && supportsVibration) {
      navigator.vibrate(50)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || !canDelete) return
    
    isDragging = false
    
    if (Math.abs(swipeDistance) >= swipeThreshold) {
      // Show delete confirmation
      showDeleteActions()
    } else {
      // Reset position
      resetCardPosition()
    }
  }

  const resetCardPosition = () => {
    if (cardElement) {
      cardElement.style.transform = 'translateX(0px)'
      cardElement.style.transition = 'transform 0.3s ease-out'
      setTimeout(() => {
        if (cardElement) {
          cardElement.style.transition = ''
        }
      }, 300)
    }
    swipeDistance = 0
  }

  const showDeleteActions = () => {
    showActions = true
    resetCardPosition()
  }

  // Action handlers
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invite.code)
      copied = true
      dispatch('copied', { code: invite.code })
      
      if (supportsVibration) {
        navigator.vibrate([100, 50, 100])
      }
      
      setTimeout(() => copied = false, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareInvite = async () => {
    if (!supportsShare) {
      copyToClipboard()
      return
    }

    sharing = true

    try {
      await navigator.share({
        title: 'RaveTracker Einladung',
        text: `Du bist eingeladen! Verwende diesen Code: ${invite.code}`,
        url: inviteUrl
      })
      
      dispatch('shared', { invite })
      
      if (supportsVibration) {
        navigator.vibrate(100)
      }
    } catch (err) {
      // User cancelled or error - fallback to copy
      if (err.name !== 'AbortError') {
        copyToClipboard()
      }
    } finally {
      sharing = false
    }
  }

  const deleteInvite = async () => {
    if (!canDelete || deleting) return

    deleting = true

    try {
      await inviteService.deleteInvite(invite.id)
      dispatch('deleted', { inviteId: invite.id })
      
      if (supportsVibration) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (err) {
      console.error('Failed to delete invite:', err)
      if (supportsVibration) {
        navigator.vibrate([300])
      }
    } finally {
      deleting = false
      confirmDelete = false
      showActions = false
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    if (days < 0) {
      return `Vor ${Math.abs(days)} Tag${Math.abs(days) !== 1 ? 'en' : ''}`
    } else if (days === 0) {
      return 'Heute'
    } else if (days === 1) {
      return 'Morgen'
    } else {
      return `In ${days} Tag${days !== 1 ? 'en' : ''}`
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
</script>

<!-- Main Card -->
<div 
  class="mobile-invite-card relative overflow-hidden"
  class:swiping={isDragging}
>
  <!-- Background delete indicator -->
  {#if canDelete}
    <div 
      class="absolute right-0 top-0 h-full bg-red-600 flex items-center justify-center px-6 z-0"
      style="width: {Math.min(Math.abs(swipeDistance), 120)}px"
    >
      <svg 
        class="w-6 h-6 text-white transition-opacity duration-200"
        class:opacity-100={Math.abs(swipeDistance) >= swipeThreshold}
        class:opacity-50={Math.abs(swipeDistance) < swipeThreshold}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </div>
  {/if}

  <!-- Card Content -->
  <div
    bind:this={cardElement}
    class="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 rounded-xl p-4 select-none"
    class:cursor-pointer={canDelete}
    on:touchstart={handleTouchStart}
    on:touchmove={handleTouchMove}
    on:touchend={handleTouchEnd}
    on:click={() => !isDragging && !showActions && copyToClipboard()}
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <!-- Invite Code -->
        <div class="flex items-center gap-2 mb-1">
          <code class="text-lg font-mono font-bold text-white bg-black/20 px-2 py-1 rounded">
            {invite.code}
          </code>
          {#if copied}
            <span 
              class="text-xs text-green-400 flex items-center gap-1"
              in:fade={{ duration: 200 }}
              out:fade={{ duration: 200 }}
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              Kopiert!
            </span>
          {/if}
        </div>

        <!-- Status -->
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1">
            <div 
              class="w-2 h-2 rounded-full {isActive ? 'bg-green-400' : isUsed ? 'bg-blue-400' : 'bg-red-400'}"
            ></div>
            <span class="text-sm {statusColor} font-medium">{statusText}</span>
          </div>
          
          {#if !isOnline}
            <span class="text-xs text-amber-400">(Offline)</span>
          {/if}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-1">
        {#if isActive}
          <button
            class="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
            on:click|stopPropagation={shareInvite}
            disabled={sharing}
            title="Teilen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        {/if}

        {#if canDelete}
          <button
            class="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
            on:click|stopPropagation={showDeleteActions}
            title="Löschen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Details -->
    <div class="space-y-2 text-sm text-white/70">
      <!-- Created -->
      <div class="flex items-center justify-between">
        <span>Erstellt:</span>
        <span>{formatDate(invite.created_at)} um {formatTime(invite.created_at)}</span>
      </div>

      <!-- Expires -->
      <div class="flex items-center justify-between">
        <span>Läuft ab:</span>
        <span class="{isExpired ? 'text-red-400' : 'text-white/70'}">
          {formatDate(invite.expires_at)} um {formatTime(invite.expires_at)}
        </span>
      </div>

      <!-- Used -->
      {#if invite.used_at}
        <div class="flex items-center justify-between">
          <span>Verwendet:</span>
          <span class="text-green-400">
            {formatDate(invite.used_at)} um {formatTime(invite.used_at)}
          </span>
        </div>
      {/if}

      <!-- Used by -->
      {#if invite.used_by_user_id}
        <div class="flex items-center justify-between">
          <span>Verwendet von:</span>
          <span class="text-green-400">User #{invite.used_by_user_id.slice(-6)}</span>
        </div>
      {/if}
    </div>

    <!-- Swipe indicator -->
    {#if canDelete && !showActions}
      <div class="absolute top-1/2 right-4 transform -translate-y-1/2 text-white/30">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </div>
    {/if}
  </div>
</div>

<!-- Action Sheet -->
{#if showActions}
  <div 
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
    on:click={() => showActions = false}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 150 }}
  >
    <div 
      class="w-full bg-gradient-to-t from-gray-900 to-gray-800 rounded-t-3xl p-6 pb-8 max-h-80 overflow-y-auto"
      on:click|stopPropagation
      in:fly={{ y: 400, duration: 300 }}
      out:fly={{ y: 400, duration: 200 }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-white">Einladung verwalten</h3>
        <button
          class="p-2 text-white/60 hover:text-white rounded-lg"
          on:click={() => showActions = false}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Invite Info -->
      <div class="mb-6 p-4 bg-white/10 rounded-lg">
        <div class="text-center">
          <code class="text-xl font-mono font-bold text-white">{invite.code}</code>
          <div class="mt-2 text-sm text-white/70">
            Status: <span class="{statusColor}">{statusText}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        {#if isActive}
          <MobileButton
            variant="primary"
            size="lg"
            fullWidth
            on:click={shareInvite}
            disabled={sharing}
            loading={sharing}
            enableHaptic={supportsVibration}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            {supportsShare ? 'Teilen' : 'Code kopieren'}
          </MobileButton>
        {/if}

        <MobileButton
          variant="secondary"
          size="lg"
          fullWidth
          on:click={copyToClipboard}
          enableHaptic={supportsVibration}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Code kopieren
        </MobileButton>

        {#if canDelete}
          {#if confirmDelete}
            <div class="space-y-2">
              <MobileButton
                variant="danger"
                size="lg"
                fullWidth
                on:click={deleteInvite}
                disabled={deleting || !isOnline}
                loading={deleting}
                enableHaptic={supportsVibration}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Endgültig löschen
              </MobileButton>
              <MobileButton
                variant="secondary"
                size="md"
                fullWidth
                on:click={() => confirmDelete = false}
              >
                Abbrechen
              </MobileButton>
            </div>
          {:else}
            <MobileButton
              variant="danger"
              size="lg"
              fullWidth
              on:click={() => confirmDelete = true}
              disabled={!isOnline}
              enableHaptic={supportsVibration}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Einladung löschen
            </MobileButton>
          {/if}
        {/if}
      </div>

      <!-- Help text -->
      <div class="mt-6 text-xs text-white/50 text-center">
        {canDelete ? 'Wische nach links für Schnellzugriff auf Aktionen' : 'Tippe auf den Code zum Kopieren'}
      </div>
    </div>
  </div>
{/if}

<style>
  .mobile-invite-card {
    touch-action: pan-y;
  }

  .mobile-invite-card.swiping {
    touch-action: none;
  }

  /* Prevent text selection on touch */
  .mobile-invite-card .select-none {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* PWA safe area support */
  @media (display-mode: standalone) {
    .mobile-invite-card {
      margin-bottom: env(safe-area-inset-bottom, 0px);
    }
  }

  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .mobile-invite-card * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
