/**
 * Action Code Service
 * ===================
 * Service for managing special action codes (admin invites, special access codes, etc.)
 */

import { supabase } from '$lib/utils/supabase'
import type { ActionCode, CreateActionCodeData, ActionCodeType } from '$lib/types/invite'

export class ActionCodeService {
  /**
   * Create a new action code
   */
  async createActionCode(data: CreateActionCodeData): Promise<ActionCode> {
    try {
      const { data: result, error } = await supabase
        .from('action_codes')
        .insert({
          code: data.code,
          action_type: data.action_type,
          created_by: data.created_by,
          expires_at: data.expires_at,
          max_uses: data.max_uses || 1,
          metadata: data.metadata || {},
          is_active: true,
          current_uses: 0
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create action code: ${error.message}`)
      }

      return result as ActionCode
    } catch (error) {
      console.error('Error creating action code:', error)
      throw error
    }
  }

  /**
   * Get all action codes
   */
  async getActionCodes(): Promise<ActionCode[]> {
    try {
      const { data, error } = await supabase
        .from('action_codes')
        .select(`
          *,
          profiles!action_codes_created_by_fkey(username)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch action codes: ${error.message}`)
      }

      return data as ActionCode[]
    } catch (error) {
      console.error('Error fetching action codes:', error)
      throw error
    }
  }

  /**
   * Get action code by code string
   */
  async getActionCodeByCode(code: string): Promise<ActionCode | null> {
    try {
      const { data, error } = await supabase
        .from('action_codes')
        .select(`
          *,
          profiles!action_codes_created_by_fkey(username)
        `)
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Failed to fetch action code: ${error.message}`)
      }

      return data as ActionCode
    } catch (error) {
      console.error('Error fetching action code by code:', error)
      throw error
    }
  }

  /**
   * Validate and use an action code
   */
  async useActionCode(code: string, userId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const actionCode = await this.getActionCodeByCode(code)

      if (!actionCode) {
        return { success: false, message: 'Invalid action code' }
      }

      // Check if expired
      if (new Date() > new Date(actionCode.expires_at)) {
        return { success: false, message: 'Action code has expired' }
      }

      // Check if max uses reached
      if (actionCode.current_uses >= actionCode.max_uses) {
        return { success: false, message: 'Action code has been fully used' }
      }

      // Update usage count
      const { error } = await supabase
        .from('action_codes')
        .update({
          current_uses: actionCode.current_uses + 1,
          last_used_at: new Date().toISOString(),
          last_used_by: userId
        })
        .eq('id', actionCode.id)

      if (error) {
        throw new Error(`Failed to update action code usage: ${error.message}`)
      }

      return {
        success: true,
        message: 'Action code used successfully',
        data: {
          action_type: actionCode.action_type,
          metadata: actionCode.metadata
        }
      }
    } catch (error) {
      console.error('Error using action code:', error)
      return { success: false, message: 'Failed to process action code' }
    }
  }

  /**
   * Deactivate an action code
   */
  async deactivateActionCode(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('action_codes')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to deactivate action code: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error deactivating action code:', error)
      return false
    }
  }

  /**
   * Delete an action code
   */
  async deleteActionCode(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('action_codes')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete action code: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting action code:', error)
      return false
    }
  }

  /**
   * Generate a random action code
   */
  generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  /**
   * Get action code statistics
   */
  async getActionCodeStats(): Promise<{
    total: number
    active: number
    expired: number
    fullyUsed: number
    byType: Record<ActionCodeType, number>
  }> {
    try {
      const { data, error } = await supabase
        .from('action_codes')
        .select('action_type, is_active, expires_at, current_uses, max_uses')

      if (error) {
        throw new Error(`Failed to fetch action code stats: ${error.message}`)
      }

      const now = new Date()
      const stats = {
        total: data.length,
        active: 0,
        expired: 0,
        fullyUsed: 0,
        byType: {} as Record<ActionCodeType, number>
      }

      data.forEach(code => {
        // Count by type
        stats.byType[code.action_type] = (stats.byType[code.action_type] || 0) + 1

        // Count by status
        if (!code.is_active) {
          return // Skip inactive codes
        }

        if (new Date(code.expires_at) < now) {
          stats.expired++
        } else if (code.current_uses >= code.max_uses) {
          stats.fullyUsed++
        } else {
          stats.active++
        }
      })

      return stats
    } catch (error) {
      console.error('Error fetching action code stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const actionCodeService = new ActionCodeService()
