// @ts-nocheck
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useCreatePart } from '../../hooks/useInventory';

interface PartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartFormModal({ isOpen, onClose }: PartFormModalProps) {
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [unitCost, setUnitCost] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [vendor, setVendor] = useState('');
  const [location, setLocation] = useState('');
  const { toast } = useToast();
  const createPart = useCreatePart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPart.mutateAsync({
        name,
        partNumber,
        description,
        category,
        unitCost: parseFloat(unitCost) || 0,
        stockLevel: parseInt(stockLevel) || 0,
        reorderPoint: parseInt(reorderPoint) || 0,
        vendor,
        location,
      });

      toast({
        title: 'Success',
        description: 'Part created successfully',
      });

      // Reset form
      setName('');
      setPartNumber('');
      setDescription('');
      setCategory('general');
      setUnitCost('');
      setStockLevel('');
      setReorderPoint('');
      setVendor('');
      setLocation('');

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create part',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Add New Part</DialogTitle>
          <DialogDescription>Create a new part entry for inventory management.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label htmlFor='name' className='block text-sm font-medium mb-1'>
              Name *
            </label>
            <Input
              id='name'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Enter part name'
              required
            />
          </div>

          <div>
            <label htmlFor='partNumber' className='block text-sm font-medium mb-1'>
              Part Number *
            </label>
            <Input
              id='partNumber'
              value={partNumber}
              onChange={e => setPartNumber(e.target.value)}
              placeholder='Enter part number'
              required
            />
          </div>

          <div>
            <label htmlFor='description' className='block text-sm font-medium mb-1'>
              Description
            </label>
            <Textarea
              id='description'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Enter part description'
              rows={3}
            />
          </div>

          <div>
            <label htmlFor='category' className='block text-sm font-medium mb-1'>
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='general'>General</SelectItem>
                <SelectItem value='electrical'>Electrical</SelectItem>
                <SelectItem value='mechanical'>Mechanical</SelectItem>
                <SelectItem value='hydraulic'>Hydraulic</SelectItem>
                <SelectItem value='pneumatic'>Pneumatic</SelectItem>
                <SelectItem value='consumable'>Consumable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor='unitCost' className='block text-sm font-medium mb-1'>
                Unit Cost ($)
              </label>
              <Input
                id='unitCost'
                type='number'
                step='0.01'
                min='0'
                value={unitCost}
                onChange={e => setUnitCost(e.target.value)}
                placeholder='0.00'
              />
            </div>

            <div>
              <label htmlFor='stockLevel' className='block text-sm font-medium mb-1'>
                Stock Level
              </label>
              <Input
                id='stockLevel'
                type='number'
                min='0'
                value={stockLevel}
                onChange={e => setStockLevel(e.target.value)}
                placeholder='0'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label htmlFor='reorderPoint' className='block text-sm font-medium mb-1'>
                Reorder Point
              </label>
              <Input
                id='reorderPoint'
                type='number'
                min='0'
                value={reorderPoint}
                onChange={e => setReorderPoint(e.target.value)}
                placeholder='0'
              />
            </div>

            <div>
              <label htmlFor='vendor' className='block text-sm font-medium mb-1'>
                Vendor
              </label>
              <Input
                id='vendor'
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder='Enter vendor name'
              />
            </div>
          </div>

          <div>
            <label htmlFor='location' className='block text-sm font-medium mb-1'>
              Location
            </label>
            <Input
              id='location'
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder='e.g., Warehouse A, Shelf 3'
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={createPart.isPending}>
              {createPart.isPending ? 'Creating...' : 'Create Part'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
