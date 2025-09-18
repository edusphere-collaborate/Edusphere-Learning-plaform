import { formatDistanceToNow } from 'date-fns';
import { Reply, MoreVertical } from 'lucide-react';
import { Message, User } from '@/types/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message & { user: User };
  isOwn: boolean;
  onReply?: (message: Message & { user: User }) => void;
}

export function MessageBubble({ message, isOwn, onReply }: MessageBubbleProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || message.user.username[0].toUpperCase();
  };

  return (
    <div className={cn(
      "group flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
      isOwn && "flex-row-reverse space-x-reverse"
    )}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white text-sm">
          {getInitials(message.user.firstName, message.user.lastName)}
        </AvatarFallback>
      </Avatar>
      
      {/* Message Content */}
      <div className={cn("flex-1 min-w-0", isOwn && "text-right")}>
        {/* User name and timestamp */}
        <div className={cn(
          "flex items-center space-x-2 mb-1",
          isOwn && "justify-end"
        )}>
          <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`message-user-${message.id}`}>
            {message.user.firstName} {message.user.lastName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400" data-testid={`message-time-${message.id}`}>
            {formatDistanceToNow(new Date(message.createdAt!), { addSuffix: true })}
          </span>
        </div>
        
        {/* Message bubble */}
        <div className={cn(
          "inline-block max-w-md p-3 rounded-lg",
          isOwn 
            ? "bg-primary-600 text-white" 
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words" data-testid={`message-content-${message.id}`}>
            {message.content}
          </p>
          
          {/* Message type indicator */}
          {message.type !== 'text' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 mt-2">
              {message.type}
            </span>
          )}
        </div>
        
        {/* Message actions */}
        <div className={cn(
          "flex items-center space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isOwn && "justify-end"
        )}>
          {onReply && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message)}
              className="h-6 px-2 text-xs"
              data-testid={`button-reply-${message.id}`}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                data-testid={`button-message-menu-${message.id}`}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid={`menu-copy-${message.id}`}>
                Copy message
              </DropdownMenuItem>
              {isOwn && (
                <DropdownMenuItem className="text-red-600" data-testid={`menu-delete-${message.id}`}>
                  Delete message
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
