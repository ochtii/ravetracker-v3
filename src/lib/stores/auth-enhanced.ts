// Enhanced Auth Store with Optimistic Updates and Error Handling
// =============================================================

import { writable, derived, get } from 'svelte/store'
import { supabase } from '$lib/utils/supabase'
import { db, type DatabaseError, handleDatabaseError } from '$lib/utils/database'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { browser } from '$app/environment'
import type { Database } from '$lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
	user: User | null
	profile: Profile | null
	session: Session | null
	loading: boolean
	error: DatabaseError | null
	isAuthenticated: boolean
	isOrganizer: boolean
	isInitialized: boolean
}

interface AuthOperations {
	signIn: (email: string, password: string) => Promise<{ error: DatabaseError | null }>
	signUp: (email: string, password: string, metadata?: any) => Promise<{ error: DatabaseError | null }>
	signOut: () => Promise<{ error: DatabaseError | null }>
	updateProfile: (updates: Partial<Profile>, optimistic?: boolean) => Promise<{ error: DatabaseError | null }>
	uploadAvatar: (file: File) => Promise<{ error: DatabaseError | null }>
	resetPassword: (email: string) => Promise<{ error: DatabaseError | null }>
	updatePassword: (newPassword: string) => Promise<{ error: DatabaseError | null }>
	refresh: () => Promise<void>
	clearError: () => void
	becomeOrganizer: () => Promise<{ error: DatabaseError | null }>
}

// Core auth stores
const createAuthStore = () => {
	const initialState: AuthState = {
		user: null,
		profile: null,
		session: null,
		loading: true,
		error: null,
		isAuthenticated: false,
		isOrganizer: false,
		isInitialized: false
	}

	const { subscribe, set, update } = writable<AuthState>(initialState)

	return {
		subscribe,
		set,
		update,
		
		// Actions
		actions: {
			setLoading: (loading: boolean) => {
				update(state => ({ ...state, loading }))
			},

			setError: (error: DatabaseError | null) => {
				update(state => ({ ...state, error }))
			},

			clearError: () => {
				update(state => ({ ...state, error: null }))
			},

			setUser: (user: User | null) => {
				update(state => ({
					...state,
					user,
					isAuthenticated: !!user
				}))
			},

			setProfile: (profile: Profile | null) => {
				update(state => ({
					...state,
					profile,
					isOrganizer: profile?.is_organizer || false
				}))
			},

			setSession: (session: Session | null) => {
				update(state => ({ ...state, session }))
			},

			setInitialized: () => {
				update(state => ({ ...state, isInitialized: true, loading: false }))
			}
		}
	}
}

export const authStore = createAuthStore()

// Convenience derived stores
export const user = derived(authStore, state => state.user)
export const profile = derived(authStore, state => state.profile)
export const session = derived(authStore, state => state.session)
export const loading = derived(authStore, state => state.loading)
export const error = derived(authStore, state => state.error)
export const isAuthenticated = derived(authStore, state => state.isAuthenticated)
export const isOrganizer = derived(authStore, state => state.isOrganizer)
export const isInitialized = derived(authStore, state => state.isInitialized)

// User role derivations
export const userRole = derived(profile, ($profile) => {
	if (!$profile) return 'user'
	if ($profile.role === 'admin') return 'admin'
	if ($profile.is_organizer || $profile.role === 'organizer') return 'organizer'
	return 'user'
})

// Admin check derived store - checks if user has admin role
export const isAdmin = derived(
	[user, profile],
	([$user, $profile]) => {
		if (!$user || !$profile) return false;
		return $profile.role === 'admin';
	}
);

export const hasAdminAccess = derived(profile, ($profile) => $profile?.role === 'admin')
export const hasOrganizerAccess = derived(profile, ($profile) => $profile?.role === 'admin' || $profile?.is_organizer || $profile?.role === 'organizer')

