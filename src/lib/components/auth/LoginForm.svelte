<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Button, Input, Card } from '$lib/ui'
  import { authActions } from '$lib/stores/auth'
  import { loginSchema, validateForm, type LoginData } from '$lib/validation/auth'
  import { supabase } from '$lib/utils/supabase'

  const dispatch = createEventDispatcher<{
    success: { user: any }
    switch: { mode: 'register' | 'forgot-password' | 'magic-link' }
  }>()

  // Form state
  let formData: LoginData = {
    email: '',
    password: ''
  }
  
  let errors: Record<string, string> = {}
  let loading = false
  let showPassword = false

  // Handle form submission
  async function handleSubmit() {
    loading = true
    errors = {}

    // Validate form
    const validation = validateForm(loginSchema, formData)
    if (!validation.success) {
      errors = validation.errors || {}
      loading = false
      return
    }

    try {
      const result = await authActions.signIn(formData.email, formData.password)
      if (result) {
        dispatch('success', { user: result })
      }
    } catch (error) {
      console.error('Login error:', error)
      errors.general = error instanceof Error ? error.message : 'Login fehlgeschlagen'
    } finally {
      loading = false
    }
  }

  // Handle social login
  async function handleSocialLogin(provider: 'google' | 'github') {
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
      console.error('Social login error:', error)
      errors.general = error instanceof Error ? error.message : 'Social Login fehlgeschlagen'
    } finally {
      loading = false
    }
  }

  // Handle magic link
  async function handleMagicLink() {
    if (!formData.email) {
      errors.email = 'E-Mail ist für Magic Link erforderlich'
      return
    }

    loading = true
    errors = {}

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      
      errors.success = `Magic Link wurde an ${formData.email} gesendet`
    } catch (error) {
      console.error('Magic link error:', error)
      errors.general = error instanceof Error ? error.message : 'Magic Link konnte nicht gesendet werden'
    } finally {
      loading = false
    }
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword
  }
</script>

<Card variant="glass" class="w-full max-w-md mx-auto">
  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-white mb-2">Willkommen zurück</h2>
    <p class="text-white/70">Melde dich in deinem RaveTracker-Account an</p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
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
        placeholder="Dein Passwort"
        bind:value={formData.password}
        error={errors.password}
        disabled={loading}
        required
      />
      <button
        type="button"
        class="absolute right-3 top-9 text-white/60 hover:text-white transition-colors"
        on:click={togglePasswordVisibility}
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

    <!-- Login Button -->
    <Button
      type="submit"
      variant="primary"
      class="w-full"
      {loading}
      disabled={loading}
    >
      {#if loading}
        Anmelden...
      {:else}
        Anmelden
      {/if}
    </Button>

    <!-- Magic Link Button -->
    <Button
      type="button"
      variant="ghost"
      class="w-full"
      disabled={loading}
      onclick={handleMagicLink}
    >
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 1.26a2 2 0 001.73-1.73L14 1l-9 7zm0 0l6 3m-6-3v9a2 2 0 002 2h10a2 2 0 002-2V8" />
      </svg>
      Magic Link senden
    </Button>
  </form>

  <!-- Divider -->
  <div class="flex items-center my-6">
    <div class="flex-1 border-t border-white/20"></div>
    <span class="px-3 text-white/60 text-sm">oder</span>
    <div class="flex-1 border-t border-white/20"></div>
  </div>

  <!-- Social Login -->
  <div class="space-y-3">
    <Button
      variant="glass"
      class="w-full"
      disabled={loading}
      onclick={() => handleSocialLogin('google')}
    >
      <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Mit Google anmelden
    </Button>

    <Button
      variant="glass"
      class="w-full"
      disabled={loading}
      onclick={() => handleSocialLogin('github')}
    >
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      Mit GitHub anmelden
    </Button>
  </div>

  <!-- Links -->
  <div class="mt-6 text-center space-y-2">
    <button
      type="button"
      class="text-sm text-white/70 hover:text-white transition-colors"
      on:click={() => dispatch('switch', { mode: 'forgot-password' })}
      disabled={loading}
    >
      Passwort vergessen?
    </button>
    
</Card>
