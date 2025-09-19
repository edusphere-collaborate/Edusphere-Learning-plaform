import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Users,
  Settings,
  Search,
  Brain,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  Info,
  Sparkles,
  FileText,
  Star,
  Archive,
  Trash2,
  Code
} from 'lucide-react';
import { Room, Message, User, MessageReaction, UserRole } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EnhancedMessageBubble } from '@/components/Room/EnhancedMessageBubble';
import { MessageSearch } from '@/components/Room/MessageSearch';
import { EmojiPicker } from '@/components/Room/EmojiPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth, useApiClient } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Props for RoomChatInterface component
 */
interface RoomChatInterfaceProps {
  room: Room;
  onClose?: () => void;
  onRoomAction?: (roomId: string, action: string) => void;
  onMessagesChange?: (messages: (Message & { user: User })[]) => void;
  onAIAnalysis?: (type: 'summarize' | 'explain' | 'questions', context?: any) => void;
}

/**
 * Main chat interface component for a selected room
 * Displays messages, input area, and room header
 */
export function RoomChatInterface({ room, onClose, onRoomAction, onMessagesChange, onAIAnalysis }: RoomChatInterfaceProps) {
  // State management
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { user } = useAuth();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Get user initials safely from name
   */
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  /**
   * Fetch messages for the current room - only if user has access
   */
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['room-messages', room.id],
    queryFn: async () => {
      console.log(`[RoomChatInterface] Fetching messages for room ${room.id}`);
      try {
        const data = await apiClient.getRoomMessages(room.id);
        console.log(`[RoomChatInterface] Fetched ${data.length} messages`);
        return data;
      } catch (error: any) {
        // Handle unauthorized access
        if (error.status === 403 || error.status === 401) {
          console.error(`[RoomChatInterface] Access denied to room ${room.id}:`, error.message);
          throw new Error('You do not have access to this room. Please join the room first.');
        }
        throw error;
      }
    },
    enabled: !!room.id && !!user,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authorization errors
      if (error?.status === 403 || error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    }
  });

  /**
   * Fetch detailed room data to get accurate member count
   */
  const { data: detailedRoom } = useQuery({
    queryKey: ['room-details', room.id],
    queryFn: async () => {
      try {
        const response = await apiClient.getRoomById(room.id);
        console.log(`[RoomChatInterface] Fetched room details with ${response.users?.length || 0} members for room ${room.id}`);
        return response;
      } catch (error: any) {
        console.error(`[RoomChatInterface] Failed to fetch room details for ${room.id}:`, error);
        return null;
      }
    },
    enabled: !!room.id && !!user,
    refetchInterval: 30000, // Refresh room details every 30 seconds
    retry: 1
  });

  // Use actual member count from detailed room data, fallback to room properties if needed
  const memberCount = detailedRoom?.users?.length || room.userCount || room.memberCount || 0;

  /**
   * Send message mutation - with room access validation
   */
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        return await apiClient.sendMessage(room.id, {
          content,
          userId: user?.id || '',
          roomId: room.id
        });
      } catch (error: any) {
        // Handle unauthorized access
        if (error.status === 403 || error.status === 401) {
          console.error(`[RoomChatInterface] Cannot send message to room ${room.id}:`, error.message);
          throw new Error('You do not have permission to send messages in this room. Please join the room first.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] });
      // Scroll to bottom after sending message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  /**
   * Create file preview URL
   */
  const createFilePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  /**
   * Handle file upload with preview
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploadingFiles(fileArray);

    try {
      // Show upload progress
      toast({
        title: "Uploading files...",
        description: `Uploading ${fileArray.length} file(s)`,
      });

      // Process each file with preview
      for (const file of fileArray) {
        const fileUrl = createFilePreview(file);
        const fileType = file.type.split('/')[0]; // 'image', 'video', etc.

        let fileMessage = '';
        if (fileType === 'image') {
          fileMessage = `[IMAGE:${file.name}:${fileUrl}:${file.size}]`;
        } else if (fileType === 'video') {
          fileMessage = `[VIDEO:${file.name}:${fileUrl}:${file.size}]`;
        } else {
          fileMessage = `[FILE:${file.name}:${fileUrl}:${file.size}:${file.type}]`;
        }

        await sendMessageMutation.mutateAsync(fileMessage);
      }

      toast({
        title: "Files uploaded successfully",
        description: `${fileArray.length} file(s) shared in the room`,
      });

    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles([]);
      // Reset file input
      event.target.value = '';
    }
  };

  /**
   * Handle sending a message
   */
  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) return;

    sendMessageMutation.mutate(content);
  };

  /**
   * Handle key press in input
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * AI Analysis trigger functions
   */
  const triggerAIAnalysis = (type: 'summarize' | 'explain' | 'questions', selectedMessages?: Message[]) => {
    if (!onAIAnalysis) return;

    const context = {
      roomId: room.id,
      roomName: room.name,
      subject: room.subject,
      selectedMessages,
      totalMessages: messages.length,
      participants: room.maxParticipants || 0
    };

    onAIAnalysis(type, context);

    toast({
      title: "AI Analysis Started",
      description: `Analyzing conversation for ${type}...`,
    });
  };

  // Message reaction handler
  const handleMessageReaction = async (messageId: string, emoji: string) => {
    try {
      // TODO: Implement when backend supports reactions
      console.log('Message reaction not implemented yet:', { messageId, emoji });
      toast({
        title: "Feature Coming Soon",
        description: "Message reactions will be available soon",
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Message edit handler
  const handleMessageEdit = async (messageId: string, newContent: string) => {
    try {
      // TODO: Implement when backend supports message editing
      console.log('Message edit not implemented yet:', { messageId, newContent });
      toast({
        title: "Feature Coming Soon",
        description: "Message editing will be available soon",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  };

  // Message delete handler
  const handleMessageDelete = async (messageId: string) => {
    try {
      // TODO: Implement when backend supports message deletion
      console.log('Message delete not implemented yet:', messageId);
      toast({
        title: "Feature Coming Soon",
        description: "Message deletion will be available soon",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Typing indicator handlers
  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing start event via WebSocket
      // WebSocket implementation would go here
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Send typing stop event via WebSocket
    }, 3000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    // Send typing stop event via WebSocket
  };

  // Presence indicator component
  const PresenceIndicator = ({ userId, className = "" }: { userId: string; className?: string }) => {
    const isOnline = onlineUsers.includes(userId);
    return (
      <div className={`relative ${className}`}>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      </div>
    );
  };

  // Real-time reaction update handler
  const handleRealtimeReactionUpdate = (messageId: string, reactions: MessageReaction[]) => {
    // Update the message in the query cache with new reactions
    queryClient.setQueryData(['room-messages', room.id], (oldData: any) => {
      if (!oldData) return oldData;

      return oldData.map((message: Message) =>
        message.id === messageId
          ? { ...message, reactions }
          : message
      );
    });
  };

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    // WebSocket connection would be established here
    // Example WebSocket event handlers:

    const handleWebSocketMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'message_reaction_added':
        case 'message_reaction_removed':
          handleRealtimeReactionUpdate(data.messageId, data.reactions);
          break;
        case 'user_typing_start':
          if (data.userId !== user?.id) {
            setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
          }
          break;
        case 'user_typing_stop':
          setTypingUsers(prev => prev.filter(u => u !== data.username));
          break;
        case 'user_presence_update':
          setOnlineUsers(data.onlineUsers);
          break;
        default:
          break;
      }
    };

    // WebSocket setup would go here
    // ws.addEventListener('message', handleWebSocketMessage);

    return () => {
      // Cleanup WebSocket listeners
      // ws.removeEventListener('message', handleWebSocketMessage);
    };
  }, [room.id, user?.id, queryClient]);

  // Handle emoji selection from picker
  const handleEmojiSelect = (emoji: string) => {
    const cursorPosition = inputRef.current?.selectionStart || messageInput.length;
    const newMessage =
      messageInput.slice(0, cursorPosition) +
      emoji +
      messageInput.slice(cursorPosition);

    setMessageInput(newMessage);
    setShowEmojiPicker(false);

    // Focus back to input and set cursor position after emoji
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(
          cursorPosition + emoji.length,
          cursorPosition + emoji.length
        );
      }
    }, 0);
  };

  /**
   * Auto-scroll to bottom only when new messages are actually added
   * Prevents scrolling on every React Query refresh
   */
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    // Only scroll if new messages were added (not just a refresh)
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  /**
   * Focus input when component mounts
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, [room.id]);

  /**
   * Sort messages chronologically - oldest first (new messages at bottom)
   */
  const sortedMessages = React.useMemo(() => {
    const sorted = [...messages].sort((a, b) =>
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    return sorted;
  }, [messages]);

  /**
   * Notify parent of message changes separately to avoid infinite loop
   */
  React.useEffect(() => {
    if (onMessagesChange && sortedMessages.length > 0) {
      // Convert PublicUser to User for compatibility
      const messagesWithFullUser = sortedMessages.map(msg => ({
        ...msg,
        user: {
          ...msg.user,
          email: '', // PublicUser doesn't have email, use empty string
          role: UserRole.USER, // Default to USER role
          updatedAt: msg.createdAt || new Date().toISOString(), // Use createdAt as fallback
          bio: undefined,
          university: undefined,
          fieldOfStudy: undefined,
          yearOfStudy: undefined,
          interests: undefined,
          profilePicture: undefined,
          isEmailVerified: undefined
        }
      }));
      onMessagesChange(messagesWithFullUser);
    }
  }, [sortedMessages, onMessagesChange]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header - Fixed Position */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          {/* Room Avatar */}
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white font-medium">
              {getInitials(room.name)}
            </AvatarFallback>
          </Avatar>

          {/* Room Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {room.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
              {room.subject && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <Badge variant="secondary" className="text-xs">
                    {room.subject}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* AI Analysis Triggers */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => triggerAIAnalysis('summarize')}
            disabled={!messages || messages.length === 0}
          >
            <Brain className="w-3 h-3 mr-1" />
            Summarize
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowSearch(!showSearch)}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowRoomInfo(!showRoomInfo)}
          >
            <Info className="w-4 h-4" />
          </Button>

          {/* More Actions Dropdown with AI Features */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* AI Analysis Options */}
              <DropdownMenuItem
                onClick={() => triggerAIAnalysis('explain')}
                disabled={!messages || messages.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Explain Discussion
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => triggerAIAnalysis('questions')}
                disabled={!messages || messages.length === 0}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Generate Questions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => triggerAIAnalysis('summarize')}
                disabled={!messages || messages.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Full Summary
              </DropdownMenuItem>

              {/* Separator */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {/* Room Actions */}
              <DropdownMenuItem onClick={() => onRoomAction?.(room.id, 'star')}>
                <Star className="w-4 h-4 mr-2" />
                Star Room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoomAction?.(room.id, 'archive')}>
                <Archive className="w-4 h-4 mr-2" />
                Archive Room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoomAction?.(room.id, 'settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Room Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRoomAction?.(room.id, 'delete')}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Message Search Overlay */}
      {showSearch && (
        <MessageSearch
          messages={sortedMessages}
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onMessageSelect={(messageId) => {
            // Scroll to message logic can be added here
            console.log('Navigate to message:', messageId);
            setShowSearch(false);
          }}
          currentUser={user ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt
          } : {
            id: '',
            username: '',
            firstName: '',
            lastName: '',
            createdAt: new Date().toISOString()
          }}
        />
      )}

      {/* Messages Area - Scrollable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            {/* Show access error if user doesn't have permission */}
            {messagesError && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                    Access Denied
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    {messagesError.message || 'You do not have access to this room.'}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Please join the room first to view messages and participate in discussions.
                  </p>
                </div>
              </div>
            )}

            {!messagesError && (
              <div className="space-y-1 min-h-full max-w-full">
                {messagesLoading ? (
                  // Loading skeleton
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : sortedMessages.length === 0 ? (
                  // Empty state
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Be the first to send a message in this room
                    </p>
                  </div>
                ) : (
                  // Messages - newest at bottom
                  sortedMessages.map((message, index) => {
                    const isOwn = message.userId === user?.id;
                    const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
                    const nextMessage = index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null;

                    // Group messages from same user within 5 minutes
                    const isGrouped = prevMessage &&
                      prevMessage.userId === message.userId &&
                      new Date(message.createdAt || 0).getTime() - new Date(prevMessage.createdAt || 0).getTime() < 5 * 60 * 1000;

                    const showAvatar = !isGrouped || !nextMessage || nextMessage.userId !== message.userId;

                    // Convert PublicUser to User for EnhancedMessageBubble compatibility
                    const messageWithUser = {
                      ...message,
                      user: {
                        ...message.user,
                        email: '', // PublicUser doesn't have email
                        role: UserRole.USER, // Default role
                        updatedAt: message.createdAt || new Date().toISOString(),
                        bio: undefined,
                        university: undefined,
                        fieldOfStudy: undefined,
                        yearOfStudy: undefined,
                        interests: undefined,
                        profilePicture: undefined,
                        isEmailVerified: undefined
                      },
                      // Transform MessageEditHistory[] to MessageEditHistory[] maintaining structure
                      editHistory: message.editHistory?.map(edit => ({
                        id: edit.id,
                        previousContent: edit.previousContent, // Keep original field name
                        editedAt: new Date(edit.editedAt), // Convert string to Date object
                        editedBy: {
                          // Convert PublicUser to User format for component compatibility
                          id: edit.editedBy.id,
                          username: edit.editedBy.username,
                          firstName: edit.editedBy.firstName,
                          lastName: edit.editedBy.lastName,
                          email: '', // PublicUser doesn't expose email for privacy
                          role: 'STUDENT' as const, // Default role since PublicUser doesn't expose this
                          createdAt: edit.editedBy.createdAt,
                          updatedAt: edit.editedBy.createdAt, // Use createdAt as fallback
                          bio: undefined,
                          university: undefined,
                          fieldOfStudy: undefined,
                          yearOfStudy: undefined,
                          interests: undefined,
                          profilePicture: undefined,
                          isEmailVerified: undefined
                        }
                      }))
                    };

                    return (
                      <EnhancedMessageBubble
                        key={message.id}
                        message={messageWithUser}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        onDelete={() => handleMessageDelete(message.id)}
                        isEdited={message.isEdited ?? false}
                        onAction={(action: string) => {
                          // Handle message actions like copy, pin, etc.
                          console.log('Message action:', action, 'for message:', message.id);
                          // TODO: Implement message actions (copy, pin, etc.)
                        }}
                        isEditing={editingMessageId === message.id}
                        onStartEdit={() => setEditingMessageId(message.id)}
                        onCancelEdit={() => setEditingMessageId(null)}
                        reactionEmojis={[
                          { emoji: '👍🏻', icon: null, label: 'Thumbs up' },
                          { emoji: '❤️', icon: null, label: 'Heart' },
                          { emoji: '😊', icon: null, label: 'Smile' },
                          { emoji: '🎉', icon: null, label: 'Party' },
                          { emoji: '🤔', icon: null, label: 'Thinking' },
                          { emoji: '👎🏻', icon: null, label: 'Thumbs down' }
                        ]}
                      />
                    );
                  })
                )}

                {/* Typing Indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2 animate-fade-in">
                    <div className="flex space-x-1">
                      {typingUsers.slice(0, 3).map((username, index) => (
                        <Avatar key={index} className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {typingUsers.length === 1
                          ? `${typingUsers[0]} is typing`
                          : typingUsers.length === 2
                            ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
                            : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`
                        }
                      </span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Message Input - Fixed at Bottom - Only show if user has access */}
        {!messagesError && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-end space-x-3">
              {/* Attachment Button */}
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700",
                  uploadingFiles.length > 0 && "animate-pulse bg-blue-100 dark:bg-blue-900"
                )}
                onClick={() => document.getElementById('file-upload')?.click()}
                title="Upload files"
                disabled={uploadingFiles.length > 0}
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="Type your message here..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTypingStart();
                  }}
                  onBlur={handleTypingStop}
                  onKeyPress={handleKeyPress}
                  className="pr-10 resize-none"
                  disabled={sendMessageMutation.isPending}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700",
                    uploadingFiles.length > 0 && "animate-pulse bg-blue-100 dark:bg-blue-900"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                  title="Upload files"
                  disabled={uploadingFiles.length > 0}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                {/* Message Input */}
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder="Type your message here..."
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      handleTypingStart();
                    }}
                    onBlur={handleTypingStop}
                    onKeyPress={handleKeyPress}
                    className="pr-10 resize-none"
                    disabled={sendMessageMutation.isPending}
                  />

                  {/* Emoji Button */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                        type="button"
                      >
                        <Smile className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="end"
                      className="w-auto p-0 border-0 shadow-lg"
                      sideOffset={8}
                    >
                      <EmojiPicker
                        onEmojiSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Code Block Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    const cursorPos = inputRef.current?.selectionStart || 0;
                    const textBefore = messageInput.substring(0, cursorPos);
                    const textAfter = messageInput.substring(cursorPos);
                    const codeBlock = '\n```\n\n```\n';
                    const newText = textBefore + codeBlock + textAfter;
                    setMessageInput(newText);
                    // Set cursor position inside code block
                    setTimeout(() => {
                      if (inputRef.current) {
                        const newCursorPos = cursorPos + 5; // Position after ```\n
                        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                        inputRef.current.focus();
                      }
                    }, 0);
                  }}
                  title="Insert code block"
                >
                  <Code className="w-4 h-4" />
                </Button>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="h-9 w-9 p-0 flex-shrink-0 bg-primary-600 hover:bg-primary-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}




            {/* Room Info Sidebar (when expanded) */}
            {showRoomInfo && (
              <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Room Info</h3>

                  {/* Room Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {room.description || 'No description provided'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {room.subject || 'General'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Members</label>
                      <div className="mt-2 space-y-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'} in this room
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Member list not available - using room count
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>
    </div>
    )}
        

