<script lang="ts">
  import { Card } from '$lib/ui'
  import { onMount } from 'svelte'

  let totalInvites = 0
  let usedInvites = 0
  let activeInvites = 0
  let expiredInvites = 0

  onMount(async () => {
    // TODO: Lade echte Daten von der API
    totalInvites = 150
    usedInvites = 85
    activeInvites = 45
    expiredInvites = 20
  })

  $: usageRate = totalInvites > 0 ? Math.round((usedInvites / totalInvites) * 100) : 0
</script>

<Card class="p-6">
  <h2 class="text-2xl font-bold mb-6">Einladungsstatistiken</h2>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-blue-50 p-4 rounded-lg text-center">
      <div class="text-2xl font-bold text-blue-600">{totalInvites}</div>
      <div class="text-sm text-gray-600">Gesamt erstellt</div>
    </div>

    <div class="bg-green-50 p-4 rounded-lg text-center">
      <div class="text-2xl font-bold text-green-600">{usedInvites}</div>
      <div class="text-sm text-gray-600">Verwendet</div>
    </div>

    <div class="bg-yellow-50 p-4 rounded-lg text-center">
      <div class="text-2xl font-bold text-yellow-600">{activeInvites}</div>
      <div class="text-sm text-gray-600">Aktiv</div>
    </div>

    <div class="bg-red-50 p-4 rounded-lg text-center">
      <div class="text-2xl font-bold text-red-600">{expiredInvites}</div>
      <div class="text-sm text-gray-600">Abgelaufen</div>
    </div>
  </div>

  <div class="mt-6">
    <div class="flex justify-between text-sm text-gray-600 mb-2">
      <span>Nutzungsrate</span>
      <span>{usageRate}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style="width: {usageRate}%"
      ></div>
    </div>
  </div>
</Card>

