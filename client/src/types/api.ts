/**
 * EduSphere API Type Definitions
 * Professional TypeScript interfaces for backend integration
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Complete type system for EduSphere backend API
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

/**
 * User role enumeration for authorization levels
 */
export enum UserRole {
  USER = 'User',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  AI = 'AI'
}

/**
 * Media type enumeration for file categorization
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

/**
 * HTTP status codes for API responses
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base interface for all entities with timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  skip?: number;
  take?: number;
}

/**
 * Pagination response metadata
 */
export interface PaginationMeta {
  total: number;
  skip: number;
  take: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
  statusCode: number;
}

/**
 * API error response structure
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// ============================================================================
// USER INTERFACES
// ============================================================================

/**
 * Core user entity interface
 */
export interface User extends BaseEntity {
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  bio?: string;
  university?: string;
  fieldOfStudy?: string;
  yearOfStudy?: string;
  interests?: string[];
  profilePicture?: string;
  isEmailVerified?: boolean;
}

/**
 * Public user profile (limited fields)
 */
export interface PublicUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

/**
 * User registration request payload
 */
export interface RegisterUserRequest {
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

/**
 * User login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication response with user and token
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * User profile update request payload
 */
export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ============================================================================
// ROOM INTERFACES
// ============================================================================

/**
 * Room statistics interface
 */
export interface RoomStats {
  users: number;
  messages: number;
  media: number;
}

/**
 * Core room entity interface
 */
export interface Room extends BaseEntity {
  subject?: string;
  name: string;
  description?: string;
  slug: string;
  creatorId: string;
  creator: PublicUser;
  userCount: number;
  messageCount: number;
  mediaCount: number;
  memberCount?: number;
  isPrivate?: boolean;
  aiEnabled?: boolean;
  maxParticipants?: number;
  type?: string;
}

/**
 * Detailed room with relations
 */
export interface DetailedRoom extends Room {
  users: PublicUser[];
  messages: Message[];
  stats: RoomStats;
}

/**
 * Room creation request payload
 */
export interface CreateRoomRequest {
  name: string;
  description?: string;
  slug?: string;
  creatorId: string;
}

/**
 * Room update request payload
 */
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
}

/**
 * Join room request payload
 */
export interface JoinRoomRequest {
  userId: string;
}

/**
 * Join room response
 */
export interface JoinRoomResponse {
  message: string;
  room: {
    id: string;
    name: string;
    users: PublicUser[];
  };
}

// ============================================================================
// MESSAGE INTERFACES
// ============================================================================

/**
 * Message reaction interface
 */
export interface MessageReaction {
  id: string;
  emoji: string;
  users: PublicUser[];
  count: number;
  createdAt: string;
}

/**
 * Message edit history interface
 */
export interface MessageEditHistory {
  id: string;
  previousContent: string;
  editedBy: PublicUser;
  editedAt: string;
}

/**
 * Core message entity interface
 */
export interface Message extends BaseEntity {
  content: string;
  userId: string;
  roomId: string;
  user: PublicUser;
  type?: 'text' | 'file' | 'image' | 'code' | 'system';
  metadata?: any;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    user: string;
  };
  reactions?: MessageReaction[];
  editHistory?: MessageEditHistory[];
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  aiGenerated?: boolean;
}

/**
 * Message with room information
 */
