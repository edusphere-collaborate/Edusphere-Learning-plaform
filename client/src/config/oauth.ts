/**
 * OAuth Configuration and Utility Functions
 * Handles Google and GitHub OAuth authentication flows
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

// OAuth provider configuration interface
interface OAuthProvider {
  clientId: string;
  authUrl: string;
  scope: string;
  responseType: string;
  redirectUri: string;
}

// OAuth configuration class following OOP principles
export class OAuthConfig {
  private static instance: OAuthConfig;
  private providers: Map<string, OAuthProvider> = new Map();

  /**
   * Singleton pattern implementation for OAuth configuration
   * Ensures single instance across the application
   */
  private constructor() {
    this.initializeProviders();
  }

  /**
   * Get singleton instance of OAuth configuration
   * @returns {OAuthConfig} OAuth configuration instance
   */
  public static getInstance(): OAuthConfig {
    if (!OAuthConfig.instance) {
      OAuthConfig.instance = new OAuthConfig();
    }
    return OAuthConfig.instance;
  }

  /**
   * Initialize OAuth providers with environment variables
   * Sets up Google and GitHub OAuth configurations
   */
  private initializeProviders(): void {
    // Get environment variables with fallback values
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || 'http://localhost:5174/auth/callback';

    // Google OAuth configuration
    this.providers.set('google', {
      clientId: googleClientId,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scope: 'openid email profile',
      responseType: 'code',
      redirectUri: redirectUri,
    });

    // GitHub OAuth configuration
    this.providers.set('github', {
      clientId: githubClientId,
      authUrl: 'https://github.com/login/oauth/authorize',
      scope: 'user:email read:user',
      responseType: 'code',
      redirectUri: redirectUri,
    });
  }

  /**
   * Get OAuth provider configuration
   * @param {string} provider - Provider name (google|github)
   * @returns {OAuthProvider | null} Provider configuration or null
   */
  public getProvider(provider: string): OAuthProvider | null {
    return this.providers.get(provider.toLowerCase()) || null;
  }

  /**
   * Generate OAuth authorization URL with state parameter for CSRF protection
   * @param {string} provider - Provider name (google|github)
   * @param {string} flow - OAuth flow type ('login' | 'register')
   * @returns {string} Complete OAuth authorization URL
   */
  public generateAuthUrl(provider: string, flow: 'login' | 'register' = 'login'): string {
    const config = this.getProvider(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' not configured`);
    }

    // Validate client ID is configured
    if (!config.clientId || config.clientId === 'your_google_client_id_here' || config.clientId === 'your_github_client_id_here') {
      throw new Error(`OAuth client ID for '${provider}' is not properly configured. Please set VITE_${provider.toUpperCase()}_CLIENT_ID in your environment variables.`);
    }

    // Generate cryptographically secure state parameter with flow information
    const state = this.generateSecureState();
    const stateData = { state, flow, timestamp: Date.now() };
    
    // Store state with flow information in sessionStorage for later validation
    sessionStorage.setItem(`oauth_state_${provider}`, JSON.stringify(stateData));
    
    // Build OAuth URL parameters
    const baseParams: Record<string, string> = {
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType,
      scope: config.scope,
      state: state,
    };

    // Add provider-specific parameters
    if (provider === 'google') {
      baseParams.access_type = 'offline';
      baseParams.prompt = 'consent';
    } else if (provider === 'github') {
      baseParams.allow_signup = 'true';
    }

    const params = new URLSearchParams(baseParams);

    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Generate cryptographically secure state parameter
   * Used for CSRF protection in OAuth flow
   * @returns {string} Secure random state string
   */
  private generateSecureState(): string {
    // Generate random bytes for state parameter
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    
    // Convert to base64url encoding using Array.from for compatibility
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Validate OAuth state parameter to prevent CSRF attacks
   * @param {string} provider - Provider name (google|github)
   * @param {string} receivedState - State parameter received from OAuth callback
   * @returns {Object} Validation result with flow information
   */
  public validateState(provider: string, receivedState: string): { 
    isValid: boolean; 
    flow: 'login' | 'register' | null;
  } {
    const storedStateData = sessionStorage.getItem(`oauth_state_${provider}`);
    
    // Clean up stored state after validation
    sessionStorage.removeItem(`oauth_state_${provider}`);
    
    if (!storedStateData) {
      return { isValid: false, flow: null };
    }

    try {
      const { state: storedState, flow } = JSON.parse(storedStateData);
      const isValid = storedState === receivedState && receivedState.length > 0;
      return { isValid, flow: isValid ? flow : null };
    } catch (error) {
      // Fallback for old state format (backwards compatibility)
      const isValid = storedStateData === receivedState && receivedState.length > 0;
      return { isValid, flow: isValid ? 'login' : null };
    }
  }

  /**
   * Parse OAuth callback URL parameters
   * Extracts code, state, and error from callback URL
   * @param {string} url - Callback URL with parameters
   * @returns {Object} Parsed OAuth callback parameters
   */
  public parseCallbackUrl(url: string): {
    code: string | null;
    state: string | null;
    error: string | null;
    errorDescription: string | null;
  } {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      code: params.get('code'),
      state: params.get('state'),
      error: params.get('error'),
      errorDescription: params.get('error_description'),
    };
  }

  /**
   * Check if OAuth provider is properly configured
   * @param {string} provider - Provider name (google|github)
   * @returns {boolean} True if provider is configured, false otherwise
   */
  public isProviderConfigured(provider: string): boolean {
    const config = this.getProvider(provider);
    if (!config) return false;

    // Check if client ID is set and not placeholder
    const isValidClientId = Boolean(config.clientId && 
           config.clientId !== 'your_google_client_id_here' && 
           config.clientId !== 'your_github_client_id_here');
    
    return isValidClientId;
  }

  /**
   * Get list of configured OAuth providers
   * @returns {string[]} Array of configured provider names
   */
  public getConfiguredProviders(): string[] {
    const configured: string[] = [];
    
    // Use Array.from to iterate over Map entries for TypeScript compatibility
    Array.from(this.providers.entries()).forEach(([provider]) => {
      if (this.isProviderConfigured(provider)) {
        configured.push(provider);
      }
    });
    
    return configured;
  }

  /**
   * Extract user data from OAuth provider token
   * @param {string} provider - Provider name (google|github)
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Object>} User data from provider
   */
  public async extractUserData(provider: string, accessToken: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  }> {
    const config = this.getProvider(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' not configured`);
    }

    let userApiUrl: string;
    
    // Set provider-specific user API endpoints
    switch (provider.toLowerCase()) {
      case 'google':
        userApiUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
        break;
      case 'github':
        userApiUrl = 'https://api.github.com/user';
        break;
      default:
        throw new Error(`User data extraction not supported for provider: ${provider}`);
    }

    try {
      // Fetch user data from provider API
      const response = await fetch(userApiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data from ${provider}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Normalize user data across providers
      return this.normalizeUserData(provider, userData);
    } catch (error: any) {
      throw new Error(`Failed to extract user data from ${provider}: ${error.message}`);
    }
  }

  /**
   * Normalize user data from different OAuth providers
   * @param {string} provider - Provider name
   * @param {any} userData - Raw user data from provider
   * @returns {Object} Normalized user data
   */
  private normalizeUserData(provider: string, userData: any): {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  } {
    switch (provider.toLowerCase()) {
      case 'google':
        return {
          email: userData.email || '',
          firstName: userData.given_name || '',
          lastName: userData.family_name || '',
          username: userData.email?.split('@')[0] || '',
          avatar: userData.picture,
        };
      
      case 'github':
        const fullName = userData.name || '';
        const nameParts = fullName.split(' ');
        return {
          email: userData.email || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          username: userData.login || '',
          avatar: userData.avatar_url,
        };
      
      default:
        throw new Error(`User data normalization not supported for provider: ${provider}`);
    }
  }
}

// Export singleton instance for easy access
export const oauthConfig = OAuthConfig.getInstance();

// OAuth error types for better error handling
export enum OAuthError {
  ACCESS_DENIED = 'access_denied',
  INVALID_REQUEST = 'invalid_request',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
}

// OAuth error messages mapping
export const OAuthErrorMessages: Record<string, string> = {
  [OAuthError.ACCESS_DENIED]: 'You cancelled the login process',
  [OAuthError.INVALID_REQUEST]: 'Invalid OAuth request',
  [OAuthError.INVALID_CLIENT]: 'Invalid OAuth client configuration',
  [OAuthError.INVALID_GRANT]: 'Invalid authorization grant',
  [OAuthError.UNAUTHORIZED_CLIENT]: 'Unauthorized OAuth client',
  [OAuthError.UNSUPPORTED_GRANT_TYPE]: 'Unsupported grant type',
  [OAuthError.INVALID_SCOPE]: 'Invalid OAuth scope',
  [OAuthError.SERVER_ERROR]: 'OAuth server error',
  [OAuthError.TEMPORARILY_UNAVAILABLE]: 'OAuth service temporarily unavailable',
};
