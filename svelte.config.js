import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-node for production deployment
		adapter: adapter({
			// Options for the Node.js adapter
			out: 'build',
			precompress: true,
			polyfill: true,
			envPrefix: ''
		}),

		// App configuration
		appDir: 'app',
		
		// Asset paths
		paths: {
			base: '',
			assets: ''
		},

		// Environment variables
		env: {
			publicPrefix: 'PUBLIC_',
			privatePrefix: 'PRIVATE_'
		},

		// Version management
		version: {
			name: process.env.npm_package_version || 'development'
		},

		// CSP for security
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self', 'unsafe-inline'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self'],
				'connect-src': ['self', 'https://*.supabase.co', 'wss://*.supabase.co'],
				'frame-src': ['self']
			}
		},

		// Service Worker
		serviceWorker: {
			register: true
		},

		// Embedded configuration  
		embedded: false
	}
};

export default config;
