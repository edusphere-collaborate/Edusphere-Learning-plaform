/**
 * EduSphere API Configuration
 * Centralized configuration for API endpoints and settings
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready API configuration with environment-based settings
 */

/**
 * Environment-based API configuration
 */
export const API_CONFIG = {
  // Base URLs
  BASE_URL: import.meta.env.VITE_API_URL || 'https://edusphere-backend-n1r8.onrender.com',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // Timeouts and limits
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10),
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRIES || '3', 10),
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache settings
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // WebSocket settings
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY: 1000,
  WS_HEARTBEAT_INTERVAL: 30000,
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'],
  
  // Security settings
  TOKEN_STORAGE_KEY: 'edusphere_auth_token',
  USER_STORAGE_KEY: 'edusphere_user',
  
  // Feature flags
  FEATURES: {
    REAL_TIME_CHAT: true,
    FILE_UPLOAD: true,
    AI_ASSISTANT: true,
    NOTIFICATIONS: true,
    OFFLINE_MODE: false,
  },
} as const;

/**
 * API endpoint paths
 */
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    PROFILE_BY_ID: (id: string) => `/auth/profile/${id}`,
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PUBLIC: (id: string) => `/users/${id}/public`,
    SEARCH: '/users/search',
  },
  
  // Rooms
  ROOMS: {
    BASE: '/rooms',
    BY_ID: (id: string) => `/rooms/${id}`,
    JOIN: (id: string) => `/rooms/${id}/join`,
    LEAVE: (id: string) => `/rooms/${id}/leave`,
    MESSAGES: (id: string) => `/rooms/${id}/messages`,
    MEDIA: (id: string) => `/rooms/${id}/media`,
    USERS: (id: string) => `/rooms/${id}/users`,
  },
  
  // Messages
  MESSAGES: {
    BASE: '/messages',
    BY_ID: (id: string) => `/messages/${id}`,
    EDIT: (id: string) => `/messages/${id}`,
    DELETE: (id: string) => `/messages/${id}`,
  },
  
  // Media
  MEDIA: {
    BASE: '/media',
    BY_ID: (id: string) => `/media/${id}`,
    UPLOAD: '/media/upload',
    ROOM: (roomId: string) => `/media/room/${roomId}`,
    USER: (userId: string) => `/media/user/${userId}`,
  },
  
  // AI Assistant
  AI: {
    QUERY: '/ai/aiquery',
    QUERIES: '/ai/queries',
    QUERY_BY_ID: (id: string) => `/ai/queries/${id}`,
    USER_QUERIES: (userId: string) => `/ai/users/${userId}/queries`,
    HISTORY: '/ai/history',
  },
  
  // Search
  SEARCH: {
    GLOBAL: '/search',
    ROOMS: '/search/rooms',
    USERS: '/search/users',
    MESSAGES: '/search/messages',
  },
  
  // Health check
  HEALTH: '/health',
} as const;

/**
 * WebSocket event names
 */
export const WS_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',
  
  // Authentication events
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  UNAUTHORIZED: 'unauthorized',
  
  // Room events
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  JOINED_ROOM: 'joined-room',
  LEFT_ROOM: 'left-room',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ROOM_INFO: 'room-info',
  
  // Message events
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  
  // Typing events
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  USER_TYPING: 'user-typing',
  
  // Presence events
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  PRESENCE_UPDATE: 'presence-update',
  
  // Media events
  MEDIA_UPLOADED: 'media-uploaded',
  MEDIA_DELETED: 'media-deleted',
  
  // Notification events
  NOTIFICATION: 'notification',
  
  // System events
  SYSTEM_MESSAGE: 'system-message',
  MAINTENANCE: 'maintenance',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  MAINTENANCE: 'The service is temporarily unavailable for maintenance.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTER_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  ROOM_CREATED: 'Room created successfully!',
  ROOM_JOINED: 'Joined room successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  EMAIL: {
    MAX_LENGTH: 50,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  ROOM_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000,
  },
  DESCRIPTION: {
    MAX_LENGTH: 255,
  },
} as const;

/**
 * Media configuration
 */
export const MEDIA_CONFIG = {
  UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
      DOCUMENT: ['application/pdf', 'text/plain'],
    },
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  },
  PREVIEW: {
    IMAGE_MAX_WIDTH: 800,
    IMAGE_MAX_HEIGHT: 600,
    VIDEO_THUMBNAIL_TIME: 1, // 1 second
  },
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  THEME: {
    DEFAULT: 'light',
    STORAGE_KEY: 'edusphere_theme',
  },
  SIDEBAR: {
    DEFAULT_WIDTH: 280,
    MIN_WIDTH: 200,
    MAX_WIDTH: 400,
  },
  CHAT: {
    MESSAGE_BATCH_SIZE: 50,
    TYPING_TIMEOUT: 3000,
    SCROLL_THRESHOLD: 100,
  },
  NOTIFICATIONS: {
    DEFAULT_DURATION: 5000,
    MAX_NOTIFICATIONS: 5,
  },
} as const;

/**
 * Development configuration
 */
export const DEV_CONFIG = {
  ENABLE_LOGGING: import.meta.env.MODE === 'development',
  ENABLE_REDUX_DEVTOOLS: import.meta.env.MODE === 'development',
  DEBUG_WEBSOCKET: import.meta.env.VITE_DEBUG_WS === 'true',
} as const;

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
      ENABLE_LOGGING: true,
      ENABLE_DEVTOOLS: true,
    },
    production: {
      API_URL: import.meta.env.VITE_API_URL || 'https://api.edusphere.com',
      WS_URL: import.meta.env.VITE_WS_URL || 'wss://ws.edusphere.com',
      ENABLE_LOGGING: false,
      ENABLE_DEVTOOLS: false,
    },
    test: {
      API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
      ENABLE_LOGGING: false,
      ENABLE_DEVTOOLS: false,
    },
  };
  
  return configs[env as keyof typeof configs] || configs.development;
}

/**
 * Build full API URL
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Build WebSocket URL
 * @param path - WebSocket path (optional)
 * @returns Full WebSocket URL
 */
export function buildWsUrl(path?: string): string {
  const baseUrl = API_CONFIG.WS_URL.replace(/\/$/, '');
  if (!path) return baseUrl;
  const wsPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${wsPath}`;
}

/**
 * Check if running in development mode
 * @returns boolean indicating development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if running in production mode
 * @returns boolean indicating production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get feature flag value
 * @param feature - Feature name
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof API_CONFIG.FEATURES): boolean {
  return API_CONFIG.FEATURES[feature];
}
