import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User as UserIcon, Copy, Download, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useRoom } from '@/contexts/RoomContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AIMessage, generateAIPrompt } from '@/lib/openai';
import { cn } from '@/lib/utils';

/**
 * Professional Einstein Typing Indicator Component
 * Shows "Contacting Einstein..." with typing sequence animation that clears and repeats
 */
function EinsteinTypingIndicator() {
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'typing' | 'waiting' | 'clearing' | 'pausing'>('typing');
  
  useEffect(() => {
    const fullText = 'Contacting Einstein...';
    let timeoutId: NodeJS.Timeout;
    
    /**
     * Execute animation based on current phase
     */
    if (phase === 'typing') {
      // Type one character at a time
      if (displayText.length < fullText.length) {
        timeoutId = setTimeout(() => {
          setDisplayText(fullText.substring(0, displayText.length + 1));
        }, 100); // 100ms per character
      } else {
        // Switch to waiting phase after typing completes
        timeoutId = setTimeout(() => setPhase('waiting'), 100);
      }
    } else if (phase === 'waiting') {
      // Wait 1 second then start clearing
      timeoutId = setTimeout(() => setPhase('clearing'), 1000);
    } else if (phase === 'clearing') {
      // Clear one character at a time
      if (displayText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayText(prev => prev.substring(0, prev.length - 1));
        }, 50); // 50ms per character (faster clearing)
      } else {
        // Switch to pausing phase after clearing completes
        timeoutId = setTimeout(() => setPhase('pausing'), 50);
      }
    } else if (phase === 'pausing') {
      // Wait 500ms then restart typing cycle
      timeoutId = setTimeout(() => setPhase('typing'), 500);
    }
    
    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [displayText, phase]); // Dependencies: displayText and phase
  
  return (
    <div className="flex items-start space-x-2">
      {/* Einstein Avatar - Enhanced Brain Icon */}
      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
        <Brain className="w-3 h-3 text-white animate-pulse" />
      </div>
      
      {/* Typing Text Container */}
      <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 min-w-[120px]">
        <div className="flex items-center space-x-2">
          {/* Dynamic Text Display */}
          <span className="text-sm font-medium">
            {displayText}
            {/* Blinking Cursor */}
            <span className={cn(
              "inline-block w-0.5 h-4 bg-current ml-1 animate-pulse",
              phase === 'pausing' ? "opacity-100" : "opacity-70"
            )}>|</span>
          </span>
        </div>
        
        {/* Professional Status Indicator */}
        <div className="flex items-center space-x-1 mt-1 opacity-60">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="text-xs">Processing</span>
        </div>
      </div>
    </div>
  );
}

interface AIChatProps {
  isWidget?: boolean;
  roomId?: string;
}

export function AIChat({ isWidget = false, roomId }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm here to help you with your studies. What would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { currentRoom, messages: roomMessages } = useRoom();

  const chatMutation = useMutation({
    mutationFn: async (prompt: string) => {
      // Prepare context for AI
      const context: any = {};
      
      if (roomId || currentRoom?.id) {
        context.roomId = roomId || currentRoom?.id;
        context.roomName = currentRoom?.name;
        context.subject = currentRoom?.subject;
        
        // Include recent room messages for context
        if (roomMessages && roomMessages.length > 0) {
          context.recentMessages = roomMessages
            .slice(-5)
            .map(msg => `${msg.user.firstName}: ${msg.content}`);
        }
      }

      const response = await apiRequest('POST', '/api/ai/chat', {
        prompt: generateAIPrompt(prompt, context),
        roomId: context.roomId,
        context
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      console.error('AI Chat Error:', error);
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Send to AI
    chatMutation.mutate(input);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={cn(
      "flex flex-col",
      isWidget ? "h-72" : "h-full"
    )}>
      {/* Messages Container with Proper Height */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3 pb-20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className="flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%]">
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3 text-sm break-words overflow-hidden",
                      message.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    )}
                    data-testid={`message-${message.role}-${message.id}`}
                  >
                    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                    <span className="text-xs opacity-70 block mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Professional Einstein Typing Indicator */}
            {chatMutation.isPending && (
              <div className="flex justify-start ">
                <EinsteinTypingIndicator />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      
      {/* Fixed Input Section - Always Accessible */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sticky bottom-0 z-10">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={chatMutation.isPending}
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10"
            data-testid="input-ai-chat"
          />
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 h-10"
            data-testid="button-send-ai-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
