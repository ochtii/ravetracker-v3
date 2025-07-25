/**
 * RaveTracker v3.0 - Invite Service
 * =================================
 * Core service for managing invite codes with cryptographic security,
 * rate limiting, and comprehensive logging.
 */

import { supabase } from '$lib/utils/supabase'
import type { 
  Invite, 
  InviteStats, 
  ValidationResult
} from '$lib/types/invite'
import { 
  InviteSystemError,
  createInviteError,
  sanitizeInviteCode,
  validateUUID,
  logError,
  logInfo,
  logWarning,
  PerformanceTimer
} from '$lib/utils/invite-errors'
import crypto from 'crypto'

// =====================================================
// CONFIGURATION AND CONSTANTS
// =====================================================

const INVITE_CODE_LENGTH = 6
const INVITE_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const DEFAULT_EXPIRY_DAYS = 30
const MAX_GENERATION_ATTEMPTS = 10
const RATE_LIMIT_WINDOW_HOURS = 1
const MAX_INVITES_PER_HOUR = 1

// Blacklisted code patterns (offensive/confusing combinations)
const CODE_BLACKLIST = [
  'FUCK', 'SHIT', 'DAMN', 'HELL', 'SEXY', 'PORN', 'NAZI', 'HATE',
  'KILL', 'DEAD', 'DIE', 'BOMB', 'DRUG', 'RAPE', 'SLUT', 'WHORE',
  '000000', '111111', '222222', '333333', '444444', '555555',
  '666666', '777777', '888888', '999999', 'AAAAAA', 'BBBBBB',
  'ADMIN', 'SYSTEM', 'DELETE', 'REMOVE', 'BANNED', 'ERROR'
]

// =====================================================
// INVITE SERVICE CLASS
// =====================================================

export class InviteService {
  private settings: Map<string, any> = new Map()
  private settingsLoaded = false

  constructor() {
    this.loadSettings()
  }

  // =====================================================
  // SETTINGS MANAGEMENT
  // =====================================================

  /**
   * Load system settings from database
   */
  private async loadSettings(): Promise<void> {
    try {
      const { data, error }: any = await (supabase as any)
        .from('invite_settings')
        .select('setting_key, setting_value')

      if (error) {
        logError(createInviteError.databaseError(error, 'loadSettings'))
        return
      }

      if (data) {
        for (const setting of data) {
          try {
            // Try to parse JSON values, fallback to string
            const value = JSON.parse(setting.setting_value)
            this.settings.set(setting.setting_key, value)
          } catch {
            this.settings.set(setting.setting_key, setting.setting_value)
          }
        }
      }

      this.settingsLoaded = true
      logInfo('InviteService settings loaded', { count: this.settings.size })
    } catch (error) {
      logError(createInviteError.databaseError(error as Error, 'loadSettings'))
    }
  }

  /**
   * Get setting value with fallback
   */
  private getSetting<T>(key: string, defaultValue: T): T {
    if (!this.settingsLoaded) {
      logWarning('Settings not loaded, using default', { key, defaultValue })
      return defaultValue
    }
    return this.settings.get(key) ?? defaultValue
  }

  // =====================================================
  // CODE GENERATION WITH CRYPTOGRAPHIC SECURITY
  // =====================================================

  /**
   * Generate a cryptographically secure 6-character alphanumeric invite code
   */
  generateCode(): string {
    const timer = new PerformanceTimer('generateCode')
    
    try {
      // Use crypto.randomBytes for cryptographic security
      const bytes = crypto.randomBytes(32)
      let code = ''
      
      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        const randomIndex = bytes[i] % INVITE_CODE_ALPHABET.length
        code += INVITE_CODE_ALPHABET[randomIndex]
      }
      
      timer.end()
      return code
    } catch (error) {
      timer.end()
      logError(createInviteError.databaseError(error as Error, 'generateCode'))
      
      // Fallback to less secure but functional method
      let code = ''
      for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
        const randomIndex = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
        code += INVITE_CODE_ALPHABET[randomIndex]
      }
      
