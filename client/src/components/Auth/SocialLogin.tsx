import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { oauthConfig, OAuthErrorMessages } from '@/config/oauth';
import { GoogleIcon, GitHubIcon } from '@/components/icons';

interface SocialLoginProps {
  isLoading?: boolean;
  onSuccess?: () => void;
  flow?: 'login' | 'register';
  onUserDataExtracted?: (userData: {
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  }) => void;
}

export function SocialLogin({ isLoading = false, onSuccess, flow = 'login', onUserDataExtracted }: SocialLoginProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const { toast } = useToast();

  // Handle Google OAuth login with proper configuration
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      // Check if Google OAuth is properly configured
      const googleStatus = oauthConfig.getProviderStatus('google');
      if (!googleStatus.isConfigured) {
        throw new Error(googleStatus.error || 'Google OAuth configuration error');
      }

      // Generate secure OAuth URL with state parameter
      const authUrl = oauthConfig.generateAuthUrl('google', flow);
      const flowText = flow === 'register' ? 'registration' : 'authentication';
      toast({ title: "Redirecting to Google", description: `You will be redirected to Google for ${flowText}.` });
      window.location.href = authUrl;    
      
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to initiate Google login",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Handle GitHub OAuth login with proper configuration
  const handleGithubLogin = async () => {
    setGithubLoading(true);
    
    try {
      // Check if GitHub OAuth is properly configured
      const githubStatus = oauthConfig.getProviderStatus('github');
      if (!githubStatus.isConfigured) {
        throw new Error(githubStatus.error || 'GitHub OAuth configuration error');
      }

      // Generate secure OAuth URL with state parameter
      const authUrl = oauthConfig.generateAuthUrl('github', flow);
      
      // Show loading toast
      const flowText = flow === 'register' ? 'registration' : 'authentication';
      toast({
        title: "Redirecting to GitHub",
        description: `You will be redirected to GitHub for ${flowText}.`,
      });
      
      // Redirect to GitHub OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      toast({
        title: "GitHub Login Failed",
        description: error.message || "Failed to initiate GitHub login",
        variant: "destructive",
      });
      setGithubLoading(false);
    }
  };

  return (
    <>
      {/* Social Login Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={isLoading || googleLoading || githubLoading}
          onClick={handleGoogleLogin}
          className="relative hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all duration-200"
          data-testid="button-login-google"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <GoogleIcon className="w-4 h-4 mr-2" size={16} />
          )}
          Google
        </Button>
        
        <Button
          variant="outline"
          disabled={isLoading || googleLoading || githubLoading}
          onClick={handleGithubLogin}
          className="relative hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all duration-200"
          data-testid="button-login-github"
        >
          {githubLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <GitHubIcon className="w-4 h-4 mr-2" size={16} />
          )}
          GitHub
        </Button>
      </div>
    </>
  );
}

// Hook for handling OAuth callback with enhanced security
export function useOAuthCallback() {
  const { toast } = useToast();

  /**
   * Handle OAuth callback with proper state validation and error handling
   * @param {string} provider - OAuth provider (google|github)
   * @param {Function} onSuccess - Success callback function
   */
  const handleOAuthCallback = (provider: 'google' | 'github', onSuccess?: () => void) => {
    // Parse callback URL parameters
    const callbackData = oauthConfig.parseCallbackUrl(window.location.href);
    const { code, state, error, errorDescription } = callbackData;

    // Handle OAuth errors
    if (error) {
      const errorMessage = OAuthErrorMessages[error] || errorDescription || `Authentication failed: ${error}`;
      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login Failed`,
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Validate authorization code is present
    if (!code) {
      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login Failed`,
        description: 'No authorization code received from OAuth provider',
        variant: "destructive",
      });
      return;
    }

    // Validate state parameter for CSRF protection
    if (!state || !oauthConfig.validateState(provider, state)) {
      toast({
        title: "Security Error",
        description: 'Invalid state parameter. This may be a security issue.',
        variant: "destructive",
      });
      return;
    }

    // Exchange authorization code for tokens
    exchangeCodeForTokens(provider, code, state, onSuccess);
  };

  /**
   * Exchange authorization code for access tokens via backend API
   * @param {string} provider - OAuth provider name
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} state - State parameter for validation
   * @param {Function} onSuccess - Success callback function
   */
  const exchangeCodeForTokens = async (
    provider: string, 
    code: string, 
    state: string, 
    onSuccess?: () => void
  ) => {
    try {
      // Get API base URL from environment
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Make secure API call to exchange code for tokens
      const response = await fetch(`${apiUrl}/api/auth/${provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify({ 
          code, 
          state,
          redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI || 'http://localhost:5174/auth/callback'
        }),
      });

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'OAuth callback failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: OAuth callback failed`);
      }

      // Parse successful response
      const data = await response.json();
      
      // Store authentication data securely
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome! You've successfully logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
      });

      // Execute success callback or redirect to dashboard
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/rooms';
      }
      
    } catch (error: any) {
      console.error(`OAuth ${provider} callback error:`, error);
      
      toast({
        title: "Authentication Failed",
        description: error.message || 'Failed to complete OAuth login. Please try again.',
        variant: "destructive",
      });
    }
  };

  return { handleOAuthCallback };
}
