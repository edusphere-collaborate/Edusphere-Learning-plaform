/**
 * Store Initializer - Centralized initialization for all Zustand stores
 * Handles store setup, persistence hydration, and cross-store synchronization
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { useAppStore } from './appStore';
import { useAuthStore, initializeAuth } from './authStore';
import { useRoomStore } from './roomStore';
import { useUIStore } from './uiStore';

/**
 * Initialize all stores and handle cross-store dependencies
 * Should be called once during application startup
 */
export const initializeStores = async (): Promise<void> => {
  console.log('[STORE INITIALIZER] Starting store initialization...');
  
  try {
    // Set app as initializing
    useAppStore.getState().setIsInitializing(true);
    
    // Initialize authentication first (other stores may depend on user state)
    console.log('[STORE INITIALIZER] Initializing authentication...');
    await initializeAuth();
    
    // Initialize UI store breakpoint detection
    console.log('[STORE INITIALIZER] Initializing UI store...');
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      let breakpoint: 'mobile' | 'tablet' | 'desktop';
      
      if (width < 768) {
        breakpoint = 'mobile';
      } else if (width < 1024) {
        breakpoint = 'tablet';
      } else {
        breakpoint = 'desktop';
      }
      
      useUIStore.getState().setBreakpoint(breakpoint);
    }
    
    // Set up cross-store subscriptions for reactive updates
    setupCrossStoreSubscriptions();
    
    // Mark initialization as complete
    useAppStore.getState().setIsInitializing(false);
    
    console.log('[STORE INITIALIZER] Store initialization completed successfully');
  } catch (error) {
    console.error('[STORE INITIALIZER] Store initialization failed:', error);
    
    // Add error notification
    useAppStore.getState().addNotification({
      title: 'Initialization Error',
      message: 'Failed to initialize application state. Please refresh the page.',
      severity: 'error',
      persistent: true
    });
    
    // Mark initialization as complete even on error
    useAppStore.getState().setIsInitializing(false);
  }
};

/**
 * Set up cross-store subscriptions for reactive state management
 * Ensures stores stay synchronized when dependent state changes
 */
const setupCrossStoreSubscriptions = (): void => {
  console.log('[STORE INITIALIZER] Setting up cross-store subscriptions...');
  
  // Subscribe to auth state changes to update room store
  let previousUser = useAuthStore.getState().user;
  useAuthStore.subscribe((state) => {
    const currentUser = state.user;
    
    // Only react to user changes, not other state changes
    if (currentUser !== previousUser) {
      // Clear room data when user logs out
      if (!currentUser) {
        console.log('[STORE SYNC] User logged out, clearing room data');
        useRoomStore.getState().reset();
      } else {
        console.log('[STORE SYNC] User logged in, initializing room data');
        // Room data will be loaded by components as needed
      }
      
      // Update previous user reference
      previousUser = currentUser;
    }
  });
  
  // Subscribe to theme changes to update document class
  let previousTheme = useAppStore.getState().theme;
  useAppStore.subscribe((state) => {
    const currentTheme = state.theme;
    
    // Only react to theme changes, not other state changes
    if (currentTheme !== previousTheme) {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        if (currentTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', currentTheme === 'dark');
        }
      }
      
      // Update previous theme reference
      previousTheme = currentTheme;
    }
  });
  
  // Subscribe to online status changes
  if (typeof window !== 'undefined') {
    const updateOnlineStatus = () => {
      useAppStore.getState().setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }
  
  // Subscribe to window resize for responsive breakpoints
  if (typeof window !== 'undefined') {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let breakpoint: 'mobile' | 'tablet' | 'desktop';
      
      if (width < 768) {
        breakpoint = 'mobile';
      } else if (width < 1024) {
        breakpoint = 'tablet';
      } else {
        breakpoint = 'desktop';
      }
      
      useUIStore.getState().setBreakpoint(breakpoint);
    };
    
    window.addEventListener('resize', updateBreakpoint);
  }
  
  console.log('[STORE SYNC] Cross-store subscriptions established');
};

/**
 * Reset all stores to their initial state
 * Useful for logout or testing scenarios
 */
export const resetAllStores = (): void => {
  console.log('[STORE INITIALIZER] Resetting all stores...');
  
  useAppStore.getState().reset();
  useAuthStore.getState().reset();
  useRoomStore.getState().reset();
  useUIStore.getState().reset();
  
  console.log('[STORE INITIALIZER] All stores reset to initial state');
};

/**
 * Get current state snapshot from all stores
 * Useful for debugging and development
 */
export const getStoreSnapshot = () => {
  return {
    app: useAppStore.getState(),
    auth: useAuthStore.getState(),
    room: useRoomStore.getState(),
    ui: useUIStore.getState(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Development helper to log store states
 * Only available in development mode
 */
export const logStoreStates = (): void => {
  if (import.meta.env.DEV) {
    console.group('[STORE DEBUG] Current Store States');
    console.log('App Store:', useAppStore.getState());
    console.log('Auth Store:', useAuthStore.getState());
    console.log('Room Store:', useRoomStore.getState());
    console.log('UI Store:', useUIStore.getState());
    console.groupEnd();
  }
};
