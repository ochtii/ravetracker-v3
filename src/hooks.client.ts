import type { HandleClientError } from '@sveltejs/kit'
import { supabase } from '$lib/utils/supabase'
import { browser } from '$app/environment'

// Export an init function
export const init = () => {
  console.log('RaveTracker v3.0 client initialized')
}

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/events/create',
  '/events/edit',
  '/favorites',
  '/settings'
]

// Admin-only routes
const adminRoutes = [
  '/admin'
]

// Auth routes that should redirect if already logged in
const authRoutes = [
  '/auth/login',
  '/auth/register'
]

// Check if a route requires authentication
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

// Check if a route is admin-only
function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route))
}

// Check if a route is an auth route
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route))
}

// Initialize authentication state and handle route protection
async function initAuth() {
  if (!browser) return

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return
    }

    const currentPath = window.location.pathname
    
    // Handle route protection based on authentication status
    if (session) {
      // User is authenticated
      
      // Redirect from auth routes to dashboard if already logged in
      if (isAuthRoute(currentPath)) {
        const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/dashboard'
        window.location.replace(redirectTo)
        return
      }

      // Check admin permissions for admin routes (simplified for now)
      if (isAdminRoute(currentPath)) {
        // For now, redirect all admin routes to dashboard
        // TODO: Add proper admin role checking once database schema is updated
        window.location.replace('/dashboard')
        return
      }
    } else {
      // User is not authenticated
      
      // Redirect to login for protected routes
      if (isProtectedRoute(currentPath)) {
        const loginUrl = new URL('/auth/login', window.location.origin)
        loginUrl.searchParams.set('redirectTo', currentPath)
        window.location.replace(loginUrl.toString())
        return
      }
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, _session) => {
      const currentPath = window.location.pathname
      
      switch (event) {
        case 'SIGNED_IN':
          // User signed in
          if (isAuthRoute(currentPath)) {
            const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/dashboard'
            window.location.replace(redirectTo)
          }
          break
          
        case 'SIGNED_OUT':
          // User signed out
          if (isProtectedRoute(currentPath) || isAdminRoute(currentPath)) {
            window.location.replace('/auth/login')
          }
          break
          
        case 'TOKEN_REFRESHED':
          // Token was refreshed, continue normally
          break
          
        case 'USER_UPDATED':
          // User profile was updated, no action needed
          break
      }
    })

  } catch (error) {
    console.error('Auth initialization error:', error)
  }
}

// Initialize auth when the client loads
if (browser) {
  initAuth()
}

// Handle client-side errors
export const handleError: HandleClientError = ({ error, event }) => {
  console.error('Client error:', error, event)
  
  // Don't log auth errors to external services
  const errorMessage = error instanceof Error ? error.message : String(error)
  if (errorMessage.includes('auth') || errorMessage.includes('session')) {
    return {
      message: 'Ein Authentifizierungsfehler ist aufgetreten'
    }
  }

  return {
    message: 'Ein unerwarteter Fehler ist aufgetreten'
  }
}
