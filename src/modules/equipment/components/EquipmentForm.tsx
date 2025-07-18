import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { useCreateEquipment, useUpdateEquipment } from '../hooks/useEquipment';
import {
  EquipmentStatus,
  EquipmentCondition,
  Equipment,
} from '../types/equipment';
import { WrenchScrewdriverIcon, XMarkIcon } from '@heroicons/react/24/outline';

const equipmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Equipment name is required')
    .max(255, 'Name is too long'),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  status: z.nativeEnum(EquipmentStatus),
  condition: z.nativeEnum(EquipmentCondition),
  purchaseCost: z.number().min(0).optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  equipment?: Equipment;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  onSuccess,
  onCancel,
  mode = 'create',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment
      ? {
          name: equipment.name,
          description: equipment.description || '',
          manufacturer: equipment.manufacturer || '',
          model: equipment.model || '',
          serialNumber: equipment.serialNumber || '',
          purchaseDate: equipment.purchaseDate || '',
          warrantyExpiry: equipment.warrantyExpiry || '',
          location: equipment.location || '',
          status: equipment.status,
          condition: equipment.condition,
          purchaseCost: equipment.purchaseCost || 0,
        }
      : {
          status: EquipmentStatus.OPERATIONAL,
          condition: EquipmentCondition.GOOD,
        },
  });

  const onSubmit = async (data: EquipmentFormData) => {
    setIsLoading(true);
    try {
      // Convert form data to match database schema
      const equipmentData = {
        name: data.name,
        description: data.description || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serial_number: data.serialNumber || null,
        purchase_date: data.purchaseDate || null,
        warranty_expiry: data.warrantyExpiry || null,
        location: data.location,
        status: data.status,
        condition: data.condition,
        purchase_cost: data.purchaseCost || null,
        organization_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from auth context
        warehouse_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from context
      };

      if (mode === 'create') {
        await createEquipment.mutateAsync(equipmentData);
      } else if (equipment?.id) {
        await updateEquipment.mutateAsync({
          id: equipment.id,
          updates: {
            name: data.name,
            description: data.description || null,
            manufacturer: data.manufacturer || null,
            model: data.model || null,
            serial_number: data.serialNumber || null,
            purchase_date: data.purchaseDate || null,
            warranty_expiry: data.warrantyExpiry || null,
            location: data.location,
            status: data.status,
            condition: data.condition,
            purchase_cost: data.purchaseCost || null,
          },
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Failed to save equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: EquipmentStatus.OPERATIONAL, label: 'Operational' },
    { value: EquipmentStatus.MAINTENANCE, label: 'Under Maintenance' },
    { value: EquipmentStatus.OUT_OF_SERVICE, label: 'Out of Service' },
    { value: EquipmentStatus.RETIRED, label: 'Retired' },
  ];

  const conditionOptions = [
    { value: EquipmentCondition.EXCELLENT, label: 'Excellent' },
    { value: EquipmentCondition.GOOD, label: 'Good' },
    { value: EquipmentCondition.FAIR, label: 'Fair' },
    { value: EquipmentCondition.POOR, label: 'Poor' },
    { value: EquipmentCondition.CRITICAL, label: 'Critical' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <WrenchScrewdriverIcon className='h-8 w-8 text-blue-600' />
          <h1 className='text-2xl font-bold text-gray-900'>
            {mode === 'create' ? 'Add New Equipment' : 'Edit Equipment'}
          </h1>
        </div>
        {onCancel && (
          <Button variant='outline' onClick={onCancel}>
            <XMarkIcon className='h-4 w-4 mr-2' />
            Cancel
          </Button>
        )}
      </div>

      {/* Basic Information */}
      <Card className='p-6'>
        <h2 className='text-lg font-medium text-gray-900 mb-4'>
          Basic Information
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='md:col-span-2'>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Equipment Name *
            </label>
            <Input
              id='name'
              {...register('name')}
              placeholder='Enter equipment name'
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
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
              placeholder='Enter equipment description'
              rows={3}
            />
          </div>

          <div>
            <label
              htmlFor='manufacturer'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Manufacturer
            </label>
            <Input
              id='manufacturer'
              {...register('manufacturer')}
              placeholder='Enter manufacturer'
            />
          </div>

          <div>
            <label
              htmlFor='model'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Model
            </label>
            <Input
              id='model'
              {...register('model')}
              placeholder='Enter model'
            />
          </div>

          <div>
            <label
              htmlFor='serialNumber'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Serial Number
            </label>
            <Input
              id='serialNumber'
              {...register('serialNumber')}
              placeholder='Enter serial number'
            />
          </div>

          <div>
            <label
              htmlFor='location'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Location *
            </label>
            <Input
              id='location'
              {...register('location')}
              placeholder='Enter location'
            />
            {errors.location && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.location.message}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Status and Condition */}
      <Card className='p-6'>
        <h2 className='text-lg font-medium text-gray-900 mb-4'>
          Status & Condition
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='status'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Status
            </label>
            <Select
              id='status'
              {...register('status')}
              options={statusOptions}
            />
          </div>

          <div>
            <label
              htmlFor='condition'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Condition
            </label>
            <Select
              id='condition'
              {...register('condition')}
              options={conditionOptions}
            />
          </div>
        </div>
      </Card>

      {/* Purchase Information */}
      <Card className='p-6'>
        <h2 className='text-lg font-medium text-gray-900 mb-4'>
          Purchase & Warranty Information
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='purchaseDate'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Purchase Date
            </label>
            <Input
              id='purchaseDate'
              type='date'
              {...register('purchaseDate')}
            />
          </div>

          <div>
            <label
              htmlFor='warrantyExpiry'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Warranty Expiry
            </label>
            <Input
              id='warrantyExpiry'
              type='date'
              {...register('warrantyExpiry')}
            />
          </div>

          <div>
            <label
              htmlFor='purchaseCost'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Purchase Cost
            </label>
            <Input
              id='purchaseCost'
              type='number'
              step='0.01'
              {...register('purchaseCost', { valueAsNumber: true })}
              placeholder='0.00'
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className='flex justify-end space-x-3 pt-6 border-t'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type='submit' disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Equipment'
              : 'Update Equipment'}
        </Button>
      </div>
    </form>
  );
};

export default EquipmentForm;
