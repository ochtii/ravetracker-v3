<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { authState } from '$lib/stores/auth';
  import { confirmEmail, resendConfirmation } from '$lib/utils/email-confirmation';
  import { goto } from '$app/navigation';

  let testEmail = '';
  let testToken = '';
  let testResult = '';
  let loading = false;
  let urlToken = '';
  let userConfirmationToken = '';

  onMount(() => {
    // Check for token in URL
    urlToken = $page.url.searchParams.get('token') || 
               $page.url.searchParams.get('access_token') || 
               $page.url.hash.split('access_token=')[1]?.split('&')[0] || '';
    
    // Pre-fill test token if found in URL
    if (urlToken) {
      testToken = urlToken;
    }
  });

  // Extract confirmation token from user metadata
  $: {
    if ($authState.user?.user_metadata?.confirmation_token) {
      userConfirmationToken = $authState.user.user_metadata.confirmation_token;
    } else if ($authState.user?.confirmation_sent_at && !$authState.user?.email_confirmed_at) {
      userConfirmationToken = 'Token in E-Mail gesendet (nicht in Metadaten verfügbar)';
    } else {
      userConfirmationToken = '';
    }
  }

  async function testConfirmEmail() {
    loading = true;
    testResult = '';
    
    try {
      if (!testToken.trim()) {
        testResult = 'Fehler: Token ist erforderlich';
        return;
      }

      const result = await confirmEmail(testToken);
      
      if (result.success) {
        testResult = `✅ Erfolg: E-Mail bestätigt für ${result.user?.email}`;
      } else {
        testResult = `❌ Fehler: ${result.error}`;
      }
    } catch (error) {
      testResult = `❌ Exception: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
    } finally {
      loading = false;
    }
  }

  async function testResendConfirmation() {
    loading = true;
    testResult = '';
    
    try {
      if (!testEmail.trim()) {
        testResult = 'Fehler: E-Mail ist erforderlich';
        return;
      }

      const result = await resendConfirmation(testEmail);
      
      if (result.success) {
        testResult = `✅ Erfolg: Bestätigungs-E-Mail gesendet an ${testEmail}`;
      } else {
        testResult = `❌ Fehler: ${result.error}`;
      }
    } catch (error) {
      testResult = `❌ Exception: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
    } finally {
      loading = false;
    }
  }

  function testNavigation(route: string) {
    goto(route);
  }

  function extractTokenFromUrl(url: string = window.location.href): string[] {
    const tokens: string[] = [];
    
    // Check URL search params
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    
    // Common token parameter names
    const tokenParams = ['token', 'access_token', 'confirmation_token', 'email_confirmation_token'];
    
    tokenParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) {
        tokens.push(`${param}: ${value}`);
      }
    });
    
    // Check hash params
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      tokenParams.forEach(param => {
        const value = hashParams.get(param);
        if (value) {
          tokens.push(`${param} (hash): ${value}`);
        }
      });
    }
    
    return tokens;
  }

  function showAllTokens() {
    const allTokens = extractTokenFromUrl();
    const userTokens = [];
    
    if ($authState.user?.user_metadata?.confirmation_token) {
      userTokens.push(`user_metadata.confirmation_token: ${$authState.user.user_metadata.confirmation_token}`);
    }
    
    if ($authState.user?.identities) {
      $authState.user.identities.forEach((identity, index) => {
        if (identity.identity_data?.confirmation_token) {
          userTokens.push(`identity[${index}].confirmation_token: ${identity.identity_data.confirmation_token}`);
        }
      });
    }
    
    const allFound = [...allTokens, ...userTokens];
    
    if (allFound.length > 0) {
      testResult = `🔍 Gefundene Token:\n${allFound.join('\n')}`;
    } else {
      testResult = '🔍 Keine Token gefunden';
    }
  }
</script>

