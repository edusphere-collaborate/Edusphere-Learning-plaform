/**
 * User Onboarding Page - Complete Profile Setup
 * Professional onboarding flow for additional user details after account creation
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Post-registration onboarding to collect academic details and interests
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useApiClient } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import EdusphereLogo from '@/assets/Edusphere.png';
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  Heart,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// Onboarding form schema
const onboardingSchema = z.object({
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  university: z.string().min(2, 'University name is required'),
  fieldOfStudy: z.string().min(2, 'Field of study is required'),
  yearOfStudy: z.string().min(1, 'Year of study is required'),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

// Available academic interests
const AVAILABLE_INTERESTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Engineering', 'Medicine', 'Psychology', 'Literature', 'History',
  'Philosophy', 'Economics', 'Business', 'Art', 'Music', 'Languages',
  'Environmental Science', 'Political Science', 'Sociology', 'Statistics',
  'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Robotics'
];

// Academic year options
const YEAR_OPTIONS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year',
  'Graduate Student', 'PhD Student', 'Postdoc', 'Faculty', 'Other'
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const apiClient = useApiClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form management
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      bio: '',
      university: '',
      fieldOfStudy: '',
      yearOfStudy: '',
      interests: [],
    }
  });

  // Check if user needs onboarding
  useEffect(() => {
    const needsOnboarding = localStorage.getItem('needsOnboarding');
    if (!needsOnboarding) {
      // User doesn't need onboarding, redirect to dashboard
      setLocation('/rooms');
    }
  }, [setLocation]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  // Handle interest selection
  const toggleInterest = (interest: string) => {
    const updatedInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(updatedInterests);
    setValue('interests', updatedInterests);
  };

  // Handle step navigation
  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['university', 'fieldOfStudy', 'yearOfStudy'];
        break;
      case 2:
        fieldsToValidate = ['interests'];
        break;
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const onSubmit = async (data: OnboardingFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Update user profile with additional details
      // Note: This would typically call an API endpoint to update the user profile
      // For now, we'll simulate the API call and update local storage
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear onboarding flag
      localStorage.removeItem('needsOnboarding');
      
      toast({
        title: "Profile completed successfully!",
        description: "Welcome to EduSphere! Your profile has been set up.",
      });
      
      // Redirect to dashboard
      setLocation('/rooms');
      
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      toast({
        title: "Error",
        description: "Failed to complete profile setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Skip onboarding
  const skipOnboarding = () => {
    localStorage.removeItem('needsOnboarding');
    setLocation('/rooms');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src={EdusphereLogo} 
              alt="Edusphere Logo" 
              className="w-12 h-12 rounded-lg object-contain"
            />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">EduSphere</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Help us personalize your learning experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-8">
              
              {/* Step 1: Academic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Academic Information
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tell us about your educational background
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="university">University/Institution *</Label>
                      <Input
                        id="university"
                        placeholder="e.g., Stanford University"
                        {...register('university')}
                        className={errors.university ? 'border-red-500' : ''}
                      />
                      {errors.university && (
                        <p className="text-sm text-red-500">{errors.university.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fieldOfStudy">Field of Study *</Label>
                      <Input
                        id="fieldOfStudy"
                        placeholder="e.g., Computer Science"
                        {...register('fieldOfStudy')}
                        className={errors.fieldOfStudy ? 'border-red-500' : ''}
                      />
                      {errors.fieldOfStudy && (
                        <p className="text-sm text-red-500">{errors.fieldOfStudy.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearOfStudy">Academic Level *</Label>
                    <Select onValueChange={(value) => setValue('yearOfStudy', value)}>
                      <SelectTrigger className={errors.yearOfStudy ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select your academic level" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEAR_OPTIONS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.yearOfStudy && (
                      <p className="text-sm text-red-500">{errors.yearOfStudy.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Interests */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center">
                      <Heart className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Your Interests
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Select subjects you're passionate about
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_INTERESTS.map((interest) => (
                        <Badge
                          key={interest}
                          variant={selectedInterests.includes(interest) ? "default" : "outline"}
                          className={`cursor-pointer transition-all duration-200 ${
                            selectedInterests.includes(interest)
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'hover:bg-primary-50 dark:hover:bg-primary-900'
                          }`}
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                    
                    {errors.interests && (
                      <p className="text-sm text-red-500">{errors.interests.message}</p>
                    )}
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Bio */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Tell Us About Yourself
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Write a brief bio to help others connect with you
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio (Optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your academic goals, research interests, or what you hope to achieve on EduSphere..."
                      rows={4}
                      {...register('bio')}
                      className="resize-none"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {watch('bio')?.length || 0}/500 characters
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          You're all set!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          Complete your profile to start collaborating with fellow students, 
                          join discussion rooms, and get personalized AI assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center space-x-2"
                    >
                      <span>Previous</span>
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={skipOnboarding}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Skip for now
                  </Button>
                </div>

                <div className="flex space-x-3">
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center space-x-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Completing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete Profile</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
