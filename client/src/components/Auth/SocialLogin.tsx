import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

  // Handle Google OAuth login via backend
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      // Get backend API URL
      const backendUrl = import.meta.env.VITE_API_URL || 'https://edusphere-backend-n1r8.onrender.com';
      const flowText = flow === 'register' ? 'registration' : 'authentication';
      
      toast({ 
        title: "Redirecting to Google", 
        description: `You will be redirected to Google for ${flowText}.` 
      });
      
      // Redirect to backend OAuth endpoint
      window.location.href = `${backendUrl}/auth/google?flow=${flow}`;
      
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to initiate Google login",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  // Handle GitHub OAuth login via backend
  const handleGithubLogin = async () => {
    setGithubLoading(true);
    
    try {
      // Get backend API URL
      const backendUrl = import.meta.env.VITE_API_URL || 'https://edusphere-backend-n1r8.onrender.com';
      const flowText = flow === 'register' ? 'registration' : 'authentication';
      
      toast({
        title: "Redirecting to GitHub",
        description: `You will be redirected to GitHub for ${flowText}.`,
      });
      
      // Redirect to backend OAuth endpoint
      window.location.href = `${backendUrl}/auth/github?flow=${flow}`;
      
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

// Hook for handling OAuth redirect from backend
export function useOAuthRedirect() {
  const { toast } = useToast();

  /**
   * Handle OAuth redirect from backend with token
   * Backend redirects to: /auth/success?token=jwt_token&user=encoded_user_data
   */
  const handleOAuthRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    const error = urlParams.get('error');

    // Handle OAuth errors from backend
    if (error) {
      toast({
        title: "Authentication Failed",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      // Redirect to login page
      window.location.href = '/login';
      return;
    }

    // Handle successful authentication
    if (token && userData) {
      try {
        // Parse user data
        const user = JSON.parse(decodeURIComponent(userData));
        
        // Store authentication data
        localStorage.setItem('sessionId', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Show success message
        toast({
          title: "Login Successful",
          description: `Welcome ${user.firstName}! You've successfully logged in.`,
        });

        // Redirect to dashboard
        window.location.href = '/rooms';
        
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError);
        toast({
          title: "Authentication Error",
          description: 'Failed to process authentication data.',
          variant: "destructive",
        });
        window.location.href = '/login';
      }
    } else {
      toast({
        title: "Authentication Error",
        description: 'Missing authentication data from backend.',
        variant: "destructive",
      });
      window.location.href = '/login';
    }
  };

  return { handleOAuthRedirect };
}