// Auth operations
export const auth: AuthOperations = {
	async signIn(email: string, password: string) {
		authStore.actions.setLoading(true)
		authStore.actions.clearError()

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			})

			if (error) {
				const dbError = handleDatabaseError(error)
				authStore.actions.setError(dbError)
				return { error: dbError }
			}

			if (data.user) {
				authStore.actions.setUser(data.user)
				authStore.actions.setSession(data.session)
				
				// Load profile
				await loadUserProfile(data.user.id)
			}

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			authStore.actions.setLoading(false)
		}
	},

	async signUp(email: string, password: string, metadata = {}) {
		authStore.actions.setLoading(true)
		authStore.actions.clearError()

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: metadata
				}
			})

			if (error) {
				const dbError = handleDatabaseError(error)
				authStore.actions.setError(dbError)
				return { error: dbError }
			}

			if (data.user) {
				authStore.actions.setUser(data.user)
				authStore.actions.setSession(data.session)
			}

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			authStore.actions.setLoading(false)
		}
	},

	async signOut() {
		authStore.actions.setLoading(true)
		authStore.actions.clearError()

		try {
			const { error } = await supabase.auth.signOut()

			if (error) {
				const dbError = handleDatabaseError(error)
				authStore.actions.setError(dbError)
				return { error: dbError }
			}

			// Clear all auth state
			authStore.actions.setUser(null)
			authStore.actions.setProfile(null)
			authStore.actions.setSession(null)

			// Clear database cache
			db.utils.clearCache()

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		} finally {
			authStore.actions.setLoading(false)
		}
	},

	async updateProfile(updates: Partial<Profile>, optimistic = true) {
		const currentProfile = get(profile)
		if (!currentProfile) {
			const error: DatabaseError = {
				code: 'NO_USER',
				message: 'No user profile found'
			}
			authStore.actions.setError(error)
			return { error }
		}

		// Optimistic update
		if (optimistic) {
			const optimisticProfile = { ...currentProfile, ...updates }
			authStore.actions.setProfile(optimisticProfile)
		}

		try {
			const { data, error } = await db.profiles.update(currentProfile.user_id, updates)

			if (error) {
				// Revert optimistic update on error
				if (optimistic) {
					authStore.actions.setProfile(currentProfile)
				}
				authStore.actions.setError(error)
				return { error }
			}

			// Update with real data
			authStore.actions.setProfile(data)
			authStore.actions.clearError()

			return { error: null }
		} catch (error) {
			// Revert optimistic update on error
			if (optimistic) {
				authStore.actions.setProfile(currentProfile)
			}
			
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		}
	},

	async uploadAvatar(file: File) {
		const currentUser = get(user)
		if (!currentUser) {
			const error: DatabaseError = {
				code: 'NO_USER',
				message: 'No user found'
			}
			authStore.actions.setError(error)
			return { error }
		}

		try {
			const { data: url, error } = await db.profiles.uploadAvatar(currentUser.id, file)

			if (error) {
				authStore.actions.setError(error)
				return { error }
			}

			// Update profile with new avatar URL
			const currentProfile = get(profile)
			if (currentProfile) {
				authStore.actions.setProfile({
					...currentProfile,
					avatar_url: url
				})
			}

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		}
	},

	async resetPassword(email: string) {
		authStore.actions.clearError()

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			})

			if (error) {
				const dbError = handleDatabaseError(error)
				authStore.actions.setError(dbError)
				return { error: dbError }
			}

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		}
	},

	async updatePassword(newPassword: string) {
		authStore.actions.clearError()

		try {
			const { error } = await supabase.auth.updateUser({
				password: newPassword
			})

			if (error) {
				const dbError = handleDatabaseError(error)
				authStore.actions.setError(dbError)
				return { error: dbError }
			}

			return { error: null }
		} catch (error) {
			const dbError = handleDatabaseError(error)
			authStore.actions.setError(dbError)
			return { error: dbError }
		}
	},

	async refresh() {
		authStore.actions.setLoading(true)

		try {
			const { data: { session }, error } = await supabase.auth.getSession()

			if (error) {
				console.error('Session error:', error)
				authStore.actions.setUser(null)
				authStore.actions.setProfile(null)
				authStore.actions.setSession(null)
			} else if (session?.user) {
				authStore.actions.setUser(session.user)
				authStore.actions.setSession(session)
				await loadUserProfile(session.user.id)
			} else {
				authStore.actions.setUser(null)
				authStore.actions.setProfile(null)
				authStore.actions.setSession(null)
			}
		} catch (error) {
			console.error('Auth refresh error:', error)
			authStore.actions.setUser(null)
			authStore.actions.setProfile(null)
			authStore.actions.setSession(null)
		} finally {
			authStore.actions.setLoading(false)
			authStore.actions.setInitialized()
		}
	},

	clearError() {
		authStore.actions.clearError()
	},

	async becomeOrganizer() {
		const currentProfile = get(profile)
		if (!currentProfile) {
			const error: DatabaseError = {
				code: 'NO_USER',
				message: 'No user profile found'
			}
			authStore.actions.setError(error)
			return { error }
		}

		if (currentProfile.is_organizer) {
			return { error: null } // Already an organizer
		}

		return await auth.updateProfile({ is_organizer: true }, true)
	}
}

