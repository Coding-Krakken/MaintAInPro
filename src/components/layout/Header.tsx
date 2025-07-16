import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { cn } from '@/utils/cn';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import type { User } from '@/types';

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, user }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className='bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-4 lg:px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className='p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors lg:hidden'
        >
          <Bars3Icon className='w-6 h-6 text-secondary-600 dark:text-secondary-400' />
          <span className='sr-only'>Open sidebar</span>
        </button>

        {/* Page title will be added by individual pages */}
        <div className='flex-1 lg:flex lg:items-center lg:justify-start'>
          {/* This space can be used for breadcrumbs or page titles */}
        </div>

        {/* Right side actions */}
        <div className='flex items-center space-x-4'>
          {/* Dark mode toggle */}
          <DarkModeToggle />

          {/* Notifications */}
          <NotificationCenter />

          {/* User menu */}
          <Menu as='div' className='relative'>
            <Menu.Button className='flex items-center space-x-3 p-2 rounded-lg hover:bg-secondary-100 transition-colors'>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className='w-8 h-8 rounded-full object-cover'
                />
              ) : (
                <UserCircleIcon className='w-8 h-8 text-secondary-400' />
              )}
              <div className='hidden md:block text-left'>
                <p className='text-sm font-medium text-secondary-900'>
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
                </p>
                <p className='text-xs text-secondary-500 capitalize'>
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
            </Menu.Button>

            <Transition
              enter='transition ease-out duration-100'
              enterFrom='transform opacity-0 scale-95'
              enterTo='transform opacity-100 scale-100'
              leave='transition ease-in duration-75'
              leaveFrom='transform opacity-100 scale-100'
              leaveTo='transform opacity-0 scale-95'
            >
              <Menu.Items className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-secondary-200 py-1 z-50'>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href='/profile'
                      className={cn(
                        'flex items-center px-4 py-2 text-sm',
                        active
                          ? 'bg-secondary-50 text-secondary-900'
                          : 'text-secondary-700'
                      )}
                    >
                      <UserCircleIcon className='w-4 h-4 mr-3' />
                      Profile
                    </a>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <a
                      href='/settings'
                      className={cn(
                        'flex items-center px-4 py-2 text-sm',
                        active
                          ? 'bg-secondary-50 text-secondary-900'
                          : 'text-secondary-700'
                      )}
                    >
                      <Cog6ToothIcon className='w-4 h-4 mr-3' />
                      Settings
                    </a>
                  )}
                </Menu.Item>

                <div className='border-t border-secondary-200 my-1'></div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={cn(
                        'flex items-center w-full px-4 py-2 text-sm text-left',
                        active
                          ? 'bg-secondary-50 text-secondary-900'
                          : 'text-secondary-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className='w-4 h-4 mr-3' />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};
