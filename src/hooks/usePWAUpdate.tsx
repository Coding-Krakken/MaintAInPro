import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import toast from 'react-hot-toast';

interface PWAUpdateContextType {
  updateAvailable: boolean;
  updateApp: () => void;
}

const PWAUpdateContext = createContext<PWAUpdateContextType | null>(null);

export const usePWAUpdate = () => {
  const context = useContext(PWAUpdateContext);
  if (!context) {
    throw new Error('usePWAUpdate must be used within PWAUpdateProvider');
  }
  return context;
};

interface PWAUpdateProviderProps {
  children: React.ReactNode;
}

export const PWAUpdateProvider: React.FC<PWAUpdateProviderProps> = ({
  children,
}) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const workbox = new Workbox('/sw.js');

      workbox.addEventListener('waiting', () => {
        setUpdateAvailable(true);
        toast('A new version is available! Click to update.', {
          duration: 0,
          icon: '🔄',
          id: 'app-update',
        });
      });

      workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      workbox.register();
      setWb(workbox);
    }
  }, []);

  const updateApp = () => {
    if (wb) {
      wb.messageSkipWaiting();
      toast.dismiss('app-update');
    }
  };

  const value = {
    updateAvailable,
    updateApp,
  };

  return (
    <PWAUpdateContext.Provider value={value}>
      {children}
    </PWAUpdateContext.Provider>
  );
};
