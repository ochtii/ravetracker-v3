<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { user } from '$lib/stores/auth'
  import { 
    initializeRealtimeSystem, 
    sendAdminBroadcast, 
    sendLiveEventUpdate 
  } from '$lib/realtime/realtime-service'
  import { 
    connectionHealth,
    adminBroadcasts,
    liveEventFeed
  } from '$lib/realtime/realtime-stores'
  import { hasRole } from '$lib/utils/auth'

  let broadcastForm = {
    type: 'general',
    title: '',
    message: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'critical'
  }

  let eventUpdateForm = {
    eventId: '',
    type: 'announcement' as 'status' | 'location' | 'time' | 'lineup' | 'announcement',
    message: ''
  }

  let isAdmin = false

  onMount(() => {
    // Initialize realtime system
    initializeRealtimeSystem($user)

    // Check admin status
    isAdmin = $user ? hasRole($user, 'admin') : false
  })

  async function handleSendBroadcast() {
    if (!broadcastForm.title || !broadcastForm.message) return

    try {
      await sendAdminBroadcast({
        type: broadcastForm.type,
        title: broadcastForm.title,
        message: broadcastForm.message,
        priority: broadcastForm.priority
      })

      // Reset form
      broadcastForm = {
        type: 'general',
        title: '',
        message: '',
        priority: 'normal'
      }

      alert('Broadcast sent successfully!')
    } catch (error) {
      console.error('Error sending broadcast:', error)
      alert('Failed to send broadcast')
    }
  }

  async function handleSendEventUpdate() {
    if (!eventUpdateForm.eventId || !eventUpdateForm.message) return

    try {
      await sendLiveEventUpdate(eventUpdateForm.eventId, {
        type: eventUpdateForm.type,
        message: eventUpdateForm.message
      })

      // Reset form
      eventUpdateForm = {
        eventId: '',
        type: 'announcement',
        message: ''
      }

      alert('Event update sent successfully!')
    } catch (error) {
      console.error('Error sending event update:', error)
      alert('Failed to send event update')
    }
  }

  function clearBroadcasts() {
    adminBroadcasts.set([])
  }

  function clearEventFeed() {
    liveEventFeed.set([])
  }

  function formatTimestamp(timestamp: string) {
    return new Date(timestamp).toLocaleString()
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
  <div class="max-w-6xl mx-auto space-y-6">
    
    <!-- Page Header -->
    <div class="glass-card p-6 bg-glass-surface border-glass-surface-border">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-white mb-2">Realtime Dashboard</h1>
          <p class="text-glass-text-secondary">
            Monitor and manage real-time features across RaveTracker
          </p>
        </div>
        
        <!-- Connection Status -->
        <div class="flex items-center space-x-3">
          <div class="text-right">
            <div class="text-sm font-medium text-white">
              Connection Status
            </div>
            <div class="text-xs text-glass-text-secondary">
              {$connectionHealth.statusText}
            </div>
          </div>
          
          <div class="w-4 h-4 rounded-full {$connectionHealth.isConnected ? 'bg-green-400' : $connectionHealth.isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}"></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Admin Broadcast Panel -->
      {#if isAdmin}
        <div class="glass-card p-6 bg-glass-surface border-glass-surface-border">
          <h2 class="text-xl font-semibold text-white mb-4">Admin Broadcasts</h2>
          
          <form on:submit|preventDefault={handleSendBroadcast} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Broadcast Type
              </label>
              <select 
                bind:value={broadcastForm.type}
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-glass-accent"
              >
                <option value="general">General</option>
                <option value="system_maintenance">System Maintenance</option>
                <option value="feature_announcement">Feature Announcement</option>
                <option value="emergency_alert">Emergency Alert</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Priority
              </label>
              <select 
                bind:value={broadcastForm.priority}
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-glass-accent"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Title
              </label>
              <input
                type="text"
                bind:value={broadcastForm.title}
                placeholder="Broadcast title..."
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white placeholder-glass-text-muted focus:outline-none focus:ring-2 focus:ring-glass-accent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Message
              </label>
              <textarea
                bind:value={broadcastForm.message}
                placeholder="Broadcast message..."
                rows="3"
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white placeholder-glass-text-muted focus:outline-none focus:ring-2 focus:ring-glass-accent resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full btn-primary"
              disabled={!broadcastForm.title || !broadcastForm.message}
            >
              Send Broadcast
            </button>
          </form>
        </div>

        <!-- Live Event Updates Panel -->
        <div class="glass-card p-6 bg-glass-surface border-glass-surface-border">
          <h2 class="text-xl font-semibold text-white mb-4">Live Event Updates</h2>
          
          <form on:submit|preventDefault={handleSendEventUpdate} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Event ID
              </label>
              <input
                type="text"
                bind:value={eventUpdateForm.eventId}
                placeholder="Event UUID..."
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white placeholder-glass-text-muted focus:outline-none focus:ring-2 focus:ring-glass-accent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Update Type
              </label>
              <select 
                bind:value={eventUpdateForm.type}
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-glass-accent"
              >
                <option value="status">Status Change</option>
                <option value="location">Location Update</option>
                <option value="time">Time Change</option>
                <option value="lineup">Lineup Update</option>
                <option value="announcement">General Announcement</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-glass-text-secondary mb-2">
                Update Message
              </label>
              <textarea
                bind:value={eventUpdateForm.message}
                placeholder="Event update message..."
                rows="3"
                class="w-full bg-glass-input border border-glass-input-border rounded-lg px-3 py-2 text-white placeholder-glass-text-muted focus:outline-none focus:ring-2 focus:ring-glass-accent resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full btn-secondary"
              disabled={!eventUpdateForm.eventId || !eventUpdateForm.message}
            >
              Send Update
            </button>
          </form>
        </div>
      {:else}
        <!-- Non-admin message -->
        <div class="glass-card p-6 bg-glass-surface border-glass-surface-border lg:col-span-2">
          <div class="text-center py-8">
            <svg class="w-16 h-16 text-glass-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <h3 class="text-lg font-semibold text-white mb-2">Admin Access Required</h3>
            <p class="text-glass-text-secondary">
              You need administrator privileges to send broadcasts and manage live events.
            </p>
          </div>
        </div>
      {/if}
    </div>

    <!-- Recent Broadcasts -->
    <div class="glass-card p-6 bg-glass-surface border-glass-surface-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">Recent Broadcasts</h2>
        <button
          on:click={clearBroadcasts}
          class="text-glass-text-muted hover:text-glass-text-secondary transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3 max-h-96 overflow-y-auto">
        {#each $adminBroadcasts as broadcast (broadcast.id)}
          <div class="glass-card p-4 bg-glass-primary/10 border-glass-primary-border">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-xs font-medium text-glass-accent uppercase tracking-wide">
                    {broadcast.type.replace('_', ' ')}
                  </span>
                  <span class="text-xs px-2 py-1 rounded {broadcast.priority === 'critical' ? 'bg-red-500/20 text-red-400' : broadcast.priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-glass-text-muted/20 text-glass-text-muted'}">
                    {broadcast.priority}
                  </span>
                </div>
                <h3 class="text-sm font-semibold text-white">{broadcast.title}</h3>
                <p class="text-sm text-glass-text-secondary mt-1">{broadcast.message}</p>
                <span class="text-xs text-glass-text-muted mt-2 block">
                  {formatTimestamp(broadcast.timestamp)}
                </span>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center py-8 text-glass-text-secondary">
            No broadcasts yet
          </div>
        {/each}
      </div>
    </div>

    <!-- Live Event Feed -->
    <div class="glass-card p-6 bg-glass-surface border-glass-surface-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-white">Live Event Feed</h2>
        <button
          on:click={clearEventFeed}
          class="text-glass-text-muted hover:text-glass-text-secondary transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      
      <div class="space-y-3 max-h-96 overflow-y-auto">
        {#each $liveEventFeed.slice(0, 20) as update (update.id)}
          <div class="glass-card p-4 bg-glass-surface/50 border-glass-surface-border">
            <div class="flex items-start space-x-3">
              <div class="text-glass-accent mt-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-glass-text-secondary uppercase tracking-wide">
                    {update.type.replace('_', ' ')}
                  </span>
                  <span class="text-xs text-glass-text-muted">
                    {formatTimestamp(update.timestamp)}
                  </span>
                </div>
                <p class="text-sm text-white mt-1">{update.message}</p>
                <span class="text-xs text-glass-text-muted">Event: {update.eventId}</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center py-8 text-glass-text-secondary">
            No live events yet
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* Custom scrollbar for feed sections */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>
