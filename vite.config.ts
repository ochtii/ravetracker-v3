import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
		minify: 'esbuild'
	},

	// CSS configuration
	css: {
		postcss: './postcss.config.js'
	},

	// Environment variables
	envPrefix: ['VITE_', 'PUBLIC_'],

	// Optimizations
	optimizeDeps: {
		include: [
			'@supabase/supabase-js',
			'lucide-svelte',
			'clsx',
			'tailwind-merge'
		]
	}
});