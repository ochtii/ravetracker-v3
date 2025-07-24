/**
 * RaveTracker v3.0 - Security & Monitoring Service
 * =================================================
 * Comprehensive security service for invite system monitoring,
 * threat detection, and admin security tools
 */

import { supabase } from '$lib/utils/supabase'
import type { 
  SecurityEvent, 
  IPBlock, 
  EmailBlock, 
  ValidationAttempt, 
  ThreatAnalysis, 
  SecurityDashboardStats,
  SecurityReport
} from '$lib/types/invite'

export class SecurityService {
  private useMockData = false

  /**
   * Enable mock data for testing when database is not available
   */
  enableMockData() {
    this.useMockData = true
  }

  /**
   * Generate mock security data for testing
   */
  private generateMockValidationAttempts(): ValidationAttempt[] {
    const mockData: ValidationAttempt[] = []
    const now = new Date()
    
    // Generate 50 mock validation attempts
    for (let i = 0; i < 50; i++) {
      const attempt: ValidationAttempt = {
        id: `mock-${i}`,
        codeAttempted: i % 3 === 0 ? 'INVALID' : 'RAVER23',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        emailAttempted: `user${i}@example.com`,
        success: i % 4 !== 0, // 75% success rate
        attemptedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: ['Germany', 'Netherlands', 'UK', 'France'][Math.floor(Math.random() * 4)],
        isSuspicious: i % 8 === 0, // 12.5% suspicious
        riskScore: Math.random(),
        metadata: {
          attempts_count: Math.floor(Math.random() * 5) + 1
        }
      }
      mockData.push(attempt)
    }
    
    return mockData.sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())
  }

  private generateMockIPBlocks(): IPBlock[] {
    return [
      {
        ipAddress: '192.168.1.100',
        reason: 'Multiple failed validation attempts',
        blockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        blockedBy: 'system',
        isActive: true
      },
      {
        ipAddress: '10.0.0.50',
        reason: 'Suspicious behavior pattern',
        blockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        blockedBy: 'admin',
        isActive: true,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    ]
  }

  private generateMockEmailBlocks(): EmailBlock[] {
    return [
      {
        id: 'mock-email-1',
        email: 'suspicious@spam.com',
        reason: 'Repeated invalid code attempts',
        blockedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        blockedBy: 'admin',
        isActive: true
      }
    ]
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: {
    type: 'code_validation' | 'login_attempt' | 'registration' | 'admin_action' | 'rate_limit_exceeded'
    ip_address: string
    user_agent?: string
    email?: string
    code_attempted?: string
    success: boolean
    details?: Record<string, any>
  }): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('log_security_event', {
          p_event_type: event.type,
          p_ip_address: event.ip_address,
          p_user_agent: event.user_agent,
          p_email_attempted: event.email,
          p_code_attempted: event.code_attempted,
          p_success: event.success,
          p_details: event.details || {}
        })

      if (error) {
        console.error('Failed to log security event:', error)
      }

      // Check for auto-blocking if it's a failed attempt
      if (!event.success && event.type === 'code_validation') {
        await this.checkAndAutoBlockIP(event.ip_address)
      }
    } catch (error) {
      console.error('Security event logging error:', error)
    }
  }

  /**
   * Get real-time validation attempts log
   */
  async getValidationAttempts(page = 1, limit = 50, filters?: {
    success?: boolean
    suspicious?: boolean
    ipAddress?: string
    dateRange?: { start: Date; end: Date }
  }): Promise<{ attempts: ValidationAttempt[]; total: number; pages: number }> {
    try {
      // Use mock data for now until database is set up
      let mockAttempts = this.generateMockValidationAttempts()
      
      // Apply filters
      if (filters) {
        if (filters.success !== undefined) {
          mockAttempts = mockAttempts.filter(attempt => attempt.success === filters.success)
        }
        if (filters.suspicious !== undefined) {
          mockAttempts = mockAttempts.filter(attempt => attempt.isSuspicious === filters.suspicious)
        }
        if (filters.ipAddress) {
          mockAttempts = mockAttempts.filter(attempt => attempt.ipAddress.includes(filters.ipAddress!))
        }
        if (filters.dateRange) {
          mockAttempts = mockAttempts.filter(attempt => 
            attempt.attemptedAt >= filters.dateRange!.start && 
            attempt.attemptedAt <= filters.dateRange!.end
          )
        }
      }

      // Pagination
      const offset = (page - 1) * limit
      const paginatedAttempts = mockAttempts.slice(offset, offset + limit)
      const total = mockAttempts.length
      const pages = Math.ceil(total / limit)

      return { attempts: paginatedAttempts, total, pages }
    } catch (error) {
      console.error('Failed to fetch validation attempts:', error)
      return { attempts: [], total: 0, pages: 0 }
    }
  }

  /**
   * Get security events with filtering
   */
  async getSecurityEvents(filters?: {
    severity?: string[]
    type?: string[]
    resolved?: boolean
    dateRange?: { start: Date; end: Date }
  }): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters) {
        if (filters.dateRange) {
          query = query
            .gte('created_at', filters.dateRange.start.toISOString())
            .lte('created_at', filters.dateRange.end.toISOString())
        }
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      // Transform logs to security events
      const events: SecurityEvent[] = (data || []).map(log => {
        const severity = log.risk_score >= 0.8 ? 'critical' : 
                        log.risk_score >= 0.5 ? 'high' : 
                        log.risk_score >= 0.3 ? 'medium' : 'low'

        return {
          id: log.id,
          type: this.mapEventType(log.event_type),
          severity,
          description: this.generateEventDescription(log),
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          metadata: log.details || {},
          timestamp: new Date(log.created_at),
          resolved: false // Implement resolution tracking if needed
        }
      })

      return events
    } catch (error) {
      console.error('Failed to fetch security events:', error)
      return []
    }
  }

  /**
   * Get blocked IP addresses
   */
  async getBlockedIPs(): Promise<IPBlock[]> {
    try {
      const { data, error } = await supabase
        .from('ip_blocks')
        .select(`
          *,
          blocked_by_profile:profiles!ip_blocks_blocked_by_fkey(username),
          unblocked_by_profile:profiles!ip_blocks_unblocked_by_fkey(username)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(block => ({
        ipAddress: block.ip_address,
        reason: block.reason,
        blockedAt: new Date(block.created_at),
        expiresAt: block.expires_at ? new Date(block.expires_at) : undefined,
        blockedBy: block.blocked_by_profile?.username || 'system',
        isActive: block.is_active
      }))
    } catch (error) {
      console.error('Failed to fetch blocked IPs:', error)
      return []
    }
  }

  /**
   * Get blocked email addresses
   */
  async getBlockedEmails(): Promise<EmailBlock[]> {
    try {
      const { data, error } = await supabase
        .from('email_blocks')
        .select(`
          *,
          blocked_by_profile:profiles!email_blocks_blocked_by_fkey(username),
          unblocked_by_profile:profiles!email_blocks_unblocked_by_fkey(username)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(block => ({
        id: block.id,
        email: block.email,
        reason: block.reason,
        blockedAt: new Date(block.created_at),
        blockedBy: block.blocked_by_profile?.username || 'system',
        isActive: block.is_active
      }))
    } catch (error) {
      console.error('Failed to fetch blocked emails:', error)
      return []
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ipAddress: string, reason: string, adminId: string, expiresInHours?: number): Promise<void> {
    try {
      const expiresAt = expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : null

      const { error } = await supabase
        .from('ip_blocks')
        .insert({
          ip_address: ipAddress,
          reason,
          blocked_by: adminId,
          expires_at: expiresAt
        })

      if (error) throw error

      // Log the admin action
      await this.logSecurityEvent({
        type: 'admin_action',
        ip_address: ipAddress,
        success: true,
        details: { action: 'ip_block', reason, adminId, expiresInHours }
      })
    } catch (error) {
      console.error('Failed to block IP:', error)
      throw error
    }
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ipAddress: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ip_blocks')
        .update({ 
          is_active: false,
          unblocked_by: adminId,
          unblocked_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress)
        .eq('is_active', true)

      if (error) throw error

      // Log the admin action
      await this.logSecurityEvent({
        type: 'admin_action',
        ip_address: ipAddress,
        success: true,
        details: { action: 'ip_unblock', adminId }
      })
    } catch (error) {
      console.error('Failed to unblock IP:', error)
      throw error
    }
  }

  /**
   * Block an email address
   */
  async blockEmail(email: string, reason: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_blocks')
        .insert({
          email,
          reason,
          blocked_by: adminId
        })

      if (error) throw error

      // Log the admin action
      await this.logSecurityEvent({
        type: 'admin_action',
        ip_address: 'system',
        success: true,
        details: { action: 'email_block', email, reason, adminId }
      })
    } catch (error) {
      console.error('Failed to block email:', error)
      throw error
    }
  }

  /**
   * Unblock an email address
   */
  async unblockEmail(email: string, adminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_blocks')
        .update({ 
          is_active: false,
          unblocked_by: adminId,
          unblocked_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('is_active', true)

      if (error) throw error

      // Log the admin action
      await this.logSecurityEvent({
        type: 'admin_action',
        ip_address: 'system',
        success: true,
        details: { action: 'email_unblock', email, adminId }
      })
    } catch (error) {
      console.error('Failed to unblock email:', error)
      throw error
    }
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .rpc('is_ip_blocked', { p_ip_address: ipAddress })

      return data === true
    } catch (error) {
      console.error('Failed to check IP block status:', error)
      return false
    }
  }

  /**
   * Check if email is blocked
   */
  async isEmailBlocked(email: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .rpc('is_email_blocked', { p_email: email })

      return data === true
    } catch (error) {
      console.error('Failed to check email block status:', error)
      return false
    }
  }

  /**
   * Auto-block IP based on failed attempts
   */
  private async checkAndAutoBlockIP(ipAddress: string): Promise<void> {
    try {
      const { data } = await supabase
        .rpc('check_and_auto_block_ip', { p_ip_address: ipAddress })

      if (data === true) {
        console.log(`Auto-blocked IP ${ipAddress} due to excessive failed attempts`)
      }
    } catch (error) {
      console.error('Failed to check auto-block:', error)
    }
  }

  /**
   * Analyze current threat level
   */
  async analyzeThreat(): Promise<ThreatAnalysis> {
    try {
      // Get recent security events (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const { data: recentLogs, error } = await supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())

      if (error) throw error

      const logs = recentLogs || []
      const failedAttempts = logs.filter(log => !log.success).length
      const suspiciousActivity = logs.filter(log => log.is_suspicious).length
      const uniqueIPs = new Set(logs.map(log => log.ip_address)).size
      
      // Calculate threat level
      let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
      let score = 0

      if (failedAttempts > 100) score += 30
      else if (failedAttempts > 50) score += 20
      else if (failedAttempts > 20) score += 10

      if (suspiciousActivity > 20) score += 25
      else if (suspiciousActivity > 10) score += 15
      else if (suspiciousActivity > 5) score += 10

      if (uniqueIPs > 50) score += 20
      else if (uniqueIPs > 20) score += 10

      if (score >= 70) level = 'critical'
      else if (score >= 50) level = 'high'
      else if (score >= 30) level = 'medium'

      const analysis: ThreatAnalysis = {
        level,
        score,
        indicators: [
          `${failedAttempts} failed attempts in 24h`,
          `${suspiciousActivity} suspicious activities`,
          `${uniqueIPs} unique IP addresses`
        ],
        recommendations: this.generateRecommendations(level, {
          failedAttempts,
          suspiciousActivity,
          uniqueIPs
        }),
        lastUpdated: new Date()
      }

      return analysis
    } catch (error) {
      console.error('Failed to analyze threat:', error)
      return {
        level: 'low',
        score: 0,
        indicators: [],
        recommendations: ['Monitor system for suspicious activity'],
        lastUpdated: new Date()
      }
    }
  }

  /**
   * Generate security dashboard statistics
   */
  async getSecurityDashboardStats(): Promise<SecurityDashboardStats> {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get recent attempts and events
      const { data: recentLogs } = await supabase
        .from('security_logs')
        .select('*')
        .gte('created_at', weekAgo.toISOString())

      const logs = recentLogs || []
      const failedAttempts = logs.filter(log => !log.success).length
      const suspiciousActivity = logs.filter(log => log.is_suspicious).length
      
      // Get blocked IPs and emails count
      const { count: blockedIPsCount } = await supabase
        .from('ip_blocks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: blockedEmailsCount } = await supabase
        .from('email_blocks')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const stats: SecurityDashboardStats = {
        period: {
          start: weekAgo,
          end: now
        },
        metrics: {
          totalAttempts: logs.length,
          blockedAttempts: failedAttempts,
          newThreats: suspiciousActivity,
          resolvedIncidents: 0, // Implement if needed
          falsePositives: 0 // Implement if needed
        },
        trends: [
          {
            metric: 'Failed Attempts',
            direction: failedAttempts > 50 ? 'up' : failedAttempts > 20 ? 'stable' : 'down',
            percentage: Math.min(failedAttempts, 100)
          },
          {
            metric: 'Threat Level',
            direction: 'stable',
            percentage: 0
          }
        ],
        threats: [await this.analyzeThreat()],
        recommendations: [
          'Continue monitoring suspicious IP addresses',
          'Review and update email blacklist',
          'Consider implementing additional rate limiting for new user registrations'
        ],
        generatedAt: now,
        generatedBy: 'system'
      }

      return stats
    } catch (error) {
      console.error('Failed to generate dashboard stats:', error)
      // Return minimal stats on error
      return {
        period: { start: new Date(), end: new Date() },
        metrics: { totalAttempts: 0, blockedAttempts: 0, newThreats: 0, resolvedIncidents: 0, falsePositives: 0 },
        trends: [],
        threats: [],
        recommendations: [],
        generatedAt: new Date(),
        generatedBy: 'system'
      }
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(startDate: Date, endDate: Date): Promise<SecurityReport> {
    const stats = await this.getSecurityDashboardStats()
    const threats = await this.analyzeThreat()

    return {
      ...stats,
      period: { start: startDate, end: endDate },
      threats: [threats]
    }
  }

  /**
   * Emergency system lockdown
   */
  async setEmergencyLockdown(enabled: boolean, adminId: string, reason?: string): Promise<void> {
    try {
      const lockdownData = {
        enabled,
        reason: reason || 'Emergency lockdown initiated',
        activatedAt: enabled ? new Date().toISOString() : null,
        activatedBy: adminId
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'emergency_lockdown',
          setting_value: JSON.stringify(lockdownData),
          updated_by: adminId
        })

      if (error) throw error

      // Log the critical admin action
      await this.logSecurityEvent({
        type: 'admin_action',
        ip_address: 'system',
        success: true,
        details: { action: 'emergency_lockdown', enabled, reason, adminId }
      })
    } catch (error) {
      console.error('Failed to set emergency lockdown:', error)
      throw error
    }
  }

  /**
   * Check if system is in emergency lockdown
   */
  async isEmergencyLockdownActive(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'emergency_lockdown')
        .single()

      if (!data) return false

      const lockdownConfig = JSON.parse(data.setting_value)
      return lockdownConfig.enabled === true
    } catch (error) {
      return false
    }
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId: string, resolvedBy: string, notes?: string): Promise<void> {
    // This would update a resolution status if we had it in the database
    // For now, just log the resolution
    await this.logSecurityEvent({
      type: 'admin_action',
      ip_address: 'system',
      success: true,
      details: { action: 'resolve_event', eventId, resolvedBy, notes }
    })
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<'normal' | 'elevated' | 'high' | 'emergency_locked'> {
    try {
      // Check emergency lockdown
      if (await this.isEmergencyLockdownActive()) {
        return 'emergency_locked'
      }

      // Check threat level
      const threat = await this.analyzeThreat()
      switch (threat.level) {
        case 'critical': return 'high'
        case 'high': return 'elevated'
        default: return 'normal'
      }
    } catch (error) {
      return 'normal'
    }
  }

  /**
   * Helper method to map event types
   */
  private mapEventType(eventType: string): string {
    const mapping: Record<string, string> = {
      'code_validation': 'validation_attempt',
      'rate_limit_exceeded': 'rate_limit_exceeded',
      'admin_action': 'admin_action'
    }
    return mapping[eventType] || eventType
  }

  /**
   * Helper method to generate event descriptions
   */
  private generateEventDescription(log: any): string {
    if (!log.success) {
      if (log.event_type === 'code_validation') {
        return `Failed code validation attempt for code ${log.code_attempted || 'unknown'}`
      }
    }
    return `${log.event_type} event from ${log.ip_address}`
  }

  /**
   * Helper method to generate recommendations
   */
  private generateRecommendations(level: string, metrics: any): string[] {
    const recommendations: string[] = []

    if (level === 'critical') {
      recommendations.push('Consider implementing emergency rate limiting')
      recommendations.push('Review and potentially block top offending IPs')
    }

    if (metrics.failedAttempts > 100) {
      recommendations.push('Investigate potential brute force attacks')
    }

    if (metrics.suspiciousActivity > 20) {
      recommendations.push('Enhance bot detection mechanisms')
    }

    return recommendations
  }
}

// Singleton instance
export const securityService = new SecurityService()
