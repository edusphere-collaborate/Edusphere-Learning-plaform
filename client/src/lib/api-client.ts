/**
 * EduSphere Professional API Client
 * Enterprise-grade HTTP client for backend integration
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready API client with comprehensive error handling,
 *              authentication, retry logic, and type safety
 */

import {
  ApiClientConfig,
  RequestOptions,
  IApiClient,
  ApiResponse,
  ApiError,
  HttpStatus,
  // Authentication types
  RegisterUserRequest,
  LoginRequest,
  AuthResponse,
  User,
  UpdateUserRequest,
  PublicUser,
  // Email verification types
  SendVerificationRequest,
  SendVerificationResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  // Password reset types
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyResetTokenRequest,
  VerifyResetTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  // Room types
  Room,
  DetailedRoom,
  CreateRoomRequest,
  UpdateRoomRequest,
  JoinRoomRequest,
  JoinRoomResponse,
  // Message types
  Message,
  SendMessageRequest,
  MessageResponse,
  // Media types
  Media,
  UploadMediaRequest,
  SimpleMediaUploadRequest,
  UpdateMediaRequest,
  // AI types
  AIQueryRequest,
  AIQueryResponse,
  // Utility types
  PaginationParams,
  DEFAULT_CONFIG,
  API_ENDPOINTS,
} from '@/types/api';
import { apiFallbackManager, checkDevTunnelAuth, handleDevTunnelError } from '@/lib/api-fallback';

/**
 * Custom error classes for different API error scenarios
 */
export class APIError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends APIError {
  public messages: string[];

  constructor(messages: string | string[], details?: any) {
    const messageArray = Array.isArray(messages) ? messages : [messages];
    super(messageArray.join(', '), HttpStatus.BAD_REQUEST, details);
    this.name = 'ValidationError';
    this.messages = messageArray;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends APIError {
  constructor(message: string = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT);
    this.name = 'ConflictError';
  }
}

/**
 * Authentication token manager for secure token handling
 */
export class TokenManager {
  private readonly TOKEN_KEY = 'sessionId'; // Match AuthContext expectations
  private readonly USER_KEY = 'edusphere_user';

  /**
   * Store authentication token securely
   * @param token - JWT token string
   */
  public storeToken(token: string): void {
    try {
      // Store in both localStorage and sessionStorage for compatibility
      localStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve stored authentication token
   * @returns JWT token or null if not found
   */
  public getToken(): string | null {
    try {
      // Check both localStorage and sessionStorage
      return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }

  /**
   * Store user data securely
   * @param user - User object to store
   */
  public storeUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  /**
   * Retrieve stored user data
   * @returns User object or null if not found
   */
  public getUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to retrieve user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated with valid token
   * @returns boolean indicating authentication status
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT payload to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  public clearAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }
}

/**
 * HTTP request interceptor for adding authentication and common headers
 */
export class RequestInterceptor {
  constructor(private tokenManager: TokenManager) {}

  /**
   * Intercept and modify outgoing requests
   * @param options - Request options
   * @returns Modified request options
   */
  public intercept(options: RequestInit): RequestInit {
    const token = this.tokenManager.getToken();
    
    // Build headers without CORS interference
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add Content-Type for requests with body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // Debug logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.log('[API CLIENT] Adding auth header for request');
      }
    } else {
      // Debug logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.log('[API CLIENT] No token found for request');
      }
    }

    return {
      ...options,
      headers,
    };
  }
}

/**
 * HTTP response interceptor for handling errors and authentication
 */
export class ResponseInterceptor {
  constructor(private tokenManager: TokenManager) {}

