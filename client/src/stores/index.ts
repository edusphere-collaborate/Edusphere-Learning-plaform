/**
 * Central export file for all Zustand stores
 * Provides clean imports for state management across the application
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

// Export all store hooks for easy importing
export { useAuthStore } from './authStore';
export { useRoomStore } from './roomStore';
export { useUIStore } from './uiStore';
export { useAppStore } from './appStore';

// Export store types for TypeScript support
export type { AuthState } from './authStore';
export type { RoomState } from './roomStore';
export type { UIState } from './uiStore';
export type { AppState } from './appStore';
