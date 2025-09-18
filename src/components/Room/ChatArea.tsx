"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Paperclip,
  Mic,
  ArrowDown,
  MoreVertical,
  Phone,
  Video,
  Search,
  Settings,
  Reply,
  X,
  Smile,
  Check,
  CheckCheck,
  Copy, // Added Copy icon
  Edit,
  Trash,
  Brain,
  Sparkles,
  FileText,
  MessageSquare,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Message, User } from "@/types/api";

// Auto-scroll hook for professional chat behavior
interface ScrollState {
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
}

interface UseAutoScrollOptions {
  offset?: number;
  smooth?: boolean;
  content?: React.ReactNode;
}

function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { offset = 20, smooth = false, content } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContentHeight = useRef(0);
  const userHasScrolled = useRef(false);

  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtBottom: true,
    autoScrollEnabled: true,
  });

  const checkIsAtBottom = useCallback(
    (element: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
      return distanceToBottom <= offset;
    },
    [offset]
  );

  const scrollToBottom = useCallback(
    (instant?: boolean) => {
      if (!scrollRef.current) return;

      const targetScrollTop =
        scrollRef.current.scrollHeight - scrollRef.current.clientHeight;

      if (instant) {
        scrollRef.current.scrollTop = targetScrollTop;
      } else {
        scrollRef.current.scrollTo({
          top: targetScrollTop,
          behavior: smooth ? "smooth" : "auto",
        });
      }

      setScrollState({
        isAtBottom: true,
        autoScrollEnabled: true,
      });
      userHasScrolled.current = false;
    },
    [smooth]
  );

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const atBottom = checkIsAtBottom(scrollRef.current);

    setScrollState((prev) => ({
      isAtBottom: atBottom,
      autoScrollEnabled: atBottom ? true : prev.autoScrollEnabled,
    }));
  }, [checkIsAtBottom]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const currentHeight = scrollElement.scrollHeight;
    const hasNewContent = currentHeight !== lastContentHeight.current;

    if (hasNewContent) {
      if (scrollState.autoScrollEnabled) {
        requestAnimationFrame(() => {
          scrollToBottom(lastContentHeight.current === 0);
        });
      }
      lastContentHeight.current = currentHeight;
    }
  }, [content, scrollState.autoScrollEnabled, scrollToBottom]);

  const disableAutoScroll = useCallback(() => {
    const atBottom = scrollRef.current ? checkIsAtBottom(scrollRef.current) : false;

    if (!atBottom) {
      userHasScrolled.current = true;
      setScrollState((prev) => ({
        ...prev,
        autoScrollEnabled: false,
      }));
    }
  }, [checkIsAtBottom]);

  return {
    scrollRef,
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
  };
}

// Chat Interface Props
interface ChatAreaProps {
  messages: (Message & { user: User })[];
  messagesLoading: boolean;
  currentUser?: User | null;
  onSendMessage: (content: string, type?: string) => void;
  onReply: (message: Message & { user: User }) => void;
  replyTo: { id: string; content: string; user: string } | null;
  onCancelReply: () => void;
  isMember?: boolean;
  isLoading: boolean;
  onFileUpload: (files: File[]) => void;
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onTyping?: (isTyping: boolean) => void;
  typingUsers?: string[];
  conversationPartner?: User;
}

