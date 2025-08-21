import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssetCard from '@/components/AssetCard';
import { mockEquipment } from '../../../utils/test-mocks';

describe('AssetCard Component', () => {
  const defaultProps = {
    equipment: mockEquipment,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders equipment information correctly', () => {
      render(<AssetCard {...defaultProps} />);

      expect(screen.getByTestId('asset-card')).toBeInTheDocument();
      expect(screen.getByTestId('asset-tag')).toHaveTextContent('UAS-001');
      expect(screen.getByTestId('asset-description')).toHaveTextContent(
        'Test Equipment Description'
      );
      expect(screen.getByTestId('asset-model')).toHaveTextContent('TEST-001');
    });

    it('displays status badge with correct style', () => {
      render(<AssetCard {...defaultProps} />);

      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent('active');
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('displays criticality badge with correct style', () => {
      render(<AssetCard {...defaultProps} />);

      const criticalityBadge = screen.getByTestId('criticality-badge');
      expect(criticalityBadge).toHaveTextContent('medium');
      expect(criticalityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays asset icon', () => {
      render(<AssetCard {...defaultProps} />);

      expect(screen.getByTestId('asset-icon')).toBeInTheDocument();
    });

    it('displays optional location when provided', () => {
      render(<AssetCard {...defaultProps} />);

      expect(screen.getByTestId('asset-location')).toHaveTextContent('Plant 1');
    });

    it('displays optional manufacturer when provided', () => {
      render(<AssetCard {...defaultProps} />);

      expect(screen.getByTestId('asset-manufacturer')).toHaveTextContent('Test Manufacturer');
    });
  });

  describe('Status Badge Styles', () => {
    it('displays active status with green styling', () => {
      const equipment = { ...mockEquipment, status: 'active' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('displays inactive status with gray styling', () => {
      const equipment = { ...mockEquipment, status: 'inactive' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('displays maintenance status with yellow styling', () => {
      const equipment = { ...mockEquipment, status: 'maintenance' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays retired status with red styling', () => {
      const equipment = { ...mockEquipment, status: 'retired' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Criticality Badge Styles', () => {
    it('displays low criticality with green styling', () => {
      const equipment = { ...mockEquipment, criticality: 'low' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('criticality-badge');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('displays medium criticality with yellow styling', () => {
      const equipment = { ...mockEquipment, criticality: 'medium' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('criticality-badge');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('displays high criticality with orange styling', () => {
      const equipment = { ...mockEquipment, criticality: 'high' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('criticality-badge');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('displays critical criticality with red styling', () => {
      const equipment = { ...mockEquipment, criticality: 'critical' as const };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('criticality-badge');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });
  });

  describe('Event Handling', () => {
    it('calls onClick handler when card is clicked', () => {
      const mockOnClick = vi.fn();
      render(<AssetCard {...defaultProps} onClick={mockOnClick} />);

      fireEvent.click(screen.getByTestId('asset-card'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw error when onClick is not provided', () => {
      expect(() => {
        render(<AssetCard {...defaultProps} />);
        fireEvent.click(screen.getByTestId('asset-card'));
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Missing Data', () => {
    it('handles missing description gracefully', () => {
      const equipment = { ...mockEquipment, description: null };
      render(<AssetCard equipment={equipment} />);

      expect(screen.getByTestId('asset-description')).toHaveTextContent('No description');
    });

    it('handles empty description gracefully', () => {
      const equipment = { ...mockEquipment, description: '' };
      render(<AssetCard equipment={equipment} />);

      expect(screen.getByTestId('asset-description')).toHaveTextContent('No description');
    });

    it('does not display location when not provided', () => {
      const equipment = { ...mockEquipment, area: null };
      render(<AssetCard equipment={equipment} />);

      expect(screen.queryByTestId('asset-location')).not.toBeInTheDocument();
    });

    it('does not display manufacturer when not provided', () => {
      const equipment = { ...mockEquipment, manufacturer: null };
      render(<AssetCard equipment={equipment} />);

      expect(screen.queryByTestId('asset-manufacturer')).not.toBeInTheDocument();
    });

    it('handles unknown status with default styling', () => {
      const equipment = { ...mockEquipment, status: 'unknown' as any };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('handles unknown criticality with default styling', () => {
      const equipment = { ...mockEquipment, criticality: 'unknown' as any };
      render(<AssetCard equipment={equipment} />);

      const badge = screen.getByTestId('criticality-badge');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Accessibility', () => {
    it('has proper structure for screen readers', () => {
      render(<AssetCard {...defaultProps} />);

      const card = screen.getByTestId('asset-card');
      expect(card).toHaveAttribute('data-testid', 'asset-card');

      // Card should be clickable
      expect(card).toHaveClass('cursor-pointer');
    });

    it('provides meaningful content structure', () => {
      render(<AssetCard {...defaultProps} />);

      // Check that important elements have test IDs for accessibility testing
      expect(screen.getByTestId('asset-tag')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByTestId('criticality-badge')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('has hover effects applied', () => {
      render(<AssetCard {...defaultProps} />);

      const card = screen.getByTestId('asset-card');
      expect(card).toHaveClass('hover:shadow-md', 'transition-shadow');
    });

    it('maintains consistent styling across different equipment types', () => {
      const differentEquipment = {
        ...mockEquipment,
        assetTag: 'UAS-999',
        model: 'DIFFERENT-MODEL',
        status: 'maintenance' as const,
        criticality: 'critical' as const,
      };

      render(<AssetCard equipment={differentEquipment} />);

      expect(screen.getByTestId('asset-card')).toHaveClass('cursor-pointer');
      expect(screen.getByTestId('status-badge')).toHaveClass('bg-yellow-100');
      expect(screen.getByTestId('criticality-badge')).toHaveClass('bg-red-100');
    });
  });
});
