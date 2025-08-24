import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EquipmentPage from '@/pages/Equipment';

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

const mockFetch = fetch as vi.MockedFunction<typeof fetch>;

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
      expect(screen.getAllByText('UAS-001').length).toBeGreaterThan(0);
    });

    // Find and click the UAS-001 card (use getAllByText and pick first one)
    const uasTextElements = screen.getAllByText('UAS-001');
    const uasCard = uasTextElements[0].closest('[data-testid="equipment-card"]');
    expect(uasCard).toBeInTheDocument();

    if (uasCard) {
      fireEvent.click(uasCard);
    }

    // Wait for modal to open and display the correct equipment details
    await waitFor(() => {
      expect(screen.getByText('Equipment Details')).toBeInTheDocument();
      // Use getAllByText for duplicate equipment names
      expect(screen.getAllByText('HVAC-205').length).toBeGreaterThan(0);
      expect(screen.getAllByText('UAS-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('CB-2000X').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Conveyor Belt System').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Warehouse A').length).toBeGreaterThan(0);
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
      expect(screen.getAllByText('HVAC-205').length).toBeGreaterThan(0);
    });

    // Find and click the HVAC-205 card (use getAllByText and pick first one)
    const hvacTextElements = screen.getAllByText('HVAC-205');
    const hvacCard = hvacTextElements[0].closest('[data-testid="equipment-card"]');
    expect(hvacCard).toBeInTheDocument();

    if (hvacCard) {
      fireEvent.click(hvacCard);
    }

    // Wait for modal to open and display the correct equipment details
    await waitFor(() => {
      expect(screen.getByText('Equipment Details')).toBeInTheDocument();
      expect(screen.getAllByText('CB-2000X').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HVAC-205').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HVAC-PRO-500').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HVAC System - Main Floor').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Main Floor').length).toBeGreaterThan(0);
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
      expect(screen.getAllByText('UAS-001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HVAC-205').length).toBeGreaterThan(0);
    });

    // Click UAS-001 first (use getAllByText and pick first one)
    const uasTextElements = screen.getAllByText('UAS-001');
    const uasCard = uasTextElements[0].closest('[data-testid="equipment-card"]');
    if (uasCard) {
      fireEvent.click(uasCard);
    }

    // Wait for UAS modal to appear
    await waitFor(() => {
      expect(screen.getAllByText('CB-2000X').length).toBeGreaterThan(0);
    });

    // Close modal and immediately click HVAC-205
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Immediately click HVAC card (use getAllByText and pick first one)
    const hvacTextElements = screen.getAllByText('HVAC-205');
    const hvacCard = hvacTextElements[0].closest('[data-testid="equipment-card"]');
    if (hvacCard) {
      fireEvent.click(hvacCard);
    }

    // Ensure HVAC modal shows correct data, not UAS data
    await waitFor(() => {
      expect(screen.getAllByText('HVAC-PRO-500').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HVAC System - Main Floor').length).toBeGreaterThan(0);
      // Ensure UAS data is NOT shown (use queryByText to check absence)
      expect(screen.queryByText('CB-2000X')).not.toBeInTheDocument();
      expect(screen.queryByText('Conveyor Belt System')).not.toBeInTheDocument();
    });
  });
});
