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

	// Debounced search
	const debouncedSearch = debounce((term: string) => {
		applyFilters()
	}, 300)

	// Reactive statements
	$: if (searchTerm !== undefined) {
		debouncedSearch(searchTerm)
	}

	$: hasActiveFilters = searchTerm || selectedGenres.length > 0 || selectedLocation || 
		dateFrom || dateTo || (selectedStatus.length !== 1 || selectedStatus[0] !== 'published')

	$: canLoadMore = $eventsPagination.hasMore && !$eventsLoading.events

	// Lifecycle
	onMount(async () => {
		// Load initial events
		await loadEvents(true)
		
		// Enable real-time updates
		eventsActions.enableRealTime()
		
		// Parse URL parameters for filters
		parseUrlFilters()
	})

	onDestroy(() => {
		// Disable real-time updates
		eventsActions.disableRealTime()
	})

	// Functions
	async function loadEvents(refresh = false) {
		isLoading = true
		try {
			await eventsActions.loadEvents(refresh)
		} finally {
			isLoading = false
		}
	}

	function applyFilters() {
		const filters = {
			searchTerm: searchTerm || undefined,
			genres: selectedGenres.length > 0 ? selectedGenres : undefined,
			location: selectedLocation || undefined,
			status: selectedStatus.length > 0 ? selectedStatus : undefined,
			dateFrom: dateFrom || undefined,
			dateTo: dateTo || undefined
		}

		// Update URL with filters
		updateUrlWithFilters(filters)
		
		// Apply filters to store
		eventsActions.setFilters(filters)
	}

	function clearFilters() {
		searchTerm = ''
		selectedGenres = []
		selectedLocation = ''
		selectedStatus = ['published']
		dateFrom = ''
		dateTo = ''
		showFilters = false
		
		// Clear URL parameters
		goto('/events', { replaceState: true })
		
		// Clear filters in store
		eventsActions.clearFilters()
	}

	function parseUrlFilters() {
		const params = $page.url.searchParams
		
		searchTerm = params.get('search') || ''
		selectedLocation = params.get('location') || ''
		dateFrom = params.get('from') || ''
		dateTo = params.get('to') || ''
		
		const genresParam = params.get('genres')
		if (genresParam) {
			selectedGenres = genresParam.split(',')
		}
		
		const statusParam = params.get('status')
		if (statusParam) {
			selectedStatus = statusParam.split(',')
		}

		// Apply filters if any exist
		if (hasActiveFilters) {
			applyFilters()
		}
	}

	function updateUrlWithFilters(filters: any) {
		const params = new URLSearchParams()
		
		if (filters.searchTerm) params.set('search', filters.searchTerm)
		if (filters.location) params.set('location', filters.location)
		if (filters.genres?.length) params.set('genres', filters.genres.join(','))
		if (filters.status?.length && filters.status.join(',') !== 'published') {
			params.set('status', filters.status.join(','))
		}
		if (filters.dateFrom) params.set('from', filters.dateFrom)
		if (filters.dateTo) params.set('to', filters.dateTo)

		const url = params.toString() ? `/events?${params.toString()}` : '/events'
		goto(url, { replaceState: true, noScroll: true })
	}

	function handleEventClick(event: CustomEvent) {
		goto(`/events/${event.detail.event.id}`)
	}

	function handleCreateEvent() {
		goto('/events/create')
	}

	function handleRetry() {
		loadEvents(true)
	}
</script>

<svelte:head>
	<title>Events - RaveTracker</title>
	<meta name="description" content="Discover and join electronic music events near you. Find the best raves, festivals, and club nights." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white shadow-sm border-b border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="py-6">
				<div class="flex items-center justify-between">
					<div>
						<h1 class="text-3xl font-bold text-gray-900">Events</h1>
						<p class="mt-1 text-sm text-gray-600">
							Discover electronic music events near you
						</p>
					</div>
					
					{#if $isOrganizer}
						<button
							type="button"
							class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
							on:click={handleCreateEvent}
						>
							<Plus class="h-4 w-4 mr-2" />
							Create Event
						</button>
					{/if}
				</div>

				<!-- Search Bar -->
				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Search class="h-5 w-5 text-gray-400" />
						</div>
						<input
							type="text"
							placeholder="Search events..."
							bind:value={searchTerm}
							class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<!-- Error State -->
		{#if $eventsError && !$events.length}
			<div class="text-center py-12">
				<ErrorDisplay 
					error={$eventsError} 
					variant="card" 
					on:retry={handleRetry}
				/>
			</div>
		{:else}
			<!-- Results Info -->
			<div class="flex items-center justify-between mb-6">
				<div class="text-sm text-gray-600">
					{#if $eventsPagination.total > 0}
						Showing {$events.length} of {$eventsPagination.total} events
					{:else if !$eventsLoading.events}
						No events found
					{/if}
				</div>
				
				{#if $eventsLoading.events && $events.length === 0}
					<LoadingSpinner size="sm" />
				{/if}
			</div>

			<!-- Events Grid -->
			{#if $events.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each $events as event (event.id)}
						<EventCard 
							{event} 
							variant="card"
							on:click={handleEventClick}
						/>
					{/each}
				</div>
			{:else if !$eventsLoading.events}
				<!-- Empty State -->
				<div class="text-center py-12">
					<Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<h3 class="text-lg font-medium text-gray-900 mb-2">
						No events found
					</h3>
					<p class="text-gray-600 mb-6">
						Be the first to create an event in your area!
					</p>
					{#if $isOrganizer}
						<button
							type="button"
							class="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
							on:click={handleCreateEvent}
						>
							Create Event
						</button>
					{/if}
				</div>
			{:else}
				<!-- Loading State -->
				<LoadingSpinner variant="card" count={8} />
			{/if}
		{/if}
	</div>
</div>
