<!--
Enhanced Events Page with Real-time Updates and Optimizations
===========================================================
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { 
		events, 
		eventsLoading, 
		eventsError, 
		eventFilters, 
		eventsPagination,
		eventsActions 
	} from '$lib/stores/events-enhanced'
	import { user, isOrganizer } from '$lib/stores/auth-enhanced'
	import { offlineStore } from '$lib/utils/database'
	import EventCard from '$lib/components/ui/EventCard.svelte'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
	import { Search, Filter, Plus, Calendar, MapPin, X, SlidersHorizontal } from 'lucide-svelte'

	// Filter state
	let searchTerm = ''
	let selectedGenres: string[] = []
	let selectedLocation = ''
	let selectedStatus: string[] = ['published']
	let dateFrom = ''
	let dateTo = ''
	let showFilters = false
	let isLoading = false

	// Available options
	const genres = [
		'Techno', 'House', 'Trance', 'Drum & Bass', 'Dubstep', 
		'EDM', 'Progressive', 'Minimal', 'Deep House', 'Hardstyle'
	]
	
	const statusOptions = [
		{ value: 'published', label: 'Published' },
		{ value: 'draft', label: 'Draft' },
		{ value: 'cancelled', label: 'Cancelled' }
	]

	// Debounce helper
	function debounce(func: Function, wait: number) {
		let timeout: NodeJS.Timeout
		return function executedFunction(...args: any[]) {
			const later = () => {
				clearTimeout(timeout)
				func(...args)
			}
			clearTimeout(timeout)
			timeout = setTimeout(later, wait)
		}
	}

	// Debounced search function
	const debouncedSearch = debounce((term: string) => {
		eventsActions.updateFilters({ search: term })
		loadEvents()
	}, 300)

	// URL state management
	function updateURL() {
		const params = new URLSearchParams()
		
		if (searchTerm) params.set('search', searchTerm)
		if (selectedGenres.length) params.set('genres', selectedGenres.join(','))
		if (selectedLocation) params.set('location', selectedLocation)
		if (selectedStatus.length && selectedStatus.join(',') !== 'published') {
			params.set('status', selectedStatus.join(','))
		}
		if (dateFrom) params.set('from', dateFrom)
		if (dateTo) params.set('to', dateTo)

		const newURL = params.toString() ? `?${params.toString()}` : '/events'
		goto(newURL, { replaceState: true, noScroll: true })
	}

	// Load URL state
	function loadFromURL() {
		const params = $page.url.searchParams
		
		searchTerm = params.get('search') || ''
		selectedGenres = params.get('genres')?.split(',').filter(Boolean) || []
		selectedLocation = params.get('location') || ''
		selectedStatus = params.get('status')?.split(',').filter(Boolean) || ['published']
		dateFrom = params.get('from') || ''
		dateTo = params.get('to') || ''
	}

	// Event loading
	async function loadEvents(append = false) {
		if (isLoading && !append) return
		
		isLoading = true
		
		try {
			const filters = {
				search: searchTerm,
				genres: selectedGenres.length ? selectedGenres : undefined,
				location: selectedLocation || undefined,
				status: selectedStatus,
				dateFrom: dateFrom || undefined,
				dateTo: dateTo || undefined
			}

			await eventsActions.loadEvents(filters, append)
		} finally {
			isLoading = false
		}
	}

	// Filter handlers
	function handleSearch() {
		debouncedSearch(searchTerm)
		updateURL()
	}

	function handleFilterChange() {
		eventsActions.updateFilters({
			genres: selectedGenres.length ? selectedGenres : undefined,
			location: selectedLocation || undefined,
			status: selectedStatus,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined
		})
		loadEvents()
		updateURL()
	}

	function clearFilters() {
		searchTerm = ''
		selectedGenres = []
		selectedLocation = ''
		selectedStatus = ['published']
		dateFrom = ''
		dateTo = ''
		
		eventsActions.clearFilters()
		loadEvents()
		updateURL()
	}

	function toggleGenre(genre: string) {
		if (selectedGenres.includes(genre)) {
			selectedGenres = selectedGenres.filter(g => g !== genre)
		} else {
			selectedGenres = [...selectedGenres, genre]
		}
		handleFilterChange()
	}

	function toggleStatus(status: string) {
		if (selectedStatus.includes(status)) {
			selectedStatus = selectedStatus.filter(s => s !== status)
		} else {
			selectedStatus = [...selectedStatus, status]
		}
		
		// Ensure at least one status is selected
		if (selectedStatus.length === 0) {
			selectedStatus = ['published']
		}
		
		handleFilterChange()
	}

	// Infinite scroll
	let loadMoreElement: HTMLElement
	let observer: IntersectionObserver

	function setupInfiniteScroll() {
		if (typeof window === 'undefined' || !loadMoreElement) return

		observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries
				if (entry.isIntersecting && !$eventsLoading.events && $eventsPagination.hasMore) {
					loadEvents(true)
				}
			},
			{ rootMargin: '100px' }
		)

		observer.observe(loadMoreElement)
	}

	// Event handlers
	function handleEventClick(event: CustomEvent) {
		const eventData = event.detail
		goto(`/events/${eventData.id}`)
	}

	function handleCreateEvent() {
		goto('/events/create')
	}

	function handleRetryError() {
		loadEvents()
	}

	// Lifecycle
	onMount(async () => {
		loadFromURL()
		await loadEvents()
		
		// Enable real-time updates
		eventsActions.enableRealTime()
		
		// Setup infinite scroll after initial load
		if (loadMoreElement) {
			setupInfiniteScroll()
		}
	})

	onDestroy(() => {
		eventsActions.disableRealTime()
		if (observer) {
			observer.disconnect()
		}
	})

	// Reactive statements
	$: hasActiveFilters = searchTerm || selectedGenres.length > 0 || selectedLocation || 
		selectedStatus.join(',') !== 'published' || dateFrom || dateTo

	$: filteredEventsCount = $events.length
	$: showEmptyState = !$eventsLoading.events && $events.length === 0
	$: showLoadMore = $eventsPagination.hasMore && !$eventsLoading.events
