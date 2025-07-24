<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>E-Mail-Bestätigung erforderlich - RaveTracker</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-8 text-center">
    <div class="text-blue-400 mb-6">
      <svg class="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
      </svg>
    </div>
    
    <h1 class="text-3xl font-bold text-white mb-4">E-Mail bestätigen</h1>
    
    <p class="text-gray-300 mb-6 leading-relaxed">
      Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. 
      Bitte prüfen Sie Ihr Postfach und klicken Sie auf den Bestätigungslink, 
      um Ihr Konto zu aktivieren.
    </p>

    <div class="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
      <p class="text-blue-200 text-sm">
        <strong>Tipp:</strong> Überprüfen Sie auch Ihren Spam-Ordner, 
        falls Sie keine E-Mail erhalten haben.
      </p>
    </div>

    <div class="space-y-3">
      <button 
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        on:click={() => goto('/auth/resend-confirmation')}
      >
        E-Mail erneut senden
      </button>
      
      <button 
        class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        on:click={() => goto('/auth/login')}
      >
        Zur Anmeldung
      </button>
    </div>

    <div class="mt-6 text-center">
      <p class="text-gray-400 text-sm">
        Bereits bestätigt? 
        <button 
          class="text-purple-400 hover:text-purple-300 transition-colors underline"
          on:click={() => goto('/auth/login')}
        >
          Jetzt anmelden
        </button>
      </p>
    </div>
  </div>
</div>
