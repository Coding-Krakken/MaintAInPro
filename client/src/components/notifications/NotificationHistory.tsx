import React, { useEffect, useState } from 'react';
import { webSocketService, NotificationData } from '@/services/websocket.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Info,
  XCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface NotificationFilter {
  type: string;
  priority: string;
  read: string;
  search: string;
}

const notificationTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  wo_assigned: { label: 'Work Order Assigned', color: 'blue', icon: <Bell className="w-4 h-4" /> },
  wo_overdue: { label: 'Work Order Overdue', color: 'red', icon: <Clock className="w-4 h-4" /> },
  part_low_stock: { label: 'Low Stock Alert', color: 'orange', icon: <AlertTriangle className="w-4 h-4" /> },
  pm_due: { label: 'PM Due', color: 'yellow', icon: <Clock className="w-4 h-4" /> },
  equipment_alert: { label: 'Equipment Alert', color: 'red', icon: <AlertTriangle className="w-4 h-4" /> },
  pm_escalation: { label: 'PM Escalation', color: 'red', icon: <Zap className="w-4 h-4" /> },
  system_alert: { label: 'System Alert', color: 'purple', icon: <Info className="w-4 h-4" /> },
  real_time_update: { label: 'Real-time Update', color: 'green', icon: <Zap className="w-4 h-4" /> },
  info: { label: 'Information', color: 'blue', icon: <Info className="w-4 h-4" /> },
  warning: { label: 'Warning', color: 'yellow', icon: <AlertTriangle className="w-4 h-4" /> },
  error: { label: 'Error', color: 'red', icon: <XCircle className="w-4 h-4" /> },
  success: { label: 'Success', color: 'green', icon: <CheckCircle className="w-4 h-4" /> },
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const NotificationHistory: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: 'all',
    priority: 'all',
    read: 'all',
    search: '',
  });

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const unsubscribe = webSocketService.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification as NotificationData, ...prev]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the API
      const response = await fetch('/api/notifications', {
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'default-user',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Filter by type
    if (filter.type !== 'all') {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    // Filter by priority
    if (filter.priority !== 'all') {
      filtered = filtered.filter(n => n.priority === filter.priority);
    }

    // Filter by read status
    if (filter.read !== 'all') {
      const isRead = filter.read === 'read';
      filtered = filtered.filter(n => n.read === isRead);
    }

    // Filter by search term
    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search)
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || 'default-user',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'default-user',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = filteredNotifications.filter(n => !n.read);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const clearAllRead = async () => {
    const readNotifications = filteredNotifications.filter(n => n.read);
    
    for (const notification of readNotifications) {
      await deleteNotification(notification.id);
    }
  };

  const getNotificationTypeInfo = (type: string) => {
    return notificationTypeLabels[type] || notificationTypeLabels.info;
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(notificationDate, { addSuffix: true });
    } else {
      return format(notificationDate, 'MMM d, yyyy h:mm a');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Notifications...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification History
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                View and manage your notification history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {filteredUnreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={clearAllRead}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Read
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  className="pl-10"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filter.type} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(notificationTypeLabels).map(([type, info]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {info.icon}
                        {info.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={filter.priority} onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filter.read} onValueChange={(value) => setFilter(prev => ({ ...prev, read: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            {filteredNotifications.length !== notifications.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter({ type: 'all', priority: 'all', read: 'all', search: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Notifications Found</h3>
              <p className="text-muted-foreground">
                {notifications.length === 0 
                  ? 'You have no notifications yet.' 
                  : 'No notifications match your current filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const typeInfo = getNotificationTypeInfo(notification.type);
            return (
              <Card 
                key={notification.id} 
                className={cn(
                  'transition-all hover:shadow-md',
                  !notification.read && 'border-l-4 border-l-blue-500 bg-blue-50/50'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-600`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            "font-medium",
                            !notification.read && "text-blue-900"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <Badge variant="outline" className="text-xs">
                            {typeInfo.label}
                          </Badge>
                          {notification.priority && notification.priority !== 'medium' && (
                            <Badge className={cn('text-xs', priorityColors[notification.priority])}>
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>

                      {notification.metadata && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Additional Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(notification.metadata, null, 2)}
                          </pre>
                        </details>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 px-2"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;