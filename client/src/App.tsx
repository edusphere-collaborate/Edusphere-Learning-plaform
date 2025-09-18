import React, { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { AIWidget } from "@/components/AI/AIWidget";
import { initializeStores } from "@/stores/storeInitializer";
import { useAppStore } from "@/stores/appStore";
import { SpeedInsights } from "@vercel/speed-insights/react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import EmailVerification from "@/pages/EmailVerification";
import Onboarding from "@/pages/Onboarding";
import AuthCallback from "@/pages/AuthCallback";
import AuthSuccess from "@/pages/AuthSuccess";
// import Dashboard from "@/pages/rooms"; // Removed for WhatsApp Web-style layout
import CreateRoom from "@/pages/CreateRoom";
import Room from "@/pages/Room";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AIAssistant from "@/pages/AIAssistant";
import Rooms from "@/pages/Rooms";
import Explore from "@/pages/Explore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={EmailVerification} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth/success" component={AuthSuccess} />
      {/* All Routes - No Authentication Required for Testing */}
      {/* <Route path="/rooms*" component={Dashboard} /> */} {/* Removed dashboard route */}
      <Route path="/create-room" component={CreateRoom} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/explore" component={Explore} />
      {/* <Route path="/room/:id" component={Room} /> */} {/* Disabled to prevent navigation to different layout */}
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Main App component with Zustand store integration
 * Initializes all stores and provides global providers
 */
function App() {
  const { isInitializing, globalLoading } = useAppStore();

  // Initialize stores on app startup
  useEffect(() => {
    initializeStores();
  }, []);

  // Show loading screen while stores are initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing EduSphere...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RoomProvider>
            <WebSocketProvider>
              <TooltipProvider>
                <Toaster />
                {globalLoading && (
                  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <Router />
                <AIWidget />
                <SpeedInsights />
              </TooltipProvider>
            </WebSocketProvider>
          </RoomProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
