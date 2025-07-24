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

    const { requestIds, action } = await request.json();

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return json({ error: 'Request IDs are required' }, { status: 400 });
    }

    if (!['approve', 'reject', 'needs_info'].includes(action)) {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get all verification requests
    const { data: verificationRequests } = await (supabase as any)
      .from('verification_requests')
      .select('*')
      .in('id', requestIds);

    if (!verificationRequests || verificationRequests.length === 0) {
      return json({ error: 'No verification requests found' }, { status: 404 });
    }

    // Update all requests
    const updateData = {
      status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      admin_notes: `Bulk ${action} by admin`
    };

    const { error: updateError } = await (supabase as any)
      .from('verification_requests')
      .update(updateData)
      .in('id', requestIds);

    if (updateError) {
      console.error('Error bulk updating verification requests:', updateError);
      return json({ error: 'Failed to update requests' }, { status: 500 });
    }

    // If approved, update users' verification levels and grant credits
    if (action === 'approve') {
      const userIds = verificationRequests.map(req => req.user_id);
      
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          verification_level: 'verified',
          invite_credits: (supabase as any).raw('invite_credits + 5') // Grant 5 credits
        })
        .in('id', userIds);

      if (profileError) {
        console.error('Error bulk updating user profiles:', profileError);
        // Don't return error here as the requests were still processed
      }
    }

    return json({ 
      success: true,
      message: `${requestIds.length} request(s) ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for more info'} successfully`
    });

  } catch (error) {
    console.error('Error bulk reviewing verification requests:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
