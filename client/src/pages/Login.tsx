import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/Forms/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap } from "lucide-react";
import { Navbar } from "@/components/Layout/Navbar";

// Welcome Back typing animation component
function WelcomeBackTypingAnimation() {
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'clearing' | 'pausing'>('typing');
  
  const fullText = 'Welcome Back';
  
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
      <span className="blinking-cursor text-gray-600">|</span>
    </span>
  );
}

export default function Login() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
      .login-form-element {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .login-form-element:hover {
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
    if (typeof document !== 'undefined' && !document.getElementById('login-animations')) {
      const style = document.createElement('style');
      style.id = 'login-animations';
      style.textContent = keyframes;
      document.head.appendChild(style);
    }
  }, []);

  // Redirect authenticated users to rooms page
  useEffect(() => {
    if (user) {
      setLocation("/rooms");
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleLoginSuccess = () => {
    setLocation("/rooms");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Enhanced Blue Background with Logo and Welcome Text */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[url('/src/assets/background.png')] bg-cover bg-center bg-no-repeat ">
          
          {/* Centered Logo and Welcome Content - Moved Up More */}
          <div className="flex flex-col items-center justify-center w-full h-full px-12 text-center animate-fade-in -mt-32" style={{animationDelay: '0.3s'}}>
            {/* Large Centered Logo */}
            <Link
              href="/"
              className="flex flex-col items-center gap-4 group mb-12"
              data-testid="login-logo"
              aria-label="Edusphere Home"
            >
              {/* Large Logo Icon */}
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-2xl">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              {/* Logo Name Below */}
              <span className="text-3xl font-bold text-gray-600 drop-shadow-sm group-hover:scale-105 transition-all duration-300 dark:text-gray-300">
                Edusphere
              </span>
            </Link>

            {/* Welcome Back Text with Typing Animation */}
            <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
              <h1 className="text-5xl font-bold text-gray-600 mb-6 drop-shadow-lg dark:text-gray-200">
                <WelcomeBackTypingAnimation />
              </h1>
              <p className="text-xl text-gray-500 max-w-md leading-relaxed drop-shadow-sm dark:text-gray-200">
                Sign in to continue your learning journey
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
                data-testid="login-logo-mobile"
                aria-label="Edusphere Home"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edusphere
                </span>
              </Link>
            </div>

            {/* Form Header - Simplified since Welcome text is now in blue area */}
            <div className="text-left animate-slide-up" style={{animationDelay: '0.1s'}}>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Login Form Container with Glass Effect */}
            <div className="space-y-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <div className="glass-effect rounded-2xl p-6 sm:p-8 shadow-xl login-form-element">
                <LoginForm onSuccess={handleLoginSuccess} />
              </div>

              {/* Sign Up Link with Enhanced Styling */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400 animate-slide-up" style={{animationDelay: '0.3s'}}>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-all duration-200 hover:scale-105 inline-block"
                  data-testid="link-register"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}