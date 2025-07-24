import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw redirect(303, '/login?redirect=/verify');
  }

  // Get user profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Get existing verification request
  const { data: verificationRequest } = await (supabase as any)
    .from('verification_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    user: session.user,
    profile,
    verificationRequest
  };
};
