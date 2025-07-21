import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkOrderChecklist } from '../hooks/useWorkOrders';
import { workOrderService } from '../services/workOrderService';

const WorkOrderChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    data: checklist,
    isLoading,
    error,
    refetch,
  } = useWorkOrderChecklist(id || '');
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [updateError, setUpdateError] = React.useState<string | null>(null);

  const handleToggle = async (itemId: string, isCompleted: boolean) => {
    setUpdating(itemId);
    setUpdateError(null);
    try {
      await workOrderService.updateChecklistItem(itemId, !isCompleted);
      refetch();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        setUpdateError(
          (e as { message?: string }).message || 'Error updating item'
        );
      } else {
        setUpdateError('Error updating item');
      }
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-4'>Work Order Checklist</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className='text-red-600'>Error loading checklist.</div>
      ) : checklist && checklist.length > 0 ? (
        <div className='space-y-4'>
          {checklist.map(item => (
            <div
              key={item.id}
              className='flex items-center gap-4 p-4 bg-white rounded shadow'
            >
              <input
                type='checkbox'
                checked={item.is_completed}
                disabled={updating === item.id}
                onChange={() => handleToggle(item.id, item.is_completed)}
                className='form-checkbox h-5 w-5'
              />
              <div className='flex-1'>
                <div className='font-semibold'>{item.task}</div>
                {item.description && (
                  <div className='text-gray-500 text-sm'>
                    {item.description}
                  </div>
                )}
                {item.is_required && (
                  <span className='text-xs text-blue-600'>Required</span>
                )}
              </div>
              {item.is_completed && item.completed_by && (
                <div className='text-xs text-green-700'>
                  Completed by {item.completed_by}
                </div>
              )}
            </div>
          ))}
          {updateError && <div className='text-red-600'>{updateError}</div>}
        </div>
      ) : (
        <div>No checklist items found for this work order.</div>
      )}
    </div>
  );
};

export default WorkOrderChecklistPage;
