import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Real-time subscription types
export type SubscriptionEvent = 'INSERT' | 'UPDATE' | 'DELETE';
export type SubscriptionCallback<T = any> = (
  event: SubscriptionEvent,
  data: T
) => void;

class RealtimeService {
  private subscriptions: Map<string, any> = new Map();

  // Subscribe to work order changes
  subscribeToWorkOrders(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('work_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        payload => {
          callback(
            payload.eventType as SubscriptionEvent,
            payload.new || payload.old
          );
        }
      )
      .subscribe();

    this.subscriptions.set('work_orders', subscription);
    return () => this.unsubscribe('work_orders');
  }

  // Subscribe to equipment changes
  subscribeToEquipment(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('equipment')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        payload => {
          callback(
            payload.eventType as SubscriptionEvent,
            payload.new || payload.old
          );
        }
      )
      .subscribe();

    this.subscriptions.set('equipment', subscription);
    return () => this.unsubscribe('equipment');
  }

  // Subscribe to inventory changes
  subscribeToInventory(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('inventory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        payload => {
          callback(
            payload.eventType as SubscriptionEvent,
            payload.new || payload.old
          );
        }
      )
      .subscribe();

    this.subscriptions.set('inventory', subscription);
    return () => this.unsubscribe('inventory');
  }

  // Subscribe to notifications for current user
  subscribeToNotifications(userId: string, callback: SubscriptionCallback) {
    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          callback(
            payload.eventType as SubscriptionEvent,
            payload.new || payload.old
          );
        }
      )
      .subscribe();

    this.subscriptions.set(`notifications_${userId}`, subscription);
    return () => this.unsubscribe(`notifications_${userId}`);
  }

  // Subscribe to user presence (who's online)
  subscribeToPresence(userId: string, callback: (presence: any) => void) {
    const subscription = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        callback(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        callback({ event: 'join', key, newPresences });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        callback({ event: 'leave', key, leftPresences });
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await subscription.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.subscriptions.set(`presence_${userId}`, subscription);
    return () => this.unsubscribe(`presence_${userId}`);
  }

  // Subscribe to system-wide announcements
  subscribeToAnnouncements(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('announcements')
      .on('broadcast', { event: 'announcement' }, payload => {
        callback('INSERT', payload);
      })
      .subscribe();

    this.subscriptions.set('announcements', subscription);
    return () => this.unsubscribe('announcements');
  }

  // Broadcast system announcement
  async broadcastAnnouncement(
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) {
    const announcement = {
      id: crypto.randomUUID(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    await supabase.channel('announcements').send({
      type: 'broadcast',
      event: 'announcement',
      payload: announcement,
    });

    return announcement;
  }

  // Subscribe to specific work order updates
  subscribeToWorkOrder(workOrderId: string, callback: SubscriptionCallback) {
    const subscription = supabase
      .channel(`work_order_${workOrderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_orders',
          filter: `id=eq.${workOrderId}`,
        },
        payload => {
          callback(
            payload.eventType as SubscriptionEvent,
            payload.new || payload.old
          );
        }
      )
      .subscribe();

    this.subscriptions.set(`work_order_${workOrderId}`, subscription);
    return () => this.unsubscribe(`work_order_${workOrderId}`);
  }

  // Subscribe to equipment alerts
  subscribeToEquipmentAlerts(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('equipment_alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'equipment',
          filter: 'status=eq.alert',
        },
        payload => {
          callback(payload.eventType as SubscriptionEvent, payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set('equipment_alerts', subscription);
    return () => this.unsubscribe('equipment_alerts');
  }

  // Subscribe to low inventory alerts
  subscribeToLowInventoryAlerts(callback: SubscriptionCallback) {
    const subscription = supabase
      .channel('low_inventory_alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory',
        },
        payload => {
          // Check if quantity is below threshold
          const item = payload.new;
          if (item && item['quantity'] <= (item['reorder_point'] || 10)) {
            callback('UPDATE', item);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('low_inventory_alerts', subscription);
    return () => this.unsubscribe('low_inventory_alerts');
  }

  // Unsubscribe from a specific subscription
  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // Get current subscription count
  getSubscriptionCount() {
    return this.subscriptions.size;
  }

  // Get list of active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// React hook for real-time subscriptions
export function useRealtimeSubscription<T = any>(
  _subscriptionKey: string,
  subscribeFn: (callback: SubscriptionCallback<T>) => () => void,
  deps: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeFn((_event, newData) => {
      setData(newData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setLoading(false);
    };
  }, deps);

  return { data, loading, error };
}

// React hook for notifications
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read_at).length);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const unsubscribe = realtimeService.subscribeToNotifications(
      userId,
      (event, data) => {
        if (event === 'INSERT') {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
        } else if (event === 'UPDATE') {
          setNotifications(prev =>
            prev.map(n => (n.id === data.id ? data : n))
          );
          if (data.read_at) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      }
    );

    return unsubscribe;
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    await supabase.rpc('mark_notification_read', {
      notification_id: notificationId,
    });
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

// React hook for presence
export function usePresence(userId: string) {
  const [onlineUsers, setOnlineUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeService.subscribeToPresence(
      userId,
      presence => {
        if (presence.event === 'sync') {
          const users = Object.values(presence).flat();
          setOnlineUsers(users);
        }
      }
    );

    return unsubscribe;
  }, [userId]);

  return { onlineUsers };
}

// Import React for hooks
import React from 'react';
