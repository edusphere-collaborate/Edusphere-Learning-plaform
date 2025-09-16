/**
 * CORS Configuration for EduSphere Frontend
 * Professional CORS handling for cross-origin API requests
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready CORS configuration with security best practices
 */

/**
 * CORS configuration options for API requests
 */
export interface CorsConfig {
  // Allowed origins for CORS requests
  allowedOrigins: string[];
  // Allowed HTTP methods
  allowedMethods: string[];
  // Allowed request headers
  allowedHeaders: string[];
  // Whether to include credentials in requests
  credentials: boolean;
  // Maximum age for preflight cache
  maxAge: number;
}

/**
 * Default CORS configuration for development and production
 */
export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'http://localhost:3000',  // React dev server
    'http://localhost:3001',  // Backend server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    import.meta.env.VITE_API_URL || 'http://localhost:3001',
    import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  ],
  allowedMethods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD',
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'X-HTTP-Method-Override',
  ],
  credentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * Get CORS-compliant request headers
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CORS configuration
 */
export function getCorsHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  };
}

/**
 * Get CORS-compliant fetch options
 * @param options - Base fetch options
 * @returns Fetch options with CORS configuration
 */
export function getCorsOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    mode: 'cors',
    credentials: 'omit', // Changed from 'include' to avoid credentials header issue
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  };
}

/**
 * Check if origin is allowed for CORS requests
 * @param origin - Origin to check
 * @param config - CORS configuration
 * @returns True if origin is allowed
 */
export function isOriginAllowed(origin: string, config: CorsConfig = DEFAULT_CORS_CONFIG): boolean {
  return config.allowedOrigins.includes(origin) || config.allowedOrigins.includes('*');
}

/**
 * Create preflight request headers for complex CORS requests
 * @param method - HTTP method for the actual request
 * @param headers - Headers for the actual request
 * @returns Preflight headers
 */
export function getPreflightHeaders(method: string, headers: string[]): Record<string, string> {
  return {
    'Access-Control-Request-Method': method,
    'Access-Control-Request-Headers': headers.join(', '),
    'Origin': window.location.origin,
  };
}

/**
 * Handle CORS preflight response validation
 * @param response - Preflight response
 * @param config - CORS configuration
 * @returns True if preflight is valid
 */
export function validatePreflightResponse(response: Response, config: CorsConfig = DEFAULT_CORS_CONFIG): boolean {
  const allowedMethods = response.headers.get('Access-Control-Allow-Methods');
  const allowedHeaders = response.headers.get('Access-Control-Allow-Headers');
  const allowCredentials = response.headers.get('Access-Control-Allow-Credentials');

  // Check if required methods are allowed
  const methodsValid = allowedMethods && 
    config.allowedMethods.every(method => allowedMethods.includes(method));

  // Check if required headers are allowed
  const headersValid = allowedHeaders && 
    config.allowedHeaders.every(header => allowedHeaders.toLowerCase().includes(header.toLowerCase()));

  // Check if credentials are allowed
  const credentialsValid = !config.credentials || allowCredentials === 'true';

  return !!(methodsValid && headersValid && credentialsValid);
}

/**
 * CORS error handler for failed requests
 * @param error - Original error
 * @param url - Request URL
 * @returns Enhanced error with CORS information
 */
export function handleCorsError(error: Error, url: string): Error {
  const corsError = new Error(`CORS error for ${url}: ${error.message}`);
  corsError.name = 'CORSError';
  corsError.stack = error.stack;
  
  // Add helpful debugging information
  console.error('CORS Configuration Debug Info:', {
    requestOrigin: window.location.origin,
    targetUrl: url,
    allowedOrigins: DEFAULT_CORS_CONFIG.allowedOrigins,
    error: error.message,
  });

  return corsError;
}
