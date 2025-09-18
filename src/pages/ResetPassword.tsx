import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap } from 'lucide-react';
import EdusphereLogo from '@/assets/Edusphere.png';
import { useToast } from '@/hooks/use-toast';

// Password reset schema with strong validation
const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [location] = useLocation();
  const { toast } = useToast();

  // Extract token from URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const token = urlParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const { apiClient } = await import('@/lib/api-client');
        const response = await apiClient.verifyResetToken({ token });

        if (response.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use API client for consistent error handling
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.resetPassword({ 
        token,
        password: data.password 
      });

      if (response.success) {
        setResetSuccess(true);
        
        toast({
          title: "Password Reset Successful",
          description: response.message || "Your password has been successfully reset. You can now log in with your new password.",
        });
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validating reset token...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Edusphere</span>
          </Link>

          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-3 mb-8" data-testid="reset-password-logo">
          <img 
            src={EdusphereLogo} 
            alt="Edusphere Logo" 
            className="w-16 h-16 object-contain"
          />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">Edusphere</span>
        </Link>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {resetSuccess ? 'Password Reset Complete' : 'Reset Your Password'}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              {resetSuccess 
                ? "Your password has been successfully reset"
                : "Enter your new password below"
              }
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            {!resetSuccess ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      disabled={isLoading}
                      {...form.register('password')}
                      className={form.formState.errors.password ? 'border-red-500' : ''}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                      {...form.register('confirmPassword')}
                      className={form.formState.errors.confirmPassword ? 'border-red-500' : ''}
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your password must be at least 8 characters long and contain at least one uppercase letter, 
                    one lowercase letter, and one number.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Password Successfully Reset
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    You can now log in with your new password.
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white" data-testid="button-go-to-login">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Login */}
        {!resetSuccess && (
          <div className="text-center mt-6">
            <Link href="/login" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors" data-testid="link-back-to-login">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
