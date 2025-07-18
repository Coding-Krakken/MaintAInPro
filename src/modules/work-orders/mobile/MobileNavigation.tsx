import React from 'react';
import { Button } from '../../../components/ui/Button';
import {
  HomeIcon,
  ClipboardListIcon,
  WrenchIcon,
  PackageIcon,
  QrCodeIcon,
  UserIcon,
} from 'lucide-react';

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onScanQR: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPath,
  onNavigate,
  onScanQR,
}) => {
  const navigationItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home' },
    { path: '/work-orders', icon: ClipboardListIcon, label: 'Work Orders' },
    { path: '/equipment', icon: WrenchIcon, label: 'Equipment' },
    { path: '/inventory', icon: PackageIcon, label: 'Inventory' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50'>
      <div className='flex justify-around items-center'>
        {navigationItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className='h-5 w-5 mb-1' />
              <span className='text-xs font-medium'>{item.label}</span>
            </button>
          );
        })}

        {/* QR Scanner FAB (Floating Action Button) */}
        <Button
          onClick={onScanQR}
          className='h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg'
          size='sm'
        >
          <QrCodeIcon className='h-6 w-6' />
        </Button>
      </div>
    </div>
  );
};

export default MobileNavigation;
