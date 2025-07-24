import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent()
  
  // Check if user is admin
  if (!user || !user.user_metadata?.role || user.user_metadata.role !== 'admin') {
    throw redirect(303, '/events')
  }

  return {
    title: 'Realtime Dashboard - Admin',
    description: 'Monitor and manage real-time features across RaveTracker'
  }
}
