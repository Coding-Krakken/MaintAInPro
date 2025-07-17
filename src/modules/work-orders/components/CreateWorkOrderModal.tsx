import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useCreateWorkOrder } from '../hooks/useWorkOrders';
import {
  WorkOrderPriority,
  WorkOrderType,
  CreateWorkOrderRequest,
} from '../types/workOrder';
import { PlusIcon, MinusIcon } from 'lucide-react';

const workOrderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().optional(),
  priority: z.nativeEnum(WorkOrderPriority),
  type: z.nativeEnum(WorkOrderType),
  equipment_id: z.string().optional(),
  assigned_to: z.string().optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  estimated_cost: z.number().min(0).optional(),
  checklist_items: z
    .array(
      z.object({
        task: z.string().min(1, 'Task is required'),
        description: z.string().optional(),
        is_required: z.boolean().default(false),
      })
    )
    .optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface CreateWorkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId?: string;
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({
  isOpen,
  onClose,
  equipmentId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const createWorkOrder = useCreateWorkOrder();

  const { register, handleSubmit, control, reset } = useForm<WorkOrderFormData>(
    {
      resolver: zodResolver(workOrderSchema),
      defaultValues: {
        priority: WorkOrderPriority.MEDIUM,
        type: WorkOrderType.CORRECTIVE,
        equipment_id: equipmentId,
        checklist_items: [],
      },
    }
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checklist_items',
  });

  const onSubmit = async (data: WorkOrderFormData) => {
    setIsLoading(true);
    try {
      const requestData: CreateWorkOrderRequest = {
        title: data.title,
        priority: data.priority,
        type: data.type,
      };

      // Add optional fields only if they have values
      if (data.description) requestData.description = data.description;
      if (data.equipment_id) requestData.equipment_id = data.equipment_id;
      if (data.assigned_to) requestData.assigned_to = data.assigned_to;
      if (data.scheduled_start)
        requestData.scheduled_start = data.scheduled_start;
      if (data.scheduled_end) requestData.scheduled_end = data.scheduled_end;
      if (data.estimated_hours)
        requestData.estimated_hours = data.estimated_hours;
      if (data.estimated_cost) requestData.estimated_cost = data.estimated_cost;

      if (data.checklist_items?.length) {
        requestData.checklist_items = data.checklist_items.map(
          (item, index) => {
            const checklistItem: {
              task: string;
              description?: string;
              is_required: boolean;
              order_index: number;
            } = {
              task: item.task,
              is_required: item.is_required,
              order_index: index,
            };

            if (item.description) {
              checklistItem.description = item.description;
            }

            return checklistItem;
          }
        );
      }

      await createWorkOrder.mutateAsync(requestData);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create work order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityOptions = [
    { value: WorkOrderPriority.LOW, label: 'Low' },
    { value: WorkOrderPriority.MEDIUM, label: 'Medium' },
    { value: WorkOrderPriority.HIGH, label: 'High' },
    { value: WorkOrderPriority.CRITICAL, label: 'Critical' },
    { value: WorkOrderPriority.EMERGENCY, label: 'Emergency' },
  ];

  const typeOptions = [
    { value: WorkOrderType.CORRECTIVE, label: 'Corrective' },
    { value: WorkOrderType.PREVENTIVE, label: 'Preventive' },
    { value: WorkOrderType.EMERGENCY, label: 'Emergency' },
    { value: WorkOrderType.INSPECTION, label: 'Inspection' },
    { value: WorkOrderType.SAFETY, label: 'Safety' },
    { value: WorkOrderType.IMPROVEMENT, label: 'Improvement' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg'>
      <div className='px-6 py-4'>
        <h2 className='text-xl font-semibold text-gray-900 mb-6'>
          Create Work Order
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Title *
              </label>
              <Input
                id='title'
                {...register('title')}
                placeholder='Enter work order title'
                // error={errors.title?.message}
              />
            </div>

            <div className='md:col-span-2'>
              <label
                htmlFor='description'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Description
              </label>
              <Textarea
                id='description'
                {...register('description')}
                placeholder='Enter detailed description'
                rows={3}
              />
            </div>

            <div>
              <label
                htmlFor='priority'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Priority *
              </label>
              <Select
                id='priority'
                {...register('priority')}
                options={priorityOptions}
                // error={errors.priority?.message}
              />
            </div>

            <div>
              <label
                htmlFor='type'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Type *
              </label>
              <Select
                id='type'
                {...register('type')}
                options={typeOptions}
                // error={errors.type?.message}
              />
            </div>
          </div>

          {/* Assignment and Scheduling */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='equipment_id'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Equipment
              </label>
              <Input
                id='equipment_id'
                {...register('equipment_id')}
                placeholder='Select equipment'
                // TODO: Replace with equipment selection dropdown
              />
            </div>

            <div>
              <label
                htmlFor='assigned_to'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Assigned To
              </label>
              <Input
                id='assigned_to'
                {...register('assigned_to')}
                placeholder='Select technician'
                // TODO: Replace with user selection dropdown
              />
            </div>

            <div>
              <label
                htmlFor='scheduled_start'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Scheduled Start
              </label>
              <Input
                id='scheduled_start'
                {...register('scheduled_start')}
                type='datetime-local'
              />
            </div>

            <div>
              <label
                htmlFor='scheduled_end'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Scheduled End
              </label>
              <Input
                id='scheduled_end'
                {...register('scheduled_end')}
                type='datetime-local'
              />
            </div>
          </div>

          {/* Estimates */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='estimated_hours'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Estimated Hours
              </label>
              <Input
                id='estimated_hours'
                {...register('estimated_hours', { valueAsNumber: true })}
                type='number'
                step='0.5'
                min='0'
                placeholder='0'
              />
            </div>

            <div>
              <label
                htmlFor='estimated_cost'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Estimated Cost
              </label>
              <Input
                id='estimated_cost'
                {...register('estimated_cost', { valueAsNumber: true })}
                type='number'
                step='0.01'
                min='0'
                placeholder='0.00'
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium text-gray-700'>
                Checklist Items
              </h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  append({ task: '', description: '', is_required: false })
                }
              >
                <PlusIcon className='h-4 w-4 mr-1' />
                Add Item
              </Button>
            </div>

            {fields.length > 0 && (
              <div className='space-y-3'>
                {fields.map((field, index) => (
                  <Card key={field.id} className='p-4'>
                    <div className='flex items-start space-x-3'>
                      <div className='flex-1 space-y-3'>
                        <div>
                          <Input
                            {...register(`checklist_items.${index}.task`)}
                            placeholder='Task description'
                            // error={errors.checklist_items?.[index]?.task?.message}
                          />
                        </div>
                        <div>
                          <Input
                            {...register(
                              `checklist_items.${index}.description`
                            )}
                            placeholder='Additional notes (optional)'
                          />
                        </div>
                        <div className='flex items-center'>
                          <input
                            id={`checklist_items.${index}.is_required`}
                            {...register(
                              `checklist_items.${index}.is_required`
                            )}
                            type='checkbox'
                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                          <label
                            htmlFor={`checklist_items.${index}.is_required`}
                            className='ml-2 text-sm text-gray-700'
                          >
                            Required
                          </label>
                        </div>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => remove(index)}
                        className='text-red-600 hover:text-red-700'
                      >
                        <MinusIcon className='h-4 w-4' />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Work Order'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
