import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw redirect(303, '/login?redirect=/admin/verification');
  }

  // Check if user is admin/moderator
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('verification_level')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['admin', 'moderator'].includes(profile.verification_level)) {
    throw redirect(303, '/');
  }

  return {
    user: session.user,
    profile
  };
};
