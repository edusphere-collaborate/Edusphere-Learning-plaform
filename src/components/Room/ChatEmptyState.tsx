import React from 'react';
import { MessageCircle, Users, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Props for ChatEmptyState component
 */
interface ChatEmptyStateProps {
  onCreateRoom?: () => void;
  onExploreRooms?: () => void;
}

/**
 * Empty state component for chat area when no room is selected
 * Displays welcome message and action buttons
 */
export function ChatEmptyState({ onCreateRoom, onExploreRooms }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
      <div className="text-center max-w-md px-6">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Select a Room to Chat
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Choose a room from the sidebar to start your conversation or create a new room to begin collaborating.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onCreateRoom}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            Create New Room
          </Button>
          <Button 
            onClick={onExploreRooms}
            variant="outline" 
            className="w-full"
          >
            Explore Rooms
          </Button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6">
          Use the search bar to quickly find specific rooms
        </p>
      </div>
    </div>
  );
}
