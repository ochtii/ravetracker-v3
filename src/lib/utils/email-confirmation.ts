import { supabase } from '$lib/utils/supabase';

export async function confirmEmail(token: string, type: string = 'signup') {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email confirmation error:', error);
    return { success: false, error };
  }
}

export async function resendConfirmation(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return { success: false, error };
  }
}
