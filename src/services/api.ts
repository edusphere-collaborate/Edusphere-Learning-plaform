/**
 * EduSphere API Service Layer
 * Centralized API service with comprehensive error handling and caching
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready API service layer that provides a clean interface
 *              between components and the backend API with built-in error handling,
 *              caching, and request optimization
 */

import {
  apiClient,
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '@/lib/api-client';
import {
  User,
  Room,
  DetailedRoom,
  Message,
  Media,
  AIQueryResponse,
  RegisterUserRequest,
  LoginRequest,
  AuthResponse,
  CreateRoomRequest,
  UpdateRoomRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  SendMessageRequest,
  MessageResponse,
  UploadMediaRequest,
  SimpleMediaUploadRequest,
  UpdateMediaRequest,
  AIQueryRequest,
  PaginationParams,
  PublicUser,
  UpdateUserRequest,
} from '@/types/api';

// ============================================================================
// SERVICE ERROR HANDLING
// ============================================================================

/**
 * Service response wrapper for consistent error handling
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'conflict' | 'api' | 'network';
    message: string;
    details?: any;
  };
}

/**
 * Wrap API calls with consistent error handling
 * @param apiCall - API call function
 * @returns Service response with error handling
 */
async function withErrorHandling<T>(
  apiCall: () => Promise<T>
): Promise<ServiceResponse<T>> {
  try {
    const data = await apiCall();
    return { success: true, data };
  } catch (error) {
    console.error('API Service Error:', error);

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: error.message,
          details: error.messages,
        },
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: {
          type: 'authentication',
          message: 'Please log in to continue',
          details: error.message,
        },
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        success: false,
        error: {
          type: 'authorization',
          message: 'You do not have permission to perform this action',
          details: error.message,
        },
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        error: {
          type: 'not_found',
          message: 'The requested resource was not found',
          details: error.message,
        },
      };
    }

    if (error instanceof ConflictError) {
      return {
        success: false,
        error: {
          type: 'conflict',
          message: 'This resource already exists',
          details: error.message,
        },
      };
    }

    if (error instanceof APIError) {
      return {
        success: false,
        error: {
          type: 'api',
          message: error.message,
          details: error.details,
        },
      };
    }

    // Network or unknown errors
    return {
      success: false,
      error: {
        type: 'network',
        message: 'Network error occurred. Please check your connection and try again.',
        details: String(error),
      },
    };
  }
}

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

/**
 * Authentication service with comprehensive user management
 */
export class AuthService {
  /**
   * Register new user account
   * @param userData - User registration data
   * @returns Service response with user and token
   */
  static async register(userData: RegisterUserRequest): Promise<ServiceResponse<AuthResponse>> {
    return withErrorHandling(() => apiClient.register(userData));
  }

  /**
   * Authenticate user with credentials
   * @param credentials - Login credentials
   * @returns Service response with user and token
   */
  static async login(credentials: LoginRequest): Promise<ServiceResponse<AuthResponse>> {
    return withErrorHandling(() => apiClient.login(credentials));
  }

  /**
   * Get current user profile
   * @returns Service response with user profile
   */
  static async getProfile(): Promise<ServiceResponse<User>> {
    return withErrorHandling(() => apiClient.getProfile());
  }

  /**
   * Get user profile by ID
   * @param userId - User ID to retrieve
   * @returns Service response with user profile
   */
  static async getProfileById(userId: string): Promise<ServiceResponse<User>> {
    return withErrorHandling(() => apiClient.getProfileById(userId));
  }

  /**
   * Logout current user
   */
  static logout(): void {
    apiClient.logout();
  }

  /**
   * Check if user is authenticated
   * @returns boolean indicating authentication status
   */
  static isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current user from storage
   * @returns Current user or null
   */
  static getCurrentUser(): User | null {
    return apiClient.getCurrentUser();
  }
}

// ============================================================================
// USER MANAGEMENT SERVICE
// ============================================================================

/**
 * User management service for profile and user operations
 */
export class UserService {

