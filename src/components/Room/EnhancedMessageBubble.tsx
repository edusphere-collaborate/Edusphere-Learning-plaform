import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MoreHorizontal, 
  Reply, 
  Edit3, 
  Trash2, 
  Copy,
  Pin,
  Flag,
  Smile,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  Angry,
  Frown,
  FileText,
  Image as ImageIcon,
  Code,
  ExternalLink,
  Download,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Message, MessageReaction, MessageEditHistory, User } from '@/types/api';
import { CodeBlock } from './CodeBlock';
import { FilePreview } from './FilePreview';
import { ImageGallery } from './ImageGallery';

/**
 * Message status indicator component
 */
const MessageStatus = ({ status, isOwn }: { status?: string; isOwn: boolean }) => {
  if (!isOwn || !status) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center ml-1" title={`Message ${status}`}>
      {getStatusIcon()}
    </div>
  );
};

/**
 * Message edit history interface
 */
interface MessageEdit {
  id: string;
  content: string;
  editedAt: Date;
  editedBy: User;
}

/**
 * Enhanced message bubble props with reactions and editing
 */
interface EnhancedMessageBubbleProps {
  message: Message & { 
    user: User;
    reactions?: MessageReaction[];
    editHistory?: MessageEdit[];
    isEdited?: boolean;
    replyTo?: { id: string; content: string; user: string };
  };
  isOwn: boolean;
  showAvatar: boolean;
  isGrouped: boolean;
  onReply: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: () => void;
  onAction: (action: string) => void;
  reactionEmojis: Array<{
    emoji: string;
    icon: any;
    label: string;
  }>;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
}

