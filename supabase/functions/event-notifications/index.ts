import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EventNotificationRequest {
  eventId: string
  notificationType: 'created' | 'updated' | 'cancelled' | 'reminder'
  targetUsers?: string[] // If not provided, will notify based on type
  customMessage?: string
}

interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'event_reminder' | 'event_update' | 'new_event'
  eventId: string
  data: Record<string, any>
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { eventId, notificationType, targetUsers, customMessage }: EventNotificationRequest = await req.json()

    if (!eventId || !notificationType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, notificationType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get event details
    const { data: eventDetails, error: eventError } = await supabase
      .rpc('get_event_details', { event_uuid: eventId })

    if (eventError || !eventDetails || eventDetails.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Event not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const event = eventDetails[0]

    // Determine target users based on notification type
    let users: string[] = []
    
    if (targetUsers && targetUsers.length > 0) {
      users = targetUsers
    } else {
      switch (notificationType) {
        case 'created':
          // Notify users who follow similar genres or the organizer
          const { data: interestedUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .overlaps('favorite_genres', event.genres)
            .eq('is_private', false)
            .limit(100)

          users = interestedUsers?.map(u => u.user_id) || []
          break

        case 'updated':
        case 'cancelled':
        case 'reminder':
          // Notify users who are attending the event
          const { data: attendees } = await supabase
            .from('event_attendance')
            .select('user_id')
            .eq('event_id', eventId)
            .in('status', ['going', 'interested'])

          users = attendees?.map(a => a.user_id) || []
          break
      }
    }

    // Generate notification content
    const notifications: NotificationData[] = users.map(userId => {
      let title: string
      let message: string
      let type: 'event_reminder' | 'event_update' | 'new_event'

      switch (notificationType) {
        case 'created':
          title = `New Event: ${event.title}`
          message = customMessage || `A new ${event.category_name} event has been posted in ${event.location_city}!`
          type = 'new_event'
          break

        case 'updated':
          title = `Event Updated: ${event.title}`
          message = customMessage || `The event "${event.title}" has been updated. Check out the latest details!`
          type = 'event_update'
          break

        case 'cancelled':
          title = `Event Cancelled: ${event.title}`
          message = customMessage || `Unfortunately, "${event.title}" scheduled for ${new Date(event.date_time).toLocaleDateString()} has been cancelled.`
          type = 'event_update'
          break

        case 'reminder':
          const eventDate = new Date(event.date_time)
          const timeUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60))
          title = `Event Reminder: ${event.title}`
          message = customMessage || `Don't forget! "${event.title}" starts in ${timeUntil} hours at ${event.location_name}.`
          type = 'event_reminder'
          break

        default:
          title = event.title
          message = customMessage || 'Event notification'
          type = 'event_update'
      }

      return {
        userId,
        title,
        message,
        type,
        eventId,
        data: {
          event_title: event.title,
          event_date: event.date_time,
          event_location: event.location_name,
          organizer_name: event.organizer_name,
          notification_type: notificationType
        }
      }
    })

    // Batch create notifications
    const { data: createdNotifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(
        notifications.map(n => ({
          user_id: n.userId,
          event_id: n.eventId,
          title: n.title,
          message: n.message,
          type: n.type,
          data: n.data
        }))
      )
      .select()

    if (notificationError) {
      console.error('Error creating notifications:', notificationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notifications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the notification activity
    await supabase.rpc('auth.log_security_event', {
      event_type: 'notification_sent',
      user_uuid: null, // System generated
      resource_type: 'event',
      resource_id: eventId,
      action_type: notificationType,
      success: true,
      details: {
        notification_count: notifications.length,
        target_users: users.length
      }
    })

    // If this is a reminder, also trigger email notifications
    if (notificationType === 'reminder') {
      // Call email function for users who have email notifications enabled
      const emailPromises = users.map(async (userId) => {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId,
              type: 'event_reminder',
              eventId,
              data: {
                event_title: event.title,
                event_date: event.date_time,
                event_location: event.location_name
              }
            })
          })
        } catch (error) {
          console.error(`Failed to send email to user ${userId}:`, error)
        }
      })

      // Don't await all emails to avoid timeout
      Promise.allSettled(emailPromises)
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: createdNotifications?.length || 0,
        targetUsers: users.length,
        eventTitle: event.title
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in event-notifications function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