  /**
   * Get user by ID
   * @param userId - User ID to retrieve
   * @returns Service response with user data
   */
  static async getUserById(userId: string): Promise<ServiceResponse<User>> {
    return withErrorHandling(() => apiClient.getUserById(userId));
  }

  /**
   * Get public user profile
   * @param userId - User ID to retrieve
   * @returns Service response with public user data
   */
  static async getPublicProfile(userId: string): Promise<ServiceResponse<PublicUser>> {
    return withErrorHandling(() => apiClient.getPublicProfile(userId));
  }

  /**
   * Update user profile
   * @param userId - User ID to update
   * @param updateData - Data to update
   * @returns Service response with updated user
   */
  static async updateUser(
    userId: string,
    updateData: UpdateUserRequest
  ): Promise<ServiceResponse<User>> {
    return withErrorHandling(() => apiClient.updateUser(userId, updateData));
  }

  /**
   * Delete user account
   * @param userId - User ID to delete
   * @returns Service response with success message
   */
  static async deleteUser(userId: string): Promise<ServiceResponse<{ message: string }>> {
    return withErrorHandling(() => apiClient.deleteUser(userId));
  }
}

// ============================================================================
// ROOM MANAGEMENT SERVICE
// ============================================================================

/**
 * Room management service for discussion rooms
 */
export class RoomService {
  /**
   * Get all available rooms
   * @returns Service response with rooms array
   */
  static async getRooms(): Promise<ServiceResponse<Room[]>> {
    return withErrorHandling(() => apiClient.getRooms());
  }

  /**
   * Get detailed room information
   * @param roomId - Room ID to retrieve
   * @returns Service response with detailed room data
   */
  static async getRoomById(roomId: string): Promise<ServiceResponse<DetailedRoom>> {
    return withErrorHandling(() => apiClient.getRoomById(roomId));
  }

  /**
   * Create new discussion room
   * @param roomData - Room creation data
   * @returns Service response with created room
   */
  static async createRoom(roomData: CreateRoomRequest): Promise<ServiceResponse<Room>> {
    return withErrorHandling(() => apiClient.createRoom(roomData));
  }

  /**
   * Update existing room
   * @param roomId - Room ID to update
   * @param updateData - Data to update
   * @returns Service response with updated room
   */
  static async updateRoom(
    roomId: string,
    updateData: UpdateRoomRequest
  ): Promise<ServiceResponse<Room>> {
    return withErrorHandling(() => apiClient.updateRoom(roomId, updateData));
  }

  /**
   * Delete room
   * @param roomId - Room ID to delete
   * @returns Service response with success message
   */
  static async deleteRoom(roomId: string): Promise<ServiceResponse<{ message: string }>> {
    return withErrorHandling(() => apiClient.deleteRoom(roomId));
  }

  /**
   * Join discussion room
   * @param roomId - Room ID to join
   * @param userId - User ID joining the room
   * @returns Service response with join confirmation
   */
  static async joinRoom(roomId: string, userId: string): Promise<ServiceResponse<JoinRoomResponse>> {
    return withErrorHandling(() => apiClient.joinRoom(roomId, { userId }));
  }

  /**
   * Professional-grade room exploration with comprehensive querying
   * @param params - Advanced query parameters for room exploration
   * @returns Service response with filtered and sorted room array
   */
  static async exploreRooms(params?: {
    search?: string;
    subject?: string;
    sortBy?: 'name' | 'createdAt' | 'memberCount' | 'lastActivity';
    sortOrder?: 'asc' | 'desc';
    active?: boolean;
    trending?: boolean;
    excludePrivate?: boolean;
    aiEnabled?: boolean;
    limit?: number;
    offset?: number;
    includeStats?: boolean;
    includeMembershipStatus?: boolean;
    createdByUser?: string;
    userJoined?: boolean;
  }): Promise<ServiceResponse<Room[]>> {
    return withErrorHandling(() => apiClient.exploreRooms(params));
  }

  /**
   * Get user's joined rooms with membership details
   * @returns Service response with user's joined rooms
   */
  static async getJoinedRooms(): Promise<ServiceResponse<Room[]>> {
    return withErrorHandling(() => apiClient.getJoinedRooms());
  }
}

