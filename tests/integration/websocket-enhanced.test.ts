import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { webSocketService } from '../../../client/src/services/websocket.service';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  connected: false,
  id: 'mock-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Enhanced WebSocket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      switch (key) {
        case 'userId':
          return 'test-user-123';
        case 'warehouseId':
          return 'test-warehouse-456';
        default:
          return null;
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Notification Preferences', () => {
    it('should load notification preferences', async () => {
      // Mock fetch for preferences API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'pref-1',
            userId: 'test-user-123',
            notificationType: 'wo_assigned',
            enabled: true,
            emailEnabled: true,
            pushEnabled: false,
            smsEnabled: false,
          },
        ],
      });

      await webSocketService.loadNotificationPreferences();

      expect(fetch).toHaveBeenCalledWith('/api/notification-preferences', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-123',
        },
      });
    });

    it('should update notification preferences', async () => {
      // Mock fetch for update API
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'pref-1',
          userId: 'test-user-123',
          notificationType: 'wo_assigned',
          enabled: false,
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false,
        }),
      });

      const success = await webSocketService.updateNotificationPreference('wo_assigned', {
        enabled: false,
        pushEnabled: true,
      });

      expect(success).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-123',
        },
        body: JSON.stringify({
          notificationType: 'wo_assigned',
          enabled: false,
          pushEnabled: true,
        }),
      });
    });

    it('should check if notification should be shown based on preferences', async () => {
      // Mock loading preferences first
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'pref-1',
            userId: 'test-user-123',
            notificationType: 'wo_assigned',
            enabled: true,
            emailEnabled: true,
            pushEnabled: false,
            smsEnabled: false,
          },
          {
            id: 'pref-2',
            userId: 'test-user-123',
            notificationType: 'part_low_stock',
            enabled: false,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
          },
        ],
      });

      await webSocketService.loadNotificationPreferences();

      // Test enabled notification type
      const enabledNotification = {
        id: 'notif-1',
        userId: 'test-user-123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'wo_assigned' as const,
        read: false,
        createdAt: new Date(),
      };

      expect(webSocketService.shouldShowNotification(enabledNotification)).toBe(true);

      // Test disabled notification type
      const disabledNotification = {
        id: 'notif-2',
        userId: 'test-user-123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'part_low_stock' as const,
        read: false,
        createdAt: new Date(),
      };

      expect(webSocketService.shouldShowNotification(disabledNotification)).toBe(false);
    });

    it('should handle quiet hours', async () => {
      // Mock current time to be within quiet hours
      const originalDate = Date;
      const mockDate = new Date('2023-01-01T23:30:00'); // 11:30 PM
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
      } as any;

      // Mock loading preferences with quiet hours
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 'pref-1',
            userId: 'test-user-123',
            notificationType: 'wo_assigned',
            enabled: true,
            emailEnabled: true,
            pushEnabled: false,
            smsEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
          },
        ],
      });

      await webSocketService.loadNotificationPreferences();

      const notification = {
        id: 'notif-1',
        userId: 'test-user-123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'wo_assigned' as const,
        read: false,
        createdAt: new Date(),
      };

      expect(webSocketService.shouldShowNotification(notification)).toBe(false);

      // Restore original Date
      global.Date = originalDate;
    });
  });

  describe('Connection Management', () => {
    it('should provide connection status', () => {
      const status = webSocketService.getConnectionStatus();
      
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('socketId');
      expect(status).toHaveProperty('reconnectAttempts');
      expect(typeof status.connected).toBe('boolean');
    });

    it('should handle reconnection', () => {
      webSocketService.reconnect();
      
      // Should attempt to connect (exact implementation may vary)
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should refresh authentication', () => {
      // Mock connection as established
      const originalIsConnected = webSocketService.isSocketConnected;
      Object.defineProperty(webSocketService, 'isSocketConnected', {
        value: vi.fn().mockReturnValue(true),
        configurable: true,
      });

      webSocketService.refreshAuthentication();

      expect(mockSocket.emit).toHaveBeenCalledWith('authenticate', {
        userId: 'test-user-123',
        warehouseId: 'test-warehouse-456',
      });

      // Restore original method
      Object.defineProperty(webSocketService, 'isSocketConnected', {
        value: originalIsConnected,
        configurable: true,
      });
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to notifications', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribeToNotifications(callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to work orders', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribeToWorkOrders(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to equipment updates', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribeToEquipment(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to inventory updates', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribeToInventory(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to PM updates', () => {
      const callback = vi.fn();
      const unsubscribe = webSocketService.subscribeToPM(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });
});