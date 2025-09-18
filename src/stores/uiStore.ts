/**
 * UI State Store using Zustand
 * Manages UI-specific state including modals, sidebars, overlays, and component states
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Modal types for type-safe modal management
 */
export type ModalType = 
  | 'createRoom'
  | 'joinRoom'
  | 'userProfile'
  | 'roomSettings'
  | 'confirmDelete'
  | 'imagePreview'
  | 'pdfViewer'
  | 'emojiPicker'
  | 'messageSearch'
  | 'roomInfo'
  | 'aiAssistant'
  | 'settings'
  | 'help'
  | null;

/**
 * Sidebar types for layout management
 */
export type SidebarType = 'rooms' | 'participants' | 'files' | 'ai' | null;

/**
 * Toast notification interface
 */
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modal data interface for passing data to modals
 */
export interface ModalData {
  [key: string]: any;
}

/**
 * UI state interface
 */
export interface UIState {
  // Modal management
  activeModal: ModalType;
  modalData: ModalData | null;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  
  // Sidebar management
  leftSidebar: {
    isOpen: boolean;
    type: SidebarType;
    isPinned: boolean;
  };
  rightSidebar: {
    isOpen: boolean;
    type: SidebarType;
    isPinned: boolean;
  };
  toggleLeftSidebar: (type?: SidebarType) => void;
  toggleRightSidebar: (type?: SidebarType) => void;
  pinLeftSidebar: (pinned: boolean) => void;
  pinRightSidebar: (pinned: boolean) => void;
  
  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Loading states
  loadingStates: { [key: string]: boolean };
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Form states
  formErrors: { [formId: string]: { [field: string]: string } };
  setFormError: (formId: string, field: string, error: string) => void;
  clearFormErrors: (formId: string) => void;
  getFormErrors: (formId: string) => { [field: string]: string };
  
  // Component visibility
  componentVisibility: { [componentId: string]: boolean };
  setComponentVisible: (componentId: string, visible: boolean) => void;
  isComponentVisible: (componentId: string) => boolean;
  
  // Search states
  searchStates: { [searchId: string]: { query: string; results: any[]; isSearching: boolean } };
  setSearchQuery: (searchId: string, query: string) => void;
  setSearchResults: (searchId: string, results: any[]) => void;
  setSearching: (searchId: string, searching: boolean) => void;
  clearSearch: (searchId: string) => void;
  
  // Drag and drop states
  dragState: {
    isDragging: boolean;
    dragType: string | null;
    dragData: any;
  };
  setDragState: (isDragging: boolean, dragType?: string, dragData?: any) => void;
  
  // Responsive breakpoints
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  setBreakpoint: (breakpoint: UIState['breakpoint']) => void;
  
  // Focus management
  focusedElement: string | null;
  setFocusedElement: (elementId: string | null) => void;
  
  // Keyboard shortcuts
  keyboardShortcutsEnabled: boolean;
  toggleKeyboardShortcuts: () => void;
  
  // Accessibility
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
  updateAccessibility: (updates: Partial<UIState['accessibility']>) => void;
  
  // Performance monitoring
  renderMetrics: {
    componentRenderTimes: { [componentName: string]: number[] };
    lastRenderTime: number;
  };
  recordRenderTime: (componentName: string, renderTime: number) => void;
  
  // Reset function
  reset: () => void;
}

/**
 * Default UI state
 */
const defaultState = {
  activeModal: null as ModalType,
  modalData: null,
  leftSidebar: {
    isOpen: false,
    type: null as SidebarType,
    isPinned: false
  },
  rightSidebar: {
    isOpen: false,
    type: null as SidebarType,
    isPinned: false
  },
  toasts: [],
  loadingStates: {},
  formErrors: {},
  componentVisibility: {},
  searchStates: {},
  dragState: {
    isDragging: false,
    dragType: null,
    dragData: null
  },
  breakpoint: 'desktop' as const,
  focusedElement: null,
  keyboardShortcutsEnabled: true,
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false
  },
  renderMetrics: {
    componentRenderTimes: {},
    lastRenderTime: 0
  }
};

