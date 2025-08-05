import React, { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useCreateWorkOrder } from '../hooks/useWorkOrders';
import {
  useEquipmentOptions,
  useTechnicians,
} from '../../equipment/hooks/useEquipmentSelection';
import {
  WorkOrderPriority,
  WorkOrderType,
  CreateWorkOrderRequest,
} from '../types/workOrder';
import { EquipmentOptionData, UserOptionData } from '../types/selections';
import { usePartsOptions } from '../../inventory/hooks/usePartsOptions';
import {
  PlusIcon,
  MinusIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

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
  // estimated_cost: z.number().min(0).optional(),
  attachments: z.any().optional(),
  checklist_items: z
    .array(
      z.object({
        task: z.string().min(1, 'Task is required'),
        description: z.string().optional(),
        is_required: z.boolean().default(false),
      })
    )
    .optional(),
  parts: z
    .array(
      z.object({
        part_id: z.string(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
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
  const [workOrderNumber, setWorkOrderNumber] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createWorkOrder = useCreateWorkOrder();

  // Load equipment and technician options
  const { data: equipmentOptions = [], isLoading: loadingEquipment } =
    useEquipmentOptions();
  const { data: technicians = [], isLoading: loadingTechnicians } =
    useTechnicians();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      priority: WorkOrderPriority.MEDIUM,
      type: WorkOrderType.CORRECTIVE,
      equipment_id: equipmentId,
      checklist_items: [],
      parts: [],
    },
  });

  // Load parts options
  const { data: partsOptions = [], isLoading: loadingParts } =
    usePartsOptions();
  // Parts field array
  const {
    fields: partFields,
    append: appendPart,
    remove: removePart,
  } = useFieldArray({
    control,
    name: 'parts',
  });

  const selectedEquipmentId = watch('equipment_id');
  const selectedAssignedTo = watch('assigned_to');

  // Convert technicians to options format
  const technicianOptions = technicians.map(tech => ({
    value: tech.id,
    label: `${tech.first_name} ${tech.last_name} (${tech.role || 'Technician'})`,
    data: tech,
  }));

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checklist_items',
  });

  // Generate a unique work order number (simple example, replace with backend logic as needed)
  React.useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setWorkOrderNumber(`WO-${now}`);
    }
  }, [isOpen]);

  const onSubmit = async (data: WorkOrderFormData) => {
    setIsLoading(true);
    try {
      const requestData: CreateWorkOrderRequest = {
        title: data.title,
        priority: data.priority,
        type: data.type,
      };
      if (workOrderNumber) {
        (requestData as CreateWorkOrderRequest).work_order_number =
          workOrderNumber;
      }

      // Add optional fields only if they have values
      if (data.description) requestData.description = data.description;
      if (data.equipment_id) requestData.equipment_id = data.equipment_id;
      if (data.assigned_to) requestData.assigned_to = data.assigned_to;
      if (data.scheduled_start)
        requestData.scheduled_start = data.scheduled_start;
      if (data.scheduled_end) requestData.scheduled_end = data.scheduled_end;
      if (data.estimated_hours)
        requestData.estimated_hours = data.estimated_hours;
      // if (data.estimated_cost) requestData.estimated_cost = data.estimated_cost;

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

      // Handle file attachments (upload logic should be implemented in useCreateWorkOrder or here)
      let attachments: File[] = [];
      if (fileInputRef.current && fileInputRef.current.files) {
        attachments = Array.from(fileInputRef.current.files);
        // TODO: Implement actual upload logic and attach URLs/IDs to requestData
        // For now, just add file names as a placeholder
        if (attachments.length > 0) {
          requestData.attachments = attachments.map(f => f.name);
        }
      }

      // Add parts if present
      if (data.parts?.length) {
        requestData.parts = data.parts.map(item => ({
          part_id: item.part_id,
          quantity: item.quantity,
        }));
      }

      await createWorkOrder.mutateAsync(requestData);
      reset();
      setWorkOrderNumber(null);
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
          {/* Work Order Number (auto-generated) */}
          {workOrderNumber && (
            <div>
              <label
                htmlFor='work_order_number'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Work Order Number
              </label>
              <Input
                id='work_order_number'
                value={workOrderNumber}
                readOnly
                className='bg-gray-100'
              />
            </div>
          )}
          {/* File/Image Attachments */}
          <div>
            <label
              htmlFor='attachments'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Attachments (images, files)
            </label>
            <input
              id='attachments'
              type='file'
              multiple
              ref={fileInputRef}
              accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              className='block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            />
          </div>
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
              />
              {errors.title && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.title.message}
                </p>
              )}
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
              />
              {errors.priority && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.priority.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='type'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Type *
              </label>
              <Select id='type' {...register('type')} options={typeOptions} />
              {errors.type && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          {/* Assignment and Scheduling */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='equipment_id'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                <WrenchScrewdriverIcon className='h-4 w-4 inline mr-1' />
                Equipment
              </label>
              <SearchableSelect
                options={equipmentOptions}
                value={selectedEquipmentId || ''}
                onChange={value => setValue('equipment_id', value)}
                placeholder='Search and select equipment...'
                loading={loadingEquipment}
                clearable
                error={errors.equipment_id?.message}
                renderOption={option => {
                  const equipment = option.data as EquipmentOptionData;
                  return (
                    <div>
                      <div className='font-medium'>{equipment?.name}</div>
                      <div className='text-sm text-gray-500'>
                        {equipment?.asset_tag &&
                          `Tag: ${equipment.asset_tag} • `}
                        {equipment?.location &&
                          `Location: ${equipment.location}`}
                      </div>
                    </div>
                  );
                }}
              />
              {errors.equipment_id && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.equipment_id.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='assigned_to'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                <UserIcon className='h-4 w-4 inline mr-1' />
                Assigned To
              </label>
              <SearchableSelect
                options={technicianOptions}
                value={selectedAssignedTo || ''}
                onChange={value => setValue('assigned_to', value)}
                placeholder='Search and select technician...'
                loading={loadingTechnicians}
                clearable
                error={errors.assigned_to?.message}
                renderOption={option => {
                  const user = option.data as UserOptionData;
                  return (
                    <div>
                      <div className='font-medium'>
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {user?.role || 'Technician'} •{user?.email}
                      </div>
                    </div>
                  );
                }}
              />
              {errors.assigned_to && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.assigned_to.message}
                </p>
              )}
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

            {/* Estimated Cost field removed */}
          </div>

          {/* Parts Section */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium text-gray-700'>Parts</h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => appendPart({ part_id: '', quantity: 1 })}
              >
                <PlusIcon className='h-4 w-4 mr-1' />
                Add Part
              </Button>
            </div>
            {partFields.length > 0 && (
              <div className='space-y-3'>
                {partFields.map((field, index) => (
                  <Card key={field.id} className='p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='flex-1'>
                        <SearchableSelect
                          options={partsOptions}
                          value={watch(`parts.${index}.part_id`) || ''}
                          onChange={val =>
                            setValue(`parts.${index}.part_id`, val)
                          }
                          placeholder='Select part...'
                          loading={loadingParts}
                        />
                      </div>
                      <div>
                        <Input
                          type='number'
                          min={1}
                          step={1}
                          {...register(`parts.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          placeholder='Qty'
                          className='w-20'
                        />
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removePart(index)}
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
                            // error={errors["checklist"]_items?.[index]?.task?.message}
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
