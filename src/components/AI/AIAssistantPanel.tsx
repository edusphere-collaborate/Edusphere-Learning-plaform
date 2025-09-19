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
  X,
  Minimize2,
  Maximize2,
  Users,
  History,
  Search,
  Trash2,
} from 'lucide-react';
import eduSphereImage from '@/assets/Edusphere.png';
import { Room, Message, User } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
 */
export function AIAssistantPanel({ 
  room, 
  messages, 
  isVisible, 
  onToggle, 
  className 
}: AIAssistantPanelProps) {
  // State
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Refs
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Save/load conversation history
   */
  const saveConversationToHistory = useCallback((conversation: AIConversation) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('ai-conversation-history') || '[]');
      const updatedHistory = existingHistory.filter((c: AIConversation) => c.id !== conversation.id);
      updatedHistory.unshift(conversation);
      localStorage.setItem('ai-conversation-history', JSON.stringify(updatedHistory.slice(0, 50)));
      setConversationHistory(updatedHistory.slice(0, 50));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }, []);

  const loadConversationHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('ai-conversation-history') || '[]');
      setConversationHistory(history);
    } catch {
      setConversationHistory([]);
    }
  }, []);

  const createNewConversation = useCallback(() => {
    if (!room) return null;
    const newConversation: AIConversation = {
      id: `conv_${Date.now()}`,
      roomId: room.id,
      roomName: room.name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokens: 0,
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

  const clearConversationHistory = useCallback(() => {
    localStorage.removeItem('ai-conversation-history');
    setConversationHistory([]);
    setCurrentConversationId(null);
    setAiMessages([]);
    toast({ title: "History Cleared", description: "All conversation history has been cleared." });
  }, [toast]);

  // Effects
  useEffect(() => loadConversationHistory(), [loadConversationHistory]);
  useEffect(() => { if (room && !currentConversationId) createNewConversation(); }, [room, currentConversationId, createNewConversation]);
  useEffect(() => { if (aiMessages.length > 0) updateCurrentConversation(aiMessages); }, [aiMessages, updateCurrentConversation]);
  useEffect(() => { aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);
  useEffect(() => { if (messages.length > 0 && room) { setIsAnalyzing(true); setTimeout(() => setIsAnalyzing(false), 1000); } }, [messages.length, room?.id]);

  /**
   * Mutations
   */
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      if (!room || messages.length === 0) return null;
      const conversationContext = messages.slice(-15).map(msg => `${msg.user.username}: ${msg.content}`).join('\n');
      const summaryQuery = `Summarize this discussion in "${room.name}" (${room.subject}):\n${conversationContext}`;
      const response = await apiRequest('POST', '/ai/aiquery', { userId: user?.id || '', query: summaryQuery });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('AI Summary Data:', data); // Debug log
      
      // Handle nested backend response structure: {response: {response: "actual text"}}
      let responseContent = "No response";
      
      if (typeof data === 'string') {
        responseContent = data;
      } else if (data && typeof data === 'object') {
        // Check for nested response structure first
        if (data.response && typeof data.response === 'object' && data.response.response && typeof data.response.response === 'string') {
          responseContent = data.response.response;
        } else if (data.response && typeof data.response === 'string') {
          responseContent = data.response;
        } else if (data.message && typeof data.message === 'string') {
          responseContent = data.message;
        } else if (data.content && typeof data.content === 'string') {
          responseContent = data.content;
        } else if (data.answer && typeof data.answer === 'string') {
          responseContent = data.answer;
        } else if (data.result && typeof data.result === 'string') {
          responseContent = data.result;
        } else {
          // If no string field found, stringify the whole object as fallback
          responseContent = JSON.stringify(data, null, 2);
        }
      }
      
      const summaryMessage: AIMessage = {
        id: `summary-${Date.now()}`,
        type: 'assistant',
        content: `**Conversation Summary:**\n\n${responseContent}`,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, summaryMessage]);
    },
  });

  const sendAIMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, userMessage]);

      const conversationContext = messages.slice(-5).map(msg => `${msg.user.username}: ${msg.content}`).join('\n');
      const enhancedQuery = `Context: In "${room?.name}" (${room?.subject}), recent discussion:\n${conversationContext}\n\nUser: ${content}`;

      const response = await apiRequest('POST', '/ai/aiquery', { userId: user?.id || '', query: enhancedQuery });
      const jsonData = await response.json();
      return jsonData;
    },
    onSuccess: (data) => {
      console.log('AI Response Data:', data); // Debug log
      
      // Handle nested backend response structure: {response: {response: "actual text"}}
      let responseContent = "No response";
      
      if (typeof data === 'string') {
        responseContent = data;
      } else if (data && typeof data === 'object') {
        // Check for nested response structure first
        if (data.response && typeof data.response === 'object' && data.response.response && typeof data.response.response === 'string') {
          responseContent = data.response.response;
        } else if (data.response && typeof data.response === 'string') {
          responseContent = data.response;
        } else if (data.message && typeof data.message === 'string') {
          responseContent = data.message;
        } else if (data.content && typeof data.content === 'string') {
          responseContent = data.content;
        } else if (data.answer && typeof data.answer === 'string') {
          responseContent = data.answer;
        } else if (data.result && typeof data.result === 'string') {
          responseContent = data.result;
        } else {
          // If no string field found, stringify the whole object as fallback
          responseContent = JSON.stringify(data, null, 2);
        }
      }
      
      const aiResponse: AIMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, aiResponse]);
    },
  });

  /**
   * Suggestions
   */
  const { data: suggestions = [] } = useQuery({
    queryKey: ['ai-suggestions', room?.id, messages.length],
    queryFn: async () => {
      if (!room || messages.length < 3) return [];
      const base: AISuggestion[] = [
        { id: 'summary', type: 'summary', title: 'Summarize Discussion', content: 'Get a summary of this chat', confidence: 0.9, action: () => generateSummaryMutation.mutate() },
        { id: 'question', type: 'question', title: 'Ask Follow-up', content: `What are the key takeaways from this ${room.subject} discussion?`, confidence: 0.8 },
        { id: 'insight', type: 'insight', title: 'Generate Insights', content: 'Analyze and provide insights', confidence: 0.7 },
      ];
      return base;
    },
    enabled: !!room && messages.length > 0,
  });

  /**
   * Input handlers
   */
  const handleSendAIMessage = () => {
    const content = aiInput.trim();
    if (!content) return;
    setAiInput('');
    sendAIMessageMutation.mutate(content);
  };

  const handleAIKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAIMessage();
    }
  };

  if (!isVisible) return null;

  function formatTime(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(timestamp);
  }

  return (
    <div className={cn("w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col", isMinimized && "w-16", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {!isMinimized && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                <p className="text-xs text-gray-500">{isAnalyzing ? 'Analyzing...' : 'Ready'}</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 m-2 flex-shrink-0">
          <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs">Suggestions</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
        </TabsList>
      
        {/* Chat */}
        <TabsContent value="chat" className="flex flex-col flex-1 min-h-0">
  {/* Scrollable messages */}
  <ScrollArea className="flex-1 min-h-0 p-3">
    <div className="space-y-3">
      {aiMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="w-20 h-20 mb-4 opacity-30">
            <img 
              src={eduSphereImage} 
              alt="EduSphere" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Ask me anything about the conversation
          </p>
        </div>
      ) : (
        <>
          {aiMessages.map(m => (
            <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <p className="text-xs opacity-70 mt-1">{formatTime(m.timestamp)}</p>
              </div>
            </div>
          ))}

          {sendAIMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={aiMessagesEndRef} />
        </>
      )}
    </div>
  </ScrollArea>

  {/* Fixed input */}
  <div className="p-3 border-t flex-shrink-0">
    <div className="flex space-x-2">
      <Input
        ref={aiInputRef}
        placeholder="Ask AI..."
        value={aiInput}
        onChange={e => setAiInput(e.target.value)}
        onKeyPress={handleAIKeyPress}
      />
      <Button onClick={handleSendAIMessage} disabled={!aiInput.trim()}>
        <Send className="w-4 h-4" />
      </Button>
    </div>
  </div>
</TabsContent>

      
        {/* Suggestions */}
        <TabsContent value="suggestions" className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-3">
              <div className="space-y-3">
                {suggestions.map(s => (
                  <Card
                    key={s.id}
                    onClick={() => {
                      if (s.action) {
                        s.action();
                      } else {
                        setAiInput(s.content);
                      }
                      setActiveTab('chat');
                      aiInputRef.current?.focus();
                    }}
                    className="cursor-pointer hover:shadow-md"
                  >
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm">{s.title}</h4>
                      <p className="text-xs text-gray-600">{s.content}</p>
                      <Badge className="mt-2 text-xs">
                        {Math.round(s.confidence * 100)}% confidence
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      
        {/* History */}
        <TabsContent value="history" className="flex  ">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-3">
              {conversationHistory.length === 0 ? (
                <p className="text-xs text-gray-500">No conversation history.</p>
              ) : (
                <div className="space-y-8">
                  {conversationHistory.map(conv => (
                    <Card key={conv.id}>
                      <CardContent className="p-2 text-xs">
                        <p className="font-medium">{conv.roomName}</p>
                        <p>{conv.messages.length} messages</p>
                        <p>Updated: {new Date(conv.updatedAt).toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={clearConversationHistory}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear All
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
      
      )}
    </div>
  );
}
