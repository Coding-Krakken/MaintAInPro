import React, { useEffect, useState } from 'react';
import { webSocketService } from '@/services/websocket.service';
import { pwaService } from '@/services/pwa.service';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: string;
  enabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PushSubscriptionStatus {
  supported: boolean;
  granted: boolean;
  subscribed: boolean;
  subscription?: PushSubscription;
}

const notificationTypeLabels: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  wo_assigned: {
    label: 'Work Order Assigned',
    description: 'When a new work order is assigned to you',
    icon: <Bell className="w-4 h-4" />
  },
  wo_overdue: {
    label: 'Work Order Overdue',
    description: 'When a work order becomes overdue',
    icon: <Clock className="w-4 h-4" />
  },
  part_low_stock: {
    label: 'Low Stock Alerts',
    description: 'When inventory parts are running low',
    icon: <Bell className="w-4 h-4" />
  },
  pm_due: {
    label: 'Preventive Maintenance Due',
    description: 'When preventive maintenance is due',
    icon: <Bell className="w-4 h-4" />
  },
  equipment_alert: {
    label: 'Equipment Alerts',
    description: 'Equipment status changes and alerts',
    icon: <Bell className="w-4 h-4" />
  },
  pm_escalation: {
    label: 'PM Escalations',
    description: 'When preventive maintenance tasks are escalated',
    icon: <Bell className="w-4 h-4" />
  },
  system_alert: {
    label: 'System Alerts',
    description: 'Important system-wide notifications',
    icon: <Bell className="w-4 h-4" />
  },
  real_time_update: {
    label: 'Real-time Updates',
    description: 'Live updates and status changes',
    icon: <Bell className="w-4 h-4" />
  }
};

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [pushStatus, setPushStatus] = useState<PushSubscriptionStatus>({
    supported: false,
    granted: false,
    subscribed: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalQuietHours, setGlobalQuietHours] = useState({
    start: '22:00',
    end: '08:00'
  });

  useEffect(() => {
    loadPreferences();
    checkPushStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      await webSocketService.loadNotificationPreferences();
      // Note: In a real implementation, we'd get preferences from the service
      // For now, we'll create default preferences for all types
      const defaultPreferences = Object.keys(notificationTypeLabels).map(type => ({
        id: `pref-${type}`,
        userId: 'current-user',
        notificationType: type,
        enabled: true,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        quietHoursStart: globalQuietHours.start,
        quietHoursEnd: globalQuietHours.end,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      setPreferences(defaultPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    const status = await pwaService.getPushSubscriptionStatus();
    setPushStatus(status);
  };

  const handlePreferenceChange = async (
    notificationType: string,
    field: keyof NotificationPreference,
    value: boolean | string
  ) => {
    try {
      setSaving(true);
      
      const success = await webSocketService.updateNotificationPreference(notificationType, {
        [field]: value
      });

      if (success) {
        setPreferences(prev => 
          prev.map(pref => 
            pref.notificationType === notificationType
              ? { ...pref, [field]: value, updatedAt: new Date() }
              : pref
          )
        );
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePushPermissionRequest = async () => {
    try {
      const permission = await pwaService.requestNotificationPermission();
      if (permission === 'granted') {
        await pwaService.initialize();
        await checkPushStatus();
      }
    } catch (error) {
      console.error('Failed to request push permission:', error);
    }
  };

  const handlePushUnsubscribe = async () => {
    try {
      const success = await pwaService.unsubscribeFromPushNotifications();
      if (success) {
        await checkPushStatus();
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  };

  const updateGlobalQuietHours = async (start: string, end: string) => {
    try {
      setSaving(true);
      // Update all preferences with new quiet hours
      for (const pref of preferences) {
        await handlePreferenceChange(pref.notificationType, 'quietHoursStart', start);
        await handlePreferenceChange(pref.notificationType, 'quietHoursEnd', end);
      }
      setGlobalQuietHours({ start, end });
    } catch (error) {
      console.error('Failed to update quiet hours:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Preferences...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Push Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure browser and mobile push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Push Notification Support</Label>
              <p className="text-sm text-muted-foreground">
                {pushStatus.supported ? 'Your browser supports push notifications' : 'Push notifications are not supported'}
              </p>
            </div>
            <Badge variant={pushStatus.supported ? 'default' : 'secondary'}>
              {pushStatus.supported ? 'Supported' : 'Not Supported'}
            </Badge>
          </div>

          {pushStatus.supported && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Permission Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {pushStatus.granted ? 'Permission granted' : 'Permission required'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pushStatus.granted ? 'default' : 'destructive'}>
                    {pushStatus.granted ? 'Granted' : 'Not Granted'}
                  </Badge>
                  {!pushStatus.granted && (
                    <Button size="sm" onClick={handlePushPermissionRequest}>
                      Request Permission
                    </Button>
                  )}
                </div>
              </div>

              {pushStatus.granted && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Subscription Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {pushStatus.subscribed ? 'Subscribed to push notifications' : 'Not subscribed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pushStatus.subscribed ? 'default' : 'secondary'}>
                        {pushStatus.subscribed ? 'Subscribed' : 'Not Subscribed'}
                      </Badge>
                      {pushStatus.subscribed && (
                        <Button size="sm" variant="destructive" onClick={handlePushUnsubscribe}>
                          Unsubscribe
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Global Settings
          </CardTitle>
          <CardDescription>
            Settings that apply to all notification types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Quiet Hours Start</Label>
              <Input
                id="quiet-start"
                type="time"
                value={globalQuietHours.start}
                onChange={(e) => setGlobalQuietHours(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">Quiet Hours End</Label>
              <Input
                id="quiet-end"
                type="time"
                value={globalQuietHours.end}
                onChange={(e) => setGlobalQuietHours(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={() => updateGlobalQuietHours(globalQuietHours.start, globalQuietHours.end)}
            disabled={saving}
          >
            {saving ? 'Updating...' : 'Update Quiet Hours'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Type Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Configure preferences for each type of notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {preferences.map((preference) => {
              const typeInfo = notificationTypeLabels[preference.notificationType];
              if (!typeInfo) return null;

              return (
                <div key={preference.notificationType} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {typeInfo.icon}
                      <div>
                        <Label className="font-medium">{typeInfo.label}</Label>
                        <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preference.enabled}
                      onCheckedChange={(checked) =>
                        handlePreferenceChange(preference.notificationType, 'enabled', checked)
                      }
                      disabled={saving}
                    />
                  </div>

                  {preference.enabled && (
                    <div className="ml-7 pl-4 border-l-2 border-muted">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm">Email</Label>
                          <Switch
                            checked={preference.emailEnabled}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(preference.notificationType, 'emailEnabled', checked)
                            }
                            disabled={saving}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm">Push</Label>
                          <Switch
                            checked={preference.pushEnabled && pushStatus.subscribed}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(preference.notificationType, 'pushEnabled', checked)
                            }
                            disabled={saving || !pushStatus.subscribed}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm">SMS</Label>
                          <Switch
                            checked={preference.smsEnabled}
                            onCheckedChange={(checked) =>
                              handlePreferenceChange(preference.notificationType, 'smsEnabled', checked)
                            }
                            disabled={true} // SMS not implemented yet
                          />
                          <Badge variant="secondary" className="text-xs">
                            Coming Soon
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  <Separator />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;