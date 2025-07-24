/**
 * RaveTracker v3.0 - Profile Invites Server Handler
 * =================================================
 * Server-side data loading and actions for invite management
 */

import { error, redirect } from '@sveltejs/kit'
import { supabase } from '$lib/utils/supabase'
import { inviteService } from '$lib/services/invite-service'
import type { PageServerLoad, Actions } from './$types'
import type { Invite, InviteStats } from '$lib/types/invite'

export const load: PageServerLoad = async ({ url, locals, depends }) => {
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    throw redirect(302, `/auth/login?redirectTo=${encodeURIComponent(url.pathname)}`)
  }

  const userId = session.user.id

  // Set up dependency tracking for real-time updates
  depends('profile:invites')

  try {
    // Load user profile data
    const { data: profileData, error: profileError }: any = await (supabase as any)
      .from('profiles')
      .select('id, username, invite_credits, verification_level')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Failed to load profile:', profileError)
      throw error(500, 'Failed to load user profile')
    }

    // Load invite data and statistics in parallel
    const [invites, stats] = await Promise.all([
      inviteService.getUserInvites(profileData.id),
      inviteService.getUserInviteStats(profileData.id)
    ])

    return {
      user: {
        id: profileData.id,
        username: profileData.username,
        verification_level: profileData.verification_level
      },
      invites: invites as Invite[],
      stats: stats as InviteStats,
      meta: {
        title: 'Invite-Management',
        description: 'Verwalte deine RaveTracker Invite-Codes'
      }
    }
  } catch (err) {
    console.error('Failed to load invite data:', err)
    
    // Return minimal data structure on error
    return {
      user: null,
      invites: [],
      stats: {
        totalCreated: 0,
        totalUsed: 0,
        totalExpired: 0,
        currentCredits: 0,
        successfulRegistrations: 0
      },
      error: 'Fehler beim Laden der Invite-Daten'
    }
  }
}

export const actions: Actions = {
  // Create new invite
  createInvite: async ({ request, locals }) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        status: 401,
        body: { error: 'Nicht authentifiziert' }
      }
    }

    try {
      // Get user profile ID
      const { data: profileData, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('id, invite_credits')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profileData) {
        return {
          status: 404,
          body: { error: 'Benutzerprofil nicht gefunden' }
        }
      }

      // Check if user has credits
      if (profileData.invite_credits <= 0) {
        return {
          status: 400,
          body: { error: 'Keine Invite-Credits verfügbar' }
        }
      }

      // Create invite
      const invite = await inviteService.createInvite(profileData.id)

      return {
        status: 201,
        body: { 
          success: true, 
          invite,
          message: 'Invite-Code erfolgreich erstellt'
        }
      }
    } catch (err: any) {
      console.error('Failed to create invite:', err)
      
      return {
        status: 500,
        body: { 
          error: err.message || 'Fehler beim Erstellen des Invite-Codes' 
        }
      }
    }
  },

  // Delete unused invite
  deleteInvite: async ({ request, locals }) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        status: 401,
        body: { error: 'Nicht authentifiziert' }
      }
    }

    const formData = await request.formData()
    const inviteId = formData.get('inviteId')?.toString()

    if (!inviteId) {
      return {
        status: 400,
        body: { error: 'Invite-ID erforderlich' }
      }
    }

    try {
      // Get user profile ID
      const { data: profileData, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profileData) {
        return {
          status: 404,
          body: { error: 'Benutzerprofil nicht gefunden' }
        }
      }

      // Delete invite and restore credit
      await inviteService.deleteUnusedInvite(inviteId, profileData.id)

      return {
        status: 200,
        body: { 
          success: true,
          message: 'Invite-Code gelöscht und Credit zurückerstattet'
        }
      }
    } catch (err: any) {
      console.error('Failed to delete invite:', err)
      
      return {
        status: 500,
        body: { 
          error: err.message || 'Fehler beim Löschen des Invite-Codes' 
        }
      }
    }
  },

  // Refresh data (for manual refresh)
  refresh: async ({ request, locals }) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        status: 401,
        body: { error: 'Nicht authentifiziert' }
      }
    }

    try {
      // Get user profile ID
      const { data: profileData, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profileData) {
        return {
          status: 404,
          body: { error: 'Benutzerprofil nicht gefunden' }
        }
      }

      // Load fresh data
      const [invites, stats] = await Promise.all([
        inviteService.getUserInvites(profileData.id),
        inviteService.getUserInviteStats(profileData.id)
      ])

      return {
        status: 200,
        body: { 
          success: true,
          data: { invites, stats },
          message: 'Daten aktualisiert'
        }
      }
    } catch (err: any) {
      console.error('Failed to refresh data:', err)
      
      return {
        status: 500,
        body: { 
          error: err.message || 'Fehler beim Aktualisieren der Daten' 
        }
      }
    }
  },

  // Bulk operations
  bulkDelete: async ({ request, locals }) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        status: 401,
        body: { error: 'Nicht authentifiziert' }
      }
    }

    const formData = await request.formData()
    const inviteIds = formData.get('inviteIds')?.toString()

    if (!inviteIds) {
      return {
        status: 400,
        body: { error: 'Invite-IDs erforderlich' }
      }
    }

    const idArray = inviteIds.split(',').map(id => id.trim()).filter(Boolean)

    if (idArray.length === 0) {
      return {
        status: 400,
        body: { error: 'Keine gültigen Invite-IDs gefunden' }
      }
    }

    try {
      // Get user profile ID
      const { data: profileData, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profileData) {
        return {
          status: 404,
          body: { error: 'Benutzerprofil nicht gefunden' }
        }
      }

      // Delete invites in parallel (with reasonable limit)
      const maxConcurrent = 5
      const results = []
      
      for (let i = 0; i < idArray.length; i += maxConcurrent) {
        const batch = idArray.slice(i, i + maxConcurrent)
        const batchPromises = batch.map(id => 
          inviteService.deleteUnusedInvite(id, profileData.id)
            .then(() => ({ id, success: true }))
            .catch(err => ({ id, success: false, error: err.message }))
        )
        
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      return {
        status: 200,
        body: { 
          success: true,
          message: `${successful} Codes gelöscht${failed > 0 ? `, ${failed} Fehler` : ''}`,
          results
        }
      }
    } catch (err: any) {
      console.error('Failed to bulk delete invites:', err)
      
      return {
        status: 500,
        body: { 
          error: err.message || 'Fehler beim Löschen der Invite-Codes' 
        }
      }
    }
  }
}