      logWarning('Used fallback code generation method')
      return code
    }
  }

  /**
   * Validate invite code format
   */
  validateCodeFormat(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false
    }
    
    const cleanCode = code.trim().toUpperCase()
    
    // Check length and character set
    if (cleanCode.length !== INVITE_CODE_LENGTH) {
      return false
    }
    
    // Check if all characters are in allowed alphabet
    for (const char of cleanCode) {
      if (!INVITE_CODE_ALPHABET.includes(char)) {
        return false
      }
    }
    
    return true
  }

  /**
   * Check if generated code already exists in database
   */
  async checkCodeCollision(code: string): Promise<boolean> {
    const timer = new PerformanceTimer('checkCodeCollision')
    
    try {
      const { data, error }: any = await (supabase as any)
        .from('invites')
        .select('id')
        .eq('code', code)
        .limit(1)

      timer.end()

      if (error) {
        logError(createInviteError.databaseError(error, 'checkCodeCollision'))
        return true // Assume collision on error to be safe
      }

      return data && data.length > 0
    } catch (error) {
      timer.end()
      logError(createInviteError.databaseError(error as Error, 'checkCodeCollision'))
      return true // Assume collision on error to be safe
    }
  }

  /**
   * Check if code is in blacklist
   */
  private isCodeBlacklisted(code: string): boolean {
    const upperCode = code.toUpperCase()
    
    // Check exact matches
    if (CODE_BLACKLIST.includes(upperCode)) {
      return true
    }
    
    // Check if code contains blacklisted substrings
    for (const blacklisted of CODE_BLACKLIST) {
      if (blacklisted.length <= INVITE_CODE_LENGTH && upperCode.includes(blacklisted)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Generate a unique, non-blacklisted invite code
   */
  private async generateUniqueCode(): Promise<string> {
    const timer = new PerformanceTimer('generateUniqueCode')
    
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const code = this.generateCode()
      
      // Check blacklist first (faster)
      if (this.isCodeBlacklisted(code)) {
        logInfo('Generated blacklisted code, retrying', { code, attempt })
        continue
      }
      
      // Check database collision
      const hasCollision = await this.checkCodeCollision(code)
      if (!hasCollision) {
        timer.end()
        logInfo('Generated unique code', { code, attempts: attempt + 1 })
        return code
      }
      
      logInfo('Code collision detected, retrying', { code, attempt })
    }
    
    timer.end()
    throw createInviteError.databaseError(
      new Error('Failed to generate unique code after maximum attempts'),
      'generateUniqueCode'
    )
  }

  // =====================================================
  // RATE LIMITING
  // =====================================================

  /**
   * Check if user has exceeded invite creation rate limit
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const timer = new PerformanceTimer('checkRateLimit')
    
    try {
      const windowStart = new Date()
      windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS)

      const { data, error }: any = await (supabase as any)
        .from('invites')
        .select('id')
        .eq('created_by', userId)
        .gte('created_at', windowStart.toISOString())

      timer.end()

      if (error) {
        logError(createInviteError.databaseError(error, 'checkRateLimit'))
        return // Allow on error to avoid blocking legitimate users
      }

      const inviteCount = data?.length || 0
      const maxInvites = this.getSetting('invite_rate_limit_per_hour', MAX_INVITES_PER_HOUR)

      if (inviteCount >= maxInvites) {
        logWarning('Rate limit exceeded', { userId, inviteCount, maxInvites })
        throw createInviteError.rateLimited({
          attemptsRemaining: 0,
          timeUntilReset: RATE_LIMIT_WINDOW_HOURS * 3600,
          isBlocked: true,
          blockExpiresAt: new Date(Date.now() + RATE_LIMIT_WINDOW_HOURS * 3600 * 1000)
        }, userId)
      }

      logInfo('Rate limit check passed', { userId, inviteCount, maxInvites })
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'checkRateLimit'))
    }
  }

  /**
   * Check if user has sufficient invite credits
   */
  private async checkInviteCredits(userId: string): Promise<number> {
    const timer = new PerformanceTimer('checkInviteCredits')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('invite_credits')
        .eq('id', userId)
        .single()

      timer.end()

      if (error) {
        logError(createInviteError.databaseError(error, 'checkInviteCredits'))
        throw createInviteError.databaseError(error, 'checkInviteCredits')
      }

      const credits = data?.invite_credits || 0
      
      if (credits <= 0) {
        logWarning('Insufficient invite credits', { userId, credits })
        throw createInviteError.insufficientCredits(credits, 1, userId)
      }

      logInfo('Invite credits check passed', { userId, credits })
      return credits
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'checkInviteCredits'))
      throw createInviteError.databaseError(error as Error, 'checkInviteCredits')
    }
  }

  // =====================================================
  // STANDARD USER INVITES
  // =====================================================

  /**
   * Create a new invite for a user
   */
  async createInvite(userId: string): Promise<Invite> {
    const timer = new PerformanceTimer('createInvite')
    
    try {
      // Validate user ID
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      // Check rate limiting
      await this.checkRateLimit(userId)

      // Check invite credits
      const currentCredits = await this.checkInviteCredits(userId)

      // Generate unique code
      const code = await this.generateUniqueCode()

      // Calculate expiry date
      const expiryDays = this.getSetting('default_validity_days', DEFAULT_EXPIRY_DAYS)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      // Create invite in database using transaction
      const { data, error }: any = await (supabase as any).rpc('create_invite_with_credit_deduction', {
        p_user_id: userId,
        p_code: code,
        p_expires_at: expiresAt.toISOString()
      })

      if (error) {
        logError(createInviteError.databaseError(error, 'createInvite'))
        throw createInviteError.databaseError(error, 'createInvite')
      }

      const invite: Invite = {
        id: data.id,
        code,
        created_by: userId,
        used_by: null,
        created_at: new Date(),
        used_at: null,
        expires_at: expiresAt,
        is_active: true,
        is_action_code: false,
        max_uses: 1,
        current_uses: 0
      }

      timer.end()
      
      logInfo('Invite created successfully', {
        userId,
        inviteId: invite.id,
        code,
        expiresAt: expiresAt.toISOString(),
        creditsRemaining: currentCredits - 1
      })

      return invite
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'createInvite'))
      throw createInviteError.databaseError(error as Error, 'createInvite')
    }
  }

  /**
   * Validate an invite code
   */
  async validateCode(code: string, ip: string): Promise<ValidationResult> {
    const timer = new PerformanceTimer('validateCode')
    
    try {
      // Sanitize and validate code format
      const sanitizedCode = sanitizeInviteCode(code)
      
      // Log validation attempt
      // await this.logValidationAttempt(sanitizedCode, ip, null, false)

      // Get invite from database
      const { data, error }: any = await (supabase as any)
        .from('invites')
        .select(`
          id,
          code,
          created_by,
          used_by,
          created_at,
          used_at,
          expires_at,
          is_active,
          is_action_code,
          max_uses,
          current_uses,
          profiles!invites_created_by_fkey(username, verification_level)
        `)
        .eq('code', sanitizedCode)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        timer.end()
        logWarning('Invalid invite code attempted', { code: sanitizedCode, ip })
        
        const result: ValidationResult = {
          isValid: false,
          errorCode: 'INVALID_CODE',
          errorMessage: 'Der eingegebene Invite-Code ist ungültig.',
          invite: null,
          inviterInfo: null
        }
        
        return result
      }

      // Check if code is expired
      const now = new Date()
      const expiresAt = new Date(data.expires_at)
      
      if (now > expiresAt) {
        timer.end()
        logWarning('Expired invite code attempted', { code: sanitizedCode, ip, expiresAt })
        
        const result: ValidationResult = {
          isValid: false,
          errorCode: 'CODE_EXPIRED',
          errorMessage: 'Dieser Invite-Code ist abgelaufen.',
          invite: null,
          inviterInfo: null
        }
        
        return result
      }

      // Check if code is exhausted
      if (data.current_uses >= data.max_uses) {
        timer.end()
        logWarning('Exhausted invite code attempted', { code: sanitizedCode, ip, uses: data.current_uses, maxUses: data.max_uses })
        
        const result: ValidationResult = {
          isValid: false,
          errorCode: 'CODE_EXHAUSTED',
          errorMessage: 'Dieser Invite-Code wurde bereits verwendet.',
          invite: null,
          inviterInfo: null
        }
        
        return result
      }

      // Log successful validation
      // await this.logValidationAttempt(sanitizedCode, ip, null, true)

      timer.end()

      const invite: Invite = {
        id: data.id,
        code: data.code,
        created_by: data.created_by,
        used_by: data.used_by,
        created_at: new Date(data.created_at),
        used_at: data.used_at ? new Date(data.used_at) : null,
        expires_at: new Date(data.expires_at),
        is_active: data.is_active,
        is_action_code: data.is_action_code,
        max_uses: data.max_uses,
        current_uses: data.current_uses
      }

      const result: ValidationResult = {
        isValid: true,
        errorCode: null,
        errorMessage: null,
        invite,
        inviterInfo: {
          username: data.profiles?.username || 'Unknown',
          verificationLevel: data.profiles?.verification_level || 'unverified'
        }
      }

      logInfo('Invite code validated successfully', { code: sanitizedCode, ip, inviteId: data.id })
      return result
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        const result: ValidationResult = {
          isValid: false,
          errorCode: error.code,
          errorMessage: error.getUserMessage(),
          invite: null,
          inviterInfo: null
        }
        return result
      }
      
      logError(createInviteError.databaseError(error as Error, 'validateCode'))
      
      const result: ValidationResult = {
        isValid: false,
        errorCode: 'UNKNOWN_ERROR',
        errorMessage: 'Ein unbekannter Fehler ist aufgetreten.',
        invite: null,
        inviterInfo: null
      }
      
      return result
    }
  }

  /**
   * Use an invite code for registration
   */
  async useInvite(code: string, newUserId: string): Promise<void> {
    const timer = new PerformanceTimer('useInvite')
    
    try {
      // Validate inputs
      const sanitizedCode = sanitizeInviteCode(code)
      if (!validateUUID(newUserId)) {
        throw createInviteError.validationError('newUserId', newUserId, 'Invalid UUID format')
      }

      // Use database function to handle the complex transaction
      const { error }: any = await (supabase as any).rpc('use_invite_code', {
        p_code: sanitizedCode,
        p_new_user_id: newUserId
      })

      if (error) {
        logError(createInviteError.databaseError(error, 'useInvite'))
        throw createInviteError.databaseError(error, 'useInvite')
      }

      timer.end()
      
      logInfo('Invite code used successfully', {
        code: sanitizedCode,
        newUserId
      })
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'useInvite'))
      throw createInviteError.databaseError(error as Error, 'useInvite')
    }
  }

  /**
   * Get all invites for a user
   */
  async getUserInvites(userId: string): Promise<Invite[]> {
    const timer = new PerformanceTimer('getUserInvites')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      const { data, error }: any = await (supabase as any)
        .from('invites')
        .select(`
          id,
          code,
          created_by,
          used_by,
          created_at,
          used_at,
          expires_at,
          is_active,
          is_action_code,
          max_uses,
          current_uses
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logError(createInviteError.databaseError(error, 'getUserInvites'))
        throw createInviteError.databaseError(error, 'getUserInvites')
      }

      timer.end()

      const invites: Invite[] = (data || []).map(item => ({
        id: item.id,
        code: item.code,
        created_by: item.created_by,
        used_by: item.used_by,
        created_at: new Date(item.created_at),
        used_at: item.used_at ? new Date(item.used_at) : null,
        expires_at: new Date(item.expires_at),
        is_active: item.is_active,
        is_action_code: item.is_action_code,
        max_uses: item.max_uses,
        current_uses: item.current_uses
      }))

      logInfo('Retrieved user invites', { userId, count: invites.length })
      return invites
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getUserInvites'))
      throw createInviteError.databaseError(error as Error, 'getUserInvites')
    }
  }

  /**
   * Delete an unused invite and restore credit
   */
  async deleteUnusedInvite(inviteId: string, userId: string): Promise<void> {
    const timer = new PerformanceTimer('deleteUnusedInvite')
    
    try {
      if (!validateUUID(inviteId)) {
        throw createInviteError.validationError('inviteId', inviteId, 'Invalid UUID format')
      }
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      // Use database function to handle the transaction
      const { error }: any = await (supabase as any).rpc('delete_unused_invite', {
        p_invite_id: inviteId,
        p_user_id: userId
      })

      if (error) {
        logError(createInviteError.databaseError(error, 'deleteUnusedInvite'))
        throw createInviteError.databaseError(error, 'deleteUnusedInvite')
      }

      timer.end()
      
      logInfo('Unused invite deleted and credit restored', {
        inviteId,
        userId
      })
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'deleteUnusedInvite'))
      throw createInviteError.databaseError(error as Error, 'deleteUnusedInvite')
    }
  }

  // =====================================================
  // CREDIT MANAGEMENT
  // =====================================================

  /**
   * Restore invite credit to a user
   */
  async restoreInviteCredit(userId: string): Promise<void> {
    const timer = new PerformanceTimer('restoreInviteCredit')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      const { error } = await supabase
        .from('profiles')
        .update({ invite_credits: supabase.raw('invite_credits + 1') })
        .eq('id', userId)

      if (error) {
        logError(createInviteError.databaseError(error, 'restoreInviteCredit'))
        throw createInviteError.databaseError(error, 'restoreInviteCredit')
      }

      timer.end()
      
      logInfo('Invite credit restored', { userId })
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'restoreInviteCredit'))
      throw createInviteError.databaseError(error as Error, 'restoreInviteCredit')
    }
  }

  /**
   * Update user invite credits (admin function)
   */
  async updateUserCredits(userId: string, amount: number): Promise<void> {
    const timer = new PerformanceTimer('updateUserCredits')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }
      if (typeof amount !== 'number' || amount < 0) {
        throw createInviteError.validationError('amount', amount, 'Amount must be a non-negative number')
      }

      const { error } = await supabase
        .from('profiles')
        .update({ invite_credits: amount })
        .eq('id', userId)

      if (error) {
        logError(createInviteError.databaseError(error, 'updateUserCredits'))
        throw createInviteError.databaseError(error, 'updateUserCredits')
      }

      timer.end()
      
      logInfo('User credits updated', { userId, amount })
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'updateUserCredits'))
      throw createInviteError.databaseError(error as Error, 'updateUserCredits')
    }
  }

  /**
   * Get comprehensive invite statistics for a user
   */
  async getUserInviteStats(userId: string): Promise<InviteStats> {
    const timer = new PerformanceTimer('getUserInviteStats')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      // Get user's current credits
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('invite_credits')
        .eq('id', userId)
        .single()

      if (profileError) {
        logError(createInviteError.databaseError(profileError, 'getUserInviteStats'))
        throw createInviteError.databaseError(profileError, 'getUserInviteStats')
      }

      // Get invite statistics
      const { data: statsData, error: statsError }: any = await (supabase as any)
        .rpc('get_user_invite_stats', { p_user_id: userId })

      if (statsError) {
        logError(createInviteError.databaseError(statsError, 'getUserInviteStats'))
        throw createInviteError.databaseError(statsError, 'getUserInviteStats')
      }

      timer.end()

      const stats: InviteStats = {
        totalCreated: statsData?.total_created || 0,
        totalUsed: statsData?.total_used || 0,
        totalActive: statsData?.total_active || 0,
        totalExpired: statsData?.total_expired || 0,
        currentCredits: profileData?.invite_credits || 0,
        successfulRegistrations: statsData?.successful_registrations || 0,
        conversionRate: statsData?.conversion_rate || 0,
        lastInviteCreated: statsData?.last_invite_created ? new Date(statsData.last_invite_created) : null,
        lastInviteUsed: statsData?.last_invite_used ? new Date(statsData.last_invite_used) : null
      }

      logInfo('Retrieved user invite stats', { userId, stats })
      return stats
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getUserInviteStats'))
      throw createInviteError.databaseError(error as Error, 'getUserInviteStats')
    }
  }

  // =====================================================
  // LOGGING AND MONITORING
  // =====================================================

  /**
   * Log invite validation attempt
   */
  private async logValidationAttempt(
    code: string, 
    ip: string, 
    email: string | null, 
    success: boolean
  ): Promise<void> {
    try {
      const { error }: any = await (supabase as any)
        .from('invite_attempts')
        .insert({
          code_attempted: code,
          ip_address: ip,
          email_attempted: email,
          success,
          attempted_at: new Date().toISOString()
        })

      if (error) {
        // Don't throw here, just log the error
        logError(createInviteError.databaseError(error, 'logValidationAttempt'))
      }
    } catch (error) {
      // Don't throw here, just log the error
      logError(createInviteError.databaseError(error as Error, 'logValidationAttempt'))
    }
  }

  // =====================================================
  // MAINTENANCE FUNCTIONS
  // =====================================================

  /**
   * Clean up expired invites (admin/system function)
   */
  async cleanupExpiredInvites(): Promise<number> {
    const timer = new PerformanceTimer('cleanupExpiredInvites')
    
    try {
      const { data, error }: any = await (supabase as any)
        .rpc('cleanup_expired_invites')

      if (error) {
        logError(createInviteError.databaseError(error, 'cleanupExpiredInvites'))
        throw createInviteError.databaseError(error, 'cleanupExpiredInvites')
      }

      timer.end()
      
      const cleanedCount = data || 0
      logInfo('Cleaned up expired invites', { count: cleanedCount })
      return cleanedCount
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'cleanupExpiredInvites'))
      throw createInviteError.databaseError(error as Error, 'cleanupExpiredInvites')
    }
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const inviteService = new InviteService()
export default inviteService

// =====================================================
// FRONTEND HELPER FUNCTIONS
// =====================================================

/**
 * Frontend-friendly function to validate invite codes with rate limiting
 * Used by the InviteCodeInput component
 */
export async function validateInviteCode(code: string, ip?: string): Promise<ValidationResult> {
  try {
    // Basic format validation first (client-side)
    if (!code || code.length !== 6) {
      return {
        isValid: false,
        isActionCode: false,
        expiresAt: new Date(),
        rateLimitInfo: { 
          attemptsRemaining: 10, 
          timeUntilReset: 3600,
          isBlocked: false
        },
        errorCode: 'INVALID_CODE',
        errorMessage: 'Code muss 6 Zeichen lang sein'
      }
    }

    const sanitizedCode = sanitizeInviteCode(code)
    if (sanitizedCode !== code.toUpperCase()) {
      return {
        isValid: false,
        isActionCode: false,
        expiresAt: new Date(),
        rateLimitInfo: { 
          attemptsRemaining: 10, 
          timeUntilReset: 3600,
          isBlocked: false
        },
        errorCode: 'INVALID_CODE',
        errorMessage: 'Code enthält ungültige Zeichen'
      }
    }

    // Call the main service method
    return await inviteService.validateCode(sanitizedCode, ip || 'unknown')
  } catch (error) {
    logError(createInviteError.databaseError(error as Error, 'validateInviteCode'))
    return {
      isValid: false,
      isActionCode: false,
      expiresAt: new Date(),
      rateLimitInfo: { 
        attemptsRemaining: 0, 
        timeUntilReset: 3600,
        isBlocked: true
      },
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: 'Fehler bei der Validierung'
    }
  }
}

/**
 * Check if user can create more invites (for UI state)
 */
export async function canCreateInvite(userId: string): Promise<{ canCreate: boolean; reason?: string }> {
  try {
    const stats = await inviteService.getUserInviteStats(userId)
    
    // Check if user has remaining credits
    if (stats.user.remainingCredits <= 0) {
      return { canCreate: false, reason: 'Keine Einladungs-Credits verfügbar' }
    }

    // Check if user has created too many invites
    if (stats.user.totalInvitesCreated >= 50) { // Reasonable upper limit
      return { canCreate: false, reason: 'Maximale Anzahl Einladungen erreicht' }
    }

    return { canCreate: true }
  } catch (error) {
    logError(createInviteError.databaseError(error as Error, 'canCreateInvite'))
    return { canCreate: false, reason: 'Fehler beim Prüfen der Berechtigung' }
  }
}
