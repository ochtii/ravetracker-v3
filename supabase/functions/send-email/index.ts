import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  userId?: string
  email?: string
  type: 'event_reminder' | 'event_update' | 'welcome' | 'verification' | 'custom'
  eventId?: string
  subject?: string
  data: Record<string, any>
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const emailRequest: EmailRequest = await req.json()

    if (!emailRequest.type || !emailRequest.data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let recipientEmail: string
    let recipientName: string | null = null

    // Get recipient email and profile
    if (emailRequest.email) {
      recipientEmail = emailRequest.email
    } else if (emailRequest.userId) {
      // Get user profile and email from auth.users
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(emailRequest.userId)
      
      if (userError || !userData.user?.email) {
        return new Response(
          JSON.stringify({ error: 'User not found or no email address' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      recipientEmail = userData.user.email

      // Get user profile for personalization
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, username')
        .eq('user_id', emailRequest.userId)
        .single()

      if (profileData) {
        recipientName = profileData.first_name 
          ? `${profileData.first_name} ${profileData.last_name || ''}`.trim()
          : profileData.username
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or email must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email template based on type
    let emailTemplate: EmailTemplate

    switch (emailRequest.type) {
      case 'event_reminder':
        emailTemplate = await generateEventReminderEmail(supabase, emailRequest.eventId!, emailRequest.data, recipientName)
        break
      
      case 'event_update':
        emailTemplate = await generateEventUpdateEmail(supabase, emailRequest.eventId!, emailRequest.data, recipientName)
        break
      
      case 'welcome':
        emailTemplate = generateWelcomeEmail(emailRequest.data, recipientName)
        break
      
      case 'verification':
        emailTemplate = generateVerificationEmail(emailRequest.data, recipientName)
        break
      
      case 'custom':
        emailTemplate = {
          subject: emailRequest.subject || 'RaveTracker Notification',
          html: emailRequest.data.html || emailRequest.data.message || '',
          text: emailRequest.data.text || emailRequest.data.message || ''
        }
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid email type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send email using Resend
    const emailPayload = {
      from: 'RaveTracker <noreply@ravetracker.app>',
      to: [recipientEmail],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Failed to send email:', result)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log email sent
    await supabase.rpc('auth.log_security_event', {
      event_type: 'email_sent',
      user_uuid: emailRequest.userId || null,
      resource_type: emailRequest.eventId ? 'event' : 'user',
      resource_id: emailRequest.eventId || emailRequest.userId,
      action_type: emailRequest.type,
      success: true,
      details: {
        recipient_email: recipientEmail,
        subject: emailTemplate.subject,
        email_id: result.id
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        recipient: recipientEmail,
        subject: emailTemplate.subject
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Email template generators
async function generateEventReminderEmail(supabase: any, eventId: string, data: any, recipientName: string | null): Promise<EmailTemplate> {
  const { data: eventData } = await supabase.rpc('get_event_details', { event_uuid: eventId })
  const event = eventData?.[0]

  if (!event) {
    throw new Error('Event not found')
  }

  const eventDate = new Date(event.date_time).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there'

  const subject = `Reminder: ${event.title} is coming up!`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Event Reminder</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <p style="font-size: 18px; color: #333;">${greeting},</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          Don't forget about <strong>${event.title}</strong>! The event you're attending is coming up soon.
        </p>
        
        <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #333;">${event.title}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>📅 Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0; color: #666;"><strong>📍 Location:</strong> ${event.location_name || 'TBA'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>🎵 Genre:</strong> ${event.genres?.join(', ') || 'Various'}</p>
          <p style="margin: 5px 0; color: #666;"><strong>👨‍🎤 Organizer:</strong> ${event.organizer_name}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('FRONTEND_URL')}/events/${event.slug || event.id}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            View Event Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
          See you on the dancefloor! 🕺💃<br>
          The RaveTracker Team
        </p>
      </div>
    </div>
  `

  const text = `
    ${greeting},
    
    Don't forget about ${event.title}! The event you're attending is coming up soon.
    
    Event Details:
    - Date: ${eventDate}
    - Location: ${event.location_name || 'TBA'}
    - Genre: ${event.genres?.join(', ') || 'Various'}
    - Organizer: ${event.organizer_name}
    
    View full details: ${Deno.env.get('FRONTEND_URL')}/events/${event.slug || event.id}
    
    See you on the dancefloor!
    The RaveTracker Team
  `

  return { subject, html, text }
}

async function generateEventUpdateEmail(supabase: any, eventId: string, data: any, recipientName: string | null): Promise<EmailTemplate> {
  const { data: eventData } = await supabase.rpc('get_event_details', { event_uuid: eventId })
  const event = eventData?.[0]

  if (!event) {
    throw new Error('Event not found')
  }

  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there'
  const updateType = data.update_type || 'updated'

  const subject = `Event ${updateType}: ${event.title}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📢 Event Update</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <p style="font-size: 18px; color: #333;">${greeting},</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          There's an update for <strong>${event.title}</strong> that you're attending.
        </p>
        
        ${data.message ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">${data.message}</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('FRONTEND_URL')}/events/${event.slug || event.id}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            View Latest Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
          Stay updated with RaveTracker 📱<br>
          The RaveTracker Team
        </p>
      </div>
    </div>
  `

  const text = `
    ${greeting},
    
    There's an update for ${event.title} that you're attending.
    
    ${data.message || 'Please check the event page for the latest information.'}
    
    View latest details: ${Deno.env.get('FRONTEND_URL')}/events/${event.slug || event.id}
    
    Stay updated with RaveTracker
    The RaveTracker Team
  `

  return { subject, html, text }
}

function generateWelcomeEmail(data: any, recipientName: string | null): EmailTemplate {
  const greeting = recipientName ? `Hi ${recipientName}` : 'Welcome to RaveTracker'

  const subject = 'Welcome to RaveTracker! 🎵'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 32px;">🎵 Welcome to RaveTracker!</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <p style="font-size: 18px; color: #333;">${greeting}! 🎉</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          Welcome to the ultimate platform for discovering and tracking rave events! We're excited to have you join our community of music lovers and party enthusiasts.
        </p>
        
        <div style="background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #333; margin: 0 0 15px 0;">🚀 Get Started</h3>
          <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
            <li>Discover amazing events in your area</li>
            <li>Track your favorite events and get reminders</li>
            <li>Connect with fellow ravers</li>
            <li>Share your own events (for organizers)</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('FRONTEND_URL')}/events" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; margin: 0 10px 10px 0;">
            Explore Events
          </a>
          <a href="${Deno.env.get('FRONTEND_URL')}/profile" 
             style="background: #764ba2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            Complete Profile
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
          Ready to rave? Let's go! 🕺💃<br>
          The RaveTracker Team
        </p>
      </div>
    </div>
  `

  const text = `
    ${greeting}!
    
    Welcome to the ultimate platform for discovering and tracking rave events! We're excited to have you join our community of music lovers and party enthusiasts.
    
    Get Started:
    - Discover amazing events in your area
    - Track your favorite events and get reminders  
    - Connect with fellow ravers
    - Share your own events (for organizers)
    
    Explore Events: ${Deno.env.get('FRONTEND_URL')}/events
    Complete Profile: ${Deno.env.get('FRONTEND_URL')}/profile
    
    Ready to rave? Let's go!
    The RaveTracker Team
  `

  return { subject, html, text }
}

function generateVerificationEmail(data: any, recipientName: string | null): EmailTemplate {
  const greeting = recipientName ? `Hi ${recipientName}` : 'Hi there'

  const subject = 'Verify your RaveTracker email address'
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📧 Email Verification</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <p style="font-size: 18px; color: #333;">${greeting},</p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6;">
          Please verify your email address to complete your RaveTracker account setup.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verification_url}" 
             style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px;">
          The RaveTracker Team
        </p>
      </div>
    </div>
  `

  const text = `
    ${greeting},
    
    Please verify your email address to complete your RaveTracker account setup.
    
    Verification link: ${data.verification_url}
    
    If you didn't create this account, you can safely ignore this email.
    
    The RaveTracker Team
  `

  return { subject, html, text }
}
