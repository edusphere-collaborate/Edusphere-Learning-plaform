import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { 
  Lock, 
  Unlock, 
  Users, 
  Brain, 
  BookOpen, 
  FileText, 
  Globe, 
  Settings,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';

/**
 * Professional Room Creation Schema
 * Aligned with EduSphere backend API requirements
 * Validates all required fields per API documentation
 */
const createRoomSchema = z.object({
  name: z.string()
    .min(1, 'Room name is required')
    .min(3, 'Room name must be at least 3 characters')
    .max(100, 'Room name must be less than 100 characters'),
  slug: z.string()
    .min(1, 'Room slug is required')
    .min(3, 'Room slug must be at least 3 characters')
    .max(50, 'Room slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  creatorId: z.string()
    .min(1, 'Creator ID is required'),
  isPrivate: z.boolean().default(false),
  aiEnabled: z.boolean().default(true),
});

type CreateRoomFormData = z.infer<typeof createRoomSchema>;

/**
 * CreateRoomForm Component
 * 
 * Professional-grade room creation form with comprehensive validation,
 * real-time preview, and seamless API integration.
 * 
 * Features:
 * - Real-time form validation with Zod schema
 * - Auto-generated URL slugs from room names
 * - Live preview of room appearance
 * - Professional UI with accessibility support
 * - Comprehensive error handling and user feedback
 * - Integration with EduSphere backend API
 * 
 * @returns {JSX.Element} Professional room creation form component
 */
const CreateRoomForm: React.FC = () => {
  // Authentication and routing hooks
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Form configuration with professional defaults and validation
   * Implements React Hook Form best practices for enterprise applications
   */
  const form = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      creatorId: user?.id || '',
      isPrivate: false,
      aiEnabled: true,
    },
    mode: 'onChange', // Real-time validation for better UX
  });
  
  // Auto-generate slug from room name for better SEO and URLs
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .substring(0, 50); // Limit length
  };
  
  // Watch form fields for real-time updates
  const watchedName = form.watch('name');
  const watchedDescription = form.watch('description');
  const watchedIsPrivate = form.watch('isPrivate');
  const watchedAiEnabled = form.watch('aiEnabled');
  
  // Auto-generate slug from room name
  useEffect(() => {
    if (watchedName && !form.formState.dirtyFields.slug) {
      const autoSlug = generateSlug(watchedName);
      form.setValue('slug', autoSlug);
    }
  }, [watchedName, form]);

  const createRoomMutation = useMutation({
    mutationFn: async (data: CreateRoomFormData) => {
      console.log('[CREATE ROOM] Submitting room creation request:', {
        name: data.name,
        description: data.description?.substring(0, 50) + '...',
        slug: data.slug,
        creatorId: data.creatorId
      });
      
      // Only send properties that the backend expects
      const requestBody = {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        creatorId: data.creatorId
      };
      
      const response = await authenticatedFetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create room');
      }
      
      const room = await response.json();
      console.log('[CREATE ROOM] Room created successfully:', room);
      return room;
    },
    onSuccess: (room) => {
      // Invalidate relevant queries to refresh room lists
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      
      // Show success notification with professional messaging
      toast({
        title: "🎉 Room Created Successfully!",
        description: `"${room.name}" is now ready for collaborative learning.`,
        duration: 5000,
      });
      
      // Navigate to the newly created room
      setLocation(`/room/${room.id}`);
    },
    onError: (error: any) => {
      console.error('[CREATE ROOM] Error:', error);
      
      // Professional error handling with actionable feedback
      toast({
        title: "❌ Room Creation Failed",
        description: error.message || "Unable to create room. Please check your input and try again.",
        variant: "destructive",
        duration: 7000,
      });
    }
  });

  const onSubmit = async (data: CreateRoomFormData) => {
    // Prevent double submission
    if (isLoading || createRoomMutation.isPending) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Ensure creator ID is set
      if (!user?.id) {
        throw new Error('Authentication required to create room');
      }
      
      // Prepare final data with creator ID
      const roomData: CreateRoomFormData = {
        ...data,
        creatorId: user.id,
        // Auto-generate slug if not provided
        slug: data.slug || generateSlug(data.name),
      };
      
      // Submit room creation request
      await createRoomMutation.mutateAsync(roomData);
      
    } catch (error) {
      console.error('[CREATE ROOM] Submission error:', error);
      
      // Show user-friendly error message
      toast({
        title: "⚠️ Submission Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Professional Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Learning Room
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Start a new collaborative learning space where knowledge meets community
        </p>
      </div>
      
      {/* Professional Form Card */}
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Room Configuration
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure your learning space with professional settings
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Room Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Room Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive room name..."
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, descriptive name that reflects the room's purpose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Slug Field */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Room URL (Slug)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="room-url-slug"
                              className="h-12 text-base pl-24"
                              {...field}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                              /rooms/
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          This creates your room's unique URL. Auto-generated from the room name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this room is about, its goals, and what members can expect..."
                            className="min-h-[120px] text-base resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Help potential members understand the purpose and scope of your room
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Room Settings */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Room Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Privacy Setting */}
                  <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          {watchedIsPrivate ? (
                            <Lock className="h-5 w-5 text-orange-500" />
                          ) : (
                            <Unlock className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <Label className="text-base font-medium">
                              {watchedIsPrivate ? 'Private Room' : 'Public Room'}
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {watchedIsPrivate 
                                ? 'Only invited members can join this room'
                                : 'Anyone can discover and join this room'
                              }
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-orange-500"
                        />
                      </div>
                    )}
                  />

                  {/* AI Assistant Setting */}
                  <FormField
                    control={form.control}
                    name="aiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Brain className={`h-5 w-5 ${
                            watchedAiEnabled ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                          <div>
                            <Label className="text-base font-medium">
                              AI Assistant
                            </Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {watchedAiEnabled
                                ? 'AI assistant will help with discussions and questions'
                                : 'AI assistant will be disabled for this room'
                              }
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Room Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Room Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {watchedName || 'Room Name Preview'}
                            </h3>
                            {watchedIsPrivate ? (
                              <Lock className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Unlock className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-3">
                            {watchedAiEnabled && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm rounded flex items-center space-x-1">
                                <Brain className="w-3 h-3" />
                                <span>AI Enabled</span>
                              </span>
                            )}
                          </div>
                          
                          {watchedDescription && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {watchedDescription}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>Study Room</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {watchedIsPrivate ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Private</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Public</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12"
                  onClick={() => setLocation('/rooms')}
                  disabled={createRoomMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={createRoomMutation.isPending || !form.formState.isValid}
                >
                  {createRoomMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Room...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRoomForm;