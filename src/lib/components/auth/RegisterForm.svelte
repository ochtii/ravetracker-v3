<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Button, Input, Card } from '$lib/ui'
  import { authActions } from '$lib/stores/auth'
  import { registerSchema, validateForm, type RegisterData } from '$lib/validation/auth'
  import { supabase } from '$lib/utils/supabase'

  const dispatch = createEventDispatcher<{
    success: { user: any }
    switch: { mode: 'login' }
  }>()

  // Form state
  let formData: RegisterData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: ''
  }
  
  let errors: Record<string, string> = {}
  let loading = false
  let showPassword = false
  let showConfirmPassword = false
  let step = 1 // Multi-step form

  // Handle form submission
  async function handleSubmit() {
    loading = true
    errors = {}

    // Validate form
    const validation = validateForm(registerSchema, formData)
    if (!validation.success) {
      errors = validation.errors || {}
      loading = false
      return
    }

    try {
      // Check if username is available (if provided)
      if (formData.username) {
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

      const result = await authActions.signUp(formData.email, formData.password, {
        ...(formData.firstName && { first_name: formData.firstName }),
        ...(formData.lastName && { last_name: formData.lastName }),
        ...(formData.username && { username: formData.username })
      })
      
      if (result.data) {
        // Registration successful - email confirmation required
        dispatch('success', { user: result.data.user })
      } else if (result.error) {
        errors.general = result.error.message || 'Registrierung fehlgeschlagen'
      }
    } catch (error) {
      console.error('Registration error:', error)
      errors.general = error instanceof Error ? error.message : 'Registrierung fehlgeschlagen'
    } finally {
      loading = false
    }
  }

  // Handle social registration
  async function handleSocialSignup(provider: 'google' | 'github') {
    loading = true
    errors = {}

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
    } catch (error) {
      console.error('Social signup error:', error)
      errors.general = error instanceof Error ? error.message : 'Social Registrierung fehlgeschlagen'
    } finally {
      loading = false
    }
  }

  function nextStep() {
    // Validate current step
    if (step === 1) {
      const stepData = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      }
      const validation = validateForm(registerSchema, stepData)
      
      if (!validation.success) {
        errors = validation.errors || {}
        return
      }
      errors = {}
      step = 2
    }
  }

  function prevStep() {
    if (step > 1) {
      step = 1
      errors = {}
    }
  }

  function togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      showPassword = !showPassword
    } else {
      showConfirmPassword = !showConfirmPassword
    }
  }

  // Password strength indicator
  $: passwordStrength = getPasswordStrength(formData.password)

  function getPasswordStrength(password: string) {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    return {
      score,
      label: ['Sehr schwach', 'Schwach', 'Mittelmäßig', 'Stark', 'Sehr stark'][score] || 'Sehr schwach',
      color: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'][score] || 'bg-red-500'
    }
  }
</script>

<Card variant="glass" class="w-full max-w-md mx-auto">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-white mb-2">Konto erstellen</h2>
    <p class="text-white/70">Werde Teil der RaveTracker-Community</p>
  </div>

  <!-- Progress Indicator -->
  <div class="flex items-center justify-center mb-6">
    <div class="flex items-center space-x-2">
      <div class="flex items-center">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 1 ? 'bg-primary-500 text-white' : 'bg-white/20 text-white/60'
        }`}>
          1
        </div>
        <span class="ml-2 text-sm text-white/70">Account</span>
      </div>
      <div class="w-8 h-px bg-white/20"></div>
      <div class="flex items-center">
        <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          step >= 2 ? 'bg-primary-500 text-white' : 'bg-white/20 text-white/60'
        }`}>
          2
        </div>
        <span class="ml-2 text-sm text-white/70">Profil</span>
      </div>
    </div>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if step === 1}
      <!-- Step 1: Account Information -->
      <div class="space-y-4">
        <!-- Email Input -->
        <Input
          type="email"
          label="E-Mail-Adresse"
          placeholder="deine@email.com"
          bind:value={formData.email}
          error={errors.email}
          disabled={loading}
          required
        />

        <!-- Password Input -->
        <div class="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Passwort"
            placeholder="Mindestens 8 Zeichen"
            bind:value={formData.password}
            error={errors.password}
            disabled={loading}
            required
          />
          <button
            type="button"
            class="absolute right-3 top-9 text-white/60 hover:text-white transition-colors"
            on:click={() => togglePasswordVisibility('password')}
            disabled={loading}
          >
            {#if showPassword}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>

        <!-- Password Strength Indicator -->
        {#if formData.password}
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-white/70">Passwort-Stärke:</span>
              <span class="text-white">{passwordStrength.label}</span>
            </div>
            <div class="w-full bg-white/20 rounded-full h-2">
              <div 
                class={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                style="width: {(passwordStrength.score / 5) * 100}%"
              ></div>
            </div>
          </div>
        {/if}

        <!-- Confirm Password Input -->
        <div class="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Passwort bestätigen"
            placeholder="Passwort erneut eingeben"
            bind:value={formData.confirmPassword}
            error={errors.confirmPassword}
            disabled={loading}
            required
          />
          <button
            type="button"
            class="absolute right-3 top-9 text-white/60 hover:text-white transition-colors"
            on:click={() => togglePasswordVisibility('confirmPassword')}
            disabled={loading}
          >
            {#if showConfirmPassword}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            {/if}
          </button>
        </div>

        <!-- Next Button -->
        <Button
          type="button"
          variant="primary"
          class="w-full"
          disabled={loading}
          onclick={nextStep}
        >
          Weiter
        </Button>
      </div>

    {:else if step === 2}
      <!-- Step 2: Profile Information -->
      <div class="space-y-4">
        <!-- Name Inputs -->
        <div class="grid grid-cols-2 gap-4">
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

        <!-- Username Input -->
        <Input
          type="text"
          label="Benutzername (optional)"
          placeholder="max_raver"
          bind:value={formData.username}
          error={errors.username}
          hint="Eindeutiger Name für dein Profil"
          disabled={loading}
        />

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <Button
            type="button"
            variant="ghost"
            class="flex-1"
            disabled={loading}
            onclick={prevStep}
          >
            Zurück
          </Button>
          <Button
            type="submit"
            variant="primary"
            class="flex-1"
            {loading}
            disabled={loading}
          >
            {#if loading}
              Registrieren...
            {:else}
              Registrieren
            {/if}
          </Button>
        </div>
      </div>
    {/if}

    <!-- Error/Success Messages -->
    {#if errors.general}
      <div class="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
        {errors.general}
      </div>
    {/if}

    {#if errors.success}
      <div class="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-sm">
        {errors.success}
      </div>
    {/if}
  </form>

  {#if step === 1}
    <!-- Divider -->
    <div class="flex items-center my-6">
      <div class="flex-1 border-t border-white/20"></div>
      <span class="px-3 text-white/60 text-sm">oder</span>
      <div class="flex-1 border-t border-white/20"></div>
    </div>

    <!-- Social Registration -->
    <div class="space-y-3">
      <Button
        variant="glass"
        class="w-full"
        disabled={loading}
        onclick={() => handleSocialSignup('google')}
      >
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Mit Google registrieren
      </Button>

      <Button
        variant="glass"
        class="w-full"
        disabled={loading}
        onclick={() => handleSocialSignup('github')}
      >
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Mit GitHub registrieren
      </Button>
    </div>
  {/if}

 
</Card>
