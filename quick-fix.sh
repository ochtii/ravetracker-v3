#!/bin/bash

# Quick Fix für svelte.config.js Problem
# Führe dieses Skript auf dem Server aus um das Problem sofort zu beheben

echo "🔧 Quick Fix: svelte.config.js Adapter Problem"

# Gehe zum App-Verzeichnis
cd /var/www/ravetracker-v3

# Entferne problematisches temp_build Verzeichnis
if [ -d "temp_build" ]; then
    echo "🗑️  Removing problematic temp_build directory..."
    rm -rf temp_build
    echo "✅ temp_build removed"
fi

# Falls current existiert, prüfe und fixe svelte.config.js
if [ -d "current" ]; then
    echo "🔍 Checking current svelte.config.js..."
    cd current
    
    # Backup der aktuellen config
    if [ -f "svelte.config.js" ]; then
        cp svelte.config.js svelte.config.js.backup
        
        # Erstelle korrekte svelte.config.js
        cat > svelte.config.js << 'EOF'
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		
		// Path aliases
		alias: {
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$utils: 'src/lib/utils',
			$types: 'src/lib/types',
			$schemas: 'src/lib/schemas'
		}
	}
};

export default config;
EOF
        
        echo "✅ svelte.config.js fixed"
    fi
    
    # Rebuild falls nötig
    if [ -f "package.json" ]; then
        echo "🏗️  Rebuilding application..."
        npm run build
        echo "✅ Build completed"
    fi
    
    # Restart PM2
    if command -v pm2 >/dev/null 2>&1; then
        echo "🔄 Restarting PM2..."
        pm2 restart ravetracker-v3 || pm2 start npm --name ravetracker-v3 -- start
        echo "✅ PM2 restarted"
    fi
fi

echo "🎉 Quick fix completed!"
echo "Your application should now work properly."
