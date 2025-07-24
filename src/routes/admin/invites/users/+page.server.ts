import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    throw redirect(303, '/auth/login');
  }

  // Check if user is admin or moderator
  const userResponse = await (supabase as any)
    .from('users')
    .select('verification_level')
    .eq('id', session.user.id)
    .single();

  if (userResponse.error || !userResponse.data) {
    throw redirect(303, '/');
  }

  const userLevel = userResponse.data.verification_level;
  if (userLevel !== 'admin' && userLevel !== 'moderator') {
    throw redirect(303, '/');
  }

  return {
    user: session.user,
    userLevel
  };
};
