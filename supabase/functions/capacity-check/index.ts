import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface CapacityCheckRequest {
  eventId: string
  userId: string
  action: 'join' | 'leave' | 'check'
}

interface CapacityCheckResponse {
  allowed: boolean
  currentAttendance: number
  capacity: number | null
  waitingList?: boolean
  position?: number
  reason?: string
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
    const { eventId, userId, action }: CapacityCheckRequest = await req.json()

    if (!eventId || !userId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, userId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get event details including capacity
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title, capacity, status, date_time')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if event is still accepting attendees
    if (eventData.status !== 'published') {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Event is not published',
          currentAttendance: 0,
          capacity: eventData.capacity
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if event has already passed
    const eventDate = new Date(eventData.date_time)
    if (eventDate < new Date()) {
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'Event has already passed',
          currentAttendance: 0,
          capacity: eventData.capacity
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current attendance count (only 'going' status counts towards capacity)
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id, status, created_at')
      .eq('event_id', eventId)
      .eq('status', 'going')
      .order('created_at', { ascending: true })

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError)
      return new Response(
        JSON.stringify({ error: 'Failed to check attendance' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentAttendance = attendanceData?.length || 0

    // Check user's current attendance status
    const { data: userAttendance } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    const response: CapacityCheckResponse = {
      allowed: true,
      currentAttendance,
      capacity: eventData.capacity
    }

    // If no capacity limit, always allow
    if (!eventData.capacity) {
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    switch (action) {
      case 'check':
        // Just return current status
        response.allowed = currentAttendance < eventData.capacity
        if (!response.allowed) {
          response.reason = 'Event is at full capacity'
        }
        break

      case 'join':
        // Check if user is already going
        if (userAttendance?.status === 'going') {
          response.allowed = true
          response.reason = 'User is already attending'
          break
        }

        // Check capacity
        if (currentAttendance >= eventData.capacity) {
          response.allowed = false
          response.reason = 'Event is at full capacity'
          
          // Check if waiting list is enabled (we can implement this feature)
          // For now, we'll just indicate capacity is full
          break
        }

        // Check rate limiting
        const { data: rateLimitCheck } = await supabase
          .rpc('auth.check_rate_limit', {
            user_uuid: userId,
            action_type: 'attendance_change',
            max_actions: 10,
            time_window: '1 minute'
          })

        if (!rateLimitCheck) {
          response.allowed = false
          response.reason = 'Rate limit exceeded - too many attendance changes'
          break
        }

        // Allow joining
        response.allowed = true
        break

      case 'leave':
        // Users can always leave events
        response.allowed = true
        break

      default:
        response.allowed = false
        response.reason = 'Invalid action'
    }

    // If action is allowed and it's join/leave, update the attendance
    if (response.allowed && (action === 'join' || action === 'leave')) {
      try {
        if (action === 'join') {
          // Use the upsert function to handle attendance
          await supabase.rpc('upsert_event_attendance', {
            event_uuid: eventId,
            user_uuid: userId,
            attendance_status: 'going'
          })
        } else if (action === 'leave') {
          // Remove attendance record
          await supabase
            .from('event_attendance')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', userId)
        }

        // Update attendance count after the change
        if (action === 'join') {
          response.currentAttendance = currentAttendance + 1
        } else if (action === 'leave' && userAttendance?.status === 'going') {
          response.currentAttendance = Math.max(0, currentAttendance - 1)
        }

        // Log the capacity check and action
        await supabase.rpc('auth.log_security_event', {
          event_type: 'capacity_management',
          user_uuid: userId,
          resource_type: 'event',
          resource_id: eventId,
          action_type: action,
          success: true,
          details: {
            previous_attendance: currentAttendance,
            new_attendance: response.currentAttendance,
            capacity: eventData.capacity,
            event_title: eventData.title
          }
        })

        // If event is now at capacity, send notification to organizer
        if (response.currentAttendance === eventData.capacity && action === 'join') {
          const { data: organizerData } = await supabase
            .from('events')
            .select(`
              organizer_id,
              profiles!inner(user_id)
            `)
            .eq('id', eventId)
            .single()

          if (organizerData?.profiles?.user_id) {
            await supabase.from('notifications').insert({
              user_id: organizerData.profiles.user_id,
              event_id: eventId,
              title: 'Event at Full Capacity',
              message: `Your event "${eventData.title}" has reached its maximum capacity of ${eventData.capacity} attendees!`,
              type: 'event_update',
              data: {
                event_title: eventData.title,
                capacity: eventData.capacity,
                attendance: response.currentAttendance
              }
            })
          }
        }

      } catch (error) {
        console.error('Error updating attendance:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update attendance' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in capacity-check function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
