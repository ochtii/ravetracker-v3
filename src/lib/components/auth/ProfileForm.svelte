<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { Button, Input, Card } from '$lib/ui'
  import { user, profile, authActions } from '$lib/stores/auth'
  import { profileSchema, validateForm, type ProfileData } from '$lib/validation/auth'
  import { supabase } from '$lib/utils/supabase'

  const dispatch = createEventDispatcher<{
    success: { profile: any }
    cancel: void
  }>()

  // Form state
  let formData: ProfileData = {
    firstName: '',
    lastName: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    birthDate: ''
  }
  
  let errors: Record<string, string> = {}
  let loading = false
  let uploading = false
  let originalUsername = ''
  let avatarFile: File | null = null
  let avatarPreview: string | null = null

  // Load current profile data
  onMount(() => {
    if ($profile) {
      formData = {
        firstName: $profile.first_name || '',
        lastName: $profile.last_name || '',
        username: $profile.username || '',
        bio: $profile.bio || '',
        website: $profile.website || '',
        location: $profile.location || '',
        birthDate: $profile.birth_date || ''
      }
      originalUsername = $profile.username || ''
      avatarPreview = $profile.avatar_url || null
    }
  })

  // Handle form submission
  async function handleSubmit() {
    loading = true
    errors = {}

    // Validate form
    const validation = validateForm(profileSchema, formData)
    if (!validation.success) {
      errors = validation.errors || {}
      loading = false
      return
    }

    try {
      // Check if username is available (if changed)
      if (formData.username && formData.username !== originalUsername) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username)
          .single()

        if (existingProfile) {
          errors.username = 'Benutzername ist bereits vergeben'
          loading = false
          return
        }
      }

      // Upload avatar if selected
      let avatarUrl = $profile?.avatar_url
      if (avatarFile) {
        try {
          avatarUrl = await authActions.uploadAvatar(avatarFile)
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError)
          errors.avatar = 'Avatar konnte nicht hochgeladen werden'
          loading = false
          return
        }
      }

      // Update profile
      const updateData = {
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        username: formData.username || null,
        bio: formData.bio || null,
        website: formData.website || null,
        location: formData.location || null,
        birth_date: formData.birthDate || null,
        ...(avatarUrl && { avatar_url: avatarUrl })
      }

      const result = await authActions.updateProfile(updateData)
      if (result) {
        dispatch('success', { profile: result })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      errors.general = error instanceof Error ? error.message : 'Profil konnte nicht aktualisiert werden'
    } finally {
      loading = false
    }
  }

  // Handle avatar file selection
  function handleAvatarChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    
    if (file) {
      // Validate file
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      
      if (!allowedTypes.includes(file.type)) {
        errors.avatar = 'Nur JPEG, PNG und WebP Dateien sind erlaubt'
        return
      }
      
      if (file.size > maxSize) {
        errors.avatar = 'Datei ist zu groß (max. 5MB)'
        return
      }

      avatarFile = file
      errors.avatar = ''

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove avatar
  function removeAvatar() {
    avatarFile = null
    avatarPreview = $profile?.avatar_url || null
  }

  // Delete account
  async function handleDeleteAccount() {
    if (!confirm('Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    loading = true
    try {
      await authActions.deleteAccount()
    } catch (error) {
      console.error('Delete account error:', error)
      errors.general = error instanceof Error ? error.message : 'Konto konnte nicht gelöscht werden'
    } finally {
      loading = false
    }
  }
</script>

<Card variant="glass" class="w-full max-w-2xl mx-auto">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-white mb-2">Profil bearbeiten</h2>
    <p class="text-white/70">Personalisiere dein RaveTracker-Profil</p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <!-- Avatar Section -->
    <div class="flex flex-col items-center space-y-4">
      <div class="relative">
        {#if avatarPreview}
          <img 
            src={avatarPreview} 
            alt="Avatar Preview" 
            class="w-24 h-24 rounded-full object-cover border-2 border-white/20"
          />
        {:else}
          <div class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
            <svg class="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        {/if}
        
        {#if avatarFile}
          <button
            type="button"
            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
            on:click={removeAvatar}
            disabled={loading}
          >
            ×
          </button>
        {/if}
      </div>

      <div class="flex flex-col items-center space-y-2">
        <input
          type="file"
          id="avatar"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          on:change={handleAvatarChange}
          disabled={loading}
        />
        <label 
          for="avatar"
          class="btn btn-glass text-sm cursor-pointer"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Avatar ändern
        </label>
        {#if errors.avatar}
          <span class="text-red-400 text-sm">{errors.avatar}</span>
        {/if}
      </div>
    </div>

    <!-- Personal Information -->
    <div class="grid md:grid-cols-2 gap-4">
      <Input
        type="text"
        label="Vorname"
        placeholder="Max"
        bind:value={formData.firstName}
        error={errors.firstName}
        disabled={loading}
      />
      <Input
        type="text"
        label="Nachname"
        placeholder="Mustermann"
        bind:value={formData.lastName}
        error={errors.lastName}
        disabled={loading}
      />
    </div>

    <!-- Username -->
    <Input
      type="text"
      label="Benutzername"
      placeholder="max_raver"
      bind:value={formData.username}
      error={errors.username}
      hint="Eindeutiger Name für dein Profil"
      disabled={loading}
    />

    <!-- Bio -->
    <div class="space-y-1">
      <label class="block text-sm font-medium text-white/90">
        Bio
      </label>
      <textarea
        class="form-input resize-none"
        rows="3"
        placeholder="Erzähle etwas über dich..."
        bind:value={formData.bio}
        disabled={loading}
        maxlength="500"
      ></textarea>
      <div class="flex justify-between text-xs text-white/60">
        <span>{errors.bio || ''}</span>
        <span>{formData.bio?.length || 0}/500</span>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="grid md:grid-cols-2 gap-4">
      <Input
        type="url"
        label="Website"
        placeholder="https://deine-website.de"
        bind:value={formData.website}
        error={errors.website}
        disabled={loading}
      />
      <Input
        type="text"
        label="Standort"
        placeholder="Berlin, Deutschland"
        bind:value={formData.location}
        error={errors.location}
        disabled={loading}
      />
    </div>

    <!-- Birth Date -->
    <Input
      type="date"
      label="Geburtsdatum"
      bind:value={formData.birthDate}
      error={errors.birthDate}
      hint="Du musst mindestens 13 Jahre alt sein"
      disabled={loading}
    />

    <!-- Error/Success Messages -->
    {#if errors.general}
      <div class="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
        {errors.general}
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3">
      <Button
        type="button"
        variant="ghost"
        class="flex-1"
        disabled={loading}
        onclick={() => dispatch('cancel')}
      >
        Abbrechen
      </Button>
      <Button
        type="submit"
        variant="primary"
        class="flex-1"
        {loading}
        disabled={loading}
      >
        {#if loading}
          Speichern...
        {:else}
          Profil speichern
        {/if}
      </Button>
    </div>
  </form>

  <!-- Danger Zone -->
  <div class="mt-8 pt-6 border-t border-white/20">
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-red-400 mb-2">Gefahrenbereich</h3>
      <p class="text-red-200 text-sm mb-4">
        Das Löschen deines Kontos entfernt alle deine Daten permanent. Diese Aktion kann nicht rückgängig gemacht werden.
      </p>
      <Button
        variant="danger"
        size="sm"
        disabled={loading}
        onclick={handleDeleteAccount}
      >
        Konto löschen
      </Button>
    </div>
  </div>
</Card>

<style>
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-glass {
    @apply bg-white/10 border border-white/20 text-white hover:bg-white/20;
    backdrop-filter: blur(10px);
  }
</style>
