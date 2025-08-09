import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationService } from '../../../server/services/notification.service';
import { storage } from '../../../server/storage';

// Mock console methods
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('NotificationService', () => {
  beforeEach(async () => {
    // Clear any existing notifications for clean test state
    try {
      const allNotifications = await storage.getNotifications('user-1');
      for (const notification of allNotifications) {
        await storage.markNotificationRead(notification.id);
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
  describe('sendNotification', () => {
    it('should send notification through storage layer', async () => {
      const notificationData = {
        userId: 'user-1',
        title: 'Test Notification',
        message: 'This is a test message',
        type: 'wo_assigned' as const,
        read: false,
      };

      await expect(notificationService.sendNotification(notificationData)).resolves.not.toThrow();
    });
  });
});

describe('Notification Storage Integration', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Use a unique user ID for each test to avoid interference
    testUserId = `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
      const notifications = await storage.getNotifications('non-existent-user');
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
      await expect(storage.markNotificationRead('non-existent-id')).resolves.not.toThrow();
    });
  });
});