</script>

<svelte:head>
	<title>Events - RaveTracker</title>
	<meta name="description" content="Discover and join the best electronic music events" />
</svelte:head>

<!-- Header -->
<div class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<div class="flex items-center space-x-4">
				<h1 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
					Events
				</h1>
				
				{#if $offlineStore}
					<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
						Offline Mode
					</span>
				{/if}
			</div>

			<div class="flex items-center space-x-3">
				<!-- Search -->
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
					<input
						type="text"
						placeholder="Search events..."
						bind:value={searchTerm}
						on:input={handleSearch}
						class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
					/>
				</div>

				<!-- Filter Toggle -->
				<button
					on:click={() => showFilters = !showFilters}
					class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
					class:bg-purple-50={hasActiveFilters}
					class:border-purple-300={hasActiveFilters}
					class:text-purple-700={hasActiveFilters}
				>
					<SlidersHorizontal class="w-4 h-4 mr-2" />
					Filters
					{#if hasActiveFilters}
						<span class="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-purple-500 rounded-full">
							{[searchTerm, ...selectedGenres, selectedLocation, dateFrom, dateTo].filter(Boolean).length}
						</span>
					{/if}
				</button>

				<!-- Create Event Button -->
				{#if $user && $isOrganizer}
					<button
						on:click={handleCreateEvent}
						class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create Event
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Filters Panel -->
{#if showFilters}
	<div class="bg-white border-b border-gray-200 shadow-sm">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<!-- Date Range -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						<Calendar class="inline w-4 h-4 mr-1" />
						Date Range
					</label>
					<div class="space-y-2">
						<input
							type="date"
							bind:value={dateFrom}
							on:change={handleFilterChange}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
						<input
							type="date"
							bind:value={dateTo}
							on:change={handleFilterChange}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
					</div>
				</div>

				<!-- Location -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						<MapPin class="inline w-4 h-4 mr-1" />
						Location
					</label>
					<input
						type="text"
						placeholder="City or venue..."
						bind:value={selectedLocation}
						on:input={handleFilterChange}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>

				<!-- Status -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
					<div class="space-y-2">
						{#each statusOptions as status}
							<label class="flex items-center">
								<input
									type="checkbox"
									checked={selectedStatus.includes(status.value)}
									on:change={() => toggleStatus(status.value)}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="ml-2 text-sm text-gray-700">{status.label}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex flex-col justify-end">
					<button
						on:click={clearFilters}
						disabled={!hasActiveFilters}
						class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<X class="inline w-4 h-4 mr-1" />
						Clear Filters
					</button>
				</div>
			</div>

			<!-- Genres -->
			<div class="mt-6">
				<label class="block text-sm font-medium text-gray-700 mb-3">Genres</label>
				<div class="flex flex-wrap gap-2">
					{#each genres as genre}
						<button
							on:click={() => toggleGenre(genre)}
							class="px-3 py-1 text-sm font-medium rounded-full border transition-colors"
							class:bg-purple-100={selectedGenres.includes(genre)}
							class:border-purple-300={selectedGenres.includes(genre)}
							class:text-purple-700={selectedGenres.includes(genre)}
							class:bg-gray-100={!selectedGenres.includes(genre)}
							class:border-gray-300={!selectedGenres.includes(genre)}
							class:text-gray-700={!selectedGenres.includes(genre)}
							class:hover:bg-purple-50={!selectedGenres.includes(genre)}
						>
							{genre}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Main Content -->
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Results Summary -->
	{#if !$eventsLoading.events || $events.length > 0}
		<div class="mb-6 flex items-center justify-between">
			<p class="text-sm text-gray-600">
				{#if hasActiveFilters}
					Found {filteredEventsCount} events
				{:else}
					Showing all events ({filteredEventsCount})
				{/if}
			</p>
			
			{#if $eventsPagination.total > 0}
				<p class="text-sm text-gray-500">
					Page {$eventsPagination.page} of {Math.ceil($eventsPagination.total / $eventsPagination.limit)}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Error Display -->
	{#if $eventsError.events}
		<ErrorDisplay 
			error={$eventsError.events} 
			variant="banner"
			on:retry={handleRetryError}
		/>
	{/if}

	<!-- Events Grid -->
	{#if $eventsLoading.events && $events.length === 0}
		<LoadingSpinner variant="card" count={6} />
	{:else if showEmptyState}
		<div class="text-center py-12">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
				<Calendar class="w-8 h-8 text-gray-400" />
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">
				{hasActiveFilters ? 'No events found' : 'No events yet'}
			</h3>
			<p class="text-gray-500 mb-6">
				{hasActiveFilters 
					? 'Try adjusting your filters to find more events.' 
					: 'Be the first to create an event!'}
			</p>
			{#if hasActiveFilters}
				<button
					on:click={clearFilters}
					class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-purple-600 bg-purple-100 hover:bg-purple-200 focus:ring-2 focus:ring-purple-500"
				>
					Clear Filters
				</button>
			{:else if $user && $isOrganizer}
				<button
					on:click={handleCreateEvent}
					class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500"
				>
					<Plus class="w-4 h-4 mr-2" />
					Create First Event
				</button>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each $events as event (event.id)}
				<EventCard 
					{event} 
					variant="card"
					on:click={handleEventClick}
				/>
			{/each}
		</div>

		<!-- Load More -->
		{#if showLoadMore}
			<div bind:this={loadMoreElement} class="text-center py-8">
				{#if $eventsLoading.events}
					<LoadingSpinner variant="spinner" />
				{:else}
					<button
						on:click={() => loadEvents(true)}
						class="px-6 py-3 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 focus:ring-2 focus:ring-purple-500"
					>
						Load More Events
					</button>
				{/if}
			</div>
		{/if}

		<!-- End of Results -->
		{#if !$eventsPagination.hasMore && $events.length > 0}
			<div class="text-center py-8">
				<p class="text-sm text-gray-500">
					You've reached the end of the events list
				</p>
			</div>
		{/if}
	{/if}
</main>

<style>
	/* Custom scrollbar for filters */
	:global(.filter-scrollbar) {
		scrollbar-width: thin;
		scrollbar-color: #9333ea #f3f4f6;
	}
	
	:global(.filter-scrollbar::-webkit-scrollbar) {
		width: 6px;
	}
	
	:global(.filter-scrollbar::-webkit-scrollbar-track) {
		background: #f3f4f6;
		border-radius: 3px;
	}
	
	:global(.filter-scrollbar::-webkit-scrollbar-thumb) {
		background: #9333ea;
		border-radius: 3px;
	}
	
	:global(.filter-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: #7c3aed;
	}
</style>
