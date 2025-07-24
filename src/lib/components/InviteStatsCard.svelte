<script lang="ts">
  export let title: string;
  export let value: string | number;
  export let change: string = '';
  export let changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
  export let icon: string = '';
  export let color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'indigo' = 'blue';
  export let loading: boolean = false;
  export let onclick: (() => void) | undefined = undefined;

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      value: 'text-blue-300'
    },
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      value: 'text-purple-300'
    },
    green: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      value: 'text-green-300'
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      value: 'text-red-300'
    },
    orange: {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      value: 'text-orange-300'
    },
    indigo: {
      bg: 'bg-indigo-500/20',
      text: 'text-indigo-400',
      value: 'text-indigo-300'
    }
  };

  const changeClasses = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-white/60'
  };

  $: colorClass = colorClasses[color];
  $: changeClass = changeClasses[changeType];
</script>

<div 
  class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 {onclick ? 'cursor-pointer hover:scale-105' : ''}"
  on:click={onclick}
  role={onclick ? 'button' : 'none'}
  tabindex={onclick ? 0 : -1}
  on:keydown={(e) => {
    if (onclick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onclick();
    }
  }}
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <p class="text-white/70 text-sm font-medium mb-1">
        {title}
      </p>
      
      {#if loading}
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 border-2 border-white/30 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-white/50 text-lg">Lädt...</span>
        </div>
      {:else}
        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
          </p>
          
          {#if change}
            <span class="text-xs font-medium {changeClass}">
              {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}{change}
            </span>
          {/if}
        </div>
      {/if}
    </div>

    {#if icon}
      <div class="w-12 h-12 {colorClass.bg} rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
        {#if icon === 'users'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        {:else if icon === 'invites'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        {:else if icon === 'credits'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        {:else if icon === 'conversion'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        {:else if icon === 'active'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        {:else if icon === 'warning'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        {:else if icon === 'chart'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        {:else if icon === 'time'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else if icon === 'trend-up'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        {:else if icon === 'trend-down'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        {:else if icon === 'security'}
          <svg class="w-6 h-6 {colorClass.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        {:else}
          <!-- Custom icon slot -->
          <div class="w-6 h-6 {colorClass.text}">
            {icon}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if onclick}
    <div class="mt-3 pt-3 border-t border-white/10">
      <div class="flex items-center text-white/60 text-sm group-hover:text-white/80 transition-colors">
        <span>Klicken für Details</span>
        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  {/if}
</div>
