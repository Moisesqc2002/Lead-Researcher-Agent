'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { authApi } from '@/lib/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const user = authApi.getCurrentUser();

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/');
  };

  const navigation = [
    {
      name: 'Lead Research Agent',
      icon: Bot,
      href: '/dashboard',
      current: true
    },
    {
      name: 'Business Profile',
      icon: User,
      href: '/dashboard/profile',
      current: false
    }
  ];

  const bottomNavigation = [
    {
      name: 'Get Help',
      icon: HelpCircle,
      href: '/help'
    },
    {
      name: 'Settings',
      icon: Settings,
      href: '/dashboard/settings'
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-border">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="ml-2 text-lg font-semibold">Lead Research</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  item.current
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* Bottom navigation */}
          <div className="px-4 py-4 border-t border-border space-y-2">
            {bottomNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            ))}

            {/* User profile */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="ml-2 font-semibold">Lead Research</span>
          </div>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}