export interface MessageWithRoom extends Message {
  room: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Send message request payload
 */
export interface SendMessageRequest {
  content: string;
  userId: string;
  roomId: string;
}

/**
 * Message response with user details
 */
export interface MessageResponse extends BaseEntity {
  content: string;
  userId: string;
  roomId: string;
  user: PublicUser;
  sentAt: string;
}

// ============================================================================
// MEDIA INTERFACES
// ============================================================================

/**
 * Core media entity interface
 */
export interface Media extends BaseEntity {
  url: string;
  type: MediaType;
  userId: string;
  roomId: string;
  user: PublicUser;
  room: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Media upload request payload
 */
export interface UploadMediaRequest {
  url: string;
  type: MediaType;
  userId: string;
  roomId: string;
}

/**
 * Simple media upload request payload
 */
export interface SimpleMediaUploadRequest {
  userId: string;
  roomId: string;
  fileUrl: string;
  fileType: 'image' | 'video';
}

/**
 * Media update request payload
 */
export interface UpdateMediaRequest {
  url?: string;
  type?: MediaType;
}

// ============================================================================
// AI INTERFACES
// ============================================================================

/**
 * AI query request payload
 */
export interface AIQueryRequest {
  userId: string;
  query: string;
}

/**
 * AI query response structure
 */
export interface AIQueryResponse extends BaseEntity {
  query: string;
  response: any; // JSON response from AI
  userId: string;
  user: PublicUser;
}

// ============================================================================
// WEBSOCKET INTERFACES
// ============================================================================

/**
 * WebSocket connection configuration
 */
export interface WebSocketConfig {
  url: string;
  auth?: {
    token: string;
  };
  secure?: boolean;
}

/**
 * Base WebSocket event payload
 */
export interface BaseWebSocketEvent {
  room_id: string;
  user_id: string;
}

/**
 * Join room WebSocket event
 */
export interface JoinRoomEvent extends BaseWebSocketEvent {}

/**
 * Leave room WebSocket event
 */
export interface LeaveRoomEvent extends BaseWebSocketEvent {}

/**
 * Send message WebSocket event
 */
export interface SendMessageEvent extends BaseWebSocketEvent {
  content: string;
}

/**
 * Typing indicator WebSocket event
 */
export interface TypingEvent extends BaseWebSocketEvent {
  is_typing: boolean;
}

/**
 * Get room info WebSocket event
 */
export interface GetRoomInfoEvent {
  room_id: string;
}

/**
 * User joined room WebSocket response
 */
export interface UserJoinedEvent {
  user_id: string;
  username: string;
  message: string;
}

/**
 * User left room WebSocket response
 */
export interface UserLeftEvent {
  user_id: string;
  username: string;
  message: string;
}

/**
 * New message WebSocket response
 */
export interface NewMessageEvent {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  user: PublicUser;
  sent_at: string;
}

/**
 * User typing WebSocket response
 */
export interface UserTypingEvent {
  user_id: string;
  username: string;
  is_typing: boolean;
}

/**
 * Room info WebSocket response
 */
export interface RoomInfoEvent {
  room: DetailedRoom;
}

/**
 * WebSocket error response
 */
export interface WebSocketError {
  message: string;
  code?: string;
}

// ============================================================================
// VALIDATION INTERFACES
// ============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Field validation rules
 */
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => boolean;
  message?: string;
}

/**
 * Form schema for validation
 */
export interface FormSchema {
  [field: string]: ValidationRules;
}

// ============================================================================
// API CLIENT INTERFACES
// ============================================================================

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

/**
 * API client interface definition
 */
export interface IApiClient {
  // Authentication methods
  register(data: RegisterUserRequest): Promise<AuthResponse>;
  login(data: LoginRequest): Promise<AuthResponse>;
  getProfile(): Promise<User>;
  getProfileById(userId: string): Promise<User>;
  
  // User management methods
  getUsers(params?: PaginationParams): Promise<User[]>;
  getUserById(userId: string): Promise<User>;
  getPublicProfile(userId: string): Promise<PublicUser>;
  updateUser(userId: string, data: UpdateUserRequest): Promise<User>;
  deleteUser(userId: string): Promise<{ message: string }>;
  
  // Room management methods
  getRooms(): Promise<Room[]>;
  getRoomById(roomId: string): Promise<DetailedRoom>;
  createRoom(data: CreateRoomRequest): Promise<Room>;
  updateRoom(roomId: string, data: UpdateRoomRequest): Promise<Room>;
  deleteRoom(roomId: string): Promise<{ message: string }>;
  joinRoom(roomId: string, data: JoinRoomRequest): Promise<JoinRoomResponse>;
  
  // Message methods
  getRoomMessages(roomId: string, params?: PaginationParams): Promise<Message[]>;
  sendMessage(roomId: string, data: SendMessageRequest): Promise<MessageResponse>;
  
  // Media methods
  getAllMedia(params?: PaginationParams): Promise<Media[]>;
  getMediaById(mediaId: string): Promise<Media>;
  getRoomMedia(roomId: string, params?: PaginationParams): Promise<Media[]>;
  getUserMedia(userId: string, params?: PaginationParams): Promise<Media[]>;
  uploadMedia(data: UploadMediaRequest): Promise<Media>;
  uploadSimpleMedia(data: SimpleMediaUploadRequest): Promise<Media>;
  updateMedia(mediaId: string, data: UpdateMediaRequest): Promise<Media>;
  deleteMedia(mediaId: string): Promise<{ message: string }>;
  
