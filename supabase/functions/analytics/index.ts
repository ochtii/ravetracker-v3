import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyticsRequest {
  type: 'event_analytics' | 'user_analytics' | 'platform_analytics'
  resource_id?: string
  date_range?: [string, string]
  metrics?: string[]
}

interface EventAnalytics {
  event_id: string
  views: number
  registrations: number
  attendance_rate: number
  engagement_score: number
  demographic_breakdown: any
  popular_times: any[]
  conversion_funnel: any
}

interface UserAnalytics {
  user_id: string
  events_attended: number
  events_organized: number
  engagement_score: number
  favorite_genres: string[]
  activity_timeline: any[]
  social_connections: number
}

interface PlatformAnalytics {
  total_users: number
  total_events: number
  growth_metrics: any
  popular_genres: any[]
  geographic_distribution: any[]
  engagement_trends: any[]
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
    const { type, resource_id, date_range, metrics = [] }: AnalyticsRequest = await req.json()

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let analytics: any = {}

    switch (type) {
      case 'event_analytics':
        if (!resource_id) {
          return new Response(
            JSON.stringify({ error: 'event_id required for event analytics' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        analytics = await generateEventAnalytics(supabase, resource_id, date_range, metrics)
        break
      
      case 'user_analytics':
        if (!resource_id) {
          return new Response(
            JSON.stringify({ error: 'user_id required for user analytics' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        analytics = await generateUserAnalytics(supabase, resource_id, date_range, metrics)
        break
      
      case 'platform_analytics':
        analytics = await generatePlatformAnalytics(supabase, date_range, metrics)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid analytics type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log analytics request
    await supabase.rpc('auth.log_security_event', {
      event_type: 'analytics_generated',
      user_uuid: null,
      resource_type: 'analytics',
      resource_id: resource_id,
      action_type: type,
      success: true,
      details: {
        metrics_requested: metrics,
        date_range: date_range
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        type,
        resource_id,
        analytics,
        generated_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analytics function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateEventAnalytics(
  supabase: any, 
  eventId: string, 
  dateRange?: [string, string], 
  metrics: string[] = []
): Promise<EventAnalytics> {
  // Get basic event data
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) {
    throw new Error('Event not found')
  }

  // Views analytics
  const { data: viewsData } = await supabase
    .from('event_interactions')
    .select('created_at')
    .eq('event_id', eventId)
    .eq('interaction_type', 'view')

  const views = viewsData?.length || 0

  // Registration analytics
  const { data: registrationsData } = await supabase
    .from('event_attendance')
    .select('*')
    .eq('event_id', eventId)

  const registrations = registrationsData?.length || 0
  const confirmed_attendees = registrationsData?.filter(r => r.status === 'going').length || 0
  const attendance_rate = registrations > 0 ? (confirmed_attendees / registrations) * 100 : 0

  // Engagement score calculation
  const { data: interactionsData } = await supabase
    .from('event_interactions')
    .select('interaction_type')
    .eq('event_id', eventId)

  const interactionWeights = {
    view: 1,
    like: 2,
    share: 3,
    bookmark: 2,
    comment: 3
  }

  const engagement_score = interactionsData?.reduce((score, interaction) => {
    return score + (interactionWeights[interaction.interaction_type as keyof typeof interactionWeights] || 1)
  }, 0) || 0

  // Demographic breakdown
  const { data: demographicData } = await supabase
    .from('event_attendance')
    .select(`
      profiles(age_range, location, preferred_genres)
    `)
    .eq('event_id', eventId)
    .eq('status', 'going')

  const demographic_breakdown = {
    age_ranges: {},
    locations: {},
    genre_preferences: {}
  }

  demographicData?.forEach((attendance: any) => {
    const profile = attendance.profiles
    if (profile) {
      // Age ranges
      if (profile.age_range) {
        demographic_breakdown.age_ranges[profile.age_range] = 
          (demographic_breakdown.age_ranges[profile.age_range] || 0) + 1
      }
      
      // Locations
      if (profile.location) {
        demographic_breakdown.locations[profile.location] = 
          (demographic_breakdown.locations[profile.location] || 0) + 1
      }
      
      // Genre preferences
      if (profile.preferred_genres) {
        profile.preferred_genres.forEach((genre: string) => {
          demographic_breakdown.genre_preferences[genre] = 
            (demographic_breakdown.genre_preferences[genre] || 0) + 1
        })
      }
    }
  })

  // Popular times (when people interact most)
  const popular_times = viewsData?.reduce((times: any[], view: any) => {
    const hour = new Date(view.created_at).getHours()
    const existing = times.find(t => t.hour === hour)
    if (existing) {
      existing.count++
    } else {
      times.push({ hour, count: 1 })
    }
    return times
  }, []).sort((a, b) => b.count - a.count) || []

  // Conversion funnel
  const conversion_funnel = {
    views: views,
    registrations: registrations,
    confirmed: confirmed_attendees,
    view_to_registration_rate: views > 0 ? (registrations / views) * 100 : 0,
    registration_to_confirmation_rate: registrations > 0 ? (confirmed_attendees / registrations) * 100 : 0
  }

  return {
    event_id: eventId,
    views,
    registrations,
    attendance_rate,
    engagement_score,
    demographic_breakdown,
    popular_times,
    conversion_funnel
  }
}

async function generateUserAnalytics(
  supabase: any, 
  userId: string, 
  dateRange?: [string, string], 
  metrics: string[] = []
): Promise<UserAnalytics> {
  // Events attended
  const { data: attendanceData } = await supabase
    .from('event_attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'going')

  const events_attended = attendanceData?.length || 0

  // Events organized
  const { data: organizedData } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', userId)

  const events_organized = organizedData?.length || 0

  // Engagement score
  const { data: interactionsData } = await supabase
    .from('event_interactions')
    .select('interaction_type')
    .eq('user_id', userId)

  const interactionWeights = {
    view: 1,
    like: 2,
    share: 3,
    bookmark: 2,
    comment: 3
  }

  const engagement_score = interactionsData?.reduce((score, interaction) => {
    return score + (interactionWeights[interaction.interaction_type as keyof typeof interactionWeights] || 1)
  }, 0) || 0

  // Favorite genres (from attended events)
  const { data: genreData } = await supabase
    .from('event_attendance')
    .select('events(genres)')
    .eq('user_id', userId)
    .eq('status', 'going')

  const genreCounts: Record<string, number> = {}
  genreData?.forEach((attendance: any) => {
    const genres = attendance.events?.genres || []
    genres.forEach((genre: string) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  const favorite_genres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)

  // Activity timeline
  const { data: activityData } = await supabase
    .from('event_interactions')
    .select('created_at, interaction_type, event_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const activity_timeline = activityData?.map((activity: any) => ({
    date: activity.created_at,
    type: activity.interaction_type,
    event_id: activity.event_id
  })) || []

  // Social connections (followers/following - if implemented)
  const social_connections = 0 // Placeholder for future social features

  return {
    user_id: userId,
    events_attended,
    events_organized,
    engagement_score,
    favorite_genres,
    activity_timeline,
    social_connections
  }
}

async function generatePlatformAnalytics(
  supabase: any, 
  dateRange?: [string, string], 
  metrics: string[] = []
): Promise<PlatformAnalytics> {
  // Total users
  const { count: total_users } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Total events
  const { count: total_events } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })

  // Growth metrics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: new_users_30d } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { count: new_events_30d } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  const growth_metrics = {
    new_users_30d: new_users_30d || 0,
    new_events_30d: new_events_30d || 0,
    user_growth_rate: total_users ? ((new_users_30d || 0) / total_users) * 100 : 0,
    event_growth_rate: total_events ? ((new_events_30d || 0) / total_events) * 100 : 0
  }

  // Popular genres
  const { data: genreData } = await supabase
    .from('events')
    .select('genres')
    .not('genres', 'is', null)

  const genreCounts: Record<string, number> = {}
  genreData?.forEach((event: any) => {
    const genres = event.genres || []
    genres.forEach((genre: string) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  const popular_genres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([genre, count]) => ({ genre, count }))

  // Geographic distribution
  const { data: locationData } = await supabase
    .from('profiles')
    .select('location')
    .not('location', 'is', null)

  const locationCounts: Record<string, number> = {}
  locationData?.forEach((profile: any) => {
    if (profile.location) {
      locationCounts[profile.location] = (locationCounts[profile.location] || 0) + 1
    }
  })

  const geographic_distribution = Object.entries(locationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([location, count]) => ({ location, count }))

  // Engagement trends (daily interactions over last 30 days)
  const { data: engagementData } = await supabase
    .from('event_interactions')
    .select('created_at, interaction_type')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const dailyEngagement: Record<string, number> = {}
  engagementData?.forEach((interaction: any) => {
    const date = interaction.created_at.split('T')[0] // Get date part only
    dailyEngagement[date] = (dailyEngagement[date] || 0) + 1
  })

  const engagement_trends = Object.entries(dailyEngagement)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return {
    total_users: total_users || 0,
    total_events: total_events || 0,
    growth_metrics,
    popular_genres,
    geographic_distribution,
    engagement_trends
  }
}
