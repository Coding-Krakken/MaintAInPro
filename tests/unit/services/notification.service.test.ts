let _testUserId: string;
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { afterAll } from 'vitest';
import { profiles, notifications, notificationPreferences, pushSubscriptions } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../server/db';
import { notificationService } from '../../../server/services/notification.service';
import { storage } from '../../../server/storage';

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('NotificationService', () => {
  let testUserId: string;
  beforeEach(async () => {
    testUserId = '11111111-1111-1111-1111-111111111111';
    // Insert test profile if not exists
      await db.insert(profiles).values({
        id: testUserId,
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'technician',
        active: true
      }).onConflictDoNothing();
    // Clean up notification data before each test
    await db.delete(notifications).where(eq(notifications.userId, testUserId));
    await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId));
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, testUserId));
  });
  afterAll(async () => {
  // Clean up notifications and preferences for test user
  await db.delete(notifications).where(eq(notifications.userId, testUserId));
  await db.delete(notificationPreferences).where(eq(notificationPreferences.userId, testUserId));
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, testUserId));
  // Clean up test profile
  await db.delete(profiles).where(eq(profiles.id, testUserId));
  });
  describe('sendNotification', () => {
    it('should send notification through storage layer', async () => {
      const notificationData = {
        userId: '11111111-1111-1111-1111-111111111111',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'wo_assigned' as const,
        read: false,
  priority: 'medium' as const,
      };

      await expect(notificationService.sendNotification(notificationData)).resolves.not.toThrow();
    });
  });
// ...existing code...

describe('Notification Storage Integration', () => {
let testUserId: string;
beforeEach(async () => {
  testUserId = '11111111-1111-1111-1111-111111111111';
  // Insert test profile if not exists
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
  it('should create and retrieve a notification for the test user', async () => {
    const notification = await storage.createNotification({
      userId: testUserId,
      title: 'Integration Notification',
      message: 'Integration test message',
      type: 'wo_assigned',
      read: false,
    });
    expect(notification.id).toBeDefined();
    const notificationsList = await storage.getNotifications(testUserId);
    expect(notificationsList.length).toBe(1);
    expect(notificationsList[0].id).toBe(notification.id);
  });
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const notification = await storage.createNotification({
        userId: testUserId,
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'wo_assigned',
        read: false,
      });

      expect(notification.id).toBeDefined();
      expect(notification.title).toBe('Test Notification');
      expect(notification.message).toBe('This is a test message');
      expect(notification.type).toBe('wo_assigned');
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getNotifications', () => {
    it('should retrieve notifications for a specific user', async () => {
      await storage.createNotification({
        userId: testUserId,
        title: 'User 1 Notification',
        message: 'Message for user 1',
        type: 'wo_assigned',
        read: false,
      });

      const notifications = await storage.getNotifications(testUserId);

      expect(notifications.length).toBe(1);
      expect(notifications[0].userId).toBe(testUserId);
      expect(notifications[0].title).toBe('User 1 Notification');
    });

    it('should handle empty notifications list', async () => {
  const notifications = await storage.getNotifications('22222222-2222-2222-2222-222222222222');
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);
    });
  });

  describe('markNotificationRead', () => {
    it('should mark notification as read', async () => {
      const notification = await storage.createNotification({
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test message',
        type: 'wo_assigned',
        read: false,
      });

      await storage.markNotificationRead(notification.id);

      const notifications = await storage.getNotifications(testUserId);
      const updatedNotification = notifications.find(n => n.id === notification.id);

      expect(updatedNotification?.read).toBe(true);
    });

    it('should handle marking non-existent notification', async () => {
      // The storage layer should handle this gracefully without throwing
  await expect(storage.markNotificationRead('33333333-3333-3333-3333-333333333333')).resolves.not.toThrow();
    });
  });
});
