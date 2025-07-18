import React, { ReactNode } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { useLocation, useNavigate } from 'react-router-dom';

interface MobileLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  onScanQR?: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showNavigation = true,
  onScanQR = () => console.log('QR scan not implemented'),
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Main content with bottom padding for navigation */}
      <main className={showNavigation ? 'pb-20' : ''}>{children}</main>

      {/* Mobile Navigation */}
      {showNavigation && (
        <MobileNavigation
          currentPath={location.pathname}
          onNavigate={handleNavigate}
          onScanQR={onScanQR}
        />
      )}
    </div>
  );
};

export default MobileLayout;
