import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TypingUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface TypingIndicatorProps {
  typingUsers?: TypingUser[];
  maxDisplayUsers?: number;
}

export function TypingIndicator({ 
  typingUsers = [], 
  maxDisplayUsers = 3 
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('');

  // Animate typing dots
  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  // Don't render if no one is typing
  if (typingUsers.length === 0) return null;

  // Get display users and overflow count
  const displayUsers = typingUsers.slice(0, maxDisplayUsers);
  const overflowCount = typingUsers.length - maxDisplayUsers;

  // Generate typing message
  const getTypingMessage = () => {
    if (typingUsers.length === 1) {
      return `${displayUsers[0].firstName} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      return `${displayUsers[0].firstName} and ${displayUsers[1].firstName} are typing${dots}`;
    } else if (typingUsers.length <= maxDisplayUsers) {
      const names = displayUsers.slice(0, -1).map(user => user.firstName).join(', ');
      const lastName = displayUsers[displayUsers.length - 1].firstName;
      return `${names}, and ${lastName} are typing${dots}`;
    } else {
      const names = displayUsers.map(user => user.firstName).join(', ');
      return `${names} and ${overflowCount} other${overflowCount > 1 ? 's' : ''} are typing${dots}`;
    }
  };

  return (
    <div className="flex items-center space-x-3 py-2 px-4 animate-fade-in">
      {/* User Avatars */}
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.id} className="w-6 h-6 border-2 border-white dark:border-gray-800">
            <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xs">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflowCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              +{overflowCount}
            </span>
          </div>
        )}
      </div>

      {/* Typing Message */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {getTypingMessage()}
        </span>
        
        {/* Animated Typing Dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
