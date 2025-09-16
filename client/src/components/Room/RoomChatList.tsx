import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, MoreVertical, Pin, Archive, Bell, BellOff } from 'lucide-react';
import { Room, Message, User } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Interface for room with latest message data
 */
interface RoomWithLatestMessage extends Room {
  latestMessage?: Message & { user: User };
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isOnline?: boolean;
}

/**
 * Props for RoomChatList component
 */
interface RoomChatListProps {
  rooms: RoomWithLatestMessage[];
  selectedRoomId?: string;
  onRoomSelect: (room: RoomWithLatestMessage) => void;
  onRoomAction?: (roomId: string, action: 'pin' | 'archive' | 'mute' | 'unmute') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
}

/**
 * WhatsApp/Telegram-style room chat list component
 * Displays rooms as conversation items with latest messages and metadata
 */
export function RoomChatList({
  rooms,
  selectedRoomId,
  onRoomSelect,
  onRoomAction,
  searchQuery,
  onSearchChange,
  isLoading = false
}: RoomChatListProps) {
  
  /**
   * Get user initials safely from name fields
   */
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  /**
   * Format time for message timestamps
   */
  const formatMessageTime = (date: string | Date) => {
    try {
      const messageDate = new Date(date);
      const now = new Date();
      const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return messageDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (diffInHours < 168) { // Less than a week
        return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return messageDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      return '';
    }
  };

  /**
   * Truncate message content for preview
   */
  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  /**
   * Filter rooms based on search query
   */
  const filteredRooms = React.useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query) ||
      room.subject?.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  /**
   * Sort rooms by priority (pinned first, then by latest message time)
   */
  const sortedRooms = React.useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      // Pinned rooms first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by latest message time
      const aTime = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const bTime = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
      
      return bTime - aTime;
    });
  }, [filteredRooms]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Messages</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-gray-800 border-none"
          />
        </div>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            // Loading skeleton
            [...Array(8)].map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            ))
          ) : sortedRooms.length === 0 ? (
            // Empty state
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="text-sm">
                {searchQuery ? 'No rooms match your search' : 'No rooms found'}
              </div>
            </div>
          ) : (
            // Room items
            sortedRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => onRoomSelect(room)}
                className={cn(
                  "flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                  selectedRoomId === room.id && "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 mr-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white font-medium">
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  {room.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.isPinned && (
                        <Pin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      {room.isMuted && (
                        <BellOff className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {room.latestMessage && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(room.latestMessage.createdAt)}
                        </span>
                      )}
                      {room.unreadCount && room.unreadCount > 0 && (
                        <Badge 
                          variant="default" 
                          className="bg-green-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1.5"
                        >
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {room.latestMessage ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          <span className="font-medium">
                            {room.latestMessage.user.username}:
                          </span>{' '}
                          {truncateMessage(room.latestMessage.content)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoomAction?.(room.id, room.isPinned ? 'pin' : 'pin');
                      }}
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      {room.isPinned ? 'Unpin' : 'Pin'} Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoomAction?.(room.id, room.isMuted ? 'unmute' : 'mute');
                      }}
                    >
                      {room.isMuted ? (
                        <Bell className="w-4 h-4 mr-2" />
                      ) : (
                        <BellOff className="w-4 h-4 mr-2" />
                      )}
                      {room.isMuted ? 'Unmute' : 'Mute'} Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onRoomAction?.(room.id, 'archive');
                      }}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
