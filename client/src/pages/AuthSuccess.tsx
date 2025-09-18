/**
 * OAuth Authentication Success Page
 * Handles backend OAuth redirect with token and user data
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { useEffect } from 'react';
import { useOAuthRedirect } from '@/components/Auth/SocialLogin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * OAuth success page component
 * Processes OAuth authentication success from backend
 */
export default function AuthSuccess() {
  // OAuth redirect handler hook
  const { handleOAuthRedirect } = useOAuthRedirect();

  /**
   * Process OAuth redirect on component mount
   * Extracts token and user data from URL parameters
   */
  useEffect(() => {
    // Process the OAuth redirect from backend
    handleOAuthRedirect();
  }, [handleOAuthRedirect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            EduSphere Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Processing Authentication
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Completing your login and redirecting to dashboard...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
