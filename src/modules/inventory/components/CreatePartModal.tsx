import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Checkbox } from '../../../components/ui/Checkbox';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useCreatePart } from '../hooks/useInventory';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface CreatePartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePartModal: React.FC<CreatePartModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const createPart = useCreatePart();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    partNumber: '',
    manufacturer: '',
    unitCost: '',
    currency: 'USD',
    stockQuantity: '',
    minStockLevel: '',
    maxStockLevel: '',
    reorderPoint: '',
    unitOfMeasure: 'each',
    location: '',
    supplierPartNumber: '',
    leadTimeDays: '',
    isConsumable: false,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData['name'].trim()) {
      newErrors['name'] = 'Part name is required';
    }

    if (!formData['partNumber'].trim()) {
      newErrors['partNumber'] = 'Part number is required';
    }

    if (
      !formData['unitCost'] ||
      isNaN(Number(formData['unitCost'])) ||
      Number(formData['unitCost']) < 0
    ) {
      newErrors['unitCost'] = 'Valid unit cost is required';
    }

    if (
      !formData['stockQuantity'] ||
      isNaN(Number(formData['stockQuantity'])) ||
      Number(formData['stockQuantity']) < 0
    ) {
      newErrors['stockQuantity'] = 'Valid stock quantity is required';
    }

    if (
      !formData['minStockLevel'] ||
      isNaN(Number(formData['minStockLevel'])) ||
      Number(formData['minStockLevel']) < 0
    ) {
      newErrors['minStockLevel'] = 'Valid minimum stock level is required';
    }

    if (
      !formData['reorderPoint'] ||
      isNaN(Number(formData['reorderPoint'])) ||
      Number(formData['reorderPoint']) < 0
    ) {
      newErrors['reorderPoint'] = 'Valid reorder point is required';
    }

    if (
      formData['leadTimeDays'] &&
      (isNaN(Number(formData['leadTimeDays'])) ||
        Number(formData['leadTimeDays']) < 0)
    ) {
      newErrors['leadTimeDays'] = 'Lead time must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const partData = {
        organization_id: user?.organizationId || '',
        warehouse_id: user?.warehouseIds?.[0] || '',
        name: formData.name,
        description: formData.description || null,
        part_number: formData.partNumber,
        manufacturer: formData.manufacturer || null,
        unit_cost: Number(formData.unitCost),
        currency: formData.currency,
        stock_quantity: Number(formData.stockQuantity),
        reserved_quantity: 0,
        min_stock_level: Number(formData.minStockLevel),
        max_stock_level: formData.maxStockLevel
          ? Number(formData.maxStockLevel)
          : Number(formData.minStockLevel) * 2,
        reorder_point: Number(formData.reorderPoint),
        unit_of_measure: formData.unitOfMeasure,
        location: formData.location || null,
        supplier_part_number: formData.supplierPartNumber || null,
        lead_time_days: formData.leadTimeDays
          ? Number(formData.leadTimeDays)
          : null,
        is_consumable: formData.isConsumable,
        is_active: formData.isActive,
        images: [],
        specifications: null,
      };

      await createPart.mutateAsync(partData);
      toast.success('Part created successfully');
      onClose();
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create part'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      partNumber: '',
      manufacturer: '',
      unitCost: '',
      currency: 'USD',
      stockQuantity: '',
      minStockLevel: '',
      maxStockLevel: '',
      reorderPoint: '',
      unitOfMeasure: 'each',
      location: '',
      supplierPartNumber: '',
      leadTimeDays: '',
      isConsumable: false,
      isActive: true,
    });
    setErrors({});
  };

  const unitOfMeasureOptions = [
    { value: 'each', label: 'Each' },
    { value: 'piece', label: 'Piece' },
    { value: 'set', label: 'Set' },
    { value: 'box', label: 'Box' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'lb', label: 'Pound' },
    { value: 'liter', label: 'Liter' },
    { value: 'gallon', label: 'Gallon' },
    { value: 'meter', label: 'Meter' },
    { value: 'foot', label: 'Foot' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Part' size='lg'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Basic Information */}
          <div className='md:col-span-2'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Basic Information
            </h3>
          </div>

          <div>
            <label
              htmlFor='part-name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Part Name *
            </label>
            <Input
              id='part-name'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className={errors['name'] ? 'border-red-500' : ''}
            />
            {errors['name'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['name']}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='part-number'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Part Number *
            </label>
            <Input
              id='part-number'
              value={formData.partNumber}
              onChange={e => handleInputChange('partNumber', e.target.value)}
              className={errors['partNumber'] ? 'border-red-500' : ''}
            />
            {errors['partNumber'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['partNumber']}
              </p>
            )}
          </div>

          <div className='md:col-span-2'>
            <Textarea
              label='Description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Manufacturer and Location */}
          <div>
            <label
              htmlFor='manufacturer'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Manufacturer
            </label>
            <Input
              id='manufacturer'
              value={formData.manufacturer}
              onChange={e => handleInputChange('manufacturer', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='location'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Location
            </label>
            <Input
              id='location'
              value={formData.location}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder='e.g., Shelf A-1, Bay 3'
            />
          </div>

          {/* Stock Information */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Stock Information
            </h3>
          </div>

          <div>
            <label
              htmlFor='unit-cost'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Unit Cost *
            </label>
            <Input
              id='unit-cost'
              type='number'
              step='0.01'
              value={formData.unitCost}
              onChange={e => handleInputChange('unitCost', e.target.value)}
              className={errors['unitCost'] ? 'border-red-500' : ''}
            />
            {errors['unitCost'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['unitCost']}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='unit-measure'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Unit of Measure
            </label>
            <Input
              id='unit-measure'
              value={formData.unitOfMeasure}
              onChange={e => handleInputChange('unitOfMeasure', e.target.value)}
              list='unit-measures'
            />
            <datalist id='unit-measures'>
              {unitOfMeasureOptions.map(option => (
                <option key={option.value} value={option.value} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor='current-stock'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Current Stock *
            </label>
            <Input
              id='current-stock'
              type='number'
              value={formData.stockQuantity}
              onChange={e => handleInputChange('stockQuantity', e.target.value)}
              className={errors['stockQuantity'] ? 'border-red-500' : ''}
            />
            {errors['stockQuantity'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['stockQuantity']}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='min-stock'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Minimum Stock Level *
            </label>
            <Input
              id='min-stock'
              type='number'
              value={formData.minStockLevel}
              onChange={e => handleInputChange('minStockLevel', e.target.value)}
              className={errors['minStockLevel'] ? 'border-red-500' : ''}
            />
            {errors['minStockLevel'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['minStockLevel']}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='max-stock'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Maximum Stock Level
            </label>
            <Input
              id='max-stock'
              type='number'
              value={formData.maxStockLevel}
              onChange={e => handleInputChange('maxStockLevel', e.target.value)}
              placeholder='Optional'
            />
          </div>

          <div>
            <label
              htmlFor='reorder-point'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Reorder Point *
            </label>
            <Input
              id='reorder-point'
              type='number'
              value={formData.reorderPoint}
              onChange={e => handleInputChange('reorderPoint', e.target.value)}
              className={errors['reorderPoint'] ? 'border-red-500' : ''}
            />
            {errors['reorderPoint'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['reorderPoint']}
              </p>
            )}
          </div>

          {/* Supplier Information */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Supplier Information
            </h3>
          </div>

          <div>
            <label
              htmlFor='supplier-part'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Supplier Part Number
            </label>
            <Input
              id='supplier-part'
              value={formData.supplierPartNumber}
              onChange={e =>
                handleInputChange('supplierPartNumber', e.target.value)
              }
              placeholder='Optional'
            />
          </div>

          <div>
            <label
              htmlFor='lead-time'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Lead Time (Days)
            </label>
            <Input
              id='lead-time'
              type='number'
              value={formData.leadTimeDays}
              onChange={e => handleInputChange('leadTimeDays', e.target.value)}
              className={errors['leadTimeDays'] ? 'border-red-500' : ''}
              placeholder='Optional'
            />
            {errors['leadTimeDays'] && (
              <p className='mt-1 text-sm text-red-600'>
                {errors['leadTimeDays']}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Settings
            </h3>
            <div className='space-y-4'>
              <Checkbox
                id='isConsumable'
                checked={formData.isConsumable}
                onChange={e =>
                  handleInputChange('isConsumable', e.target.checked)
                }
                label='This is a consumable part'
              />
              <Checkbox
                id='isActive'
                checked={formData.isActive}
                onChange={e => handleInputChange('isActive', e.target.checked)}
                label='Part is active'
              />
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 pt-6 border-t border-secondary-200'>
          <Button
            type='button'
            variant='secondary'
            onClick={onClose}
            disabled={createPart.isPending}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={createPart.isPending}>
            {createPart.isPending ? (
              <>
                <LoadingSpinner size='sm' className='mr-2' />
                Creating...
              </>
            ) : (
              'Create Part'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
