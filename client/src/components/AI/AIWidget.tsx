import { useState, useRef, useEffect } from 'react';
import { Brain, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChat } from './AIChat';
import { cn } from '@/lib/utils';

export function AIWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isExpanded]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isExpanded ? (
        /* Expanded State */
        <div 
          ref={widgetRef}
          className={cn(
            "w-80 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col",
            "transform transition-all duration-300 ease-out",
            "animate-in slide-in-from-bottom-4 fade-in-0"
          )}
        >
          {/* AI Widget Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">AI Assistant</span>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="hover:bg-gray-100  hover:text-gray-500 dark:hover:bg-gray-700 transition-colors duration-200"
                data-testid="button-minimize-ai"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* AI Chat Component */}
          <AIChat isWidget={true} />
        </div>
      ) : (
        /* Minimized State */
        <Button
          className={cn(
            "w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg",
            "hover:scale-110 hover:shadow-xl transition-all duration-300 text-white",
            "animate-in zoom-in-50 fade-in-0"
          )}
          onClick={() => setIsExpanded(true)}
          data-testid="button-expand-ai"
        >
          <Brain className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}
