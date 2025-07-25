<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Button, Input, Textarea, Alert, Card } from '$lib/ui';
  import type { PageData } from '../../routes/verify/$types';

  export let data: PageData;

  let eligibilityStatus = {
    eligible: false,
    requirements: {
      accountAge: { met: false, required: 7, current: 0 },
      emailVerified: { met: false },
      profileComplete: { met: false },
      noRecentRequest: { met: false, cooldownDays: 30 }
    },
    loading: true
  };

  let requestForm = {
    message: '',
    additionalFiles: [] as File[],
    submitting: false,
    error: '',
    success: false
  };

  let existingRequest = data.verificationRequest;
  let currentUser = data.user;

  const MAX_MESSAGE_LENGTH = 1000;
  const MAX_FILES = 3;
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  onMount(async () => {
    await checkEligibility();
  });

  async function checkEligibility() {
    try {
      const response = await fetch('/api/verification/eligibility', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        eligibilityStatus = await response.json();
      } else {
        eligibilityStatus.loading = false;
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      eligibilityStatus.loading = false;
    }
  }

  function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    
    // Validate file count
    if (requestForm.additionalFiles.length + files.length > MAX_FILES) {
      requestForm.error = `Maximal ${MAX_FILES} Dateien erlaubt`;
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        requestForm.error = 'Nur JPEG, PNG, WebP und PDF Dateien erlaubt';
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        requestForm.error = 'Dateien dürfen maximal 5MB groß sein';
        return;
      }
    }

    requestForm.additionalFiles = [...requestForm.additionalFiles, ...files];
    requestForm.error = '';
  }

  function removeFile(index: number) {
    requestForm.additionalFiles = requestForm.additionalFiles.filter((_, i) => i !== index);
  }

  async function submitRequest() {
    if (!requestForm.message.trim()) {
      requestForm.error = 'Bitte gib eine Begründung an';
      return;
    }

    if (requestForm.message.length > MAX_MESSAGE_LENGTH) {
      requestForm.error = `Begründung darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein`;
      return;
    }

    requestForm.submitting = true;
    requestForm.error = '';

    try {
      const formData = new FormData();
      formData.append('message', requestForm.message);
      
      requestForm.additionalFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        requestForm.success = true;
        // Refresh data
        setTimeout(() => {
          goto('/verify', { invalidateAll: true });
        }, 2000);
      } else {
        const errorData = await response.json();
        requestForm.error = errorData.message || 'Fehler beim Einreichen des Antrags';
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      requestForm.error = 'Netzwerkfehler beim Einreichen des Antrags';
    } finally {
      requestForm.submitting = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'approved': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'needs_info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending': return 'In Bearbeitung';
      case 'approved': return 'Genehmigt';
      case 'rejected': return 'Abgelehnt';
      case 'needs_info': return 'Weitere Informationen benötigt';
      default: return 'Unbekannt';
    }
  }

  $: remainingChars = MAX_MESSAGE_LENGTH - requestForm.message.length;
  $: canSubmit = eligibilityStatus.eligible && !requestForm.submitting && requestForm.message.trim().length > 0;
</script>

