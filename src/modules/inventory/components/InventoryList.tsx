import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useParts, useInventoryMetrics } from '../hooks/useInventory';
import { CreatePartModal } from './CreatePartModal';
import { InventoryMetrics } from './InventoryMetrics';
import { InventoryService } from '../services/inventoryService';
import { PartFilters, StockStatus } from '../types/inventory';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  PackageIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  MapPinIcon,
} from 'lucide-react';

const stockStatusColors = {
  [StockStatus.IN_STOCK]: 'bg-green-100 text-green-800',
  [StockStatus.LOW_STOCK]: 'bg-yellow-100 text-yellow-800',
  [StockStatus.OUT_OF_STOCK]: 'bg-red-100 text-red-800',
  [StockStatus.OVER_STOCK]: 'bg-blue-100 text-blue-800',
};

export const InventoryList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<PartFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;
  const { data, isLoading, error } = useParts(filters, page, limit);
  const { data: metrics } = useInventoryMetrics();

  const handleFilterChange = (
    key: keyof PartFilters,
    value: PartFilters[keyof PartFilters]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPage(1);
  };

  const handleSearch = (search: string) => {
    handleFilterChange('search', search || undefined);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const isActiveOptions = [
    { value: '', label: 'All Parts' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const consumableOptions = [
    { value: '', label: 'All Types' },
    { value: 'true', label: 'Consumable' },
    { value: 'false', label: 'Non-Consumable' },
  ];

  if (error) {
    return (
      <div className='card'>
        <div className='card-body text-center py-12'>
          <AlertTriangleIcon className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
            Error Loading Inventory
          </h3>
          <p className='text-secondary-600 mb-4'>
            {error instanceof Error
              ? error.message
              : 'Failed to load inventory'}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-secondary-900'>
            Parts & Inventory
          </h1>
          <p className='text-secondary-600'>
            Manage your parts inventory and stock levels
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className='h-4 w-4 mr-2' />
          Add Part
        </Button>
      </div>

      {/* Metrics */}
      <InventoryMetrics metrics={metrics || null} />

      {/* Search and Filters */}
      <Card>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400' />
                <Input
                  placeholder='Search parts...'
                  value={filters.search || ''}
                  onChange={e => handleSearch(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='secondary'
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className='h-4 w-4 mr-2' />
                Filters
              </Button>
              <Button
                variant='secondary'
                onClick={() =>
                  handleFilterChange('lowStock', !filters.lowStock)
                }
                className={
                  filters.lowStock ? 'bg-yellow-100 text-yellow-800' : ''
                }
              >
                Low Stock
              </Button>
              {Object.keys(filters).length > 0 && (
                <Button variant='secondary' onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className='mt-4 pt-4 border-t border-secondary-200'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <Select
                  value={
                    filters.isActive !== undefined
                      ? filters.isActive.toString()
                      : ''
                  }
                  onChange={e =>
                    handleFilterChange(
                      'isActive',
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true'
                    )
                  }
                  options={isActiveOptions}
                />
                <Select
                  value={
                    filters.isConsumable !== undefined
                      ? filters.isConsumable.toString()
                      : ''
                  }
                  onChange={e =>
                    handleFilterChange(
                      'isConsumable',
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true'
                    )
                  }
                  options={consumableOptions}
                />
                <Input
                  placeholder='Filter by manufacturer'
                  value={filters.manufacturer || ''}
                  onChange={e =>
                    handleFilterChange(
                      'manufacturer',
                      e.target.value || undefined
                    )
                  }
                />
                <Input
                  placeholder='Filter by location'
                  value={filters.location || ''}
                  onChange={e =>
                    handleFilterChange('location', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Parts List */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <div className='card-body text-center py-12'>
            <PackageIcon className='h-12 w-12 text-secondary-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
              No Parts Found
            </h3>
            <p className='text-secondary-600 mb-4'>
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first part to inventory.'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className='h-4 w-4 mr-2' />
              Add Part
            </Button>
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {data?.data?.map(part => {
            const stockStatus = InventoryService.getStockStatus(part);
            const availableStock = part.stock_quantity - part.reserved_quantity;

            return (
              <Card key={part.id} className='hover:shadow-lg transition-shadow'>
                <div className='card-body'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <Link
                        to={`/inventory/parts/${part.id}`}
                        className='text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors'
                      >
                        {part.name}
                      </Link>
                      <p className='text-sm text-secondary-500 mt-1'>
                        Part #: {part.part_number}
                      </p>
                    </div>
                    <PackageIcon className='h-5 w-5 text-secondary-400' />
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>
                        Stock Status
                      </span>
                      <Badge className={stockStatusColors[stockStatus]}>
                        {stockStatus.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>
                        Available
                      </span>
                      <span className='text-sm font-medium text-secondary-900'>
                        {availableStock} {part.unit_of_measure}
                      </span>
                    </div>

                    {part.reserved_quantity > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-secondary-600'>
                          Reserved
                        </span>
                        <span className='text-sm text-orange-600'>
                          {part.reserved_quantity} {part.unit_of_measure}
                        </span>
                      </div>
                    )}

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>
                        Reorder Point
                      </span>
                      <span className='text-sm text-secondary-900'>
                        {part.reorder_point} {part.unit_of_measure}
                      </span>
                    </div>

                    {part.manufacturer && (
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-secondary-600'>
                          Manufacturer
                        </span>
                        <span className='text-sm text-secondary-900'>
                          {part.manufacturer}
                        </span>
                      </div>
                    )}

                    {part.location && (
                      <div className='flex items-center gap-2'>
                        <MapPinIcon className='h-4 w-4 text-secondary-400' />
                        <span className='text-sm text-secondary-600'>
                          {part.location}
                        </span>
                      </div>
                    )}

                    <div className='flex items-center gap-2'>
                      <DollarSignIcon className='h-4 w-4 text-secondary-400' />
                      <span className='text-sm text-secondary-600'>
                        ${part.unit_cost.toFixed(2)} per {part.unit_of_measure}
                      </span>
                    </div>
                  </div>

                  <div className='mt-4 pt-4 border-t border-secondary-200'>
                    <div className='flex items-center justify-between'>
                      <Link
                        to={`/inventory/parts/${part.id}`}
                        className='text-sm text-primary-600 hover:text-primary-700 font-medium'
                      >
                        View Details →
                      </Link>
                      {part.is_consumable && (
                        <Badge variant='secondary'>Consumable</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Create Part Modal */}
      <CreatePartModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
