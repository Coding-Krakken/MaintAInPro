import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EquipmentPage from '../../client/src/pages/Equipment';

// Mock equipment data - matches the actual development data
const mockEquipmentData = [
  {
    id: 'uas-001-id',
    assetTag: 'UAS-001',
    model: 'CB-2000X',
    description: 'Conveyor Belt System',
    area: 'Warehouse A',
    status: 'active',
    criticality: 'high',
    manufacturer: 'ConveyorCorp',
    serialNumber: 'CB2000X-001',
    installDate: null,
    warrantyExpiry: null,
    specifications: null,
    organizationId: 'org-1',
    warehouseId: 'warehouse-1',
    tsv: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    qrCode: 'qr-uas-001',
  },
  {
    id: 'hvac-205-id',
    assetTag: 'HVAC-205',
    model: 'HVAC-PRO-500',
    description: 'HVAC System - Main Floor',
    area: 'Main Floor',
    status: 'active',
    criticality: 'medium',
    manufacturer: 'ClimateControl Inc',
    serialNumber: 'HVAC500-205',
    installDate: null,
    warrantyExpiry: null,
    specifications: null,
    organizationId: 'org-1',
    warehouseId: 'warehouse-1',
    tsv: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'user-1',
    updatedBy: 'user-1',
    qrCode: 'qr-hvac-205',
  },
];

// Mock the fetch function
global.fetch = vi.fn();

const mockFetch = fetch as MockedFunction<typeof fetch>;

describe('Equipment Modal Data Consistency', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock the equipment list endpoint
    mockFetch.mockImplementation(url => {
      if (typeof url === 'string') {
        if (url.includes('/api/equipment') && !url.includes('/api/equipment/')) {
          // Equipment list endpoint
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEquipmentData),
          } as Response);
        }

        if (url.includes('/api/equipment/uas-001-id')) {
          // Individual equipment endpoint
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEquipmentData[0]),
          } as Response);
        }

        if (url.includes('/api/equipment/hvac-205-id')) {
          // Individual equipment endpoint
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEquipmentData[1]),
          } as Response);
        }
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  it('should display correct equipment details when clicking on UAS-001 card', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EquipmentPage />
      </QueryClientProvider>
    );

    // Wait for equipment cards to load
    await waitFor(() => {
      expect(screen.getByText('UAS-001')).toBeInTheDocument();
    });

    // Find and click the UAS-001 card
    const uasCard = screen.getByText('UAS-001').closest('[data-testid="equipment-card"]');
    expect(uasCard).toBeInTheDocument();

    if (uasCard) {
      fireEvent.click(uasCard);
    }

    // Wait for modal to open and display the correct equipment details
    await waitFor(() => {
      expect(screen.getByText('Equipment Details')).toBeInTheDocument();
      // Check that the modal shows the correct equipment
      expect(screen.getByText('UAS-001')).toBeInTheDocument();
      expect(screen.getByText('CB-2000X')).toBeInTheDocument();
      expect(screen.getByText('Conveyor Belt System')).toBeInTheDocument();
      expect(screen.getByText('Warehouse A')).toBeInTheDocument();
    });
  });

  it('should display correct equipment details when clicking on HVAC-205 card', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EquipmentPage />
      </QueryClientProvider>
    );

    // Wait for equipment cards to load
    await waitFor(() => {
      expect(screen.getByText('HVAC-205')).toBeInTheDocument();
    });

    // Find and click the HVAC-205 card
    const hvacCard = screen.getByText('HVAC-205').closest('[data-testid="equipment-card"]');
    expect(hvacCard).toBeInTheDocument();

    if (hvacCard) {
      fireEvent.click(hvacCard);
    }

    // Wait for modal to open and display the correct equipment details
    await waitFor(() => {
      expect(screen.getByText('Equipment Details')).toBeInTheDocument();
      // Check that the modal shows the correct equipment
      expect(screen.getByText('HVAC-205')).toBeInTheDocument();
      expect(screen.getByText('HVAC-PRO-500')).toBeInTheDocument();
      expect(screen.getByText('HVAC System - Main Floor')).toBeInTheDocument();
      expect(screen.getByText('Main Floor')).toBeInTheDocument();
    });
  });

  it('should handle rapid card clicking without data mismatch', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EquipmentPage />
      </QueryClientProvider>
    );

    // Wait for equipment cards to load
    await waitFor(() => {
      expect(screen.getByText('UAS-001')).toBeInTheDocument();
      expect(screen.getByText('HVAC-205')).toBeInTheDocument();
    });

    // Click UAS-001 first
    const uasCard = screen.getByText('UAS-001').closest('[data-testid="equipment-card"]');
    if (uasCard) {
      fireEvent.click(uasCard);
    }

    // Wait for UAS modal to appear
    await waitFor(() => {
      expect(screen.getByText('CB-2000X')).toBeInTheDocument();
    });

    // Close modal and immediately click HVAC-205
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Immediately click HVAC card
    const hvacCard = screen.getByText('HVAC-205').closest('[data-testid="equipment-card"]');
    if (hvacCard) {
      fireEvent.click(hvacCard);
    }

    // Ensure HVAC modal shows correct data, not UAS data
    await waitFor(() => {
      expect(screen.getByText('HVAC-PRO-500')).toBeInTheDocument();
      expect(screen.getByText('HVAC System - Main Floor')).toBeInTheDocument();
      // Ensure UAS data is NOT shown
      expect(screen.queryByText('CB-2000X')).not.toBeInTheDocument();
      expect(screen.queryByText('Conveyor Belt System')).not.toBeInTheDocument();
    });
  });
});
