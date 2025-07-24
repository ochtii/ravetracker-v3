import { writable } from 'svelte/store';

// User interface for our app
interface AppUser {
	id: string;
	email: string;
	user_metadata?: {
		full_name?: string;
		name?: string;
		role?: string;
		[key: string]: any;
	};
	app_metadata?: {
		[key: string]: any;
	};
	created_at?: string;
	aud?: string;
}

// User store interface
interface UserStoreInterface {
	user: AppUser | null;
	loading: boolean;
	error: string | null;
}

// Create the user store
function createUserStore() {
	const { subscribe, set, update } = writable<UserStoreInterface>({
		user: null,
		loading: true,
		error: null
	});

	return {
		subscribe,
		
		// Initialize the store
		async initialize() {
			try {
				update(state => ({ ...state, loading: true, error: null }));
				
				// TODO: Replace with actual Supabase auth check
				// For now, simulate loading
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Mock user for development
				const mockUser = null; // Set to null for unauthenticated state
				
				set({
					user: mockUser,
					loading: false,
					error: null
				});
			} catch (error) {
				set({
					user: null,
					loading: false,
					error: error instanceof Error ? error.message : 'Authentication failed'
				});
			}
		},

		// Login method
		async login(email: string, _password: string) {
			try {
				update(state => ({ ...state, loading: true, error: null }));
				
				// TODO: Replace with actual Supabase auth
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Mock successful login
				const mockUser: AppUser = {
					id: '1',
					email,
					user_metadata: {
						full_name: 'John Doe',
						role: 'user'
					},
					created_at: new Date().toISOString(),
					aud: 'authenticated'
				};
				
				set({
					user: mockUser,
					loading: false,
					error: null
				});
				
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Login failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Register method
		async register(email: string, _password: string, fullName: string) {
			try {
				update(state => ({ ...state, loading: true, error: null }));
				
				// TODO: Replace with actual Supabase auth
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Mock successful registration
				const mockUser: AppUser = {
					id: '1',
					email,
					user_metadata: {
						full_name: fullName,
						role: 'user'
					},
					created_at: new Date().toISOString(),
					aud: 'authenticated'
				};
				
				set({
					user: mockUser,
					loading: false,
					error: null
				});
				
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Registration failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Logout method
		async logout() {
			try {
				update(state => ({ ...state, loading: true, error: null }));
				
				// TODO: Replace with actual Supabase auth
				await new Promise(resolve => setTimeout(resolve, 500));
				
				set({
					user: null,
					loading: false,
					error: null
				});
				
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Logout failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Update user profile
		async updateProfile(updates: Record<string, any>) {
			try {
				update(state => ({ ...state, loading: true, error: null }));
				
				// TODO: Replace with actual Supabase update
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				update(state => ({
					...state,
					user: state.user ? {
						...state.user,
						user_metadata: {
							...state.user.user_metadata,
							...updates
						}
					} : null,
					loading: false,
					error: null
				}));
				
				return { success: true };
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
				update(state => ({ ...state, loading: false, error: errorMessage }));
				return { success: false, error: errorMessage };
			}
		},

		// Clear error
		clearError() {
			update(state => ({ ...state, error: null }));
		}
	};
}

export const userStore = createUserStore();

// Derived store for just the user
export const user = writable<AppUser | null>(null);
userStore.subscribe(state => user.set(state.user));
