import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Checkbox } from '../../../components/ui/Checkbox';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useCreateVendor } from '../hooks/useVendors';
import { VendorType } from '../types/vendor';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVendorModal: React.FC<CreateVendorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const createVendor = useCreateVendor();

  const [formData, setFormData] = useState({
    name: '',
    type: VendorType.SUPPLIER,
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    paymentTerms: '',
    rating: '',
    notes: '',
    isActive: true,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData['name'].trim()) {
      newErrors['name'] = 'Vendor name is required';
    }

    if (!formData['type']) {
      newErrors['type'] = 'Vendor type is required';
    }

    if (
      formData['email'] &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData['email'])
    ) {
      newErrors['email'] = 'Valid email address is required';
    }

    if (
      formData['rating'] &&
      (isNaN(Number(formData['rating'])) ||
        Number(formData['rating']) < 1 ||
        Number(formData['rating']) > 5)
    ) {
      newErrors['rating'] = 'Rating must be between 1 and 5';
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
      const vendorData = {
        organization_id: user?.organizationId || '',
        name: formData.name,
        type: formData.type,
        contact_person: formData.contactPerson || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        tax_id: formData.taxId || null,
        payment_terms: formData.paymentTerms || null,
        rating: formData.rating ? Number(formData.rating) : null,
        notes: formData.notes || null,
        is_active: formData.isActive,
        address: Object.values(formData.address).some(val => val.trim())
          ? formData.address
          : null,
      };

      await createVendor.mutateAsync(vendorData);
      toast.success('Vendor created successfully');
      onClose();
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create vendor'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: VendorType.SUPPLIER,
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      taxId: '',
      paymentTerms: '',
      rating: '',
      notes: '',
      isActive: true,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    });
    setErrors({});
  };

  const typeOptions = [
    { value: VendorType.SUPPLIER, label: 'Supplier' },
    { value: VendorType.CONTRACTOR, label: 'Contractor' },
    { value: VendorType.SERVICE_PROVIDER, label: 'Service Provider' },
    { value: VendorType.MANUFACTURER, label: 'Manufacturer' },
  ];

  const ratingOptions = [
    { value: '', label: 'No Rating' },
    { value: '1', label: '1 Star' },
    { value: '2', label: '2 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '5', label: '5 Stars' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add New Vendor' size='lg'>
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
              htmlFor='vendor-name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Vendor Name *
            </label>
            <Input
              id='vendor-name'
              value={formData['name']}
              onChange={e => handleInputChange('name', e.target.value)}
              className={errors['name'] ? 'border-red-500' : ''}
            />
            {errors['name'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['name']}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='vendor-type'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Vendor Type *
            </label>
            <select
              id='vendor-type'
              value={formData['type']}
              onChange={e => handleInputChange('type', e.target.value)}
              className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['type'] ? 'border-red-500' : 'border-gray-300'}`}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors['type'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['type']}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='contact-person'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Contact Person
            </label>
            <Input
              id='contact-person'
              value={formData['contactPerson']}
              onChange={e => handleInputChange('contactPerson', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='rating'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Rating
            </label>
            <select
              id='rating'
              value={formData['rating']}
              onChange={e => handleInputChange('rating', e.target.value)}
              className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors['rating'] ? 'border-red-500' : 'border-gray-300'}`}
            >
              {ratingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors['rating'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['rating']}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Contact Information
            </h3>
          </div>

          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Email
            </label>
            <Input
              id='email'
              type='email'
              value={formData['email']}
              onChange={e => handleInputChange('email', e.target.value)}
              className={errors['email'] ? 'border-red-500' : ''}
            />
            {errors['email'] && (
              <p className='mt-1 text-sm text-red-600'>{errors['email']}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='phone'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Phone
            </label>
            <Input
              id='phone'
              value={formData['phone']}
              onChange={e => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className='md:col-span-2'>
            <label
              htmlFor='website'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Website
            </label>
            <Input
              id='website'
              value={formData['website']}
              onChange={e => handleInputChange('website', e.target.value)}
              placeholder='https://'
            />
          </div>

          {/* Address */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Address
            </h3>
          </div>

          <div className='md:col-span-2'>
            <label
              htmlFor='street'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Street Address
            </label>
            <Input
              id='street'
              value={formData.address.street}
              onChange={e => handleAddressChange('street', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='city'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              City
            </label>
            <Input
              id='city'
              value={formData.address.city}
              onChange={e => handleAddressChange('city', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='state'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              State/Province
            </label>
            <Input
              id='state'
              value={formData.address.state}
              onChange={e => handleAddressChange('state', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='zipcode'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              ZIP/Postal Code
            </label>
            <Input
              id='zipcode'
              value={formData.address.zipCode}
              onChange={e => handleAddressChange('zipCode', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='country'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Country
            </label>
            <Input
              id='country'
              value={formData.address.country}
              onChange={e => handleAddressChange('country', e.target.value)}
            />
          </div>

          {/* Business Information */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Business Information
            </h3>
          </div>

          <div>
            <label
              htmlFor='tax-id'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Tax ID
            </label>
            <Input
              id='tax-id'
              value={formData['taxId']}
              onChange={e => handleInputChange('taxId', e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor='payment-terms'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Payment Terms
            </label>
            <Input
              id='payment-terms'
              value={formData['paymentTerms']}
              onChange={e => handleInputChange('paymentTerms', e.target.value)}
              placeholder='e.g., Net 30'
            />
          </div>

          <div className='md:col-span-2'>
            <Textarea
              label='Notes'
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder='Additional notes about this vendor...'
            />
          </div>

          {/* Settings */}
          <div className='md:col-span-2 mt-6'>
            <h3 className='text-lg font-semibold text-secondary-900 mb-4'>
              Settings
            </h3>
            <Checkbox
              id='isActive'
              checked={formData['isActive']}
              onChange={e => handleInputChange('isActive', e.target.checked)}
              label='Vendor is active'
            />
          </div>
        </div>

        <div className='flex justify-end gap-3 pt-6 border-t border-secondary-200'>
          <Button
            type='button'
            variant='secondary'
            onClick={onClose}
            disabled={createVendor.isPending}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={createVendor.isPending}>
            {createVendor.isPending ? (
              <>
                <LoadingSpinner size='sm' className='mr-2' />
                Creating...
              </>
            ) : (
              'Create Vendor'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
