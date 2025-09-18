/**
 * OAuth Authentication Callback Page
 * Handles Google and GitHub OAuth callback processing
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { oauthConfig, OAuthErrorMessages } from '@/config/oauth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * OAuth callback processing states
 */
type CallbackState = 'processing' | 'success' | 'error' | 'invalid';

/**
 * OAuth callback page component
 * Processes OAuth authentication callbacks from Google and GitHub
 */
export default function AuthCallback() {
  // Component state management
  const [state, setState] = useState<CallbackState>('processing');
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [, setLocation] = useLocation();
  
  // Auth context and toast hook
  const { login } = useAuth();
  const { toast } = useToast();

  /**
   * Handle OAuth registration flow with user data extraction
   * @param {string} provider - OAuth provider name
   * @param {string} code - Authorization code from OAuth callback
   */
  const handleOAuthRegistration = async (provider: 'google' | 'github', code: string) => {
    try {
      // TODO: Exchange code for access token (requires backend API)
      // For now, simulate token exchange and user data extraction
      
      // In a real implementation, you would:
      // 1. Send code to backend API to exchange for access token
      // 2. Backend would fetch user data from OAuth provider
      // 3. Return normalized user data to frontend
      
      // Simulate user data extraction for demo purposes
      const mockUserData = {
        email: `user@${provider}.com`,
        firstName: 'OAuth',
        lastName: 'User',
        username: `${provider}_user`,
        avatar: undefined
      };

      // Store user data in sessionStorage for registration form
      sessionStorage.setItem('oauth_user_data', JSON.stringify(mockUserData));
      
      setState('success');
      toast({
        title: "Account Information Retrieved",
        description: "Your profile information has been extracted. You will be redirected to complete registration.",
      });

      // Redirect to registration page after brief success display
      setTimeout(() => {
        setLocation('/register');
      }, 2000);

    } catch (error: any) {
      setState('error');
      setError(`Registration failed: ${error.message}`);
    }
  };

  /**
   * Handle OAuth login flow
   * @param {string} provider - OAuth provider name
   * @param {Function} onSuccess - Success callback function
   */
  const handleOAuthCallback = async (provider: 'google' | 'github', onSuccess: () => void) => {
    try {
      // TODO: Implement actual OAuth login with backend API
      // For now, simulate successful login
      
      toast({
        title: "Login Successful",
        description: `Successfully authenticated with ${provider}`,
      });

      onSuccess();
    } catch (error: any) {
      setState('error');
      setError(`Login failed: ${error.message}`);
    }
  };

  /**
   * Process OAuth callback on component mount
   * Determines provider and handles authentication flow
   */
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse current URL to extract callback parameters
        const callbackData = oauthConfig.parseCallbackUrl(window.location.href);
        const { code, state: stateParam, error: oauthError } = callbackData;

        // Determine OAuth provider from stored state or URL
        const detectedProvider = detectProviderFromCallback();
        setProvider(detectedProvider);

        // Handle OAuth error responses
        if (oauthError) {
          setState('error');
          const errorMessage = OAuthErrorMessages[oauthError] || `Authentication failed: ${oauthError}`;
          setError(errorMessage);
          return;
        }

        // Check if provider is properly configured before processing
        const providerStatus = oauthConfig.getProviderStatus(detectedProvider);
        if (!providerStatus.isConfigured) {
          setState('error');
          setError(providerStatus.error || 'OAuth provider not configured properly');
          return;
        }

        // Validate state parameter for CSRF protection and get flow information
        if (!stateParam) {
          setState('error');
          setError('Missing state parameter. This may be a security issue.');
          return;
        }

        const stateValidation = oauthConfig.validateState(detectedProvider, stateParam);
        if (!stateValidation.isValid) {
          setState('error');
          setError('Invalid state parameter. This may be a security issue.');
          return;
        }

        const flow = stateValidation.flow || 'login';

        // Validate required parameters are present
        if (!code || !stateParam) {
          setState('invalid');
          setError('Missing required OAuth parameters');
          return;
        }

        // Validate provider is supported
        if (!detectedProvider || !['google', 'github'].includes(detectedProvider)) {
          setState('invalid');
          setError('Unsupported OAuth provider');
          return;
        }

        // Process OAuth callback with flow-specific handling
        if (flow === 'register') {
          // Handle registration flow with user data extraction
          handleOAuthRegistration(detectedProvider as 'google' | 'github', code);
        } else {
          // Handle login flow
          handleOAuthCallback(detectedProvider as 'google' | 'github', () => {
            setState('success');
            // Redirect to dashboard after brief success display
            setTimeout(() => {
              setLocation('/rooms');
            }, 2000);
          });
        }

      } catch (error: any) {
        console.error('OAuth callback processing error:', error);
        setState('error');
        setError(error.message || 'Failed to process OAuth callback');
      }
    };

    // Start processing callback
    processCallback();
  }, [handleOAuthCallback, setLocation]);

  /**
   * Detect OAuth provider from callback URL or stored state
   * @returns {string} Detected provider name
   */
  const detectProviderFromCallback = (): string => {
    // Check for stored state parameters
    const googleState = sessionStorage.getItem('oauth_state_google');
    const githubState = sessionStorage.getItem('oauth_state_github');
    
    if (googleState) return 'google';
    if (githubState) return 'github';
    
    // Fallback: detect from referrer or URL patterns
    const referrer = document.referrer.toLowerCase();
    if (referrer.includes('google.com') || referrer.includes('accounts.google.com')) {
      return 'google';
    }
    if (referrer.includes('github.com')) {
      return 'github';
    }
    
    return '';
  };

  /**
   * Handle manual redirect to login page
   */
  const handleReturnToLogin = () => {
    setLocation('/login');
  };

  /**
   * Handle manual redirect to dashboard
   */
  const handleGoToDashboard = () => {
    setLocation('/rooms');
  };

  /**
   * Render callback state UI
   */
  const renderCallbackState = () => {
    switch (state) {
      case 'processing':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Processing Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {provider ? `Completing ${provider.charAt(0).toUpperCase() + provider.slice(1)} login...` : 'Processing OAuth callback...'}
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Authentication Successful!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome! You've successfully logged in with {provider.charAt(0).toUpperCase() + provider.slice(1)}.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
            <Button onClick={handleGoToDashboard} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Authentication Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {error || 'An error occurred during authentication'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleReturnToLogin}>
                Try Again
              </Button>
              <Button onClick={handleGoToDashboard}>
                Continue to Dashboard
              </Button>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invalid Callback
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {error || 'The OAuth callback URL is invalid or malformed'}
              </p>
            </div>
            <Button onClick={handleReturnToLogin}>
              Return to Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EduSphere Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderCallbackState()}
        </CardContent>
      </Card>
    </div>
  );
}