<div class="max-w-4xl mx-auto p-6 space-y-8">
  <!-- Header -->
  <div class="text-center">
    <h1 class="text-3xl font-bold text-white mb-4">
      Konto-Verifizierung beantragen
    </h1>
    <p class="text-white/70 max-w-2xl mx-auto">
      Verifizierte Accounts erhalten zusätzliche Invite-Credits und haben Zugang zu erweiterten Features.
      Bitte stelle sicher, dass du alle Voraussetzungen erfüllst, bevor du einen Antrag einreichst.
    </p>
  </div>

  <!-- Existing Request Status -->
  {#if existingRequest}
    <Card variant="glass">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bestehender Antrag
          </h3>
          <div class="space-y-2">
            <div class="flex items-center">
              <span class="text-white/70 mr-2">Status:</span>
              <span class="font-semibold {getStatusColor(existingRequest.status)}">
                {getStatusText(existingRequest.status)}
              </span>
            </div>
            <div class="flex items-center">
              <span class="text-white/70 mr-2">Eingereicht:</span>
              <span class="text-white">
                {new Date(existingRequest.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
            {#if existingRequest.reviewed_at}
              <div class="flex items-center">
                <span class="text-white/70 mr-2">Bearbeitet:</span>
                <span class="text-white">
                  {new Date(existingRequest.reviewed_at).toLocaleDateString('de-DE')}
                </span>
              </div>
            {/if}
          </div>
        </div>
        
        <div class="flex-shrink-0">
          {#if existingRequest.status === 'pending'}
            <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          {:else if existingRequest.status === 'approved'}
            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
          {:else if existingRequest.status === 'rejected'}
            <div class="w-3 h-3 bg-red-400 rounded-full"></div>
          {:else if existingRequest.status === 'needs_info'}
            <div class="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          {/if}
        </div>
      </div>

      {#if existingRequest.request_message}
        <div class="mt-4 pt-4 border-t border-white/10">
          <h4 class="text-white font-medium mb-2">Deine Begründung:</h4>
          <p class="text-white/70 whitespace-pre-wrap">{existingRequest.request_message}</p>
        </div>
      {/if}

      {#if existingRequest.admin_notes}
        <div class="mt-4 pt-4 border-t border-white/10">
          <h4 class="text-white font-medium mb-2">Admin-Notizen:</h4>
          <p class="text-white/70 whitespace-pre-wrap">{existingRequest.admin_notes}</p>
        </div>
      {/if}
    </Card>
  {/if}

  <!-- Eligibility Check -->
  <Card variant="glass">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Voraussetzungen prüfen
    </h3>

    {#if eligibilityStatus.loading}
      <div class="flex items-center justify-center py-8">
        <div class="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-3 text-white/70">Prüfe Voraussetzungen...</span>
      </div>
    {:else}
      <div class="space-y-4">
        <!-- Account Age -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center">
            {#if eligibilityStatus.requirements.accountAge.met}
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
            <div>
              <span class="text-white font-medium">Account-Alter</span>
              <p class="text-white/70 text-sm">
                Mindestens {eligibilityStatus.requirements.accountAge.required} Tage alt
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-{eligibilityStatus.requirements.accountAge.met ? 'green' : 'red'}-400 font-medium">
              {eligibilityStatus.requirements.accountAge.current} Tage
            </span>
          </div>
        </div>

        <!-- Email Verified -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center">
            {#if eligibilityStatus.requirements.emailVerified.met}
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
            <div>
              <span class="text-white font-medium">E-Mail verifiziert</span>
              <p class="text-white/70 text-sm">
                Deine E-Mail-Adresse muss bestätigt sein
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-{eligibilityStatus.requirements.emailVerified.met ? 'green' : 'red'}-400 font-medium">
              {eligibilityStatus.requirements.emailVerified.met ? 'Verifiziert' : 'Nicht verifiziert'}
            </span>
          </div>
        </div>

        <!-- Profile Complete -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center">
            {#if eligibilityStatus.requirements.profileComplete.met}
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
            <div>
              <span class="text-white font-medium">Profil vollständig</span>
              <p class="text-white/70 text-sm">
                Username, Biografie und Avatar erforderlich
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-{eligibilityStatus.requirements.profileComplete.met ? 'green' : 'red'}-400 font-medium">
              {eligibilityStatus.requirements.profileComplete.met ? 'Vollständig' : 'Unvollständig'}
            </span>
          </div>
        </div>

        <!-- No Recent Request -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div class="flex items-center">
            {#if eligibilityStatus.requirements.noRecentRequest.met}
              <svg class="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            {:else}
              <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
            <div>
              <span class="text-white font-medium">Keine kürzlichen Anträge</span>
              <p class="text-white/70 text-sm">
                {eligibilityStatus.requirements.noRecentRequest.cooldownDays} Tage Wartezeit zwischen Anträgen
              </p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-{eligibilityStatus.requirements.noRecentRequest.met ? 'green' : 'red'}-400 font-medium">
              {eligibilityStatus.requirements.noRecentRequest.met ? 'OK' : 'Wartezeit aktiv'}
            </span>
          </div>
        </div>

        <!-- Overall Status -->
        <div class="mt-6 p-4 rounded-lg bg-{eligibilityStatus.eligible ? 'green' : 'red'}-500/20 border border-{eligibilityStatus.eligible ? 'green' : 'red'}-500/30">
          <div class="flex items-center">
            {#if eligibilityStatus.eligible}
              <svg class="w-6 h-6 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="text-green-400 font-semibold">Berechtigt für Verifizierung</span>
                <p class="text-green-300/70 text-sm">Du erfüllst alle Voraussetzungen für einen Verifizierungsantrag.</p>
              </div>
            {:else}
              <svg class="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="text-red-400 font-semibold">Nicht berechtigt</span>
                <p class="text-red-300/70 text-sm">Bitte erfülle alle Voraussetzungen, bevor du einen Antrag einreichst.</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </Card>

  <!-- Request Form -->
  {#if eligibilityStatus.eligible && !existingRequest}
    <Card variant="glass">
      <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Verifizierungsantrag einreichen
      </h3>

      {#if requestForm.success}
        <Alert variant="success">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Dein Verifizierungsantrag wurde erfolgreich eingereicht und wird in Kürze bearbeitet.</span>
        </Alert>
      {:else}
        <form on:submit|preventDefault={submitRequest} class="space-y-6">
          <!-- Message -->
          <div>
            <label for="message" class="block text-white font-medium mb-2">
              Begründung für die Verifizierung *
            </label>
            <Textarea
              id="message"
              bind:value={requestForm.message}
              placeholder="Erkläre, warum du verifiziert werden möchtest. Erwähne deine Verbindung zur Szene, Events die du besuchst, oder andere relevante Informationen..."
              rows="6"
              maxlength={MAX_MESSAGE_LENGTH}
              required
            />
            <div class="flex justify-between mt-2">
              <p class="text-white/60 text-sm">
                Gib eine aussagekräftige Begründung für deinen Verifizierungsantrag an.
              </p>
              <span class="text-white/60 text-sm">
                {remainingChars} Zeichen übrig
              </span>
            </div>
          </div>

          <!-- File Upload -->
          <div>
            <label class="block text-white font-medium mb-2">
              Zusätzliche Nachweise (optional)
            </label>
            <div class="space-y-4">
              <div class="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  on:change={handleFileUpload}
                  class="hidden"
                  id="file-upload"
                />
                <label for="file-upload" class="cursor-pointer">
                  <svg class="w-12 h-12 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span class="text-white font-medium">Dateien hochladen</span>
                  <p class="text-white/60 text-sm mt-2">
                    JPEG, PNG, WebP oder PDF • Max. 5MB pro Datei • Max. {MAX_FILES} Dateien
                  </p>
                </label>
              </div>

              {#if requestForm.additionalFiles.length > 0}
                <div class="space-y-2">
                  {#each requestForm.additionalFiles as file, index}
                    <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div class="flex items-center">
                        <svg class="w-5 h-5 text-white/60 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <span class="text-white text-sm">{file.name}</span>
                          <p class="text-white/60 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        on:click={() => removeFile(index)}
                        class="text-red-400 hover:text-red-300 p-1"
                        title="Datei entfernen"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
            <p class="text-white/60 text-sm mt-2">
              Optional: Lade Bilder von Events, Tickets oder andere Nachweise hoch, die deine Verbindung zur Szene belegen.
            </p>
          </div>

          {#if requestForm.error}
            <Alert variant="error">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{requestForm.error}</span>
            </Alert>
          {/if}

          <div class="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit}
              loading={requestForm.submitting}
              class="flex-1"
            >
              {#if requestForm.submitting}
                Wird eingereicht...
              {:else}
                Antrag einreichen
              {/if}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onclick={() => goto('/profile')}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      {/if}
    </Card>
  {/if}

  <!-- Info Section -->
  <Card variant="glass">
    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Über die Verifizierung
    </h3>
    
    <div class="space-y-4 text-white/70">
      <div>
        <h4 class="text-white font-medium mb-2">Was bringt die Verifizierung?</h4>
        <ul class="space-y-1 text-sm">
          <li>• Erhöhte Invite-Credits (bis zu 10 Credits)</li>
          <li>• Vertrauensvolle Kennzeichnung im Profil</li>
          <li>• Zugang zu exklusiven Features</li>
          <li>• Höhere Priorität bei Event-Zugängen</li>
        </ul>
      </div>
      
      <div>
        <h4 class="text-white font-medium mb-2">Bearbeitungszeit</h4>
        <p class="text-sm">
          Verifizierungsanträge werden in der Regel innerhalb von 3-7 Werktagen bearbeitet.
          Du erhältst eine E-Mail-Benachrichtigung über das Ergebnis.
        </p>
      </div>
      
      <div>
        <h4 class="text-white font-medium mb-2">Tipps für einen erfolgreichen Antrag</h4>
        <ul class="space-y-1 text-sm">
          <li>• Gib konkrete Beispiele für deine Szene-Verbindung an</li>
          <li>• Lade aussagekräftige Nachweise hoch (Event-Fotos, Tickets)</li>
          <li>• Sei ehrlich und authentisch in deiner Begründung</li>
          <li>• Stelle sicher, dass dein Profil vollständig ausgefüllt ist</li>
        </ul>
      </div>
    </div>
  </Card>
</div>
