import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useVendors, useVendorMetrics } from '../hooks/useVendors';
import { CreateVendorModal } from './CreateVendorModal';
import { VendorMetrics } from './VendorMetrics';
import { VendorFilters, VendorType } from '../types/vendor';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  BuildingIcon,
  AlertTriangleIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  StarIcon,
} from 'lucide-react';

const vendorTypeColors = {
  [VendorType.SUPPLIER]: 'bg-blue-100 text-blue-800',
  [VendorType.CONTRACTOR]: 'bg-green-100 text-green-800',
  [VendorType.SERVICE_PROVIDER]: 'bg-purple-100 text-purple-800',
  [VendorType.MANUFACTURER]: 'bg-orange-100 text-orange-800',
};

const vendorTypeLabels = {
  [VendorType.SUPPLIER]: 'Supplier',
  [VendorType.CONTRACTOR]: 'Contractor',
  [VendorType.SERVICE_PROVIDER]: 'Service Provider',
  [VendorType.MANUFACTURER]: 'Manufacturer',
};

export const VendorsList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<VendorFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;
  const { data, isLoading, error } = useVendors(filters, page, limit);
  const { data: metrics } = useVendorMetrics();

  const handleFilterChange = (
    key: keyof VendorFilters,
    value: VendorFilters[keyof VendorFilters]
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

  const typeOptions = [
    { value: '', label: 'All Types' },
    {
      value: VendorType.SUPPLIER,
      label: vendorTypeLabels[VendorType.SUPPLIER],
    },
    {
      value: VendorType.CONTRACTOR,
      label: vendorTypeLabels[VendorType.CONTRACTOR],
    },
    {
      value: VendorType.SERVICE_PROVIDER,
      label: vendorTypeLabels[VendorType.SERVICE_PROVIDER],
    },
    {
      value: VendorType.MANUFACTURER,
      label: vendorTypeLabels[VendorType.MANUFACTURER],
    },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' },
    { value: '1', label: '1+ Stars' },
  ];

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <div className='flex items-center gap-1'>
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            className={`h-4 w-4 ${
              index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className='text-sm text-secondary-600 ml-1'>({rating})</span>
      </div>
    );
  };

  if (error) {
    return (
      <div className='card'>
        <div className='card-body text-center py-12'>
          <AlertTriangleIcon className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
            Error Loading Vendors
          </h3>
          <p className='text-secondary-600 mb-4'>
            {error instanceof Error ? error.message : 'Failed to load vendors'}
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
            Vendors & Contractors
          </h1>
          <p className='text-secondary-600'>
            Manage vendor relationships and contractor services
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className='h-4 w-4 mr-2' />
          Add Vendor
        </Button>
      </div>

      {/* Metrics */}
      <VendorMetrics metrics={metrics || null} />

      {/* Search and Filters */}
      <Card>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400' />
                <Input
                  placeholder='Search vendors...'
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
              {Object.keys(filters).length > 0 && (
                <Button variant='secondary' onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className='mt-4 pt-4 border-t border-secondary-200'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <Select
                  value={filters.type || ''}
                  onChange={e =>
                    handleFilterChange(
                      'type',
                      (e.target.value as VendorType) || undefined
                    )
                  }
                  options={typeOptions}
                />
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
                  options={statusOptions}
                />
                <Select
                  value={filters.rating?.toString() || ''}
                  onChange={e =>
                    handleFilterChange(
                      'rating',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  options={ratingOptions}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Vendors List */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <div className='card-body text-center py-12'>
            <BuildingIcon className='h-12 w-12 text-secondary-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
              No Vendors Found
            </h3>
            <p className='text-secondary-600 mb-4'>
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first vendor.'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className='h-4 w-4 mr-2' />
              Add Vendor
            </Button>
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {data?.data?.map(vendor => (
            <Card key={vendor.id} className='hover:shadow-lg transition-shadow'>
              <div className='card-body'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <Link
                      to={`/vendors/${vendor.id}`}
                      className='text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors'
                    >
                      {vendor.name}
                    </Link>
                    {vendor.contact_person && (
                      <p className='text-sm text-secondary-500 mt-1'>
                        Contact: {vendor.contact_person}
                      </p>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                      className={vendorTypeColors[vendor.type as VendorType]}
                    >
                      {vendorTypeLabels[vendor.type as VendorType]}
                    </Badge>
                    {!vendor.is_active && (
                      <Badge variant='secondary'>Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  {vendor.rating && <div>{renderStars(vendor.rating)}</div>}

                  {vendor.email && (
                    <div className='flex items-center gap-2'>
                      <MailIcon className='h-4 w-4 text-secondary-400' />
                      <span className='text-sm text-secondary-600'>
                        {vendor.email}
                      </span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className='flex items-center gap-2'>
                      <PhoneIcon className='h-4 w-4 text-secondary-400' />
                      <span className='text-sm text-secondary-600'>
                        {vendor.phone}
                      </span>
                    </div>
                  )}

                  {vendor.website && (
                    <div className='flex items-center gap-2'>
                      <GlobeIcon className='h-4 w-4 text-secondary-400' />
                      <a
                        href={vendor.website}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-primary-600 hover:text-primary-700'
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}

                  {vendor.payment_terms && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>
                        Payment Terms
                      </span>
                      <span className='text-sm text-secondary-900'>
                        {vendor.payment_terms}
                      </span>
                    </div>
                  )}
                </div>

                <div className='mt-4 pt-4 border-t border-secondary-200'>
                  <Link
                    to={`/vendors/${vendor.id}`}
                    className='text-sm text-primary-600 hover:text-primary-700 font-medium'
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
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

      {/* Create Vendor Modal */}
      <CreateVendorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
