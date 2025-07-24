<!--
User Management Page
===================
Admin interface for managing users, roles, and permissions
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { isAdmin } from '$lib/stores/auth-enhanced'
	import { supabase } from '$lib/utils/supabase'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
	import { 
		Users, 
		Search, 
		Filter, 
		MoreHorizontal,
		Edit,
		Shield,
		Ban,
		Mail,
		Calendar,
		Activity,
		Check,
		X,
		AlertTriangle,
		Crown,
		User
	} from 'lucide-svelte'
	import { formatDistanceToNow, format } from 'date-fns'

	// Types
	interface UserProfile {
		id: string
		email: string
		display_name: string | null
		role: 'admin' | 'organizer' | 'user'
		status: 'active' | 'suspended' | 'banned'
		created_at: string
		last_sign_in_at: string | null
		email_confirmed_at: string | null
		events_created?: number
		events_attended?: number
	}

	// State
	let loading = true
	let error: string | null = null
	let users: UserProfile[] = []
	let filteredUsers: UserProfile[] = []
	let searchTerm = ''
	let selectedRole: string = 'all'
	let selectedStatus: string = 'all'
	let showFilters = false
	let selectedUsers = new Set<string>()
	let showBulkActions = false
	let currentPage = 1
	let usersPerPage = 20
	let totalUsers = 0

	// Edit modal state
	let editingUser: UserProfile | null = null
	let showEditModal = false

	// Reactive statements
	$: filteredUsers = filterUsers(users, searchTerm, selectedRole, selectedStatus)
	$: paginatedUsers = paginate(filteredUsers, currentPage, usersPerPage)
	$: totalPages = Math.ceil(filteredUsers.length / usersPerPage)
	$: hasSelection = selectedUsers.size > 0

	// Functions
	function filterUsers(users: UserProfile[], search: string, role: string, status: string): UserProfile[] {
		return users.filter(user => {
			const matchesSearch = !search || 
				user.email.toLowerCase().includes(search.toLowerCase()) ||
				user.display_name?.toLowerCase().includes(search.toLowerCase())
			
			const matchesRole = role === 'all' || user.role === role
			const matchesStatus = status === 'all' || user.status === status

			return matchesSearch && matchesRole && matchesStatus
		})
	}

	function paginate<T>(items: T[], page: number, perPage: number): T[] {
		const start = (page - 1) * perPage
		return items.slice(start, start + perPage)
	}

	async function loadUsers() {
		try {
			loading = true
			error = null

			// Load user profiles with additional stats
			const { data: profilesData, error: profilesError } = await supabase
				.from('profiles')
				.select(`
					id,
					email,
					display_name,
					role,
					status,
					created_at,
					updated_at
				`)
				.order('created_at', { ascending: false })

			if (profilesError) throw profilesError

			// Get event statistics for each user
			const userIds = profilesData?.map(u => u.id) || []
			
			const { data: eventStats } = await supabase
				.from('events')
				.select('organizer_id')
				.in('organizer_id', userIds)

			const { data: attendanceStats } = await supabase
				.from('event_attendance')
				.select('user_id')
				.in('user_id', userIds)

			// Calculate stats
			const eventsCreated = new Map<string, number>()
			const eventsAttended = new Map<string, number>()

			eventStats?.forEach(event => {
				const count = eventsCreated.get(event.organizer_id) || 0
				eventsCreated.set(event.organizer_id, count + 1)
			})

			attendanceStats?.forEach(attendance => {
				const count = eventsAttended.get(attendance.user_id) || 0
				eventsAttended.set(attendance.user_id, count + 1)
			})

			// Combine data
			users = (profilesData || []).map(user => ({
				...user,
				events_created: eventsCreated.get(user.id) || 0,
				events_attended: eventsAttended.get(user.id) || 0
			}))

			totalUsers = users.length

		} catch (err) {
			console.error('Failed to load users:', err)
			error = (err as Error).message
		} finally {
			loading = false
		}
	}

	async function updateUserRole(userId: string, newRole: 'admin' | 'organizer' | 'user') {
		try {
			const { error } = await supabase
				.from('profiles')
				.update({ role: newRole })
				.eq('id', userId)

			if (error) throw error

			// Update local state
			users = users.map(user => 
				user.id === userId ? { ...user, role: newRole } : user
			)

		} catch (err) {
			console.error('Failed to update user role:', err)
			error = (err as Error).message
		}
	}

	async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended' | 'banned') {
		try {
			const { error } = await supabase
				.from('profiles')
				.update({ status: newStatus })
				.eq('id', userId)

			if (error) throw error

			// Update local state
			users = users.map(user => 
				user.id === userId ? { ...user, status: newStatus } : user
			)

		} catch (err) {
			console.error('Failed to update user status:', err)
			error = (err as Error).message
		}
	}

	async function sendEmail(userId: string, subject: string, message: string) {
		try {
			// This would typically call a Supabase function or email service
			console.log('Sending email to user:', userId, { subject, message })
			
			// Placeholder for email functionality
			alert('Email functionality would be implemented here')

		} catch (err) {
			console.error('Failed to send email:', err)
		}
	}

	function toggleUserSelection(userId: string) {
		const newSelection = new Set(selectedUsers)
		if (newSelection.has(userId)) {
			newSelection.delete(userId)
		} else {
			newSelection.add(userId)
		}
		selectedUsers = newSelection
	}

	function selectAllUsers() {
		selectedUsers = new Set(paginatedUsers.map(u => u.id))
	}

	function clearSelection() {
		selectedUsers = new Set()
	}

	async function bulkUpdateRole(role: 'admin' | 'organizer' | 'user') {
		try {
			const userIds = Array.from(selectedUsers)
			
			const { error } = await supabase
				.from('profiles')
				.update({ role })
				.in('id', userIds)

			if (error) throw error

			// Update local state
			users = users.map(user => 
				selectedUsers.has(user.id) ? { ...user, role } : user
			)

			clearSelection()

		} catch (err) {
			console.error('Failed to bulk update roles:', err)
			error = (err as Error).message
		}
	}

	async function bulkUpdateStatus(status: 'active' | 'suspended' | 'banned') {
		try {
			const userIds = Array.from(selectedUsers)
			
			const { error } = await supabase
				.from('profiles')
				.update({ status })
				.in('id', userIds)

			if (error) throw error

			// Update local state
			users = users.map(user => 
				selectedUsers.has(user.id) ? { ...user, status } : user
			)

			clearSelection()

		} catch (err) {
			console.error('Failed to bulk update status:', err)
			error = (err as Error).message
		}
	}

	function openEditModal(user: UserProfile) {
		editingUser = user
		showEditModal = true
	}

	function closeEditModal() {
		editingUser = null
		showEditModal = false
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'admin': return 'text-red-600 bg-red-100'
			case 'organizer': return 'text-purple-600 bg-purple-100'
			case 'user': return 'text-gray-600 bg-gray-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active': return 'text-green-600 bg-green-100'
			case 'suspended': return 'text-yellow-600 bg-yellow-100'
			case 'banned': return 'text-red-600 bg-red-100'
			default: return 'text-gray-600 bg-gray-100'
		}
	}

	function getRoleIcon(role: string) {
		switch (role) {
			case 'admin': return Crown
			case 'organizer': return Shield
			case 'user': return User
			default: return User
		}
	}

	// Lifecycle
	onMount(() => {
		loadUsers()
	})
