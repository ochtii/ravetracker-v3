import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { authState } from '$lib/stores/auth';

export const load: LayoutLoad = async ({ url }) => {
  // Only check auth on client side
  if (!browser) {
    return {};
  }

  const $authState = get(authState);

  // If user is not authenticated, redirect to login
  if (!$authState.user) {
    throw redirect(302, `/auth/login?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  // If user exists but email is not confirmed, redirect to confirmation
  if ($authState.user && !$authState.user.email_confirmed_at) {
    // Allow access to confirmation pages
    if (url.pathname.startsWith('/auth/confirm') || url.pathname.startsWith('/auth/resend-confirmation')) {
      return {};
    }
    
    throw redirect(302, '/auth/confirm-email-sent');
  }

  return {};
};
