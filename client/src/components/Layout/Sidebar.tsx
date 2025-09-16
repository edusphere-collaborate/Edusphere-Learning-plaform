import { Link, useLocation } from 'wouter';
import { 
  Home, 
  MessageSquare, 
  Compass, 
  Brain, 
  User, 
  Settings,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isCollapsed?: boolean;
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      href: '/rooms',
      icon: MessageSquare,
      label: 'My Rooms',
      testId: 'nav-my-rooms'
    },
    {
      href: '/explore',
      icon: Compass,
      label: 'Explore',
      testId: 'nav-explore'
    },
    {
      href: '/ai-assistant',
      icon: Brain,
      label: 'AI Assistant',
      testId: 'nav-ai-assistant'
    },
    {
      href: '/profile',
      icon: User,
      label: 'Profile',
      testId: 'nav-profile'
    },
    {
      href: '/settings',
      icon: Settings,
      label: 'Settings',
      testId: 'nav-settings'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/rooms') {
      return location === '/rooms';
    }
    return location.startsWith(href);
  };

  return (
    <aside className={cn(
      "bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen sticky top-0",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        {/* Create Room Button */}
        <Link href="/create-room">
          <Button 
            className="w-full mb-6 bg-primary-600 hover:bg-primary-700 text-white"
            size={isCollapsed ? "sm" : "default"}
            data-testid="button-create-room"
          >
            <PlusCircle className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">Create Room</span>}
          </Button>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    active 
                      ? "bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  data-testid={item.testId}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
