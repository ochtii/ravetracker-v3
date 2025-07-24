import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/utils/supabase';
import type { Database } from '$lib/types/database';

// Types
export interface SearchFilters {
  query: string;
  status?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  maxDistance?: number;
  userLat?: number;
  userLng?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  latitude?: number;
  longitude?: number;
  organizer_id: string;
  organizer_username: string;
  status: string;
  search_tags: string[];
  popularity_score: number;
  search_rank: number;
  distance_km?: number;
}

export interface AutocompleteResult {
  suggestion: string;
  category: string;
  relevance_score: number;
}

export interface RecommendationResult {
  event_id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  similarity_score: number;
  recommendation_reason: string;
}

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalResults: number;
  lastSearchId?: string;
}

interface AutocompleteState {
  suggestions: AutocompleteResult[];
  loading: boolean;
  error: string | null;
}

interface RecommendationsState {
  recommendations: RecommendationResult[];
  loading: boolean;
  error: string | null;
}

// Stores
export const searchFilters = writable<SearchFilters>({
  query: '',
  status: 'published',
  location: '',
  dateFrom: '',
  dateTo: '',
  tags: [],
  maxDistance: 50,
  userLat: undefined,
  userLng: undefined
});

export const searchState = writable<SearchState>({
  results: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 0,
  totalResults: 0
});

export const autocompleteState = writable<AutocompleteState>({
  suggestions: [],
  loading: false,
  error: null
});

export const recommendationsState = writable<RecommendationsState>({
  recommendations: [],
  loading: false,
  error: null
});

// Derived stores
export const hasActiveFilters = derived(searchFilters, ($filters) => {
  return (
    $filters.query.length > 0 ||
    ($filters.location && $filters.location.length > 0) ||
    ($filters.dateFrom && $filters.dateFrom.length > 0) ||
    ($filters.dateTo && $filters.dateTo.length > 0) ||
    ($filters.tags && $filters.tags.length > 0) ||
    ($filters.maxDistance && $filters.maxDistance < 100)
  );
});

// Search Service
export class SearchService {
  private debounceTimeout: NodeJS.Timeout | null = null;

