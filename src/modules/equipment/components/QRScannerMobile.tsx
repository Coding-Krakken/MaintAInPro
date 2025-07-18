import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import {
  XIcon,
  CameraIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from 'lucide-react';

interface QRScannerMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (
    equipmentId: string,
    equipmentData: {
      id: string;
      name: string;
      location: string;
      status: string;
    }
  ) => void;
  onScanError: (error: string) => void;
}

export const QRScannerMobile: React.FC<QRScannerMobileProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
}) => {
  const [manualEquipmentId, setManualEquipmentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualSubmit = async () => {
    if (!manualEquipmentId.trim()) {
      onScanError('Please enter an equipment ID');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate equipment lookup - in real implementation this would call the QR service
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful equipment data
      onScanSuccess(manualEquipmentId, {
        id: manualEquipmentId,
        name: `Equipment ${manualEquipmentId}`,
        location: 'Shop Floor A',
        status: 'Active',
      });

      setManualEquipmentId('');
    } catch (error) {
      onScanError('Failed to find equipment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraScan = () => {
    // For now, show a message that camera scanning is coming soon
    onScanError(
      'Camera scanning functionality coming soon. Please use manual entry for now.'
    );
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <Card className='bg-white p-6 max-w-sm w-full'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Equipment Scanner
          </h2>
          <Button variant='ghost' size='sm' onClick={onClose} className='p-2'>
            <XIcon className='h-5 w-5' />
          </Button>
        </div>

        {/* Camera Scanner Placeholder */}
        <div className='mb-6'>
          <Button
            onClick={handleCameraScan}
            className='w-full h-32 flex flex-col items-center justify-center space-y-2 bg-gray-100 text-gray-600 hover:bg-gray-200'
            variant='outline'
          >
            <CameraIcon className='h-12 w-12' />
            <span>Scan QR Code</span>
            <span className='text-xs opacity-75'>Coming Soon</span>
          </Button>
        </div>

        {/* Manual Entry */}
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='w-full border-t border-gray-300 relative mb-4'>
              <span className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500'>
                OR
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor='equipment-id-input'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Equipment ID
            </label>
            <Input
              id='equipment-id-input'
              value={manualEquipmentId}
              onChange={e => setManualEquipmentId(e.target.value)}
              placeholder='Enter equipment ID manually'
              onKeyPress={e => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>

          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={onClose}
              className='flex-1'
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualSubmit}
              className='flex-1'
              disabled={isProcessing || !manualEquipmentId.trim()}
            >
              {isProcessing ? 'Looking up...' : 'Find Equipment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Success/Error feedback components for future integration
export const ScanSuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  equipmentName: string;
  location: string;
}> = ({ isOpen, onClose, equipmentName, location }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <Card className='bg-white p-6 max-w-sm w-full text-center'>
        <div className='mb-4'>
          <CheckCircleIcon className='h-16 w-16 text-green-500 mx-auto' />
        </div>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>
          Equipment Found!
        </h2>
        <p className='text-gray-600 mb-1'>Equipment:</p>
        <p className='font-medium text-gray-900 mb-1'>{equipmentName}</p>
        <p className='text-sm text-gray-500 mb-6'>{location}</p>
        <Button onClick={onClose} className='w-full'>
          Continue
        </Button>
      </Card>
    </div>
  );
};

export const ScanErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  error: string;
  onRetry: () => void;
}> = ({ isOpen, onClose, error, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
      <Card className='bg-white p-6 max-w-sm w-full text-center'>
        <div className='mb-4'>
          <AlertCircleIcon className='h-16 w-16 text-red-500 mx-auto' />
        </div>
        <h2 className='text-xl font-semibold text-gray-900 mb-2'>Error</h2>
        <p className='text-gray-600 mb-6'>{error}</p>
        <div className='space-y-3'>
          <Button onClick={onRetry} className='w-full'>
            Try Again
          </Button>
          <Button variant='outline' onClick={onClose} className='w-full'>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QRScannerMobile;