<svelte:head>
  <title>Auth Test - RaveTracker</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-white mb-8">Auth System Test</h1>

  <!-- Current Auth State -->
  <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
    <h2 class="text-2xl font-bold text-white mb-4">Aktueller Auth-Status</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">User:</h3>
        <pre class="bg-black/20 p-4 rounded-lg text-green-400 text-sm overflow-auto">
{JSON.stringify($authState.user, null, 2)}
        </pre>
      </div>
      
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">Profile:</h3>
        <pre class="bg-black/20 p-4 rounded-lg text-blue-400 text-sm overflow-auto">
{JSON.stringify($authState.profile, null, 2)}
        </pre>
      </div>
    </div>

    <div class="mt-4">
      <h3 class="text-lg font-semibold text-white mb-2">Loading States:</h3>
      <div class="flex gap-4 text-sm">
        <span class="text-yellow-400">
          User Loading: {$authState.userLoading ? '✓' : '✗'}
        </span>
        <span class="text-yellow-400">
          Profile Loading: {$authState.profileLoading ? '✓' : '✗'}
        </span>
      </div>
    </div>
  </div>

  <!-- Email Confirmation Tokens -->
  <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
    <h2 class="text-2xl font-bold text-white mb-4">E-Mail Bestätigungs-Token</h2>
    
    <div class="space-y-4">
      <!-- URL Token -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">Token aus URL:</h3>
        <div class="bg-black/20 p-4 rounded-lg">
          {#if urlToken}
            <div class="flex items-center justify-between">
              <code class="text-green-400 text-sm break-all">{urlToken}</code>
              <button
                on:click={() => {testToken = urlToken}}
                class="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Verwenden
              </button>
            </div>
          {:else}
            <span class="text-gray-400">Kein Token in URL gefunden</span>
          {/if}
        </div>
      </div>

      <!-- User Metadata Token -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">Token aus User-Metadaten:</h3>
        <div class="bg-black/20 p-4 rounded-lg">
          {#if userConfirmationToken}
            <div class="flex items-center justify-between">
              <code class="text-yellow-400 text-sm break-all">{userConfirmationToken}</code>
              {#if userConfirmationToken !== 'Token in E-Mail gesendet (nicht in Metadaten verfügbar)'}
                <button
                  on:click={() => {testToken = userConfirmationToken}}
                  class="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Verwenden
                </button>
              {/if}
            </div>
          {:else}
            <span class="text-gray-400">Kein Token in User-Metadaten</span>
          {/if}
        </div>
      </div>

      <!-- Email Confirmation Status -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">E-Mail Status:</h3>
        <div class="bg-black/20 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Bestätigt:</span>
              <span class={$authState.user?.email_confirmed_at ? "text-green-400" : "text-red-400"}>
                {$authState.user?.email_confirmed_at ? '✅ Ja' : '❌ Nein'}
              </span>
            </div>
            <div>
              <span class="text-gray-400">Bestätigung gesendet:</span>
              <span class={$authState.user?.confirmation_sent_at ? "text-yellow-400" : "text-gray-400"}>
                {$authState.user?.confirmation_sent_at ? '📧 Ja' : '➖ Nein'}
              </span>
            </div>
            <div>
              <span class="text-gray-400">E-Mail:</span>
              <span class="text-blue-400">
                {$authState.user?.email || 'Nicht verfügbar'}
              </span>
            </div>
          </div>
          
          {#if $authState.user?.confirmation_sent_at}
            <div class="mt-2 text-xs text-gray-400">
              Letzte Bestätigung gesendet: {new Date($authState.user.confirmation_sent_at).toLocaleString('de-DE')}
            </div>
          {/if}
          
          {#if $authState.user?.email_confirmed_at}
            <div class="mt-2 text-xs text-gray-400">
              E-Mail bestätigt am: {new Date($authState.user.email_confirmed_at).toLocaleString('de-DE')}
            </div>
          {/if}
        </div>
      </div>

      <!-- Quick Actions -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-2">Schnell-Aktionen:</h3>
        <div class="flex gap-2 flex-wrap">
          <button
            on:click={() => {testEmail = $authState.user?.email || ''}}
            class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            E-Mail aus User laden
          </button>
          
          <button
            on:click={() => {
              const currentUrl = window.location.href;
              const urlParams = new URLSearchParams(window.location.search);
              const hashParams = new URLSearchParams(window.location.hash.substring(1));
              console.log('Current URL:', currentUrl);
              console.log('URL Params:', Object.fromEntries(urlParams));
              console.log('Hash Params:', Object.fromEntries(hashParams));
            }}
            class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            URL Debug (Console)
          </button>
          
          <button
            on:click={() => {
              navigator.clipboard.writeText(testToken);
              testResult = '📋 Token in Zwischenablage kopiert';
            }}
            disabled={!testToken}
            class="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Token kopieren
          </button>
          
          <button
            on:click={showAllTokens}
            class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Alle Token suchen
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Email Confirmation Tests -->
  <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
    <h2 class="text-2xl font-bold text-white mb-4">E-Mail Bestätigung Tests</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Confirm Email Test -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-3">E-Mail bestätigen</h3>
        <div class="space-y-3">
          <input
            type="text"
            bind:value={testToken}
            placeholder="Bestätigungs-Token eingeben"
            class="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            on:click={testConfirmEmail}
            disabled={loading}
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Teste...' : 'E-Mail bestätigen'}
          </button>
        </div>
      </div>

      <!-- Resend Confirmation Test -->
      <div>
        <h3 class="text-lg font-semibold text-white mb-3">Bestätigung erneut senden</h3>
        <div class="space-y-3">
          <input
            type="email"
            bind:value={testEmail}
            placeholder="E-Mail-Adresse eingeben"
            class="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            on:click={testResendConfirmation}
            disabled={loading}
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Sende...' : 'Bestätigung senden'}
          </button>
        </div>
      </div>
    </div>

    <!-- Test Result -->
    {#if testResult}
      <div class="mt-6 p-4 bg-black/20 rounded-lg">
        <h4 class="text-white font-semibold mb-2">Test-Ergebnis:</h4>
        <p class="text-gray-300">{testResult}</p>
      </div>
    {/if}
  </div>

  <!-- Navigation Tests -->
  <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
    <h2 class="text-2xl font-bold text-white mb-4">Navigation Tests</h2>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button
        on:click={() => testNavigation('/auth/login')}
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Login
      </button>
      
      <button
        on:click={() => testNavigation('/auth/register')}
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Register
      </button>
      
      <button
        on:click={() => testNavigation('/auth/forgot-password')}
        class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Passwort vergessen
      </button>
      
      <button
        on:click={() => testNavigation('/auth/confirm-email-sent')}
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        E-Mail gesendet
      </button>
      
      <button
        on:click={() => testNavigation('/auth/confirm')}
        class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Bestätigen
      </button>
      
      <button
        on:click={() => testNavigation('/auth/resend-confirmation')}
        class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Erneut senden
      </button>
      
      <button
        on:click={() => testNavigation('/auth/callback')}
        class="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Callback
      </button>
      
      <button
        on:click={() => testNavigation('/dashboard')}
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Dashboard
      </button>
    </div>
  </div>

  <!-- API Endpoints -->
  <div class="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
    <h2 class="text-2xl font-bold text-white mb-4">API Endpoints</h2>
    
    <div class="space-y-2 text-sm font-mono">
      <div class="text-green-400">✅ /auth/login - Anmeldung</div>
      <div class="text-green-400">✅ /auth/register - Registrierung</div>
      <div class="text-green-400">✅ /auth/callback - OAuth Callback</div>
      <div class="text-green-400">✅ /auth/confirm - E-Mail bestätigen</div>
      <div class="text-green-400">✅ /auth/resend-confirmation - Bestätigung erneut senden</div>
      <div class="text-green-400">✅ /auth/confirm-email-sent - Bestätigungs-Info</div>
      <div class="text-green-400">✅ /auth/forgot-password - Passwort vergessen</div>
      <div class="text-green-400">✅ /auth/reset-password - Passwort zurücksetzen</div>
      <div class="text-blue-400">🔒 /dashboard - Dashboard (authentifiziert)</div>
    </div>
  </div>
</div>