</script>

<svelte:head>
	<title>User Management - Admin Panel</title>
</svelte:head>

<!-- Page Header -->
<div class="flex items-center justify-between mb-8">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">User Management</h1>
		<p class="text-gray-600 mt-2">
			Manage users, roles, and permissions across the platform
		</p>
	</div>

	<div class="flex items-center space-x-3">
		{#if hasSelection}
			<span class="text-sm text-gray-600">
				{selectedUsers.size} selected
			</span>
		{/if}
		
		<button
			on:click={() => showFilters = !showFilters}
			class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
		>
			<Filter class="w-4 h-4 mr-2" />
			Filters
		</button>
	</div>
</div>

{#if loading}
	<LoadingSpinner variant="card" count={6} />
{:else if error}
	<ErrorDisplay 
		{error} 
		variant="banner"
		on:retry={loadUsers}
	/>
{:else}
	<!-- Filters -->
	{#if showFilters}
		<div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
					<div class="relative">
						<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
						<input
							type="text"
							placeholder="Search users..."
							bind:value={searchTerm}
							class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
						/>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
					<select
						bind:value={selectedRole}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="all">All Roles</option>
						<option value="admin">Admin</option>
						<option value="organizer">Organizer</option>
						<option value="user">User</option>
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
					<select
						bind:value={selectedStatus}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="all">All Statuses</option>
						<option value="active">Active</option>
						<option value="suspended">Suspended</option>
						<option value="banned">Banned</option>
					</select>
				</div>
			</div>
		</div>
	{/if}

	<!-- Bulk Actions -->
	{#if hasSelection}
		<div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-gray-900">
					{selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
				</span>
				
				<div class="flex items-center space-x-3">
					<select
						on:change={(e) => bulkUpdateRole(e.target.value)}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
					>
						<option value="">Change Role...</option>
						<option value="user">User</option>
						<option value="organizer">Organizer</option>
						{#if $isAdmin}
							<option value="admin">Admin</option>
						{/if}
					</select>
					
					<select
						on:change={(e) => bulkUpdateStatus(e.target.value)}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
					>
						<option value="">Change Status...</option>
						<option value="active">Active</option>
						<option value="suspended">Suspended</option>
						<option value="banned">Banned</option>
					</select>
					
					<button
						on:click={clearSelection}
						class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
					>
						Clear
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Users Table -->
	<div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
		<!-- Table Header -->
		<div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<input
						type="checkbox"
						on:change={(e) => e.target.checked ? selectAllUsers() : clearSelection()}
						checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
						class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
					/>
					<span class="text-sm font-medium text-gray-900">
						{filteredUsers.length} of {totalUsers} users
					</span>
				</div>

				<div class="text-sm text-gray-500">
					Page {currentPage} of {totalPages}
				</div>
			</div>
		</div>

		<!-- Table Content -->
		<div class="divide-y divide-gray-200">
			{#each paginatedUsers as user (user.id)}
				<div class="px-6 py-4 hover:bg-gray-50">
					<div class="flex items-center space-x-4">
						<input
							type="checkbox"
							checked={selectedUsers.has(user.id)}
							on:change={() => toggleUserSelection(user.id)}
							class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
						/>

						<!-- User Info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center space-x-3">
								<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
									<span class="text-sm font-medium text-gray-700">
										{user.display_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
									</span>
								</div>
								
								<div class="flex-1 min-w-0">
									<div class="flex items-center space-x-2">
										<h3 class="text-sm font-medium text-gray-900 truncate">
											{user.display_name || 'No display name'}
										</h3>
										
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getRoleColor(user.role)}">
											<svelte:component this={getRoleIcon(user.role)} class="w-3 h-3 mr-1" />
											{user.role}
										</span>
										
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(user.status)}">
											{user.status}
										</span>
									</div>
									
									<div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
										<span>{user.email}</span>
										<span>•</span>
										<span>Joined {formatDistanceToNow(new Date(user.created_at))} ago</span>
										{#if user.last_sign_in_at}
											<span>•</span>
											<span>Last active {formatDistanceToNow(new Date(user.last_sign_in_at))} ago</span>
										{/if}
									</div>
								</div>
							</div>
						</div>

						<!-- Stats -->
						<div class="hidden lg:flex items-center space-x-6 text-sm text-gray-600">
							<div class="text-center">
								<div class="font-medium text-gray-900">{user.events_created || 0}</div>
								<div class="text-xs">Events Created</div>
							</div>
							<div class="text-center">
								<div class="font-medium text-gray-900">{user.events_attended || 0}</div>
								<div class="text-xs">Events Attended</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center space-x-2">
							<button
								on:click={() => openEditModal(user)}
								class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
								title="Edit User"
							>
								<Edit class="w-4 h-4" />
							</button>
							
							<div class="relative">
								<button
									class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
									title="More Actions"
								>
									<MoreHorizontal class="w-4 h-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
				<div class="flex items-center justify-between">
					<div class="text-sm text-gray-700">
						Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length} results
					</div>
					
					<div class="flex items-center space-x-2">
						<button
							on:click={() => currentPage = Math.max(1, currentPage - 1)}
							disabled={currentPage === 1}
							class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						
						<span class="px-3 py-1.5 text-sm font-medium text-gray-700">
							{currentPage} of {totalPages}
						</span>
						
						<button
							on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
							disabled={currentPage === totalPages}
							class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<!-- Edit User Modal -->
{#if showEditModal && editingUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<div class="p-6 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Edit User</h2>
			</div>
			
			<div class="p-6 space-y-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
					<input
						type="text"
						bind:value={editingUser.display_name}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
					<select
						bind:value={editingUser.role}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="user">User</option>
						<option value="organizer">Organizer</option>
						{#if $isAdmin}
							<option value="admin">Admin</option>
						{/if}
					</select>
				</div>

				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
					<select
						bind:value={editingUser.status}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					>
						<option value="active">Active</option>
						<option value="suspended">Suspended</option>
						<option value="banned">Banned</option>
					</select>
				</div>
			</div>
			
			<div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closeEditModal}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
				>
					Cancel
				</button>
				
				<button
					on:click={async () => {
						if (editingUser) {
							await updateUserRole(editingUser.id, editingUser.role)
							await updateUserStatus(editingUser.id, editingUser.status)
							closeEditModal()
						}
					}}
					class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500"
				>
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}
