import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get user profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check existing verification request
    const { data: existingRequest } = await (supabase as any)
      .from('verification_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate account age
    const accountCreated = new Date(profile.created_at);
    const now = new Date();
    const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
    const requiredAccountAge = 7; // 7 days

    // Check email verification
    const emailVerified = session.user.email_confirmed_at !== null;

    // Check profile completeness
    const profileComplete = !!(
      profile.username &&
      profile.bio &&
      profile.avatar_url
    );

    // Check cooldown period
    const cooldownDays = 30;
    let noRecentRequest = true;
    if (existingRequest) {
      const lastRequestDate = new Date(existingRequest.created_at);
      const daysSinceLastRequest = Math.floor((now.getTime() - lastRequestDate.getTime()) / (1000 * 60 * 60 * 24));
      noRecentRequest = daysSinceLastRequest >= cooldownDays || existingRequest.status === 'approved';
    }

    const requirements = {
      accountAge: {
        met: accountAgeDays >= requiredAccountAge,
        required: requiredAccountAge,
        current: accountAgeDays
      },
      emailVerified: {
        met: emailVerified
      },
      profileComplete: {
        met: profileComplete
      },
      noRecentRequest: {
        met: noRecentRequest,
        cooldownDays
      }
    };

    const eligible = Object.values(requirements).every(req => req.met);

    return json({
      eligible,
      requirements,
      loading: false
    });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