  /**
   * Intercept and handle API responses
   * @param response - Fetch response object
   * @returns Processed response data
   */
  public async intercept<T = any>(response: Response): Promise<T> {
    // Handle successful responses
    if (response.ok) {
      try {
        return await response.json();
      } catch (error) {
        // Handle empty responses
        return {} as T;
      }
    }

    // Handle error responses
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        statusCode: response.status,
        message: response.statusText || 'Unknown error',
        error: 'API Error',
      };
    }

    // Handle authentication errors
    if (response.status === HttpStatus.UNAUTHORIZED) {
      this.tokenManager.clearAuth();
      // Redirect to login page if in browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new AuthenticationError(errorData.message as string);
    }

    // Throw appropriate error based on status code
    switch (response.status) {
      case HttpStatus.BAD_REQUEST:
        throw new ValidationError(errorData.message, errorData.details);
      case HttpStatus.FORBIDDEN:
        throw new AuthorizationError(errorData.message as string);
      case HttpStatus.NOT_FOUND:
        throw new NotFoundError(errorData.message as string);
      case HttpStatus.CONFLICT:
        throw new ConflictError(errorData.message as string);
      default:
        throw new APIError(
          errorData.message as string,
          response.status,
          errorData.details
        );
    }
  }
}

/**
 * Retry mechanism for failed requests
 */
