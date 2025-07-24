import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;

    if (!message || message.trim().length === 0) {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return json({ error: 'Message too long' }, { status: 400 });
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await (supabase as any)
      .from('verification_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'needs_info'])
      .limit(1)
      .single();

    if (existingRequest) {
      return json({ error: 'You already have a pending verification request' }, { status: 409 });
    }

    // Check eligibility again
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const accountCreated = new Date(profile.created_at);
    const now = new Date();
    const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));

    if (accountAgeDays < 7) {
      return json({ error: 'Account must be at least 7 days old' }, { status: 400 });
    }

    if (!session.user.email_confirmed_at) {
      return json({ error: 'Email must be verified' }, { status: 400 });
    }

    if (!profile.username || !profile.bio || !profile.avatar_url) {
      return json({ error: 'Profile must be complete' }, { status: 400 });
    }

    // Create verification request
    const { data: newRequest, error: insertError } = await (supabase as any)
      .from('verification_requests')
      .insert({
        user_id: session.user.id,
        status: 'pending',
        request_message: message.trim()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating verification request:', insertError);
      return json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    // TODO: Handle file uploads if any
    // const files = formData.getAll('file_') as File[];
    // Process and store files...

    return json({ 
      success: true, 
      request: newRequest 
    });

  } catch (error) {
    console.error('Error submitting verification request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
