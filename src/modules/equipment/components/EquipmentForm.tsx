import React, { useState } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useWarehouses } from '../hooks/useWarehouses';
import { useLocationsZonesByWarehouse } from '../hooks/useLocationsZonesByWarehouse';
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
  locationZoneId: z.string().min(1, 'Location/Zone is required'),
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
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const { user } = useAuth();
  const organizationId = user?.organizationId ?? '';
  // Debug: log user and organizationId
  console.log('User:', user);
  console.log('Organization ID:', organizationId);
  // Fetch warehouses for organization
  const { data: warehouses, isLoading: isWarehousesLoading } =
    useWarehouses(organizationId);
  // Debug: log warehouses
  console.log('Warehouses:', warehouses);
  // Fetch zones for selected warehouse
  const { data: locationsZones, isLoading: isZonesLoading } =
    useLocationsZonesByWarehouse(selectedWarehouseId);
  // Debug: log locationsZones
  console.log('Selected Warehouse ID:', selectedWarehouseId);
  console.log('Locations/Zones:', locationsZones);

  React.useEffect(() => {
    if (
      Array.isArray(warehouses) &&
      warehouses.length > 0 &&
      !selectedWarehouseId
    ) {
      const firstWarehouse = warehouses[0];
      if (firstWarehouse && firstWarehouse.id) {
        setSelectedWarehouseId(firstWarehouse.id);
      }
    }
  }, [warehouses, selectedWarehouseId]);

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
          locationZoneId: equipment.locationZoneId || '',
          status: equipment.status,
          condition: equipment.condition,
          purchaseCost: equipment.purchaseCost || 0,
        }
      : {
          name: '',
          description: '',
          manufacturer: '',
          model: '',
          serialNumber: '',
          purchaseDate: '',
          warrantyExpiry: '',
          locationZoneId: '',
          status: EquipmentStatus.OPERATIONAL,
          condition: EquipmentCondition.GOOD,
          purchaseCost: 0,
        },
  });

  const onSubmit = async (data: EquipmentFormData) => {
    // Debug: Print current Supabase user and session, and block insert if session is missing/invalid
    setIsLoading(true);
    try {
      let supabase, userData, userError, sessionData, sessionError;
      if (typeof window !== 'undefined') {
        ({ supabase } = await import('@/lib/supabase'));
        ({ data: userData, error: userError } = await supabase.auth.getUser());
        ({ data: sessionData, error: sessionError } =
          await supabase.auth.getSession());
        console.log('Supabase auth.getUser:', userData, userError);
        console.log('Supabase auth.getSession:', sessionData, sessionError);
        if (!sessionData?.session || !userData?.user) {
          window.alert('You are not authenticated. Please log in again.');
          setIsLoading(false);
          return;
        }
      }
      const equipmentData = {
        name: data.name,
        description: data.description || null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        serial_number: data.serialNumber || null,
        purchase_date: data.purchaseDate || null,
        warranty_expiry: data.warrantyExpiry || null,
        location_zone_id: data.locationZoneId,
        status: data.status,
        condition: data.condition,
        purchase_cost: data.purchaseCost || null,
        organization_id: organizationId,
        warehouse_id: selectedWarehouseId,
      };
      if (mode === 'create') {
        await createEquipment.mutateAsync(equipmentData);
      } else if (equipment?.id) {
        await updateEquipment.mutateAsync({
          id: equipment.id,
          updates: {
            ...equipmentData,
          },
        });
      }
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Failed to save equipment:', error);
      let message = 'Failed to save equipment.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string' &&
        ((error as { message: string }).message.includes(
          'row-level security'
        ) ||
          (error as { message: string }).message.includes('permission'))
      ) {
        message =
          'You do not have permission to add equipment. Please contact your administrator.';
      }
      // Show notification (replace with your notification system if needed)
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      }
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

          {/* Warehouse Dropdown */}
          <div>
            <label
              htmlFor='warehouseId'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Warehouse *
            </label>
            <Select
              id='warehouseId'
              value={selectedWarehouseId}
              onChange={e => setSelectedWarehouseId(e.target.value)}
              options={
                isWarehousesLoading
                  ? [{ value: '', label: 'Loading...' }]
                  : Array.isArray(warehouses)
                    ? warehouses.map((wh: { id: string; name: string }) => ({
                        value: wh.id,
                        label: wh.name,
                      }))
                    : []
              }
              placeholder='Select warehouse'
            />
          </div>

          <div>
            <label
              htmlFor='locationZoneId'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Location/Zone *
            </label>
            <Select
              id='locationZoneId'
              {...register('locationZoneId')}
              options={
                isZonesLoading
                  ? [{ value: '', label: 'Loading...' }]
                  : Array.isArray(locationsZones)
                    ? locationsZones.map(
                        (lz: { id: string; name: string }) => ({
                          value: lz.id,
                          label: lz.name,
                        })
                      )
                    : []
              }
              placeholder='Select location/zone'
            />
            {errors.locationZoneId && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.locationZoneId.message}
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
