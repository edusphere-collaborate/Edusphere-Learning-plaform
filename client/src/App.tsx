import React from "react";
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
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import EmailVerification from "@/pages/EmailVerification";
import Onboarding from "@/pages/Onboarding";
import AuthCallback from "@/pages/AuthCallback";
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
      {/* All Routes - No Authentication Required for Testing */}
      {/* <Route path="/rooms*" component={Dashboard} /> */} {/* Removed dashboard route */}
      <Route path="/create-room" component={CreateRoom} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/explore" component={Explore} />
      <Route path="/room/:id" component={Room} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <RoomProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <AIWidget />
              </TooltipProvider>
            </RoomProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
