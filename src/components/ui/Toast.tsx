import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast = ({
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 200);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, handleClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
      default:
        return 'text-blue-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto',
        'border-l-4 p-4 transform transition-all duration-200',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        getTypeStyles()
      )}
    >
      <div className='flex items-start'>
        <div className='flex-shrink-0'>
          <div className={cn('w-5 h-5', getIconColor())}>
            {type === 'success' && (
              <svg fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {type === 'error' && (
              <svg fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {type === 'warning' && (
              <svg fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
            )}
            {type === 'info' && (
              <svg fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </div>
        </div>
        <div className='ml-3 w-0 flex-1'>
          {title && <p className='text-sm font-medium'>{title}</p>}
          <p className={cn('text-sm', title && 'mt-1')}>{message}</p>
        </div>
        <div className='ml-4 flex-shrink-0 flex'>
          <button
            onClick={handleClose}
            className='inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500'
          >
            <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast context and provider
import { createContext, useContext, ReactNode } from 'react';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className='fixed top-4 right-4 z-50 space-y-2'>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export { Toast };
