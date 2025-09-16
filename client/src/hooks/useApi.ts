/**
 * EduSphere API React Hooks
 * Custom hooks for seamless API integration with React components
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready React hooks with comprehensive state management,
 *              error handling, loading states, and optimistic updates
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import {
  // API client and error types
  apiClient,
  ApiClientError as APIError,
  ApiValidationError as ValidationError,
  ApiAuthenticationError as AuthenticationError,
} from '@/lib/api-client';
import type {
  // Type definitions from types/api.ts
  User,
  Room,
  DetailedRoom,
  Message,
  Media,
  AIQueryResponse,
  RegisterUserRequest,
  LoginRequest,
  CreateRoomRequest,
  UpdateRoomRequest,
  SendMessageRequest,
  UploadMediaRequest,
  AIQueryRequest,
  PaginationParams,
} from '@/types/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query key factory for consistent cache management
 */
export const queryKeys = {
  // Authentication
  profile: ['profile'] as const,
  profileById: (id: string) => ['profile', id] as const,
  
  // Users
  users: (params?: PaginationParams) => ['users', params] as const,
  user: (id: string) => ['user', id] as const,
  publicProfile: (id: string) => ['publicProfile', id] as const,
  
  // Rooms
  rooms: ['rooms'] as const,
  room: (id: string) => ['room', id] as const,
  roomMessages: (id: string, params?: PaginationParams) => ['roomMessages', id, params] as const,
  
  // Media
  media: (params?: PaginationParams) => ['media', params] as const,
  mediaById: (id: string) => ['media', id] as const,
  roomMedia: (roomId: string, params?: PaginationParams) => ['roomMedia', roomId, params] as const,
  userMedia: (userId: string, params?: PaginationParams) => ['userMedia', userId, params] as const,
  
  // AI
  aiQueries: (params?: PaginationParams) => ['aiQueries', params] as const,
  aiQuery: (id: string) => ['aiQuery', id] as const,
  userAiQueries: (userId: string, params?: PaginationParams) => ['userAiQueries', userId, params] as const,
} as const;

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

/**
 * Authentication hook with comprehensive state management
 * @returns Authentication state and methods
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user profile
  const {
    data: user,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiClient.getProfile(),
    enabled: apiClient.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterUserRequest) => apiClient.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile, data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout function
  const logout = useCallback(() => {
    apiClient.logout();
    queryClient.clear(); // Clear all cached data
    queryClient.invalidateQueries(); // Invalidate all queries
  }, [queryClient]);

  // Initialize authentication state
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  return {
    // State
    user,
    isAuthenticated: apiClient.isAuthenticated(),
    isLoading: !isInitialized || (apiClient.isAuthenticated() && isLoadingProfile),
    isInitialized,
    
    // Actions
    register: registerMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout,
    refetchProfile,
    
    // Mutation states
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    
    // Errors
    registerError: registerMutation.error,
    loginError: loginMutation.error,
    profileError,
  };
}

/**
 * Hook for getting user profile by ID
 * @param userId - User ID to fetch
 * @returns User profile query state
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profileById(userId),
    queryFn: () => apiClient.getProfileById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting public user profile
 * @param userId - User ID to fetch
 * @returns Public user profile query state
 */
export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.publicProfile(userId),
    queryFn: () => apiClient.getPublicProfile(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// USER MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for getting all users with pagination
 * @param params - Pagination parameters
 * @returns Users query state
 */
export function useUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => apiClient.getUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for getting user by ID
 * @param userId - User ID to fetch
 * @returns User query state
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => apiClient.getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for updating user profile
 * @returns Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiClient.updateUser(userId, data),
    onSuccess: (updatedUser, { userId }) => {
      // Update user in cache
      queryClient.setQueryData(queryKeys.user(userId), updatedUser);
      queryClient.setQueryData(queryKeys.profileById(userId), updatedUser);
      
      // Update profile if it's the current user
      const currentUser = queryClient.getQueryData(queryKeys.profile) as User;
      if (currentUser && currentUser.id === userId) {
        queryClient.setQueryData(queryKeys.profile, updatedUser);
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// ============================================================================
// ROOM MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for getting all rooms
 * @returns Rooms query state
 */
export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: () => apiClient.getRooms(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for getting room details by ID
 * @param roomId - Room ID to fetch
 * @returns Room query state
 */
export function useRoom(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room(roomId),
    queryFn: () => apiClient.getRoomById(roomId),
    enabled: !!roomId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for creating a new room
 * @returns Create room mutation
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoomRequest) => apiClient.createRoom(data),
    onSuccess: (newRoom) => {
      // Add new room to rooms list
      queryClient.setQueryData(queryKeys.rooms, (oldRooms: Room[] = []) => [
        newRoom,
        ...oldRooms,
      ]);
      
      // Set room details in cache
      queryClient.setQueryData(queryKeys.room(newRoom.id), newRoom);
    },
  });
}

/**
 * Hook for updating a room
 * @returns Update room mutation
 */
export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: UpdateRoomRequest }) =>
      apiClient.updateRoom(roomId, data),
    onSuccess: (updatedRoom, { roomId }) => {
      // Update room in cache
      queryClient.setQueryData(queryKeys.room(roomId), updatedRoom);
      
      // Update room in rooms list
      queryClient.setQueryData(queryKeys.rooms, (oldRooms: Room[] = []) =>
        oldRooms.map(room => room.id === roomId ? updatedRoom : room)
      );
    },
  });
}

