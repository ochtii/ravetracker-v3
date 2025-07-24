<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let level: 'unverified' | 'verified' | 'trusted' | 'moderator' | 'admin' = 'unverified';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showTooltip: boolean = true;
  export let inline: boolean = false;

  const dispatch = createEventDispatcher();

  let showTooltipContent = false;
  let tooltipTimeout: NodeJS.Timeout;

  const verificationLevels = {
    unverified: {
      label: 'Unverifiziert',
      description: 'Normaler Account ohne Verifizierung',
      icon: '👤',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      credits: 0
    },
    verified: {
      label: 'Verifiziert',
      description: 'Verifizierter Account mit grundlegender Bestätigung',
      icon: '✓',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      credits: 5
    },
    trusted: {
      label: 'Vertrauenswürdig',
      description: 'Hochverifizierter Account mit zusätzlichen Privilegien',
      icon: '⭐',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      credits: 10
    },
    moderator: {
      label: 'Moderator',
      description: 'Community-Moderator mit erweiterten Rechten',
      icon: '🛡️',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
      credits: 20
    },
    admin: {
      label: 'Administrator',
      description: 'System-Administrator mit vollständigen Rechten',
      icon: '👑',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      credits: 50
    }
  };

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'text-xs',
      tooltip: 'text-xs w-64'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'text-sm',
      tooltip: 'text-sm w-72'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'text-base',
      tooltip: 'text-base w-80'
    }
  };

  function handleMouseEnter() {
    if (!showTooltip) return;
    
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      showTooltipContent = true;
    }, 300);
  }

  function handleMouseLeave() {
    clearTimeout(tooltipTimeout);
    showTooltipContent = false;
  }

  function handleClick() {
    dispatch('click', { level });
  }

  $: config = verificationLevels[level];
  $: sizeConfig = sizeClasses[size];
</script>

<div class="relative {inline ? 'inline-block' : 'block'}">
  <!-- Badge -->
  <button
    class="
      {sizeConfig.badge}
      {config.bgColor}
      {config.borderColor}
      {config.color}
      border rounded-full font-medium
      hover:scale-105 active:scale-95
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-white/20
      {inline ? 'inline-flex' : 'flex'}
      items-center gap-2
    "
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:click={handleClick}
    title={showTooltip ? config.description : ''}
  >
    <span class="{sizeConfig.icon}" role="img" aria-label="Verification icon">
      {config.icon}
    </span>
    <span>{config.label}</span>
  </button>

  <!-- Enhanced Tooltip -->
  {#if showTooltip && showTooltipContent}
    <div
      class="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        {sizeConfig.tooltip}
        bg-gray-900/95 backdrop-blur-sm
        border border-white/20 rounded-lg
        p-4 shadow-xl
        z-50
        pointer-events-none
      "
    >
      <!-- Arrow -->
      <div class="absolute top-full left-1/2 transform -translate-x-1/2">
        <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
      </div>

      <!-- Content -->
      <div class="space-y-3">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <div class="
            w-8 h-8 rounded-full flex items-center justify-center
            {config.bgColor} {config.borderColor} border
          ">
            <span class="text-lg" role="img" aria-label="Verification icon">
              {config.icon}
            </span>
          </div>
          <div>
            <h4 class="{config.color} font-semibold">
              {config.label}
            </h4>
            <p class="text-white/60 text-xs">
              Verifizierungslevel
            </p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-white/80 leading-relaxed">
          {config.description}
        </p>

        <!-- Benefits -->
        <div class="space-y-2">
          <h5 class="text-white font-medium text-xs uppercase tracking-wider">
            Vorteile
          </h5>
          <div class="space-y-1 text-white/70">
            {#if config.credits > 0}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span class="text-xs">{config.credits} Invite-Credits</span>
              </div>
            {/if}
            
            {#if level === 'verified' || level === 'trusted' || level === 'moderator' || level === 'admin'}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs">Vertrauensvolle Kennzeichnung</span>
              </div>
            {/if}
            
            {#if level === 'trusted' || level === 'moderator' || level === 'admin'}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span class="text-xs">Erweiterte Features</span>
              </div>
            {/if}
            
            {#if level === 'moderator' || level === 'admin'}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span class="text-xs">Moderations-Rechte</span>
              </div>
            {/if}
            
            {#if level === 'admin'}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-xs">Admin-Kontrolle</span>
              </div>
            {/if}
            
            {#if level === 'unverified'}
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs">Grundfunktionen verfügbar</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Call to Action -->
        {#if level === 'unverified'}
          <div class="pt-2 border-t border-white/10">
            <button
              class="w-full py-2 px-3 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-blue-500 rounded-md hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              on:click={() => dispatch('verify-click')}
            >
              Jetzt verifizieren lassen
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom scrollbar for tooltip if needed */
  :global(.verification-tooltip) {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }
  
  :global(.verification-tooltip::-webkit-scrollbar) {
    width: 4px;
  }
  
  :global(.verification-tooltip::-webkit-scrollbar-track) {
    background: transparent;
  }
  
  :global(.verification-tooltip::-webkit-scrollbar-thumb) {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
</style>
