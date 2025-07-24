/**
 * RaveTracker v3.0 - Verification Service
 * =======================================
 * Comprehensive verification system with eligibility checks, admin review interface,
 * automatic credit assignment, and notification system for status updates.
 */

import { supabase } from '$lib/utils/supabase'
import type { 
  VerificationRequest,
  EligibilityStatus,
  EligibilityReason,
  VerificationStats,
  VerificationLevel
} from '$lib/types/invite'
import { 
  InviteSystemError,
  createInviteError,
  validateUUID,
  logError,
  logInfo,
  PerformanceTimer
} from '$lib/utils/invite-errors'

// =====================================================
// CONFIGURATION AND CONSTANTS
// =====================================================

const VERIFICATION_CONFIG = {
  // Eligibility requirements
  MIN_ACCOUNT_AGE_DAYS: 3,
  MIN_ACTIVITY_POINTS: 10, // Minimum activity score
  COOLDOWN_PERIOD_DAYS: 30,
  
  // Credit assignments per verification level
  CREDIT_ASSIGNMENTS: {
    verified: 5,
    trusted: 10,
    moderator: 20,
    admin: 50
  },
  
  // Review time limits (in hours)
  REVIEW_TIME_LIMITS: {
    urgent: 24,
    normal: 72,
    low: 168 // 1 week
  }
}

// =====================================================
// VERIFICATION SERVICE CLASS
// =====================================================

export class VerificationService {
  private settings: Map<string, any> = new Map()

  constructor() {
    this.loadSettings()
  }

  // =====================================================
  // SETTINGS MANAGEMENT
  // =====================================================

  /**
   * Load verification settings from database
   */
  private async loadSettings(): Promise<void> {
    try {
      // Use generic query to bypass TypeScript type checking until types are regenerated
      const { data, error }: any = await (supabase as any)
        .from('invite_settings')
        .select('setting_key, setting_value')
        .like('setting_key', 'verification_%')

      if (error) {
        logError(createInviteError.databaseError(error, 'loadSettings'))
        return
      }

      if (data && Array.isArray(data)) {
        for (const setting of data) {
          try {
            const value = JSON.parse(setting.setting_value)
            this.settings.set(setting.setting_key, value)
          } catch {
            this.settings.set(setting.setting_key, setting.setting_value)
          }
        }
      }

      logInfo('VerificationService settings loaded', { count: this.settings.size })
    } catch (error) {
      logError(createInviteError.databaseError(error as Error, 'loadSettings'))
    }
  }

  /**
   * Get setting value with fallback
   */
  private getSetting<T>(key: string, defaultValue: T): T {
    return this.settings.get(key) ?? defaultValue
  }

  // =====================================================
  // ELIGIBILITY CHECKING
  // =====================================================

  /**
   * Check if user is eligible for verification
   */
  async checkEligibility(userId: string): Promise<EligibilityStatus> {
    const timer = new PerformanceTimer('checkEligibility')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      const reasons: EligibilityReason[] = []
      let eligible = true

      // Get user profile data
      const { data: profile, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('created_at, is_verified, verification_level, user_id')
        .eq('id', userId)
        .single()

      if (profileError) {
        logError(createInviteError.databaseError(profileError, 'checkEligibility'))
        throw createInviteError.databaseError(profileError, 'checkEligibility')
      }

      if (!profile) {
        throw createInviteError.databaseError(new Error('Profile not found'), 'checkEligibility')
      }

      // Check if user exists in auth system
      const { data: authUser }: any = await (supabase as any).auth.admin.getUserById(profile.user_id)
      
      const accountCreated = new Date(profile.created_at)
      const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))
      const minAccountAge = this.getSetting('min_account_age_days', VERIFICATION_CONFIG.MIN_ACCOUNT_AGE_DAYS)

      // Check 1: Account age
      const accountAgeReason: EligibilityReason = {
        type: 'account_age',
        message: `Account muss mindestens ${minAccountAge} Tage alt sein`,
        met: accountAgeDays >= minAccountAge,
        requiredValue: minAccountAge,
        currentValue: accountAgeDays
      }
      reasons.push(accountAgeReason)
      if (!accountAgeReason.met) eligible = false