  // AI methods
  submitQuery(data: AIQueryRequest): Promise<AIQueryResponse>;
  getQueries(params?: PaginationParams): Promise<AIQueryResponse[]>;
  getUserQueries(userId: string, params?: PaginationParams): Promise<AIQueryResponse[]>;
  getQueryById(queryId: string): Promise<AIQueryResponse>;
}

/**
 * WebSocket manager interface definition
 */
export interface IWebSocketManager {
  connect(config: WebSocketConfig): void;
  disconnect(): void;
  isConnected(): boolean;
  
  // Room operations
  joinRoom(roomId: string, userId: string): void;
  leaveRoom(roomId: string, userId: string): void;
  getRoomInfo(roomId: string): void;
  
  // Message operations
  sendMessage(roomId: string, userId: string, content: string): void;
  setTyping(roomId: string, userId: string, isTyping: boolean): void;
  
  // Event listeners
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler?: (data: any) => void): void;
  emit(event: string, data?: any): void;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Email verification request interface
 */
export interface SendVerificationRequest {
  email: string;
}

/**
 * Email verification response interface
 */
export interface SendVerificationResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

/**
 * Verify email request interface
 */
export interface VerifyEmailRequest {
  token: string;
  email?: string; // optional for additional validation
}

/**
 * Verify email response interface
 */
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
  };
}

/**
 * Resend verification request interface
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Resend verification response interface
 */
export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number; // if rate limited
}

/**
 * Forgot password request interface
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Forgot password response interface
 */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string; // Always success message for security
  expiresIn?: number; // only if email exists
}

/**
 * Verify reset token request interface
 */
export interface VerifyResetTokenRequest {
  token: string;
}

/**
 * Verify reset token response interface
 */
export interface VerifyResetTokenResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  expiresAt?: string;
  email?: string; // masked email like "j***@example.com"
}

/**
 * Reset password request interface
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Reset password response interface
 */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    passwordChangedAt: string;
  };
}

/**
 * Change password request interface (authenticated)
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change password response interface
 */
export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  passwordChangedAt: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract keys from type that are optional
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Extract keys from type that are required
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Omit base entity fields for create operations
 */
export type CreateEntity<T extends BaseEntity> = Omit<T, keyof BaseEntity>;

/**
 * Omit base entity fields and make all others optional for update operations
 */
export type UpdateEntity<T extends BaseEntity> = Partial<Omit<T, keyof BaseEntity>>;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    OAUTH_CALLBACK: '/auth/oauth/callback',
    PROFILE: '/auth/profile',
    PROFILE_BY_ID: (id: string) => `/auth/profile/${id}`,
    // Email verification endpoints
    SEND_VERIFICATION: '/auth/send-verification',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    // Password reset endpoints
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PUBLIC: (id: string) => `/users/${id}/public`,
  },
  
  // Rooms
  ROOMS: {
    BASE: '/rooms',
    BY_ID: (id: string) => `/rooms/${id}`,
    JOIN: (id: string) => `/rooms/${id}/join`,
    MESSAGES: (id: string) => `/rooms/${id}/messages`,
  },
  
  // Media
  MEDIA: {
    BASE: '/media',
    BY_ID: (id: string) => `/media/${id}`,
    UPLOAD: '/media/upload',
    ROOM: (roomId: string) => `/media/room/${roomId}`,
    USER: (userId: string) => `/media/user/${userId}`,
  },
  
  // AI
  AI: {
    QUERY: '/ai/query',
    QUERIES: '/ai/queries',
    USER_QUERIES: (userId: string) => `/ai/users/${userId}/queries`,
    QUERY_BY_ID: (id: string) => `/ai/queries/${id}`,
  },
} as const;

/**
 * WebSocket event constants
 */
export const WS_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Client to server events
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'send-message',
  TYPING: 'typing',
  GET_ROOM_INFO: 'get-room-info',
  
  // Server to client events
  JOINED_ROOM: 'joined-room',
  LEFT_ROOM: 'left-room',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  NEW_MESSAGE: 'new-message',
  USER_TYPING: 'user-typing',
  ROOM_INFO: 'room-info',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  API_TIMEOUT: 30000, // Increased to 30 seconds for slow backend responses
  API_RETRIES: 3,
  PAGINATION_TAKE: 20,
  PAGINATION_MAX_TAKE: 100,
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 1000,
} as const;
