<script lang="ts">
  import { Button, Card, Input, Modal, Navigation } from '$lib/ui'
  import type { NavigationItem } from '$lib/ui'
  
  let showModal = false
  let inputValue = ''
  let inputError = ''

  const navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: 'fas fa-home',
      active: true
    },
    {
      label: 'Events',
      href: '/events',
      icon: 'fas fa-calendar',
      children: [
        { label: 'All Events', href: '/events' },
        { label: 'My Events', href: '/events/my' },
        { label: 'Create Event', href: '/events/create' }
      ]
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: 'fas fa-user'
    },
    {
      label: 'Settings',
      icon: 'fas fa-cog',
      onclick: () => console.log('Settings clicked')
    }
  ]

  function validateInput() {
    if (!inputValue.trim()) {
      inputError = 'This field is required'
    } else if (inputValue.length < 3) {
      inputError = 'Must be at least 3 characters'
    } else {
      inputError = ''
    }
  }
</script>

<svelte:head>
  <title>RaveTracker v3.0 - UI Components Demo</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <!-- Navigation Demo -->
  <Navigation items={navigationItems} class="mb-8" />

  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-white mb-4">
        RaveTracker v3.0 UI Components
      </h1>
      <p class="text-xl text-white/80">
        Demo der Frontend Foundation mit Glassmorphism Design System
      </p>
    </div>

    <!-- Card Demos -->
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      <Card variant="glass" class="text-white">
        <h3 class="text-lg font-semibold mb-3">Glass Card</h3>
        <p class="text-white/80 mb-4">
          Eine Karte mit Glassmorphism-Effekt und transparentem Hintergrund.
        </p>
        <Button variant="glass" size="sm">
          <i class="fas fa-sparkles mr-2"></i>
          Glass Button
        </Button>
      </Card>

      <Card variant="solid" class="text-gray-900 dark:text-white">
        <h3 class="text-lg font-semibold mb-3">Solid Card</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Eine klassische Karte mit solidem Hintergrund für bessere Lesbarkeit.
        </p>
        <Button variant="primary" size="sm">
          <i class="fas fa-check mr-2"></i>
          Primary Button
        </Button>
      </Card>

      <Card variant="bordered" class="text-white">
        <h3 class="text-lg font-semibold mb-3">Bordered Card</h3>
        <p class="text-white/80 mb-4">
          Eine transparente Karte mit nur einem Border-Rahmen.
        </p>
        <Button variant="secondary" size="sm">
          <i class="fas fa-star mr-2"></i>
          Secondary Button
        </Button>
      </Card>
    </div>

    <!-- Button Demos -->
    <Card variant="glass" class="mb-12">
      <h2 class="text-2xl font-semibold text-white mb-6">Button Variants</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Button variant="primary">
          <i class="fas fa-rocket mr-2"></i>
          Primary
        </Button>
        
        <Button variant="secondary">
          <i class="fas fa-heart mr-2"></i>
          Secondary
        </Button>
        
        <Button variant="ghost">
          <i class="fas fa-ghost mr-2"></i>
          Ghost
        </Button>
        
        <Button variant="danger">
          <i class="fas fa-trash mr-2"></i>
          Danger
        </Button>
        
        <Button variant="glass">
          <i class="fas fa-diamond mr-2"></i>
          Glass
        </Button>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-6">
        <Button variant="primary" size="sm">Small</Button>
        <Button variant="primary" size="md">Medium</Button>
        <Button variant="primary" size="lg">Large</Button>
      </div>

      <div class="flex gap-4 flex-wrap">
        <Button variant="primary" disabled>
          <i class="fas fa-ban mr-2"></i>
          Disabled
        </Button>
        
        <Button variant="primary" loading>
          Loading
        </Button>
        
        <Button variant="primary" href="/events">
          <i class="fas fa-external-link-alt mr-2"></i>
          Link Button
        </Button>
      </div>
    </Card>

    <!-- Input Demos -->
    <Card variant="glass" class="mb-12">
      <h2 class="text-2xl font-semibold text-white mb-6">Input Components</h2>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Input 
            label="Default Input"
            placeholder="Enter text..."
            hint="This is a helpful hint"
          />
          
          <Input 
            label="Email Input"
            type="email"
            placeholder="user@example.com"
            required
          />
          
          <Input 
            label="Password Input"
            type="password"
            placeholder="Enter password..."
            required
          />
        </div>
        
        <div class="space-y-4">
          <Input 
            label="Input with Error"
            bind:value={inputValue}
            error={inputError}
            placeholder="Test validation..."
            on:input={validateInput}
            required
          />
          
          <Input 
            label="Disabled Input"
            value="Cannot edit this"
            disabled
          />
          
          <Input 
            label="Readonly Input"
            value="Read-only value"
            readonly
          />
        </div>
      </div>
    </Card>

    <!-- Modal Demo -->
    <Card variant="glass" class="mb-12">
      <h2 class="text-2xl font-semibold text-white mb-6">Modal Component</h2>
      
      <div class="flex gap-4 flex-wrap">
        <Button variant="primary" onclick={() => showModal = true}>
          <i class="fas fa-window-maximize mr-2"></i>
          Open Modal
        </Button>
      </div>
    </Card>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card variant="glass" class="text-center">
        <div class="text-4xl mb-4">
          <i class="fas fa-palette text-purple-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Glassmorphism</h3>
        <p class="text-white/70 text-sm">
          Moderne UI mit transparenten Glaseffekten
        </p>
      </Card>

      <Card variant="glass" class="text-center">
        <div class="text-4xl mb-4">
          <i class="fas fa-mobile-alt text-blue-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Responsive</h3>
        <p class="text-white/70 text-sm">
          Optimiert für alle Bildschirmgrößen
        </p>
      </Card>

      <Card variant="glass" class="text-center">
        <div class="text-4xl mb-4">
          <i class="fas fa-code text-green-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">TypeScript</h3>
        <p class="text-white/70 text-sm">
          Vollständig typisierte Components
        </p>
      </Card>

      <Card variant="glass" class="text-center">
        <div class="text-4xl mb-4">
          <i class="fas fa-rocket text-orange-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Performance</h3>
        <p class="text-white/70 text-sm">
          Optimiert für beste Performance
        </p>
      </Card>
    </div>
  </div>
</div>

<!-- Modal -->
<Modal 
  bind:open={showModal}
  title="Example Modal"
  size="md"
>
  <div class="space-y-4">
    <p class="text-white/90">
      Dies ist ein Beispiel für eine Modal-Komponente mit Glassmorphism-Design.
      Sie unterstützt verschiedene Größen, Backdrop-Effekte und ist vollständig barrierefrei.
    </p>
    
    <Input 
      label="Name"
      placeholder="Enter your name..."
      variant="default"
    />
    
    <Input 
      label="Email"
      type="email"
      placeholder="Enter your email..."
      variant="default"
    />
  </div>
  
  <svelte:fragment slot="footer">
    <Button variant="ghost" onclick={() => showModal = false}>
      Cancel
    </Button>
    <Button variant="primary" onclick={() => showModal = false}>
      <i class="fas fa-save mr-2"></i>
      Save
    </Button>
  </svelte:fragment>
</Modal>
