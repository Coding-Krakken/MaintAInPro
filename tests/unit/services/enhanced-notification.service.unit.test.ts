import { describe, it, expect, beforeEach, vi } from 'vitest';
import { afterAll } from 'vitest';
import { profiles } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db';
import { notifications, notificationPreferences, pushSubscriptions } from '../../../shared/schema';
import { storage } from '../../../server/storage';

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

let testUserId: string;
describe('Enhanced Notification Storage', () => {

  beforeEach(async () => {
    testUserId = '11111111-1111-1111-1111-111111111111';
    // Insert test profile if not exists
      // Clean up notification data before each test
      await db.delete(notifications).where(eq(notifications.userId, testUserId));
      await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId));
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, testUserId));
      // Insert test profile with all required fields
      await db.insert(profiles).values({
        id: testUserId,
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'technician',
        active: true
      }).onConflictDoNothing();
  });

  afterAll(async () => {
  // Clean up notifications and preferences for test user
  await db.delete(notifications).where(eq(notifications.userId, testUserId));
  await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId));
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, testUserId));
  // Clean up test profile
  await db.delete(profiles).where(eq(profiles.id, testUserId));
  });

  describe('Notification Preferences', () => {
    it('should create notification preference successfully', async () => {
      const preference = await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'wo_assigned',
        enabled: true,
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
      });

      expect(preference.id).toBeDefined();
      expect(preference.userId).toBe(testUserId);
      expect(preference.notificationType).toBe('wo_assigned');
      expect(preference.enabled).toBe(true);
      expect(preference.emailEnabled).toBe(true);
      expect(preference.pushEnabled).toBe(false);
      expect(preference.smsEnabled).toBe(false);
      expect(preference.createdAt).toBeInstanceOf(Date);
      expect(preference.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve notification preferences for a specific user', async () => {
      // Create preferences for the test user
      await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'wo_assigned',
        enabled: true,
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
      });

      await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'part_low_stock',
        enabled: false,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
      });

      const preferences = await storage.getNotificationPreferences(testUserId);

      expect(preferences.length).toBe(2);
      expect(preferences[0].userId).toBe(testUserId);
      expect(preferences[1].userId).toBe(testUserId);

      const types = preferences.map(p => p.notificationType);
      expect(types).toContain('wo_assigned');
      expect(types).toContain('part_low_stock');
    });

    it('should update notification preference', async () => {
      // Create initial preference
      await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'wo_assigned',
        enabled: true,
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
      });

      // Update the preference
      const updatedPreference = await storage.updateNotificationPreference(
        testUserId,
        'wo_assigned',
        { enabled: false, pushEnabled: true }
      );

      expect(updatedPreference).toBeTruthy();
      expect(updatedPreference!.enabled).toBe(false);
      expect(updatedPreference!.pushEnabled).toBe(true);
      expect(updatedPreference!.emailEnabled).toBe(true); // Should remain unchanged
    });

    it('should delete notification preference', async () => {
      // Create preference
      await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'wo_assigned',
        enabled: true,
        emailEnabled: true,
        pushEnabled: false,
        smsEnabled: false,
      });

      // Verify it exists
      let preferences = await storage.getNotificationPreferences(testUserId);
      expect(preferences.length).toBe(1);

      // Delete it
      await storage.deleteNotificationPreference(testUserId, 'wo_assigned');

      // Verify it's gone
      preferences = await storage.getNotificationPreferences(testUserId);
      expect(preferences.length).toBe(0);
    });

    it('should handle quiet hours', async () => {
      const preference = await storage.createNotificationPreference({
        userId: testUserId,
        notificationType: 'wo_assigned',
        enabled: true,
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      });

      expect(preference.quietHoursStart).toBe('22:00');
      expect(preference.quietHoursEnd).toBe('08:00');
    });
  });

  describe('Push Subscriptions', () => {
    it('should create push subscription successfully', async () => {
      const subscription = await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        p256dhKey: 'test-p256dh-key',
        authKey: 'test-auth-key',
        userAgent: 'Mozilla/5.0 Test Browser',
        active: true,
      });

      expect(subscription.id).toBeDefined();
      expect(subscription.userId).toBe(testUserId);
      expect(subscription.endpoint).toBe('https://fcm.googleapis.com/fcm/send/test-endpoint');
      expect(subscription.p256dhKey).toBe('test-p256dh-key');
      expect(subscription.authKey).toBe('test-auth-key');
      expect(subscription.userAgent).toBe('Mozilla/5.0 Test Browser');
      expect(subscription.active).toBe(true);
      expect(subscription.createdAt).toBeInstanceOf(Date);
      expect(subscription.lastUsed).toBeInstanceOf(Date);
    });

    it('should retrieve push subscriptions for a specific user', async () => {
      // Ensure test profile exists for FK constraint
      await db.insert(profiles).values({
        id: testUserId,
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'technician',
        active: true
      }).onConflictDoNothing();

      // Create subscriptions for the test user
      await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        p256dhKey: 'test-p256dh-key-1',
        authKey: 'test-auth-key-1',
        active: true,
      });

      await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-2',
        p256dhKey: 'test-p256dh-key-2',
        authKey: 'test-auth-key-2',
        active: false,
      });

      const subscriptions = await storage.getPushSubscriptions(testUserId);

      expect(subscriptions.length).toBe(2);
      expect(subscriptions[0].userId).toBe(testUserId);
      expect(subscriptions[1].userId).toBe(testUserId);
    });

    it('should get only active push subscriptions', async () => {
      // Create active subscription
      await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        p256dhKey: 'test-p256dh-key-1',
        authKey: 'test-auth-key-1',
        active: true,
      });

      // Create inactive subscription
      await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-2',
        p256dhKey: 'test-p256dh-key-2',
        authKey: 'test-auth-key-2',
        active: false,
      });

      const activeSubscriptions = await storage.getActivePushSubscriptions(testUserId);

      expect(activeSubscriptions.length).toBe(1);
      expect(activeSubscriptions[0].active).toBe(true);
      expect(activeSubscriptions[0].endpoint).toBe(
        'https://fcm.googleapis.com/fcm/send/test-endpoint-1'
      );
    });

    it('should update push subscription', async () => {
      // Create subscription
      const subscription = await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        p256dhKey: 'test-p256dh-key',
        authKey: 'test-auth-key',
        active: true,
      });

      // Update the subscription
      const updatedSubscription = await storage.updatePushSubscription(subscription.id, {
        active: false,
      });

      expect(updatedSubscription).toBeTruthy();
      expect(updatedSubscription!.active).toBe(false);
      expect(updatedSubscription!.lastUsed).toBeInstanceOf(Date);
    });

    it('should delete push subscription', async () => {
      // Create subscription
      const subscription = await storage.createPushSubscription({
        userId: testUserId,
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
        p256dhKey: 'test-p256dh-key',
        authKey: 'test-auth-key',
        active: true,
      });

      // Verify it exists
      let subscriptions = await storage.getPushSubscriptions(testUserId);
      expect(subscriptions.length).toBe(1);

      // Delete it
      await storage.deletePushSubscription(subscription.id);

      // Verify it's gone
      subscriptions = await storage.getPushSubscriptions(testUserId);
      expect(subscriptions.length).toBe(0);
    });
  });

  describe('Enhanced Notifications', () => {
    it('should create notification with enhanced fields', async () => {
      const notification = await storage.createNotification({
        userId: testUserId,
        title: 'Test Enhanced Notification',
        message: 'This is a test message with enhanced fields',
        type: 'system_alert',
        read: false,
        metadata: { sourceSystem: 'test', urgency: 'high' },
        priority: 'critical',
      });

      expect(notification.id).toBeDefined();
      expect(notification.title).toBe('Test Enhanced Notification');
      expect(notification.type).toBe('system_alert');
      expect(notification.metadata).toEqual({ sourceSystem: 'test', urgency: 'high' });
      expect(notification.priority).toBe('critical');
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should delete notification', async () => {
      // Create notification
      const notification = await storage.createNotification({
        userId: testUserId,
        title: 'Test Notification to Delete',
        message: 'This notification will be deleted',
        type: 'wo_assigned',
        read: false,
      });

      // Verify it exists
      let notifications = await storage.getNotifications(testUserId);
      expect(notifications.some(n => n.id === notification.id)).toBe(true);

      // Delete it
      await storage.deleteNotification(notification.id);

      // Verify it's gone
      notifications = await storage.getNotifications(testUserId);
      expect(notifications.some(n => n.id === notification.id)).toBe(false);
    });

    it('should handle notifications with expiration', async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const notification = await storage.createNotification({
        userId: testUserId,
        title: 'Expiring Notification',
        message: 'This notification will expire',
        type: 'real_time_update',
        read: false,
        expiresAt,
      });

      expect(notification.expiresAt).toEqual(expiresAt);
    });
  });
    // End of tests
  });
