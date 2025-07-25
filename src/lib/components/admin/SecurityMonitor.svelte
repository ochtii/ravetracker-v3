1<script lang="ts">
  import { Card, Button, Badge } from '$lib/ui'
  import { onMount } from 'svelte'

  interface SecurityEvent {
    id: string
    type: 'login_failed' | 'suspicious_activity' | 'brute_force' | 'account_locked' | 'privilege_escalation'
    severity: 'low' | 'medium' | 'high' | 'critical'
    user: string
    ip: string
    timestamp: Date
    description: string
    status: 'active' | 'resolved' | 'investigating'
  }

  let securityEvents: SecurityEvent[] = []
  let activeThreats = 0
  let resolvedToday = 0
  let criticalAlerts = 0

  onMount(() => {
    // TODO: Lade echte Sicherheitsdaten von der API
    securityEvents = [
      {
        id: '1',
        type: 'brute_force',
        severity: 'critical',
        user: 'unknown',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        description: 'Mehrere fehlgeschlagene Anmeldeversuche von derselben IP',
        status: 'active'
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'medium',
        user: 'test@example.com',
        ip: '10.0.0.50',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        description: 'Ungewöhnliche Aktivität außerhalb der üblichen Zeiten',
        status: 'investigating'
      },
      {
        id: '3',
        type: 'login_failed',
        severity: 'low',
        user: 'admin@example.com',
        ip: '172.16.0.1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        description: 'Fehlgeschlagener Anmeldeversuch',
        status: 'resolved'
      }
    ]

    activeThreats = securityEvents.filter(e => e.status === 'active').length
    resolvedToday = securityEvents.filter(e => e.status === 'resolved').length
    criticalAlerts = securityEvents.filter(e => e.severity === 'critical').length
  })

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function formatTime(date: Date) {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) return `vor ${minutes}min`
    if (hours < 24) return `vor ${hours}h`
    return date.toLocaleString('de-DE')
  }

  function resolveEvent(id: string) {
    securityEvents = securityEvents.map(e =>
      e.id === id ? { ...e, status: 'resolved' } : e
    )
    activeThreats = securityEvents.filter(e => e.status === 'active').length
    resolvedToday = securityEvents.filter(e => e.status === 'resolved').length
  }

  function investigateEvent(id: string) {
    securityEvents = securityEvents.map(e =>
      e.id === id ? { ...e, status: 'investigating' } : e
    )
  }
</script>

<div class="space-y-6">
  <!-- Übersichts-Karten -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Aktive Bedrohungen</p>
          <p class="text-2xl font-bold text-red-600">{activeThreats}</p>
        </div>
        <div class="text-3xl">🚨</div>
      </div>
    </Card>

    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Heute gelöst</p>
          <p class="text-2xl font-bold text-green-600">{resolvedToday}</p>
        </div>
        <div class="text-3xl">✅</div>
      </div>
    </Card>

    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600">Kritische Alarme</p>
          <p class="text-2xl font-bold text-orange-600">{criticalAlerts}</p>
        </div>
        <div class="text-3xl">⚠️</div>
      </div>
    </Card>
  </div>

  <!-- Sicherheitsereignisse -->
  <Card class="p-6">
    <h2 class="text-2xl font-bold mb-6">Sicherheitsereignisse</h2>

    <div class="space-y-4">
      {#each securityEvents as event (event.id)}
        <div class="border rounded-lg p-4 bg-white">
          <div class="flex justify-between items-start gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <Badge class={getSeverityColor(event.severity)}>
                  {event.severity.toUpperCase()}
                </Badge>
                <Badge class={getStatusColor(event.status)} variant="outline">
                  {event.status}
                </Badge>
                <span class="text-sm text-gray-500">{formatTime(event.timestamp)}</span>
              </div>

              <h3 class="font-semibold mb-1">
                {event.type.replace('_', ' ').toUpperCase()}
              </h3>
              <p class="text-gray-700 text-sm mb-2">{event.description}</p>

              <div class="text-xs text-gray-500">
                <span class="mr-4">Benutzer: {event.user}</span>
                <span>IP: {event.ip}</span>
              </div>
            </div>

            <div class="flex gap-2">
              {#if event.status === 'active'}
                <Button
                  variant="outline"
                  size="sm"
                  on:click={() => investigateEvent(event.id)}
                >
                  Untersuchen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="text-green-600"
                  on:click={() => resolveEvent(event.id)}
                >
                  Lösen
                </Button>
              {:else if event.status === 'investigating'}
                <Button
                  variant="outline"
                  size="sm"
                  class="text-green-600"
                  on:click={() => resolveEvent(event.id)}
                >
                  Lösen
                </Button>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🔒</div>
          <p>Keine Sicherheitsereignisse</p>
        </div>
      {/each}
    </div>
  </Card>
</div>

