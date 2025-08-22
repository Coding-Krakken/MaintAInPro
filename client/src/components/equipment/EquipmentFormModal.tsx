import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useCreateEquipment } from '../../hooks/useEquipment';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentFormModal({ isOpen, onClose }: EquipmentFormModalProps) {
  const [name, setName] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [description, setDescription] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('active');
  const [criticality, setCriticality] = useState('medium');
  const [area, setArea] = useState('');
  const { toast } = useToast();
  
  const createEquipmentMutation = useCreateEquipment();

  // Reset form when modal closes
  const handleClose = () => {
    setName('');
    setAssetTag('');
    setDescription('');
    setModel('');
    setStatus('active');
    setCriticality('medium');
    setArea('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Equipment name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!assetTag.trim()) {
      toast({
        title: 'Error', 
        description: 'Asset tag is required',
        variant: 'destructive',
      });
      return;
    }

    if (!model.trim()) {
      toast({
        title: 'Error',
        description: 'Model is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const requestBody = {
        name, // Note: backend maps this to 'description' field in database schema
        assetTag,
        description,
        model,
        status,
        criticality,
        area,
      };

      console.log('Submitting equipment creation request:', requestBody);

      const result = await createEquipmentMutation.mutateAsync(requestBody);
      console.log('Equipment created successfully:', result);

      toast({
        title: 'Success',
        description: 'Equipment created successfully',
      });

      handleClose();
    } catch (_error) {
      console.error('Equipment creation error:', _error);
      toast({
        title: 'Error',
        description: _error instanceof Error ? _error.message : 'Failed to create equipment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Equipment Name</label>
              <Input
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Enter equipment name'
                data-testid='equipment-name-input'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Asset Tag</label>
              <Input
                type='text'
                value={assetTag}
                onChange={e => setAssetTag(e.target.value)}
                placeholder='Enter asset tag'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='Enter equipment description'
              rows={3}
              required
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Model</label>
              <Input
                type='text'
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder='Enter equipment model'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Area</label>
              <Input
                type='text'
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder='Enter location area'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='maintenance'>Maintenance</SelectItem>
                  <SelectItem value='retired'>Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Criticality</label>
              <Select value={criticality} onValueChange={setCriticality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='critical'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button type='submit'>Create Equipment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
