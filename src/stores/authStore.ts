/**
 * Authentication State Store using Zustand
 * Manages user authentication, session management, and user profile data
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '@/types/api';
import { apiClient } from '@/lib/api-client';

/**
 * Authentication state interface
 */
export interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Session management
  sessionId: string | null;
  rememberMe: boolean;
  lastActivity: Date | null;
  
  // Authentication methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; user?: User; error?: string; needsOnboarding?: boolean }>;
  logout: () => void;
  
  // Profile management
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>;
  refreshUser: () => Promise<void>;
  
  // Session utilities
  checkSession: () => Promise<boolean>;
  extendSession: () => void;
  
  // OAuth methods
  initiateOAuth: (provider: 'google' | 'github') => void;
  handleOAuthCallback: (code: string, state: string, provider: 'google' | 'github') => Promise<{ success: boolean; user?: User; error?: string }>;
  
  // Utility methods
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

/**
 * Registration data interface
 */
export interface RegisterData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Default user state
 */
const defaultState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  sessionId: null,
  rememberMe: false,
  lastActivity: null
};

/**
 * Zustand store for authentication state
 * Uses persistence for session management and user preferences
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      // Authentication methods
      login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true });
        
        try {
          // Use the professional API client for authentication
          const response = await apiClient.login({ email, password });
          
          // Create complete user object with proper typing
          const authenticatedUser: User = {
            ...response.user,
            role: response.user.role || 'User' as UserRole
          };
          
          // Update store state
          set({
            user: authenticatedUser,
            isAuthenticated: true,
            sessionId: response.token,
            rememberMe,
            lastActivity: new Date(),
            isLoading: false
          });
          
          // Store token in appropriate storage based on remember me preference
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem('sessionId', response.token);
          
          return { success: true, user: authenticatedUser };
        } catch (error) {
          console.error('[AUTH STORE] Login failed:', error);
          set({ isLoading: false });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Login failed' 
          };
        }
      },
      
      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        
        try {
          // Register with the API client
          const response = await apiClient.register(userData);
          
          // Create complete user object with proper typing
          const newUser: User = {
            ...response.user,
            role: response.user.role || 'User' as UserRole
          };
          
          // Update store state - automatically log user in after registration
          set({
            user: newUser,
            isAuthenticated: true,
            sessionId: response.token,
            rememberMe: true, // Default to remember for new registrations
            lastActivity: new Date(),
            isLoading: false
          });
          
          // Store token in localStorage for session persistence
          localStorage.setItem('sessionId', response.token);
          
          // Mark that user needs onboarding
          localStorage.setItem('needsOnboarding', 'true');
          
          return { success: true, user: newUser, needsOnboarding: true };
        } catch (error) {
          console.error('[AUTH STORE] Registration failed:', error);
          set({ isLoading: false });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Registration failed' 
          };
        }
      },
      
      logout: () => {
        // Use the professional API client for logout
        apiClient.logout();
        
        // Clear all authentication data
        set(defaultState);
        
        // Clear stored tokens
        localStorage.removeItem('sessionId');
        sessionStorage.removeItem('sessionId');
        localStorage.removeItem('needsOnboarding');
      },
      
      // Profile management
      updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) {
          return { success: false, error: 'User not authenticated' };
        }
        
        set({ isLoading: true });
        
        try {
          // Update profile via API using the correct updateUser method
          const updatedUser = await apiClient.updateUser(currentUser.id, updates);
          
          // Update store state with the complete updated user object
          set({
            user: updatedUser,
            lastActivity: new Date(),
            isLoading: false
          });
          
          return { success: true, user: updatedUser };
        } catch (error) {
          console.error('[AUTH STORE] Profile update failed:', error);
          set({ isLoading: false });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Profile update failed' 
          };
        }
      },
      
      refreshUser: async () => {
        const sessionId = get().sessionId;
        if (!sessionId) return;
        
        try {
          const userProfile = await apiClient.getProfile();
          
          const refreshedUser: User = {
            ...userProfile,
            role: userProfile.role || 'User' as UserRole
          };
          
          set({
            user: refreshedUser,
            lastActivity: new Date()
          });
        } catch (error) {
          console.error('[AUTH STORE] Failed to refresh user:', error);
          // If refresh fails, logout user
          get().logout();
        }
      },
      
      // Session utilities
      checkSession: async () => {
        const sessionId = get().sessionId || 
          localStorage.getItem('sessionId') || 
          sessionStorage.getItem('sessionId');
        
        if (!sessionId) {
          set(defaultState);
          return false;
        }
        
        try {
          // Validate session with API
          const isValid = apiClient.isAuthenticated();
          
          if (isValid) {
            // Refresh user data if session is valid
            await get().refreshUser();
            return true;
          } else {
            // Clear invalid session
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('[AUTH STORE] Session check failed:', error);
          get().logout();
          return false;
        }
      },
      
      extendSession: () => {
        set({ lastActivity: new Date() });
      },
      
      // OAuth methods
      initiateOAuth: (provider: 'google' | 'github') => {
        // Generate CSRF state parameter
        const state = btoa(JSON.stringify({
          timestamp: Date.now(),
          provider,
          nonce: Math.random().toString(36).substring(2, 15)
        }));
        
        // Store state for validation
        sessionStorage.setItem('oauth_state', state);
        
        // Redirect to OAuth provider
        const clientId = provider === 'google' 
          ? import.meta.env.VITE_GOOGLE_CLIENT_ID
          : import.meta.env.VITE_GITHUB_CLIENT_ID;
        
        const redirectUri = `${window.location.origin}/auth/callback`;
        
        let authUrl: string;
        if (provider === 'google') {
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=openid email profile&` +
            `state=${encodeURIComponent(state)}`;
        } else {
          authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=user:email&` +
            `state=${encodeURIComponent(state)}`;
        }
        
        window.location.href = authUrl;
      },
      
      handleOAuthCallback: async (code: string, state: string, provider: 'google' | 'github') => {
        set({ isLoading: true });
        
        try {
          // Validate state parameter
          const storedState = sessionStorage.getItem('oauth_state');
          if (!storedState || storedState !== state) {
            throw new Error('Invalid OAuth state parameter');
          }
          
          // Exchange code for tokens via backend using API client
          const data = await apiClient.oauthCallback({ code, state, provider });
          
          // Create complete user object
          const oauthUser: User = {
            ...data.user,
            role: data.user.role || 'User' as UserRole
          };
          
          // Update store state
          set({
            user: oauthUser,
            isAuthenticated: true,
            sessionId: data.token,
            rememberMe: true, // OAuth users are remembered by default
            lastActivity: new Date(),
            isLoading: false
          });
          
          // Store token
          localStorage.setItem('sessionId', data.token);
          
          // Clear OAuth state
          sessionStorage.removeItem('oauth_state');
          
          return { success: true, user: oauthUser };
        } catch (error) {
          console.error('[AUTH STORE] OAuth callback failed:', error);
          set({ isLoading: false });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'OAuth authentication failed' 
          };
        }
      },
      
      // Utility methods
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          lastActivity: user ? new Date() : null
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      reset: () => {
        set(defaultState);
        localStorage.removeItem('sessionId');
        sessionStorage.removeItem('sessionId');
        localStorage.removeItem('needsOnboarding');
        sessionStorage.removeItem('oauth_state');
      }
    }),
    {
      name: 'edusphere-auth-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
      // Only persist essential authentication data
      partialize: (state) => ({
        user: state.user,
        sessionId: state.sessionId,
        rememberMe: state.rememberMe,
        lastActivity: state.lastActivity
      })
    }
  )
);

/**
 * Initialize authentication state on app startup
 * Automatically checks session validity and refreshes user data
 */
export const initializeAuth = async () => {
  const authStore = useAuthStore.getState();
  
  // Check if we have a stored session
  const storedSessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
  
  if (storedSessionId && !authStore.sessionId) {
    // Restore session from storage
    authStore.setLoading(true);
    
    try {
      // Set the session ID first
      useAuthStore.setState({ sessionId: storedSessionId });
      
      // Validate and refresh session
      const isValid = await authStore.checkSession();
      
      if (!isValid) {
        console.log('[AUTH STORE] Stored session is invalid, clearing...');
      }
    } catch (error) {
      console.error('[AUTH STORE] Failed to initialize auth:', error);
      authStore.logout();
    } finally {
      authStore.setLoading(false);
    }
  }
};
