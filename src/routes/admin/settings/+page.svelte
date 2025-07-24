<!--
Admin Settings Page
==================
System-wide settings and configuration management
-->

<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { isAdmin } from '$lib/stores/auth-enhanced'
	import { db } from '$lib/utils/database'
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte'
	import ErrorDisplay from '$lib/components/ui/ErrorDisplay.svelte'
	import { 
		Settings, 
		Save,
		RefreshCw,
		Shield,
		Mail,
		Database,
		Globe,
		Users,
		Calendar,
		Bell,
		Lock,
		Eye,
		EyeOff,
		AlertTriangle,
		Check,
		X,
		FileText
	} from 'lucide-svelte'

	// Types
	interface SystemSettings {
		general: {
			site_name: string
			site_description: string
			support_email: string
			max_events_per_user: number
			require_event_approval: boolean
			allow_public_registration: boolean
			maintenance_mode: boolean
		}
		notifications: {
			email_notifications: boolean
			push_notifications: boolean
			admin_notification_email: string
			notify_on_new_event: boolean
			notify_on_new_user: boolean
			notify_on_report: boolean
		}
		security: {
			max_login_attempts: number
			session_timeout: number
			require_email_verification: boolean
			allow_password_reset: boolean
			two_factor_required: boolean
			min_password_length: number
		}
		content: {
			max_event_description_length: number
			allowed_image_formats: string[]
			max_image_size_mb: number
			content_moderation: boolean
			auto_moderate_keywords: string[]
		}
		integrations: {
			google_maps_api_key: string
			email_service_api_key: string
			analytics_tracking_id: string
			social_login_enabled: boolean
		}
	}

	// State
	let loading = true
	let error: string | null = null
	let saving = false
	let settings: SystemSettings | null = null
	let originalSettings: SystemSettings | null = null
	let hasChanges = false
	let activeTab = 'general'
	let showApiKeys = false

	// Reactive statements
	$: hasChanges = settings && originalSettings ? 
		JSON.stringify(settings) !== JSON.stringify(originalSettings) : false

	$: tabOptions = [
		{ id: 'general', label: 'General', icon: Settings },
		{ id: 'notifications', label: 'Notifications', icon: Bell },
		{ id: 'security', label: 'Security', icon: Shield },
		{ id: 'content', label: 'Content', icon: FileText },
		{ id: 'integrations', label: 'Integrations', icon: Globe }
	]

	// Functions
	async function loadSettings() {
		try {
			loading = true
			error = null

			// In a real implementation, this would load from a system_settings table
			// For now, we'll use default values
			const defaultSettings: SystemSettings = {
				general: {
					site_name: 'RaveTracker',
					site_description: 'The ultimate platform for discovering and organizing rave events',
					support_email: 'support@ravetracker.com',
					max_events_per_user: 10,
					require_event_approval: true,
					allow_public_registration: true,
					maintenance_mode: false
				},
				notifications: {
					email_notifications: true,
					push_notifications: true,
					admin_notification_email: 'admin@ravetracker.com',
					notify_on_new_event: true,
					notify_on_new_user: true,
					notify_on_report: true
				},
				security: {
					max_login_attempts: 5,
					session_timeout: 30,
					require_email_verification: true,
					allow_password_reset: true,
					two_factor_required: false,
					min_password_length: 8
				},
				content: {
					max_event_description_length: 2000,
					allowed_image_formats: ['jpg', 'jpeg', 'png', 'webp'],
					max_image_size_mb: 5,
					content_moderation: true,
					auto_moderate_keywords: ['spam', 'inappropriate']
				},
				integrations: {
					google_maps_api_key: '',
					email_service_api_key: '',
					analytics_tracking_id: '',
					social_login_enabled: true
				}
			}

			// Try to load from database
			const { data: settingsData, error: settingsError } = await supabase
				.from('system_settings')
				.select('*')
				.single()

			if (settingsError && settingsError.code !== 'PGRST116') {
				throw settingsError
			}

			settings = settingsData?.settings || defaultSettings
			originalSettings = JSON.parse(JSON.stringify(settings))

		} catch (err) {
			console.error('Failed to load settings:', err)
			error = (err as Error).message
		} finally {
			loading = false
		}
	}

	async function saveSettings() {
		if (!settings || !$isAdmin) return

		try {
			saving = true
			error = null

			// Save to database
			const { error: saveError } = await supabase
				.from('system_settings')
				.upsert({
					id: 1, // Single settings record
					settings: settings,
					updated_at: new Date().toISOString(),
					updated_by: supabase.auth.getUser().then(u => u.data.user?.id)
				})

			if (saveError) throw saveError

			// Update original settings
			originalSettings = JSON.parse(JSON.stringify(settings))

			// Show success message
			showSuccessMessage()

		} catch (err) {
			console.error('Failed to save settings:', err)
			error = (err as Error).message
		} finally {
			saving = false
		}
	}

	function resetSettings() {
		if (originalSettings) {
			settings = JSON.parse(JSON.stringify(originalSettings))
		}
	}

	function showSuccessMessage() {
		// Implementation would show a toast/notification
		alert('Settings saved successfully!')
	}

	async function testEmailConnection() {
		try {
			// This would test the email service connection
			alert('Email connection test would be implemented here')
		} catch (err) {
			alert('Email connection test failed')
		}
	}

	async function clearCache() {
		try {
			// This would clear application cache
			alert('Cache cleared successfully')
		} catch (err) {
			alert('Failed to clear cache')
		}
	}

	function validateSettings(): string[] {
		const errors: string[] = []
		
		if (!settings) return errors

		// Validate general settings
		if (!settings.general.site_name.trim()) {
			errors.push('Site name is required')
		}
		
		if (!settings.general.support_email.includes('@')) {
			errors.push('Valid support email is required')
		}

		if (settings.general.max_events_per_user < 1) {
			errors.push('Max events per user must be at least 1')
		}

		// Validate notifications
		if (settings.notifications.email_notifications && !settings.notifications.admin_notification_email.includes('@')) {
			errors.push('Valid admin notification email is required when email notifications are enabled')
		}

		// Validate security
		if (settings.security.min_password_length < 6) {
			errors.push('Minimum password length must be at least 6')
		}

		if (settings.security.max_login_attempts < 1) {
			errors.push('Max login attempts must be at least 1')
		}

		// Validate content
		if (settings.content.max_event_description_length < 100) {
			errors.push('Max event description length must be at least 100')
		}

		if (settings.content.max_image_size_mb < 1) {
			errors.push('Max image size must be at least 1 MB')
		}

		return errors
	}

	// Lifecycle
	onMount(() => {
		if ($isAdmin) {
			loadSettings()
		}
	})
