/**
 * EduSphere API Fallback Handler
 * Professional fallback mechanism for API connectivity issues
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready API fallback system for handling DevTunnel authentication
 *              and connectivity issues with graceful degradation
 */

import { ApiClientConfig } from '@/types/api';

/**
 * API endpoint configuration with fallback support
 */
export interface ApiEndpointConfig {
  primary: string;
  fallback: string;
  timeout: number;
  retries: number;
}

/**
 * Default API endpoint configurations
 */
export const API_ENDPOINTS_CONFIG: Record<string, ApiEndpointConfig> = {
  production: {
    primary: 'https://474t8p91-3000.uks1.devtunnels.ms',
    fallback: 'http://localhost:3000',
    timeout: 10000,
    retries: 3,
  },
  development: {
    primary: 'http://localhost:3000',
    fallback: 'http://127.0.0.1:3000',
    timeout: 5000,
    retries: 2,
  },
  staging: {
    primary: 'https://staging-api.edusphere.com',
    fallback: 'http://localhost:3000',
    timeout: 8000,
    retries: 3,
  },
};

/**
 * Connection test result interface
 */
export interface ConnectionTestResult {
  url: string;
  success: boolean;
  responseTime: number;
  error?: string;
  statusCode?: number;
}

/**
 * API Fallback Manager for handling connectivity issues
 */
export class ApiFallbackManager {
  private currentEndpoint: string;
  private fallbackEndpoint: string;
  private testCache: Map<string, ConnectionTestResult> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor(
    private config: ApiEndpointConfig = API_ENDPOINTS_CONFIG.development
  ) {
    this.currentEndpoint = config.primary;
    this.fallbackEndpoint = config.fallback;
  }

  /**
   * Test API endpoint connectivity
   * @param url - API endpoint URL to test
   * @returns Connection test result
   */
  public async testConnection(url: string): Promise<ConnectionTestResult> {
    // Check cache first
    const cached = this.testCache.get(url);
    if (cached && Date.now() - cached.responseTime < this.cacheTimeout) {
      return cached;
    }

    const startTime = Date.now();
    
    try {
      // Test with a simple health check or OPTIONS request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${url}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result: ConnectionTestResult = {
        url,
        success: response.ok || response.status < 500, // Accept 4xx as "reachable"
        responseTime,
        statusCode: response.status,
      };

      // Cache the result
      this.testCache.set(url, result);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ConnectionTestResult = {
        url,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Cache failed result for shorter time
      this.testCache.set(url, { ...result, responseTime: Date.now() - this.cacheTimeout / 2 });
      return result;
    }
  }

  /**
   * Get the best available API endpoint
   * @returns Promise resolving to the best endpoint URL
   */
  public async getBestEndpoint(): Promise<string> {
    // Test primary endpoint first
    const primaryTest = await this.testConnection(this.currentEndpoint);
    
    if (primaryTest.success) {
      console.log('[API FALLBACK] Primary endpoint available:', this.currentEndpoint);
      return this.currentEndpoint;
    }

    // Test fallback endpoint
    const fallbackTest = await this.testConnection(this.fallbackEndpoint);
    
    if (fallbackTest.success) {
      console.log('[API FALLBACK] Using fallback endpoint:', this.fallbackEndpoint);
      return this.fallbackEndpoint;
    }

    // Both endpoints failed, return primary and let error handling deal with it
    console.warn('[API FALLBACK] Both endpoints failed, using primary:', this.currentEndpoint);
    return this.currentEndpoint;
  }

  /**
   * Update API configuration
   * @param config - New API configuration
   */
  public updateConfig(config: ApiEndpointConfig): void {
    this.config = config;
    this.currentEndpoint = config.primary;
    this.fallbackEndpoint = config.fallback;
    this.testCache.clear(); // Clear cache when config changes
  }

  /**
   * Get current endpoint status
   * @returns Object with endpoint status information
   */
  public async getEndpointStatus(): Promise<{
    primary: ConnectionTestResult;
    fallback: ConnectionTestResult;
    recommended: string;
  }> {
    const [primary, fallback] = await Promise.all([
      this.testConnection(this.currentEndpoint),
      this.testConnection(this.fallbackEndpoint),
    ]);

    const recommended = primary.success ? this.currentEndpoint : 
                       fallback.success ? this.fallbackEndpoint : 
                       this.currentEndpoint;

    return { primary, fallback, recommended };
  }

  /**
   * Clear connection test cache
   */
  public clearCache(): void {
    this.testCache.clear();
  }
}

/**
 * Create API client configuration with fallback support
 * @returns Promise resolving to API client configuration
 */
export async function createFallbackApiConfig(): Promise<ApiClientConfig> {
  const environment = import.meta.env.MODE || 'development';
  const config = API_ENDPOINTS_CONFIG[environment] || API_ENDPOINTS_CONFIG.development;
  
  const fallbackManager = new ApiFallbackManager(config);
  const bestEndpoint = await fallbackManager.getBestEndpoint();

  return {
    baseURL: bestEndpoint,
    timeout: config.timeout,
  };
}

/**
 * Global fallback manager instance
 */
export const apiFallbackManager = new ApiFallbackManager(
  API_ENDPOINTS_CONFIG[import.meta.env.MODE || 'development']
);

/**
 * Check if DevTunnel authentication is required
 * @param url - URL to check
 * @returns Promise resolving to boolean indicating if auth is required
 */
export async function checkDevTunnelAuth(url: string): Promise<boolean> {
  if (!url.includes('devtunnels.ms')) {
    return false;
  }

  try {
    const response = await fetch(`${url}/health`, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
    });

    // Check for tunnel authentication requirement
    const wwwAuth = response.headers.get('www-authenticate');
    return response.status === 401 && (wwwAuth?.includes('tunnel') ?? false);
  } catch {
    return false; // Assume no auth required if request fails
  }
}

/**
 * Handle DevTunnel authentication error
 * @param error - Original error
 * @returns Enhanced error with DevTunnel information
 */
export function handleDevTunnelError(error: Error): Error {
  const devTunnelError = new Error(
    `DevTunnel authentication required. Please ensure the tunnel is configured for anonymous access or use localhost for development. Original error: ${error.message}`
  );
  devTunnelError.name = 'DevTunnelAuthError';
  devTunnelError.stack = error.stack;
  
  console.error('DevTunnel Authentication Error:', {
    message: error.message,
    solution: 'Configure tunnel for anonymous access or use localhost',
    documentation: 'https://docs.microsoft.com/en-us/azure/developer/dev-tunnels/',
  });

  return devTunnelError;
}
