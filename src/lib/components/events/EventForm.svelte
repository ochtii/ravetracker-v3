<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth'
  import { eventActions } from '$lib/stores/events'
  import { supabase } from '$lib/utils/supabase'
  import type { Database } from '$lib/types/database'
  import { cn } from '$lib/utils'

  type Event = Database['public']['Tables']['events']['Row']
  type EventInsert = Database['public']['Tables']['events']['Insert']

  export let event: Event | null = null
  export let mode: 'create' | 'edit' = 'create'

  const dispatch = createEventDispatcher()

  // Form state
  let formData = {
    title: '',
    description: '',
    date_time: '',
    end_time: '',
    location_name: '',
    location_address: '',
    location_coordinates: null as { lat: number; lng: number } | null,
    genres: [] as string[],
    price_min: null as number | null,
    price_max: null as number | null,
    capacity: null as number | null,
    age_restriction: null as number | null,
    dress_code: '',
    special_instructions: '',
    organizer_info: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    spotify_playlist: '',
    youtube_playlist: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'cancelled'
  }

  let loading = false
  let error = ''
  let imageFiles: FileList | null = null
  let coverImageFile: File | null = null
  let uploadingImages = false

  // Available options
  const genreOptions = [
    'Techno', 'House', 'Trance', 'Hardstyle', 'Drum & Bass',
    'Dubstep', 'Progressive', 'Minimal', 'Acid', 'Industrial',
    'Hardcore', 'Breakbeat', 'Ambient', 'Psytrance', 'Electro'
  ]

  const statusOptions = [
    { value: 'draft', label: 'Entwurf', description: 'Event ist nicht öffentlich sichtbar' },
    { value: 'published', label: 'Veröffentlicht', description: 'Event ist öffentlich sichtbar' },
    { value: 'cancelled', label: 'Abgesagt', description: 'Event wurde abgesagt' }
  ]

  // Helper functions
  const toggleGenre = (genre: string) => {
    if (formData.genres.includes(genre)) {
      formData.genres = formData.genres.filter(g => g !== genre)
    } else {
      formData.genres = [...formData.genres, genre]
    }
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      formData.tags = [...formData.tags, tag.trim()]
    }
  }

  const removeTag = (tag: string) => {
    formData.tags = formData.tags.filter(t => t !== tag)
  }

  const handleTagInput = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const input = event.target as HTMLInputElement
      addTag(input.value)
      input.value = ''
    }
  }

  // Image upload
  const uploadCoverImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `covers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    return filePath
  }

  const uploadEventImages = async (files: FileList): Promise<string[]> => {
    const uploads = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `gallery/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      return filePath
    })

    return Promise.all(uploads)
  }

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      throw new Error('Titel ist erforderlich')
    }
    if (!formData.date_time) {
      throw new Error('Startdatum ist erforderlich')
    }
    if (formData.end_time && new Date(formData.end_time) <= new Date(formData.date_time)) {
      throw new Error('Enddatum muss nach dem Startdatum liegen')
    }
    if (formData.price_min !== null && formData.price_max !== null && formData.price_min > formData.price_max) {
      throw new Error('Mindestpreis kann nicht höher als Höchstpreis sein')
    }
    if (formData.capacity !== null && formData.capacity <= 0) {
      throw new Error('Kapazität muss größer als 0 sein')
    }
  }

  // Form submission
  const handleSubmit = async () => {
    if (!$user) {
      error = 'Du musst angemeldet sein'
      return
    }

    loading = true
    error = ''

    try {
      validateForm()

      // Upload images
      let coverImagePath = event?.cover_image_url || null
      let galleryImages = event?.images || []

      if (coverImageFile) {
        uploadingImages = true
        coverImagePath = await uploadCoverImage(coverImageFile)
      }

      if (imageFiles && imageFiles.length > 0) {
        uploadingImages = true
        const newImages = await uploadEventImages(imageFiles)
        galleryImages = [...galleryImages, ...newImages]
      }

      uploadingImages = false

      // Prepare event data
      const eventData: EventInsert = {
        ...formData,
        organizer_id: $user.id,
        cover_image_url: coverImagePath,
        images: galleryImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let result
      if (mode === 'edit' && event) {
        result = await eventActions.updateEvent(event.id, eventData)
      } else {
        result = await eventActions.createEvent(eventData)
      }

      if (result.error) {
        throw new Error(result.error)
      }

      dispatch('success', { event: result.data })
      
      // Redirect based on status
      if (formData.status === 'published') {
        goto(`/events/${result.data.id}`)
      } else {
        goto('/dashboard/events')
      }

    } catch (err: any) {
      error = err.message || 'Ein Fehler ist aufgetreten'
    } finally {
      loading = false
      uploadingImages = false
    }
  }

  // Initialize form with existing event data
  onMount(() => {
    if (event && mode === 'edit') {
      formData = {
        title: event.title || '',
        description: event.description || '',
        date_time: event.date_time || '',
        end_time: event.end_time || '',
        location_name: event.location_name || '',
        location_address: event.location_address || '',
        location_coordinates: event.location_coordinates || null,
        genres: event.genres || [],
        price_min: event.price_min,
        price_max: event.price_max,
        capacity: event.capacity,
        age_restriction: event.age_restriction,
        dress_code: event.dress_code || '',
        special_instructions: event.special_instructions || '',
        organizer_info: event.organizer_info || '',
        contact_email: event.contact_email || '',
        contact_phone: event.contact_phone || '',
        website_url: event.website_url || '',
        facebook_url: event.facebook_url || '',
        instagram_url: event.instagram_url || '',
        twitter_url: event.twitter_url || '',
        spotify_playlist: event.spotify_playlist || '',
        youtube_playlist: event.youtube_playlist || '',
        tags: event.tags || [],
        status: event.status as 'draft' | 'published' | 'cancelled'
      }
    }
  })
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold text-white">
      {mode === 'edit' ? 'Event bearbeiten' : 'Neues Event erstellen'}
    </h1>
    
    <div class="flex items-center gap-3">
      <button
        type="button"
        on:click={() => history.back()}
        class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
      >
        Abbrechen
      </button>
      
      <button
        type="submit"
        disabled={loading || uploadingImages}
        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
      >
        {loading ? 'Speichert...' : mode === 'edit' ? 'Aktualisieren' : 'Erstellen'}
      </button>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <span class="text-red-300">{error}</span>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Main Content -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Basic Information -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Grundinformationen</h2>
        
        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Titel *
            </label>
            <input
              type="text"
              bind:value={formData.title}
              placeholder="Event-Titel eingeben..."
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Beschreibung
            </label>
            <textarea
              bind:value={formData.description}
              placeholder="Beschreibung des Events..."
              rows="4"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-vertical"
            ></textarea>
          </div>

          <!-- Date and Time -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Start *
              </label>
              <input
                type="datetime-local"
                bind:value={formData.date_time}
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Ende
              </label>
              <input
                type="datetime-local"
                bind:value={formData.end_time}
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Ort</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Veranstaltungsort
            </label>
            <input
              type="text"
              bind:value={formData.location_name}
              placeholder="z.B. Berghain, Club XY"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Adresse
            </label>
            <input
              type="text"
              bind:value={formData.location_address}
              placeholder="Straße, PLZ Stadt"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Genres -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Genres</h2>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {#each genreOptions as genre}
            <button
              type="button"
              on:click={() => toggleGenre(genre)}
              class={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                formData.genres.includes(genre)
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
              )}
            >
              {genre}
            </button>
          {/each}
        </div>
      </div>

      <!-- Images -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Bilder</h2>
        
        <div class="space-y-4">
          <!-- Cover Image -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Cover-Bild
            </label>
            <input
              type="file"
              accept="image/*"
              on:change={(e) => coverImageFile = e.target?.files?.[0] || null}
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all"
            />
          </div>

          <!-- Gallery Images -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Galerie-Bilder
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              on:change={(e) => imageFiles = e.target?.files}
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-all"
            />
          </div>

          {#if uploadingImages}
            <div class="flex items-center gap-2 text-purple-400">
              <div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm">Bilder werden hochgeladen...</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Status -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Status</h2>
        
        <div class="space-y-3">
          {#each statusOptions as option}
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                bind:group={formData.status}
                value={option.value}
                class="mt-1 w-4 h-4 text-purple-600 bg-transparent border-white/20 focus:ring-purple-500"
              />
              <div>
                <div class="text-white font-medium">{option.label}</div>
                <div class="text-gray-400 text-sm">{option.description}</div>
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Preise</h2>
        
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Min. Preis (€)
              </label>
              <input
                type="number"
                bind:value={formData.price_min}
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Max. Preis (€)
              </label>
              <input
                type="number"
                bind:value={formData.price_max}
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Settings -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Weitere Einstellungen</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Kapazität
            </label>
            <input
              type="number"
              bind:value={formData.capacity}
              min="1"
              placeholder="Unbegrenzt"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Altersfreigabe
            </label>
            <select
              bind:value={formData.age_restriction}
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value={null}>Keine Beschränkung</option>
              <option value={16}>Ab 16 Jahren</option>
              <option value={18}>Ab 18 Jahren</option>
              <option value={21}>Ab 21 Jahren</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Dress Code
            </label>
            <input
              type="text"
              bind:value={formData.dress_code}
              placeholder="z.B. Schwarz, Elegant"
              class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-md border border-white/10 rounded-xl p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Tags</h2>
        
        <div class="space-y-3">
          <input
            type="text"
            placeholder="Tag hinzufügen und Enter drücken"
            on:keydown={handleTagInput}
            class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          
          {#if formData.tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each formData.tags as tag}
                <span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                  {tag}
                  <button
                    type="button"
                    on:click={() => removeTag(tag)}
                    class="hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</form>
