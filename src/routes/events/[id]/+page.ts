import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'

export const prerender = false

export const load: PageLoad = async ({ params }) => {
  const eventId = params.id

  if (!eventId) {
    throw error(404, 'Event nicht gefunden')
  }

  return {
    eventId,
    title: 'Event Details - RaveTracker v3.0'
  }
}
