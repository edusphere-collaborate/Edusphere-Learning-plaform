import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle, AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailVerification() {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [isResending, setIsResending] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract token from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');
  const email = urlParams.get('email');

  useEffect(() => {
    if (email) {
      setUserEmail(decodeURIComponent(email));
    }

    if (token) {
      verifyEmail(token);
    }
  }, [token, email]);

  // Verify email with backend
  const verifyEmail = async (verificationToken: string) => {
    try {
      // Use the API client for consistent error handling
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.verifyEmail({ 
        token: verificationToken,
        email: userEmail || undefined
      });

      if (response.success) {
        setVerificationStatus('success');
        toast({
          title: "Email Verified Successfully",
          description: response.message || "Your email has been verified. You can now access all features.",
        });
      } else {
        setVerificationStatus('error');
        toast({
          title: "Verification Failed",
          description: response.message || "Failed to verify email",
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerificationStatus('error');
      toast({
        title: "Verification Error",
        description: "Network error occurred during verification",
        variant: "destructive",
      });
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email address not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    
    try {
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.resendVerification({ email: userEmail });

      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: response.message || `A new verification email has been sent to ${userEmail}`,
        });
      } else {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'success':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your email address has been verified. You now have full access to all EduSphere features.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/rooms">
                <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white" data-testid="button-go-to-dashboard">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Link Expired
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This verification link has expired. Please request a new verification email.
              </p>
            </div>
            {userEmail && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  We'll send a new verification email to: <strong>{userEmail}</strong>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                data-testid="button-resend-verification"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send New Verification Email
                  </>
                )}
              </Button>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We couldn't verify your email address. The link may be invalid or already used.
              </p>
            </div>
            <div className="space-y-3">
              {userEmail && (
                <Button
                  onClick={resendVerificationEmail}
                  disabled={isResending}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  data-testid="button-resend-verification"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send New Verification Email
                    </>
                  )}
                </Button>
              )}
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        );

      default: // pending
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please wait while we verify your email address...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-3 mb-8" data-testid="email-verification-logo">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Edusphere</span>
        </Link>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
