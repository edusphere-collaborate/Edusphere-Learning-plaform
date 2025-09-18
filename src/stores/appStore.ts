/**
 * Global Application State Store using Zustand
 * Manages application-wide state including theme, notifications, and global settings
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Application theme types
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in milliseconds
  persistent?: boolean; // Whether notification persists across sessions
}

/**
 * Application state interface
 */
export interface AppState {
  // Theme management
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Loading states
  isInitializing: boolean;
  setIsInitializing: (loading: boolean) => void;
  
  // Global loading overlay
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Notifications system
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Network status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  
  // Application settings
  settings: {
    enableAnimations: boolean;
    enableSounds: boolean;
    compactMode: boolean;
    autoSave: boolean;
    language: string;
  };
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // Performance monitoring
  performanceMetrics: {
    lastRenderTime: number;
    averageRenderTime: number;
    renderCount: number;
  };
  updatePerformanceMetrics: (renderTime: number) => void;
  
  // Reset function for cleanup
  reset: () => void;
}

/**
 * Default application settings
 */
const defaultSettings = {
  enableAnimations: true,
  enableSounds: true,
  compactMode: false,
  autoSave: true,
  language: 'en'
};

/**
 * Default performance metrics
 */
const defaultPerformanceMetrics = {
  lastRenderTime: 0,
  averageRenderTime: 0,
  renderCount: 0
};

/**
 * Zustand store for global application state
 * Uses persistence for theme and settings to maintain user preferences
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme management
      theme: 'system',
      setTheme: (theme: Theme) => {
        set({ theme });
        // Apply theme to document root for CSS variables
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
          } else {
            root.classList.toggle('dark', theme === 'dark');
          }
        }
      },
      
      // Loading states
      isInitializing: true,
      setIsInitializing: (loading: boolean) => set({ isInitializing: loading }),
      
      globalLoading: false,
      setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),
      
      // Notifications system
      notifications: [],
      addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification]
        }));
        
        // Auto-remove notification after duration (default 5 seconds)
        if (!notification.persistent) {
          const duration = notification.duration || 5000;
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, duration);
        }
      },
      
      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Network status
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      setIsOnline: (online: boolean) => set({ isOnline: online }),
      
      // Application settings
      settings: defaultSettings,
      updateSettings: (newSettings: Partial<AppState['settings']>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },
      
      // Performance monitoring
      performanceMetrics: defaultPerformanceMetrics,
      updatePerformanceMetrics: (renderTime: number) => {
        set((state) => {
          const newRenderCount = state.performanceMetrics.renderCount + 1;
          const newAverageRenderTime = 
            (state.performanceMetrics.averageRenderTime * state.performanceMetrics.renderCount + renderTime) / newRenderCount;
          
          return {
            performanceMetrics: {
              lastRenderTime: renderTime,
              averageRenderTime: newAverageRenderTime,
              renderCount: newRenderCount
            }
          };
        });
      },
      
      // Reset function
      reset: () => {
        set({
          theme: 'system',
          isInitializing: false,
          globalLoading: false,
          notifications: [],
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
          settings: defaultSettings,
          performanceMetrics: defaultPerformanceMetrics
        });
      }
    }),
    {
      name: 'edusphere-app-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
      // Only persist theme and settings, not temporary state
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings
      })
    }
  )
);

/**
 * Initialize network status listener
 * Automatically updates online status when network changes
 */
if (typeof window !== 'undefined') {
  const updateOnlineStatus = () => {
    useAppStore.getState().setIsOnline(navigator.onLine);
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

/**
 * Initialize system theme listener
 * Automatically updates theme when system preference changes
 */
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleThemeChange = () => {
    const { theme, setTheme } = useAppStore.getState();
    if (theme === 'system') {
      setTheme('system'); // Trigger theme application
    }
  };
  
  mediaQuery.addEventListener('change', handleThemeChange);
}
