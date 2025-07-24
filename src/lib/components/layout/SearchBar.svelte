<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	
	export let mobile = false;
	
	let searchQuery = '';
	let searchResults: any[] = [];
	let isSearching = false;
	let showResults = false;
	let searchInput: HTMLInputElement;
	let searchTimeout: ReturnType<typeof setTimeout>;
	
	// Mock search data - replace with real API calls
	const mockData = [
		{ type: 'event', name: 'Tomorrowland 2024', location: 'Belgium', date: '2024-07-15' },
		{ type: 'artist', name: 'David Guetta', genre: 'House', verified: true },
		{ type: 'venue', name: 'Privilege Ibiza', location: 'Ibiza, Spain', capacity: 10000 },
		{ type: 'event', name: 'Ultra Music Festival', location: 'Miami, USA', date: '2024-03-24' },
		{ type: 'artist', name: 'Martin Garrix', genre: 'Progressive House', verified: true },
		{ type: 'venue', name: 'Berghain', location: 'Berlin, Germany', capacity: 1500 }
	];
	
	async function performSearch(query: string) {
		if (!query.trim()) {
			searchResults = [];
			showResults = false;
			return;
		}
		
		isSearching = true;
		
		// Simulate API delay
		await new Promise(resolve => setTimeout(resolve, 300));
		
		// Filter mock data
		searchResults = mockData.filter(item =>
			item.name.toLowerCase().includes(query.toLowerCase()) ||
			(item.location && item.location.toLowerCase().includes(query.toLowerCase())) ||
			(item.genre && item.genre.toLowerCase().includes(query.toLowerCase()))
		).slice(0, 6);
		
		isSearching = false;
		showResults = true;
	}
	
	function handleInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			performSearch(searchQuery);
		}, 300);
	}
	
	function handleFocus() {
		if (searchQuery) {
			showResults = true;
		}
	}
	
	function handleBlur() {
		// Delay hiding results to allow clicking on them
		setTimeout(() => {
			showResults = false;
		}, 200);
	}
	
	function selectResult(result: any) {
		const path = getResultPath(result);
		goto(path);
		clearSearch();
	}
	
	function getResultPath(result: any): string {
		switch (result.type) {
			case 'event':
				return `/events/${encodeURIComponent(result.name.toLowerCase().replace(/\s+/g, '-'))}`;
			case 'artist':
				return `/artists/${encodeURIComponent(result.name.toLowerCase().replace(/\s+/g, '-'))}`;
			case 'venue':
				return `/venues/${encodeURIComponent(result.name.toLowerCase().replace(/\s+/g, '-'))}`;
			default:
				return '/';
		}
	}
	
	function clearSearch() {
		searchQuery = '';
		searchResults = [];
		showResults = false;
	}
	
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			clearSearch();
			searchInput?.blur();
		} else if (event.key === 'Enter' && searchResults.length > 0) {
			selectResult(searchResults[0]);
		}
	}
	
	function getResultIcon(type: string): string {
		switch (type) {
			case 'event':
				return 'M8 7V3a1 1 0 012 0v4h4a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h4z';
			case 'artist':
				return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
			case 'venue':
				return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
			default:
				return 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z';
		}
	}
	
	onMount(() => {
		return () => {
			clearTimeout(searchTimeout);
		};
	});
</script>

<div class="relative" class:w-full={mobile}>
	<!-- Search Input -->
	<div class="relative">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
			{#if isSearching}
				<div class="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
			{:else}
				<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			{/if}
		</div>
		
		<input
			bind:this={searchInput}
			bind:value={searchQuery}
			on:input={handleInput}
			on:focus={handleFocus}
			on:blur={handleBlur}
			on:keydown={handleKeydown}
			type="text"
			placeholder="Search events, artists, venues..."
			class="search-input"
			class:mobile
		/>
		
		<!-- Clear Button -->
		{#if searchQuery}
			<button
				on:click={clearSearch}
				class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
				aria-label="Clear search"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
				</svg>
			</button>
		{/if}
		
		<!-- Search Shortcut Hint (Desktop) -->
		{#if !mobile && !searchQuery}
			<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
				<kbd class="px-2 py-1 text-xs text-gray-400 bg-white/10 rounded border border-white/20">
					⌘K
				</kbd>
			</div>
		{/if}
	</div>

	<!-- Search Results Dropdown -->
	{#if showResults && (searchResults.length > 0 || isSearching)}
		<div
			class="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto"
			transition:fly={{ y: -10, duration: 200, easing: quintOut }}
		>
			{#if isSearching}
				<!-- Loading State -->
				<div class="p-4 text-center">
					<div class="flex items-center justify-center space-x-2 text-gray-400">
						<div class="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
						<span class="text-sm">Searching...</span>
					</div>
				</div>
			{:else if searchResults.length > 0}
				<!-- Results -->
				<div class="py-2">
					{#each searchResults as result, index}
						<button
							on:click={() => selectResult(result)}
							class="result-item"
							in:fly={{ x: -10, duration: 150, delay: index * 50, easing: quintOut }}
						>
							<!-- Icon -->
							<div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600/20 to-cyan-600/20 rounded-lg flex items-center justify-center">
								<svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
									<path d={getResultIcon(result.type)} />
								</svg>
							</div>
							
							<!-- Content -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center space-x-2">
									<h4 class="text-sm font-medium text-white truncate">{result.name}</h4>
									{#if result.verified}
										<svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
											<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{/if}
								</div>
								<div class="flex items-center space-x-2 text-xs text-gray-400">
									<span class="capitalize">{result.type}</span>
									{#if result.location}
										<span>•</span>
										<span>{result.location}</span>
									{/if}
									{#if result.genre}
										<span>•</span>
										<span>{result.genre}</span>
									{/if}
									{#if result.date}
										<span>•</span>
										<span>{new Date(result.date).toLocaleDateString()}</span>
									{/if}
									{#if result.capacity}
										<span>•</span>
										<span>{result.capacity.toLocaleString()} capacity</span>
									{/if}
								</div>
							</div>
							
							<!-- Arrow -->
							<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</button>
					{/each}
				</div>
				
				<!-- View All Results -->
				<div class="border-t border-white/10 p-2">
					<a
						href="/search?q={encodeURIComponent(searchQuery)}"
						class="block w-full px-4 py-2 text-center text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors duration-200"
						on:click={clearSearch}
					>
						View all results for "{searchQuery}"
					</a>
				</div>
			{:else}
				<!-- No Results -->
				<div class="p-4 text-center">
					<svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.462.859-6.1 2.291" />
					</svg>
					<p class="text-sm text-gray-400">No results found for "{searchQuery}"</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.search-input {
		@apply w-full pl-10 pr-10 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200;
	}
	
	.search-input.mobile {
		@apply text-base;
	}
	
	.search-input:focus {
		@apply bg-white/20;
	}
	
	.result-item {
		@apply w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-all duration-200;
	}
	
	.result-item:hover svg {
		@apply transform scale-110;
	}
</style>