// Chat Bubble Components
interface ChatBubbleProps {
  variant: "sent" | "received";
  children: React.ReactNode;
  className?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ variant, children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex gap-2 max-w-[75%] group relative",
        variant === "sent" ? "ml-auto flex-row-reverse items-end" : "mr-auto items-end",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface ChatBubbleAvatarProps {
  src?: string;
  fallback: string;
  className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({ src, fallback, className }) => {
  return (
    <Avatar className={cn("w-8 h-8 flex-shrink-0", className)}>
      <AvatarImage src={src} alt={fallback} />
      <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
    </Avatar>
  );
};

interface ChatBubbleMessageProps {
  variant: "sent" | "received";
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const ChatBubbleMessage: React.FC<ChatBubbleMessageProps> = ({
  variant,
  children,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div
        className={cn("px-4 py-3 rounded-2xl bg-muted max-w-xs", className)}
      >
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              className="w-2 h-2 bg-muted-foreground/60 rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: dot * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-2xl max-w-md break-words shadow-sm",
        variant === "sent"
          ? "bg-primary text-primary-foreground rounded-br-none"
          : "bg-background border border-border text-foreground rounded-bl-none",
        className
      )}
    >
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
};

// Chat Message List Component
interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = true, ...props }, _ref) => {
    const { scrollRef, isAtBottom, scrollToBottom, disableAutoScroll } =
      useAutoScroll({
        smooth,
        content: children,
      });

    return (
      <div className="relative flex-1 overflow-hidden">
        <div
          className={cn(
            "flex flex-col w-full h-full p-4 overflow-y-auto space-y-4",
            className
          )}
          ref={scrollRef}
          onWheel={disableAutoScroll}
          onTouchMove={disableAutoScroll}
          {...props}
        >
          {children}
        </div>

        {!isAtBottom && (
          <Button
            onClick={scrollToBottom}
            size="icon"
            variant="outline"
            className="absolute bottom-4 right-4 rounded-full shadow-md z-10"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

// Chat Input Component
const ChatInput = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <Textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm min-h-[48px] max-h-[200px]",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-none overflow-auto",
        className
      )}
      {...props}
    />
  );
});

ChatInput.displayName = "ChatInput";

