import React from 'react';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Crown, 
  Shield,
  UserCheck,
  Clock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  MoreVertical,
  UserPlus,
  Copy,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Room, User } from '@/types/api';

// Define RoomMember interface since it's not in API types
interface RoomMember {
  id: string;
  userId: string;
  roomId: string;
  user: User;
  joinedAt: string;
  role?: string;
}
import { formatDistanceToNow } from 'date-fns';

interface RoomSidebarProps {
  room?: Room;
  members: (RoomMember & { user: User })[];
  currentUser?: User | null;
  isVisible: boolean;
  onToggle: () => void;
  roomLoading: boolean;
  membersLoading: boolean;
  isMember: boolean;
  onJoinRoom: () => void;
  onlineUsers: string[];
  typingUsers?: string[];
}

export function RoomSidebar({
  room,
  members,
  currentUser,
  isVisible,
  onToggle,
  roomLoading,
  membersLoading,
  isMember,
  onJoinRoom,
  onlineUsers,
  typingUsers = []
}: RoomSidebarProps) {
  // Sort members by role and online status
  const sortedMembers = [...members].sort((a, b) => {
    // First sort by role priority
    const roleOrder: Record<string, number> = { admin: 0, moderator: 1, member: 2 };
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    if (roleComparison !== 0) return roleComparison;
    
    // Then by online status
    const aOnline = onlineUsers.includes(a.userId);
    const bOnline = onlineUsers.includes(b.userId);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    
    // Finally by name
    return a.user.firstName.localeCompare(b.user.firstName);
  });

  const onlineCount = members.filter(member => onlineUsers.includes(member.userId)).length;

  const copyRoomLink = () => {
    const url = `${window.location.origin}/room/${room?.id}`;
    navigator.clipboard.writeText(url);
  };

  const shareRoom = () => {
    if (navigator.share) {
      navigator.share({
        title: room?.name,
        text: `Join me in this discussion room: ${room?.name}`,
        url: `${window.location.origin}/room/${room?.id}`
      });
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Room Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Link href="/rooms">
            <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyRoomLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy room link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareRoom}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share room
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2" data-testid="room-title">
              {room?.name}
            </h1>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" data-testid="room-subject">
                {room?.subject}
              </Badge>
              {room?.isPrivate && (
                <Badge variant="outline" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
              {room?.aiEnabled && (
                <Badge variant="outline" className="text-xs bg-accent-50 text-accent-700 border-accent-200">
                  AI Enabled
                </Badge>
              )}
            </div>
          </div>
          
          {room?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3" data-testid="room-description">
              {room.description}
            </p>
          )}

          {/* Room Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {members.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {onlineCount}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
              </div>
            </Card>
          </div>

          {/* Room Info */}
          {room?.createdAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Created {formatDistanceToNow(new Date(room.createdAt), { addSuffix: true })}</span>
            </div>
          )}

          {/* Join Button */}
          {!isMember && (
            <Button 
              onClick={onJoinRoom}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              data-testid="button-join-room"
            >
              Join Room
            </Button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Members
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {onlineCount}/{members.length}
            </span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {membersLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : sortedMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No members yet</p>
              </div>
            ) : (
              sortedMembers.map((member) => {
                const isOnline = onlineUsers.includes(member.userId);
                const roleIcons = {
                  admin: <Crown className="w-3 h-3 text-yellow-500" />,
                  moderator: <Shield className="w-3 h-3 text-blue-500" />,
                  member: null
                };

                return (
                  <div 
                    key={member.id} 
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
                    data-testid={`member-${member.userId}`}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm">
                          {member.user.firstName[0]}{member.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.user.firstName} {member.user.lastName}
                        </span>
                        {roleIcons[member.role as keyof typeof roleIcons]}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {member.role}
                        </span>
                        {isOnline && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Online
                          </span>
                        )}
                      </div>
                      {member.lastSeen && !isOnline && (
                        <span className="text-xs text-gray-400">
                          Last seen {formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <UserCheck className="w-4 h-4 mr-2" />
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Volume2 className="w-4 h-4 mr-2" />
                          Send message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Room Rules */}
      {room?.rules && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Room Rules</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {room.rules}
          </p>
        </div>
      )}
    </div>
  );
}