/**
 * Hook for joining a room
 * @returns Join room mutation
 */
export function useJoinRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: string }) =>
      apiClient.joinRoom(roomId, { userId }),
    onSuccess: (_, { roomId }) => {
      // Invalidate room details to refresh user list
      queryClient.invalidateQueries({ queryKey: queryKeys.room(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
}

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

/**
 * Hook for getting room messages with pagination
 * @param roomId - Room ID to get messages from
 * @param params - Pagination parameters
 * @returns Messages query state
 */
export function useRoomMessages(roomId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.roomMessages(roomId, params),
    queryFn: () => apiClient.getRoomMessages(roomId, params),
    enabled: !!roomId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook for sending messages to a room
 * @returns Send message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: SendMessageRequest }) =>
      apiClient.sendMessage(roomId, data),
    onSuccess: (newMessage, { roomId }) => {
      // Add message to room messages cache
      const queryKey = queryKeys.roomMessages(roomId);
      queryClient.setQueryData(queryKey, (oldMessages: Message[] = []) => [
        ...oldMessages,
        newMessage,
      ]);
      
      // Update room message count
      queryClient.setQueryData(queryKeys.room(roomId), (oldRoom: DetailedRoom) => {
        if (oldRoom) {
          return {
            ...oldRoom,
            messageCount: oldRoom.messageCount + 1,
          };
        }
        return oldRoom;
      });
    },
  });
}

// ============================================================================
// MEDIA HOOKS
// ============================================================================

/**
 * Hook for getting all media with pagination
 * @param params - Pagination parameters
 * @returns Media query state
 */
export function useMedia(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.media(params),
    queryFn: () => apiClient.getAllMedia(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for getting room media
 * @param roomId - Room ID to get media from
 * @param params - Pagination parameters
 * @returns Room media query state
 */
export function useRoomMedia(roomId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.roomMedia(roomId, params),
    queryFn: () => apiClient.getRoomMedia(roomId, params),
    enabled: !!roomId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for getting user media
 * @param userId - User ID to get media from
 * @param params - Pagination parameters
 * @returns User media query state
 */
export function useUserMedia(userId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.userMedia(userId, params),
    queryFn: () => apiClient.getUserMedia(userId, params),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for uploading media
 * @returns Upload media mutation
 */
export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadMediaRequest) => apiClient.uploadMedia(data),
    onSuccess: (newMedia) => {
      // Invalidate media queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['roomMedia', newMedia.room.id] });
      queryClient.invalidateQueries({ queryKey: ['userMedia', newMedia.user.id] });
      
      // Update room media count
      queryClient.setQueryData(queryKeys.room(newMedia.room.id), (oldRoom: DetailedRoom) => {
        if (oldRoom) {
          return {
            ...oldRoom,
            mediaCount: oldRoom.mediaCount + 1,
          };
        }
        return oldRoom;
      });
    },
  });
}

// ============================================================================
// AI HOOKS
// ============================================================================

/**
 * Hook for getting AI queries with pagination
 * @param params - Pagination parameters
 * @returns AI queries query state
 */
export function useAIQueries(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.aiQueries(params),
    queryFn: () => apiClient.getQueries(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for getting user AI queries
 * @param userId - User ID to get queries for
 * @param params - Pagination parameters
 * @returns User AI queries query state
 */
export function useUserAIQueries(userId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.userAiQueries(userId, params),
    queryFn: () => apiClient.getUserQueries(userId, params),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for submitting AI queries
 * @returns Submit AI query mutation
 */
export function useSubmitAIQuery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AIQueryRequest) => apiClient.submitQuery(data),
    onSuccess: (newQuery) => {
      // Add query to queries list
      queryClient.setQueryData(queryKeys.aiQueries(), (oldQueries: AIQueryResponse[] = []) => [
        newQuery,
        ...oldQueries,
      ]);
      
      // Add query to user queries list
      queryClient.setQueryData(
        queryKeys.userAiQueries(newQuery.user.id),
        (oldQueries: AIQueryResponse[] = []) => [newQuery, ...oldQueries]
      );
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for handling API errors with user-friendly messages
 * @param error - API error to handle
 * @returns Formatted error message
 */
export function useApiError(error: unknown) {
  return useMemo(() => {
    if (!error) return null;

    if (error instanceof ValidationError) {
      return {
        type: 'validation',
        message: error.messages.join(', '),
        details: error.messages,
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        type: 'authentication',
        message: 'Please log in to continue',
        details: [error.message],
      };
    }

    if (error instanceof APIError) {
      return {
        type: 'api',
        message: error.message,
        details: [error.message],
      };
    }

    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      details: [String(error)],
    };
  }, [error]);
}

/**
 * Hook for debouncing values (useful for search)
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing pagination state
 * @param initialTake - Initial number of items per page
 * @returns Pagination state and controls
 */
export function usePagination(initialTake: number = 20) {
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(initialTake);

  const nextPage = useCallback(() => {
    setSkip(prev => prev + take);
  }, [take]);

  const prevPage = useCallback(() => {
    setSkip(prev => Math.max(0, prev - take));
  }, [take]);

  const goToPage = useCallback((page: number) => {
    setSkip(page * take);
  }, [take]);

  const reset = useCallback(() => {
    setSkip(0);
  }, []);

  return {
    skip,
    take,
    setTake,
    nextPage,
    prevPage,
    goToPage,
    reset,
    currentPage: Math.floor(skip / take),
    params: { skip, take },
  };
}

