import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderChecklistItem,
} from '../types/workOrder';
import {
  QrCodeIcon,
  PhoneIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchIcon,
  AlertTriangleIcon,
  PlayIcon,
  PauseIcon,
  MessageSquareIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from 'lucide-react';

// Extended WorkOrder interface with related data for mobile view
interface MobileWorkOrder extends WorkOrder {
  equipment?: {
    id: string;
    name: string;
    location: string;
    qr_code?: string;
  };
  assigned_technician?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  checklist_items?: Array<WorkOrderChecklistItem & { completed: boolean }>;
}

interface WorkOrderMobileProps {
  workOrder?: MobileWorkOrder;
  onStatusUpdate?: (workOrderId: string, status: WorkOrderStatus) => void;
  onScanQR?: () => void;
  onTakePhoto?: () => void;
  onCall?: (phoneNumber: string) => void;
}

export const WorkOrderMobile: React.FC<WorkOrderMobileProps> = ({
  workOrder,
  onStatusUpdate,
  onScanQR,
  onTakePhoto,
  onCall,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityConfig = (priority: WorkOrderPriority) => {
    switch (priority) {
      case WorkOrderPriority.EMERGENCY:
        return {
          color: 'bg-red-500',
          icon: AlertTriangleIcon,
          text: 'Emergency',
        };
      case WorkOrderPriority.CRITICAL:
        return {
          color: 'bg-orange-500',
          icon: AlertTriangleIcon,
          text: 'Critical',
        };
      case WorkOrderPriority.HIGH:
        return { color: 'bg-yellow-500', icon: WrenchIcon, text: 'High' };
      case WorkOrderPriority.MEDIUM:
        return { color: 'bg-blue-500', icon: WrenchIcon, text: 'Medium' };
      case WorkOrderPriority.LOW:
        return { color: 'bg-green-500', icon: WrenchIcon, text: 'Low' };
      default:
        return { color: 'bg-gray-500', icon: WrenchIcon, text: 'Unknown' };
    }
  };

  const getStatusConfig = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.OPEN:
        return { color: 'bg-blue-100 text-blue-800', text: 'Open' };
      case WorkOrderStatus.ASSIGNED:
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Assigned' };
      case WorkOrderStatus.IN_PROGRESS:
        return { color: 'bg-orange-100 text-orange-800', text: 'In Progress' };
      case WorkOrderStatus.COMPLETED:
        return { color: 'bg-green-100 text-green-800', text: 'Completed' };
      case WorkOrderStatus.CANCELLED:
        return { color: 'bg-red-100 text-red-800', text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  const handleStatusUpdate = async (newStatus: WorkOrderStatus) => {
    if (!workOrder || !onStatusUpdate) return;

    setIsUpdating(true);
    try {
      await onStatusUpdate(workOrder.id, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getNextStatusActions = (currentStatus: WorkOrderStatus) => {
    switch (currentStatus) {
      case WorkOrderStatus.OPEN:
        return [
          {
            status: WorkOrderStatus.ASSIGNED,
            label: 'Start Working',
            icon: ClockIcon,
          },
        ];
      case WorkOrderStatus.ASSIGNED:
        return [
          {
            status: WorkOrderStatus.IN_PROGRESS,
            label: 'Begin Work',
            icon: WrenchIcon,
          },
        ];
      case WorkOrderStatus.IN_PROGRESS:
        return [
          {
            status: WorkOrderStatus.COMPLETED,
            label: 'Complete',
            icon: CheckCircleIcon,
          },
        ];
      default:
        return [];
    }
  };

  if (!workOrder) {
    return (
      <div className='min-h-screen bg-gray-50 p-4'>
        <Card className='p-6 text-center'>
          <QrCodeIcon className='h-16 w-16 mx-auto text-gray-400 mb-4' />
          <h2 className='text-lg font-medium text-gray-900 mb-2'>
            No Work Order Selected
          </h2>
          <p className='text-gray-600 mb-4'>
            Scan a QR code or select a work order to get started
          </p>
          <Button onClick={onScanQR} className='w-full' size='lg'>
            <QrCodeIcon className='h-5 w-5 mr-2' />
            Scan QR Code
          </Button>
        </Card>
      </div>
    );
  }

  const priorityConfig = getPriorityConfig(workOrder.priority);
  const statusConfig = getStatusConfig(workOrder.status);
  const nextActions = getNextStatusActions(workOrder.status);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className={`${priorityConfig.color} text-white p-4`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <Button
              variant='ghost'
              size='sm'
              className='text-white hover:bg-white/20 p-2'
              onClick={() => window.history.back()}
            >
              <ArrowLeftIcon className='h-5 w-5' />
            </Button>
            <PriorityIcon className='h-6 w-6' />
            <div>
              <h1 className='text-lg font-semibold'>
                #{workOrder.work_order_number}
              </h1>
              <p className='text-sm opacity-90'>
                {priorityConfig.text} Priority
              </p>
            </div>
          </div>
          <Badge className={statusConfig.color}>{statusConfig.text}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className='p-4 space-y-4'>
        {/* Work Order Details */}
        <Card className='p-4'>
          <h2 className='text-lg font-medium text-gray-900 mb-2'>
            {workOrder.title}
          </h2>
          {workOrder.description && (
            <p className='text-gray-600 mb-4'>{workOrder.description}</p>
          )}

          {/* Equipment Info */}
          {workOrder.equipment && (
            <div className='border-t pt-4'>
              <div className='flex items-center justify-between mb-2'>
                <h3 className='text-sm font-medium text-gray-900'>Equipment</h3>
                {workOrder.equipment.qr_code && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onScanQR}
                    className='text-blue-600 hover:text-blue-800'
                  >
                    <QrCodeIcon className='h-4 w-4 mr-1' />
                    QR
                  </Button>
                )}
              </div>
              <div className='bg-gray-50 rounded-lg p-3'>
                <div className='flex items-start space-x-3'>
                  <div className='flex-1'>
                    <p className='font-medium text-gray-900'>
                      {workOrder.equipment.name}
                    </p>
                    <div className='flex items-center mt-1 space-x-2'>
                      <MapPinIcon className='h-4 w-4 text-gray-400' />
                      <p className='text-sm text-gray-600'>
                        {workOrder.equipment.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          {(workOrder.scheduled_start || workOrder.scheduled_end) && (
            <div className='border-t pt-4 mt-4'>
              <h3 className='text-sm font-medium text-gray-900 mb-2'>
                Schedule
              </h3>
              <div className='bg-blue-50 rounded-lg p-3'>
                <div className='flex items-center space-x-2'>
                  <CalendarIcon className='h-4 w-4 text-blue-600' />
                  <div className='text-sm'>
                    {workOrder.scheduled_start && (
                      <p className='text-gray-900'>
                        Start:{' '}
                        {new Date(
                          workOrder.scheduled_start
                        ).toLocaleDateString()}{' '}
                        {new Date(workOrder.scheduled_start).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </p>
                    )}
                    {workOrder.scheduled_end && (
                      <p className='text-gray-600'>
                        End:{' '}
                        {new Date(workOrder.scheduled_end).toLocaleDateString()}{' '}
                        {new Date(workOrder.scheduled_end).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className='p-4'>
          <h3 className='text-sm font-medium text-gray-900 mb-3'>
            Quick Actions
          </h3>
          <div className='grid grid-cols-3 gap-3'>
            <Button
              variant='outline'
              onClick={onScanQR}
              className='h-16 flex-col space-y-1 touch-target-large'
            >
              <QrCodeIcon className='h-6 w-6' />
              <span className='text-xs'>Scan QR</span>
            </Button>
            <Button
              variant='outline'
              onClick={onTakePhoto}
              className='h-16 flex-col space-y-1 touch-target-large'
            >
              <CameraIcon className='h-6 w-6' />
              <span className='text-xs'>Photo</span>
            </Button>
            <Button
              variant='outline'
              className='h-16 flex-col space-y-1 touch-target-large'
            >
              <MapPinIcon className='h-6 w-6' />
              <span className='text-xs'>Location</span>
            </Button>
          </div>

          {/* Time Tracking */}
          <div className='mt-4 pt-4 border-t'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium'>Time Tracking</span>
              <div className='flex items-center space-x-2'>
                <ClockIcon className='h-4 w-4 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {workOrder.actual_hours
                    ? `${workOrder.actual_hours}h logged`
                    : '0h logged'}
                </span>
              </div>
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 h-10 flex items-center justify-center space-x-2'
              >
                <PlayIcon className='h-4 w-4' />
                <span>Start</span>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 h-10 flex items-center justify-center space-x-2'
              >
                <PauseIcon className='h-4 w-4' />
                <span>Pause</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Status Actions */}
        {nextActions.length > 0 && (
          <Card className='p-4'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>
              Update Status
            </h3>
            <div className='space-y-2'>
              {nextActions.map(action => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={isUpdating}
                    className='w-full h-12 flex items-center justify-center space-x-2'
                    size='lg'
                  >
                    <ActionIcon className='h-5 w-5' />
                    <span>{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Contact Info */}
        {workOrder.assigned_technician && (
          <Card className='p-4'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>
              Assigned Technician
            </h3>
            <div className='bg-gray-50 rounded-lg p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='bg-blue-100 rounded-full p-2'>
                    <UserIcon className='h-5 w-5 text-blue-600' />
                  </div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {workOrder.assigned_technician.full_name}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {workOrder.assigned_technician.email}
                    </p>
                  </div>
                </div>
                {workOrder.assigned_technician.phone && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='h-10 w-10 p-0'
                    onClick={() =>
                      onCall?.(workOrder.assigned_technician!.phone!)
                    }
                  >
                    <PhoneIcon className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Communication */}
            <div className='mt-3'>
              <Button
                variant='outline'
                className='w-full h-10 flex items-center justify-center space-x-2'
              >
                <MessageSquareIcon className='h-4 w-4' />
                <span>Send Message</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Checklist Items */}
        {workOrder.checklist_items && workOrder.checklist_items.length > 0 && (
          <Card className='p-4'>
            <h3 className='text-sm font-medium text-gray-900 mb-3'>
              Checklist
            </h3>
            <div className='space-y-2'>
              {workOrder.checklist_items.map(item => (
                <div key={item.id} className='flex items-start space-x-3'>
                  <div
                    className={`mt-1 h-4 w-4 rounded border-2 flex-shrink-0 ${
                      item.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {item.completed && (
                      <CheckCircleIcon className='h-3 w-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p
                      className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}
                    >
                      {item.task}
                    </p>
                    {item.description && (
                      <p className='text-xs text-gray-500 mt-1'>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkOrderMobile;
