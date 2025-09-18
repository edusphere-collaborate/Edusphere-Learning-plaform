import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap } from 'lucide-react';
import EdusphereLogo from '@/assets/Edusphere.png';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/Layout/Navbar';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset Password typing animation component
function ResetPasswordTypingAnimation() {
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'clearing' | 'pausing'>('typing');
  
  const fullText = 'Reset Password';
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    switch (phase) {
      case 'typing':
        if (displayText.length < fullText.length) {
          timeout = setTimeout(() => {
            setDisplayText(fullText.slice(0, displayText.length + 1));
          }, 100); // Faster typing speed
        } else {
          timeout = setTimeout(() => setPhase('waiting'), 2000); // Wait 2 seconds
        }
        break;
        
      case 'waiting':
        timeout = setTimeout(() => setPhase('clearing'), 2000); // Wait 2 seconds before clearing
        break;
        
      case 'clearing':
        if (displayText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1));
          }, 50); // Faster clearing speed
        } else {
          timeout = setTimeout(() => setPhase('pausing'), 500); // Brief pause
        }
        break;
        
      case 'pausing':
        timeout = setTimeout(() => setPhase('typing'), 1000); // Pause before restarting
        break;
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, phase, fullText]);
  
  return (
    <span className="relative">
      {displayText}
      <span className="blinking-cursor text-gray-600 dark:text-gray-200">|</span>
    </span>
  );
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { toast } = useToast();

  // Inject custom animations for enhanced UX
  useEffect(() => {
    const keyframes = `
      @keyframes slide-up {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      .animate-slide-up {
        animation: slide-up 0.6s ease-out forwards;
      }
      .animate-fade-in {
        animation: fade-in 0.8s ease-out forwards;
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .forgot-form-element {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .forgot-form-element:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }
      .glass-effect {
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .dark .glass-effect {
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(75, 85, 99, 0.2);
      }
      .blinking-cursor {
        animation: blink 1s infinite;
      }
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
    if (typeof document !== 'undefined' && !document.getElementById('forgot-animations')) {
      const style = document.createElement('style');
      style.id = 'forgot-animations';
      style.textContent = keyframes;
      document.head.appendChild(style);
    }
  }, []);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    
    try {
      // Use API client for consistent error handling
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.forgotPassword({ email: data.email });

      if (response.success) {
        setSentEmail(data.email);
        setEmailSent(true);
        
        toast({
          title: "Reset Email Sent",
          description: response.message || `Password reset instructions have been sent to ${data.email}`,
        });
      } else {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (sentEmail) {
      await onSubmit({ email: sentEmail });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Enhanced Background with Logo and Reset Text */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[url('/src/assets/background.png')] bg-cover bg-center bg-no-repeat ">
          
          {/* Centered Logo and Reset Content - Moved Up More */}
          <div className="flex flex-col items-center justify-center w-full h-full px-12 text-center animate-fade-in -mt-32" style={{animationDelay: '0.3s'}}>
            {/* Large Centered Logo */}
            <Link
              href="/"
              className="flex flex-col items-center gap-4 group mb-12"
              data-testid="forgot-password-logo"
              aria-label="Edusphere Home"
            >
              {/* Large Logo Icon */}
              <img 
                src={EdusphereLogo} 
                alt="Edusphere Logo" 
                className="w-32 h-32 object-contain group-hover:scale-110 transition-all duration-300 drop-shadow-2xl"
              />
              {/* Logo Name Below */}
              <span className="text-3xl font-bold text-gray-600 drop-shadow-sm group-hover:scale-105 transition-all duration-300 dark:text-gray-300">
                Edusphere
              </span>
            </Link>

            {/* Reset Password Text with Typing Animation */}
            <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
              <h1 className="text-5xl font-bold text-gray-600 mb-6 drop-shadow-lg dark:text-gray-200">
                <ResetPasswordTypingAnimation />
              </h1>
              <p className="text-xl text-gray-500 max-w-md leading-relaxed drop-shadow-sm dark:text-gray-200">
                Enter your email to reset your password
              </p>
            </div>
          </div>
          
        </div>

        {/* Right Side - Enhanced Form with Glass Effect */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 sm:py-12 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo with Animation */}
            <div className="lg:hidden text-center mb-8 animate-slide-up">
              <Link
                href="/"
                className="inline-flex items-center gap-3 group"
                data-testid="forgot-password-logo-mobile"
                aria-label="Edusphere Home"
              >
                <img 
                  src={EdusphereLogo} 
                  alt="Edusphere Logo" 
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-all duration-300"
                />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edusphere
                </span>
              </Link>
            </div>

            {/* Form Header */}
            <div className="text-left animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                {emailSent 
                  ? "We've sent you password reset instructions"
                  : "Enter your email address and we'll send you a link to reset your password"
                }
              </p>
            </div>

            {/* Form Container with Glass Effect */}
            <div className="space-y-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="glass-effect rounded-2xl p-6 sm:p-8 shadow-xl forgot-form-element">
            {!emailSent ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    disabled={isLoading}
                    {...form.register('email')}
                    className={form.formState.errors.email ? 'border-red-500' : ''}
                    data-testid="input-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                  data-testid="button-send-reset-email"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reset Email
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    We've sent password reset instructions to:
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white mb-6">
                    {sentEmail}
                  </p>
                </div>

                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    If you don't see the email in your inbox, please check your spam folder. 
                    The reset link will expire in 1 hour for security reasons.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-resend-email"
                  >
                    {isLoading ? 'Sending...' : 'Resend Email'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setSentEmail('');
                      form.reset();
                    }}
                    variant="ghost"
                    className="w-full"
                    data-testid="button-try-different-email"
                  >
                    Try a Different Email
                  </Button>
                </div>
              </div>
            )}
              </div>

              {/* Back to Login */}
              <div className="text-center animate-slide-up" style={{animationDelay: '0.3s'}}>
                <Link href="/login" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105" data-testid="link-back-to-login">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
