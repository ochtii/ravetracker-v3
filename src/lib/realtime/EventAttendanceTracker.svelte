<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { eventAttendance, eventCapacities, realtimeActions } from '$lib/realtime/realtime-stores'
  import { subscribeToEvent, unsubscribeFromEvent } from '$lib/realtime/realtime-service'
  import type { User } from '@supabase/supabase-js'
  
  export let eventId: string
  export let user: User | null = null
  export let showLiveUpdates = true
  export let showCapacityBar = true
  export let showAttendeeCount = true

  $: attendance = realtimeActions.getEventAttendanceCount(eventId)
  $: capacityInfo = realtimeActions.getEventCapacityInfo(eventId)

  let mounted = false

  onMount(() => {
    mounted = true
    // Subscribe to real-time updates for this event
    subscribeToEvent(eventId, user)
  })

  onDestroy(() => {
    if (mounted) {
      unsubscribeFromEvent(eventId)
    }
  })

  function getCapacityColor(percentage: number) {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    if (percentage >= 60) return 'bg-blue-500'
    return 'bg-green-500'
  }

  function getCapacityStatus(percentage: number) {
    if (percentage >= 100) return 'Full'
    if (percentage >= 80) return 'Almost Full'
    if (percentage >= 60) return 'Filling Up'
    return 'Available'
  }

  $: capacityPercentage = capacityInfo?.percentage || 0
  $: capacityColor = getCapacityColor(capacityPercentage)
  $: capacityStatus = getCapacityStatus(capacityPercentage)
</script>

<div class="space-y-4">
  
  <!-- Attendee Count -->
  {#if showAttendeeCount}
    <div class="glass-card p-4 bg-glass-surface border-glass-surface-border">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-glass-accent">
              {attendance.going}
            </div>
            <div class="text-xs text-glass-text-secondary">Going</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-glass-text-primary">
              {attendance.interested}
            </div>
            <div class="text-xs text-glass-text-secondary">Interested</div>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-white">
              {attendance.total}
            </div>
            <div class="text-xs text-glass-text-secondary">Total</div>
          </div>
        </div>

        {#if capacityInfo?.capacity}
          <div class="text-right">
            <div class="text-sm font-medium text-white">
              {capacityInfo.current} / {capacityInfo.capacity}
            </div>
            <div class="text-xs text-glass-text-secondary">
              {capacityStatus}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Capacity Bar -->
  {#if showCapacityBar && capacityInfo?.capacity}
    <div class="glass-card p-4 bg-glass-surface border-glass-surface-border">
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-white">Event Capacity</span>
          <span class="text-sm text-glass-text-secondary">
            {Math.round(capacityPercentage)}%
          </span>
        </div>
        
        <div class="w-full bg-glass-surface rounded-full h-3 border border-glass-surface-border overflow-hidden">
          <div 
            class="h-full {capacityColor} transition-all duration-500 ease-out rounded-full relative"
            style="width: {Math.min(capacityPercentage, 100)}%"
          >
            {#if capacityPercentage >= 100}
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center justify-between text-xs">
          <span class="text-glass-text-muted">0</span>
          <span class="text-glass-text-secondary font-medium">{capacityStatus}</span>
          <span class="text-glass-text-muted">{capacityInfo.capacity}</span>
        </div>

        {#if capacityPercentage >= 100 && capacityInfo.waitlist && capacityInfo.waitlist > 0}
          <div class="mt-3 p-2 bg-glass-warning/20 border border-glass-warning-border rounded-lg">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm text-yellow-400">
                {capacityInfo.waitlist} people on waitlist
              </span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Real-time Activity Indicator -->
  {#if showLiveUpdates}
    <div class="glass-card p-3 bg-glass-primary/20 border-glass-primary-border">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-glass-accent rounded-full animate-pulse"></div>
        <span class="text-sm text-glass-text-secondary">Live Updates Active</span>
        <svg class="w-4 h-4 text-glass-accent animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(var(--glass-accent-rgb), 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(var(--glass-accent-rgb), 0.8);
    }
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
</style>
