<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/utils/supabase';

	let posts = [];
	let loading = true;
	let newPostContent = '';
	let showNewPostForm = false;

	// Mock data for demonstration
	const mockPosts = [
		{
			id: 1,
			author: 'TechnoVibes',
			avatar: 'TV',
			content: 'Just dropped my latest track! Check it out and let me know what you think. The underground scene is alive and well! 🎵',
			timestamp: '2 hours ago',
			likes: 24,
			comments: 8,
			shares: 3
		},
		{
			id: 2,
			author: 'BasslineQueen',
			avatar: 'BQ',
			content: 'Amazing night at the warehouse last weekend! The energy was incredible. Special thanks to everyone who came out to support the scene. Next event coming soon... 🔥',
			timestamp: '5 hours ago',
			likes: 47,
			comments: 15,
			shares: 7
		},
		{
			id: 3,
			author: 'SynthMaster',
			avatar: 'SM',
			content: 'Working on some new modular synth compositions. The Eurorack setup is finally coming together. Any other hardware enthusiasts here?',
			timestamp: '1 day ago',
			likes: 18,
			comments: 12,
			shares: 2
		},
		{
			id: 4,
			author: 'DigitalDreamer',
			avatar: 'DD',
			content: 'Throwback to that epic sunrise set at the desert rave. Sometimes the best moments happen when you least expect them. Missing those vibes! 🌅',
			timestamp: '2 days ago',
			likes: 63,
			comments: 22,
			shares: 11
		}
	];

	const topics = [
		{ name: 'Music Production', icon: '🎛️', posts: 234 },
		{ name: 'Event Planning', icon: '📅', posts: 189 },
		{ name: 'Gear Reviews', icon: '🎧', posts: 156 },
		{ name: 'Scene News', icon: '📰', posts: 298 },
		{ name: 'Collaboration', icon: '🤝', posts: 87 },
		{ name: 'Learning Resources', icon: '📚', posts: 145 }
	];

	onMount(async () => {
		// For now, use mock data
		posts = mockPosts;
		loading = false;
		
		// In the future, load real posts from database
		// await loadPosts();
	});

	async function loadPosts() {
		loading = true;
		try {
			const { data, error } = await supabase
				.from('community_posts')
				.select(`
					*,
					profiles (
						display_name,
						avatar_url
					)
				`)
				.order('created_at', { ascending: false });

			if (error) {
				console.error('Error loading posts:', error);
			} else {
				posts = data || [];
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			loading = false;
		}
	}

	function toggleNewPostForm() {
		showNewPostForm = !showNewPostForm;
	}

	async function submitPost() {
		if (!newPostContent.trim()) return;

		// TODO: Implement post submission to database
		console.log('Submitting post:', newPostContent);
		
		// Reset form
		newPostContent = '';
		showNewPostForm = false;
		
		// Reload posts
		await loadPosts();
	}

	function formatTimestamp(timestamp) {
		// Simple timestamp formatting for mock data
		return timestamp;
	}
</script>

<svelte:head>
	<title>Community - RaveTracker</title>
	<meta name="description" content="Connect with the global electronic music community. Share experiences, discover new music, and engage with fellow ravers and artists." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl md:text-6xl font-bold mb-4">
				<span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
					Community
				</span>
			</h1>
			<p class="text-xl text-gray-300 max-w-2xl mx-auto">
				Connect, share, and engage with the global electronic music community
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
			<!-- Sidebar -->
			<div class="lg:col-span-1">
				<!-- Popular Topics -->
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
					<h3 class="text-xl font-bold text-white mb-4">Popular Topics</h3>
					<div class="space-y-3">
						{#each topics as topic}
							<button class="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-left">
								<div class="flex items-center">
									<span class="text-2xl mr-3">{topic.icon}</span>
									<span class="text-white font-medium">{topic.name}</span>
								</div>
								<span class="text-gray-400 text-sm">{topic.posts}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Community Stats -->
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
					<h3 class="text-xl font-bold text-white mb-4">Community Stats</h3>
					<div class="space-y-4">
						<div class="flex justify-between">
							<span class="text-gray-300">Total Members</span>
							<span class="text-white font-bold">12,847</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-300">Active Today</span>
							<span class="text-green-400 font-bold">1,234</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-300">Posts This Week</span>
							<span class="text-purple-400 font-bold">567</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-300">Events Shared</span>
							<span class="text-cyan-400 font-bold">89</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content -->
			<div class="lg:col-span-3">
				<!-- New Post Button/Form -->
				<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
					{#if !showNewPostForm}
						<button
							on:click={toggleNewPostForm}
							class="w-full flex items-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200 text-left"
						>
							<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
								U
							</div>
							<span class="text-gray-400">Share your thoughts with the community...</span>
						</button>
					{:else}
						<div>
							<div class="flex items-start mb-4">
								<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
									U
								</div>
								<div class="flex-1">
									<textarea
										bind:value={newPostContent}
										placeholder="What's happening in the scene?"
										rows="4"
										class="w-full px-4 py-3 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
									></textarea>
								</div>
							</div>
							<div class="flex justify-end space-x-3">
								<button
									on:click={toggleNewPostForm}
									class="px-6 py-2 text-gray-400 hover:text-white transition-colors"
								>
									Cancel
								</button>
								<button
									on:click={submitPost}
									disabled={!newPostContent.trim()}
									class="px-6 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Post
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Posts Feed -->
				{#if loading}
					<div class="flex justify-center py-12">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
					</div>
				{:else}
					<div class="space-y-6">
						{#each posts as post}
							<div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
								<!-- Post Header -->
								<div class="flex items-center mb-4">
									<div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
										{post.avatar}
									</div>
									<div class="flex-1">
										<h4 class="text-white font-bold">{post.author}</h4>
										<p class="text-gray-400 text-sm">{formatTimestamp(post.timestamp)}</p>
									</div>
									<button class="text-gray-400 hover:text-white transition-colors">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
										</svg>
									</button>
								</div>

								<!-- Post Content -->
								<div class="mb-4">
									<p class="text-gray-300 leading-relaxed">{post.content}</p>
								</div>

								<!-- Post Actions -->
								<div class="flex items-center space-x-6 pt-4 border-t border-white/10">
									<button class="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
										</svg>
										<span class="text-sm">{post.likes}</span>
									</button>
									<button class="flex items-center space-x-2 text-gray-400 hover:text-cyan-400 transition-colors">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
										</svg>
										<span class="text-sm">{post.comments}</span>
									</button>
									<button class="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
										</svg>
										<span class="text-sm">{post.shares}</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Load More Button -->
				<div class="text-center mt-8">
					<button class="px-8 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all duration-200">
						Load More Posts
					</button>
				</div>
			</div>
		</div>

		<!-- Community Guidelines -->
		<div class="mt-12 p-8 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-2xl border border-purple-500/30">
			<h2 class="text-2xl font-bold text-white mb-4">Community Guidelines</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="text-center">
					<div class="text-4xl mb-3">🤝</div>
					<h3 class="text-lg font-bold text-white mb-2">Respect Everyone</h3>
					<p class="text-gray-300 text-sm">Treat all members with kindness and respect, regardless of their background or music preferences.</p>
				</div>
				<div class="text-center">
					<div class="text-4xl mb-3">🎵</div>
					<h3 class="text-lg font-bold text-white mb-2">Share Quality Content</h3>
					<p class="text-gray-300 text-sm">Post meaningful content that adds value to the community and supports the electronic music scene.</p>
				</div>
				<div class="text-center">
					<div class="text-4xl mb-3">🚫</div>
					<h3 class="text-lg font-bold text-white mb-2">No Spam or Hate</h3>
					<p class="text-gray-300 text-sm">Keep discussions constructive and avoid spam, self-promotion, or hateful content.</p>
				</div>
			</div>
		</div>
	</div>
</div>
