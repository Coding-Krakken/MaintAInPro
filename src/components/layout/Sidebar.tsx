import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CubeIcon,
  ArchiveBoxIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import type { User } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  permissions?: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Work Orders', href: '/work-orders', icon: WrenchScrewdriverIcon },
  { name: 'Equipment', href: '/equipment', icon: CogIcon },
  { name: 'Parts & Inventory', href: '/inventory', icon: ArchiveBoxIcon },
  { name: 'Preventive Maintenance', href: '/preventive-maintenance', icon: CalendarDaysIcon },
  { name: 'Vendors', href: '/vendors', icon: BuildingOfficeIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CubeIcon, permissions: ['settings:read'] },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => {
    if (!item.permissions) return true;
    if (!user) return false;
    return item.permissions.some(permission => user.permissions.includes(permission as any));
  });

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MP</span>
            </div>
            <span className="text-lg font-semibold text-secondary-900">MaintainPro</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-secondary-600" />
          </button>
        </div>
        <SidebarContent navigation={filteredNavigation} currentPath={location.pathname} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-secondary-200">
        <div className="flex items-center space-x-2 p-6 border-b border-secondary-200">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">MP</span>
          </div>
          <span className="text-xl font-semibold text-secondary-900">MaintainPro</span>
        </div>
        <SidebarContent navigation={filteredNavigation} currentPath={location.pathname} />
      </div>
    </>
  );
};

interface SidebarContentProps {
  navigation: NavigationItem[];
  currentPath: string;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ navigation, currentPath }) => {
  return (
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigation.map((item) => {
        const isActive = currentPath === item.href || 
          (item.href !== '/' && currentPath.startsWith(item.href));
        
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-secondary-700 hover:bg-secondary-100'
            )}
          >
            <item.icon 
              className={cn(
                'w-5 h-5 mr-3',
                isActive ? 'text-primary-600' : 'text-secondary-400'
              )}
            />
            {item.name}
          </NavLink>
        );
      })}
    </nav>
  );
};