/**
 * Zustand store for UI state management
 * Uses persistence for user preferences like sidebar settings and accessibility
 */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      
      // Modal management
      openModal: (type: ModalType, data?: ModalData) => {
        set({ activeModal: type, modalData: data || null });
      },
      
      closeModal: () => {
        set({ activeModal: null, modalData: null });
      },
      
      // Sidebar management
      toggleLeftSidebar: (type?: SidebarType) => {
        set((state) => {
          const currentType = state.leftSidebar.type;
          const isCurrentlyOpen = state.leftSidebar.isOpen;
          
          // If same type is clicked, toggle open/close
          if (type === currentType) {
            return {
              leftSidebar: {
                ...state.leftSidebar,
                isOpen: !isCurrentlyOpen
              }
            };
          }
          
          // If different type or no type specified, open with new type
          return {
            leftSidebar: {
              ...state.leftSidebar,
              isOpen: true,
              type: type || currentType
            }
          };
        });
      },
      
      toggleRightSidebar: (type?: SidebarType) => {
        set((state) => {
          const currentType = state.rightSidebar.type;
          const isCurrentlyOpen = state.rightSidebar.isOpen;
          
          // If same type is clicked, toggle open/close
          if (type === currentType) {
            return {
              rightSidebar: {
                ...state.rightSidebar,
                isOpen: !isCurrentlyOpen
              }
            };
          }
          
          // If different type or no type specified, open with new type
          return {
            rightSidebar: {
              ...state.rightSidebar,
              isOpen: true,
              type: type || currentType
            }
          };
        });
      },
      
      pinLeftSidebar: (pinned: boolean) => {
        set((state) => ({
          leftSidebar: {
            ...state.leftSidebar,
            isPinned: pinned
          }
        }));
      },
      
      pinRightSidebar: (pinned: boolean) => {
        set((state) => ({
          rightSidebar: {
            ...state.rightSidebar,
            isPinned: pinned
          }
        }));
      },
      
      // Toast notifications
      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { ...toast, id };
        
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }));
        
        // Auto-remove toast after duration (default 5 seconds)
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      
      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }));
      },
      
      clearToasts: () => set({ toasts: [] }),
      
      // Loading states
      setLoading: (key: string, loading: boolean) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }));
      },
      
      isLoading: (key: string) => {
        return get().loadingStates[key] || false;
      },
      
      // Form states
      setFormError: (formId: string, field: string, error: string) => {
        set((state) => ({
          formErrors: {
            ...state.formErrors,
            [formId]: {
              ...state.formErrors[formId],
              [field]: error
            }
          }
        }));
      },
      
      clearFormErrors: (formId: string) => {
        set((state) => {
          const newFormErrors = { ...state.formErrors };
          delete newFormErrors[formId];
          return { formErrors: newFormErrors };
        });
      },
      
      getFormErrors: (formId: string) => {
        return get().formErrors[formId] || {};
      },
      
      // Component visibility
      setComponentVisible: (componentId: string, visible: boolean) => {
        set((state) => ({
          componentVisibility: {
            ...state.componentVisibility,
            [componentId]: visible
          }
        }));
      },
      
      isComponentVisible: (componentId: string) => {
        return get().componentVisibility[componentId] ?? true; // Default to visible
      },
      
      // Search states
      setSearchQuery: (searchId: string, query: string) => {
        set((state) => ({
          searchStates: {
            ...state.searchStates,
            [searchId]: {
              ...state.searchStates[searchId],
              query,
              results: state.searchStates[searchId]?.results || [],
              isSearching: state.searchStates[searchId]?.isSearching || false
            }
          }
        }));
      },
      
      setSearchResults: (searchId: string, results: any[]) => {
        set((state) => ({
          searchStates: {
            ...state.searchStates,
            [searchId]: {
              ...state.searchStates[searchId],
              results,
              query: state.searchStates[searchId]?.query || '',
              isSearching: false
            }
          }
        }));
      },
      
      setSearching: (searchId: string, searching: boolean) => {
        set((state) => ({
          searchStates: {
            ...state.searchStates,
            [searchId]: {
              ...state.searchStates[searchId],
              isSearching: searching,
              query: state.searchStates[searchId]?.query || '',
              results: state.searchStates[searchId]?.results || []
            }
          }
        }));
      },
      
      clearSearch: (searchId: string) => {
        set((state) => {
          const newSearchStates = { ...state.searchStates };
          delete newSearchStates[searchId];
          return { searchStates: newSearchStates };
        });
      },
      
      // Drag and drop states
      setDragState: (isDragging: boolean, dragType?: string, dragData?: any) => {
        set({
          dragState: {
            isDragging,
            dragType: dragType || null,
            dragData: dragData || null
          }
        });
      },
      
      // Responsive breakpoints
      setBreakpoint: (breakpoint: UIState['breakpoint']) => {
        set({ breakpoint });
      },
      
      // Focus management
      setFocusedElement: (elementId: string | null) => {
        set({ focusedElement: elementId });
      },
      
      // Keyboard shortcuts
      toggleKeyboardShortcuts: () => {
        set((state) => ({
          keyboardShortcutsEnabled: !state.keyboardShortcutsEnabled
        }));
      },
      
      // Accessibility
      updateAccessibility: (updates: Partial<UIState['accessibility']>) => {
        set((state) => ({
          accessibility: {
            ...state.accessibility,
            ...updates
          }
        }));
      },
      
      // Performance monitoring
      recordRenderTime: (componentName: string, renderTime: number) => {
        set((state) => {
          const existingTimes = state.renderMetrics.componentRenderTimes[componentName] || [];
          const updatedTimes = [...existingTimes, renderTime].slice(-10); // Keep last 10 render times
          
          return {
            renderMetrics: {
              componentRenderTimes: {
                ...state.renderMetrics.componentRenderTimes,
                [componentName]: updatedTimes
              },
              lastRenderTime: renderTime
            }
          };
        });
      },
      
      // Reset function
      reset: () => {
        set(defaultState);
      }
    }),
    {
      name: 'edusphere-ui-storage', // Storage key
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not temporary UI state
      partialize: (state) => ({
        leftSidebar: {
          isPinned: state.leftSidebar.isPinned,
          type: state.leftSidebar.type
        },
        rightSidebar: {
          isPinned: state.rightSidebar.isPinned,
          type: state.rightSidebar.type
        },
        keyboardShortcutsEnabled: state.keyboardShortcutsEnabled,
        accessibility: state.accessibility
      })
    }
  )
);