// Typing Indicator Component
const TypingIndicator: React.FC<{ typingUsers: string[] }> = ({
  typingUsers,
}) => {
  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 pb-2"
    >
      <Avatar className="w-6 h-6">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs text-center">
          AI
        </AvatarFallback>
      </Avatar>
      <div className="bg-background border border-border rounded-2xl rounded-bl-none px-3 py-2">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <motion.div
              className="w-1.5 h-1.5 bg-foreground rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-foreground rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-foreground rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4,
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Message Bubble Component with Improvements
interface ProfessionalMessageBubbleProps {
  message: Message & { user: User };
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  showReadReceipt?: boolean;
  onReply: () => void;
  onAction: (action: string) => void;
}

const ProfessionalMessageBubble: React.FC<ProfessionalMessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  showReadReceipt = false,
  onReply,
  onAction,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <ChatBubble variant={isOwn ? "sent" : "received"}>
        {showAvatar && !isOwn && (
          <ChatBubbleAvatar
            src={message.user.profilePicture}
            fallback={message.user.username[0].toUpperCase()}
          />
        )}
        <div
          className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}
        >
          {showAvatar && (
            <span className="text-xs font-medium text-muted-foreground mb-1">
              {message.user.username}
            </span>
          )}
          <ChatBubbleMessage variant={isOwn ? "sent" : "received"}>
            {message.content}
          </ChatBubbleMessage>
          {(showTimestamp || showReadReceipt) && (
            <div
              className={cn(
                "flex items-center gap-1 mt-1",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              {showTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {(() => {
                    // Use database createdAt field for consistent timestamps
                    const dateValue = message.createdAt;
                    if (!dateValue) return '--:--';
                    
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) return '--:--';
                    
                    return date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  })()}
                </span>
              )}
              {showReadReceipt && isOwn && (
                <span className="text-primary">
                  <CheckCheck className="w-3 h-3" />
                </span>
              )}
            </div>
          )}
        </div>
        {showAvatar && isOwn && (
          <ChatBubbleAvatar
            src={message.user.profilePicture}
            fallback={message.user.username[0].toUpperCase()}
          />
        )}
      </ChatBubble>

      {/* Message Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "absolute top-0 flex gap-1 bg-background border border-border rounded-full shadow-sm p-1",
              isOwn ? "right-0 -translate-x-1/2" : "left-0 translate-x-1/2"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={onReply}
            >
              <Reply className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => onAction("copy")}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {isOwn && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => onAction("edit")}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => onAction("delete")}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Chat Header Component
const ChatHeader: React.FC<{ partner: User | undefined }> = ({ partner }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={partner?.profilePicture} />
          <AvatarFallback>{partner?.username[0] || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{partner?.username || "Conversation"}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// Main Chat Area Component
export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  messagesLoading,
  currentUser,
  onSendMessage,
  onReply,
  replyTo,
  onCancelReply,
  isMember,
  isLoading,
  onFileUpload,
  fileInputRef,
  onTyping,
  typingUsers = [],
  conversationPartner,
}) => {
  // State management
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Refs for DOM manipulation
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  }, [isTyping, onTyping]);

  // Handle message input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    handleTyping();

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  // Handle sending messages
  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !isMember || isLoading) return;

    onSendMessage(messageText.trim(), "text");
    setMessageText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [messageText, isMember, isLoading, onSendMessage]);

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle message actions
  const handleMessageAction = (
    action: string,
    message: Message & { user: User }
  ) => {
    switch (action) {
      case "reply":
        onReply(message);
        break;
      case "copy":
        navigator.clipboard.writeText(message.content);
        break;
      case "edit":
        console.log("Edit message:", message.id);
        break;
      case "delete":
        console.log("Delete message:", message.id);
        break;
    }
  };

  // Handle file selection
  const handleFileSelect = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader partner={conversationPartner} />

      {/* Messages Container */}
      <ChatMessageList ref={messagesContainerRef}>
        {messagesLoading ? (
          <div className="space-y-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  i % 2 === 0 ? "justify-start" : "justify-end"
                )}
              >
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-16 bg-muted rounded-2xl w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Send className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-sm text-muted-foreground">
              Start the conversation by typing below
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {/* Sort messages by createdAt timestamp from database */}
            {[...messages]
              .sort((a, b) => {
                // Use createdAt field from database for proper chronological ordering
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateA - dateB; // Ascending order: oldest to newest
              })
              .map((message, index, sortedMessages) => {
              const isOwn = message.userId === currentUser?.id;
              const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
              const nextMessage =
                index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null;

              // Safe date handling for timestamps using database createdAt
              const getValidDate = (dateValue: any) => {
                if (!dateValue) return new Date();
                const date = new Date(dateValue);
                return isNaN(date.getTime()) ? new Date() : date;
              };

              const messageDate = getValidDate(message.createdAt);
              const prevMessageDate = prevMessage ? getValidDate(prevMessage.createdAt) : null;
              const nextMessageDate = nextMessage ? getValidDate(nextMessage.createdAt) : null;

              const showAvatar =
                !prevMessage ||
                prevMessage.userId !== message.userId ||
                (prevMessageDate ? messageDate.getTime() - prevMessageDate.getTime() > 5 * 60 * 1000 : true);

              const showTimestamp =
                !nextMessage ||
                nextMessage.userId !== message.userId ||
                (nextMessageDate ? nextMessageDate.getTime() - messageDate.getTime() > 5 * 60 * 1000 : true);

              return (
                <ProfessionalMessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  showReadReceipt={true}
                  onReply={() => onReply(message)}
                  onAction={(action) => handleMessageAction(action, message)}
                />
              );
            })}
          </AnimatePresence>
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} />}
        </AnimatePresence>
      </ChatMessageList>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-muted/30 border-t border-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Reply className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Replying to {replyTo.user}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
                  {replyTo.content}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancelReply}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input Area */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFileSelect}
            disabled={!isMember || isLoading}
            className="flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <ChatInput
              ref={textareaRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={isMember ? "Type a message..." : "Join to chat"}
              disabled={!isMember || isLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 bottom-3"
              disabled={!isMember || isLoading}
            >
              <Smile className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || !isMember || isLoading}
              size="icon"
              className="absolute right-2 bottom-2 rounded-full"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={!isMember || isLoading}
            className="flex-shrink-0"
          >
            <Mic className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;