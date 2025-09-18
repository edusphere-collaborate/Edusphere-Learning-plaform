import { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string, type?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: { id: string; content: string; user: string } | null;
  onCancelReply?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  placeholder = "Type a message...", 
  disabled = false,
  replyTo,
  onCancelReply
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Replying to {replyTo.user}</span>
              <p className="truncate max-w-xs">{replyTo.content}</p>
            </div>
            {onCancelReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                data-testid="button-cancel-reply"
              >
                ✕
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Chat input */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-1"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          {/* Message input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[40px] max-h-[120px] resize-none border-gray-300 dark:border-gray-600",
                "focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              )}
              data-testid="input-chat-message"
            />
            
            {/* Emoji button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 bottom-1"
              data-testid="button-emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="bg-primary-600 hover:bg-primary-700 text-white mb-1"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