/**
 * Initialize responsive breakpoint detection
 * Automatically updates breakpoint based on window size
 */
if (typeof window !== 'undefined') {
  const updateBreakpoint = () => {
    const width = window.innerWidth;
    let breakpoint: UIState['breakpoint'];
    
    if (width < 768) {
      breakpoint = 'mobile';
    } else if (width < 1024) {
      breakpoint = 'tablet';
    } else {
      breakpoint = 'desktop';
    }
    
    useUIStore.getState().setBreakpoint(breakpoint);
  };
  
  // Initial breakpoint detection
  updateBreakpoint();
  
  // Listen for window resize
  window.addEventListener('resize', updateBreakpoint);
}

/**
 * Initialize accessibility detection
 * Automatically detects user accessibility preferences
 */
if (typeof window !== 'undefined') {
  const detectAccessibilityPreferences = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    useUIStore.getState().updateAccessibility({
      reducedMotion,
      highContrast
    });
  };
  
  // Initial detection
  detectAccessibilityPreferences();
  
  // Listen for preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', detectAccessibilityPreferences);
  window.matchMedia('(prefers-contrast: high)').addEventListener('change', detectAccessibilityPreferences);
}

/**
 * Utility hooks for common UI patterns
 */

// Hook for modal management
export const useModal = (type: ModalType) => {
  const { activeModal, modalData, openModal, closeModal } = useUIStore();
  
  return {
    isOpen: activeModal === type,
    data: activeModal === type ? modalData : null,
    open: (data?: ModalData) => openModal(type, data),
    close: closeModal
  };
};

// Hook for toast notifications
export const useToast = () => {
  const { addToast } = useUIStore();
  
  return {
    toast: addToast,
    success: (title: string, description?: string) => addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => addToast({ type: 'error', title, description }),
    warning: (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) => addToast({ type: 'info', title, description })
  };
};
