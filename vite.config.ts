import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Development server configuration
	server: {
		port: 5173,
		host: true,
		cors: true,
		open: false,
		hmr: {
			port: 5174
		}
	},

	// Preview server configuration
	preview: {
		port: 4173,
		host: true,
		cors: true
	},

	// Build configuration
	build: {
		target: 'esnext',
		sourcemap: true,
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunk for better caching
					vendor: ['svelte', '@sveltejs/kit'],
					supabase: ['@supabase/supabase-js'],
					ui: ['lucide-svelte']
				}
			}
		}
	},

	// CSS configuration
	css: {
		postcss: './postcss.config.js'
	},

	// Define global constants
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version || 'dev')
	},

	// Environment variables
	envPrefix: ['VITE_', 'PUBLIC_'],

	// Vitest configuration
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['src/lib/test/setup.ts']
	},

	// Optimizations
	optimizeDeps: {
		include: [
			'@supabase/supabase-js',
			'lucide-svelte',
			'clsx',
			'tailwind-merge'
		]
	},

	// Resolve configuration
	resolve: {
		alias: {
			$components: './src/lib/components',
			$stores: './src/lib/stores',
			$utils: './src/lib/utils',
			$types: './src/lib/types',
			$schemas: './src/lib/schemas'
		}
	}
});