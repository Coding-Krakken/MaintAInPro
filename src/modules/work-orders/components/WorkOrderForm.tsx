// NOTE: This form is now legacy. Use CreateWorkOrderModal for new work orders.
import React, { useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
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
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  onSuccess?: (id: string) => void;
  initialValues?: Partial<WorkOrderFormData>;
}

export const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
  onSuccess,
  initialValues,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [workOrderNumber, setWorkOrderNumber] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createWorkOrder = useCreateWorkOrder();

  // Load equipment and technician options
  const { data: equipmentOptions = [] } = useEquipmentOptions();
  const { data: technicians = [] } = useTechnicians();

  const { register, handleSubmit, control, reset, setValue, watch } =
    useForm<WorkOrderFormData>({
      resolver: zodResolver(workOrderSchema),
      defaultValues: {
        priority: WorkOrderPriority.MEDIUM,
        type: WorkOrderType.CORRECTIVE,
        ...initialValues,
        checklist_items: initialValues?.checklist_items || [],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'checklist_items',
  });

  React.useEffect(() => {
    // Generate a unique work order number (simple example, replace with backend logic as needed)
    if (!workOrderNumber) {
      const now = Date.now();
      setWorkOrderNumber(`WO-${now}`);
    }
  }, [workOrderNumber]);

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
          (item, index) => ({
            task: item.task,
            is_required: item.is_required,
            order_index: index,
            ...(item.description ? { description: item.description } : {}),
          })
        );
      }
      // Handle file attachments (upload logic should be implemented in useCreateWorkOrder or here)
      let attachments: File[] = [];
      if (fileInputRef.current && fileInputRef.current.files) {
        attachments = Array.from(fileInputRef.current.files);
        if (attachments.length > 0) {
          requestData.attachments = attachments.map(f => f.name);
        }
      }
      const created = await createWorkOrder.mutateAsync(requestData);
      reset();
      setWorkOrderNumber(null);
      if (onSuccess && created?.id) onSuccess(created.id);
    } catch (error) {
      // TODO: error handling
    } finally {
      setIsLoading(false);
    }
  };

  // Convert technicians to options format
  const technicianOptions = technicians.map(tech => ({
    value: tech.id,
    label: `${tech.first_name} ${tech.last_name} (${tech.role || 'Technician'})`,
    data: tech,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Input {...register('title')} required placeholder='Title' />
        <Select
          {...register('priority')}
          options={Object.values(WorkOrderPriority).map(priority => ({
            value: priority,
            label: priority,
          }))}
        />
        <Select
          {...register('type')}
          options={Object.values(WorkOrderType).map(type => ({
            value: type,
            label: type,
          }))}
        />
        <div>
          <span className='block font-medium mb-1'>Assigned To</span>
          <SearchableSelect
            options={technicianOptions}
            value={watch('assigned_to') || ''}
            onChange={val => setValue('assigned_to', val)}
          />
        </div>
        <div>
          <span className='block font-medium mb-1'>Equipment</span>
          <SearchableSelect
            options={equipmentOptions}
            value={watch('equipment_id') || ''}
            onChange={val => setValue('equipment_id', val)}
          />
        </div>
        <Input
          {...register('scheduled_start')}
          type='datetime-local'
          placeholder='Scheduled Start'
        />
        <Input
          {...register('scheduled_end')}
          type='datetime-local'
          placeholder='Scheduled End'
        />
        <Input
          {...register('estimated_hours', { valueAsNumber: true })}
          type='number'
          step='0.01'
          placeholder='Estimated Hours'
        />
        <Input
          {...register('estimated_cost', { valueAsNumber: true })}
          type='number'
          step='0.01'
          placeholder='Estimated Cost'
        />
      </div>
      <Textarea {...register('description')} placeholder='Description' />
      <div>
        <span className='block font-medium mb-1'>Checklist Items</span>
        {fields.map((field, idx) => (
          <div key={field.id} className='flex gap-2 mb-2'>
            <Input
              placeholder='Task'
              {...register(`checklist_items.${idx}.task` as const)}
            />
            <Input
              placeholder='Description'
              {...register(`checklist_items.${idx}.description` as const)}
            />
            <label className='flex items-center gap-1'>
              <input
                type='checkbox'
                {...register(`checklist_items.${idx}.is_required` as const)}
              />{' '}
              Required
            </label>
            <Button type='button' onClick={() => remove(idx)} variant='outline'>
              Remove
            </Button>
          </div>
        ))}
        <Button
          type='button'
          onClick={() => append({ task: '', is_required: false })}
          variant='secondary'
        >
          Add Checklist Item
        </Button>
      </div>
      <div>
        <span className='block font-medium mb-1'>Attachments</span>
        <input type='file' ref={fileInputRef} multiple />
      </div>
      <Button type='submit' disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Work Order'}
      </Button>
    </form>
  );
};
