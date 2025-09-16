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
  Phone,
  Video,
  Info,
  Sparkles,
  FileText,
  Star,
  Archive,
  Trash2
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
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
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
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
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
   * Fetch messages for the current room
   */
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['room-messages', room.id],
    queryFn: async () => {
      console.log(`[RoomChatInterface] Fetching messages for room ${room.id}`);
      const response = await authenticatedFetch(`/api/rooms/${room.id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log(`[RoomChatInterface] Fetched ${data.length} messages`);
      return data;
    },
    enabled: !!room.id,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  /**
   * Fetch room members
   */
  const { data: members = [] } = useQuery({
    queryKey: ['room-members', room.id],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/rooms/${room.id}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      return response.json();
    },
    enabled: !!room.id,
  });

  /**
   * Send message mutation
   */
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await authenticatedFetch(`/api/rooms/${room.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
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
      const response = await authenticatedFetch(`/api/rooms/${room.id}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      // Invalidate messages query to refetch with updated reactions
      queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] });

      toast({
        title: "Reaction added",
        description: `Added ${emoji} reaction to message`,
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
      const response = await authenticatedFetch(`/api/rooms/${room.id}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit message');
      }

      // Invalidate messages query to refetch with updated content
      queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] });
      setEditingMessageId(null);

      toast({
        title: "Message updated",
        description: "Your message has been edited successfully",
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
      const response = await authenticatedFetch(`/api/rooms/${room.id}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      // Invalidate messages query to refetch without deleted message
      queryClient.invalidateQueries({ queryKey: ['room-messages', room.id] });

      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully",
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
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
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
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Focus input when component mounts
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, [room.id]);

  /**
   * Sort messages chronologically
   */
  const sortedMessages = React.useMemo(() => {
    const sorted = [...messages].sort((a, b) => 
      new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
    
    // Notify parent component of message changes for AI analysis
    if (onMessagesChange) {
      onMessagesChange(sorted);
    }
    
    return sorted;
  }, [messages, onMessagesChange]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
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
                {members.length} members
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="w-4 h-4" />
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
          currentUser={user || { 
            id: '', 
            username: '', 
            firstName: '', 
            lastName: '', 
            email: '',
            role: 'User' as UserRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 flex">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
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
                // Messages
                sortedMessages.map((message, index, array) => {
                  const isOwn = message.userId === user?.id;
                  const prevMessage = index > 0 ? array[index - 1] : null;
                  const nextMessage = index < array.length - 1 ? array[index + 1] : null;
                  
                  // Group messages from same user within 5 minutes
                  const isGrouped = prevMessage && 
                    prevMessage.userId === message.userId &&
                    new Date(message.createdAt || 0).getTime() - new Date(prevMessage.createdAt || 0).getTime() < 5 * 60 * 1000;
                  
                  const showAvatar = !isGrouped || !nextMessage || nextMessage.userId !== message.userId;

                  return (
                    <EnhancedMessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar}
                      isGrouped={isGrouped}
                      onReply={(messageId: string) => {
                        // Set reply context for message input
                        console.log('Reply to message:', messageId);
                        // TODO: Implement reply functionality
                        // This should set the reply context in the message input component
                      }}
                      onReaction={(messageId: string, emoji: string) => handleMessageReaction(messageId, emoji)}
                      onEdit={(messageId: string, content: string) => handleMessageEdit(messageId, content)}
                      onDelete={() => handleMessageDelete(message.id)}
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
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-end space-x-3">
              {/* Attachment Button */}
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex-shrink-0">
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

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="h-9 w-9 p-0 flex-shrink-0 bg-primary-600 hover:bg-primary-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Someone is typing...
              </div>
            )}
          </div>
        </div>

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
                    {members.slice(0, 5).map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-xs">
                            {getInitials(member.user?.username || member.username || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {member.user?.username || member.username || 'Unknown User'}
                        </span>
                      </div>
                    ))}
                    {members.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        +{members.length - 5} more members
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
