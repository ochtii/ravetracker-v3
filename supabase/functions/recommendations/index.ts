import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RecommendationRequest {
  userId: string
  type: 'events' | 'artists' | 'genres' | 'locations'
  limit?: number
  filters?: {
    genres?: string[]
    location_radius?: number
    price_range?: [number, number]
    date_range?: [string, string]
  }
}

interface EventRecommendation {
  event_id: string
  title: string
  description: string
  date_time: string
  location_name: string
  genres: string[]
  price: number
  score: number
  reasons: string[]
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
    const { userId, type, limit = 10, filters = {} }: RecommendationRequest = await req.json()

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let recommendations: any[] = []

    switch (type) {
      case 'events':
        recommendations = await generateEventRecommendations(supabase, userId, limit, filters)
        break
      
      case 'artists':
        recommendations = await generateArtistRecommendations(supabase, userId, limit)
        break
      
      case 'genres':
        recommendations = await generateGenreRecommendations(supabase, userId, limit)
        break
      
      case 'locations':
        recommendations = await generateLocationRecommendations(supabase, userId, limit)
        break
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid recommendation type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Log recommendation request
    await supabase.rpc('auth.log_security_event', {
      event_type: 'recommendation_generated',
      user_uuid: userId,
      resource_type: 'recommendation',
      resource_id: null,
      action_type: type,
      success: true,
      details: {
        recommendation_count: recommendations.length,
        filters: filters
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        type,
        recommendations,
        count: recommendations.length,
        generated_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in recommendations function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateEventRecommendations(
  supabase: any, 
  userId: string, 
  limit: number, 
  filters: any
): Promise<EventRecommendation[]> {
  // Get user preferences and history
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('preferred_genres, location')
    .eq('user_id', userId)
    .single()

  const { data: userAttendance } = await supabase
    .from('event_attendance')
    .select('event_id, events(genres, location_name)')
    .eq('user_id', userId)
    .eq('status', 'going')

  const { data: userInteractions } = await supabase
    .from('event_interactions')
    .select('event_id, interaction_type, events(genres)')
    .eq('user_id', userId)
    .in('interaction_type', ['like', 'share', 'bookmark'])

  // Extract user preferences
  const preferredGenres = userProfile?.preferred_genres || []
  const attendedGenres = userAttendance?.flatMap(a => a.events?.genres || []) || []
  const likedGenres = userInteractions?.flatMap(i => i.events?.genres || []) || []
  
  const allUserGenres = [...new Set([...preferredGenres, ...attendedGenres, ...likedGenres])]
  const attendedEventIds = userAttendance?.map(a => a.event_id) || []

  // Build query for upcoming events
  let query = supabase
    .from('events')
    .select(`
      id, title, description, date_time, location_name, genres, price,
      organizer:profiles!events_organizer_id_fkey(username, first_name, last_name),
      attendance_count:event_attendance(count)
    `)
    .gte('date_time', new Date().toISOString())
    .eq('status', 'published')
    .not('id', 'in', `(${attendedEventIds.join(',') || 'null'})`)

  // Apply filters
  if (filters.genres?.length) {
    query = query.overlaps('genres', filters.genres)
  }

  if (filters.date_range?.length === 2) {
    query = query.gte('date_time', filters.date_range[0])
    query = query.lte('date_time', filters.date_range[1])
  }

  if (filters.price_range?.length === 2) {
    query = query.gte('price', filters.price_range[0])
    query = query.lte('price', filters.price_range[1])
  }

  const { data: events, error } = await query.limit(limit * 3) // Get more to score and filter

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  // Score and rank events
  const scoredEvents = events.map((event: any) => {
    let score = 0
    const reasons: string[] = []

    // Genre matching (highest weight)
    const eventGenres = event.genres || []
    const genreMatches = eventGenres.filter((g: string) => allUserGenres.includes(g))
    if (genreMatches.length > 0) {
      score += genreMatches.length * 3
      reasons.push(`Matches your favorite genres: ${genreMatches.join(', ')}`)
    }

    // Popularity score
    const attendanceCount = event.attendance_count?.[0]?.count || 0
    if (attendanceCount > 50) {
      score += 2
      reasons.push('Popular event with high attendance')
    } else if (attendanceCount > 20) {
      score += 1
      reasons.push('Growing event with good attendance')
    }

    // Proximity bonus (if user has location and event has location)
    if (userProfile?.location && event.location_name) {
      score += 1
      reasons.push('Located near your area')
    }

    // Price attractiveness
    if (event.price === 0) {
      score += 1
      reasons.push('Free event')
    } else if (event.price < 25) {
      score += 0.5
      reasons.push('Affordable pricing')
    }

    // Recency bonus (newer events get slight boost)
    const daysSinceCreated = Math.floor((Date.now() - new Date(event.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceCreated < 7) {
      score += 0.5
      reasons.push('Recently announced')
    }

    // Time preference (weekend events get boost)
    const eventDate = new Date(event.date_time)
    const isWeekend = eventDate.getDay() === 0 || eventDate.getDay() === 6
    if (isWeekend) {
      score += 0.5
      reasons.push('Weekend event')
    }

    return {
      event_id: event.id,
      title: event.title,
      description: event.description,
      date_time: event.date_time,
      location_name: event.location_name,
      genres: event.genres,
      price: event.price,
      score,
      reasons
    }
  })

  // Sort by score and return top recommendations
  return scoredEvents
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

async function generateArtistRecommendations(supabase: any, userId: string, limit: number): Promise<any[]> {
  // Get artists from events user has attended or shown interest in
  const { data: userInteractions } = await supabase
    .from('event_attendance')
    .select(`
      events(artists, genres),
      event_interactions(interaction_type)
    `)
    .eq('user_id', userId)

  // Extract artist patterns and recommend similar artists
  const artistInteractions: Record<string, number> = {}
  const genrePreferences: Record<string, number> = {}

  userInteractions?.forEach((interaction: any) => {
    const event = interaction.events
    if (event?.artists) {
      event.artists.forEach((artist: string) => {
        artistInteractions[artist] = (artistInteractions[artist] || 0) + 1
      })
    }
    if (event?.genres) {
      event.genres.forEach((genre: string) => {
        genrePreferences[genre] = (genrePreferences[genre] || 0) + 1
      })
    }
  })

  // Find events with similar artists or genres that user hasn't attended
  const topGenres = Object.entries(genrePreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre)

  const { data: recommendedEvents } = await supabase
    .from('events')
    .select('artists, genres')
    .overlaps('genres', topGenres)
    .gte('date_time', new Date().toISOString())
    .limit(100)

  // Extract and score new artists
  const newArtists: Record<string, { score: number, genres: string[] }> = {}

  recommendedEvents?.forEach((event: any) => {
    if (event.artists) {
      event.artists.forEach((artist: string) => {
        if (!artistInteractions[artist]) {
          if (!newArtists[artist]) {
            newArtists[artist] = { score: 0, genres: [] }
          }
          
          // Score based on genre similarity
          const commonGenres = event.genres?.filter((g: string) => topGenres.includes(g)) || []
          newArtists[artist].score += commonGenres.length
          newArtists[artist].genres = [...new Set([...newArtists[artist].genres, ...event.genres])]
        }
      })
    }
  })

  return Object.entries(newArtists)
    .sort(([,a], [,b]) => b.score - a.score)
    .slice(0, limit)
    .map(([artist, data]) => ({
      artist,
      score: data.score,
      genres: data.genres,
      reason: `Similar to your music preferences`
    }))
}

async function generateGenreRecommendations(supabase: any, userId: string, limit: number): Promise<any[]> {
  // Get user's genre history
  const { data: userGenreHistory } = await supabase
    .from('event_attendance')
    .select('events(genres)')
    .eq('user_id', userId)

  const userGenres = userGenreHistory?.flatMap(h => h.events?.genres || []) || []
  const genreCounts: Record<string, number> = {}

  userGenres.forEach(genre => {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1
  })

  // Find related genres based on co-occurrence in events
  const { data: allEvents } = await supabase
    .from('events')
    .select('genres')
    .not('genres', 'is', null)

  const genreCooccurrence: Record<string, Record<string, number>> = {}

  allEvents?.forEach((event: any) => {
    const eventGenres = event.genres || []
    eventGenres.forEach((genre1: string) => {
      if (!genreCooccurrence[genre1]) genreCooccurrence[genre1] = {}
      eventGenres.forEach((genre2: string) => {
        if (genre1 !== genre2) {
          genreCooccurrence[genre1][genre2] = (genreCooccurrence[genre1][genre2] || 0) + 1
        }
      })
    })
  })

  // Score genres based on user's preferences
  const recommendedGenres: Record<string, number> = {}

  Object.keys(genreCounts).forEach(userGenre => {
    const relatedGenres = genreCooccurrence[userGenre] || {}
    Object.entries(relatedGenres).forEach(([relatedGenre, cooccurrenceCount]) => {
      if (!genreCounts[relatedGenre]) { // Only recommend new genres
        recommendedGenres[relatedGenre] = (recommendedGenres[relatedGenre] || 0) + 
          cooccurrenceCount * genreCounts[userGenre]
      }
    })
  })

  return Object.entries(recommendedGenres)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([genre, score]) => ({
      genre,
      score,
      reason: `Often paired with genres you enjoy`
    }))
}

async function generateLocationRecommendations(supabase: any, userId: string, limit: number): Promise<any[]> {
  // Get user's location preferences from attended events
  const { data: userLocations } = await supabase
    .from('event_attendance')
    .select('events(location_name, location_address)')
    .eq('user_id', userId)

  const locationCounts: Record<string, number> = {}

  userLocations?.forEach((attendance: any) => {
    const location = attendance.events?.location_name
    if (location) {
      locationCounts[location] = (locationCounts[location] || 0) + 1
    }
  })

  // Find popular locations user hasn't been to
  const { data: popularLocations } = await supabase
    .from('events')
    .select('location_name, location_address')
    .not('location_name', 'is', null)
    .gte('date_time', new Date().toISOString())

  const newLocationCounts: Record<string, number> = {}

  popularLocations?.forEach((event: any) => {
    const location = event.location_name
    if (location && !locationCounts[location]) {
      newLocationCounts[location] = (newLocationCounts[location] || 0) + 1
    }
  })

  return Object.entries(newLocationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([location, eventCount]) => ({
      location,
      event_count: eventCount,
      reason: `Popular venue with ${eventCount} upcoming events`
    }))
}
