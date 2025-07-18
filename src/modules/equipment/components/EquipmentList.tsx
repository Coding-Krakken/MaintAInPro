import React, { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { LabeledSelect } from '../../../components/ui/LabeledSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import {
  useEquipment,
  useManufacturers,
  useLocations,
} from '../hooks/useEquipment';
import { CreateEquipmentModal } from './CreateEquipmentModal';
import {
  EquipmentStatus,
  EquipmentCondition,
  EquipmentFilters,
} from '../types/equipment';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  DollarSignIcon,
  MapPinIcon,
  SettingsIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from 'lucide-react';

const statusColors = {
  [EquipmentStatus.OPERATIONAL]: 'bg-green-100 text-green-800',
  [EquipmentStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
  [EquipmentStatus.OUT_OF_SERVICE]: 'bg-red-100 text-red-800',
  [EquipmentStatus.RETIRED]: 'bg-gray-100 text-gray-800',
};

const conditionColors = {
  [EquipmentCondition.EXCELLENT]: 'bg-green-100 text-green-800',
  [EquipmentCondition.GOOD]: 'bg-blue-100 text-blue-800',
  [EquipmentCondition.FAIR]: 'bg-yellow-100 text-yellow-800',
  [EquipmentCondition.POOR]: 'bg-orange-100 text-orange-800',
  [EquipmentCondition.CRITICAL]: 'bg-red-100 text-red-800',
};

const conditionIcons = {
  [EquipmentCondition.EXCELLENT]: CheckCircleIcon,
  [EquipmentCondition.GOOD]: CheckCircleIcon,
  [EquipmentCondition.FAIR]: SettingsIcon,
  [EquipmentCondition.POOR]: AlertTriangleIcon,
  [EquipmentCondition.CRITICAL]: AlertTriangleIcon,
};

export const EquipmentList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<EquipmentFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;
  const { data, isLoading, error } = useEquipment(filters, page, limit);
  const { data: manufacturers } = useManufacturers();
  const { data: locations } = useLocations();

  const handleFilterChange = (
    key: keyof EquipmentFilters,
    value: EquipmentFilters[keyof EquipmentFilters]
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

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: EquipmentStatus.OPERATIONAL, label: 'Operational' },
    { value: EquipmentStatus.MAINTENANCE, label: 'Under Maintenance' },
    { value: EquipmentStatus.OUT_OF_SERVICE, label: 'Out of Service' },
    { value: EquipmentStatus.RETIRED, label: 'Retired' },
  ];

  const conditionOptions = [
    { value: '', label: 'All Conditions' },
    { value: EquipmentCondition.EXCELLENT, label: 'Excellent' },
    { value: EquipmentCondition.GOOD, label: 'Good' },
    { value: EquipmentCondition.FAIR, label: 'Fair' },
    { value: EquipmentCondition.POOR, label: 'Poor' },
    { value: EquipmentCondition.CRITICAL, label: 'Critical' },
  ];

  const manufacturerOptions = [
    { value: '', label: 'All Manufacturers' },
    ...(manufacturers || []).map(manufacturer => ({
      value: manufacturer,
      label: manufacturer,
    })),
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...(locations || []).map(location => ({
      value: location,
      label: location,
    })),
  ];

  if (error) {
    return (
      <div className='card'>
        <div className='card-body text-center py-12'>
          <AlertTriangleIcon className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
            Error Loading Equipment
          </h3>
          <p className='text-secondary-600 mb-4'>
            {error instanceof Error
              ? error.message
              : 'Failed to load equipment'}
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
            Equipment & Assets
          </h1>
          <p className='text-secondary-600'>
            Manage your equipment and asset inventory
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className='h-4 w-4 mr-2' />
          Add Equipment
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className='card-body'>
          <div className='flex flex-col lg:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400' />
                <Input
                  placeholder='Search equipment...'
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
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <LabeledSelect
                  value={filters.status || ''}
                  onValueChange={value =>
                    handleFilterChange('status', value as EquipmentStatus)
                  }
                  options={statusOptions}
                />
                <LabeledSelect
                  value={filters.condition || ''}
                  onValueChange={value =>
                    handleFilterChange('condition', value as EquipmentCondition)
                  }
                  options={conditionOptions}
                />
                <LabeledSelect
                  value={filters.manufacturer || ''}
                  onValueChange={value =>
                    handleFilterChange('manufacturer', value)
                  }
                  options={manufacturerOptions}
                />
                <LabeledSelect
                  value={filters.location || ''}
                  onValueChange={value => handleFilterChange('location', value)}
                  options={locationOptions}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Equipment List */}
      {isLoading ? (
        <div className='flex justify-center py-12'>
          <LoadingSpinner size='lg' />
        </div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <div className='card-body text-center py-12'>
            <SettingsIcon className='h-12 w-12 text-secondary-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-secondary-900 mb-2'>
              No Equipment Found
            </h3>
            <p className='text-secondary-600 mb-4'>
              {Object.keys(filters).length > 0
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first piece of equipment.'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className='h-4 w-4 mr-2' />
              Add Equipment
            </Button>
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {data?.data?.map(equipment => {
            const ConditionIcon =
              conditionIcons[equipment.condition as EquipmentCondition];

            return (
              <Card
                key={equipment.id}
                className='hover:shadow-lg transition-shadow'
              >
                <div className='card-body'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <Link
                        to={`/equipment/${equipment.id}`}
                        className='text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors'
                      >
                        {equipment.name}
                      </Link>
                      {equipment.asset_tag && (
                        <p className='text-sm text-secondary-500 mt-1'>
                          Asset: {equipment.asset_tag}
                        </p>
                      )}
                    </div>
                    <ConditionIcon className='h-5 w-5 text-secondary-400' />
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>Status</span>
                      <Badge
                        className={
                          statusColors[equipment.status as EquipmentStatus]
                        }
                      >
                        {equipment.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-secondary-600'>
                        Condition
                      </span>
                      <Badge
                        className={
                          conditionColors[
                            equipment.condition as EquipmentCondition
                          ]
                        }
                      >
                        {equipment.condition}
                      </Badge>
                    </div>

                    {equipment.manufacturer && (
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-secondary-600'>
                          Manufacturer
                        </span>
                        <span className='text-sm text-secondary-900'>
                          {equipment.manufacturer}
                        </span>
                      </div>
                    )}

                    {equipment.location && (
                      <div className='flex items-center gap-2'>
                        <MapPinIcon className='h-4 w-4 text-secondary-400' />
                        <span className='text-sm text-secondary-600'>
                          {equipment.location}
                        </span>
                      </div>
                    )}

                    {equipment.purchase_date && (
                      <div className='flex items-center gap-2'>
                        <CalendarIcon className='h-4 w-4 text-secondary-400' />
                        <span className='text-sm text-secondary-600'>
                          Purchased{' '}
                          {format(
                            new Date(equipment.purchase_date),
                            'MMM yyyy'
                          )}
                        </span>
                      </div>
                    )}

                    {equipment.purchase_cost && (
                      <div className='flex items-center gap-2'>
                        <DollarSignIcon className='h-4 w-4 text-secondary-400' />
                        <span className='text-sm text-secondary-600'>
                          ${equipment.purchase_cost.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className='mt-4 pt-4 border-t border-secondary-200'>
                    <Link
                      to={`/equipment/${equipment.id}`}
                      className='text-sm text-primary-600 hover:text-primary-700 font-medium'
                    >
                      View Details →
                    </Link>
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

      {/* Create Equipment Modal */}
      <CreateEquipmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
