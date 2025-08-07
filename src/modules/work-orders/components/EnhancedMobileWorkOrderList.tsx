// Enhanced mobile work order list with offline capabilities
import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useSwipeable } from 'react-swipeable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { OfflineStatusIndicator } from '../../../components/offline/OfflineStatusIndicator';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useOffline, useOfflineWorkOrders } from '../../../hooks/useOffline';
import { CreateWorkOrderModal } from './CreateWorkOrderModal';
import { QRCodeScanner } from './QRCodeScanner';
import {
  WorkOrderListItem,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderFilters,
} from '../types/workOrder';
import { QRCodeResult } from '../services/qrCodeService';
import {
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  QrCodeIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  WrenchIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  WifiOffIcon,
} from 'lucide-react';
import { convertWorkOrderFromOffline } from '../../../lib/offline/database';

// Priority configuration with colors and icons
const priorityConfig = {
  [WorkOrderPriority.LOW]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    gradient: 'from-green-50 to-green-100',
  },
  [WorkOrderPriority.MEDIUM]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ClockIcon,
    gradient: 'from-yellow-50 to-yellow-100',
  },
  [WorkOrderPriority.HIGH]: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertTriangleIcon,
    gradient: 'from-orange-50 to-orange-100',
  },
  [WorkOrderPriority.CRITICAL]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangleIcon,
    gradient: 'from-red-50 to-red-100',
  },
  [WorkOrderPriority.EMERGENCY]: {
    color: 'bg-red-200 text-red-900 border-red-300',
    icon: AlertTriangleIcon,
    gradient: 'from-red-100 to-red-200',
  },
};

// Status configuration
const statusConfig = {
  [WorkOrderStatus.OPEN]: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: PlayCircleIcon,
  },
  [WorkOrderStatus.ASSIGNED]: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: UserIcon,
  },
  [WorkOrderStatus.IN_PROGRESS]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: RefreshCwIcon,
  },
  [WorkOrderStatus.ON_HOLD]: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: PauseCircleIcon,
  },
  [WorkOrderStatus.COMPLETED]: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
  },
  [WorkOrderStatus.VERIFIED]: {
    color: 'bg-green-200 text-green-900 border-green-300',
    icon: CheckCircleIcon,
  },
  [WorkOrderStatus.CLOSED]: {
    color: 'bg-gray-200 text-gray-900 border-gray-300',
    icon: XCircleIcon,
  },
  [WorkOrderStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon,
  },
};

interface EnhancedMobileWorkOrderCardProps {
  workOrder: WorkOrderListItem;
  onTap: (workOrder: WorkOrderListItem) => void;
  onSwipeAction: (workOrder: WorkOrderListItem, action: string) => void;
  isOffline?: boolean;
}

const EnhancedMobileWorkOrderCard: React.FC<
  EnhancedMobileWorkOrderCardProps
