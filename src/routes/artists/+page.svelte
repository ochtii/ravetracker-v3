<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/utils/supabase';

	let artists = [];
	let loading = true;
	let searchTerm = '';
	let selectedGenre = '';
	let genres = ['Techno', 'House', 'Trance', 'Drum & Bass', 'Dubstep', 'Ambient', 'Progressive'];

	onMount(async () => {
		await loadArtists();
	});

	async function loadArtists() {
		loading = true;
		try {
			let query = supabase
				.from('profiles')
				.select('*')
				.eq('user_type', 'artist')
				.order('created_at', { ascending: false });

			if (searchTerm) {
				query = query.ilike('display_name', `%${searchTerm}%`);
			}

			if (selectedGenre) {
				query = query.contains('genres', [selectedGenre]);
			}

			const { data, error } = await query;

			if (error) {
				console.error('Error loading artists:', error);
				artists = [];
			} else {
				artists = data || [];
			}
		} catch (error) {
			console.error('Error:', error);
			artists = [];
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		loadArtists();
	}

	function resetFilters() {
		searchTerm = '';
		selectedGenre = '';
		loadArtists();
	}
</script>

<svelte:head>
	<title>Artists - RaveTracker</title>
	<meta name="description" content="Discover talented electronic music artists from around the world. Connect with DJs, producers, and performers in the global rave community." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl md:text-6xl font-bold mb-4">
				<span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
					Artists
				</span>
			</h1>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto">
				Discover talented electronic music artists, DJs, and producers from around the world
			</p>
		</div>

		<!-- Search and Filters -->
		<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
			<div class="flex flex-col md:flex-row gap-4 items-end">
				<!-- Search Input -->
				<div class="flex-1">
					<label for="search" class="block text-sm font-medium text-gray-300 mb-2">
						Search Artists
					</label>
					<input
						id="search"
						type="text"
						bind:value={searchTerm}
						on:input={handleSearch}
						placeholder="Search by artist name..."
						class="w-full px-4 py-3 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
					/>
				</div>

				<!-- Genre Filter -->
				<div class="flex-1">
					<label for="genre" class="block text-sm font-medium text-gray-300 mb-2">
						Genre Filter
					</label>
					<select
						id="genre"
						bind:value={selectedGenre}
						on:change={handleSearch}
						class="w-full px-4 py-3 bg-white/5 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
					>
						<option value="">All Genres</option>
						{#each genres as genre}
							<option value={genre}>{genre}</option>
						{/each}
					</select>
				</div>

				<!-- Reset Button -->
				<button
					on:click={resetFilters}
					class="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 whitespace-nowrap"
				>
					Reset Filters
				</button>
			</div>
		</div>

		<!-- Artists Grid -->
		{#if loading}
			<div class="flex justify-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
			</div>
		{:else if artists.length === 0}
			<div class="text-center py-12">
				<div class="text-6xl mb-4">🎧</div>
				<h3 class="text-2xl font-bold text-white mb-2">No Artists Found</h3>
				<p class="text-gray-400 mb-6">
					{#if searchTerm || selectedGenre}
						Try adjusting your search criteria or filters.
					{:else}
						Be the first artist to join the community!
					{/if}
				</p>
				<button
					on:click={resetFilters}
					class="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200"
				>
					Clear Filters
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each artists as artist}
					<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 group">
						<!-- Artist Avatar -->
						<div class="flex items-center mb-4">
							<div class="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
								{artist.display_name?.charAt(0)?.toUpperCase() || 'A'}
							</div>
							<div>
								<h3 class="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
									{artist.display_name || 'Unknown Artist'}
								</h3>
								<p class="text-gray-400 text-sm">
									{artist.location || 'Location Unknown'}
								</p>
							</div>
						</div>

						<!-- Artist Info -->
						{#if artist.bio}
							<p class="text-gray-300 text-sm mb-4 line-clamp-3">
								{artist.bio}
							</p>
						{/if}

						<!-- Genres -->
						{#if artist.genres && artist.genres.length > 0}
							<div class="flex flex-wrap gap-2 mb-4">
								{#each artist.genres.slice(0, 3) as genre}
									<span class="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">
										{genre}
									</span>
								{/each}
								{#if artist.genres.length > 3}
									<span class="px-2 py-1 bg-gray-500/30 text-gray-300 text-xs rounded-full">
										+{artist.genres.length - 3} more
									</span>
								{/if}
							</div>
						{/if}

						<!-- Social Links -->
						<div class="flex space-x-3">
							{#if artist.social_links?.website}
								<a
									href={artist.social_links.website}
									target="_blank"
									rel="noopener noreferrer"
									class="text-gray-400 hover:text-white transition-colors"
									title="Website"
								>
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"></path>
									</svg>
								</a>
							{/if}
							{#if artist.social_links?.soundcloud}
								<a
									href={artist.social_links.soundcloud}
									target="_blank"
									rel="noopener noreferrer"
									class="text-gray-400 hover:text-orange-400 transition-colors"
									title="SoundCloud"
								>
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.19 0 2.34-.21 3.41-.6.24-.09.49-.2.73-.32.23-.11.45-.24.66-.38.21-.14.41-.29.6-.45.19-.16.37-.33.54-.51.18-.18.34-.37.5-.57.15-.19.29-.39.42-.6.13-.21.25-.43.36-.65.11-.22.21-.45.29-.68.09-.24.16-.49.22-.74.06-.25.11-.51.14-.77.03-.26.05-.52.05-.79 0-5.52-4.48-10-10-10z"/>
									</svg>
								</a>
							{/if}
							{#if artist.social_links?.instagram}
								<a
									href={artist.social_links.instagram}
									target="_blank"
									rel="noopener noreferrer"
									class="text-gray-400 hover:text-pink-400 transition-colors"
									title="Instagram"
								>
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
									</svg>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Call to Action -->
		<div class="text-center mt-12 p-8 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-2xl border border-purple-500/30">
			<h2 class="text-3xl font-bold text-white mb-4">Are you an Artist?</h2>
			<p class="text-gray-300 mb-6 max-w-2xl mx-auto">
				Join our community of talented electronic music artists. Share your music, connect with fans, and grow your audience.
			</p>
			<button
				on:click={() => goto('/profile')}
				class="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
				</svg>
				Join as Artist
			</button>
		</div>
	</div>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
