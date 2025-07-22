import React from 'react';
import { EquipmentForm } from './EquipmentForm';

interface CreateEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEquipmentModal({
  isOpen,
  onClose,
}: CreateEquipmentModalProps) {
  const [submitted, setSubmitted] = React.useState(false);
  const handleSuccess = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Optionally, trigger a refresh in parent via props or context
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg max-w-2xl w-full mx-4'>
        <h2 className='text-xl font-bold mb-4'>Create Equipment</h2>
        {submitted ? (
          <div className='text-green-600 font-semibold mb-4'>
            Equipment added successfully!
          </div>
        ) : (
          <EquipmentForm
            mode='create'
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
