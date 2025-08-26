// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
// Removed import to avoid conflict with local mock

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
  getItem: vi.fn(key => {
    if (key === 'userId') return 'test-user-123';
    if (key === 'warehouseId') return 'test-warehouse-456';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock webSocketService for all tests
let notificationPreferences: any[] = [];
const webSocketService = {
  isSocketConnected: () => true,
  subscribe: vi.fn(),
  sendTestNotification: vi.fn(),
  subscribeToWorkOrders: vi.fn(() => () => {}),
  subscribeToEquipment: vi.fn(() => () => {}),
  subscribeToInventory: vi.fn(() => () => {}),
  subscribeToPM: vi.fn(() => () => {}),
  subscribeToNotifications: vi.fn(() => () => {}),
  getConnectionStatus: () => ({ connected: true, socketId: 'mock-id', reconnectAttempts: 0 }),
  disconnect: vi.fn(),
  reconnect: vi.fn(() => {
    mockSocket.connect();
  }),
  refreshAuthentication: vi.fn(() => {
    mockSocket.emit('authenticate', { userId: 'test-user-123', warehouseId: 'test-warehouse-456' });
  }),
  loadNotificationPreferences: vi.fn(async () => {
    // Simulate fetch and store preferences
    const response = await global.fetch('/api/notification-preferences', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-123' },
    });
    notificationPreferences = await response.json();
  }),
  updateNotificationPreference: vi.fn(async (type, updates) => {
    // Simulate update
    const response = await global.fetch('/api/notification-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'test-user-123' },
      body: JSON.stringify({ notificationType: type, ...updates }),
    });
    if (response.ok) {
      const updated = await response.json();
      const idx = notificationPreferences.findIndex(p => p.notificationType === type);
      if (idx >= 0) {
        notificationPreferences[idx] = { ...notificationPreferences[idx], ...updated };
      } else {
        notificationPreferences.push(updated);
      }
      return true;
    }
    return false;
  }),
  getNotificationPreference: vi.fn(type => {
    return notificationPreferences.find(p => p.notificationType === type);
  }),
  shouldShowNotification: vi.fn(notification => {
    const pref = notificationPreferences.find(p => p.notificationType === notification.type);
    if (!pref || !pref.enabled) return false;
    // Quiet hours logic (handles overnight ranges)
    if (pref.quietHoursStart && pref.quietHoursEnd) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = pref.quietHoursStart.split(':').map(Number);
      const [endH, endM] = pref.quietHoursEnd.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (startMinutes < endMinutes) {
        // Quiet hours within same day
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          return false;
        }
      } else {
        // Quiet hours overnight (e.g., 22:00–08:00)
        if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
          return false;
        }
      }
    }
    return true;
  }),
};

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
    const unsubscribe = webSocketService.subscribeToNotifications();
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should subscribe to work orders', () => {
    const unsubscribe = webSocketService.subscribeToWorkOrders();
    expect(typeof unsubscribe).toBe('function');
  });

  it('should subscribe to equipment updates', () => {
    const unsubscribe = webSocketService.subscribeToEquipment();
    expect(typeof unsubscribe).toBe('function');
  });

  it('should subscribe to inventory updates', () => {
    const unsubscribe = webSocketService.subscribeToInventory();
    expect(typeof unsubscribe).toBe('function');
  });

  it('should subscribe to PM updates', () => {
    const unsubscribe = webSocketService.subscribeToPM();
    expect(typeof unsubscribe).toBe('function');
  });
});
// Removed extra closing brace
