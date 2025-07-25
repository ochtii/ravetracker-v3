<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { userStore } from '$lib/stores/user';
	
	$: user = $userStore;
	
	// Mock data for featured content
	const featuredEvents = [
		{
			id: 1,
			name: 'Tomorrowland 2024',
			date: '2024-07-15',
			location: 'Boom, Belgium',
			image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
			price: '€299',
			attendees: 12500,
			featured: true
		},
		{
			id: 2,
			name: 'Ultra Music Festival',
			date: '2024-03-24',
			location: 'Miami, USA',
			image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
			price: '$449',
			attendees: 8200,
			featured: true
		},
		{
			id: 3,
			name: 'Awakenings Festival',
			date: '2024-06-29',
			location: 'Amsterdam, Netherlands',
			image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
			price: '€89',
			attendees: 6800,
			featured: true
		}
	];
	
	const featuredArtists = [
		{
			id: 1,
			name: 'David Guetta',
			genre: 'House',
			followers: 2400000,
			image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
			verified: true
		},
		{
			id: 2,
			name: 'Martin Garrix',
			genre: 'Progressive House',
			followers: 1800000,
			image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
			verified: true
		},
		{
			id: 3,
			name: 'Charlotte de Witte',
			genre: 'Techno',
			followers: 950000,
			image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=300&fit=crop',
			verified: true
		},
		{
			id: 4,
			name: 'Armin van Buuren',
			genre: 'Trance',
			followers: 2100000,
			image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
			verified: true
		}
	];
	
	const stats = [
		{ label: 'Active Events', value: '1,247', icon: 'M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z' },
		{ label: 'Verified Artists', value: '3,892', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ label: 'Listed Venues', value: '8,641', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
		{ label: 'Community Members', value: '247k', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
	];
	
	let mounted = false;
	
	onMount(() => {
		mounted = true;
	});
	
	function formatNumber(num: number): string {
		if (num >= 1000000) {
			return (num / 1000000).toFixed(1) + 'M';
		} else if (num >= 1000) {
			return (num / 1000).toFixed(1) + 'K';
		}
		return num.toString();
	}
</script>

<svelte:head>
	<title>RaveTracker - The Ultimate Electronic Music Event Platform</title>
	<meta name="description" content="Discover the best electronic music events, artists, and venues worldwide. Connect with the global rave community." />
</svelte:head>

<div class="relative">
	<!-- Hero Section -->
	<section class="relative overflow-hidden">
		<!-- Hero Background -->
		<div class="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-blue-900/30 to-cyan-900/50">
			<div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200')] bg-cover bg-center opacity-20" />
		</div>
		
		<div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
			{#if mounted}
				<div class="text-center space-y-8">
					<!-- Hero Title -->
					<div in:fly={{ y: 30, duration: 800, delay: 200, easing: quintOut }}>
						<h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
							Discover The
							<span class="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
								Ultimate
							</span>
							<br />Electronic Music Experience
						</h1>
					</div>
					
					<!-- Hero Subtitle -->
					<div in:fly={{ y: 30, duration: 800, delay: 400, easing: quintOut }}>
						<p class="text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto">
							Connect with the global rave community. Find events, discover artists, and explore venues worldwide.
						</p>
					</div>
					
					<!-- Hero CTA -->
					<div in:fly={{ y: 30, duration: 800, delay: 600, easing: quintOut }} class="flex flex-col sm:flex-row gap-4 justify-center items-center">
						{#if user}
							<a
								href="/events"
								class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Explore Events
							</a>
							<a
								href="/dashboard"
								class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
							>
								Go to Dashboard
							</a>
						{:else}
							<a
								href="/auth/register"
								class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Join the Community
							</a>
							<a
								href="/events"
								class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
							>
								Browse Events
							</a>
						{/if}
					</div>
					
					<!-- Stats -->
					<div in:fly={{ y: 30, duration: 800, delay: 800, easing: quintOut }} class="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
						{#each stats as stat, index}
							<div
								class="text-center"
								in:scale={{ duration: 600, delay: 1000 + index * 100, easing: quintOut }}
							>
								<div class="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
									<svg class="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
										<path d={stat.icon} />
									</svg>
								</div>
								<div class="text-3xl lg:text-4xl font-bold text-white">{stat.value}</div>
								<div class="text-sm text-gray-400">{stat.label}</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Floating Elements -->
		<div class="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
		<div class="absolute bottom-20 right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-pulse" style="animation-delay: 1s;" />
	</section>

	<!-- Featured Events Section -->
	<section class="py-20 relative">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">Featured Events</h2>
				<p class="text-xl text-gray-400">Don't miss out on the hottest electronic music events</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each featuredEvents as event, index}
					<div
						class="event-card group"
						in:fly={{ y: 30, duration: 600, delay: index * 100, easing: quintOut }}
					>
						<!-- Event Image -->
						<div class="relative overflow-hidden rounded-xl mb-6">
							<img
								src={event.image}
								alt={event.name}
								class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
							<div class="absolute bottom-4 left-4 right-4">
								<div class="flex items-center justify-between">
									<span class="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
										{event.price}
									</span>
									<span class="text-white text-sm">
										{formatNumber(event.attendees)} attending
									</span>
								</div>
							</div>
						</div>
						
						<!-- Event Info -->
						<div class="space-y-3">
							<h3 class="text-xl font-bold text-white group-hover:text-purple-400 transition-colors duration-200">
								{event.name}
							</h3>
							<div class="flex items-center space-x-2 text-gray-400">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
								</svg>
								<span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
							</div>
							<div class="flex items-center space-x-2 text-gray-400">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span>{event.location}</span>
							</div>
						</div>
						
						<!-- Hover Effect -->
						<div class="absolute inset-0 bg-gradient-to-t from-purple-600/0 to-transparent group-hover:from-purple-600/10 transition-all duration-300 rounded-xl pointer-events-none" />
					</div>
				{/each}
			</div>
			
			<div class="text-center mt-12">
				<a
					href="/events"
					class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
				>
					View All Events
					<svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>
		</div>
	</section>

	<!-- Featured Artists Section -->
	<section class="py-20 bg-black/20 backdrop-blur-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">Featured Artists</h2>
				<p class="text-xl text-gray-400">Discover the world's top electronic music artists</p>
			</div>
			
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
				{#each featuredArtists as artist, index}
					<div
						class="artist-card group text-center"
						in:fly={{ y: 30, duration: 600, delay: index * 100, easing: quintOut }}
					>
						<!-- Artist Image -->
						<div class="relative mb-4">
							<img
								src={artist.image}
								alt={artist.name}
								class="w-24 h-24 lg:w-32 lg:h-32 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300 ring-4 ring-purple-500/20 group-hover:ring-purple-500/40"
							/>
							{#if artist.verified}
								<div class="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2">
									<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
										<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
											<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
								</div>
							{/if}
						</div>
						
						<!-- Artist Info -->
						<div class="space-y-2">
							<h3 class="text-lg font-bold text-white group-hover:text-purple-400 transition-colors duration-200">
								{artist.name}
							</h3>
							<p class="text-sm text-gray-400">{artist.genre}</p>
							<p class="text-xs text-gray-500">{formatNumber(artist.followers)} followers</p>
						</div>
					</div>
				{/each}
			</div>
			
			<div class="text-center mt-12">
				<a
					href="/artists"
					class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
				>
					Explore Artists
					<svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
			</div>
		</div>
	</section>
<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  // Automatische Weiterleitung zur Willkommensseite
  onMount(() => {
    goto('/welcome')
  })
</script>

<div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <div class="text-center text-white">
    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
    <p>Leite weiter...</p>
  </div>
</div>
	<!-- CTA Section -->
	{#if !user}
		<section class="py-20 relative overflow-hidden">
			<div class="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-cyan-900/50" />
			<div class="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
				<h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
					Ready to Join the Community?
				</h2>
				<p class="text-xl text-gray-300 mb-8">
					Connect with fellow ravers, discover new events, and never miss your favorite artists again.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/auth/register"
						class="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
					>
						Create Free Account
					</a>
					<a
						href="/auth/login"
						class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
					>
						Sign In
					</a>
				</div>
			</div>
		</section>
	{/if}
</div>

<style>
	.event-card {
		@apply relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer;
	}
	
	.artist-card {
		@apply cursor-pointer;
	}
</style>
