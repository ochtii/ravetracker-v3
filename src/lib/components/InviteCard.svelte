<!--
  RaveTracker v3.0 - InviteCard Component
  ======================================
  Individual invite code display and management card
  Features: Copy, share, delete, status display, expiry warnings
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { browser } from '$app/environment'
  import { 
    Copy, 
    Share2, 
    Trash2, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    ExternalLink,
    User,
    Calendar,
    Mail
  } from 'lucide-svelte'
  import { inviteService } from '$lib/services/invite-service'
  import type { Invite } from '$lib/types/invite'

  // Props
  export let invite: Invite
  export let userId: string

  // Events
  const dispatch = createEventDispatcher<{
    deleted: { inviteId: string, restored: boolean }
    refreshNeeded: void
  }>()

  // Component state
  let deleting = false
  let copied = false
  let shareModalOpen = false
  let deleteConfirmOpen = false

  // Computed values
  $: isExpired = new Date(invite.expires_at) <= new Date()
  $: isUsed = invite.used_at !== null
  $: isActive = invite.is_active && !isUsed && !isExpired
  
  $: expiresIn = (() => {
    const now = new Date()
    const expiry = new Date(invite.expires_at)
    const diffMs = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMs < 0) return 'Abgelaufen'
    if (diffDays === 0) return 'Läuft heute ab'
    if (diffDays === 1) return 'Läuft morgen ab'
    if (diffDays <= 7) return `${diffDays} Tage`
    return `${diffDays} Tage`
  })()

  $: statusColor = (() => {
    if (isUsed) return 'text-green-400'
    if (isExpired) return 'text-red-400'
    if (expiresIn.includes('heute') || expiresIn.includes('morgen')) return 'text-amber-400'
    return 'text-blue-400'
  })()

  $: statusIcon = (() => {
    if (isUsed) return CheckCircle
    if (isExpired) return AlertTriangle
    if (expiresIn.includes('heute') || expiresIn.includes('morgen')) return Clock
    return Clock
  })()

  $: canDelete = isActive && !isUsed

  // Copy to clipboard
  async function copyCode() {
    if (!browser || copied) return
    
    try {
      await navigator.clipboard.writeText(invite.code)
      copied = true
      setTimeout(() => copied = false, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  // Share functionality
  function openShareModal() {
    shareModalOpen = true
  }

  function closeShareModal() {
    shareModalOpen = false
  }

  // Share via email
  function shareViaEmail() {
    const subject = encodeURIComponent('RaveTracker Invite-Code')
    const body = encodeURIComponent(
      `Hi!\n\nIch lade dich zu RaveTracker ein! Verwende den folgenden Code bei der Registrierung:\n\n${invite.code}\n\nRegistriere dich hier: ${window.location.origin}/auth/register\n\nSee you on the dancefloor! 🎵`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
    closeShareModal()
  }

  // Share via web share API
  async function shareNative() {
    if (!navigator.share) return
    
    try {
      await navigator.share({
        title: 'RaveTracker Invite-Code',
        text: `Verwende den Code ${invite.code} bei der Registrierung auf RaveTracker!`,
        url: `${window.location.origin}/auth/register`
      })
      closeShareModal()
    } catch (err) {
      // User cancelled or error occurred
    }
  }

  // Copy share link
  async function copyShareText() {
    const shareText = `Hey! Ich lade dich zu RaveTracker ein! 🎵\n\nVerwende den Code: ${invite.code}\n\nRegistriere dich hier: ${window.location.origin}/auth/register`
    
    try {
      await navigator.clipboard.writeText(shareText)
      copied = true
      setTimeout(() => copied = false, 2000)
      closeShareModal()
    } catch (err) {
      console.error('Failed to copy share text:', err)
    }
  }

  // Delete invite
  function confirmDelete() {
    if (!canDelete) return
    deleteConfirmOpen = true
  }

  function cancelDelete() {
    deleteConfirmOpen = false
  }

  async function deleteInvite() {
    if (deleting || !canDelete) return
    
    deleting = true
    
    try {
      await inviteService.deleteUnusedInvite(invite.id, userId)
      dispatch('deleted', { inviteId: invite.id, restored: canDelete })
      deleteConfirmOpen = false
    } catch (err: any) {
      console.error('Failed to delete invite:', err)
      // Keep modal open on error
    } finally {
      deleting = false
    }
  }

  // Format date
  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle outside clicks for modals
  function handleOutsideClick(event: MouseEvent) {
    if (shareModalOpen) {
      const target = event.target as HTMLElement
      if (!target.closest('.share-modal')) {
        closeShareModal()
      }
    }
    if (deleteConfirmOpen) {
      const target = event.target as HTMLElement
      if (!target.closest('.delete-modal')) {
        cancelDelete()
      }
    }
  }
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="invite-card {isUsed ? 'used' : isExpired ? 'expired' : 'active'}">
  <!-- Header with code and status -->
  <div class="card-header">
    <div class="code-section">
      <div class="invite-code">{invite.code}</div>
      <div class="status {statusColor}">
        <svelte:component this={statusIcon} class="w-4 h-4" />
        {#if isUsed}
          Verwendet
        {:else if isExpired}
          Abgelaufen
        {:else}
          {expiresIn}
        {/if}
      </div>
    </div>

    <div class="actions">
      {#if isActive}
        <button
          on:click={copyCode}
          disabled={copied}
          class="action-btn"
          title="Code kopieren"
        >
          <Copy class="w-4 h-4" />
          {copied ? '✓' : ''}
        </button>

        <button
          on:click={openShareModal}
          class="action-btn"
          title="Code teilen"
        >
          <Share2 class="w-4 h-4" />
        </button>
      {/if}

      {#if canDelete}
        <button
          on:click={confirmDelete}
          class="action-btn danger"
          title="Code löschen"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      {/if}
    </div>
  </div>

  <!-- Details -->
  <div class="card-details">
    <div class="detail-row">
      <div class="detail-item">
        <Calendar class="w-4 h-4 text-white/50" />
        <span class="text-sm text-white/70">Erstellt: {formatDate(invite.created_at)}</span>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-item">
        <Clock class="w-4 h-4 text-white/50" />
        <span class="text-sm text-white/70">Läuft ab: {formatDate(invite.expires_at)}</span>
      </div>
    </div>

    {#if invite.used_at && invite.used_by_profile}
      <div class="detail-row">
        <div class="detail-item">
          <User class="w-4 h-4 text-green-400" />
          <span class="text-sm text-green-100">
            Verwendet von: {invite.used_by_profile.username}
          </span>
        </div>
        <div class="detail-item">
          <CheckCircle class="w-4 h-4 text-green-400" />
          <span class="text-sm text-white/70">{formatDate(invite.used_at)}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Expiry warning -->
  {#if isActive && (expiresIn.includes('heute') || expiresIn.includes('morgen') || (expiresIn.includes('Tage') && parseInt(expiresIn) <= 3))}
    <div class="warning-banner">
      <AlertTriangle class="w-4 h-4" />
      <span class="text-sm">
        {#if expiresIn.includes('heute')}
          Dieser Code läuft heute ab!
        {:else if expiresIn.includes('morgen')}
          Dieser Code läuft morgen ab!
        {:else}
          Dieser Code läuft in {expiresIn} ab!
        {/if}
      </span>
    </div>
  {/if}
</div>

<!-- Share Modal -->
{#if shareModalOpen}
  <div class="modal-overlay">
    <div class="share-modal">
      <div class="modal-header">
        <h3 class="text-lg font-semibold text-white">Code teilen</h3>
        <button on:click={closeShareModal} class="modal-close">×</button>
      </div>

      <div class="modal-content">
        <div class="share-code">
          <span class="text-white/70">Invite-Code:</span>
          <span class="font-mono font-bold text-white">{invite.code}</span>
        </div>

        <div class="share-options">
          <button on:click={shareViaEmail} class="share-option">
            <Mail class="w-5 h-5" />
            <span>Via E-Mail</span>
          </button>

          {#if browser && navigator.share}
            <button on:click={shareNative} class="share-option">
              <Share2 class="w-5 h-5" />
              <span>Teilen</span>
            </button>
          {/if}

          <button on:click={copyShareText} class="share-option">
            <Copy class="w-5 h-5" />
            <span>Text kopieren</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteConfirmOpen}
  <div class="modal-overlay">
    <div class="delete-modal">
      <div class="modal-header">
        <h3 class="text-lg font-semibold text-white">Code löschen</h3>
        <button on:click={cancelDelete} class="modal-close">×</button>
      </div>

      <div class="modal-content">
        <div class="delete-warning">
          <AlertTriangle class="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p class="text-white/90 text-center mb-4">
            Möchtest du den Code <strong class="font-mono">{invite.code}</strong> wirklich löschen?
          </p>
          <p class="text-white/70 text-center text-sm mb-6">
            Der Code wird deaktiviert und dein Credit wird zurückerstattet.
          </p>
        </div>

        <div class="modal-actions">
          <button
            on:click={cancelDelete}
            class="btn-secondary"
            disabled={deleting}
          >
            Abbrechen
          </button>
          <button
            on:click={deleteInvite}
            disabled={deleting}
            class="btn-danger"
          >
            {deleting ? 'Lösche...' : 'Löschen'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .invite-card {
    @apply bg-white/10 backdrop-blur-sm rounded-xl border border-white/20;
    @apply hover:bg-white/15 transition-all duration-200;
    @apply overflow-hidden;
  }

  .invite-card.used {
    @apply bg-green-600/10 border-green-500/30;
  }

  .invite-card.expired {
    @apply bg-red-600/10 border-red-500/30;
  }

  .invite-card.active {
    @apply bg-white/10 border-white/20;
  }

  .card-header {
    @apply p-4 pb-3 flex items-start justify-between;
  }

  .code-section {
    @apply flex-1 min-w-0;
  }

  .invite-code {
    @apply text-2xl font-mono font-bold text-white mb-1;
    @apply tracking-wider;
  }

  .status {
    @apply flex items-center gap-2 text-sm font-medium;
  }

  .actions {
    @apply flex gap-2 flex-shrink-0;
  }

  .action-btn {
    @apply w-8 h-8 flex items-center justify-center rounded-lg;
    @apply bg-white/10 hover:bg-white/20 text-white;
    @apply transition-colors duration-200 border border-white/20;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .action-btn.danger {
    @apply bg-red-600/20 hover:bg-red-600/30 border-red-500/30 text-red-100;
  }

  .card-details {
    @apply px-4 pb-4 space-y-2;
  }

  .detail-row {
    @apply flex flex-wrap gap-4;
  }

  .detail-item {
    @apply flex items-center gap-2;
  }

  .warning-banner {
    @apply bg-amber-600/20 border-t border-amber-500/30 p-3;
    @apply flex items-center gap-2 text-amber-100;
  }

  /* Modals */
  .modal-overlay {
    @apply fixed inset-0 bg-black/50 backdrop-blur-sm z-50;
    @apply flex items-center justify-center p-4;
  }

  .share-modal,
  .delete-modal {
    @apply bg-gray-900 border border-white/20 rounded-xl;
    @apply max-w-sm w-full max-h-[90vh] overflow-y-auto;
  }

  .modal-header {
    @apply p-4 border-b border-white/20 flex items-center justify-between;
  }

  .modal-close {
    @apply w-8 h-8 flex items-center justify-center text-white/70;
    @apply hover:text-white hover:bg-white/10 rounded-lg transition-colors;
  }

  .modal-content {
    @apply p-4;
  }

  .share-code {
    @apply bg-white/5 rounded-lg p-3 mb-4 text-center;
  }

  .share-options {
    @apply space-y-2;
  }

  .share-option {
    @apply w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg;
    @apply flex items-center gap-3 text-white transition-colors;
  }

  .delete-warning {
    @apply text-center;
  }

  .modal-actions {
    @apply flex gap-3 justify-end;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg;
    @apply border border-white/20 font-medium transition-colors duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-danger {
    @apply px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg;
    @apply font-medium transition-colors duration-200;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .invite-code {
      @apply text-xl;
    }

    .actions {
      @apply gap-1;
    }

    .action-btn {
      @apply w-7 h-7;
    }

    .detail-row {
      @apply flex-col gap-2;
    }

    .share-modal,
    .delete-modal {
      @apply mx-2;
    }
  }
</style>