export class RetryHandler {
  /**
   * Execute request with retry logic
   * @param requestFn - Function that makes the HTTP request
   * @param maxRetries - Maximum number of retry attempts
   * @param delay - Delay between retries in milliseconds
   * @returns Promise resolving to response data
   */
  public async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = DEFAULT_CONFIG.API_RETRIES,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof APIError) {
          const shouldRetry = error.statusCode >= 500 || error.statusCode === 429;
          if (!shouldRetry || attempt === maxRetries) {
            throw error;
          }
        }

        // Wait before retrying with exponential backoff
        if (attempt < maxRetries) {
          await this.delay(delay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Create delay promise
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Professional API Client for EduSphere Backend Integration
 * Implements comprehensive error handling, authentication, and type safety
 */
export class EduSphereApiClient implements IApiClient {
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly tokenManager: TokenManager;
  private readonly requestInterceptor: RequestInterceptor;
  private readonly responseInterceptor: ResponseInterceptor;
  private readonly retryHandler: RetryHandler;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || DEFAULT_CONFIG.API_TIMEOUT;
    this.tokenManager = new TokenManager();
    this.requestInterceptor = new RequestInterceptor(this.tokenManager);
    this.responseInterceptor = new ResponseInterceptor(this.tokenManager);
    this.retryHandler = new RetryHandler();
  }

  /**
   * Make HTTP request with comprehensive error handling and retries
   * @param endpoint - API endpoint path
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check if we need to use fallback endpoint due to DevTunnel auth issues
    let baseUrl = this.baseURL;
    
    // Check for DevTunnel authentication issues
    if (baseUrl.includes('devtunnels.ms')) {
      const needsAuth = await checkDevTunnelAuth(baseUrl);
      if (needsAuth) {
        console.warn('[API CLIENT] DevTunnel requires authentication, using fallback endpoint');
        baseUrl = await apiFallbackManager.getBestEndpoint();
      }
    }
    
    const url = `${baseUrl}${endpoint}`;
    
    // Build query parameters
    const queryParams = options.params ? this.buildQueryString(options.params) : '';
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    // Prepare request options with extended timeout for login
    const isLoginRequest = endpoint === API_ENDPOINTS.AUTH.LOGIN;
    const requestTimeout = isLoginRequest ? 60000 : (options.timeout || this.timeout); // 60s for login, default for others
    
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(requestTimeout),
    };

    // Debug logging only in development mode
    if (import.meta.env.MODE === 'development') {
      console.log('[API CLIENT] Making request:', {
        method: requestOptions.method,
        url: fullUrl,
        hasBody: !!requestOptions.body,
        usingFallback: baseUrl !== this.baseURL
      });
    }

    // Apply intercepted options - let backend handle CORS
    const interceptedOptions = this.requestInterceptor.intercept(requestOptions);

    // Debug logging only in development mode
    if (import.meta.env.MODE === 'development') {
      console.log('[API CLIENT] Intercepted options:', {
        method: interceptedOptions.method,
        credentials: interceptedOptions.credentials,
        mode: interceptedOptions.mode
      });
    }

    // Execute request with retry logic and DevTunnel error handling
    return this.retryHandler.executeWithRetry(async () => {
      try {
        const response = await fetch(fullUrl, interceptedOptions);
        
        // Debug logging only in development mode
        if (import.meta.env.MODE === 'development') {
          console.log('[API CLIENT] Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });
        }
        
        return this.responseInterceptor.intercept<T>(response);
      } catch (error) {
        // Handle DevTunnel authentication errors specifically
        if (error instanceof Error && 
            (error.message.includes('CORS') || error.message.includes('NetworkError')) &&
            baseUrl.includes('devtunnels.ms')) {
          throw handleDevTunnelError(error);
        }
        throw error;
      }
    });
  }

  /**
   * Build query string from parameters object
   * @param params - Parameters object
   * @returns Query string
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return searchParams.toString();
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Register new user account
   * @param data - User registration data
   * @returns Promise resolving to authentication response
   */
  public async register(data: RegisterUserRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: data,
    });

    // Store authentication data
    this.tokenManager.storeToken(response.token);
    this.tokenManager.storeUser(response.user);

    return response;
  }

  /**
   * Authenticate user with credentials
   * @param data - Login credentials
   * @returns Promise resolving to authentication response
   */
  public async login(data: LoginRequest): Promise<AuthResponse> {
    // Debug logging only in development mode
    if (import.meta.env.MODE === 'development') {
      console.log('[API CLIENT] Login attempt:', {
        endpoint: API_ENDPOINTS.AUTH.LOGIN,
        email: data.email
      });
    }

    try {
      const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: data,
      });

      // Debug logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.log('[API CLIENT] Login successful:', {
          userId: response.user?.id,
          username: response.user?.username
        });
      }

      // Store authentication data
      this.tokenManager.storeToken(response.token);
      this.tokenManager.storeUser(response.user);

      return response;
    } catch (error) {
      // Error logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.error('[API CLIENT] Login failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: API_ENDPOINTS.AUTH.LOGIN
        });
      }
      throw error;
    }
  }

  /**
   * Get current user profile
   * @returns Promise resolving to user profile
   */
  public async getProfile(): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.PROFILE);
  }

  /**
   * Get user profile by ID (admin or self only)
   * @param userId - User ID to retrieve
   * @returns Promise resolving to user profile
   */
  public async getProfileById(userId: string): Promise<User> {
    return this.request<User>(API_ENDPOINTS.AUTH.PROFILE_BY_ID(userId));
  }

  /**
   * Handle OAuth callback authentication
   * @param data - OAuth callback data
   * @returns Promise resolving to authentication response
   */
  public async oauthCallback(data: { code: string; state: string; provider: 'google' | 'github' }): Promise<AuthResponse> {
    // Debug logging only in development mode
    if (import.meta.env.MODE === 'development') {
      console.log('[API CLIENT] OAuth callback attempt:', {
        endpoint: API_ENDPOINTS.AUTH.OAUTH_CALLBACK,
        provider: data.provider
      });
    }

    try {
      const response = await this.request<AuthResponse>(API_ENDPOINTS.AUTH.OAUTH_CALLBACK, {
        method: 'POST',
        body: data,
      });

      // Debug logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.log('[API CLIENT] OAuth callback successful:', {
          userId: response.user?.id,
          username: response.user?.username
        });
      }

      // Store authentication data
      this.tokenManager.storeToken(response.token);
      this.tokenManager.storeUser(response.user);

      return response;
    } catch (error) {
      // Error logging only in development mode
      if (import.meta.env.MODE === 'development') {
        console.error('[API CLIENT] OAuth callback failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: API_ENDPOINTS.AUTH.OAUTH_CALLBACK
        });
      }
      throw error;
    }
  }

  /**
   * Send email verification
   * @param data - Email verification request data
   * @returns Promise resolving to verification response
   */
  public async sendVerification(data: SendVerificationRequest): Promise<SendVerificationResponse> {
    return this.request<SendVerificationResponse>(API_ENDPOINTS.AUTH.SEND_VERIFICATION, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Verify email with token
   * @param data - Email verification data
   * @returns Promise resolving to verification result
   */
  public async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    return this.request<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Resend email verification
   * @param data - Resend verification request data
   * @returns Promise resolving to resend response
   */
  public async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    return this.request<ResendVerificationResponse>(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Request password reset
   * @param data - Forgot password request data
   * @returns Promise resolving to forgot password response
   */
  public async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return this.request<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Verify reset token validity
   * @param data - Reset token verification data
   * @returns Promise resolving to token validation result
   */
  public async verifyResetToken(data: VerifyResetTokenRequest): Promise<VerifyResetTokenResponse> {
    return this.request<VerifyResetTokenResponse>(API_ENDPOINTS.AUTH.VERIFY_RESET_TOKEN, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Reset password with token
   * @param data - Reset password request data
   * @returns Promise resolving to reset password response
   */
  public async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await this.request<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: data,
    });

    // Store authentication data if password reset includes login
    if (response.user) {
      // Note: Backend should return token if auto-login after reset
      // this.tokenManager.storeUser(response.user);
    }

    return response;
  }

  /**
   * Change password for authenticated user
   * @param data - Change password request data
   * @returns Promise resolving to change password response
   */
  public async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return this.request<ChangePasswordResponse>(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Logout current user
   */
  public logout(): void {
    this.tokenManager.clearAuth();
  }

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get all users with pagination (admin only)
   * @param params - Pagination parameters
   * @returns Promise resolving to users array
   */
  public async getUsers(params?: PaginationParams): Promise<User[]> {
    return this.request<User[]>(API_ENDPOINTS.USERS.BASE, {
      params,
    });
  }

  /**
   * Get user by ID
   * @param userId - User ID to retrieve
   * @returns Promise resolving to user data
   */
  public async getUserById(userId: string): Promise<User> {
    return this.request<User>(API_ENDPOINTS.USERS.BY_ID(userId));
  }

  /**
   * Get public user profile (no authentication required)
   * @param userId - User ID to retrieve
   * @returns Promise resolving to public user data
   */
  public async getPublicProfile(userId: string): Promise<PublicUser> {
    return this.request<PublicUser>(API_ENDPOINTS.USERS.PUBLIC(userId));
  }

  /**
   * Update user profile
   * @param userId - User ID to update
   * @param data - Update data
   * @returns Promise resolving to updated user
   */
  public async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.request<User>(API_ENDPOINTS.USERS.BY_ID(userId), {
      method: 'PATCH',
      body: data,
    });

    // Update stored user data if updating current user
    const currentUser = this.tokenManager.getUser();
    if (currentUser && currentUser.id === userId) {
      this.tokenManager.storeUser(response);
    }

    return response;
  }

  /**
   * Delete user (admin only)
   * @param userId - User ID to delete
   * @returns Promise resolving to success message
   */
  public async deleteUser(userId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.USERS.BY_ID(userId), {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // ROOM MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get all available rooms
   * @returns Promise resolving to rooms array
   */
  public async getRooms(): Promise<Room[]> {
    return this.request<Room[]>(API_ENDPOINTS.ROOMS.BASE);
  }

  /**
   * Get detailed room information by ID
   * @param roomId - Room ID to retrieve
   * @returns Promise resolving to detailed room data
   */
  public async getRoomById(roomId: string): Promise<DetailedRoom> {
    return this.request<DetailedRoom>(API_ENDPOINTS.ROOMS.BY_ID(roomId));
  }

  /**
   * Create new discussion room
   * @param data - Room creation data
   * @returns Promise resolving to created room
   */
  public async createRoom(data: CreateRoomRequest): Promise<Room> {
    return this.request<Room>(API_ENDPOINTS.ROOMS.BASE, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update existing room
   * @param roomId - Room ID to update
   * @param data - Update data
   * @returns Promise resolving to updated room
   */
  public async updateRoom(roomId: string, data: UpdateRoomRequest): Promise<Room> {
    return this.request<Room>(API_ENDPOINTS.ROOMS.BY_ID(roomId), {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Delete room (soft delete)
   * @param roomId - Room ID to delete
   * @returns Promise resolving to success message
   */
  public async deleteRoom(roomId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.ROOMS.BY_ID(roomId), {
      method: 'DELETE',
    });
  }

  /**
   * Join discussion room
   * @param roomId - Room ID to join
   * @param data - Join request data
   * @returns Promise resolving to join response
   */
  public async joinRoom(roomId: string, data: JoinRoomRequest): Promise<JoinRoomResponse> {
    return this.request<JoinRoomResponse>(API_ENDPOINTS.ROOMS.JOIN(roomId), {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Professional-grade room exploration with comprehensive querying
   * @param params - Advanced query parameters for room exploration
   * @returns Promise resolving to filtered and sorted rooms array
   */
  public async exploreRooms(params?: {
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
  }): Promise<Room[]> {
    return this.request<Room[]>(API_ENDPOINTS.ROOMS.BASE, {
      params
    });
  }

  /**
   * Get user's joined rooms with membership details
   * @returns Promise resolving to user's joined rooms
   */
  public async getJoinedRooms(): Promise<Room[]> {
    return this.request<Room[]>(API_ENDPOINTS.ROOMS.BASE, {
      params: { joined: true }
    });
  }

  // ============================================================================
  // MESSAGE METHODS
  // ============================================================================

  /**
   * Get messages from room with pagination
   * @param roomId - Room ID to get messages from
   * @param params - Pagination parameters
   * @returns Promise resolving to messages array
   */
  public async getRoomMessages(roomId: string, params?: PaginationParams): Promise<Message[]> {
    return this.request<Message[]>(API_ENDPOINTS.ROOMS.MESSAGES(roomId), {
      params,
    });
  }

  /**
   * Send message to room
   * @param roomId - Room ID to send message to
   * @param data - Message data
   * @returns Promise resolving to sent message
   */
  public async sendMessage(roomId: string, data: SendMessageRequest): Promise<MessageResponse> {
    return this.request<MessageResponse>(API_ENDPOINTS.ROOMS.MESSAGES(roomId), {
      method: 'POST',
      body: data,
    });
  }

  // ============================================================================
  // MEDIA METHODS
  // ============================================================================

  /**
   * Get all media files with pagination
   * @param params - Pagination parameters
   * @returns Promise resolving to media array
   */
  public async getAllMedia(params?: PaginationParams): Promise<Media[]> {
    return this.request<Media[]>(API_ENDPOINTS.MEDIA.BASE, {
      params,
    });
  }

  /**
   * Get media file by ID
   * @param mediaId - Media ID to retrieve
   * @returns Promise resolving to media data
   */
  public async getMediaById(mediaId: string): Promise<Media> {
    return this.request<Media>(API_ENDPOINTS.MEDIA.BY_ID(mediaId));
  }

  /**
   * Get media files from specific room
   * @param roomId - Room ID to get media from
   * @param params - Pagination parameters
   * @returns Promise resolving to media array
   */
  public async getRoomMedia(roomId: string, params?: PaginationParams): Promise<Media[]> {
    return this.request<Media[]>(API_ENDPOINTS.MEDIA.ROOM(roomId), {
      params,
    });
  }

  /**
   * Get media files uploaded by specific user
   * @param userId - User ID to get media from
   * @param params - Pagination parameters
   * @returns Promise resolving to media array
   */
  public async getUserMedia(userId: string, params?: PaginationParams): Promise<Media[]> {
    return this.request<Media[]>(API_ENDPOINTS.MEDIA.USER(userId), {
      params,
    });
  }

  /**
   * Upload media file
   * @param data - Media upload data
   * @returns Promise resolving to uploaded media
   */
  public async uploadMedia(data: UploadMediaRequest): Promise<Media> {
    return this.request<Media>(API_ENDPOINTS.MEDIA.BASE, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Upload media file (simple endpoint)
   * @param data - Simple media upload data
   * @returns Promise resolving to uploaded media
   */
  public async uploadSimpleMedia(data: SimpleMediaUploadRequest): Promise<Media> {
    return this.request<Media>(API_ENDPOINTS.MEDIA.UPLOAD, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Update media file
   * @param mediaId - Media ID to update
   * @param data - Update data
   * @returns Promise resolving to updated media
   */
  public async updateMedia(mediaId: string, data: UpdateMediaRequest): Promise<Media> {
    return this.request<Media>(API_ENDPOINTS.MEDIA.BY_ID(mediaId), {
      method: 'PATCH',
      body: data,
    });
  }

  /**
   * Delete media file
   * @param mediaId - Media ID to delete
   * @returns Promise resolving to success message
   */
  public async deleteMedia(mediaId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.MEDIA.BY_ID(mediaId), {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // AI METHODS
  // ============================================================================

  /**
   * Submit query to AI assistant
   * @param data - AI query data
   * @returns Promise resolving to AI response
   */
  public async submitQuery(data: AIQueryRequest): Promise<AIQueryResponse> {
    return this.request<AIQueryResponse>(API_ENDPOINTS.AI.QUERY, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * Get all AI queries with pagination
   * @param params - Pagination parameters
   * @returns Promise resolving to queries array
   */
  public async getQueries(params?: PaginationParams): Promise<AIQueryResponse[]> {
    return this.request<AIQueryResponse[]>(API_ENDPOINTS.AI.QUERIES, {
      params,
    });
  }

  /**
   * Get AI queries for specific user
   * @param userId - User ID to get queries for
   * @param params - Pagination parameters
   * @returns Promise resolving to queries array
   */
  public async getUserQueries(userId: string, params?: PaginationParams): Promise<AIQueryResponse[]> {
    return this.request<AIQueryResponse[]>(API_ENDPOINTS.AI.USER_QUERIES(userId), {
      params,
    });
  }

  /**
   * Get AI query by ID
   * @param queryId - Query ID to retrieve
   * @returns Promise resolving to query data
   */
  public async getQueryById(queryId: string): Promise<AIQueryResponse> {
    return this.request<AIQueryResponse>(API_ENDPOINTS.AI.QUERY_BY_ID(queryId));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if user is currently authenticated
   * @returns boolean indicating authentication status
   */
  public isAuthenticated(): boolean {
    return this.tokenManager.isAuthenticated();
  }

  /**
   * Get currently stored user data
   * @returns User object or null
   */
  public getCurrentUser(): User | null {
    return this.tokenManager.getUser();
  }

  /**
   * Get current authentication token
   * @returns JWT token or null
   */
  public getToken(): string | null {
    return this.tokenManager.getToken();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create configured API client instance
 * @param config - API client configuration
 * @returns Configured API client instance
 */
export function createApiClient(config: ApiClientConfig): EduSphereApiClient {
  return new EduSphereApiClient(config);
}

// ============================================================================
// DEFAULT INSTANCE
// ============================================================================

/**
 * Default API client instance for development
 * Always use VITE_API_URL when available, fallback to localhost
 */
export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: DEFAULT_CONFIG.API_TIMEOUT,
});

// Debug logging for API client configuration (development only)
if (import.meta.env.MODE === 'development') {
  console.log('[API CLIENT] Configuration:', {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    mode: import.meta.env.VITE_MODE || import.meta.env.MODE,
    timeout: DEFAULT_CONFIG.API_TIMEOUT,
  });

  // Additional debugging for environment variables
  if (!import.meta.env.VITE_API_URL) {
    console.warn('[API CLIENT] VITE_API_URL not found in environment variables!');
  }
}

// Export all error classes for use in components
export {
  APIError as ApiClientError,
  ValidationError as ApiValidationError,
  AuthenticationError as ApiAuthenticationError,
  AuthorizationError as ApiAuthorizationError,
  NotFoundError as ApiNotFoundError,
  ConflictError as ApiConflictError,
};