export function EnhancedMessageBubble({
  message,
  isOwn,
  showAvatar,
  isGrouped,
  onReply,
  onReaction,
  onEdit,
  onDelete,
  onAction,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  reactionEmojis
}: EnhancedMessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState(message.content);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  // Helper function to get user initials safely
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || message.user.username[0].toUpperCase();
  };

  // Handle edit save
  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    onCancelEdit?.();
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditContent(message.content);
    onCancelEdit?.();
  };

  // Handle reaction toggle
  const handleReactionToggle = (emoji: string) => {
    if (onReaction) {
      onReaction(message.id, emoji);
    }
  };

  // Emoji picker component
  const EmojiPicker = () => {
    const commonEmojis = ['👍🏻', '❤️', '😊', '🎉', '🤔', '👎🏻'];
    
    return (
      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex gap-1 z-50">
        {commonEmojis.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              handleReactionToggle(emoji);
              setShowReactions(false);
            }}
          >
            {emoji}
          </Button>
        ))}
      </div>
    );
  };

  // Parse message content based on type
  const renderMessageContent = () => {
    switch (message.type) {
      case 'code':
        return (
          <CodeBlock
            code={message.content}
            language={message.metadata?.language || 'javascript'}
            fileName={message.metadata?.fileName}
          />
        );
      
      case 'image':
        return (
          <ImageGallery
            images={[{ url: message.content, alt: 'Shared image' }]}
            onImageClick={setImagePreview}
          />
        );
      
      case 'file':
        return (
          <FilePreview
            fileName={message.metadata?.fileName || 'Unknown file'}
            fileSize={message.metadata?.fileSize}
            fileType={message.metadata?.fileType}
            downloadUrl={message.content}
          />
        );
      
      default:
        return (
          <div className={`prose prose-sm max-w-none ${
            isOwn ? 'prose-invert' : 'dark:prose-invert'
          }`}>
            {/* Handle reply context */}
            {message.replyToId && message.metadata?.replyTo && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-primary-500">
                <div className="flex items-center space-x-2 mb-1">
                  <Reply className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {message.metadata.replyTo.user}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {message.metadata.replyTo.content}
                </p>
              </div>
            )}
            
            {/* Message text with link detection */}
            <div className={`whitespace-pre-wrap break-words ${
              isOwn ? 'text-white' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {message.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part: string, index: number) => {
                if (part.match(/^https?:\/\//)) {
                  return (
                    <a
                      key={index}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline inline-flex items-center"
                    >
                      {part}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  );
                }
                return part;
              })}
            </div>
          </div>
        );
    }
  };

  // Get message type icon
  const getMessageTypeIcon = () => {
    switch (message.type) {
      case 'code':
        return <Code className="w-3 h-3 text-blue-500" />;
      case 'image':
        return <ImageIcon className="w-3 h-3 text-green-500" />;
      case 'file':
        return <FileText className="w-3 h-3 text-purple-500" />;
      default:
        return null;
    }
  };

  // Calculate reaction counts
  const reactionCounts = message.reactions?.reduce((acc: any, reaction: any) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}>
      <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                {getInitials(message.user.firstName, message.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-green-500`}
              title="Online"
            />
          </div>
        )}
        
        {/* Message Content */}
        <div className={`group relative ${isOwn ? 'mr-2' : 'ml-2'}`}>
          {/* Message Header */}
          {showAvatar && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isOwn ? 'You' : `${message.user.firstName} ${message.user.lastName}`}
              </span>
              {message.isEdited && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (edited)
                </span>
              )}
              <MessageStatus status={message.status} isOwn={isOwn} />
              {getMessageTypeIcon()}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  try {
                    // Use sentAt if createdAt is not available (database schema mismatch)
                    const timestamp = message.createdAt || (message as any).sentAt;
                    
                    if (!timestamp) {
                      console.warn('Message missing both createdAt and sentAt:', message);
                      return 'just now';
                    }
                    
                    const date = new Date(timestamp);
                    if (isNaN(date.getTime())) {
                      console.warn('Invalid date format:', timestamp);
                      return 'just now';
                    }
                    
                    // Check if the date is very recent (less than 1 minute ago)
                    const now = new Date();
                    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
                    
                    if (diffInSeconds < 60) {
                      return 'just now';
                    }
                    
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch (error) {
                    console.error('Error formatting message timestamp:', {
                      messageId: message.id,
                      createdAt: message.createdAt,
                      sentAt: (message as any).sentAt,
                      error: error
                    });
                    return 'just now';
                  }
                })()}
              </span>
            </div>
          )}

          {/* Reply Preview */}
          {message.replyTo && (
            <div className="mb-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Reply className="w-3 h-3 mr-1" />
                  Replying to {message.replyTo.user}
                </div>
                <div className="text-gray-700 dark:text-gray-300 truncate">
                  {message.replyTo.content.length > 100 
                    ? `${message.replyTo.content.substring(0, 100)}...` 
                    : message.replyTo.content
                  }
                </div>
              </div>
            </div>
          )}

          {/* Message Bubble */}
          <Card className={`relative ${
            isOwn 
              ? 'bg-primary-600 text-white' 
              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}>
            <CardContent className="p-3">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] resize-none bg-transparent border-none p-0 focus:ring-0 text-inherit"
                    placeholder="Edit your message..."
                  />
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCancel}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleEditSave}
                      disabled={!editContent.trim() || editContent === message.content}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {renderMessageContent()}
                  {message.isEdited && (
                    <div className="text-xs text-gray-400 mt-1">
                      <Edit className="w-3 h-3 inline mr-1" />
                      edited
                    </div>
                  )}
                </>
              )}
            </CardContent>

            {/* Message Actions */}
            <div className={`absolute top-2 ${isOwn ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="flex items-center space-x-1">
                {/* Quick Reactions */}
                <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1">
                  {reactionEmojis.slice(0, 3).map(({ emoji, label }) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => onReaction?.(message.id, emoji)}
                      title={label}
                    >
                      <span className="text-sm">{emoji}</span>
                    </Button>
                  ))}
                  
                  {/* More Reactions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <span className="text-xs">+</span>
                  </Button>
                </div>

                {/* Message Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={() => onReply(message.id)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('copy')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy text
                    </DropdownMenuItem>
                    {message.type === 'file' && (
                      <DropdownMenuItem onClick={() => window.open(message.content, '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onAction('pin')}>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin message
                    </DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuItem onClick={onStartEdit}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={onDelete}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>

          {/* Extended Reaction Picker */}
          {showReactions && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 z-10">
              <div className="grid grid-cols-6 gap-1">
                {reactionEmojis.map(({ emoji, label }) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      onReaction?.(message.id, emoji);
                      setShowReactions(false);
                    }}
                    title={label}
                  >
                    <span className="text-lg">{emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Reactions Display */}
          {hasReactions && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <Button
                  key={emoji}
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-0 text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => onReaction?.(message.id, emoji)}
                >
                  <span className="mr-1">{emoji}</span>
                  <span>{count as number}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Message Status */}
          {isOwn && (
            <div className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
              {message.status === 'sending' && 'Sending...'}
              {message.status === 'sent' && 'Sent'}
              {message.status === 'delivered' && 'Delivered'}
              {message.status === 'read' && 'Read'}
              {message.status === 'failed' && 'Failed to send'}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImagePreview(null)}
        >
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
