<script lang="ts">
  import { Card, Button, Badge } from '$lib/ui'
  import { onMount } from 'svelte'

  interface Notification {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }

  let notifications: Notification[] = []

  onMount(() => {
    // TODO: Lade echte Benachrichtigungen von der API
    notifications = [
      {
        id: '1',
        type: 'warning',
        title: 'Hohe Serverlast',
        message: 'CPU-Auslastung liegt bei 85%',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Neuer Benutzer registriert',
        message: '5 neue Registrierungen in den letzten 24h',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      },
      {
        id: '3',
        type: 'error',
        title: 'Datenbankfehler',
        message: 'Verbindungsfehler zur Hauptdatenbank',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false
      }
    ]
  })

  function markAsRead(id: string) {
    notifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
  }

  function markAllAsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }))
  }

  function deleteNotification(id: string) {
    notifications = notifications.filter(n => n.id !== id)
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  function formatTime(date: Date) {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 60) return `vor ${minutes}min`
    if (hours < 24) return `vor ${hours}h`
    return date.toLocaleDateString('de-DE')
  }

  $: unreadCount = notifications.filter(n => !n.read).length
</script>

<Card class="p-6">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold">System-Benachrichtigungen</h2>
    <div class="flex gap-2">
      {#if unreadCount > 0}
        <Badge variant="destructive">{unreadCount} ungelesen</Badge>
      {/if}
      <Button variant="outline" size="sm" on:click={markAllAsRead}>
        Alle als gelesen markieren
      </Button>
    </div>
  </div>

  <div class="space-y-4">
    {#each notifications as notification (notification.id)}
      <div class="border rounded-lg p-4 {notification.read ? 'bg-gray-50' : 'bg-white'} transition-colors">
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <Badge class={getTypeColor(notification.type)} variant="outline">
                {notification.type.toUpperCase()}
              </Badge>
              <span class="text-sm text-gray-500">{formatTime(notification.timestamp)}</span>
              {#if !notification.read}
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              {/if}
            </div>
            <h3 class="font-semibold mb-1">{notification.title}</h3>
            <p class="text-gray-700 text-sm">{notification.message}</p>
          </div>
          <div class="flex gap-1">
            {#if !notification.read}
              <Button
                variant="ghost"
                size="sm"
                on:click={() => markAsRead(notification.id)}
              >
                Als gelesen markieren
              </Button>
            {/if}
            <Button
              variant="ghost"
              size="sm"
              class="text-red-600 hover:text-red-700"
              on:click={() => deleteNotification(notification.id)}
            >
              Löschen
            </Button>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500">
        <div class="text-4xl mb-2">🔔</div>
        <p>Keine Benachrichtigungen vorhanden</p>
      </div>
    {/each}
  </div>
</Card>