// ============================================================================
// MESSAGE SERVICE
// ============================================================================

/**
 * Message service for room communication
 */
export class MessageService {
  /**
   * Get messages from room with pagination
   * @param roomId - Room ID to get messages from
   * @param params - Pagination parameters
   * @returns Service response with messages array
   */
  static async getRoomMessages(
    roomId: string,
    params?: PaginationParams
  ): Promise<ServiceResponse<Message[]>> {
    return withErrorHandling(() => apiClient.getRoomMessages(roomId, params));
  }

  /**
   * Send message to room
   * @param roomId - Room ID to send message to
   * @param content - Message content
   * @param userId - User ID sending the message
   * @returns Service response with sent message
   */
  static async sendMessage(
    roomId: string,
    content: string,
    userId: string
  ): Promise<ServiceResponse<MessageResponse>> {
    const messageData: SendMessageRequest = { content, userId, roomId };
    return withErrorHandling(() => apiClient.sendMessage(roomId, messageData));
  }
}

// ============================================================================
// MEDIA SERVICE
// ============================================================================

/**
 * Media service for file management
 */
export class MediaService {
  /**
   * Get all media files with pagination
   * @param params - Pagination parameters
   * @returns Service response with media array
   */
  static async getAllMedia(params?: PaginationParams): Promise<ServiceResponse<Media[]>> {
    return withErrorHandling(() => apiClient.getAllMedia(params));
  }

  /**
   * Get media file by ID
   * @param mediaId - Media ID to retrieve
   * @returns Service response with media data
   */
  static async getMediaById(mediaId: string): Promise<ServiceResponse<Media>> {
    return withErrorHandling(() => apiClient.getMediaById(mediaId));
  }

  /**
   * Get media files from specific room
   * @param roomId - Room ID to get media from
   * @param params - Pagination parameters
   * @returns Service response with room media array
   */
  static async getRoomMedia(
    roomId: string,
    params?: PaginationParams
  ): Promise<ServiceResponse<Media[]>> {
    return withErrorHandling(() => apiClient.getRoomMedia(roomId, params));
  }

  /**
   * Get media files uploaded by specific user
   * @param userId - User ID to get media from
   * @param params - Pagination parameters
   * @returns Service response with user media array
   */
  static async getUserMedia(
    userId: string,
    params?: PaginationParams
  ): Promise<ServiceResponse<Media[]>> {
    return withErrorHandling(() => apiClient.getUserMedia(userId, params));
  }

  /**
   * Upload media file
   * @param mediaData - Media upload data
   * @returns Service response with uploaded media
   */
  static async uploadMedia(mediaData: UploadMediaRequest): Promise<ServiceResponse<Media>> {
    return withErrorHandling(() => apiClient.uploadMedia(mediaData));
  }

  /**
   * Upload media file (simple endpoint)
   * @param mediaData - Simple media upload data
   * @returns Service response with uploaded media
   */
  static async uploadSimpleMedia(
    mediaData: SimpleMediaUploadRequest
  ): Promise<ServiceResponse<Media>> {
    return withErrorHandling(() => apiClient.uploadSimpleMedia(mediaData));
  }

  /**
   * Update media file
   * @param mediaId - Media ID to update
   * @param updateData - Data to update
   * @returns Service response with updated media
   */
  static async updateMedia(
    mediaId: string,
    updateData: UpdateMediaRequest
  ): Promise<ServiceResponse<Media>> {
    return withErrorHandling(() => apiClient.updateMedia(mediaId, updateData));
  }

  /**
   * Delete media file
   * @param mediaId - Media ID to delete
   * @returns Service response with success message
   */
  static async deleteMedia(mediaId: string): Promise<ServiceResponse<{ message: string }>> {
    return withErrorHandling(() => apiClient.deleteMedia(mediaId));
  }
}

// ============================================================================
// AI SERVICE
// ============================================================================

/**
 * AI service for academic assistance
 */
