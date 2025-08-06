import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MobileWorkOrderList } from './MobileWorkOrderList';
import { useWorkOrders } from '../hooks/useWorkOrders';
import {
  WorkOrderListItem,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from '../types/workOrder';

// Mock the useWorkOrders hook
vi.mock('../hooks/useWorkOrders', () => ({
  useWorkOrders: vi.fn(),
}));

// Mock QR Scanner component
vi.mock('../QRCodeScanner', () => ({
  QRCodeScanner: ({
    isOpen,
    onClose,
    onScanResult,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onScanResult: (result: string) => void;
  }) =>
    isOpen ? (
      <div data-testid='qr-scanner'>
        <button onClick={onClose} data-testid='close-scanner'>
          Close
        </button>
        <button
          onClick={() => onScanResult('WO-12345')}
          data-testid='test-scan'
        >
          Test Scan
        </button>
      </div>
    ) : null,
}));

// Mock Create Work Order Modal
vi.mock('../CreateWorkOrderModal', () => ({
  CreateWorkOrderModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid='create-modal'>
        <button onClick={onClose} data-testid='close-modal'>
          Close
        </button>
      </div>
    ) : null,
}));

const mockWorkOrders: WorkOrderListItem[] = [
  {
    id: '1',
    work_order_number: 'WO-001',
    title: 'Fix air conditioning',
    priority: WorkOrderPriority.HIGH,
    status: WorkOrderStatus.OPEN,
    type: WorkOrderType.CORRECTIVE,
    assigned_to_name: 'John Doe',
    equipment_name: 'HVAC Unit 1',
    created_at: '2024-01-01T00:00:00Z',
    scheduled_start: '2024-01-02T00:00:00Z',
    is_overdue: false,
  },
  {
    id: '2',
    work_order_number: 'WO-002',
    title: 'Replace light bulb',
    priority: WorkOrderPriority.MEDIUM,
    status: WorkOrderStatus.IN_PROGRESS,
    type: WorkOrderType.CORRECTIVE,
    assigned_to_name: 'Jane Smith',
    equipment_name: 'Lighting Panel 2',
    created_at: '2024-01-01T00:00:00Z',
    scheduled_start: '2024-01-03T00:00:00Z',
    is_overdue: false,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  return TestWrapper;
};

describe('MobileWorkOrderList', () => {
  const mockedUseWorkOrders = vi.mocked(useWorkOrders);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: false,
      status: 'pending',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
      isError: true,
      isSuccess: false,
      status: 'error',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    expect(screen.getByText('Failed to load work orders')).toBeInTheDocument();
  });

  it('renders work orders list correctly', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: {
        data: mockWorkOrders,
        count: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    expect(screen.getByText('Fix air conditioning')).toBeInTheDocument();
    expect(screen.getByText('Replace light bulb')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('HVAC Unit 1')).toBeInTheDocument();
    expect(screen.getByText('Lighting Panel 2')).toBeInTheDocument();
  });

  it('opens QR scanner when QR button is clicked', async () => {
    mockedUseWorkOrders.mockReturnValue({
      data: {
        data: mockWorkOrders,
        count: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    // Find the QR button by its icon
    const qrButton = screen.getAllByRole('button')[0]; // First button is QR button
    if (qrButton) {
      fireEvent.click(qrButton);
    }

    await waitFor(() => {
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });
  });

  it('closes QR scanner correctly', async () => {
    mockedUseWorkOrders.mockReturnValue({
      data: {
        data: mockWorkOrders,
        count: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    // Open QR scanner
    const qrButton = screen.getAllByRole('button')[0]; // First button is QR button
    if (qrButton) {
      fireEvent.click(qrButton);
    }

    await waitFor(() => {
      expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    });

    // Close QR scanner
    const closeButton = screen.getByTestId('close-scanner');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no work orders', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: {
        data: [],
        count: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    expect(screen.getByText('No work orders found')).toBeInTheDocument();
  });

  it('expands work order card on click', async () => {
    mockedUseWorkOrders.mockReturnValue({
      data: {
        data: mockWorkOrders,
        count: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isSuccess: true,
      status: 'success',
    } as any);

    render(<MobileWorkOrderList />, { wrapper: createWrapper() });

    const workOrderCard = screen
      .getByText('Fix air conditioning')
      .closest('[role="button"]');
    if (workOrderCard) {
      fireEvent.click(workOrderCard);

      // Check that the scheduled date appears in expanded view
      await waitFor(() => {
        expect(screen.getByText(/Scheduled:/)).toBeInTheDocument();
      });
    }
  });
});
