<script lang="ts">
  import { Card, Button, Switch } from '$lib/ui'

  let realtimeEnabled = true
  let autoRefresh = true
  let refreshInterval = 5000
  let maxConnections = 100
  let enableNotifications = true

  function saveSettings() {
    console.log('Realtime settings saved:', {
      realtimeEnabled,
      autoRefresh,
      refreshInterval,
      maxConnections,
      enableNotifications
    })
  }
</script>

<Card class="p-6">
  <h2 class="text-2xl font-bold mb-6">Realzeit-Einstellungen</h2>

  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-semibold">Realzeit-Updates aktivieren</h3>
        <p class="text-sm text-gray-600">Aktiviert Live-Updates für das Dashboard</p>
      </div>
      <Switch bind:checked={realtimeEnabled} />
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-semibold">Auto-Refresh</h3>
        <p class="text-sm text-gray-600">Automatische Aktualisierung der Daten</p>
      </div>
      <Switch bind:checked={autoRefresh} />
    </div>

    <div>
      <label class="block font-semibold mb-2">Refresh-Intervall (ms)</label>
      <input
        type="number"
        bind:value={refreshInterval}
        min="1000"
        max="60000"
        class="w-full p-2 border rounded"
      />
    </div>

    <div>
      <label class="block font-semibold mb-2">Max. Verbindungen</label>
      <input
        type="number"
        bind:value={maxConnections}
        min="10"
        max="1000"
        class="w-full p-2 border rounded"
      />
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-semibold">Push-Benachrichtigungen</h3>
        <p class="text-sm text-gray-600">Aktiviert Realzeit-Benachrichtigungen</p>
      </div>
      <Switch bind:checked={enableNotifications} />
    </div>

    <Button on:click={saveSettings} class="w-full">
      Einstellungen speichern
    </Button>
  </div>
</Card>

