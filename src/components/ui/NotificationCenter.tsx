import React from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/utils/cn';
import { useNotifications } from '@/services/realtime';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  read_at?: string;
  created_at: string;
  user_id: string;
  data?: Record<string, unknown>;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(user?.id || '');

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Menu as='div' className={cn('relative', className)}>
      <Menu.Button className='relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors'>
        <BellIcon className='w-6 h-6 text-secondary-600 dark:text-secondary-400' />
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span className='sr-only'>View notifications</span>
      </Menu.Button>

      <Transition
        enter='transition ease-out duration-100'
        enterFrom='transform opacity-0 scale-95'
        enterTo='transform opacity-100 scale-100'
        leave='transition ease-in duration-75'
        leaveFrom='transform opacity-100 scale-100'
        leaveTo='transform opacity-0 scale-95'
      >
        <Menu.Items className='absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-1 z-50 max-h-96 overflow-y-auto'>
          <div className='px-4 py-2 border-b border-secondary-200 dark:border-secondary-700'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-secondary-900 dark:text-secondary-100'>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className='px-4 py-8 text-center'>
              <BellIcon className='mx-auto h-12 w-12 text-secondary-400 dark:text-secondary-500' />
              <p className='mt-2 text-sm text-secondary-600 dark:text-secondary-400'>
                No notifications yet
              </p>
            </div>
          ) : (
            <div className='max-h-80 overflow-y-auto'>
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const isUnread = !notification.read_at;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20';
      case 'warning':
        return 'text-warning-600 bg-warning-50 dark:text-warning-400 dark:bg-warning-900/20';
      case 'error':
        return 'text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-900/20';
      default:
        return 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon className='w-4 h-4' />;
      case 'warning':
        return <BellIcon className='w-4 h-4' />;
      case 'error':
        return <XMarkIcon className='w-4 h-4' />;
      default:
        return <BellIcon className='w-4 h-4' />;
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors border-l-4',
        isUnread
          ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
          : 'border-transparent'
      )}
    >
      <div className='flex items-start space-x-3'>
        <div
          className={cn('p-1 rounded-full', getTypeColor(notification.type))}
        >
          {getTypeIcon(notification.type)}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate'>
              {notification.title}
            </p>
            {isUnread && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className='ml-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
              >
                <CheckIcon className='w-4 h-4' />
              </button>
            )}
          </div>

          <p className='text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2'>
            {notification.message}
          </p>

          <p className='text-xs text-secondary-500 dark:text-secondary-500 mt-1'>
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

// Toast notification component for real-time notifications
interface ToastNotificationProps {
  notification: ToastNotification;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onClose,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-success-200 bg-success-50 dark:border-success-700 dark:bg-success-900/20';
      case 'warning':
        return 'border-warning-200 bg-warning-50 dark:border-warning-700 dark:bg-warning-900/20';
      case 'error':
        return 'border-error-200 bg-error-50 dark:border-error-700 dark:bg-error-900/20';
      default:
        return 'border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <CheckIcon className='w-5 h-5 text-success-600 dark:text-success-400' />
        );
      case 'warning':
        return (
          <BellIcon className='w-5 h-5 text-warning-600 dark:text-warning-400' />
        );
      case 'error':
        return (
          <XMarkIcon className='w-5 h-5 text-error-600 dark:text-error-400' />
        );
      default:
        return (
          <BellIcon className='w-5 h-5 text-primary-600 dark:text-primary-400' />
        );
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 w-80 rounded-lg border p-4 shadow-lg transition-all duration-300 transform',
        getTypeColor(notification.type),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>{getTypeIcon(notification.type)}</div>

        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-secondary-900 dark:text-secondary-100'>
            {notification.title}
          </p>
          <p className='text-sm text-secondary-600 dark:text-secondary-400 mt-1'>
            {notification.message}
          </p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className='flex-shrink-0 text-secondary-400 hover:text-secondary-600 dark:text-secondary-500 dark:hover:text-secondary-300'
        >
          <XMarkIcon className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
};

// Provider for toast notifications
interface ToastNotificationProviderProps {
  children: React.ReactNode;
}

export const ToastNotificationProvider: React.FC<
  ToastNotificationProviderProps
> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = React.useState<ToastNotification[]>([]);
  const { notifications } = useNotifications(user?.id || '');

  // Show toast for new notifications
  React.useEffect(() => {
    if (!user?.id || !notifications.length) return;

    // Get the latest notification
    const latestNotification = notifications[0];

    // Check if it's a new notification (less than 5 seconds old)
    const isNew =
      new Date(latestNotification.created_at).getTime() > Date.now() - 5000;

    if (isNew && !latestNotification.read) {
      const toastNotification: ToastNotification = {
        id: `toast-${latestNotification.id}`,
        title: latestNotification.title,
        message: latestNotification.message,
        type: latestNotification.type,
        duration: 5000,
      };

      setToasts(prev => [...prev, toastNotification]);
    }
  }, [user?.id, notifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <>
      {children}
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};
