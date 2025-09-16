import React from 'react';
import { Users, Calendar, Lock, Unlock, Brain, MessageSquare, Star, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Room } from '@/types/api';
import { Link } from 'wouter';
import { formatDistanceToNow } from 'date-fns';

interface RoomCardProps {
  room: Room;
  memberCount?: number;
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  viewMode?: 'grid' | 'list';
  isJoining?: boolean;
  isLeaving?: boolean;
}

export function RoomCard({ 
  room, 
  memberCount = 0, 
  isMember = false, 
  onJoin, 
  onLeave, 
  viewMode = 'grid',
  isJoining = false,
  isLeaving = false 
}: RoomCardProps) {
  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isMember && onLeave) {
      onLeave();
    } else if (!isMember && onJoin) {
      onJoin();
    }
  };

  // Calculate actual member count from room data
  const actualMemberCount = room.memberCount || memberCount;
  const messageCount = room.messageCount || 0;

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer group">
        <Link href={`/room/${room.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate" data-testid={`room-name-${room.id}`}>
                      {room.name}
                    </h3>
                    {room.isPrivate ? (
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <Unlock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    {room.aiEnabled && (
                      <div title="AI Assistant Enabled">
                        <Brain className="w-4 h-4 text-accent-500 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0" data-testid={`room-subject-${room.id}`}>
                    {room.subject}
                  </Badge>
                </div>
                
                {room.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-2" data-testid={`room-description-${room.id}`}>
                    {room.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span data-testid={`room-member-count-${room.id}`}>{actualMemberCount} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{messageCount} messages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span data-testid={`room-created-${room.id}`}>
                      {formatDistanceToNow(new Date(room.createdAt!), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  variant={isMember ? "outline" : "default"}
                  onClick={handleAction}
                  disabled={isJoining || isLeaving}
                  className={isMember ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-primary-600 hover:bg-primary-700 text-white"}
                  data-testid={`button-${isMember ? 'leave' : 'join'}-room-${room.id}`}
                >
                  {isJoining ? 'Joining...' : isLeaving ? 'Leaving...' : isMember ? 'Leave' : 'Join'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group h-full">
      <Link href={`/room/${room.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1" data-testid={`room-name-${room.id}`}>
                  {room.name}
                </h3>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {room.isPrivate ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-gray-400" />
                  )}
                  {room.aiEnabled && (
                    <div title="AI Assistant Enabled">
                      <Brain className="w-4 h-4 text-accent-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="secondary" className="text-xs" data-testid={`room-subject-${room.id}`}>
                  {room.subject}
                </Badge>
                {room.maxParticipants && (
                  <Badge variant="outline" className="text-xs">
                    Max: {room.maxParticipants}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {room.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3" data-testid={`room-description-${room.id}`}>
              {room.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span data-testid={`room-member-count-${room.id}`}>{actualMemberCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3" />
                <span>{messageCount}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span data-testid={`room-created-${room.id}`}>
                {formatDistanceToNow(new Date(room.createdAt!), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <Button
              size="sm"
              variant={isMember ? "outline" : "default"}
              onClick={handleAction}
              disabled={isJoining || isLeaving}
              className={`w-full ${isMember ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-primary-600 hover:bg-primary-700 text-white"}`}
              data-testid={`button-${isMember ? 'leave' : 'join'}-room-${room.id}`}
            >
              {isJoining ? 'Joining...' : isLeaving ? 'Leaving...' : isMember ? 'Leave' : 'Join'}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

// Loading skeleton component for room cards
export function RoomCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-16 w-full" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
