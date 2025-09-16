import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/api';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; user?: User; error?: string; needsOnboarding?: boolean }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session and fetch current user
    const initAuth = async () => {
      const token = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
      
      console.log('[AUTH] Initializing authentication, token found:', !!token);
      
      if (token) {
        try {
          // Check if token is valid before making API call
          const isValidToken = apiClient.isAuthenticated();
          console.log('[AUTH] Token validation result:', isValidToken);
          
          if (isValidToken) {
            console.log('[AUTH] Attempting to fetch user profile...');
            const userProfile = await apiClient.getProfile();
            
            // Use the complete user profile from API
            const localUser: User = {
              ...userProfile,
              role: userProfile.role || 'User'
            };
            
            setUser(localUser);
            console.log('[AUTH] User profile loaded successfully:', localUser.username);
          } else {
            console.warn('[AUTH] Token is invalid, clearing storage');
            localStorage.removeItem('sessionId');
            sessionStorage.removeItem('sessionId');
          }
        } catch (error) {
          console.error('[AUTH] Failed to fetch current user:', error);
          // Clear invalid token
          localStorage.removeItem('sessionId');
          sessionStorage.removeItem('sessionId');
        }
      } else {
        console.log('[AUTH] No token found, user not authenticated');
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);


  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    try {
      // Use the professional API client for real authentication
      // Backend expects email/password format, not identifier/password
      const response = await apiClient.login({ email, password });
      
      // Use the complete user data from API response
      const localUser: User = {
        ...response.user,
        role: response.user.role || 'User'
      };
      
      // Store user data and token
      setUser(localUser);
      
      // Store token based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('sessionId', response.token);
      
      setIsLoading(false);
      return { success: true, user: localUser };
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      // Register with basic info only (what backend expects)
      const registrationData = {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
      };
      
      const response = await apiClient.register(registrationData);
      
      // Use the complete user data from API response
      const localUser: User = {
        ...response.user,
        role: response.user.role || 'User'
      };
      
      // Store user data and token - automatically log user in after registration
      setUser(localUser);
      
      // Store token in localStorage for session persistence (same as login)
      localStorage.setItem('sessionId', response.token);
      
      // Set the API client as authenticated by calling a dummy authenticated endpoint
      // This ensures the token is properly set in the API client
      try {
        // The registration response already includes the token, so API client should be ready
        console.log('[AUTH] User automatically logged in after registration');
      } catch (error) {
        console.warn('[AUTH] Could not verify API client authentication after registration:', error);
      }
      
      // Mark that user needs onboarding
      localStorage.setItem('needsOnboarding', 'true');
      
      setIsLoading(false);
      return { success: true, user: localUser, needsOnboarding: true };
    } catch (error) {
      console.error('Registration failed:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  const logout = () => {
    // Use the professional API client for logout
    apiClient.logout();
    
    // Clear local state
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values instead of throwing error to prevent crashes
    console.warn('useAuth called outside of AuthProvider, returning default values');
    return {
      user: null,
      login: async () => ({ success: false, error: 'Auth not available' }),
      register: async () => ({ success: false, error: 'Auth not available' }),
      logout: () => {},
      isLoading: false,
      isAuthenticated: false
    };
  }
  return context;
}

// Custom hook for getting API client instance
// Using React.useMemo to make it compatible with Fast Refresh
export const useApiClient = () => {
  return React.useMemo(() => apiClient, []);
};

// Custom hook for authenticated requests (backward compatibility)
// Using React.useCallback to make it compatible with Fast Refresh
export const useAuthenticatedFetch = () => {
  const { isAuthenticated } = useAuth();
  
  return React.useCallback((url: string, options: RequestInit = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    
    // Get authentication token
    const token = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
    
    // Return standard fetch with authentication headers
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...(options.headers as Record<string, string> || {}),
      },
    });
  }, [isAuthenticated]);
};
