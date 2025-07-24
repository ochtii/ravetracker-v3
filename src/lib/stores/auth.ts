import { writable, derived, get } from 'svelte/store'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { auth, supabase } from '$lib/utils/supabase'
import { browser } from '$app/environment'
import type { Database } from '$lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  role?: 'user' | 'organizer' | 'admin'
}

// Auth state stores
export const user = writable<User | null>(null)
export const session = writable<Session | null>(null)
export const profile = writable<Profile | null>(null)
export const loading = writable<boolean>(true)
export const error = writable<AuthError | null>(null)

// Auth status derived stores
export const isAuthenticated = derived(
  user,
  ($user) => !!$user
)

export const isLoading = derived(
  loading,
  ($loading) => $loading
)

export const hasError = derived(
  error,
  ($error) => !!$error
)

// User role and permissions
export const userRole = derived(
  profile,
  ($profile) => $profile?.role || 'user'
)

export const isAdmin = derived(
  userRole,
  ($role) => $role === 'admin'
)

export const isOrganizer = derived(
  userRole,
  ($role) => $role === 'organizer' || $role === 'admin'
)

export const isVerified = derived(
  profile,
  ($profile) => $profile?.is_verified || false
)

// Combined auth state for easier access
export const authState = derived(
  [user, session, profile, loading, error],
  ([$user, $session, $profile, $loading, $error]) => ({
    user: $user,
    session: $session,
    profile: $profile,
    loading: $loading,
    error: $error,
    isAuthenticated: !!$user,
    isAdmin: $profile?.role === 'admin',
    isOrganizer: $profile?.role === 'organizer' || $profile?.role === 'admin',
    isVerified: $profile?.is_verified || false
  })
)

// Auth actions
export const authActions = {
  // Initialize auth state
  initialize: async () => {
    if (!browser) return

    loading.set(true)
    error.set(null)

    try {
      // Get initial session
      const { data: sessionData, error: sessionError } = await auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (sessionData.session) {
        session.set(sessionData.session)
        user.set(sessionData.session.user)
        await loadUserProfile(sessionData.session.user.id)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('Auth state changed:', event)
        
        session.set(newSession)
        user.set(newSession?.user || null)

        if (newSession?.user) {
          await loadUserProfile(newSession.user.id)
        } else {
          profile.set(null)
        }

        if (event === 'SIGNED_OUT') {
          // Clear all stores on sign out
          clearAuthState()
        }
      })

    } catch (err) {
      console.error('Auth initialization error:', err)
      error.set(err as AuthError)
    } finally {
      loading.set(false)
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, metadata?: {
    first_name?: string
    last_name?: string
    username?: string
  }) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: signUpError } = await auth.signUp(email, password, metadata)
      
      if (signUpError) {
        throw signUpError
      }

      return { data, error: null }
    } catch (err) {
      console.error('Sign up error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: signInError } = await auth.signIn(email, password)
      
      if (signInError) {
        throw signInError
      }

      return { data, error: null }
    } catch (err) {
      console.error('Sign in error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Sign in with OAuth provider
  signInWithProvider: async (provider: 'google' | 'github' | 'discord') => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: providerError } = await auth.signInWithProvider(provider)
      
      if (providerError) {
        throw providerError
      }

      return { data, error: null }
    } catch (err) {
      console.error('Provider sign in error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Sign out
  signOut: async () => {
    loading.set(true)
    error.set(null)

    try {
      const { error: signOutError } = await auth.signOut()
      
      if (signOutError) {
        throw signOutError
      }

      clearAuthState()
      return { error: null }
    } catch (err) {
      console.error('Sign out error:', err)
      error.set(err as AuthError)
      return { error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: resetError } = await auth.resetPassword(email)
      
      if (resetError) {
        throw resetError
      }

      return { data, error: null }
    } catch (err) {
      console.error('Reset password error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Update password
  updatePassword: async (password: string) => {
    loading.set(true)
    error.set(null)

    try {
      const { data, error: updateError } = await auth.updatePassword(password)
      
      if (updateError) {
        throw updateError
      }

      return { data, error: null }
    } catch (err) {
      console.error('Update password error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Update profile
  updateProfile: async (updates: Database['public']['Tables']['profiles']['Update']) => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    loading.set(true)
    error.set(null)

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .select()
        .single()
      
      if (updateError) {
        throw updateError
      }

      profile.set(data)
      return { data, error: null }
    } catch (err) {
      console.error('Update profile error:', err)
      error.set(err as AuthError)
      return { data: null, error: err as AuthError }
    } finally {
      loading.set(false)
    }
  },

  // Upload avatar
  uploadAvatar: async (file: File) => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    loading.set(true)
    error.set(null)

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}/avatar.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .select()
        .single()

      if (profileError) {
        throw profileError
      }

      profile.set(profileData)
      return publicUrl
    } catch (err) {
      console.error('Upload avatar error:', err)
      error.set(err as AuthError)
      throw err
    } finally {
      loading.set(false)
    }
  },

  // Delete user account
  deleteAccount: async () => {
    const currentUser = get(user)
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    loading.set(true)
    error.set(null)

    try {
      // First delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', currentUser.id)

      if (profileError) {
        console.warn('Profile deletion error:', profileError)
      }

      // Delete user account (this requires RLS policies and might need admin auth)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(currentUser.id)
      
      if (deleteError) {
        throw deleteError
      }

      // Clear auth state
      clearAuthState()
      
      return { data: null, error: null }
    } catch (err) {
      console.error('Delete account error:', err)
      error.set(err as AuthError)
      throw err
    } finally {
      loading.set(false)
    }
  },

  // Clear error
  clearError: () => {
    error.set(null)
  }
}

// Helper functions
async function loadUserProfile(userId: string) {
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error loading profile:', profileError)
      
      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            role: 'user',
            is_verified: false,
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        profile.set(newProfile)
      }
    } else {
      profile.set(data)
    }
  } catch (err) {
    console.error('Load profile error:', err)
    error.set(err as AuthError)
  }
}

function clearAuthState() {
  user.set(null)
  session.set(null)
  profile.set(null)
  error.set(null)
}

// Permission helpers
export const permissions = {
  canCreateEvent: derived(
    [isAuthenticated, userRole],
    ([$isAuthenticated, $userRole]) => 
      $isAuthenticated && ($userRole === 'organizer' || $userRole === 'admin')
  ),

  canEditEvent: derived(
    [user, profile],
    ([$user, $profile]) => (eventOrganizerId: string) => {
      if (!$user || !$profile) return false
      return $profile.role === 'admin' || $user.id === eventOrganizerId
    }
  ),

  canDeleteEvent: derived(
    [user, profile],
    ([$user, $profile]) => (eventOrganizerId: string) => {
      if (!$user || !$profile) return false
      return $profile.role === 'admin' || $user.id === eventOrganizerId
    }
  ),

  canModerateContent: derived(
    userRole,
    ($userRole) => $userRole === 'admin'
  ),

  canAccessAdminPanel: derived(
    userRole,
    ($userRole) => $userRole === 'admin'
  )
}

// Auto-initialize if in browser
if (browser) {
  authActions.initialize()
}
