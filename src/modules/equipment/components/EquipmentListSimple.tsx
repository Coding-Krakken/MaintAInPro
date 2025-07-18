import React from 'react';

export const EquipmentList: React.FC = () => {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Equipment Management</h1>
      <div className='bg-white rounded-lg shadow p-6'>
        <p>Equipment management system is loading...</p>
        <div className='mt-4'>
          <button className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'>
            Add Equipment
          </button>
        </div>
      </div>
    </div>
  );
};
