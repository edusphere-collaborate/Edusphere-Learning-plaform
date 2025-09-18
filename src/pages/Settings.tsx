import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Palette, 
  Brain,
  MessageSquare,
  User,
  LogOut,
  Download
} from 'lucide-react';
import { Separator } from '@radix-ui/react-select';

export default function Settings() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  // Local state for settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [aiNotifications, setAiNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [aiFrequency, setAiFrequency] = useState('medium');
  const [autoJoinRooms, setAutoJoinRooms] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleExportData = () => {
    toast({
      title: "Data export requested",
      description: "Your data export will be emailed to you within 24 hours.",
    });
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your account preferences and privacy settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={toggleTheme}
                    className="w-24"
                    data-testid="button-toggle-theme"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive push notifications in browser
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                    data-testid="switch-push-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Message Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified about new messages
                    </p>
                  </div>
                  <Switch
                    checked={messageNotifications}
                    onCheckedChange={setMessageNotifications}
                    data-testid="switch-message-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">AI Assistant Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notifications from AI assistant
                    </p>
                  </div>
                  <Switch
                    checked={aiNotifications}
                    onCheckedChange={setAiNotifications}
                    data-testid="switch-ai-notifications"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Public Profile</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow others to view your profile
                    </p>
                  </div>
                  <Switch
                    checked={publicProfile}
                    onCheckedChange={setPublicProfile}
                    data-testid="switch-public-profile"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Show Online Status</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Display when you're online to other users
                    </p>
                  </div>
                  <Switch
                    checked={showOnlineStatus}
                    onCheckedChange={setShowOnlineStatus}
                    data-testid="switch-online-status"
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Assistant Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">AI Interaction Frequency</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      How often the AI should provide suggestions
                    </p>
                  </div>
                  <Select value={aiFrequency} onValueChange={setAiFrequency}>
                    <SelectTrigger className="w-32" data-testid="select-ai-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Room Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Room Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Auto-join Recommended Rooms</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Automatically join rooms based on your interests
                    </p>
                  </div>
                  <Switch
                    checked={autoJoinRooms}
                    onCheckedChange={setAutoJoinRooms}
                    data-testid="switch-auto-join-rooms"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Account Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Export Account Data</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download a copy of your account data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    data-testid="button-export-data"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Sign Out</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="button-sign-out"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Settings */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                className="bg-primary-600 hover:bg-primary-700 text-white"
                data-testid="button-save-settings"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
