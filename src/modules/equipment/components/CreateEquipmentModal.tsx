interface CreateEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateEquipmentModal({
  isOpen,
  onClose,
}: CreateEquipmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
        <h2 className='text-xl font-bold mb-4'>Create Equipment</h2>
        <p className='mb-4'>
          Equipment creation form will be implemented here.
        </p>
        <button
          onClick={onClose}
          className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
        >
          Close
        </button>
      </div>
    </div>
  );
}
