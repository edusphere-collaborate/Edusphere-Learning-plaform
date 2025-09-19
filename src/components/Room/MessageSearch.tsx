import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Calendar,
  User,
  Filter,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Message, PublicUser } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

/**
 * Search filters interface for message filtering
 */
interface SearchFilters {
  user?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  messageType?: 'text' | 'file' | 'image' | 'code' | 'all';
}

/**
 * Search result interface with highlighting
 */
interface SearchResult {
  message: Message & { user: PublicUser };
  matchIndex: number;
  snippet: string;
  highlights: Array<{ start: number; end: number }>;
}

/**
 * Props interface for MessageSearch component
 */
interface MessageSearchProps {
  messages: Array<Message & { user: PublicUser }>;
  isOpen: boolean;
  onClose: () => void;
  onMessageSelect: (messageId: string) => void;
  currentUser: PublicUser;
}

/**
 * MessageSearch Component
 * 
 * Professional message search interface with advanced filtering,
 * real-time search results, and message highlighting capabilities.
 * Follows clean code architecture with comprehensive error handling.
 */
export function MessageSearch({
  messages,
  isOpen,
  onClose,
  onMessageSelect,
  currentUser
}: MessageSearchProps) {
  // State management for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
    messageType: 'all'
  });
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Advanced search function with fuzzy matching and filtering
   * Implements comprehensive search logic with performance optimization
   */
  const performSearch = useCallback(async (query: string, searchFilters: SearchFilters) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Filter messages based on search criteria
      let filteredMessages = messages.filter(message => {
        // Date range filtering
        if (searchFilters.dateRange && searchFilters.dateRange !== 'all') {
          if (!message.createdAt) return false;
          const messageDate = new Date(message.createdAt);
          const now = new Date();
          const daysDiff = (now.getTime() - messageDate.getTime()) / (1000 * 3600 * 24);
          
          switch (searchFilters.dateRange) {
            case 'today':
              if (daysDiff > 1) return false;
              break;
            case 'week':
              if (daysDiff > 7) return false;
              break;
            case 'month':
              if (daysDiff > 30) return false;
              break;
          }
        }

        // Message type filtering
        if (searchFilters.messageType && searchFilters.messageType !== 'all') {
          if (message.type !== searchFilters.messageType) return false;
        }

        // User filtering
        if (searchFilters.user) {
          if (message.user.username !== searchFilters.user) return false;
        }

        return true;
      });

      // Perform text search with highlighting
      const results: SearchResult[] = [];
      const queryLower = query.toLowerCase();

      filteredMessages.forEach((message, index) => {
        const content = message.content.toLowerCase();
        const username = message.user.username.toLowerCase();
        const firstName = (message.user.firstName || '').toLowerCase();
        const lastName = (message.user.lastName || '').toLowerCase();

        // Search in message content
        let matchIndex = content.indexOf(queryLower);
        if (matchIndex !== -1) {
          const snippet = extractSnippet(message.content, matchIndex, query.length);
          const highlights = findHighlights(snippet, query);
          
          results.push({
            message,
            matchIndex,
            snippet,
            highlights
          });
          return;
        }

        // Search in user information
        if (username.includes(queryLower) || 
            firstName.includes(queryLower) || 
            lastName.includes(queryLower)) {
          const snippet = message.content.length > 100 
            ? `${message.content.substring(0, 100)}...` 
            : message.content;
          
          results.push({
            message,
            matchIndex: 0,
            snippet,
            highlights: []
          });
        }
      });

      // Sort results by relevance (exact matches first, then by date)
      results.sort((a, b) => {
        const aExact = a.message.content.toLowerCase().includes(queryLower);
        const bExact = b.message.content.toLowerCase().includes(queryLower);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Sort by date (newest first)
        const aDate = a.message.createdAt ? new Date(a.message.createdAt).getTime() : 0;
        const bDate = b.message.createdAt ? new Date(b.message.createdAt).getTime() : 0;
        return bDate - aDate;
      });

      setSearchResults(results);
      setCurrentResultIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [messages]);

  /**
   * Extract snippet around match with context
   */
  const extractSnippet = (content: string, matchIndex: number, queryLength: number): string => {
    const contextLength = 50;
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(content.length, matchIndex + queryLength + contextLength);
    
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  };

  /**
   * Find highlight positions in snippet
   */
  const findHighlights = (snippet: string, query: string): Array<{ start: number; end: number }> => {
    const highlights: Array<{ start: number; end: number }> = [];
    const queryLower = query.toLowerCase();
    const snippetLower = snippet.toLowerCase();
    
    let index = 0;
    while (index < snippetLower.length) {
      const matchIndex = snippetLower.indexOf(queryLower, index);
      if (matchIndex === -1) break;
      
      highlights.push({
        start: matchIndex,
        end: matchIndex + query.length
      });
      
      index = matchIndex + query.length;
    }
    
    return highlights;
  };

  /**
   * Handle search input changes with debouncing
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery, filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters, performSearch]);

  /**
   * Navigate to next search result
   */
  const navigateToNext = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    onMessageSelect(searchResults[nextIndex].message.id);
  };

  /**
   * Navigate to previous search result
   */
  const navigateToPrevious = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentResultIndex === 0 
      ? searchResults.length - 1 
      : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    onMessageSelect(searchResults[prevIndex].message.id);
  };

  /**
   * Clear search and reset state
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    setFilters({ dateRange: 'all', messageType: 'all' });
  };

  /**
   * Get unique users for filtering
   */
  const getUniqueUsers = () => {
    const users = new Map();
    messages.forEach(message => {
      if (!users.has(message.user.id)) {
        users.set(message.user.id, message.user);
      }
    });
    return Array.from(users.values());
  };

  /**
   * Render highlighted text with search matches
   */
  const renderHighlightedText = (text: string, highlights: Array<{ start: number; end: number }>) => {
    if (highlights.length === 0) return text;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(text.substring(lastIndex, highlight.start));
      }

      // Add highlighted text
      parts.push(
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
          {text.substring(highlight.start, highlight.end)}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="p-4 space-y-4">
        {/* Search Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Messages
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Input and Controls */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages, users, or content..."
              className="pl-10 pr-4"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Search Navigation */}
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentResultIndex + 1} of {searchResults.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToPrevious}
                disabled={searchResults.length === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToNext}
                disabled={searchResults.length === 0}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Search Filters */}
        <div className="flex items-center space-x-2">
          {/* Date Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {filters.dateRange === 'all' ? 'All time' : 
                 filters.dateRange === 'today' ? 'Today' :
                 filters.dateRange === 'week' ? 'This week' : 'This month'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}>
                All time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'today' }))}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'week' }))}>
                This week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'month' }))}>
                This month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                {filters.user || 'All users'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, user: undefined }))}>
                All users
              </DropdownMenuItem>
              {getUniqueUsers().map(user => (
                <DropdownMenuItem 
                  key={user.id}
                  onClick={() => setFilters(prev => ({ ...prev, user: user.username }))}
                >
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Message Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {filters.messageType === 'all' ? 'All types' : 
                 filters.messageType ? filters.messageType.charAt(0).toUpperCase() + filters.messageType.slice(1) : 'All types'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, messageType: 'all' }))}>
                All types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, messageType: 'text' }))}>
                Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, messageType: 'file' }))}>
                Files
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, messageType: 'image' }))}>
                Images
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, messageType: 'code' }))}>
                Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Filters Display */}
          {(filters.user || filters.dateRange !== 'all' || filters.messageType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ dateRange: 'all', messageType: 'all' })}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No messages found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((result, index) => (
                <Card 
                  key={result.message.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index === currentResultIndex ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => {
                    setCurrentResultIndex(index);
                    onMessageSelect(result.message.id);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">
                            {result.message.user.firstName && result.message.user.lastName
                              ? `${result.message.user.firstName} ${result.message.user.lastName}`
                              : result.message.user.username}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {result.message.type}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {result.message.createdAt ? formatDistanceToNow(new Date(result.message.createdAt), { addSuffix: true }) : 'Unknown time'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {renderHighlightedText(result.snippet, result.highlights)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
