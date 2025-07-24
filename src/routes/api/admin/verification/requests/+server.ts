import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user is admin/moderator
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('verification_level')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'moderator'].includes(profile.verification_level)) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all verification requests with user profiles
    const { data: requests, error } = await (supabase as any)
      .from('verification_requests')
      .select(`
        *,
        profiles (
          id,
          username,
          email,
          verification_level,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return json({ error: 'Failed to fetch requests' }, { status: 500 });
    }

    return json({ requests: requests || [] });

  } catch (error) {
    console.error('Error in admin verification requests:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