export class AIService {
  /**
   * Submit query to AI assistant
   * @param query - Query text
   * @param userId - User ID submitting the query
   * @returns Service response with AI response
   */
  static async submitQuery(query: string, userId: string): Promise<ServiceResponse<AIQueryResponse>> {
    const queryData: AIQueryRequest = { query, userId };
    return withErrorHandling(() => apiClient.submitQuery(queryData));
  }

  /**
   * Get all AI queries with pagination
   * @param params - Pagination parameters
   * @returns Service response with queries array
   */
  static async getQueries(params?: PaginationParams): Promise<ServiceResponse<AIQueryResponse[]>> {
    return withErrorHandling(() => apiClient.getQueries(params));
  }

  /**
   * Get AI queries for specific user
   * @param userId - User ID to get queries for
   * @param params - Pagination parameters
   * @returns Service response with user queries array
   */
  static async getUserQueries(
    userId: string,
    params?: PaginationParams
  ): Promise<ServiceResponse<AIQueryResponse[]>> {
    return withErrorHandling(() => apiClient.getUserQueries(userId, params));
  }

  /**
   * Get AI query by ID
   * @param queryId - Query ID to retrieve
   * @returns Service response with query data
   */
  static async getQueryById(queryId: string): Promise<ServiceResponse<AIQueryResponse>> {
    return withErrorHandling(() => apiClient.getQueryById(queryId));
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Handle service response with optional success/error callbacks
 * @param response - Service response to handle
 * @param onSuccess - Success callback function
 * @param onError - Error callback function
 */
export function handleServiceResponse<T>(
  response: ServiceResponse<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: ServiceResponse<T>['error']) => void
): void {
  if (response.success && response.data) {
    onSuccess?.(response.data);
  } else if (!response.success && response.error) {
    onError?.(response.error);
  }
}

/**
 * Extract error message from service response
 * @param response - Service response
 * @returns User-friendly error message
 */
export function getErrorMessage(response: ServiceResponse<any>): string {
  if (response.success) return '';
  
  return response.error?.message || 'An unexpected error occurred';
}

/**
 * Check if service response indicates authentication error
 * @param response - Service response
 * @returns boolean indicating if error is authentication related
 */
export function isAuthenticationError(response: ServiceResponse<any>): boolean {
  return !response.success && response.error?.type === 'authentication';
}

/**
 * Check if service response indicates validation error
 * @param response - Service response
 * @returns boolean indicating if error is validation related
 */
export function isValidationError(response: ServiceResponse<any>): boolean {
  return !response.success && response.error?.type === 'validation';
}

/**
 * Get validation error details from service response
 * @param response - Service response
 * @returns Array of validation error messages
 */
export function getValidationErrors(response: ServiceResponse<any>): string[] {
  if (!isValidationError(response)) return [];
  
  return response.error?.details || [response.error?.message || 'Validation error'];
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Simple in-memory cache for API responses
 */
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Set cache entry
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlMs - Time to live in milliseconds
   */
  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Get cache entry
   * @param key - Cache key
   * @returns Cached data or null if expired/not found
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Clear cache entry
   * @param key - Cache key to clear
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    // Convert entries to array to avoid iterator issues
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global API cache instance
 */
export const apiCache = new ApiCache();

/**
 * Cached API call wrapper
 * @param key - Cache key
 * @param apiCall - API call function
 * @param ttlMs - Cache time to live in milliseconds
 * @returns Cached or fresh API response
 */
export async function withCache<T>(
  key: string,
  apiCall: () => Promise<ServiceResponse<T>>,
  ttlMs: number = 5 * 60 * 1000
): Promise<ServiceResponse<T>> {
  // Try to get from cache first
  const cached = apiCache.get(key);
  if (cached) {
    return { success: true, data: cached };
  }

  // Make API call
  const response = await apiCall();
  
  // Cache successful responses
  if (response.success && response.data) {
    apiCache.set(key, response.data, ttlMs);
  }

  return response;
}

// ============================================================================
// EXPORT ALL SERVICES
// ============================================================================

/**
 * Centralized API service exports
 */
export const ApiService = {
  Auth: AuthService,
  User: UserService,
  Room: RoomService,
  Message: MessageService,
  Media: MediaService,
  AI: AIService,
};

// Services are already exported individually above
