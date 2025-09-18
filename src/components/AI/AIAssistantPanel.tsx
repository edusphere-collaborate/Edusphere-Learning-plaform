import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, 
  Send, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Lightbulb,
  RefreshCw,
  Copy,
  Download,
  TrendingUp,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2,
  Maximize2,
  History,
  Search,
  Trash2,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Room, Message, User } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AI conversation message interface
 */
interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  isStreaming?: boolean;
  metadata?: {
    roomContext?: string;
    messageCount?: number;
    participants?: string[];
  };
}

/**
 * AI conversation interface for persistence
 */
interface AIConversation {
  id: string;
  roomId: string;
  roomName: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  totalTokens: number;
}

/**
 * AI suggestion interface
 */
interface AISuggestion {
  id: string;
  type: 'prompt' | 'question' | 'summary' | 'insight';
  title: string;
  content: string;
  confidence: number;
  action?: () => void;
}

/**
 * Props for AIAssistantPanel component
 */
interface AIAssistantPanelProps {
  room?: Room;
  messages: (Message & { user: User })[];
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * AI Assistant Panel Component
 * Provides intelligent conversation analysis, summaries, and suggestions
 */
export function AIAssistantPanel({ 
  room, 
  messages, 
  isVisible, 
  onToggle, 
  className 
}: AIAssistantPanelProps) {
  // State management
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Conversation history management utilities
   */
  const saveConversationToHistory = useCallback((conversation: AIConversation) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('ai-conversation-history') || '[]');
      const updatedHistory = existingHistory.filter((c: AIConversation) => c.id !== conversation.id);
      updatedHistory.unshift(conversation);
      
      // Keep only last 50 conversations to prevent storage bloat
      const trimmedHistory = updatedHistory.slice(0, 50);
      localStorage.setItem('ai-conversation-history', JSON.stringify(trimmedHistory));
      setConversationHistory(trimmedHistory);
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }, []);

  const loadConversationHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('ai-conversation-history') || '[]');
      setConversationHistory(history);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setConversationHistory([]);
    }
  }, []);

  const createNewConversation = useCallback(() => {
    if (!room) return null;
    
    const newConversation: AIConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: room.id,
      roomName: room.name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokens: 0
    };
    
    setCurrentConversationId(newConversation.id);
    return newConversation;
  }, [room]);

  const updateCurrentConversation = useCallback((messages: AIMessage[]) => {
    if (!currentConversationId || !room) return;
    
    const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokensUsed || 0), 0);
    
    const updatedConversation: AIConversation = {
      id: currentConversationId,
      roomId: room.id,
      roomName: room.name,
      messages,
      createdAt: conversationHistory.find(c => c.id === currentConversationId)?.createdAt || new Date(),
      updatedAt: new Date(),
      totalTokens
    };
    
    saveConversationToHistory(updatedConversation);
  }, [currentConversationId, room, conversationHistory, saveConversationToHistory]);

  const exportConversation = useCallback((conversationId: string, format: 'json' | 'pdf' = 'json') => {
    const conversation = conversationHistory.find(c => c.id === conversationId);
    if (!conversation) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(conversation, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-conversation-${conversation.roomName}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    // PDF export would require additional library like jsPDF
  }, [conversationHistory]);

  const clearConversationHistory = useCallback(() => {
    localStorage.removeItem('ai-conversation-history');
    setConversationHistory([]);
    setCurrentConversationId(null);
    setAiMessages([]);
    toast({
      title: "History Cleared",
      description: "All conversation history has been cleared.",
    });
  }, [toast]);

  // Initialize conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, [loadConversationHistory]);

  // Create new conversation when room changes
  useEffect(() => {
    if (room && !currentConversationId) {
      createNewConversation();
    }
  }, [room, currentConversationId, createNewConversation]);

  // Update conversation history when messages change
  useEffect(() => {
    if (aiMessages.length > 0) {
      updateCurrentConversation(aiMessages);
    }
  }, [aiMessages, updateCurrentConversation]);

  /**
   * Generate conversation summary using AI
   */
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!room || messages.length === 0) return null;

      const conversationContext = messages.slice(-20).map(msg => ({
        user: msg.user.username,
        content: msg.content,
        timestamp: msg.createdAt
      }));

      const response = await authenticatedFetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          roomName: room.name,
          subject: room.subject,
          messages: conversationContext
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data?.summary) {
        const summaryMessage: AIMessage = {
          id: `summary-${Date.now()}`,
          type: 'assistant',
          content: `**Conversation Summary:**\n\n${data.summary}`,
          timestamp: new Date(),
          metadata: {
            roomContext: room?.name,
            messageCount: messages.length,
            participants: Array.from(new Set(messages.map(m => m.user.username)))
          }
        };
        setAiMessages(prev => [...prev, summaryMessage]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary",
        variant: "destructive",
      });
    }
  });

  /**
   * Send message to AI assistant with streaming support
   */
  const sendAIMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Add user message immediately
      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
        tokensUsed: Math.ceil(content.length / 4), // Rough token estimation
        metadata: {
          roomContext: room?.name,
          messageCount: messages.length
        }
      };
      setAiMessages(prev => [...prev, userMessage]);

      // Start streaming response
      setIsStreaming(true);
      setStreamingText('');

      const conversationContext = messages.slice(-10).map(msg => ({
        user: msg.user.username,
        content: msg.content,
        timestamp: msg.createdAt
      }));

      const response = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          stream: true, // Request streaming response
          roomContext: {
            roomId: room?.id,
            roomName: room?.name,
            subject: room?.subject,
            recentMessages: conversationContext
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let tokensUsed = 0;

        // Add streaming message placeholder
        const streamingMessageId = `ai-streaming-${Date.now()}`;
        const streamingMessage: AIMessage = {
          id: streamingMessageId,
          type: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
          tokensUsed: 0,
          metadata: {
            roomContext: room?.name,
            messageCount: messages.length
          }
        };
        setAiMessages(prev => [...prev, streamingMessage]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    fullResponse += data.content;
                    setStreamingText(fullResponse);
                    
                    // Update streaming message
                    setAiMessages(prev => prev.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: fullResponse, tokensUsed: data.tokens || 0 }
                        : msg
                    ));
                  }
                  if (data.tokens) {
                    tokensUsed = data.tokens;
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Finalize streaming message
        setAiMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false, tokensUsed }
            : msg
        ));

        return { response: fullResponse, tokens: tokensUsed };
      }

      // Fallback to non-streaming
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setIsStreaming(false);
      setStreamingText('');
      
      // If non-streaming response, add AI message
      if (data?.response && !isStreaming) {
        const aiResponse: AIMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: data.response,
          timestamp: new Date(),
          tokensUsed: data.tokens || Math.ceil(data.response.length / 4),
          metadata: {
            roomContext: room?.name,
            messageCount: messages.length
          }
        };
        setAiMessages(prev => [...prev, aiResponse]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    }
  });

  /**
   * Generate smart suggestions based on conversation
   */
  const { data: suggestions = [] } = useQuery({
    queryKey: ['ai-suggestions', room?.id, messages.length],
    queryFn: async () => {
      if (!room || messages.length < 3) return [];

      const recentMessages = messages.slice(-5);
      const suggestions: AISuggestion[] = [
        {
          id: 'summary',
          type: 'summary',
          title: 'Summarize Discussion',
          content: 'Get a concise summary of the recent conversation',
          confidence: 0.9,
          action: () => generateSummaryMutation.mutate()
        },
        {
          id: 'question',
          type: 'question',
          title: 'Ask Follow-up Question',
          content: `What are the key takeaways from this ${room.subject} discussion?`,
          confidence: 0.8
        },
        {
          id: 'insight',
          type: 'insight',
          title: 'Generate Insights',
          content: 'Analyze patterns and provide learning insights',
          confidence: 0.7
        }
      ];

      // Add context-specific suggestions based on room subject
      if (room.subject?.toLowerCase().includes('math')) {
        suggestions.push({
          id: 'math-help',
          type: 'prompt',
          title: 'Math Problem Solving',
          content: 'Can you help me solve this step by step?',
          confidence: 0.85
        });
      }

      if (room.subject?.toLowerCase().includes('science')) {
        suggestions.push({
          id: 'science-explain',
          type: 'prompt',
          title: 'Scientific Explanation',
          content: 'Can you explain the scientific principles behind this?',
          confidence: 0.85
        });
      }

      return suggestions;
    },
    enabled: !!room && messages.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });

  /**
   * Handle sending AI message
   */
  const handleSendAIMessage = () => {
    const content = aiInput.trim();
    if (!content) return;

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');

    // Send to AI
    sendAIMessageMutation.mutate(content);
  };

  /**
   * Handle key press in AI input
   */
  const handleAIKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAIMessage();
    }
  };

  /**
   * Use suggested prompt
   */
  const useSuggestion = (suggestion: AISuggestion) => {
    if (suggestion.action) {
      suggestion.action();
    } else {
      setAiInput(suggestion.content);
      setActiveTab('chat');
      aiInputRef.current?.focus();
    }
  };

  /**
   * Auto-scroll AI messages
   */
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  /**
   * Analyze conversation when messages change
   */
  useEffect(() => {
    if (messages.length > 0 && room) {
      setIsAnalyzing(true);
      // Simulate analysis delay
      setTimeout(() => setIsAnalyzing(false), 1000);
    }
  }, [messages.length, room?.id]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col",
      isMinimized && "w-16",
      className
    )}>
      {/* AI Panel Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {!isMinimized && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isAnalyzing ? 'Analyzing...' : 'Ready to help'}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* AI Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">Suggestions</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              {/* AI Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {aiMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ask me anything about the conversation
                      </p>
                    </div>
                  ) : (
                    aiMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {message.isStreaming ? (
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-xs text-gray-500">AI is typing...</span>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              )}
                            </div>
                            {message.tokensUsed && (
                              <div className="ml-2 text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-1 rounded">
                                {message.tokensUsed}t
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </p>
                            {message.type === 'assistant' && !message.isStreaming && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(message.content)}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {(sendAIMessageMutation.isPending || generateSummaryMutation.isPending) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={aiMessagesEndRef} />
                </div>
              </ScrollArea>

              {/* AI Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Input
                    ref={aiInputRef}
                    placeholder="Ask AI about the conversation..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={handleAIKeyPress}
                    className="text-sm"
                    disabled={sendAIMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendAIMessage}
                    disabled={!aiInput.trim() || sendAIMessageMutation.isPending}
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="flex-1 m-0">
              <ScrollArea className="h-full p-3">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <Card 
                      key={suggestion.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => useSuggestion(suggestion)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            {suggestion.type === 'summary' && <FileText className="w-3 h-3 text-white" />}
                            {suggestion.type === 'question' && <MessageSquare className="w-3 h-3 text-white" />}
                            {suggestion.type === 'prompt' && <Lightbulb className="w-3 h-3 text-white" />}
                            {suggestion.type === 'insight' && <Sparkles className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {suggestion.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {suggestion.content}
                            </p>
                            <Badge 
                              variant="secondary" 
                              className="mt-2 text-xs"
                            >
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="flex-1 m-0">
              <ScrollArea className="h-full p-3">
                <div className="space-y-4">
                  {/* Conversation Stats */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Conversation Stats</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Messages:</span>
                          <span className="font-medium">{messages.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                          <span className="font-medium">
                            {Array.from(new Set(messages.map(m => m.user.username))).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                          <span className="font-medium">{room?.subject || 'General'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => generateSummaryMutation.mutate()}
                        disabled={generateSummaryMutation.isPending}
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        Generate Summary
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setAiInput("What are the main learning points from this discussion?");
                          setActiveTab('chat');
                        }}
                      >
                        <Lightbulb className="w-3 h-3 mr-2" />
                        Get Learning Points
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => {
                          setAiInput("Can you suggest follow-up questions for this topic?");
                          setActiveTab('chat');
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-2" />
                        Suggest Questions
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 flex flex-col m-0">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Conversation History</h3>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createNewConversation}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConversationHistory}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {conversationHistory
                    .filter(conv => 
                      searchQuery === '' || 
                      conv.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.messages.some(msg => 
                        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    )
                    .map((conversation) => (
                      <Card 
                        key={conversation.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          currentConversationId === conversation.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                            : ''
                        }`}
                        onClick={() => {
                          setCurrentConversationId(conversation.id);
                          setAiMessages(conversation.messages);
                          setActiveTab('chat');
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium truncate">
                                {conversation.roomName}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {conversation.messages[conversation.messages.length - 1]?.content || 'No messages'}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">
                                  {conversation.messages.length} messages
                                </span>
                                <span className="text-xs text-gray-400">
                                  {conversation.totalTokens} tokens
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  exportConversation(conversation.id, 'json');
                                }}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <span className="text-xs text-gray-400 mt-1">
                                {new Date(conversation.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  
                  {conversationHistory.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No conversation history yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start chatting to build your history
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
