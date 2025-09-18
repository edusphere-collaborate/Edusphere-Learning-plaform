import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'wouter';
// Removed shared schema import - using local types instead
import { Message, DetailedRoom, Media, PublicUser, User } from '../types/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoom, useRoomMessages, useRoomMedia, useSendMessage } from '@/hooks/useApi';
import { 
  Maximize2, 
  Minimize2,
  Eye, 
  EyeOff,
  Upload,
  X,
  ArrowLeft, 
  Users, 
  Settings, 
  Brain, 
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RoomSidebar } from '@/components/Room/RoomSidebar';
import { ChatArea } from '@/components/Room/ChatArea';
import { RightSidebar } from '@/components/Room/RightSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';

export default function Room() {
  const { id: roomId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // WebSocket integration
  const {
    isConnected,
    sendMessage: wsSendMessage,
    sendTypingIndicator,
    typingUsers,
    onlineUsers: wsOnlineUsers,
    joinRoom: wsJoinRoom,
    leaveRoom: wsLeaveRoom,
    onMessage,
    onTyping,
    onUserStatus
  } = useWebSocket();
  
  // UI State
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [aiAnalysisContext, setAiAnalysisContext] = useState<any>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<(Message & { user: User })[]>([]);
  const [participants, setParticipants] = useState<(PublicUser & { role: string; joinedAt: string })[]>([]);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; user: string } | null>(null);
  
  // File Upload State
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resource State
  const [sharedResources, setSharedResources] = useState<{
    id: string;
    name: string;
    type: 'image' | 'video' | 'document';
    url: string;
    size: number;
    uploadedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
    uploadedAt: Date;
    roomId: string;
  }[]>([]);
  const [currentRoom, setCurrentRoom] = useState<SharedRoom | null>(null);

  // Fetch room data from API - MOVED BEFORE ALL CONDITIONAL RETURNS
  const { data: room, isLoading: isLoadingRoom, error: roomError } = useRoom(roomId || '');
  const { data: roomMessages, isLoading: isLoadingMessages } = useRoomMessages(roomId || '');
  const { data: mediaResources = [] } = useRoomMedia(roomId || '');
  const sendMessageMutation = useSendMessage();

  // Drag and drop handlers - MOVED BEFORE ALL CONDITIONAL RETURNS
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileUpload = useCallback((files: File[]) => {
    console.log('Uploading files:', files);
    // TODO: Implement real file upload
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  /**
   * Handle AI analysis requests from chat interface
   */
  const handleAIAnalysis = useCallback((type: 'summarize' | 'explain' | 'questions', context?: any) => {
    // Store the analysis context for the AI Assistant Panel
    setAiAnalysisContext({
      type,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Ensure right panel is open to show AI assistant
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
    }
    
    // The AI Assistant Panel will pick up this context and trigger the appropriate analysis
  }, [isRightPanelOpen]);

  // ALL useEffect hooks BEFORE conditional returns
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  // Join room when component mounts
  useEffect(() => {
    if (roomId && user && isConnected) {
      wsJoinRoom(roomId);
    }
    
    return () => {
      if (roomId) {
        wsLeaveRoom(roomId);
      }
    };
  }, [roomId, user, isConnected, wsJoinRoom, wsLeaveRoom]);

  // Listen for real-time messages
  useEffect(() => {
    const unsubscribe = onMessage((newMessage) => {
      // Convert API message to shared schema format with user data
      const sharedMessage = {
        id: newMessage.id,
        roomId: newMessage.roomId,
        userId: newMessage.userId,
        content: newMessage.content,
        type: 'text' as const,
        isEdited: false,
        isDeleted: false,
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.createdAt,
        aiGenerated: false,
        user: {
          id: newMessage.user?.id || newMessage.userId,
          firstName: newMessage.user?.firstName || '',
          lastName: newMessage.user?.lastName || '',
          username: newMessage.user?.username || 'Unknown',
          email: '',
          bio: '',
          interests: [],
          isEmailVerified: false,
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.createdAt,
        }
      };
      setMessages(prev => [...prev, sharedMessage]);
    });
    
    return unsubscribe;
  }, [onMessage]);
  
  // Update local messages when API data changes
  useEffect(() => {
    if (roomMessages) {
      // Convert API messages to shared schema format with user data
      const convertedMessages = roomMessages.map(msg => ({
        id: msg.id,
        roomId: msg.roomId,
        userId: msg.userId,
        content: msg.content,
        type: 'text' as const,
        isEdited: false,
        isDeleted: false,
        createdAt: msg.createdAt,
        updatedAt: msg.createdAt,
        aiGenerated: false,
        user: {
          id: msg.user.id,
          firstName: msg.user.firstName || '',
          lastName: msg.user.lastName || '',
          username: msg.user.username,
          email: '',
          bio: '',
          interests: [],
          isEmailVerified: false,
          createdAt: msg.user.createdAt,
          updatedAt: msg.user.createdAt,
        }
      }));
      setMessages(convertedMessages);
    }
  }, [roomMessages]);

  // Update room data when API response changes
  useEffect(() => {
    if (room) {
      // Convert DetailedRoom to SharedRoom format
      const convertedRoom: SharedRoom = {
        id: room.id,
        name: room.name,
        description: room.description,
        subject: room.description || 'General',
        isPrivate: false,
        aiEnabled: true,
        createdBy: room.creatorId,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
      setCurrentRoom(convertedRoom);
      
      // Convert PublicUser[] to RoomMember[] format
      const convertedParticipants: (RoomMember & { user: User })[] = room.users.map(user => ({
        id: `${room.id}-${user.id}`,
        roomId: room.id,
        userId: user.id,
        role: 'member' as const,
        joinedAt: user.createdAt,
        user: {
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          username: user.username,
          email: '',
          bio: '',
          interests: [],
          isEmailVerified: false,
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        }
      }));
      setParticipants(convertedParticipants);
    }
  }, [room]);

  // Update media resources separately to avoid infinite loops
  useEffect(() => {
    if (mediaResources && mediaResources.length > 0) {
      // Convert Media[] to SharedResource[] format
      const convertedResources = mediaResources.map(media => ({
        id: media.id,
        name: media.url.split('/').pop() || 'Unknown',
        type: media.type.toLowerCase() as 'image' | 'video' | 'document',
        url: media.url,
        size: 0,
        uploadedBy: {
          id: media.user.id,
          firstName: media.user.firstName || '',
          lastName: media.user.lastName || '',
        },
        uploadedAt: new Date(media.createdAt),
        roomId: media.roomId,
      }));
      setSharedResources(convertedResources);
    }
  }, [mediaResources]);

  // Handle loading and error states
  if (isLoadingRoom || isLoadingMessages) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load room</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isMember = true;
  const roomLoading = false;
  const membersLoading = false;
  const messagesLoading = false;
  const resourcesLoading = false;

  const handleSendMessage = (content: string, type?: string) => {
    // Enhanced validation with better error handling
    if (!roomId) {
      console.error('Cannot send message: no room ID available');
      return;
    }

    if (!user) {
      console.error('Cannot send message: user not authenticated');
      return;
    }

    // Check if content is valid
    if (!content.trim()) {
      console.error('Cannot send message: empty content');
      return;
    }
    
    // Try WebSocket first, fallback to API if not connected
    if (isConnected) {
      console.log('[Room] Sending message via WebSocket');
      wsSendMessage(roomId, content, type, replyTo?.id);
    } else {
      console.warn('[Room] WebSocket not connected, using API fallback');
      console.log('[Room] API payload:', { roomId, content: content.trim(), userId: user.id });
      
      // Use the API mutation as fallback with enhanced error handling
      sendMessageMutation.mutate({
        roomId,
        data: {
          content: content.trim(),
          userId: user.id,
          roomId: roomId  // Include roomId in the request body as server expects
        }
      }, {
        onError: (error) => {
          console.error('[Room] API message send failed:', error);
          // Remove the optimistic message on error
          setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
        },
        onSuccess: (response) => {
          console.log('[Room] API message sent successfully:', response);
          // Replace optimistic message with real message
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
            return [...filtered, {
              ...response,
              user: {
                id: response.user.id,
                firstName: response.user.firstName || '',
                lastName: response.user.lastName || '',
                username: response.user.username,
                email: '',
                bio: '',
                interests: [],
                isEmailVerified: false,
                createdAt: response.user.createdAt,
                updatedAt: response.user.createdAt,
              },
              type: 'text' as const,
              isEdited: false,
              isDeleted: false,
              aiGenerated: false,
            }];
          });
        }
      });
    }
    
    // Optimistically add message to local state for immediate UI feedback
    const newMessage = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      roomId: roomId,
      userId: user.id,
      content: content.trim(),
      type: 'text' as const,
      isEdited: false,
      isDeleted: false,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email || '',
        bio: user.bio || '',
        interests: user.interests || [],
        isEmailVerified: user.isEmailVerified || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      replyToId: replyTo?.id,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setReplyTo(null);
  };

  const handleReply = (message: Message & { user: User }) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      user: `${message.user.firstName} ${message.user.lastName}`
    });
  };

  const handleJoinRoom = () => {
    console.log('Joining room');
    // TODO: Implement real room joining
  };

  const handleResourceUpload = (files: File[]) => {
    console.log('Uploading resources:', files);
    // TODO: Implement real resource upload
  };

  const handleResourceDelete = (id: string) => {
    console.log('Deleting resource:', id);
    // TODO: Implement real resource deletion
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  if (roomLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen">
          <Skeleton className="w-80 h-full" />
          <div className="flex-1 flex flex-col">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1 p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div 
      className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-50 dark:bg-gray-900 flex`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-primary-500/20 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center">
            <Paperclip className="w-16 h-16 mx-auto mb-4 text-primary-600" />
            <p className="text-lg font-medium text-primary-700">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isLeftPanelOpen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsLeftPanelOpen(true)}
                data-testid="button-show-left-panel"
              >
                <Users className="w-4 h-4" />
              </Button>
            )}
            <Link href="/rooms">
              <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {room?.name || 'Room'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {room?.description} • {participants.length} members
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              data-testid="button-toggle-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            {!isRightPanelOpen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsRightPanelOpen(true)}
                data-testid="button-show-right-panel"
              >
                <Brain className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Left Sidebar */}
          <RoomSidebar
            room={currentRoom || undefined}
            members={participants}
            currentUser={user}
            isVisible={isLeftPanelOpen}
            onToggle={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            roomLoading={roomLoading}
            membersLoading={membersLoading}
            isMember={isMember}
            onJoinRoom={handleJoinRoom}
            onlineUsers={Object.keys(wsOnlineUsers)}
            typingUsers={Object.keys(typingUsers)}
          />

          {/* Chat Area */}
          <ChatArea
            messages={messages}
            messagesLoading={messagesLoading}
            currentUser={user}
            onSendMessage={handleSendMessage}
            onReply={handleReply}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            isMember={isMember}
            isLoading={false}
            onFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            onTyping={(isTyping) => roomId && sendTypingIndicator(roomId, isTyping)}
            typingUsers={Object.keys(typingUsers)}
          />

          {/* Right Sidebar */}
          <RightSidebar
            isVisible={isRightPanelOpen}
            onToggle={() => setIsRightPanelOpen(!isRightPanelOpen)}
            aiEnabled={true}
            sharedResources={sharedResources}
            resourcesLoading={resourcesLoading}
            onResourceUpload={handleResourceUpload}
            onResourceDelete={handleResourceDelete}
          />
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            handleFileUpload(files);
          }
        }}
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
      />
    </div>
  );
}
