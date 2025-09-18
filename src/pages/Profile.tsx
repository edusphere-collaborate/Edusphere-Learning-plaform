import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Save, X, User, Mail, School, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Room } from '@/types/api';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  bio: z.string().optional(),
  university: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  yearOfStudy: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const [location] = useLocation();
  const [isEditing, setIsEditing] = useState(location === '/profile/edit');
  const { user, isLoading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    setIsEditing(location === '/profile/edit');
  }, [location]);

  // Fetch user's rooms for stats
  const { data: userRooms = [] } = useQuery({
    queryKey: ['/api/rooms'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch user rooms');
      return response.json();
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || '',
      university: user?.university || '',
      fieldOfStudy: user?.fieldOfStudy || '',
      yearOfStudy: user?.yearOfStudy || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || '',
        university: user.university || '',
        fieldOfStudy: user.fieldOfStudy || '',
        yearOfStudy: user.yearOfStudy || '',
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await authenticatedFetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/auth/me'], updatedUser);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
      window.history.pushState({}, '', '/profile');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleEdit = () => {
    setIsEditing(true);
    window.history.pushState({}, '', '/profile/edit');
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    window.history.pushState({}, '', '/profile');
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your account information and academic details
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white text-2xl">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1" data-testid="profile-name">
                      {user.firstName} {user.lastName}
                    </h2>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4" data-testid="profile-username">
                      @{user.username}
                    </p>

                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4" data-testid="profile-bio">
                        {user.bio}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {user.university && (
                        <div className="flex items-center justify-center space-x-2">
                          <School className="w-4 h-4" />
                          <span data-testid="profile-university">{user.university}</span>
                        </div>
                      )}
                      
                      {user.fieldOfStudy && (
                        <div className="flex items-center justify-center space-x-2">
                          <BookOpen className="w-4 h-4" />
                          <span data-testid="profile-field-of-study">{user.fieldOfStudy}</span>
                        </div>
                      )}
                      
                      {user.yearOfStudy && (
                        <div className="flex items-center justify-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span data-testid="profile-year-of-study">{user.yearOfStudy}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-center space-x-2">
                        <User className="w-4 h-4" />
                        <span data-testid="profile-member-since">
                          Member since {formatDistanceToNow(new Date(user.createdAt!), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Interests */}
                    {user.interests && user.interests.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {user.interests.map((interest: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs" data-testid={`interest-${index}`}>
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Rooms Joined</span>
                      </div>
                      <span className="font-semibold" data-testid="stat-rooms-joined">{(userRooms as Room[]).length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</span>
                      </div>
                      <span className="font-semibold" data-testid="stat-messages-sent">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Profile Information</CardTitle>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={handleEdit}
                        data-testid="button-edit-profile"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" data-testid="input-edit-first-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" data-testid="input-edit-last-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself and your academic interests..."
                                  className="min-h-[100px]"
                                  data-testid="textarea-edit-bio"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="university"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>University</FormLabel>
                              <FormControl>
                                <Input placeholder="MIT, Stanford, etc." data-testid="input-edit-university" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fieldOfStudy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Field of Study</FormLabel>
                                <FormControl>
                                  <Input placeholder="Computer Science, Physics, etc." data-testid="input-edit-field-of-study" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="yearOfStudy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year of Study</FormLabel>
                                <FormControl>
                                  <Input placeholder="1st Year, Graduate, etc." data-testid="input-edit-year-of-study" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            data-testid="button-cancel-edit"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            className="bg-primary-600 hover:bg-primary-700 text-white"
                            data-testid="button-save-profile"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                          <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-first-name">{user.firstName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                          <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-last-name">{user.lastName}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-email">{user.email}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-username">@{user.username}</p>
                      </div>

                      {user.bio && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                          <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-bio">{user.bio}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">University</label>
                        <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-university">{user.university || 'Not specified'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Field of Study</label>
                          <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-field-of-study">{user.fieldOfStudy || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year of Study</label>
                          <p className="mt-1 text-gray-900 dark:text-white" data-testid="display-year-of-study">{user.yearOfStudy || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
