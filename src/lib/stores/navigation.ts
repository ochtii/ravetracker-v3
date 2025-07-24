import { writable } from 'svelte/store';

// Navigation store for mobile menu state and other navigation-related state
function createNavigationStore() {
	const { subscribe, set, update } = writable({
		isMobileMenuOpen: false,
		isSearchOpen: false,
		currentPage: '/'
	});

	return {
		subscribe,

		// Mobile menu controls
		toggleMobileMenu() {
			update(state => ({ ...state, isMobileMenuOpen: !state.isMobileMenuOpen }));
		},

		openMobileMenu() {
			update(state => ({ ...state, isMobileMenuOpen: true }));
		},

		closeMobileMenu() {
			update(state => ({ ...state, isMobileMenuOpen: false }));
		},

		// Search controls
		toggleSearch() {
			update(state => ({ ...state, isSearchOpen: !state.isSearchOpen }));
		},

		openSearch() {
			update(state => ({ ...state, isSearchOpen: true }));
		},

		closeSearch() {
			update(state => ({ ...state, isSearchOpen: false }));
		},

		// Page tracking
		setCurrentPage(page: string) {
			update(state => ({ ...state, currentPage: page }));
		},

		// Close all menus
		closeAll() {
			update(state => ({
				...state,
				isMobileMenuOpen: false,
				isSearchOpen: false
			}));
		}
	};
}

export const navigationStore = createNavigationStore();
