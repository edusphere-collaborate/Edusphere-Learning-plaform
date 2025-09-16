/**
 * Signup Form Component
 * Clean, single-step registration form for basic account creation
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Streamlined signup form that collects only essential user data
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserPlus
} from 'lucide-react';

// Signup schema - only essential fields
const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be under 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register: registerUser } = useAuth();
  const { toast } = useToast();

  // Form management
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      termsAccepted: false
    }
  });

  // Handle form submission
  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
      // Remove confirmPassword and termsAccepted before sending to backend
      const { confirmPassword, termsAccepted, ...registrationData } = data;

      const result = await registerUser(registrationData);
      
      if (result.success) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to EduSphere! Let's complete your profile.",
        });
        
        // Always redirect to onboarding after successful signup
        window.location.href = '/onboarding';
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>First Name *</span>
          </Label>
          <Input
            id="firstName"
            placeholder="Enter your first name"
            {...register('firstName')}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Last Name *</span>
          </Label>
          <Input
            id="lastName"
            placeholder="Enter your last name"
            {...register('lastName')}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>Username *</span>
        </Label>
        <Input
          id="username"
          placeholder="Choose a unique username"
          {...register('username')}
          className={errors.username ? 'border-red-500' : ''}
        />
        {errors.username && (
          <p className="text-sm text-red-500">{errors.username.message}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Only letters, numbers, and underscores allowed
        </p>
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center space-x-2">
          <Mail className="w-4 h-4" />
          <span>Email Address *</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email address"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Password *</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              {...register('password')}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>Confirm Password *</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Password Requirements:
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              watch('password')?.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span>At least 8 characters</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              /[A-Z]/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span>One uppercase letter</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              /[a-z]/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span>One lowercase letter</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              /\d/.test(watch('password') || '') ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span>One number</span>
          </li>
        </ul>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-3">
        <Controller
          name="termsAccepted"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <Checkbox
              id="termsAccepted"
              checked={field.value}
              onCheckedChange={field.onChange}
              className={errors.termsAccepted ? 'border-red-500' : ''}
            />
          )}
        />
        <div className="space-y-1">
          <Label htmlFor="termsAccepted" className="text-sm leading-relaxed cursor-pointer">
            I agree to the{' '}
            <a href="/terms" className="text-primary-600 hover:text-primary-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
              Privacy Policy
            </a>
          </Label>
          {errors.termsAccepted && (
            <p className="text-sm text-red-500">{errors.termsAccepted.message}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Creating Account...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </div>
        )}
      </Button>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          After creating your account, you'll complete your academic profile to get personalized recommendations.
        </p>
      </div>
    </form>
  );
}
