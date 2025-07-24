import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
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

    const { requestId, action, notes } = await request.json();

    if (!requestId || !action) {
      return json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'needs_info'].includes(action)) {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'needs_info' && !notes?.trim()) {
      return json({ error: 'Notes are required when requesting more info' }, { status: 400 });
    }

    // Get the verification request
    const { data: verificationRequest } = await (supabase as any)
      .from('verification_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!verificationRequest) {
      return json({ error: 'Verification request not found' }, { status: 404 });
    }

    // Update verification request
    const updateData = {
      status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      admin_notes: notes?.trim() || null
    };

    const { error: updateError } = await (supabase as any)
      .from('verification_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating verification request:', updateError);
      return json({ error: 'Failed to update request' }, { status: 500 });
    }

    // If approved, update user's verification level and grant credits
    if (action === 'approve') {
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          verification_level: 'verified',
          invite_credits: (supabase as any).raw('invite_credits + 5') // Grant 5 credits
        })
        .eq('id', verificationRequest.user_id);

      if (profileError) {
        console.error('Error updating user profile:', profileError);
        // Don't return error here as the request was still processed
      }
    }

    return json({ 
      success: true,
      message: `Request ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for more info'} successfully`
    });

  } catch (error) {
    console.error('Error reviewing verification request:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