// Helper function to load user profile
async function loadUserProfile(userId: string) {
	try {
		const { data, error } = await db.profiles.get(userId, { useCache: false })

		if (error) {
			console.error('Profile load error:', error)
			authStore.actions.setError(error)
			return
		}

		if (data) {
			authStore.actions.setProfile(data)
		} else {
			// Profile doesn't exist, try to create it
			await createUserProfile(userId)
		}
	} catch (error) {
		console.error('Profile load error:', error)
		const dbError = handleDatabaseError(error)
		authStore.actions.setError(dbError)
	}
}

// Helper function to create user profile
async function createUserProfile(userId: string) {
	try {
		const currentUser = get(user)
		if (!currentUser) return

		const profileData = {
			user_id: userId,
			email: currentUser.email || '',
			first_name: currentUser.user_metadata?.first_name || null,
			last_name: currentUser.user_metadata?.last_name || null,
			username: currentUser.user_metadata?.username || null,
			avatar_url: currentUser.user_metadata?.avatar_url || null,
			is_organizer: false,
			is_verified: false,
			privacy_level: 'public',
			email_notifications: true,
			push_notifications: true
		}

		const { data, error } = await db.profiles.create(profileData)

		if (error) {
			console.error('Profile creation error:', error)
			authStore.actions.setError(error)
			return
		}

		if (data) {
			authStore.actions.setProfile(data)
		}
	} catch (error) {
		console.error('Profile creation error:', error)
		const dbError = handleDatabaseError(error)
		authStore.actions.setError(dbError)
	}
}

// Initialize auth state
if (browser) {
	// Set up auth state listener
	supabase.auth.onAuthStateChange(async (event, session) => {
		console.log('Auth state changed:', event, !!session)

		if (event === 'SIGNED_IN' && session?.user) {
			authStore.actions.setUser(session.user)
			authStore.actions.setSession(session)
			await loadUserProfile(session.user.id)
		} else if (event === 'SIGNED_OUT') {
			authStore.actions.setUser(null)
			authStore.actions.setProfile(null)
			authStore.actions.setSession(null)
			db.utils.clearCache()
		} else if (event === 'TOKEN_REFRESHED' && session?.user) {
			authStore.actions.setUser(session.user)
			authStore.actions.setSession(session)
		}

		if (!get(isInitialized)) {
			authStore.actions.setInitialized()
		}
	})

	// Initial session check
	auth.refresh()
}

// Auth guards
export const requireAuth = () => {
	const currentUser = get(user)
	if (!currentUser) {
		throw new Error('Authentication required')
	}
	return currentUser
}

export const requireOrganizer = () => {
	const currentProfile = get(profile)
	if (!currentProfile?.is_organizer) {
		throw new Error('Organizer privileges required')
	}
	return currentProfile
}

// Export for backward compatibility
export { auth as authActions }
