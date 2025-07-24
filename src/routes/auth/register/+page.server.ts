import { fail, type Actions } from '@sveltejs/kit'
import { validateInviteCode } from '$lib/services/invite-service'
import { inviteService } from '$lib/services/invite-service'
import { supabase } from '$lib/utils/supabase'
import { registerSchema, validateForm } from '$lib/validation/auth'
import type { PageServerLoad } from './$types'
import type { ValidationResult } from '$lib/types/invite'

// =====================================================
// PAGE LOAD FUNCTION
// =====================================================

export const load: PageServerLoad = async ({ url, getClientAddress }) => {
  const inviteCode = url.searchParams.get('code')
  const clientIP = getClientAddress()
  
  let prevalidationResult: ValidationResult | null = null
  let rateLimitInfo = null

  // Pre-validate invite code if provided in URL
  if (inviteCode) {
    try {
      prevalidationResult = await validateInviteCode(inviteCode, clientIP)
      rateLimitInfo = {
        remaining: prevalidationResult.rateLimitInfo.attemptsRemaining,
        resetTime: new Date(Date.now() + prevalidationResult.rateLimitInfo.timeUntilReset * 1000),
        isBlocked: prevalidationResult.rateLimitInfo.isBlocked
      }
    } catch (error) {
      console.error('Error pre-validating invite code:', error)
    }
  }

  return {
    inviteCode: inviteCode || '',
    prevalidationResult,
    rateLimitInfo
  }
}

// =====================================================
// FORM ACTIONS
// =====================================================

export const actions: Actions = {
  // Validate invite code action (AJAX calls)
  validateCode: async ({ request, getClientAddress }) => {
    const clientIP = getClientAddress()
    const formData = await request.formData()
    const code = formData.get('code')?.toString()

    if (!code) {
      return fail(400, {
        error: 'Code is required',
        message: 'Bitte gib einen Code ein'
      })
    }

    try {
      const result = await validateInviteCode(code, clientIP)
      
      return {
        success: true,
        result: {
          isValid: result.isValid,
          isActionCode: result.isActionCode,
          expiresAt: result.expiresAt.toISOString(),
          rateLimitInfo: {
            remaining: result.rateLimitInfo.attemptsRemaining,
            resetTime: new Date(Date.now() + result.rateLimitInfo.timeUntilReset * 1000).toISOString(),
            isBlocked: result.rateLimitInfo.isBlocked
          },
          errorCode: result.errorCode,
          errorMessage: result.errorMessage
        }
      }
    } catch (error) {
      console.error('Code validation error:', error)
      return fail(500, {
        error: 'Validation failed',
        message: 'Fehler bei der Code-Validierung'
      })
    }
  },

  // Register with invite code
  register: async ({ request, getClientAddress }) => {
    const clientIP = getClientAddress()
    const formData = await request.formData()
    
    // Extract form data
    const registrationData = {
      email: formData.get('email')?.toString() || '',
      password: formData.get('password')?.toString() || '',
      confirmPassword: formData.get('confirmPassword')?.toString() || '',
      firstName: formData.get('firstName')?.toString() || '',
      lastName: formData.get('lastName')?.toString() || '',
      username: formData.get('username')?.toString() || '',
      inviteCode: formData.get('inviteCode')?.toString() || ''
    }

    // Validate form data
    const validation = validateForm(registerSchema, registrationData)
    if (!validation.success) {
      return fail(400, {
        error: 'Validation failed',
        errors: validation.errors,
        data: registrationData
      })
    }

    // Validate invite code again (server-side security)
    if (!registrationData.inviteCode) {
      return fail(400, {
        error: 'Invite code required',
        message: 'Ein gültiger Einladungscode ist erforderlich',
        data: registrationData
      })
    }

    let codeValidation: ValidationResult
    try {
      codeValidation = await validateInviteCode(registrationData.inviteCode, clientIP)
      
      if (!codeValidation.isValid) {
        return fail(400, {
          error: 'Invalid invite code',
          message: codeValidation.errorMessage || 'Ungültiger Einladungscode',
          data: registrationData
        })
      }

      // Check rate limits
      if (codeValidation.rateLimitInfo.isBlocked) {
        return fail(429, {
          error: 'Rate limited',
          message: 'Zu viele Versuche. Bitte warte einen Moment.',
          data: registrationData
        })
      }
    } catch (error) {
      console.error('Invite code validation error:', error)
      return fail(500, {
        error: 'Code validation failed',
        message: 'Fehler bei der Code-Validierung',
        data: registrationData
      })
    }

    try {
      // Check if username is available (if provided)
      if (registrationData.username) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', registrationData.username)
          .single()

        if (existingProfile) {
          return fail(400, {
            error: 'Username taken',
            message: 'Benutzername ist bereits vergeben',
            field: 'username',
            data: registrationData
          })
        }
      }

      // Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          data: {
            first_name: registrationData.firstName,
            last_name: registrationData.lastName,
            username: registrationData.username,
            invite_code: registrationData.inviteCode
          }
        }
      })

      if (authError) {
        console.error('Supabase auth error:', authError)
        
        // Handle specific auth errors
        if (authError.message.includes('email')) {
          return fail(400, {
            error: 'Email error',
            message: 'Diese E-Mail-Adresse ist bereits registriert',
            field: 'email',
            data: registrationData
          })
        }

        return fail(400, {
          error: 'Registration failed',
          message: authError.message || 'Registrierung fehlgeschlagen',
          data: registrationData
        })
      }

      if (!authData.user) {
        return fail(500, {
          error: 'User creation failed',
          message: 'Benutzer konnte nicht erstellt werden',
          data: registrationData
        })
      }

      // Use the invite code (mark as used)
      try {
        await inviteService.useInvite(registrationData.inviteCode, authData.user.id)
      } catch (inviteError) {
        console.error('Error using invite code:', inviteError)
        // Note: We don't fail here because user is already created
        // This should be handled by cleanup processes
      }

      // Update user profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
          username: registrationData.username,
          registration_invite_code: registrationData.inviteCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // Don't fail registration for profile update errors
      }

      // Successful registration
      return {
        success: true,
        message: 'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          username: registrationData.username
        }
      }

    } catch (error) {
      console.error('Registration error:', error)
      return fail(500, {
        error: 'Registration failed',
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        data: registrationData
      })
    }
  },

  // Get rate limit info
  getRateLimit: async ({ getClientAddress }) => {
    const clientIP = getClientAddress()
    
    try {
      // This is a simplified rate limit check
      // In a real implementation, you'd check the rate_limit_service
      const dummyResult = await validateInviteCode('DUMMY', clientIP)
      
      return {
        success: true,
        rateLimitInfo: {
          remaining: dummyResult.rateLimitInfo.attemptsRemaining,
          resetTime: new Date(Date.now() + dummyResult.rateLimitInfo.timeUntilReset * 1000).toISOString(),
          isBlocked: dummyResult.rateLimitInfo.isBlocked
        }
      }
    } catch (error) {
      return fail(500, {
        error: 'Rate limit check failed',
        message: 'Fehler beim Prüfen der Rate-Limits'
      })
    }
  }
}
