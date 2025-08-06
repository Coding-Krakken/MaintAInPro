import React, { useState } from 'react';

import { format } from 'date-fns';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { CreateWorkOrderModal } from './CreateWorkOrderModal';
import {
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
  WorkOrderFilters,
} from '../types/workOrder';
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  WrenchIcon,
  AlertTriangleIcon,
} from 'lucide-react';

const priorityColors = {
  [WorkOrderPriority.LOW]: 'bg-green-100 text-green-800',
  [WorkOrderPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [WorkOrderPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [WorkOrderPriority.CRITICAL]: 'bg-red-100 text-red-800',
  [WorkOrderPriority.EMERGENCY]: 'bg-red-200 text-red-900',
};

const statusColors = {
  [WorkOrderStatus.OPEN]: 'bg-blue-100 text-blue-800',
  [WorkOrderStatus.ASSIGNED]: 'bg-purple-100 text-purple-800',
  [WorkOrderStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [WorkOrderStatus.ON_HOLD]: 'bg-gray-100 text-gray-800',
  [WorkOrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [WorkOrderStatus.VERIFIED]: 'bg-green-200 text-green-900',
  [WorkOrderStatus.CLOSED]: 'bg-gray-200 text-gray-900',
  [WorkOrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

export const WorkOrderList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<WorkOrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const limit = 20;
  const { data, isLoading, error } = useWorkOrders(filters, page, limit);

  const handleFilterChange = (
    key: keyof WorkOrderFilters,
    value: WorkOrderFilters[keyof WorkOrderFilters]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // Reset to first page when filters change
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
    { value: WorkOrderStatus.OPEN, label: 'Open' },
    { value: WorkOrderStatus.ASSIGNED, label: 'Assigned' },
    { value: WorkOrderStatus.IN_PROGRESS, label: 'In Progress' },
    { value: WorkOrderStatus.ON_HOLD, label: 'On Hold' },
    { value: WorkOrderStatus.COMPLETED, label: 'Completed' },
    { value: WorkOrderStatus.VERIFIED, label: 'Verified' },
    { value: WorkOrderStatus.CLOSED, label: 'Closed' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: WorkOrderPriority.LOW, label: 'Low' },
    { value: WorkOrderPriority.MEDIUM, label: 'Medium' },
    { value: WorkOrderPriority.HIGH, label: 'High' },
    { value: WorkOrderPriority.CRITICAL, label: 'Critical' },
    { value: WorkOrderPriority.EMERGENCY, label: 'Emergency' },
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: WorkOrderType.CORRECTIVE, label: 'Corrective' },
    { value: WorkOrderType.PREVENTIVE, label: 'Preventive' },
    { value: WorkOrderType.EMERGENCY, label: 'Emergency' },
    { value: WorkOrderType.INSPECTION, label: 'Inspection' },
    { value: WorkOrderType.SAFETY, label: 'Safety' },
    { value: WorkOrderType.IMPROVEMENT, label: 'Improvement' },
  ];

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600'>
          Error loading work orders: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Work Orders</h1>
            <p className='text-gray-600'>
              Manage and track maintenance work orders
            </p>
          </div>
          <Button
            className='btn btn-primary flex items-center'
            onClick={() => {
              console.log('[DEBUG] Create Work Order button clicked');
              setShowCreateModal(true);
            }}
          >
            <PlusIcon className='h-4 w-4 mr-2' />
            Create Work Order
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className='p-4'>
          <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4'>
            <div className='flex-1'>
              <div className='relative'>
                <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search work orders...'
                  value={filters.search || ''}
                  onChange={e => handleSearch(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Button
              variant='outline'
              onClick={() => setShowFilters(!showFilters)}
              className='sm:w-auto'
            >
              <FilterIcon className='h-4 w-4 mr-2' />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div>
                <label
                  htmlFor='status-filter'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Status
                </label>
                <Select
                  id='status-filter'
                  value={filters.status?.[0] || ''}
                  onChange={e =>
                    handleFilterChange(
                      'status',
                      e.target.value
                        ? [e.target.value as WorkOrderStatus]
                        : undefined
                    )
                  }
                  options={statusOptions}
                />
              </div>
              <div>
                <label
                  htmlFor='priority-filter'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Priority
                </label>
                <Select
                  id='priority-filter'
                  value={filters.priority?.[0] || ''}
                  onChange={e =>
                    handleFilterChange(
                      'priority',
                      e.target.value
                        ? [e.target.value as WorkOrderPriority]
                        : undefined
                    )
                  }
                  options={priorityOptions}
                />
              </div>
              <div>
                <label
                  htmlFor='type-filter'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Type
                </label>
                <Select
                  id='type-filter'
                  value={filters.type?.[0] || ''}
                  onChange={e =>
                    handleFilterChange(
                      'type',
                      e.target.value
                        ? [e.target.value as WorkOrderType]
                        : undefined
                    )
                  }
                  options={typeOptions}
                />
              </div>
              <div className='flex items-end'>
                <Button
                  variant='outline'
                  onClick={clearFilters}
                  className='w-full'
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Work Orders List */}
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <LoadingSpinner size='lg' />
          </div>
        ) : !data || data.data.length === 0 ? (
          <Card className='p-8 text-center'>
            <WrenchIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              No work orders found
            </h3>
            <p className='text-gray-600 mb-4'>
              Get started by creating your first work order.
            </p>
            {/* Removed modal button, use page navigation for create */}
          </Card>
        ) : (
          <>
            {/* Work Orders Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
              {data.data.map(workOrder => (
                <Card
                  key={workOrder.id}
                  className='p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-sm font-medium text-gray-500'>
                        {workOrder.work_order_number}
                      </span>
                      {workOrder.is_overdue && (
                        <AlertTriangleIcon className='h-4 w-4 text-red-500' />
                      )}
                    </div>
                    <Badge className={priorityColors[workOrder.priority]}>
                      {workOrder.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className='font-semibold text-gray-900 mb-2 line-clamp-2'>
                    {workOrder.title}
                  </h3>

                  <div className='flex items-center justify-between mb-3'>
                    <Badge className={statusColors[workOrder.status]}>
                      {workOrder.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className='text-xs text-gray-500'>
                      {workOrder.type.toUpperCase()}
                    </span>
                  </div>

                  <div className='space-y-2 mb-4'>
                    {workOrder.equipment_name && (
                      <div className='flex items-center text-sm text-gray-600'>
                        <WrenchIcon className='h-4 w-4 mr-2' />
                        {workOrder.equipment_name}
                      </div>
                    )}
                    {workOrder.assigned_to_name && (
                      <div className='flex items-center text-sm text-gray-600'>
                        <UserIcon className='h-4 w-4 mr-2' />
                        {workOrder.assigned_to_name}
                      </div>
                    )}
                    {workOrder.scheduled_start && (
                      <div className='flex items-center text-sm text-gray-600'>
                        <ClockIcon className='h-4 w-4 mr-2' />
                        {format(
                          new Date(workOrder.scheduled_start),
                          'MMM d, yyyy h:mm a'
                        )}
                      </div>
                    )}
                  </div>

                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <div className='flex items-center'>
                      <CalendarIcon className='h-3 w-3 mr-1' />
                      {format(new Date(workOrder.created_at), 'MMM d, yyyy')}
                    </div>
                    <Button
                      className='btn btn-xs btn-secondary'
                      onClick={() =>
                        (window.location.href = `/work-orders/${workOrder.id}`)
                      }
                    >
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > limit && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(data.total / limit)}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
      <CreateWorkOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
};