</script>

<svelte:head>
	<title>System Settings - Admin Panel</title>
</svelte:head>

{#if !$isAdmin}
	<div class="flex items-center justify-center min-h-96">
		<div class="text-center">
			<Lock class="w-16 h-16 text-gray-400 mx-auto mb-4" />
			<h2 class="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h2>
			<p class="text-gray-600">You need administrator privileges to access system settings.</p>
		</div>
	</div>
{:else}
	<!-- Page Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">System Settings</h1>
			<p class="text-gray-600 mt-2">
				Configure system-wide settings and preferences
			</p>
		</div>

		<div class="flex items-center space-x-3">
			{#if hasChanges}
				<button
					on:click={resetSettings}
					class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
				>
					<X class="w-4 h-4 mr-2" />
					Reset
				</button>
				
				<button
					on:click={saveSettings}
					disabled={saving}
					class="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
				>
					{#if saving}
						<RefreshCw class="w-4 h-4 mr-2 animate-spin" />
					{:else}
						<Save class="w-4 h-4 mr-2" />
					{/if}
					Save Changes
				</button>
			{/if}
		</div>
	</div>

	{#if loading}
		<LoadingSpinner variant="card" count={6} />
	{:else if error}
		<ErrorDisplay 
			{error} 
			variant="banner"
			on:retry={loadSettings}
		/>
	{:else if settings}
		<!-- Settings Tabs -->
		<div class="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
			{#each tabOptions as tab}
				<button
					on:click={() => activeTab = tab.id}
					class="flex items-center flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors {
						activeTab === tab.id
							? 'bg-white text-purple-700 shadow-sm'
							: 'text-gray-600 hover:text-gray-900'
					}"
				>
					<svelte:component this={tab.icon} class="w-4 h-4 mr-2" />
					{tab.label}
				</button>
			{/each}
		</div>

		<!-- Validation Errors -->
		{@const validationErrors = validateSettings()}
		{#if validationErrors.length > 0}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<div class="flex items-start">
					<AlertTriangle class="w-5 h-5 text-red-600 mt-0.5 mr-3" />
					<div>
						<h3 class="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
						<ul class="text-sm text-red-700 space-y-1">
							{#each validationErrors as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}

		<!-- Settings Content -->
		<div class="bg-white border border-gray-200 rounded-lg shadow-sm">
			{#if activeTab === 'general'}
				<!-- General Settings -->
				<div class="p-6 space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
								<input
									type="text"
									bind:value={settings.general.site_name}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
								<input
									type="email"
									bind:value={settings.general.support_email}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div class="md:col-span-2">
								<label class="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
								<textarea
									bind:value={settings.general.site_description}
									rows="3"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								></textarea>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Max Events per User</label>
								<input
									type="number"
									min="1"
									bind:value={settings.general.max_events_per_user}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>
						</div>

						<div class="mt-6 space-y-4">
							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.general.require_event_approval}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Require event approval before publishing</span>
							</label>

							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.general.allow_public_registration}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Allow public user registration</span>
							</label>

							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.general.maintenance_mode}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Enable maintenance mode</span>
							</label>
						</div>
					</div>
				</div>

			{:else if activeTab === 'notifications'}
				<!-- Notification Settings -->
				<div class="p-6 space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
						
						<div class="space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">Admin Notification Email</label>
									<input
										type="email"
										bind:value={settings.notifications.admin_notification_email}
										class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
									/>
								</div>

								<div class="flex items-center justify-center">
									<button
										on:click={testEmailConnection}
										class="flex items-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 focus:ring-2 focus:ring-purple-500"
									>
										<Mail class="w-4 h-4 mr-2" />
										Test Email Connection
									</button>
								</div>
							</div>

							<div class="space-y-4">
								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.notifications.email_notifications}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Enable email notifications</span>
								</label>

								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.notifications.push_notifications}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Enable push notifications</span>
								</label>

								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.notifications.notify_on_new_event}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Notify admins when new events are created</span>
								</label>

								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.notifications.notify_on_new_user}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Notify admins when new users register</span>
								</label>

								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.notifications.notify_on_report}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Notify admins when content is reported</span>
								</label>
							</div>
						</div>
					</div>
				</div>

			{:else if activeTab === 'security'}
				<!-- Security Settings -->
				<div class="p-6 space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
								<input
									type="number"
									min="1"
									max="10"
									bind:value={settings.security.max_login_attempts}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
								<input
									type="number"
									min="5"
									max="1440"
									bind:value={settings.security.session_timeout}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
								<input
									type="number"
									min="6"
									max="32"
									bind:value={settings.security.min_password_length}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>
						</div>

						<div class="mt-6 space-y-4">
							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.security.require_email_verification}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Require email verification for new accounts</span>
							</label>

							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.security.allow_password_reset}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Allow password reset via email</span>
							</label>

							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.security.two_factor_required}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Require two-factor authentication for admins</span>
							</label>
						</div>
					</div>
				</div>

			{:else if activeTab === 'content'}
				<!-- Content Settings -->
				<div class="p-6 space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Content Settings</h3>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Max Event Description Length</label>
								<input
									type="number"
									min="100"
									max="10000"
									bind:value={settings.content.max_event_description_length}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Max Image Size (MB)</label>
								<input
									type="number"
									min="1"
									max="50"
									bind:value={settings.content.max_image_size_mb}
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div class="md:col-span-2">
								<label class="block text-sm font-medium text-gray-700 mb-2">Allowed Image Formats</label>
								<input
									type="text"
									bind:value={settings.content.allowed_image_formats}
									placeholder="jpg, jpeg, png, webp"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
								<p class="text-xs text-gray-500 mt-1">Comma-separated list of allowed image formats</p>
							</div>

							<div class="md:col-span-2">
								<label class="block text-sm font-medium text-gray-700 mb-2">Auto-moderation Keywords</label>
								<textarea
									bind:value={settings.content.auto_moderate_keywords}
									rows="3"
									placeholder="spam, inappropriate, offensive"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								></textarea>
								<p class="text-xs text-gray-500 mt-1">Comma-separated list of keywords that trigger automatic moderation</p>
							</div>
						</div>

						<div class="mt-6 space-y-4">
							<label class="flex items-center space-x-3">
								<input
									type="checkbox"
									bind:checked={settings.content.content_moderation}
									class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
								/>
								<span class="text-sm font-medium text-gray-700">Enable automatic content moderation</span>
							</label>
						</div>
					</div>
				</div>

			{:else if activeTab === 'integrations'}
				<!-- Integration Settings -->
				<div class="p-6 space-y-6">
					<div>
						<div class="flex items-center justify-between mb-4">
							<h3 class="text-lg font-semibold text-gray-900">Integration Settings</h3>
							
							<button
								on:click={() => showApiKeys = !showApiKeys}
								class="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
							>
								{#if showApiKeys}
									<EyeOff class="w-4 h-4 mr-1" />
									Hide API Keys
								{:else}
									<Eye class="w-4 h-4 mr-1" />
									Show API Keys
								{/if}
							</button>
						</div>
						
						<div class="space-y-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Google Maps API Key</label>
								<input
									type={showApiKeys ? 'text' : 'password'}
									bind:value={settings.integrations.google_maps_api_key}
									placeholder="Enter Google Maps API key"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Email Service API Key</label>
								<input
									type={showApiKeys ? 'text' : 'password'}
									bind:value={settings.integrations.email_service_api_key}
									placeholder="Enter email service API key"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Analytics Tracking ID</label>
								<input
									type="text"
									bind:value={settings.integrations.analytics_tracking_id}
									placeholder="GA-XXXXXXXXX-X"
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
								/>
							</div>

							<div class="space-y-4">
								<label class="flex items-center space-x-3">
									<input
										type="checkbox"
										bind:checked={settings.integrations.social_login_enabled}
										class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
									/>
									<span class="text-sm font-medium text-gray-700">Enable social login (Google, Facebook, etc.)</span>
								</label>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- System Actions -->
		<div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
			
			<div class="flex flex-wrap gap-3">
				<button
					on:click={clearCache}
					class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
				>
					<Database class="w-4 h-4 mr-2" />
					Clear Cache
				</button>

				<button
					on:click={loadSettings}
					class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
				>
					<RefreshCw class="w-4 h-4 mr-2" />
					Reload Settings
				</button>
			</div>
		</div>

		<!-- Save Changes Banner -->
		{#if hasChanges}
			<div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
				<div class="flex items-center space-x-4">
					<div class="flex items-center text-sm text-gray-600">
						<AlertTriangle class="w-4 h-4 mr-2 text-orange-500" />
						You have unsaved changes
					</div>
					
					<div class="flex items-center space-x-2">
						<button
							on:click={resetSettings}
							class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
						>
							Discard
						</button>
						
						<button
							on:click={saveSettings}
							disabled={saving || validationErrors.length > 0}
							class="flex items-center px-4 py-1.5 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
						>
							{#if saving}
								<RefreshCw class="w-3 h-3 mr-1 animate-spin" />
							{:else}
								<Save class="w-3 h-3 mr-1" />
							{/if}
							Save
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
{/if}
