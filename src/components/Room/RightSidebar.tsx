import React, { useState, useRef } from 'react';
import { 
  Bot, 
  FileText, 
  Send, 
  Paperclip, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Star,
  Clock,
  User,
  Link,
  Image as ImageIcon,
  Video,
  Archive
} from 'lucide-react';
import { DocumentList } from './DocumentList';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface AiMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface SharedResource {
  id: string;
  name: string;
  type: 'file' | 'link' | 'image' | 'video' | 'document';
  url: string;
  size?: number;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  uploadedAt: Date;
  isPinned?: boolean;
}

interface RightSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  aiEnabled: boolean;
  sharedResources: SharedResource[];
  resourcesLoading: boolean;
  onResourceUpload: (files: File[]) => void;
  onResourceDelete: (id: string) => void;
}

export function RightSidebar({
  isVisible,
  onToggle,
  aiEnabled,
  sharedResources,
  resourcesLoading,
  onResourceUpload,
  onResourceDelete
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState(aiEnabled ? 'ai' : 'resources');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with questions about the discussion, summarize key points, or provide additional context on topics being discussed.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle AI message sending
  const handleSendAiMessage = async () => {
    if (!aiInput.trim() || isAiTyping) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      content: aiInput.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setIsAiTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AiMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I understand your question. Let me help you with that. Based on the current discussion, here are some key insights...',
        isUser: false,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 2000);
  };

  // Handle resource file selection
  const handleResourceFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle resource file upload
  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onResourceUpload(files);
    }
  };

  // Filter resources based on search and filter
  const filteredResources = sharedResources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(resourceSearch.toLowerCase());
    const matchesFilter = resourceFilter === 'all' || resource.type === resourceFilter;
    return matchesSearch && matchesFilter;
  });

  // Get resource icon
  const getResourceIcon = (type: string) => {
    const iconProps = { className: "w-4 h-4" };
    switch (type) {
      case 'image':
        return <ImageIcon {...iconProps} className="text-green-500" />;
      case 'video':
        return <Video {...iconProps} className="text-red-500" />;
      case 'document':
        return <FileText {...iconProps} className="text-blue-500" />;
      case 'link':
        return <Link {...iconProps} className="text-purple-500" />;
      case 'file':
      default:
        return <Archive {...iconProps} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {activeTab === 'ai' ? 'AI Assistant' : 'Shared Resources'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          {aiEnabled && (
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="resources" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Resources</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Assistant Tab */}
        {aiEnabled && (
          <TabsContent value="ai" className="flex-1 flex flex-col mt-4">
            {/* AI Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isUser
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* AI Typing Indicator */}
                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-primary-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* AI Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <Textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask the AI assistant..."
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAiMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendAiMessage}
                  disabled={!aiInput.trim() || isAiTyping}
                  size="sm"
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* Shared Resources Tab */}
        <TabsContent value="resources" className="flex-1 flex flex-col mt-4">
          {/* Resource Controls */}
          <div className="px-4 space-y-3">
            {/* Search and Filter */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setResourceFilter('all')}>
                    All Resources
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResourceFilter('image')}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResourceFilter('video')}>
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResourceFilter('document')}>
                    Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResourceFilter('link')}>
                    Links
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleResourceFileSelect}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleResourceFileChange}
            />
          </div>

          <Separator className="my-4" />

          {/* Enhanced Document List with PDF Viewer */}
          <DocumentList
            documents={filteredResources.map(resource => ({
              id: resource.id,
              name: resource.name,
              type: resource.type === 'document' ? 'pdf' : 
                    resource.type === 'image' ? 'image' : 
                    resource.type === 'video' ? 'video' : 
                    resource.type === 'file' ? 'document' : 'archive',
              url: resource.url,
              size: resource.size || 0,
              uploadedBy: `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`,
              uploadedAt: resource.uploadedAt.toISOString(),
              downloadCount: 0,
              tags: resource.isPinned ? ['pinned'] : []
            }))}
            onUpload={(files) => onResourceUpload(Array.from(files))}
            onDelete={onResourceDelete}
            className="px-0"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
