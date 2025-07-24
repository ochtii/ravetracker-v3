/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			// Rave/Techno Color Palette
			colors: {
				// Primary Brand Colors
				primary: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9', // Electric Blue
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e',
					950: '#082f49'
				},
				// Neon Accent Colors
				neon: {
					pink: '#ff0080',      // Neon Pink
					purple: '#8b5cf6',    // Electric Purple
					cyan: '#00ffff',      // Neon Cyan
					green: '#00ff41',     // Matrix Green
					yellow: '#ffff00',    // Electric Yellow
					orange: '#ff4500'     // Neon Orange
				},
				// Dark Theme Colors
				dark: {
					50: '#1a1a1a',
					100: '#2d2d2d',
					200: '#404040',
					300: '#525252',
					400: '#666666',
					500: '#7a7a7a',
					600: '#8d8d8d',
					700: '#a1a1a1',
					800: '#b4b4b4',
					900: '#c7c7c7'
				},
				// Glassmorphism Background
				glass: {
					light: 'rgba(255, 255, 255, 0.1)',
					medium: 'rgba(255, 255, 255, 0.2)',
					dark: 'rgba(0, 0, 0, 0.1)',
					darker: 'rgba(0, 0, 0, 0.2)'
				}
			},

			// Typography
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
				display: ['Orbitron', 'Inter', 'sans-serif'] // Futuristic display font
			},

			// Spacing & Sizing
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
				'144': '36rem'
			},

			// Border Radius
			borderRadius: {
				'4xl': '2rem',
				'5xl': '2.5rem'
			},

			// Box Shadows for Glassmorphism
			boxShadow: {
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)',
				'neon': '0 0 20px rgba(56, 189, 248, 0.5)',
				'neon-pink': '0 0 20px rgba(255, 0, 128, 0.5)',
				'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)'
			},

			// Backdrop Blur
			backdropBlur: {
				'xs': '2px',
				'4xl': '72px'
			},

			// Gradients
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
				'neon-gradient': 'linear-gradient(45deg, #0ea5e9, #8b5cf6, #ff0080)',
				'dark-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)'
			},

			// Animations
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'bounce-slow': 'bounce 2s infinite',
				'spin-slow': 'spin 3s linear infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'float': 'float 6s ease-in-out infinite',
				'slide-up': 'slideUp 0.3s ease-out',
				'slide-down': 'slideDown 0.3s ease-out',
				'fade-in': 'fadeIn 0.5s ease-out',
				'scale-in': 'scaleIn 0.2s ease-out'
			},

			// Keyframes
			keyframes: {
				glow: {
					'0%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)' },
					'100%': { boxShadow: '0 0 30px rgba(56, 189, 248, 0.8), 0 0 40px rgba(139, 92, 246, 0.3)' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0px)', opacity: '1' }
				},
				slideDown: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0px)', opacity: '1' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				scaleIn: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},

			// Screen Sizes
			screens: {
				'xs': '475px',
				'3xl': '1600px'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		// Custom plugin for glassmorphism utilities
		function({ addUtilities }) {
			const newUtilities = {
				'.glass': {
					background: 'rgba(255, 255, 255, 0.1)',
					backdropFilter: 'blur(10px)',
					border: '1px solid rgba(255, 255, 255, 0.2)',
					boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
				},
				'.glass-dark': {
					background: 'rgba(0, 0, 0, 0.1)',
					backdropFilter: 'blur(10px)',
					border: '1px solid rgba(255, 255, 255, 0.1)',
					boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
				},
				'.glass-card': {
					background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
					backdropFilter: 'blur(20px)',
					border: '1px solid rgba(255, 255, 255, 0.2)',
					borderRadius: '1rem',
					boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
				},
				'.neon-border': {
					border: '1px solid rgba(56, 189, 248, 0.5)',
					boxShadow: '0 0 20px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(56, 189, 248, 0.1)'
				},
				'.text-neon': {
					color: '#0ea5e9',
					textShadow: '0 0 10px rgba(14, 165, 233, 0.5)'
				},
				'.bg-rave': {
					background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 50%, #1a1a1a 100%)'
				}
			}
			addUtilities(newUtilities)
		}
	]
};
