<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth'
  import EventForm from '$lib/components/events/EventForm.svelte'

  const handleSuccess = (event: CustomEvent) => {
    const eventData = event.detail.event
    if (eventData.status === 'published') {
      goto(`/events/${eventData.id}`)
    } else {
      goto('/dashboard/events')
    }
  }

  onMount(() => {
    // Check if user is authenticated
    if (!$user) {
      goto('/auth/login?redirectTo=/events/create')
      return
    }
  })
</script>

<svelte:head>
  <title>Event erstellen - RaveTracker v3.0</title>
  <meta name="description" content="Erstelle ein neues Event auf RaveTracker. Verwalte deine Electronic Music Events mit Bildern, Genres und Real-time Updates." />
</svelte:head>

{#if !$user}
  <!-- Loading/Redirect State -->
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-white text-lg">Weiterleitung zur Anmeldung...</p>
    </div>
  </div>
{:else}
  <!-- Create Event Form -->
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.4&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;4&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"></div>
    </div>

    <div class="relative container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">
          <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Event erstellen
          </span>
        </h1>
        <p class="text-xl text-gray-300 max-w-2xl mx-auto">
          Erstelle ein neues Event und teile es mit der Community. 
          Von intimen Techno-Sessions bis zu großen Festival-Lineups.
        </p>
      </div>

      <!-- Form -->
      <EventForm 
        mode="create" 
        on:success={handleSuccess}
      />
    </div>
  </div>
{/if}