> = ({ workOrder, onTap, onSwipeAction, isOffline = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const priorityInfo = priorityConfig[workOrder.priority];
  const statusInfo = statusConfig[workOrder.status];
  const PriorityIcon = priorityInfo.icon;
  const StatusIcon = statusInfo.icon;

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onSwipeAction(workOrder, 'complete'),
    onSwipedRight: () => onSwipeAction(workOrder, 'assign'),
    trackMouse: false,
    trackTouch: true,
    delta: 10,
    preventScrollOnSwipe: false,
    rotationAngle: 0,
  });

  const handleCardTap = useCallback(() => {
    setIsExpanded(!isExpanded);
    onTap(workOrder);
  }, [isExpanded, onTap, workOrder]);

  return (
    <div
      {...swipeHandlers}
      role='button'
      tabIndex={0}
      aria-label={`Work order ${workOrder.work_order_number}: ${workOrder.title}`}
      className={`
        relative overflow-hidden rounded-lg border shadow-sm transition-all duration-200
        bg-gradient-to-r ${priorityInfo.gradient}
        active:scale-[0.98] active:shadow-md cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isExpanded ? 'shadow-lg scale-[1.02]' : 'hover:shadow-md'}
      `}
      onClick={handleCardTap}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardTap();
        }
      }}
    >
      {/* Swipe indicators */}
      <div className='absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 swipe-indicator-left' />
      <div className='absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-green-400 to-green-600 opacity-0 swipe-indicator-right' />

      {/* Offline indicator */}
      {isOffline && (
        <div className='absolute top-2 right-2'>
          <WifiOffIcon className='h-4 w-4 text-orange-500' />
        </div>
      )}

      <div className='p-4'>
        {/* Header Row */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <Badge
              className={`${priorityInfo.color} border flex items-center gap-1 text-xs font-medium px-2 py-1`}
            >
              <PriorityIcon className='h-3 w-3' />
              {workOrder.priority}
            </Badge>
            <Badge
              className={`${statusInfo.color} border flex items-center gap-1 text-xs font-medium px-2 py-1`}
            >
              <StatusIcon className='h-3 w-3' />
              {workOrder.status}
            </Badge>
          </div>
          <ChevronRightIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {/* Work Order Info */}
        <div className='space-y-2'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm font-semibold text-gray-900 truncate'>
                WO #{workOrder.work_order_number}
              </h3>
              <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                {workOrder.title}
              </p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <div className='flex items-center space-x-3'>
              {workOrder.assigned_to_name && (
                <div className='flex items-center gap-1'>
                  <UserIcon className='h-3 w-3' />
                  <span className='truncate max-w-20'>
                    {workOrder.assigned_to_name}
                  </span>
                </div>
              )}
              {workOrder.equipment_name && (
                <div className='flex items-center gap-1'>
                  <WrenchIcon className='h-3 w-3' />
                  <span className='truncate max-w-20'>
                    {workOrder.equipment_name}
                  </span>
                </div>
              )}
            </div>
            <div className='flex items-center gap-1'>
              <ClockIcon className='h-3 w-3' />
              <span>{format(new Date(workOrder.created_at), 'MMM d')}</span>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className='mt-3 pt-3 border-t border-gray-200 space-y-2 animate-in slide-in-from-top-2 duration-200'>
              {workOrder.scheduled_start && (
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-600'>Scheduled:</span>
                  <span className='font-medium'>
                    {format(new Date(workOrder.scheduled_start), 'MMM d, yyyy')}
                  </span>
                </div>
              )}

              {workOrder.is_overdue && (
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-red-600'>Status:</span>
                  <span className='font-medium text-red-600'>Overdue</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className='flex gap-2 mt-3'>
                <Button
                  size='sm'
                  variant='outline'
                  className='flex-1 text-xs'
                  onClick={e => {
                    e.stopPropagation();
                    onSwipeAction(workOrder, 'view');
                  }}
                >
                  View Details
                </Button>
                {workOrder.status === WorkOrderStatus.OPEN && (
                  <Button
                    size='sm'
                    className='flex-1 text-xs'
                    onClick={e => {
                      e.stopPropagation();
                      onSwipeAction(workOrder, 'start');
                    }}
                  >
                    Start Work
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EnhancedMobileWorkOrderList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters] = useState<WorkOrderFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Online work orders
  const { data, isLoading, error, refetch } = useWorkOrders(
    {
      ...filters,
      ...(searchQuery && { search: searchQuery }),
    },
    page,
    20
  );

  // Offline functionality
  const [offlineStatus] = useOffline();
  const {
    getAllWorkOrders: getOfflineWorkOrders,
    searchWorkOrders: searchOfflineWorkOrders,
  } = useOfflineWorkOrders();

  const [offlineWorkOrders, setOfflineWorkOrders] = useState<
    WorkOrderListItem[]
  >([]);
  const [loadingOffline, setLoadingOffline] = useState(false);

  // Load offline work orders when offline
  useEffect(() => {
    const loadOfflineData = async () => {
      if (!offlineStatus.isOnline && offlineStatus.isInitialized) {
        setLoadingOffline(true);
        try {
          const offlineWOs = searchQuery
            ? await searchOfflineWorkOrders(searchQuery)
            : await getOfflineWorkOrders();

          // Convert offline work orders to list items
          const convertedWOs: WorkOrderListItem[] = offlineWOs.map(
            offlineWO => {
              const converted = convertWorkOrderFromOffline(offlineWO);
              return {
                id: converted.id,
                work_order_number: converted.work_order_number,
                title: converted.title,
                priority: converted.priority,
                status: converted.status,
                type: converted.type,
                assigned_to_name: '', // This would need to be joined from users table
                equipment_name: '', // This would need to be joined from equipment table
                created_at: converted.created_at,
                scheduled_start: converted.scheduled_start,
                is_overdue: converted.scheduled_start
                  ? new Date(converted.scheduled_start) < new Date()
                  : false,
              } as WorkOrderListItem;
            }
          );

          setOfflineWorkOrders(convertedWOs);
        } catch (err) {
          console.error('Failed to load offline work orders:', err);
        } finally {
          setLoadingOffline(false);
        }
      }
    };

    loadOfflineData();
  }, [
    offlineStatus.isOnline,
    offlineStatus.isInitialized,
    searchQuery,
    getOfflineWorkOrders,
    searchOfflineWorkOrders,
  ]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (offlineStatus.isOnline) {
        await refetch();
      } else {
        // Refresh offline data
        const offlineWOs = searchQuery
          ? await searchOfflineWorkOrders(searchQuery)
          : await getOfflineWorkOrders();

        const convertedWOs: WorkOrderListItem[] = offlineWOs.map(offlineWO => {
          const converted = convertWorkOrderFromOffline(offlineWO);
          return {
            id: converted.id,
            work_order_number: converted.work_order_number,
            title: converted.title,
            priority: converted.priority,
            status: converted.status,
            type: converted.type,
            assigned_to_name: '', // This would need to be joined from users table
            equipment_name: '', // This would need to be joined from equipment table
            created_at: converted.created_at,
            scheduled_start: converted.scheduled_start,
            is_overdue: converted.scheduled_start
              ? new Date(converted.scheduled_start) < new Date()
              : false,
          } as WorkOrderListItem;
        });

        setOfflineWorkOrders(convertedWOs);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    offlineStatus.isOnline,
    refetch,
    searchQuery,
    searchOfflineWorkOrders,
    getOfflineWorkOrders,
  ]);

  const handleWorkOrderTap = useCallback((workOrder: WorkOrderListItem) => {
    // Handle work order tap - could navigate to detail view
    console.log('Work order tapped:', workOrder);
  }, []);

  const handleSwipeAction = useCallback(
    (workOrder: WorkOrderListItem, action: string) => {
      console.log('Swipe action:', action, 'on work order:', workOrder);
      // Implement swipe actions
      switch (action) {
        case 'complete':
          // Mark as complete
          break;
        case 'assign':
          // Assign to user
          break;
        case 'start':
          // Start work
          break;
        case 'view':
          // Navigate to detail view
          break;
      }
    },
    []
  );

  const handleScanQR = useCallback(() => {
    setShowQRScanner(true);
  }, []);

  const handleQRScanResult = useCallback(
    async (result: QRCodeResult) => {
      if (result.success && result.data) {
        console.log('QR Scan successful:', result.data);

        if (result.data.type === 'work_order') {
          // Navigate to work order or show details
          handleWorkOrderTap({ id: result.data.id } as WorkOrderListItem);
        } else if (result.data.type === 'equipment') {
          // Could navigate to equipment page or create work order for equipment
          console.log('Equipment QR scanned:', result.data.id);
        }
      } else {
        console.error('QR Scan failed:', result.error);
        // Could show error toast here
      }
    },
    [handleWorkOrderTap]
  );

  // Determine which data to show
  const workOrders = offlineStatus.isOnline
    ? data?.data || []
    : offlineWorkOrders;
  const isLoadingData = offlineStatus.isOnline ? isLoading : loadingOffline;

  if (isLoadingData && !data && offlineWorkOrders.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error && offlineStatus.isOnline) {
    return (
      <div className='min-h-screen bg-gray-50 p-4 flex items-center justify-center'>
        <div className='text-center'>
          <XCircleIcon className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h2 className='text-lg font-semibold text-gray-900 mb-2'>
            Failed to load work orders
          </h2>
          <p className='text-gray-600 mb-4'>{error.message}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-10'>
        <div className='px-4 py-3'>
          <div className='flex items-center justify-between mb-3'>
            <h1 className='text-lg font-semibold text-gray-900'>Work Orders</h1>
            <div className='flex items-center space-x-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={handleScanQR}
                className='p-2'
              >
                <QrCodeIcon className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                onClick={() => setShowCreateModal(true)}
                className='flex items-center gap-1'
              >
                <PlusIcon className='h-4 w-4' />
                Create
              </Button>
            </div>
          </div>

          {/* Offline Status Indicator */}
          <div className='mb-3'>
            <OfflineStatusIndicator />
          </div>

          {/* Search and Filters */}
          <div className='flex items-center space-x-2'>
            <div className='relative flex-1'>
              <SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search work orders...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='p-2'
            >
              <SlidersHorizontalIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='flex items-center gap-2'
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='p-4'>
        {/* Work Order List */}
        {workOrders.length === 0 ? (
          <div className='text-center py-12'>
            <WrenchIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No work orders found
            </h3>
            <p className='text-gray-600 mb-4'>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first work order to get started'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className='h-4 w-4 mr-2' />
              Create Work Order
            </Button>
          </div>
        ) : (
          <div className='space-y-3'>
            {workOrders.map(workOrder => (
              <EnhancedMobileWorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                onTap={handleWorkOrderTap}
                onSwipeAction={handleSwipeAction}
                isOffline={!offlineStatus.isOnline}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {offlineStatus.isOnline && data && data.data.length < data.total && (
          <div className='mt-6 text-center'>
            <Button
              variant='outline'
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWorkOrderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* QR Scanner */}
      {showQRScanner && (
        <QRCodeScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScanResult={handleQRScanResult}
        />
      )}
    </div>
  );
};
