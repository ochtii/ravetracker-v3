import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  // Return empty data for now - the security service will handle data loading client-side
  return {
    pageTitle: 'Security & Monitoring Dashboard'
  }
}