      // Check 2: Email verification
      const isEmailVerified = authUser?.email_confirmed_at !== null
      const emailVerificationReason: EligibilityReason = {
        type: 'email_verification',
        message: 'Email-Adresse muss verifiziert sein',
        met: isEmailVerified
      }
      reasons.push(emailVerificationReason)
      if (!emailVerificationReason.met) eligible = false

      // Check 3: No existing pending request
      const { data: existingRequest }: any = await (supabase as any)
        .from('verification_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .limit(1)

      const existingRequestReason: EligibilityReason = {
        type: 'existing_request',
        message: 'Keine ausstehenden Verifizierungsanträge',
        met: !existingRequest || existingRequest.length === 0
      }
      reasons.push(existingRequestReason)
      if (!existingRequestReason.met) eligible = false

      // Check 4: Not in cooldown period
      const cooldownDays = this.getSetting('verification_cooldown_days', VERIFICATION_CONFIG.COOLDOWN_PERIOD_DAYS)
      const { data: lastRequest }: any = await (supabase as any)
        .from('verification_requests')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)

      let cooldownMet = true
      let cooldownExpiresAt: Date | undefined

      if (lastRequest && lastRequest.length > 0) {
        const lastRequestDate = new Date(lastRequest[0].created_at)
        const cooldownExpiry = new Date(lastRequestDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
        cooldownMet = Date.now() > cooldownExpiry.getTime()
        if (!cooldownMet) {
          cooldownExpiresAt = cooldownExpiry
        }
      }

      const cooldownReason: EligibilityReason = {
        type: 'cooldown_period',
        message: `Wartezeit von ${cooldownDays} Tagen nach letztem Antrag`,
        met: cooldownMet
      }
      reasons.push(cooldownReason)
      if (!cooldownReason.met) eligible = false

      // Check 5: Not already verified at higher level
      const currentLevel = profile.verification_level || 'unverified'
      const alreadyVerifiedReason: EligibilityReason = {
        type: 'already_verified',
        message: 'Benutzer ist noch nicht verifiziert oder kann höhere Stufe beantragen',
        met: !['admin', 'moderator', 'trusted'].includes(currentLevel)
      }
      reasons.push(alreadyVerifiedReason)
      if (!alreadyVerifiedReason.met) eligible = false

      timer.end()

      logInfo('Eligibility check completed', { 
        userId, 
        eligible, 
        reasonsCount: reasons.length,
        accountAgeDays
      })

      const result: EligibilityStatus = {
        eligible,
        reasons,
        minimumWaitDays: eligible ? 0 : cooldownDays,
        canReapply: true
      }

      if (lastRequest && lastRequest.length > 0) {
        result.lastRequestDate = new Date(lastRequest[0].created_at)
      }

      if (cooldownExpiresAt) {
        result.cooldownExpiresAt = cooldownExpiresAt
      }

      return result
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'checkEligibility'))
      throw createInviteError.databaseError(error as Error, 'checkEligibility')
    }
  }

  // =====================================================
  // VERIFICATION REQUEST MANAGEMENT
  // =====================================================

  /**
   * Submit a verification request
   */
  async submitVerificationRequest(userId: string, message: string): Promise<VerificationRequest> {
    const timer = new PerformanceTimer('submitVerificationRequest')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      if (!message || message.trim().length < 10) {
        throw createInviteError.validationError('message', message, 'Begründung muss mindestens 10 Zeichen lang sein')
      }

      if (message.length > 500) {
        throw createInviteError.validationError('message', message, 'Begründung darf maximal 500 Zeichen lang sein')
      }

      // Check eligibility first
      const eligibility = await this.checkEligibility(userId)
      if (!eligibility.eligible) {
        const reasons = eligibility.reasons.filter(r => !r.met).map(r => r.message).join(', ')
        throw createInviteError.validationError('eligibility', reasons, `Nutzer ist nicht berechtigt: ${reasons}`)
      }

      // Insert verification request
      const { data: insertedRequest, error: insertError }: any = await (supabase as any)
        .from('verification_requests')
        .insert({
          user_id: userId,
          request_message: message.trim(),
          status: 'pending'
        })
        .select(`
          id,
          user_id,
          status,
          request_message,
          admin_notes,
          recommended_by,
          created_at,
          reviewed_at,
          reviewed_by,
          updated_at
        `)
        .single()

      if (insertError) {
        logError(createInviteError.databaseError(insertError, 'submitVerificationRequest'))
        throw createInviteError.databaseError(insertError, 'submitVerificationRequest')
      }

      // Get user profile data to include in response
      const { data: profile }: any = await (supabase as any)
        .from('profiles')
        .select('id, username, first_name, last_name, verification_level, created_at, user_id')
        .eq('id', userId)
        .single()

      let isEmailVerified = false
      if (profile?.user_id) {
        const { data: authUser }: any = await (supabase as any).auth.admin.getUserById(profile.user_id)
        isEmailVerified = authUser?.email_confirmed_at !== null
      }

      const accountCreated = new Date(profile?.created_at || insertedRequest.created_at)
      const accountAgeDays = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24))

      const verificationRequest: VerificationRequest = {
        id: insertedRequest.id,
        userId: insertedRequest.user_id,
        status: insertedRequest.status,
        requestMessage: insertedRequest.request_message,
        adminNotes: insertedRequest.admin_notes,
        recommendedBy: insertedRequest.recommended_by,
        createdAt: new Date(insertedRequest.created_at),
        reviewedAt: insertedRequest.reviewed_at ? new Date(insertedRequest.reviewed_at) : null,
        reviewedBy: insertedRequest.reviewed_by,
        updatedAt: new Date(insertedRequest.updated_at)
      }

      // Add user info if profile exists
      if (profile) {
        verificationRequest.user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.username,
          email: null, // We don't expose email for security
          verificationLevel: profile.verification_level || 'unverified',
          accountAge: accountAgeDays,
          isEmailVerified
        }
      }

      timer.end()

      logInfo('Verification request submitted', { 
        requestId: verificationRequest.id, 
        userId, 
        messageLength: message.length 
      })

      // TODO: Send notification to user about request submission
      // TODO: Send notification to admins about new request

      return verificationRequest
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'submitVerificationRequest'))
      throw createInviteError.databaseError(error as Error, 'submitVerificationRequest')
    }
  }

  /**
   * Get verification request for a user
   */
  async getVerificationRequest(userId: string): Promise<VerificationRequest | null> {
    const timer = new PerformanceTimer('getVerificationRequest')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      const { data: request, error }: any = await (supabase as any)
        .from('verification_requests')
        .select(`
          id,
          user_id,
          status,
          request_message,
          admin_notes,
          recommended_by,
          created_at,
          reviewed_at,
          reviewed_by,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          timer.end()
          return null
        }
        logError(createInviteError.databaseError(error, 'getVerificationRequest'))
        throw createInviteError.databaseError(error, 'getVerificationRequest')
      }

      if (!request) {
        timer.end()
        return null
      }

      // Get user profile
      const { data: profile }: any = await (supabase as any)
        .from('profiles')
        .select('id, username, first_name, last_name, verification_level, created_at, user_id')
        .eq('id', userId)
        .single()

      timer.end()
      
      const verificationRequest: VerificationRequest = {
        id: request.id,
        userId: request.user_id,
        status: request.status,
        requestMessage: request.request_message,
        adminNotes: request.admin_notes,
        recommendedBy: request.recommended_by,
        createdAt: new Date(request.created_at),
        reviewedAt: request.reviewed_at ? new Date(request.reviewed_at) : null,
        reviewedBy: request.reviewed_by,
        updatedAt: new Date(request.updated_at)
      }

      if (profile) {
        const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        verificationRequest.user = {
          id: profile.id,
          username: profile.username,
          displayName: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.username,
          email: null,
          verificationLevel: profile.verification_level || 'unverified',
          accountAge: accountAgeDays,
          isEmailVerified: true // TODO: Get from auth
        }
      }

      logInfo('Retrieved verification request', { userId, requestId: request.id })
      return verificationRequest
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getVerificationRequest'))
      throw createInviteError.databaseError(error as Error, 'getVerificationRequest')
    }
  }

  /**
   * Get all pending verification requests (admin function)
   */
  async getPendingRequests(): Promise<VerificationRequest[]> {
    const timer = new PerformanceTimer('getPendingRequests')
    
    try {
      const { data: requests, error }: any = await (supabase as any)
        .from('verification_requests')
        .select(`
          id,
          user_id,
          status,
          request_message,
          admin_notes,
          recommended_by,
          created_at,
          reviewed_at,
          reviewed_by,
          updated_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        logError(createInviteError.databaseError(error, 'getPendingRequests'))
        throw createInviteError.databaseError(error, 'getPendingRequests')
      }

      if (!requests || requests.length === 0) {
        timer.end()
        return []
      }

      // Get user profiles for all requests
      const userIds = requests.map((r: any) => r.user_id)
      const { data: profiles }: any = await (supabase as any)
        .from('profiles')
        .select('id, username, first_name, last_name, verification_level, created_at')
        .in('id', userIds)

      const profileMap = new Map()
      if (profiles) {
        profiles.forEach((p: any) => profileMap.set(p.id, p))
      }

      const verificationRequests: VerificationRequest[] = requests.map((request: any) => {
        const profile = profileMap.get(request.user_id)
        const verificationRequest: VerificationRequest = {
          id: request.id,
          userId: request.user_id,
          status: request.status,
          requestMessage: request.request_message,
          adminNotes: request.admin_notes,
          recommendedBy: request.recommended_by,
          createdAt: new Date(request.created_at),
          reviewedAt: request.reviewed_at ? new Date(request.reviewed_at) : null,
          reviewedBy: request.reviewed_by,
          updatedAt: new Date(request.updated_at)
        }

        if (profile) {
          const accountAgeDays = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
          verificationRequest.user = {
            id: profile.id,
            username: profile.username,
            displayName: profile.first_name && profile.last_name 
              ? `${profile.first_name} ${profile.last_name}` 
              : profile.username,
            email: null,
            verificationLevel: profile.verification_level || 'unverified',
            accountAge: accountAgeDays,
            isEmailVerified: true // TODO: Get from auth
          }
        }

        return verificationRequest
      })

      timer.end()
      
      logInfo('Retrieved pending verification requests', { count: verificationRequests.length })
      return verificationRequests
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getPendingRequests'))
      throw createInviteError.databaseError(error as Error, 'getPendingRequests')
    }
  }

  // =====================================================
  // ADMIN REVIEW FUNCTIONS
  // =====================================================

  /**
   * Review a verification request (admin function)
   */
  async reviewRequest(
    requestId: string, 
    decision: 'approved' | 'rejected' | 'needs_info', 
    adminId: string, 
    notes?: string
  ): Promise<void> {
    const timer = new PerformanceTimer('reviewRequest')
    
    try {
      if (!validateUUID(requestId)) {
        throw createInviteError.validationError('requestId', requestId, 'Invalid UUID format')
      }

      if (!validateUUID(adminId)) {
        throw createInviteError.validationError('adminId', adminId, 'Invalid UUID format')
      }

      if (!['approved', 'rejected', 'needs_info'].includes(decision)) {
        throw createInviteError.validationError('decision', decision, 'Invalid decision value')
      }

      if (notes && notes.length > 1000) {
        throw createInviteError.validationError('notes', notes, 'Notizen dürfen maximal 1000 Zeichen lang sein')
      }

      // Get the verification request first
      const { data: request, error: requestError }: any = await (supabase as any)
        .from('verification_requests')
        .select('id, user_id, status')
        .eq('id', requestId)
        .single()

      if (requestError) {
        logError(createInviteError.databaseError(requestError, 'reviewRequest'))
        throw createInviteError.databaseError(requestError, 'reviewRequest')
      }

      if (!request) {
        throw createInviteError.validationError('requestId', requestId, 'Verification request not found')
      }

      if (request.status !== 'pending') {
        throw createInviteError.validationError('status', request.status, 'Request has already been reviewed')
      }

      // Update the verification request
      const { error: updateError } = await (supabase as any)
        .from('verification_requests')
        .update({
          status: decision,
          admin_notes: notes || null,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        logError(createInviteError.databaseError(updateError, 'reviewRequest'))
        throw createInviteError.databaseError(updateError, 'reviewRequest')
      }

      // If approved, grant verification
      if (decision === 'approved') {
        await this.grantVerification(request.user_id, 'verified')
        logInfo('Verification request approved and verification granted', { requestId, userId: request.user_id })
      } else {
        logInfo('Verification request reviewed', { requestId, decision, adminId, hasNotes: !!notes })
      }

      timer.end()

      // TODO: Send notifications to user
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'reviewRequest'))
      throw createInviteError.databaseError(error as Error, 'reviewRequest')
    }
  }

  /**
   * Grant verification to a user and assign credits
   */
  async grantVerification(userId: string, level: VerificationLevel): Promise<void> {
    const timer = new PerformanceTimer('grantVerification')
    
    try {
      if (!validateUUID(userId)) {
        throw createInviteError.validationError('userId', userId, 'Invalid UUID format')
      }

      if (!['verified', 'trusted', 'moderator', 'admin'].includes(level)) {
        throw createInviteError.validationError('level', level, 'Invalid verification level')
      }

      // Get current user data
      const { data: currentProfile, error: profileError }: any = await (supabase as any)
        .from('profiles')
        .select('verification_level, invite_credits')
        .eq('id', userId)
        .single()

      if (profileError) {
        logError(createInviteError.databaseError(profileError, 'grantVerification'))
        throw createInviteError.databaseError(profileError, 'grantVerification')
      }

      // Determine credits to assign
      const validLevels = ['verified', 'trusted', 'moderator', 'admin'] as const
      const creditsToAssign = validLevels.includes(level as any) 
        ? VERIFICATION_CONFIG.CREDIT_ASSIGNMENTS[level as keyof typeof VERIFICATION_CONFIG.CREDIT_ASSIGNMENTS] || 0
        : 0
      const currentCredits = currentProfile?.invite_credits || 0
      const newCredits = Math.max(currentCredits, creditsToAssign)

      // Update user profile
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          verification_level: level,
          is_verified: true,
          invite_credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        logError(createInviteError.databaseError(updateError, 'grantVerification'))
        throw createInviteError.databaseError(updateError, 'grantVerification')
      }

      timer.end()

      logInfo('Verification granted', { 
        userId, 
        level, 
        creditsAssigned: newCredits,
        previousCredits: currentCredits
      })

      // TODO: Send success notification to user
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'grantVerification'))
      throw createInviteError.databaseError(error as Error, 'grantVerification')
    }
  }

  // =====================================================
  // STATISTICS AND REPORTING
  // =====================================================

  /**
   * Get verification statistics (admin function)
   */
  async getVerificationStats(): Promise<VerificationStats> {
    const timer = new PerformanceTimer('getVerificationStats')
    
    try {
      // Get all verification requests
      const { data: requests, error: requestError }: any = await (supabase as any)
        .from('verification_requests')
        .select('status, created_at, reviewed_at')

      if (requestError) {
        logError(createInviteError.databaseError(requestError, 'getVerificationStats'))
        throw createInviteError.databaseError(requestError, 'getVerificationStats')
      }

      const requestsData = requests || []
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Calculate basic counts
      const totalRequests = requestsData.length
      let pendingRequests = 0
      let approvedRequests = 0
      let rejectedRequests = 0
      let requestsThisWeek = 0
      let requestsThisMonth = 0
      let totalReviewTimeHours = 0
      let reviewedCount = 0

      requestsData.forEach((request: any) => {
        const createdAt = new Date(request.created_at)
        
        // Count by status
        switch (request.status) {
          case 'pending':
            pendingRequests++
            break
          case 'approved':
            approvedRequests++
            break
          case 'rejected':
            rejectedRequests++
            break
        }

        // Count by time period
        if (createdAt >= oneWeekAgo) {
          requestsThisWeek++
        }
        if (createdAt >= oneMonthAgo) {
          requestsThisMonth++
        }

        // Calculate review time for reviewed requests
        if (request.reviewed_at && request.status !== 'pending') {
          const reviewedAt = new Date(request.reviewed_at)
          const reviewTimeMs = reviewedAt.getTime() - createdAt.getTime()
          const reviewTimeHours = reviewTimeMs / (1000 * 60 * 60)
          totalReviewTimeHours += reviewTimeHours
          reviewedCount++
        }
      })

      // Calculate averages and rates
      const averageReviewTime = reviewedCount > 0 ? totalReviewTimeHours / reviewedCount : 0
      const reviewedTotal = approvedRequests + rejectedRequests
      const approvalRate = reviewedTotal > 0 ? (approvedRequests / reviewedTotal) * 100 : 0

      const stats: VerificationStats = {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        averageReviewTime: Math.round(averageReviewTime * 100) / 100, // Round to 2 decimal places
        approvalRate: Math.round(approvalRate * 100) / 100, // Round to 2 decimal places
        requestsThisWeek,
        requestsThisMonth
      }

      timer.end()
      logInfo('Verification stats retrieved', { stats })
      return stats

    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getVerificationStats'))
      throw createInviteError.databaseError(error as Error, 'getVerificationStats')
    }
  }

  // =====================================================
  // NOTIFICATION HELPERS
  // =====================================================

  /**
   * Send verification status notification to user
   * TODO: Implement once notification system is ready
   */
  // private async sendStatusNotification(
  //   userId: string, 
  //   status: VerificationStatus, 
  //   message?: string
  // ): Promise<void> {
  //   const timer = new PerformanceTimer('sendStatusNotification')
    
  //   try {
  //     // TODO: Implement actual notification sending once notification system is ready
  //     // This would integrate with the NotificationService from Phase 5.2
      
  //     timer.end()
      
  //     logInfo('Verification status notification sent (placeholder implementation)', { 
  //       userId, 
  //       status, 
  //       hasMessage: !!message 
  //     })
  //   } catch (error) {
  //     timer.end()
  //     logError(createInviteError.databaseError(error as Error, 'sendStatusNotification'))
  //     // Don't throw here - notification failures shouldn't break the main flow
  //   }
  // }

  /**
   * Send admin notification about new verification request
   * TODO: Implement once notification system is ready
   */
  // private async sendAdminNotification(requestId: string, userId: string): Promise<void> {
  //   const timer = new PerformanceTimer('sendAdminNotification')
    
  //   try {
  //     // TODO: Implement actual admin notification once notification system is ready
      
  //     timer.end()
      
  //     logInfo('Admin notification sent (placeholder implementation)', { requestId, userId })
  //   } catch (error) {
  //     timer.end()
  //     logError(createInviteError.databaseError(error as Error, 'sendAdminNotification'))
  //     // Don't throw here - notification failures shouldn't break the main flow
  //   }
  // }

  // =====================================================
  // MAINTENANCE FUNCTIONS
  // =====================================================

  /**
   * Clean up old verification requests (system maintenance)
   */
  async cleanupOldRequests(daysOld: number = 180): Promise<number> {
    const timer = new PerformanceTimer('cleanupOldRequests')
    
    try {
      if (typeof daysOld !== 'number' || daysOld < 30) {
        throw createInviteError.validationError('daysOld', daysOld, 'Days must be a number >= 30')
      }

      // TODO: Implement actual cleanup once database migration is applied
      timer.end()
      
      const cleanedCount = 0
      logInfo('Cleaned up old verification requests (placeholder implementation)', { 
        daysOld, 
        count: cleanedCount 
      })
      return cleanedCount
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'cleanupOldRequests'))
      throw createInviteError.databaseError(error as Error, 'cleanupOldRequests')
    }
  }

  /**
   * Get overdue verification requests (admin function)
   */
  async getOverdueRequests(hoursOverdue: number = 72): Promise<VerificationRequest[]> {
    const timer = new PerformanceTimer('getOverdueRequests')
    
    try {
      // TODO: Implement actual overdue request retrieval once database migration is applied
      timer.end()
      
      logInfo('Retrieved overdue verification requests (placeholder implementation)', { hoursOverdue })
      return [] // Placeholder - no overdue requests
    } catch (error) {
      timer.end()
      if (error instanceof InviteSystemError) {
        throw error
      }
      logError(createInviteError.databaseError(error as Error, 'getOverdueRequests'))
      throw createInviteError.databaseError(error as Error, 'getOverdueRequests')
    }
  }

  // =====================================================
  // INTEGRATION HELPERS
  // =====================================================

  /**
   * Initialize verification service with actual database
   * This should be called after the database migration is applied
   */
  async initializeDatabaseIntegration(): Promise<void> {
    try {
      // TODO: Replace placeholder implementations with actual database calls
      // This method can be extended to set up the real database integration
      logInfo('VerificationService database integration initialized')
    } catch (error) {
      logError(createInviteError.databaseError(error as Error, 'initializeDatabaseIntegration'))
      throw error
    }
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const verificationService = new VerificationService()
export default verificationService
