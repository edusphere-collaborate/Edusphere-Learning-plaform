import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoomManagement } from '@/components/Room/RoomManagement';
import { Sidebar } from '@/components/Layout/Sidebar';

/**
 * Explore Page Component
 * 
 * Displays public rooms available for discovery and joining.
 * Provides filtering, search, and trending rooms functionality.
 * Allows users to explore new learning communities.
 */
export default function Explore() {
  // Get authentication state and loading status
  const { user, isLoading: authLoading } = useAuth();

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Render explore rooms interface
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <RoomManagement
            mode="explore"
            title="Explore Rooms"
            description="Discover new learning communities and join discussions that match your interests"
          />
        </div>
      </div>
    </div>
  );
}