  async searchEvents(filters: SearchFilters, offset = 0, limit = 20): Promise<SearchResult[]> {
    try {
      // For now, use regular events query until search functions are deployed
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location_name,
          date_time,
          location_coordinates,
          organizer_id,
          status,
          popularity_score,
          profiles!events_organizer_id_fkey(username)
        `)
        .eq('status', 'published')
        .order('date_time', { ascending: true })
        .range(offset, offset + limit - 1);

      // Apply text search filter
      if (filters.query) {
        query = query.textSearch('title', filters.query);
      }

      // Apply location filter
      if (filters.location) {
        query = query.ilike('location_name', `%${filters.location}%`);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('date_time', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date_time', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      // Transform to SearchResult format
      const results = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        location: event.location_name || '',
        date: new Date(event.date_time).toISOString().split('T')[0],
        time: new Date(event.date_time).toTimeString().slice(0, 5),
        organizer_id: event.organizer_id,
        organizer_username: (event.profiles as any)?.username || 'Unknown',
        status: event.status,
        search_tags: [],
        popularity_score: event.popularity_score || 0,
        search_rank: 1.0
      }));

      // Update search state
      searchState.update(state => ({
        ...state,
        results: offset === 0 ? results : [...state.results, ...results],
        hasMore: results.length === limit,
        currentPage: Math.floor(offset / limit),
        totalResults: offset === 0 ? results.length : state.totalResults + results.length
      }));

      return results;
    } catch (error) {
      console.error('Search service error:', error);
      searchState.update(state => ({
        ...state,
        error: 'Search failed. Please try again.'
      }));
      return [];
    }
  }

  async searchNearLocation(lat: number, lng: number, radius = 50): Promise<SearchResult[]> {
    try {
      // Simple distance-based search using the events table
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location_name,
          date_time,
          location_coordinates,
          organizer_id,
          status,
          popularity_score,
          profiles!events_organizer_id_fkey(username)
        `)
        .eq('status', 'published')
        .not('location_coordinates', 'is', null);

      if (error) throw error;

      return (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        location: event.location_name || '',
        date: new Date(event.date_time).toISOString().split('T')[0],
        time: new Date(event.date_time).toTimeString().slice(0, 5),
        organizer_id: event.organizer_id,
        organizer_username: (event.profiles as any)?.username || 'Unknown',
        status: event.status,
        search_tags: [],
        popularity_score: event.popularity_score || 0,
        search_rank: 1.0
      }));
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  }

  async getAutocomplete(query: string): Promise<AutocompleteResult[]> {
    if (query.length < 2) return [];

    try {
      // Simple autocomplete using events table
      const { data: events, error } = await supabase
        .from('events')
        .select('title, location_name')
        .or(`title.ilike.%${query}%,location_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const suggestions: AutocompleteResult[] = [];

      // Add event titles
      events?.forEach(event => {
        if (event.title?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            suggestion: event.title,
            category: 'event',
            relevance_score: 1.0
          });
        }
        if (event.location_name?.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            suggestion: event.location_name,
            category: 'location',
            relevance_score: 0.8
          });
        }
      });

      // Remove duplicates and sort by relevance
      const uniqueSuggestions = suggestions
        .filter((item, index, self) => 
          index === self.findIndex(s => s.suggestion === item.suggestion && s.category === item.category)
        )
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 8);

      autocompleteState.update(state => ({
        ...state,
        suggestions: uniqueSuggestions
      }));

      return uniqueSuggestions;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  async getRecommendations(userId?: string): Promise<RecommendationResult[]> {
    try {
      // Simple recommendation based on upcoming events
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          location_name,
          date_time,
          popularity_score
        `)
        .eq('status', 'published')
        .gte('date_time', new Date().toISOString())
        .order('popularity_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      const recommendations = (data || []).map(event => ({
        event_id: event.id,
        title: event.title,
        description: event.description || '',
        location: event.location_name || '',
        date: new Date(event.date_time).toISOString().split('T')[0],
        similarity_score: 0.8,
        recommendation_reason: 'Popular upcoming event'
      }));

      recommendationsState.update(state => ({
        ...state,
        recommendations
      }));

      return recommendations;
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }

  async trackSearch(userId: string, query: string, filters: SearchFilters, resultsCount: number): Promise<string | null> {
    try {
      // Simple search tracking - could be enhanced later
      console.log('Search tracked:', { userId, query, filters, resultsCount });
      return 'tracked';
    } catch (error) {
      console.error('Search tracking error:', error);
      return null;
    }
  }

  async trackSearchClick(searchId: string, eventId: string): Promise<void> {
    try {
      // Simple click tracking
      console.log('Search click tracked:', { searchId, eventId });
    } catch (error) {
      console.error('Search click tracking error:', error);
    }
  }

  // Debounced search for real-time searching
  debouncedSearch(filters: SearchFilters, delay = 500): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      searchState.update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await this.searchEvents(filters, 0, 20);
      } catch (error) {
        searchState.update(state => ({
          ...state,
          error: 'Search failed. Please try again.'
        }));
      } finally {
        searchState.update(state => ({ ...state, loading: false }));
      }
    }, delay);
  }

  // Clear search results
  clearResults(): void {
    searchState.update(state => ({
      ...state,
      results: [],
      hasMore: true,
      currentPage: 0,
      totalResults: 0,
      error: null
    }));
  }

  // Load more results (infinite scroll)
  async loadMore(): Promise<void> {
    const state = get(searchState);
    const filters = get(searchFilters);
    
    if (!state.hasMore || state.loading) return;

    searchState.update(s => ({ ...s, loading: true }));
    
    try {
      await this.searchEvents(filters, (state.currentPage + 1) * 20, 20);
    } catch (error) {
      searchState.update(s => ({
        ...s,
        error: 'Failed to load more results.'
      }));
    } finally {
      searchState.update(s => ({ ...s, loading: false }));
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Helper functions for geolocation
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

// Update user location in filters
export async function updateUserLocation(): Promise<void> {
  try {
    const location = await getCurrentLocation();
    searchFilters.update(filters => ({
      ...filters,
      userLat: location.lat,
      userLng: location.lng
    }));
  } catch (error) {
    console.error('Failed to get user location:', error);
  }
}
