import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/utils/cn';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-secondary-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Main content */}
      <div className={cn(
        'flex-1 flex flex-col overflow-hidden',
        'lg:ml-64' // Sidebar width on large screens
      )}>
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
