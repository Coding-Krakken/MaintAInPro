import { describe, it, expect, vi } from 'vitest';
import { WorkOrderPriority, WorkOrderType, WorkOrderStatus } from '../types/workOrder';

// Mock the work order service
vi.mock('../services/workOrderService', () => ({
  workOrderService: {
    getWorkOrders: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          wo_number: 'WO-2025-0001',
          title: 'Test Work Order',
          priority: 'medium',
          status: 'open',
          type: 'corrective',
          assigned_to_name: 'John Doe',
          equipment_name: 'Test Equipment',
          created_at: '2025-01-01T10:00:00Z',
          scheduled_start: '2025-01-02T08:00:00Z',
          is_overdue: false,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    }),
    createWorkOrder: vi.fn().mockResolvedValue({
      id: '2',
      wo_number: 'WO-2025-0002',
      title: 'New Work Order',
      priority: 'high',
      status: 'open',
      type: 'corrective',
      created_at: '2025-01-01T11:00:00Z',
      updated_at: '2025-01-01T11:00:00Z',
    }),
  },
}));

// Mock date-fns to avoid timezone issues
vi.mock('date-fns', () => ({
  format: vi.fn().mockReturnValue('Jan 1, 2025 10:00 AM'),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  PlusIcon: () => <span data-testid="plus-icon">+</span>,
  SearchIcon: () => <span data-testid="search-icon">🔍</span>,
  FilterIcon: () => <span data-testid="filter-icon">⚙️</span>,
  CalendarIcon: () => <span data-testid="calendar-icon">📅</span>,
  ClockIcon: () => <span data-testid="clock-icon">⏰</span>,
  UserIcon: () => <span data-testid="user-icon">👤</span>,
  WrenchIcon: () => <span data-testid="wrench-icon">🔧</span>,
  AlertTriangleIcon: () => <span data-testid="alert-icon">⚠️</span>,
  MinusIcon: () => <span data-testid="minus-icon">−</span>,
}));

describe('Work Order Types and Enums', () => {
  it('has correct priority enum values', () => {
    expect(WorkOrderPriority.LOW).toBe('low');
    expect(WorkOrderPriority.MEDIUM).toBe('medium');
    expect(WorkOrderPriority.HIGH).toBe('high');
    expect(WorkOrderPriority.CRITICAL).toBe('critical');
    expect(WorkOrderPriority.EMERGENCY).toBe('emergency');
  });

  it('has correct status enum values', () => {
    expect(WorkOrderStatus.OPEN).toBe('open');
    expect(WorkOrderStatus.ASSIGNED).toBe('assigned');
    expect(WorkOrderStatus.IN_PROGRESS).toBe('in_progress');
    expect(WorkOrderStatus.COMPLETED).toBe('completed');
    expect(WorkOrderStatus.VERIFIED).toBe('verified');
    expect(WorkOrderStatus.CLOSED).toBe('closed');
  });

  it('has correct type enum values', () => {
    expect(WorkOrderType.CORRECTIVE).toBe('corrective');
    expect(WorkOrderType.PREVENTIVE).toBe('preventive');
    expect(WorkOrderType.EMERGENCY).toBe('emergency');
    expect(WorkOrderType.INSPECTION).toBe('inspection');
    expect(WorkOrderType.SAFETY).toBe('safety');
    expect(WorkOrderType.IMPROVEMENT).toBe('improvement');
  });
});