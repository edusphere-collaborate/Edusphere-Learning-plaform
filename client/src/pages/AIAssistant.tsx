import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Brain, MessageSquare, Lightbulb, BookOpen, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIChat } from '@/components/AI/AIChat';
import { useAuth } from '@/contexts/AuthContext';

export default function AIAssistant() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  const quickActions = [
    {
      icon: Calculator,
      title: "Math Help",
      description: "Get assistance with calculations and problem solving",
      prompt: "I need help with a math problem"
    },
    {
      icon: BookOpen,
      title: "Study Planning",
      description: "Create study schedules and learning strategies",
      prompt: "Help me create a study plan"
    },
    {
      icon: Lightbulb,
      title: "Concept Explanation",
      description: "Understand complex topics with clear explanations",
      prompt: "Can you explain this concept to me?"
    },
    {
      icon: MessageSquare,
      title: "Discussion Ideas",
      description: "Generate topics for group discussions",
      prompt: "Suggest some discussion topics for my study group"
    }
  ];

  return (
    
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/rooms">
              <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
                <p className="text-gray-600 dark:text-gray-400">Your personal learning companion</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-900 dark:to-accent-800 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-1">{action.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{action.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="h-full max-w-4xl mx-auto">
            <Card className="h-full rounded-none border-x-0 border-b-0">
              <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-accent-600" />
                  <span>Chat with AI</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="h-full flex flex-col">
                  <AIChat />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
