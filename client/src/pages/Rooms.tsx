import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Layout/Sidebar';
import { RoomChatList } from '@/components/Room/RoomChatList';
import { RoomChatInterface } from '@/components/Room/RoomChatInterface';
import { ChatEmptyState } from '@/components/Room/ChatEmptyState';
import { AIAssistantPanel } from '@/components/AI/AIAssistantPanel';
import { RoomService } from '@/services/api';
import { Room, Message, User } from '@/types/api';

/**
 * Interface for room with latest message data for chat list
 */
interface RoomWithLatestMessage extends Room {
  latestMessage?: Message & { user: User };
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isOnline?: boolean;
}

/**
 * Rooms Page Component - WhatsApp/Telegram-style three-panel layout
 * 
 * Features:
 * - Left sidebar: Navigation
 * - Middle panel: Room list with chat-style previews
 * - Right panel: Chat interface or empty state
 */
export default function Rooms() {
  // State management
  const [selectedRoom, setSelectedRoom] = useState<RoomWithLatestMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [roomMessages, setRoomMessages] = useState<(Message & { user: User })[]>([]);
  const [, setLocation] = useLocation();

  // Get authentication state and loading status
  const { user, isLoading: authLoading } = useAuth();

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  // Fetch user's joined rooms with latest message data
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-with-messages'],
    queryFn: async () => {
      console.log('[Rooms] Fetching joined rooms with latest messages');
      const response = await RoomService.getJoinedRooms();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch rooms');
      }
      
      // Transform rooms to include chat-style metadata
      const roomsWithMessages: RoomWithLatestMessage[] = (response.data || []).map(room => ({
        ...room,
        latestMessage: undefined, // TODO: Fetch latest message from API
        unreadCount: Math.floor(Math.random() * 5), // TODO: Get real unread count
        isPinned: false, // TODO: Get from user preferences
        isMuted: false, // TODO: Get from user preferences
        isOnline: Math.random() > 0.5, // TODO: Get real online status
      }));
      
      console.log(`[Rooms] Fetched ${roomsWithMessages.length} rooms`);
      return roomsWithMessages;
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  /**
   * Handle room selection from chat list - Stay in same layout, no navigation
   */
  const handleRoomSelect = (room: RoomWithLatestMessage) => {
    console.log(`[Rooms] Selected room: ${room.name}`);
    setSelectedRoom(room);
    setRoomMessages([]); // Reset messages when switching rooms
    // No navigation - keep the clean 3-panel layout
  };

  /**
   * Handle messages change from chat interface for AI analysis
   */
  const handleMessagesChange = (messages: (Message & { user: User })[]) => {
    setRoomMessages(messages);
  };

  /**
   * Handle room actions (pin, mute, archive)
   */
  const handleRoomAction = (roomId: string, action: string) => {
    console.log(`[Rooms] Room action: ${action} for room ${roomId}`);
    // TODO: Implement room actions
  };

  /**
   * Handle creating new room
   */
  const handleCreateRoom = () => {
    setLocation('/create-room');
  };

  /**
   * Handle exploring rooms
   */
  const handleExploreRooms = () => {
    setLocation('/explore');
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // WhatsApp/Telegram-style three-panel layout with fixed height and no main window scrolling
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Middle Panel - Room Chat List */}
      <div className="w-80 flex-shrink-0 min-w-0 sm:w-72 md:w-80 lg:w-96">
        <RoomChatList
          rooms={rooms}
          selectedRoomId={selectedRoom?.id}
          onRoomSelect={handleRoomSelect}
          onRoomAction={handleRoomAction}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={roomsLoading}
        />
      </div>
      
      {/* Right Panel - Chat Interface or Empty State */}
      <div className="flex-1 min-w-0 flex">
        {selectedRoom ? (
          <RoomChatInterface
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onRoomAction={handleRoomAction}
            onMessagesChange={handleMessagesChange}
          />
        ) : (
          <ChatEmptyState
            onCreateRoom={handleCreateRoom}
            onExploreRooms={handleExploreRooms}
          />
        )}
      </div>
      
      {/* AI Assistant Panel - Responsive */}
      <div className="hidden lg:block flex-shrink-0">
        <AIAssistantPanel
          room={selectedRoom || undefined}
          messages={roomMessages}
          isVisible={showAIPanel}
          onToggle={() => setShowAIPanel(!showAIPanel)}
        />
      </div>
    </div>
  );
}
